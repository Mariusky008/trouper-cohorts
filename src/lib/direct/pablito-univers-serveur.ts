/**
 * 🧑 PABLITO AU NOUVEAU STYLE — la bascule « Univers pour tous » (le propriétaire, le 12 novembre 2026 : « Pablito au
 * nouveau style : OUI »). Pablito, c'est la figurine du propriétaire (`guide.ts`) : au nouveau style, c'est SA figurine
 * assise, celle qu'il a faite et validée à `/univers/figurine`. Il l'adopte d'un toucher depuis l'admin
 * (`/admin/humain/univers-essais`, « Pablito au nouveau style ») : ses deux images assises (bouche fermée, bouche ouverte)
 * deviennent celles de Pablito, et ses visages du nouveau style déjà faits sont repris. L'adopter de nouveau (une autre
 * figurine) efface les visages et les tenues de la précédente.
 *
 * CE QUI MANQUE SE FAIT UNE FOIS, à la première demande, après la réponse (comme aujourd'hui, `guide-serveur.ts`) : ses
 * visages (au nouveau style, sur son image assise), sa grimace (il louche), ses tenues d'édition (la même figurine, dans
 * son fauteuil, habillée du thème) ; une image par passage, sous un verrou ; trois refus, et elle n'est plus redemandée.
 * En attendant : sa figurine assise de tous les jours. Une trentaine d'images en tout, pour toujours (environ 1 €).
 *
 * Servi par `/api/direct/guide/<nom>` quand l'interrupteur est allumé ET qu'il est adopté ; sinon, le Pablito
 * d'aujourd'hui.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { EDITIONS_DATEES } from "./collection";
import { lireFichePerso } from "./fiches-serveur";
import { TENUES_EDITION } from "./figurine-pro";
import { LOUCHE, ordreDesTenues } from "./guide-serveur";
import { SANS_BOUCHE, VISAGES_FIGURINE } from "./ma-figurine";
import { depotDans, dossierExpressions, signer, telecharger } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { consigneBoucheAssise, consigneTenueAssise, consigneVisageAssise, consigneVisageAssiseLibre } from "./perso-consignes";
import { universPourTous } from "./univers-pour-tous";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

const DOSSIER = "demo-proprio/univers";
/** sa figurine assise : `neutre.webp`, `parle.webp`, et d'où elle vient (`source.json`) */
const BASE = `${DOSSIER}/base`;
/** ses visages : `<visage>-n.webp`, `<visage>-p.webp` */
const VISAGES = `${DOSSIER}/expr`;
/** sa grimace, ses tenues (`louche-n.webp`, `edition-<clé>.webp`), les refus et le verrou */
const AUTRES = `${DOSSIER}/guide`;
const VERROU = "verrou.json";
const DUREE_VERROU = 6 * 60_000;
const ESSAIS_MAX = 3;

const enWebp = (png: Buffer) => sharp(png).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

// (adopté ? — une fois adopté, relu une fois par minute au plus : chaque image de Pablito le demande ; pas encore
// adopté, relu à chaque fois, pour que l'adoption se voie tout de suite)
let memo: { le: number; oui: boolean } | null = null;
export async function pablitoAdopte(supabase: Supabase): Promise<boolean> {
  if (memo?.oui && Date.now() - memo.le < 60_000) return true;
  const oui = (await depotDans(supabase, BASE).lister().catch(() => [] as string[])).includes("neutre.webp");
  memo = { le: Date.now(), oui };
  return oui;
}
/** Pablito se montre-t-il au nouveau style (l'interrupteur allumé, et adopté) ? */
export async function pablitoAuNouveauStyle(supabase: Supabase): Promise<boolean> {
  return universPourTous() && (await pablitoAdopte(supabase));
}

