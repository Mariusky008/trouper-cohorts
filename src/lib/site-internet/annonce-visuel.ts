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

/**
 * Le carré est RECADRÉ partout où il paraît : en portrait sur la carte du
 * catalogue, en bandeau large chez un commerce voisin, carré seulement sur
 * Instagram. Une composition collée aux bords perd donc son texte — c'est ce
 * qui arrivait : le haut et le bas disparaissaient.
 *
 * D'où une composition CENTRÉE, tenue dans une zone sûre : le texte au milieu
 * exact (le seul endroit que tous les recadrages conservent), et rien de
 * collé aux bords.
 */
const MARGE = 132; // 12 % de chaque côté : survit au recadrage portrait
const LIGNES_MAX = 6;

/** Dessine le visuel complet. Idempotent : on peut rappeler à chaque changement. */
export function drawVisuel(ctx: CanvasRenderingContext2D, style: VisuelStyle, d: VisuelData): void {
  const S = VISUEL_SIZE;
  const large = S - MARGE * 2;

  ctx.clearRect(0, 0, S, S);
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, style.from);
  g.addColorStop(1, style.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // Halo discret : évite l'aplat mort sans rien encombrer.
  const halo = ctx.createRadialGradient(S * 0.5, S * 0.36, 0, S * 0.5, S * 0.36, S * 0.72);
  halo.addColorStop(0, style.key === "creme" ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.12)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, S, S);

  ctx.textAlign = "center";
  const milieu = S / 2;

  // L'annonce : c'est elle qu'on doit lire à bout de bras. On réduit le corps
  // jusqu'à ce que le texte tienne — on ne le coupe JAMAIS, parce qu'une
  // annonce tronquée dit autre chose que ce que le commerçant a écrit.
  const texte = d.annonce.trim().replace(/\s+/g, " ");
  let size = 78;
  let lines: string[] = [];
  for (; size >= 26; size -= 3) {
    ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
    lines = wrap(ctx, texte, large);
    if (lines.length <= LIGNES_MAX) break;
  }
  const lh = size * 1.3;

  // Le bloc complet (chapeau + texte + nom) est centré sur le milieu exact.
  const chapeau = [d.metier, d.ville].filter(Boolean).join(" · ").toUpperCase();
  const hChapeau = chapeau ? 68 : 0;
  const hNom = d.nom ? 82 : 0;
  const hTotal = hChapeau + lines.length * lh + hNom;
  let y = milieu - hTotal / 2;

  ctx.textBaseline = "top";
  if (chapeau) {
    ctx.fillStyle = style.soft;
    ctx.font = "700 29px Inter, system-ui, sans-serif";
    ctx.fillText(chapeau, milieu, y);
    y += hChapeau;
  }

  ctx.fillStyle = style.ink;
  ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
  for (const l of lines) {
    ctx.fillText(l, milieu, y);
    y += lh;
  }

  if (d.nom) {
    y += 24;
    ctx.fillStyle = style.soft;
    ctx.font = "800 38px Inter, system-ui, sans-serif";
    ctx.fillText(d.nom, milieu, y);
  }

  ctx.textAlign = "left";
}
