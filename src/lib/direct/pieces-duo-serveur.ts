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
 * 🏠 LE LOT M0 (`docs/univers/ma-maison.md`, 2) : neuf pièces, chacune EN HAUTEUR (le salon du duo, aux proportions et
 * avec les éléments de la maquette, `consignePieceDuo`) et EN LARGEUR (la maison de chacun : un panorama, rangé dans
 * `pieces-duo/<pièce>/large/`, `fabriquerLargeur`) ; la neuvième, la chambre musicale, d'après l'image que le propriétaire
 * dépose sur la page (`deposerSource`, `source.png`).
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
import { HAUT, LARGE, UN_SEUL, assembler, toileDeCote } from "./pieces-serveur";
import {
  MOMENTS_DUO,
  PARTIES_LARGE,
  PIECES_DUO,
  VERSION_PIECES_DUO,
  ZONE_MIN_LARGE,
  alertesEmplacements,
  depuisImage,
  emplacementsValides,
  etapesLarge,
  fichierLarge,
  lumieresAFaire,
  pieceDuoDe,
  type EmplacementsDuo,
  type EtatPiecesDuo,
  type LargeVue,
  type MomentDuo,
  type PartieLarge,
  type PieceDuo,
  type PieceDuoVue,
} from "./pieces-duo";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const dossier = (p: PieceDuo) => `pieces-duo/${p}`;
const dossierLarge = (p: PieceDuo) => `pieces-duo/${p}/large`;
/** (une autre lumière de la pièce, à côté de son image première) */
const nomLumiere = (m: MomentDuo) => `lumiere-${m}.png`;
/** (la version de la consigne qui a fait la pièce en hauteur, `VERSION_PIECES_DUO`) */
const FABRIQUE = "fabrique.json";
/** (la chambre musicale : l'image déposée par le propriétaire) */
const SOURCE = "source.png";
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
const SANS = "NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic.";

/** (ce qu'une pièce dit d'elle ; un lieu sans mur de salon — la rue — dit où vont la platine, les cadres et l'étagère) */
function objetsDe(p: PieceDuo) {
  const x = pieceDuoDe(p);
  const o = x as { platine?: string; cadres?: string; etagere?: string };
  return {
    x,
    platine: o.platine ?? "A record player (a turntable) on a low cabinet or a side table, beside the TV, with a few vinyl records beside it",
    cadres: o.cadres ?? "Three EMPTY picture frames hung on the wall (two big ones and a smaller one): a plain light mat inside, no picture, no drawing",
    etagere: o.etagere ?? "One wall shelf, completely EMPTY (nothing at all on it)",
  };
}

/**
 * La pièce EN HAUTEUR (le salon du duo) : le décor de la conversation, sans personne, avec les éléments et le cadrage de
 * la maquette du salon (le lot M0) — la télé au mur du fond, la platine, trois cadres vides, l'étagère vide, la fenêtre et
 * son ciel, deux lampes, la table basse en bas au milieu entre deux places LIBRES (la figurine vient avec son fauteuil),
 * le coin du chat. La chambre musicale : d'après l'image déposée (IMAGE 1), la personne retirée, une télé ajoutée.
 */
