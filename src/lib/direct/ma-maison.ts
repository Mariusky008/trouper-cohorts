/**
 * 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`docs/univers/ma-maison.md` ; le lot M1). Le propriétaire, le 16 novembre 2026 :
 * « on choisit juste parmi les univers disponibles, et après l'inscription on arrive dans notre univers, où on va pouvoir
 * y placer des choses » ; une pièce « avec un siège au centre […] et avoir tout autour de nous ».
 *
 * Chacun a UNE pièce du catalogue (`PIECES_DUO`, les neuf) : son image en largeur (le panorama du lot M0), qu'on parcourt
 * au doigt, sa figurine posée au centre, dans son fauteuil ; ses emplacements (la télé, la platine, les cadres,
 * l'étagère, la fenêtre, la table basse, les lampes, le coin du chat), qu'on touche. La maison se remplira avec ce qu'on
 * garde dans ses conversations (le lot M2).
 *
 * Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint) : l'onglet « Ma maison » garde l'univers d'aujourd'hui tant
 * qu'il l'est ; l'adresse d'essai `/univers/maison` (l'administrateur, sur son téléphone d'habitant) la montre déjà.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { PIECES_DUO, type EmplacementsDuo, type MomentDuo, type PieceDuo, type PlaceDuo } from "./pieces-duo";
import type { ImageSalon } from "./salon";

/** 🔀 L'interrupteur : ÉTEINT tant que le propriétaire ne l'a pas jouée sur son téléphone (`ma-maison.md`, section 10). */
export const MA_MAISON_CATALOGUE = false;

/**
 * L'ordre des propositions (`ma-maison.md`, section 3) : l'âge range, il n'interdit pas — toutes sont proposées à tous.
 * Les 15-17 ans (« 18 ans ou plus ? » : non) voient d'abord les pièces des plus jeunes ; les autres, celles des adultes.
 */
export const ORDRE_JEUNES: readonly PieceDuo[] = ["hangar", "newyork", "rue", "chambre-musicale", "cafe", "salon", "terrasse", "cuisine", "chambre"];
export const ORDRE_ADULTES: readonly PieceDuo[] = ["salon", "terrasse", "cuisine", "chambre", "cafe", "newyork", "hangar", "rue", "chambre-musicale"];
export const ordreDuCatalogue = (adulte: boolean | null): readonly PieceDuo[] => (adulte === false ? ORDRE_JEUNES : ORDRE_ADULTES);

/**
 * La figurine au centre, si la pièce n'a pas encore son centre posé à la main : la boîte de la figurine assise dans son
 * fauteuil (comme on la trace, `pieces-duo.ts`, `LargeVue`) — `x` son milieu, `y` le sol sous le fauteuil, `hauteur` de
 * la tête au sol, en fractions du panorama.
 */
export const CENTRE_PAR_DEFAUT: PlaceDuo = { x: 0.5, y: 0.93, hauteur: 0.52 };
/** (le panorama : 3584 × 1024 ; ses deux largeurs, le téléphone et l'ordinateur) */
export const LARGEURS_PANORAMA = [1792, 3584] as const;
/** (une vignette du catalogue : le panorama réduit) */
export const LARGEURS_VIGNETTE = [720, 1440] as const;
/** (la figurine posée : petite, moins de 80 Ko, `ma-maison.md`, section 9) */
export const LARGEURS_FIGURINE = [360, 720] as const;

/** 🛋️ Sa pièce, telle que l'écran la pose : le panorama dans la lumière de l'heure, ses emplacements, son centre. */
export type ScenePiece = {
  piece: PieceDuo;
  nom: string;
  emoji: string;
  moment: MomentDuo;
  panorama: ImageSalon;
  emplacements: EmplacementsDuo | null;
  centre: PlaceDuo;
};
/** Ce que « Ma maison » reçoit : sa pièce (choisie, ou pas encore), sa scène si elle est prête, sa figurine. */
export type MaMaisonVue = {
  piece: PieceDuo | null;
  scene: ScenePiece | null;
  figurine: ImageSalon | null;
};
/** Une pièce proposée : son nom, et sa vignette si son panorama est fait (sinon, elle n'est pas encore prête). */
export type PieceAuCatalogue = { cle: PieceDuo; nom: string; pour: string; emoji: string; vignette: ImageSalon | null };
export type CatalogueMaison = { pieces: PieceAuCatalogue[]; piece: PieceDuo | null };

/** Les pièces du catalogue, dans l'ordre de l'âge. */
export const piecesDansLOrdre = (adulte: boolean | null) => ordreDuCatalogue(adulte).map((c) => PIECES_DUO.find((p) => p.cle === c)!);

/**
 * 👆 CE QU'ON TOUCHE dans sa maison (le lot M1 : elle est encore vide ; ce qu'on garde dans ses conversations viendra s'y
 * mettre, le lot M2) : ce que chaque emplacement accueillera.
 */
export const EMPLACEMENTS_MAISON = {
  tele: { emoji: "📺", nom: "La télé", dit: "Les clips, les films et les vidéos que tu gardes dans tes conversations passeront ici." },
  platine: { emoji: "🎵", nom: "La platine", dit: "La chanson que tu gardes tournera ici ; les autres rejoindront l’étagère, en pochettes." },
  cadres: { emoji: "🖼️", nom: "Un cadre", dit: "Les photos que tu gardes dans tes conversations viendront s’y accrocher toutes seules." },
  etagere: { emoji: "📚", nom: "L’étagère", dit: "Les mots, les rendez-vous et les mèmes que tu gardes viendront s’y ranger." },
  fenetre: { emoji: "🪟", nom: "La fenêtre", dit: "Le ciel d’ici, à l’heure qu’il est : le matin, le soir, la nuit." },
  table: { emoji: "☕", nom: "La table basse", dit: "Ce qu’on te laisse en passant chez toi s’y posera." },
  lampes: { emoji: "💡", nom: "Une lampe", dit: "Touche-la : elle s’allume." },
  chat: { emoji: "🐾", nom: "Le coin du chat", dit: "Ton compagnon viendra s’y installer." },
} as const;
export type EmplacementMaison = keyof typeof EMPLACEMENTS_MAISON;

/** La phrase de l'arrivée, la maison encore vide (`ma-maison.md`, section 3). */
export const MAISON_VIDE = "Ta maison se remplit toute seule avec ce que tu gardes dans tes conversations.";
