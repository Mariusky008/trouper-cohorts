/**
 * 🧸 LA NOUVELLE FIGURINE, CÔTÉ SERVEUR — chantier « Univers », lot 2 (`nouvelle-figurine.ts` : le parcours).
 *
 * SON BROUILLON (`<habitant>/perso/brouillon.json`) : son selfie, ses traits (décrits une fois), et ses propositions —
 * la première d'après le selfie, puis chaque retouche faite sur la précédente, ou une nouvelle d'après le selfie
 * (« Elle ne me ressemble pas »). Les images sont rangées pour de bon (`<habitant>/perso/images/<id>.png`) : celle
 * qu'il valide devient la référence de sa fiche, qui la désigne sans la recopier.
 *
 * « C'EST MOI ! » : une nouvelle version de sa fiche (style « collection-1 »), validée, avec sa référence « assise »
 * signée, ses traits, son fauteuil de départ, son selfie et ses retouches ; puis, après la réponse, ses deux autres
 * images de référence (bouche ouverte, debout : `consigneMemeFigurine`), ajoutées à cette version.
 *
 * Une image à la fois, faite APRÈS LA RÉPONSE (`after`) : une minute environ ; l'écran relit. `PROPOSITIONS_PAR_JOUR`
 * au plus. Le moteur : `OPENAI_PERSO_API_KEY` / `OPENAI_PERSO_BASE_URL` s'ils existent (les essais automatiques : le
 * faux moteur), sinon celui des figurines (`OPENAI_API_KEY`).
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Traits } from "./figurine-pro";
import { decrireTraits } from "./figurine-pro-serveur";
import type { Habitant } from "./habitant";
import { universValide } from "./ma-figurine";
import { confirmerSonAge, deposer, ecrireJson, lireJson, lireLigne, signer, telecharger } from "./ma-figurine-serveur";
import { parleDAlcool } from "./meme-surprise";
import { demanderUneImage } from "./moteur-images-serveur";
import { motInterdit } from "./mots-interdits";
import { FAUTEUIL_DE_DEPART, type Reference, type Signature } from "./perso";
import { consigneMemeFigurine, consigneRetoucheFigurine, consigneSculptee } from "./perso-consignes";
import { cheminImageVersion, completerReferencesPerso, enregistrerVersionPerso, lireFichePerso, validerFichePerso } from "./fiches-serveur";
import { signatureDe } from "./signature-serveur";
import {
  PERIMEE_MS,
  PROPOSITIONS_GARDEES,
  PROPOSITIONS_PAR_JOUR,
  demandeValide,
  idPropositionValide,
  type EtatNouvelleFigurine,
  type EtatProposition,
  type PropositionVue,
} from "./nouvelle-figurine";
import { nomDeVille, villeSlug } from "./ville";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
export const moteurPersoBranche = () => Boolean(cle());

const cheminBrouillon = (h: string) => `${h}/perso/brouillon.json`;
/** (un chemin par selfie : une version garde le sien, même s'il en envoie un autre) */
const cheminSelfie = (h: string, n: string) => `${h}/perso/selfie-${n}.jpg`;
const cheminProposition = (h: string, id: string) => `${h}/perso/images/${id}.png`;

type Proposition = {
  id: string;
  etat: EtatProposition;
  le: string;
  /** d'où elle part : son selfie, ou la proposition qu'il retouche */
  de: "selfie" | string;
  /** les retouches qui y mènent, dans l'ordre (la dernière : celle-ci) */
  retouches: string[];
  chemin?: string;
  signature?: Signature;
  erreur?: string;
};
type Brouillon = {
  selfie?: string;
  accord_le?: string;
  traits?: Traits | null;
  traitsDecrits?: boolean;
  propositions?: Proposition[];
  jour?: string;
  faites?: number;
  /** « C'est moi ! » : ses autres images de référence se font pour cette version */
  references?: { version: number; le: string; fini?: boolean; erreur?: string };
};

