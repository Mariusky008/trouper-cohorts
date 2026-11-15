/**
 * 🐾 LE COMPAGNON — L'ESSAI DE FABRICATION, LOT C0 (`docs/univers/compagnon.md`, 15 novembre 2026 ; le propriétaire :
 * « commence directement par lancer C0 le chat »). Le catalogue est le même pour tous, fabriqué une fois, rangé à part
 * de chaque habitant : `compagnons/<espèce>/` — son image de référence (`reference.png`, détourée), puis, par boucle,
 * `<boucle>/pose.png` (la pose, détourée), `<boucle>/video.json` (la commande en cours) et `<boucle>/video.mp4`.
 *
 * 1. L'IMAGE DE RÉFÉRENCE : l'animal, un petit jouet en vinyle dans le style des figurines — d'après la figurine assise
 *    de l'administrateur (IMAGE 1), pour qu'il soit de la même famille ; le fond retiré.
 * 2. PAR BOUCLE, LA POSE : le même animal, une autre pose (assis, couché, sur les genoux…), d'après la référence.
 * 3. PAR BOUCLE, LE MOUVEMENT : la pose posée sur un fond vert uni (720 × 1280), commandée au moteur vidéo de Google
 *    (`commanderUneVideoGoogle` : la première et la dernière image sont la pose — une boucle sans couture) ; suivie, puis
 *    rangée. Le vert est retiré dans le téléphone, au moment de jouer (`app/univers/compagnon-vivant.tsx`) : ni ffmpeg
 *    ni format à transparence (qu'un iPhone ne lit pas en WebM, et qui ne se fabrique en HEVC que sur un Mac).
 *
 * Réservé à l'administrateur (la page d'essais). Rien ne se fait pour les habitants avant le verdict du propriétaire.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { BOUCLES, ESPECES, type Boucle, type BoucleVue, type Espece, type EtatCompagnonEssai } from "./compagnons";
import { lireFicheMonde, lireFichePerso } from "./fiches-serveur";
import { depotDans, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { commanderUneVideoGoogle, moteurVideo, suivreChezGoogle, TAILLE_VIDEO } from "./pieces-vivantes-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const dossier = (e: Espece) => `compagnons/${e}`;
const dossierBoucle = (e: Espece, b: Boucle) => `compagnons/${e}/${b}`;
const VERROU = "verrou.json";
const DUREE_VERROU = 3 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};
const especeDe = (e: Espece) => ESPECES.find((x) => x.cle === e)!;
const boucleDe = (b: Boucle) => BOUCLES.find((x) => x.cle === b)!;

/** 1. L'image de référence : l'animal en jouet de vinyle, dans le style de la figurine (IMAGE 1) s'il y en a une. */
export const consigneReference = (e: Espece, avecFigurine: boolean) =>
  [
    avecFigurine
      ? `Create a small companion pet for the character of IMAGE 1: ${especeDe(e).en}, as a small collectible vinyl toy in EXACTLY the same style as IMAGE 1 — the same material and finish, the same soft studio lighting, the same level of detail.`
      : `Create a small companion pet: ${especeDe(e).en}, as a small collectible vinyl toy, like a character from a premium 3D animated film.`,
    "A big round head, big shiny eyes with highlights, rosy cheeks: cute and expressive, small enough to sit on a lap.",
    "Show the WHOLE animal, sitting upright and facing us, centered, nothing cropped, with some empty space around it.",
    "Plain uniform background. Nothing else in the image: no character, no furniture, no floor, no shadow, no text.",
  ].join("\n");

/** 2. Une pose : le même animal (IMAGE 1), seule sa pose change. */
export const consignePose = (b: Boucle) =>
  [
    "IMAGE 1 is a small vinyl toy animal. Show EXACTLY the same animal — the same design, colors, proportions, materials, eyes and face — only its pose changes:",
    `${boucleDe(b).pose}.`,
    "The whole animal, centered, nothing cropped, at the same size as in IMAGE 1. Plain uniform background: no floor, no shadow (not even a soft contact shadow under it), nothing else, no text.",
  ].join("\n");

