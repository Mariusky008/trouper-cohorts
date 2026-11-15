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
import { STYLE_FILM_CHALEUREUX } from "./monde-consignes";
import { demanderUneImage } from "./moteur-images-serveur";
import { PIECES_DUO, emplacementsValides, pieceDuoDe, type EmplacementsDuo, type EtatPiecesDuo, type PieceDuo, type PieceDuoVue } from "./pieces-duo";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const dossier = (p: PieceDuo) => `pieces-duo/${p}`;
const VERROU = "verrou.json";
const DUREE_VERROU = 3 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** La pièce : le décor de la conversation d'un duo, sans personne, avec les mêmes emplacements que les autres. */
export function consignePieceDuo(p: PieceDuo): string {
  const x = pieceDuoDe(p);
  return [
    `Create ${x.lieu}, as the place where two small collectible figurines (about 15 cm tall) meet and talk — a vertical portrait image.`,
    "",
    `STYLE: ${STYLE_FILM_CHALEUREUX}`,
    "",
    "THE SAME SET OF OBJECTS IS IN EVERY ROOM — each one clearly visible, not hidden, not cut by the edge of the image, easy to recognize on a phone screen:",
    `1. ${x.tele}: its screen switched off (plain dark glass), facing the viewer as much as possible, about one fifth of the image width.`,
    "2. A record player (a turntable) with a few vinyl records beside it.",
    "3. Two or three EMPTY picture frames on a wall: blank light paper inside, no picture, facing the viewer.",
    "4. A wall shelf with a few small objects and some visible empty space on it.",
    `5. ${x.vue}.`,
    `6. In the lower middle, in sharp focus: ${x.places}. Leave the seats empty — two small figurines will sit there later.`,
    `7. ${x.chat}, empty.`,
    "",
    "COMPOSITION: the camera is at the figurines' eye level, looking into the place; the main light comes from the left; warm, inviting, lived-in.",
    "",
    "NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic.",
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
    ' "etagere": the box of the wall shelf,',
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
      return {
        cle: p.cle,
        nom: p.nom,
        pour: p.pour,
        emoji: p.emoji,
        ...(noms.includes("decor.png") ? { decor: await signer(supabase, `${dossier(p.cle)}/decor.png`) } : {}),
        ...(releve && releve.emplacements ? { emplacements: emplacementsValides(releve.emplacements) } : {}),
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
export async function fabriquerPieceDuo(supabase: Supabase, p: PieceDuo, avant: number): Promise<{ fait?: "piece" | "releve"; erreur?: string }> {
  const d = depotDans(supabase, dossier(p));
  const noms = await d.lister().catch(() => [] as string[]);
  if (noms.includes("decor.png") && noms.includes("releve.json")) return {};
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

/** Refaire une pièce (`releve` : son relevé seul ; sinon la pièce et son relevé). */
export async function refairePieceDuo(supabase: Supabase, p: PieceDuo, quoi: "piece" | "releve" = "piece"): Promise<void> {
  const d = depotDans(supabase, dossier(p));
  for (const n of quoi === "releve" ? ["releve.json"] : ["decor.png", "releve.json"]) await d.effacer(n).catch(() => undefined);
}
