/**
 * 🎨 LES AMBIANCES DE SON UNIVERS, CÔTÉ SERVEUR — l'essai (`ambiances.ts` pour les ambiances et ce que Pablito propose).
 * Réservé à l'administrateur (`/admin/humain/univers-essais`), sur SON univers.
 *
 * Son monde (la fiche de son univers : le lieu imaginé, ses éléments) est réinterprété dans chaque ambiance : une image
 * du moteur par ambiance (1024 × 1536, une à deux minutes, sans figurine), rangée dans `<h>/ambiances/<ambiance>.webp`.
 * 🛋️ Cosy, c'est son décor d'aujourd'hui (« Film, chaleureux ») : rien à refaire. Un verrou : une image à la fois.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { AMBIANCES, ambianceDe, proposerAmbiance, type Ambiance, type ProposeeAmbiance } from "./ambiances";
import { lireFicheMonde, lireFichePerso } from "./fiches-serveur";
import { depotDans, signer } from "./ma-figurine-serveur";
import { consigneDecorDuMonde } from "./monde-consignes";
import { demanderUneImage } from "./moteur-images-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

const dossier = (h: string) => `${h}/ambiances`;
const fichier = (a: Ambiance) => `${a}.webp`;
const VERROU = "verrou.json";
const DUREE_VERROU = 5 * 60_000;
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

export type EtatAmbiances = {
  /** Son univers a sa fiche et son décor (sinon, rien à réinterpréter). */
  univers: boolean;
  proposee: ProposeeAmbiance;
  /** Les images faites, signées (cosy : son décor d'aujourd'hui). */
  images: Partial<Record<Ambiance, string>>;
  aFaire: Ambiance[];
  figurine?: string;
  enCours: boolean;
};

export async function etatDesAmbiances(supabase: Supabase, h: string): Promise<EtatAmbiances> {
  const d = depotDans(supabase, dossier(h));
  const [monde, perso, noms] = await Promise.all([lireFicheMonde(supabase, h).catch(() => null), lireFichePerso(supabase, h).catch(() => ({ fiche: null })), d.lister().catch(() => [] as string[])]);
  const decor = s(monde?.references.decor?.chemin);
  const proposee = proposerAmbiance(monde, s(perso.fiche?.traits?.age));
  const images: Partial<Record<Ambiance, string>> = {};
  if (decor) images.cosy = await signer(supabase, decor);
  for (const a of AMBIANCES) if (a.cle !== "cosy" && noms.includes(fichier(a.cle))) images[a.cle] = await signer(supabase, `${dossier(h)}/${fichier(a.cle)}`);
  const assise = perso.fiche?.style === "collection-1" ? s(perso.fiche.references.assise?.chemin) : "";
  // (ce qui reste à faire : celle que Pablito propose d'abord)
  const ordre = [proposee.ambiance, ...AMBIANCES.map((a) => a.cle).filter((a) => a !== proposee.ambiance)];
  return {
    univers: Boolean(monde && decor),
    proposee,
    images,
    aFaire: ordre.filter((a) => !images[a]),
    ...(assise ? { figurine: await signer(supabase, assise) } : {}),
    enCours: noms.includes(VERROU) && Date.now() - (Number(json(await d.lire(VERROU).catch(() => null)).le) || 0) < DUREE_VERROU,
  };
}

/** 🛠️ Une ambiance : son monde réinterprété (la prochaine qui manque, si aucune n'est demandée). */
export async function fabriquerUneAmbiance(supabase: Supabase, h: string, demandee: Ambiance | null, avant: number): Promise<{ fait?: Ambiance; erreur?: string }> {
  const etat = await etatDesAmbiances(supabase, h);
  if (!etat.univers) return { erreur: "Crée d’abord ton univers (/univers/monde) : ses ambiances le réinterprètent." };
  const a = demandee ?? etat.aFaire[0];
  if (!a || etat.images[a]) return {};
  if (!cle()) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const d = depotDans(supabase, dossier(h));
  if (etat.enCours) return { erreur: "Une ambiance se fait déjà : patiente une minute." };
  // LE VERROU EST À NOUS ? Écrit, puis relu : de deux passages arrivés ensemble, seul le dernier écrit continue
  const qui = randomUUID();
  await d.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await d.lire(VERROU)).qui !== qui) return { erreur: "Une ambiance se fait déjà : patiente une minute." };
  try {
    const monde = await lireFicheMonde(supabase, h);
    if (!monde) return { erreur: "La fiche de ton univers est introuvable." };
    const amb = ambianceDe(a);
    const r = await demanderUneImage({ images: [], consigne: consigneDecorDuMonde(monde, { style: amb.style, lieu: amb.lieu }), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
    if ("erreur" in r) return { erreur: r.erreur };
    await d.ecrire(fichier(a), await sharp(r.png).resize(1024, 1536, { fit: "cover" }).webp({ quality: 88 }).toBuffer(), "image/webp");
    return { fait: a };
  } finally {
    if (json(await d.lire(VERROU).catch(() => null)).qui === qui) await d.effacer(VERROU).catch(() => undefined);
  }
}

/** ↩️ Refaire une ambiance (cosy, son décor d'aujourd'hui, ne s'efface pas d'ici). */
export async function refaireUneAmbiance(supabase: Supabase, h: string, a: Ambiance | null): Promise<{ error?: string }> {
  if (!a || a === "cosy") return { error: "Quelle ambiance ?" };
  await depotDans(supabase, dossier(h)).effacer(fichier(a)).catch(() => undefined);
  return {};
}