export function consignePieceDuo(p: PieceDuo): string {
  const { x, platine, cadres, etagere } = objetsDe(p);
  const source = depuisImage(p);
  return [
    source
      ? "IMAGE 1 is a room drawn by the owner of this app. Make EXACTLY THIS ROOM — the same place, style, colours, materials, furniture and objects — as a vertical portrait image, a WIDE shot that shows the whole room, as the place where two small collectible figurines (about 15 cm tall) meet and talk. REMOVE the person and any character from it, and every interface element, icon, button or text drawn over the image."
      : `Create ${x.lieu}, as the place where two small collectible figurines (about 15 cm tall) meet and talk — a vertical portrait image, a WIDE shot that shows the whole place.`,
    "",
    `STYLE: ${STYLE_PIECES_DUO}`,
    "",
    `THIS ROOM'S OWN IDENTITY (it must not look like a generic golden room): ${x.signature}.`,
    `THE LIGHT: ${momentDe(x.moment).lumiere}.`,
    "",
    `THE SAME OBJECTS ARE IN EVERY ROOM, AND THEY ARE BIG — they are the stars of the image.${source ? " Keep those already in IMAGE 1, ADD those that are missing (the TV above all)." : ""} Spread them around, each one on its own, with bare wall or space around it: no object overlaps, touches or hides another one. Each one is clearly visible, facing the viewer, not cut by the edge of the image:`,
    `1. ${x.tele}: its screen switched off (plain dark glass), LARGE — about one third of the image width — in the middle of the back wall, at the figurines' eye level.`,
    `2. ${platine}, about one fifth of the image width.`,
    `3. ${cadres}; the big ones each about one fifth of the image width (poster size).`,
    `4. ${etagere}, about one third of the image width — the keepsakes will be placed on it later.`,
    `5. ${x.vue}, on one side, with the sky clearly visible (the weather will show there).`,
    `6. At least two lamps: ${x.lampes}.`,
    `7. In the lower middle of the image, in sharp focus: ${x.table}. On each side of it, close to it, a clear EMPTY spot of floor — two small figurines, each in its own little armchair, will be placed there later, turned toward each other. Each spot is wide enough for an armchair about one third of the image width. Leave both spots completely empty: no chair, no sofa, no stool, no cushion, nothing on them.`,
    `8. ${x.chat}, empty, in a lower corner.`,
    "",
    "COMPOSITION (the same framing for every room): the whole room seen from a little above the figurines' eye level; the back wall fills the upper half (the TV in the middle, the shelf and the three frames around it), the window on one side, the lamps, the coffee table and the two empty spots in the lower middle, the cat's corner in a lower corner, and a small object (a plant, a few books) at the very bottom edge in the foreground, for depth; the main light comes from the window.",
    "",
    SANS,
  ].join("\n");
}

/** 🌤️ Une autre lumière : la même pièce (l'image première), à un autre moment de la journée. */
export function consigneLumiereDuo(p: PieceDuo, m: MomentDuo): string {
  return [
    "IMAGE 1 is a room where two small collectible figurines will meet and talk. Make EXACTLY THE SAME ROOM: the same camera, the same composition, every object at exactly the same place and size, the same style, colours and materials, the same weather.",
    `Change ONLY the time of day and its light: ${momentDe(m).lumiere}. The window shows the same view at that time of day; the lamps are on or off accordingly.`,
    "Keep the TV screen switched off (plain dark glass), the picture frames empty, the shelf empty, the empty spots and the cat's place empty.",
    SANS,
    `(The room: ${pieceDuoDe(p).lieu}.)`,
  ].join("\n");
}

// ─── 🌅 LA PIÈCE EN LARGEUR ─────────────────────────────────────────────────────────────────────────────────────────
const BORDS = "no frame, no border, no vignette";
/** Ce que chaque partie du panorama montre : le centre (la place libre, la télé, les cadres, la table basse), les côtés le reste. */
const surLeCote = (p: PieceDuo, c: "gauche" | "droite") => {
  const { x, platine, etagere } = objetsDe(p);
  return c === "gauche" ? `${x.vue}, with the sky clearly visible; ${etagere}; one of the lamps (${x.lampes}).` : `${platine}; ${x.chat}, empty; the other lamp; a big plant.`;
};

/**
 * 1. Le centre, en largeur (1536 × 1024) : LA MÊME PIÈCE que l'image en hauteur (IMAGE 1), vue plus large — une seule
 * place libre au milieu (la figurine viendra avec son fauteuil), la télé au mur du fond, les trois cadres, la table basse.
 * La chambre musicale : aussi d'après l'image déposée (IMAGE 2), pour en voir plus — sans sa personne.
 */
