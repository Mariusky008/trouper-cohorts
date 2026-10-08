"use client";

// 👻 « ON SE RETROUVE AUTOUR DE QUOI ? » — le fantôme central, dans Ensemble.
//
// Un panneau qui remonte au-dessus de l'alcôve affichée (elle reste derrière,
// assombrie ; le menu du bas reste visible). Trois portes, et rien d'autre :
//
//   · « Partager un de mes essais » — les essais réellement enregistrés ;
//   · « Trouver une idée dans Le Direct » — on part chercher, et le partage de
//     ce qu'on y trouve revient ici avec le contenu déjà choisi ;
//   · « Lancer une discussion libre » — un sujet, un premier message.
//
// RIEN N'EST ENVOYÉ AVANT L'APPUI FINAL (« Partager », « Créer le salon »), et
// un salon n'existe qu'une fois confirmé par le serveur : en cas d'échec, la
// saisie reste là et l'on peut réessayer. Ouvrir ce panneau ou regarder un
// essai ne publie rien ; un salon privé n'apparaît nulle part dans La ville.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { abonnerLook, monLook } from "@/lib/direct/look";
import { choisirPuis } from "./prendre-place";

/** Ce qu'on partage : un essai à soi, ou une annonce trouvée dans Le Direct. */
export type ContenuPartage = {
  cle: string;
  image?: string;
  titre: string;
  /** Le commerce associé. */
  commerce?: string;
  /** Une photo de moi (un essai) : on prévient avant de la montrer dans un salon public. */
  perso: boolean;
  /** Le message proposé, que l'on peut réécrire. */
  suggestion: string;
};
export type SalonEcriture = { cle: string; sujet: string; prive: boolean; photo?: string };
export type ResultatCreation = { erreur: string | null; cle?: string };

type Etape = "menu" | "essais" | "partage" | "libre";
type Etat = { ouvert: boolean; etape: Etape; contenu: ContenuPartage | null; n: number };
let etat: Etat = { ouvert: false, etape: "menu", contenu: null, n: 0 };
const abonnes = new Set<() => void>();
const publier = (e: Etat) => {
  etat = e;
  abonnes.forEach((f) => f());
};
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => void abonnes.delete(f);
};
/** Le fantôme central d'Ensemble ; ou, avec un contenu, le retour depuis Le Direct. */
export function ouvrirPanneauEnsemble(contenu?: ContenuPartage) {
  publier({ ouvert: true, etape: contenu ? "partage" : "menu", contenu: contenu ?? null, n: etat.n + 1 });
}
export function fermerPanneauEnsemble() {
  publier({ ...etat, ouvert: false });
}
export const panneauEnsembleOuvert = () => etat.ouvert;

/**
 * « TROUVER UNE IDÉE DANS LE DIRECT » : tant que ce fil est tendu, « En parler »
 * dans Le Direct ne crée pas de salon d'office — il revient dans ce panneau,
 * avec l'annonce et son commerce, pour choisir où la partager.
 */
//
// LE FIL SE DÉTEND TOUT SEUL. « Quand j'ai appuyé sur "En parler", j'ai eu
// cette pop-up étrange » — la feuille « Partager » au lieu du salon. Le fil
// restait tendu tant que ce panneau n'avait pas été refermé par sa croix :
// parti chercher une idée, revenu par un autre onglet, on le retrouvait des
// heures plus tard sur un « En parler » qui n'avait plus rien à voir. Il ne
// tient donc que cinq minutes, et tombe dès qu'on quitte Le Direct (voir
// `allerA_onglet`).
let ideeLe = 0;
const DUREE_IDEE = 5 * 60_000;
export const ideeDepuisEnsemble = () => ideeLe > 0 && Date.now() - ideeLe < DUREE_IDEE;
export function finirIdee() {
  ideeLe = 0;
}

