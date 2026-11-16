/**
 * 🧍 LES POSES DE LA FIGURINE — l'essai P0 (`docs/univers/poses-figurine.md`, 16 novembre 2026). Ce qui se partage entre
 * le serveur et l'écran : la liste des poses, et les endroits de la pièce où la figurine peut aller.
 *
 * Le propriétaire, après la maquette de la messagerie visuelle (« attaque aussi les figurines ») : une figurine n'existe
 * aujourd'hui que dans une image, assise dans son fauteuil ; elle respire, se penche, danse sur place, mais ne peut pas se
 * lever. Les poses : une petite série d'images d'elle, sur un fond transparent, faites une fois (debout, qui marche,
 * assise sans fauteuil, de dos, qui danse, qui fait coucou, une tasse à la main, les bras ouverts). La pièce, elle, dit
 * où aller : son siège, devant la télé, près de l'étagère, à côté de l'autre. D'abord sur la figurine du propriétaire,
 * pour juger si elle se ressemble d'une pose à l'autre ; rien d'autre ne commence avant son avis.
 */
import { ANCRE_ASSISE, PLACES_PAR_DEFAUT, assisesDe, hauteurDuo, type EmplacementsDuo, type PieceDuo } from "./pieces-duo";

/**
 * Les poses, dans l'ordre où elles se font. « Debout » d'abord : les autres se font d'après la figurine assise (son
 * visage, sa tenue) ET la pose debout (ses jambes, ses chaussures, qu'il a fallu inventer une fois). `apres` : une pose
 * faite aussi d'après une autre (le second pas, d'après le premier). `taille` : sa hauteur à l'écran, comparée à la pose
 * debout (les bras levés dépassent la tête ; assise, elle est plus petite). `regard` : vers où elle est tournée dans
 * l'image (« droite » : l'écran la retourne pour aller à gauche).
 */
export const POSES_FIGURINE = [
  {
    cle: "debout",
    nom: "Debout",
    emoji: "🧍",
    en: "STANDING upright, facing us (turned very slightly toward the right side of the image), arms relaxed along its body, both feet flat, a relaxed friendly smile",
    taille: 1,
    regard: "face",
  },
  {
    cle: "marche-1",
    nom: "Elle marche (un pas)",
    emoji: "🚶",
    en: "WALKING toward the RIGHT side of the image, seen in three-quarter view: mid-stride, its LEFT leg forward and its right leg behind, its right arm swinging forward and its left arm back; we still see its face",
    taille: 0.98,
    regard: "droite",
  },
  {
    cle: "marche-2",
    nom: "Elle marche (l’autre pas)",
    emoji: "🚶",
    en: "WALKING toward the RIGHT side of the image, exactly like IMAGE 3 (same view, same size, same direction), but the other step: its RIGHT leg forward and its left leg behind, its left arm swinging forward and its right arm back",
    apres: "marche-1",
    taille: 0.98,
    regard: "droite",
  },
  {
    cle: "assise",
    nom: "Assise, sans fauteuil",
    emoji: "🪑",
    en: "SEATED on an invisible seat (there is NO chair): thighs horizontal, knees bent, lower legs hanging down naturally, hands resting on its knees; its body and face turned three-quarters toward the RIGHT side of the image, relaxed, as if chatting with a friend",
    taille: 0.82,
    regard: "droite",
  },
  {
    cle: "dos",
    nom: "De dos (elle regarde la télé)",
    emoji: "📺",
    en: "standing, seen from BEHIND: we see its back, the back of its head and its hair, as if it were watching a screen on the wall in front of it; its head turned very slightly to the right so we glimpse its cheek",
    taille: 1,
    regard: "dos",
  },
  {
    cle: "danse",
    nom: "Elle danse",
    emoji: "💃",
    en: "DANCING joyfully: both arms raised above its head, one knee lifted, hips swaying, a big happy smile, full of energy",
    taille: 1.14,
    regard: "face",
  },
  {
    cle: "coucou",
    nom: "Elle fait coucou",
    emoji: "👋",
    en: "standing, facing us, WAVING hello with one hand raised high above its shoulder, a big warm smile",
    taille: 1.06,
    regard: "face",
  },
  {
    cle: "tasse",
    nom: "Une tasse à la main",
    emoji: "☕",
    en: "standing, facing us, holding a big steaming mug of hot chocolate in both hands at chest height, cosy and content",
    taille: 1,
    regard: "face",
  },
  {
    cle: "calin",
    nom: "Les bras ouverts (un câlin)",
    emoji: "🤗",
    en: "standing, facing us, its ARMS WIDE OPEN for a hug, a tender happy smile",
    taille: 1,
    regard: "face",
  },
] as const;
export type PoseFigurine = (typeof POSES_FIGURINE)[number]["cle"];
export const poseFigurineValide = (x: unknown): x is PoseFigurine => POSES_FIGURINE.some((p) => p.cle === x);
export const poseFigurineDe = (p: PoseFigurine) => POSES_FIGURINE.find((x) => x.cle === p)!;

