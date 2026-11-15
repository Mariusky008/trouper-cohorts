/**
 * 🛋️ LA PIÈCE DU DUO — L'ESSAI DES CINQ PIÈCES (`pieces-duo.ts`, `docs/univers/piece-du-duo.md`). Le catalogue est le
 * même pour tous, fabriqué une fois, rangé à part de chaque habitant : `pieces-duo/<pièce>/decor.png` (la pièce, sans
 * personne), puis `releve.json` (ses emplacements, relevés par un modèle qui voit). Un passage fait une chose : la
 * pièce, puis son relevé.
 *
 * Le style : celui des univers (« Film, chaleureux », `STYLE_FILM_CHALEUREUX`). Toutes les pièces ont LES MÊMES
 * EMPLACEMENTS (la télé, la platine, les cadres vides, l'étagère, la fenêtre, deux places, le coin du chat) : c'est ce qui
 * permet de tout faire une fois et de le retrouver dans chaque pièce.
 *
 * Réservé à l'administrateur (la page d'essais).
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { analyseConfiguree, regarderImage } from "./dressing-serveur";
import { depotDans, signer } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import {
  MOMENTS_DUO,
  PIECES_DUO,
  alertesEmplacements,
  emplacementsValides,
  lumieresAFaire,
  pieceDuoDe,
  type EmplacementsDuo,
  type EtatPiecesDuo,
  type MomentDuo,
  type PieceDuo,
  type PieceDuoVue,
} from "./pieces-duo";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const dossier = (p: PieceDuo) => `pieces-duo/${p}`;
/** (une autre lumière de la pièce, à côté de son image première) */
const nomLumiere = (m: MomentDuo) => `lumiere-${m}.png`;
const VERROU = "verrou.json";
const DUREE_VERROU = 3 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * Le style des univers, SANS sa lumière dorée imposée (`STYLE_FILM_CHALEUREUX` dit « golden practical lights » : les
 * cinq premières pièces étaient toutes au même coucher de soleil doré) — la lumière et les couleurs sont celles de chaque
 * pièce.
 */
export const STYLE_PIECES_DUO =
  "a set from a high-end 3D animated feature film: a lived-in, cosy place full of charm, a cinematic composition with depth and layers, detailed materials and textures — no magic, just charm.";
const momentDe = (m: MomentDuo) => MOMENTS_DUO.find((x) => x.cle === m)!;

/** La pièce : le décor de la conversation d'un duo, sans personne, avec les mêmes emplacements que les autres. */
export function consignePieceDuo(p: PieceDuo): string {
  const x = pieceDuoDe(p);
  return [
    `Create ${x.lieu}, as the place where two small collectible figurines (about 15 cm tall) meet and talk — a vertical portrait image.`,
    "",
    `STYLE: ${STYLE_PIECES_DUO}`,
    "",
    `THIS ROOM'S OWN IDENTITY (it must not look like a generic golden room): ${x.signature}.`,
    `THE LIGHT: ${momentDe(x.moment).lumiere}.`,
    "",
    "THE SAME OBJECTS ARE IN EVERY ROOM. Spread them around the room, each one on its own, with bare wall or space around it: no object overlaps, touches or hides another one. Each one is clearly visible, facing the viewer, not cut by the edge of the image, big enough to be tapped on a phone:",
    `1. ${x.tele}: its screen switched off (plain dark glass), about one quarter of the image width, on one side of the room.`,
    "2. A record player (a turntable) on a low cabinet or a side table, on the OTHER side of the room from the TV, with a few vinyl records beside it, about one fifth of the image width.",
    "3. Two EMPTY picture frames hung on the wall above or behind the seats: a plain light mat inside, no picture, no drawing, each about one eighth of the image width.",
    "4. One wall shelf, completely EMPTY (nothing at all on it), about one third of the image width, near the window — the duo's keepsakes will be placed on it later.",
    `5. ${x.vue}.`,
    `6. In the lower half of the image, in sharp focus: ${x.places}. The two seats are close to each other (about one third of the image width apart), each about one quarter of the image width, so that two figurines sitting there face each other and can be framed together. Leave the seats empty — two small figurines will sit there later.`,
    `7. ${x.chat}, empty.`,
    "",
    "COMPOSITION: the camera is at the figurines' eye level, looking into the room; the main light comes from the left.",
    "",
    "NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic.",
  ].join("\n");
}

