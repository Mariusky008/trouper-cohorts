"use client";

// Espace Pro — bouton « Relancer un créneau » (commerce uniquement).
// Une place se libère : le pro prévient ses clients fidèles via WhatsApp. La
// diffusion est NATIVE (le pro choisit ses destinataires / sa liste de diffusion
// dans WhatsApp) — jamais un envoi de masse serveur depuis un numéro perso, qui
// ferait bannir. Un plafond quotidien (serveur) protège contre la sur-sollicitation.
// Si le pro a constitué une audience opt-in (« Mes clients »), on la propose ici
// en tap-par-client : chaque envoi ouvre SON WhatsApp pré-rempli (toujours natif).
import { useEffect, useState } from "react";
import { toWaDigits } from "@/lib/site-internet/phone";

type Contact = { id: string; prenom: string | null; phone_e164: string; unsub_token: string };
type Offer = { text: string; until: string | null; clicks: number; created_at: string };

const DEFAULT_MESSAGE =
  "Bonjour, une place se libère prochainement. Si vous souhaitez en profiter, répondez-moi simplement ici — je vous la réserve.";

// Modèles rapides pour pré-remplir (le pro édite ensuite librement).
const TEMPLATES: Array<{ label: string; text: string }> = [
  { label: "🕐 Créneau libre", text: "Bonjour, une place se libère [jour/heure]. Envie d'en profiter ? Répondez-moi, je vous la réserve." },
  { label: "🏷️ Promo", text: "Bonjour ! Cette semaine : [produit/prestation] à -[XX]%. Ça vous tente ? Répondez-moi 🙂" },
  { label: "✨ Nouveauté", text: "Bonjour ! Petite nouveauté chez nous : [à compléter]. Passez la découvrir 😊" },
];

