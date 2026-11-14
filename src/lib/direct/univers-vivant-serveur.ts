/**
 * 🌟 SON UNIVERS, VIVANT — l'essai (14 novembre 2026). Le propriétaire, le matin même : « une jolie photo sans âme […]
 * mon univers doit donner l'impression d'être en vie, qu'il s'y passe quelque chose ». Les pièces ont leur photo
 * vivante (`pieces-vivantes-serveur.ts`) ; son univers aussi (Google, Gemini Omni Flash : quatre secondes en 720p,
 * environ 0,40 $) : son décor du moment (celui du mois, s'il est fait) devient une photo vivante — la
 * caméra immobile, seules les choses de sa pièce vivent (les flammes, les lampes, les plantes, l'eau, les nuages) ;
 * l'espace dégagé devant, où sa figurine est assise, ne bouge pas.
 *
 * Le décor est en 2:3, la vidéo en 9:16 : elle en reprend le milieu (864 colonnes sur 1024, les deux bords fixes) et se
 * pose dessus, ses bords fondus. Rangé dans `<h>/univers-vivant/` : video.json (la commande en cours), video.mp4, et
 * decor.json (le décor d'où elle vient : un autre décor — une retouche, le mois suivant —, elle ne se montre plus).
 * D'abord pour l'administrateur (la page d'essais) ; elle se montre ensuite dans « Ma maison » et à ses visiteurs.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFicheMonde } from "./fiches-serveur";
import { depotDans, signer, telecharger } from "./ma-figurine-serveur";
import { commanderUneVideoGoogle, moteurVideo, suivreChezGoogle, TAILLE_VIDEO, VUE } from "./pieces-vivantes-serveur";
import { decorDuMoment } from "./saison-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const dossier = (h: string) => `${h}/univers-vivant`;
const VERROU = "verrou.json";
const DUREE_VERROU = 3 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** La consigne : la photo vivante de son univers (la caméra immobile, l'espace devant vide et immobile). */
export const CONSIGNE_UNIVERS_VIVANT = [
  "A living photo: this exact image, gently brought to life.",
  "The camera does not move at all: a locked-off tripod shot, no zoom, no pan, no tilt. The place, every object, the light and the framing stay exactly as they are.",
  "Only the natural, ambient things of this place move, softly and continuously, in a calm loop: flames and lamp lights flicker gently, plants and leaves sway in a light breeze, water shimmers, clouds drift slowly, steam or smoke rises softly — whatever of these the image contains.",
  "Nothing appears and nothing disappears. No people, no characters, no text. The open space at the bottom in the middle stays empty and perfectly still. The last moment looks like the first one.",
  "Sound: only the soft ambience of the place — no voice, no dialogue, no music.",
].join("\n");

/** Le décor du moment (celui du mois, s'il est fait), et son chemin. */
async function decorActuel(supabase: Supabase, h: string): Promise<string> {
  const f = await lireFicheMonde(supabase, h).catch(() => null);
  if (!f?.references.decor) return "";
  const moment = await decorDuMoment(supabase, h, f).catch(() => ({ chemin: "", saison: false }));
  return s(moment.chemin) || f.references.decor.chemin;
}

/** Le milieu du décor (2:3 → 9:16), à la taille de la vidéo. */
export async function milieuDuDecor(decor: Buffer): Promise<Buffer> {
  // (deux passages : sharp ne redimensionne qu'une fois par passage, et découpe avant ou après ce redimensionnement)
  const entier = await sharp(decor).resize(1024, 1536, { fit: "cover" }).png().toBuffer();
  return sharp(entier)
    .extract({ left: (1024 - VUE.l) / 2, top: 0, width: VUE.l, height: VUE.h })
    .resize(TAILLE_VIDEO.l, TAILLE_VIDEO.h)
    .png()
    .toBuffer();
}

export type EtatUniversVivant = { univers: boolean; decor?: string; video?: string; enCours?: { depuis: string; progres?: number }; perimee?: boolean; moteur: boolean };

