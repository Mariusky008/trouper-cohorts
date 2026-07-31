// Le dessin du visuel d'annonce (carré 1080×1080 pour Instagram / Facebook).
//
// Séparé du composant pour une raison pratique : c'est la seule partie qu'on
// peut vérifier pour de vrai (rendu dans un navigateur, capture, relecture) sans
// monter tout l'Espace Pro. Aucune dépendance React, aucune donnée réseau.
//
// Règle : on ne dessine QUE ce que le commerçant a écrit. Pas de prix, pas de
// date, pas de mention ajoutée — le visuel doit dire exactement son annonce.

export type VisuelStyle = {
  key: string;
  label: string;
  from: string;
  to: string;
  ink: string;
  soft: string;
};

/** Trois partis pris qui restent lisibles en miniature (le fil Instagram est petit). */
export const VISUEL_STYLES: VisuelStyle[] = [
  { key: "nuit", label: "Nuit", from: "#141A2E", to: "#0B0F1A", ink: "#FFFFFF", soft: "#9FB0CE" },
  { key: "vert", label: "Vert", from: "#0E3B2C", to: "#07231A", ink: "#FFFFFF", soft: "#8ECDB4" },
  { key: "creme", label: "Crème", from: "#F6F1E7", to: "#EDE4D4", ink: "#1A1A14", soft: "#6E6A5C" },
];

/** Côté du carré, en pixels. 1080 est le format natif d'un post Instagram. */
export const VISUEL_SIZE = 1080;

/** Découpe un texte en lignes qui tiennent dans `max` pixels. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export type VisuelData = { annonce: string; nom: string; metier: string; ville: string };

/** Dessine le visuel complet. Idempotent : on peut rappeler à chaque changement. */
export function drawVisuel(ctx: CanvasRenderingContext2D, style: VisuelStyle, d: VisuelData): void {
  const S = VISUEL_SIZE;
  const pad = 96;

  ctx.clearRect(0, 0, S, S);
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, style.from);
  g.addColorStop(1, style.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // Halo discret : évite l'aplat mort sans rien encombrer.
  const halo = ctx.createRadialGradient(S * 0.18, S * 0.08, 0, S * 0.18, S * 0.08, S * 0.75);
  halo.addColorStop(0, style.key === "creme" ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.10)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, S, S);

  // Bandeau du haut : métier et ville, en petites capitales.
  ctx.textBaseline = "top";
  ctx.fillStyle = style.soft;
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  const chapeau = [d.metier, d.ville].filter(Boolean).join(" · ").toUpperCase();
  if (chapeau) ctx.fillText(chapeau, pad, pad);

  // L'annonce : c'est elle qu'on doit lire à bout de bras. On réduit le corps
  // jusqu'à ce que le texte tienne en 7 lignes — plutôt que de le couper.
  ctx.fillStyle = style.ink;
  let size = 76;
  let lines: string[] = [];
  for (; size >= 40; size -= 4) {
    ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
    lines = wrap(ctx, d.annonce.trim(), S - pad * 2);
    if (lines.length <= 7) break;
  }
  const lh = size * 1.28;
  // Bloc de texte centré verticalement entre le chapeau et la signature.
  const haut = pad + 120;
  const bas = S - pad - 130;
  let y = Math.max(haut, haut + (bas - haut - lines.length * lh) / 2);
  for (const l of lines.slice(0, 7)) {
    ctx.fillText(l, pad, y);
    y += lh;
  }

  // Signature en bas : le nom du commerce, puis le rappel du site.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = style.ink;
  ctx.font = "800 44px Inter, system-ui, sans-serif";
  ctx.fillText(d.nom, pad, S - pad - 52);

  ctx.fillStyle = style.soft;
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Toutes les infos et réservations sur notre site", pad, S - pad);
}