export function ProRelance({ slug, token }: { slug: string; token: string }) {
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
  // « Offre du moment » : bandeau affiché sur le site du pro + lien traçable.
  const [offer, setOffer] = useState<Offer | null>(null);
  const [offerText, setOfferText] = useState("");
  const [offerDays, setOfferDays] = useState(2);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerErr, setOfferErr] = useState("");
  const [linkAdded, setLinkAdded] = useState(false);

  const trackLink = typeof window !== "undefined" ? `${window.location.origin}/offre/${slug}` : `/offre/${slug}`;

  const saveOffer = async () => {
    const t = offerText.trim();
    if (!t || offerBusy) return;
    setOfferBusy(true);
    setOfferErr("");
    try {
      const r = await fetch("/api/site-internet/pro/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "set", text: t.slice(0, 140), days: offerDays }),
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

  const generate = async () => {
    const b = brief.trim();
    if (!b || gening) return;
    setGening(true);
    setAiErr("");
    try {
      const r = await fetch("/api/site-internet/pro/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, brief: b.slice(0, 400) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && typeof j.text === "string" && j.text.trim()) {
        setMessage(j.text.trim());
        setAiUsed(true);
      } else {
        setAiErr(typeof j.error === "string" ? j.error : "Impossible de générer le message. Réessayez.");
      }
    } catch {
      setAiErr("Impossible de générer le message. Réessayez.");
    } finally {
      setGening(false);
    }
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
        if (!cancelled && r.ok && j.offer) setOffer(j.offer as Offer);
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
          .pro .relance .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .relance .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .relance .ai{margin-top:16px;border:1px solid #D9CFF0;background:linear-gradient(180deg,#F6F2FF,#fff);border-radius:14px;padding:14px;}
          .pro .relance .ai .aih{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#5B3FA6;}
          .pro .relance .ai .ais{font-size:12px;color:var(--soft);line-height:1.45;margin-top:4px;}
          .pro .relance .ai textarea{width:100%;margin-top:10px;border:1px solid #D9CFF0;border-radius:11px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:#fff;resize:vertical;line-height:1.45;}
          .pro .relance .ai .aibtn{margin-top:10px;width:100%;background:#5B3FA6;color:#fff;border:none;border-radius:12px;padding:12px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
          .pro .relance .ai .aibtn:disabled{opacity:.55;cursor:not-allowed;}
          .pro .relance .ai .aierr{margin-top:8px;font-size:12px;color:#B4453C;line-height:1.4;}
          .pro .relance .ai .aiok{margin-top:8px;font-size:11.5px;color:#5B3FA6;line-height:1.4;}
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
          .pro .relance .offer .obtn{margin-top:11px;width:100%;background:var(--grad,#5B3FA6);color:#fff;border:none;border-radius:12px;padding:12px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;}
          .pro .relance .offer .obtn:disabled{opacity:.55;cursor:not-allowed;}
          .pro .relance .offer .oerr{margin-top:8px;font-size:12px;color:#B4453C;line-height:1.4;}
          .pro .relance .offer .live{margin-top:11px;border:1px solid #CFE6C2;background:linear-gradient(180deg,#EDF7E7,#fff);border-radius:14px;padding:13px 15px;}
          .pro .relance .offer .live .lt{font-size:13.5px;font-weight:700;color:#1B5E2E;line-height:1.4;}
          .pro .relance .offer .live .lmeta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:var(--soft);}
          .pro .relance .offer .live .clicks{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid #CFE6C2;border-radius:999px;padding:4px 10px;font-weight:700;color:#1B7A3E;}
          .pro .relance .offer .live .lact{display:flex;gap:8px;margin-top:11px;}
          .pro .relance .offer .live .lact button{flex:1;border-radius:10px;padding:9px;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;border:1px solid var(--hair);background:#fff;color:var(--ink);}
          .pro .relance .offer .live .lact button.rm{color:#B4453C;border-color:#EBC9C4;}
          .pro .relance .offer .addlink{margin-top:9px;width:100%;background:#F1EFE7;border:1px solid var(--hair);color:var(--ink);border-radius:11px;padding:10px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;}
          `,
        }}
      />
      <div className="relance">
        <div className="a-title">📣 Prévenir mes clients</div>
        <div className="a-sub">
          Un créneau qui se libère, une promo, une nouveauté… <b>Écrivez votre message</b>, puis envoyez-le.
          Vous choisissez les destinataires dans WhatsApp — rien n&apos;est envoyé sans vous.
        </div>

        <div className="ai">
          <div className="aih">✨ Écrire mon annonce avec l&apos;IA</div>
          <div className="ais">Dites en quelques mots ce que vous proposez — l&apos;assistante rédige le message pour vous.</div>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={2}
            placeholder="Ex. fraises gariguettes en promo -20% ce week-end"
          />
          <button className="aibtn" onClick={generate} disabled={gening || !brief.trim()}>
            {gening ? <><span className="spin" /> Rédaction…</> : aiUsed ? "↻ Régénérer" : "✨ Rédiger mon message"}
          </button>
          {aiErr && <div className="aierr">{aiErr}</div>}
          {aiUsed && !aiErr && <div className="aiok">✓ Message rédigé ci-dessous — relisez et ajustez avant d&apos;envoyer.</div>}
        </div>

        <div className="tmpl">
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" onClick={() => setMessage(t.text)}>{t.label}</button>
          ))}
        </div>

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

        <button className="rbtn" onClick={onSend} disabled={atCap || busy}>
          <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
          Prévenir mes clients
        </button>

        <button className="rcopy" onClick={copyMsg}>{copied ? "✓ Message copié" : "📋 Copier le message (pour une liste de diffusion)"}</button>

        <details className="rguide">
          <summary>ⓘ Prévenir tous mes clients d&apos;un seul envoi</summary>
          <div className="rguide-body">
            <ol>
              <li>Dans WhatsApp&nbsp;: <b>Nouvelle discussion → Nouvelle diffusion</b>.</li>
              <li>Cochez vos clients (jusqu&apos;à 256), créez la liste. <b>Une seule fois.</b></li>
              <li>À chaque place libre&nbsp;: <b>« Copier le message »</b> ci-dessus, collez-le dans votre liste de diffusion, envoyez. Un envoi&nbsp;→&nbsp;tout le monde le reçoit en privé.</li>
            </ol>
            <div className="rwarn">
              ⚠️ Un client ne reçoit votre diffusion <b>que s&apos;il a enregistré votre numéro</b> dans ses contacts.
              Prenez l&apos;habitude de lui demander&nbsp;: « Enregistrez mon numéro pour être prévenu·e des places qui se
              libèrent et de mes bons plans. »
            </div>
            <div className="rtip">
              Astuce&nbsp;: pour des offres <b>non urgentes</b>, votre <b>Statut WhatsApp</b> (Actu) marche aussi — vous
              publiez une fois, visible 24&nbsp;h par vos contacts. Pour une place à combler <b>vite</b>, la liste de
              diffusion est plus efficace (le message arrive droit dans leur conversation).
            </div>
          </div>
        </details>

        {atCap ? (
          <div className="cap">
            Vous avez atteint la limite de <b>{cap} relances aujourd&apos;hui</b>. C&apos;est volontaire : trop de
            messages lassent vos clients et peuvent faire limiter votre numéro WhatsApp. Reprenez demain.
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
                <button
                  key={c.id}
                  className={`chip${sent[c.id] ? " done" : ""}`}
                  onClick={() => notifyContact(c)}
                >
                  {sent[c.id] ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="5,12 10,17 19,7" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="#1B7A3E"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                  )}
                  {c.prenom || "Client"}
                </button>
              ))}
            </div>
            <div className="note">
              Un tap ouvre le WhatsApp du client, message déjà écrit — vous validez l&apos;envoi. Réservé à vos
              clients qui ont donné leur accord.
            </div>
          </div>
        )}

        <div className="offer">
          <div className="oh">📢 Afficher aussi sur mon site</div>
          <div className="os">
            Votre offre apparaît en bandeau <b>en haut de votre site</b>, avec un lien de réservation.
            Chaque clic est compté — vous voyez les <b>vrais résultats</b>, rien d&apos;inventé.
          </div>

          {offer ? (
            <div className="live">
              <div className="lt">« {offer.text} »</div>
              <div className="lmeta">
                <span className="clicks">👆 {offer.clicks} clic{offer.clicks > 1 ? "s" : ""}</span>
                {offer.until ? (
                  <span>· jusqu&apos;au {new Date(offer.until).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
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
              <div className="row">
                <label htmlFor="offer-days">Afficher pendant</label>
                <select id="offer-days" value={offerDays} onChange={(e) => setOfferDays(Number(e.target.value))}>
                  <option value={1}>1 jour</option>
                  <option value={2}>2 jours</option>
                  <option value={7}>1 semaine</option>
                  <option value={0}>Sans limite</option>
                </select>
              </div>
              <button className="obtn" onClick={saveOffer} disabled={offerBusy || !offerText.trim()}>
                {offerBusy ? "Enregistrement…" : "Afficher sur mon site"}
              </button>
              {offerErr && <div className="oerr">{offerErr}</div>}
            </>
          )}

          <button className="addlink" onClick={addTrackLink}>
            {linkAdded ? "✓ Lien ajouté au message" : "🔗 Ajouter le lien de réservation au message WhatsApp"}
          </button>
        </div>
      </div>
    </>
  );
}