const lireBrouillon = (supabase: Supabase, h: string) => lireJson<Brouillon>(supabase, cheminBrouillon(h));
const ecrireBrouillon = (supabase: Supabase, h: string, b: Partial<Brouillon>) => ecrireJson(supabase, cheminBrouillon(h), b);
const propositionsDe = (b: Partial<Brouillon>): Proposition[] => (Array.isArray(b.propositions) ? b.propositions : []);
const perimee = (p: Proposition) => p.etat === "en-cours" && Date.now() - (Date.parse(p.le) || 0) > PERIMEE_MS;
const faitesAujourdhui = (b: Partial<Brouillon>) => (b.jour === jourParis() ? Number(b.faites) || 0 : 0);

/** Un selfie envoyé par le téléphone (data URL), 10 Mo au plus. */
function imageEnvoyee(x: unknown): Buffer | null {
  const m = /^data:image\/(?:jpeg|jpg|png|webp|heic|heif);base64,(.+)$/i.exec(s(x));
  if (!m) return null;
  const brut = Buffer.from(m[1], "base64");
  return brut.length && brut.length <= 10 * 1024 * 1024 ? brut : null;
}

/**
 * 🖼️ SA PHOTO D'AVANT (la bascule « Univers pour tous » : « figurines actuelles refaites ») : celui qui avait sa figurine
 * d'aujourd'hui peut refaire la nouvelle d'après la photo qu'il avait envoyée (« C'est bien moi » et « 15 ans ou plus »
 * cochés à nouveau) ; son chemin, s'il en a une.
 */
async function sonCheminDePhotoDAvant(supabase: Supabase, h: string): Promise<string> {
  const { ok, ligne } = await lireLigne(supabase, h).catch(() => ({ ok: false, ligne: null }));
  const chemin = ok ? s(ligne?.photo) : "";
  return chemin.startsWith(`${h}/`) ? chemin : "";
}

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────────
/** 🏙️ Les villes où ClikMe a des commerçants (les plus fournies d'abord) : des suggestions, jamais une liste fermée. */
async function villesDesCommercants(supabase: Supabase): Promise<{ slug: string; nom: string }[]> {
  try {
    const { data } = await supabase.from("human_vitrine_sites").select("city").eq("est_client", true).limit(500);
    const parVille = new Map<string, { nom: string; n: number }>();
    for (const x of (Array.isArray(data) ? data : []) as { city?: string }[]) {
      const nom = s(x.city).replace(/\b\d{5}\b/g, " ").replace(/,.*$/, "").replace(/\s+/g, " ").trim();
      const slug = villeSlug(nom);
      if (slug) parVille.set(slug, { nom: parVille.get(slug)?.nom ?? nomDeVille(nom), n: (parVille.get(slug)?.n ?? 0) + 1 });
    }
    return [...parVille.entries()].sort((a, b) => b[1].n - a[1].n || a[1].nom.localeCompare(b[1].nom, "fr")).slice(0, 30).map(([slug, v]) => ({ slug, nom: v.nom }));
  } catch {
    return [];
  }
}