export async function etatUniversVivant(supabase: Supabase, h: string): Promise<EtatUniversVivant> {
  const chemin = await decorActuel(supabase, h);
  const moteur = moteurVideo() === "google";
  if (!chemin) return { univers: false, moteur };
  const d = depotDans(supabase, dossier(h));
  const noms = await d.lister().catch(() => [] as string[]);
  const [decor, commande, source] = await Promise.all([
    signer(supabase, chemin),
    noms.includes("video.json") ? d.lire("video.json").then(json).catch(() => ({}) as Record<string, unknown>) : Promise.resolve({} as Record<string, unknown>),
    noms.includes("decor.json") ? d.lire("decor.json").then(json).catch(() => ({}) as Record<string, unknown>) : Promise.resolve({} as Record<string, unknown>),
  ]);
  const faite = noms.includes("video.mp4");
  const aJour = faite && s(source.chemin) === chemin;
  return {
    univers: true,
    decor,
    moteur,
    ...(aJour ? { video: await signer(supabase, `${dossier(h)}/video.mp4`) } : {}),
    ...(faite && !aJour ? { perimee: true } : {}),
    ...(s(commande.id) ? { enCours: { depuis: s(commande.le), ...(typeof commande.progres === "number" ? { progres: commande.progres } : {}) } } : {}),
  };
}

/** 🌟 Pour « Ma maison » et ses visiteurs : la vidéo de son décor du moment, si elle est faite d'après lui (signée). */
export async function decorVivant(supabase: Supabase, h: string, cheminDuMoment: string): Promise<string> {
  const d = depotDans(supabase, dossier(h));
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("video.mp4") || !noms.includes("decor.json")) return "";
  const source = json(await d.lire("decor.json").catch(() => null));
  return s(source.chemin) && s(source.chemin) === cheminDuMoment ? signer(supabase, `${dossier(h)}/video.mp4`) : "";
}

/** 🛠️ Un passage : la commander (d'après son décor du moment), puis la suivre ; faite, la ranger. */
export async function fabriquerUniversVivant(supabase: Supabase, h: string): Promise<{ fait?: true; progres?: number; erreur?: string }> {
  if (moteurVideo() !== "google") return { erreur: "La vidéo se fait chez Google (Gemini Omni) : sa clé n’est pas branchée ici (GEMINI_VIDEO_API_KEY)." };
  const chemin = await decorActuel(supabase, h);
  if (!chemin) return { erreur: "Crée d’abord ton univers (/univers/monde)." };
  const d = depotDans(supabase, dossier(h));
  const noms = await d.lister().catch(() => [] as string[]);
  const source = noms.includes("decor.json") ? json(await d.lire("decor.json").catch(() => null)) : {};
  if (noms.includes("video.mp4") && s(source.chemin) === chemin) return {};
  if (noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU) return { erreur: "Un passage est déjà en train : patiente une minute." };
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await d.lire(VERROU)).qui !== qui) return { erreur: "Un passage est déjà en train : patiente une minute." };
  try {
    const commande = noms.includes("video.json") ? json(await d.lire("video.json").catch(() => null)) : {};
    // (une commande faite d'après un autre décor : on la laisse, on en refait une)
    if (!s(commande.id) || s(commande.decor) !== chemin) {
      const decor = await telecharger(supabase, chemin);
      if (!decor) return { erreur: "Le décor de ton univers est introuvable." };
      const c = await commanderUneVideoGoogle(CONSIGNE_UNIVERS_VIVANT, await milieuDuDecor(decor));
      if ("erreur" in c) return { erreur: c.erreur };
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ id: c.id, le: new Date().toISOString(), modele: c.modele, decor: chemin })), "application/json");
      return { progres: 0 };
    }
    const suite = await suivreChezGoogle(d, s(commande.id), s(commande.le));
    if ("erreur" in suite) return { erreur: suite.erreur };
    if ("progres" in suite) {
      await d.ecrire("video.json", Buffer.from(JSON.stringify({ ...commande, progres: suite.progres })), "application/json");
      return { progres: suite.progres };
    }
    await d.ecrire("decor.json", Buffer.from(JSON.stringify({ chemin, le: new Date().toISOString() })), "application/json");
    await d.effacer("video.json").catch(() => undefined);
    return { fait: true };
  } finally {
    if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
  }
}

/** ↩️ La refaire : tout s'efface (la vidéo, sa commande, son décor d'origine). */
export async function refaireUniversVivant(supabase: Supabase, h: string): Promise<void> {
  const d = depotDans(supabase, dossier(h));
  for (const x of ["video.json", "video.mp4", "decor.json"]) await d.effacer(x).catch(() => undefined);
}
