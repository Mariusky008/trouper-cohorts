/**
 * 🎭 LES CALQUES DE CHAQUE FIGURINE, FAITS UNE FOIS (`docs/univers/ma-maison.md`, section 4 ; `salon-du-duo.md`,
 * section 12 ; le lot S1 ; leur forme et leur pose : `figurine-calques.ts`).
 *
 * D'après sa figurine assise dans son fauteuil (le nouveau style, `references.assise`), avec `sharp`, sans moteur
 * d'image :
 *
 * 1. **le corps** : la plus grande silhouette seulement (l'image de la figurine assise laisse parfois des traînées sur les
 *    côtés), recadrée au plus près — la tête d'origine comprise ;
 * 2. **la tête et ses repères** (sa boîte, le pivot au milieu du cou, la bouche, les joues) : relevés une fois par le
 *    modèle qui voit, s'il est branché (une analyse d'image, quelques millièmes d'euro) ; sinon estimés d'après la
 *    silhouette (le cou à la ligne la plus étroite sous la grosse tête, sinon à 40 % de la hauteur ; la tête dans la
 *    largeur de son crâne, pour ne pas emporter le dossier du fauteuil) ;
 * 3. **le calque de la tête** : ce que la boîte de la tête contient de la figurine (la main comprise si elle touche le
 *    visage), fondu sur deux points en bas.
 *
 * Rangés chez l'habitant : `<habitant>/calques/<empreinte de l'image>-corps.png`, `-tete.png` et `.json` (leurs repères,
 * et leurs adresses stables : publiés une fois, en WebP, par `imageSalon`). Une nouvelle image de sa figurine (une
 * nouvelle tenue) a une autre empreinte : ses calques se refont.
 *
 * FICHIER SERVEUR.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Zone } from "./pieces-duo";
import { LARGEURS_CALQUES, type FigurineLocale } from "./figurine-calques";
import { imageSalon } from "./salon-fichiers-serveur";
import { depotDans, lireJson, telecharger } from "./ma-figurine-serveur";
import { lireFichePerso } from "./fiches-serveur";
import { analyseConfiguree, regarderImage } from "./dressing-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const SEUIL = 24;
const dossier = (h: string) => `${h}/calques`;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
const mille = (v: number) => Math.round(v * 1000) / 1000;

/** Le chemin de sa figurine assise du nouveau style, s'il en a une. */
export async function cheminFigurineAssise(supabase: Supabase, h: string): Promise<string | null> {
  const { fiche } = await lireFichePerso(supabase, h).catch(() => ({ fiche: null }));
  const c = fiche?.style === "collection-1" ? s(fiche.references.assise?.chemin) : "";
  return c || null;
}

// ─── la plus grande silhouette ───
/** Les pixels de la plus grande silhouette (opacité au-dessus du seuil, d'un seul tenant), et sa boîte. */
function plusGrandeSilhouette(alpha: Uint8Array, w: number, h: number): { garde: Uint8Array; boite: [number, number, number, number] } | null {
  const etiquette = new Int32Array(w * h);
  const pile = new Int32Array(w * h);
  let meilleure = 0;
  let taille = 0;
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    if (etiquette[i] || alpha[i] <= SEUIL) continue;
    n += 1;
    let haut = 0;
    let t = 0;
    pile[haut++] = i;
    etiquette[i] = n;
    while (haut) {
      const j = pile[--haut];
      t += 1;
      const x = j % w;
      for (const k of [j - 1, j + 1, j - w, j + w]) {
        if (k < 0 || k >= w * h || etiquette[k] || alpha[k] <= SEUIL) continue;
        if ((k === j - 1 && x === 0) || (k === j + 1 && x === w - 1)) continue;
        etiquette[k] = n;
        pile[haut++] = k;
      }
    }
    if (t > taille) {
      taille = t;
      meilleure = n;
    }
  }
  if (!meilleure) return null;
  const garde = new Uint8Array(w * h);
  let [x0, y0, x1, y1] = [w, h, -1, -1];
  for (let i = 0; i < w * h; i++) {
    if (etiquette[i] !== meilleure && !(alpha[i] > 0 && alpha[i] <= SEUIL && voisinDe(etiquette, i, w, h, meilleure))) continue;
    garde[i] = 1;
    const [x, y] = [i % w, Math.floor(i / w)];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { garde, boite: [x0, y0, x1 - x0 + 1, y1 - y0 + 1] };
}
/** (le bord fondu d'une silhouette : un pixel presque transparent qui touche la silhouette gardée) */
function voisinDe(e: Int32Array, i: number, w: number, h: number, n: number): boolean {
  const x = i % w;
  return (x > 0 && e[i - 1] === n) || (x < w - 1 && e[i + 1] === n) || (i >= w && e[i - w] === n) || (i < w * (h - 1) && e[i + w] === n);
}

