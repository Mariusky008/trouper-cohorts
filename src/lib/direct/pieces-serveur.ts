/**
 * 🏠 LES PIÈCES EN PANORAMA — L'ESSAI DE SA MAISON (14 novembre 2026, le propriétaire : « on est dans ta maison, à
 * hauteur d'yeux ; on commence dans le salon, moi assis dans mon fauteuil ; on regarde à gauche ou à droite en glissant ;
 * il y a une porte, on la touche, elle s'ouvre… Chaque pièce est une image très large, dans le style de mon univers » ;
 * la maquette « Chez toi en panorama », puis : « fabriquer une vraie pièce, le salon, pour juger sur pièce » ; le salon
 * fait et aimé : « fais la pièce télé et la terrasse »). Réservé à l'administrateur (`/admin/humain/univers-essais`),
 * sur SON univers (son cookie d'habitant).
 *
 * TROIS PIÈCES — le salon (la porte de la pièce télé à gauche, la baie sur la terrasse à droite), la pièce télé (la
 * télé éteinte au milieu, pour y passer son film ; la porte du salon à droite), la terrasse (la baie du salon à gauche ;
 * la carte de ses voyages, sa valise) — et pour chacune QUATRE ÉTAPES, une par passage (une image du moteur, une à deux
 * minutes ; la dernière, sans moteur) :
 *   1. le centre, en largeur (1536 × 1024), dans le style de son décor (et, pour la télé et la terrasse, de son salon :
 *      la maison se tient) — une place libre au milieu, où sa figurine se pose à l'affichage ;
 *   2. la gauche : la toile prolongée — la bande de 512 colonnes du centre reprise, le reste à peindre (un masque) ;
 *   3. la droite : de même ;
 *   4. le panorama : les trois, assemblées en fondu (3584 × 1024).
 * Rangé dans `<h>/pieces/<pièce>/`. Refaire une étape efface ce qui en dépend (le centre : tout ; un côté : lui et le
 * panorama). Un verrou par pièce : un seul passage à la fois.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFicheMonde, lireFichePerso } from "./fiches-serveur";
import { depotDans, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

export const PIECES = ["salon", "tele", "terrasse"] as const;
export type Piece = (typeof PIECES)[number];
export const pieceValide = (x: unknown): Piece | null => PIECES.find((p) => p === x) ?? null;
export const ETAPES = ["centre", "gauche", "droite", "panorama"] as const;
export type Etape = (typeof ETAPES)[number];
/** La toile de chaque image, la bande reprise d'une image à l'autre, le fondu des raccords. */
export const LARGE = 1536;
export const HAUT = 1024;
const BANDE = 512;
const FONDU = 96;
/** Le panorama : la gauche, le centre, la droite, qui se chevauchent d'une bande. */
export const LARGEUR_PANORAMA = LARGE * 3 - BANDE * 2;

const dossier = (h: string, p: Piece) => `${h}/pieces/${p}`;
const fichier = (e: Etape) => (e === "panorama" ? "panorama.webp" : `${e}.png`);
const VERROU = "verrou.json";
const DUREE_VERROU = 6 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

// ─── les consignes ─────────────────────────────────────────────────────────────────────────────────
const SANS = "No people, no characters, no figurines, no animals, no text, no letters, no logos.";
const STYLE = "keep EXACTLY its art direction: the same 3D miniature diorama look, the same materials and textures, the same warm light, colour palette, level of detail and atmosphere";
const BORDS = "no frame, no border, no vignette";

