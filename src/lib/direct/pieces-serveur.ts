/**
 * 🏠 LES PIÈCES EN PANORAMA — L'ESSAI DU SALON (14 novembre 2026, le propriétaire : « on est dans ta maison, à hauteur
 * d'yeux ; on commence dans le salon, moi assis dans mon fauteuil ; on regarde à gauche ou à droite en glissant ; il y a
 * une porte, on la touche, elle s'ouvre… Chaque pièce est une image très large, dans le style de mon univers » ; la
 * maquette « Chez toi en panorama », puis : « fabriquer une vraie pièce, le salon, dans le style de mon univers, pour
 * juger sur pièce »). Réservé à l'administrateur (`/admin/humain/univers-essais`), sur SON univers (son cookie
 * d'habitant).
 *
 * QUATRE ÉTAPES, UNE PAR PASSAGE (une image du moteur, une à deux minutes ; la dernière, sans moteur) :
 *   1. le centre : le salon, en largeur (1536 × 1024), dans le style de son décor — une place libre au milieu, où sa
 *      figurine assise (avec son fauteuil) se pose à l'affichage ; la platine, les cadres ;
 *   2. la gauche : la toile prolongée — ses 512 premières colonnes reprises à droite, le reste à peindre (un masque) :
 *      la porte de la pièce télé, la bibliothèque ;
 *   3. la droite : de même — la baie vitrée sur la terrasse ;
 *   4. le panorama : les trois, assemblées en fondu (3584 × 1024).
 * Rangé dans `<h>/pieces/salon/`. Refaire une étape efface ce qui en dépend (le centre : tout ; un côté : lui et le
 * panorama). Un verrou : un seul passage à la fois.
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

export const ETAPES_SALON = ["centre", "gauche", "droite", "panorama"] as const;
export type EtapeSalon = (typeof ETAPES_SALON)[number];
/** La toile de chaque image, la bande reprise d'une image à l'autre, le fondu des raccords. */
export const LARGE = 1536;
export const HAUT = 1024;
const BANDE = 512;
const FONDU = 96;
/** Le panorama : la gauche, le centre, la droite, qui se chevauchent d'une bande. */
export const LARGEUR_PANORAMA = LARGE * 3 - BANDE * 2;
/** Où se pose sa figurine (le milieu du centre), en fraction de la largeur du panorama. */
export const PLACE_FIGURINE = (LARGE - BANDE + LARGE / 2) / LARGEUR_PANORAMA;

const dossier = (h: string) => `${h}/pieces/salon`;
const fichier = (e: EtapeSalon) => (e === "panorama" ? "panorama.webp" : `${e}.png`);
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
/** 1. Le centre : le salon, d'après son décor (IMAGE 1). */
export const consigneSalonCentre = () =>
  [
    `IMAGE 1 is this person's home universe: ${STYLE}.`,
    "Create the LIVING ROOM of this same home, seen from inside, at eye level, in a wide landscape frame. It is the central part of a panorama that will be continued on both sides, so the left and right edges simply continue the wall and the floor (no frame, no border, no vignette).",
    "In the middle of the floor, leave a clear empty space (bare floor and a round rug, nothing on it): an armchair will be placed there later.",
    "Just to the right of that space: a small wooden side table with a vintage record player, a vinyl record on the platter, and a record sleeve leaning against the table.",
    "On the wall behind, at eye level: three framed photographs of landscapes, and two warm wall lamps.",
    "Cosy and lived-in, warm evening light.",
    SANS,
  ].join("\n");