export function consigneLargeCentre(p: PieceDuo): string {
  const { x, cadres } = objetsDe(p);
  return [
    "IMAGE 1 is a room where small collectible figurines live. Make EXACTLY THE SAME ROOM — the same place, style, colours, materials, light, weather and objects.",
    ...(depuisImage(p)
      ? ["IMAGE 2 is the original drawing of this same room: use it to show more of the room as it really is, but WITHOUT its person or character, and without any interface element, icon, button or text drawn over it."]
      : []),
    `Show it in a wide landscape frame, at eye level, from a little further back: it is the CENTRAL part of a panorama that will be continued on both sides, so the left and right edges simply continue the scene (${BORDS}).`,
    `THE LIGHT: ${momentDe(x.moment).lumiere}.`,
    "In the middle of the floor, in the lower part of the image, facing the viewer: ONE clear EMPTY spot of floor (bare floor or a rug, nothing on it) — one small figurine in its own little armchair will be placed there later. Nothing stands in front of it.",
    `Around it, in this central part: ${x.tele} behind it, its screen switched off (plain dark glass), LARGE — about one quarter of the image width; ${cadres}; ${x.table}, just beside the empty spot.`,
    "The window, the shelf, the record player, the lamps and the cat's corner are NOT in this central part: they will be painted on the sides.",
    SANS,
  ].join("\n");
}

/** 2 et 3. Un côté : la toile prolongée (IMAGE 1, son masque), dans la pièce en hauteur (IMAGE 2). */
export function consigneLargeCote(p: PieceDuo, c: "gauche" | "droite"): string {
  return [
    `IMAGE 1 is part of a wide panorama of a room: its ${c === "gauche" ? "right" : "left"} part is already painted, the rest is empty and must be painted.`,
    `Extend the room to the ${c === "gauche" ? "LEFT" : "RIGHT"}, continuing the same walls, floor, rug, light and perspective seamlessly from the painted part, which stays exactly as it is.`,
    `On this new part, BIG and clearly visible, each one on its own: ${surLeCote(p, c)}`,
    UN_SEUL,
    `IMAGE 2 is the same room in a vertical frame: keep EXACTLY its style, colours, materials and objects.${depuisImage(p) ? "" : ` (The room: ${pieceDuoDe(p).lieu}.)`}`,
    `The far edge simply continues the scene (${BORDS}). The shelf is EMPTY, the TV screen is off.`,
    SANS,
  ].join("\n");
}

/** 🌤️ Une partie du panorama dans une autre lumière (IMAGE 1) ; les côtés suivent le centre déjà retouché (IMAGE 2). */
export function consigneLumiereLarge(p: PieceDuo, m: MomentDuo, partie: PartieLarge): string {
  return [
    "IMAGE 1 is one part of a wide panorama of a room where small figurines live. Make EXACTLY THE SAME IMAGE: the same camera, the same composition, every object at exactly the same place and size, the same style, colours and materials, the same weather.",
    `Change ONLY the time of day and its light: ${momentDe(m).lumiere}. A window shows the same view at that time of day; the lamps are on or off accordingly.`,
    ...(partie === "centre" ? [] : ["IMAGE 2 is the next part of the same panorama, already in that light: match its light, sky and colours exactly, so that the two join without a seam."]),
    "Keep the TV screen switched off (plain dark glass), the picture frames empty, the shelf empty, the empty spot and the cat's place empty.",
    SANS,
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
    ' "table": the box of the low coffee table,',
    ' "lampes": [the box of each lamp],',
    ' "places": [{"x", "y", "hauteur"}, {"x", "y", "hauteur"}] — the two empty spots beside the coffee table: x and y are the point where a small figurine, seated in a little armchair placed on that spot, would sit; "hauteur" is how tall that seated figurine should look there, as a fraction of the image height,',
    ' "chat": {"x", "y"} — the point on the cushion or basket where a cat would lie}',
    "Leave out anything that is not visible.",
  ].join("\n");
}

/** (signée, si elle est là) */
const signee = async (supabase: Supabase, noms: string[], d: string, n: string) => (noms.includes(n) ? await signer(supabase, `${d}/${n}`) : "");

