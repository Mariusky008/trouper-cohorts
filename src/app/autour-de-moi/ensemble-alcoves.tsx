"use client";

// 🛋️ ENSEMBLE, EN ALCÔVES — un salon plein écran à la fois.
//
// « Une découverte. Une conversation. » La première fois, sans aucun salon,
// l'accueil. Ensuite, un carrousel : on glisse d'un salon à l'autre, chacun
// dans son coin fixe — rien ne bouge en profondeur. Par défaut, les salons
// publics à découvrir ; « Mes salons ▾ » et « Salons publics ▾ » ouvrent leur
// liste, et toucher une ligne affiche directement sa scène.
//
// LES DROITS SONT CEUX DU SERVEUR. Lire un salon public ne fait pas entrer :
// on y entre en choisissant son fantôme et en appuyant sur « Rejoindre ce
// salon » (voir `prendre-place.tsx`). Une invitation se décide dans la liste,
// sans rien montrer du salon avant d'avoir accepté.
//
// RIEN N'EST INVENTÉ : les fantômes assis sont de vrais participants, la
// phrase sous le titre est un fait (non-lus, vote attendu, salon lancé) ou le
// dernier message, et la place libre « Ta place ? » est une invitation à
// s'asseoir, pas une capacité.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alcove, DECORS, decorDe, imageAssis, imagesDuDecor, type AlcoveData } from "./alcove";
import { abonnerInstallation, installationAJouer, installationJouee } from "./prendre-place";
import { abonnerLook, monLook } from "@/lib/direct/look";

/** Une invitation à mon nom, ou ma demande d'entrée en attente : seulement le titre. */
export type InvitationListe = { cle: string; titre: string; prive: boolean; par: string; demande?: boolean };

/** L'ALCÔVE À L'ÉCRAN : la clé stable de sa scène (elle ne change pas quand on rejoint). */
export const sceneDe = (a: AlcoveData) => a.scene ?? a.cle;

// GARDÉS D'UNE VISITE DE L'ONGLET À L'AUTRE : on revient sur le même salon.
/**
 * L'ACCUEIL SE MONTRE UNE FOIS PAR TÉLÉPHONE, la toute première fois qu'on
 * ouvre Ensemble — qu'on ait déjà des salons ou non (« quand j'appuie pour la
 * première fois sur Ensemble, je n'ai pas le premier écran »).
 */
const CLE_ACCUEIL = "clikme-ensemble-accueil-vu-v1";
let accueilPasse = false;
function accueilDejaVu() {
  if (accueilPasse) return true;
  try {
    accueilPasse = window.localStorage.getItem(CLE_ACCUEIL) === "1";
  } catch {
    /* stockage refusé : l'accueil vaut pour la visite */
  }
  return accueilPasse;
}
function accueilVu() {
  accueilPasse = true;
  try {
    window.localStorage.setItem(CLE_ACCUEIL, "1");
  } catch {
    /* rien */
  }
}
let sourceGardee: "publics" | "miens" | null = null;
let sceneGardee: string | null = null;

/**
 * APRÈS UNE CRÉATION DEPUIS LE FANTÔME : on revient sur l'alcôve du salon
 * créé (dès qu'il apparaît dans mes salons), avec « Ton salon est prêt ».
 */
let aMontrer: string | null = null;
const abonnesMontrer = new Set<() => void>();
export function montrerSalonPret(cle: string) {
  aMontrer = cle;
  sourceGardee = "miens";
  abonnesMontrer.forEach((f) => f());
}
const abonnerMontrer = (f: () => void) => {
  abonnesMontrer.add(f);
  return () => void abonnesMontrer.delete(f);
};

const FOND = "/direct/ensemble/scene-canape-vert.webp";
const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

// La page est-elle à l'écran ? Cachée, plus rien ne s'anime.
const abonnerVisibilite = (f: () => void) => {
  document.addEventListener("visibilitychange", f);
  return () => document.removeEventListener("visibilitychange", f);
};
const visible = () => document.visibilityState !== "hidden";

