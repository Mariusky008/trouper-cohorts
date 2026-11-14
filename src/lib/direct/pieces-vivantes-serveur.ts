/**
 * 🏠 UNE PIÈCE ENTIÈRE, VIVANTE — L'ESSAI (14 novembre 2026). Le propriétaire, après la maison de poupée et les
 * panoramas : « je n'aime vraiment pas du tout […] est-ce qu'on pourrait pas avoir chaque pièce entièrement sur l'écran
 * comme sur la photo [l'image de son univers], mais dézoomer davantage pour avoir plus de choses visibles. Pour chaque
 * pièce on aurait donc que deux ou trois gros objets animés (comme la télé ou un bagage…) et pour le reste ce serait sur
 * des étagères. Et pour les animations : les étoiles ça fait étrange et très années 2000, il faut trouver un moyen pour
 * que ce soit bien plus wow et immersif. »
 *
 * D'OÙ, POUR CHAQUE PIÈCE (le salon, la pièce télé, la terrasse), TROIS ÉTAPES :
 *   1. l'image : la pièce ENTIÈRE, en hauteur (1024 × 1536), vue de loin (les murs, le sol, un peu du plafond), dans le
 *      style de son décor ; DEUX OU TROIS OBJETS VEDETTES, grands, bien à part (ce sont eux qui vivront) ; tout le reste
 *      rangé sur des étagères ; une place libre au premier plan, pour son fauteuil. On en garde la vue du téléphone, en
 *      9:16 (`vue.webp`, 864 × 1536 : les deux bords un peu rognés) ;
 *   2. les objets : où sont les vedettes, la place du fauteuil et l'écran de la télé (des cadres en %, lus sur la vue par
 *      un modèle qui voit les images) — on les touche, la caméra s'en approche ;
 *   3. la vie : la vue devient une PHOTO VIVANTE — huit secondes de vidéo faites par le moteur vidéo d'OpenAI d'après
 *      elle (la caméra ne bouge pas ; seuls les objets vivent : le disque tourne, le feu danse, les poissons nagent, la
 *      mer scintille), jouées en boucle par-dessus l'image fixe. La vidéo se fait en quelques minutes : un passage la
 *      commande, les suivants demandent où elle en est, puis la rangent.
 * Rangé dans `<h>/pieces-entieres/<pièce>/` (image.png, vue.webp, objets.json, video.json — la commande en cours —,
 * video.mp4). Refaire une étape efface ce qui en dépend. Un verrou par pièce : un seul passage à la fois.
 *
 * Réservé à l'administrateur (`/admin/humain/univers-essais`), sur SON univers. FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFicheMonde, lireFichePerso } from "./fiches-serveur";
import { depotDans, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { PIECES, type Piece } from "./pieces-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
/** Le moteur vidéo (`sora-2` : 0,10 $ la seconde en 720p) et la durée (4, 8 ou 12 s). */
const modeleVideo = () => s(process.env.OPENAI_VIDEO_MODEL) || "sora-2";
const secondes = () => (["4", "8", "12"].includes(s(process.env.OPENAI_VIDEO_SECONDES)) ? s(process.env.OPENAI_VIDEO_SECONDES) : "8");
const modeleVision = () => s(process.env.OPENAI_VISION_MODEL) || s(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini";

export const ETAPES_VIVANTES = ["image", "objets", "video"] as const;
export type EtapeVivante = (typeof ETAPES_VIVANTES)[number];
/** La vue du téléphone : 9:16, prise au milieu de l'image (1024 × 1536 → 864 × 1536). */
export const VUE = { l: 864, h: 1536 };
/** Ce que le moteur vidéo reçoit : exactement sa taille (sinon, il refuse). */
export const TAILLE_VIDEO = { l: 720, h: 1280 };

const dossier = (h: string, p: Piece) => `${h}/pieces-entieres/${p}`;
const FICHIERS: Record<EtapeVivante, string> = { image: "vue.webp", objets: "objets.json", video: "video.mp4" };
const VERROU = "verrou.json";
const DUREE_VERROU = 6 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

// ─── les pièces : leurs vedettes, et comment elles vivent ─────────────────────────────────────────────
export type Vedette = { cle: string; nom: string; dit: string; en: string };
type PlanEntier = { quoi: string; vedettes: Vedette[]; etageres: string; vit: string; voisine?: Piece };
export const PLANS_ENTIERS: Record<Piece, PlanEntier> = {
  salon: {
    quoi: "the LIVING ROOM of this same home",
    vedettes: [
      { cle: "platine", nom: "📻 Le tourne-disque", dit: "Ta chanson du moment tourne ici.", en: "a vintage record player on a low wooden cabinet, a vinyl record on its platter, a few record sleeves leaning beside it" },
      { cle: "feu", nom: "🔥 La cheminée", dit: "Le coin du feu, là où l’on se raconte tout.", en: "a fireplace with a small, cosy fire burning in it" },
      { cle: "fenetre", nom: "🪟 La grande fenêtre", dit: "La vue de chez toi.", en: "a big window with light sheer curtains, looking out on the same landscape as IMAGE 1, in a warm sunset light" },
    ],
    etageres: "Along the walls, wooden shelves full of small objects (books, little framed photos, small plants, souvenirs and trinkets), neat and readable: everything else in the room lives on these shelves.",
    vit: "the vinyl record turns slowly on the record player; the flames of the fire flicker and dance; the sheer curtains sway gently in a soft breeze; outside the window, the light of the sunset shimmers and a few clouds drift slowly",
  },
  tele: {
    quoi: "the TV ROOM of this same home",
    vedettes: [
      { cle: "tele", nom: "📺 La télé", dit: "Ce que tu regardes en ce moment.", en: "a large flat television on a low wooden cabinet, seen straight on; it is switched off: its screen is plain, uniform dark glass with nothing on it (a film will be shown on it later)" },
      { cle: "aquarium", nom: "🐠 L’aquarium", dit: "Ton petit monde à toi.", en: "a big lit aquarium with water plants and a few small colourful fish" },
      { cle: "bougies", nom: "🕯️ Les bougies", dit: "Une bougie par bonne nouvelle.", en: "a low table with a cluster of lit candles of different heights" },
    ],
    etageres: "Along the walls, wooden shelves full of films, books, small plants and souvenirs, neat and readable: everything else in the room lives on these shelves. A deep cosy sofa with cushions and a plaid, turned towards the television.",
    vit: "the small fish swim slowly in the aquarium and tiny bubbles rise; the candle flames flicker softly; the television screen stays dark and perfectly still",
    voisine: "salon",
  },
  terrasse: {
    quoi: "the TERRACE of this same home, outdoors",
    vedettes: [
      { cle: "carte", nom: "🗺️ La carte de tes voyages", dit: "Tes voyages, épinglés un par un.", en: "an easel holding a big world map pinned with a few coloured pins" },
      { cle: "valise", nom: "🧳 Ta valise", dit: "Ton prochain départ.", en: "a vintage leather suitcase covered with travel stickers, standing on the deck" },
      { cle: "guirlande", nom: "💡 La guirlande", dit: "Les soirs d’été.", en: "a string of warm lights hanging above the deck" },
    ],
    etageres: "Against the outside wall of the house, a wooden shelf unit with potted plants, lanterns and small travel souvenirs, neat and readable: everything else lives on it. A wooden railing; beyond it, the same landscape as IMAGE 1 at sunset.",
    vit: "the string lights glow and twinkle softly; beyond the railing, the water and the light shimmer and the clouds drift slowly; a light breeze moves the leaves of the potted plants",
    voisine: "salon",
  },
};

const SANS = "No people, no characters, no figurines, no pets, no text, no letters, no logos.";
const STYLE = "keep EXACTLY its art direction: the same 3D miniature diorama look, the same materials and textures, the same warm light, colour palette, level of detail and atmosphere";

/** 1. La pièce entière, en hauteur, vue de loin : ses vedettes, ses étagères, la place du fauteuil. */
export const consigneEntiere = (p: Piece, voisine = false) =>
  [
    `IMAGE 1 is this person's home universe: ${STYLE}.`,
    ...(voisine && PLANS_ENTIERS[p].voisine ? [`IMAGE 2 is another room of this same home: keep the same wood, walls, plants, materials and finish.`] : []),
    `Create ${PLANS_ENTIERS[p].quoi} — the WHOLE of it — in a tall portrait frame, seen from far back: a wide-angle view, so that the entire place is visible at once — the floor in the foreground, the back wall, both sides and a little of the ceiling (or the sky). Nothing important is cut by the edges, and the important things stay away from the far left and right edges (the sides will be slightly cropped). No frame, no border, no vignette.`,
    `THE STARS OF THE ROOM — two or three big objects, clearly visible, each one on its own and not hidden behind anything, because they will come alive: ${PLANS_ENTIERS[p].vedettes.map((v) => v.en).join("; ")}.`,
    PLANS_ENTIERS[p].etageres,
    "In the foreground, in the middle of the floor, leave a clear empty space (bare floor and a round rug, nothing on it): an armchair will be placed there later.",
    SANS,
  ].join("\n");

/** 3. La photo vivante : la caméra immobile, seules les vedettes vivent. */
export const consigneVivante = (p: Piece) =>
  [
    "A living photo: this exact image, gently brought to life.",
    "The camera does not move at all: a locked-off tripod shot, no zoom, no pan, no tilt. The room, every object, the light and the framing stay exactly as they are.",
    `Only these things move, softly and continuously, in a calm loop: ${PLANS_ENTIERS[p].vit}.`,
    "Nothing appears and nothing disappears. No people, no characters, no text. The empty space in the middle of the floor stays empty. The last moment looks like the first one.",
  ].join("\n");

/** 2. Où sont les vedettes, la place du fauteuil et (la télé) son écran — en % de la vue. */
export const consigneObjets = (p: Piece) =>
  [
    "LES OBJETS VEDETTES — this is a portrait image of a room (a 3D miniature diorama).",
    "Locate each of these objects as a box, in percent of the image width and height (x, y: its top-left corner; l, h: its width and height; numbers from 0 to 100):",
    ...PLANS_ENTIERS[p].vedettes.map((v) => `- ${v.cle} : ${v.en.split(";")[0]}`),
    'Also locate "place": the empty space in the middle of the floor (where an armchair will stand)' + (PLANS_ENTIERS[p].vedettes.some((v) => v.cle === "tele") ? ', and "ecran": the SCREEN of the television only.' : "."),
    'Answer in JSON only: {"objets":[{"cle":"…","x":0,"y":0,"l":0,"h":0}],"place":{"x":0,"y":0,"l":0,"h":0},"ecran":{"x":0,"y":0,"l":0,"h":0} or null}. Leave out an object that is not in the image.',
  ].join("\n");

export type Cadre = { x: number; y: number; l: number; h: number };
export type ObjetsVus = { objets: (Cadre & { cle: string })[]; place: Cadre | null; ecran: Cadre | null };
const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : NaN);
export function cadreValide(v: unknown): Cadre | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const c = { x: nombre(o.x), y: nombre(o.y), l: nombre(o.l), h: nombre(o.h) };
  if (Object.values(c).some(Number.isNaN) || c.l < 1 || c.h < 1) return null;
  return { x: c.x, y: c.y, l: Math.min(c.l, 100 - c.x), h: Math.min(c.h, 100 - c.y) };
}
/** Ce que le modèle a vu, tenu : les vedettes connues de la pièce, une fois chacune, des cadres dans l'image. */
export function objetsValides(p: Piece, v: unknown): ObjetsVus {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const connues = new Set(PLANS_ENTIERS[p].vedettes.map((x) => x.cle));
  const objets: ObjetsVus["objets"] = [];
  for (const x of Array.isArray(o.objets) ? o.objets : []) {
    const k = s((x as Record<string, unknown>)?.cle);
    const c = cadreValide(x);
    if (c && connues.has(k) && !objets.some((y) => y.cle === k)) objets.push({ cle: k, ...c });
  }
  return { objets, place: cadreValide(o.place), ecran: connues.has("tele") ? cadreValide(o.ecran) : null };
}

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────────
export type EtatPieceVivante = {
  piece: Piece;
  decor: boolean;
  faites: EtapeVivante[];
  aFaire: EtapeVivante[];
  /** La vue (signée) et la vidéo (signée). */
  vue?: string;
  video?: string;
  objets?: ObjetsVus;
  vedettes: { cle: string; nom: string; dit: string }[];
  /** La vidéo commandée, pas encore rangée : depuis quand, et où elle en est (en %, si le moteur le dit). */
  videoEnCours?: { depuis: string; progres?: number };
  figurine?: string;
  enCours: boolean;
  pieces: Record<Piece, number>;
};