type Plan = {
  /** Ce qu'est la pièce, le centre : ce qu'on y voit. */
  quoi: string;
  centre: string[];
  /** Ce que chaque côté prolonge (« the same wall, floor… »), et ce qu'on y trouve. */
  suite: string;
  gauche: string;
  droite: string;
  /** Une image d'une autre pièce, pour que la maison se tienne (si elle est faite). */
  voisine?: { piece: Piece; image: "centre" | "droite"; dit: string };
};
const PLANS: Record<Piece, Plan> = {
  salon: {
    quoi: "the LIVING ROOM of this same home, seen from inside, at eye level",
    centre: [
      "In the middle of the floor, leave a clear empty space (bare floor and a round rug, nothing on it): an armchair will be placed there later.",
      "Just to the right of that space: a small wooden side table with a vintage record player, a vinyl record on the platter, and a record sleeve leaning against the table.",
      "On the wall behind, at eye level: three framed photographs of landscapes, and two warm wall lamps.",
      "Cosy and lived-in, warm evening light.",
    ],
    suite: "the same wall, floor, rug, light and perspective",
    gauche: "a closed wooden door set in the wall (it leads to the TV room), a tall bookcase full of books, a green plant.",
    droite: "a large floor-to-ceiling glass bay window opening onto a wooden terrace with a sea view at sunset, a floor lamp, a wicker basket.",
  },
  tele: {
    quoi: "the TV ROOM of this same home, seen from inside, at eye level",
    centre: [
      "In the centre: a long low wooden TV cabinet with a large flat television on it, seen straight on. The television is switched off: its screen is plain, uniform dark glass with nothing on it (a film will be shown on it later).",
      "In front of the cabinet, leave the floor clear (a soft rug, nothing on it): an armchair will be placed there later.",
      "On one side: a deep cosy sofa with cushions and a plaid, turned towards the television, and a small side table with a lamp.",
      "Evening: warm lamps lit, cosy and lived-in.",
    ],
    suite: "the same wall, floor, rug, light and perspective",
    gauche: "shelves full of films and books, a reading armchair with a floor lamp, a green plant.",
    droite: "a closed wooden door set in the wall (it leads back to the living room), a small window showing the evening sky, a green plant.",
    voisine: { piece: "salon", image: "centre", dit: "the LIVING ROOM of this same home (the TV room is the next room): keep the same wood, walls, plants, materials and finish" },
  },
  terrasse: {
    quoi: "the TERRACE of this same home, outdoors, at eye level",
    centre: [
      "A wooden deck with a wooden railing; behind it, the sea and the coastline at sunset; string lights hanging above.",
      "In the middle of the deck, leave a clear empty space (bare deck, nothing on it): an armchair will be placed there later.",
      "Just to the right of that space: an easel holding a big world map pinned with a few coloured pins, and at its foot a vintage leather suitcase covered with travel stickers.",
    ],
    suite: "the same deck, railing, sea, sky, light and perspective",
    gauche: "the outside wall of the house with its large glass bay window doors (they lead back to the living room, warm light inside), potted plants.",
    droite: "a wooden lounge chair with a plaid, an olive tree in a large pot, lanterns, the coastline continuing.",
    voisine: { piece: "salon", image: "droite", dit: "this terrace seen from inside the living room, through its bay window: keep the same wooden deck, railing, sea, coast and sunset light" },
  },
};

/** 1. Le centre d'une pièce : d'après son décor (IMAGE 1) et, s'il y en a une, sa pièce voisine (IMAGE 2). */
export const consigneCentre = (p: Piece, voisine = false) =>
  [
    `IMAGE 1 is this person's home universe: ${STYLE}.`,
    ...(voisine && PLANS[p].voisine ? [`IMAGE 2 shows ${PLANS[p].voisine!.dit}.`] : []),
    `Create ${PLANS[p].quoi}, in a wide landscape frame. It is the central part of a panorama that will be continued on both sides, so the left and right edges simply continue the scene (${BORDS}).`,
    ...PLANS[p].centre,
    SANS,
  ].join("\n");
