/**
 * 🎬 SES PIÈCES, ENTIÈRES ET VIVANTES — ce que l'écran en reçoit (`pieces-vivantes-serveur.ts` les prépare ; « Ma
 * maison » et la page de visite les montrent, `app/univers/piece-vivante.tsx`). FICHIER PUR.
 */

/** Un cadre, en % de la vue (x, y : son coin en haut à gauche ; l, h : sa largeur, sa hauteur). */
export type Cadre = { x: number; y: number; l: number; h: number };
/** Ses vedettes repérées, la place du fauteuil, l'écran de la télé. */
export type ObjetsVus = { objets: (Cadre & { cle: string })[]; place: Cadre | null; ecran: Cadre | null };
/** Une pièce prête : sa vue (9:16), sa vidéo si elle est faite, ses vedettes (et ce qu'on en dit). */
export type PieceVue = { piece: string; nom: string; vue: string; video?: string; objets?: ObjetsVus; vedettes: { cle: string; nom: string; dit: string }[] };