export async function etatDeLaPieceVivante(supabase: Supabase, h: string, p: Piece): Promise<EtatPieceVivante> {
  const listes = await Promise.all(PIECES.map((x) => depotDans(supabase, dossier(h, x)).lister().catch(() => [] as string[])));
  const noms = listes[PIECES.indexOf(p)];
  const d = depotDans(supabase, dossier(h, p));
  const [monde, perso] = await Promise.all([lireFicheMonde(supabase, h).catch(() => null), lireFichePerso(supabase, h).catch(() => ({ fiche: null }))]);
  const faites = ETAPES_VIVANTES.filter((e) => noms.includes(FICHIERS[e]));
  const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  const commande = noms.includes("video.json") ? json(await d.lire("video.json").catch(() => null)) : {};
  const enCours = noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU;
  return {
    piece: p,
    decor: Boolean(monde?.references.decor),
    faites,
    aFaire: ETAPES_VIVANTES.filter((e) => !faites.includes(e)),
    ...(faites.includes("image") ? { vue: await signer(supabase, `${dossier(h, p)}/vue.webp`) } : {}),
    ...(faites.includes("video") ? { video: await signer(supabase, `${dossier(h, p)}/video.mp4`) } : {}),
    ...(faites.includes("objets") ? { objets: objetsValides(p, json(await d.lire("objets.json").catch(() => null))) } : {}),
    vedettes: PLANS_ENTIERS[p].vedettes.map(({ cle: k, nom, dit }) => ({ cle: k, nom, dit })),
    ...(!faites.includes("video") && s(commande.id) ? { videoEnCours: { depuis: s(commande.le), ...(typeof commande.progres === "number" ? { progres: commande.progres } : {}) } } : {}),
    ...(assise ? { figurine: await signer(supabase, assise) } : {}),
    enCours,
    pieces: Object.fromEntries(PIECES.map((x, i) => [x, ETAPES_VIVANTES.filter((e) => listes[i].includes(FICHIERS[e])).length])) as Record<Piece, number>,
  };
}