/** 3. Le mouvement : une boucle sans couture, sur un fond vert uni, la caméra immobile. */
export const consigneBoucle = (b: Boucle) =>
  [
    "A short seamless loop of this exact little vinyl toy animal, on a perfectly uniform pure green background (a chroma-key green screen).",
    "The camera does not move at all: a locked-off tripod shot, no zoom, no pan, no tilt.",
    `The animal stays whole and fully inside the frame, at the same size: ${boucleDe(b).mouvement}.`,
    "Its look never changes: the same design, colors, eyes and materials as in the image, in every frame.",
    "The background stays perfectly flat, uniform pure green in every frame, right up to the animal's outline: no shadow under or around it, no floor, no ground plane, no vignette, no gradient, no light change; nothing appears and nothing disappears. No people, no text.",
    "The last moment looks exactly like the first one.",
    "Sound: only the soft natural sounds of the animal — no voice, no music.",
  ].join("\n");

/**
 * La pose (détourée), posée sur le fond vert de la vidéo (720 × 1280) : au milieu, un peu bas — de la place pour sauter.
 * (15 novembre 2026, le propriétaire : « parfois il y a le détourage vert kaki autour du chat ») : ce qui est à demi
 * transparent dans la pose — l'ombre douce sous l'animal, le flou de ses bords — devient transparent ou plein, avant
 * d'être posé sur le vert : sinon il se mêle au vert (une ombre kaki sous lui, un liseré autour) et le moteur vidéo le
 * garde.
 */
export async function surFondVert(pose: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(pose).ensureAlpha().resize(560, 700, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] < 150 ? 0 : 255;
  const animal = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const m = await sharp(animal).metadata();
  const l = m.width ?? 560;
  const h = m.height ?? 700;
  return sharp({ create: { width: TAILLE_VIDEO.l, height: TAILLE_VIDEO.h, channels: 3, background: { r: 0, g: 255, b: 0 } } })
    .composite([{ input: animal, left: Math.round((TAILLE_VIDEO.l - l) / 2), top: Math.max(0, 1060 - h) }])
    .png()
    .toBuffer();
}

/** L'état de l'essai : la référence, chaque boucle (sa pose, sa vidéo, sa commande) ; ton décor et ta figurine, pour l'aperçu. */
export async function etatCompagnonEssai(supabase: Supabase, h: string, e: Espece): Promise<EtatCompagnonEssai> {
  const [racine, listes, monde, perso] = await Promise.all([
    depotDans(supabase, dossier(e)).lister().catch(() => [] as string[]),
    Promise.all(BOUCLES.map((b) => depotDans(supabase, dossierBoucle(e, b.cle)).lister().catch(() => [] as string[]))),
    lireFicheMonde(supabase, h).catch(() => null),
    lireFichePerso(supabase, h).catch(() => ({ fiche: null })),
  ]);
  const boucles: BoucleVue[] = await Promise.all(
    BOUCLES.map(async (b, i) => {
      const noms = listes[i];
      const commande = noms.includes("video.json") ? json(await depotDans(supabase, dossierBoucle(e, b.cle)).lire("video.json").catch(() => null)) : {};
      return {
        cle: b.cle,
        nom: b.nom,
        ...(noms.includes("pose.png") ? { pose: await signer(supabase, `${dossierBoucle(e, b.cle)}/pose.png`) } : {}),
        ...(noms.includes("video.mp4") ? { video: await signer(supabase, `${dossierBoucle(e, b.cle)}/video.mp4`) } : {}),
        ...(noms.includes("son.json") ? await sonDe(supabase, e, b.cle) : {}),
        ...(!noms.includes("video.mp4") && s(commande.id) ? { enCours: { depuis: s(commande.le), ...(typeof commande.progres === "number" ? { progres: commande.progres } : {}) } } : {}),
      };
    }),
  );
  const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  const decor = s(monde?.references.decor?.chemin);
  const hote = monde?.scene?.places?.find((p) => p.id === "hote");
  return {
    espece: e,
    ...(racine.includes("reference.png") ? { reference: await signer(supabase, `${dossier(e)}/reference.png`) } : {}),
    boucles,
    ...(decor ? { decor: await signer(supabase, decor) } : {}),
    ...(assise ? { figurine: await signer(supabase, assise) } : {}),
    ...(hote ? { place: { x: hote.x, y: hote.y, echelle: hote.echelle || 1 } } : {}),
    moteurs: { image: Boolean(cle()), video: moteurVideo() === "google" },
  };
}

