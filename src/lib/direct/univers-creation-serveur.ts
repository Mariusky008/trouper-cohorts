/**
 * 🏡 LA CRÉATION DE SON UNIVERS, CÔTÉ SERVEUR — chantier « Univers », lot 4 (`univers-creation.ts` : le parcours).
 *
 * APRÈS LA RÉPONSE (`after`), dans l'ordre, pour la version en cours de sa fiche (`monde.ts`, lot 3) :
 *   1. LE DÉCOR (`consigneDecorDuMonde`, « Film, chaleureux », sans figurine ; une retouche : le décor d'avant où une
 *      seule chose change, `consigneRetoucheDecor`) — rangé dans `<habitant>/monde/v<n>/decor.png`, signé ;
 *   2. LES PLACES : un modèle qui voit relève où sa figurine s'assoit, d'où vient la lumière, où sont ses éléments
 *      (`questionPlaces`) ; sans lui, les places d'attente restent ;
 *   3. SON FAUTEUIL AUX COULEURS DE SON MONDE (lot 4b), une fois : une nouvelle version de sa figurine
 *      (`enregistrerVersionPerso`), son image « assise » refaite (`consigneFauteuil` : seul le fauteuil change), sa
 *      bouche ouverte refaite d'après elle, debout gardée (pas de fauteuil) ; sans succès, le fauteuil de départ reste ;
 *   4. L'IMAGE VEDETTE : sa figurine (lot 2) chez elle, dans son décor (`consigneVedette`, la scène validée au lot 0).
 * Chaque étape complète la version (`completerMonde`) ; `<habitant>/monde/creation.json` dit où on en est.
 *
 * LES RETOUCHES : trois offertes, puis une par jour ; chacune est une nouvelle version (`enregistrerVersionMonde`), et
 * on revient à la version d'avant sans rien refaire (`revenirAVersion`).
 *
 * Le moteur : celui de la nouvelle figurine (`OPENAI_PERSO_*`, sinon `OPENAI_API_KEY`).
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { regarderImage } from "./dressing-serveur";
import { cheminImageVersion, completerMonde, completerReferencesPerso, enregistrerVersionMonde, enregistrerVersionPerso, lireFicheMonde, lireFichePerso, revenirAVersion } from "./fiches-serveur";
import { deposer, ecrireJson, lireJson, signer, telecharger } from "./ma-figurine-serveur";
import { parleDAlcool } from "./meme-surprise";
import { DIRECTIONS_LUMIERE, figurineEnPlaceValide, type FicheMonde, type PlaceMonde, type SceneMonde } from "./monde";
import { consigneDecorDuMonde, consigneRetoucheDecor, consigneVedette, questionFigurineVedette, questionPlaces } from "./monde-consignes";
import { demanderUneImage } from "./moteur-images-serveur";
import { motInterdit } from "./mots-interdits";
import { fauteuilAuxCouleurs, type Fauteuil, type FichePerso } from "./perso";
import { consigneFauteuil, consigneMemeFigurine } from "./perso-consignes";
import { signatureDe } from "./signature-serveur";
import { decorDeSaisonAFaire, decorDuMoment, saisonDuMois, tenueDuMois } from "./saison-serveur";
import { RETOUCHES_OFFERTES, RETOUCHES_PAR_JOUR, retoucheUniversValide, type EtapeCreation, type EtatUnivers } from "./univers-creation";
import { ambianceDe, ambiancesActives, ambianceValide, pourLeDecor } from "./ambiances";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const cle = () => s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
export const moteurUniversBranche = () => Boolean(cle());

const cheminCreation = (h: string) => `${h}/monde/creation.json`;
/** Une création « en cours » depuis plus longtemps s'est perdue (la fonction s'est arrêtée) : on peut relancer. */
const PERIMEE_MS = 8 * 60_000;

