/**
 * 🗂️ LES DEUX FICHES MAÎTRESSES, RANGÉES — chantier « Univers », lot 1, le socle (`docs/univers/feuille-de-route.md`,
 * sections 4.2 et 4.3 ; les formats : `perso.ts`, `monde.ts`, `scene.ts`).
 *
 * Dans le seau privé `figurines-clients`, sans nouvelle table :
 *   <habitant>/perso/fiche.json          la version en cours de son personnage
 *   <habitant>/perso/v<n>/fiche.json     chaque version, telle qu'elle était (ses images sont à côté)
 *   <habitant>/monde/fiche.json, <habitant>/monde/v<n>/…   la même chose pour son univers
 *
 * LA VERSION 0. Les figurines d'aujourd'hui n'ont rien à ranger : leur fiche se LIT dans `clik_ma_figurine` (ses deux
 * images, son dossier de visages, son selfie s'il l'a laissé) et dans le dossier de sa fabrication (ses traits et la
 * signature de chaque image, gardés depuis ce lot : `ma-figurine-fabrique-serveur.ts`). Rien n'est écrit pour elles :
 * l'appli d'aujourd'hui marche exactement comme avant, et sa fiche suit quand il refait sa figurine.
 *
 * LES VERSIONS. Une nouvelle version recopie la fiche d'avant dans son historique ; revenir à une version, c'est en
 * faire une nouvelle à partir d'elle (ses images ne sont pas refaites). Une version validée n'est jamais regénérée sans
 * demande.
 *
 * REFAIRE À L'IDENTIQUE (« on a réussi si… », lot 1) : la consigne d'une image se recalcule à partir de la fiche
 * (`consigneAttendue`) ; si c'est mot pour mot celle de sa signature, l'image est refaisable (`refaisables`).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { consigneFigurineClient } from "./figurine-pro";
import { consigneBoucheNeutre } from "./figurine-expressions-serveur";
import { consigneFauteuil, consigneMemeFigurine, consigneRetoucheFigurine, consigneSculptee } from "./perso-consignes";
import { universValide } from "./ma-figurine";
import { dossierExpressions, ecrireJson, lireJson, lireLigne, signer } from "./ma-figurine-serveur";
import { NOM_SIGNATURE_NEUTRE, NOM_SIGNATURE_PARLE, NOM_TRAITS } from "./ma-figurine-fabrique-serveur";
import { cheminValide, ficheComplete, ficheEstASoi, fichePersoValide, signatureValide, type Etape, type FichePerso, type Reference, type Signature } from "./perso";
import { ficheMondeValide, mondeEstASoi, type FicheMonde } from "./monde";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export type Genre = "perso" | "monde";
export const cheminFicheEnCours = (h: string, g: Genre) => `${h}/${g}/fiche.json`;
export const dossierVersion = (h: string, g: Genre, v: number) => `${h}/${g}/v${v}`;
export const cheminFicheVersion = (h: string, g: Genre, v: number) => `${dossierVersion(h, g, v)}/fiche.json`;
/** Où ranger une image d'une version (`assise.png`, `decor.webp`…). */
export const cheminImageVersion = (h: string, g: Genre, v: number, nom: string, ext = "png") => `${dossierVersion(h, g, v)}/${nom}.${ext}`;

export type Origine = "rangee" | "aujourd-hui";
const RAISON_ZERO = "sa figurine d'avant « Univers »";

