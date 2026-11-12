/**
 * 🧸 LA NOUVELLE FIGURINE — chantier « Univers », lot 2 (`docs/univers/feuille-de-route.md`, section 5, écrans 1 à 4).
 *
 *   1. « Créons ta figurine ! » : un selfie, « C'est bien moi », « J'ai 15 ans ou plus » ;
 *   2. la fabrication (l'atelier de Pablito, une minute environ) ;
 *   3. la découverte : sa figurine, assise dans son fauteuil (« Sculptée, détourée », validée au lot 0) ;
 *   4. les retouches AVEC SES MOTS (« les cheveux plus courts ») — chacune est une nouvelle proposition, faite sur la
 *      précédente ; « Elle ne me ressemble pas » la refait d'après le selfie ; puis « C'est moi ! » : son personnage
 *      maître est enregistré (une version de sa fiche, `fiches-serveur.ts`), et ses autres images de référence se
 *      font (bouche ouverte, debout).
 *
 * D'ABORD À UNE ADRESSE D'ESSAI RÉSERVÉE AU PROPRIÉTAIRE (`/univers/figurine`) : les gens de Dax gardent leur figurine
 * d'aujourd'hui jusqu'à son feu vert.
 *
 * Ce fichier est partagé (l'écran et le serveur).
 */
import { RETOUCHE_FIGURINE_MAX } from "./perso-consignes";

/** Les propositions par personne et par jour (la fabrication, chaque retouche, chaque « refaire ») : au plus. */
export const PROPOSITIONS_PAR_JOUR = 12;
/** Les propositions gardées dans son brouillon (les plus récentes). */
export const PROPOSITIONS_GARDEES = 12;
/** Une proposition « en cours » depuis plus longtemps s'est perdue en chemin (la fonction s'est arrêtée). */
export const PERIMEE_MS = 6 * 60_000;

/** Des idées de retouches, à toucher (il peut écrire les siennes). */
export const IDEES_RETOUCHE = ["Les cheveux plus courts", "Plus de volume dans les cheveux", "Sans lunettes", "Un pull bleu marine", "Un grand sourire", "L’air plus malicieux"];

export type EtatProposition = "en-cours" | "fait" | "erreur";
/** Une proposition, telle que l'écran la voit (son image en adresse signée). `demande` : la retouche qui l'a faite. */
export type PropositionVue = { id: string; etat: EtatProposition; le: string; image?: string; erreur?: string; demande?: string };

export type EtapeNouvelleFigurine = "selfie" | "fabrication" | "decouverte" | "validee";
export type EtatNouvelleFigurine = {
  etape: EtapeNouvelleFigurine;
  /** les plus récentes d'abord */
  propositions: PropositionVue[];
  /** les propositions qu'il peut encore demander aujourd'hui */
  restantes: number;
  /** le moteur d'image est branché */
  branche: boolean;
  /** 🖼️ la photo de sa figurine d'aujourd'hui (signée), pour la refaire au nouveau style sans nouveau selfie */
  photoDAvant?: string;
  /** son personnage maître, une fois validé : ses images de référence (assise, et bientôt bouche ouverte et debout) */
  figurine?: { version: number; images: Record<string, string>; enCours: boolean };
};

/** Sa retouche, avec ses mots : nettoyée, entre 3 et 120 caractères ; « » sinon. */
export function demandeValide(x: unknown): string {
  const t = typeof x === "string" ? x.replace(/[\u0000-\u001f<>{}]/g, " ").replace(/\s+/g, " ").trim() : "";
  return t.length >= 3 && t.length <= RETOUCHE_FIGURINE_MAX ? t : "";
}

export const idPropositionValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : "");
