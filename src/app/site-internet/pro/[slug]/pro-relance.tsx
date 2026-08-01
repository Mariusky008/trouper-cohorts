"use client";

// Espace Pro — bouton « Relancer un créneau » (commerce uniquement).
// Une place se libère : le pro prévient ses clients fidèles via WhatsApp. La
// diffusion est NATIVE (le pro choisit ses destinataires / sa liste de diffusion
// dans WhatsApp) — jamais un envoi de masse serveur depuis un numéro perso, qui
// ferait bannir. Un plafond quotidien (serveur) protège contre la sur-sollicitation.
// Si le pro a constitué une audience opt-in (« Mes clients »), on la propose ici
// en tap-par-client : chaque envoi ouvre SON WhatsApp pré-rempli (toujours natif).
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toWaDigits } from "@/lib/site-internet/phone";
import {
  intentionsPour,
  joursProches,
  manquants,
  recommandees,
  type Champ,
  type Intention,
} from "@/lib/site-internet/actions-flash";
import type { Confirmation, Secteur } from "@/lib/site-internet/metier-profiles";
import { AnnonceVisuel } from "./annonce-visuel";

type Contact = { id: string; prenom: string | null; phone_e164: string; unsub_token: string };
type Offer = { text: string; until: string | null; photo?: string | null; clicks: number; created_at: string };

const DEFAULT_MESSAGE =
  "Bonjour, une place se libère prochainement. Si vous souhaitez en profiter, répondez-moi simplement ici — je vous la réserve.";

// Faits d'environnement : lus après hydratation pour que le rendu serveur et le
// premier rendu client concordent (l'ordre des propositions dépend de l'heure).
const jamais = () => () => {};

// Les trois angles rédigés par l'assistante, dans l'ordre où elle les renvoie
// (cf. api/site-internet/pro/announce).
const TONS = ["Direct", "Chaleureux", "Court"];

/** « aujourd'hui 18 h » / « demain 9 h 30 » / « mardi 5 août » — jamais une heure sèche. */
function echeanceLisible(d: Date): string {
  const nuit = new Date(d);
  nuit.setHours(0, 0, 0, 0);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  const ecart = Math.round((nuit.getTime() - auj.getTime()) / 86400000);
  const hh = `${d.getHours()} h${d.getMinutes() ? ` ${String(d.getMinutes()).padStart(2, "0")}` : ""}`;
  if (ecart === 0) return `aujourd'hui ${hh}`;
  if (ecart === 1) return `demain ${hh}`;
  return `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} ${hh}`;
}

