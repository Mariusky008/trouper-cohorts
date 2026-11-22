/**
 * 🎭 LES CALQUES D'UNE FIGURINE, ET LEUR POSE (`docs/univers/ma-maison.md`, section 4 ; `salon-du-duo.md`, section 12 ;
 * le lot S1). Une figurine assise dans son fauteuil devient, une fois (`calques-figurine-serveur.ts`) :
 *
 * - **le corps** : la figurine entière avec son fauteuil, sa tête d'origine comprise (elle reste dessous : quand la tête
 *   bouge un peu, on ne voit jamais le vide) ;
 * - **la tête** : ce qui est au-dessus du col, la main comprise si elle touche le visage ; son **pivot** au milieu du cou ;
 * - **la bouche et les joues** (le talkie, la marque 💋, le rouge aux joues).
 *
 * Tout est dans LE CADRE DE LA FIGURINE (de 0 à 1 sur la boîte du corps) : la même figurine se pose ensuite n'importe où
 * — au centre de sa maison, aux deux places du salon du duo — par `poserFigurine`, qui rend la forme `CalqueFigurine` du
 * contrat commun (`salon.ts`, inchangé), en fractions de la pièce.
 *
 * Partagé (l'écran et le serveur).
 */
import type { CalqueFigurine } from "./salon";
import type { PlaceDuo, Zone } from "./pieces-duo";

/**
 * Les calques d'une figurine, dans son propre cadre (de 0 à 1 sur la boîte du corps). `fichier` : leur adresse stable
 * (`/api/direct/salon/fichier/…`, WebP, gardée un an par le téléphone) ; `sources` : leurs PNG dans le seau.
 */
export type FigurineLocale = {
  /** largeur sur hauteur de la boîte du corps */
  ratio: number;
  corps: { fichier: string };
  tete: { fichier: string; boite: Zone; pivot: [number, number] };
  /**
   * 🧍 (22 novembre 2026, le propriétaire : « quand la tête bouge, elle est en double ») le corps sans sa tête d'origine
   * (le cou reste) : c'est lui que la scène pose sous la tête qui bouge. Sans lui : le corps entier, comme avant.
   */
  sansTete?: { fichier: string };
  sources?: { corps: string; tete: string; sansTete?: string };
  /**
   * 🧍 (22 novembre 2026, « comme si la tête se détache des épaules ») la règle de découpe de la tête : 2, sa boîte élargie
   * à sa silhouette (`elargirTete`) ; sans : celle d'avant, que le serveur refait une fois.
   */
  decoupe?: number;
  bouche: [number, number];
  joues: [[number, number], [number, number]];
  /** d'où viennent la tête et ses repères : le modèle qui voit, ou l'estimation par la silhouette */
  par: "regard" | "estime";
};

/**
 * Les largeurs publiées des calques (`imageSalon`, en WebP) : le corps comme la figurine de « Ma maison », la tête à
 * moitié (elle fait à peu près la moitié de la largeur du corps). Moins de 80 Ko chacun (`ma-maison.md`, section 9).
 */
export const LARGEURS_CALQUES = { corps: [360, 720], tete: [180, 360] } as const;

/**
 * Sur une figurine dans son fauteuil (de la tête au sol), le point où elle s'assoit, de haut en bas : une place relevée
 * par le modèle qui voit est ce point ; une place tracée à la main est la boîte entière, du haut de la tête au sol.
 */
export const ANCRE_FAUTEUIL = 0.68;

/**
 * 🪑 POSER UNE FIGURINE sur une pièce (`largeur` × `hauteur` en pixels : le rapport compte) : sa boîte part de la place —
 * `x` son milieu ; le sol sous le fauteuil (`y` si la place est tracée à la main, sinon sous le point d'assise) ;
 * `taille` de la tête au sol (en part de la hauteur de la pièce). Rend ses calques en fractions de la pièce.
 */
export function poserFigurine(f: FigurineLocale, place: PlaceDuo, piece: { largeur: number; hauteur: number }, o: { tracee: boolean; taille?: number }): CalqueFigurine {
  const H = o.taille ?? place.hauteur;
  const W = (H * f.ratio * piece.hauteur) / piece.largeur;
  const sol = o.tracee ? place.y : place.y + (1 - ANCRE_FAUTEUIL) * H;
  const [gauche, haut] = [place.x - W / 2, sol - H];
  const pt = ([u, v]: [number, number]): [number, number] => [gauche + u * W, haut + v * H];
  const [tx, ty, tw, th] = f.tete.boite;
  return {
    corps: { fichier: f.sansTete?.fichier ?? f.corps.fichier, boite: [gauche, haut, W, H] },
    tete: { fichier: f.tete.fichier, boite: [gauche + tx * W, haut + ty * H, tw * W, th * H], pivot: pt(f.tete.pivot) },
    bouche: pt(f.bouche),
    joues: [pt(f.joues[0]), pt(f.joues[1])],
  };
}