/** Ce qui est unique dans la pièce le reste : un seul soleil, une seule télé, une seule porte vers chaque pièce. */
export const UN_SEUL = "Never paint a second sun or moon, and never repeat a unique object that is already painted (the sun, a TV, a door, the easel): the whole panorama has only one of each.";
/** 2 et 3. Un côté : la toile prolongée (IMAGE 1, son masque), dans le style de son décor (IMAGE 2) et de sa voisine. */
export const consigneCote = (p: Piece, c: "gauche" | "droite", voisine = false) =>
  [
    `IMAGE 1 is part of a wide panorama of ${PLANS[p].quoi.split(",")[0]}: its ${c === "gauche" ? "right" : "left"} part is already painted, the rest is empty and must be painted.`,
    `Extend the scene to the ${c === "gauche" ? "LEFT" : "RIGHT"}, continuing ${PLANS[p].suite} seamlessly from the painted part, which stays exactly as it is.`,
    `On this new part: ${PLANS[p][c]}`,
    // (le 14 novembre 2026, la terrasse avait deux soleils : la droite en avait peint un second)
    UN_SEUL,
    `IMAGE 2 is the home universe this place belongs to: ${STYLE}.`,
    ...(voisine && PLANS[p].voisine ? [`IMAGE 3 shows ${PLANS[p].voisine!.dit}.`] : []),
    `The far edge simply continues the scene (${BORDS}).`,
    SANS,
  ].join("\n");

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────────
export type EtatPiece = {
  piece: Piece;
  /** Son univers a son décor (sinon, rien à faire). */
  decor: boolean;
  faites: Etape[];
  aFaire: Etape[];
  /** Les images faites, signées (une heure). */
  images: Partial<Record<Etape, string>>;
  /** Sa figurine assise (avec son fauteuil), signée : posée au milieu, à l'affichage. */
  figurine?: string;
  /** Un passage est en train. */
  enCours: boolean;
  /** Où en est chaque pièce (combien d'étapes faites, sur quatre). */
  pieces: Record<Piece, number>;
};

