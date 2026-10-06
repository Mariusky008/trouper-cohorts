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
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

/* ═══ LE LIEU ═══════════════════════════════════════════════════════════════
   Tout est relevé sur la VUE FIXE VALIDÉE (docs/ensemble/gabarit-390x844.json) :
   un écran de 390 de large, dont la scène fait 795 de haut au-dessus de la
   barre. Le décor y est posé en « cover », calé en haut ; sur un autre écran,
   un point du décor de référence se retrouve par `decorDe`. Les groupes du
   fond et du milieu, la bibliothèque et le passage suivent ainsi le décor ;
   le premier plan, lui, suit la place du bouton (voir `geoDe`). */
const FOND = { src: "fond-salon", l: 853, h: 1844 };
function decorDe(W: number, H: number) {
  const k = W > 0 ? Math.max(W / FOND.l, H / FOND.h) / (390 / FOND.l) : 1;
  const ox = W / 2 - 195 * k;
  // SUR UN ÉCRAN PLUS TRAPU, le décor remonte (sous l'en-tête) pour garder
  // l'horizon au même tiers de l'écran — sans jamais découvrir son bas.
  const reste = (FOND.h * 390) / FOND.l * k - H;
  const oy = Math.max(0, Math.min(reste, 300 * k - 0.377 * H));
  return { k, oy, x: (x: number) => ox + x * k, y: (y: number) => y * k - oy };
}
/** La bibliothèque, ALLÉGÉE, devant le bord gauche du passage vers la seconde pièce (pied à y 340). */
const BIBLIO = { x: 40, y: 193, l: 64, pied: 340 };

/* ═══ LES COMPOSITIONS ═══════════════════════════════════════════════════════
   Chaque groupe se dessine en points « du premier plan » (un fantôme y fait
   152 de haut), autour de son ancre : le milieu de sa base, au sol. La
   trajectoire ne fait que le déplacer et le mettre à l'échelle — le même
   groupe, la même table, partout.

   « LES FANTÔMES DOIVENT VRAIMENT ÊTRE ASSIS. » Une place est posée SUR un
   siège, en fractions de son image (`u` à travers, `v` le bas du fantôme,
   `c` la ligne d'assise où tombe l'ombre). L'avant du siège (`avant`, un
   polygone de l'image) est redessiné par-dessus le fantôme, et la table,
   devant, cache encore le bas de son corps. */
type Point = [number, number];
type Meuble = { src: string; r: number; cx: number; b: number; w: number; miroir?: boolean; avant?: Point[] };
type Place = { m: number; u: number; v: number; c: number; h: number; miroir?: boolean };
type Table = { src: string; r: number; cx: number; b: number; w: number };
type Composition = { nom: string; meubles: Meuble[]; places: Place[]; table: Table };