// ─── la tête et ses repères ───
export type Reperes = { tete: Zone; pivot: [number, number]; bouche: [number, number]; joues: [[number, number], [number, number]] };

/**
 * L'ESTIMATION PAR LA SILHOUETTE (dans le cadre du corps) : le crâne est la ligne la plus large du premier tiers ; le cou,
 * la ligne la plus étroite qui suit, entre 22 % et 55 % de la hauteur (nettement plus étroite que le crâne), sinon à 40 % ;
 * la tête, dans la largeur du crâne (un peu plus), jusqu'au cou.
 */
export function estimerReperes(alpha: Uint8Array, w: number, h: number): Reperes {
  const larg = new Float32Array(h);
  const g = new Float32Array(h);
  const d = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let a = -1;
    let b = -1;
    for (let x = 0; x < w; x++)
      if (alpha[y * w + x] > 128) {
        if (a < 0) a = x;
        b = x;
      }
    if (a >= 0) [larg[y], g[y], d[y]] = [b - a + 1, a, b];
  }
  const lisse = (y: number) => {
    let t = 0;
    let n = 0;
    for (let k = Math.max(0, y - 2); k <= Math.min(h - 1, y + 2); k++) [t, n] = [t + larg[k], n + 1];
    return t / n;
  };
  let crane = Math.round(h * 0.05);
  for (let y = crane; y < Math.round(h * 0.33); y++) if (lisse(y) > lisse(crane)) crane = y;
  let cou = Math.max(crane + 1, Math.round(h * 0.22));
  for (let y = cou; y <= Math.round(h * 0.55); y++) if (lisse(y) < lisse(cou)) cou = y;
  if (!(lisse(cou) < 0.8 * lisse(crane))) cou = Math.round(h * 0.4);
  const marge = 0.06 * larg[crane];
  const [tg, td] = [Math.max(0, g[crane] - marge), Math.min(w - 1, d[crane] + marge)];
  let dessus = 0;
  while (dessus < h && larg[dessus] === 0) dessus++;
  const bas = Math.min(h, cou + Math.round(h * 0.03));
  const tete: Zone = [tg / w, dessus / h, (td - tg + 1) / w, Math.max(0.05, (bas - dessus) / h)];
  const cx = (g[cou] + d[cou]) / 2 || (tg + td) / 2;
  const [hx, hy, hw, hh] = tete;
  return {
    tete,
    pivot: [cx / w, cou / h],
    bouche: [hx + hw * 0.5, hy + hh * 0.78],
    joues: [
      [hx + hw * 0.3, hy + hh * 0.68],
      [hx + hw * 0.7, hy + hh * 0.68],
    ],
  };
}

/** La question au modèle qui voit (une fois par figurine). */
export const QUESTION_REPERES = [
  "REPÈRES DE LA FIGURINE. This image is a collectible figurine with a big head, seated in a small armchair, on a white background.",
  "Answer ONLY with JSON, every value a fraction (0 to 1) of the image width (x) or height (y):",
  '{"tete": [x, y, width, height] — the box of the whole head, hair included, AND the hand if it touches the face (never the armchair),',
  ' "cou": {"x", "y"} — the middle of the neck, just under the chin,',
  ' "bouche": {"x", "y"} — the middle of the mouth,',
  ' "joues": [{"x", "y"}, {"x", "y"}] — the middle of the left cheek, then of the right cheek (as seen in the image)}',
].join("\n");

