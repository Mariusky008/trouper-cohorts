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

// Numéro WhatsApp Popey (admin) qui REÇOIT les posts canal des commerçants pour les publier.
// Sur une chaîne WhatsApp seul l'admin publie → le pro envoie son post à Popey (1 tap wa.me) et Popey
// le publie dans le canal de la ville. Renvoie les digits (sans +) pour wa.me, "" si non configuré.
//   POPEY_CHANNEL_SUBMIT_WHATSAPP = "+33 6 12 34 56 78" | "0612345678" | "33612345678"
export function channelSubmitWhatsApp(): string {
  const raw = String(process.env.POPEY_CHANNEL_SUBMIT_WHATSAPP || "").trim();
  if (!raw) return "";
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (s.startsWith("0")) s = `+33${s.slice(1)}`;
  if (!s.startsWith("+")) s = `+${s}`;
  return s.replace(/\D/g, ""); // digits purs pour wa.me/<digits>
}
