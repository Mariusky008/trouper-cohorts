/**
 * 🧍 LES POSES DE LA FIGURINE — L'ESSAI DE FABRICATION, P0 (`docs/univers/poses-figurine.md` ; `poses-figurine.ts`). Le
 * propriétaire, le 16 novembre 2026, après la maquette de la messagerie visuelle : « attaque aussi les figurines ».
 *
 * Sur la figurine de ce téléphone (sa figurine assise du nouveau style), une image par pose, détourée au plus près, faite
 * une fois, rangée à part : `poses-figurine/<empreinte>/` — `<pose>.png` et `avis.json`. L'empreinte est celle de l'image
 * d'origine : une nouvelle figurine (sa tenue du mois), de nouvelles poses.
 *
 * 1. « DEBOUT » D'ABORD, d'après la figurine assise (IMAGE 1) : le moteur invente une fois ses jambes et ses chaussures.
 * 2. LES AUTRES, d'après la figurine assise (le visage, la tenue) ET la pose debout (les jambes, les chaussures,
 *    l'échelle) ; le second pas, aussi d'après le premier (IMAGE 3), pour qu'ils s'enchaînent.
 *
 * Réservé à l'administrateur (la page d'essais). Rien ne se fait pour les habitants avant le verdict du propriétaire.
 *
 * FICHIER SERVEUR.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireFichePerso } from "./fiches-serveur";
import { depotDans, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { etatPiecesDuo, prendre, rendre } from "./pieces-duo-serveur";
import { AVIS_POSES, POSES_FIGURINE, avisPosesValide, poseFigurineDe, type AvisPoses, type EtatPosesFigurine, type PieceAVisiter, type PoseFigurine } from "./poses-figurine";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const empreinte = (chemin: string) => createHash("sha1").update(chemin).digest("hex").slice(0, 12);
const dossierDe = (chemin: string) => `poses-figurine/${empreinte(chemin)}`;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** Sa figurine assise du nouveau style (son chemin dans le seau), s'il en a une. */
async function figurineDe(supabase: Supabase, h: string): Promise<string> {
  const perso = await lireFichePerso(supabase, h).catch(() => ({ fiche: null }));
  return perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
}

/** Les mots qui reviennent dans chaque consigne : la même figurine, rien d'autre autour. */
const MEME =
  "Show EXACTLY the same figurine — the same face, the same hair, the same clothes, the same colors, the same materials, the same style and the same proportions (the same big head on the same small body)";
const RIEN_AUTOUR = "Nothing else: no chair, no furniture, no base, no floor, no shadow (not even a soft contact shadow), no text. Transparent background. The whole figurine visible, from the top of the head to the feet, centered, nothing cropped.";

/** 1. Debout, d'après la figurine assise dans son fauteuil (IMAGE 1). */
export const consigneDebout = () =>
  [
    "IMAGE 1 is a collectible figurine (big head, small body) seated in its own armchair.",
    `${MEME}, now ${poseFigurineDe("debout").en}, WITHOUT the armchair. Give it legs and shoes that match its outfit and its style, at the right length for its body.`,
    RIEN_AUTOUR,
  ].join("\n");

/** 2. Une autre pose, d'après la figurine assise (IMAGE 1) et la pose debout (IMAGE 2) ; le second pas, d'après le premier (IMAGE 3). */
export const consignePoseFigurine = (p: PoseFigurine) =>
  [
    "IMAGE 1 is a collectible figurine (big head, small body) seated in its own armchair: its face, its hair, its outfit.",
    "IMAGE 2 is the SAME figurine standing: its legs, its shoes, its size.",
    ...("apres" in poseFigurineDe(p) ? ["IMAGE 3 is the same figurine taking a step."] : []),
    `${MEME}, with the same legs and shoes as IMAGE 2, at the same size as IMAGE 2 — only its pose changes: ${poseFigurineDe(p).en}.`,
    RIEN_AUTOUR,
  ].join("\n");

/** L'état de l'essai : sa figurine, chaque pose (signée), les pièces du duo faites (vides) pour la scène, son avis. */
export async function etatPosesFigurine(supabase: Supabase, h: string): Promise<EtatPosesFigurine> {
  const chemin = await figurineDe(supabase, h);
  const d = chemin ? depotDans(supabase, dossierDe(chemin)) : null;
  const [noms, pieces] = await Promise.all([d ? d.lister().catch(() => [] as string[]) : Promise.resolve([] as string[]), etatPiecesDuo(supabase).catch(() => null)]);
  const poses = await Promise.all(
    POSES_FIGURINE.map(async (p) => ({
      cle: p.cle,
      nom: p.nom,
      emoji: p.emoji,
      ...(chemin && noms.includes(`${p.cle}.png`) ? { image: await signer(supabase, `${dossierDe(chemin)}/${p.cle}.png`) } : {}),
    })),
  );
  const avis = d && noms.includes("avis.json") ? json(await d.lire("avis.json").catch(() => null)) : {};
  const aVisiter: PieceAVisiter[] = (pieces?.pieces ?? [])
    .filter((p) => p.decor)
    .map((p) => ({ cle: p.cle, nom: p.nom, emoji: p.emoji, decor: p.decor!, ...(p.emplacements ? { emplacements: p.emplacements } : {}), ...(p.ajuste ? { ajuste: true } : {}) }));
  return {
    ...(chemin ? { figurine: await signer(supabase, chemin) } : {}),
    poses,
    pieces: aVisiter,
    ...(avisPosesValide(avis.avis) ? { avis: { avis: avis.avis, ...(s(avis.note) ? { note: s(avis.note) } : {}), le: s(avis.le) } } : {}),
    moteur: Boolean(cle()),
  };
}