// ─── la version 0 : la figurine d'aujourd'hui ────────────────────────────────────────────────────────────
async function versionZero(supabase: Supabase, h: string): Promise<FichePerso | null> {
  const { ligne } = await lireLigne(supabase, h);
  const neutre = cheminValide(ligne?.neutre);
  const parle = cheminValide(ligne?.parle);
  const prete = s(ligne?.prete_le);
  if (!ligne || !prete || !neutre || !parle) return null;
  const dossier = neutre.slice(0, neutre.lastIndexOf("/"));
  const photo = cheminValide(ligne.photo);
  const [traits, sigN, sigP, univers] = await Promise.all([
    lireJson<Record<string, unknown>>(supabase, `${dossier}/${NOM_TRAITS}`),
    lireJson<Signature>(supabase, `${dossier}/${NOM_SIGNATURE_NEUTRE}`),
    lireJson<Signature>(supabase, `${dossier}/${NOM_SIGNATURE_PARLE}`),
    lireJson<{ univers?: string }>(supabase, `${h}/univers.json`),
  ]);
  // (dans la signature, « photo » désigne son selfie, et un nom seul, une image du dossier de sa fabrication)
  const resoudre = (x: unknown): Signature | undefined => {
    const sig = signatureValide(x);
    if (!sig) return undefined;
    return { ...sig, entrees: sig.entrees.map((e) => (e === "photo" ? photo : e.includes("/") ? e : `${dossier}/${e}`)).filter(Boolean) };
  };
  const ref = (chemin: string, sig: unknown): Reference => {
    const signature = resoudre(sig);
    return signature ? { chemin, signature } : { chemin };
  };
  return fichePersoValide({
    version: 0,
    style: "ressort-1",
    creee_le: prete,
    validee_le: prete,
    traits,
    habit: universValide(univers.univers),
    references: { neutre: ref(neutre, sigN), parle: ref(parle, sigP) },
    visages: { dossier: dossierExpressions(h, neutre) },
    ...(photo ? { photo: { chemin: photo, accord_le: s(ligne.accord_le) } } : {}),
    historique: [{ version: 0, le: prete, raison: RAISON_ZERO, style: "ressort-1" }],
  });
}

// ─── lire ───────────────────────────────────────────────────────────────────────────────────────────
/** Son personnage : la version rangée, sinon sa figurine d'aujourd'hui (version 0) ; `null` s'il n'a pas encore de figurine. */
export async function lireFichePerso(supabase: Supabase, h: string): Promise<{ fiche: FichePerso | null; origine: Origine | null }> {
  const rangee = fichePersoValide(await lireJson(supabase, cheminFicheEnCours(h, "perso")));
  if (rangee && ficheEstASoi(rangee, h)) return { fiche: rangee, origine: "rangee" };
  const zero = await versionZero(supabase, h);
  return zero ? { fiche: zero, origine: "aujourd-hui" } : { fiche: null, origine: null };
}

/** Son univers ; `null` s'il n'en a pas encore. */
export async function lireFicheMonde(supabase: Supabase, h: string): Promise<FicheMonde | null> {
  const f = ficheMondeValide(await lireJson(supabase, cheminFicheEnCours(h, "monde")));
  return f && mondeEstASoi(f, h) ? f : null;
}

async function lireVersion(supabase: Supabase, h: string, g: Genre, v: number): Promise<FichePerso | FicheMonde | null> {
  if (g === "perso") {
    if (v === 0) return versionZero(supabase, h);
    const f = fichePersoValide(await lireJson(supabase, cheminFicheVersion(h, g, v)));
    return f && f.version === v && ficheEstASoi(f, h) ? f : null;
  }
  const f = ficheMondeValide(await lireJson(supabase, cheminFicheVersion(h, g, v)));
  return f && f.version === v && mondeEstASoi(f, h) ? f : null;
}

// ─── écrire : une nouvelle version ─────────────────────────────────────────────────────────────────
type Contenu<T> = Omit<T, "version" | "historique" | "creee_le">;

async function enregistrer<T extends { version: number; style: string; historique: Etape[] }>(
  supabase: Supabase,
  h: string,
  g: Genre,
  actuelle: T | null,
  contenu: Record<string, unknown>,
  raison: string,
  verifier: (x: unknown) => T | null,
  aSoi: (f: T) => boolean,
): Promise<{ fiche?: T; error?: string }> {
  let version = (actuelle?.version ?? 0) + 1;
  // (deux enregistrements en même temps : le second prend le numéro suivant, aucun n'écrase l'autre)
  while (Object.keys(await lireJson(supabase, cheminFicheVersion(h, g, version))).length) version++;
  const le = new Date().toISOString();
  const style = s(contenu.style);
  const historique: Etape[] = [...(actuelle?.historique ?? []), { version, le, raison: raison.slice(0, 200), style }];
  const fiche = verifier({ ...contenu, version, creee_le: le, historique });
  if (!fiche || fiche.version !== version) return { error: "Cette fiche ne tient pas." };
  if (!aSoi(fiche)) return { error: "Cette fiche désigne des images qui ne sont pas les siennes." };
  if (!(await ecrireJson(supabase, cheminFicheVersion(h, g, version), fiche))) return { error: "La fiche n'a pas pu être rangée." };
  if (!(await ecrireJson(supabase, cheminFicheEnCours(h, g), fiche))) return { error: "La fiche n'a pas pu être rangée." };
  return { fiche };
}

