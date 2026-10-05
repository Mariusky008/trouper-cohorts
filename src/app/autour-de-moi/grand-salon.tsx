"use client";

// 🛋️ LE GRAND SALON D'ENSEMBLE — on parcourt ses discussions dans un même lieu.
//
// « Chaque discussion correspond à un groupe de mobilier et de fantômes qui
// conserve son identité pendant le déplacement. » Le décor ne bouge pas (les
// fenêtres sur la ville, le parquet) ; les groupes, eux, glissent en
// profondeur : le premier plan recule au milieu, le milieu part au fond, le
// fond s'en va derrière la bibliothèque, et le suivant entre par le bas.
//
// LE DÉFILEMENT PILOTE DIRECTEMENT LE MOUVEMENT. C'est un vrai défilement du
// navigateur — son élan, son arrêt, son retour — dont la position donne une
// progression continue `p` : un pas de défilement, une discussion. Chaque
// groupe occupe la place `i - p` sur une trajectoire de cinq repères (caché
// derrière la bibliothèque, fond, milieu, premier plan, sous l'écran), et sa
// position et son échelle s'y interpolent. Rien n'est joué à part : s'arrêter
// à mi-chemin le laisse à mi-chemin, revenir le ramène exactement. Seul un
// accrochage doux (CSS `scroll-snap` de proximité) le pose sur l'état le plus
// proche, une fois le geste fini.
//
// L'ORDRE DES CALQUES : le fond ; les groupes, les plus proches devant ; la
// bibliothèque, qui cache ceux qui partent au fond — ils passent DERRIÈRE, ils
// ne s'effacent pas ; puis les étiquettes (de vrais boutons, à taille lisible
// quelle que soit la profondeur) ; l'en-tête et la barre restent à l'app.
//
// RIEN N'EST TIRÉ AU HASARD. Le coin d'une discussion vient de sa clé, le
// fantôme d'une personne de son prénom : « notre table du déjeuner » reste la
// même d'une visite à l'autre. Les fantômes représentent les membres, pas leur
// présence en ligne. Sur la table, seulement ce qui a été réellement partagé.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { matrice } from "./scene-ville";

const D = "/direct/ensemble/";

/** Les fantômes : un par personne, choisi par son prénom — toujours le même. */
const FANTOMES: { src: string; r: number }[] = [
  { src: "fantome-beret-noir", r: 0.746 },
  { src: "fantome-echarpe-verte", r: 0.877 },
  { src: "fantome-beret-rouge", r: 0.777 },
  { src: "fantome-echarpe-violette", r: 0.833 },
  { src: "fantome-bonnet", r: 0.929 },
  { src: "fantome-salue", r: 0.954 },
  { src: "fantome-lunettes-rouges", r: 0.821 },
  { src: "fantome-casquette-bleue", r: 0.885 },
  { src: "fantome-casquette-noire", r: 0.796 },
];

