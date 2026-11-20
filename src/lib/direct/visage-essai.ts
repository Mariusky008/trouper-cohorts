/**
 * 📷 « TA FIGURINE, C'EST TON VISAGE » — L'ESSAI (le lot V0, `docs/univers/decouvrir.md`, section 28) : ce qui ne
 * dépend pas de l'écran.
 *
 * Le propriétaire, le 20 novembre 2026 : « je peux te donner 4 ou 5 visages d'amis que tu peux transformer en figurines
 * et leur faire des expressions, pour les mettre dans une maquette d'un salon où il y aurait une vidéo YouTube ? comme
 * ça je vois si ça marche bien, l'effet wow » ; puis : « peut-être puis-je le faire de l'admin ».
 *
 * - **Sur la page de l'administrateur** (`/admin/humain/visage`) : jusqu'à six personnes (un prénom, une photo, leur
 *   accord) ; pour chacune, sa figurine assise (le style des figurines), sa tête découpée (les calques du lot S1), puis
 *   **ses cinq expressions** — la tête seulement, découpée au même endroit.
 * - **Le salon d'essai** (`/univers/visage`) : une vidéo YouTube, les figurines dans un gradin ; celles des amis
 *   réagissent au fil de la vidéo (une piste tirée au sort, pour l'essai) ; **la sienne fait sa tête** devant la caméra
 *   (la lecture du visage tourne sur le téléphone : rien ne part) ; « Revoir avec mes réactions » : comme ses proches
 *   la verraient.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { ImageSalon } from "./salon";
import type { Zone } from "./pieces-duo";
import type { GradinScene, PlaceGradin } from "./salons-gradins";

export type ExpressionVisage = "sourire" | "rire" | "surprise" | "bof" | "grimace";
export const EXPRESSIONS_VISAGE: readonly { cle: ExpressionVisage; e: string; nom: string }[] = [
  { cle: "sourire", e: "😊", nom: "Le sourire" },
  { cle: "rire", e: "😂", nom: "Le rire" },
  { cle: "surprise", e: "😮", nom: "La surprise" },
  { cle: "bof", e: "😑", nom: "Le bof" },
  { cle: "grimace", e: "😝", nom: "La grimace" },
];
export const expressionValide = (x: unknown): x is ExpressionVisage => EXPRESSIONS_VISAGE.some((e) => e.cle === x);
export const emojiDe = (x: ExpressionVisage | null) => EXPRESSIONS_VISAGE.find((e) => e.cle === x)?.e ?? "🙂";

export const PERSONNES_ESSAI_MAX = 6;
export const PRENOM_ESSAI_MAX = 20;

/** Les étapes d'une personne : sa figurine, sa tête découpée, puis ses cinq expressions (une par passage). */
export type EtapeEssai = "figurine" | "calques" | ExpressionVisage;
export const ETAPES_ESSAI: readonly EtapeEssai[] = ["figurine", "calques", ...EXPRESSIONS_VISAGE.map((e) => e.cle)];

/**
 * 🧠 L'EXPRESSION D'UN VISAGE, d'après ce qu'en dit la lecture du visage (ses « blendshapes », de 0 à 1 : le sourire,
 * la bouche ouverte, les sourcils…). `null` : le visage habituel.
 */
export function expressionDuVisage(b: Record<string, number>): ExpressionVisage | null {
  const v = (k: string) => b[k] ?? 0;
  const sourire = (v("mouthSmileLeft") + v("mouthSmileRight")) / 2;
  const bouche = v("jawOpen");
  const sourcils = v("browInnerUp");
  const clin = Math.abs(v("eyeBlinkLeft") - v("eyeBlinkRight"));
  const nez = (v("noseSneerLeft") + v("noseSneerRight")) / 2;
  const yeux = (v("eyeBlinkLeft") + v("eyeBlinkRight")) / 2;
  const plisses = (v("eyeSquintLeft") + v("eyeSquintRight")) / 2;
  if (sourire > 0.45 && (bouche > 0.3 || plisses > 0.5)) return "rire";
  if (bouche > 0.35 && sourcils > 0.35 && sourire < 0.3) return "surprise";
  if (clin > 0.5 || nez > 0.4 || v("mouthPucker") > 0.7 || Math.abs(v("mouthLeft") - v("mouthRight")) > 0.45) return "grimace";
  if (sourire > 0.4) return "sourire";
  if (sourire < 0.12 && bouche < 0.15 && ((v("mouthPressLeft") + v("mouthPressRight")) / 2 > 0.35 || (yeux > 0.4 && yeux < 0.75) || (v("browDownLeft") + v("browDownRight")) / 2 > 0.4)) return "bof";
  return null;
}

/** Un moment de la piste d'une figurine : à `t` secondes, pendant `d`, cette expression ; `tourne` : vers son voisin. */
export type MomentVisage = { t: number; d: number; e: ExpressionVisage; tourne?: -1 | 1 };