export async function etatDeLaPiece(supabase: Supabase, h: string, p: Piece): Promise<EtatPiece> {
  const listes = await Promise.all(PIECES.map((x) => depotDans(supabase, dossier(h, x)).lister().catch(() => [] as string[])));
  const noms = listes[PIECES.indexOf(p)];
  const [monde, perso] = await Promise.all([lireFicheMonde(supabase, h).catch(() => null), lireFichePerso(supabase, h).catch(() => ({ fiche: null }))]);
  const faites = ETAPES.filter((e) => noms.includes(fichier(e)));
  const images = Object.fromEntries(await Promise.all(faites.map(async (e) => [e, await signer(supabase, `${dossier(h, p)}/${fichier(e)}`)] as const)));
  const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  const enCours = noms.includes(VERROU) && Date.now() - (Number(json(await depotDans(supabase, dossier(h, p)).lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU;
  return {
    piece: p,
    decor: Boolean(monde?.references.decor),
    faites,
    aFaire: ETAPES.filter((e) => !faites.includes(e)),
    images,
    ...(assise ? { figurine: await signer(supabase, assise) } : {}),
    enCours,
    pieces: Object.fromEntries(PIECES.map((x, i) => [x, ETAPES.filter((e) => listes[i].includes(fichier(e))).length])) as Record<Piece, number>,
  };
}

// ─── les images ────────────────────────────────────────────────────────────────────────────────────
/** À la taille de la toile (le moteur peut rendre une autre taille). */
const aLaToile = (png: Buffer) => sharp(png).resize(LARGE, HAUT, { fit: "cover" }).png().toBuffer();

/** La toile d'un côté : la bande du centre, reprise contre le bord qui le touche ; le reste transparent (à peindre). */
export async function toileDeCote(centre: Buffer, c: "gauche" | "droite"): Promise<Buffer> {
  const plein = await sharp(await aLaToile(centre)).ensureAlpha().png().toBuffer();
  const bande = await sharp(plein).extract({ left: c === "gauche" ? 0 : LARGE - BANDE, top: 0, width: BANDE, height: HAUT }).png().toBuffer();
  return sharp({ create: { width: LARGE, height: HAUT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: bande, left: c === "gauche" ? LARGE - BANDE : 0, top: 0 }])
    .png()
    .toBuffer();
}

/** Le panorama : la gauche, la droite, puis le centre par-dessus, ses deux bords en fondu. */
export async function assembler(gauche: Buffer, centre: Buffer, droite: Buffer): Promise<Buffer> {
  const [g, c, d] = await Promise.all([aLaToile(gauche), aLaToile(centre), aLaToile(droite)]);
  const f = (FONDU / LARGE).toFixed(4);
  const degrade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGE}" height="${HAUT}"><defs><linearGradient id="f" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${f}" stop-color="#fff" stop-opacity="1"/><stop offset="${(1 - Number(f)).toFixed(4)}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${LARGE}" height="${HAUT}" fill="url(#f)"/></svg>`,
  );
  const centreFondu = await sharp(c).ensureAlpha().composite([{ input: degrade, blend: "dest-in" }]).png().toBuffer();
  return sharp({ create: { width: LARGEUR_PANORAMA, height: HAUT, channels: 3, background: { r: 20, g: 12, b: 8 } } })
    .composite([
      { input: g, left: 0, top: 0 },
      { input: d, left: LARGEUR_PANORAMA - LARGE, top: 0 },
      { input: centreFondu, left: LARGE - BANDE, top: 0 },
    ])
    .webp({ quality: 86 })
    .toBuffer();
}

/** 🛠️ Un passage dans une pièce : la prochaine étape qui manque (rien si tout est fait, ou si un autre passage est en train). */
export async function fabriquerLaPiece(supabase: Supabase, h: string, p: Piece, avant: number): Promise<{ fait?: Etape; erreur?: string }> {
  const d = depotDans(supabase, dossier(h, p));
  const noms = await d.lister().catch(() => [] as string[]);
  const etape = ETAPES.find((e) => !noms.includes(fichier(e)));
  if (!etape) return {};
  const chemin = s((await lireFicheMonde(supabase, h).catch(() => null))?.references.decor?.chemin);
  if (!chemin) return { erreur: "Crée d’abord ton univers (/univers/monde) : ta maison se fait dans son style." };
  if (etape !== "panorama" && !cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  if (noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU)).le) || 0) < DUREE_VERROU) return { erreur: "Un passage est déjà en train : patiente une minute." };
  // LE VERROU EST À NOUS ? Écrit, puis relu : de deux passages arrivés ensemble, seul le dernier écrit continue
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await d.lire(VERROU)).qui !== qui) return { erreur: "Un passage est déjà en train : patiente une minute." };
  try {
    if (etape === "panorama") {
      const [g, c, dr] = await Promise.all([d.lire("gauche.png"), d.lire("centre.png"), d.lire("droite.png")]);
      if (!g || !c || !dr) return { erreur: "Une des trois images est introuvable : refais-la." };
      await d.ecrire("panorama.webp", await assembler(g, c, dr), "image/webp");
      return { fait: etape };
    }
    const decor = await telecharger(supabase, chemin);
    if (!decor) return { erreur: "Le décor de ton univers est introuvable." };
    // (la pièce voisine, si elle est faite : la maison se tient)
    const v = PLANS[p].voisine;
    const voisine = v ? await depotDans(supabase, dossier(h, v.piece)).lire(fichier(v.image)).catch(() => null) : null;
    const commun = { transparent: false, avant, cle: cle(), base: base(), qualite: "high", taille: "1536x1024" as const };
    let r;
    if (etape === "centre") {
      // (une pièce nouvelle, dans son style : la fidélité basse laisse le moteur composer autre chose que son décor)
      r = await demanderUneImage({ ...commun, images: voisine ? [decor, voisine] : [decor], consigne: consigneCentre(p, Boolean(voisine)), fidelite: "low" });
    } else {
      const centre = await d.lire("centre.png");
      if (!centre) return { erreur: "Le centre est introuvable : refais-le." };
      const toile = await toileDeCote(centre, etape);
      r = await demanderUneImage({ ...commun, images: voisine ? [toile, decor, voisine] : [toile, decor], masque: toile, consigne: consigneCote(p, etape, Boolean(voisine)), fidelite: "high" });
    }
    if ("erreur" in r) return { erreur: r.erreur };
    await d.ecrire(fichier(etape), await aLaToile(r.png), "image/png");
    return { fait: etape };
  } finally {
    if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
  }
}

/** ↩️ Refaire une étape : elle, et ce qui en dépend (le centre : tout ; un côté : lui et le panorama). */
export async function refaireDeLaPiece(supabase: Supabase, h: string, p: Piece, etape: unknown): Promise<{ error?: string }> {
  const e = ETAPES.find((x) => x === etape);
  if (!e) return { error: "Quelle étape ?" };
  const d = depotDans(supabase, dossier(h, p));
  const aEffacer: Etape[] = e === "centre" ? [...ETAPES] : e === "panorama" ? ["panorama"] : [e, "panorama"];
  for (const x of aEffacer) await d.effacer(fichier(x)).catch(() => undefined);
  return {};
}