/** Une nouvelle version de son personnage (une nouvelle figurine, une retouche). */
export async function enregistrerVersionPerso(supabase: Supabase, h: string, contenu: Contenu<FichePerso>, raison: string): Promise<{ fiche?: FichePerso; error?: string }> {
  const { fiche: actuelle } = await lireFichePerso(supabase, h);
  return enregistrer(supabase, h, "perso", actuelle, contenu as Record<string, unknown>, raison, fichePersoValide, (f) => ficheEstASoi(f, h));
}

/** Une nouvelle version de son univers (sa création, une retouche). */
export async function enregistrerVersionMonde(supabase: Supabase, h: string, contenu: Contenu<FicheMonde>, raison: string): Promise<{ fiche?: FicheMonde; error?: string }> {
  const actuelle = await lireFicheMonde(supabase, h);
  return enregistrer(supabase, h, "monde", actuelle, contenu as Record<string, unknown>, raison, ficheMondeValide, (f) => mondeEstASoi(f, h));
}

/** « C'est moi ! » : la version en cours de son personnage est validée (elle ne sera plus regénérée sans demande). */
export async function validerFichePerso(supabase: Supabase, h: string): Promise<{ fiche?: FichePerso; error?: string }> {
  const { fiche, origine } = await lireFichePerso(supabase, h);
  if (!fiche || origine !== "rangee") return { error: "Rien à valider." };
  if (fiche.validee_le) return { fiche };
  const validee = { ...fiche, validee_le: new Date().toISOString() };
  const ok = (await ecrireJson(supabase, cheminFicheVersion(h, "perso", fiche.version), validee)) && (await ecrireJson(supabase, cheminFicheEnCours(h, "perso"), validee));
  return ok ? { fiche: validee } : { error: "La fiche n'a pas pu être rangée." };
}

/**
 * 🧩 SES AUTRES IMAGES DE RÉFÉRENCE, faites après sa validation (bouche ouverte, debout) : ajoutées à la version en
 * cours, sans en faire une nouvelle (rien de ce qu'il a validé ne change). Seulement les images de son style, jamais
 * une qui y est déjà.
 */
export async function completerReferencesPerso(supabase: Supabase, h: string, version: number, refs: Record<string, Reference>): Promise<{ fiche?: FichePerso; error?: string }> {
  const { fiche, origine } = await lireFichePerso(supabase, h);
  if (!fiche || origine !== "rangee" || fiche.version !== version) return { error: "Sa fiche a changé entre-temps." };
  const ajouts = Object.fromEntries(Object.entries(refs).filter(([nom]) => !fiche.references[nom]));
  const complete = fichePersoValide({ ...fiche, references: { ...fiche.references, ...ajouts } });
  if (!complete || !ficheEstASoi(complete, h)) return { error: "Cette fiche ne tient pas." };
  const ok = (await ecrireJson(supabase, cheminFicheVersion(h, "perso", version), complete)) && (await ecrireJson(supabase, cheminFicheEnCours(h, "perso"), complete));
  return ok ? { fiche: complete } : { error: "La fiche n'a pas pu être rangée." };
}

/**
 * 🧩 SON UNIVERS, COMPLÉTÉ (lot 4) : son décor, son image vedette, ses places relevées sur le décor, où sont ses
 * éléments — ajoutés à la version en cours, sans en faire une nouvelle (ce qu'il a validé ne change pas).
 */
export async function completerMonde(
  supabase: Supabase,
  h: string,
  version: number,
  maj: { references?: FicheMonde["references"]; scene?: FicheMonde["scene"]; zones?: Record<string, [number, number, number, number]> },
): Promise<{ fiche?: FicheMonde; error?: string }> {
  const f = await lireFicheMonde(supabase, h);
  if (!f || f.version !== version) return { error: "Son univers a changé entre-temps." };
  const elements = maj.zones ? f.elements.map((e) => (maj.zones?.[e.id] ? { ...e, zone: maj.zones[e.id] } : e)) : f.elements;
  const complete = ficheMondeValide({ ...f, references: { ...f.references, ...(maj.references ?? {}) }, ...(maj.scene ? { scene: maj.scene } : {}), elements });
  if (!complete || !mondeEstASoi(complete, h)) return { error: "Cette fiche ne tient pas." };
  const ok = (await ecrireJson(supabase, cheminFicheVersion(h, "monde", version), complete)) && (await ecrireJson(supabase, cheminFicheEnCours(h, "monde"), complete));
  return ok ? { fiche: complete } : { error: "La fiche n'a pas pu être rangée." };
}