/** La pièce en largeur : ses étapes faites, ses panoramas (et ses parties tant qu'il n'est pas fait), ses emplacements. */
async function etatLarge(supabase: Supabase, p: PieceDuo): Promise<LargeVue> {
  const dl = depotDans(supabase, dossierLarge(p));
  const noms = await dl.lister().catch(() => [] as string[]);
  const faites = etapesLarge(p).filter((e) => noms.includes(fichierLarge(e)));
  const sien = pieceDuoDe(p).moment;
  const panoramas: LargeVue["panoramas"] = {};
  for (const m of MOMENTS_DUO.map((x) => x.cle)) {
    const u = await signee(supabase, noms, dossierLarge(p), fichierLarge(m === sien ? "panorama" : `panorama-${m}`));
    if (u) panoramas[m] = u;
  }
  const parties: LargeVue["parties"] = {};
  if (!panoramas[sien]) for (const x of PARTIES_LARGE) if (noms.includes(fichierLarge(x))) parties[x] = await signer(supabase, `${dossierLarge(p)}/${fichierLarge(x)}`);
  const releve = noms.includes("releve.json") ? json(await dl.lire("releve.json").catch(() => null)) : null;
  const emplacements = releve?.emplacements ? emplacementsValides(releve.emplacements) : null;
  return {
    faites,
    aFaire: etapesLarge(p).filter((e) => !faites.includes(e)),
    panoramas,
    parties,
    alertes: emplacements ? alertesEmplacements(emplacements, ZONE_MIN_LARGE) : [],
    ...(emplacements ? { emplacements } : {}),
    ...(releve?.ajuste === true ? { ajuste: true } : {}),
  };
}

/** L'état des pièces : leur image (signée), leurs emplacements, leur version, leur largeur. */
export async function etatPiecesDuo(supabase: Supabase): Promise<EtatPiecesDuo> {
  const pieces: PieceDuoVue[] = await Promise.all(
    PIECES_DUO.map(async (p) => {
      const d = depotDans(supabase, dossier(p.cle));
      const noms = await d.lister().catch(() => [] as string[]);
      const releve = noms.includes("releve.json") ? json(await d.lire("releve.json").catch(() => null)) : null;
      const emplacements = releve && releve.emplacements ? emplacementsValides(releve.emplacements) : null;
      const lumieres: Partial<Record<MomentDuo, string>> = {};
      for (const m of lumieresAFaire(p.cle)) if (noms.includes(nomLumiere(m))) lumieres[m] = await signer(supabase, `${dossier(p.cle)}/${nomLumiere(m)}`);
      const source = depuisImage(p.cle) ? await signee(supabase, noms, dossier(p.cle), SOURCE) : "";
      return {
        cle: p.cle,
        nom: p.nom,
        pour: p.pour,
        emoji: p.emoji,
        moment: p.moment,
        lumieres,
        alertes: emplacements ? alertesEmplacements(emplacements) : [],
        large: await etatLarge(supabase, p.cle),
        ...(noms.includes("decor.png") ? { decor: await signer(supabase, `${dossier(p.cle)}/decor.png`) } : {}),
        ...(noms.includes("decor.png") && !noms.includes(FABRIQUE) ? { ancienne: true } : {}),
        ...(depuisImage(p.cle) ? { depuisImage: true } : {}),
        ...(source ? { source } : {}),
        ...(emplacements ? { emplacements } : {}),
        ...(releve && releve.ajuste === true ? { ajuste: true } : {}),
        ...(releve && s(releve.erreur) ? { releveRate: s(releve.erreur) } : {}),
      };
    }),
  );
  return { pieces, moteurs: { image: Boolean(cle()), regard: analyseConfiguree() } };
}

/** Le verrou d'une pièce (ou de l'essai du collage) : de deux passages arrivés ensemble, seul le dernier qui a écrit continue. */
export async function prendre(d: ReturnType<typeof depotDans>): Promise<string | null> {
  if ((await d.lister().catch(() => [] as string[])).includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU) return null;
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 300));
  return json(await d.lire(VERROU).catch(() => null)).qui === qui ? qui : null;
}
export async function rendre(d: ReturnType<typeof depotDans>, qui: string) {
  if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
}

