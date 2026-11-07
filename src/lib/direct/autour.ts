/**
 * 📍 AUTOUR DE MOI — les mèmes laissés dans la ville (validé par le propriétaire le 7 novembre 2026 ; la maquette et le
 * plan : `docs/reprise.md`, section 4). Ce fichier est partagé (téléphone et serveur) ; le serveur :
 * `autour-serveur.ts`.
 *
 * DEUX SORTES DE LIEUX, pour commencer :
 *   · un COMMERCE ClikMe (`c-<slug>`) : sa fiche porte ses coordonnées (le géocodage de la nuit, `direct-geocoder`) ;
 *   · une ZONE (`z-<i>_<j>`) : « Ailleurs » — la rue, une soirée, chez un ami. Sa position est ARRONDIE à une maille
 *     d'environ 500 m : la carte montre une zone floue, « quelque part par ici », jamais une épingle ni une adresse.
 *     Celui qui dépose lui donne un petit nom s'il veut (« Les Arènes », « Soirée chez Max »).
 * Les lieux publics nommés (une place, un monument…) viendront plus tard, avec des positions vérifiées.
 *
 * LES RÈGLES : jamais la position de quelqu'un en direct ; le lieu d'un mème n'est pas une preuve de passage ; pas de
 * note ni d'étoiles ; qui le voit : tout le monde, ses proches, ou lui seul ; trois mèmes par personne, par lieu et par
 * jour, au plus.
 */
import type { MemePublic } from "@/lib/direct/ma-figurine";

export type Qui = "tous" | "proches" | "moi";
export const QUIS: { cle: Qui; nom: string }[] = [
  { cle: "tous", nom: "Tout le monde" },
  { cle: "proches", nom: "Mes proches" },
  { cle: "moi", nom: "Moi seul" },
];
export const quiValide = (q: unknown): Qui | null => (q === "tous" || q === "proches" || q === "moi" ? q : null);

/** Trois mèmes par personne, par lieu et par jour : personne ne monopolise un endroit. */
export const PAR_LIEU_PAR_JOUR = 3;
/** Le petit mot (facultatif) et le petit nom d'une zone. */
export const MOT_MAX = 80;
export const NOM_LIEU_MAX = 40;

// (`public` : un lieu public nommé — les Arènes, les Halles —, placé par l'admin sur la vraie carte)
export type TypeLieu = "commerce" | "zone" | "public";
/** Un lieu de la carte : `n` mèmes qu'il peut voir, `visages` (au plus trois figurines), le dernier petit nom (zone). */
// (`photo` : en haut de sa page, celle du commerce — seulement pour la page d'un lieu, pas sur la carte)
export type Lieu = { id: string; type: TypeLieu; nom: string; emoji: string; lat: number; lng: number; n: number; visages: string[]; activite?: string; photo?: string };
/** Un mème posé dans un lieu : la carte du fil, et ce que le dépôt dit (qui le voit, le petit mot, à qui il répond). */
export type MemeAutour = MemePublic & { lieu: string; qui: Qui; mot?: string; nomLieu?: string; reponseA?: string; reponses: number; profil: string };
// (`moi` : son propre profil ; `proche` : il l'a dans ses proches)
export type ProfilAutour = { cle: string; prenom: string; image: string; memes: MemeAutour[]; lieux: { id: string; nom: string; n: number }[]; moi?: boolean; proche?: boolean };

export const lieuIdValide = (id: unknown): boolean => /^(c-[a-z0-9-]{2,120}|p-[a-z0-9-]{2,60}|z--?\d{1,7}_-?\d{1,7})$/.test(String(id ?? ""));
export const estZone = (id: string) => id.startsWith("z-");

// ─── 🏛️ LES LIEUX PUBLICS NOMMÉS (7 novembre 2026, le point 6 d'« Autour ») ─────────────────────────────────────────
/**
 * Les Arènes, les Halles, la Fontaine Chaude… : des lieux de la ville où déposer un mème, comme chez un commerçant. Leur
 * position n'est JAMAIS écrite de mémoire : l'admin les place lui-même sur la vraie carte (`/admin/humain/lieux-publics`).
 * Rangés dans le seau, `lieux-publics/<ville>.json` ; leur identifiant, `p-<le-nom>`.
 */