/** Les repères rendus par le modèle qui voit, vérifiés (une tête trop petite, un cou hors de la tête : rien). */
export function reperesValides(o: unknown): Reperes | null {
  const r = (o ?? {}) as Record<string, unknown>;
  const t = Array.isArray(r.tete) && r.tete.length === 4 ? r.tete.map(fraction) : null;
  const pt = (p: unknown): [number, number] | null => {
    const q = (p ?? {}) as Record<string, unknown>;
    const [x, y] = [fraction(q.x), fraction(q.y)];
    return x !== null && y !== null ? [mille(x), mille(y)] : null;
  };
  if (!t || t.some((v) => v === null)) return null;
  const [x, y, l, hh] = t as number[];
  if (l < 0.15 || hh < 0.12 || x + l > 1.02 || y + hh > 1.02) return null;
  const cou = pt(r.cou);
  const bouche = pt(r.bouche);
  const joues = Array.isArray(r.joues) && r.joues.length === 2 ? [pt(r.joues[0]), pt(r.joues[1])] : null;
  if (!cou || !bouche || !joues || !joues[0] || !joues[1]) return null;
  // (le cou sous le visage, dans la largeur de la tête ; la bouche dans la tête)
  if (cou[0] < x || cou[0] > x + l || cou[1] < y + hh * 0.5 || cou[1] > y + hh + 0.06) return null;
  if (bouche[0] < x || bouche[0] > x + l || bouche[1] < y || bouche[1] > y + hh) return null;
  return { tete: [mille(x), mille(y), mille(l), mille(hh)], pivot: cou, bouche, joues: [joues[0], joues[1]] };
}

/** L'empreinte d'une image de sa figurine (le début du nom de ses calques, et de ses expressions). */
export const empreinteDe = (chemin: string) => createHash("sha1").update(chemin).digest("hex").slice(0, 16);

/**
 * Où le corps est découpé dans l'image de sa figurine (`[x, y, largeur, hauteur]` en pixels : la boîte de la plus grande
 * silhouette, comme `decouperFigurine`) — pour retrouver la tête au pixel près sur une autre image de la même figurine.
 */
export async function boiteDuCorps(source: Buffer): Promise<[number, number, number, number] | null> {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return plusGrandeSilhouette(alpha, info.width, info.height)?.boite ?? null;
}

// ─── 🧍 le corps sans sa tête (V1 ; la messagerie aussi depuis le 22 novembre 2026) ───
/** La part de la boîte de la tête effacée du corps (en partant du haut) : le cou reste, sous la tête qui penche. */
export const PART_SANS_TETE = 0.88;
/**
 * Le corps sans sa tête habituelle : le haut de la boîte de la tête effacé (le cou reste, sous la tête qui penche).
 * Le propriétaire, le 22 novembre 2026 : « quand la tête bouge, elle est en double » — le corps gardait sa tête d'origine,
 * qu'on voyait sous la tête qui penche.
 */