const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function PanneauEnsemble({
  essais,
  salons,
  onDirect,
  onPremierEssai,
  creer,
  partager,
  onCree,
}: {
  essais: ContenuPartage[];
  /** Les salons où je peux écrire. */
  salons: SalonEcriture[];
  onDirect: () => void;
  onPremierEssai: () => void;
  creer: (o: { sujet: string; prive: boolean; message: string; contenu?: ContenuPartage }) => Promise<ResultatCreation>;
  partager: (cle: string, contenu: ContenuPartage, message: string) => void;
  onCree: (cle: string) => void;
}) {
  const e = useSyncExternalStore(abonner, () => etat, () => etat);
  // Échap ferme ; le panneau ne laisse pas défiler ce qui est derrière (il le couvre).
  useEffect(() => {
    if (!e.ouvert) return;
    const t = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") fermer();
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [e.ouvert]);
  if (!e.ouvert) return null;
  const aller = (etape: Etape, contenu: ContenuPartage | null = e.contenu) => publier({ ...etat, etape, contenu });
  function fermer() {
    finirIdee();
    fermerPanneauEnsemble();
  }
  const titres: Record<Etape, string> = {
    menu: "On se retrouve autour de quoi ?",
    essais: "Partager un de mes essais",
    partage: "Partager",
    libre: "Lancer une discussion libre",
  };
  return (
    <div className="pe" role="dialog" aria-modal="true" aria-label={titres[e.etape]}>
      <StylesPanneauEnsemble />
      <button type="button" className="pe-voile" aria-label="Fermer" onClick={fermer} />
      <div className="pe-panneau" key={e.n}>
        <i className="pe-poignee" aria-hidden="true" />
        {e.etape !== "menu" && (
          <button type="button" className="pe-retour" aria-label="Retour" onClick={() => (e.etape === "partage" && !ideeDepuisEnsemble() ? aller("essais") : aller("menu", null))}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14.5 6-6 6 6 6" />
            </svg>
          </button>
        )}
        <button type="button" className="pe-x" aria-label="Fermer" onClick={fermer}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="pe-defile">
          {e.etape === "menu" && (
            <Menu
              onEssais={() => aller("essais")}
              onDirect={() => {
                ideeLe = Date.now();
                fermerPanneauEnsemble();
                onDirect();
              }}
              onLibre={() => aller("libre")}
            />
          )}
          {e.etape === "essais" && (
            <Essais
              essais={essais}
              onChoisir={(c) => aller("partage", c)}
              onPremier={() => {
                fermer();
                onPremierEssai();
              }}
            />
          )}
          {e.etape === "partage" && e.contenu && (
            <Partage
              contenu={e.contenu}
              salons={salons}
              creer={creer}
              onPartage={(cle, message) => {
                fermer();
                partager(cle, e.contenu!, message);
              }}
              onCree={(cle) => {
                fermer();
                onCree(cle);
              }}
            />
          )}
          {e.etape === "libre" && (
            <Libre
              creer={creer}
              onCree={(cle) => {
                fermer();
                onCree(cle);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MON FANTÔME, EN HAUT DU PANNEAU : un petit salut à l'ouverture (la pose main
 * levée quand elle existe — jamais un personnage étiré), puis un clignement de
 * temps en temps. Rien ne bouge en mouvement réduit.
 */
function MonFantome() {
  const l = useSyncExternalStore(abonnerLook, monLook, monLook);
  const [calme] = useState(reduit);
  const salue = Boolean(l.salue);
  const base = salue ? l.image : (l.debout ?? l.image);
  const cligne = salue ? l.cligne : (l.deboutCligne ?? l.cligne);
  return (
    <div className={`pe-fantome${calme ? " calme" : ""}`} aria-hidden="true">
      <i className="pe-halo" />
      <span className="pe-f">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pe-f-base" src={base} alt="" />
        {cligne && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pe-f-cligne" src={cligne} alt="" />
        )}
        {salue && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pe-f-salue" src={l.salue} alt="" />
        )}
      </span>
    </div>
  );
}

function Menu({ onEssais, onDirect, onLibre }: { onEssais: () => void; onDirect: () => void; onLibre: () => void }) {
  return (
    <>
      <MonFantome />
      <h2 className="pe-titre">On se retrouve autour de quoi&nbsp;?</h2>
      <button type="button" className="pe-carte" onClick={onEssais}>
        <svg className="pe-ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5Z" />
          <path d="M5.5 14.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5ZM18.5 15c.25 1.3.7 1.75 2 2-1.3.25-1.75.7-2 2-.25-1.3-.7-1.75-2-2 1.3-.25 1.75-.7 2-2Z" />
        </svg>
        <span>
          <b>Partager un de mes essais</b>
          <em>Retrouve les essais de ta maison.</em>
        </span>
        <Chevron />
      </button>
      <button type="button" className="pe-carte" onClick={onDirect}>
        <svg className="pe-ic" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
        </svg>
        <span>
          <b>Trouver une idée dans Le Direct</b>
          <em>Une tenue, un resto, une soirée…</em>
        </span>
        <Chevron />
      </button>
      <button type="button" className="pe-libre" onClick={onLibre}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 18.5 5.6 15A7.5 7 0 1 1 9 18.2l-4.5.3Z" />
        </svg>
        Lancer une discussion libre <s aria-hidden="true">›</s>
      </button>
    </>
  );
}

const Chevron = () => (
  <svg className="pe-chev" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

function Essais({ essais, onChoisir, onPremier }: { essais: ContenuPartage[]; onChoisir: (c: ContenuPartage) => void; onPremier: () => void }) {
  if (!essais.length)
    return (
      <div className="pe-vide">
        <MonFantome />
        <h2 className="pe-titre petit">Tu n’as pas encore d’essai à partager.</h2>
        <button type="button" className="pe-principal" onClick={onPremier}>
          Faire un premier essai →
        </button>
      </div>
    );
  return (
    <>
      <h2 className="pe-titre petit">Partager un de mes essais</h2>
      <p className="pe-sous">Choisis l’essai à montrer. Rien n’est envoyé pour l’instant.</p>
      <div className="pe-essais">
        {essais.map((c) => (
          <button key={c.cle} type="button" className="pe-essai" onClick={() => onChoisir(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.image ? <img src={c.image} alt="" /> : <i aria-hidden="true" />}
            <b>{c.titre}</b>
            {c.commerce && <em>{c.commerce}</em>}
          </button>
        ))}
      </div>
    </>
  );
}

/** PRIVÉ PAR DÉFAUT, PUBLIC AU CHOIX — les deux mêmes mots partout. */
function QuiEntre({ prive, setPrive }: { prive: boolean; setPrive: (p: boolean) => void }) {
  return (
    <div className="pe-qui" role="radiogroup" aria-label="Qui peut entrer">
      <button type="button" role="radio" aria-checked={prive} className={prive ? "on" : ""} onClick={() => setPrive(true)}>
        <b>Privé</b> · sur invitation
      </button>
      <button type="button" role="radio" aria-checked={!prive} className={!prive ? "on" : ""} onClick={() => setPrive(false)}>
        <b>Public</b> · visible dans les salons publics
      </button>
    </div>
  );
}

function Partage({
  contenu,
  salons,
  creer,
  onPartage,
  onCree,
}: {
  contenu: ContenuPartage;
  salons: SalonEcriture[];
  creer: (o: { sujet: string; prive: boolean; message: string; contenu?: ContenuPartage }) => Promise<ResultatCreation>;
  onPartage: (cle: string, message: string) => void;
  onCree: (cle: string) => void;
}) {
  const [message, setMessage] = useState(contenu.suggestion);
  const [ou, setOu] = useState<"existant" | "nouveau">(salons.length ? "existant" : "nouveau");
  const [choisi, setChoisi] = useState<string>("");
  const [titre, setTitre] = useState(contenu.titre.slice(0, 80));
  const [prive, setPrive] = useState(true);
  const [confirmer, setConfirmer] = useState(false);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState("");
  const cible = salons.find((s) => s.cle === choisi);
  // L'avertissement ou l'erreur poussent le bouton plus bas : on le ramène sous le doigt.
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmer || erreur) bouton.current?.scrollIntoView({ block: "nearest" });
  }, [confirmer, erreur]);
  // UNE PHOTO DE MOI DANS UN SALON PUBLIC : on le dit, et l'on demande.
  const public_ = ou === "existant" ? Boolean(cible && !cible.prive) : !prive;
  const pret = ou === "existant" ? Boolean(cible) : titre.trim().length > 0;
  const envoyer = async () => {
    if (!pret || attente) return;
    if (contenu.perso && public_ && !confirmer) {
      setConfirmer(true);
      return;
    }
    if (ou === "existant") {
      onPartage(choisi, message.trim());
      return;
    }
    choisirPuis(async () => {
      setAttente(true);
      setErreur("");
      const r = await creer({ sujet: titre.trim(), prive, message: message.trim(), contenu });
      setAttente(false);
      if (r.erreur || !r.cle) setErreur(r.erreur ?? "Le salon n’a pas pu être créé.");
      else onCree(r.cle);
    });
  };
  return (
    <>
      <h2 className="pe-titre petit">Partager</h2>
      <div className="pe-apercu">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {contenu.image ? <img src={contenu.image} alt="" /> : <i aria-hidden="true" />}
        <span>
          <b>{contenu.titre}</b>
          {contenu.commerce && <em>{contenu.commerce}</em>}
        </span>
      </div>
      <label className="pe-champ">
        <span>Ton message</span>
        <textarea value={message} maxLength={240} rows={2} onChange={(ev) => setMessage(ev.target.value)} placeholder="Un mot pour accompagner (facultatif)" />
      </label>
      <div className="pe-ou" role="radiogroup" aria-label="Où partager">
        <button type="button" role="radio" aria-checked={ou === "existant"} className={ou === "existant" ? "on" : ""} disabled={!salons.length} onClick={() => setOu("existant")}>
          Dans un salon existant
        </button>
        <button type="button" role="radio" aria-checked={ou === "nouveau"} className={ou === "nouveau" ? "on" : ""} onClick={() => setOu("nouveau")}>
          Créer un salon
        </button>
      </div>
      {ou === "existant" ? (
        <div className="pe-salons" role="radiogroup" aria-label="Mes salons">
          {salons.map((s) => (
            <button key={s.cle} type="button" role="radio" aria-checked={choisi === s.cle} className={choisi === s.cle ? "on" : ""} onClick={() => setChoisi(s.cle)}>
              <b>{s.sujet}</b>
              <em>{s.prive ? "Privé" : "Public"}</em>
            </button>
          ))}
        </div>
      ) : (
        <>
          <label className="pe-champ">
            <span>Titre du salon</span>
            <input value={titre} maxLength={80} onChange={(ev) => setTitre(ev.target.value)} />
          </label>
          <QuiEntre prive={prive} setPrive={setPrive} />
        </>
      )}
      {confirmer && (
        <p className="pe-attention" role="alert">
          Ce salon est public : tous ceux qui y entrent verront ta photo, et donc ton visage. Appuie encore sur « Partager » pour confirmer.
        </p>
      )}
      {erreur && (
        <p className="pe-erreur" role="alert">
          {erreur} Tu peux réessayer.
        </p>
      )}
      <button ref={bouton} type="button" className="pe-principal" disabled={!pret || attente} aria-busy={attente} onClick={() => void envoyer()}>
        {attente ? "Un instant…" : erreur ? "Réessayer" : confirmer ? "Oui, partager quand même" : "Partager"}
      </button>
      <p className="pe-note">Seuls les membres du salon choisi verront ce partage.</p>
    </>
  );
}

function Libre({ creer, onCree }: { creer: (o: { sujet: string; prive: boolean; message: string }) => Promise<ResultatCreation>; onCree: (cle: string) => void }) {
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [prive, setPrive] = useState(true);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState("");
  const lancer = () => {
    if (!sujet.trim() || attente) return;
    choisirPuis(async () => {
      setAttente(true);
      setErreur("");
      const r = await creer({ sujet: sujet.trim(), prive, message: message.trim() });
      setAttente(false);
      if (r.erreur || !r.cle) setErreur(r.erreur ?? "Le salon n’a pas pu être créé.");
      else onCree(r.cle);
    });
  };
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        lancer();
      }}
    >
      <h2 className="pe-titre petit">Lancer une discussion libre</h2>
      <label className="pe-champ">
        <span>Le sujet de ta discussion</span>
        <input value={sujet} maxLength={80} required onChange={(ev) => setSujet(ev.target.value)} placeholder="Un resto vendredi, une sortie samedi…" />
      </label>
      <label className="pe-champ">
        <span>
          Ton premier message <i>(facultatif)</i>
        </span>
        <textarea value={message} maxLength={240} rows={2} onChange={(ev) => setMessage(ev.target.value)} />
      </label>
      <QuiEntre prive={prive} setPrive={setPrive} />
      {erreur && (
        <p className="pe-erreur" role="alert">
          {erreur} Ta saisie est gardée : tu peux réessayer.
        </p>
      )}
      <button type="submit" className="pe-principal" disabled={!sujet.trim() || attente} aria-busy={attente}>
        {attente ? "Un instant…" : erreur ? "Réessayer" : "Créer le salon"}
      </button>
    </form>
  );
}