export function EnsembleAlcoves({
  ville,
  miens,
  publics,
  invitations,
  onRepondre,
  onVoir,
  onPlace,
  onInviter,
  onIdee,
  onWhatsApp,
  onCopierLien,
}: {
  /** Les invitations existantes : WhatsApp, et le lien copié. */
  onWhatsApp?: (cle: string) => void;
  onCopierLien?: (cle: string) => void;
  ville: string;
  /** Les salons dont je suis membre, dans l'ordre gardé. */
  miens: AlcoveData[];
  /** Les salons publics à découvrir (et ceux rejoints pendant la visite, à leur place). */
  publics: AlcoveData[];
  invitations: InvitationListe[];
  onRepondre: (cle: string, oui: boolean) => Promise<string | null>;
  /** Ouvre la conversation : la mienne, ou un salon public en lecture. */
  onVoir: (a: AlcoveData) => void;
  /** « Ta place ? » : choisir son fantôme, puis rejoindre. */
  onPlace: (a: AlcoveData) => void;
  onInviter: (a: AlcoveData) => void;
  onIdee: () => void;
}) {
  // LA PIÈCE SE CHARGE DÈS L'ARRIVÉE (et pendant l'accueil) : la scène ne
  // s'ouvre jamais sur un fond vide.
  // Seulement les premières scènes de chaque liste : les autres se chargent
  // pendant qu'on glisse (la voisine est toujours dessinée d'avance).
  const premieres = [...publics.slice(0, 2), ...miens.slice(0, 2)].map(sceneDe).join("|");
  useEffect(() => {
    const urls = new Set([monLook().image, ...premieres.split("|").filter(Boolean).flatMap(imagesDuDecor)]);
    for (const u of urls) {
      const i = new Image();
      i.src = u;
    }
  }, [premieres]);
  const [accueil, setAccueil] = useState(() => typeof window !== "undefined" && !accueilDejaVu());
  const [source, setSource] = useState<"publics" | "miens">(() => sourceGardee ?? (publics.length || !miens.length ? "publics" : "miens"));
  const [scene, setScene] = useState<string | null>(sceneGardee);
  const [liste, setListe] = useState<"" | "miens" | "publics">("");
  // « TON SALON EST PRÊT » : le salon que je viens de créer, et la feuille d'invitation.
  const [pret, setPret] = useState<string | null>(null);
  const [inviter, setInviter] = useState<string | null>(null);
  const aOuvrir = useSyncExternalStore(abonnerMontrer, () => aMontrer, () => null);
  // Le salon créé n'arrive dans « mes salons » qu'après la synchronisation :
  // on attend qu'il y soit pour y aller (un abonnement extérieur, d'où l'effet).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!aOuvrir) return;
    const a = miens.find((x) => x.cle === aOuvrir);
    if (!a) return;
    aMontrer = null;
    accueilVu();
    setAccueil(false);
    setListe("");
    setSource("miens");
    setScene(sceneDe(a));
    setPret(a.cle);
  }, [aOuvrir, miens]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    sourceGardee = source;
    sceneGardee = scene;
  }, [source, scene]);

  if (accueil)
    return (
      <Accueil
        onDecouvrir={() => {
          accueilVu();
          setAccueil(false);
        }}
      />
    );

  const salons = source === "publics" ? publics : miens;
  const trouve = salons.findIndex((a) => sceneDe(a) === scene);
  const idx = trouve >= 0 ? trouve : 0;
  const nonLus = miens.filter((a) => a.nonLus > 0).length + invitations.filter((x) => !x.demande).length;

  const montrer = (src: "publics" | "miens", a: AlcoveData) => {
    setSource(src);
    setScene(sceneDe(a));
    setListe("");
  };

  return (
    <div className="ea">
      <StylesEnsembleAlcoves />
      <Carrousel
        key={source}
        salons={salons}
        idx={idx}
        onActif={(a) => setScene(sceneDe(a))}
        onVoir={onVoir}
        onPlace={onPlace}
        onInviter={(a) => (onWhatsApp || onCopierLien ? setInviter(a.cle) : onInviter(a))}
        pret={pret}
        vide={
          <Vide
            source={source}
            ville={ville}
            onIdee={onIdee}
            onAutre={() => setSource(source === "publics" ? "miens" : "publics")}
            autres={source === "publics" ? miens.length : publics.length}
          />
        }
      />
      <header className="ea-tete">
        <h1>Ensemble</h1>
        <div className="ea-boutons">
          <button type="button" className={source === "miens" ? "on" : ""} aria-haspopup="dialog" onClick={() => setListe("miens")}>
            <IconeListe />
            Mes salons
            {nonLus > 0 && (
              <i className="ea-point" aria-label={`${nonLus} avec du nouveau`}>
                {nonLus}
              </i>
            )}
            <IconeChevronBas />
          </button>
          <button type="button" className={source === "publics" ? "on" : ""} aria-haspopup="dialog" onClick={() => setListe("publics")}>
            <IconeListe />
            Salons publics
            <IconeChevronBas />
          </button>
        </div>
        <p className="ea-ville">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
          Les discussions de {ville}
        </p>
      </header>
      {inviter && (
        <FeuilleInviter
          onWhatsApp={() => onWhatsApp?.(inviter)}
          onCopier={() => onCopierLien?.(inviter)}
          onFermer={() => setInviter(null)}
        />
      )}
      {liste && (
        <FeuilleListe
          quoi={liste}
          ville={ville}
          miens={miens}
          publics={publics}
          invitations={invitations}
          onRepondre={onRepondre}
          onFermer={() => setListe("")}
          onChoisir={montrer}
        />
      )}
    </div>
  );
}

/* ═══ L'ACCUEIL (image 1) ═══════════════════════════════════════════════ */

/**
 * LA SALLE D'ACCUEIL, dans les coordonnées de son image (941 × 1672) : le
 * tabouret est au sol vers (680, 1352). Le fantôme apporte son propre
 * tabouret ; on le pose exactement sur celui de la salle, un peu plus large
 * pour le couvrir.
 */
const ACCUEIL = {
  salle: "/direct/ensemble/accueil-salle.webp",
  fantome: "/direct/ensemble/flaneur-tabouret.webp",
  cligne: "/direct/ensemble/flaneur-tabouret-cligne.webp",
  l: 941,
  h: 1672,
  tabouret: { x: 680, sol: 1352 },
  /** Largeur de l'image du fantôme (882 × 1100) dans la salle, et le centre de son tabouret. */
  largeur: 470,
  r: 882 / 1100,
  centre: 0.445,
};