/** 🌤️ Une autre lumière : la même pièce (l'image première), à un autre moment de la journée. */
export function consigneLumiereDuo(p: PieceDuo, m: MomentDuo): string {
  return [
    "IMAGE 1 is a room where two small collectible figurines will meet and talk. Make EXACTLY THE SAME ROOM: the same camera, the same composition, every object at exactly the same place and size, the same style, colours and materials, the same weather.",
    `Change ONLY the time of day and its light: ${momentDe(m).lumiere}. The window shows the same view at that time of day; the lamps are on or off accordingly.`,
    "Keep the TV screen switched off (plain dark glass), the picture frames empty, the shelf empty, the seats and the cat's place empty.",
    "NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic.",
    `(The room: ${pieceDuoDe(p).lieu}.)`,
  ].join("\n");
}

/** Le relevé : où sont les emplacements sur la pièce (des fractions de l'image). */
export function questionEmplacements(): string {
  return [
    "This image is a room where two small figurines will sit and talk. Find these places on the image.",
    "Answer in JSON only, with coordinates as fractions of the image (0 = left/top, 1 = right/bottom); a box is [x, y, width, height]:",
    '{"tele": the box of the TV SCREEN only,',
    ' "platine": the box of the record player,',
    ' "cadres": [the box of the blank inside of each empty picture frame],',
    ' "etagere": the box of the empty wall shelf,',
    ' "fenetre": the box of the window or open view,',
    ' "places": [{"x", "y", "hauteur"}, {"x", "y", "hauteur"}] — the two seats: x and y are the point on each seat where a small seated figurine touches it; "hauteur" is how tall that seated figurine should look there, as a fraction of the image height,',
    ' "chat": {"x", "y"} — the point on the cushion or basket where a cat would lie}',
    "Leave out anything that is not visible.",
  ].join("\n");
}

/** L'état des cinq pièces : leur image (signée), leurs emplacements. */
export async function etatPiecesDuo(supabase: Supabase): Promise<EtatPiecesDuo> {
  const pieces: PieceDuoVue[] = await Promise.all(
    PIECES_DUO.map(async (p) => {
      const d = depotDans(supabase, dossier(p.cle));
      const noms = await d.lister().catch(() => [] as string[]);
      const releve = noms.includes("releve.json") ? json(await d.lire("releve.json").catch(() => null)) : null;
      const emplacements = releve && releve.emplacements ? emplacementsValides(releve.emplacements) : null;
      const lumieres: Partial<Record<MomentDuo, string>> = {};
      for (const m of lumieresAFaire(p.cle)) if (noms.includes(nomLumiere(m))) lumieres[m] = await signer(supabase, `${dossier(p.cle)}/${nomLumiere(m)}`);
      return {
        cle: p.cle,
        nom: p.nom,
        pour: p.pour,
        emoji: p.emoji,
        moment: p.moment,
        lumieres,
        alertes: emplacements ? alertesEmplacements(emplacements) : [],
        ...(noms.includes("decor.png") ? { decor: await signer(supabase, `${dossier(p.cle)}/decor.png`) } : {}),
        ...(emplacements ? { emplacements } : {}),
        ...(releve && releve.ajuste === true ? { ajuste: true } : {}),
        ...(releve && s(releve.erreur) ? { releveRate: s(releve.erreur) } : {}),
      };
    }),
  );
  return { pieces, moteurs: { image: Boolean(cle()), regard: analyseConfiguree() } };
}

/** Le verrou d'une pièce : de deux passages arrivés ensemble, seul le dernier qui a écrit continue. */
async function prendre(d: ReturnType<typeof depotDans>): Promise<string | null> {
  if ((await d.lister().catch(() => [] as string[])).includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU) return null;
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 300));
  return json(await d.lire(VERROU).catch(() => null)).qui === qui ? qui : null;
}
async function rendre(d: ReturnType<typeof depotDans>, qui: string) {
  if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
}

