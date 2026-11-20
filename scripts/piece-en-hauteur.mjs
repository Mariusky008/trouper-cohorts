// 🖼️ UNE PIÈCE PRÊTE POUR LES ESSAIS, COMME CELLES DE LA MESSAGERIE : son image en hauteur (`pieces-duo/<pièce>/decor.png`,
// 1024 × 1536), ses lumières (`lumiere-<moment>.png`) et son relevé (`releve.json`, des parts de l'image, de 0 à 1).
//
// Depuis le 20 novembre 2026 (le propriétaire : « le panorama, les images se chevauchent […] on pourrait tout avoir sur une
// seule image comme celle de la messagerie »), Ma maison, la télé du jour et les salons ouverts montrent cette image-là,
// et plus le panorama. L'image dessine ce que dit le relevé (la télé en noir, la fenêtre en ciel, les lampes, l'étagère,
// les cadres, la table) : les captures se lisent d'un coup d'œil.
//
// Rien de vrai ici : des rectangles de couleur, jamais un visage.
import sharp from "sharp";

export const LARGEUR_PIECE = 1024;
export const HAUTEUR_PIECE = 1536;

/** Le relevé d'une pièce sans rien de plus : la télé au mur, les deux places du duo (celle de gauche, la sienne). */
export const RELEVE_PIECE = {
  tele: [0.3, 0.2, 0.4, 0.16],
  cadres: [],
  places: [
    { x: 0.3, y: 0.86, hauteur: 0.3 },
    { x: 0.7, y: 0.86, hauteur: 0.3 },
  ],
};

const COULEURS = { tele: "#111", fenetre: "#bfe3ff", etagere: "#8a6a4a", platine: "#2a2224", table: "#7a5a3a", cadres: "#e9d9b0", lampes: "#e8c070" };

/** L'image de la pièce (un PNG en hauteur) : son mur, son sol, et ce que dit son relevé. */
export async function imagePiece({ fond = "#6a3a5a", sol = "#5a4030", emplacements = RELEVE_PIECE } = {}) {
  const L = LARGEUR_PIECE;
  const H = HAUTEUR_PIECE;
  const rect = (z, c) => `<rect x="${Math.round(z[0] * L)}" y="${Math.round(z[1] * H)}" width="${Math.round(z[2] * L)}" height="${Math.round(z[3] * H)}" fill="${c}"/>`;
  const zones = Object.entries(COULEURS).flatMap(([k, c]) => {
    const v = emplacements[k];
    if (!Array.isArray(v) || !v.length) return [];
    return (Array.isArray(v[0]) ? v : [v]).map((z) => rect(z, c));
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}"><rect width="${L}" height="${H}" fill="${fond}"/><rect y="${Math.round(H * 0.74)}" width="${L}" height="${Math.round(H * 0.26)}" fill="${sol}"/>${zones.join("")}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Poser une pièce prête dans le faux Supabase : `deposer(chemin, corps, type)` est le dépôt de l'essai. `lumieres` : ses
 * trois lumières aussi (le matin, le soir, la nuit) ; `releve` : `false` pour une pièce sans relevé.
 */
export async function poserPiece(deposer, piece, { fond, sol, emplacements = RELEVE_PIECE, lumieres = true, releve = true, le = new Date().toISOString() } = {}) {
  const image = await imagePiece({ fond, sol, emplacements });
  await deposer(`pieces-duo/${piece}/decor.png`, image, "image/png");
  if (lumieres) for (const m of ["matin", "soir", "nuit"]) await deposer(`pieces-duo/${piece}/lumiere-${m}.png`, image, "image/png");
  if (releve) await deposer(`pieces-duo/${piece}/releve.json`, JSON.stringify({ le, ajuste: true, emplacements }), "application/json");
  return image;
}