function StylesPanneauEnsemble() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.pe{position:absolute;left:0;right:0;top:0;bottom:var(--ap-onglets-h,51px);z-index:1150;display:flex;flex-direction:column;justify-content:flex-end;
  --leger:var(--font-clikme-leger),var(--font-clikme),system-ui,sans-serif;}
.pe-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(18,9,4,.38);cursor:pointer;}
.pe-panneau{position:relative;display:flex;flex-direction:column;max-height:calc(100% - 64px);min-height:0;border-radius:32px 32px 0 0;
  border:1.5px solid rgba(246,181,75,.6);border-bottom:0;background:linear-gradient(180deg,#3d2615 0%,#2f1c0f 42%,#26170c 100%);
  box-shadow:0 -12px 40px rgba(0,0,0,.45),0 -2px 22px rgba(246,181,75,.14);color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;
  animation:pe-monte .32s cubic-bezier(.2,.8,.3,1) both;}
@keyframes pe-monte{from{transform:translateY(44px);opacity:.3;}to{transform:none;opacity:1;}}
@media (prefers-reduced-motion: reduce){.pe-panneau{animation:none;}}
.pe svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.pe-panneau::after{content:"";position:absolute;left:0;right:0;top:0;z-index:1;height:22px;border-radius:32px 32px 0 0;pointer-events:none;
  background:linear-gradient(180deg,#3d2615 40%,rgba(61,38,21,0));}
.pe-poignee{position:absolute;z-index:2;left:50%;top:9px;width:42px;height:4px;margin-left:-21px;border-radius:4px;background:rgba(255,236,210,.42);}
.pe-x,.pe-retour{position:absolute;top:14px;z-index:2;display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;
  border:1px solid rgba(246,190,110,.45);background:#36210f;color:#FFF4E6;cursor:pointer;}
.pe-x{right:14px;}.pe-retour{left:14px;}
.pe-x svg,.pe-retour svg{width:19px;height:19px;}
.pe-defile{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:26px 20px calc(18px + env(safe-area-inset-bottom,0px));}
.pe-fantome{position:relative;display:flex;justify-content:center;height:clamp(118px,19vh,168px);margin:0 auto 6px;}
.pe-halo{position:absolute;left:50%;top:8%;width:min(64%,230px);aspect-ratio:1;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(255,178,74,.32) 0%,rgba(255,150,40,.1) 45%,rgba(255,150,40,0) 70%);}
.pe-f{position:relative;height:100%;filter:drop-shadow(0 8px 12px rgba(0,0,0,.35));}
.pe-f img{display:block;height:100%;width:auto;max-width:none;}
.pe-f .pe-f-cligne,.pe-f .pe-f-salue{position:absolute;left:0;top:0;width:100%;height:100%;}
.pe-f-cligne,.pe-f-salue{opacity:0;}
.pe-fantome:not(.calme) .pe-f-salue{animation:pe-salue 1.7s ease .35s both;}
.pe-fantome:not(.calme) .pe-f-base{animation:pe-cache 1.7s ease .35s both;}
.pe-fantome:not(.calme) .pe-f-cligne{animation:pe-cligne 5.2s steps(1,end) 2.6s infinite;}
@keyframes pe-salue{0%{opacity:0;}10%,82%{opacity:1;}100%{opacity:0;}}
@keyframes pe-cache{0%{opacity:1;}10%,82%{opacity:0;}100%{opacity:1;}}
@keyframes pe-cligne{0%{opacity:0;}95%{opacity:1;}97.5%{opacity:0;}}
.pe-titre{margin:4px 0 18px;text-align:center;font-size:clamp(23px,7.2vw,29px);line-height:1.15;font-weight:600;letter-spacing:-.015em;}
.pe-titre.petit{margin:6px 44px 12px;font-size:clamp(19px,5.8vw,23px);}
.pe-sous{margin:-4px 0 14px;text-align:center;font-family:var(--leger);font-weight:400;font-size:14px;color:#DCC8B2;}
.pe-carte{display:flex;align-items:center;gap:14px;width:100%;margin:0 0 12px;padding:16px 14px 16px 16px;border-radius:20px;cursor:pointer;text-align:left;
  border:1px solid rgba(246,190,110,.45);background:linear-gradient(180deg,rgba(255,236,210,.06),rgba(255,236,210,.02));color:#FFF6EA;font:inherit;}
.pe-carte > span{flex:1;min-width:0;display:grid;gap:3px;}
.pe-carte b{font-size:16.5px;font-weight:600;}
.pe-carte em{font-style:normal;font-family:var(--leger);font-weight:400;font-size:14.5px;color:#DCC8B2;}
.pe-ic{flex:none;width:34px;height:34px;color:#F6B54B;stroke-width:1.5 !important;}
.pe-chev{flex:none;width:20px;height:20px;color:#EAD8C2;}
.pe-libre{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;margin:6px 0 0;padding:0;border:0;background:none;cursor:pointer;
  color:#F6E8D6;font-family:var(--leger);font-size:16px;font-weight:500;}
.pe-libre svg{width:24px;height:24px;color:#F6B54B;}
.pe-libre s{text-decoration:none;font-size:20px;color:#EAD8C2;}
.pe-vide{display:grid;justify-items:center;text-align:center;}
.pe-vide .pe-principal{margin-top:4px;}
.pe-essais{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.pe-essai{display:grid;gap:4px;padding:8px;border-radius:16px;border:1px solid rgba(246,190,110,.3);background:rgba(255,236,210,.04);cursor:pointer;text-align:left;color:#FFF6EA;font:inherit;}
.pe-essai img,.pe-essai > i{width:100%;aspect-ratio:1;object-fit:cover;object-position:50% 20%;border-radius:11px;background:#3a2414;}
.pe-essai b{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pe-essai em{font-style:normal;font-family:var(--leger);font-size:12.5px;color:#DCC8B2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pe-apercu{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:10px;border-radius:16px;border:1px solid rgba(246,190,110,.3);background:rgba(36,21,11,.35);}
.pe-apercu img,.pe-apercu > i{flex:none;width:76px;height:76px;object-fit:cover;object-position:50% 20%;border-radius:12px;background:#3a2414;}
.pe-apercu span{min-width:0;display:grid;gap:3px;}
.pe-apercu b{font-size:16px;font-weight:600;}
.pe-apercu em{font-style:normal;font-family:var(--leger);font-size:14px;color:#DCC8B2;}
.pe-champ{display:grid;gap:5px;margin:0 0 12px;}
.pe-champ > span{font-family:var(--leger);font-size:13.5px;font-weight:500;color:#EAD8C2;}
.pe-champ > span i{font-style:normal;color:#BFA894;}
.pe-champ input,.pe-champ textarea{width:100%;min-height:44px;padding:10px 14px;border-radius:14px;border:1px solid rgba(246,190,110,.35);background:rgba(255,236,210,.05);
  color:#FFF6EA;font-family:var(--leger);font-size:16px;resize:none;}
.pe-ou,.pe-qui{display:grid;gap:8px;margin:0 0 12px;}
.pe-ou{grid-template-columns:1fr 1fr;}
.pe-ou button,.pe-qui button,.pe-salons button{min-height:44px;padding:8px 12px;border-radius:14px;border:1px solid rgba(246,190,110,.35);background:rgba(255,236,210,.04);
  color:#FFF6EA;font-family:var(--leger);font-size:14.5px;font-weight:500;cursor:pointer;text-align:left;}
.pe-ou button{text-align:center;}
.pe-ou button.on,.pe-qui button.on,.pe-salons button.on{border-color:#F6B54B;background:rgba(246,181,75,.16);box-shadow:inset 0 0 0 1px rgba(246,181,75,.5);}
.pe-ou button:disabled{opacity:.45;cursor:default;}
.pe-qui b{font-family:var(--font-clikme),system-ui,sans-serif;font-weight:600;}
.pe-salons{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin:0 0 12px;max-height:200px;overflow-y:auto;overflow-x:hidden;
  padding-right:4px;scrollbar-width:thin;scrollbar-color:rgba(246,181,75,.45) transparent;}
.pe-salons::-webkit-scrollbar{width:4px;height:0;}
.pe-salons::-webkit-scrollbar-thumb{border-radius:4px;background:rgba(246,181,75,.45);}
.pe-salons::-webkit-scrollbar-track{background:transparent;}
.pe-salons button{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;width:100%;text-align:left;}
.pe-salons b{min-width:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pe-salons em{flex:none;font-style:normal;font-size:12.5px;color:#DCC8B2;}
.pe-principal{display:block;width:100%;min-height:50px;margin:4px 0 0;border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#FAC863,#F2AA3E);color:#2A1608;font:inherit;font-size:17px;font-weight:600;
  box-shadow:inset 0 1px 0 rgba(255,236,190,.6),0 6px 24px rgba(242,160,60,.3),0 2px 6px rgba(0,0,0,.28);}
.pe-principal:disabled{opacity:.55;cursor:default;}
.pe-note{margin:10px 0 0;text-align:center;font-family:var(--leger);font-size:13px;color:#C9B29A;}
.pe-attention{margin:0 0 10px;padding:9px 12px;border-radius:12px;background:rgba(246,181,75,.14);color:#FFE7BF;font-family:var(--leger);font-size:14px;}
.pe-erreur{margin:0 0 10px;padding:9px 12px;border-radius:12px;background:rgba(220,70,60,.18);color:#FFD6CF;font-family:var(--leger);font-size:14px;}
@media (max-height:640px){
  .pe-panneau{max-height:calc(100% - 28px);}
  .pe-defile{padding:22px 14px 14px;}
  .pe-fantome{height:clamp(70px,13vh,92px);margin-bottom:2px;}
  .pe-titre{margin-bottom:12px;font-size:21px;}
  .pe-carte{padding:11px 12px;gap:10px;margin-bottom:9px;border-radius:16px;}
  .pe-carte b{font-size:15px;}
  .pe-carte em{font-size:13px;}
  .pe-ic{width:28px;height:28px;}
  .pe-libre{min-height:40px;font-size:15px;margin-top:2px;}
  .pe-principal{min-height:46px;font-size:16px;}
  .pe-apercu img,.pe-apercu > i{width:60px;height:60px;}
}
`,
      }}
    />
  );
}