/** Le verrou d'un dossier : de deux passages arrivés ensemble, seul le dernier qui a écrit continue. */
async function prendre(d: ReturnType<typeof depotDans>): Promise<string | null> {
  if ((await d.lister().catch(() => [] as string[])).includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU) return null;
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  return json(await d.lire(VERROU).catch(() => null)).qui === qui ? qui : null;
}
async function rendre(d: ReturnType<typeof depotDans>, qui: string) {
  if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
}
const OCCUPE = { erreur: "Un passage est déjà en train : patiente une minute." };

/**
 * 🛠️ Un passage : `reference` — son image de référence ; une boucle — sa pose, puis sa vidéo (commandée, puis suivie aux
 * passages suivants). `fait` : ce qui vient d'être fait ; `progres` : la vidéo est en train.
 */
export async function fabriquerCompagnon(supabase: Supabase, h: string, e: Espece, cible: "reference" | Boucle, avant: number): Promise<{ fait?: "reference" | "pose" | "video"; progres?: number; erreur?: string }> {
  const racine = depotDans(supabase, dossier(e));
  if (cible === "reference") {
    if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
    if ((await racine.lister().catch(() => [] as string[])).includes("reference.png")) return {};
    const qui = await prendre(racine);
    if (!qui) return OCCUPE;
    try {
      const perso = await lireFichePerso(supabase, h).catch(() => ({ fiche: null }));
      const chemin = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
      const figurine = chemin ? await telecharger(supabase, chemin) : null;
      const r = await demanderUneImage({ images: figurine ? [figurine] : [], consigne: consigneReference(e, Boolean(figurine)), transparent: true, fidelite: "low", avant, cle: cle(), base: base(), qualite: "high", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      await racine.ecrire("reference.png", r.png, "image/png");
      return { fait: "reference" };
    } finally {
      await rendre(racine, qui);
    }
  }
  const d = depotDans(supabase, dossierBoucle(e, cible));
  const noms = await d.lister().catch(() => [] as string[]);
  if (noms.includes("video.mp4")) return {};
  const qui = await prendre(d);
  if (!qui) return OCCUPE;
  try {
    // 2. la pose
    if (!noms.includes("pose.png")) {
      if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
      const reference = await racine.lire("reference.png").catch(() => null);
      if (!reference) return { erreur: "Fais d’abord son image de référence." };
      const r = await demanderUneImage({ images: [reference], consigne: consignePose(cible), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium", taille: "1024x1536" });
      if ("erreur" in r) return { erreur: r.erreur };
      await d.ecrire("pose.png", r.png, "image/png");
      return { fait: "pose" };
    }
    // 3. le mouvement : commandé, puis suivi
    if (moteurVideo() !== "google") return { erreur: "La vidéo se fait chez Google (Gemini Omni) : sa clé n’est pas branchée ici (GEMINI_VIDEO_API_KEY)." };
    const commande = noms.includes("video.json") ? json(await d.lire("video.json").catch(() => null)) : {};
    if (!s(commande.id)) {
      const pose = await d.lire("pose.png").catch(() => null);
      if (!pose) return { erreur: "La pose est introuvable : refais-la." };
      const c = await commanderUneVideoGoogle(consigneBoucle(cible), await surFondVert(pose));
      if ("erreur" in c) return { erreur: c.erreur };
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ id: c.id, le: new Date().toISOString(), modele: c.modele })), "application/json");
      return { progres: 0 };
    }
    const suite = await suivreChezGoogle(d, s(commande.id), s(commande.le));
    if ("erreur" in suite) return { erreur: suite.erreur };
    if ("progres" in suite) {
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ ...commande, progres: suite.progres })), "application/json");
      return { progres: suite.progres };
    }
    await d.effacer("video.json").catch(() => undefined);
    return { fait: "video" };
  } finally {
    await rendre(d, qui);
  }
}

