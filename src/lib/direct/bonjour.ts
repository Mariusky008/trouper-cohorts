/**
 * 🎙️ « MON BONJOUR », AVEC SA VOIX (le chantier « Ma figurine », lot 4 ; `docs/univers/ma-figurine.md`, section 6 ; le
 * serveur : `bonjour-serveur.ts` ; la route du son : `/api/direct/bonjour/<clé>`).
 *
 * Le propriétaire : « 🎙️ bonjour avec SA voix, entendu quand on touche la figurine dans le fil, un salon ou Autour ».
 * Jamais de voix de synthèse : sa propre voix, enregistrée au micro dans « Mon double du jour » (quelques secondes),
 * écoutée, gardée ou refaite. Quand quelqu'un touche sa figurine (dans le fil, un salon ouvert, chez un proche devant sa
 * télé, Autour), on l'entend, et sa figurine dit « 👋 ».
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

export const BONJOUR = {
  /** Cinq secondes au plus. */
  max: 5,
  /** Un toucher plus court n'est pas un bonjour. */
  min: 0.7,
} as const;

/** Son bonjour, tel que les autres l'entendent : l'adresse du son (sans jamais son compte) et sa durée. */
export type BonjourVu = { src: string; duree: number };

/** L'adresse du son de son bonjour (sa clé de profil ; `v` : quand il l'a enregistré, pour ne pas réentendre l'ancien). */
export const adresseBonjour = (cle: string, le: number) => `/api/direct/bonjour/${cle}?v=${Math.round(le)}`;

export const PHRASES_BONJOUR = {
  onglet: "Bonjour",
  titre: "🎙️ Mon bonjour",
  chapo: "Dis bonjour avec ta voix, quelques secondes. Quand quelqu’un touche ta figurine (le fil, un salon, Autour), il l’entend.",
  appuie: "Garde le micro appuyé et dis bonjour",
  pret: "Ton bonjour est prêt : écoute-le, puis garde-le.",
  ecouter: "▶️ Écouter",
  garder: "✓ Garder ce bonjour",
  refaire: "Refaire",
  enlever: "Enlever mon bonjour",
  garde: "✓ Ton bonjour, partout : on l’entend quand on touche ta figurine.",
  enleve: "✓ Plus de bonjour.",
  sien: "Ton bonjour",
  sans: "Pas encore de bonjour : ta figurine reste muette quand on la touche.",
  court: "Garde le micro appuyé un peu plus longtemps.",
  refus: "Le micro n’a pas pu s’allumer : autorise-le dans les réglages de ton téléphone.",
  rate: "Ton bonjour n’est pas parti : réessaie.",
  entendre: (prenom: string) => `🔊 Le bonjour de ${prenom}`,
  dit: "👋",
} as const;
