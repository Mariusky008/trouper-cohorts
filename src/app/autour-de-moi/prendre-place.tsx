"use client";

// 🪑 PRENDRE SA PLACE — choisir son fantôme, puis rejoindre un salon.
//
// UN PANNEAU QUI REMONTE DU BAS, pas une nouvelle page : on voit encore le
// salon derrière, assombri, et le vrai menu du bas reste en place.
//
//   1. « Choisis ton fantôme » — seulement si je n'ai jamais répondu. Garder un
//      look l'enregistre ; « Choisir plus tard » garde celui par défaut. Aucun
//      des deux ne fait rejoindre.
//   2. « Ton fantôme est prêt ! » — la confirmation. L'adhésion n'est envoyée
//      qu'à l'appui sur « Rejoindre ce salon » ; « Lire sans rejoindre » ouvre
//      la conversation en lecture.
//   3. Le serveur confirme : le panneau se ferme et mon fantôme s'installe à sa
//      place (une seule fois). En cas d'échec, je ne suis montré membre nulle
//      part, le look reste gardé, et je peux réessayer.
//
// LE SÉLECTEUR S'OUVRE AUSSI DEPUIS MA MAISON, pour changer de look : il se
// referme alors sans rien rejoindre.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LOOKS, abonnerLook, garderLook, lookDecide, monLook } from "@/lib/direct/look";

export type CiblePlace = {
  cle: string;
  titre: string;
  prive: boolean;
  /** Le nombre réel de participants, avant moi. */
  nb: number;
  /** D'où vient le parcours : l'alcôve s'anime sur place, la conversation dans son en-tête. */
  depuis: "alcove" | "conversation";
  /** L'adhésion, envoyée au serveur. `cle` : la clé du salon une fois rejoint, si elle change. */
  rejoindre: () => Promise<{ erreur: string | null; nb?: number; cle?: string }>;
  lire: () => void;
  /** Une vignette du décor du salon, pour la confirmation, et la hauteur (en %) où cadrer sa banquette. */
  vignette?: { src: string; y: number };
};

type Etat = {
  ouvert: boolean;
  etape: "choix" | "confirmation";
  /** `null` : changer de look depuis Ma maison, sans salon. */
  cible: CiblePlace | null;
  /** Ce qui suit le choix du look (entrer dans un salon dont je suis déjà membre). */
  apres?: () => void;
};
let etat: Etat = { ouvert: false, etape: "choix", cible: null };
const abonnes = new Set<() => void>();
const publier = (e: Etat) => {
  etat = e;
  abonnes.forEach((f) => f());
};
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => void abonnes.delete(f);
};

/** Toucher « Ta place ? » ou « Rejoindre pour répondre ». */
export function demanderPlace(cible: CiblePlace) {
  publier({ ouvert: true, etape: lookDecide() ? "confirmation" : "choix", cible });
}
/** Changer de look, depuis Ma maison. */
export function changerDeLook() {
  publier({ ouvert: true, etape: "choix", cible: null });
}
/**
 * ENTRER DANS UN SALON OÙ JE SUIS DÉJÀ : si je n'ai jamais choisi mon
 * fantôme, je le choisis d'abord (ou « plus tard »), puis j'entre. Sinon
 * j'entre tout de suite.
 */
export function choisirPuis(apres: () => void) {
  if (lookDecide()) apres();
  else publier({ ouvert: true, etape: "choix", cible: null, apres });
}
export function fermerPlace() {
  publier({ ...etat, ouvert: false, apres: undefined });
}
export const panneauOuvert = () => etat.ouvert;