/** Une de ses images du nouveau style, si elle est faite (`neutre-n`, `neutre-p`, `joie-n`, `louche-n`, `seule`, `edition-noel`…). */
export async function imageDePablito(supabase: Supabase, nom: string): Promise<Buffer | null> {
  if (nom === "neutre-n" || nom === "seule") return depotDans(supabase, BASE).lire("neutre.webp");
  if (nom === "neutre-p") return depotDans(supabase, BASE).lire("parle.webp");
  const visage = /^[a-z]+-[np]$/.test(nom) && nom !== "louche-n";
  return depotDans(supabase, visage ? VISAGES : AUTRES).lire(`${nom}.webp`);
}
/** Sa figurine assise de tous les jours (en attendant qu'une image soit faite), bouche fermée ou ouverte. */
export const pablitoDeTousLesJours = (supabase: Supabase, parle: boolean) => depotDans(supabase, BASE).lire(parle ? "parle.webp" : "neutre.webp");

/** Les images à faire, dans l'ordre : ses visages (bouche fermée, puis ouverte), sa grimace, ses tenues (celle du mois d'abord). */
const ORDRE = () => [...VISAGES_FIGURINE.flatMap((v) => [`${v.cle}-n`, `${v.cle}-p`]), "louche-n", ...ordreDesTenues().map((c) => `edition-${c}`)];

/** 🧑 L'adopter : la figurine du nouveau style de cet habitant (le propriétaire) devient Pablito. */
export async function adopterSaFigurine(supabase: Supabase, h: string): Promise<{ error?: string; repris?: number }> {
  const { fiche } = await lireFichePerso(supabase, h);
  if (fiche?.style !== "collection-1" || !fiche.validee_le) return { error: "Ta figurine du nouveau style n’est pas encore faite (/univers/figurine)." };
  const assise = s(fiche.references.assise?.chemin);
  const parle = s(fiche.references.assise_parle?.chemin);
  if (!assise || !parle) return { error: "Sa bouche ouverte n’est pas encore faite : réessaie dans une minute." };
  const [a, p] = await Promise.all([telecharger(supabase, assise), telecharger(supabase, parle)]);
  if (!a || !p) return { error: "Ses images sont introuvables." };
  // (les visages et les tenues d'une figurine adoptée avant étaient faits sur une autre image : ils s'effacent)
  for (const d of [VISAGES, AUTRES]) {
    const depot = depotDans(supabase, d);
    for (const n of await depot.lister()) await depot.effacer(n);
  }
  const b = depotDans(supabase, BASE);
  await b.ecrire("neutre.webp", await enWebp(a), "image/webp");
  await b.ecrire("parle.webp", await enWebp(p), "image/webp");
  // ses visages du nouveau style déjà faits : repris tels quels
  const siens = depotDans(supabase, dossierExpressions(h, assise));
  const noms = (await siens.lister()).filter((n) => VISAGES_FIGURINE.some((v) => n === `${v.cle}-n.webp` || n === `${v.cle}-p.webp`));
  const v = depotDans(supabase, VISAGES);
  for (const n of noms) {
    const octets = await siens.lire(n);
    if (octets) await v.ecrire(n, octets, "image/webp");
  }
  await b.ecrire("source.json", Buffer.from(JSON.stringify({ h, version: fiche.version, le: new Date().toISOString() })), "application/json");
  memo = null;
  return { repris: noms.length };
}

/** Où il en est (pour l'admin) : adopté, d'où, son image signée, les images faites, celles qui restent. */
export async function etatDePablito(supabase: Supabase): Promise<{ adopte: boolean; interrupteur: boolean; source?: { version?: number; le?: string }; image?: string; faites: number; aFaire: string[] }> {
  const [b, v, a] = await Promise.all([depotDans(supabase, BASE).lister(), depotDans(supabase, VISAGES).lister(), depotDans(supabase, AUTRES).lister()]);
  const adopte = b.includes("neutre.webp");
  const faits = new Set([...v, ...a].map((n) => n.replace(/\.webp$/, "")));
  const aFaire = ORDRE().filter((n) => !faits.has(n));
  if (!adopte) return { adopte, interrupteur: universPourTous(), faites: 0, aFaire };
  const src = json(await depotDans(supabase, BASE).lire("source.json"));
  return {
    adopte,
    interrupteur: universPourTous(),
    source: { ...(typeof src.version === "number" ? { version: src.version } : {}), ...(typeof src.le === "string" ? { le: src.le } : {}) },
    image: await signer(supabase, `${BASE}/neutre.webp`),
    faites: ORDRE().length - aFaire.length,
    aFaire,
  };
}