type Creation = {
  version?: number;
  etape?: EtapeCreation | "fini";
  depuis?: string;
  erreur?: string;
  /** une retouche : ses mots, et le décor d'avant (l'image donnée au moteur) */
  retouche?: string;
  depuisDecor?: string;
  retouchesFaites?: number;
  jour?: string;
  retouchesDuJour?: number;
  /** 📏 la version dont on a déjà essayé de relever sa figurine sur l'image vedette (une fois par version) */
  mesure?: number;
};
const lireCreation = (supabase: Supabase, h: string) => lireJson<Creation>(supabase, cheminCreation(h));
const ecrireCreation = (supabase: Supabase, h: string, c: Partial<Creation>) => ecrireJson(supabase, cheminCreation(h), c);
const enCours = (c: Partial<Creation>, version: number) =>
  c.version === version && (c.etape === "decor" || c.etape === "places" || c.etape === "fauteuil" || c.etape === "vedette") && Date.now() - (Date.parse(s(c.depuis)) || 0) < PERIMEE_MS;

/** Les retouches qu'il peut encore demander : les offertes d'abord, puis une par jour. */
function retouchesRestantes(c: Partial<Creation>): number {
  const faites = Number(c.retouchesFaites) || 0;
  if (faites < RETOUCHES_OFFERTES) return RETOUCHES_OFFERTES - faites;
  return Math.max(0, RETOUCHES_PAR_JOUR - (c.jour === jourParis() ? Number(c.retouchesDuJour) || 0 : 0));
}

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────────
export async function etatUnivers(supabase: Supabase, h: string | null): Promise<EtatUnivers> {
  const branche = moteurUniversBranche();
  const vide: EtatUnivers = { etape: "sans-fiche", cles: [], retouches: { restantes: RETOUCHES_OFFERTES, offertes: RETOUCHES_OFFERTES }, branche };
  if (!h) return vide;
  const [f, c, { fiche: perso }] = await Promise.all([lireFicheMonde(supabase, h), lireCreation(supabase, h), lireFichePerso(supabase, h)]);
  const assise = perso?.style === "collection-1" ? perso.references.assise : undefined;
  const parle = perso?.style === "collection-1" ? perso.references.assise_parle?.chemin : undefined;
  // (🪑 son fauteuil aux couleurs de son monde : son image d'avant, pour montrer ce qui a changé)
  const auxCouleurs = perso?.fauteuil?.de === "univers" && assise;
  const [decor, vedette, a, p, fauteuilAvant] = await Promise.all([
    f?.references.decor ? signer(supabase, f.references.decor.chemin) : "",
    f?.references.vedette ? signer(supabase, f.references.vedette.chemin) : "",
    assise ? signer(supabase, assise.chemin) : "",
    parle ? signer(supabase, parle) : "",
    auxCouleurs && assise.signature?.entrees[0] ? signer(supabase, assise.signature.entrees[0]) : "",
  ]);
  // 🍂 la saison : sa tenue du mois (méritée, au nouveau style), son décor du mois
  const [tenue, moment, aFaire] = await Promise.all([
    a ? tenueDuMois(supabase, h).catch(() => null) : Promise.resolve(null),
    decorDuMoment(supabase, h, f).catch(() => ({ chemin: "", saison: false })),
    f?.references.decor ? decorDeSaisonAFaire(supabase, h).catch(() => false) : Promise.resolve(false),
  ]);
  const figurine = a ? { figurine: tenue ? { assise: tenue.n, ...(tenue.p ? { parle: tenue.p } : {}) } : { assise: a, ...(p ? { parle: p } : {}) } } : {};
  const decorSaison = moment.saison ? await signer(supabase, moment.chemin) : "";
  const edition = saisonDuMois();
  // (pas encore d'univers : sa figurine dit s'il doit d'abord la faire — l'accueil, `/univers`, l'y mène)
  if (!f) return { ...vide, ...figurine };
  const commun: EtatUnivers = {
    ...vide,
    version: f.version,
    proposition: f.proposition,
    lumiere: f.ambiance.lumiere,
    palette: f.ambiance.palette,
    scene: f.scene,
    cles: f.elements.map((e) => ({ id: e.id, quoi: e.quoi, pourquoi: e.pourquoi, source: e.source, ...(e.zone ? { zone: e.zone } : {}) })),
    retouches: { restantes: retouchesRestantes(c), offertes: RETOUCHES_OFFERTES },
    ...figurine,
    ...(auxCouleurs && perso ? { fauteuil: { version: perso.version, ...(fauteuilAvant ? { avant: fauteuilAvant } : {}) } } : {}),
    ...(decorSaison || decor ? { decor: decorSaison || decor } : {}),
    ...(vedette ? { vedette } : {}),
    ...(decor ? { saison: { nom: edition.nom, emoji: edition.emoji, decor: Boolean(decorSaison), ...(aFaire ? { enCours: true } : {}), tenue: Boolean(tenue) } } : {}),
    ...(f.version > 1 ? { avant: f.version - 1 } : {}),
    ...(ambiancesActives() ? { ambiance: f.decor_ambiance ?? "cosy" } : {}),
  };
  if (enCours(c, f.version)) return { ...commun, etape: "creation", creation: { etape: c.etape as EtapeCreation, ...(c.retouche ? { retouche: c.retouche } : {}) } };
  const erreur = c.version === f.version && c.erreur ? c.erreur : c.version === f.version && c.etape !== "fini" && c.etape ? "La création s’est arrêtée en chemin. Relance-la." : "";
  if (decor) return { ...commun, etape: "decouverte", ...(erreur ? { erreur } : {}) };
  return { ...commun, etape: "a-creer", ...(erreur ? { erreur } : {}) };
}