// ═══ L'INSTALLATION : jouée une seule fois, après la réponse du serveur ═══
const CLE_INSTALLES = "clikme-installes-v1";
const aJouer = new Map<string, number | undefined>();
const abonnesInstall = new Set<() => void>();
let annonce: { texte: string; depuis: "alcove" | "conversation"; at: number } | null = null;
function dejaInstalles(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(CLE_INSTALLES) || "[]") as string[]);
  } catch {
    return new Set();
  }
}
/** L'alcôve demande : dois-je jouer l'installation de ce salon ? */
export function installationAJouer(cle: string): { nb?: number } | null {
  return aJouer.has(cle) ? { nb: aJouer.get(cle) } : null;
}
/** Une fois jouée, elle ne revient plus — même au retour dans le salon. */
export function installationJouee(cle: string) {
  if (!aJouer.has(cle)) return;
  aJouer.delete(cle);
  marquerInstalle(cle);
  abonnesInstall.forEach((f) => f());
}
function marquerInstalle(cle: string) {
  const d = dejaInstalles();
  d.add(cle);
  try {
    window.localStorage.setItem(CLE_INSTALLES, JSON.stringify([...d].slice(-200)));
  } catch {
    /* rien */
  }
}
export function abonnerInstallation(f: () => void) {
  abonnesInstall.add(f);
  return () => void abonnesInstall.delete(f);
}
export const annonceInstallation = () => annonce;

