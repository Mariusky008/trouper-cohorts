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
   image (`r` = largeur / hauteur). Les places (`places`) disent où s'asseyent
   les fantômes, dans l'ordre où on les remplit ; ils passent DERRIÈRE la
   table (`devant`) et DEVANT les sièges (`derriere`). `plateau` : les quatre
   coins du dessus de la table, où se pose le contenu partagé. */
type Meuble = { src: string; r: number; cx: number; b: number; w: number; miroir?: boolean };
type Place = { cx: number; b: number; h: number; miroir?: boolean };
type Composition = { nom: string; derriere: Meuble[]; places: Place[]; devant: Meuble[]; plateau: [number, number][] };

const COMPOSITIONS: Composition[] = [
  {
    // LE CANAPÉ VERT ET LA TABLE DE TRAVERTIN — deux places, en face.
    nom: "canape-vert",
    derriere: [{ src: "canape-vert", r: 1.4875, cx: 0.5, b: 0.62, w: 1 }],
    places: [
      { cx: 0.29, b: 0.67, h: 0.44 },
      { cx: 0.71, b: 0.67, h: 0.44, miroir: true },
    ],
    devant: [{ src: "table-travertin", r: 2.235, cx: 0.5, b: 0.93, w: 0.74 }],
    plateau: [
      [0.33, 0.615],
      [0.67, 0.615],
      [0.7, 0.695],
      [0.3, 0.695],
    ],
  },
  {
    // LE CANAPÉ DE CUIR, LE FAUTEUIL BOUCLETTE, LA TABLE AUX PIEDS DE LAITON.
    nom: "canape-cuir",
    derriere: [
      { src: "canape-cuir", r: 1.559, cx: 0.37, b: 0.62, w: 0.74 },
      { src: "fauteuil-bouclette", r: 1.368, cx: 0.83, b: 0.71, w: 0.44 },
    ],
    places: [
      { cx: 0.27, b: 0.63, h: 0.4 },
      { cx: 0.82, b: 0.67, h: 0.36, miroir: true },
      { cx: 0.5, b: 0.63, h: 0.38 },
    ],
    devant: [{ src: "table-laiton", r: 1.8525, cx: 0.55, b: 0.94, w: 0.64 }],
    plateau: [
      [0.4, 0.61],
      [0.72, 0.61],
      [0.76, 0.69],
      [0.36, 0.69],
    ],
  },
  {
    // LE CANAPÉ BOUCLETTE, DEUX FAUTEUILS DE CUIR, LA TABLE RONDE — quatre places.
    nom: "table-ronde",
    derriere: [
      { src: "canape-bouclette", r: 2.115, cx: 0.5, b: 0.56, w: 0.8 },
      { src: "fauteuil-cuir", r: 1.2875, cx: 0.14, b: 0.84, w: 0.34 },
      { src: "fauteuil-cuir", r: 1.2875, cx: 0.86, b: 0.84, w: 0.34, miroir: true },
    ],
    places: [
      { cx: 0.4, b: 0.6, h: 0.36 },
      { cx: 0.62, b: 0.6, h: 0.36, miroir: true },
      { cx: 0.15, b: 0.76, h: 0.32 },
      { cx: 0.85, b: 0.76, h: 0.32, miroir: true },
    ],
    devant: [{ src: "table-ronde", r: 1.893, cx: 0.5, b: 0.91, w: 0.44 }],
    plateau: [
      [0.36, 0.69],
      [0.64, 0.69],
      [0.67, 0.745],
      [0.33, 0.745],
    ],
  },
  {
    // LES TROIS CHAISES DE VELOURS AUTOUR DE LA TABLE RONDE.
    nom: "chaises",
    derriere: [{ src: "chaises-velours", r: 2.34, cx: 0.5, b: 0.6, w: 0.96 }],
    places: [
      { cx: 0.2, b: 0.6, h: 0.34 },
      { cx: 0.5, b: 0.58, h: 0.34 },
      { cx: 0.8, b: 0.6, h: 0.34, miroir: true },
    ],
    // LA TABLE AU MILIEU DES CHAISES, pas posée devant elles : son plateau
    // passe devant le bas des fantômes.
    devant: [{ src: "table-ronde", r: 1.893, cx: 0.5, b: 0.84, w: 0.52 }],
    plateau: [
      [0.338, 0.591],
      [0.662, 0.591],
      [0.695, 0.656],
      [0.305, 0.656],
    ],
  },
];
/** Le haut et le bas de la boîte d'une composition, en largeurs de groupe. */
function boite(c: Composition) {
  const meubles = [...c.derriere, ...c.devant];
  const haut = Math.min(...meubles.map((m) => m.b - m.w / m.r), ...c.places.map((p) => p.b - p.h));
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
export function surLaTrajectoire(place: number, echelle = 1) {
  const s = Math.min(3, Math.max(-1, place)) - PREMIER;
  const i = Math.min(REPERES.length - 2, Math.floor(s));
  const t = s - i;
  const p = (k: number) => REPERES[Math.min(REPERES.length - 1, Math.max(0, k))];
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
  const [taille, setTaille] = useState({ W: 0, H: 0 });
  const [haut, setHaut] = useState(positionGardee);
  const [calme] = useState(reduit);
  const [nouveau, setNouveau] = useState(false);

  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setTaille({ W: e.clientWidth, H: e.clientHeight }));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);

  const { W, H } = taille;
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

  const masquees = W > 0 ? etiquettesMasquees(scenes, scenes.map((_, i) => i - p + decalage), W, H, enHaut) : new Set<string>();

  if (calme) return <SalonCalme scenes={scenes} onOuvrir={onOuvrir} onIdee={onIdee} enHaut={enHaut} recherche={recherche} />;

  return (
    <div className="gs" ref={ref} onScroll={surDefilement} aria-label="Tes discussions, dans le salon">
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
              return <Groupe key={s.cle} s={s} place={place} W={W} H={H} />;
            })}
          {/* LA BIBLIOTHÈQUE : un calque à part, devant les groupes qui s'en vont. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gs-biblio" src={`${D}bibliotheque.webp`} alt="" aria-hidden="true" />
          {W > 0 &&
            scenes.map((s, i) => {
              const place = i - p + decalage;
              if (place < -0.3 || place > 2.6) return null;
              return <Etiquette key={s.cle} s={s} place={place} W={W} H={H} enHaut={enHaut} masquee={masquees.has(s.cle)} onOuvrir={() => onOuvrir(s)} />;
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
function Groupe({ s, place, W, H, fixe }: { s: SceneDeSalon; place: number; W: number; H: number; fixe?: number }) {
  const c = compositionDe(s.cle);
  const bx = boite(c);
  const e = echelleDe(W, H);
  const t = surLaTrajectoire(place, e);
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
  const meuble = (m: Meuble, i: number) => {
    const h = m.w / m.r;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${m.src}${i}`}
        className={`gs-meuble${m.miroir ? " miroir" : ""}`}
        src={`${D}${m.src}.webp`}
        alt=""
        style={{ left: `${(m.cx - m.w / 2) * 100}%`, top: `${enY(m.b - h)}%`, width: `${m.w * 100}%` }}
      />
    );
  };
  const plateau = c.plateau.map(([x, y]) => [x * base, ((y - bx.haut) / bx.h) * hPx] as [number, number]);
  return (
    <div className="gs-groupe" style={style} aria-hidden="true" data-cle={s.cle}>
      {c.derriere.map(meuble)}
      {assis.map((nom, i) => {
        const pl = c.places[i];
        const f = fantomeDe(nom);
        const w = pl.h * f.r;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={nom + i}
            className={`gs-fantome${pl.miroir ? " miroir" : ""}`}
            src={`${D}${f.src}.webp`}
            alt=""
            style={{ left: `${(pl.cx - w / 2) * 100}%`, top: `${enY(pl.b - pl.h)}%`, width: `${w * 100}%` }}
          />
        );
      })}
      {c.devant.map(meuble)}
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

/** Où se pose l'étiquette d'un groupe : son pied (`y`), son centre (`x`), et la place qu'elle prend au plus. */
function ancrage(s: SceneDeSalon, place: number, W: number, H: number, enHaut: number) {
  const bx = boite(compositionDe(s.cle));
  const t = surLaTrajectoire(place, echelleDe(W, H));
  const gw = t.w * W;
  const top = t.y * H - bx.h * gw;
  // JAMAIS SOUS L'EN-TÊTE : l'étiquette du fond descend sur son groupe
  // plutôt que de passer sous les filtres.
  const y = Math.max(enHaut + (s.debutDecouverte ? 76 : 54), top + gw * 0.08);
  const x = Math.min(W - 12, Math.max(12, t.x * W));
  const larg = place > 1.6 ? Math.min(W * 0.8, 300) : place < 0.5 ? Math.min(W * 0.56, 210) : Math.min(W * 0.64, 250);
  const haut = (place > 1.6 ? 52 : place < 0.5 ? 42 : 48) + (s.debutDecouverte ? 26 : 0);
  return { t, gw, top, x, y, larg, haut };
}

/**
 * DEUX ÉTIQUETTES NE SE CHEVAUCHENT JAMAIS. Sur un téléphone court, le fond et
 * le milieu se rapprochent : la plus proche garde la sienne, la plus lointaine
 * s'efface — son groupe reste visible et se touche toujours.
 */
function etiquettesMasquees(scenes: SceneDeSalon[], places: number[], W: number, H: number, enHaut: number) {
  const posees: { g: number; d: number; h: number; b: number }[] = [];
  const masquees = new Set<string>();
  const ordre = scenes.map((s, i) => ({ s, place: places[i] })).filter((x) => x.place > -0.3 && x.place < 2.6);
  ordre.sort((a, b) => b.place - a.place);
  for (const { s, place } of ordre) {
    const a = ancrage(s, place, W, H, enHaut);
    // Seule la largeur réelle du titre compte, pas la largeur permise.
    const larg = Math.min(a.larg, 40 + s.titre.length * (place > 1.6 ? 9 : 7.5));
    const r = { g: a.x - larg / 2, d: a.x + larg / 2, h: a.y - a.haut, b: a.y };
    if (posees.some((p) => r.g < p.d + 4 && r.d > p.g - 4 && r.h < p.b + 4 && r.b > p.h - 4)) masquees.add(s.cle);
    else posees.push(r);
  }
  return masquees;
}

/** Le titre, le statut, les membres — un vrai bouton, à taille lisible. */
function Etiquette({
  s,
  place,
  W,
  H,
  enHaut,
  masquee,
  onOuvrir,
}: {
  s: SceneDeSalon;
  place: number;
  W: number;
  H: number;
  enHaut: number;
  masquee: boolean;
  onOuvrir: () => void;
}) {
  const c = compositionDe(s.cle);
  const bx = boite(c);
  const { t, gw, top, x, y } = ancrage(s, place, W, H, enHaut);
  // ELLE S'EN VA AVEC SON GROUPE : plus d'étiquette ni de zone touchable une
  // fois qu'il est passé derrière la bibliothèque.
  // AU REPOS, UNE ÉTIQUETTE EST PLEINE OU ABSENTE : au fond (place 0) elle se
  // lit entière ; elle ne s'efface que pendant la sortie vers la bibliothèque.
  // Masquée, elle s'efface en fondu (pas de saut) et ne se touche plus.
  const visible = place > -0.3;
  const opacite = masquee ? 0 : place < 0 ? Math.max(0, (place + 0.3) / 0.3) : place > 2.35 ? Math.max(0, (2.6 - place) / 0.25) : 1;
  // LE GROUPE NE SE TOUCHE PLUS dès qu'il commence à passer derrière la bibliothèque.
  const touchable = place > -0.05;
  const proche = place > 1.6;
  const loin = place < 0.5;
  const nb = s.nb ?? s.participants.length;
  const assis = s.participants.slice(0, c.places.length);
  const enPlus = nb - assis.length;
  const action = s.membre ? "Ouvrir la discussion" : "Voir la discussion";
  const ctaVu = Math.max(0, Math.min(1, 1 - (Math.abs(place - 2) - 0.1) / 0.3));
  return (
    <>
      {/* TOUT LE GROUPE SE TOUCHE — un appui, pas un défilement. */}
      <button
        type="button"
        className="gs-zone"
        data-cle={s.cle}
        tabIndex={-1}
        aria-hidden="true"
        style={{ left: t.x * W - gw / 2, top, width: gw, height: bx.h * gw, pointerEvents: touchable ? "auto" : "none", zIndex: 400 + Math.round(place * 10) }}
        onClick={onOuvrir}
      />
      <div
        className={`gs-plaque${proche ? " proche" : loin ? " loin" : ""}`}
        data-cle={s.cle}
        aria-hidden={masquee || undefined}
        style={{
          left: x,
          top: y,
          opacity: opacite,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: opacite > 0.5 ? undefined : "none",
          zIndex: 600 + Math.round(place * 10),
        }}
      >
        {s.debutDecouverte && <span className="gs-section">Salons publics à découvrir</span>}
        <button type="button" className="gs-titre" onClick={onOuvrir} aria-label={`${s.titre} — ${action}`}>
          <b>{s.titre}</b>
          <span>
            {s.prive ? "🔒 Privé" : "🌍 Salon public"} · {s.membre ? assis.join(", ") : `${nb} participant${nb > 1 ? "s" : ""}`}
            {enPlus > 0 && s.membre ? ` +${enPlus}` : ""}
          </span>
          {s.nonLus > 0 && <em>{s.nonLus > 9 ? "9+" : s.nonLus}</em>}
        </button>
        {proche && s.dernier && s.nonLus > 0 && (
          <p className="gs-bulle">
            <span>
              <i>{s.dernier.qui} :</i> {s.dernier.texte}
            </span>
          </p>
        )}
      </div>
      {proche && (
        <button
          type="button"
          className="gs-cta"
          // LE BOUTON SUIT LE GROUPE AU PREMIER PLAN, et seulement lui : plein
          // à la place 2, effacé dès qu'un autre groupe y prend sa place.
          style={{ top: Math.min(H - 112, t.y * H - 18), opacity: ctaVu, visibility: ctaVu > 0 ? "visible" : "hidden", pointerEvents: ctaVu > 0.5 ? "auto" : "none", zIndex: 700 }}
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
              {larg > 0 && <Groupe s={s} place={2} W={larg} H={larg * 2} fixe={Math.min(320, (larg - 48) * 0.92)} />}
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
.gs-contenu{position:absolute;left:0;top:0;transform-origin:0 0;object-fit:cover;border-radius:6px;border:5px solid #fbf6ee;box-sizing:border-box;
  box-shadow:0 3px 8px rgba(30,14,4,.35);}
.gs-biblio{position:absolute;left:-1%;top:-1%;width:31%;height:auto;z-index:350;pointer-events:none;filter:drop-shadow(6px 0 10px rgba(30,14,4,.35));}
.gs-zone{position:absolute;padding:0;border:0;background:none;cursor:pointer;}
.gs-plaque{position:absolute;display:grid;justify-items:center;gap:5px;transform:translate(-50%,-100%);width:max-content;max-width:min(64%,250px);transition:opacity .18s;}
.gs-section{padding:3px 10px;border-radius:999px;background:rgba(245,162,58,.92);color:#2A1608;font-size:11.5px;font-weight:800;letter-spacing:.02em;}
.gs-titre{position:relative;display:grid;justify-items:center;gap:0;min-height:44px;padding:5px 12px 6px;border-radius:12px;border:1px solid rgba(255,214,170,.28);
  background:rgba(28,17,10,.82);color:#FFF4E6;font:inherit;text-align:center;cursor:pointer;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  box-shadow:0 6px 16px rgba(20,10,4,.35);}
.gs-titre b{font-family:Georgia,"Times New Roman",serif;font-size:14px;font-weight:700;line-height:1.2;overflow-wrap:anywhere;}
.gs-titre span{font-size:11px;color:#E9D6C2;line-height:1.3;}
.gs-plaque.proche{max-width:min(80%,300px);}
.gs-plaque.loin{max-width:min(56%,210px);}
.gs-plaque.loin .gs-titre{min-height:40px;padding:4px 10px 5px;}
.gs-plaque.loin .gs-titre b{font-size:13px;}
.gs-plaque.loin .gs-titre span{font-size:10.5px;}
.gs-plaque.proche .gs-titre b{font-size:17px;}
.gs-plaque.proche .gs-titre span{font-size:12px;}
.gs-titre em{position:absolute;top:-8px;right:-8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#FF3E8E;color:#fff;
  font-style:normal;font-size:12px;font-weight:800;line-height:22px;}
.gs-bulle{margin:0;max-width:210px;padding:5px 10px;border-radius:12px 12px 12px 4px;background:#fffaf2;color:#2A1608;font-size:12px;line-height:1.3;
  box-shadow:0 4px 10px rgba(20,10,4,.3);overflow-wrap:anywhere;}
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
