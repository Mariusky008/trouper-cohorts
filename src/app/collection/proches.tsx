"use client";

/**
 * 🎙️ L'ONGLET « PROCHES » — LE TALKIE-WALKIE DES FIGURINES (8 novembre 2026 ; la règle : `lib/direct/talkie.ts`).
 * Il remplace « Moi » dans le menu ; « Moi » est sous son prénom, en haut.
 *
 *   · SES PROCHES, VIVANTS : leurs figurines qui respirent, « 2 messages », « Là maintenant », la dernière chose dite,
 *     « 🎙️ Lui parler » ; ceux qui l'ont ajouté (« L'ajouter aussi ») ; ceux qui ne l'ont pas encore ajouté (en attente).
 *     Pas un carnet d'adresses : des personnages.
 *   · LUI PARLER (`Parler`) : il touche le micro et parle naturellement, 20 secondes au plus ; sa figurine l'écoute (sa
 *     bouche suit sa voix). Puis « TA FIGURINE A COMPRIS ÇA » : ses phrases écrites, et trois têtes proposées pour chacune
 *     — la première d'office, un toucher la change. Rien ne part sans « Envoyer ».
 *   · LA CONVERSATION (`Conversation`) : une petite pièce de théâtre — leurs deux figurines face à face, celle qui parle
 *     s'avance et fait la tête de chaque réplique au bon moment, les sous-titres ; « Tout rejouer », « Juste le son »,
 *     « Lui répondre ».
 *   · SON LIEN (`/collection?proche=<clé>`) : celui qui l'ouvre peut l'ajouter. La notification (`?parler=<clé>`) ouvre
 *     leur conversation.
 *   · 🏡 CHEZ MOI (chantier « Univers », lot 5 — « dans l'appli, chacun voit la conversation chez soi, l'autre lui rend
 *     visite ») : quand son univers est créé, la scène est SON DÉCOR ; sa figurine assise à sa place, celle du proche
 *     qui entre et s'assoit à la place de l'invité ; celle qui parle le fait avec sa voix, sa bouche, les sous-titres.
 */
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Feuille } from "./ma-figurine";
import { demanderOui } from "./fenetre";
import { FigurineQuiParle, type FigurineHandle } from "./figurine-qui-parle";
import { OngletVisible } from "./guide";
import { BandeauRituel, MonHumeur, fabriquerMesTetes, useConversationDemandee, useRituelAvec } from "./rituel";
import { humeurDe } from "@/lib/direct/rituel";
import { sentimentDe, type Sentiment } from "@/lib/direct/ma-figurine";
import { fabriquerMeme, memePossible } from "@/lib/direct/meme";
import {
  PAROLE_MAX_S,
  PAROLE_MIN_S,
  cleValide,
  repliqueA,
  texteAvecVideo,
  texteDuLien,
  texteDuMessage,
  type Fil,
  type FigurineVue,
  type MessageFil,
  type PlaceChezMoi,
  type ProcheVivant,
  type Replique,
  type RepliqueProposee,
} from "@/lib/direct/talkie";

type Reponse = { ok?: boolean; error?: string };
const ROUTE = "/api/direct/proches";

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & Reponse;
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");

