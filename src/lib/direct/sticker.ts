/**
 * ⚡ LE STICKER D'UNE RÉACTION (`mes-reactions.ts`), dessiné dans le téléphone : une image carrée de 512 px.
 *
 *   · sa pose détourée (fond transparent) : sa figurine seule, avec un liseré blanc et une petite ombre, comme un vrai
 *     autocollant — le fond reste transparent (WhatsApp, iMessage, les stickers de l'iPhone) ;
 *   · pas encore de pose (le moteur la prépare, ou n'est pas là) : sa figurine de tous les jours dans une vignette
 *     arrondie, et l'emoji de la réaction ;
 *   · le mot, façon BD (« Sérieusement ? »), au-dessus — blanc, cerné de sombre, un peu penché.
 * Rien de ClikMe dessus (c'est à lui).
 *
 * FICHIER NAVIGATEUR.
 */
export const TAILLE_STICKER = 512;
const EMOJI = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

/** Une image (même ses adresses signées), rapatriée en `blob:` : le dessin reste exportable. */
async function charger(url: string): Promise<HTMLImageElement> {
  const r = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!r.ok) throw new Error("Sa figurine n’a pas pu se charger.");
  const u = URL.createObjectURL(await r.blob());
  const i = new Image();
  i.src = u;
  await i.decode();
  return i;
}

/** Le cadre de ce qui n'est pas transparent (en pixels de l'image), pour coller la figurine au plus près. */
export function boite(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const w = 160;
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  const k = img.naturalWidth / w;
  return { x: Math.max(0, (x0 - 1) * k), y: Math.max(0, (y0 - 1) * k), w: Math.min(img.naturalWidth, (x1 - x0 + 3) * k), h: Math.min(img.naturalHeight, (y1 - y0 + 3) * k) };
}

/** Le mot, façon BD : blanc, cerné de sombre, un peu penché ; il rétrécit pour tenir. */
function mot(g: CanvasRenderingContext2D, texte: string, police: string) {
  let taille = 96;
  g.font = `900 ${taille}px ${police}`;
  while (g.measureText(texte).width > 460 && taille > 40) {
    taille -= 4;
    g.font = `900 ${taille}px ${police}`;
  }
  g.save();
  g.translate(TAILLE_STICKER / 2, 74);
  g.rotate((-4 * Math.PI) / 180);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = taille * 0.24;
  g.strokeStyle = "#2A0F1F";
  g.strokeText(texte, 0, 0);
  g.fillStyle = "#FFFFFF";
  g.fillText(texte, 0, 0);
  g.restore();
}

export async function fabriquerSticker(o: { image: string; detouree: boolean; mot?: string; emoji?: string; police: string }): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = TAILLE_STICKER;
  c.height = TAILLE_STICKER;
  const g = c.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner ici.");
  const img = await charger(o.image);
  const zone = o.mot ? { x: 28, y: 122, w: 456, h: 368 } : { x: 22, y: 22, w: 468, h: 468 };
  if (o.detouree) {
    // SA FIGURINE SEULE, au plus près, posée en bas de la zone ; un liseré blanc tout autour, et une petite ombre
    const b = boite(img);
    const k = Math.min(zone.w / b.w, zone.h / b.h);
    const w = b.w * k;
    const h = b.h * k;
    const x = zone.x + (zone.w - w) / 2;
    const y = zone.y + zone.h - h;
    const sil = document.createElement("canvas");
    sil.width = Math.ceil(w);
    sil.height = Math.ceil(h);
    const sg = sil.getContext("2d");
    if (sg) {
      sg.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, w, h);
      sg.globalCompositeOperation = "source-in";
      sg.fillStyle = "#FFFFFF";
      sg.fillRect(0, 0, w, h);
      g.save();
      g.shadowColor = "rgba(0,0,0,.35)";
      g.shadowBlur = 14;
      g.shadowOffsetY = 6;
      g.drawImage(sil, x, y);
      g.restore();
      const r = 9;
      for (let a = 0; a < 16; a++) g.drawImage(sil, x + Math.cos((a / 16) * Math.PI * 2) * r, y + Math.sin((a / 16) * Math.PI * 2) * r);
    }
    g.drawImage(img, b.x, b.y, b.w, b.h, x, y, w, h);
  } else {
    // SA FIGURINE DE TOUS LES JOURS, dans une vignette arrondie (bordure blanche), et l'emoji de la réaction
    g.save();
    g.shadowColor = "rgba(0,0,0,.35)";
    g.shadowBlur = 14;
    g.shadowOffsetY = 6;
    g.fillStyle = "#FFFFFF";
    g.beginPath();
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 60);
    g.fill();
    g.restore();
    g.save();
    g.beginPath();
    g.roundRect(zone.x + 12, zone.y + 12, zone.w - 24, zone.h - 24, 50);
    g.clip();
    const w = zone.w - 24;
    const h = zone.h - 24;
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / k;
    const sh = h / k;
    g.drawImage(img, (img.naturalWidth - sw) / 2, Math.max(0, (img.naturalHeight - sh) * 0.22), sw, sh, zone.x + 12, zone.y + 12, w, h);
    g.restore();
    if (o.emoji) {
      g.fillStyle = "#FFFFFF";
      g.beginPath();
      g.arc(zone.x + zone.w - 62, zone.y + zone.h - 62, 66, 0, Math.PI * 2);
      g.fill();
      g.font = `86px ${EMOJI}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(o.emoji, zone.x + zone.w - 62, zone.y + zone.h - 58);
    }
  }
  if (o.mot) mot(g, o.mot, o.police);
  URL.revokeObjectURL(img.src);
  return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("Le sticker n’a pas pu se dessiner."))), "image/png"));
}