// ─── créer, retoucher, revenir ─────────────────────────────────────────────────────────────────────
/** « Créer mon univers » : la création est demandée (après la réponse : `fabriquerUnivers`). */
export async function lancerCreation(supabase: Supabase, h: string): Promise<{ version?: number; error?: string; statut?: number }> {
  if (!moteurUniversBranche()) return { error: "Le moteur d’image n’est pas branché ici.", statut: 503 };
  const f = await lireFicheMonde(supabase, h);
  if (!f) return { error: "Parle d’abord avec Pablito 🙂", statut: 400 };
  const c = await lireCreation(supabase, h);
  if (enCours(c, f.version)) return { error: "Ton univers se construit déjà : un instant 🙂", statut: 409 };
  // (un décor qui existe : il se retouche, il ne se refait pas — sauf si sa vedette manque, on la refait seule)
  const etape: EtapeCreation = f.references.decor ? "vedette" : "decor";
  if (f.references.decor && f.references.vedette) return { error: "Ton univers est déjà créé.", statut: 409 };
  await ecrireCreation(supabase, h, { ...c, version: f.version, etape, depuis: new Date().toISOString(), erreur: undefined, retouche: undefined, depuisDecor: undefined });
  return { version: f.version };
}

/** ✏️ Une retouche avec ses mots : une nouvelle version, le même décor où une seule chose change. */
export async function retoucherUnivers(supabase: Supabase, h: string, texte: unknown): Promise<{ version?: number; error?: string; statut?: number }> {
  const mots = retoucheUniversValide(texte);
  if (!mots) return { error: "Dis-le en quelques mots (« davantage de nature »).", statut: 400 };
  if (motInterdit(mots) || parleDAlcool(mots)) return { error: "Ces mots ne passent pas : écris autre chose 🙂", statut: 400 };
  if (!moteurUniversBranche()) return { error: "Le moteur d’image n’est pas branché ici.", statut: 503 };
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return { error: "Crée d’abord ton univers.", statut: 400 };
  const c = await lireCreation(supabase, h);
  if (enCours(c, f.version)) return { error: "Ton univers se construit déjà : un instant 🙂", statut: 409 };
  if (retouchesRestantes(c) <= 0) return { error: "Assez de retouches pour aujourd’hui : reviens demain.", statut: 429 };
  const contenu: Record<string, unknown> = { ...f, references: {}, retouches: [...(f.retouches ?? []), mots].slice(-10) };
  delete contenu.version;
  delete contenu.historique;
  delete contenu.creee_le;
  // (les zones des éléments se relèveront sur le nouveau décor)
  contenu.elements = f.elements.map((e) => ({ ...e, zone: undefined }));
  const r = await enregistrerVersionMonde(supabase, h, contenu as Omit<FicheMonde, "version" | "historique" | "creee_le">, `retouche : « ${mots} »`);
  if (!r.fiche) return { error: r.error ?? "Ça n’a pas marché. Réessaie.", statut: 502 };
  const jour = jourParis();
  // (une retouche offerte ne compte pas dans celle du jour)
  const offertes = (Number(c.retouchesFaites) || 0) < RETOUCHES_OFFERTES;
  const duJour = c.jour === jour ? Number(c.retouchesDuJour) || 0 : 0;
  await ecrireCreation(supabase, h, {
    version: r.fiche.version,
    etape: "decor",
    depuis: new Date().toISOString(),
    retouche: mots,
    depuisDecor: f.references.decor.chemin,
    retouchesFaites: (Number(c.retouchesFaites) || 0) + 1,
    jour,
    retouchesDuJour: offertes ? duJour : duJour + 1,
  });
  return { version: r.fiche.version };
}

