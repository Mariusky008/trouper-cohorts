/**
 * 🏪 LE MÈME DU JOUR D'UN COMMERÇANT — 7 novembre 2026, le patron : « pour un commerçant, il pourrait faire de sa
 * figurine une action par jour précise : présenter le menu du jour, un nouveau vêtement, une coiffure, une promo, des
 * bons plans » ; et pour les clients, « découvrir les figurines et les mèmes des autres ». Son choix : « fais le mieux ».
 *
 * LA RÈGLE :
 *   · chaque jour, sa figurine ANNONCE une chose précise (`TYPES_MEME_COMMERCE`, dans l'ordre de son métier) ;
 *   · SES MOTS, SES PRIX : c'est lui qui les écrit (ou les dit) — ClikMe n'invente jamais rien à sa place ;
 *   · SA VOIX, enregistrée, s'il le veut ; sinon sa figurine danse sur la musique et ses mots défilent. Jamais de voix
 *     fabriquée (la règle de ClikMe : la seule exception est la figurine d'un client) ;
 *   · le mème part sur ses réseaux (la vidéo elle-même : statut WhatsApp, story), et dans « Découvrir » pour les gens
 *     de sa ville (les mèmes des commerçants sont publics ; ceux des clients, jamais sans leur accord) ;
 *   · on lui dit ce qu'il rapporte : vu combien de fois, combien sont allés voir sa page.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import type { FamilleDouble } from "./double-metiers";

export type TypeMemeCommerce = {
  cle: string;
  emoji: string;
  /** Ce que dit le bandeau du mème (« Le menu du jour »). */
  titre: string;
  /** Ce qu'on lui suggère d'écrire (sans jamais un prix ni un plat inventé). */
  aide: string;
  /** Les métiers pour qui elle vient en premier (vide : tous, après les leurs). */
  pour: readonly FamilleDouble[];
};

export const TYPES_MEME_COMMERCE: readonly TypeMemeCommerce[] = [
  { cle: "menu", emoji: "🍽️", titre: "Le menu du jour", aide: "Tes plats du jour, et leurs prix si tu veux", pour: ["table"] },
  { cle: "ardoise", emoji: "🍹", titre: "L’ardoise du jour", aide: "Ce que tu sers aujourd’hui", pour: ["bar"] },
  { cle: "coupe", emoji: "✂️", titre: "La coupe du jour", aide: "Le style que tu proposes aujourd’hui", pour: ["coiffure"] },
  { cle: "ongles", emoji: "💅", titre: "Le look du jour", aide: "La couleur, le motif du moment", pour: ["ongles"] },
  { cle: "bouquet", emoji: "💐", titre: "Le bouquet du jour", aide: "Tes fleurs du jour", pour: ["fleurs"] },
  { cle: "nouveau", emoji: "✨", titre: "Nouveau en boutique", aide: "Ce qui vient d’arriver", pour: ["mode", "createur", "lunettes", "librairie"] },
  { cle: "livre", emoji: "📚", titre: "Le coup de cœur", aide: "Le livre que tu conseilles", pour: ["librairie"] },
  { cle: "seance", emoji: "🧘", titre: "La séance du jour", aide: "Ce que tu proposes aujourd’hui", pour: ["seance"] },
  { cle: "promo", emoji: "🏷️", titre: "La promo du jour", aide: "Ce qui est en promo, jusqu’à quand", pour: [] },
  { cle: "bonplan", emoji: "💡", titre: "Le bon plan", aide: "Le petit plus du jour", pour: [] },
  { cle: "place", emoji: "🪑", titre: "Une place libre", aide: "Quand, et pour combien de personnes", pour: [] },
  { cle: "mot", emoji: "💬", titre: "Le mot du jour", aide: "Ce que tu veux dire à tes clients", pour: [] },
] as const;

/** Ses annonces, dans l'ordre : celles de son métier d'abord, puis celles de tous. */
export function typesPour(famille: FamilleDouble | string): TypeMemeCommerce[] {
  const siens = TYPES_MEME_COMMERCE.filter((t) => t.pour.includes(famille as FamilleDouble));
  const tous = TYPES_MEME_COMMERCE.filter((t) => !t.pour.length);
  return [...siens, ...tous];
}
export const typeMemeDe = (cle: unknown): TypeMemeCommerce | null => TYPES_MEME_COMMERCE.find((t) => t.cle === cle) ?? null;

/** Ses mots : 160 signes au plus (une annonce, pas une carte entière). */
export const TEXTE_MEME_COMMERCE_MAX = 160;
/** Cinq mèmes par jour au plus (un par annonce, et quelques essais). */
export const MEMES_COMMERCE_PAR_JOUR = 5;
/** « Découvrir » montre les mèmes des trois derniers jours. */
export const JOURS_DECOUVRIR = 3;

export const idMemeCommerceValide = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9]{12}$/.test(id);
/** Sa page publique (`/meme/<id>`) ; « Voir sa page » passe par `/meme/<id>/voir` (compté). */
export const lienMemeCommerce = (id: string) => `/meme/${id}`;
/** Les gestes autour de son mème, dans la table de la mesure (`clik_meme_evenement`), sous ce numéro-là. */
export const cleMesureCommerce = (id: string) => `c-${id}`;

/** Un mème de commerçant, tel qu'on le montre (adresses publiques). */
export type MemeCommerce = {
  id: string;
  slug: string;
  nom: string;
  ville: string;
  villeSlug: string;
  type: string;
  emoji: string;
  titre: string;
  texte: string;
  video: string;
  videoType: string;
  /** Sa figurine (l'affiche de la vidéo). */
  image: string;
  /** Avec sa voix à lui (sinon : la musique). */
  voix: boolean;
  le: string;
  jour: string;
};

/** Ce qu'il voit au comptoir : son mème du jour, et ce qu'il rapporte. */
export type MemeCommerceVu = MemeCommerce & { vues: number; visites: number; partages: number };
