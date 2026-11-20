/**
 * 🎭 LES GRADINS DES SALONS OUVERTS — LE SERVEUR (`salons-gradins.ts`, `docs/univers/decouvrir.md`, section 27).
 *
 * Fabriqués une fois pour tous, rangés à part : `salons-gradins/<lieu>/decor.png` (le décor, carré, sans personne),
 * `releve.json` ({ le, places, source, erreur? } : ses huit emplacements), `valide.json` ({ le } : le propriétaire l'a
 * validé — seul un gradin validé va dans les salons). Un passage fait une chose : le décor, puis son relevé.
 *
 * Le décor est dessiné d'après **le plan des huit emplacements** (IMAGE 1 : des tapis gris sur deux marches, et la
 * silhouette d'une figurine assise sur chacun, pour l'échelle) ; le relevé, par un modèle qui voit — sans lui, ou s'il ne
 * trouve pas exactement huit emplacements, on garde le plan (le décor a été dessiné dessus).
 *
 * Réservé à l'administrateur (la page des salons ouverts), sauf `gradinDuSalon` (les salons).
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { analyseConfiguree, regarderImage } from "./dressing-serveur";
import { depotDans, signer } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { prendre, rendre, STYLE_PIECES_DUO } from "./pieces-duo-serveur";
import { imageSalon } from "./salon-fichiers-serveur";
import type { IdTheme } from "./decouvrir";
import {
  COTE_GRADIN,
  GRADINS,
  LARGEURS_GRADIN,
  PLAN_GRADIN,
  gradinDe,
  gradinDuTheme,
  placesGradinValides,
  type EtatGradins,
  type GradinScene,
  type GradinVue,
  type IdGradin,
  type PlaceGradin,
  type SourcePlaces,
} from "./salons-gradins";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const dossier = (g: IdGradin) => `salons-gradins/${g}`;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};
const SANS = "NO figurine, no person, no character, no animal on the spots, no chair or seat on the spots, no text, no logo, no brand, nothing alcoholic.";

/**
 * 📐 Le plan (IMAGE 1), carré : le sol, la marche du fond, les huit tapis (des ellipses grises, à plat), et sur chacun la
 * silhouette d'une figurine assise dans son fauteuil, à sa taille — pour que le moteur garde les places et l'échelle.
 */
