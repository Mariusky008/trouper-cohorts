/**
 * 🎨 AUX COULEURS DE LA MAISON — une feuille de style repeinte, sans la réécrire.
 *
 * « Il faut que l'expérience prenne toute la page et que les couleurs soient
 * raccord avec la charte graphique. »
 *
 * L'ATELIER D'ESSAI ET LE PARCOURS DU PLAT SONT PARTAGÉS avec l'application
 * `/autour-de-moi`, qui garde sa palette (violet du fantôme, menthe du
 * commerce). Sur la page d'un commerçant, ils doivent porter celle de ses
 * pages : nuit brune, crème, ambre pour ce qui s'allume, rose pour ce qu'on
 * touche. Plus de deux cents teintes y sont écrites en dur : une table à la
 * main casserait à la première retouche. On repeint donc PAR FAMILLE :
 *
 *   · les nuits bleues et violettes deviennent la nuit brune ;
 *   · les violets et magentas d'accent deviennent le rose de la maison ;
 *   · les blancs bleutés deviennent crème, les gris froids des gris chauds ;
 *   · la menthe et les bleus d'accent deviennent l'ambre ;
 *   · les teintes chaudes (ambre, corail, or) ne bougent pas, ni le noir pur,
 *     ni le blanc pur, ni le vert de WhatsApp — c'est sa marque, pas la nôtre.
 *
 * La clarté de chaque couleur est gardée : un texte clair reste clair, un fond
 * sombre reste sombre. C'est ce qui garde les contrastes.
 *
 * FICHIER PARTAGÉ : aucune dépendance au DOM.
 */

type Hsl = { h: number; s: number; l: number };

function versHsl(r: number, g: number, b: number): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: h * 60, s, l };
}

function versRgb({ h, s, l }: Hsl): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as [number, number, number];
}

/** Une couleur, repeinte dans la famille de la maison. */
export function teinteMaison(r: number, g: number, b: number): [number, number, number] {
  // LE VERT DE WHATSAPP EST SA MARQUE : on n'y touche pas.
  if (r === 37 && g === 211 && b === 102) return [r, g, b];
  const c = versHsl(r, g, b);
  if (c.l > 0.985 || c.l < 0.02) return [r, g, b]; // blanc et noir purs
  const chaude = c.h < 60 || c.h >= 345;
  if (chaude) return [r, g, b];
  // LES GRIS : froids → chauds, à peine teintés.
  if (c.s < 0.1) return versRgb({ h: 28, s: Math.min(0.2, c.s + 0.08), l: c.l });
  // LES NUITS (bleues, violettes, vertes très sombres) → la nuit brune.
  if (c.l < 0.27) return versRgb({ h: 20, s: Math.min(c.s, 0.38), l: c.l });
  // LES MENTHES ET LES VERTS → l'ambre.
  if (c.h >= 60 && c.h < 190) return versRgb({ h: 34, s: Math.max(c.s, 0.75), l: c.l });
  // LES BLEUS (190° à 245°).
  if (c.h < 245) {
    if (c.l > 0.82) return versRgb({ h: 34, s: Math.min(1, c.s + 0.2), l: Math.max(c.l, 0.93) }); // blanc bleuté → crème
    if (c.s < 0.35) return versRgb({ h: 28, s: c.s * 0.8, l: c.l }); // gris bleu → gris chaud
    return versRgb({ h: 36, s: Math.max(c.s, 0.8), l: c.l }); // bleu d'accent → ambre
  }
  // LES VIOLETS ET MAGENTAS (245° à 345°) → le rose de la maison.
  if (c.l > 0.9) return versRgb({ h: 34, s: 1, l: Math.max(c.l, 0.95) }); // lavande pâle → crème
  return versRgb({ h: 330, s: Math.max(c.s, 0.7), l: c.l });
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

/** Repeint toutes les couleurs d'une feuille de style : #rgb, #rrggbb, rgb() et rgba(). */
export function enCharteMaison(css: string): string {
  return css
    .replace(/#([0-9a-fA-F]{6})\b|#([0-9a-fA-F]{3})\b/g, (tout, six: string | undefined, trois: string | undefined) => {
      const h = six ?? (trois as string).split("").map((x) => x + x).join("");
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      const [R, G, B] = teinteMaison(r, g, b);
      return `#${hex2(R)}${hex2(G)}${hex2(B)}`;
    })
    .replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,[^)]*)?\)/g, (tout, r: string, g: string, b: string, a?: string) => {
      const [R, G, B] = teinteMaison(Number(r), Number(g), Number(b));
      return a ? `rgba(${R},${G},${B}${a})` : `rgb(${R},${G},${B})`;
    });
}
