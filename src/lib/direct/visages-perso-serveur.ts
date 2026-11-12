/**
 * 🎭 SES VISAGES DU NOUVEAU STYLE — après le lot 5 du chantier « Univers » (le propriétaire, le 12 novembre 2026 :
 * « ok, commence les visages »). Sa figurine assise (lot 2) parle chez lui, dans ses vidéos et sur son lien : elle doit
 * aussi faire la tête de chaque réplique, comme sa figurine d'aujourd'hui.
 *
 * LA MÊME RÈGLE QUE SES VISAGES D'AUJOURD'HUI (`figurine-expressions-serveur.ts`) : faits à la demande, une seule fois,
 * ceux qu'il a voulus (`visagesVoulus` : ses têtes de départ, et ceux qu'il a choisis), EN DEUX TOURS (les visages
 * d'abord, en même temps ; puis leurs bouches ouvertes), sous un verrou de quatre minutes (deux pages ouvertes ne paient
 * pas deux fois). Ce qui change : la source est son image « assise », détourée ; les consignes sont celles du nouveau
 * style (`consigneVisageAssise`, `consigneBoucheAssise`) ; le moteur rend un fond transparent ; le dossier est lié à son
 * image (`dossierExpressions(h, <son image assise>)`) — une nouvelle image (son fauteuil aux couleurs de son monde),
 * de nouveaux visages.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { expressionsCompletes, expressionsDe } from "./figurine-expressions-serveur";
import { lireFichePerso } from "./fiches-serveur";
import { SANS_BOUCHE, type Expressions, type Sentiment } from "./ma-figurine";
import { depotDans, dossierExpressions, expressionsSignees, telecharger, visagesVoulus } from "./ma-figurine-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { consigneBoucheAssise, consigneVisageAssise } from "./perso-consignes";
import { TETES_DE_DEPART } from "./talkie";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

const VERROU = "verrou.json";
const DUREE_VERROU = 4 * 60_000;

/** Son image « assise » du nouveau style (son chemin), s'il l'a ; « » sinon. */
async function sonAssise(supabase: Supabase, h: string): Promise<string> {
  const { fiche } = await lireFichePerso(supabase, h);
  return fiche?.style === "collection-1" ? s(fiche.references.assise?.chemin) : "";
}

/** Ses visages du nouveau style déjà faits, en adresses signées ; `null` sans figurine du nouveau style. */
export async function visagesPersoSignes(supabase: Supabase, h: string, secondes = 3600): Promise<Expressions | null> {
  const assise = await sonAssise(supabase, h);
  if (!assise) return null;
  return (await expressionsSignees(supabase, dossierExpressions(h, assise), secondes)).expressions;
}

/** Les visages qu'il veut : ses têtes de départ (le talkie), et ceux qu'il a choisis une fois. */
export async function visagesPersoVoulus(supabase: Supabase, h: string): Promise<Sentiment[]> {
  return [...new Set<Sentiment>([...TETES_DE_DEPART, ...(await visagesVoulus(supabase, h))])];
}

/** Une image rendue, en webp détouré (la transparence gardée). */
const enWebp = (png: Buffer) => sharp(png).webp({ quality: 90, alphaQuality: 100 }).toBuffer();

/**
 * UN TOUR : les visages voulus qui manquent (bouche fermée), sinon leurs bouches ouvertes. Rend où l'on en est.
 * Sans figurine du nouveau style : rien à faire.
 */
export async function fabriquerVisagesPerso(supabase: Supabase, h: string, avant: number, quels: readonly Sentiment[]): Promise<{ complete: boolean; enCours?: boolean; erreur?: string }> {
  const assise = await sonAssise(supabase, h);
  if (!assise || !quels.length) return { complete: true };
  if (!cle()) return { complete: false, erreur: "Le moteur d’image n’est pas branché ici." };
  const depot = depotDans(supabase, dossierExpressions(h, assise));
  let noms = await depot.lister();
  if (expressionsCompletes(expressionsDe(noms), quels)) return { complete: true };
  const lireVerrou = async () => JSON.parse((await depot.lire(VERROU))?.toString() || "{}") as { le?: number; qui?: string };
  if (noms.includes(VERROU) && Date.now() - (Number((await lireVerrou()).le) || 0) < DUREE_VERROU) return { complete: false, enCours: true };
  const qui = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await depot.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if ((await lireVerrou()).qui !== qui) return { complete: false, enCours: true };
  try {
    const erreurs: string[] = [];
    const visages = quels.filter((x) => !noms.includes(`${x}-n.webp`));
    if (visages.length) {
      const source = await telecharger(supabase, assise);
      if (!source) return { complete: false, erreur: "Sa figurine est introuvable." };
      await Promise.all(
        visages.map(async (x) => {
          const r = await demanderUneImage({ images: [source], consigne: consigneVisageAssise(x), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium" });
          if ("erreur" in r) return void erreurs.push(r.erreur);
          const image = await enWebp(r.png);
          await depot.ecrire(`${x}-n.webp`, image, "image/webp");
          // (sa main cache sa bouche : la même image pour parler — une image de moins à payer)
          if (SANS_BOUCHE.includes(x)) await depot.ecrire(`${x}-p.webp`, image, "image/webp");
        }),
      );
    } else {
      await Promise.all(
        quels
          .filter((x) => !noms.includes(`${x}-p.webp`))
          .map(async (x) => {
            const visage = await depot.lire(`${x}-n.webp`);
            if (!visage) return void erreurs.push("visage introuvable");
            const r = await demanderUneImage({ images: [visage], consigne: consigneBoucheAssise(x), transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium" });
            if ("erreur" in r) return void erreurs.push(r.erreur);
            await depot.ecrire(`${x}-p.webp`, await enWebp(r.png), "image/webp");
          }),
      );
    }
    noms = await depot.lister();
    return { complete: expressionsCompletes(expressionsDe(noms), quels), ...(erreurs.length ? { erreur: erreurs[0] } : {}) };
  } finally {
    if ((await lireVerrou()).qui === qui) await depot.effacer(VERROU);
  }
}