export function ProRelance({
  slug,
  token,
  nom,
  metier,
  ville,
  confirmation,
  secteur,
}: {
  slug: string;
  token: string;
  nom: string;
  metier: string;
  ville: string;
  confirmation: Confirmation;
  secteur: Secteur;
}) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cap, setCap] = useState(3);
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  // Générateur d'annonce IA : le pro décrit son offre, Claude rédige le message.
  const [brief, setBrief] = useState("");
  const [gening, setGening] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [aiErr, setAiErr] = useState("");
  // Les trois angles proposés par l'assistante — on les MONTRE (ils sont déjà
  // rédigés et facturés) plutôt que de faire régénérer à l'aveugle.
  const [variantes, setVariantes] = useState<string[]>([]);
  const [variante, setVariante] = useState(0);
  // Action Flash choisie + réponses aux questions. `libre` = le pro préfère dicter.
  const [intention, setIntention] = useState<Intention | null>(null);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [voirTout, setVoirTout] = useState(false);
  const [libre, setLibre] = useState(false);
  const [trous, setTrous] = useState<string[]>([]);
  // Échéance déduite des réponses : l'offre « 16 h → 18 h » s'arrête à 18 h.
  const [echeance, setEcheance] = useState<Date | null>(null);
  // « Offre du moment » : bandeau affiché sur le site du pro + lien traçable.
  const [offer, setOffer] = useState<Offer | null>(null);
  const [offerText, setOfferText] = useState("");
  const [duree, setDuree] = useState("2j");
  // La photo qui illustrera l'annonce dans le catalogue. Pré-choisie, MONTRÉE,
  // remplaçable en un geste — jamais publiée en silence.
  const [photos, setPhotos] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [touchePhoto, setTouchePhoto] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerErr, setOfferErr] = useState("");
  const [linkAdded, setLinkAdded] = useState(false);
  // Parcours en 3 étapes : ① quoi annoncer → ② où l'afficher → ③ vérifier & lancer.
  const [step, setStep] = useState(1);
  const [chSite, setChSite] = useState(false); // bandeau sur le site (offert)
  const [chWa, setChWa] = useState(true); // WhatsApp (option) — coché par défaut
  const [chSocial, setChSocial] = useState(false); // Facebook / Instagram (texte à coller)

  const trackLink = typeof window !== "undefined" ? `${window.location.origin}/offre/${slug}` : `/offre/${slug}`;

  // Le moment de retrait, calculé sur l'horloge du commerçant (le serveur ne
  // connaît pas son fuseau) et validé côté serveur.
  const finChoisie = (): Date | null => {
    if (duree === "auto") return echeance;
    if (duree === "0") return null;
    const d = new Date();
    if (duree === "2h") {
      d.setHours(d.getHours() + 2);
      return d;
    }
    if (duree === "soir") {
      d.setHours(23, 59, 0, 0);
      return d;
    }
    // Parenthèses obligatoires : `getDate() + NaN || 1` vaudrait 1, et l'offre
    // se retirerait le 1er du mois.
    const n = Number(duree.replace("j", "")) || 1;
    d.setDate(d.getDate() + n);
    return d;
  };

  const saveOffer = async () => {
    const t = offerText.trim();
    if (!t || offerBusy) return;
    setOfferBusy(true);
    setOfferErr("");
    try {
      const fin = finChoisie();
      const r = await fetch("/api/site-internet/pro/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          token,
          action: "set",
          text: t.slice(0, 140),
          until: fin ? fin.toISOString() : null,
          photo,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.offer) {
        setOffer(j.offer);
      } else {
        setOfferErr(typeof j.error === "string" ? j.error : "Enregistrement impossible.");
      }
    } catch {
      setOfferErr("Enregistrement impossible. Réessayez.");
    } finally {
      setOfferBusy(false);
    }
  };

  const clearOffer = async () => {
    if (offerBusy) return;
    setOfferBusy(true);
    setOfferErr("");
    try {
      const r = await fetch("/api/site-internet/pro/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "clear" }),
      });
      if (r.ok) setOffer(null);
    } catch {
      setOfferErr("Retrait impossible. Réessayez.");
    } finally {
      setOfferBusy(false);
    }
  };

  const addTrackLink = () => {
    setMessage((m) => (m.includes(trackLink) ? m : `${m.trim()}\n\n👉 Réserver : ${trackLink}`));
    setLinkAdded(true);
    window.setTimeout(() => setLinkAdded(false), 2200);
  };

  // Les Actions Flash du métier. L'ordre dépend de l'heure : on ne le calcule
  // qu'une fois monté, sinon le rendu serveur et le rendu client divergeraient.
  const monte = useSyncExternalStore(jamais, () => true, () => false);
  const toutes = useMemo(() => intentionsPour(metier, confirmation, secteur), [metier, confirmation, secteur]);
  const podium = useMemo(
    () => (monte ? recommandees(toutes, new Date()) : toutes.slice(0, 3)),
    [monte, toutes],
  );
  const jours = useMemo(() => (monte ? joursProches(new Date()) : []), [monte]);

  const rediger = async (texte: string) => {
    if (!texte || gening) return;
    setGening(true);
    setAiErr("");
    try {
      const r = await fetch("/api/site-internet/pro/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, brief: texte.slice(0, 400) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && typeof j.text === "string" && j.text.trim()) {
        const v = Array.isArray(j.variantes) ? (j.variantes as unknown[]).map((x) => String(x).trim()).filter(Boolean) : [];
        setVariantes(v);
        setVariante(0);
        setMessage((v[0] || j.text).trim());
        setAiUsed(true);
      } else {
        setAiErr(typeof j.error === "string" ? j.error : "Impossible de rédiger le message. Réessayez.");
      }
    } catch {
      setAiErr("Impossible de rédiger le message. Réessayez.");
    } finally {
      setGening(false);
    }
  };

  const generate = () => rediger(brief.trim());

  /**
   * Le garde-fou : tant qu'une information qui engage le commerce manque, on ne
   * rédige rien. Mieux vaut une question de plus qu'une annonce à trous — ou,
   * pire, une annonce que le commerçant n'a pas vraiment validée.
   */
  const redigerDepuisAction = async () => {
    if (!intention) return;
    const vides = manquants(intention, reponses);
    if (vides.length) {
      setTrous(vides.map((c) => c.cle));
      return;
    }
    setTrous([]);
    setEcheance(intention.fin(reponses, new Date()));
    setDuree("auto");
    await rediger(intention.brief(reponses));
  };

  const choisirAction = (it: Intention) => {
    setIntention(it);
    setReponses({});
    setTrous([]);
    setAiUsed(false);
    setVariantes([]);
    setEcheance(null);
    setDuree("2j"); // sinon « auto » survivrait à une échéance devenue nulle
    setAiErr("");
    setMessage(""); // surtout pas le message par défaut : il parlerait d'autre chose
  };

  const retourChoix = () => {
    setIntention(null);
    setLibre(false);
    setTrous([]);
  };

  /**
   * Le champ correspondant à une question. Les types natifs (`time`, `number`)
   * plutôt qu'un texte libre : sur un téléphone, ils ouvrent le bon clavier et
   * suppriment l'ambiguïté d'une heure écrite « 18h », « 18 h » ou « 6 h du soir ».
   * Aucun `defaultValue` : un chiffre pré-rempli serait un chiffre suggéré.
   */
  const champ = (c: Champ) => {
    const v = reponses[c.cle] ?? "";
    const set = (x: string) => {
      setReponses((r) => ({ ...r, [c.cle]: x }));
      setTrous((t) => t.filter((k) => k !== c.cle));
    };
    const id = `af-${c.cle}`;
    if (c.type === "heure") return <input id={id} type="time" value={v} onChange={(e) => set(e.target.value)} />;
    if (c.type === "jour")
      return (
        <select id={id} value={v} onChange={(e) => set(e.target.value)}>
          <option value="">{c.requis ? "Choisir un jour…" : "— non précisé —"}</option>
          {jours.map((d) => (
            <option key={d.valeur} value={d.valeur}>{d.label}</option>
          ))}
        </select>
      );
    if (c.type === "nombre")
      return (
        <input id={id} type="number" min={1} inputMode="numeric" value={v}
          onChange={(e) => set(e.target.value)} placeholder={c.exemple} />
      );
    if (c.type === "pourcent")
      return (
        <span className="afpc">
          <input id={id} type="number" min={1} max={90} inputMode="numeric" value={v} onChange={(e) => set(e.target.value)} />
          <i>%</i>
        </span>
      );
    return (
      <input id={id} type="text" value={v} onChange={(e) => set(e.target.value)}
        placeholder={c.exemple ? `Ex. ${c.exemple}` : ""} maxLength={90} />
    );
  };

  // Quota restant du jour (lecture au montage — best-effort).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/site-internet/pro/relance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, check: true }),
        });
        const j = await r.json().catch(() => ({}));
        if (!cancelled && r.ok) {
          if (typeof j.remaining === "number") setRemaining(j.remaining);
          if (typeof j.cap === "number") setCap(j.cap);
        }
      } catch {
        /* pas de quota connu → on laisse l'action possible */
      }
      // Audience opt-in (« Mes clients ») pour la relance ciblée.
      try {
        const r = await fetch("/api/site-internet/pro/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, action: "list" }),
        });
        const j = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && Array.isArray(j.contacts)) setContacts(j.contacts as Contact[]);
      } catch {
        /* pas d'audience → seule la diffusion native reste proposée */
      }
      // Offre du moment déjà active (bandeau sur le site).
      try {
        const r = await fetch("/api/site-internet/pro/offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, action: "get" }),
        });
        const j = await r.json().catch(() => ({}));
        if (cancelled || !r.ok) return;
        if (j.offer) setOffer(j.offer as Offer);
        const g = Array.isArray(j.photos) ? (j.photos as unknown[]).map(String).filter(Boolean) : [];
        setPhotos(g);
        // Pré-choix : la photo déjà associée à l'annonce en cours, sinon la
        // première du commerce. Le pro n'a rien à faire s'il est d'accord.
        setPhoto((prev) => prev ?? (j.offer?.photo as string | undefined) ?? g[0] ?? null);
      } catch {
        /* colonne non migrée → pas d'offre */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  // Pré-remplissage depuis le bouton central « Mon assistante » : quand elle a
  // rédigé une annonce, elle ouvre cet outil avec le texte déjà en place.
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d && d.target === "annonce" && typeof d.text === "string" && d.text.trim()) {
        setMessage(d.text.trim());
      }
    };
    window.addEventListener("pro-prefill", onPrefill as EventListener);
    return () => window.removeEventListener("pro-prefill", onPrefill as EventListener);
  }, []);

  const msg = message.trim() || DEFAULT_MESSAGE;
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  // Version à coller dans une liste de diffusion (pas de lien de désinscription
  // par personne possible en diffusion → invitation à répondre STOP).
  const broadcastMessage = `${msg}\n\nRépondez STOP pour ne plus recevoir ces messages.`;

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(broadcastMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponible → l'aperçu reste sélectionnable à la main */
    }
  };

  const anyChannel = chSite || chWa || chSocial;
  // En arrivant sur l'étape 3, si « site » est coché et le bandeau vide, on part
  // du message (raccourci à 140 car un bandeau doit rester court).
  const goStep3 = () => {
    if (chSite && !offer && !offerText.trim()) setOfferText(msg.slice(0, 140));
    setStep(3);
  };

  const atCap = remaining !== null && remaining <= 0;

  const onSend = async () => {
    if (atCap || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, slot: msg.slice(0, 120) }),
        keepalive: true,
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 429 || j?.capped) {
        setRemaining(0);
        setBusy(false);
        return;
      }
      if (typeof j?.remaining === "number") setRemaining(j.remaining);
      window.location.href = waHref;
    } catch {
      // best-effort : on ouvre WhatsApp quand même (le journal a pu échouer).
      window.location.href = waHref;
    }
  };

  // Relance CIBLÉE d'un client opt-in : ouvre SON WhatsApp pré-rempli. 1:1 vers un
  // client consentant = motif sûr (non soumis au plafond des diffusions de masse).
  const notifyContact = (c: Contact) => {
    setSent((s) => ({ ...s, [c.id]: true }));
    try {
      fetch("/api/site-internet/pro/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "touch", id: c.id }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
    const stopUrl = `${window.location.origin}/site-internet/stop/${c.unsub_token}`;
    const full = `${msg}\n\nPour ne plus être prévenu·e : ${stopUrl}`;
    window.location.assign(`https://wa.me/${toWaDigits(c.phone_e164)}?text=${encodeURIComponent(full)}`);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .relance{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .relance .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .relance .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .relance .ai{margin-top:16px;border:1px solid #D9CFF0;background:linear-gradient(180deg,#F6F2FF,#fff);border-radius:14px;padding:14px;}
          .pro .relance .ai .aih{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#00926E;}
          .pro .relance .ai .ais{font-size:12px;color:var(--soft);line-height:1.45;margin-top:4px;}
          .pro .relance .ai textarea{width:100%;margin-top:10px;border:1px solid #D9CFF0;border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;resize:vertical;line-height:1.45;}
          /* Le bouton de rédaction sert DANS l'encart assistante et DANS le
             parcours Action Flash : son style ne peut pas vivre sous « .ai ». */
          .pro .relance .aibtn{margin-top:16px;width:100%;background:#00926E;color:#fff;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
          .pro .relance .ai .aibtn{margin-top:10px;padding:12px;font-size:13.5px;}
          .pro .relance .aibtn:disabled{opacity:.55;cursor:not-allowed;}
          .pro .relance .ai .aierr{margin-top:8px;font-size:12px;color:#B4453C;line-height:1.4;}
          .pro .relance .ai .aiok{margin-top:8px;font-size:11.5px;color:#00926E;line-height:1.4;}
          /* Trois angles proposés : on choisit, on ne regénère pas à l'aveugle. */
          .pro .relance .vars{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:14px;}
          .pro .relance .vars .vk{font-size:11.5px;font-weight:700;color:var(--soft);margin-right:2px;}
          .pro .relance .vars button{border:1px solid var(--hair);background:#fff;color:var(--soft);border-radius:999px;
            padding:11px 15px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .relance .vars button.on{background:var(--ink);border-color:var(--ink);color:#fff;}
          /* ── Actions Flash : le choix, puis les questions ── */
          .pro .relance .rlz-s{font-size:12.5px;color:var(--soft);line-height:1.5;margin-top:5px;}
          .pro .relance .afl{display:flex;flex-direction:column;gap:9px;margin-top:15px;}
          .pro .relance .af{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
            border:1px solid var(--hair);border-radius:15px;padding:14px;background:#fff;font-family:inherit;}
          .pro .relance .af:hover{border-color:var(--violet);}
          .pro .relance .af:active{transform:translateY(1px);}
          .pro .relance .af .afe{width:42px;height:42px;flex:none;border-radius:13px;display:flex;align-items:center;
            justify-content:center;font-size:21px;background:#E6F7F1;}
          .pro .relance .af .afb{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
          .pro .relance .af .aft{font-size:14.5px;font-weight:800;color:var(--ink);line-height:1.3;}
          .pro .relance .af .afs{font-size:11.5px;color:var(--soft);line-height:1.4;}
          .pro .relance .af .afg{flex:none;font-size:20px;font-weight:700;color:var(--faint);}
          .pro .relance .afmore{margin-top:11px;width:100%;background:#F1EFE7;border:1px solid var(--hair);color:var(--soft);
            border-radius:12px;padding:13px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .relance .aflibre{margin-top:9px;width:100%;background:none;border:1px dashed var(--hair);color:var(--soft);
            border-radius:12px;padding:13px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;}
          /* Retour en arrière : discret, mais assez haut pour un pouce. */
          .pro .relance .afback{margin-top:10px;background:none;border:none;padding:10px 2px;color:var(--soft);
            font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;}
          .pro .relance .afq{display:flex;flex-direction:column;gap:13px;margin-top:16px;}
          .pro .relance .afr{display:flex;flex-direction:column;gap:6px;}
          .pro .relance .afr label{font-size:12.5px;font-weight:700;color:var(--ink);}
          .pro .relance .afr label i{font-style:normal;font-weight:500;color:var(--faint);}
          .pro .relance .afr input,.pro .relance .afr select{width:100%;border:1px solid var(--hair);border-radius:11px;
            padding:12px 13px;font-size:14px;font-family:inherit;background:#fff;color:var(--ink);}
          .pro .relance .afr.trou input,.pro .relance .afr.trou select{border-color:#D98B82;background:#FDF6F5;}
          .pro .relance .afr .afpc{display:flex;align-items:center;gap:8px;}
          .pro .relance .afr .afpc input{flex:1;min-width:0;}
          .pro .relance .afr .afpc i{font-style:normal;font-size:15px;font-weight:800;color:var(--soft);}
          .pro .relance .aftrou{margin-top:12px;background:#FDF6F5;border:1px solid #EBC9C4;border-radius:11px;
            padding:10px 12px;font-size:12px;color:#8A3F36;line-height:1.45;}
          .pro .relance .afech{margin-top:11px;background:#E6F7F1;border:1px solid #BFE8D9;border-radius:11px;
            padding:10px 12px;font-size:12.5px;color:#0E6B52;line-height:1.45;}
          .pro .relance .afech b{color:#08432F;}
          /* ── La photo de l'annonce ── */
          .pro .relance .phot{margin-top:14px;border:1px solid var(--hair);border-radius:14px;background:#FBFAF7;padding:13px;}
          .pro .relance .phot .ph-h{display:flex;align-items:center;justify-content:space-between;gap:9px;
            font-size:12.5px;font-weight:800;color:var(--ink);}
          .pro .relance .phot .ph-h button{border:1px solid var(--hair);background:#fff;color:var(--violet);
            border-radius:9px;padding:7px 12px;font-size:11.5px;font-weight:800;font-family:inherit;cursor:pointer;}
          .pro .relance .phot .ph-g{display:block;width:100%;height:150px;object-fit:cover;border-radius:12px;
            margin-top:10px;background:linear-gradient(150deg,#2C3A5E,#141A2E);}
          .pro .relance .phot .ph-s{font-size:11.5px;color:var(--soft);line-height:1.45;margin-top:9px;}
          .pro .relance .phot .ph-l{display:flex;gap:8px;overflow-x:auto;margin-top:11px;padding-bottom:3px;}
          .pro .relance .phot .ph-l button{flex:none;width:64px;height:64px;padding:0;border-radius:11px;overflow:hidden;
            border:2px solid transparent;background:#EBE7DD;cursor:pointer;}
          .pro .relance .phot .ph-l button.on{border-color:var(--violet);}
          .pro .relance .phot .ph-l img{width:100%;height:100%;object-fit:cover;display:block;}
          .pro .relance .phot .ph-add{margin-top:11px;width:100%;background:#fff;border:1px dashed var(--hair);
            color:var(--soft);border-radius:11px;padding:11px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .relance .phot.vide{background:#FFF9EC;border-color:#EBD9AE;}
          .pro .relance .ai .spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:aispin .7s linear infinite;}
          @keyframes aispin{to{transform:rotate(360deg)}}
          @media (prefers-reduced-motion:reduce){.pro .relance .ai .spin{animation:none}}
          .pro .relance .tmpl{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px;}
          .pro .relance .tmpl button{border:1px solid var(--hair);background:#fff;border-radius:20px;padding:7px 12px;font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;font-family:inherit;}
          .pro .relance .tmpl button:hover{border-color:var(--gold);}
          .pro .relance .opt{margin-top:12px;}
          .pro .relance .opt label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:6px;}
          .pro .relance .opt textarea{width:100%;border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-size:14px;font-family:inherit;background:#fff;resize:vertical;line-height:1.5;}
          .pro .relance .rbub{margin-top:18px;background:#EAF4E4;border:1px solid #CFE6C2;border-radius:14px;border-top-left-radius:4px;padding:13px 15px;font-size:13px;line-height:1.5;color:#25381C;white-space:pre-line;}
          .pro .relance .rbtn{margin-top:18px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#25D366;color:#fff;font-weight:700;font-size:15.5px;border:none;border-radius:15px;padding:16px;cursor:pointer;}
          .pro .relance .rbtn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
          .pro .relance .rbtn svg{width:19px;height:19px;}
          .pro .relance .rcopy{margin-top:9px;width:100%;background:#F1EFEA;border:1px solid var(--hair);color:var(--ink);border-radius:13px;padding:12px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;}
          .pro .relance .rguide{margin-top:12px;border:1px solid var(--hair);border-radius:13px;background:#fff;overflow:hidden;}
          .pro .relance .rguide summary{list-style:none;cursor:pointer;padding:12px 14px;font-size:13px;font-weight:600;color:var(--ink);}
          .pro .relance .rguide summary::-webkit-details-marker{display:none;}
          .pro .relance .rguide[open] summary{border-bottom:1px solid var(--hair);}
          .pro .relance .rguide-body{padding:12px 15px 15px;}
          .pro .relance .rguide-body ol{margin:0 0 0 18px;padding:0;font-size:12.5px;color:var(--soft);line-height:1.55;}
          .pro .relance .rguide-body li{margin-bottom:6px;}
          .pro .relance .rguide-body li b{color:var(--ink);font-weight:600;}
          .pro .relance .rwarn{margin-top:12px;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:11px;padding:10px 12px;font-size:12px;color:#6B5418;line-height:1.45;}
          .pro .relance .rwarn b{color:#4A3A10;}
          .pro .relance .rtip{margin-top:10px;font-size:11.5px;color:var(--faint);line-height:1.45;}
          .pro .relance .rtip b{color:var(--soft);}
          .pro .relance .quota{text-align:center;font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.4;}
          .pro .relance .cap{margin-top:14px;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:12px;padding:11px 13px;font-size:12.5px;color:#6B5418;line-height:1.45;}
          .pro .relance .aud{margin-top:22px;border-top:1px dashed var(--hair);padding-top:18px;}
          .pro .relance .aud .h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);font-weight:600;margin-bottom:11px;}
          .pro .relance .aud .chips{display:flex;flex-wrap:wrap;gap:8px;}
          .pro .relance .aud .chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #CFE6C2;background:#EAF4E4;color:#1B7A3E;border-radius:11px;padding:8px 11px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .relance .aud .chip.done{background:#F1EFE7;border-color:var(--hair);color:var(--faint);}
          .pro .relance .aud .chip svg{width:13px;height:13px;}
          .pro .relance .aud .note{font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.4;}
          /* OFFRE DU MOMENT (bandeau site + lien traçable) */
          .pro .relance .offer{margin-top:22px;border-top:1px dashed var(--hair);padding-top:18px;}
          .pro .relance .offer .oh{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:var(--ink);}
          .pro .relance .offer .os{font-size:12px;color:var(--soft);line-height:1.45;margin-top:4px;}
          .pro .relance .offer input[type=text]{width:100%;margin-top:11px;border:1px solid var(--hair);border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;}
          .pro .relance .offer .row{display:flex;align-items:center;gap:9px;margin-top:10px;}
          .pro .relance .offer .row label{font-size:12px;color:var(--soft);font-weight:600;}
          .pro .relance .offer select{border:1px solid var(--hair);border-radius:10px;padding:8px 11px;font-size:12.5px;font-family:inherit;background:#fff;color:var(--ink);}
          .pro .relance .offer .obtn{margin-top:11px;width:100%;background:var(--grad,#00926E);color:#fff;border:none;border-radius:12px;padding:12px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .relance .offer .obtn:disabled{opacity:.55;cursor:not-allowed;}
          .pro .relance .offer .oerr{margin-top:8px;font-size:12px;color:#B4453C;line-height:1.4;}
          .pro .relance .offer .live{margin-top:11px;border:1px solid #CFE6C2;background:linear-gradient(180deg,#EDF7E7,#fff);border-radius:14px;padding:13px 15px;}
          .pro .relance .offer .live .lp{display:block;width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:10px;}
          .pro .relance .offer .live .lt{font-size:13.5px;font-weight:700;color:#1B5E2E;line-height:1.4;}
          .pro .relance .offer .live .lmeta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:var(--soft);}
          .pro .relance .offer .live .clicks{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid #CFE6C2;border-radius:999px;padding:4px 10px;font-weight:700;color:#1B7A3E;}
          .pro .relance .offer .live .lact{display:flex;gap:8px;margin-top:11px;}
          .pro .relance .offer .live .lact button{flex:1;border-radius:10px;padding:9px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;border:1px solid var(--hair);background:#fff;color:var(--ink);}
          .pro .relance .offer .live .lact button.rm{color:#B4453C;border-color:#EBC9C4;}
          .pro .relance .offer .addlink{margin-top:9px;width:100%;background:#F1EFE7;border:1px solid var(--hair);color:var(--ink);border-radius:11px;padding:10px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;}
          /* ── Parcours en 3 étapes ── */
          .pro .relance .rlz-steps{display:flex;align-items:center;gap:6px;margin-top:16px;}
          .pro .relance .rlz-steps .s{flex:1;display:flex;flex-direction:column;gap:5px;align-items:center;font-size:10px;font-weight:800;color:var(--faint);letter-spacing:.02em;text-align:center;}
          .pro .relance .rlz-steps .s .n{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#EBE7DD;color:var(--faint);font-size:12px;}
          .pro .relance .rlz-steps .s.on{color:var(--violet);}
          .pro .relance .rlz-steps .s.on .n{background:var(--grad,#00926E);color:#fff;}
          .pro .relance .rlz-steps .s.done .n{background:#12A65C;color:#fff;}
          .pro .relance .rlz-h{font-family:var(--fd),Georgia,serif;font-size:18px;font-weight:700;margin-top:18px;}
          .pro .relance .rlz-nav{display:flex;gap:9px;margin-top:18px;}
          .pro .relance .rlz-nav button{flex:1;border-radius:12px;padding:13px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;border:none;}
          .pro .relance .rlz-nav .back{flex:0 0 auto;background:#F1EFF7;color:var(--soft);border:1px solid var(--hair);padding:13px 18px;}
          .pro .relance .rlz-nav .next{background:var(--grad,#00926E);color:#fff;box-shadow:0 12px 26px -14px rgba(0,146,110,.7);}
          .pro .relance .rlz-nav .next:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
          .pro .relance .chan{display:flex;align-items:center;gap:12px;border:1px solid var(--hair);border-radius:14px;padding:14px;background:#fff;margin-top:10px;cursor:pointer;}
          .pro .relance .chan.on{border-color:var(--violet);background:linear-gradient(160deg,rgba(0,200,150,.06),#fff);}
          .pro .relance .chan .ce{width:40px;height:40px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:#E6F7F1;}
          .pro .relance .chan .cb{flex:1;min-width:0;display:flex;flex-direction:column;}
          .pro .relance .chan .ct{font-size:14px;font-weight:800;}
          .pro .relance .chan .cs{font-size:11.5px;color:var(--soft);margin-top:2px;}
          .pro .relance .chan .ck{width:24px;height:24px;flex:none;border-radius:7px;border:2px solid var(--hair);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;}
          .pro .relance .chan.on .ck{background:var(--violet);border-color:var(--violet);}
          .pro .relance .chan .tag{flex:none;font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:6px;}
          .pro .relance .chan .tag.free{background:#E4F7EE;color:#0E7C5A;}
          .pro .relance .chan .tag.opt{background:#EDE8FF;color:#6B4BC7;}
          .pro .relance .rlz-block{margin-top:16px;border:1px solid var(--hair);border-radius:14px;padding:15px;background:#fff;}
          .pro .relance .rlz-block .rbh{font-size:13.5px;font-weight:800;display:flex;align-items:center;gap:7px;}
          .pro .relance .rlz-block .rbh .tag{font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:6px;margin-left:auto;}
          .pro .relance .rlz-block .tag.free{background:#E4F7EE;color:#0E7C5A;}
          .pro .relance .rlz-block .tag.opt{background:#EDE8FF;color:#6B4BC7;}
          `,
        }}
      />
      <div className="relance">
        <div className="a-title">📣 Faire une annonce</div>

        <div className="rlz-steps">
          <div className={`s${step === 1 ? " on" : step > 1 ? " done" : ""}`}><span className="n">{step > 1 ? "✓" : "1"}</span>Quoi</div>
          <div className={`s${step === 2 ? " on" : step > 2 ? " done" : ""}`}><span className="n">{step > 2 ? "✓" : "2"}</span>Où</div>
          <div className={`s${step === 3 ? " on" : ""}`}><span className="n">3</span>Vérifier</div>
        </div>

        {step === 1 && (
          <>
            {/* ① Le choix. Trois propositions, pas dix : la valeur promise ici est
                de ne PAS avoir à chercher quoi publier. */}
            {!intention && !libre && (
              <>
                <div className="rlz-h">Que voulez-vous obtenir aujourd&apos;hui&nbsp;?</div>
                <div className="rlz-s">Choisissez, l&apos;assistante rédige. Vous relisez avant que ça parte.</div>
                <div className="afl">
                  {(voirTout ? toutes : podium).map((it) => (
                    <button key={it.cle} type="button" className="af" onClick={() => choisirAction(it)}>
                      <span className="afe">{it.emoji}</span>
                      <span className="afb">
                        <span className="aft">{it.titre}</span>
                        <span className="afs">{it.sous}</span>
                      </span>
                      <span className="afg" aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
                {!voirTout && toutes.length > podium.length && (
                  <button type="button" className="afmore" onClick={() => setVoirTout(true)}>
                    Une autre idée&nbsp;({toutes.length - podium.length}) →
                  </button>
                )}
                <button type="button" className="aflibre" onClick={() => setLibre(true)}>
                  🎙️ Ou dites votre annonce à l&apos;assistante
                </button>
              </>
            )}

            {/* ② Les questions. Chaque information qui engage le commerce est
                saisie ici — jamais devinée, jamais pré-remplie. */}
            {intention && (
              <>
                <button type="button" className="afback" onClick={retourChoix}>← Changer d&apos;action</button>
                <div className="rlz-h">{intention.emoji} {intention.titre}</div>
                <div className="rlz-s">{intention.sous}</div>
                <div className="afq">
                  {intention.champs.map((c) => (
                    <div className={`afr${trous.includes(c.cle) ? " trou" : ""}`} key={c.cle}>
                      <label htmlFor={`af-${c.cle}`}>
                        {c.label}
                        {!c.requis && <i> · facultatif</i>}
                      </label>
                      {champ(c)}
                    </div>
                  ))}
                </div>
                {trous.length > 0 && (
                  <div className="aftrou">
                    Il manque une information. Elle part à vos client·es en votre nom — on ne l&apos;invente pas à votre place.
                  </div>
                )}
                <button className="aibtn" onClick={redigerDepuisAction} disabled={gening}>
                  {gening ? <><span className="spin" /> Rédaction…</> : aiUsed ? "↻ Réécrire" : "✨ Rédiger mon annonce"}
                </button>
                {aiErr && <div className="aierr">{aiErr}</div>}
                {echeance && aiUsed && (
                  <div className="afech">⏳ Se retire tout seul <b>{echeanceLisible(echeance)}</b> — vous n&apos;avez rien à faire.</div>
                )}
              </>
            )}

            {/* ③ Le mode libre : celui qui sait déjà quoi dire n'est pas ralenti. */}
            {libre && (
              <>
                <button type="button" className="afback" onClick={retourChoix}>← Voir les idées prêtes</button>
                <div className="rlz-h">Dites-le en quelques mots</div>
                <div className="ai">
                  <div className="aih">✨ L&apos;assistante met en forme</div>
                  <div className="ais">
                    Elle corrige et met en forme, mais n&apos;ajoute rien&nbsp;: ni prix, ni horaire, ni détail que vous n&apos;avez pas écrit.
                  </div>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={2}
                    placeholder="Ex. il reste 2 places pour le cours de samedi 10h"
                  />
                  <button className="aibtn" onClick={generate} disabled={gening || !brief.trim()}>
                    {gening ? <><span className="spin" /> Rédaction…</> : aiUsed ? "↻ Régénérer" : "✨ Rédiger mon message"}
                  </button>
                  {aiErr && <div className="aierr">{aiErr}</div>}
                </div>
              </>
            )}

            {/* ④ Le résultat, relu et modifiable. */}
            {(aiUsed || libre || aiErr) && (
              <>
                {variantes.length > 1 && (
                  <div className="vars">
                    <span className="vk">Ton&nbsp;:</span>
                    {TONS.slice(0, variantes.length).map((lab, k) => (
                      <button
                        key={lab}
                        type="button"
                        className={k === variante ? "on" : ""}
                        onClick={() => { setVariante(k); setMessage(variantes[k]); }}
                      >
                        {lab}
                      </button>
                    ))}
                  </div>
                )}
                <div className="opt">
                  <label htmlFor="pro-msg">Votre message</label>
                  <textarea
                    id="pro-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Écrivez exactement ce que vous proposez…"
                  />
                </div>
                <div className="rlz-nav">
                  <button className="next" onClick={() => setStep(2)} disabled={!message.trim()}>Suivant →</button>
                </div>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="rlz-h">Où voulez-vous l&apos;afficher&nbsp;?</div>
            <div className={`chan${chSite ? " on" : ""}`} onClick={() => setChSite((v) => !v)}>
              <span className="ce">🌐</span>
              <span className="cb"><span className="ct">Sur mon site</span><span className="cs">Bandeau « offre du moment » en haut de votre site</span></span>
              <span className="tag free">offert</span>
              <span className="ck">{chSite ? "✓" : ""}</span>
            </div>
            <div className={`chan${chWa ? " on" : ""}`} onClick={() => setChWa((v) => !v)}>
              <span className="ce">📲</span>
              <span className="cb"><span className="ct">WhatsApp</span><span className="cs">Prévenir vos client·es fidèles</span></span>
              <span className="tag opt">option</span>
              <span className="ck">{chWa ? "✓" : ""}</span>
            </div>
            <div className={`chan${chSocial ? " on" : ""}`} onClick={() => setChSocial((v) => !v)}>
              <span className="ce">📸</span>
              <span className="cb"><span className="ct">Facebook / Instagram</span><span className="cs">Visuel prêt à publier + légende</span></span>
              <span className="tag opt">option</span>
              <span className="ck">{chSocial ? "✓" : ""}</span>
            </div>
            <div className="rlz-nav">
              <button className="back" onClick={() => setStep(1)}>←</button>
              <button className="next" onClick={goStep3} disabled={!anyChannel}>Suivant →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rlz-h">Vérifiez et lancez</div>
            <div className="rbub">{msg}</div>

            {chSite && (
              <div className="rlz-block">
                <div className="rbh">🌐 Sur mon site <span className="tag free">offert</span></div>
                <div className="offer" style={{ marginTop: 8, borderTop: "none", paddingTop: 0 }}>
                  {offer ? (
                    <div className="live">
                      {offer.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="lp" src={offer.photo} alt="" />
                      )}
                      <div className="lt">« {offer.text} »</div>
                      <div className="lmeta">
                        <span className="clicks">👆 {offer.clicks} clic{offer.clicks > 1 ? "s" : ""}</span>
                        {offer.until ? (
                          <span>· se retire {echeanceLisible(new Date(offer.until))}</span>
                        ) : (
                          <span>· sans limite de date</span>
                        )}
                      </div>
                      <div className="lact">
                        <button onClick={() => { setOfferText(offer.text); setOffer(null); }} disabled={offerBusy}>✏️ Modifier</button>
                        <button className="rm" onClick={clearOffer} disabled={offerBusy}>Retirer du site</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={offerText}
                        onChange={(e) => setOfferText(e.target.value)}
                        placeholder="Ex. 2 places dispo samedi · -20% ce week-end"
                        maxLength={140}
                      />
                      {/* Une offre de deux heures doit s'arrêter au bout de deux
                          heures. Sans ça, le commerçant devrait revenir la
                          retirer à la main — et ne le ferait pas. */}
                      <div className="row">
                        <label htmlFor="offer-until">Se retire</label>
                        <select id="offer-until" value={duree} onChange={(e) => setDuree(e.target.value)}>
                          {echeance && <option value="auto">à {echeanceLisible(echeance)}</option>}
                          <option value="2h">dans 2 heures</option>
                          <option value="soir">ce soir</option>
                          <option value="1j">demain</option>
                          <option value="2j">dans 2 jours</option>
                          <option value="7j">dans 1 semaine</option>
                          <option value="0">jamais</option>
                        </select>
                      </div>
                      <div className="rtip" style={{ marginTop: 8 }}>
                        {duree === "0"
                          ? "Elle restera affichée jusqu'à ce que vous la retiriez vous-même."
                          : "Elle disparaît toute seule de votre site et du catalogue — vous n'avez rien à faire."}
                      </div>

                      {/* La photo n'est pas un détail : dans le catalogue, c'est
                          elle qu'on voit avant le texte. On la montre donc AVANT
                          publication, plutôt que d'en choisir une en silence. */}
                      {photos.length > 0 && photo && (
                        <div className="phot">
                          <div className="ph-h">
                            La photo de cette annonce
                            {photos.length > 1 && <button type="button" onClick={() => setTouchePhoto((v) => !v)}>
                              {touchePhoto ? "Fermer" : "Changer"}
                            </button>}
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="ph-g" src={photo} alt="" />
                          <div className="ph-s">
                            C&apos;est elle qui illustrera votre annonce dans le catalogue de {ville}.
                          </div>
                          {touchePhoto && (
                            <div className="ph-l">
                              {photos.map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  className={u === photo ? "on" : ""}
                                  onClick={() => { setPhoto(u); setTouchePhoto(false); }}
                                  aria-label="Choisir cette photo"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={u} alt="" />
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            className="ph-add"
                            onClick={() => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "site" }))}
                          >
                            📷 Ajouter une photo à ma galerie →
                          </button>
                        </div>
                      )}

                      {/* Sans photo, la carte du catalogue est un aplat de
                          couleur. On le DIT, au lieu de laisser la découverte
                          se faire sur la page publique. */}
                      {photos.length === 0 && (
                        <div className="phot vide">
                          <div className="ph-h">Aucune photo</div>
                          <div className="ph-s">
                            Votre annonce paraîtra dans le catalogue de {ville} sans image, sur un fond de couleur.
                            Une photo de votre commerce change beaucoup ce qu&apos;on en voit.
                          </div>
                          <button
                            type="button"
                            className="ph-add"
                            onClick={() => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "site" }))}
                          >
                            📷 Ajouter une photo →
                          </button>
                        </div>
                      )}
                      <button className="obtn" onClick={saveOffer} disabled={offerBusy || !offerText.trim()}>
                        {offerBusy ? "Enregistrement…" : "Afficher sur mon site"}
                      </button>
                      {offerErr && <div className="oerr">{offerErr}</div>}
                    </>
                  )}
                </div>
              </div>
            )}

            {chWa && (
              <div className="rlz-block">
                <div className="rbh">📲 WhatsApp <span className="tag opt">option</span></div>
                <button className="rbtn" onClick={onSend} disabled={atCap || busy}>
                  <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                  Prévenir mes clients
                </button>
                <button className="rcopy" onClick={copyMsg}>{copied ? "✓ Message copié" : "📋 Copier (pour une liste de diffusion)"}</button>
                {atCap ? (
                  <div className="cap">
                    Limite de <b>{cap} relances aujourd&apos;hui</b> atteinte — c&apos;est volontaire (trop de messages lassent vos clients). Reprenez demain.
                  </div>
                ) : (
                  <div className="quota">
                    {remaining !== null ? `Encore ${remaining} relance${remaining > 1 ? "s" : ""} aujourd'hui` : "Diffusion via votre liste WhatsApp"} · aucune appli à installer
                  </div>
                )}
                {contacts.length > 0 && (
                  <div className="aud">
                    <div className="h">Prévenir mes clients opt-in ({contacts.length})</div>
                    <div className="chips">
                      {contacts.map((c) => (
                        <button key={c.id} className={`chip${sent[c.id] ? " done" : ""}`} onClick={() => notifyContact(c)}>
                          {sent[c.id] ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="5,12 10,17 19,7" /></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="#1B7A3E"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                          )}
                          {c.prenom || "Client"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <details className="rguide">
                  <summary>ⓘ Prévenir tous mes clients d&apos;un seul envoi</summary>
                  <div className="rguide-body">
                    <ol>
                      <li>Dans WhatsApp&nbsp;: <b>Nouvelle discussion → Nouvelle diffusion</b>.</li>
                      <li>Cochez vos clients, créez la liste. <b>Une seule fois.</b></li>
                      <li>Ensuite&nbsp;: <b>« Copier »</b> ci-dessus, collez dans la liste, envoyez.</li>
                    </ol>
                    <div className="rwarn">
                      ⚠️ Un client ne reçoit votre diffusion <b>que s&apos;il a enregistré votre numéro</b> — et écrire à
                      quelqu&apos;un qui ne vous a jamais parlé est le meilleur moyen d&apos;être signalé, puis bloqué
                      par WhatsApp.
                    </div>
                    <button
                      type="button"
                      className="addlink"
                      onClick={() => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "clients:diffusion" }))}
                    >
                      📢 Constituer ma liste sans risque →
                    </button>
                  </div>
                </details>
              </div>
            )}

            {chSocial && (
              <div className="rlz-block">
                <div className="rbh">📸 Facebook / Instagram <span className="tag opt">option</span></div>
                {/* Un texte seul ne se publie pas sur Instagram : on fabrique
                    l'image, sinon la promesse « publiez partout » ne tient pas. */}
                <div className="rtip" style={{ marginTop: 6 }}>
                  Votre visuel est prêt. Choisissez un style, puis partagez-le directement dans votre appli.
                </div>
                <AnnonceVisuel slug={slug} annonce={msg} nom={nom} metier={metier} ville={ville} />
              </div>
            )}

            <details className="rguide" style={{ marginTop: 14 }}>
              <summary>⚙️ Options avancées</summary>
              <div className="rguide-body">
                <button className="addlink" onClick={addTrackLink}>
                  {linkAdded ? "✓ Lien ajouté au message" : "🔗 Ajouter le lien de réservation au message"}
                </button>
              </div>
            </details>

            <div className="rlz-nav">
              <button className="back" onClick={() => setStep(2)}>← Retour</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