const TABLE = (cx: number, b: number, w: number): Table => ({ src: "table-face", r: 1903 / 591, cx, b, w });
const COMPOSITIONS: Composition[] = [
  {
    // LA BANQUETTE DE CUIR ET LA TABLE RONDE — le premier plan de la vue validée.
    nom: "banquette",
    meubles: [
      {
        src: "banquette-face",
        r: 1571 / 708,
        cx: 0,
        b: 0,
        w: 470,
        avant: [[0, 0.3], [0.035, 0.27], [0.05, 0.5], [0.3, 0.5], [0.5, 0.49], [0.7, 0.5], [0.95, 0.5], [0.965, 0.27], [1, 0.3], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.281, v: 0.586, c: 0.5, h: 152 },
      { m: 0, u: 0.5, v: 0.576, c: 0.5, h: 154 },
      { m: 0, u: 0.719, v: 0.586, c: 0.5, h: 152, miroir: true },
    ],
    table: TABLE(0, -18, 360),
  },
  {
    // LE CANAPÉ BOUCLETTE — le milieu de la vue validée. Les fantômes s'enfoncent
    // dans l'assise ; le plateau et l'avant du coussin cachent leur bas.
    nom: "bouclette",
    meubles: [
      {
        src: "canape-bouclette",
        r: 2.115,
        cx: 0,
        b: 0,
        w: 507,
        avant: [[0, 0.12], [0.15, 0.15], [0.22, 0.3], [0.23, 0.5], [0.5, 0.48], [0.75, 0.44], [0.95, 0.41], [0.97, 0.2], [1, 0.2], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.42, v: 0.58, c: 0.49, h: 152 },
      { m: 0, u: 0.68, v: 0.555, c: 0.46, h: 152 },
    ],
    table: TABLE(7, -48, 217),
  },
  {
    // LE CANAPÉ VERT, retourné — le fond de la vue validée.
    nom: "vert",
    meubles: [
      {
        src: "canape-vert",
        r: 1.4875,
        cx: 0,
        b: -60,
        w: 486,
        miroir: true,
        avant: [[0, 0.17], [0.2, 0.2], [0.24, 0.3], [0.24, 0.48], [0.4, 0.51], [0.7, 0.49], [0.92, 0.46], [0.93, 0.2], [1, 0.17], [1, 1], [0, 1]],
      },
    ],
    places: [
      { m: 0, u: 0.41, v: 0.6, c: 0.53, h: 152 },
      { m: 0, u: 0.71, v: 0.58, c: 0.51, h: 152, miroir: true },
    ],
    // Le pied de sa table au même niveau que celui du premier plan : au-dessus du bouton.
    table: TABLE(8, -18, 266),
  },
];
/**
 * MOBILIER UNIFORME, POUR L'ESSAI DE CONTINUITÉ : la même banquette et la
 * même table pour toutes les discussions — ce qui change d'une discussion à
 * l'autre, ce sont les fantômes, le titre et ce qui est posé sur la table.
 * Les autres coins reviendront avec des meubles vus sous le même angle.
 */
export const compositionDe = (cle: string) => (void cle, COMPOSITIONS[0]);

/** Le haut d'un meuble, en points du premier plan. */
const hautDe = (m: { b: number; w: number; r: number }) => m.b - m.w / m.r;
/** Où s'assied une place : son centre, le bas du fantôme, la ligne d'assise. */
export function assise(c: Composition, p: Place) {
  const m = c.meubles[p.m];
  const mh = m.w / m.r;
  const u = m.miroir ? 1 - p.u : p.u;
  return { x: m.cx - m.w / 2 + u * m.w, bas: hautDe(m) + p.v * mh, coupe: hautDe(m) + p.c * mh, h: p.h };
}
/** L'étendue d'un groupe autour de son ancre, et le haut des têtes (où se rattache l'étiquette). */
export function etendue(c: Composition) {
  const tout = [...c.meubles, c.table];
  const tetes = Math.min(...c.places.map((p) => assise(c, p)).map((a) => a.bas - a.h));
  return {
    g: Math.min(...tout.map((m) => m.cx - m.w / 2)),
    d: Math.max(...tout.map((m) => m.cx + m.w / 2)),
    haut: Math.min(tetes, ...tout.map(hautDe)),
    tetes,
  };
}

/* ═══ LA TRAJECTOIRE : POSÉE AU SOL ════════════════════════════════════════
   « Chaque groupe doit sembler posé sur le parquet pendant tout le
   mouvement. » En perspective, un objet posé au sol, à l'échelle `s`, a son
   pied à `y = HORIZON + SOL × s` : sa taille et sa hauteur à l'écran ne sont
   pas libres, l'une donne l'autre. On ne fait donc évoluer que l'échelle
   (et la position en travers) ; le pied s'en déduit, toujours sur le sol.

   Cinq repères, en points de l'écran de référence :
   -1 : dans le passage, derrière la bibliothèque ;
    0 : le fond, devant l'entrée du passage, à gauche ;
    1 : le milieu, à droite, nettement plus petit ;
    2 : le premier plan, qui déborde des deux côtés ;
    3 : derrière le spectateur — on passe à côté de la table qui arrive.
   L'échelle s'interpole en logarithme (une distance qui change à vitesse
   régulière), la position en travers par une spline : pas de temps mort,
   la table qui arrive monte pendant que la précédente s'éloigne. */
const HORIZON = 300;
const SOL = 404;
const REPERES = [
  { x: 70, s: 0.09 },
  { x: 140, s: 0.27 },
  { x: 320, s: 0.5 },
  { x: 195, s: 1 },
  { x: 195, s: 3.2 },
];
/** Le mur du fond de la grande pièce (son pied), et l'ouverture du passage dans ce mur. */
const MUR = 346;
const OUVERTURE = { g: 45, d: 180 };
/** Où se rattache l'étiquette, par rapport à l'ancre (en points du premier plan), et où tombe sa pointe dans sa largeur. */
const POINTES = [
  { dx: -53, f: 0.6 },
  { dx: -53, f: 0.6 },
  { dx: -18, f: 0.5 },
  { dx: -165, f: 0.09 },
  { dx: -165, f: 0.09 },
];
const PREMIER = -1;
function catmull(a: number, b: number, c: number, d: number, t: number) {
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
function spline(pts: number[], place: number) {
  const s = Math.min(3, Math.max(-1, place)) - PREMIER;
  const i = Math.min(pts.length - 2, Math.floor(s));
  const t = s - i;
  const p = (k: number) => pts[Math.min(pts.length - 1, Math.max(0, k))];
  return catmull(p(i - 1), p(i), p(i + 1), p(i + 2), t);
}

/** Ce que la taille de l'écran et le geste décident : le décor, le sol, le bouton, la caméra. */
type Geo = {
  W: number;
  H: number;
  cta: number;
  d: ReturnType<typeof decorDe>;
  horizon: number;
  sol: number;
  xs: number[];
  ls: number[];
  /** L'échelle et le pied du premier plan. */
  sAvant: number;
  yAvant: number;
  /** LA CAMÉRA : pendant le passage d'une discussion à l'autre, toute la pièce s'avance légèrement. */
  cam: { z: number; ox: number; oy: number };
};
/**
 * LE BOUTON A SA ZONE, AU-DESSUS DE LA BARRE. Le pied des tables du premier
 * plan s'arrête au haut du bouton : si la hauteur manque (320 × 568), le
 * premier plan recule d'autant — il rapetisse ET remonte, toujours au sol.
 */
function geoDe(W: number, H: number, bas: number, p: number): Geo {
  const cta = H - bas - 10 - 46;
  const d = decorDe(W, H);
  const horizon = d.y(HORIZON);
  // Une échelle d'affichage `s` met le pied à SOL × s sous l'horizon, quelle que soit la taille de l'écran.
  const sol = SOL;
  const sAvant = Math.max(0.45, Math.min(d.k, (cta - horizon) / (sol - 18)));
  const f = p - Math.floor(p);
  return {
    W,
    H,
    cta,
    d,
    horizon,
    sol,
    xs: REPERES.slice(0, 4).map((r, i) => (i === 3 ? W / 2 : d.x(r.x))),
    ls: REPERES.slice(0, 4).map((r, i) => Math.log(i === 3 ? sAvant : r.s * d.k)),
    sAvant,
    yAvant: horizon + sol * sAvant,
    cam: { z: 1 + 0.035 * Math.sin(Math.PI * f), ox: W / 2, oy: horizon },
  };
}
/** Un point de la pièce, vu par la caméra. */
const vu = (geo: Geo, x: number, y: number) => ({ x: geo.cam.ox + (x - geo.cam.ox) * geo.cam.z, y: geo.cam.oy + (y - geo.cam.oy) * geo.cam.z });
/** Où est un groupe à sa place : son ancre à l'écran (son pied, au sol) et son échelle. */
/**
 * LE RYTHME DU PASSAGE (le même à l'aller et au retour : il ne dépend que de
 * la position). Le groupe qui quitte le premier plan démarre doucement ; celui
 * qui arrive commence à monter tôt. Rien ne change aux positions de repos.
 */
function rythme(place: number) {
  // `u` : où en est l'arrivée (0 → 1) ; elle va plus vite au début.
  if (place > 2 && place < 3) return 3 - (1 - (1 - (3 - place)) ** 1.3);
  if (place > 1 && place < 2) return 2 - (2 - place) ** 1.3;
  return place;
}
/** Où est un groupe à sa place : son ancre à l'écran (son pied, au sol) et son échelle. */
export function surLaTrajectoire(place: number, geo: Geo) {
  const q = rythme(place);
  if (q > 2) {
    // LE GROUPE QUI ARRIVE ne dépasse jamais sa taille du premier plan : il
    // monte par le bas de l'écran, à cette taille, jusqu'à sa place.
    const s = geo.sAvant;
    const y = geo.yAvant + (q - 2) * (geo.H + 262 * s - geo.yAvant);
    const v = vu(geo, geo.xs[3], y);
    return { x: v.x, y: v.y, s, sol: y };
  }
  const s = Math.exp(spline(geo.ls, q));
  const v = vu(geo, spline(geo.xs, q), geo.horizon + geo.sol * s);
  return { x: v.x, y: v.y, s: s * geo.cam.z, sol: geo.horizon + geo.sol * s };
}
/**
 * LE MUR DU FOND : un groupe dont le pied passe derrière lui n'est plus visible
 * que dans l'ouverture du passage — et la bibliothèque, devant, le cache.
 * Il y entre déjà à l'intérieur de l'ouverture : la coupe ne fait pas sauter l'image.
 */
function fenetre(place: number, geo: Geo) {
  const t = surLaTrajectoire(place, geo);
  if (t.sol >= geo.d.y(MUR)) return null;
  return { g: vu(geo, geo.d.x(OUVERTURE.g), 0).x, d: vu(geo, geo.d.x(OUVERTURE.d), 0).x };
}
/** Devant ou derrière la bibliothèque : selon que le pied du groupe est en deçà ou au-delà du sien. */
const devantBiblio = (place: number, geo: Geo) => surLaTrajectoire(place, geo).sol > geo.d.y(BIBLIO.pied);

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
  /** Un pas de défilement, une discussion. */
  const pas = Math.max(1, Math.round(H * 0.42));
  const n = scenes.length;
  const pMax = Math.max(0, n - 3);
  /** Moins de trois discussions : elles se rangent vers le premier plan, sans groupes fictifs. */
  const decalage = Math.max(0, 3 - n);
  const p = Math.min(pMax, Math.max(0, haut / pas));
  const geo = geoDe(W, H, taille.bas, p);
  const decor = geo.d;
  // LA PIÈCE ENTIÈRE SUIT LA CAMÉRA : le décor et la bibliothèque prennent le
  // même zoom que les groupes, autour du même point — tout reste collé au sol.
  const camera = (gauche: number, haut: number) => ({
    transform: `scale(${geo.cam.z})`,
    transformOrigin: `${geo.cam.ox - gauche}px ${geo.cam.oy - haut}px`,
  });

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

  const etiquettes = W > 0 ? placerEtiquettes(scenes, scenes.map((_, i) => i - p + decalage), geo, enHaut) : new Map<string, Place2>();

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
          <img className="gs-fond" src={`${D}${FOND.src}.webp`} alt="" aria-hidden="true" style={{ objectPosition: `50% ${-decor.oy}px`, ...camera(0, 0) }} />
          {W > 0 &&
            scenes.map((s, i) => {
              const place = i - p + decalage;
              if (place < -1.02 || place > 3) return null;
              const t = surLaTrajectoire(place, geo);
              // LES PLUS PROCHES DEVANT ; et devant la bibliothèque tant qu'ils sont en deçà d'elle.
              const z = (devantBiblio(place, geo) ? 200 : 100) + Math.round(place * 30);
              return <Groupe key={s.cle} s={s} ax={t.x} ay={t.y} e={t.s} z={z} place={place} fenetre={fenetre(place, geo)} />;
            })}
          {/* LA BIBLIOTHÈQUE : un calque à part, devant le bord gauche du passage —
              les groupes qui s'en vont disparaissent derrière elle. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gs-biblio" src={`${D}bibliotheque.webp`} alt="" aria-hidden="true" style={{ left: decor.x(BIBLIO.x), top: decor.y(BIBLIO.y), width: BIBLIO.l * decor.k, ...camera(decor.x(BIBLIO.x), decor.y(BIBLIO.y)) }} />
          {W > 0 &&
            scenes.map((s, i) => {
              const place = i - p + decalage;
              if (place < -0.3 || place > 3) return null;
              return <Etiquette key={s.cle} s={s} place={place} geo={geo} enHaut={enHaut} decale={etiquettes.get(s.cle)} onOuvrir={() => onOuvrir(s)} />;
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

/**
 * LE DESSIN D'UN GROUPE, ancré en `ax, ay` (le milieu de sa base) à l'échelle
 * `e`. Dessiné en points du premier plan puis réduit d'un `scale` : le
 * navigateur ne refait pas la mise en page des images à chaque pas.
 * `coupe` : ce qui recule dans le passage est coupé à droite par son montant.
 */
/** Un fantôme assis à une place : son image, son rapport largeur / hauteur, et une classe d'animation. */
export type Siege = { src: string; r: number; classe?: string };
export function Groupe({
  s,
  ax,
  ay,
  e,
  z,
  place,
  fenetre,
  sieges,
}: {
  s: Pick<SceneDeSalon, "cle" | "participants" | "contenu">;
  ax: number;
  ay: number;
  e: number;
  z?: number;
  place?: number;
  fenetre?: { g: number; d: number } | null;
  /** Qui est assis à chaque place (sinon : les participants, par leur prénom). `null` : place vide. */
  sieges?: (Siege | null)[];
}) {
  const c = compositionDe(s.cle);
  const assis = s.participants.slice(0, c.places.length);
  const occupants: (Siege | null)[] =
    sieges ??
    c.places.map((_, k) => {
      if (k >= assis.length) return null;
      const f = fantomeDe(assis[k]);
      return { src: `${D}${f.src}.webp`, r: f.r };
    });
  const image = (m: { src: string; r: number; cx: number; b: number; w: number; miroir?: boolean }, cle: string, avant?: Point[]) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={cle}
      className={`gs-meuble${m.miroir ? " miroir" : ""}`}
      src={`${D}${m.src}.webp`}
      alt=""
      style={{
        left: m.cx - m.w / 2,
        top: hautDe(m),
        width: m.w,
        height: m.w / m.r,
        ...(avant ? { clipPath: `polygon(${avant.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(",")})` } : {}),
      }}
    />
  );
  // DU FOND VERS L'AVANT : chaque siège, l'ombre de chaque place sur le coussin,
  // les fantômes, puis l'avant du siège par-dessus eux.
  const ordre = c.meubles.map((m, i) => ({ m, i })).sort((x, y) => x.m.b - y.m.b);
  const t = c.table;
  const tH = t.w / t.r;
  const tHaut = hautDe(t);
  const photos = s.contenu.slice(0, 2);
  const groupe = (
    <div className="gs-groupe" style={{ transform: `translate(${ax}px, ${ay}px) scale(${e})`, zIndex: fenetre == null ? z : undefined }} aria-hidden="true" data-cle={s.cle} data-place={place?.toFixed(3)}>
      {/* L'OMBRE AU SOL, sous les pieds des meubles : le groupe est posé sur le parquet. */}
      {c.meubles.map((m, i) => (
        <i key={`sol${i}`} className="gs-ombre-sol" style={{ left: m.cx - m.w * 0.5, top: m.b - m.w * 0.035, width: m.w, height: m.w * 0.07 }} />
      ))}
      {ordre.map(({ m, i }) => {
        const ici = c.places.map((pl, k) => ({ pl, k })).filter(({ pl, k }) => pl.m === i && occupants[k]);
        return [
          image(m, `m${i}`),
          ...ici.map(({ pl, k }) => {
            const a = assise(c, pl);
            const w = a.h * 0.95;
            return <i key={`os${k}`} className="gs-ombre-siege" style={{ left: a.x - w / 2, top: a.coupe - w * 0.09, width: w, height: w * 0.18 }} />;
          }),
          ...ici.map(({ pl, k }) => {
            const f = occupants[k]!;
            const a = assise(c, pl);
            const w = a.h * f.r;
            const src = f.src;
            const cadre = { left: a.x - w / 2, top: a.bas - a.h, width: w, height: a.h };
            // LA LUMIÈRE DE LA PIÈCE : le bas du fantôme s'assombrit, une lumière
            // chaude vient de la gauche (les lampes) — du même côté, retourné ou non.
            const sens = pl.miroir ? "to left" : "to right";
            const masque = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` };
            return [
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`f${k}`} className={`gs-fantome${pl.miroir ? " miroir" : ""}${f.classe ? ` ${f.classe}` : ""}`} src={src} alt="" style={cadre} />,
              <i
                key={`fo${k}`}
                className={`gs-teinte${pl.miroir ? " miroir" : ""}${f.classe ? ` ${f.classe}` : ""}`}
                style={{
                  ...cadre,
                  ...masque,
                  background: `linear-gradient(${sens},rgba(255,176,96,.3),rgba(255,176,96,0) 45%,rgba(60,28,10,0) 70%,rgba(60,28,10,.22)),linear-gradient(to bottom,rgba(0,0,0,0) 48%,rgba(70,32,10,.42) 100%)`,
                }}
              />,
              <i
                key={`fl${k}`}
                className={`gs-reflet${pl.miroir ? " miroir" : ""}${f.classe ? ` ${f.classe}` : ""}`}
                style={{ ...cadre, ...masque, background: `linear-gradient(${sens},rgba(255,190,110,.35),rgba(255,190,110,0) 35%)` }}
              />,
            ];
          }),
          ...(m.avant && ici.length ? [image(m, `a${i}`, m.avant)] : []),
          ...ici.map(({ pl, k }) => {
            const a = assise(c, pl);
            const w = a.h * 0.6;
            return <i key={`oc${k}`} className={`gs-ombre${occupants[k]?.classe ? ` ${occupants[k]!.classe}-ombre` : ""}`} style={{ left: a.x - w / 2, top: a.coupe + 2 - w * 0.1, width: w, height: w * 0.2 }} />;
          }),
        ];
      })}
      {/* L'ombre de la table sur l'assise, juste derrière le plateau, puis la table. */}
      <i className="gs-ombre-table" style={{ left: t.cx - t.w * 0.46, top: tHaut - 6, width: t.w * 0.92, height: 22 }} />
      {image(t, "table")}
      {/* LE CONTENU RÉELLEMENT PARTAGÉ, en grand et à plat sur le plateau ; deux
          choix : côte à côte. Rien de partagé : la table reste nue. */}
      {photos.map((src, i) => {
        const l = photos.length === 1 ? t.w * 0.45 : t.w * 0.215;
        const h = photos.length === 1 ? t.w * 0.29 : t.w * 0.2;
        const gauche = photos.length === 1 ? t.cx - l / 2 : i === 0 ? t.cx - l - t.w * 0.01 : t.cx + t.w * 0.01;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src + i} className="gs-contenu" src={src} alt="" style={{ left: gauche, top: tHaut + 0.626 * tH - h, width: l, height: h }} />
        );
      })}
    </div>
  );
  if (fenetre == null) return groupe;
  return (
    <div className="gs-passe" style={{ clipPath: `inset(0 calc(100% - ${fenetre.d}px) 0 ${fenetre.g}px)`, zIndex: z }}>
      {groupe}
    </div>
  );
}

const borne = (v: number) => Math.max(0, Math.min(1, v));

/**
 * « ON DOIT COMPRENDRE IMMÉDIATEMENT QUEL TITRE APPARTIENT À QUELLE TABLE. »
 * Chaque étiquette est posée juste au-dessus des têtes de SON groupe, une
 * pointe vers lui ; elle ne descend jamais sur les visages. Le détail suit la
 * profondeur, sans saut : au fond le titre et le statut, au milieu les
 * participants, au premier plan le dernier message dans le même bloc compact.
 */
function lecture(s: SceneDeSalon, place: number, geo: Geo, enHaut: number) {
  const { W } = geo;
  const c = compositionDe(s.cle);
  const et = etendue(c);
  const t = surLaTrajectoire(place, geo);
  const details = borne((place - 0.45) / 0.4);
  const message = s.dernier ? borne((place - 1.75) / 0.2) ** 2 : 0;
  const taille = 12.5 + 4 * borne((place - 0.2) / 1.8);
  const nb = s.nb ?? s.participants.length;
  const assis = s.participants.slice(0, c.places.length);
  const enPlus = nb - assis.length;
  const statut = s.prive ? "🔒 Privé" : "🌍 Public";
  const gens = s.membre ? `${assis.join(", ")}${enPlus > 0 ? ` +${enPlus}` : ""}` : `${nb} participant${nb > 1 ? "s" : ""}`;
  const maxi = Math.min(W - 16, 150 + 68 * borne(place - 1));
  const larg = Math.min(
    maxi,
    Math.max(
      s.titre.length * taille * 0.56 + 30,
      (statut.length + details * (gens.length + 3)) * 6.6 + 30,
      message > 0.05 && s.dernier ? (s.dernier.qui.length + s.dernier.texte.length) * 6.4 + 44 : 0,
    ),
  );
  const haut = taille * 1.25 + 30 + message * 26 + (s.debutDecouverte ? 26 : 0);
  const f = borne(spline(POINTES.map((q) => q.f), place));
  const pointeX = t.x + spline(POINTES.map((q) => q.dx), place) * t.s;
  // La pointe juste au-dessus des têtes ; jamais sous l'en-tête.
  // Le groupe qui ENTRE par le bas : son étiquette reste au-dessus de la zone du bouton.
  const pointeY = Math.min(geo.cta - 12, Math.max(enHaut + haut + 19, t.y + et.tetes * t.s - 6));
  const gauche = Math.min(W - 8 - larg, Math.max(8, pointeX - f * larg));
  return { t, et, x: gauche, y: pointeY, larg, haut, pointe: Math.min(larg - 16, Math.max(16, pointeX - gauche)), details, message, taille, statut, gens };
}

/**
 * DEUX ÉTIQUETTES NE SE CHEVAUCHENT JAMAIS, ET AUCUNE NE COUVRE UN VISAGE. La
 * plus proche garde sa place ; une étiquette qui gênerait s'efface en fondu,
 * son groupe reste visible et se touche.
 */
type Place2 = { dx: number; dy: number } | null;
function placerEtiquettes(scenes: SceneDeSalon[], places: number[], geo: Geo, enHaut: number) {
  const posees: { g: number; d: number; h: number; b: number }[] = [];
  const res = new Map<string, Place2>();
  const ordre = scenes.map((s, i) => ({ s, place: places[i] })).filter((x) => x.place > -0.3 && x.place < 2.25);
  ordre.sort((a, b) => b.place - a.place);
  // LES VISAGES DE TOUS LES GROUPES VISIBLES sont des obstacles : une étiquette n'en couvre aucun.
  const visages: { g: number; d: number; h: number; b: number }[] = [];
  scenes.forEach((s, i) => {
    const place = places[i];
    if (place <= -1 || place > 3) return;
    const c = compositionDe(s.cle);
    const t = surLaTrajectoire(place, geo);
    c.places.slice(0, s.participants.length).forEach((pl, k) => {
      const a = assise(c, pl);
      const w = a.h * fantomeDe(s.participants[k]).r * t.s;
      const x = t.x + a.x * t.s;
      const haut = t.y + (a.bas - a.h) * t.s;
      visages.push({ g: x - w * 0.36, d: x + w * 0.36, h: haut + a.h * t.s * 0.05, b: haut + a.h * t.s * 0.55 });
    });
  });
  const touche = (r: { g: number; d: number; h: number; b: number }, p: { g: number; d: number; h: number; b: number }, m: number) =>
    r.g < p.d + m && r.d > p.g - m && r.h < p.b + m && r.b > p.h - m;
  const libre = (r: { g: number; d: number; h: number; b: number }) =>
    r.g >= 4 && r.d <= geo.W - 4 && r.h >= enHaut + 10 && r.b <= geo.cta - 4 && !posees.some((p) => touche(r, p, 3)) && !visages.some((v) => touche(r, v, 1));
  for (const { s, place } of ordre) {
    const l = lecture(s, place, geo, enHaut);
    const base = { g: l.x, d: l.x + l.larg, h: l.y - 7 - l.haut, b: l.y };
    // UNE PLACE PAR PROFONDEUR, SANS CORRECTION : l'étiquette accompagne sa
    // table ; si elle gênait (un visage, une étiquette plus proche), elle
    // s'efface le temps du passage plutôt que de se promener dans la pièce.
    if (libre(base)) {
      res.set(s.cle, { dx: 0, dy: 0 });
      posees.push(base);
    } else res.set(s.cle, null);
  }
  return res;
}

/** L'étiquette, la zone qu'on touche, et le bouton du premier plan. */
function Etiquette({
  s,
  place,
  geo,
  enHaut,
  decale,
  onOuvrir,
}: {
  s: SceneDeSalon;
  place: number;
  geo: Geo;
  enHaut: number;
  decale: Place2 | undefined;
  onOuvrir: () => void;
}) {
  const l = lecture(s, place, geo, enHaut);
  const masquee = decale === null;
  const dx = decale?.dx ?? 0;
  const dy = decale?.dy ?? 0;
  const { t, et } = l;
  // ELLE S'EN VA AVEC SON GROUPE : effacée pendant qu'il recule dans le passage,
  // absente une fois qu'il est derrière la bibliothèque.
  const visible = place > -0.3;
  // Le groupe qui entre n'a d'étiquette qu'une fois presque arrivé : rien ne flotte au bas de l'écran.
  const opacite = masquee ? 0 : place < 0 ? borne((place + 0.3) / 0.3) : place > 2.05 ? borne((2.25 - place) / 0.2) : 1;
  // TOUT GROUPE VISIBLE SE TOUCHE — plus dès qu'il commence à passer derrière le montant du passage.
  const touchable = place > -0.05;
  const action = s.membre ? "Ouvrir la discussion" : "Voir la discussion";
  const ctaVu = borne(1 - (Math.abs(place - 2) - 0.1) / 0.3);
  return (
    <>
      <button
        type="button"
        className="gs-zone"
        data-cle={s.cle}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          left: t.x + et.g * t.s,
          top: t.y + et.haut * t.s,
          width: (et.d - et.g) * t.s,
          height: -et.haut * t.s,
          pointerEvents: touchable ? "auto" : "none",
          zIndex: 400 + Math.round(place * 10),
        }}
        onClick={onOuvrir}
      />
      <div
        className="gs-plaque"
        data-cle={s.cle}
        aria-hidden={masquee || undefined}
        style={{
          left: l.x + dx,
          top: l.y - 7 + dy,
          width: l.larg,
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
          {s.dernier && l.message > 0.05 && (
            <span className="gs-dernier" style={{ maxHeight: l.message * 26, opacity: l.message, marginTop: 5 * l.message, paddingTop: 3 * l.message, paddingBottom: 3 * l.message }}>
              <i>{s.dernier.qui} :</i> {s.dernier.texte}
            </span>
          )}
          {s.nonLus > 0 && <em>{s.nonLus > 9 ? "9+" : s.nonLus}</em>}
        </button>
        <i className="gs-pointe" style={{ left: Math.min(l.larg - 16, Math.max(16, l.pointe - dx)) }} aria-hidden="true" />
      </div>
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
              {larg > 0 && <GroupeFixe s={s} larg={Math.min(320, (larg - 48) * 0.92)} />}
            </span>
            <span className="gs-cta-calme">{s.membre ? "Ouvrir la discussion" : "Voir la discussion"} →</span>
          </button>
        );
      })}
    </div>
  );
}

/** Le même groupe, immobile, à une largeur donnée (mouvements réduits). */
function GroupeFixe({ s, larg }: { s: SceneDeSalon; larg: number }) {
  const et = etendue(compositionDe(s.cle));
  const e = larg / (et.d - et.g);
  const h = -et.haut * e;
  return (
    <span style={{ position: "relative", display: "block", width: larg, height: h, margin: "0 auto" }}>
      <Groupe s={s} ax={larg / 2 - ((et.g + et.d) / 2) * e} ay={h} e={e} />
    </span>
  );
}

export function StylesGrandSalon() {
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
.gs-groupe{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;pointer-events:none;will-change:transform;}
.gs-groupe img,.gs-groupe i{position:absolute;display:block;max-width:none;max-height:none;}
.gs-passe{position:absolute;inset:0;pointer-events:none;}
.gs-meuble.miroir,.gs-fantome.miroir,.gs-teinte.miroir,.gs-reflet.miroir{transform:scaleX(-1);}
.gs-fantome{filter:drop-shadow(0 2px 3px rgba(40,20,5,.25));}
.gs-teinte,.gs-reflet{-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;mix-blend-mode:multiply;}
.gs-reflet{mix-blend-mode:soft-light;}
.gs-ombre,.gs-ombre-siege,.gs-ombre-table{border-radius:50%;}
.gs-ombre{background:radial-gradient(ellipse at 50% 50%,rgba(30,14,4,.55),rgba(30,14,4,0) 70%);}
.gs-ombre-siege{background:radial-gradient(ellipse,rgba(40,16,4,.55),rgba(40,16,4,.28) 45%,rgba(40,16,4,0) 72%);}
.gs-ombre-sol{border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(18,7,2,.6),rgba(18,7,2,.3) 50%,rgba(18,7,2,0) 72%);}
.gs-ombre-table{background:radial-gradient(ellipse,rgba(30,12,3,.45),rgba(30,12,3,0) 70%);}
.gs-contenu{object-fit:cover;border:4px solid #fbf6ee;border-radius:6px;box-sizing:border-box;box-shadow:0 4px 10px rgba(30,14,4,.45);
  transform:perspective(420px) rotateX(62deg);transform-origin:50% 100%;}
.gs-biblio{position:absolute;height:auto;max-width:none;z-index:150;pointer-events:none;filter:brightness(.82) drop-shadow(4px 0 8px rgba(20,8,2,.4));}
.gs-zone{position:absolute;padding:0;border:0;background:none;cursor:pointer;}
.gs-plaque{position:absolute;display:grid;justify-items:stretch;gap:5px;transform:translateY(-100%);transition:opacity .18s;}
.gs-pointe{position:absolute;bottom:-7px;width:14px;height:14px;margin-left:-7px;transform:rotate(45deg);background:rgba(28,17,10,.9);
  border-right:1px solid rgba(255,214,170,.24);border-bottom:1px solid rgba(255,214,170,.24);pointer-events:none;}
.gs-dernier{display:block;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden;margin-top:5px;padding:3px 9px;border-radius:9px;background:#fffaf2;color:#2A1608;font-size:12px;line-height:1.35;
  white-space:nowrap;text-overflow:ellipsis;text-align:left;}
.gs-dernier i{font-style:normal;font-weight:800;color:#B0306A;}
.gs-section{padding:3px 10px;border-radius:999px;background:rgba(245,162,58,.92);color:#2A1608;font-size:11.5px;font-weight:800;letter-spacing:.02em;}
.gs-titre{position:relative;display:grid;justify-items:start;grid-template-columns:minmax(0,1fr);width:100%;max-width:100%;min-height:40px;padding:6px 12px 7px;border-radius:13px;border:1px solid rgba(255,214,170,.24);
  background:rgba(28,17,10,.86);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  box-shadow:0 5px 14px rgba(20,10,4,.3);box-sizing:border-box;}
.gs-titre b{display:block;max-width:100%;font-family:Georgia,"Times New Roman",serif;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gs-ligne{display:flex;max-width:100%;font-size:11px;color:#E9D6C2;line-height:1.35;white-space:nowrap;}
.gs-gens{display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:pre;}
.gs-titre em{position:absolute;top:-8px;right:-8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#FF3E8E;color:#fff;
  font-style:normal;font-size:12px;font-weight:800;line-height:22px;}
.gs-cta{position:absolute;left:50%;transform:translateX(-50%);height:46px;padding:0 22px;border:0;border-radius:999px;background:linear-gradient(180deg,#F8B451,#E8932A);
  color:#2A1608;font:inherit;font-size:15.5px;font-weight:800;white-space:nowrap;cursor:pointer;box-shadow:0 8px 18px rgba(20,10,4,.4);}
.gs-vide{position:absolute;left:16px;right:16px;display:grid;justify-items:center;gap:8px;padding:18px;border-radius:18px;background:rgba(28,17,10,.82);text-align:center;z-index:800;}
.gs-vide b{font-size:17px;}
.gs-vide span{font-size:13.5px;color:#E9D6C2;}
.gs-vide button{height:46px;padding:0 20px;border:0;border-radius:999px;background:linear-gradient(180deg,#F8B451,#E8932A);color:#2A1608;font:inherit;font-weight:800;cursor:pointer;}
.gs-nouveau{position:absolute;left:50%;transform:translateX(-50%);z-index:900;height:36px;padding:0 14px;border:0;border-radius:999px;background:#FFF4E6;color:#2A1608;
  font:inherit;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 14px rgba(20,10,4,.35);}
.gs.calme{scroll-snap-type:none;padding:0 12px 24px;background:#2a1a10 url(/direct/ensemble/fond-salon.webp) 50% 0/cover fixed;}
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
