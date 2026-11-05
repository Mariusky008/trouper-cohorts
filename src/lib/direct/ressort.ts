/**
 * 🕺 ELLE DANSE SUR SON RESSORT — 5 novembre 2026, le patron : « l'option "la faire danser" est vraiment très mauvaise :
 * au lieu d'utiliser les ressorts pour la faire bouger et danser, c'est la photo en entier qui bouge ».
 *
 * Sur l'image de sa figurine (un fond uni ou en dégradé, la figurine debout sur un ressort, le ressort sur un socle), on
 * trouve :
 *   · LE FOND : ce qui touche le haut et les côtés de l'image et change doucement de couleur, de proche en proche ;
 *     le reste est la figurine (son masque) ;
 *   · LE RESSORT : en remontant depuis le bas, le socle est large ; au-dessus, le ressort est étroit ; au-dessus encore,
 *     le corps redevient large. `haut` et `bas` : le haut et le bas du ressort (une part de la hauteur de l'image) ;
 *   · LE FOND SEUL (`fond`) : le fond, prolongé là où était la figurine (de proche en proche) — derrière elle, quand
 *     elle bouge.
 * La page (`figurine-qui-parle.tsx`) pose alors le fond seul, puis trois morceaux de la figurine (son masque) : le
 * socle qui ne bouge pas, le ressort qui se tasse et s'étire, le corps qui saute et se balance au-dessus.
 *
 * Rien trouvé (pas de ressort, un fond trop chargé) : `null` — la page la fait sauter tout entière.
 *
 * `trouverRessort` : des pixels en entrée, des pixels en sortie (on l'essaie avec node) ; `ressortDe` : dans le
 * navigateur seulement (il lit l'image et rend des images).
 */

export type Ressort = {
  /** Le haut et le bas du ressort, en part de la hauteur de l'image (0 en haut, 1 en bas). */
  haut: number;
  bas: number;
  /** La figurine : 1 par pixel de la figurine (un peu élargie), 0 pour le fond. */
  masque: Uint8Array;
  /** Le fond seul, en RGBA (la figurine effacée). */
  fond: Uint8ClampedArray;
};

/** L'écart de couleur (au carré) toléré d'un pixel du fond à son voisin. */
const PAS = 18 * 18 * 3;

