/**
 * 🚪 LES VISITES ET LES SOUVENIRS — chantier « Univers », lot 6 (`docs/univers/feuille-de-route.md`) : entrer dans
 * l'univers de quelqu'un, « frapper à la porte » (il est prévenu), lui laisser un souvenir (un objet choisi dans une
 * liste, un petit mot) qui n'apparaît chez lui que s'il l'accepte.
 *
 * QUI PEUT ENTRER (le propriétaire, le 12 novembre 2026 : « ça pourrait être sympa de voir les univers des autres » ; la
 * proposition retenue en lançant le lot) :
 *   · « tous » : son univers (le décor, sa figurine chez elle) est visible de qui a le lien ; il faut avoir déclaré une
 *     fois 18 ans ou plus (l'appli ne sait que « 15 ans ou plus ») ;
 *   · « proches » (par défaut) : ceux qu'il a ajoutés et qui l'ont ajouté ;
 *   · « moi » : personne.
 * SES CLÉS (ses propres phrases) ET LES SOUVENIRS restent toujours réservés à ses proches : un inconnu voit le lieu,
 * jamais ce qu'il a confié à Pablito, et ne peut rien y laisser.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { CleUnivers } from "./univers-creation";
import type { Visibilite } from "./monde";

/** Les souvenirs qu'on peut laisser : des objets posés par-dessus le décor (rien n'est regénéré). */
export const OBJETS_SOUVENIR = [
  { cle: "fleurs", emoji: "💐", nom: "Un bouquet" },
  { cle: "tasse", emoji: "☕", nom: "Une tasse de café" },
  { cle: "livre", emoji: "📚", nom: "Un livre" },
  { cle: "ballon", emoji: "🎈", nom: "Un ballon" },
  { cle: "biscuits", emoji: "🍪", nom: "Des biscuits" },
  { cle: "plante", emoji: "🪴", nom: "Une plante" },
  { cle: "bougie", emoji: "🕯️", nom: "Une bougie" },
  { cle: "ours", emoji: "🧸", nom: "Un ours en peluche" },
  { cle: "photo", emoji: "🖼️", nom: "Une photo de nous" },
  { cle: "coquillage", emoji: "🐚", nom: "Un coquillage" },
] as const;
export type ObjetSouvenir = (typeof OBJETS_SOUVENIR)[number]["cle"];
export const objetValide = (x: unknown): ObjetSouvenir | null => (OBJETS_SOUVENIR.some((o) => o.cle === x) ? (x as ObjetSouvenir) : null);
export const objetDe = (x: unknown) => OBJETS_SOUVENIR.find((o) => o.cle === x) ?? null;

/** Un petit mot, avec le souvenir : 80 caractères au plus. */
export const MOT_SOUVENIR_MAX = 80;
/** Les souvenirs d'un même visiteur qui attendent d'être acceptés, au plus (chez une même personne). */
export const SOUVENIRS_EN_ATTENTE_MAX = 3;
/** Les souvenirs posés chez lui, au plus (les plus anciens s'en vont). */
export const SOUVENIRS_POSES_MAX = 12;

export const VISIBILITES_DITES: Record<Visibilite, { titre: string; dit: string }> = {
  tous: { titre: "🌍 Tout le monde", dit: "Qui a le lien voit ton univers. Tes clés et les souvenirs restent pour tes proches." },
  proches: { titre: "👯 Mes proches", dit: "Seuls tes proches peuvent entrer, et te laisser un souvenir." },
  moi: { titre: "🔒 Moi seul", dit: "Personne n’entre chez toi." },
};

/** Un souvenir, tel qu'on le voit : l'objet, le mot, de qui (son prénom), où il est posé (une fois accepté). */
export type SouvenirVu = { id: string; objet: ObjetSouvenir; mot?: string; de: string; le: string; x?: number; y?: number };

/** Ce que voit celui qui entre chez quelqu'un. */
export type VueVisite =
  | { etat: "ferme" | "reserve" | "absent"; prenom?: string }
  | {
      etat: "ouvert";
      prenom: string;
      proposition: string;
      decor: string;
      /** sa figurine, assise chez elle (relevée sur son image vedette, sinon sa place) */
      hote: { image: string; parle?: string; x: number; y: number; hauteur?: number };
      /** la place de l'invité, et la figurine du visiteur (s'il en a une) */
      invite: { x: number; y: number; echelle: number; image?: string; assise?: boolean };
      /** un proche : ses clés, les souvenirs posés, et il peut en laisser un */
      proche: boolean;
      cles: CleUnivers[];
      souvenirs: SouvenirVu[];
      peutLaisser: boolean;
      /** il a déjà frappé aujourd'hui */
      frappe: boolean;
      /** c'est chez lui (il se voit comme le voient les autres) */
      chezSoi: boolean;
    };

/** Ce que voit celui qui reçoit : qui est passé, les souvenirs à accepter, ceux qui sont posés, qui peut entrer. */
export type MesVisites = {
  visibilite: Visibilite;
  adulte: boolean;
  cle: string;
  passes: { prenom: string; image?: string; le: string }[];
  enAttente: SouvenirVu[];
  poses: SouvenirVu[];
};

/** 🏡 Un univers ouvert à tous, dans « Découvrir » (lot 7) : sa clé, son prénom, son image (sa figurine chez elle). */
export type UniversPublic = { cle: string; prenom: string; image: string };

/** Un petit mot propre : une ligne, sans caractères de contrôle ni chevrons, `MOT_SOUVENIR_MAX` au plus. */
export const motDeSouvenir = (x: unknown): string =>
  String(x ?? "")
    .replace(/[\u0000-\u001f\u007f<>{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MOT_SOUVENIR_MAX);