/** 🛠️ Un passage : la prochaine image qui manque (rien si tout est fait, s'il n'est pas adopté, ou si un autre passage est en train). */
export async function fabriquerPablito(supabase: Supabase, avant: number): Promise<{ fait?: string; erreur?: string }> {
  if (!cle() || !(await pablitoAdopte(supabase))) return {};
  const v = depotDans(supabase, VISAGES);
  const a = depotDans(supabase, AUTRES);
  const [nv, na] = await Promise.all([v.lister(), a.lister()]);
  const echecs = json(await a.lire("echecs.json").catch(() => null)) as Record<string, number>;
  const fait = (n: string) => nv.includes(`${n}.webp`) || na.includes(`${n}.webp`);
  const nom = ORDRE().find((n) => !fait(n) && (Number(echecs[n]) || 0) < ESSAIS_MAX && (!n.endsWith("-p") || fait(n.replace(/-p$/, "-n"))));
  if (!nom) return {};
  if (na.includes(VERROU) && Date.now() - (Number(json(await a.lire(VERROU)).le) || 0) < DUREE_VERROU) return {};
  // LE VERROU EST À NOUS ? Écrit, puis relu : de deux passages arrivés ensemble, seul le dernier écrit continue
  const qui = randomUUID();
  await a.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await a.lire(VERROU)).qui !== qui) return {};
  try {
    const neutre = await depotDans(supabase, BASE).lire("neutre.webp");
    if (!neutre) return { erreur: "Sa figurine est introuvable." };
    const visage = /^([a-z]+)-([np])$/.exec(nom);
    const x = visage && nom !== "louche-n" ? VISAGES_FIGURINE.find((f) => f.cle === visage[1])?.cle : undefined;
    // (sa main cache sa bouche : la même image pour parler — pas de bouche ouverte à payer)
    if (x && visage?.[2] === "p" && SANS_BOUCHE.includes(x)) {
      const n = await v.lire(`${x}-n.webp`);
      if (n) await v.ecrire(`${x}-p.webp`, n, "image/webp");
      return { fait: nom };
    }
    const edition = nom.startsWith("edition-") ? EDITIONS_DATEES.find((e) => `edition-${e.cle}` === nom) : undefined;
    const source = x && visage?.[2] === "p" ? await v.lire(`${x}-n.webp`) : neutre;
    if (!source) return { erreur: "Son visage est introuvable." };
    const consigne = x
      ? visage?.[2] === "p"
        ? consigneBoucheAssise(x)
        : consigneVisageAssise(x)
      : nom === "louche-n"
        ? consigneVisageAssiseLibre(LOUCHE)
        : consigneTenueAssise(edition?.nom ?? "", TENUES_EDITION[edition?.cle ?? ""] ?? "", "a warm, happy smile");
    const r = await demanderUneImage({ images: [source], consigne, transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
    if ("erreur" in r) {
      await a.ecrire("echecs.json", Buffer.from(JSON.stringify({ ...echecs, [nom]: (Number(echecs[nom]) || 0) + 1 })), "application/json");
      return { erreur: r.erreur };
    }
    await (x ? v : a).ecrire(`${nom}.webp`, await enWebp(r.png), "image/webp");
    return { fait: nom };
  } finally {
    if (json(await a.lire(VERROU).catch(() => null)).qui === qui) await a.effacer(VERROU).catch(() => undefined);
  }
}