/** `dire` : pour comprendre (les essais). */
export function trouverRessort(px: Uint8ClampedArray | Uint8Array, W: number, H: number, dire?: (m: string) => void): Ressort | null {
  if (W < 40 || H < 40 || px.length < W * H * 4) return null;
  const n = W * H;
  // LA COULEUR DE CHAQUE PIXEL : sa teinte (en degrés), sa saturation, sa clarté
  const teinte = new Float32Array(n),
    sature = new Float32Array(n),
    clair = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = px[i * 4] / 255,
      g = px[i * 4 + 1] / 255,
      b = px[i * 4 + 2] / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min;
    clair[i] = max;
    sature[i] = max ? d / max : 0;
    teinte[i] = !d ? 0 : max === r ? (60 * ((g - b) / d) + 360) % 360 : max === g ? 60 * ((b - r) / d) + 120 : 60 * ((r - g) / d) + 240;
  }
  const ecart = (i: number, j: number) => {
    const a = i * 4,
      b = j * 4;
    const r = px[a] - px[b],
      g = px[a + 1] - px[b + 1],
      bl = px[a + 2] - px[b + 2];
    return r * r + g * g + bl * bl;
  };

  // LES GRAINES DU FOND : le haut, et le haut des côtés (le socle peut toucher le bas de l'image)
  const graines: number[] = [];
  for (let x = 0; x < W; x++) graines.push(x);
  for (let y = 1; y < Math.round(H * 0.6); y++) graines.push(y * W, y * W + W - 1);
  // SA TEINTE (la moyenne des graines, sur le cercle des couleurs) : un fond coloré (le rose de ClikMe) se suit par sa
  // teinte — la peau, les cheveux gris, le bois du socle en sont loin ; un fond pâle (blanc, gris), par sa couleur
  let cx = 0,
    cy = 0,
    sat = 0;
  const moyenne = [0, 0, 0];
  for (const i of graines) {
    cx += Math.cos((teinte[i] * Math.PI) / 180) * sature[i];
    cy += Math.sin((teinte[i] * Math.PI) / 180) * sature[i];
    sat += sature[i];
    for (let c = 0; c < 3; c++) moyenne[c] += px[i * 4 + c];
  }
  sat /= graines.length;
  for (let c = 0; c < 3; c++) moyenne[c] /= graines.length;
  const teinteFond = ((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360;
  const colore = sat > 0.15;
  dire?.(`fond : ${colore ? `coloré, teinte ${Math.round(teinteFond)}°` : "pâle"} (saturation ${sat.toFixed(2)})`);
  const duFond = (j: number) => {
    if (px[j * 4 + 3] <= 20) return true;
    if (colore) {
      const dt = Math.abs(((teinte[j] - teinteFond + 540) % 360) - 180);
      return dt <= 20 && sature[j] >= 0.1 && clair[j] >= 0.25;
    }
    const r = px[j * 4] - moyenne[0],
      g = px[j * 4 + 1] - moyenne[1],
      b = px[j * 4 + 2] - moyenne[2];
    return r * r + g * g + b * b < 45 * 45 * 3;
  };

  // LE FOND : de proche en proche depuis les graines, tant que la couleur reste celle du fond et change doucement
  const fond = new Uint8Array(n);
  const pile: number[] = [];
  for (const i of graines)
    if (duFond(i) && !fond[i]) {
      fond[i] = 1;
      pile.push(i);
    }
  while (pile.length) {
    const i = pile.pop()!;
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
      if (j >= 0 && j < n && !fond[j] && duFond(j) && (px[j * 4 + 3] <= 20 || ecart(i, j) < PAS)) {
        fond[j] = 1;
        pile.push(j);
      }
  }

  // LA FIGURINE : le plus grand morceau d'un seul tenant (pas les poussières)
  const morceau = new Int32Array(n).fill(-1);
  let plusGrand = -1,
    taille = 0;
  for (let i = 0, k = 0; i < n; i++) {
    if (fond[i] || morceau[i] >= 0) continue;
    let t = 0;
    const p = [i];
    morceau[i] = k;
    while (p.length) {
      const a = p.pop()!;
      t++;
      const x = a % W;
      for (const j of [x > 0 ? a - 1 : -1, x < W - 1 ? a + 1 : -1, a - W, a + W])
        if (j >= 0 && j < n && !fond[j] && morceau[j] < 0) {
          morceau[j] = k;
          p.push(j);
        }
    }
    if (t > taille) {
      taille = t;
      plusGrand = k;
    }
    k++;
  }
  // une figurine occupe une bonne part de l'image (sinon, le fond a tout mangé, ou rien)
  dire?.(`figurine : ${Math.round((100 * taille) / n)} % de l'image`);
  if (taille < n * 0.08 || taille > n * 0.8) return null;
  const fig = new Uint8Array(n);
  for (let i = 0; i < n; i++) fig[i] = morceau[i] === plusGrand ? 1 : 0;

  // SA LARGEUR, LIGNE PAR LIGNE (de son bord gauche à son bord droit)
  const large = new Array<number>(H).fill(0);
  for (let y = 0; y < H; y++) {
    let g = -1,
      d = -1;
    for (let x = 0; x < W; x++)
      if (fig[y * W + x]) {
        if (g < 0) g = x;
        d = x;
      }
    large[y] = g < 0 ? 0 : d - g + 1;
  }
  // LE SOCLE (en bas, large), PUIS LE RESSORT (étroit), PUIS LE CORPS (large de nouveau)
  let y = H - 1;
  while (y > 0 && large[y] === 0) y--;
  let socle = 0;
  while (y > H * 0.4 && !(large[y] < socle * 0.45 && large[y - 1] < socle * 0.45)) socle = Math.max(socle, large[y--]);
  const bas = y + 1;
  dire?.(`largeurs (de 5 en 5 lignes) : ${large.filter((_, k) => k % 5 === 0).join(" ")}`);
  dire?.(`socle : ${socle} px de large, son haut à la ligne ${bas} / ${H}`);
  if (socle < W * 0.15) return null;
  // (sa largeur : la médiane des dix lignes juste au-dessus du socle — les spires ne font pas toutes la même)
  const spires = large.slice(Math.max(0, y - 9), y + 1).sort((a, b) => a - b);
  const ressort = Math.max(1, spires[Math.floor(spires.length / 2)]);
  while (y > H * 0.3 && !(large[y] > ressort * 1.6 && large[y - 1] > ressort * 1.6)) y--;
  const haut = y + 1;
  const hauteur = (bas - haut) / H;
  dire?.(`ressort : ${ressort} px de large, de la ligne ${haut} à ${bas}`);
  // (un ressort tient entre le corps et le socle, et le socle est en bas de l'image)
  if (hauteur < 0.02 || hauteur > 0.3 || haut < H * 0.45 || bas < H * 0.6) return null;

  // LE MASQUE, UN PEU ÉLARGI (ses bords restent nets quand elle bouge) ; ET CE QU'ON EFFACE DU FOND, PLUS LARGE ENCORE
  // (le liseré de ses cheveux resterait, en fantôme, derrière elle)
  const elargi = (r: number) => {
    const m = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!fig[i]) continue;
      const x = i % W;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx,
            j = i + dy * W + dx;
          if (xx >= 0 && xx < W && j >= 0 && j < n) m[j] = 1;
        }
    }
    return m;
  };
  const masque = elargi(2);
  const efface = elargi(5);

  // LE FOND SEUL : la figurine effacée, le fond prolongé de proche en proche (la moyenne de ses voisins déjà connus)
  const sortie = new Uint8ClampedArray(n * 4);
  const connu = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    if (!efface[i]) {
      sortie.set([px[i * 4], px[i * 4 + 1], px[i * 4 + 2], 255], i * 4);
      connu[i] = 1;
    }
  let reste: number[] = [];
  for (let i = 0; i < n; i++) if (!connu[i]) reste.push(i);
  for (let tour = 0; reste.length && tour < W + H; tour++) {
    const faits: number[] = [];
    const encore: number[] = [];
    for (const i of reste) {
      const x = i % W;
      let r = 0,
        g = 0,
        b = 0,
        c = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            j = i + dy * W + dx;
          if ((dx || dy) && xx >= 0 && xx < W && j >= 0 && j < n && connu[j]) {
            r += sortie[j * 4];
            g += sortie[j * 4 + 1];
            b += sortie[j * 4 + 2];
            c++;
          }
        }
      if (c) {
        sortie.set([r / c, g / c, b / c, 255], i * 4);
        faits.push(i);
      } else encore.push(i);
    }
    for (const i of faits) connu[i] = 1;
    reste = encore;
  }
  // (lissé : le prolongement laisse des traînées)
  const lisse = new Uint8ClampedArray(sortie);
  for (let tour = 0; tour < 8; tour++) {
    for (let i = 0; i < n; i++) {
      if (!efface[i]) continue;
      const x = i % W;
      for (let c = 0; c < 3; c++) {
        let s = 0,
          k = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx,
              j = i + dy * W + dx;
            if (xx >= 0 && xx < W && j >= 0 && j < n) {
              s += sortie[j * 4 + c];
              k++;
            }
          }
        lisse[i * 4 + c] = s / k;
      }
    }
    sortie.set(lisse);
  }
  return { haut: haut / H, bas: bas / H, masque, fond: sortie };
}