/** Un petit hasard qui revient toujours pareil pour un même prénom (la piste d'un ami ne change pas d'une fois à l'autre). */
function hasard(graine: string) {
  let x = 2166136261;
  for (const c of graine) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  return () => {
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
}

/**
 * 🎲 LA PISTE D'UN AMI, POUR L'ESSAI (ses vraies réactions viendront avec le lot V2) : une réaction toutes les 6 à 16
 * secondes (le rire et le sourire le plus souvent), de 1,6 à 3,2 secondes, parfois la tête tournée vers son voisin ; et,
 * toutes les 30 secondes environ, un fou rire de tout le salon (les mêmes secondes pour tous).
 */
export function pisteDEssai(prenom: string, duree: number): MomentVisage[] {
  const r = hasard(prenom.toLowerCase());
  const tirer = (): ExpressionVisage => {
    const x = r();
    return x < 0.35 ? "rire" : x < 0.65 ? "sourire" : x < 0.8 ? "surprise" : x < 0.9 ? "grimace" : "bof";
  };
  const l: MomentVisage[] = [];
  for (let t = 3 + r() * 6; t < duree - 2; t += 6 + r() * 10) l.push({ t: Math.round(t * 10) / 10, d: Math.round((1.6 + r() * 1.6) * 10) / 10, e: tirer(), ...(r() < 0.25 ? { tourne: r() < 0.5 ? -1 : 1 } : {}) });
  // (les fous rires de tout le salon : les mêmes secondes pour tous, quel que soit le prénom)
  const commun = hasard("fou-rire");
  for (let t = 20 + commun() * 10; t < duree - 3; t += 26 + commun() * 12) {
    const debut = Math.round(t * 10) / 10;
    const sans = l.filter((m) => m.t + m.d < debut - 0.5 || m.t > debut + 3.5);
    l.length = 0;
    l.push(...sans, { t: Math.round((debut + r() * 0.4) * 10) / 10, d: 2.6, e: "rire" });
  }
  return l.sort((a, b) => a.t - b.t);
}

/** L'expression d'une piste à `t` secondes (et la tête tournée), ou rien. */
export function momentA(piste: readonly MomentVisage[], t: number): MomentVisage | null {
  for (let k = piste.length - 1; k >= 0; k--) {
    const m = piste[k];
    if (m.t <= t) return t < m.t + m.d ? m : null;
  }
  return null;
}

/** (la page de l'administrateur) une personne de l'essai : où elle en est. */
export type PersonneEssaiVue = {
  id: string;
  prenom: string;
  moi: boolean;
  le: string;
  /** ses étapes faites */
  faites: EtapeEssai[];
  /** la photo est encore là (elle s'efface une fois la figurine faite) */
  photo: boolean;
  /** sa figurine (signée) */
  figurine?: string;
  /** sa tête et ses expressions (signées), quand elles sont faites */
  tete?: string;
  expressions: Partial<Record<ExpressionVisage, string>>;
  erreur?: string;
};
export type EtatEssaiVisage = { personnes: PersonneEssaiVue[]; moteurs: { image: boolean; regard: boolean } };

/** (le salon d'essai) une figurine : son corps, sa tête (sa boîte et son pivot, dans le cadre du corps), ses expressions. */
export type FigurineEssai = {
  id: string;
  prenom: string;
  moi: boolean;
  corps: ImageSalon;
  ratio: number;
  tete: { image: ImageSalon; boite: Zone; pivot: [number, number] };
  expressions: Partial<Record<ExpressionVisage, ImageSalon>>;
};
export type SalonEssai = { figurines: FigurineEssai[]; gradin: GradinScene | null; places: PlaceGradin[]; video: string | null };

export const PHRASES_VISAGE = {
  titre: "📷 L’essai du visage",
  chapo:
    "Jusqu’à six personnes : un prénom, une photo de face, et son accord. Pour chacune : sa figurine assise, sa tête découpée, puis ses cinq expressions (la tête seulement). Une étape par passage, une minute environ chacune. La photo s’efface dès que la figurine est faite.",
  accord: "Cette personne est d’accord pour que sa photo devienne une figurine",
  moi: "C’est moi (ma figurine fera ma tête)",
  ajouter: "Ajouter",
  salon: "▶ Ouvrir le salon d’essai",
  salonTitre: "📷 Le salon d’essai",
  camera: "📷 Ma figurine fait ma tête",
  cameraOff: "Arrêter la caméra",
  cameraNote: "La caméra reste sur ton téléphone : on ne garde que tes réactions, jamais ton image.",
  cameraRefus: "La caméra n’a pas pu s’ouvrir : autorise-la dans les réglages du navigateur.",
  lecture: "La lecture du visage se charge…",
  lectureRatee: "La lecture du visage ne se charge pas ici : réessaie avec une meilleure connexion.",
  jeVois: (e: string) => `Je vois : ${e}`,
  revoir: "▶ Revoir avec mes réactions",
  revoirNote: "Ta figurine rejoue tes vraies réactions, à la seconde : comme tes proches la verront.",
  direct: "📷 Revenir au direct",
  lien: "Colle un lien YouTube",
  changer: "Changer",
  sansFigurine: "Pas encore de figurine prête : fabrique-les sur la page de l’administrateur.",
  sansVideo: "Colle un lien YouTube pour commencer.",
  pisteAmis: "Les réactions de tes amis sont tirées au sort pour l’essai ; la tienne est la vraie.",
};
