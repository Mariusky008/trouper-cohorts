/**
 * 🏡 LA CRÉATION DE SON UNIVERS — chantier « Univers », lot 4 (`docs/univers/feuille-de-route.md`, écrans 8 à 10).
 *
 *   8. LA CRÉATION : d'après la fiche de son univers (lot 3), le décor « Film, chaleureux » (sans figurine), puis les
 *      places relevées sur le décor (où sa figurine s'assoit, d'où vient la lumière, où sont ses éléments), puis
 *      l'image vedette (sa figurine chez elle, pour la découverte et le partage) ;
 *   9. LA DÉCOUVERTE en plein écran : la brume se lève, sa figurine est chez elle, assise à sa place ; « LES CLÉS DE TON
 *      UNIVERS » : il touche un objet et voit pourquoi il est là, avec ses propres mots ;
 *  10. LES RETOUCHES avec ses mots, plafonnées (trois offertes, puis une par jour) : une nouvelle version, le même décor
 *      où une seule chose change ; revenir à la version d'avant.
 *
 * LOT 4b : SON FAUTEUIL prend les couleurs de son monde (une nouvelle version de sa figurine, faite sur son image
 * « assise », avant l'image vedette : « 🪑 Ton fauteuil a pris les couleurs de ton monde ») ; « MON UNIVERS » DEVIENT
 * L'ACCUEIL (`/univers`) : son univers, et le menu de demain (Découvrir · Autour · Créer · Proches · Mon univers).
 *
 * D'abord aux adresses d'essai du propriétaire (`/univers`, `/univers/monde`). Ce fichier est partagé (l'écran et le
 * serveur).
 */
import type { SceneMonde, SourceElement } from "./monde";
import type { Ambiance } from "./ambiances";

/** Les retouches de l'univers offertes à la création (section 9 de la feuille de route), puis une par jour. */
export const RETOUCHES_OFFERTES = 3;
export const RETOUCHES_PAR_JOUR = 1;
export const RETOUCHE_UNIVERS_MAX = 120;
/** Des idées de retouches, à toucher (il peut écrire les siennes). */
export const IDEES_RETOUCHE_UNIVERS = ["Davantage de nature", "Plus de lumière", "Un petit coin lecture", "Le soir, avec des lampes allumées"];

/** Où en est sa création : le décor, les places, son fauteuil aux couleurs de son monde (lot 4b), l'image vedette. */
export type EtapeCreation = "decor" | "places" | "fauteuil" | "vedette";
export type CleUnivers = { id: string; quoi: string; pourquoi: string; source: SourceElement; zone?: [number, number, number, number] };

export type EtatUnivers = {
  etape: "sans-fiche" | "a-creer" | "creation" | "decouverte";
  /** l'image se fait (après la réponse) : où on en est ; ou ce qui a raté */
  creation?: { etape: EtapeCreation; retouche?: string };
  erreur?: string;
  version?: number;
  decor?: string;
  vedette?: string;
  /** sa figurine (lot 2) : assise, et bouche ouverte */
  figurine?: { assise: string; parle?: string };
  /** 🪑 son fauteuil a pris les couleurs de son monde (lot 4b) : la version de sa figurine, et son image d'avant */
  fauteuil?: { version: number; avant?: string };
  /**
   * 🍂 la saison de son univers (lot 7) : le thème du mois, son décor du mois (fait, ou en train de se faire) et sa
   * tenue du mois (méritée, au nouveau style)
   */
  saison?: { nom: string; emoji: string; decor: boolean; enCours?: boolean; tenue: boolean };
  scene?: SceneMonde;
  proposition?: string;
  lumiere?: string;
  palette?: string[];
  cles: CleUnivers[];
  retouches: { restantes: number; offertes: number };
  /** la version d'avant existe : il peut y revenir */
  avant?: number;
  /** 🎨 l'ambiance de son décor (les ambiances ouvertes) : il peut en changer */
  ambiance?: Ambiance;
  branche: boolean;
};

/** Sa retouche, avec ses mots : 3 à 120 caractères ; « » sinon. */
export function retoucheUniversValide(x: unknown): string {
  const t = typeof x === "string" ? x.replace(/[\u0000-\u001f<>{}]/g, " ").replace(/\s+/g, " ").trim() : "";
  return t.length >= 3 && t.length <= RETOUCHE_UNIVERS_MAX ? t : "";
}