/**
 * ↩️ REVENIR À UNE VERSION : une nouvelle version, recopiée de celle-là (ses images ne sont pas refaites ; sa
 * validation est gardée). La version 0 de son personnage est sa figurine d'aujourd'hui.
 */
export async function revenirAVersion(supabase: Supabase, h: string, g: Genre, v: unknown): Promise<{ fiche?: FichePerso | FicheMonde; error?: string; statut?: number }> {
  const n = typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : -1;
  if (n < 0) return { error: "Quelle version ?", statut: 400 };
  const ancienne = await lireVersion(supabase, h, g, n);
  if (!ancienne) return { error: "Cette version n'existe pas.", statut: 404 };
  const enCours = g === "perso" ? (await lireFichePerso(supabase, h)).fiche : await lireFicheMonde(supabase, h);
  if (enCours?.version === n) return { error: "C'est déjà la version en cours.", statut: 400 };
  const contenu: Record<string, unknown> = { ...ancienne };
  delete contenu.version;
  delete contenu.historique;
  delete contenu.creee_le;
  const raison = `retour à la version ${n}`;
  const r = g === "perso" ? await enregistrerVersionPerso(supabase, h, contenu as Contenu<FichePerso>, raison) : await enregistrerVersionMonde(supabase, h, contenu as Contenu<FicheMonde>, raison);
  return r.error ? { error: r.error, statut: 400 } : { fiche: r.fiche };
}

// ─── refaire à l'identique ─────────────────────────────────────────────────────────────────────────
/** La consigne qu'une image de référence doit avoir, recalculée à partir de la fiche seule. */
export function consigneAttendue(f: FichePerso, nom: string): string | null {
  if (f.style === "ressort-1") {
    if (nom === "neutre") return consigneFigurineClient(f.traits ?? null, f.habit ?? "");
    if (nom === "parle") return consigneBoucheNeutre();
  }
  if (f.style === "collection-1") {
    // (son fauteuil aux couleurs de son univers, lot 4b : refait sur l'image d'avant ; sinon, retouchée avec ses mots :
    // la consigne de sa dernière retouche, faite sur l'image d'avant)
    if (nom === "assise" && f.fauteuil?.de === "univers") return consigneFauteuil(f.fauteuil);
    if (nom === "assise") return f.retouches?.length ? consigneRetoucheFigurine(f.retouches[f.retouches.length - 1]) : consigneSculptee(f.traits ?? null);
    if (nom === "assise_parle") return consigneMemeFigurine("parle");
    if (nom === "debout") return consigneMemeFigurine("debout");
  }
  return null;
}
/** Pour chaque image : sa signature dit-elle mot pour mot la consigne que la fiche redonne ? */
export const refaisables = (f: FichePerso): Record<string, boolean> =>
  Object.fromEntries(Object.entries(f.references).map(([nom, r]) => [nom, Boolean(r.signature && r.signature.consigne === consigneAttendue(f, nom))]));

// ─── ce qu'on montre ───────────────────────────────────────────────────────────────────────────────
/** Ses images, en adresses signées (une heure). */
export async function referencesSignees(supabase: Supabase, refs: Record<string, Reference | undefined>, secondes = 3600): Promise<Record<string, string>> {
  const l = await Promise.all(Object.entries(refs).map(async ([nom, r]) => [nom, r ? await signer(supabase, r.chemin, secondes) : ""] as const));
  return Object.fromEntries(l.filter(([, url]) => Boolean(url)));
}

/** Ce qu'il voit de sa fiche : ni chemins, ni consignes. */
export type FichePersoVue = Pick<FichePerso, "version" | "style" | "validee_le" | "habit" | "fauteuil" | "historique"> & { images: Record<string, string>; complete: boolean };
export async function fichePersoVue(supabase: Supabase, f: FichePerso): Promise<FichePersoVue> {
  const images = await referencesSignees(supabase, f.references);
  return {
    version: f.version,
    style: f.style,
    ...(f.validee_le ? { validee_le: f.validee_le } : {}),
    ...(f.habit ? { habit: f.habit } : {}),
    ...(f.fauteuil ? { fauteuil: f.fauteuil } : {}),
    historique: f.historique,
    images,
    complete: ficheComplete(f) && Object.keys(f.references).every((nom) => Boolean(images[nom])),
  };
}