export async function etatNouvelleFigurine(supabase: Supabase, h: string | null): Promise<EtatNouvelleFigurine> {
  const branche = moteurPersoBranche();
  const vide: EtatNouvelleFigurine = { etape: "selfie", propositions: [], restantes: PROPOSITIONS_PAR_JOUR, branche };
  if (!h) return { ...vide, villeADonner: { suggestions: await villesDesCommercants(supabase) } };
  const [b, { fiche, origine }] = await Promise.all([lireBrouillon(supabase, h), lireFichePerso(supabase, h)]);
  const restantes = Math.max(0, PROPOSITIONS_PAR_JOUR - faitesAujourdhui(b));
  const propositions: PropositionVue[] = await Promise.all(
    propositionsDe(b)
      .slice()
      .reverse()
      .map(async (p) => {
        const etat: EtatProposition = perimee(p) ? "erreur" : p.etat;
        const vue: PropositionVue = { id: p.id, etat, le: p.le };
        if (etat === "fait" && p.chemin) vue.image = await signer(supabase, p.chemin);
        if (etat === "erreur") vue.erreur = perimee(p) ? "Interrompue en chemin. Réessaie." : p.erreur || "Ratée. Réessaie.";
        if (p.de !== "selfie" && p.retouches.length) vue.demande = p.retouches[p.retouches.length - 1];
        return vue;
      }),
  );
  // SON PERSONNAGE MAÎTRE, du nouveau style et validé (sauf s'il a renvoyé un selfie depuis : il en refait une)
  const refaitDepuis = Boolean(fiche?.validee_le && b.accord_le && Date.parse(b.accord_le) > Date.parse(fiche.validee_le));
  if (fiche && origine === "rangee" && fiche.style === "collection-1" && fiche.validee_le && !refaitDepuis) {
    const images: Record<string, string> = {};
    await Promise.all(Object.entries(fiche.references).map(async ([nom, r]) => void (images[nom] = await signer(supabase, r.chemin))));
    const ref = b.references;
    const enCours = Boolean(ref && ref.version === fiche.version && !ref.fini && !ref.erreur && Date.now() - (Date.parse(ref.le) || 0) < PERIMEE_MS);
    return { etape: "validee", propositions, restantes, branche, figurine: { version: fiche.version, images, enCours } };
  }
  if (!b.selfie) {
    const avant = await sonCheminDePhotoDAvant(supabase, h);
    const photoDAvant = avant ? await signer(supabase, avant).catch(() => "") : "";
    return { ...vide, restantes, ...(photoDAvant ? { photoDAvant } : {}) };
  }
  return { etape: propositions[0]?.etat === "en-cours" ? "fabrication" : "decouverte", propositions, restantes, branche };
}