/**
 * 🎨 Changer d'ambiance : une nouvelle version, son décor refait d'après sa fiche dans la nouvelle ambiance (puis ses
 * places, son image vedette) ; elle compte comme une retouche.
 */
export async function changerAmbiance(supabase: Supabase, h: string, x: unknown): Promise<{ version?: number; error?: string; statut?: number }> {
  const a = ambianceValide(x);
  if (!a) return { error: "Quelle ambiance ?", statut: 400 };
  if (!ambiancesActives()) return { error: "Les ambiances ne sont pas ouvertes.", statut: 409 };
  if (!moteurUniversBranche()) return { error: "Le moteur d’image n’est pas branché ici.", statut: 503 };
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.decor) return { error: "Crée d’abord ton univers.", statut: 400 };
  if ((f.decor_ambiance ?? "cosy") === a) return { error: "C’est déjà son ambiance 🙂", statut: 409 };
  const c = await lireCreation(supabase, h);
  if (enCours(c, f.version)) return { error: "Ton univers se construit déjà : un instant 🙂", statut: 409 };
  if (retouchesRestantes(c) <= 0) return { error: "Assez de retouches pour aujourd’hui : reviens demain.", statut: 429 };
  const contenu: Record<string, unknown> = { ...f, references: {}, decor_ambiance: a };
  delete contenu.version;
  delete contenu.historique;
  delete contenu.creee_le;
  contenu.elements = f.elements.map((e) => ({ ...e, zone: undefined }));
  const r = await enregistrerVersionMonde(supabase, h, contenu as Omit<FicheMonde, "version" | "historique" | "creee_le">, `ambiance : ${ambianceDe(a).nom}`);
  if (!r.fiche) return { error: r.error ?? "Ça n’a pas marché. Réessaie.", statut: 502 };
  const jour = jourParis();
  const offertes = (Number(c.retouchesFaites) || 0) < RETOUCHES_OFFERTES;
  const duJour = c.jour === jour ? Number(c.retouchesDuJour) || 0 : 0;
  await ecrireCreation(supabase, h, {
    version: r.fiche.version,
    etape: "decor",
    depuis: new Date().toISOString(),
    retouchesFaites: (Number(c.retouchesFaites) || 0) + 1,
    jour,
    retouchesDuJour: offertes ? duJour : duJour + 1,
  });
  return { version: r.fiche.version };
}

/** ↩️ Revenir à la version d'avant (ses images ne sont pas refaites). */
export async function revenirUnivers(supabase: Supabase, h: string): Promise<{ version?: number; error?: string; statut?: number }> {
  const f = await lireFicheMonde(supabase, h);
  if (!f || f.version <= 1) return { error: "Il n’y a pas de version d’avant.", statut: 400 };
  const c = await lireCreation(supabase, h);
  if (enCours(c, f.version)) return { error: "Ton univers se construit : un instant 🙂", statut: 409 };
  const r = await revenirAVersion(supabase, h, "monde", f.version - 1);
  if (r.error || !r.fiche) return { error: r.error ?? "Ça n’a pas marché.", statut: r.statut ?? 400 };
  await ecrireCreation(supabase, h, { ...c, version: r.fiche.version, etape: "fini", erreur: undefined, retouche: undefined, depuisDecor: undefined });
  return { version: r.fiche.version };
}

