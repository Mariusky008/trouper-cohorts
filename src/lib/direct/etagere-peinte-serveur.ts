/**
 * 🪵 L'ÉTAGÈRE PEINTE DANS L'UNIVERS (15 novembre 2026, le propriétaire, sur l'étagère du duo posée par-dessus la scène :
 * « pas du tout intégrée à l'univers » ; « je voulais quelque chose de plus intégré et plus visuellement beau » — son
 * choix : « peinte dans l'univers »).
 *
 * Son décor du moment (celui que joue la conversation, `decorDuMoment`) est retouché UNE FOIS par le moteur d'image :
 * une étagère en bois, vide, peinte dans le même style et la même lumière, dans une zone fixe du mur, au-dessus des
 * fauteuils (`ZONE_ETAGERE`, un masque : le reste du décor est gardé). Puis un modèle qui voit relève où est le dessus
 * de la planche (`surface` : ses deux bouts et sa hauteur, en fractions de l'image) ; sans réponse qui tienne, la
 * surface se déduit de la zone. Les souvenirs du duo s'y posent, dans le téléphone (`MurEtagere`, `surface`).
 *
 * LE SEAU, à côté du décor : `<décor>-etagere.png` (l'image) et `<décor>-etagere.json` = { surface, le, chemin } ;
 * `<habitant>/monde/etagere-peinte-verrou.json` = { le } (un seul pinceau à la fois, cinq minutes). Un décor de saison
 * neuf : une étagère peinte de plus, au premier passage.
 *
 * LE COÛT : une image « high » du moteur d'image par décor (environ 0,20 $), une fois.
 *
 * 🛑 COUPÉE PAR DÉFAUT (15 novembre 2026, le propriétaire, sur l'avis de la session de l'univers) : elle retouche le décor
 * de chacun, ce que la décision de la pièce du duo a gelé (`docs/univers/piece-du-duo.md`, section 3) ; elle coûterait à
 * chaque décor de saison ; et les conversations iront dans la pièce du duo, qui a son étagère dessinée une fois pour tous.
 * Plus aucune n'est peinte ; celles déjà faites restent montrées (elles sont payées). L'étagère reste à portée dans chaque
 * conversation (la pastille 📚). `CLIKME_ETAGERE_PEINTE=1` : en peindre de nouveau ; `=0` : ne plus montrer non plus
 * celles qui sont faites (la conversation garde son décor tel quel).
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { regarderImage } from "./dressing-serveur";
import { lireFicheMonde } from "./fiches-serveur";
import { deposer, ecrireJson, lireJson, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { decorDuMoment } from "./saison-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

/** Le dessus de la planche, là où les souvenirs se posent (fractions de l'image : ses deux bouts, sa hauteur). */
export type SurfaceEtagere = { x1: number; x2: number; y: number };

/**
 * La zone où l'étagère se peint : au milieu, au-dessus des têtes des figurines (qui commencent vers 41 % de la hauteur)
 * et sous ce que le téléphone coupe en haut de la scène (environ 21 %).
 */
export const ZONE_ETAGERE = { x1: 0.2, x2: 0.8, y1: 0.24, y2: 0.36 } as const;

/** 🛑 En peindre de nouvelles : seulement si on la rallume (`CLIKME_ETAGERE_PEINTE=1`), et le moteur branché. */
export const etagerePeinteOuverte = () => s(process.env.CLIKME_ETAGERE_PEINTE) === "1" && Boolean(cle());

const sansExtension = (chemin: string) => chemin.replace(/\.(png|webp|jpe?g)$/i, "");
export const cheminEtagerePeinte = (decor: string) => `${sansExtension(decor)}-etagere.png`;
const cheminFicheEtagere = (decor: string) => `${sansExtension(decor)}-etagere.json`;
const cheminVerrou = (h: string) => `${h}/monde/etagere-peinte-verrou.json`;

/** La surface déduite de la zone (le dessus d'une planche peinte au bas de la zone, un peu en retrait de ses bords). */
export const SURFACE_PAR_DEFAUT: SurfaceEtagere = { x1: ZONE_ETAGERE.x1 + 0.06, x2: ZONE_ETAGERE.x2 - 0.06, y: ZONE_ETAGERE.y1 + (ZONE_ETAGERE.y2 - ZONE_ETAGERE.y1) * 0.62 };

const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
/** Une surface qui tient debout : dans la zone (à un peu près), assez large. */
export function surfaceValide(x: unknown): SurfaceEtagere | null {
  const o = (x ?? {}) as Record<string, unknown>;
  const x1 = fraction(o.x1);
  const x2 = fraction(o.x2);
  const y = fraction(o.y);
  if (x1 === null || x2 === null || y === null) return null;
  if (x2 - x1 < 0.2 || x1 < ZONE_ETAGERE.x1 - 0.08 || x2 > ZONE_ETAGERE.x2 + 0.08) return null;
  if (y < ZONE_ETAGERE.y1 || y > ZONE_ETAGERE.y2 + 0.02) return null;
  return { x1, x2, y };
}