/** Ce que la page pose : le haut et le bas du ressort (en %), le masque de la figurine et le fond seul (des images). */
export type RessortVu = { haut: number; bas: number; masque: string; fond: string };

const vus = new Map<string, Promise<RessortVu | null>>();

/**
 * DANS LE NAVIGATEUR : l'image de sa figurine (bouche fermée), lue en petit (200 px de large : il suffit), puis son
 * masque et son fond seul en images. L'image doit se laisser lire (CORS : le stockage le permet) ; sinon, `null`.
 * Gardé par adresse (sans le jeton de signature, qui change à chaque visite).
 */
export function ressortDe(adresse: string): Promise<RessortVu | null> {
  const cle = adresse.split("?")[0];
  const deja = vus.get(cle);
  if (deja) return deja;
  const p = (async (): Promise<RessortVu | null> => {
    try {
      const r = await fetch(adresse, { mode: "cors" });
      if (!r.ok) return null;
      const image = await createImageBitmap(await r.blob());
      const W = 200,
        H = Math.round((W * image.height) / image.width);
      const toile = document.createElement("canvas");
      toile.width = W;
      toile.height = H;
      const g = toile.getContext("2d", { willReadFrequently: true });
      if (!g) return null;
      g.drawImage(image, 0, 0, W, H);
      const t = trouverRessort(g.getImageData(0, 0, W, H).data, W, H);
      if (!t) return null;
      // LE MASQUE : blanc là où est la figurine, transparent ailleurs
      const m = g.createImageData(W, H);
      for (let i = 0; i < W * H; i++) if (t.masque[i]) m.data.set([255, 255, 255, 255], i * 4);
      g.putImageData(m, 0, 0);
      const masque = toile.toDataURL("image/png");
      g.putImageData(new ImageData(new Uint8ClampedArray(t.fond), W, H), 0, 0);
      const fond = toile.toDataURL("image/jpeg", 0.85);
      return { haut: t.haut * 100, bas: t.bas * 100, masque, fond };
    } catch {
      return null;
    }
  })();
  vus.set(cle, p);
  return p;
}