const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * LE PANNEAU. Il s'arrête au-dessus du vrai menu du bas (sa hauteur mesurée,
 * `--ap-onglets-h`) ; un appui sur le menu le ferme (voir l'application).
 */
export function PanneauPlace() {
  const e = useSyncExternalStore(abonner, () => etat, () => etat);
  const look = useSyncExternalStore(abonnerLook, monLook, monLook);
  const [choisi, setChoisi] = useState(look.id);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouvertAvant, setOuvertAvant] = useState(false);
  // À CHAQUE OUVERTURE, la rangée repart du look actuel.
  if (e.ouvert !== ouvertAvant) {
    setOuvertAvant(e.ouvert);
    if (e.ouvert) {
      setChoisi(look.id);
      setErreur("");
      setAttente(false);
    }
  }
  // LA PAGE DERRIÈRE NE DÉFILE PAS ; Échap ferme.
  useEffect(() => {
    if (!e.ouvert) return;
    const touche = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") fermerPlace();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [e.ouvert]);
  if (!e.ouvert) return null;
  const c = e.cible;
  const garder = (id: string) => {
    garderLook(id);
    if (!c) {
      const suite = e.apres;
      fermerPlace();
      suite?.();
    }
    else publier({ ...etat, etape: "confirmation" });
  };
  const rejoindre = async () => {
    if (!c || attente) return;
    setAttente(true);
    setErreur("");
    const r = await c.rejoindre();
    setAttente(false);
    if (r.erreur) {
      setErreur(r.erreur);
      return;
    }
    // CONFIRMÉ PAR LE SERVEUR : l'installation, une fois, et le nombre réel.
    // Depuis la conversation, elle se joue dans l'annonce ; l'alcôve ne la
    // rejouera pas au retour.
    const cle = r.cle ?? c.cle;
    if (c.depuis === "alcove" && !dejaInstalles().has(cle)) aJouer.set(cle, r.nb);
    else marquerInstalle(cle);
    annonce = { texte: "Tu as pris ta place", depuis: c.depuis, at: Date.now() };
    abonnesInstall.forEach((f) => f());
    fermerPlace();
  };
  return (
    <div className="pp" role="dialog" aria-modal="true" aria-label={e.etape === "choix" ? "Choisis ton fantôme" : "Prêt à prendre ta place ?"}>
      <StylesPlace />
      <button type="button" className="pp-voile" aria-label="Fermer" onClick={fermerPlace} />
      <div className="pp-panneau">
        <i className="pp-poignee" aria-hidden="true" />
        <button type="button" className="pp-x" aria-label="Fermer" onClick={fermerPlace}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {e.etape === "choix" ? (
          <Choix
            choisi={choisi}
            setChoisi={setChoisi}
            onGarder={() => garder(choisi)}
            onPlusTard={c || e.apres ? () => garder(look.id) : undefined}
            avecSalon={Boolean(c)}
          />
        ) : (
          c && (
            <Confirmation
              cible={c}
              attente={attente}
              erreur={erreur}
              onModifier={() => publier({ ...etat, etape: "choix" })}
              onRejoindre={rejoindre}
              onLire={() => {
                fermerPlace();
                c.lire();
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

/** LE GRAND APERÇU : le fantôme, posé sur un halo chaud. */
function Apercu({ id }: { id: string }) {
  const l = LOOKS.find((x) => x.id === id) ?? LOOKS[0];
  return (
    <div className="pp-apercu" aria-hidden="true">
      <i className="pp-halo" />
      <i className="pp-sol" />
      <i className="pp-etincelles" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={l.id} src={l.debout ?? l.image} alt="" />
      {l.debout && l.deboutCligne && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`${l.id}-c`} className="pp-cligne" src={l.deboutCligne} alt="" />
      )}
    </div>
  );
}

function Choix({
  choisi,
  setChoisi,
  onGarder,
  onPlusTard,
  avecSalon,
}: {
  choisi: string;
  setChoisi: (id: string) => void;
  onGarder: () => void;
  onPlusTard?: () => void;
  avecSalon: boolean;
}) {
  const rangee = useRef<HTMLDivElement | null>(null);
  const i = Math.max(0, LOOKS.findIndex((l) => l.id === choisi));
  const l = LOOKS[i];
  const [calme] = useState(reduit);
  // LE LOOK CHOISI EST CENTRÉ DANS LA RANGÉE.
  useEffect(() => {
    const r = rangee.current;
    const v = r?.querySelector<HTMLElement>(`[data-look="${choisi}"]`);
    if (r && v) r.scrollTo({ left: v.offsetLeft + v.offsetWidth / 2 - r.clientWidth / 2, behavior: calme ? "auto" : "smooth" });
  }, [choisi, calme]);
  // UN GLISSEMENT QUI S'ARRÊTE SUR UNE VIGNETTE LA CHOISIT.
  const finGlisse = useRef<number | null>(null);
  const surGlisse = () => {
    if (finGlisse.current) window.clearTimeout(finGlisse.current);
    finGlisse.current = window.setTimeout(() => {
      const r = rangee.current;
      if (!r) return;
      const milieu = r.scrollLeft + r.clientWidth / 2;
      let mieux = choisi;
      let d = Infinity;
      r.querySelectorAll<HTMLElement>("[data-look]").forEach((v) => {
        const dv = Math.abs(v.offsetLeft + v.offsetWidth / 2 - milieu);
        if (dv < d) {
          d = dv;
          mieux = v.dataset.look!;
        }
      });
      if (mieux !== choisi) setChoisi(mieux);
    }, 140);
  };
  const aller = (k: number) => setChoisi(LOOKS[(k + LOOKS.length) % LOOKS.length].id);
  return (
    <div className="pp-corps">
      <div className="pp-defile">
        <h2>Choisis ton fantôme</h2>
        <p className="pp-sous">pour t’asseoir avec les autres.</p>
        <p className="pp-note">Un look à toi, modifiable quand tu veux.</p>
        <Apercu id={l.id} />
        <p className="pp-nom" aria-live="polite">
          {l.nom}
        </p>
        <p className="pp-style" title={l.style}>
          {l.devise}
        </p>
        <div className="pp-rangee-bloc">
          <button type="button" className="pp-fleche g" aria-label="Look précédent" onClick={() => aller(i - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <div
            className="pp-rangee"
            ref={rangee}
            onScroll={surGlisse}
            role="listbox"
            aria-label="Les fantômes"
            aria-activedescendant={`pp-look-${l.id}`}
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "ArrowRight") {
                ev.preventDefault();
                aller(i + 1);
              }
              if (ev.key === "ArrowLeft") {
                ev.preventDefault();
                aller(i - 1);
              }
            }}
          >
            {LOOKS.map((x) => (
              <button
                key={x.id}
                id={`pp-look-${x.id}`}
                type="button"
                role="option"
                aria-selected={x.id === choisi}
                data-look={x.id}
                className={`pp-vignette${x.id === choisi ? " on" : ""}`}
                onClick={() => setChoisi(x.id)}
              >
                <span className="pp-rond">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.debout ?? x.image} alt="" />
                  {x.id === choisi && (
                    <i className="pp-coche" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </i>
                  )}
                </span>
                <span className="pp-v-nom">{x.nom}</span>
              </button>
            ))}
          </div>
          <button type="button" className="pp-fleche d" aria-label="Look suivant" onClick={() => aller(i + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="pp-compte">
          {i + 1} / {LOOKS.length}
        </p>
        <p className="pp-glisse">Fais défiler pour trouver le tien ↔</p>
      </div>
      <div className="pp-actions">
        <button type="button" className="pp-principal" onClick={onGarder}>
          Garder ce fantôme →
        </button>
        {onPlusTard && (
          <button type="button" className="pp-lien" onClick={onPlusTard}>
            Choisir plus tard
          </button>
        )}
        {avecSalon && (
          <p className="pp-info">
            <i aria-hidden="true">i</i> Tu confirmeras ensuite pour rejoindre le salon.
          </p>
        )}
      </div>
    </div>
  );
}

function Confirmation({
  cible,
  attente,
  erreur,
  onModifier,
  onRejoindre,
  onLire,
}: {
  cible: CiblePlace;
  attente: boolean;
  erreur: string;
  onModifier: () => void;
  onRejoindre: () => void;
  onLire: () => void;
}) {
  const look = monLook();
  return (
    <div className="pp-corps">
      <div className="pp-defile">
        <h2>Ton fantôme est prêt !</h2>
        <p className="pp-sous">Il ne reste qu’à prendre ta place.</p>
        <Apercu id={look.id} />
        <p className="pp-nom">{look.nom}</p>
        <button type="button" className="pp-lien" onClick={onModifier}>
          Modifier mon look
        </button>
        <div className="pp-carte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cible.vignette?.src ?? "/direct/ensemble/scene-canape-vert.webp"}
            alt=""
            aria-hidden="true"
            style={{ objectPosition: `50% ${cible.vignette?.y ?? 47}%` }}
          />
          <div>
            <b>{cible.titre}</b>
            <span className="pp-statut">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
              </svg>
              {cible.prive ? "Privé" : "Public"} · {cible.nb} participant{cible.nb > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {erreur && (
          <p className="pp-erreur" role="alert" ref={(el) => el?.scrollIntoView({ block: "nearest" })}>
            {erreur} Tu peux réessayer.
          </p>
        )}
      </div>
      <div className="pp-actions">
        <button type="button" className="pp-principal" onClick={onRejoindre} disabled={attente} aria-busy={attente}>
          {attente ? "Un instant…" : erreur ? "Réessayer →" : "Rejoindre ce salon →"}
        </button>
        <button type="button" className="pp-second" onClick={onLire} disabled={attente}>
          Lire sans rejoindre
        </button>
        <p className="pp-info">
          <i aria-hidden="true">i</i> Tu pourras répondre une fois le salon rejoint.
        </p>
      </div>
    </div>
  );
}

/**
 * « TU AS PRIS TA PLACE » — une brève annonce après l'adhésion. Depuis la
 * conversation, elle montre mon fantôme qui s'installe dans l'en-tête.
 */
export function AnnonceInstallation() {
  const a = useSyncExternalStore(abonnerInstallation, annonceInstallation, () => null);
  const [vue, setVue] = useState(0);
  useEffect(() => {
    if (!a) return;
    const t = window.setTimeout(() => setVue(a.at), 2600);
    return () => window.clearTimeout(t);
  }, [a]);
  if (!a || vue === a.at) return null;
  const l = monLook();
  return (
    <div className={`pp-annonce ${a.depuis}`} role="status">
      <StylesPlace />
      {a.depuis === "conversation" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pp-annonce-f" src={l.image} alt="" />
      )}
      <span>{a.texte}</span>
    </div>
  );
}

function StylesPlace() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.pp{position:absolute;left:0;right:0;top:0;bottom:var(--ap-onglets-h,51px);z-index:1200;display:flex;flex-direction:column;justify-content:flex-end;}
.pp-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(18,9,4,.3);cursor:pointer;}
.pp-panneau{position:relative;display:flex;flex-direction:column;height:min(80%,720px);min-height:0;border-radius:32px 32px 0 0;
  border:1.5px solid rgba(246,181,75,.65);border-bottom:0;background:linear-gradient(180deg,#3d2615 0%,#2f1c0f 42%,#26170c 100%);
  box-shadow:0 -12px 40px rgba(0,0,0,.45),0 -2px 22px rgba(246,181,75,.16);color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;animation:pp-monte .32s cubic-bezier(.2,.8,.3,1) both;
  --leger:var(--font-clikme-leger),var(--font-clikme),system-ui,sans-serif;}
@keyframes pp-monte{from{transform:translateY(40px);opacity:.4;}to{transform:none;opacity:1;}}
@media (prefers-reduced-motion: reduce){.pp-panneau{animation:none;}}
.pp-poignee{position:absolute;left:50%;top:9px;width:40px;height:4px;margin-left:-20px;border-radius:4px;background:rgba(255,236,210,.45);}
.pp-x{position:absolute;right:14px;top:14px;z-index:2;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid rgba(246,190,110,.45);
  background:rgba(36,21,11,.4);color:#FFF4E6;cursor:pointer;}
.pp-x svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;}
.pp-corps{display:flex;flex-direction:column;min-height:0;flex:1;}
.pp-defile{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:24px 16px 4px;text-align:center;}
.pp h2{margin:0;padding:0 36px;font-size:clamp(20px,6.6vw,27px);font-weight:600;letter-spacing:-.01em;}
.pp-sous{margin:2px 0 0;font-family:var(--leger);font-weight:400;font-size:17px;color:#F6E8D6;}
.pp-note{margin:5px 0 0;font-family:var(--leger);font-weight:400;font-size:14.5px;color:#D9B98E;}
.pp-apercu{position:relative;display:flex;justify-content:center;align-items:flex-end;height:clamp(120px,20vh,172px);margin:10px auto 0;padding-bottom:8px;}
.pp-apercu img{position:relative;z-index:2;height:100%;width:auto;min-height:0;max-width:none;filter:drop-shadow(0 0 18px rgba(255,190,100,.35)) drop-shadow(0 10px 14px rgba(0,0,0,.3));animation:pp-apparait .35s ease-out both;}
.pp-apercu .pp-cligne{position:absolute;top:0;height:calc(100% - 8px);left:50%;translate:-50% 0;opacity:0;animation:pp-cligne 4.8s steps(1,end) 1.2s infinite;}
@keyframes pp-cligne{0%{opacity:0;}95%{opacity:1;}97.5%{opacity:0;}}
@keyframes pp-apparait{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion: reduce){.pp-apercu img{animation:none;}.pp-apercu .pp-cligne{display:none;}}
.pp-halo{position:absolute;left:50%;top:6%;width:min(78%,300px);aspect-ratio:1;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(255,178,74,.42) 0%,rgba(255,150,40,.16) 42%,rgba(255,150,40,0) 70%);}
.pp-sol{position:absolute;left:50%;bottom:0;z-index:1;width:min(92%,360px);height:34px;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(ellipse,rgba(255,186,90,.62) 0%,rgba(255,160,60,.22) 45%,rgba(255,160,60,0) 72%);}
.pp-etincelles{position:absolute;inset:0;z-index:1;pointer-events:none;}
.pp-etincelles::before,.pp-etincelles::after{content:"";position:absolute;width:4px;height:4px;border-radius:50%;background:#FFD58A;box-shadow:0 0 6px 2px rgba(255,190,90,.55);}
.pp-etincelles::before{left:19%;top:24%;box-shadow:0 0 6px 2px rgba(255,190,90,.55),205px -14px 0 -1px #FFD58A,22px 92px 0 -1px #FFC86A,228px 70px 0 0 #FFC86A,58px 150px 0 -1.5px #FFE0A6;}
.pp-etincelles::after{right:21%;top:62%;width:3px;height:3px;box-shadow:0 0 5px 2px rgba(255,190,90,.5),-150px -110px 0 0 #FFE0A6,-40px 40px 0 0 #FFD58A;}
@media (prefers-reduced-motion: no-preference){.pp-etincelles{animation:pp-scintille 3.2s ease-in-out infinite alternate;}}
@keyframes pp-scintille{from{opacity:.55;}to{opacity:1;}}
.pp-nom{margin:8px 0 0;font-size:19px;font-weight:600;}
.pp-style{margin:2px 0 0;font-family:var(--leger);font-weight:400;font-size:15px;color:#ECD7BE;}
.pp-rangee-bloc{position:relative;margin:12px -16px 0;}
.pp-rangee{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:6px calc(50% - 46px) 4px;outline:none;touch-action:pan-x;overscroll-behavior-x:contain;}
.pp-rangee::-webkit-scrollbar{display:none;}
.pp-vignette{flex:none;display:grid;justify-items:center;gap:6px;width:92px;scroll-snap-align:center;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;cursor:pointer;}
.pp-rond{position:relative;display:block;width:86px;height:86px;border-radius:50%;
  background:radial-gradient(circle at 50% 38%,#6a4426,#33200f);border:1px solid rgba(246,190,110,.35);}
.pp-rond img{display:block;width:100%;height:100%;max-width:none;border-radius:50%;object-fit:cover;object-position:50% 8%;}
.pp-vignette.on .pp-rond{border:3px solid #F6B54B;box-shadow:0 0 20px rgba(246,181,75,.5);}
.pp-coche{position:absolute;right:-3px;bottom:-1px;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#F5B544;}
.pp-coche svg{width:16px;height:16px;fill:none;stroke:#2A1608;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}
.pp-v-nom{font-family:var(--leger);font-size:13px;font-weight:500;white-space:nowrap;}
.pp-fleche{position:absolute;top:30px;z-index:2;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid rgba(246,190,110,.35);
  background:rgba(36,21,11,.88);color:#FFF4E6;cursor:pointer;}
.pp-fleche.g{left:10px;}.pp-fleche.d{right:10px;}
.pp-fleche svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.pp-compte{margin:10px 0 0;font-size:15px;font-weight:600;color:#ECD9C3;}
.pp-glisse{margin:2px 0 0;font-family:var(--leger);font-weight:400;font-size:13.5px;color:#CDB394;}
.pp-actions{flex:none;display:grid;gap:8px;justify-items:center;padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));}
.pp-principal{width:100%;max-width:340px;height:50px;border:0;border-radius:999px;background:linear-gradient(180deg,#FAC863,#F2AA3E);color:#2A1608;
  font:inherit;font-size:17px;font-weight:600;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,236,190,.6),0 6px 24px rgba(242,160,60,.34),0 2px 6px rgba(0,0,0,.28);}
.pp-principal:disabled{opacity:.7;cursor:progress;}
.pp-second{width:100%;max-width:340px;height:48px;border-radius:999px;border:1.2px solid rgba(246,200,140,.55);background:rgba(36,21,11,.25);color:#FFF4E6;font-family:var(--leger);font-size:16.5px;font-weight:500;cursor:pointer;}
.pp-lien{min-height:36px;padding:0 8px;border:0;background:none;color:#F6E8D6;font-family:var(--leger);font-size:16px;font-weight:500;text-decoration:underline;text-underline-offset:4px;cursor:pointer;}
.pp-info{display:flex;align-items:center;gap:8px;margin:0;font-family:var(--leger);font-weight:400;font-size:13.5px;color:#DCC6A8;}
.pp-info i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1.2px solid currentColor;font-family:var(--font-clikme),system-ui,sans-serif;font-style:normal;font-size:11px;font-weight:600;}
.pp-carte{display:flex;gap:14px;align-items:center;margin:14px 0 0;padding:10px;border-radius:20px;border:1px solid rgba(246,190,110,.35);background:rgba(36,21,11,.35);text-align:left;}
.pp-carte img{flex:none;width:36%;aspect-ratio:1.45;object-fit:cover;object-position:50% 47%;border-radius:12px;max-width:none;}
.pp-carte > div{min-width:0;}
.pp-carte b{display:block;font-size:17px;font-weight:600;line-height:1.28;}
.pp-statut{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-top:8px;padding:5px 12px;border-radius:999px;border:1px solid rgba(246,190,110,.35);font-family:var(--leger);font-weight:400;font-size:14px;color:#ECD9C3;}
.pp-statut svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;}
.pp-erreur{margin:10px 0 0;padding:8px 12px;border-radius:12px;background:rgba(220,70,60,.18);color:#FFD6CF;font-size:14px;}
.pp-annonce{position:absolute;left:50%;top:calc(var(--ap-encoche,0px) + 16px);z-index:1300;display:flex;align-items:center;gap:8px;transform:translateX(-50%);padding:8px 16px;
  border-radius:999px;background:#FFF4E6;color:#2A1608;font-family:var(--font-clikme),system-ui,sans-serif;font-size:14.5px;font-weight:600;white-space:nowrap;
  box-shadow:0 8px 20px rgba(0,0,0,.35);animation:pp-annonce 2.6s ease both;pointer-events:none;}
.pp-annonce.alcove{top:calc(124px + env(safe-area-inset-top,0px));padding:6px 14px;font-size:13.5px;}
@media (max-height:640px){.pp-annonce.alcove{top:calc(98px + env(safe-area-inset-top,0px));}}
.pp-annonce-f{width:34px;height:auto;max-width:none;animation:pp-pose .8s cubic-bezier(.2,.8,.3,1) both;}
@keyframes pp-annonce{0%{opacity:0;transform:translate(-50%,-8px);}10%,85%{opacity:1;transform:translate(-50%,0);}100%{opacity:0;}}
@keyframes pp-pose{0%{opacity:0;transform:translateY(-14px);}60%{opacity:1;transform:translateY(2px);}100%{transform:none;}}
@media (prefers-reduced-motion: reduce){.pp-annonce,.pp-annonce-f{animation:none;}}
@media (max-height:640px){
  .pp-panneau{height:94%;border-radius:24px 24px 0 0;}
  .pp-defile{padding-top:18px;}
  .pp h2{padding:0 30px;font-size:clamp(18px,6vw,24px);}
  .pp-sous{font-size:14px;}
  .pp-note{margin-top:1px;font-size:12px;}
  .pp-apercu{height:clamp(70px,14vh,96px);margin-top:4px;}
  .pp-nom{margin-top:2px;font-size:16px;}
  .pp-style{font-size:12.5px;}
  .pp-rangee-bloc{margin-top:4px;}
  .pp-rangee{gap:10px;padding:4px calc(50% - 34px) 2px;}
  .pp-vignette{width:68px;gap:3px;}
  .pp-rond{width:60px;height:60px;}
  .pp-coche{width:20px;height:20px;}
  .pp-coche svg{width:12px;height:12px;}
  .pp-v-nom{font-size:11px;}
  .pp-fleche{top:18px;width:34px;height:34px;}
  .pp-compte{margin-top:2px;font-size:13px;}
  .pp-glisse{font-size:11.5px;}
  .pp-actions{gap:4px;padding-top:6px;}
  .pp-principal{height:44px;font-size:16px;}
  .pp-second{height:42px;font-size:15px;}
  .pp-lien{min-height:30px;font-size:14.5px;}
  .pp-info{font-size:11.5px;}
  .pp-carte{margin-top:6px;padding:8px;}
  .pp-carte b{font-size:14.5px;}
  .pp-statut{margin-top:4px;padding:3px 9px;font-size:12px;}
  .pp-carte{gap:10px;}
}
`,
      }}
    />
  );
}