/** 🪵 L'étagère peinte de ce décor, si elle est faite : son image et sa surface (montrée, sauf `CLIKME_ETAGERE_PEINTE=0`). */
export async function etagerePeinteDe(supabase: Supabase, decor: string): Promise<{ chemin: string; surface: SurfaceEtagere } | null> {
  if (!decor || s(process.env.CLIKME_ETAGERE_PEINTE) === "0") return null;
  const f = await lireJson<{ chemin?: string; surface?: unknown }>(supabase, cheminFicheEtagere(decor));
  const surface = surfaceValide(f.surface);
  return surface && s(f.chemin) ? { chemin: s(f.chemin), surface } : null;
}

export const CONSIGNE_ETAGERE =
  "Edit this illustration. In the transparent (masked) area only, add ONE empty wooden shelf: a simple floating wall shelf (or the top of a low cabinet against the back wall) spanning most of the masked width, seen straight on and perfectly horizontal, with a clear flat top surface where small objects could stand. " +
  "Paint it in exactly the same art style, materials, colors, lighting direction and perspective as the rest of the scene, with its soft shadow on the wall, so it looks as if it had always been there. " +
  "The shelf must be completely EMPTY: nothing on it, nothing hanging from it. Keep everything outside the masked area exactly as it is. No people, no animals, no text, no letters, no logos.";

export const QUESTION_SURFACE =
  'This crop shows a wooden shelf. Reply with JSON only: {"gauche": number, "droite": number, "dessus": number} — the left end and the right end of the shelf\'s flat top surface, and the vertical position of that top surface (where objects would stand), each as a fraction (0 to 1) of this crop\'s width or height.';

/**
 * 🖌️ PEINDRE SON ÉTAGÈRE (après la réponse ; une fois par décor, un pinceau à la fois). Rend vrai si elle est faite
 * (ou l'était déjà).
 */
export async function peindreEtagere(supabase: Supabase, h: string, avant: number): Promise<boolean> {
  if (!etagerePeinteOuverte()) return false;
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return false;
  const decor = (await decorDuMoment(supabase, h, f)).chemin || f.references.decor.chemin;
  if (await etagerePeinteDe(supabase, decor)) return true;
  const verrou = await lireJson<{ le?: number }>(supabase, cheminVerrou(h));
  if (Date.now() - (Number(verrou.le) || 0) < 5 * 60_000) return false;
  await ecrireJson(supabase, cheminVerrou(h), { le: Date.now() });
  const image = await telecharger(supabase, decor);
  if (!image) return false;
  const meta = await sharp(image).metadata().catch(() => null);
  const l = meta?.width ?? 0;
  const ht = meta?.height ?? 0;
  if (!l || !ht) return false;
  // (le masque : opaque partout, transparent dans la zone — là seulement, le moteur peint)
  const brut = Buffer.alloc(l * ht * 4, 255);
  const [zx1, zx2, zy1, zy2] = [Math.round(ZONE_ETAGERE.x1 * l), Math.round(ZONE_ETAGERE.x2 * l), Math.round(ZONE_ETAGERE.y1 * ht), Math.round(ZONE_ETAGERE.y2 * ht)];
  for (let y = zy1; y < zy2; y++) for (let x = zx1; x < zx2; x++) brut[(y * l + x) * 4 + 3] = 0;
  const masque = await sharp(brut, { raw: { width: l, height: ht, channels: 4 } }).png().toBuffer();
  const r = await demanderUneImage({ images: [image], masque, consigne: CONSIGNE_ETAGERE, transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
  if ("erreur" in r) return false;
  const chemin = cheminEtagerePeinte(decor);
  if (!(await deposer(supabase, chemin, r.png, "image/png"))) return false;
  // (où est le dessus de la planche ? un modèle qui voit regarde la zone, un peu élargie)
  const surface = (await releverSurface(r.png).catch(() => null)) ?? SURFACE_PAR_DEFAUT;
  await ecrireJson(supabase, cheminFicheEtagere(decor), { chemin, surface, le: new Date().toISOString() });
  return true;
}

async function releverSurface(png: Buffer): Promise<SurfaceEtagere | null> {
  const meta = await sharp(png).metadata();
  const l = meta.width ?? 0;
  const ht = meta.height ?? 0;
  if (!l || !ht) return null;
  // (la zone, élargie d'un peu de mur autour)
  const cx1 = Math.max(0, ZONE_ETAGERE.x1 - 0.04);
  const cx2 = Math.min(1, ZONE_ETAGERE.x2 + 0.04);
  const cy1 = Math.max(0, ZONE_ETAGERE.y1 - 0.04);
  const cy2 = Math.min(1, ZONE_ETAGERE.y2 + 0.04);
  const zone = { left: Math.round(cx1 * l), top: Math.round(cy1 * ht), width: Math.round((cx2 - cx1) * l), height: Math.round((cy2 - cy1) * ht) };
  const jpeg = await sharp(png).extract(zone).resize({ width: 768, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  const vu = await Promise.race([
    regarderImage({ type: "image/jpeg", donnees: jpeg.toString("base64") }, QUESTION_SURFACE),
    new Promise<{ erreur: string }>((ok) => setTimeout(() => ok({ erreur: "trop long" }), 30_000)),
  ]);
  if ("erreur" in vu) return null;
  const g = fraction(Number(vu.gauche));
  const d = fraction(Number(vu.droite));
  const y = fraction(Number(vu.dessus));
  if (g === null || d === null || y === null || d <= g) return null;
  return surfaceValide({ x1: cx1 + g * (cx2 - cx1), x2: cx1 + d * (cx2 - cx1), y: cy1 + y * (cy2 - cy1) });
}