/** 2 et 3. Un côté : la toile prolongée (IMAGE 1, son masque), dans le style de son décor (IMAGE 2). */
export const consigneSalonCote = (c: "gauche" | "droite") =>
  [
    `IMAGE 1 is part of a wide panorama of a living room: its ${c === "gauche" ? "right" : "left"} part is already painted, the rest is empty and must be painted.`,
    `Extend the room to the ${c === "gauche" ? "LEFT" : "RIGHT"}, continuing the same wall, floor, rug, light and perspective seamlessly from the painted part, which stays exactly as it is.`,
    c === "gauche"
      ? "On this new part: a closed wooden door set in the wall (it leads to the TV room), a tall bookcase full of books, a green plant."
      : "On this new part: a large floor-to-ceiling glass bay window opening onto a wooden terrace with a sea view at sunset, a floor lamp, a wicker basket.",
    `IMAGE 2 is the home universe this room belongs to: ${STYLE}.`,
    "The far edge simply continues the wall and the floor (no frame, no border, no vignette).",
    SANS,
  ].join("\n");

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────────
export type EtatSalon = {
  /** Son univers a son décor (sinon, rien à faire). */
  decor: boolean;
  faites: EtapeSalon[];
  aFaire: EtapeSalon[];
  /** Les images faites, signées (une heure). */
  images: Partial<Record<EtapeSalon, string>>;
  /** Sa figurine assise (avec son fauteuil), signée : posée au milieu du centre, à l'affichage. */
  figurine?: string;
  /** Un passage est en train. */
  enCours: boolean;
};

export async function etatDuSalon(supabase: Supabase, h: string): Promise<EtatSalon> {
  const d = depotDans(supabase, dossier(h));
  const [noms, monde, perso] = await Promise.all([d.lister().catch(() => [] as string[]), lireFicheMonde(supabase, h).catch(() => null), lireFichePerso(supabase, h).catch(() => ({ fiche: null }))]);
  const faites = ETAPES_SALON.filter((e) => noms.includes(fichier(e)));
  const images = Object.fromEntries(await Promise.all(faites.map(async (e) => [e, await signer(supabase, `${dossier(h)}/${fichier(e)}`)] as const)));
  const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  const enCours = noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU;
  return {
    decor: Boolean(monde?.references.decor),
    faites,
    aFaire: ETAPES_SALON.filter((e) => !faites.includes(e)),
    images,
    ...(assise ? { figurine: await signer(supabase, assise) } : {}),
    enCours,
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

/** 🛠️ Un passage : la prochaine étape qui manque (rien si tout est fait, ou si un autre passage est en train). */
export async function fabriquerLeSalon(supabase: Supabase, h: string, avant: number): Promise<{ fait?: EtapeSalon; erreur?: string }> {
  const d = depotDans(supabase, dossier(h));
  const noms = await d.lister().catch(() => [] as string[]);
  const etape = ETAPES_SALON.find((e) => !noms.includes(fichier(e)));
  if (!etape) return {};
  const chemin = s((await lireFicheMonde(supabase, h).catch(() => null))?.references.decor?.chemin);
  if (!chemin) return { erreur: "Crée d’abord ton univers (/univers/monde) : le salon se fait dans son style." };
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
    const commun = { transparent: false, avant, cle: cle(), base: base(), qualite: "high", taille: "1536x1024" as const };
    let r;
    if (etape === "centre") {
      // (une pièce nouvelle, dans son style : la fidélité basse laisse le moteur composer autre chose que son décor)
      r = await demanderUneImage({ ...commun, images: [decor], consigne: consigneSalonCentre(), fidelite: "low" });
    } else {
      const centre = await d.lire("centre.png");
      if (!centre) return { erreur: "Le centre est introuvable : refais-le." };
      const toile = await toileDeCote(centre, etape);
      r = await demanderUneImage({ ...commun, images: [toile, decor], masque: toile, consigne: consigneSalonCote(etape), fidelite: "high" });
    }
    if ("erreur" in r) return { erreur: r.erreur };
    await d.ecrire(fichier(etape), await aLaToile(r.png), "image/png");
    return { fait: etape };
  } finally {
    if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
  }
}

/** ↩️ Refaire une étape : elle, et ce qui en dépend (le centre : tout ; un côté : lui et le panorama). */
export async function refaireDuSalon(supabase: Supabase, h: string, etape: unknown): Promise<{ error?: string }> {
  const e = ETAPES_SALON.find((x) => x === etape);
  if (!e) return { error: "Quelle étape ?" };
  const d = depotDans(supabase, dossier(h));
  const aEffacer: EtapeSalon[] = e === "centre" ? [...ETAPES_SALON] : e === "panorama" ? ["panorama"] : [e, "panorama"];
  for (const x of aEffacer) await d.effacer(fichier(x)).catch(() => undefined);
  return {};
}