/**
 * ↩️ Refaire : `reference` — tout s'efface (les poses viennent d'elle) ; une boucle, `etape: "video"` — sa vidéo seule ;
 * `etape: "pose"` — sa pose et sa vidéo.
 */
export async function refaireCompagnon(supabase: Supabase, e: Espece, cible: "reference" | Boucle, etape: "pose" | "video" = "pose"): Promise<void> {
  const effacer = async (d: ReturnType<typeof depotDans>, noms: string[]) => {
    for (const n of noms) await d.effacer(n).catch(() => undefined);
  };
  if (cible === "reference") {
    await effacer(depotDans(supabase, dossier(e)), ["reference.png"]);
    for (const b of BOUCLES) await effacer(depotDans(supabase, dossierBoucle(e, b.cle)), ["pose.png", "video.json", "video.mp4"]);
    return;
  }
  await effacer(depotDans(supabase, dossierBoucle(e, cible)), etape === "video" ? ["video.json", "video.mp4"] : ["pose.png", "video.json", "video.mp4"]);
}

// ─── 🔊 son vrai son (15 novembre 2026 : « sur les genoux, il faudrait qu'on l'entende ronronner ») ──────────────────
/**
 * Le cahier (4.4) : « un vrai bruitage enregistré, choisi et validé par le propriétaire — rien n'est fabriqué par une
 * IA ». L'administrateur dépose l'enregistrement d'une boucle (un ronronnement pour « sur les genoux »), joué doucement,
 * en boucle, avec elle : `<boucle>/son.<ext>` et `<boucle>/son.json` = { fichier, type, le }.
 */
export const SON = { max: 2_500_000, types: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"] } as const;
const extensionDe = (type: string) => ({ "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/webm": "webm" })[type] ?? "mp3";

async function sonDe(supabase: Supabase, e: Espece, b: Boucle): Promise<{ son?: string }> {
  const d = depotDans(supabase, dossierBoucle(e, b));
  const f = json(await d.lire("son.json").catch(() => null));
  return s(f.fichier) ? { son: await signer(supabase, `${dossierBoucle(e, b)}/${s(f.fichier)}`) } : {};
}

/** 🔊 Il dépose le son d'une boucle (`donnees` : le fichier en base64), ou l'enlève (`donnees` vide). */
export async function deposerSonCompagnon(supabase: Supabase, e: Espece, b: Boucle, type: unknown, donnees: unknown): Promise<{ erreur?: string }> {
  const d = depotDans(supabase, dossierBoucle(e, b));
  const avant = json(await d.lire("son.json").catch(() => null));
  if (!s(donnees)) {
    if (s(avant.fichier)) await d.effacer(s(avant.fichier)).catch(() => undefined);
    await d.effacer("son.json").catch(() => undefined);
    return {};
  }
  const t = s(type).toLowerCase().split(";")[0];
  if (!(SON.types as readonly string[]).includes(t)) return { erreur: "Ce fichier n’est pas un son (mp3, m4a, wav, ogg)." };
  const octets = Buffer.from(s(donnees), "base64");
  if (!octets.length || octets.length > SON.max) return { erreur: "Le son est trop lourd : 2,5 Mo au plus (quelques secondes suffisent)." };
  const fichier = `son.${extensionDe(t)}`;
  if (s(avant.fichier) && s(avant.fichier) !== fichier) await d.effacer(s(avant.fichier)).catch(() => undefined);
  await d.ecrire(fichier, octets, t);
  await d.ecrire("son.json", Buffer.from(JSON.stringify({ fichier, type: t, le: new Date().toISOString() })), "application/json");
  return {};
}