// ─── la fabrication (après la réponse) ────────────────────────────────────────────────────────────
const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
/** Les places relevées, vérifiées ; `null` si elles ne tiennent pas (on garde alors celles d'attente). */
function placesRelevees(x: Record<string, unknown>, avant: SceneMonde): { scene: SceneMonde; zones: Record<string, [number, number, number, number]> } {
  const places: PlaceMonde[] = [];
  for (const p of Array.isArray(x.places) ? x.places : []) {
    const o = (p ?? {}) as Record<string, unknown>;
    const id = o.id === "hote" || o.id === "invite" ? o.id : "";
    const px = fraction(o.x);
    const py = fraction(o.y);
    if (!id || px === null || py === null || py < 0.45 || places.some((q) => q.id === id)) continue;
    const echelle = typeof o.echelle === "number" && o.echelle >= 0.6 && o.echelle <= 1.4 ? o.echelle : 1;
    places.push({ id, x: px, y: py, echelle });
  }
  const l = (x.lumiere ?? {}) as Record<string, unknown>;
  const scene: SceneMonde = {
    sol: fraction(x.sol) ?? avant.sol,
    places: places.length === 2 ? places : avant.places,
    lumiere: {
      vient_de: DIRECTIONS_LUMIERE.find((d) => d === l.vient_de) ?? avant.lumiere.vient_de,
      couleur: typeof l.couleur === "string" && /^#[0-9a-f]{6}$/i.test(l.couleur) ? l.couleur.toLowerCase() : avant.lumiere.couleur,
    },
  };
  const zones: Record<string, [number, number, number, number]> = {};
  for (const z of Array.isArray(x.zones) ? x.zones : []) {
    const o = (z ?? {}) as Record<string, unknown>;
    const v = Array.isArray(o.zone) && o.zone.length === 4 && o.zone.every((n) => fraction(n) !== null) ? (o.zone as [number, number, number, number]) : null;
    if (typeof o.id === "string" && v) zones[o.id] = v;
  }
  return { scene, zones };
}

/**
 * 🪑 SON FAUTEUIL PREND LES COULEURS DE SON MONDE : une nouvelle version de sa figurine (validée comme celle d'avant :
 * il n'a rien d'autre à refaire), son image « assise » refaite d'après celle d'avant ; sa bouche ouverte se refait
 * ensuite d'après la nouvelle (`bouche`, qu'on attend avant de finir) ; debout, sans fauteuil, est gardée.
 */