/** Un hachage stable : le même texte donne toujours le même nombre. */
function hache(t: string): number {
  let h = 2166136261;
  for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
export const fantomeDe = (nom: string) => FANTOMES[hache(nom.trim().toLowerCase()) % FANTOMES.length];

/* ═══ LES COMPOSITIONS ═══════════════════════════════════════════════════════
   Un groupe se dessine dans une boîte de largeur 1 : chaque meuble par son
   centre (`cx`), son pied (`b`) et sa largeur (`w`) ; sa hauteur suit son
   image (`r` = largeur / hauteur).

   « LES FANTÔMES DOIVENT VRAIMENT ÊTRE ASSIS. » Une place est donc posée SUR
   un siège, en fractions de son image : `u` à travers, `v` le bas du
   fantôme, `h` sa taille (en largeurs du siège). Puis l'avant du siège — le
   devant du coussin, les accoudoirs — est redessiné PAR-DESSUS le fantôme :
   c'est la même image, découpée par `avant` (un polygone, en fractions de
   l'image). Le bas du fantôme disparaît dans l'assise ; une ombre de contact
   le pose sur le coussin, à la hauteur `coupe`. On dessine siège par siège,
   du fond vers l'avant : un fauteuil devant le canapé cache aussi ceux qui y
   sont assis.

   La table vient ensuite, devant tout le monde ; `plateau` : les quatre
   coins de son dessus, en fractions de SON image — on la déplace sans
   refaire le plateau. Le tapis, dessous, délimite le coin. */
type Point = [number, number];
type Meuble = { src: string; r: number; cx: number; b: number; w: number; miroir?: boolean; avant?: Point[] };
type Place = { m: number; u: number; v: number; coupe: number; h: number; miroir?: boolean };
type Table = { src: string; r: number; cx: number; b: number; w: number; plateau: [Point, Point, Point, Point] };
type Tapis = { cx: number; cy: number; w: number; h: number; teinte: string; bord: string };
/** Un tapis couché à 62° paraît `COUCHE` fois moins haut : on le dessine d'autant plus haut. */
const COUCHE = 0.47;
type Composition = { nom: string; meubles: Meuble[]; places: Place[]; table: Table; tapis: Tapis };

const AVANT_FAUTEUIL_CUIR: Point[] = [
  [0, 0.25],
  [0.2, 0.24],
  [0.38, 0.3],
  [0.46, 0.38],
  [0.47, 0.5],
  [0.7, 0.5],
  [0.9, 0.47],
  [1, 0.47],
  [1, 1],
  [0, 1],
];
const PLATEAU_RONDE: [Point, Point, Point, Point] = [
  [0.22, 0.06],
  [0.78, 0.06],
  [0.86, 0.26],
  [0.14, 0.26],
];

const COMPOSITIONS: Composition[] = [
  {
    // LE CANAPÉ VERT ET LA TABLE DE TRAVERTIN — deux places.
    nom: "canape-vert",
    meubles: [
      {
        src: "canape-vert",
        r: 1.4875,
        cx: 0.5,
        b: 0.62,
        w: 1,
        avant: [[0, 0.17], [0.2, 0.2], [0.24, 0.3], [0.24, 0.48], [0.4, 0.51], [0.7, 0.49], [0.92, 0.46], [0.93, 0.2], [1, 0.17], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.41, v: 0.56, coupe: 0.5, h: 0.36 },
      { m: 0, u: 0.71, v: 0.54, coupe: 0.48, h: 0.36, miroir: true },
    ],
    table: { src: "table-travertin", r: 2.235, cx: 0.5, b: 0.8, w: 0.66, plateau: [[0.2, 0.07], [0.8, 0.07], [0.88, 0.25], [0.12, 0.25]] },
    tapis: { cx: 0.5, cy: 0.7, w: 0.9, h: 0.26, teinte: "#5b2328", bord: "#a8784a" },
  },
  {
    // LE CANAPÉ DE CUIR, LE FAUTEUIL BOUCLETTE, LA TABLE AUX PIEDS DE LAITON.
    nom: "canape-cuir",
    meubles: [
      {
        src: "canape-cuir",
        r: 1.559,
        cx: 0.37,
        b: 0.62,
        w: 0.74,
        avant: [[0, 0.12], [0.12, 0.2], [0.2, 0.3], [0.21, 0.52], [0.45, 0.53], [0.75, 0.5], [0.95, 0.47], [0.96, 0.22], [1, 0.18], [1, 1], [0, 1]],
      },
      {
        src: "fauteuil-bouclette",
        r: 1.368,
        cx: 0.83,
        b: 0.7,
        w: 0.44,
        avant: [[0, 0.35], [0.1, 0.28], [0.3, 0.25], [0.42, 0.3], [0.45, 0.46], [0.6, 0.47], [0.61, 0.27], [0.75, 0.24], [1, 0.27], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.38, v: 0.6, coupe: 0.52, h: 0.48 },
      { m: 1, u: 0.5, v: 0.56, coupe: 0.47, h: 0.6, miroir: true },
      { m: 0, u: 0.74, v: 0.57, coupe: 0.5, h: 0.48 },
    ],
    table: { src: "table-laiton", r: 1.8525, cx: 0.5, b: 0.84, w: 0.58, plateau: [[0.17, 0.06], [0.8, 0.06], [0.86, 0.2], [0.1, 0.2]] },
    tapis: { cx: 0.52, cy: 0.72, w: 0.92, h: 0.26, teinte: "#1f3b45", bord: "#b08a58" },
  },
  {
    // LE CANAPÉ BOUCLETTE, DEUX FAUTEUILS DE CUIR, LA TABLE RONDE — quatre places.
    nom: "table-ronde",
    meubles: [
      {
        src: "canape-bouclette",
        r: 2.115,
        cx: 0.5,
        b: 0.5,
        w: 0.84,
        avant: [[0, 0.12], [0.15, 0.15], [0.22, 0.3], [0.23, 0.5], [0.5, 0.48], [0.75, 0.44], [0.95, 0.41], [0.97, 0.2], [1, 0.2], [1, 1], [0, 1]],
      },
      { src: "fauteuil-cuir", r: 1.2875, cx: 0.15, b: 0.8, w: 0.36, avant: AVANT_FAUTEUIL_CUIR },
      { src: "fauteuil-cuir", r: 1.2875, cx: 0.85, b: 0.8, w: 0.36, miroir: true, avant: AVANT_FAUTEUIL_CUIR },
    ],
    places: [
      { m: 0, u: 0.4, v: 0.54, coupe: 0.48, h: 0.4 },
      { m: 0, u: 0.66, v: 0.5, coupe: 0.45, h: 0.4, miroir: true },
      { m: 1, u: 0.66, v: 0.56, coupe: 0.5, h: 0.74 },
      { m: 2, u: 0.66, v: 0.56, coupe: 0.5, h: 0.74, miroir: true },
    ],
    table: { src: "table-ronde", r: 1.893, cx: 0.5, b: 0.86, w: 0.46, plateau: PLATEAU_RONDE },
    tapis: { cx: 0.5, cy: 0.72, w: 0.92, h: 0.28, teinte: "#6a3320", bord: "#c09a62" },
  },
  {
    // LES TROIS CHAISES DE VELOURS AUTOUR DE LA TABLE RONDE.
    nom: "chaises",
    meubles: [
      {
        src: "chaises-velours",
        r: 2.34,
        cx: 0.5,
        b: 0.6,
        w: 1,
        avant: [[0, 0.6], [0.42, 0.6], [0.42, 0.42], [0.64, 0.42], [0.64, 0.6], [1, 0.6], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.22, v: 0.64, coupe: 0.6, h: 0.26 },
      { m: 0, u: 0.5, v: 0.46, coupe: 0.42, h: 0.26 },
      { m: 0, u: 0.78, v: 0.64, coupe: 0.6, h: 0.26, miroir: true },
    ],
    table: { src: "table-ronde", r: 1.893, cx: 0.5, b: 0.78, w: 0.5, plateau: PLATEAU_RONDE },
    tapis: { cx: 0.5, cy: 0.68, w: 0.84, h: 0.25, teinte: "#24402e", bord: "#b08a58" },
  },
];
/** Le haut et le bas d'un meuble, en largeurs de groupe. */
const hautDe = (m: { b: number; w: number; r: number }) => m.b - m.w / m.r;
/** Où s'assied une place : son centre, le bas du fantôme, la ligne d'assise, sa taille — en largeurs de groupe. */
function assise(c: Composition, p: Place) {
  const m = c.meubles[p.m];
  const mh = m.w / m.r;
  const u = m.miroir ? 1 - p.u : p.u;
  return { x: m.cx - m.w / 2 + u * m.w, bas: hautDe(m) + p.v * mh, coupe: hautDe(m) + p.coupe * mh, h: p.h * m.w };
}
/** Le haut et le bas de la boîte d'une composition, en largeurs de groupe. */
function boite(c: Composition) {
  const meubles = [...c.meubles, c.table];
  const haut = Math.min(...meubles.map(hautDe), ...c.places.map((p) => assise(c, p)).map((a) => a.bas - a.h));
  const bas = Math.max(...meubles.map((m) => m.b));
  return { haut, bas, h: bas - haut };
}
export const compositionDe = (cle: string) => COMPOSITIONS[hache(cle) % COMPOSITIONS.length];

/* ═══ LA TRAJECTOIRE ════════════════════════════════════════════════════════
   Cinq repères, en fractions de la scène : `x` le centre du groupe, `y` son
   pied, `w` sa largeur. -1 : caché derrière la bibliothèque ; 0 : le fond ;
   1 : le milieu ; 2 : le premier plan ; 3 : sous le bord de l'écran. Entre
   deux repères, une spline de Catmull-Rom : la sortie vers la bibliothèque
   s'incurve d'elle-même, sans cassure. */
const REPERES = [
  { x: 0.13, y: 0.285, w: 0.2 },
  { x: 0.47, y: 0.345, w: 0.36 },
  { x: 0.66, y: 0.575, w: 0.66 },
  // LE PREMIER PLAN S'ARRÊTE AU-DESSUS DU BOUTON : on doit voir ce qui est
  // posé sur la table, pas le cacher sous « Ouvrir la discussion ».
  { x: 0.5, y: 0.865, w: 0.96 },
  // SOUS L'ÉCRAN, ENTIÈREMENT : au repos on voit trois groupes, pas un
  // quatrième qui dépasse. (Le groupe le plus haut fait 0,8 de sa largeur,
  // soit 0,49 de la hauteur au rapport des repères — d'où 1,52.)
  { x: 0.5, y: 1.52, w: 1.24 },
];
const PREMIER = -1;
function catmull(a: number, b: number, c: number, d: number, t: number) {
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
/** Le rapport hauteur / largeur de la scène pour lequel les repères sont faits. */
const RAPPORT = 2.04;
/**
 * SUR UN TÉLÉPHONE PLUS TRAPU, LES GROUPES RAPETISSENT : leur hauteur suit la
 * largeur de l'écran, et trois plans doivent tenir dans une hauteur moindre.
 */
export const echelleDe = (W: number, H: number) => (W > 0 ? Math.min(1, H / W / RAPPORT) : 1);

/** Ce que la taille de l'écran décide : l'échelle des groupes, le pied du premier plan, la place du bouton. */
type Geo = { W: number; H: number; e: number; yAvant: number; cta: number };
/**
 * LE BOUTON A SA ZONE, AU-DESSUS DE LA BARRE (`bas` : ce que la barre et le
 * fantôme du milieu prennent sur la scène). Le premier plan s'arrête au-dessus
 * de lui, et les groupes rapetissent si la hauteur restante ne suffit pas —
 * sur un 320 × 568, c'est elle qui manque.
 */
function geoDe(W: number, H: number, bas: number): Geo {
  const cta = H - bas - 10 - 46;
  const yAvant = Math.min(REPERES[3].y, (cta - 6) / H);
  const reste = (yAvant - 0.45) * H;
  const e = W > 0 ? Math.min(echelleDe(W, H), reste / (0.78 * REPERES[3].w * W)) : 1;
  return { W, H, e: Math.max(0.5, e), yAvant, cta };
}
export function surLaTrajectoire(place: number, echelle = 1, yAvant = REPERES[3].y) {
  const s = Math.min(3, Math.max(-1, place)) - PREMIER;
  const i = Math.min(REPERES.length - 2, Math.floor(s));
  const t = s - i;
  const p = (k: number) => {
    const j = Math.min(REPERES.length - 1, Math.max(0, k));
    return j === 3 ? { ...REPERES[3], y: yAvant } : REPERES[j];
  };
  const v = (cle: "x" | "y" | "w") => catmull(p(i - 1)[cle], p(i)[cle], p(i + 1)[cle], p(i + 2)[cle], t);
  return { x: v("x"), y: v("y"), w: v("w") * echelle };
}

/** Ce qu'une discussion montre dans le salon. */
export type SceneDeSalon = {
  cle: string;
  titre: string;
  prive: boolean;
  /** Membre (« Ouvrir la discussion ») ou salon public à découvrir (« Voir la discussion »). */
  membre: boolean;
  /** Les membres, dans l'ordre — « Toi » pour moi. */
  participants: string[];
  /** Le nombre réel de membres, si on le connaît mieux que la liste. */
  nb?: number;
  nonLus: number;
  dernier?: { qui: string; texte: string };
  /** Les photos réellement partagées — deux au plus, côte à côte sur la table. */
  contenu: string[];
  /** Le premier salon public de la suite : la section commence là. */
  debutDecouverte?: boolean;
};

/** La position gardée d'une visite à l'autre de l'onglet. */
let positionGardee = 0;

const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ═══ LE SALON ══════════════════════════════════════════════════════════════ */
export function GrandSalon({
  scenes,
  onOuvrir,
  onIdee,
  enHaut = 0,
  recherche = "",
}: {
  scenes: SceneDeSalon[];
  /** Ce qu'on cherche : rien ne correspond n'est pas « aucune discussion ». */
  recherche?: string;
  onOuvrir: (s: SceneDeSalon) => void;
  /** « Trouver une idée à partager » — quand il n'y a encore aucun salon. */
  onIdee: () => void;
  /** La hauteur de l'en-tête posé par-dessus la scène, en points. */
  enHaut?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [taille, setTaille] = useState({ W: 0, H: 0, bas: 0 });
  const [haut, setHaut] = useState(positionGardee);
  const [calme] = useState(reduit);
  const [nouveau, setNouveau] = useState(false);

  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    // LA BARRE DE L'APP ET CE QUI EN DÉPASSE (le fantôme du milieu, son mot) :
    // le bouton du premier plan se pose au-dessus.
    const mesurer = () => {
      const r = e.getBoundingClientRect();
      const barre = document.querySelector(".ap-onglets");
      let haut = r.bottom;
      if (barre) {
        // Le mot au-dessus du fantôme (« Discuter ») s'anime, puis s'en va
        // après le premier usage : on ne le mesure pas, on lui garde TOUJOURS
        // sa hauteur. Sinon la scène sauterait au moment où il disparaît.
        for (const x of [barre, ...barre.querySelectorAll("*")]) {
          if (x.closest(".ap-mf-dit")) continue;
          const b = x.getBoundingClientRect();
          if (b.height > 0 && b.width > 0 && b.top < haut && b.bottom > r.top + r.height / 2) haut = b.top;
        }
        haut -= 34;
      }
      setTaille({ W: e.clientWidth, H: e.clientHeight, bas: Math.round(Math.max(0, Math.min(160, r.bottom - haut))) });
    };
    const ro = new ResizeObserver(mesurer);
    ro.observe(e);
    const barre = document.querySelector(".ap-onglets");
    if (barre) ro.observe(barre);
    const plusTard = window.setTimeout(mesurer, 1200);
    return () => {
      ro.disconnect();
      window.clearTimeout(plusTard);
    };
  }, []);

  const { W, H } = taille;
  const geo = geoDe(W, H, taille.bas);
  /** Un pas de défilement, une discussion. */
  const pas = Math.max(1, Math.round(H * 0.42));
  const n = scenes.length;
  const pMax = Math.max(0, n - 3);
  /** Moins de trois discussions : elles se rangent vers le premier plan, sans groupes fictifs. */
  const decalage = Math.max(0, 3 - n);
  const p = Math.min(pMax, Math.max(0, haut / pas));

  // LA POSITION RETROUVÉE au retour d'une conversation ou d'un autre onglet —
  // même arrêtée entre deux états.
  useLayoutEffect(() => {
    const e = ref.current;
    if (e && H) e.scrollTop = positionGardee;
  }, [H]);

  // UN NOUVEAU SALON ARRIVE EN TÊTE PENDANT QU'ON FAIT DÉFILER : la scène ne
  // bouge pas sous le doigt — on décale d'autant le défilement, et on le dit.
  const premier = useRef(scenes[0]?.cle);
  const arrivee = useRef(false);
  useLayoutEffect(() => {
    const avant = premier.current;
    premier.current = scenes[0]?.cle;
    const e = ref.current;
    if (!e || !avant || avant === scenes[0]?.cle) return;
    const k = scenes.findIndex((s) => s.cle === avant);
    if (k > 0 && e.scrollTop > pas * 0.05) {
      // Le défilement ainsi décalé déclenche `surDefilement`, qui le dit.
      arrivee.current = true;
      e.scrollTop += k * pas;
      positionGardee = e.scrollTop;
    }
  }, [scenes, pas]);

  const surDefilement = () => {
    const e = ref.current;
    if (!e) return;
    if (arrivee.current) {
      arrivee.current = false;
      setNouveau(true);
    }
    positionGardee = e.scrollTop;
    setHaut(e.scrollTop);
    if (e.scrollTop < pas * 0.3) setNouveau(false);
  };

  const masquees = W > 0 ? etiquettesMasquees(scenes, scenes.map((_, i) => i - p + decalage), geo, enHaut) : new Set<string>();

  if (calme) return <SalonCalme scenes={scenes} onOuvrir={onOuvrir} onIdee={onIdee} enHaut={enHaut} recherche={recherche} />;

  return (
    <div className="gs" ref={ref} onScroll={surDefilement} aria-label="Tes discussions, dans le salon" data-bas={taille.bas}>
      <StylesGrandSalon />
      <div className="gs-piste" style={{ height: H + pMax * pas }}>
        {Array.from({ length: pMax + 1 }, (_, k) => (
          <i key={k} className="gs-cran" style={{ top: k * pas }} aria-hidden="true" />
        ))}
        <div className="gs-scene" style={{ height: H }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gs-fond" src={`${D}fond.webp`} alt="" aria-hidden="true" />
          {W > 0 &&
            scenes.map((s, i) => {
              const place = i - p + decalage;
              if (place < -1.02 || place > 3) return null;
              return <Groupe key={s.cle} s={s} place={place} geo={geo} />;
            })}
          {/* LA BIBLIOTHÈQUE : un calque à part, devant les groupes qui s'en vont. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gs-biblio" src={`${D}bibliotheque.webp`} alt="" aria-hidden="true" />
          {W > 0 &&
            scenes.map((s, i) => {
              const place = i - p + decalage;
              if (place < -0.3 || place > 2.6) return null;
              return <Etiquette key={s.cle} s={s} place={place} geo={geo} enHaut={enHaut} masquee={masquees.has(s.cle)} onOuvrir={() => onOuvrir(s)} />;
            })}
          {n === 0 && (
            <div className="gs-vide" style={{ top: enHaut + 24 }}>
              {recherche.trim() ? (
                <b>Aucun salon ne correspond à « {recherche.trim()} ».</b>
              ) : (
                <>
                  <b>Aucune discussion pour l’instant.</b>
                  <span>Partage un essai, un plat ou une sortie avec tes amis : votre table apparaîtra ici.</span>
                  <button type="button" onClick={onIdee}>
                    Trouver une idée à partager
                  </button>
                </>
              )}
            </div>
          )}
          {nouveau && (
            <button
              type="button"
              className="gs-nouveau"
              style={{ top: enHaut + 8 }}
              onClick={() => {
                ref.current?.scrollTo({ top: 0, behavior: "smooth" });
                setNouveau(false);
              }}
            >
              ✨ Un nouveau salon · revenir en haut
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Le dessin d'un groupe, à sa place sur la trajectoire. */
function Groupe({ s, place, geo, fixe }: { s: SceneDeSalon; place: number; geo: Geo; fixe?: number }) {
  const c = compositionDe(s.cle);
  const bx = boite(c);
  const { W, H, e } = geo;
  const t = surLaTrajectoire(place, e, geo.yAvant);
  // DESSINÉ À LA TAILLE DU PREMIER PLAN, puis réduit d'un `scale` : le
  // navigateur ne refait pas la mise en page des images à chaque pas.
  // `fixe` : le même groupe, immobile, à cette largeur (mouvements réduits).
  const base = fixe ?? W * REPERES[3].w * e;
  const k = t.w / (REPERES[3].w * e);
  const hPx = bx.h * base;
  const assis = s.participants.slice(0, c.places.length);
  const style: CSSProperties = fixe
    ? { position: "relative", width: base, height: hPx, margin: "0 auto" }
    : {
        width: base,
        height: hPx,
        transform: `translate(${t.x * W - base / 2}px, ${t.y * H - hPx}px) scale(${k})`,
        zIndex: 100 + Math.round(place * 100),
      };
  const enY = (b: number) => ((b - bx.haut) / bx.h) * 100;
  const meuble = (m: { src: string; r: number; cx: number; b: number; w: number; miroir?: boolean }, cle: string, avant?: Point[]) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={cle}
      className={`gs-meuble${m.miroir ? " miroir" : ""}`}
      src={`${D}${m.src}.webp`}
      alt=""
      style={{
        left: `${(m.cx - m.w / 2) * 100}%`,
        top: `${enY(hautDe(m))}%`,
        width: `${m.w * 100}%`,
        ...(avant ? { clipPath: `polygon(${avant.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(",")})` } : {}),
      }}
    />
  );
  // DU FOND VERS L'AVANT : chaque siège, ceux qui y sont assis, puis l'avant
  // du siège par-dessus eux, et leur ombre sur le coussin.
  const ordre = c.meubles.map((m, i) => ({ m, i })).sort((x, y) => x.m.b - y.m.b);
  const tbl = c.table;
  const tblH = tbl.w / tbl.r;
  const plateau = tbl.plateau.map(
    ([x, y]) => [(tbl.cx - tbl.w / 2 + x * tbl.w) * base, ((hautDe(tbl) + y * tblH - bx.haut) / bx.h) * hPx] as [number, number],
  );
  const tp = c.tapis;
  return (
    <div className="gs-groupe" style={style} aria-hidden="true" data-cle={s.cle}>
      {/* LE TAPIS délimite le coin et l'ancre au sol : un rectangle couché
          en perspective, bordé, au motif discret. */}
      <i
        className="gs-tapis"
        style={{
          left: `${(tp.cx - tp.w / 2) * 100}%`,
          top: `${enY(tp.cy - tp.h / COUCHE / 2)}%`,
          width: `${tp.w * 100}%`,
          height: `${(tp.h / COUCHE / bx.h) * 100}%`,
          backgroundColor: tp.teinte,
          borderColor: tp.bord,
        }}
      />
      {ordre.map(({ m, i }) => {
        const ici = c.places.map((pl, k) => ({ pl, k })).filter(({ pl, k }) => pl.m === i && k < assis.length);
        return [
          meuble(m, `m${i}`),
          ...ici.map(({ pl, k }) => {
            const f = fantomeDe(assis[k]);
            const a = assise(c, pl);
            const w = a.h * f.r;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`f${k}`}
                className={`gs-fantome${pl.miroir ? " miroir" : ""}`}
                src={`${D}${f.src}.webp`}
                alt=""
                style={{ left: `${(a.x - w / 2) * 100}%`, top: `${enY(a.bas - a.h)}%`, width: `${w * 100}%` }}
              />
            );
          }),
          ...(m.avant && ici.length ? [meuble(m, `a${i}`, m.avant)] : []),
          ...ici.map(({ pl, k }) => {
            const a = assise(c, pl);
            const sw = a.h * 0.8;
            const sh = sw * 0.2;
            return (
              <i
                key={`o${k}`}
                className="gs-ombre"
                style={{ left: `${(a.x - sw / 2) * 100}%`, top: `${enY(a.coupe - sh / 2)}%`, width: `${sw * 100}%`, height: `${(sh / bx.h) * 100}%` }}
              />
            );
          }),
        ];
      })}
      {meuble(tbl, "table")}
      {/* LE CONTENU RÉELLEMENT PARTAGÉ, posé à plat sur le plateau. Deux
          choix : côte à côte. Rien de partagé : la table reste nue. */}
      {s.contenu.slice(0, 2).map((src, i, l) => {
        const [a, b2, c2, d] = plateau;
        const part = (u: number) => [a[0] + (b2[0] - a[0]) * u, a[1] + (b2[1] - a[1]) * u, d[0] + (c2[0] - d[0]) * u, d[1] + (c2[1] - d[1]) * u];
        const n = l.length;
        const g = 0.06;
        const u0 = n === 1 ? 0.18 : i === 0 ? 0.02 : 0.5 + g / 2;
        const u1 = n === 1 ? 0.82 : i === 0 ? 0.5 - g / 2 : 0.98;
        const [x0, y0, x3, y3] = part(u0);
        const [x1, y1, x2, y2] = part(u1);
        const w = 300;
        const h = 220;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            className="gs-contenu"
            src={src}
            alt=""
            style={{
              width: w,
              height: h,
              transform: matrice(w, h, [
                [x0, y0],
                [x1, y1],
                [x2, y2],
                [x3, y3],
              ]),
            }}
          />
        );
      })}
    </div>
  );
}

const borne = (v: number) => Math.max(0, Math.min(1, v));

/**
 * « LES ÉTIQUETTES PRENNENT TROP DE PLACE. » Une hiérarchie simple, qui suit
 * la profondeur sans saut :
 *   · au fond : le titre, court, et le statut ;
 *   · au milieu : s'y ajoutent les participants ;
 *   · au premier plan : le dernier message, près des fantômes, et le bouton.
 * La taille du titre et l'arrivée des détails sont continues : elles
 * grandissent quand la table se rapproche.
 */
function lecture(s: SceneDeSalon, place: number, geo: Geo, enHaut: number) {
  const { W, H } = geo;
  const c = compositionDe(s.cle);
  const bx = boite(c);
  const t = surLaTrajectoire(place, geo.e, geo.yAvant);
  const gw = t.w * W;
  const top = t.y * H - bx.h * gw;
  /** Les participants arrivent entre le fond et le milieu. */
  const details = borne((place - 0.45) / 0.4);
  /** La bulle du dernier message, au premier plan seulement. */
  const bulle = s.dernier && s.nonLus > 0 ? borne((place - 1.65) / 0.3) * (place > 2.35 ? borne((2.6 - place) / 0.25) : 1) : 0;
  const taille = 12.5 + 4.5 * borne((place - 0.2) / 1.8);
  const nb = s.nb ?? s.participants.length;
  const assis = s.participants.slice(0, c.places.length);
  const enPlus = nb - assis.length;
  const statut = s.prive ? "🔒 Privé" : "🌍 Public";
  const gens = s.membre ? `${assis.join(", ")}${enPlus > 0 ? ` +${enPlus}` : ""}` : `${nb} participant${nb > 1 ? "s" : ""}`;
  const maxi = Math.min(W - 16, 300, W * (0.56 + 0.28 * borne(place / 2)));
  // LA LARGEUR RÉELLE, ESTIMÉE au plus près : le titre, ou la ligne du statut.
  const larg = Math.min(maxi, Math.max(s.titre.length * taille * 0.56 + 30, (statut.length + details * (gens.length + 3)) * 6.6 + 30));
  const haut = taille * 1.25 + 30 + (s.debutDecouverte ? 26 : 0);
  // JAMAIS SOUS L'EN-TÊTE, JAMAIS HORS DE L'ÉCRAN.
  const y = Math.max(enHaut + haut + 4, top + gw * 0.06);
  const x = Math.min(W - 8 - larg / 2, Math.max(8 + larg / 2, t.x * W));
  return { t, gw, top, x, y, larg, haut, maxi, details, bulle, taille, statut, gens, bx };
}

/**
 * DEUX ÉTIQUETTES NE SE CHEVAUCHENT JAMAIS — bulle comprise. La plus proche
 * garde la sienne, la plus lointaine s'efface ; son groupe reste visible et
 * se touche toujours.
 */
function etiquettesMasquees(scenes: SceneDeSalon[], places: number[], geo: Geo, enHaut: number) {
  const posees: { g: number; d: number; h: number; b: number }[] = [];
  const masquees = new Set<string>();
  const ordre = scenes.map((s, i) => ({ s, place: places[i] })).filter((x) => x.place > -0.3 && x.place < 2.6);
  ordre.sort((a, b) => b.place - a.place);
  for (const { s, place } of ordre) {
    const l = lecture(s, place, geo, enHaut);
    const boites = [{ g: l.x - l.larg / 2, d: l.x + l.larg / 2, h: l.y - l.haut, b: l.y }];
    if (l.bulle > 0.05) boites.push({ g: l.x - l.larg / 2 + 10, d: l.x - l.larg / 2 + 240, h: l.y + 4, b: l.y + 50 });
    const touche = boites.some((r) => posees.some((p) => r.g < p.d + 6 && r.d > p.g - 6 && r.h < p.b + 6 && r.b > p.h - 6));
    if (touche) masquees.add(s.cle);
    else posees.push(...boites);
  }
  return masquees;
}

/** Le titre, le statut, les membres — un vrai bouton, à taille lisible. */
function Etiquette({
  s,
  place,
  geo,
  enHaut,
  masquee,
  onOuvrir,
}: {
  s: SceneDeSalon;
  place: number;
  geo: Geo;
  enHaut: number;
  masquee: boolean;
  onOuvrir: () => void;
}) {
  const l = lecture(s, place, geo, enHaut);
  const { t, gw, top, bx } = l;
  // ELLE S'EN VA AVEC SON GROUPE : plus d'étiquette ni de zone touchable une
  // fois qu'il est passé derrière la bibliothèque. Au repos, une étiquette
  // est pleine ou absente ; masquée, elle s'efface en fondu.
  const visible = place > -0.3;
  const opacite = masquee ? 0 : place < 0 ? borne((place + 0.3) / 0.3) : place > 2.35 ? borne((2.6 - place) / 0.25) : 1;
  // LE GROUPE NE SE TOUCHE PLUS dès qu'il commence à passer derrière la bibliothèque.
  const touchable = place > -0.05;
  const action = s.membre ? "Ouvrir la discussion" : "Voir la discussion";
  const ctaVu = borne(1 - (Math.abs(place - 2) - 0.1) / 0.3);
  return (
    <>
      {/* TOUT LE GROUPE SE TOUCHE — un appui, pas un défilement. */}
      <button
        type="button"
        className="gs-zone"
        data-cle={s.cle}
        tabIndex={-1}
        aria-hidden="true"
        style={{ left: t.x * geo.W - gw / 2, top, width: gw, height: bx.h * gw, pointerEvents: touchable ? "auto" : "none", zIndex: 400 + Math.round(place * 10) }}
        onClick={onOuvrir}
      />
      <div
        className="gs-plaque"
        data-cle={s.cle}
        aria-hidden={masquee || undefined}
        style={{
          left: l.x,
          top: l.y,
          maxWidth: l.maxi,
          opacity: opacite,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: opacite > 0.5 ? undefined : "none",
          zIndex: 600 + Math.round(place * 10),
        }}
      >
        {s.debutDecouverte && <span className="gs-section">Salons publics à découvrir</span>}
        <button type="button" className="gs-titre" onClick={onOuvrir} aria-label={`${s.titre} — ${action}`}>
          <b style={{ fontSize: l.taille }}>{s.titre}</b>
          <span className="gs-ligne">
            {l.statut}
            <span className="gs-gens" style={{ maxWidth: l.details * 240, opacity: l.details }}>
              {" · "}
              {l.gens}
            </span>
          </span>
          {s.nonLus > 0 && <em>{s.nonLus > 9 ? "9+" : s.nonLus}</em>}
        </button>
      </div>
      {l.bulle > 0 && s.dernier && (
        // LE DERNIER MESSAGE, PRÈS DES FANTÔMES : sous le titre, pas dans la plaque.
        <p
          className="gs-bulle"
          aria-hidden="true"
          style={{ left: l.x - l.larg / 2 + 10, top: l.y + 6, opacity: masquee ? 0 : l.bulle * opacite, zIndex: 650 + Math.round(place * 10) }}
        >
          <span>
            <i>{s.dernier.qui} :</i> {s.dernier.texte}
          </span>
        </p>
      )}
      {ctaVu > 0 && (
        <button
          type="button"
          className="gs-cta"
          // LE BOUTON A SA PLACE RÉSERVÉE, au-dessus de la barre : le groupe
          // du premier plan s'arrête avant lui, la table reste visible.
          style={{ top: geo.cta, opacity: ctaVu, pointerEvents: ctaVu > 0.5 ? "auto" : "none", zIndex: 700 }}
          onClick={onOuvrir}
        >
          {action} →
        </button>
      )}
    </>
  );
}

/**
 * MOUVEMENTS RÉDUITS : le même salon, sans profondeur qui bouge — les
 * groupes l'un sous l'autre, à taille moyenne, et un défilement ordinaire.
 */
function SalonCalme({
  scenes,
  onOuvrir,
  onIdee,
  enHaut,
  recherche,
}: {
  scenes: SceneDeSalon[];
  onOuvrir: (s: SceneDeSalon) => void;
  onIdee: () => void;
  enHaut: number;
  recherche: string;
}) {
  // LE MÊME GROUPE, IMMOBILE : mobilier, fantômes et contenu de la table,
  // à la largeur de la carte.
  const ref = useRef<HTMLDivElement | null>(null);
  const [larg, setLarg] = useState(0);
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setLarg(e.clientWidth));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="gs calme" ref={ref} style={{ paddingTop: enHaut }}>
      <StylesGrandSalon />
      {scenes.length === 0 && (
        <div className="gs-vide">
          {recherche.trim() ? (
            <b>Aucun salon ne correspond à « {recherche.trim()} ».</b>
          ) : (
            <>
              <b>Aucune discussion pour l’instant.</b>
              <button type="button" onClick={onIdee}>
                Trouver une idée à partager
              </button>
            </>
          )}
        </div>
      )}
      {scenes.map((s) => {
        return (
          <button key={s.cle} type="button" className="gs-calme" onClick={() => onOuvrir(s)}>
            {s.debutDecouverte && <span className="gs-section">Salons publics à découvrir</span>}
            <span className="gs-calme-t">
              <b>{s.titre}</b>
              <span>
                {s.prive ? "🔒 Privé" : "🌍 Salon public"} · {s.membre ? s.participants.join(", ") : `${s.nb ?? s.participants.length} participants`}
              </span>
              {s.nonLus > 0 && <em>{s.nonLus}</em>}
            </span>
            <span className="gs-calme-d" aria-hidden="true">
              {larg > 0 && <Groupe s={s} place={2} geo={{ W: larg, H: larg * 2, e: 1, yAvant: REPERES[3].y, cta: 0 }} fixe={Math.min(320, (larg - 48) * 0.92)} />}
            </span>
            <span className="gs-cta-calme">{s.membre ? "Ouvrir la discussion" : "Voir la discussion"} →</span>
          </button>
        );
      })}
    </div>
  );
}

function StylesGrandSalon() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.gs{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;scroll-snap-type:y proximity;
  background:#2a1a10;color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;-webkit-tap-highlight-color:transparent;}
.gs::-webkit-scrollbar{display:none;}
.gs-piste{position:relative;}
.gs-cran{position:absolute;left:0;width:1px;height:1px;scroll-snap-align:start;}
.gs-scene{position:sticky;top:0;overflow:hidden;}
.gs-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0;}
.gs-groupe{position:absolute;left:0;top:0;transform-origin:50% 100%;pointer-events:none;will-change:transform;}
.gs-meuble,.gs-fantome{position:absolute;display:block;height:auto;}
.gs-meuble.miroir,.gs-fantome.miroir{transform:scaleX(-1);}
.gs-fantome{filter:drop-shadow(0 2px 3px rgba(40,20,5,.25));}
.gs-ombre{position:absolute;display:block;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(30,14,4,.55),rgba(30,14,4,0) 70%);pointer-events:none;}
.gs-tapis{position:absolute;display:block;box-sizing:border-box;border:solid 3px;border-radius:4px;opacity:.85;transform:perspective(900px) rotateX(62deg);transform-origin:50% 50%;
  background-image:repeating-linear-gradient(45deg,rgba(255,230,190,.07) 0 6px,transparent 6px 14px),repeating-linear-gradient(-45deg,rgba(0,0,0,.12) 0 6px,transparent 6px 14px);
  box-shadow:inset 0 0 0 8px rgba(0,0,0,.18),inset 0 0 0 11px rgba(255,220,170,.25),0 6px 18px rgba(20,8,2,.35);}
.gs-contenu{position:absolute;left:0;top:0;transform-origin:0 0;object-fit:cover;border-radius:6px;border:5px solid #fbf6ee;box-sizing:border-box;
  box-shadow:0 3px 8px rgba(30,14,4,.35);}
.gs-biblio{position:absolute;left:-1%;top:-1%;width:31%;height:auto;z-index:350;pointer-events:none;filter:drop-shadow(6px 0 10px rgba(30,14,4,.35));}
.gs-zone{position:absolute;padding:0;border:0;background:none;cursor:pointer;}
.gs-plaque{position:absolute;display:grid;justify-items:center;gap:5px;transform:translate(-50%,-100%);width:max-content;transition:opacity .18s;}
.gs-section{padding:3px 10px;border-radius:999px;background:rgba(245,162,58,.92);color:#2A1608;font-size:11.5px;font-weight:800;letter-spacing:.02em;}
.gs-titre{position:relative;display:grid;justify-items:center;max-width:100%;min-height:40px;padding:4px 12px 5px;border-radius:12px;border:1px solid rgba(255,214,170,.24);
  background:rgba(28,17,10,.78);color:#FFF4E6;font:inherit;text-align:center;cursor:pointer;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  box-shadow:0 5px 14px rgba(20,10,4,.3);box-sizing:border-box;}
.gs-titre b{display:block;max-width:100%;font-family:Georgia,"Times New Roman",serif;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gs-ligne{display:flex;max-width:100%;font-size:11px;color:#E9D6C2;line-height:1.35;white-space:nowrap;}
.gs-gens{display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:pre;}
.gs-titre em{position:absolute;top:-8px;right:-8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#FF3E8E;color:#fff;
  font-style:normal;font-size:12px;font-weight:800;line-height:22px;}
.gs-bulle{position:absolute;margin:0;max-width:min(230px,70%);padding:5px 10px;border-radius:4px 12px 12px 12px;background:#fffaf2;color:#2A1608;font-size:12px;line-height:1.3;
  box-shadow:0 4px 10px rgba(20,10,4,.3);overflow-wrap:anywhere;pointer-events:none;box-sizing:border-box;}
.gs-bulle span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.gs-bulle i{font-style:normal;font-weight:800;color:#B0306A;}
.gs-cta{position:absolute;left:50%;transform:translateX(-50%);height:46px;padding:0 22px;border:0;border-radius:999px;background:linear-gradient(180deg,#F8B451,#E8932A);
  color:#2A1608;font:inherit;font-size:15.5px;font-weight:800;white-space:nowrap;cursor:pointer;box-shadow:0 8px 18px rgba(20,10,4,.4);}
.gs-vide{position:absolute;left:16px;right:16px;display:grid;justify-items:center;gap:8px;padding:18px;border-radius:18px;background:rgba(28,17,10,.82);text-align:center;z-index:800;}
.gs-vide b{font-size:17px;}
.gs-vide span{font-size:13.5px;color:#E9D6C2;}
.gs-vide button{height:46px;padding:0 20px;border:0;border-radius:999px;background:linear-gradient(180deg,#F8B451,#E8932A);color:#2A1608;font:inherit;font-weight:800;cursor:pointer;}
.gs-nouveau{position:absolute;left:50%;transform:translateX(-50%);z-index:900;height:36px;padding:0 14px;border:0;border-radius:999px;background:#FFF4E6;color:#2A1608;
  font:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 14px rgba(20,10,4,.35);}
.gs.calme{scroll-snap-type:none;padding:0 12px 24px;background:#2a1a10 url(/direct/ensemble/fond.webp) 50% 0/cover fixed;}
.gs-calme{display:grid;gap:8px;width:100%;margin:12px 0;padding:12px;border-radius:18px;border:1px solid rgba(255,214,170,.22);background:rgba(28,17,10,.82);
  color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;}
.gs-calme-t{position:relative;display:grid;gap:2px;}
.gs-calme-t b{font-size:16px;}
.gs-calme-t span{font-size:12.5px;color:#E9D6C2;}
.gs-calme-t em{position:absolute;top:0;right:0;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#FF3E8E;font-style:normal;font-size:12px;font-weight:800;text-align:center;line-height:22px;}
.gs-calme-d{display:block;}
.gs.calme .gs-vide{position:static;margin-top:12px;}
.gs-cta-calme{justify-self:center;font-weight:800;color:#F5A23A;}
`,
      }}
    />
  );
}