/** Détourée au plus près (le bas de l'image, ce sont ses pieds : l'écran la pose sur le sol). */
async function auPlusPres(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .trim()
    .png()
    .toBuffer()
    .catch(() => sharp(png).png().toBuffer());
}

export const SANS_FIGURINE_NOUVELLE = "Ce téléphone n’a pas de figurine du nouveau style : fais-la d’abord (/univers/figurine).";

/**
 * 🛠️ Un passage, une image : la pose demandée, ou (sans pose) la prochaine qui manque, dans l'ordre (« debout »
 * d'abord). `fait` : la pose qui vient d'être faite ; rien quand tout est fait.
 */
export async function fabriquerPoseFigurine(supabase: Supabase, h: string, voulue: PoseFigurine | null, avant: number): Promise<{ fait?: PoseFigurine; erreur?: string }> {
  const chemin = await figurineDe(supabase, h);
  if (!chemin) return { erreur: SANS_FIGURINE_NOUVELLE };
  if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const d = depotDans(supabase, dossierDe(chemin));
  const noms = await d.lister().catch(() => [] as string[]);
  const faite = (p: PoseFigurine) => noms.includes(`${p}.png`);
  const pose = voulue ?? POSES_FIGURINE.find((p) => !faite(p.cle))?.cle;
  if (!pose || faite(pose)) return {};
  if (pose !== "debout" && !faite("debout")) return { erreur: "Fais d’abord sa pose « Debout » : les autres en viennent (ses jambes, ses chaussures)." };
  const apres = "apres" in poseFigurineDe(pose) ? (poseFigurineDe(pose) as { apres: PoseFigurine }).apres : null;
  if (apres && !faite(apres)) return { erreur: `Fais d’abord « ${poseFigurineDe(apres).nom} » : celle-ci la suit.` };
  const qui = await prendre(d);
  if (!qui) return { erreur: "Un passage est déjà en train : patiente une minute." };
  try {
    const figurine = await telecharger(supabase, chemin);
    if (!figurine) return { erreur: "Sa figurine est introuvable." };
    const images = [figurine];
    if (pose !== "debout") {
      const debout = await d.lire("debout.png").catch(() => null);
      if (!debout) return { erreur: "La pose « Debout » est introuvable : refais-la." };
      images.push(debout);
      if (apres) {
        const premier = await d.lire(`${apres}.png`).catch(() => null);
        if (!premier) return { erreur: `« ${poseFigurineDe(apres).nom} » est introuvable : refais-la.` };
        images.push(premier);
      }
    }
    const r = await demanderUneImage({
      images,
      consigne: pose === "debout" ? consigneDebout() : consignePoseFigurine(pose),
      transparent: true,
      fidelite: "high",
      avant,
      cle: cle(),
      base: base(),
      qualite: "high",
      taille: "1024x1536",
    });
    if ("erreur" in r) return { erreur: r.erreur };
    await d.ecrire(`${pose}.png`, await auPlusPres(r.png), "image/png");
    return { fait: pose };
  } finally {
    await rendre(d, qui);
  }
}

/** ↩️ Refaire une pose : elle seule s'efface (les autres restent, faites d'après l'ancienne). */
export async function refairePoseFigurine(supabase: Supabase, h: string, pose: PoseFigurine): Promise<void> {
  const chemin = await figurineDe(supabase, h);
  if (chemin) await depotDans(supabase, dossierDe(chemin)).effacer(`${pose}.png`).catch(() => undefined);
}

/** Son avis : se ressemble-t-elle d'une pose à l'autre ? Et un mot. */
export async function avisPosesFigurine(supabase: Supabase, h: string, avis: unknown, note: unknown): Promise<{ erreur?: string }> {
  const chemin = await figurineDe(supabase, h);
  if (!chemin) return { erreur: SANS_FIGURINE_NOUVELLE };
  if (!avisPosesValide(avis)) return { erreur: `Ton avis : ${AVIS_POSES.map((a) => `« ${a.dit} »`).join(", ")}.` };
  const mot = s(note).slice(0, 600);
  const corps: { avis: AvisPoses; note?: string; le: string } = { avis, ...(mot ? { note: mot } : {}), le: new Date().toISOString() };
  await depotDans(supabase, dossierDe(chemin)).ecrire("avis.json", Buffer.from(JSON.stringify(corps)), "application/json");
  return {};
}