export type LieuPublic = { id: string; nom: string; emoji: string; lat: number; lng: number };
export const EMOJIS_LIEUX_PUBLICS = ["📍", "🏛️", "🐂", "⛲", "🌳", "🌊", "⛪", "🛒", "🎭", "⚽", "🎡", "🌉", "🏖️", "🎪"] as const;
export const NOM_LIEU_PUBLIC_MAX = 40;
/** « Les berges de l'Adour » → `p-les-berges-de-l-adour`. */
export function idLieuPublic(nom: string): string {
  const slug = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug.length >= 2 ? `p-${slug}` : "";
}
/** Des NOMS à proposer à l'admin, par ville (jamais de position : il les place lui-même). */
export const LIEUX_PUBLICS_SUGGERES: Record<string, { nom: string; emoji: string }[]> = {
  dax: [
    { nom: "Les Arènes", emoji: "🐂" },
    { nom: "Les Halles", emoji: "🛒" },
    { nom: "La Fontaine Chaude", emoji: "⛲" },
    { nom: "Les berges de l’Adour", emoji: "🌊" },
    { nom: "Le parc Théodore-Denis", emoji: "🌳" },
    { nom: "La cathédrale", emoji: "⛪" },
  ],
};
export const cleProfilValide = (c: unknown) => /^[a-f0-9]{16}$/.test(String(c ?? ""));

// ─── la zone floue : une maille d'environ 500 m ─────────────────────────────────────────────────────────────────
/** ~500 m en latitude ; en longitude, ~500 m vers 43° de latitude (Dax, Biarritz, Bordeaux). */
const PAS_LAT = 0.0045;
const PAS_LNG = 0.0062;
/** La zone d'une position : son numéro, et son CENTRE (jamais la position elle-même). */
export function zoneDe(lat: number, lng: number): { id: string; lat: number; lng: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
  const i = Math.floor(lat / PAS_LAT);
  const j = Math.floor(lng / PAS_LNG);
  return { id: `z-${i}_${j}`, lat: +((i + 0.5) * PAS_LAT).toFixed(5), lng: +((j + 0.5) * PAS_LNG).toFixed(5) };
}
export function centreDeZone(id: string): { lat: number; lng: number } | null {
  const m = /^z-(-?\d+)_(-?\d+)$/.exec(id);
  if (!m) return null;
  return { lat: +((Number(m[1]) + 0.5) * PAS_LAT).toFixed(5), lng: +((Number(m[2]) + 0.5) * PAS_LNG).toFixed(5) };
}

/** La distance entre deux points, en mètres. */
export function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const ra = (d: number) => (d * Math.PI) / 180;
  const dLat = ra(b.lat - a.lat);
  const dLng = ra(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(ra(a.lat)) * Math.cos(ra(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}
/** « 350 m », « 1,2 km ». */
export const enMetres = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);

/** L'emoji d'un commerce, d'après son activité (« 🍽️ Restaurant »). */
export function emojiDuCommerce(activite: string): string {
  const a = activite.toLowerCase();
  if (/boulang|p[aâ]tiss/.test(a)) return "🥐";
  if (/caf[eé]|salon de th[eé]/.test(a)) return "☕";
  if (/restau|bistro|brasserie|pizz|cr[eê]pe|burger|traiteur|cantine/.test(a)) return "🍽️";
  if (/coiff|barb/.test(a)) return "💇";
  if (/fleur/.test(a)) return "💐";
  if (/livre|librair/.test(a)) return "📚";
  if (/v[eê]tement|mode|boutique|pr[eê]t-[aà]-porter|friperie/.test(a)) return "👗";
  if (/ongle|beaut|esth[eé]ti|massage|spa|bien-[eê]tre/.test(a)) return "💅";
  if (/bouch|charcut|fromag|[eé]picer|primeur|march/.test(a)) return "🧺";
  return "🏪";
}

/**
 * Le petit nom d'une zone : court, sans adresse. Un numéro de rue, un code postal (trois chiffres de suite) ou un lien
 * le font refuser — « Soirée chez Max » oui, « 12 rue des Lilas » non.
 */
export function nomLieuPropre(nom: unknown): { nom?: string; refus?: string } {
  const n = String(nom ?? "").replace(/\s+/g, " ").trim().slice(0, NOM_LIEU_MAX);
  if (!n) return {};
  if (/\d{1,4}\s*(bis|ter)?\s*,?\s*(rue|avenue|av\.?|bd|boulevard|chemin|impasse|all[ée]e|place|route|cours|quai)\b/i.test(n) || /\d{3,}/.test(n)) {
    return { refus: "Pas d’adresse : un petit nom suffit (« Soirée chez Max », « Au bord de l’Adour »)." };
  }
  if (/https?:|www\.|@/.test(n)) return { refus: "Pas de lien ici : un petit nom suffit." };
  return { nom: n };
}