/** « à l'instant », « il y a 5 min », « hier »… */
export function depuis(le: string): string {
  const ms = Date.now() - Date.parse(le);
  if (!Number.isFinite(ms)) return "";
  const min = Math.round(ms / 60_000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j <= 1 ? "hier" : `il y a ${j} jours`;
}
const heure = (le: string) => {
  const d = new Date(le);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

// ─── l'onglet ─────────────────────────────────────────────────────────────────────────────────────
type Donnees = { proches: ProcheVivant[]; presence: boolean; cle: string };
type Invitation = { cle: string; prenom: string; image: string; proche: boolean };

export function Proches({ compte, prete, allerA, onNonLus }: { compte: boolean | null; prete: boolean; allerA: (o: string) => void; onNonLus: (n: number) => void }) {
  const visible = useContext(OngletVisible);
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<{ cle: string; parler: boolean } | null>(null);
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [inviteOuverte, setInviteOuverte] = useState(false);
  const [copie, setCopie] = useState(false);
  const [geste, setGeste] = useState("");
  // 📲 par WhatsApp : sa figurine (pour lui parler), puis le lien prêt à partir
  const [whatsapp, setWhatsapp] = useState<FigurineVue | null>(null);
  const [pret, setPret] = useState<MessagePret | null>(null);
  const [lienCopie, setLienCopie] = useState(false);

  // (« Retour », sur le téléphone, referme la conversation au lieu de quitter ClikMe : elle prend une page d'historique)
  const ouvrir = useCallback((x: { cle: string; parler: boolean }) => {
    try {
      window.history.pushState({ clikmeFil: true }, "");
    } catch {
      /* rien */
    }
    setOuvert(x);
  }, []);
  const fermer = useCallback(() => {
    if ((window.history.state as { clikmeFil?: boolean } | null)?.clikmeFil) window.history.back();
    else setOuvert(null);
  }, []);
  useEffect(() => {
    if (!ouvert) return;
    const retour = () => setOuvert(null);
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, [ouvert]);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(ROUTE, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as Partial<Donnees> & Reponse;
      if (!r.ok) throw new Error(j.error || "Tes proches ne se sont pas chargés. Réessaie.");
      const proches = Array.isArray(j.proches) ? j.proches : [];
      setDonnees({ proches, presence: j.presence !== false, cle: j.cle ?? "" });
      onNonLus(proches.reduce((n, p) => n + (p.nonLus || 0), 0));
      setErreur("");
    } catch (e) {
      setErreur(message(e));
    }
  }, [onNonLus]);

  // (à chaque retour sur l'onglet, et toutes les 45 s tant qu'il est là ; pas pendant une conversation)
  useEffect(() => {
    if (!visible || !compte || !prete || ouvert) return;
    void charger();
    const t = window.setInterval(() => void charger(), 45_000);
    return () => window.clearInterval(t);
  }, [visible, compte, prete, ouvert, charger]);

  // 🔔 la notification (`?parler=<clé>`) ouvre leur conversation ; 🔗 son lien (`?proche=<clé>`) propose de l'ajouter
  useEffect(() => {
    if (!compte || !prete) return;
    const u = new URL(window.location.href);
    const parler = cleValide(u.searchParams.get("parler"));
    const proche = cleValide(u.searchParams.get("proche"));
    if (!parler && !proche) return;
    u.searchParams.delete("parler");
    u.searchParams.delete("proche");
    try {
      window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
    } catch {
      /* rien */
    }
    let fini = false;
    if (parler) void Promise.resolve().then(() => !fini && ouvrir({ cle: parler, parler: false }));
    if (proche)
      void fetch(`/api/direct/autour?profil=${proche}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { profil?: { cle: string; prenom: string; image: string; moi?: boolean; proche?: boolean } }) => {
          const p = j.profil;
          if (fini || !p || p.moi) return;
          setInvite({ cle: p.cle, prenom: p.prenom || "Ton proche", image: p.image, proche: Boolean(p.proche) });
          setInviteOuverte(true);
        })
        .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [compte, prete, ouvrir]);

  // ☀️ « Lui répondre », sous le mot de sa figurine (la feuille du matin) : leur conversation
  // (✨ « Mon vœu » : « Parler à Marius » l'ouvre micro prêt — `parler`)
  const ouvrirFil = useCallback((cle: string, parler = false) => ouvrir({ cle, parler }), [ouvrir]);
  useConversationDemandee(ouvrirFil, Boolean(compte && prete));

  async function ajouter(cle: string, apres?: () => void) {
    setGeste(cle);
    try {
      await demander({ action: "proche", cle, oui: true });
      apres?.();
      await charger();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setGeste("");
    }
  }

  /** 📲 « Lui parler par WhatsApp » : sa figurine, puis l'écran pour lui parler (comme à un proche). */
  async function parlerParWhatsApp() {
    setGeste("whatsapp");
    setErreur("");
    try {
      const r = await fetch(`${ROUTE}?moi=1`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { moi?: FigurineVue } & Reponse;
      if (!j.moi) throw new Error(j.error || "Ta figurine ne s’est pas chargée. Réessaie.");
      setWhatsapp(j.moi);
    } catch (e) {
      setErreur(message(e));
    } finally {
      setGeste("");
    }
  }
  const lienWhatsApp = (x: { url: string; pour: string }) => `https://wa.me/?text=${encodeURIComponent(`${texteDuLien(x.pour)} ${x.url}`)}`;
  async function copierLeLien(x: { url: string; pour: string }) {
    try {
      await navigator.clipboard.writeText(`${texteDuLien(x.pour)} ${x.url}`);
      setLienCopie(true);
      window.setTimeout(() => setLienCopie(false), 2500);
    } catch {
      window.prompt("Ton lien :", x.url);
    }
  }

  async function partager() {
    if (!donnees?.cle) return;
    const url = `${window.location.origin}/collection?proche=${donnees.cle}#proches`;
    const texte = "Ajoute-moi sur ClikMe : nos figurines pourront se parler 🎙️";
    try {
      if (navigator.share) return void (await navigator.share({ title: "ClikMe", text: texte, url }));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt("Ton lien :", url);
    }
  }

  const tete = (
    <div className="pr-tete">
      <h2>Proches</h2>
      <p>Tes personnages, tes conversations.</p>
    </div>
  );
  if (compte === null) {
    return (
      <div className="pr">
        {tete}
        <div className="mc-attente">
          <i />
        </div>
      </div>
    );
  }
  if (!compte || !prete) {
    return (
      <div className="pr">
        {tete}
        <div className="pr-vide">
          <b>Ta figurine d’abord</b>
          <p>C’est elle qui parlera à tes proches, avec ta voix, et qui fera les têtes.</p>
          <button type="button" className="pr-bouton" onClick={() => allerA("figurine")}>
            🎭 Créer ma figurine
          </button>
        </div>
      </div>
    );
  }

  const proches = donnees?.proches ?? [];
  return (
    <div className="pr">
      {tete}
      {/* ☀️ son humeur du jour, et ce que les figurines de ses proches en disent (lot R) */}
      <MonHumeur visible={visible} onRepondre={ouvrirFil} />
      {!donnees && !erreur && (
        <div className="mc-attente">
          <i />
        </div>
      )}
      {donnees && !proches.length && (
        <div className="pr-vide">
          <b>Pas encore de proches ici</b>
          <p>Ils arrivent ici : ceux qui te répondent en duo, ceux que tu ajoutes depuis leur profil dans Autour — et ceux à qui tu envoies ton lien.</p>
        </div>
      )}
      {proches.length > 0 && (
        <div className="pr-grille">
          {proches.map((p, i) => (
            <article key={p.cle} className={`pr-carte lien-${p.lien}${p.nonLus ? " nouveau" : ""}${p.la ? " la" : ""}`} data-cle={p.cle}>
              <button type="button" className="pr-mini" disabled={p.lien !== "proches"} aria-label={`Ta conversation avec ${p.prenom}`} onClick={() => ouvrir({ cle: p.cle, parler: false })}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageHumeur || p.image} alt={`La figurine de ${p.prenom}`} draggable={false} style={{ animationDelay: `${(-0.7 * i).toFixed(1)}s` }} />
                {/* ☀️ son humeur du jour : sa figurine la porte */}
                {p.humeur && (
                  <span className="pr-humeur" aria-label={`Son humeur du jour : ${humeurDe(p.humeur)?.court ?? ""}`}>
                    {humeurDe(p.humeur)?.emoji}
                  </span>
                )}
                {p.nonLus > 0 && <span className="pr-bulle">{p.nonLus === 1 ? "1 message" : `${p.nonLus} messages`}</span>}
                {p.la && (
                  <span className="pr-la">
                    <i />
                    Là maintenant
                  </span>
                )}
                {/* (il a fait sa figurine pour lui répondre, venu par son lien WhatsApp) */}
                {p.venu && <span className="pr-venu">Nouveau, grâce à toi</span>}
              </button>
              <div className="pr-pied">
                <b>{p.prenom}</b>
                <span className={`pr-dernier${p.nonLus ? " chaud" : ""}`}>{ligneDe(p)}</span>
                {p.lien === "proches" ? (
                  <button type="button" className={`pr-lui-parler${p.nonLus ? " chaud" : ""}`} onClick={() => ouvrir({ cle: p.cle, parler: true })}>
                    <IconeMicro />
                    Lui parler
                  </button>
                ) : p.lien === "ajoute" ? (
                  <button type="button" className="pr-ajouter" disabled={geste === p.cle} onClick={() => void ajouter(p.cle)}>
                    {geste === p.cle ? "…" : "L’ajouter aussi"}
                  </button>
                ) : (
                  <span className="pr-attente">En attente</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {erreur && (
        <p className="pr-erreur" role="alert">
          {erreur}
        </p>
      )}

      {/* 📲 À QUELQU'UN QUI N'A PAS CLIKME : sa figurine lui arrive par WhatsApp ; pour répondre, il fait la sienne */}
      {donnees && (
        <div className="pr-wa">
          <span className="pr-wa-ico" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8 8 0 0 1-11.8 7L4 20.5l1.5-4.8A8 8 0 1 1 21 12z" />
              <path d="M12 8.5v5M9.5 11h5" />
            </svg>
          </span>
          <span className="pr-wa-texte">
            <b>Quelqu’un n’a pas ClikMe ?</b>
            <span>Ta figurine lui arrive par WhatsApp. Pour te répondre, il suffit d’un selfie : sa figurine est prête en une minute.</span>
            <button type="button" className="pr-bouton clair" disabled={geste === "whatsapp"} onClick={() => void parlerParWhatsApp()}>
              {geste === "whatsapp" ? "…" : "🎙️ Lui parler par WhatsApp"}
            </button>
          </span>
        </div>
      )}

      {/* 🔗 son lien : ceux qui l'ouvrent peuvent l'ajouter */}
      {donnees?.cle && (
        <div className="pr-lien">
          <b>Ajoute tes proches</b>
          <span>Envoie ton lien : ils t’ajoutent, tu les ajoutes, et vos figurines se parlent.</span>
          <button type="button" className="pr-bouton clair" onClick={() => void partager()}>
            {copie ? "Lien copié ✓" : "🔗 Envoyer mon lien"}
          </button>
        </div>
      )}

      {/* 📲 il lui parle (par WhatsApp) : l'écran de toujours ; son message devient un lien */}
      {whatsapp &&
        createPortal(
          <Parler
            lui={null}
            moi={whatsapp}
            boutonEnvoyer="Envoyer par WhatsApp"
            onFermer={() => setWhatsapp(null)}
            envoyer={async (p) => {
              // (🎬 sa vidéo se fabrique ensuite : le son s'ouvre ici, pendant qu'il touche « Envoyer »)
              const ctx = partageVideoPossible() ? ouvrirLeSon() : null;
              try {
                const j = await demander<{ url: string; reste: number }>({ action: "lien-creer", son: p.son, duree: p.duree, repliques: p.repliques, pour: p.pour });
                setPret({ url: new URL(j.url, window.location.origin).toString(), pour: p.pour, reste: Number(j.reste) || 0, parole: p, moi: whatsapp, ctx });
                setWhatsapp(null);
              } catch (e) {
                void ctx?.close().catch(() => undefined);
                throw e;
              }
            }}
          />,
          document.body,
        )}
      {pret && (
        <Feuille ouverte onFermer={() => setPret(null)} titre="Ton message est prêt" className="pr-feuille">
          <LeMessagePret key={pret.url} pret={pret} lienWhatsApp={lienWhatsApp(pret)} copie={lienCopie} onCopier={() => void copierLeLien(pret)} />
        </Feuille>
      )}

      {/* (posée sur la page entière : elle couvre le menu, quoi que fassent les onglets) */}
      {ouvert && createPortal(<Conversation key={ouvert.cle} cle={ouvert.cle} parler={ouvert.parler} onFermer={fermer} />, document.body)}

      {invite && (
        <Feuille ouverte={inviteOuverte} onFermer={() => setInviteOuverte(false)} titre={`Le lien de ${invite.prenom}`} className="pr-feuille">
          <div className="pr-invite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {invite.image && <img src={invite.image} alt={`La figurine de ${invite.prenom}`} draggable={false} />}
            <b>{invite.prenom} veut être ton proche</b>
            <p>Ajoute {invite.prenom} : vos figurines pourront se parler, avec vos voix.</p>
            {invite.proche ? (
              <span className="pr-deja">Déjà dans tes proches ✓</span>
            ) : (
              <button type="button" className="pr-bouton" disabled={geste === invite.cle} onClick={() => void ajouter(invite.cle, () => setInvite({ ...invite, proche: true }))}>
                {geste === invite.cle ? "…" : `👯 Ajouter ${invite.prenom}`}
              </button>
            )}
          </div>
        </Feuille>
      )}
    </div>
  );
}

function ligneDe(p: ProcheVivant): string {
  if (p.lien === "ajoute") return `Veut te parler : ajoute ${p.prenom} aussi.`;
  if (p.lien === "attend") return `En attente : ${p.prenom} doit t’ajouter aussi.`;
  if (!p.dernier) return "Pas encore de message : dis-lui bonjour 👋";
  const dit = p.dernier.texte ? `« ${p.dernier.texte.length > 46 ? `${p.dernier.texte.slice(0, 44).trimEnd()}…` : p.dernier.texte} »` : "🎙️ un message";
  return `${p.dernier.moi ? "Toi : " : "T’a parlé : "}${dit} · ${depuis(p.dernier.le)}`;
}

function IconeMicro() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </svg>
  );
}

/** ⚙️ « Moi » : « Montrer à mes proches quand je suis là » (allumé d'office). */
export function MaPresence() {
  const [presence, setPresence] = useState<boolean | null>(null);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?presence=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { presence?: boolean }) => !fini && setPresence(j.presence !== false))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (presence === null) return null;
  async function basculer() {
    const v = !presence;
    setPresence(v);
    try {
      await demander({ action: "presence", oui: v });
    } catch {
      setPresence(!v);
    }
  }
  return (
    <div className="pr-presence" id="presence">
      <span>
        <b>Montrer à mes proches quand je suis là</b>
        <small>Ils voient « Là maintenant » quand ClikMe est ouvert. Rien d’autre : jamais l’heure de ton dernier passage.</small>
      </span>
      <button type="button" role="switch" aria-checked={presence} aria-label="Montrer à mes proches quand je suis là" className={presence ? "oui" : ""} onClick={() => void basculer()}>
        <i />
      </button>
    </div>
  );
}

// ─── la conversation ──────────────────────────────────────────────────────────────────────────────
function Conversation({ cle, parler, onFermer }: { cle: string; parler: boolean; onFermer: () => void }) {
  const [fil, setFil] = useState<Fil | null>(null);
  const [erreur, setErreur] = useState("");
  const [enregistrer, setEnregistrer] = useState(parler);
  const [vue, setVue] = useState(-1);
  const [ir, setIr] = useState(0);
  const [joue, setJoue] = useState(false);
  const [son, setSon] = useState(false);
  const [menu, setMenu] = useState(false);
  const fig = useRef<FigurineHandle>(null);
  const liste = useRef<HTMLOListElement>(null);
  const msgs = useRef<MessageFil[]>([]);
  const vueRef = useRef(-1);
  const irRef = useRef(0);
  const suite = useRef(false);
  // ☀️ leurs humeurs du jour, et le mot de chaque figurine à l'autre (lot R)
  const [avec, setAvec] = useRituelAvec(cle);

  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?fil=${cle}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { fil?: Fil } & Reponse;
        if (fini) return;
        if (!j.fil) return setErreur(j.error || "Cette conversation ne s’ouvre pas. Réessaie.");
        setFil(j.fil);
      })
      .catch(() => !fini && setErreur("Cette conversation ne s’ouvre pas. Réessaie."));
    return () => {
      fini = true;
    };
  }, [cle]);
  useEffect(() => {
    msgs.current = fil?.messages ?? [];
  }, [fil]);
  // (la liste, en bas : les derniers messages en vue)
  const nbMessages = fil?.messages.length ?? 0;
  useEffect(() => {
    const l = liste.current;
    if (l) l.scrollTop = l.scrollHeight;
  }, [nbMessages]);
  // (Échap ferme ; la page ne défile pas dessous)
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !enregistrer && onFermer();
    window.addEventListener("keydown", echap);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", echap);
      document.body.style.overflow = avant;
    };
  }, [enregistrer, onFermer]);

  const jouerMessage = useCallback((i: number, enSuite: boolean) => {
    const m = msgs.current[i];
    if (!m) return;
    suite.current = enSuite;
    vueRef.current = i;
    irRef.current = 0;
    setVue(i);
    setIr(0);
    void fig.current?.jouer(m.son);
  }, []);
  const surTemps = useCallback((t: number) => {
    const r = msgs.current[vueRef.current]?.repliques ?? [];
    const x = repliqueA(r, t);
    const k = x ? r.indexOf(x) : 0;
    if (k !== irRef.current) {
      irRef.current = k;
      setIr(k);
    }
  }, []);
  const surFin = useCallback(() => {
    const n = vueRef.current + 1;
    if (suite.current && n < msgs.current.length) jouerMessage(n, true);
    else suite.current = false;
  }, [jouerMessage]);

  async function retirer() {
    setMenu(false);
    if (!fil || !(await demanderOui({ emoji: "👋", titre: `Retirer ${fil.lui.prenom} de tes proches ?`, texte: "Vous ne pourrez plus vous parler.", oui: "Retirer", danger: true }))) return;
    try {
      await demander({ action: "proche", cle: fil.cle, oui: false });
      onFermer();
    } catch (e) {
      setErreur(message(e));
    }
  }
  async function signaler() {
    const dernier = [...(fil?.messages ?? [])].reverse().find((m) => !m.moi);
    if (!fil || !dernier) return setMenu(false);
    setMenu(false);
    if (!(await demanderOui({ emoji: "🚩", titre: `Signaler le dernier message de ${fil.lui.prenom} ?`, texte: "Tu ne le verras plus, et l’équipe ClikMe le regardera.", oui: "Signaler", danger: true }))) return;
    try {
      await demander({ action: "signaler", cle: fil.cle, id: dernier.id });
      fig.current?.arreter();
      setFil({ ...fil, messages: fil.messages.filter((m) => m.id !== dernier.id) });
      setVue(-1);
    } catch (e) {
      setErreur(message(e));
    }
  }

  if (!fil) {
    return (
      <div className="pr-plein" role="dialog" aria-modal="true" aria-label="Ta conversation">
        <header className="pr-haut">
          <button type="button" className="pr-retour" aria-label="Revenir à tes proches" onClick={onFermer}>
            <IconeRetour />
          </button>
        </header>
        {erreur ? (
          <p className="pr-erreur" role="alert">
            {erreur}
          </p>
        ) : (
          <div className="mc-attente pr-attente-fil">
            <i />
          </div>
        )}
      </div>
    );
  }

  const nouveaux = fil.messages.map((m, i) => (m.nouveau ? i : -1)).filter((i) => i >= 0);
  const iVue = vue >= 0 && vue < fil.messages.length ? vue : nouveaux.length ? nouveaux[0] : fil.messages.length - 1;
  const m = fil.messages[iVue];
  const parleur = m?.moi ? fil.moi : fil.lui;
  const ecoute = m?.moi ? fil.lui : fil.moi;
  const rep = m ? m.repliques[Math.min(ir, m.repliques.length - 1)] : undefined;
  const tete = rep?.tete ?? null;
  const s = sentimentDe(tete);
  // (celle qui écoute porte son humeur du jour, si ce visage est fait)
  const humeurEcoute = m?.moi ? avec?.sienne : avec?.mienne;
  const imageEcoute = (humeurEcoute && ecoute.expressions[humeurEcoute]?.n) || ecoute.neutre;
  const avatar = (avec?.sienne && fil.lui.expressions[avec.sienne]?.n) || fil.lui.neutre;
  // 🏡 chez moi (« Univers », lot 5) : les figurines du nouveau style, assises (sans visages : ils ne sont pas encore faits)
  const chez = fil.chezMoi;
  const assiseDe = (f: FigurineVue) => (chez && f.assise ? f.assise : null);
  const pParle = assiseDe(parleur);
  const pEcoute = assiseDe(ecoute);

  return (
    <div className="pr-plein" role="dialog" aria-modal="true" aria-label={`Ta conversation avec ${fil.lui.prenom}`}>
      <header className="pr-haut">
        <button type="button" className="pr-retour" aria-label="Revenir à tes proches" onClick={onFermer}>
          <IconeRetour />
        </button>
        <span className={`pr-avatar${fil.la ? " la" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" draggable={false} />
        </span>
        <span className="pr-qui">
          <b>{fil.lui.prenom}</b>
          {fil.la && <small className="vert">Là maintenant</small>}
        </span>
        <button type="button" className="pr-menu-bouton" aria-label={`Signaler ou retirer ${fil.lui.prenom}`} aria-expanded={menu} onClick={() => setMenu((x) => !x)}>
          ⋯
        </button>
        {menu && (
          <div className="pr-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => void signaler()}>
              🚩 Signaler son dernier message
            </button>
            <button type="button" role="menuitem" onClick={() => void retirer()}>
              Retirer {fil.lui.prenom} de mes proches
            </button>
          </div>
        )}
      </header>

      <BandeauRituel avec={avec} prenom={fil.lui.prenom} onAvec={setAvec} />

      {/* la scène : leurs deux figurines face à face ; celle qui parle s'avance — chez moi, dans mon univers */}
      <section
        className={`pr-scene${chez ? " chez" : ""}${m?.moi ? " moi" : ""}${joue ? " joue" : ""}`}
        aria-label={chez ? `Chez toi : ${fil.lui.prenom} est venu te voir` : "La scène"}
        data-message={m?.id ?? ""}
        data-replique={m ? ir : ""}
        data-tete={tete ?? ""}
      >
        {chez && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pr-decor" src={chez.decor} alt="" draggable={false} />
        )}
        <div className={`pr-parleur${pParle ? " assise" : ""}${chez && !m?.moi ? " invite" : ""}`} style={chez ? styleDePlace(m?.moi ? chez.hote : chez.invite, !m?.moi) : undefined}>
          <FigurineQuiParle
            ref={fig}
            neutre={pParle?.n ?? parleur.neutre}
            parle={pParle?.p ?? parleur.parle}
            expressions={pParle ? {} : parleur.expressions}
            decoupe={Boolean(pParle)}
            sentiment={pParle ? null : tete}
            onTemps={surTemps}
            onFin={surFin}
            onJoue={setJoue}
            className="pr-fqp"
          />
        </div>
        {chez ? (
          <span className={`pr-ecoute-chez${pEcoute ? " assise" : ""}${m?.moi ? " invite" : ""}`} style={styleDePlace(m?.moi ? chez.invite : chez.hote, Boolean(m?.moi))}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pEcoute?.n ?? imageEcoute} alt={m?.moi ? `La figurine de ${fil.lui.prenom}, qui écoute` : "Ta figurine, qui écoute"} draggable={false} />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pr-ecoute" src={imageEcoute} alt={m?.moi ? `La figurine de ${fil.lui.prenom}, qui écoute` : "Ta figurine, qui écoute"} draggable={false} />
        )}
        {s && (
          <span className="pr-badge" aria-label={`Sa tête : ${s.court}`}>
            <span aria-hidden="true">{s.emoji}</span>
            <small>{s.court}</small>
          </span>
        )}
        {rep?.texte && <p className="pr-sous-titre">« {rep.texte} »</p>}
        {!m && <p className="pr-sous-titre">Pas encore de message. Dis bonjour à {fil.lui.prenom} 👋</p>}
        {m && !joue && (
          <button type="button" className="pr-lire" aria-label={nouveaux.length ? "Écouter ses nouveaux messages" : "Écouter ce message"} onClick={() => (nouveaux.length && vue < 0 ? jouerMessage(nouveaux[0], true) : jouerMessage(iVue, false))}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4.5v15l12-7.5z" fill="currentColor" />
            </svg>
          </button>
        )}
        {son && m && (
          <div className="pr-son" aria-hidden="true">
            <span className={`pr-onde${joue ? " joue" : ""}`}>
              {Array.from({ length: 22 }, (_, k) => (
                <i key={k} style={{ height: `${8 + ((k * 7) % 26)}px`, animationDelay: `${(k % 5) * 0.12}s` }} />
              ))}
            </span>
            <small>
              Juste le son · {m.moi ? "Toi" : fil.lui.prenom} · {mmss(m.duree)}
            </small>
          </div>
        )}
      </section>

      <div className="pr-commandes">
        <button type="button" disabled={!fil.messages.length} onClick={() => jouerMessage(Math.max(0, fil.messages.length - 12), true)}>
          ⟲ Tout rejouer
        </button>
        <button type="button" aria-pressed={son} className={son ? "pris" : ""} onClick={() => setSon((x) => !x)}>
          🔈 Juste le son
        </button>
      </div>

      <ol className="pr-fil" ref={liste} aria-label="Vos messages">
        {fil.messages.map((x, i) => {
          const qui = x.moi ? fil.moi : fil.lui;
          const t0 = x.repliques.find((r) => r.tete)?.tete;
          const img = (t0 && qui.expressions[t0]?.n) || qui.neutre;
          const emojis = [...new Set(x.repliques.map((r) => r.tete).filter((t): t is Sentiment => Boolean(t)))].map((t) => sentimentDe(t)?.emoji ?? "").join(" ");
          const texte = texteDuMessage(x.repliques);
          return (
            <li key={x.id} className={x.moi ? "moi" : "lui"}>
              <button type="button" className={`${i === iVue ? "vu" : ""}${x.nouveau ? " nouveau" : ""}`} onClick={() => jouerMessage(i, false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" draggable={false} />
                <span>
                  <span className="pr-texte">{texte ? `« ${texte} »` : "🎙️ Un message"}</span>
                  <small>
                    {emojis ? `${emojis} · ` : ""}
                    {mmss(x.duree)} · {heure(x.le)}
                    {x.nouveau ? " · nouveau" : ""}
                  </small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {erreur && (
        <p className="pr-erreur" role="alert">
          {erreur}
        </p>
      )}

      <div className="pr-bas">
        <button type="button" className="pr-bouton grand" onClick={() => (fig.current?.arreter(), setEnregistrer(true))}>
          <IconeMicro />
          {fil.messages.length ? "Lui répondre" : "Lui parler"}
        </button>
      </div>

      {enregistrer && (
        <Parler
          lui={fil.lui}
          moi={fil.moi}
          boutonEnvoyer={`Envoyer à ${fil.lui.prenom}`}
          onFermer={() => setEnregistrer(false)}
          envoyer={async (p) => {
            const j = await demander<{ message: MessageFil }>({ action: "envoyer", cle: fil.cle, son: p.son, duree: p.duree, repliques: p.repliques });
            setFil((f) => (f ? { ...f, messages: [...f.messages.map((y) => ({ ...y, nouveau: false })), j.message] } : f));
            setVue(fil.messages.length);
            setIr(0);
            setEnregistrer(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * 🏡 Une place de mon univers, dans la scène : le décor (2:3) est calé en bas de la scène, sur toute sa largeur ; la
 * figurine s'y assoit (le bas de son image sur la place), à 36 % de la hauteur du décor. `invite` : tournée vers moi.
 */
const HAUTEUR_DECOR = 1.5; // (hauteur du décor / largeur de la scène)
export function styleDePlace(p: PlaceChezMoi, invite: boolean): React.CSSProperties {
  const echelle = Math.min(1.15, Math.max(0.9, p.echelle));
  return {
    left: `${p.x * 100}%`,
    bottom: `calc(100cqw * ${HAUTEUR_DECOR} * ${(1 - p.y).toFixed(4)})`,
    height: `calc(100cqw * ${HAUTEUR_DECOR} * ${(0.36 * echelle).toFixed(4)})`,
    ...(invite ? { ["--pr-sens" as string]: "-1" } : {}),
  };
}

function IconeRetour() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// ─── lui parler ───────────────────────────────────────────────────────────────────────────────────
type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };
/** L'horloge du micro (hors du rendu : seulement dans ses gestes). */
const maintenant = () => performance.now();
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
type Enregistrement = { url: string; data: string; duree: number };
type Compris = { repliques: RepliqueProposee[]; dispo: Sentiment[]; transcrit: boolean };

/** Ce qui part : sa voix, ses répliques (les têtes qu'il a choisies) ; `pour` : le prénom tapé (par WhatsApp). */
export type EnvoiParole = { son: string; duree: number; repliques: Replique[]; pour: string };

/**
 * 🎙️ LUI PARLER — il touche le micro, il parle ; puis « Ta figurine a compris ça » ; puis il envoie. Pour un proche
 * (`lui`), pour quelqu'un qui n'a pas ClikMe (`lui` absent : « Son prénom », « Envoyer par WhatsApp »), ou pour celui
 * qui répond à un lien pendant que sa figurine se fabrique (`moi` absent : son selfie à l'écran ; `attendreMoi` la rend
 * quand elle est prête — ce qu'il a dit attend, puis elle comprend).
 */
export function Parler({
  lui,
  moi,
  attendreMoi,
  photoAttente,
  envoyer: envoyerParole,
  boutonEnvoyer,
  onFermer,
}: {
  lui: { prenom: string; neutre: string } | null;
  moi: FigurineVue | null;
  attendreMoi?: () => Promise<FigurineVue>;
  photoAttente?: string;
  envoyer: (p: EnvoiParole) => Promise<void>;
  boutonEnvoyer: string;
  onFermer: () => void;
}) {
  const [maFig, setMaFig] = useState<FigurineVue | null>(moi);
  const [pour, setPour] = useState("");
  const [bloque, setBloque] = useState(false);
  const [etape, setEtape] = useState<"pret" | "micro" | "comprend" | "choisir" | "envoi">("pret");
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState("");
  const [enreg, setEnreg] = useState<Enregistrement | null>(null);
  const [compris, setCompris] = useState<Compris | null>(null);
  const [choix, setChoix] = useState<(Sentiment | null)[]>([]);
  const [autres, setAutres] = useState(-1);
  const [ir, setIr] = useState(0);
  const [joue, setJoue] = useState(false);
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number; ctx?: AudioContext; raf: number } | null>(null);
  const bouche = useRef<HTMLDivElement>(null);
  const fig = useRef<FigurineHandle>(null);
  const irRef = useRef(0);
  const comprisRef = useRef<Compris | null>(null);
  useEffect(() => {
    comprisRef.current = compris;
  }, [compris]);
  const prenom = lui?.prenom ?? "";
  const aQui = prenom || "ton ami";

  // (la page ne défile pas dessous)
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  // (il s'en va : le micro s'éteint)
  useEffect(
    () => () => {
      const m = micro.current;
      micro.current = null;
      if (!m) return;
      window.clearInterval(m.minuteur);
      cancelAnimationFrame(m.raf);
      m.rec.onstop = null;
      if (m.rec.state !== "inactive") m.rec.stop();
      m.flux.getTracks().forEach((t) => t.stop());
      void m.ctx?.close().catch(() => undefined);
    },
    [],
  );

  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setErreur(`Autorise le micro pour parler à ${aQui}.`);
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      return setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) morceaux.push(e.data);
    };
    rec.onstop = () => {
      const m = micro.current;
      micro.current = null;
      if (m) {
        window.clearInterval(m.minuteur);
        cancelAnimationFrame(m.raf);
        void m.ctx?.close().catch(() => undefined);
      }
      bouche.current?.classList.remove("ouverte");
      flux.getTracks().forEach((t) => t.stop());
      const duree = Math.min(PAROLE_MAX_S, (maintenant() - (m?.t0 ?? maintenant())) / 1000);
      if (duree < PAROLE_MIN_S || !morceaux.length) {
        setEtape("pret");
        return setErreur("Trop court : touche le micro et parle un peu plus longtemps.");
      }
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => void comprendre({ url: URL.createObjectURL(blob), data: String(lecteur.result), duree });
      lecteur.onerror = () => {
        setEtape("pret");
        setErreur("Ton message n’a pas pu se préparer. Réessaie.");
      };
      lecteur.readAsDataURL(blob);
      setEtape("comprend");
    };
    // 👄 SA BOUCHE SUIT SA VOIX (le volume du micro) — sinon, elle bat en rythme
    let ctx: AudioContext | undefined;
    let analyse: AnalyserNode | undefined;
    try {
      const C = window.AudioContext ?? (window as Fenetre).webkitAudioContext;
      if (C) {
        ctx = new C();
        void ctx.resume().catch(() => undefined);
        analyse = ctx.createAnalyser();
        analyse.fftSize = 1024;
        ctx.createMediaStreamSource(flux).connect(analyse);
      }
    } catch {
      analyse = undefined;
    }
    const t0 = maintenant();
    let pic = 0;
    const minuteur = window.setInterval(() => {
      const t = (maintenant() - t0) / 1000;
      setSecondes(t);
      if (t >= PAROLE_MAX_S) arreter();
    }, 100);
    micro.current = { rec, flux, t0, minuteur, ctx, raf: 0 };
    const suivre = () => {
      const m = micro.current;
      if (!m) return;
      let ouverte: boolean;
      if (analyse) {
        const d = new Uint8Array(analyse.fftSize);
        analyse.getByteTimeDomainData(d);
        let somme = 0;
        for (const v of d) somme += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(somme / d.length);
        pic = Math.max(pic, rms);
        ouverte = rms > 0.04;
        if (maintenant() - t0 > 1200 && pic < 0.004) analyse = undefined;
      } else {
        ouverte = Math.floor((maintenant() - t0) / 140) % 2 === 0;
      }
      bouche.current?.classList.toggle("ouverte", ouverte);
      m.raf = requestAnimationFrame(suivre);
    };
    setSecondes(0);
    setEnreg(null);
    setCompris(null);
    rec.start(250);
    setEtape("micro");
    micro.current.raf = requestAnimationFrame(suivre);
  }
  function arreter() {
    const m = micro.current;
    if (m && m.rec.state !== "inactive") m.rec.stop();
  }

  /** 🧠 « Ta figurine a compris ça » : ses phrases, et trois têtes pour chacune (la première d'office). */
  async function comprendre(e: Enregistrement) {
    setEnreg(e);
    setBloque(false);
    setErreur("");
    setEtape("comprend");
    // (sa figurine se fabrique encore : ce qu'il a dit attend qu'elle soit prête)
    if (!maFig && attendreMoi) {
      try {
        setMaFig(await attendreMoi());
      } catch (x) {
        setErreur(message(x));
        setBloque(true);
        return;
      }
    }
    try {
      const j = await demander<{ repliques?: RepliqueProposee[]; dispo?: Sentiment[]; transcrit?: boolean }>({ action: "comprendre", son: e.data, duree: e.duree });
      const repliques = Array.isArray(j.repliques) && j.repliques.length ? j.repliques : [{ de: 0, a: e.duree, texte: "", propositions: [] }];
      setCompris({ repliques, dispo: j.dispo ?? [], transcrit: j.transcrit !== false });
      setChoix(repliques.map((r) => r.propositions[0] ?? null));
      setAutres(-1);
      irRef.current = 0;
      setIr(0);
      setEtape("choisir");
    } catch (x) {
      setErreur(message(x));
      setEtape("pret");
    }
  }

  const surTemps = useCallback((t: number) => {
    const r: Replique[] = (comprisRef.current?.repliques ?? []).map((x) => ({ de: x.de, a: x.a, texte: x.texte, tete: null }));
    const x = repliqueA(r, t);
    const k = x ? r.indexOf(x) : 0;
    if (k !== irRef.current) {
      irRef.current = k;
      setIr(k);
    }
  }, []);

  function choisir(i: number, t: Sentiment) {
    setChoix((c) => c.map((x, k) => (k === i ? t : x)));
    irRef.current = i;
    setIr(i);
  }

  async function envoyer() {
    if (!enreg || !compris) return;
    fig.current?.arreter();
    setEtape("envoi");
    setErreur("");
    try {
      await envoyerParole({ son: enreg.data, duree: enreg.duree, repliques: compris.repliques.map((r, i) => ({ de: r.de, a: r.a, texte: r.texte, tete: choix[i] ?? null })), pour: pour.trim() });
      fabriquerMesTetes();
    } catch (x) {
      setErreur(message(x));
      setEtape("choisir");
    }
  }

  function recommencer() {
    fig.current?.arreter();
    setCompris(null);
    setEnreg(null);
    setErreur("");
    setEtape("pret");
  }

  const haut = (
    <header className="pr-haut">
      <button type="button" className="pr-retour" aria-label={compris ? "Recommencer" : "Revenir"} onClick={compris ? recommencer : onFermer}>
        <IconeRetour />
      </button>
      {lui && (
        <span className="pr-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lui.neutre} alt="" draggable={false} />
        </span>
      )}
      {compris ? (
        <span className="pr-qui">
          <b>Ta figurine a compris ça</b>
          <small>{lui ? `Avant d’envoyer à ${prenom}` : "Avant de l’envoyer par WhatsApp"}</small>
        </span>
      ) : (
        <>
          <span className="pr-qui">
            <b>{lui ? `À ${prenom}` : "Par WhatsApp"}</b>
            {!lui && <small>À quelqu’un qui n’a pas ClikMe</small>}
          </span>
          <small className="pr-max">20 s au plus</small>
        </>
      )}
    </header>
  );

  // ─── « Ta figurine a compris ça » ───
  if (compris && enreg && maFig && (etape === "choisir" || etape === "envoi")) {
    const r = compris.repliques[Math.min(ir, compris.repliques.length - 1)];
    const t = choix[Math.min(ir, choix.length - 1)] ?? null;
    const s = sentimentDe(t);
    return (
      <div className="pr-plein pr-parler" role="dialog" aria-modal="true" aria-label={`Ton message à ${aQui}`}>
        {haut}
        <section className="pr-scene seule" aria-label="L’aperçu" data-replique={ir} data-tete={t ?? ""}>
          <div className="pr-parleur">
            <FigurineQuiParle ref={fig} neutre={maFig.neutre} parle={maFig.parle} expressions={maFig.expressions} sentiment={t} onTemps={surTemps} onJoue={setJoue} className="pr-fqp" />
          </div>
          {s && (
            <span className="pr-badge" aria-label={`Sa tête : ${s.court}`}>
              <span aria-hidden="true">{s.emoji}</span>
              <small>{s.court}</small>
            </span>
          )}
          {r?.texte && <p className="pr-sous-titre">« {r.texte} »</p>}
          <button
            type="button"
            className="pr-apercu"
            onClick={() => {
              irRef.current = 0;
              setIr(0);
              if (joue) fig.current?.arreter();
              else void fig.current?.jouer(enreg.url);
            }}
          >
            {joue ? "⏸ Pause" : `▶ Voir ce que ça donne · ${mmss(enreg.duree)}`}
          </button>
        </section>
        {/* (par WhatsApp : son prénom, que sa page affiche — « Karim, Zoé t'a laissé un message ») */}
        {!lui && (
          <label className="pr-pour">
            <span>
              Son prénom <small>· facultatif, il s’affiche chez lui</small>
            </span>
            <input type="text" value={pour} maxLength={30} autoComplete="off" onChange={(e) => setPour(e.target.value)} />
          </label>
        )}
        <h3 className="pr-titre">Ce qu’elle va jouer</h3>
        {!compris.transcrit && <p className="pr-note">Je n’ai pas pu écrire ce que tu as dit : choisis juste sa tête.</p>}
        <ol className="pr-choix">
          {compris.repliques.map((x, i) => {
            const liste = autres === i ? [...x.propositions, ...compris.dispo.filter((d) => !x.propositions.includes(d))] : x.propositions;
            return (
              <li key={i} className={i === ir ? "vu" : ""} data-replique={i}>
                <button
                  type="button"
                  className="pr-choix-texte"
                  onClick={() => {
                    irRef.current = i;
                    setIr(i);
                  }}
                >
                  <small>{mmss(x.de)}</small>
                  <span>{x.texte ? `« ${x.texte} »` : "Ta voix"}</span>
                </button>
                <div className="pr-tetes" role="radiogroup" aria-label={`La tête de la réplique ${i + 1}`}>
                  {liste.map((c) => {
                    const v = sentimentDe(c);
                    return (
                      <button key={c} type="button" role="radio" aria-checked={choix[i] === c} className={choix[i] === c ? "pris" : ""} data-tete={c} onClick={() => choisir(i, c)}>
                        <span aria-hidden="true">{v?.emoji}</span>
                        <small>{v?.court}</small>
                      </button>
                    );
                  })}
                  {autres !== i && compris.dispo.some((d) => !x.propositions.includes(d)) && (
                    <button type="button" className="pr-autre" aria-label="Une autre tête" onClick={() => setAutres(i)}>
                      <span aria-hidden="true">＋</span>
                      <small>Autre</small>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="pr-note">ClikMe propose, toi tu décides : touche une autre tête pour la changer.</p>
        {erreur && (
          <p className="pr-erreur" role="alert">
            {erreur}
          </p>
        )}
        <div className="pr-bas colonne">
          <button type="button" className="pr-bouton grand" disabled={etape === "envoi"} onClick={() => void envoyer()}>
            {etape === "envoi" ? "Envoi…" : boutonEnvoyer}
          </button>
          <button type="button" className="pr-recommencer" disabled={etape === "envoi"} onClick={recommencer}>
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  // ─── il parle ───
  const ecoute = etape === "micro";
  return (
    <div className="pr-plein pr-parler" role="dialog" aria-modal="true" aria-label={`Parler à ${aQui}`}>
      {haut}
      <section className="pr-micro-scene" aria-label="Ta figurine">
        {maFig ? (
          <div className={`pr-moi-fig${ecoute ? " ecoute" : ""}`} ref={bouche}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="n" src={maFig.neutre} alt="Ta figurine, qui t’écoute" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="p" src={maFig.parle} alt="" draggable={false} />
          </div>
        ) : (
          /* sa figurine se fabrique : son selfie, et le temps qui passe */
          <div className="pr-attente-fig" ref={bouche}>
            <span className="pr-attente-rond" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photoAttente ? <img src={photoAttente} alt="Ton selfie" draggable={false} /> : <i aria-hidden="true" />}
            <b>Ta figurine arrive…</b>
            <small>Environ une minute. Dis ta réponse en attendant.</small>
          </div>
        )}
        <span className="pr-etat">
          <i className={ecoute ? "rouge" : ""} />
          {ecoute ? "Je t’écoute" : etape === "comprend" ? (maFig ? "Ta figurine réfléchit…" : "Ta figurine se termine…") : maFig ? "Prête" : "Elle se fabrique"}
        </span>
      </section>
      {ecoute && (
        <div className="pr-temps">
          <b>{mmss(secondes)}</b>
          <span>
            <i style={{ width: `${Math.min(100, (secondes / PAROLE_MAX_S) * 100).toFixed(1)}%` }} />
          </span>
          <small>{mmss(PAROLE_MAX_S)}</small>
        </div>
      )}
      <p className="pr-consigne">
        {etape === "comprend"
          ? maFig
            ? "Elle écrit ce que tu as dit, et choisit ses têtes…"
            : "Ce que tu as dit attend ta figurine : encore un petit moment."
          : ecoute
            ? "Parle naturellement. Touche encore pour finir."
            : maFig
              ? `Parle naturellement, comme à ${aQui} en vrai : ta figurine fera les têtes.`
              : `Pendant qu’elle se fabrique, dis ta réponse à ${aQui} : parle naturellement.`}
      </p>
      {erreur && (
        <p className="pr-erreur" role="alert">
          {erreur}
        </p>
      )}
      {bloque && enreg && (
        <button type="button" className="pr-bouton clair pr-reessayer" onClick={() => void comprendre(enreg)}>
          Réessayer
        </button>
      )}
      <div className="pr-bas colonne">
        <button type="button" className={`pr-micro${ecoute ? " actif" : ""}`} disabled={etape === "comprend"} aria-label={ecoute ? "Finir" : "Parler"} onClick={() => (ecoute ? arreter() : void commencer())}>
          {etape === "comprend" ? (
            <span className="pr-roue" aria-hidden="true" />
          ) : ecoute ? (
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v4" />
            </svg>
          )}
        </button>
        <span className="pr-micro-mot">{etape === "comprend" ? "Un instant…" : ecoute ? "Touche pour finir" : "Touche pour parler"}</span>
      </div>
    </div>
  );
}

// ─── 📲 « TON MESSAGE EST PRÊT » : SA VIDÉO DANS WHATSAPP, OU SON LIEN ───────────────────────────────────────────────
/**
 * Le 9 novembre 2026, le patron, devant le message reçu (un lien, sans image) : « ça ne donne pas envie de cliquer. Il
 * n'y a aucun moyen que ça s'ouvre directement dans WhatsApp ? » Une page ne s'ouvre jamais dans WhatsApp ; une vidéo,
 * si. Au téléphone, sa figurine qui dit son message (sa voix, la tête de chaque réplique, ses mots) devient une vidéo —
 * fabriquée dès que le lien est prêt, sous ses yeux —, et le partage du téléphone l'envoie : elle se joue dans la
 * conversation, et le lien, dans sa légende, ne sert plus qu'à répondre. Sans partage de fichier (un ordinateur) ou si
 * la vidéo rate : le lien, comme avant (son aperçu : `app/t/[id]/apercu`).
 */
type MessagePret = { url: string; pour: string; reste: number; parole?: EnvoiParole; moi?: FigurineVue | null; ctx?: AudioContext | null };

/** Le son du téléphone, ouvert pendant un toucher (sinon la vidéo serait muette). */
function ouvrirLeSon(): AudioContext | null {
  if (typeof window === "undefined" || !memePossible()) return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ctx = AC ? new AC() : null;
  void ctx?.resume().catch(() => undefined);
  return ctx;
}
/** Ce téléphone sait-il donner une vidéo à WhatsApp (le partage de fichiers) ? */
function partageVideoPossible(): boolean {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([new Uint8Array(1)], "message-clikme.mp4", { type: "video/mp4" })] });
  } catch {
    return false;
  }
}

/** (une vidéo par message : le double passage des effets, en développement, n'en fabrique pas deux) */
const videosCommencees = new WeakSet<AudioContext>();

function LeMessagePret({ pret, lienWhatsApp, copie, onCopier }: { pret: MessagePret; lienWhatsApp: string; copie: boolean; onCopier: () => void }) {
  const { parole, moi, ctx } = pret;
  const toile = useRef<HTMLCanvasElement>(null);
  // (en vidéo dès l'ouverture, quand ce téléphone sait la donner à WhatsApp : pas d'éclair du lien avant)
  const [voulue] = useState(() => Boolean(parole && moi && ctx) && partageVideoPossible());
  const [video, setVideo] = useState<{ etat: "fabrication"; p: number } | { etat: "prete"; fichier: File; url: string } | { etat: "ratee" } | null>(voulue ? { etat: "fabrication", p: 0 } : null);
  const [partie, setPartie] = useState(false);
  const vivant = useRef(true);
  const adresse = useRef("");
  useEffect(() => {
    vivant.current = true;
    return () => {
      vivant.current = false;
      if (adresse.current) URL.revokeObjectURL(adresse.current);
      adresse.current = "";
    };
  }, []);

  // 🎬 sa vidéo se fabrique tout de suite, sous ses yeux (sans bruit : il vient de s'entendre)
  useEffect(() => {
    if (!voulue || !parole || !moi || !ctx || !toile.current || videosCommencees.has(ctx)) return;
    videosCommencees.add(ctx);
    // 🏡 « Univers », lot 5b : chez lui (son décor, sa figurine assise, sans têtes — elles ne sont pas encore faites)
    const chez = moi.chez && moi.assise ? { assise: moi.assise, chez: moi.chez } : null;
    const tete = (t: Sentiment | null) => (chez ? chez.assise : (t && moi.expressions[t]) || { n: moi.neutre, p: moi.parle });
    fabriquerMeme({
      ctx,
      toile: toile.current,
      images: chez ? chez.assise : { n: moi.neutre, p: moi.parle },
      ...(chez ? { chezMoi: { decor: chez.chez.decor, ...chez.chez.hote } } : {}),
      son: parole.son,
      repliques: parole.repliques.map((r) => ({ de: r.de, a: r.a, texte: r.texte, images: tete(r.tete), emoji: r.tete ? (sentimentDe(r.tete)?.emoji ?? "") : "" })),
      message: { de: moi.prenom, pour: parole.pour },
      fin: { emoji: "💬", titre: "Réponds-moi avec ta figurine", sous: "clikme.fr" },
      surProgres: (p) => {
        if (vivant.current) setVideo((x) => (x?.etat === "fabrication" ? { etat: "fabrication", p } : x));
      },
    })
      .then((m) => {
        if (!vivant.current) return;
        adresse.current = URL.createObjectURL(m.blob);
        const ext = m.type.includes("mp4") ? "mp4" : "webm";
        setVideo({ etat: "prete", fichier: new File([m.blob], `message-clikme.${ext}`, { type: m.type }), url: adresse.current });
      })
      .catch(() => {
        if (vivant.current) setVideo({ etat: "ratee" });
      })
      .finally(() => void ctx.close().catch(() => undefined));
  }, [voulue, parole, moi, ctx]);

  async function envoyerLaVideo() {
    if (video?.etat !== "prete") return;
    try {
      await navigator.share({ files: [video.fichier], text: texteAvecVideo(pret.pour, pret.url) });
      setPartie(true);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setVideo({ etat: "ratee" });
    }
  }

  const enVideo = video !== null && video.etat !== "ratee";
  const autre = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="pr-pret" data-url={pret.url} data-video={video?.etat ?? ""}>
      <b>{partie ? "C’est parti !" : "Ton message est prêt !"}</b>
      {/* (une seule toile, toujours là : la vidéo s'y dessine ; cachée quand c'est le lien) */}
      <div className={`pr-video${video?.etat === "prete" ? " prete" : ""}`} hidden={!enVideo}>
        {video?.etat === "prete" ? <video src={video.url} playsInline muted loop autoPlay aria-label="Ta vidéo" /> : null}
        <canvas ref={toile} aria-hidden="true" />
        {video?.etat === "fabrication" && (
          <span className="pr-video-cours">
            <i style={{ width: `${Math.round(video.p * 100)}%` }} />
          </span>
        )}
      </div>
      {enVideo ? (
        <>
          <p>
            Ta figurine dit ton message en vidéo, <strong>directement dans WhatsApp</strong>. Pour te répondre, {pret.pour ? `${pret.pour} touche le lien : un selfie suffit,` : "un toucher sur le lien et un selfie suffisent :"} et vous deviendrez proches.
          </p>
          <button type="button" className="pr-bouton grand" disabled={video.etat !== "prete"} onClick={() => void envoyerLaVideo()}>
            {video.etat === "prete" ? (partie ? "📲 La renvoyer" : "📲 L’envoyer en vidéo sur WhatsApp") : `🎬 Ta vidéo se prépare… ${Math.round(video.p * 100)} %`}
          </button>
          <div className="pr-pret-autres">
            <a href={lienWhatsApp} target="_blank" rel="noopener noreferrer">
              Envoyer le lien seulement
            </a>
            <button type="button" onClick={onCopier}>
              {copie ? "Lien copié ✓" : "Copier le lien"}
            </button>
          </div>
        </>
      ) : (
        <>
          {video?.etat === "ratee" && <p className="pr-pret-rate">La vidéo n’a pas pu se faire : envoie le lien, ta figurine parlera dès qu’on le touche.</p>}
          <p>Sur WhatsApp, ta figurine {pret.pour ? `parle à ${pret.pour}` : "lui parle"} sans rien installer. Pour te répondre, un selfie suffit : vous deviendrez proches.</p>
          <a className="pr-bouton grand" href={lienWhatsApp} target="_blank" rel="noopener noreferrer">
            L’envoyer sur WhatsApp
          </a>
          <div className="pr-pret-autres">
            <button type="button" onClick={onCopier}>
              {copie ? "Lien copié ✓" : "Copier le lien"}
            </button>
            {autre && (
              <button type="button" onClick={() => void navigator.share({ text: texteDuLien(pret.pour), url: pret.url }).catch(() => undefined)}>
                Une autre appli
              </button>
            )}
          </div>
        </>
      )}
      <small>{pret.reste > 0 ? `Encore ${pret.reste} aujourd’hui par WhatsApp.` : "C’était le dernier d’aujourd’hui par WhatsApp."} Le lien s’efface dans 30 jours.</small>
    </div>
  );
}

export const STYLES_PROCHES = `
.pr{display:flex;flex-direction:column;gap:14px}
.pr-tete h2{margin:0;font-size:28px;font-weight:900;line-height:1.15;letter-spacing:-.02em}
.pr-tete p{margin:3px 0 0;font-size:13.5px;color:#CDB4C0}
.pr-vide{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 18px;border-radius:24px;background:rgba(255,255,255,.05);text-align:center}
.pr-vide b{font-size:17px;font-weight:900}
.pr-vide p{margin:0;font-size:13.5px;line-height:1.45;color:#D9C3CB}
.pr-bouton{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95);-webkit-tap-highlight-color:transparent}
.pr-bouton:disabled{opacity:.6}
.pr-bouton.clair{background:#FFF4E6;color:#2A0F1F;box-shadow:none;min-height:42px;font-size:13.5px}
.pr-bouton.grand{width:100%;min-height:58px;font-size:16.5px}
.pr-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (min-width:700px){.pr-grille{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (min-width:1000px){.pr-grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
.pr-carte{display:flex;flex-direction:column;min-width:0;border-radius:24px;overflow:hidden;background:#22101B;border:1.5px solid rgba(255,255,255,.1)}
.pr-carte.nouveau{border-color:rgba(255,46,154,.65);box-shadow:0 14px 30px -18px rgba(255,46,154,.9)}
.pr-carte.la:not(.nouveau){border-color:rgba(61,220,132,.5)}
.pr-carte.lien-attend,.pr-carte.lien-ajoute{border-style:dashed;border-color:rgba(255,255,255,.2)}
.pr-mini{position:relative;display:block;width:100%;height:150px;padding:0;border:0;background:#3A1A30;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pr-mini:disabled{cursor:default}
.pr-mini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;animation:pr-respire 3.4s ease-in-out infinite}
.lien-attend .pr-mini img{opacity:.55;filter:saturate(.6);animation:none}
.pr-bulle{position:absolute;left:9px;top:9px;padding:5px 9px;border-radius:12px 12px 12px 3px;background:#FFF4E6;color:#2A0F1F;font-size:11.5px;font-weight:800;animation:pr-bulle 1.6s ease-in-out infinite;box-shadow:0 6px 14px rgba(0,0,0,.35)}
.pr-la{position:absolute;right:9px;bottom:9px;display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:rgba(18,6,15,.78);color:#9FF0C4;font-size:10.5px;font-weight:800}
.pr-la i{display:block;width:7px;height:7px;border-radius:50%;background:#3DDC84}
.pr-pied{display:flex;flex-direction:column;gap:6px;padding:10px 11px 11px;min-width:0}
.pr-pied b{font-size:16px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pr-dernier{min-height:34px;font-size:12px;line-height:1.4;color:#CDB4C0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pr-dernier.chaud{color:#FF8CCB;font-weight:700}
.pr-lui-parler,.pr-ajouter{display:flex;align-items:center;justify-content:center;gap:6px;height:44px;border:0;border-radius:14px;background:#3A1D2F;color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pr-lui-parler.chaud{background:#FF2E9A;color:#fff}
.pr-ajouter{background:#FFF4E6;color:#2A0F1F}
.pr-ajouter:disabled{opacity:.6}
.pr-attente{display:grid;place-items:center;height:44px;border-radius:14px;border:1.5px dashed rgba(255,255,255,.18);color:#B49AA8;font-size:12.5px;font-weight:800}
.pr-lien{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px;border-radius:22px;background:#2A1422;border:1.5px solid rgba(242,196,107,.45)}
.pr-lien b{font-size:14.5px;font-weight:800}
.pr-lien span{font-size:12.5px;line-height:1.4;color:#CDB4C0}
.pr-erreur{margin:0;font-size:13px;color:#FFB4B4;text-align:center}
.pr-humeur{position:absolute;right:8px;top:8px;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(18,6,15,.78);font-size:19px;box-shadow:0 4px 10px rgba(0,0,0,.35)}
.pr-venu{position:absolute;left:9px;bottom:9px;padding:4px 8px;border-radius:999px;background:#F2C46B;color:#2A0F1F;font-size:10.5px;font-weight:800}
.pr-la + .pr-venu,.pr-mini .pr-la ~ .pr-venu{bottom:36px}
.pr-wa{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:22px;background:#2A1422;border:1.5px solid rgba(242,196,107,.45)}
.pr-wa-ico{display:grid;place-items:center;flex:none;width:48px;height:48px;border-radius:50%;background:#FF2E9A;color:#fff}
.pr-wa-texte{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}
.pr-wa-texte b{font-size:14.5px;font-weight:800}
.pr-wa-texte > span{font-size:12.5px;line-height:1.4;color:#CDB4C0}
.pr-pret{display:flex;flex-direction:column;align-items:center;gap:10px;padding:4px 2px 6px;text-align:center}
.pr-pret b{font-size:20px;font-weight:900}
.pr-pret p{margin:0;font-size:13.5px;line-height:1.45;color:#D9C3CB}
.pr-pret a.pr-bouton{text-decoration:none}
.pr-pret-autres{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.pr-pret-autres button{height:42px;padding:0 16px;border:1.5px solid rgba(255,255,255,.2);border-radius:999px;background:none;color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.pr-pret small{font-size:12px;color:#B49AA8}
.pr-pret-autres a{display:inline-flex;align-items:center;height:42px;padding:0 16px;border:1.5px solid rgba(255,255,255,.2);border-radius:999px;color:#FFF4E6;font-size:13.5px;font-weight:800;text-decoration:none}
.pr-pret strong{color:#FFF4E6}
.pr-pret-rate{padding:8px 12px;border-radius:14px;background:rgba(255,46,154,.12);color:#FFD3E8 !important}
.pr-video[hidden]{display:none}
.pr-video{position:relative;width:132px;aspect-ratio:9/16;border-radius:18px;overflow:hidden;background:#22101B;box-shadow:0 0 0 3px rgba(242,196,107,.55),0 16px 30px -14px rgba(255,46,154,.8)}
.pr-video canvas,.pr-video video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.pr-video.prete canvas{visibility:hidden}
.pr-video-cours{position:absolute;left:10px;right:10px;bottom:10px;height:6px;border-radius:999px;background:rgba(0,0,0,.45);overflow:hidden}
.pr-video-cours i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#FF2E9A,#FF7A59);transition:width .25s}
.pr-pour{display:flex;flex-direction:column;gap:6px;margin:2px 2px 0;font-size:12.5px;font-weight:800;color:#CDB4C0}
.pr-pour small{font-weight:600;color:#B49AA8}
.pr-pour input{height:46px;padding:0 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.16);background:#22101B;color:#FFF4E6;font:inherit;font-size:15px;font-weight:700;box-sizing:border-box}
.pr-reessayer{align-self:center}
.pr-attente-fig{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.pr-attente-fig img,.pr-attente-fig > i{display:block;width:150px;height:150px;border-radius:50%;object-fit:cover;background:#3A1A30;box-shadow:0 0 0 6px rgba(242,196,107,.2)}
.pr-attente-rond{position:absolute;top:-8px;left:50%;width:166px;height:166px;margin-left:-83px;border-radius:50%;border:4px solid rgba(242,196,107,.25);border-top-color:#F2C46B;box-sizing:border-box;animation:pr-tourne 1.6s linear infinite}
.pr-attente-fig b{margin-top:10px;font-size:16px;font-weight:900}
.pr-attente-fig small{font-size:12.5px;color:#CDB4C0}
.pr-invite{display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 4px 8px;text-align:center}
.pr-invite img{width:150px;aspect-ratio:3/4;object-fit:cover;object-position:50% 22%;border-radius:22px;box-shadow:0 18px 36px -16px rgba(0,0,0,.9)}
.pr-invite b{font-size:19px;font-weight:900}
.pr-invite p{margin:0 0 6px;font-size:13.5px;color:#D9C3CB}
.pr-deja{font-weight:800;color:#9FF0C4}
.pr-presence{display:flex;align-items:center;gap:12px;margin:16px 0 0;padding:14px;border-radius:22px;background:#2A1422}
.pr-presence > span{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.pr-presence b{font-size:14.5px;font-weight:800}
.pr-presence small{font-size:12px;line-height:1.4;color:#B49AA8}
.pr-presence button{position:relative;flex:none;width:50px;height:30px;border:0;border-radius:999px;background:#5A4452;cursor:pointer}
.pr-presence button.oui{background:#FF2E9A}
.pr-presence button i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s}
.pr-presence button.oui i{left:23px}
/* la conversation, et lui parler : en plein écran */
.pr-plein{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;gap:10px;max-width:560px;margin:0 auto;padding:calc(6px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;
  background:radial-gradient(100% 34% at 50% 0%,rgba(255,46,154,.18),transparent 72%),#12060F;color:#FFF4E6;animation:pr-entre .3s cubic-bezier(.2,.9,.3,1)}
.pr-plein.pr-parler{z-index:31}
.pr-haut{position:relative;z-index:6;display:flex;align-items:center;gap:10px;min-height:56px;flex:none}
.pr-retour,.pr-menu-bouton{display:grid;place-items:center;flex:none;width:44px;height:44px;margin-left:-8px;border:0;border-radius:50%;background:none;color:#FFF4E6;font:inherit;font-size:22px;cursor:pointer}
.pr-menu-bouton{margin:0 -6px 0 0;color:#CDB4C0}
.pr-avatar{position:relative;flex:none;width:40px;height:40px}
.pr-avatar img{display:block;width:40px;height:40px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#3A1A30}
.pr-avatar.la::after{content:"";position:absolute;right:-1px;bottom:0;width:12px;height:12px;border-radius:50%;background:#3DDC84;border:2.5px solid #12060F}
.pr-qui{display:flex;flex-direction:column;flex:1;min-width:0}
.pr-qui b{font-size:16.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pr-qui small{font-size:12px;color:#B49AA8}
.pr-qui small.vert{color:#9FF0C4;font-weight:600}
.pr-max{font-size:12px;font-weight:700;color:#B49AA8}
.pr-menu{position:absolute;right:0;top:52px;z-index:3;display:flex;flex-direction:column;min-width:240px;padding:6px;border-radius:18px;background:#2C1024;box-shadow:0 20px 40px -10px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.08)}
.pr-menu button{padding:12px;border:0;border-radius:12px;background:none;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer}
.pr-menu button:hover{background:rgba(255,255,255,.06)}
.pr-attente-fil{margin-top:12px}
.pr-scene{position:relative;flex:none;display:flex;align-items:flex-end;justify-content:center;gap:4px;height:min(330px,42dvh);padding:14px 10px 0;box-sizing:border-box;border-radius:28px;overflow:hidden;background:radial-gradient(80% 70% at 50% 30%,#4A1A3C,#2A1022 70%)}
.pr-scene::after{content:"";position:absolute;left:0;right:0;bottom:0;height:16%;background:linear-gradient(180deg,transparent,rgba(58,26,48,.9));pointer-events:none}
.pr-parleur{order:1;height:96%;display:flex;align-items:flex-end;transition:transform .35s cubic-bezier(.2,1.4,.4,1)}
.pr-scene.moi .pr-parleur{order:2}
.pr-scene.joue .pr-parleur{transform:translateY(-2%) scale(1.02)}
.pr-fqp{height:100%}
.pr-fqp .fqp-fig{width:auto;height:100%;max-width:62vw;border-radius:22px}
.pr-ecoute{order:2;height:52%;aspect-ratio:3/4;object-fit:cover;object-position:50% 20%;border-radius:18px;opacity:.55;filter:saturate(.75);transform:scaleX(-1);animation:pr-respire 3.2s ease-in-out infinite}
.pr-scene.moi .pr-ecoute{order:1;transform:none}
.pr-scene.moi .pr-lire{right:auto;left:16px}
.pr-scene.seule .pr-parleur{height:92%}
.pr-scene.chez{container-type:inline-size;display:block;height:min(400px,50dvh);padding:0;background:#2b1a0c}
.pr-scene.chez::after{height:22%;background:linear-gradient(180deg,transparent,rgba(20,10,4,.7))}
.pr-decor{position:absolute;left:0;bottom:0;width:100%;aspect-ratio:2/3;object-fit:cover;pointer-events:none}
.pr-scene.chez .pr-parleur,.pr-ecoute-chez{position:absolute;z-index:1;transform:translateX(-50%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center;transition:left .5s cubic-bezier(.2,.9,.3,1),bottom .5s,height .5s}
.pr-scene.chez.joue .pr-parleur{transform:translateX(-50%) translateY(-2%) scale(1.03)}
.pr-scene.chez .pr-parleur.invite,.pr-ecoute-chez.invite{animation:pr-entre .9s cubic-bezier(.2,.9,.3,1) both}
.pr-scene.chez .pr-fqp,.pr-scene.chez .pr-fqp .fqp-fig{height:100%;width:auto;max-width:none;aspect-ratio:2/3}
.pr-scene.chez .pr-fqp .fqp-fig{background:none;box-shadow:none;border-radius:0;overflow:visible}
.pr-scene.chez .pr-parleur:not(.assise) .fqp-fig,.pr-ecoute-chez:not(.assise) img{border-radius:16px;overflow:hidden;box-shadow:0 10px 22px rgba(0,0,0,.45)}
.pr-scene.chez .pr-parleur:not(.assise) .fqp-fig{height:74%;margin-bottom:6%;aspect-ratio:3/4}
.pr-ecoute-chez img{height:100%;width:auto;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 10px 10px rgba(0,0,0,.4))}
.pr-ecoute-chez:not(.assise) img{height:74%;margin-bottom:6%;aspect-ratio:3/4;object-fit:cover;object-position:50% 20%}
.pr-scene.chez .pr-parleur.assise .fqp-fig img,.pr-ecoute-chez.assise img{transform:scaleX(var(--pr-sens,1))}
.pr-scene.chez .pr-lire,.pr-scene.chez.moi .pr-lire{top:14px;left:14px;right:auto;bottom:auto;width:58px;height:58px}
@keyframes pr-entre{from{opacity:0;translate:30% 0}to{opacity:1;translate:0 0}}
.pr-badge{position:absolute;right:12px;top:12px;z-index:2;display:flex;flex-direction:column;align-items:center;padding:6px 9px 5px;border-radius:16px;background:#FFF4E6;color:#2A0F1F;box-shadow:0 8px 18px rgba(0,0,0,.35);animation:pr-badge .35s cubic-bezier(.2,1.6,.4,1)}
.pr-badge span{font-size:26px;line-height:1}
.pr-badge small{font-size:10px;font-weight:800}
.pr-sous-titre{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;margin:0;padding:8px 12px;border-radius:16px;background:rgba(14,4,11,.86);font-size:14px;font-style:italic;line-height:1.4;text-align:center}
.pr-lire{position:absolute;right:16px;bottom:64px;z-index:3;display:grid;place-items:center;width:66px;height:66px;border:0;border-radius:50%;background:#FF2E9A;color:#fff;box-shadow:0 0 0 8px rgba(255,46,154,.25);cursor:pointer;animation:pr-appel 1.8s ease-in-out infinite}
.pr-son{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(18,6,15,.94)}
.pr-onde{display:flex;align-items:center;gap:3px;height:40px}
.pr-onde i{display:block;width:4px;border-radius:2px;background:#FF8CCB}
.pr-onde.joue i{animation:pr-onde .7s ease-in-out infinite alternate}
.pr-son small{font-size:13px;font-weight:700;color:#CDB4C0}
.pr-apercu{position:absolute;left:12px;top:12px;z-index:3;height:38px;padding:0 13px;border:0;border-radius:999px;background:rgba(14,4,11,.86);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.pr-commandes{display:flex;gap:8px;flex:none}
.pr-commandes button{flex:1;height:44px;border:0;border-radius:14px;background:#2A1422;color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.pr-commandes button.pris{background:#FFF4E6;color:#2A0F1F}
.pr-commandes button:disabled{opacity:.5}
.pr-fil{display:flex;flex-direction:column;gap:6px;flex:1 1 auto;min-height:110px;margin:0;padding:0;list-style:none;overflow-y:auto}
.pr-fil li{display:flex}
.pr-fil li.moi{justify-content:flex-end}
.pr-fil button{display:flex;align-items:center;gap:9px;max-width:86%;padding:6px 10px 6px 6px;border-radius:18px;border:1.5px solid rgba(255,255,255,.08);background:#22101B;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.pr-fil li.moi button{background:#33122A}
.pr-fil button.vu{border-color:rgba(255,46,154,.7)}
.pr-fil button.nouveau{box-shadow:0 0 0 2px rgba(255,46,154,.35)}
.pr-fil img{flex:none;width:44px;height:44px;border-radius:14px;object-fit:cover;object-position:50% 18%;background:#3A1A30}
.pr-fil button > span{display:flex;flex-direction:column;gap:1px;min-width:0}
.pr-texte{font-size:13px;font-style:italic;line-height:1.35}
.pr-fil small{font-size:10.5px;font-weight:700;color:#B49AA8}
.pr-bas{flex:none;display:flex;gap:10px;padding-top:4px}
.pr-bas.colonne{flex-direction:column;align-items:center;gap:8px}
/* (« Envoyer à … » reste en vue, même quand ses répliques sont longues) */
.pr-parler .pr-bas{position:sticky;bottom:0;z-index:4;margin-top:auto;padding-top:14px;background:linear-gradient(180deg,rgba(18,6,15,0),#12060F 26%);box-shadow:0 14px 0 #12060F}
.pr-recommencer{height:40px;padding:0 14px;border:0;background:none;color:#FFE7B8;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.pr-titre{margin:4px 2px 0;font-size:12.5px;font-weight:800;color:#CDB4C0;text-transform:uppercase;letter-spacing:.6px}
.pr-note{margin:0 2px;font-size:12px;line-height:1.4;color:#B49AA8}
.pr-choix{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.pr-choix li{display:flex;flex-direction:column;gap:8px;padding:9px 10px;border-radius:18px;background:#22101B;border:1.5px solid rgba(255,255,255,.08)}
.pr-choix li.vu{background:#2E1528;border-color:rgba(255,46,154,.7)}
.pr-choix-texte{display:flex;flex-direction:column;gap:2px;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.pr-choix-texte small{font-size:11px;font-weight:800;color:#B49AA8}
.pr-choix-texte span{font-size:13.5px;font-style:italic;line-height:1.35}
.pr-tetes{display:flex;flex-wrap:wrap;gap:6px}
.pr-tetes button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:64px;height:56px;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:#2A1422;color:#E8D3DC;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pr-tetes button span{font-size:22px;line-height:1.1}
.pr-tetes button small{font-size:9.5px;font-weight:800;white-space:nowrap}
.pr-tetes button.pris{border-color:#FFF4E6;background:#FFF4E6;color:#2A0F1F}
.pr-tetes .pr-autre{border-style:dashed}
.pr-micro-scene{position:relative;flex:1 1 auto;display:flex;align-items:center;justify-content:center;min-height:220px;border-radius:30px;background:radial-gradient(80% 70% at 50% 35%,#5A1A44,#2A1022 75%);overflow:hidden}
.pr-moi-fig{position:relative;height:88%;max-height:360px;aspect-ratio:3/4;border-radius:24px;overflow:hidden;box-shadow:0 22px 44px -18px rgba(0,0,0,.9)}
.pr-moi-fig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pr-moi-fig .p{opacity:0}
.pr-moi-fig.ouverte .p{opacity:1}
.pr-moi-fig.ouverte .n{opacity:0}
.pr-moi-fig.ecoute{animation:pr-parle .9s ease-in-out infinite}
.pr-etat{position:absolute;left:12px;top:12px;display:flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:999px;background:rgba(14,4,11,.8);font-size:12.5px;font-weight:800}
.pr-etat i{display:block;width:9px;height:9px;border-radius:50%;background:#3DDC84}
.pr-etat i.rouge{background:#FF4D4D;animation:pr-clignote 1.1s steps(2) infinite}
.pr-temps{display:flex;align-items:center;gap:10px;flex:none;padding:0 4px}
.pr-temps b{font-size:18px;font-weight:900;font-variant-numeric:tabular-nums}
.pr-temps span{position:relative;flex:1;height:6px;border-radius:9px;background:#2A1422;overflow:hidden}
.pr-temps span i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:#FF2E9A}
.pr-temps small{font-size:13px;font-weight:700;color:#B49AA8}
.pr-consigne{margin:0;flex:none;font-size:13.5px;line-height:1.45;color:#D9C3CB;text-align:center}
.pr-micro{display:grid;place-items:center;width:84px;height:84px;border:0;border-radius:50%;background:#FF2E9A;color:#fff;cursor:pointer;box-shadow:0 10px 24px -8px rgba(255,46,154,.8);-webkit-tap-highlight-color:transparent}
.pr-micro.actif{background:#E5383B;box-shadow:0 0 0 8px rgba(229,56,59,.25),0 0 0 16px rgba(229,56,59,.12)}
.pr-micro:disabled{opacity:.75}
.pr-micro-mot{font-size:13px;font-weight:800}
.pr-roue{display:block;width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;animation:pr-tourne .8s linear infinite}
@keyframes pr-respire{0%,100%{transform:translateY(0) scale(1.06)}50%{transform:translateY(-4px) scale(1.06) rotate(-1deg)}}
@keyframes pr-bulle{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes pr-appel{50%{box-shadow:0 0 0 14px rgba(255,46,154,.14)}}
@keyframes pr-entre{from{opacity:0;transform:translateY(16px)}}
@keyframes pr-badge{from{transform:scale(0) rotate(-30deg)}}
@keyframes pr-onde{from{transform:scaleY(.4)}to{transform:scaleY(1.1)}}
@keyframes pr-parle{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-6px) rotate(1.5deg)}75%{transform:translateY(-3px) rotate(-1.5deg)}}
@keyframes pr-clignote{50%{opacity:.25}}
@keyframes pr-tourne{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pr *,.pr-plein *{animation:none!important}}
`;