function Accueil({ onDecouvrir }: { onDecouvrir: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState({ W: 0, H: 0 });
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setT({ W: e.clientWidth, H: e.clientHeight }));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  const s = Math.max(t.W / ACCUEIL.l, t.H / ACCUEIL.h);
  const ox = (ACCUEIL.l * s - t.W) / 2;
  const lf = ACCUEIL.largeur * s;
  const hf = lf / ACCUEIL.r;
  return (
    <div className="ea ea-accueil" ref={ref}>
      <StylesEnsembleAlcoves />
      {t.W > 0 && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ea-calque" src={ACCUEIL.salle} alt="" aria-hidden="true" style={{ left: -ox, top: 0, width: ACCUEIL.l * s, height: ACCUEIL.h * s }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ea-accueil-fantome"
            src={ACCUEIL.fantome}
            alt=""
            aria-hidden="true"
            style={{ left: ACCUEIL.tabouret.x * s - ox - lf * ACCUEIL.centre, top: ACCUEIL.tabouret.sol * s - hf, width: lf, height: hf }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ea-accueil-fantome ea-cligne"
            src={ACCUEIL.cligne}
            alt=""
            aria-hidden="true"
            style={{ left: ACCUEIL.tabouret.x * s - ox - lf * ACCUEIL.centre, top: ACCUEIL.tabouret.sol * s - hf, width: lf, height: hf }}
          />
        </>
      )}
      <i className="ea-voile-accueil" aria-hidden="true" />
      <div className="ea-accueil-haut">
        <p className="ea-logo">
          Clikme
          <i aria-hidden="true" />
        </p>
        <p className="ea-bienvenue">Bienvenue dans Ensemble</p>
        <h1>
          Une découverte.
          <br />
          Une conversation.
        </h1>
        <p className="ea-accueil-texte">
          Partage un essai, un resto ou une sortie depuis Le Direct. Retrouve ici vos discussions, en privé ou en public.
        </p>
      </div>
      <button type="button" className="ea-cta ea-accueil-cta" data-garde-bulle onClick={onDecouvrir}>
        Découvrir les discussions <s aria-hidden="true">→</s>
      </button>
    </div>
  );
}

/* ═══ LE CARROUSEL (image 4) ════════════════════════════════════════════ */

