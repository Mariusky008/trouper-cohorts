/**
 * 🎬 SES PIÈCES, ENTIÈRES ET VIVANTES — ce que l'écran en reçoit (`pieces-vivantes-serveur.ts` les prépare ; « Ma
 * maison » et la page de visite les montrent, `app/univers/piece-vivante.tsx`). FICHIER PUR.
 */

/** Un cadre, en % de la vue (x, y : son coin en haut à gauche ; l, h : sa largeur, sa hauteur). */
export type Cadre = { x: number; y: number; l: number; h: number };
/** Ses vedettes repérées, la place du fauteuil, l'écran de la télé, ses étagères (leurs planches dégagées). */
export type ObjetsVus = { objets: (Cadre & { cle: string })[]; place: Cadre | null; ecran: Cadre | null; etageres?: Cadre[] };
/** 📚 Un souvenir de son étagère (ce qu'il a choisi de montrer), posé sur une étagère de la pièce. */
export type SouvenirPose = { id: string; emoji: string; titre: string; detail?: string };
/** Une pièce prête : sa vue (9:16), sa vidéo si elle est faite, ses vedettes (et ce qu'on en dit), ses souvenirs posés. */
export type PieceVue = { piece: string; nom: string; vue: string; video?: string; objets?: ObjetsVus; vedettes: { cle: string; nom: string; dit: string }[]; souvenirs?: SouvenirPose[] };
/** Combien de souvenirs une étagère porte, et une pièce. */
export const SOUVENIRS_PAR_ETAGERE = 3;
export const SOUVENIRS_PAR_PIECE = 6;