export async function corpsSansTete(corps: Buffer, r: { tetePx: [number, number, number, number] }): Promise<Buffer> {
  const { data, info } = await sharp(corps).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [w, h] = [info.width, info.height];
  const [px, py, pw, ph] = r.tetePx;
  const fin = Math.min(h, py + Math.round(ph * PART_SANS_TETE));
  for (let y = Math.max(0, py); y < fin; y++) for (let x = Math.max(0, px); x < Math.min(w, px + pw); x++) data[(y * w + x) * 4 + 3] = 0;
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

// ─── la découpe ───
/** 🎭 Une figurine assise (PNG avec transparence) → son corps, sa tête, ses repères (dans le cadre du corps). */
export async function decouperFigurine(source: Buffer): Promise<{ corps: Buffer; tete: Buffer; ratio: number; reperes: Reperes; par: "regard" | "estime"; boite: [number, number, number, number]; tetePx: [number, number, number, number] } | null> {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [W, H] = [info.width, info.height];
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = data[i * 4 + 3];
  const sil = plusGrandeSilhouette(alpha, W, H);
  if (!sil) return null;
  const [bx, by, bw, bh] = sil.boite;
  if (bw < 16 || bh < 16) return null;
  // (le corps : la plus grande silhouette seule, recadrée)
  const corpsBrut = Buffer.alloc(bw * bh * 4);
  const alphaCorps = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const i = (by + y) * W + bx + x;
      if (!sil.garde[i]) continue;
      data.copy(corpsBrut, (y * bw + x) * 4, i * 4, i * 4 + 4);
      alphaCorps[y * bw + x] = data[i * 4 + 3];
    }
  const corps = await sharp(corpsBrut, { raw: { width: bw, height: bh, channels: 4 } }).png().toBuffer();
  // (la tête et ses repères : le modèle qui voit, sinon la silhouette)
  let reperes: Reperes | null = null;
  let par: "regard" | "estime" = "estime";
  if (analyseConfiguree()) {
    const vue = await sharp(corps).resize({ height: 768, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
    const r = await regarderImage({ type: "image/jpeg", donnees: vue.toString("base64") }, QUESTION_REPERES).catch(() => null);
    reperes = r && !("erreur" in r) ? reperesValides(r) : null;
    if (reperes) par = "regard";
  }
  reperes ??= estimerReperes(alphaCorps, bw, bh);
  // (la tête : ce que sa boîte contient de la figurine, fondu sur deux points en bas)
  const [tx, ty, tw, th] = reperes.tete;
  const [x0, y0] = [Math.max(0, Math.floor(tx * bw)), Math.max(0, Math.floor(ty * bh))];
  const [x1, y1] = [Math.min(bw, Math.ceil((tx + tw) * bw)), Math.min(bh, Math.ceil((ty + th) * bh))];
  const [lw, lh] = [Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
  const teteBrut = Buffer.alloc(lw * lh * 4);
  for (let y = 0; y < lh; y++) {
    const fondu = Math.min(1, (lh - y) / 2);
    for (let x = 0; x < lw; x++) {
      const o = ((y0 + y) * bw + x0 + x) * 4;
      const t = (y * lw + x) * 4;
      corpsBrut.copy(teteBrut, t, o, o + 4);
      teteBrut[t + 3] = Math.round(teteBrut[t + 3] * fondu);
    }
  }
  const tete = await sharp(teteBrut, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer();
  // (la boîte réelle de la tête, telle qu'elle est découpée)
  const reel: Reperes = { ...reperes, tete: [mille(x0 / bw), mille(y0 / bh), mille(lw / bw), mille(lh / bh)] };
  // (`boite` : où le corps a été découpé dans l'image d'origine ; `tetePx` : la tête dans le corps — en pixels, pour
  // découper exactement au même endroit une autre image de la même figurine : ses expressions, `visage-essai-serveur.ts`)
  return { corps, tete, ratio: mille(bw / bh), reperes: reel, par, boite: [bx, by, bw, bh], tetePx: [x0, y0, lw, lh] };
}

/**
 * 🎭 Les calques de la figurine de cet habitant, faits une fois puis relus (une seule lecture), à adresse stable ;
 * `fabriquer: false` : seulement s'ils existent déjà. `null` s'il n'a pas de figurine assise du nouveau style.
 */
export async function calquesDeFigurine(supabase: Supabase, h: string, o: { fabriquer?: boolean } = {}): Promise<FigurineLocale | null> {
  const chemin = await cheminFigurineAssise(supabase, h);
  if (!chemin) return null;
  const cle = empreinteDe(chemin);
  const deja = await lireJson<FigurineLocale>(supabase, `${dossier(h)}/${cle}.json`);
  if (deja.corps?.fichier && deja.tete?.fichier && Array.isArray(deja.tete.boite)) {
    // (🧍 22 novembre 2026 : des calques d'avant, sans le corps sans tête — il s'ajoute une fois, quand on peut fabriquer)
    if (deja.sansTete?.fichier || o.fabriquer === false) return deja as FigurineLocale;
    return (await ajouterSansTete(supabase, h, cle, deja as FigurineLocale).catch(() => null)) ?? (deja as FigurineLocale);
  }
  if (o.fabriquer === false) return null;
  const source = await telecharger(supabase, chemin);
  if (!source) return null;
  const c = await decouperFigurine(source).catch(() => null);
  if (!c) return null;
  const d = depotDans(supabase, dossier(h));
  const sources = { corps: `${dossier(h)}/${cle}-corps.png`, tete: `${dossier(h)}/${cle}-tete.png`, sansTete: `${dossier(h)}/${cle}-corps-sans-tete.png` };
  await Promise.all([d.ecrire(`${cle}-corps.png`, c.corps, "image/png"), d.ecrire(`${cle}-tete.png`, c.tete, "image/png"), corpsSansTete(c.corps, { tetePx: c.tetePx }).then((b) => d.ecrire(`${cle}-corps-sans-tete.png`, b, "image/png"))]);
  // (publiés une fois, à adresse stable : l'ouverture d'une conversation ou de sa maison n'a plus qu'à relire)
  const [corps, tete, sansTete] = await Promise.all([imageSalon(supabase, sources.corps, LARGEURS_CALQUES.corps), imageSalon(supabase, sources.tete, LARGEURS_CALQUES.tete), imageSalon(supabase, sources.sansTete, LARGEURS_CALQUES.corps)]);
  if (!corps || !tete) return null;
  const f: FigurineLocale = {
    ratio: c.ratio,
    corps: { fichier: corps.src },
    tete: { fichier: tete.src, boite: c.reperes.tete, pivot: c.reperes.pivot },
    ...(sansTete ? { sansTete: { fichier: sansTete.src } } : {}),
    sources,
    bouche: c.reperes.bouche,
    joues: c.reperes.joues,
    par: c.par,
  };
  await d.ecrire(`${cle}.json`, Buffer.from(JSON.stringify(f)), "application/json");
  return f;
}

/**
 * 🧍 (22 novembre 2026) Le corps sans sa tête, ajouté une fois à des calques d'avant : relu de leur corps, la tête effacée
 * là où leur boîte de tête la dit (la même règle que pour les nouveaux, `corpsSansTete`), publié à adresse stable.
 */
async function ajouterSansTete(supabase: Supabase, h: string, cle: string, f: FigurineLocale): Promise<FigurineLocale | null> {
  const src = f.sources?.corps;
  if (!src) return null;
  const corps = await telecharger(supabase, src);
  if (!corps) return null;
  const { width = 0, height = 0 } = await sharp(corps).metadata();
  if (!width || !height) return null;
  const [tx, ty, tw, th] = f.tete.boite;
  const tetePx: [number, number, number, number] = [Math.max(0, Math.floor(tx * width)), Math.max(0, Math.floor(ty * height)), Math.ceil(tw * width), Math.ceil(th * height)];
  const nom = `${cle}-corps-sans-tete.png`;
  const d = depotDans(supabase, dossier(h));
  if (!(await d.ecrire(nom, await corpsSansTete(corps, { tetePx }), "image/png"))) return null;
  const img = await imageSalon(supabase, `${dossier(h)}/${nom}`, LARGEURS_CALQUES.corps);
  if (!img) return null;
  const neuf: FigurineLocale = { ...f, sansTete: { fichier: img.src }, sources: { ...f.sources!, sansTete: `${dossier(h)}/${nom}` } };
  await d.ecrire(`${cle}.json`, Buffer.from(JSON.stringify(neuf)), "application/json");
  return neuf;
}
