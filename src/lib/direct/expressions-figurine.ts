/**
 * 📷 LES EXPRESSIONS DE CHAQUE FIGURINE (le lot V1 ; `docs/univers/decouvrir.md`, sections 28.2 et 28.6 ; le serveur :
 * `expressions-figurine-serveur.ts`) : ce qui ne dépend pas du serveur. Cinq au départ, sept depuis le 22 novembre 2026.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { EXPRESSIONS_VISAGE, type ExpressionVisage } from "./visage-essai";
import type { Zone } from "./pieces-duo";
import type { Sentiment } from "./ma-figurine";

/**
 * 😢😠 (22 novembre 2026, le propriétaire : « ajoute deux expressions effectivement ! ») LES SEPT EXPRESSIONS D'UNE
 * FIGURINE : les cinq que la lecture du visage reconnaît (`EXPRESSIONS_VISAGE`), puis la tristesse et la colère — pour
 * que son humeur du jour soit vraiment sa tête (`expressionDeLHumeur`). La caméra ne les lit pas : elles viennent de
 * l'humeur.
 */
export type ExpressionFigurine = ExpressionVisage | "triste" | "fache";
export const EXPRESSIONS_FIGURINE: readonly { cle: ExpressionFigurine; e: string; nom: string }[] = [
  ...EXPRESSIONS_VISAGE,
  { cle: "triste", e: "😢", nom: "La tristesse" },
  { cle: "fache", e: "😠", nom: "La colère" },
];
export const expressionFigurineValide = (x: unknown): x is ExpressionFigurine => EXPRESSIONS_FIGURINE.some((e) => e.cle === x);

/**
 * 🗣️ (25 novembre 2026, le propriétaire : « fais le » — la bouche suit la voix) SA TÊTE QUI PARLE : son visage habituel,
 * la bouche ouverte au milieu d'un mot. Ce n'est pas une expression (ni la caméra ni son humeur ne la choisissent) : elle
 * remplace sa tête un instant, quand sa voix enregistrée est forte. Fabriquée avec ses expressions (et rattrapée la nuit
 * pour les figurines qui n'en avaient que sept).
 */
export type TeteFigurine = ExpressionFigurine | "parle";
export const TETE_PARLE = { cle: "parle", e: "🗣️", nom: "La bouche ouverte" } as const;
/** Toutes les têtes fabriquées : les sept expressions, puis la bouche ouverte. */
export const TETES_FIGURINE: readonly { cle: TeteFigurine; e: string; nom: string }[] = [...EXPRESSIONS_FIGURINE, TETE_PARLE];

/**
 * 🙂 (22 novembre 2026, le propriétaire : « mon humeur du jour, lorsque je la renseigne, devrait être la tête que je fais
 * dans ma maison, et un peu partout où on voit ma tête ») L'EXPRESSION DE SON HUMEUR DU JOUR (celles du rituel,
 * `HUMEURS`) : la joie et l'amour, le sourire ; le fou rire et l'euphorie, le rire ; la grimace, la grimace ; la tête
 * dans les mains et la tristesse, la tristesse ; la colère, la colère.
 */
const DE_L_HUMEUR: Partial<Record<Sentiment, ExpressionFigurine>> = {
  joie: "sourire",
  amour: "sourire",
  rire: "rire",
  euphorie: "rire",
  grimace: "grimace",
  tete: "triste",
  tristesse: "triste",
  colere: "fache",
};
export const expressionDeLHumeur = (h: Sentiment | null | undefined): ExpressionFigurine | null => (h ? (DE_L_HUMEUR[h] ?? null) : null);

/**
 * Ses expressions, pour son image d'aujourd'hui (`empreinte` : celle de ses calques). `tetes` et `corpsSansTete` : leurs
 * adresses stables (WebP, `/api/direct/salon/fichier/…`) ; `rate` : le dernier passage raté (il se reprend une demi-heure
 * plus tard) ; `le` : quand toutes ont été finies (les sept depuis le 22 novembre 2026 : à celles qui n'en avaient que
 * cinq, les deux nouvelles s'ajoutent au rattrapage).
 */