// ─── une nouvelle proposition ──────────────────────────────────────────────────────────────────────
/** Une proposition demandée (à faire après la réponse, `fabriquerProposition`). */
async function demanderProposition(supabase: Supabase, h: string, de: "selfie" | string, retouches: string[]): Promise<{ id?: string; error?: string; statut?: number }> {
  if (!moteurPersoBranche()) return { error: "Le moteur d’image n’est pas branché ici.", statut: 503 };
  const b = await lireBrouillon(supabase, h);
  if (!b.selfie) return { error: "Envoie d’abord ton selfie.", statut: 400 };
  const l = propositionsDe(b);
  if (l.some((p) => p.etat === "en-cours" && !perimee(p))) return { error: "Ta figurine est déjà à l’atelier : un instant 🙂", statut: 409 };
  if (faitesAujourdhui(b) >= PROPOSITIONS_PAR_JOUR) return { error: "Assez de retouches pour aujourd’hui : reviens demain.", statut: 429 };
  const id = randomBytes(6).toString("hex");
  const p: Proposition = { id, etat: "en-cours", le: new Date().toISOString(), de, retouches };
  const jour = jourParis();
  const ok = await ecrireBrouillon(supabase, h, { ...b, propositions: [...l, p].slice(-PROPOSITIONS_GARDEES), jour, faites: faitesAujourdhui(b) + 1 });
  return ok ? { id } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

/** 📸 Son selfie, et ses deux cases : sa première proposition est demandée. */
export async function envoyerSelfie(supabase: Supabase, habitant: Habitant, photo: unknown, moi: unknown, age: unknown): Promise<{ id?: string; error?: string; statut?: number }> {
  if (moi !== true) return { error: "Coche « C’est bien moi » : ta figurine, c’est toi.", statut: 400 };
  if (age !== true) return { error: "Il faut avoir 15 ans ou plus.", statut: 400 };
  // (« Reprendre ma photo d'avant » : celle de sa figurine d'aujourd'hui)
  const photoDAvant = photo === "avant" ? await sonCheminDePhotoDAvant(supabase, habitant.id) : "";
  const brut = photo === "avant" ? (photoDAvant ? await telecharger(supabase, photoDAvant) : null) : imageEnvoyee(photo);
  if (!brut) return { error: "Ce selfie ne s’ouvre pas. Reprends-le.", statut: 400 };
  let jpeg: Buffer;
  try {
    jpeg = await sharp(brut).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  } catch {
    return { error: "Ce selfie ne s’ouvre pas. Reprends-le.", statut: 400 };
  }
  const h = habitant.id;
  const selfie = cheminSelfie(h, randomBytes(6).toString("hex"));
  if (!(await deposer(supabase, selfie, jpeg, "image/jpeg"))) return { error: "Ton selfie n’a pas pu être rangé. Réessaie.", statut: 502 };
  await confirmerSonAge(supabase, h);
  // (un nouveau selfie : un nouveau brouillon — les propositions d'avant restent rangées, et le compte du jour aussi)
  const avant = await lireBrouillon(supabase, h);
  await ecrireBrouillon(supabase, h, { selfie, accord_le: new Date().toISOString(), propositions: [], jour: avant.jour, faites: avant.faites });
  return demanderProposition(supabase, h, "selfie", []);
}

/** ✏️ Une retouche avec ses mots, faite sur une proposition. */
export async function retoucher(supabase: Supabase, h: string, de: unknown, demande: unknown): Promise<{ id?: string; error?: string; statut?: number }> {
  const mots = demandeValide(demande);
  if (!mots) return { error: "Dis-le en quelques mots (« les cheveux plus courts »).", statut: 400 };
  if (motInterdit(mots) || parleDAlcool(mots)) return { error: "Ces mots ne passent pas : écris autre chose 🙂", statut: 400 };
  const id = idPropositionValide(de);
  const parent = propositionsDe(await lireBrouillon(supabase, h)).find((p) => p.id === id);
  if (!parent || parent.etat !== "fait" || !parent.chemin) return { error: "Cette proposition n’est plus là.", statut: 404 };
  return demanderProposition(supabase, h, parent.id, [...parent.retouches, mots].slice(-10));
}

/** 🔁 « Elle ne me ressemble pas » : une nouvelle, d'après son selfie. */
export const refaire = (supabase: Supabase, h: string) => demanderProposition(supabase, h, "selfie", []);

/** 🛠️ La proposition, faite par le moteur (après la réponse). */
export async function fabriquerProposition(supabase: Supabase, h: string, id: string, avant: number): Promise<void> {
  const noter = async (maj: Partial<Proposition>) => {
    const b = await lireBrouillon(supabase, h);
    await ecrireBrouillon(supabase, h, { ...b, propositions: propositionsDe(b).map((p) => (p.id === id ? { ...p, ...maj } : p)) });
  };
  try {
    const b = await lireBrouillon(supabase, h);
    const p = propositionsDe(b).find((x) => x.id === id);
    if (!p || p.etat !== "en-cours" || !b.selfie) return;
    let entree: string;
    let consigne: string;
    if (p.de === "selfie") {
      entree = b.selfie;
      // SES TRAITS, décrits une fois sur son selfie (ils passent dans la consigne, et dans sa fiche)
      let traits = b.traits ?? null;
      if (!b.traitsDecrits) {
        const selfie = await telecharger(supabase, b.selfie);
        traits = selfie ? await decrireTraits(selfie) : null;
        const b2 = await lireBrouillon(supabase, h);
        await ecrireBrouillon(supabase, h, { ...b2, traits, traitsDecrits: true });
      }
      consigne = consigneSculptee(traits);
    } else {
      const parent = propositionsDe(b).find((x) => x.id === p.de);
      if (!parent?.chemin) return void (await noter({ etat: "erreur", erreur: "La proposition d’avant n’est plus là." }));
      entree = parent.chemin;
      consigne = consigneRetoucheFigurine(p.retouches[p.retouches.length - 1] ?? "");
    }
    const image = await telecharger(supabase, entree);
    if (!image) return void (await noter({ etat: "erreur", erreur: "Ton selfie est introuvable : renvoie-le." }));
    const debut = Date.now();
    const r = await demanderUneImage({ images: [image], consigne, transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
    if ("erreur" in r) return void (await noter({ etat: "erreur", erreur: r.erreur }));
    const chemin = cheminProposition(h, id);
    if (!(await deposer(supabase, chemin, r.png, "image/png"))) return void (await noter({ etat: "erreur", erreur: "Ta figurine n’a pas pu être rangée." }));
    const signature = signatureDe(r.png, { moteur: r.modele, consigne, reglages: r.reglages, fond: "transparent", entrees: [entree], debut, jetons: r.jetons });
    await noter({ etat: "fait", chemin, signature });
  } catch {
    await noter({ etat: "erreur", erreur: "Ça n’a pas marché. Réessaie." });
  }
}

// ─── « C'est moi ! » ───────────────────────────────────────────────────────────────────────────────
/** Son personnage maître est enregistré (une version validée de sa fiche) ; ses autres images se font ensuite. */
export async function valider(supabase: Supabase, h: string, id: unknown): Promise<{ version?: number; error?: string; statut?: number }> {
  const b = await lireBrouillon(supabase, h);
  const p = propositionsDe(b).find((x) => x.id === idPropositionValide(id));
  if (!p || p.etat !== "fait" || !p.chemin || !p.signature) return { error: "Cette proposition n’est plus là.", statut: 404 };
  const univers = await lireJson<{ univers?: string }>(supabase, `${h}/univers.json`);
  const habit = universValide(univers.univers);
  const r = await enregistrerVersionPerso(
    supabase,
    h,
    {
      style: "collection-1",
      ...(b.traits ? { traits: b.traits } : {}),
      ...(habit ? { habit } : {}),
      fauteuil: FAUTEUIL_DE_DEPART,
      references: { assise: { chemin: p.chemin, signature: p.signature } },
      ...(b.selfie ? { photo: { chemin: b.selfie, ...(b.accord_le ? { accord_le: b.accord_le } : {}) } } : {}),
      ...(p.retouches.length ? { retouches: p.retouches } : {}),
    },
    "« C’est moi ! » : sa figurine du nouveau style",
  );
  if (!r.fiche) return { error: r.error ?? "Ta figurine n’a pas pu être enregistrée.", statut: 502 };
  const v = await validerFichePerso(supabase, h);
  if (!v.fiche) return { error: v.error ?? "Ta figurine n’a pas pu être enregistrée.", statut: 502 };
  const b2 = await lireBrouillon(supabase, h);
  await ecrireBrouillon(supabase, h, { ...b2, references: { version: r.fiche.version, le: new Date().toISOString() } });
  return { version: r.fiche.version };
}

/** 🧩 Ses autres images de référence (après la réponse) : la bouche ouverte, puis debout — d'après son image validée. */
export async function fabriquerSesReferences(supabase: Supabase, h: string, version: number, avant: number): Promise<void> {
  const finir = async (maj: { fini?: boolean; erreur?: string }) => {
    const b = await lireBrouillon(supabase, h);
    if (b.references?.version === version) await ecrireBrouillon(supabase, h, { ...b, references: { ...b.references, ...maj } });
  };
  try {
    const { fiche } = await lireFichePerso(supabase, h);
    const assise = fiche?.version === version ? fiche.references.assise : undefined;
    const image = assise ? await telecharger(supabase, assise.chemin) : null;
    if (!assise || !image) return void (await finir({ erreur: "Sa figurine est introuvable." }));
    const faites: Record<string, Reference> = {};
    for (const [nom, changement] of [
      ["assise_parle", "parle"],
      ["debout", "debout"],
    ] as const) {
      const consigne = consigneMemeFigurine(changement);
      const debut = Date.now();
      const r = await demanderUneImage({ images: [image], consigne, transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium" });
      if ("erreur" in r) return void (await finir({ erreur: r.erreur }));
      const chemin = cheminImageVersion(h, "perso", version, nom);
      if (!(await deposer(supabase, chemin, r.png, "image/png"))) return void (await finir({ erreur: "Une image n’a pas pu être rangée." }));
      faites[nom] = { chemin, signature: signatureDe(r.png, { moteur: r.modele, consigne, reglages: r.reglages, fond: "transparent", entrees: [assise.chemin], debut, jetons: r.jetons }) };
    }
    const c = await completerReferencesPerso(supabase, h, version, faites);
    await finir(c.fiche ? { fini: true } : { erreur: c.error ?? "Sa fiche n’a pas pu être complétée." });
  } catch {
    await finir({ erreur: "Ça n’a pas marché." });
  }
}
