/**
 * 📷 LES CINQ EXPRESSIONS DE CHAQUE FIGURINE (le lot V1 ; `docs/univers/decouvrir.md`, sections 28.2 et 28.6 ; le serveur :
 * `expressions-figurine-serveur.ts`) : ce qui ne dépend pas du serveur.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { ExpressionVisage } from "./visage-essai";
import type { Zone } from "./pieces-duo";

/**
 * Ses expressions, pour son image d'aujourd'hui (`empreinte` : celle de ses calques). `tetes` et `corpsSansTete` : leurs
 * adresses stables (WebP, `/api/direct/salon/fichier/…`) ; `rate` : le dernier passage raté (il se reprend une demi-heure
 * plus tard) ; `le` : quand les cinq ont été finies.
 */
export type ExpressionsFigurine = {
  empreinte: string;
  tetes: Partial<Record<ExpressionVisage, string>>;
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
 * du corps : de 0 à 1) et ses cinq expressions — toutes à adresse stable. Posée à une place : le corps, puis la tête qui
 * change d'expression (instantané : les cinq sont chargées d'avance) et qui penche. Seulement quand les cinq sont prêtes.
 */
export type FigurineVivante = {
  ratio: number;
  corps: string;
  tete: { src: string; boite: Zone; pivot: [number, number] };
  expressions: Record<ExpressionVisage, string>;
};

/** Le rattrapage : pas plus de huit figurines par nuit, et une demi-heure entre deux passages ratés. */
export const RATTRAPAGE_EXPRESSIONS = { parNuit: 8, recommencerApres: 30 * 60_000, tempsParFigurine: 150_000 } as const;

/** (la page de l'administrateur) une figurine d'habitant et ses expressions. */
export type ExpressionsHabitantVue = { prenom: string; le: string; empreinte: string; tetes: Partial<Record<ExpressionVisage, string>>; erreur?: string };
export type EtatExpressionsHabitants = { total: number; pretes: number; enCours: number; ratees: number; dernieres: ExpressionsHabitantVue[] };

export const PHRASES_EXPRESSIONS = {
  titre: "📷 Les expressions des habitants",
  chapo:
    "Cinq expressions par figurine (la tête seulement), faites dès « C’est moi ! » ; s’il en manque, reprises à l’ouverture de l’appli et la nuit (huit figurines par nuit au plus).",
  compte: (pretes: number, total: number) => `${pretes} sur ${total} prêtes`,
  enCours: (n: number) => `${n} en attente`,
  ratees: (n: number) => `${n} en reprise`,
  rattraper: "▶ Rattraper maintenant",
  rattrapees: (n: number) => (n ? `${n} figurine${n > 1 ? "s" : ""} rattrapée${n > 1 ? "s" : ""}` : "Rien à rattraper pour l’instant"),
  vide: "Aucune figurine du nouveau style pour l’instant.",
};