export type ExpressionsFigurine = {
  empreinte: string;
  tetes: Partial<Record<TeteFigurine, string>>;
  corpsSansTete?: string;
  le?: string;
  rate?: string;
  erreur?: string;
  /**
   * 🧍 (22 novembre 2026) la règle de découpe de la tête des calques sur lesquels elles ont été découpées
   * (`FigurineLocale.decoupe`, 1 sans) : une autre que celle des calques, elles se redécoupent (sans le moteur).
   */
  decoupe?: number;
};

/**
 * 📷 UNE FIGURINE VIVANTE (le lot V2) : son corps sans sa tête, sa tête habituelle (sa boîte et son pivot, dans le cadre
 * du corps : de 0 à 1) et ses expressions — toutes à adresse stable. Posée à une place : le corps, puis la tête qui
 * change d'expression (instantané : elles sont chargées d'avance) et qui penche. Seulement quand les cinq premières sont
 * prêtes (la tristesse et la colère, quand elles le sont).
 *
 * 🙂 `humeur` (22 novembre 2026) : l'expression de son humeur du jour, si elle est prête — sa tête quand rien d'autre ne
 * la change (ni la caméra, ni une réaction).
 */
export type FigurineVivante = {
  ratio: number;
  corps: string;
  tete: { src: string; boite: Zone; pivot: [number, number] };
  expressions: Record<ExpressionVisage, string> & Partial<Record<ExpressionFigurine, string>>;
  humeur?: ExpressionFigurine;
  /** 🗣️ sa tête la bouche ouverte, si elle est prête : la bouche suit sa voix (`bouche.ts`). */
  parle?: string;
};

/**
 * 🙂 SA TÊTE DU JOUR, POUR LES CALQUES (la messagerie, sa maison) : l'expression de son humeur du jour, découpée au
 * cadrage de sa tête habituelle — elle prend sa place, sur le même corps sans tête. `decoupe` : la règle de découpe de
 * ses calques d'alors (une autre que celle de ses calques : on garde la tête habituelle).
 */
export type TeteDuJour = { e: ExpressionFigurine; src: string; decoupe: number; /** 🗣️ sa tête la bouche ouverte (si elle est prête) : sa bouche suit son bonjour (`useBoucheDuBonjour`) */ parle?: string };

/** Le rattrapage : pas plus de huit figurines par nuit, et une demi-heure entre deux passages ratés. */
export const RATTRAPAGE_EXPRESSIONS = { parNuit: 8, recommencerApres: 30 * 60_000, tempsParFigurine: 150_000 } as const;

/** (la page de l'administrateur) une figurine d'habitant et ses expressions. */
export type ExpressionsHabitantVue = { prenom: string; le: string; empreinte: string; tetes: Partial<Record<TeteFigurine, string>>; erreur?: string };
export type EtatExpressionsHabitants = { total: number; pretes: number; enCours: number; ratees: number; dernieres: ExpressionsHabitantVue[] };

export const PHRASES_EXPRESSIONS = {
  titre: "📷 Les expressions des habitants",
  chapo:
    "Sept expressions par figurine (la tête seulement : les cinq que la caméra reconnaît, puis la tristesse et la colère, pour l’humeur du jour) et sa bouche ouverte (pour que sa bouche suive sa voix), faites dès « C’est moi ! » ; s’il en manque, reprises à l’ouverture de l’appli et la nuit (huit figurines par nuit au plus).",
  compte: (pretes: number, total: number) => `${pretes} sur ${total} prêtes`,
  enCours: (n: number) => `${n} en attente`,
  ratees: (n: number) => `${n} en reprise`,
  rattraper: "▶ Rattraper maintenant",
  rattrapees: (n: number) => (n ? `${n} figurine${n > 1 ? "s" : ""} rattrapée${n > 1 ? "s" : ""}` : "Rien à rattraper pour l’instant"),
  vide: "Aucune figurine du nouveau style pour l’instant.",
};