async function fauteuilDeSonMonde(supabase: Supabase, h: string, perso: FichePerso, fauteuil: Fauteuil, avant: number): Promise<{ fiche: FichePerso; bouche: Promise<void> } | null> {
  const ancienne = perso.references.assise!;
  const image = await telecharger(supabase, ancienne.chemin);
  if (!image) return null;
  const consigne = consigneFauteuil(fauteuil);
  const debut = Date.now();
  const r = await demanderUneImage({ images: [image], consigne, transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
  if ("erreur" in r) return null;
  const chemin = `${h}/perso/images/fauteuil-${Date.now().toString(36)}.png`;
  if (!(await deposer(supabase, chemin, r.png, "image/png"))) return null;
  const assise = { chemin, signature: signatureDe(r.png, { moteur: r.modele, consigne, reglages: r.reglages, fond: "transparent", entrees: [ancienne.chemin], debut, jetons: r.jetons }) };
  const contenu: Record<string, unknown> = { ...perso, fauteuil, references: { assise, ...(perso.references.debout ? { debout: perso.references.debout } : {}) } };
  delete contenu.version;
  delete contenu.historique;
  delete contenu.creee_le;
  const v = await enregistrerVersionPerso(supabase, h, contenu as Omit<FichePerso, "version" | "historique" | "creee_le">, "son fauteuil a pris les couleurs de son monde");
  if (!v.fiche) return null;
  const fiche = v.fiche;
  const bouche = (async () => {
    const consigneParle = consigneMemeFigurine("parle");
    const t0 = Date.now();
    const p = await demanderUneImage({ images: [r.png], consigne: consigneParle, transparent: true, fidelite: "high", avant, cle: cle(), base: base(), qualite: "medium" });
    if ("erreur" in p) return;
    const cheminParle = cheminImageVersion(h, "perso", fiche.version, "assise_parle");
    if (!(await deposer(supabase, cheminParle, p.png, "image/png"))) return;
    const signature = signatureDe(p.png, { moteur: p.modele, consigne: consigneParle, reglages: p.reglages, fond: "transparent", entrees: [chemin], debut: t0, jetons: p.jetons });
    await completerReferencesPerso(supabase, h, fiche.version, { assise_parle: { chemin: cheminParle, signature } });
  })().catch(() => undefined);
  return { fiche, bouche };
}

/**
 * 📏 SA FIGURINE, À L'ÉCHELLE DE LA PIÈCE : un modèle qui voit relève sur l'image vedette (où le moteur l'a installée
 * lui-même, naturellement) son milieu, le bas de son fauteuil et sa hauteur ; c'est là, et à cette taille, qu'elle
 * s'assoit chez elle. Sans réponse qui tienne, rien ne change.
 */
async function mesurerSurLaVedette(supabase: Supabase, h: string, f: FicheMonde): Promise<FicheMonde | null> {
  if (!f.references.vedette) return null;
  const vedette = await telecharger(supabase, f.references.vedette.chemin);
  if (!vedette) return null;
  try {
    const jpeg = await sharp(vedette).resize({ width: 768, height: 768, fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
    const vu = await Promise.race([
      regarderImage({ type: "image/jpeg", donnees: jpeg.toString("base64") }, questionFigurineVedette()),
      new Promise<{ erreur: string }>((ok) => setTimeout(() => ok({ erreur: "trop long" }), 40_000)),
    ]);
    if ("erreur" in vu) return null;
    const bas = Number(vu.bas);
    const haut = Number(vu.haut);
    const figurine = figurineEnPlaceValide({ x: Number(vu.x), y: bas, hauteur: bas - haut });
    if (!figurine) return null;
    const ok = await completerMonde(supabase, h, f.version, { scene: { ...f.scene, figurine } });
    return ok.fiche ?? null;
  } catch {
    return null;
  }
}

/** 📏 Pour un univers déjà créé : sa figurine relevée sur l'image vedette, une fois par version. */
export async function mesurerSaFigurine(supabase: Supabase, h: string): Promise<{ version?: number; error?: string; statut?: number }> {
  const f = await lireFicheMonde(supabase, h);
  if (!f?.references.vedette) return { error: "Rien à mesurer.", statut: 400 };
  if (f.scene.figurine) return { version: f.version };
  const c = await lireCreation(supabase, h);
  if (c.mesure === f.version || enCours(c, f.version)) return { version: f.version };
  await ecrireCreation(supabase, h, { ...c, mesure: f.version });
  await mesurerSurLaVedette(supabase, h, f);
  return { version: f.version };
}

/** 🛠️ Son univers se construit : le décor, les places, son fauteuil, l'image vedette — chaque étape complète la version. */
export async function fabriquerUnivers(supabase: Supabase, h: string, version: number, avant: number): Promise<void> {
  const marquer = async (maj: Partial<Creation>) => {
    const c = await lireCreation(supabase, h);
    if (c.version === version) await ecrireCreation(supabase, h, { ...c, ...maj, depuis: new Date().toISOString() });
  };
  const rater = (erreur: string) => marquer({ etape: undefined, erreur });
  try {
    let f = await lireFicheMonde(supabase, h);
    const c = await lireCreation(supabase, h);
    if (!f || f.version !== version) return;
    // 1. LE DÉCOR
    if (!f.references.decor) {
      const precedent = c.retouche && c.depuisDecor ? await telecharger(supabase, c.depuisDecor) : null;
      if (c.retouche && !precedent) return void (await rater("Le décor d’avant est introuvable."));
      // (🎨 un décor neuf, dans l'ambiance de sa fiche ; une retouche garde celle du décor d'avant)
      const consigne = precedent ? consigneRetoucheDecor(c.retouche!) : consigneDecorDuMonde(f, ambiancesActives() ? pourLeDecor(f.decor_ambiance) : undefined);
      const debut = Date.now();
      const r = await demanderUneImage({ images: precedent ? [precedent] : [], consigne, transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
      if ("erreur" in r) return void (await rater(r.erreur));
      const chemin = cheminImageVersion(h, "monde", version, "decor");
      if (!(await deposer(supabase, chemin, r.png, "image/png"))) return void (await rater("Le décor n’a pas pu être rangé."));
      const signature = signatureDe(r.png, { moteur: r.modele, consigne, reglages: r.reglages, fond: "opaque", entrees: precedent && c.depuisDecor ? [c.depuisDecor] : [], debut, jetons: r.jetons });
      const ok = await completerMonde(supabase, h, version, { references: { decor: { chemin, signature } } });
      if (!ok.fiche) return void (await rater(ok.error ?? "Son univers a changé entre-temps."));
      f = ok.fiche;
      await marquer({ etape: "places" });
    }
    // 2. LES PLACES (sans modèle qui voit : celles d'attente restent)
    const decor = await telecharger(supabase, f.references.decor!.chemin);
    if (decor && !f.elements.some((e) => e.zone)) {
      try {
        const jpeg = await sharp(decor).resize({ width: 768, height: 768, fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
        const vu = await Promise.race([
          regarderImage({ type: "image/jpeg", donnees: jpeg.toString("base64") }, questionPlaces(f.elements.map((e) => ({ id: e.id, quoi: e.quoi })))),
          new Promise<{ erreur: string }>((ok) => setTimeout(() => ok({ erreur: "trop long" }), 40_000)),
        ]);
        if (!("erreur" in vu)) {
          const { scene, zones } = placesRelevees(vu, f.scene);
          const ok = await completerMonde(supabase, h, version, { scene, zones });
          if (ok.fiche) f = ok.fiche;
        }
      } catch {
        // (les places d'attente restent)
      }
    }
    // 3. SON FAUTEUIL AUX COULEURS DE SON MONDE (une fois ; sans succès, le fauteuil de départ reste)
    let { fiche: perso } = await lireFichePerso(supabase, h);
    let bouche: Promise<void> = Promise.resolve();
    const couleurs = fauteuilAuxCouleurs(f.ambiance.palette);
    if (perso?.style === "collection-1" && perso.references.assise && perso.fauteuil?.de !== "univers" && couleurs && !f.references.vedette) {
      await marquer({ etape: "fauteuil" });
      const refait = await fauteuilDeSonMonde(supabase, h, perso, couleurs, avant).catch(() => null);
      if (refait) {
        perso = refait.fiche;
        bouche = refait.bouche;
      }
    }
    await marquer({ etape: "vedette" });
    // 4. L'IMAGE VEDETTE : sa figurine chez elle (pendant que sa bouche ouverte se refait)
    const assise = perso?.style === "collection-1" ? perso.references.assise : undefined;
    const figurine = assise ? await telecharger(supabase, assise.chemin) : null;
    if (decor && figurine && assise && !f.references.vedette) {
      const consigne = consigneVedette();
      const debut = Date.now();
      const r = await demanderUneImage({ images: [decor, figurine], consigne, transparent: false, fidelite: "high", avant, cle: cle(), base: base(), qualite: "high" });
      if (!("erreur" in r)) {
        const chemin = cheminImageVersion(h, "monde", version, "vedette");
        if (await deposer(supabase, chemin, r.png, "image/png")) {
          const signature = signatureDe(r.png, { moteur: r.modele, consigne, reglages: r.reglages, fond: "opaque", entrees: [f.references.decor!.chemin, assise.chemin], debut, jetons: r.jetons });
          const v = await completerMonde(supabase, h, version, { references: { vedette: { chemin, signature } } });
          // (📏 sa figurine, à l'échelle de la pièce : relevée sur l'image vedette)
          if (v.fiche) await mesurerSurLaVedette(supabase, h, v.fiche);
        }
      }
      // (sans vedette, la découverte se fait avec la figurine posée sur le décor)
    }
    await bouche;
    await marquer({ etape: "fini", erreur: undefined });
  } catch {
    await rater("Ça n’a pas marché. Relance la création.");
  }
}