export async function planDuGradin(): Promise<Buffer> {
  const C = COTE_GRADIN;
  const marche = Math.round(C * 0.5);
  const formes = PLAN_GRADIN.map((p) => {
    const h = p.hauteur * C;
    const l = h * 0.72;
    const x = p.x * C;
    const y = p.y * C;
    return [
      `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(l * 0.62).toFixed(0)}" ry="${(l * 0.17).toFixed(0)}" fill="#8f8f8f"/>`,
      `<rect x="${(x - l / 2).toFixed(0)}" y="${(y - h).toFixed(0)}" width="${l.toFixed(0)}" height="${h.toFixed(0)}" rx="${(l * 0.22).toFixed(0)}" fill="none" stroke="#5c5c5c" stroke-width="5" stroke-dasharray="14 10"/>`,
    ].join("");
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="${C}"><rect width="${C}" height="${C}" fill="#d8d8d8"/><rect y="${marche}" width="${C}" height="${Math.round(C * 0.14)}" fill="#c4c4c4"/><rect y="${Math.round(C * 0.64)}" width="${C}" height="${C - Math.round(C * 0.64)}" fill="#cdcdcd"/>${formes.join("")}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** La consigne du décor : le lieu, d'après le plan, huit tapis vides sur deux marches, l'arrière-plan doux. */
export function consigneGradin(g: IdGradin): string {
  const x = gradinDe(g);
  return [
    "IMAGE 1 is ONLY A SEATING PLAN, drawn in grey: it shows where 8 spots go and how big they are — keep its layout, never its grey look.",
    `Create ${x.lieu} — a square image, the place where 8 small collectible figurines (about 15 cm tall) will gather to watch videos together, facing the viewer.`,
    "",
    `STYLE: ${STYLE_PIECES_DUO}`,
    "",
    "THE 8 SPOTS (the stars of the image), exactly where IMAGE 1 puts them, and exactly 8:",
    `- each spot is ${x.tapis}, flat on the ground, completely EMPTY — each figurine will come later, seated in its own little armchair (the dashed outline in IMAGE 1 shows its size);`,
    "- the FRONT ROW: 4 spots side by side on the floor along the bottom of the image;",
    "- the BACK ROW: 4 spots on a raised step (a wide stair, a platform or a terrace, in the style of the place) behind the front row, a little higher in the image;",
    "- every spot is clearly visible, facing the viewer, with some space around it; nothing stands on a spot, nothing hides a spot.",
    "",
    "DEPTH: the two rows and their spots are in sharp focus; the background behind them is softly out of focus and a little darker, so the figurines will stand out.",
    "COMPOSITION: seen from the front, a little above the figurines' eye level; the place's identity is in the background and on the sides; no big object in front of the rows.",
    "",
    SANS,
  ].join("\n");
}

/** La question du relevé : les huit emplacements. */
export function questionPlacesGradin(): string {
  return [
    "This square image is a place where 8 small figurines, each seated in its own little armchair, will be placed on 8 marked empty spots (small round rugs or mats): 4 in a front row at the bottom, 4 in a back row on a raised step.",
    'Answer in JSON only: {"places": [{"x", "y", "hauteur"}, … one for each of the 8 spots]} — x and y are the centre of the spot on the ground (where the armchair stands), as fractions of the image (0 = left/top, 1 = right/bottom); "hauteur" is how tall a seated figurine with its armchair should look on that spot, as a fraction of the image height.',
  ].join("\n");
}

type Releve = { le: string; places: PlaceGradin[]; source: SourcePlaces; erreur?: string };
const lireReleve = async (d: ReturnType<typeof depotDans>, noms: string[]): Promise<Releve | null> => {
  if (!noms.includes("releve.json")) return null;
  const r = json(await d.lire("releve.json").catch(() => null));
  const places = placesGradinValides(r.places);
  if (!places) return null;
  const source: SourcePlaces = r.source === "regard" || r.source === "main" ? r.source : "plan";
  return { le: s(r.le), places, source, ...(s(r.erreur) ? { erreur: s(r.erreur) } : {}) };
};

/** L'état des onze gradins (la page de l'administrateur). */
export async function etatGradins(supabase: Supabase): Promise<EtatGradins> {
  const gradins: GradinVue[] = await Promise.all(
    GRADINS.map(async (g) => {
      const d = depotDans(supabase, dossier(g.id));
      const noms = await d.lister().catch(() => [] as string[]);
      const releve = await lireReleve(d, noms);
      const valide = noms.includes("valide.json") ? json(await d.lire("valide.json").catch(() => null)) : null;
      return {
        id: g.id,
        nom: g.nom,
        e: g.e,
        themes: [...g.themes],
        valide: Boolean(valide && noms.includes("decor.png") && releve),
        ...(noms.includes("decor.png") ? { image: await signer(supabase, `${dossier(g.id)}/decor.png`) } : {}),
        ...(releve ? { places: releve.places, source: releve.source } : {}),
        ...(releve?.erreur ? { releveRate: releve.erreur } : {}),
        ...(valide && s(valide.le) ? { le: s(valide.le) } : {}),
      };
    }),
  );
  return { gradins, moteurs: { image: Boolean(cle()), regard: analyseConfiguree() } };
}

/**
 * 🛠️ Un passage : le décor s'il n'est pas fait (d'après le plan), sinon son relevé (sans modèle qui voit, ou sans huit
 * emplacements trouvés : le plan, et pourquoi). `fait` : ce qui vient d'être fait.
 */
export async function fabriquerGradin(supabase: Supabase, g: IdGradin, avant: number): Promise<{ fait?: "decor" | "releve"; erreur?: string }> {
  const d = depotDans(supabase, dossier(g));
  const noms = await d.lister().catch(() => [] as string[]);
  if (noms.includes("decor.png") && noms.includes("releve.json")) return {};
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train sur ce gradin : patiente une minute." };
  try {
    if (!noms.includes("decor.png")) {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      const r = await demanderUneImage({ images: [await planDuGradin()], consigne: consigneGradin(g), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1024" });
      if ("erreur" in r) return { erreur: r.erreur };
      await d.ecrire("decor.png", await sharp(r.png).resize(COTE_GRADIN, COTE_GRADIN, { fit: "cover" }).png().toBuffer(), "image/png");
      await d.effacer("valide.json").catch(() => undefined);
      return { fait: "decor" };
    }
    const png = await d.lire("decor.png");
    if (!png) return { erreur: "Le décor n’a pas pu être relu." };
    const le = new Date().toISOString();
    let releve: Releve = { le, places: [...PLAN_GRADIN], source: "plan", erreur: "Pas de modèle qui voit ici : le plan est gardé." };
    if (analyseConfiguree()) {
      const petite = await sharp(png).resize({ width: 768 }).jpeg({ quality: 85 }).toBuffer();
      const vu = await regarderImage({ type: "image/jpeg", donnees: petite.toString("base64") }, questionPlacesGradin());
      const places = "erreur" in vu ? null : placesGradinValides(vu.places);
      releve = places ? { le, places, source: "regard" } : { le, places: [...PLAN_GRADIN], source: "plan", erreur: "erreur" in vu && typeof vu.erreur === "string" ? vu.erreur : "Il n’a pas trouvé exactement huit emplacements : le plan est gardé." };
    }
    await d.ecrire("releve.json", Buffer.from(JSON.stringify(releve)), "application/json");
    return { fait: "releve" };
  } finally {
    await rendre(d, qui);
  }
}

/** ↺ Refaire : le décor (et donc son relevé), ou son relevé seul. Dans les deux cas, il quitte les salons (à revalider). */
export async function refaireGradin(supabase: Supabase, g: IdGradin, quoi: "decor" | "releve"): Promise<void> {
  const d = depotDans(supabase, dossier(g));
  for (const n of quoi === "decor" ? ["decor.png", "releve.json", "valide.json"] : ["releve.json", "valide.json"]) await d.effacer(n).catch(() => undefined);
}

/** 📐 Prendre le plan : ses huit places sont celles du plan (le décor a été dessiné dessus). Il quitte les salons. */
export async function planPourGradin(supabase: Supabase, g: IdGradin): Promise<{ erreur?: string }> {
  const d = depotDans(supabase, dossier(g));
  if (!(await d.lister().catch(() => [] as string[])).includes("decor.png")) return { erreur: "Le décor n’est pas encore fait." };
  await d.ecrire("releve.json", Buffer.from(JSON.stringify({ le: new Date().toISOString(), places: PLAN_GRADIN, source: "plan" })), "application/json");
  await d.effacer("valide.json").catch(() => undefined);
  return {};
}

/** ✓ Valider (il va dans les salons de ses passions) ou le retirer. Il faut son décor et son relevé. */
export async function validerGradin(supabase: Supabase, g: IdGradin, oui: boolean): Promise<{ erreur?: string }> {
  const d = depotDans(supabase, dossier(g));
  if (!oui) {
    await d.effacer("valide.json").catch(() => undefined);
    return {};
  }
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("decor.png") || !(await lireReleve(d, noms))) return { erreur: "Il faut d’abord son décor et ses huit emplacements." };
  await d.ecrire("valide.json", Buffer.from(JSON.stringify({ le: new Date().toISOString() })), "application/json");
  return {};
}

/** 🎭 Le gradin d'une passion, s'il est validé : son image (à adresse stable) et ses huit places. Sinon `null`. */
export async function gradinDuSalon(supabase: Supabase, theme: IdTheme): Promise<GradinScene | null> {
  const g = gradinDuTheme(theme);
  const d = depotDans(supabase, dossier(g));
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("valide.json") || !noms.includes("decor.png")) return null;
  const releve = await lireReleve(d, noms);
  if (!releve) return null;
  const image = await imageSalon(supabase, `${dossier(g)}/decor.png`, LARGEURS_GRADIN).catch(() => null);
  return image ? { id: g, nom: gradinDe(g).nom, image, places: releve.places } : null;
}