/** 💶 Une pose, environ (une image en haute qualité, novembre 2026). */
export const COUT_POSE_FIGURINE = 0.2;

export const AVIS_POSES = [
  { cle: "oui", dit: "👍 C’est bien ma figurine, dans chaque pose" },
  { cle: "presque", dit: "😐 Presque : un détail change d’une pose à l’autre" },
  { cle: "non", dit: "👎 Ce n’est plus elle" },
] as const;
export type AvisPoses = (typeof AVIS_POSES)[number]["cle"];
export const avisPosesValide = (x: unknown): x is AvisPoses => AVIS_POSES.some((a) => a.cle === x);

/** L'état de l'essai, pour la page d'essais. */
export type PoseVue = { cle: PoseFigurine; nom: string; emoji: string; image?: string };
export type PieceAVisiter = { cle: PieceDuo; nom: string; emoji: string; decor: string; emplacements?: EmplacementsDuo; ajuste?: boolean };
export type EtatPosesFigurine = {
  /** sa figurine assise, dans son fauteuil (signée) : d'où viennent les poses */
  figurine?: string;
  poses: PoseVue[];
  /** les pièces du duo déjà faites, vides : la scène s'y joue */
  pieces: PieceAVisiter[];
  avis?: { avis: AvisPoses; note?: string; le: string };
  moteur: boolean;
};

// ─── 🗺️ OÙ ALLER DANS LA PIÈCE ──────────────────────────────────────────────────────────────────────────────────────
/** Un endroit où se tenir : `x` le milieu de ses pieds, `pieds` le sol sous eux, `echelle` sa taille là (la profondeur). */
export type Endroit = { x: number; pieds: number; echelle: number };
export type Ancres = {
  /** sa place (celle de gauche) : le point où elle touche le siège, et sa hauteur assise entière */
  siege: { x: number; y: number };
  /** la hauteur de la figurine DEBOUT à sa place, en part de la hauteur de l'image */
  hauteur: number;
  /** debout devant son siège */
  place: Endroit;
  /** debout à côté de l'autre place (pour le câlin) */
  autre: Endroit;
  /** devant la télé, près de l'étagère : si la pièce les a */
  tele?: Endroit;
  etagere?: Endroit;
};

/** Debout, une figurine (grosse tête, petit corps) est un peu plus haute qu'assise, les jambes pendantes. */
export const DEBOUT_SUR_ASSISE = 1.22;
const borne = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Les endroits d'une pièce, d'après ses emplacements (`releve.json`) : sa place est celle de gauche ; ses pieds, debout
 * devant, sont là où ils pendent assise. Devant la télé ou l'étagère, on est un peu plus loin (plus haut dans l'image,
 * un peu plus petit), sans jamais passer derrière le mur.
 */
export function ancresDeLaPiece(e: EmplacementsDuo | undefined, ajuste: boolean): Ancres {
  const tracees = Boolean(e && e.places.length === 2);
  const places = assisesDe(tracees ? e!.places : PLACES_PAR_DEFAUT, tracees && ajuste);
  const [moi, lui] = [...places].sort((a, b) => a.x - b.x);
  const assise = hauteurDuo(places);
  const sol = (p: { y: number }) => borne(p.y + (1 - ANCRE_ASSISE) * assise, 0.2, 0.99);
  const piedsIci = sol(moi);
  const echelleA = (pieds: number) => borne(1 - (piedsIci - pieds) * 1.6, 0.7, 1.1);
  const devant = (z: [number, number, number, number] | undefined): Endroit | undefined => {
    if (!z) return undefined;
    const pieds = borne(Math.max(z[1] + z[3] + 0.1, piedsIci - 0.07), 0.2, piedsIci);
    return { x: borne(z[0] + z[2] / 2, 0.12, 0.88), pieds, echelle: echelleA(pieds) };
  };
  return {
    siege: { x: moi.x, y: moi.y },
    hauteur: assise * DEBOUT_SUR_ASSISE,
    place: { x: borne(moi.x, 0.1, 0.9), pieds: piedsIci, echelle: 1 },
    autre: { x: borne(lui.x - 0.1, 0.12, 0.88), pieds: sol(lui), echelle: echelleA(sol(lui)) },
    tele: devant(e?.tele),
    etagere: devant(e?.etagere),
  };
}

/** La durée d'un trajet, en millisecondes : un dixième de la largeur par seconde, jamais moins d'une seconde. */
export const dureeDuTrajet = (de: Endroit, a: Endroit) => Math.round(Math.max(1000, (Math.hypot(a.x - de.x, (a.pieds - de.pieds) * 1.5) / 0.1) * 1000));
