/**
 * 🧑 LES IMAGES DU GUIDE, CÔTÉ SERVEUR (`guide.ts`) — ses visages (faits pour la démonstration, dans
 * `demo-proprio/v<VERSION_GUIDE>/expr/`), sa figurine seule et ses tenues d'édition (`demo-proprio/v…/guide/`).
 *
 * CE QUI MANQUE SE FAIT UNE FOIS, à la première demande, après la réponse (`/api/direct/guide/<nom>`) : ses visages
 * d'abord (s'ils manquent), puis sa figurine seule, puis ses tenues — celle du mois en premier, puis les suivantes.
 * Une image par passage, sous un verrou (deux visites ensemble ne la paient pas deux fois) ; une image que le moteur
 * refuse trois fois n'est plus redemandée (elle reste à son image de tous les jours). Une quinzaine d'images en tout,
 * pour toujours.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { EDITIONS_DATEES, editionsDuMoment } from "./collection";
import { expressionsCompletes, expressionsDe, fabriquerUnTour } from "./figurine-expressions-serveur";
import { jourDe } from "./figurine-pro";
import { habillerFigurine, recopierSansFond } from "./figurine-pro-serveur";
import { VERSION_GUIDE, nomGuideValide } from "./guide";
import { IMAGES_DEMO } from "./ma-figurine";
import { depotDans } from "./ma-figurine-serveur";

type Supabase = ReturnType<typeof createAdminClient>;

const DOSSIER = `demo-proprio/v${VERSION_GUIDE}`;
const VISAGES = `${DOSSIER}/expr`;
const FIGURINES = `${DOSSIER}/guide`;
const VERROU = "verrou.json";
const DUREE_VERROU = 6 * 60_000;
const ESSAIS_MAX = 3;

/** Une de ses images, si elle est faite. */
export async function imageDuGuide(supabase: Supabase, nom: string): Promise<Buffer | null> {
  if (!nomGuideValide(nom)) return null;
  const visage = /^[a-z]+-[np]$/.test(nom);
  return depotDans(supabase, visage ? VISAGES : FIGURINES).lire(`${nom}.webp`);
}

/** Ses tenues, dans l'ordre où on les fait : celle du mois, puis les suivantes (l'année qui vient). */
function ordreDesTenues(maintenant = new Date()): string[] {
  const cles = EDITIONS_DATEES.map((e) => e.cle);
  const ici = editionsDuMoment(jourDe(maintenant)).maintenant?.cle;
  const k = Math.max(0, ici ? cles.indexOf(ici) : 0);
  return [...cles.slice(k), ...cles.slice(0, k)];
}

const json = (b: Buffer | null) => {
  try {
    return JSON.parse(b?.toString() || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** Un passage : la prochaine image qui manque (rien si tout est fait, ou si un autre passage est en train). */
export async function fabriquerLeGuide(supabase: Supabase, origine: string, avant: number): Promise<{ fait?: string; erreur?: string }> {
  // pas de moteur d'image ici (les essais, une copie locale) : rien à faire, son image de tous les jours suffit
  if (!String(process.env.OPENAI_API_KEY ?? "").trim()) return {};
  let source: Buffer;
  try {
    const r = await fetch(`${origine}${IMAGES_DEMO.neutre}`, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return { erreur: "Son image est introuvable." };
    source = Buffer.from(await r.arrayBuffer());
  } catch {
    return { erreur: "Son image est introuvable." };
  }

  // 1. SES VISAGES (faits pour la démonstration : en principe, rien à faire)
  const visages = depotDans(supabase, VISAGES);
  if (!expressionsCompletes(expressionsDe(await visages.lister()))) {
    const r = await fabriquerUnTour(visages, source, avant);
    return r.erreur ? { erreur: r.erreur } : { fait: "visages" };
  }

  // 2. SA FIGURINE SEULE, PUIS SES TENUES
  const depot = depotDans(supabase, FIGURINES);
  const noms = await depot.lister();
  const echecs = json(await depot.lire("echecs.json").catch(() => null)) as Record<string, number>;
  const nom = ["seule", ...ordreDesTenues().map((c) => `edition-${c}`)].find((n) => !noms.includes(`${n}.webp`) && (Number(echecs[n]) || 0) < ESSAIS_MAX);
  if (!nom) return {};
  if (noms.includes(VERROU) && Date.now() - (Number(json(await depot.lire(VERROU)).le) || 0) < DUREE_VERROU) return {};
  // LE VERROU EST À NOUS ? Écrit, puis relu : de deux passages arrivés ensemble, seul le dernier écrit continue
  const qui = randomUUID();
  await depot.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if (json(await depot.lire(VERROU)).qui !== qui) return {};
  try {
    const cle = nom.replace(/^edition-/, "");
    const edition = EDITIONS_DATEES.find((e) => e.cle === cle);
    const f = edition ? await habillerFigurine({ buste: source, cleEdition: edition.cle, nomEdition: edition.nom, avant }) : await recopierSansFond({ image: source, avant });
    if ("erreur" in f) {
      // pas de moteur ici (503) : ce n'est pas un refus
      if (f.statut !== 503) await depot.ecrire("echecs.json", Buffer.from(JSON.stringify({ ...echecs, [nom]: (Number(echecs[nom]) || 0) + 1 })), "application/json");
      return { erreur: f.erreur };
    }
    const webp = await sharp(f.images[0].png).resize({ height: 1000, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 92 }).toBuffer();
    await depot.ecrire(`${nom}.webp`, webp, "image/webp");
    return { fait: nom };
  } finally {
    if (json(await depot.lire(VERROU).catch(() => null)).qui === qui) await depot.effacer(VERROU).catch(() => undefined);
  }
}