// ─── les images ────────────────────────────────────────────────────────────────────────────────────
/** La vue du téléphone : le milieu de l'image, en 9:16. */
export const laVue = (png: Buffer) => sharp(png).resize(1024, 1536, { fit: "cover" }).extract({ left: (1024 - VUE.l) / 2, top: 0, width: VUE.l, height: VUE.h }).webp({ quality: 88 }).toBuffer();
/** Ce que reçoit le moteur vidéo : la vue, exactement à sa taille. */
export const pourLaVideo = (vue: Buffer) => sharp(vue).resize(TAILLE_VIDEO.l, TAILLE_VIDEO.h, { fit: "cover" }).png().toBuffer();

async function voirLesObjets(p: Piece, vue: Buffer): Promise<ObjetsVus | { erreur: string }> {
  const jpeg = await sharp(vue).resize(576, 1024).jpeg({ quality: 82 }).toBuffer();
  const r = await fetch(`${base()}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cle()}` },
    body: JSON.stringify({
      model: modeleVision(),
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: consigneObjets(p) },
        { role: "user", content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpeg.toString("base64")}` } }] },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!r?.ok) return { erreur: `Le modèle qui voit les images n’a pas répondu (${r?.status ?? "réseau"}).` };
  const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
  const vus = objetsValides(p, json(Buffer.from(j.choices?.[0]?.message?.content ?? "{}")));
  return vus.objets.length ? vus : { erreur: "Le modèle n’a trouvé aucune des vedettes dans l’image : refais l’image." };
}

/** Ce que dit le moteur vidéo quand il refuse (son message, court). */
const raison = async (r: Response) => {
  const t = await r.text().catch(() => "");
  return s((json(Buffer.from(t)).error as { message?: string } | undefined)?.message || t).slice(0, 220);
};

async function commanderLaVideo(p: Piece, vue: Buffer): Promise<{ id: string } | { erreur: string }> {
  const forme = new FormData();
  forme.append("model", modeleVideo());
  forme.append("prompt", consigneVivante(p));
  forme.append("seconds", secondes());
  forme.append("size", `${TAILLE_VIDEO.l}x${TAILLE_VIDEO.h}`);
  forme.append("input_reference", new File([new Uint8Array(await pourLaVideo(vue))], "piece.png", { type: "image/png" }));
  const r = await fetch(`${base()}/v1/videos`, { method: "POST", headers: { authorization: `Bearer ${cle()}` }, body: forme, signal: AbortSignal.timeout(60_000) }).catch(() => null);
  if (!r) return { erreur: "Le moteur vidéo ne répond pas." };
  if (!r.ok) return { erreur: `Le moteur vidéo (${modeleVideo()}) refuse : ${r.status} ${await raison(r)}` };
  const j = (await r.json().catch(() => ({}))) as { id?: string };
  return s(j.id) ? { id: s(j.id) } : { erreur: "Le moteur vidéo n’a pas rendu de commande." };
}

/** Où en est la vidéo commandée : faite (et rangée), ratée (la commande s'efface), ou en train. */
async function suivreLaVideo(d: ReturnType<typeof depotDans>, id: string): Promise<{ fait: true } | { erreur: string } | { progres: number }> {
  const r = await fetch(`${base()}/v1/videos/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${cle()}` }, signal: AbortSignal.timeout(30_000) }).catch(() => null);
  if (!r?.ok) return { erreur: `Le moteur vidéo ne dit pas où en est la vidéo (${r?.status ?? "réseau"}).` };
  const j = (await r.json().catch(() => ({}))) as { status?: string; progress?: number; error?: { message?: string } };
  if (j.status === "failed") {
    await d.effacer("video.json").catch(() => undefined);
    return { erreur: `La vidéo a échoué : ${s(j.error?.message) || "le moteur n’a pas dit pourquoi"}. Touche « Continuer » pour la recommander.` };
  }
  if (j.status !== "completed") return { progres: typeof j.progress === "number" ? Math.round(j.progress) : 0 };
  const c = await fetch(`${base()}/v1/videos/${encodeURIComponent(id)}/content`, { headers: { authorization: `Bearer ${cle()}` }, signal: AbortSignal.timeout(90_000) }).catch(() => null);
  if (!c?.ok) return { erreur: `La vidéo est faite, mais ne se télécharge pas (${c?.status ?? "réseau"}) : réessaie.` };
  await d.ecrire("video.mp4", Buffer.from(await c.arrayBuffer()), "video/mp4");
  return { fait: true };
}

/** 🛠️ Un passage : la prochaine étape qui manque (la vidéo : la commander, puis, aux passages suivants, la suivre). */
export async function fabriquerLaPieceVivante(supabase: Supabase, h: string, p: Piece, avant: number): Promise<{ fait?: EtapeVivante; progres?: number; erreur?: string }> {
  const d = depotDans(supabase, dossier(h, p));
  const noms = await d.lister().catch(() => [] as string[]);
  const etape = ETAPES_VIVANTES.find((e) => !noms.includes(FICHIERS[e]));
  if (!etape) return {};
  const chemin = s((await lireFicheMonde(supabase, h).catch(() => null))?.references.decor?.chemin);
  if (!chemin) return { erreur: "Crée d’abord ton univers (/univers/monde) : ta maison se fait dans son style." };
  if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  if (noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU)).le) || 0) < DUREE_VERROU) return { erreur: "Un passage est déjà en train : patiente une minute." };
  // LE VERROU EST À NOUS ? Écrit, puis relu : de deux passages arrivés ensemble, seul le dernier écrit continue
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await d.lire(VERROU)).qui !== qui) return { erreur: "Un passage est déjà en train : patiente une minute." };
  try {
    if (etape === "image") {
      const decor = await telecharger(supabase, chemin);
      if (!decor) return { erreur: "Le décor de ton univers est introuvable." };
      // (une autre pièce déjà faite — le salon, pour la télé et la terrasse : la maison se tient)
      const v = PLANS_ENTIERS[p].voisine;
      const voisine = v ? await depotDans(supabase, dossier(h, v)).lire("image.png").catch(() => null) : null;
      const r = await demanderUneImage({ images: voisine ? [decor, voisine] : [decor], consigne: consigneEntiere(p, Boolean(voisine)), transparent: false, fidelite: "low", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      const png = await sharp(r.png).resize(1024, 1536, { fit: "cover" }).png().toBuffer();
      await d.ecrire("image.png", png, "image/png");
      await d.ecrire("vue.webp", await laVue(png), "image/webp");
      return { fait: etape };
    }
    const vue = await d.lire("vue.webp");
    if (!vue) return { erreur: "L’image de la pièce est introuvable : refais-la." };
    if (etape === "objets") {
      const vus = await voirLesObjets(p, vue);
      if ("erreur" in vus) return { erreur: vus.erreur };
      await d.ecrire("objets.json", Buffer.from(JSON.stringify(vus)), "application/json");
      return { fait: etape };
    }
    // la vidéo : commandée une fois, puis suivie
    const commande = json(await d.lire("video.json").catch(() => null));
    if (!s(commande.id)) {
      const c = await commanderLaVideo(p, vue);
      if ("erreur" in c) return { erreur: c.erreur };
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ id: c.id, le: new Date().toISOString(), modele: modeleVideo() })), "application/json");
      return { progres: 0 };
    }
    const suite = await suivreLaVideo(d, s(commande.id));
    if ("erreur" in suite) return { erreur: suite.erreur };
    if ("progres" in suite) {
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ ...commande, progres: suite.progres })), "application/json");
      return { progres: suite.progres };
    }
    await d.effacer("video.json").catch(() => undefined);
    return { fait: "video" };
  } finally {
    if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
  }
}

/** ↩️ Refaire une étape : elle, et ce qui en dépend (l'image : tout ; les objets : eux seuls ; la vidéo : elle). */
export async function refaireDeLaPieceVivante(supabase: Supabase, h: string, p: Piece, etape: unknown): Promise<{ error?: string }> {
  const e = ETAPES_VIVANTES.find((x) => x === etape);
  if (!e) return { error: "Quelle étape ?" };
  const d = depotDans(supabase, dossier(h, p));
  const aEffacer = e === "image" ? ["image.png", "vue.webp", "objets.json", "video.json", "video.mp4"] : e === "objets" ? ["objets.json"] : ["video.json", "video.mp4"];
  for (const x of aEffacer) await d.effacer(x).catch(() => undefined);
  return {};
}
