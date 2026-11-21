/**
 * 📷 LES CINQ EXPRESSIONS DE CHAQUE FIGURINE (le lot V1 ; `docs/univers/decouvrir.md`, sections 28.2 et 28.6 ; le serveur :
 * `expressions-figurine-serveur.ts`) : ce qui ne dépend pas du serveur.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { ExpressionVisage } from "./visage-essai";

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
