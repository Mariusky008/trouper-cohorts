/**
 * 🎵 « LE RANGER DANS MON UNIVERS ? » · 🖼️ « LA METTRE DANS MON UNIVERS ? » (le cahier des messages, sections 4.2 et
 * 5.3 ; le relais : `docs/univers/feuille-de-route.md`, lot M ; le propriétaire a dit oui le 15 novembre 2026).
 *
 * Une chanson ou une vidéo (un lien YouTube, Spotify, Deezer, Apple Music) qu'il a envoyée à un proche, une photo qu'il
 * lui a envoyée : sous la bulle, chez lui seulement, la question ; son « oui » d'abord, toujours. Oui : l'image (la
 * pochette, la vignette, la photo) est RECOPIÉE dans son univers et posée sur son étagère, au rayon « Ce que j'aime »
 * (dans « Ma maison », sous la fenêtre de son univers) ; il choisit ensuite, comme pour tout souvenir, si ses visiteurs
 * la voient. Effacer le message n'y touche pas. Une photo reçue, elle, ne sort jamais de la conversation.
 *
 * Ici, LES RÈGLES, sans serveur : ce qui peut se ranger, les mots, le titre.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import type { SorteImage } from "./etagere";

export const RANGER_UNIVERS = {
  /** La question se pose sous les messages de moins d'une semaine (ensuite, plus rien). */
  jours: 7,
  /** L'image recopiée : 900 pixels au plus. */
  largeur: 900,
  titreMax: 28,
} as const;

export const PHRASES_RANGER = {
  lien: "🎵 Le ranger dans mon univers ?",
  photo: "🖼️ La mettre dans mon univers ?",
  oui: "Oui",
  non: "Non",
  fait: "✓ Dans ton univers, sur ton étagère",
  pasLeTien: "Seul celui qui l’a envoyé peut le ranger chez lui.",
  deja: "C’est déjà dans ton univers.",
  rien: "Ce message ne se range pas dans un univers.",
  parti: "Ce message n’existe plus.",
} as const;

export const EMOJI_IMAGE: Record<SorteImage, string> = { musique: "🎵", video: "📺", photo: "🖼️" };

/** Ce qu'un message de la conversation peut devenir dans son univers (`null` : rien, la question ne se pose pas). */
export function sorteARanger(
  m: { moi: boolean; le: string; genre?: string; lien?: { sorte?: "musique" | "video"; titre?: string; image?: string }; photo?: { url: string } },
  maintenant: number,
): SorteImage | null {
  if (!m.moi) return null;
  if (maintenant - (Date.parse(m.le) || 0) > RANGER_UNIVERS.jours * 86_400_000) return null;
  if (m.genre === "photo" && m.photo?.url) return "photo";
  // (un lien : seulement une chanson ou une vidéo, et une fois son aperçu prêt)
  if ((m.genre ?? "ecrit") === "ecrit" && m.lien?.sorte && (m.lien.titre || m.lien.image)) return m.lien.sorte;
  return null;
}

/** Le titre sur l'étagère : celui de la page (une chanson, une vidéo), la légende d'une photo — 28 signes au plus. */
export function titreRange(sorte: SorteImage, titre?: string): string {
  const t = [...(titre ?? "").replace(/\s+/g, " ").trim()];
  const court = t.length > RANGER_UNIVERS.titreMax ? `${t.slice(0, RANGER_UNIVERS.titreMax - 1).join("").trimEnd()}…` : t.join("");
  return court || (sorte === "photo" ? "Une photo" : sorte === "musique" ? "Une chanson" : "Une vidéo");
}
