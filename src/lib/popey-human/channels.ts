// Liens des canaux WhatsApp Popey par ville. Configurable SANS migration via variables d'env :
//   POPEY_WHATSAPP_CHANNELS = JSON { "dax": "https://whatsapp.com/channel/xxx", "bordeaux": "..." }
//   POPEY_WHATSAPP_CHANNEL_DEFAULT = lien unique de repli (si la ville n'est pas dans la map).
// Renvoie "" si rien n'est configuré → le bouton « Ouvrir le canal » reste masqué (résilient).
export function cityChannelUrl(citySlug: string): string {
  const slug = String(citySlug || "").trim().toLowerCase();
  try {
    const map = JSON.parse(process.env.POPEY_WHATSAPP_CHANNELS || "{}") as Record<string, string>;
    if (slug && typeof map[slug] === "string" && map[slug].trim()) return map[slug].trim();
  } catch {
    /* JSON invalide → on ignore et on tente le repli */
  }
  return String(process.env.POPEY_WHATSAPP_CHANNEL_DEFAULT || "").trim();
}