function Carrousel({
  salons,
  idx,
  onActif,
  onVoir,
  onPlace,
  onInviter,
  vide,
  pret = null,
}: {
  pret?: string | null;
  salons: AlcoveData[];
  idx: number;
  onActif: (a: AlcoveData) => void;
  onVoir: (a: AlcoveData) => void;
  onPlace: (a: AlcoveData) => void;
  onInviter: (a: AlcoveData) => void;
  vide: React.ReactNode;
}) {
  const piste = useRef<HTMLDivElement | null>(null);
  const enVue = useSyncExternalStore(abonnerVisibilite, visible, () => true);
  // L'INSTALLATION À JOUER (après une adhésion confirmée) : relue à chaque annonce.
  useSyncExternalStore(abonnerInstallation, () => installationAJouer(salons[idx]?.cle ?? "") !== null, () => false);
  useSyncExternalStore(abonnerLook, monLook, monLook);
  const n = salons.length;
  const a = salons[idx];
  const installe = Boolean(a && installationAJouer(a.cle));

  // LA PISTE SUIT L'INDEX choisi ailleurs (une ligne de liste, une flèche).
  useLayoutEffect(() => {
    const p = piste.current;
    if (!p || !p.clientWidth) return;
    const x = idx * p.clientWidth;
    if (Math.abs(p.scrollLeft - x) > 2) p.scrollLeft = x;
  }, [idx, n]);

  // UNE FOIS JOUÉE, l'installation ne revient plus.
  useEffect(() => {
    if (!a || !installe) return;
    const t = window.setTimeout(() => installationJouee(a.cle), reduit() ? 0 : 950);
    return () => window.clearTimeout(t);
  }, [a, installe]);

  // L'INDEX SUIT LA PISTE quand le glissement s'arrête.
  const fin = useRef<number | undefined>(undefined);
  const auDefilement = () => {
    window.clearTimeout(fin.current);
    fin.current = window.setTimeout(() => {
      const p = piste.current;
      if (!p || !p.clientWidth) return;
      const k = Math.max(0, Math.min(n - 1, Math.round(p.scrollLeft / p.clientWidth)));
      if (k !== idx && salons[k]) onActif(salons[k]);
    }, 90);
  };
  const aller = (k: number) => {
    const p = piste.current;
    if (!p || k < 0 || k >= n) return;
    p.scrollTo({ left: k * p.clientWidth, behavior: reduit() ? "auto" : "smooth" });
  };

  if (!n) return <div className="ea-piste ea-piste-vide">{vide}</div>;

  return (
    <>
      <div
        className="ea-piste"
        ref={piste}
        onScroll={auDefilement}
        tabIndex={0}
        aria-roledescription="carrousel"
        aria-label="Les salons"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") aller(idx + 1);
          else if (e.key === "ArrowLeft") aller(idx - 1);
          else return;
          e.preventDefault();
        }}
      >
        {salons.map((s, k) => (
          <section
            key={sceneDe(s)}
            className="ea-scene"
            aria-roledescription="salon"
            aria-label={`${s.titre}, ${k + 1} sur ${n}`}
            aria-hidden={k !== idx}
          >
            {/* SEULES LES SCÈNES VOISINES SONT DESSINÉES ; seule l'active s'anime. */}
            {Math.abs(k - idx) <= 1 && (
              <>
                <Alcove a={s} actif={k === idx && enVue} installe={k === idx && installe} onPlaceLibre={() => onPlace(s)} />
                <BasDeScene a={s} pret={pret === s.cle} onVoir={() => onVoir(s)} onInviter={() => onInviter(s)} />
              </>
            )}
          </section>
        ))}
      </div>
      {n > 1 && (
        <>
          <p className="ea-compteur" aria-live="polite">
            {idx + 1} / {n}
          </p>
          <button type="button" className="ea-fleche gauche" aria-label="Salon précédent" disabled={idx === 0} onClick={() => aller(idx - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14.5 6-6 6 6 6" />
            </svg>
          </button>
          <button type="button" className="ea-fleche droite" aria-label="Salon suivant" disabled={idx === n - 1} onClick={() => aller(idx + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" />
            </svg>
          </button>
          <p className="ea-glisse" aria-hidden="true">
            Glisse pour découvrir un autre salon <s>↔</s>
          </p>
        </>
      )}
    </>
  );
}

/** LE BAS DE LA SCÈNE : statut, titre, la phrase vraie, et le bouton. */
function BasDeScene({ a, pret, onVoir, onInviter }: { a: AlcoveData; pret: boolean; onVoir: () => void; onInviter: () => void }) {
  const seul = pret || (a.membre && a.nb <= 1 && a.autres.length === 0);
  const auteur = a.dernier ? (a.dernier.qui === "Toi" ? "moi" : { cle: a.dernier.qui, qui: a.dernier.qui, look: a.dernier.look }) : null;
  return (
    <div className="ea-bas">
      <p className="ea-statut">
        {a.prive ? <IconeCadenas /> : <IconeGens />}
        <b>{a.prive ? "Privé" : "Public"}</b> · {pluriel(a.nb, "participant")}
      </p>
      <h2>{a.titre}</h2>
      {pret || a.phrase ? (
        <p className="ea-phrase">
          <i aria-hidden="true" />
          {pret ? "Ton salon est prêt" : a.phrase}
        </p>
      ) : (
        a.dernier &&
        auteur && (
          <p className="ea-dernier">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageAssis(auteur, sceneDe(a)).src} alt="" aria-hidden="true" />
            <span>
              <b>{a.dernier.qui} :</b> {a.dernier.texte}
            </span>
          </p>
        )
      )}
      {seul && (
        <button type="button" className="ea-inviter" onClick={onInviter}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Inviter quelqu’un
        </button>
      )}
      <button type="button" className="ea-cta" data-garde-bulle onClick={onVoir}>
        {pret ? "Ouvrir la discussion" : a.membre ? "Entrer dans la discussion" : "Voir la discussion"} <s aria-hidden="true">→</s>
      </button>
    </div>
  );
}

function Vide({
  source,
  ville,
  autres,
  onIdee,
  onAutre,
}: {
  source: "publics" | "miens";
  ville: string;
  autres: number;
  onIdee: () => void;
  onAutre: () => void;
}) {
  return (
    <section className="ea-scene ea-vide">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ea-fond" src={FOND} alt="" aria-hidden="true" />
      <div className="ea-bas">
        <h2>{source === "publics" ? `Aucun salon public à ${ville} pour l’instant.` : "Tu n’as pas encore de salon."}</h2>
        <p className="ea-vide-texte">Partage un essai, un resto ou une sortie depuis Le Direct : la discussion s’ouvre ici.</p>
        {autres > 0 && (
          <button type="button" className="ea-inviter" onClick={onAutre}>
            {source === "publics" ? "Voir mes salons" : "Voir les salons publics"}
          </button>
        )}
        <button type="button" className="ea-cta" data-garde-bulle onClick={onIdee}>
          Trouver une idée à partager <s aria-hidden="true">→</s>
        </button>
      </div>
    </section>
  );
}

/**
 * INVITER QUELQU'UN : les invitations qui existent déjà — WhatsApp, ou le lien
 * copié. Celui qui reçoit le lien entre dans CE salon, et dans aucun autre.
 */
function FeuilleInviter({ onWhatsApp, onCopier, onFermer }: { onWhatsApp: () => void; onCopier: () => void; onFermer: () => void }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="ea-feuille" role="dialog" aria-modal="true" aria-label="Inviter quelqu’un">
      <button type="button" className="ea-feuille-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="ea-feuille-corps ea-inviter-corps">
        <i className="ea-poignee" aria-hidden="true" />
        <div className="ea-feuille-tete">
          <div>
            <h2>Inviter quelqu’un</h2>
            <p>Ceux qui reçoivent le lien entrent dans ce salon, et seulement celui-ci.</p>
          </div>
          <button type="button" className="ea-x" aria-label="Fermer" onClick={onFermer}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="ea-inviter-actions">
          <button type="button" className="ea-cta" onClick={onWhatsApp}>
            Inviter sur WhatsApp
          </button>
          <button
            type="button"
            className="ea-inviter-lien"
            onClick={() => {
              onCopier();
              setCopie(true);
            }}
          >
            {copie ? "Lien copié ✓" : "Copier le lien d’invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ LES LISTES (images 5 et 6) ════════════════════════════════════════ */

function FeuilleListe({
  quoi,
  ville,
  miens,
  publics,
  invitations,
  onRepondre,
  onFermer,
  onChoisir,
}: {
  quoi: "miens" | "publics";
  ville: string;
  miens: AlcoveData[];
  publics: AlcoveData[];
  invitations: InvitationListe[];
  onRepondre: (cle: string, oui: boolean) => Promise<string | null>;
  onFermer: () => void;
  onChoisir: (src: "publics" | "miens", a: AlcoveData) => void;
}) {
  const [q, setQ] = useState("");
  const [mot, setMot] = useState("");
  const [enCours, setEnCours] = useState("");
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onFermer]);
  const cherche = q.trim().toLowerCase();
  const garde = (t: string) => !cherche || t.toLowerCase().includes(cherche);
  // SALONS PUBLICS : ceux à découvrir, puis mes salons publics, marqués « Déjà rejoint ».
  const scenesPubliques = new Set(publics.map(sceneDe));
  const lignesPubliques: { a: AlcoveData; src: "publics" | "miens" }[] = [
    ...publics.map((a) => ({ a, src: "publics" as const })),
    ...miens.filter((a) => !a.prive && !scenesPubliques.has(sceneDe(a))).map((a) => ({ a, src: "miens" as const })),
  ].filter((l) => garde(l.a.titre));
  const lesInvitations = invitations.filter((x) => garde(x.titre));
  const lesMiens = miens.filter((a) => garde(a.titre));
  const repondre = async (cle: string, oui: boolean) => {
    if (enCours) return;
    setEnCours(cle);
    setMot((await onRepondre(cle, oui)) ?? "");
    setEnCours("");
  };
  return (
    <div className="ea-feuille" role="dialog" aria-modal="true" aria-label={quoi === "miens" ? "Mes salons" : "Salons publics"}>
      <button type="button" className="ea-feuille-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="ea-feuille-corps">
        <i className="ea-poignee" aria-hidden="true" />
        <div className="ea-feuille-tete">
          <div>
            <h2>{quoi === "miens" ? "Mes salons" : "Salons publics"}</h2>
            <p>{quoi === "miens" ? pluriel(miens.length, "discussion") : `Les discussions ouvertes à ${ville}`}</p>
          </div>
          <button type="button" className="ea-x" aria-label="Fermer" onClick={onFermer}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <label className="ea-chercher">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={quoi === "miens" ? "Rechercher un salon" : "Rechercher un sujet"} aria-label="Rechercher" />
        </label>
        <div className="ea-feuille-defile">
          <p className="ea-aide">Choisis un salon pour afficher sa scène.</p>
          {quoi === "miens" ? (
            <>
              {lesInvitations.length > 0 && (
                <>
                  <h3>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                    </svg>
                    Invitations
                  </h3>
                  {lesInvitations.map((x) => (
                    <div key={x.cle} className="ea-ligne ea-invitation">
                      <Vignette />
                      <span className="ea-ligne-t">
                        <b>{x.titre}</b>
                        <em>
                          {x.prive ? <IconeCadenas /> : <IconeGlobe />}
                          {x.prive ? "Privé" : "Public"}
                        </em>
                        <span>{x.demande ? "Ta demande attend la réponse du créateur." : `Invitation de ${x.par}`}</span>
                        {!x.demande && (
                          <span className="ea-invit-boutons">
                            <button type="button" className="oui" disabled={Boolean(enCours)} onClick={() => void repondre(x.cle, true)}>
                              Accepter
                            </button>
                            <button type="button" className="non" disabled={Boolean(enCours)} onClick={() => void repondre(x.cle, false)}>
                              Refuser
                            </button>
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {mot && (
                    <p className="ea-aide" role="status">
                      {mot}
                    </p>
                  )}
                </>
              )}
              <h3>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
                Récents
              </h3>
              {lesMiens.length === 0 && <p className="ea-aide">{cherche ? "Aucun salon ne correspond." : "Tu n’as pas encore de salon."}</p>}
              {lesMiens.map((a) => (
                <Ligne key={sceneDe(a)} a={a} onChoisir={() => onChoisir("miens", a)} />
              ))}
            </>
          ) : (
            <>
              {lignesPubliques.length === 0 && <p className="ea-aide">{cherche ? "Aucun sujet ne correspond." : `Aucun salon public à ${ville} pour l’instant.`}</p>}
              {lignesPubliques.map((l) => (
                <Ligne key={sceneDe(l.a)} a={l.a} rejoint={l.a.membre} onChoisir={() => onChoisir(l.src, l.a)} />
              ))}
              <p className="ea-pied">Lire un salon ne t’inscrit pas.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Ligne({ a, rejoint, onChoisir }: { a: AlcoveData; rejoint?: boolean; onChoisir: () => void }) {
  return (
    <button type="button" className="ea-ligne" onClick={onChoisir}>
      <Vignette a={a} />
      <span className="ea-ligne-t">
        <b>{a.titre}</b>
        <em>
          {a.prive ? <IconeCadenas /> : <IconeGlobe />}
          <span className="ea-meta">
            {a.prive ? "Privé" : "Public"} · {pluriel(a.nb, "participant")}
          </span>
          {rejoint && <i className="ea-rejoint">Déjà rejoint</i>}
        </em>
        {a.phrase ? <span className="ea-phrase-ligne">{a.phrase}</span> : a.dernier && <span>{`${a.dernier.qui} : ${a.dernier.texte}`}</span>}
      </span>
      {!rejoint && a.nonLus > 0 && (
        <i className="ea-badge" aria-label={pluriel(a.nonLus, "nouveau message")}>
          {a.nonLus > 99 ? "99+" : a.nonLus}
        </i>
      )}
      <svg className="ea-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9.5 6 6 6-6 6" />
      </svg>
    </button>
  );
}

/** LA VIGNETTE : le coin du décor et deux fantômes assis. Sans salon (une invitation), le décor seul. */
function Vignette({ a }: { a?: AlcoveData }) {
  const assis = a ? [...(a.membre ? (["moi"] as const) : []), ...a.autres].slice(0, 2) : [];
  // LE COIN DU DÉCOR DE CE SALON, cadré sur sa banquette.
  const D = a ? decorDe(sceneDe(a)) : DECORS[0];
  return (
    <span className="ea-vignette" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ea-vignette-fond" src={D.fond} alt="" style={{ objectPosition: `50% ${Math.round((D.bas / D.h) * 100) - 4}%` }} />
      {assis.map((x, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k} className={`ea-vignette-f f${k}`} src={imageAssis(x, sceneDe(a!)).src} alt="" />
      ))}
    </span>
  );
}

/* ═══ LES ICÔNES ════════════════════════════════════════════════════════ */

const IconeListe = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </svg>
);
const IconeChevronBas = () => (
  <svg className="ea-chevron-bas" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);
const IconeCadenas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);
const IconeGlobe = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
  </svg>
);
const IconeGens = () => (
  <svg className="plein" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8.5" cy="8" r="3.2" />
    <circle cx="16" cy="8.5" r="2.8" />
    <path d="M2.5 19c.5-3.6 3-5.6 6-5.6s5.5 2 6 5.6zM14.6 13.6c3-.4 6 1.2 6.9 5.4h-5.2c-.3-2-1-3.9-1.7-5.4z" />
  </svg>
);

function StylesEnsembleAlcoves() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ea{position:absolute;inset:0;overflow:hidden;background:#24150b;color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;-webkit-tap-highlight-color:transparent;
  --leger:var(--font-clikme-leger),var(--font-clikme),system-ui,sans-serif;}
.ea-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;max-width:none;}
.ea svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.ea svg.plein{fill:currentColor;stroke:none;}
.ea-cta{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:46px;border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#FAC863 0%,#F2AA3E 100%);color:#2A1608;font:inherit;font-size:16.5px;font-weight:600;letter-spacing:.005em;
  box-shadow:inset 0 1px 0 rgba(255,236,190,.6),0 6px 24px rgba(242,160,60,.34),0 2px 6px rgba(0,0,0,.28);}
.ea-cta s{text-decoration:none;font-size:19px;}

.ea-accueil{display:flex;flex-direction:column;}
.ea-voile-accueil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(30,16,7,.66) 0%,rgba(30,16,7,.42) 34%,rgba(30,16,7,0) 54%,rgba(30,16,7,0) 72%,rgba(30,16,7,.5) 90%,rgba(30,16,7,.78) 100%);}
.ea-accueil-haut{position:relative;z-index:2;padding:calc(24px + env(safe-area-inset-top,0px)) 30px 0;}
.ea-logo{position:relative;width:max-content;margin:0 auto;font-size:22px;font-weight:600;letter-spacing:-.01em;}
.ea-logo i{position:absolute;right:-12px;top:-3px;width:10px;height:10px;
  background:linear-gradient(90deg,#F6B54B 0 2px,transparent 2px) 0 4px/10px 2px no-repeat,linear-gradient(#F6B54B,#F6B54B) 4px 0/2px 5px no-repeat,linear-gradient(#F6B54B,#F6B54B) 7px 7px/3px 2px no-repeat;}
.ea-bienvenue{margin:4px 0 0;text-align:center;font-family:var(--leger);font-weight:400;font-size:14.5px;color:#EEDDC8;}
.ea-accueil h1{margin:44px 0 0;font-size:clamp(26px,8.6vw,38px);line-height:1.08;font-weight:600;letter-spacing:-.02em;text-shadow:0 2px 16px rgba(0,0,0,.4);}
.ea-accueil-texte{margin:16px 0 0;max-width:21em;font-family:var(--leger);font-weight:400;font-size:16px;line-height:1.42;color:#F7EADA;text-shadow:0 1px 10px rgba(0,0,0,.45);}
.ea-cligne{opacity:0;animation:ea-cligne 5.5s steps(1,end) 2s infinite;}
@keyframes ea-cligne{0%{opacity:0;}95.5%{opacity:1;}98%{opacity:0;}}
@media (prefers-reduced-motion: reduce){.ea-cligne{display:none;}}
.ea-calque{position:absolute;max-width:none;pointer-events:none;user-select:none;}
.ea-accueil-fantome{position:absolute;z-index:1;max-width:none;pointer-events:none;filter:brightness(.95) sepia(.06) drop-shadow(0 14px 16px rgba(24,10,2,.45));}
.ea-accueil-cta{position:absolute;z-index:2;left:42px;right:42px;bottom:62px;width:auto;height:50px;font-size:17px;}
@media (max-width:360px){.ea-accueil-cta{left:18px;right:18px;font-size:16px;}}
@media (max-height:640px){.ea-accueil h1{margin-top:22px;}.ea-accueil-texte{font-size:14px;}}

.ea-piste{position:absolute;inset:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;outline:none;}
.ea-piste::-webkit-scrollbar{display:none;}
.ea-scene{position:relative;flex:0 0 100%;height:100%;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;}
/* LE LIEU D'ABORD : un voile léger en haut pour l'en-tête, la pénombre seulement en bas, sous le texte. */
.ea-scene::after{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;
  background:linear-gradient(180deg,rgba(28,15,7,.5) 0%,rgba(28,15,7,.14) 15%,rgba(28,15,7,0) 24%,rgba(28,15,7,0) 60%,rgba(26,14,6,.6) 72%,rgba(24,13,6,.9) 86%,rgba(22,12,5,.97) 100%);}
.ea-scene > .al{z-index:1;}
.ea-tete{position:absolute;left:0;right:0;top:0;z-index:20;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 0;pointer-events:none;}
.ea-tete > *{pointer-events:auto;}
.ea-tete h1{margin:0;font-size:30px;font-weight:600;letter-spacing:-.015em;line-height:1.12;text-shadow:0 2px 12px rgba(0,0,0,.4);width:max-content;}
.ea-boutons{display:flex;gap:8px;margin-top:9px;width:max-content;max-width:100%;}
.ea-boutons button{display:flex;align-items:center;gap:7px;height:36px;padding:0 12px;border-radius:999px;cursor:pointer;white-space:nowrap;
  border:1px solid rgba(246,190,110,.5);background:rgba(36,21,11,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  color:#FFF4E6;font-family:var(--leger);font-size:14.5px;font-weight:500;}
.ea-boutons button.on{background:linear-gradient(180deg,rgba(250,200,99,.96),rgba(240,166,58,.96));border-color:rgba(255,226,170,.75);color:#2A1608;
  font-family:var(--font-clikme),system-ui,sans-serif;font-weight:600;box-shadow:0 0 18px rgba(242,166,60,.3);}
.ea-boutons button svg{width:17px;height:17px;flex:none;}
.ea-boutons .ea-chevron-bas{width:14px;height:14px;margin-left:-1px;}
.ea-point{display:grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#F6B54B;color:#2A1608;font-family:var(--font-clikme),system-ui,sans-serif;font-style:normal;font-size:11px;font-weight:600;}
.ea-boutons button.on .ea-point{background:#2A1608;color:#FAC863;}
.ea-ville{display:flex;align-items:center;gap:6px;margin:9px 0 0;width:max-content;font-family:var(--leger);font-weight:400;font-size:14.5px;color:#F6E9D8;text-shadow:0 1px 8px rgba(0,0,0,.6);}
.ea-ville svg{width:16px;height:16px;}
.ea-compteur{position:absolute;z-index:20;left:50%;top:calc(130px + env(safe-area-inset-top,0px));transform:translateX(-50%);margin:0;padding:2px 12px;border-radius:999px;
  border:1px solid rgba(246,190,110,.32);background:rgba(36,21,11,.48);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:13px;font-weight:600;pointer-events:none;}
.ea-fleche{position:absolute;z-index:20;top:calc(146px + env(safe-area-inset-top,0px));display:grid;place-items:center;width:32px;height:32px;padding:0;border-radius:50%;
  border:1px solid rgba(246,190,110,.28);background:rgba(36,21,11,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#FFF4E6;cursor:pointer;}
.ea-fleche svg{width:18px;height:18px;}
.ea-fleche.gauche{left:8px;}
.ea-fleche.droite{right:8px;}
.ea-fleche:disabled{opacity:0;pointer-events:none;}
.ea-glisse{position:absolute;z-index:20;left:0;right:0;bottom:8px;margin:0;text-align:center;font-family:var(--leger);font-weight:400;font-size:12.5px;color:#DCC8B2;pointer-events:none;}
.ea-glisse s{text-decoration:none;margin-left:4px;}

.ea-bas{position:absolute;z-index:6;left:0;right:0;bottom:0;padding:0 20px 34px;}
.ea-piste-vide .ea-bas{padding-bottom:22px;}
.ea-statut{display:flex;align-items:center;gap:6px;margin:0 0 5px;font-family:var(--leger);font-weight:400;font-size:13.5px;color:#EAD8C2;}
.ea-statut b{font-family:var(--font-clikme),system-ui,sans-serif;font-weight:600;color:#FFF4E6;}
.ea-statut svg{width:17px;height:17px;}
.ea-bas h2{margin:0;font-size:26px;line-height:1.16;font-weight:600;letter-spacing:-.012em;text-shadow:0 2px 12px rgba(0,0,0,.4);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;}
.ea-dernier,.ea-phrase{display:flex;align-items:center;gap:10px;margin:10px 0 0;font-family:var(--leger);font-weight:400;font-size:15px;color:#F3E5D3;min-width:0;}
.ea-dernier img{flex:none;width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#F6EEE4;border:1.5px solid rgba(255,244,230,.9);}
.ea-dernier span,.ea-phrase{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ea-dernier b{font-family:var(--font-clikme),system-ui,sans-serif;font-weight:600;color:#FFF6EA;}
.ea-phrase{color:#F8C46A;font-family:var(--font-clikme),system-ui,sans-serif;font-weight:600;font-size:14.5px;}
.ea-phrase i{flex:none;width:8px;height:8px;border-radius:50%;background:#F6B54B;box-shadow:0 0 10px rgba(246,181,75,.7);}
.ea-inviter{display:inline-flex;align-items:center;gap:6px;height:34px;margin:10px 0 0;padding:0 14px;border-radius:999px;cursor:pointer;
  border:1px solid rgba(246,190,110,.6);background:rgba(36,21,11,.4);color:#F8C46A;font-family:var(--leger);font-size:14px;font-weight:500;}
.ea-inviter svg{width:15px;height:15px;}
.ea-bas .ea-cta{margin-top:14px;}
.ea-vide-texte{margin:8px 0 0;font-family:var(--leger);font-weight:400;font-size:15px;line-height:1.42;color:#EAD8C2;}
.ea-vide::after{background:linear-gradient(180deg,rgba(28,15,7,.6),rgba(28,15,7,.15) 30%,rgba(24,13,6,.85) 70%,rgba(22,12,5,.97));}
@media (max-height:640px){
  .ea-tete h1{font-size:25px;}
  .ea-boutons{margin-top:6px;}
  .ea-boutons button{height:32px;padding:0 10px;font-size:13px;gap:5px;}
  .ea-ville{margin-top:5px;font-size:12.5px;}
  .ea-compteur{top:calc(102px + env(safe-area-inset-top,0px));}
  .ea-fleche{top:calc(116px + env(safe-area-inset-top,0px));}
  .ea-bas{padding:0 16px 28px;}
  .ea-bas h2{font-size:21px;}
  .ea-dernier,.ea-phrase{margin-top:6px;font-size:13.5px;}
  .ea-dernier img{width:26px;height:26px;}
  .ea-bas .ea-cta{margin-top:9px;height:42px;font-size:15.5px;}
  .ea-inviter{height:30px;margin-top:7px;}
  .ea-glisse{bottom:5px;font-size:11.5px;}
}
@media (max-width:350px){.ea-boutons button{padding:0 9px;font-size:12.5px;gap:4px;}.ea-boutons button svg{width:15px;height:15px;}}

.ea-feuille{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;}
.ea-feuille-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(18,9,4,.22);cursor:pointer;}
.ea-feuille-corps{position:relative;display:flex;flex-direction:column;height:min(72%,640px);min-height:0;border-radius:30px 30px 0 0;
  border:1.5px solid rgba(246,181,75,.65);border-bottom:0;background:linear-gradient(180deg,#3d2615 0%,#2f1c0f 42%,#26170c 100%);
  box-shadow:0 -12px 40px rgba(0,0,0,.42),0 -2px 22px rgba(246,181,75,.16);animation:ea-monte .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes ea-monte{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
@media (prefers-reduced-motion: reduce){.ea-feuille-corps{animation:none;}}
.ea-poignee{align-self:center;width:40px;height:4px;margin:10px 0 2px;border-radius:9px;background:rgba(255,236,210,.42);}
.ea-feuille-tete{display:flex;align-items:flex-start;gap:12px;padding:6px 18px 0 20px;}
.ea-feuille-tete > div{flex:1;min-width:0;}
.ea-feuille-tete h2{margin:0;font-size:27px;font-weight:600;letter-spacing:-.015em;line-height:1.12;}
.ea-feuille-tete p{margin:3px 0 0;font-family:var(--leger);font-weight:400;font-size:14.5px;color:#DCC8B2;}
.ea-x{flex:none;display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;border:1px solid rgba(246,190,110,.4);background:rgba(36,21,11,.4);color:#FFF4E6;cursor:pointer;}
.ea-x svg{width:19px;height:19px;}
.ea-chercher{display:flex;align-items:center;gap:10px;margin:14px 18px 0;height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(246,190,110,.3);background:rgba(255,240,220,.05);color:#DCC8B2;}
.ea-chercher svg{flex:none;width:18px;height:18px;}
.ea-chercher input{flex:1;min-width:0;height:100%;border:0;background:none;color:#FFF4E6;font-family:var(--leger);font-weight:400;font-size:16px;outline:none;}
.ea-chercher input::placeholder{color:#BFA894;}
.ea-feuille-defile{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 12px calc(16px + env(safe-area-inset-bottom,0px));}
.ea-aide{margin:12px 8px 10px;font-family:var(--leger);font-weight:400;font-size:14px;color:#DCC8B2;}
.ea-feuille-defile h3{display:flex;align-items:center;gap:10px;margin:16px 8px 9px;font-size:16px;font-weight:600;}
.ea-feuille-defile h3 svg{width:19px;height:19px;}
.ea-ligne{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 8px;padding:8px 10px 8px 8px;border-radius:16px;cursor:pointer;text-align:left;
  border:1px solid rgba(246,190,110,.18);background:rgba(255,236,210,.04);color:#FFF4E6;font:inherit;}
.ea-invitation{cursor:default;}
.ea-vignette{position:relative;flex:none;width:80px;height:60px;border-radius:11px;overflow:hidden;background:#3a2414;box-shadow:0 2px 8px rgba(0,0,0,.3);}
.ea-vignette-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 47%;max-width:none;}
.ea-vignette-f{position:absolute;bottom:-4px;width:36px;height:auto;max-width:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4));}
.ea-vignette-f.f0{left:8px;}
.ea-vignette-f.f1{right:8px;transform:scaleX(-1);}
.ea-ligne-t{flex:1;min-width:0;display:grid;grid-template-columns:minmax(0,1fr);gap:2px;}
.ea-meta{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.ea-ligne-t b{font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ea-ligne-t em{display:flex;align-items:center;gap:5px;font-style:normal;font-family:var(--leger);font-weight:400;font-size:13.5px;color:#DCC8B2;white-space:nowrap;min-width:0;}
.ea-ligne-t em svg{width:15px;height:15px;flex:none;}
.ea-ligne-t > span{font-family:var(--leger);font-weight:400;font-size:13.5px;color:#EAD8C2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ea-ligne-t > span.ea-phrase-ligne{font-family:var(--font-clikme),system-ui,sans-serif;color:#F8C46A;font-weight:600;font-size:13px;}
.ea-badge{flex:none;display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#F6B54B;color:#2A1608;font-style:normal;font-size:13px;font-weight:600;box-shadow:0 0 10px rgba(246,181,75,.4);}
.ea-rejoint{flex:none;margin-left:auto;padding:2px 9px;border-radius:999px;border:1.2px solid #F6B54B;color:#F8C46A;font-family:var(--font-clikme),system-ui,sans-serif;font-style:normal;font-size:12px;font-weight:600;white-space:nowrap;}
.ea-chevron{flex:none;width:18px;height:18px;color:#E9D6C2;}
.ea-invit-boutons{display:flex !important;gap:8px;margin-top:6px;overflow:visible !important;}
.ea-invit-boutons button{height:32px;padding:0 14px;border-radius:999px;border:0;cursor:pointer;font:inherit;font-size:13px;font-weight:600;}
.ea-invit-boutons .oui{background:linear-gradient(180deg,#FAC863,#F2AA3E);color:#2A1608;}
.ea-invit-boutons .non{background:rgba(255,244,230,.1);border:1px solid rgba(246,190,110,.3);color:#FFF4E6;}
.ea-invit-boutons button:disabled{opacity:.5;}
.ea-inviter-corps{height:auto;}
.ea-inviter-actions{display:grid;gap:10px;padding:16px 18px calc(20px + env(safe-area-inset-bottom,0px));}
.ea-inviter-lien{min-height:46px;border-radius:999px;border:1.2px solid rgba(246,200,140,.55);background:rgba(36,21,11,.25);color:#FFF4E6;
  font-family:var(--leger);font-size:16px;font-weight:500;cursor:pointer;}
.ea-pied{margin:14px 8px 4px;font-family:var(--leger);font-weight:400;font-size:13.5px;color:#C9B29A;}
`,
      }}
    />
  );
}