/**
 * 🛠️ Un passage : la pièce si elle n'est pas faite, sinon son relevé. `fait` : ce qui vient d'être fait. Sans modèle qui
 * voit, le relevé est noté comme raté (la pièce reste, on la juge à l'œil).
 */
export async function fabriquerPieceDuo(supabase: Supabase, p: PieceDuo, avant: number): Promise<{ fait?: "piece" | "releve" | "lumiere"; moment?: MomentDuo; erreur?: string }> {
  const d = depotDans(supabase, dossier(p));
  const noms = await d.lister().catch(() => [] as string[]);
  // (les pièces refaites : après le relevé, ses deux autres lumières, une par passage)
  const lumiere = lumieresAFaire(p).find((m) => !noms.includes(nomLumiere(m)));
  if (noms.includes("decor.png") && noms.includes("releve.json") && !lumiere) return {};
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train sur cette pièce : patiente une minute." };
  try {
    if (!noms.includes("decor.png")) {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      const r = await demanderUneImage({ images: [], consigne: consignePieceDuo(p), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      await d.ecrire("decor.png", await sharp(r.png).png().toBuffer(), "image/png");
      return { fait: "piece" };
    }
    const png = await d.lire("decor.png");
    if (!png) return { erreur: "La pièce n’a pas pu être relue." };
    if (noms.includes("releve.json") && lumiere) {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      const r = await demanderUneImage({ images: [png], consigne: consigneLumiereDuo(p, lumiere), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      await d.ecrire(nomLumiere(lumiere), await sharp(r.png).png().toBuffer(), "image/png");
      return { fait: "lumiere", moment: lumiere };
    }
    const petite = await sharp(png).resize({ width: 768 }).jpeg({ quality: 85 }).toBuffer();
    const vu = await regarderImage({ type: "image/jpeg", donnees: petite.toString("base64") }, questionEmplacements());
    const releve: { le: string; emplacements?: EmplacementsDuo; erreur?: string } =
      "erreur" in vu && typeof vu.erreur === "string" ? { le: new Date().toISOString(), erreur: vu.erreur } : { le: new Date().toISOString(), emplacements: emplacementsValides(vu) };
    await d.ecrire("releve.json", Buffer.from(JSON.stringify(releve)), "application/json");
    return releve.erreur ? { erreur: `Le relevé n’a pas marché : ${releve.erreur}` } : { fait: "releve" };
  } finally {
    await rendre(d, qui);
  }
}

/** Refaire une pièce (`releve` : son relevé seul ; `lumieres` : ses deux autres lumières ; sinon tout). */
export async function refairePieceDuo(supabase: Supabase, p: PieceDuo, quoi: "piece" | "releve" | "lumieres" = "piece"): Promise<void> {
  const d = depotDans(supabase, dossier(p));
  const lumieres = lumieresAFaire(p).map(nomLumiere);
  for (const n of quoi === "releve" ? ["releve.json"] : quoi === "lumieres" ? lumieres : ["decor.png", "releve.json", ...lumieres]) await d.effacer(n).catch(() => undefined);
}

/**
 * ✋ LES ZONES POSÉES À LA MAIN (sur la page d'essais) : pour cinq images faites une fois, plus sûr que le modèle qui
 * voit. Elles remplacent le relevé (`ajuste: true`) ; ce qui ne tient pas debout est écarté.
 */
export async function ajusterPieceDuo(supabase: Supabase, p: PieceDuo, x: unknown): Promise<{ erreur?: string }> {
  const d = depotDans(supabase, dossier(p));
  if (!(await d.lister().catch(() => [] as string[])).includes("decor.png")) return { erreur: "La pièce n’est pas encore faite." };
  const emplacements = emplacementsValides(x);
  if (!emplacements.tele && !emplacements.platine && !emplacements.cadres.length && !emplacements.etagere && !emplacements.places.length) return { erreur: "Aucune zone ne tient debout." };
  await d.ecrire("releve.json", Buffer.from(JSON.stringify({ le: new Date().toISOString(), emplacements, ajuste: true })), "application/json");
  return {};
}