const SANS_SOURCE = "Dépose d’abord l’image de la chambre (« Déposer l’image »).";

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
  if (!noms.includes("decor.png") && depuisImage(p) && !noms.includes(SOURCE)) return { erreur: SANS_SOURCE };
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train sur cette pièce : patiente une minute." };
  try {
    if (!noms.includes("decor.png")) {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      // (la chambre musicale : une retouche de l'image déposée ; les autres, un dessin)
      const source = depuisImage(p) ? await d.lire(SOURCE) : null;
      if (depuisImage(p) && !source) return { erreur: SANS_SOURCE };
      const r = await demanderUneImage({ images: source ? [source] : [], consigne: consignePieceDuo(p), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      await d.ecrire("decor.png", await sharp(r.png).png().toBuffer(), "image/png");
      await d.ecrire(FABRIQUE, Buffer.from(JSON.stringify({ version: VERSION_PIECES_DUO, le: new Date().toISOString() })), "application/json");
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

/** (tous les fichiers de la largeur, son relevé compris) */
const toutLarge = (p: PieceDuo) => [...etapesLarge(p).map(fichierLarge), "releve.json"];

/**
 * Refaire une pièce (`releve` : son relevé seul ; `lumieres` : ses deux autres lumières ; sinon tout — sa largeur aussi,
 * faite d'après elle). L'image déposée de la chambre musicale reste.
 */
export async function refairePieceDuo(supabase: Supabase, p: PieceDuo, quoi: "piece" | "releve" | "lumieres" = "piece"): Promise<void> {
  const d = depotDans(supabase, dossier(p));
  const lumieres = lumieresAFaire(p).map(nomLumiere);
  for (const n of quoi === "releve" ? ["releve.json"] : quoi === "lumieres" ? lumieres : ["decor.png", "releve.json", FABRIQUE, ...lumieres]) await d.effacer(n).catch(() => undefined);
  if (quoi === "piece") {
    const dl = depotDans(supabase, dossierLarge(p));
    for (const n of toutLarge(p)) await dl.effacer(n).catch(() => undefined);
  }
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

// ─── 🌅 FABRIQUER LA LARGEUR ────────────────────────────────────────────────────────────────────────────────────────
/** À la taille de la toile (le moteur peut rendre une autre taille). */
const aLaToile = (png: Buffer) => sharp(png).resize(LARGE, HAUT, { fit: "cover" }).png().toBuffer();

/**
 * 🛠️ Un passage dans la largeur : la prochaine étape qui manque (`etapesLarge`) — le centre, la gauche, la droite, le
 * panorama (sans moteur), puis les mêmes dans ses deux autres lumières. Elle se fait d'après la pièce en hauteur (la
 * chambre musicale : aussi d'après l'image déposée) : celle-ci d'abord.
 */
export async function fabriquerLargeur(supabase: Supabase, p: PieceDuo, avant: number): Promise<{ fait?: string; erreur?: string }> {
  const d = depotDans(supabase, dossier(p));
  const dl = depotDans(supabase, dossierLarge(p));
  const noms = await dl.lister().catch(() => [] as string[]);
  const etape = etapesLarge(p).find((e) => !noms.includes(fichierLarge(e)));
  if (!etape) return {};
  const [partie, m] = etape.split("-") as [PartieLarge | "panorama", MomentDuo | undefined];
  if (partie !== "panorama" && !cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train sur cette pièce : patiente une minute." };
  try {
    const lire = async (e: string) => dl.lire(fichierLarge(e)).catch(() => null);
    const suffixe = m ? `-${m}` : "";
    if (partie === "panorama") {
      const [g, c, dr] = await Promise.all([lire(`gauche${suffixe}`), lire(`centre${suffixe}`), lire(`droite${suffixe}`)]);
      if (!g || !c || !dr) return { erreur: "Une des trois parties est introuvable : refais-la." };
      await dl.ecrire(fichierLarge(etape), await assembler(g, c, dr), "image/webp");
      return { fait: etape };
    }
    // (la pièce en hauteur : la référence de la largeur ; la chambre musicale, aussi l'image déposée)
    const ref = await d.lire("decor.png").catch(() => null);
    if (!ref) return { erreur: "Fais d’abord la pièce en hauteur." };
    const source = depuisImage(p) && partie === "centre" && !m ? await d.lire(SOURCE).catch(() => null) : null;
    const commun = { transparent: false, fidelite: "high" as const, avant, cle: cle(), base: base(), qualite: "high", taille: "1536x1024" as const };
    let r;
    if (m) {
      // (une autre lumière : la partie retouchée ; un côté suit le centre déjà retouché)
      const ici = await lire(partie);
      const centre = partie === "centre" ? null : await lire(`centre-${m}`);
      if (!ici || (partie !== "centre" && !centre)) return { erreur: "Une partie est introuvable : refais-la." };
      r = await demanderUneImage({ ...commun, images: centre ? [ici, centre] : [ici], consigne: consigneLumiereLarge(p, m, partie) });
    } else if (partie === "centre") {
      r = await demanderUneImage({ ...commun, images: source ? [ref, source] : [ref], consigne: consigneLargeCentre(p) });
    } else {
      const centre = await lire("centre");
      if (!centre) return { erreur: "Le centre est introuvable : refais-le." };
      const toile = await toileDeCote(centre, partie);
      r = await demanderUneImage({ ...commun, images: [toile, ref], masque: toile, consigne: consigneLargeCote(p, partie) });
    }
    if ("erreur" in r) return { erreur: r.erreur };
    await dl.ecrire(fichierLarge(etape), await aLaToile(r.png), "image/png");
    return { fait: etape };
  } finally {
    await rendre(d, qui);
  }
}

export const QUOI_LARGE = ["tout", "centre", "gauche", "droite", "panorama", "lumieres", "releve"] as const;
export type QuoiLarge = (typeof QUOI_LARGE)[number];
/**
 * ↩️ Refaire dans la largeur : une étape et ce qui en dépend (le centre : tout ; un côté : lui, ses lumières et les
 * panoramas ; le panorama : lui seul), ses deux autres lumières, ou son relevé.
 */
export async function refaireLargeur(supabase: Supabase, p: PieceDuo, quoi: QuoiLarge): Promise<void> {
  const dl = depotDans(supabase, dossierLarge(p));
  const lumieres = lumieresAFaire(p);
  const avec = (x: string) => [x, ...lumieres.map((m) => `${x}-${m}`)];
  const etapes =
    quoi === "tout" || quoi === "centre"
      ? null
      : quoi === "gauche" || quoi === "droite"
        ? [...avec(quoi), ...avec("panorama")]
        : quoi === "panorama"
          ? ["panorama"]
          : quoi === "lumieres"
            ? etapesLarge(p).filter((e) => e.includes("-"))
            : [];
  const fichiers = etapes ? etapes.map(fichierLarge) : toutLarge(p);
  for (const n of quoi === "releve" ? ["releve.json"] : fichiers) await dl.effacer(n).catch(() => undefined);
}

/** ✋ Les zones de la largeur, posées à la main sur le panorama (la place : le centre). */
export async function ajusterLargeur(supabase: Supabase, p: PieceDuo, x: unknown): Promise<{ erreur?: string }> {
  const dl = depotDans(supabase, dossierLarge(p));
  if (!(await dl.lister().catch(() => [] as string[])).includes(fichierLarge("panorama"))) return { erreur: "Le panorama n’est pas encore fait." };
  const e = emplacementsValides(x);
  const emplacements = { ...e, places: e.places.slice(0, 1) };
  if (!emplacements.tele && !emplacements.platine && !emplacements.cadres.length && !emplacements.etagere && !emplacements.places.length) return { erreur: "Aucune zone ne tient debout." };
  await dl.ecrire("releve.json", Buffer.from(JSON.stringify({ le: new Date().toISOString(), emplacements, ajuste: true })), "application/json");
  return {};
}

/** (l'image déposée : 12 Mo au plus, une image) */
const SOURCE_MAX = 12 * 1024 * 1024;
/**
 * 🖼️ L'IMAGE DE LA CHAMBRE MUSICALE, déposée par le propriétaire sur la page de l'admin (une adresse `data:` ; elle
 * n'est pas dans le dépôt) : rangée en png (2048 px au plus), et tout ce qui en était fait s'efface (la pièce, ses
 * lumières, sa largeur) : on le refait d'après elle.
 */
export async function deposerSource(supabase: Supabase, p: PieceDuo, x: unknown): Promise<{ erreur?: string }> {
  if (!depuisImage(p)) return { erreur: "Cette pièce ne se fait pas d’après une image." };
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(s(x));
  if (!m) return { erreur: "Ce n’est pas une image (png, jpeg ou webp)." };
  const octets = Buffer.from(m[2], "base64");
  if (!octets.length || octets.length > SOURCE_MAX) return { erreur: "L’image est trop lourde (12 Mo au plus)." };
  let png: Buffer;
  try {
    png = await sharp(octets).rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { erreur: "L’image n’a pas pu être lue." };
  }
  await refairePieceDuo(supabase, p, "piece");
  await depotDans(supabase, dossier(p)).ecrire(SOURCE, png, "image/png");
  return {};
}
