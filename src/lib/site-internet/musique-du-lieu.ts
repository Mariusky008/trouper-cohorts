/**
 * 🎶 LA MUSIQUE DE SON AMBIANCE — facultative, déposée depuis l'Espace Pro.
 *
 * « Lui permettre de mettre une musique s'il le veut, pour l'ambiance, qui se
 * verra à l'étape 2 de la découverte. » Quelques secondes de son lieu — le DJ
 * de ce soir, le trio du jeudi, la salle qui se remplit — que l'habitant
 * entend en ouvrant « L'ambiance » d'une soirée.
 *
 * Rangée dans `metadata.musique_ambiance` (l'adresse seule ; le fichier est
 * dans le stockage), comme les photos de son lieu. Deux mégaoctets au plus :
 * une demi-minute suffit, et c'est ce qu'on écoute avant de sortir.
 *
 * Fichier partagé : l'Espace Pro et le serveur le lisent.
 */
export type MusiqueDuLieu = { url: string; titre: string; at: string };

export const MUSIQUE_MAX_OCTETS = 2 * 1024 * 1024;

export function lireMusiqueDuLieu(metadata: Record<string, unknown> | null | undefined): MusiqueDuLieu | null {
  const m = metadata?.musique_ambiance as Partial<MusiqueDuLieu> | undefined;
  if (!m || typeof m.url !== "string" || !/^https:\/\//i.test(m.url)) return null;
  return { url: m.url, titre: typeof m.titre === "string" ? m.titre.slice(0, 60) : "", at: typeof m.at === "string" ? m.at : "" };
}
