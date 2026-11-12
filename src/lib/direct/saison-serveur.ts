/**
 * 🍂 LA SAISON DE SON UNIVERS — chantier « Univers », lot 7 (« la figurine du mois devient la saison de son univers » ;
 * le propriétaire, le 12 novembre 2026, sur « le décor change chaque mois » ou « sa figurine s'habille selon le mois » :
 * « les deux, ça serait sympa non ? »).
 *
 *   · LE DÉCOR DU MOIS : à sa première visite du mois, son décor se pare du thème du mois (Noël, l'automne, l'été…) —
 *     le même lieu, le même cadrage, l'espace devant libre (`consigneDecorDeSaison`) ; une image par mois, rangée à part
 *     (`<habitant>/monde/saisons/<mois>-<empreinte de son décor>.png` : une retouche de son univers, un nouveau décor du
 *     mois) ; sous un verrou de cinq minutes. Partout où son décor se montre (chez lui, en visite, dans ses conversations
 *     et ses vidéos), c'est celui du mois, quand il est fait (`decorDuMoment`).
 *   · LA TENUE DU MOIS : sa figurine du mois, méritée comme aujourd'hui (dix jours sur ClikMe), se fait au nouveau style
 *     (`figurine-du-mois-serveur.ts`) et s'assoit chez lui (`tenueDuMois`).
 *
 * Le coût : une image haute par personne et par mois pour le décor (environ 4 à 8 centimes).
 *
 * FICHIER SERVEUR.
 */
import { createHash } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { editionDuMois } from "./figurine-du-mois";
import { lireFicheMonde } from "./fiches-serveur";
import { SEAU_FIGURINES, cheminImageDuLook, cheminParleDuLook, deposer, ecrireJson, lireJson, signer, telecharger } from "./ma-figurine-serveur";
import type { FicheMonde } from "./monde";
import { TOUCHES_DE_SAISON, consigneDecorDeSaison } from "./monde-consignes";
import { demanderUneImage } from "./moteur-images-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";

/** Le mois, à l'heure de Paris (« 2026-11 »). */
export const moisParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
const empreinte = (x: string) => createHash("sha1").update(x).digest("hex").slice(0, 12);
const dossierSaisons = (h: string) => `${h}/monde/saisons`;
export const cheminDecorSaison = (h: string, decor: string, mois: string) => `${dossierSaisons(h)}/${mois}-${empreinte(decor)}.png`;
const cheminVerrou = (h: string) => `${dossierSaisons(h)}/verrou.json`;

async function existe(supabase: Supabase, chemin: string): Promise<boolean> {
  const i = chemin.lastIndexOf("/");
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(chemin.slice(0, i), { limit: 100, search: chemin.slice(i + 1) });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).some((x) => x.name === chemin.slice(i + 1));
}

/** 🍂 Le chemin de son décor du moment : celui du mois s'il est fait, sinon son décor ; « » sans décor. */
export async function decorDuMoment(supabase: Supabase, h: string, f: FicheMonde | null): Promise<{ chemin: string; saison: boolean }> {
  const decor = f?.references.decor?.chemin;
  if (!decor) return { chemin: "", saison: false };
  const duMois = cheminDecorSaison(h, decor, moisParis());
  return (await existe(supabase, duMois).catch(() => false)) ? { chemin: duMois, saison: true } : { chemin: decor, saison: false };
}

/** Son décor du mois est-il à faire (un décor, pas encore celui du mois, personne ne le fait) ? */
export async function decorDeSaisonAFaire(supabase: Supabase, h: string): Promise<boolean> {
  if (!cle()) return false;
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return false;
  if ((await decorDuMoment(supabase, h, f)).saison) return false;
  const v = await lireJson<{ le?: number }>(supabase, cheminVerrou(h));
  return Date.now() - (Number(v.le) || 0) > 5 * 60_000;
}

/** 🛠️ Son décor du mois (après la réponse) : fait sur son décor, une fois par mois. */
export async function fabriquerDecorDeSaison(supabase: Supabase, h: string, avant: number): Promise<void> {
  if (!(await decorDeSaisonAFaire(supabase, h))) return;
  await ecrireJson(supabase, cheminVerrou(h), { le: Date.now() });
  try {
    const f = await lireFicheMonde(supabase, h);
    const decor = f?.references.decor ? await telecharger(supabase, f.references.decor.chemin) : null;
    if (!f?.references.decor || !decor) return;
    const mois = moisParis();
    const edition = editionDuMois(mois);
    const r = await demanderUneImage({ images: [decor], consigne: consigneDecorDeSaison(edition.nom, TOUCHES_DE_SAISON[edition.cle] ?? ""), transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
    if ("erreur" in r) return;
    await deposer(supabase, cheminDecorSaison(h, f.references.decor.chemin, mois), r.png, "image/png");
  } finally {
    await ecrireJson(supabase, cheminVerrou(h), {});
  }
}

/** 🗓️ Sa tenue du mois, au nouveau style (méritée, faite) : son image et sa bouche ouverte, signées ; `null` sinon. */
export async function tenueDuMois(supabase: Supabase, h: string): Promise<{ n: string; p?: string } | null> {
  const mois = moisParis();
  const fiche = await lireJson<{ image?: string; style?: string }>(supabase, `${h}/mois/${mois}.json`);
  if (fiche.style !== "collection-1" || !s(fiche.image)) return null;
  const [n, p] = await Promise.all([signer(supabase, cheminImageDuLook(h, mois), 3600), signer(supabase, cheminParleDuLook(h, mois), 3600).catch(() => "")]);
  return n ? { n, ...(p ? { p } : {}) } : null;
}

/** L'édition du mois (« Automne 🍂 »). */
export const saisonDuMois = () => editionDuMois(moisParis());
