/**
 * 🧍 LE PERSONNAGE MAÎTRE — chantier « Univers », lot 1, le socle (`docs/univers/feuille-de-route.md`, section 4.2).
 *
 * UNE FICHE, PAS UNE IMAGE. Sa figurine est d'abord une description : son style, ses traits (décrits sur son selfie),
 * ce qu'il fait dans la vie (sa tenue en dépend), son fauteuil, et ses IMAGES DE RÉFÉRENCE, toujours au même cadre.
 * Chaque image garde sa SIGNATURE (le moteur, la consigne mot pour mot, les réglages, ce qu'on lui a donné en entrée,
 * la date, l'empreinte des octets) : de quoi la refaire à l'identique, ou savoir pourquoi ce n'est plus identique.
 *
 * LES VERSIONS. Une version validée n'est jamais regénérée sans demande : une nouvelle figurine, c'est une nouvelle
 * version ; revenir en arrière aussi (on recopie la fiche d'avant, ses images ne sont pas refaites). La « version 0 »
 * est la figurine d'aujourd'hui (le style « ressort-1 ») : elle n'est pas rangée, elle se lit dans `clik_ma_figurine`
 * (`fiches-serveur.ts`), pour que l'appli d'aujourd'hui marche exactement comme avant.
 *
 * Rangement (`fiches-serveur.ts`) : `<habitant>/perso/fiche.json` (la version en cours), `<habitant>/perso/v<n>/`
 * (la fiche de chaque version et ses images).
 *
 * FICHIER PUR (aucun import à l'exécution) : il se vérifie sans téléphone (`scripts/verifier-fiches.mjs`).
 */
import type { Traits } from "./figurine-pro";

/**
 * LES STYLES. « ressort-1 » : la figurine d'aujourd'hui (debout sur son ressort, fond rose ; ses consignes restent dans
 * le code, éteintes le jour venu). « collection-1 » : la figurine « Sculptée, détourée » validée au lot 0 (12 novembre
 * 2026) — la tête re-sculptée en caricature de collection, assise dans son fauteuil, fond transparent.
 */
export const STYLES_PERSO = ["ressort-1", "collection-1"] as const;
export type StylePerso = (typeof STYLES_PERSO)[number];

/** Les images de référence de chaque style (toujours au même cadre : on peut passer de l'une à l'autre). */
export const REFERENCES_DU_STYLE: Record<StylePerso, readonly string[]> = {
  "ressort-1": ["neutre", "parle"],
  "collection-1": ["assise", "assise_parle", "debout"],
};

/** Ce qui a fait une image : de quoi la refaire à l'identique. `entrees` : les images données au moteur (leurs chemins). */
export type Signature = {
  moteur: string;
  consigne: string;
  qualite?: string;
  fidelite?: "high" | "low";
  fond?: "transparent" | "opaque";
  entrees: string[];
  le: string;
  dureeS?: number;
  jetons?: number;
  /** les octets de l'image rangée (sha256, 16 caractères) : on sait si c'est encore la même */
  empreinte?: string;
};
export type Reference = { chemin: string; signature?: Signature };
/** Une version de la fiche, dans son historique : quand, pourquoi, dans quel style. */
export type Etape = { version: number; le: string; raison: string; style: string };

/**
 * 🪑 LE FAUTEUIL FAIT PARTIE DE SON IDENTITÉ (décidé le 12 novembre 2026) : un fauteuil « de départ » à la création,
 * refait aux couleurs de son univers une fois celui-ci créé (« ton fauteuil a pris les couleurs de ton monde »). Il
 * l'emporte quand il rend visite : deux fauteuils face à face, c'est une conversation.
 */
export type Fauteuil = { description: string; couleurs: string[]; de: "depart" | "univers" };
export const FAUTEUIL_DE_DEPART: Fauteuil = {
  description: "a small, cosy upholstered armchair at the figurine's scale (soft felted fabric, a rounded shape, little wooden feet)",
  couleurs: ["#c9a27e", "#7a4b2a"],
  de: "depart",
};

/**
 * 🪑 SON FAUTEUIL AUX COULEURS DE SON UNIVERS (lot 4b) : le même fauteuil, les couleurs de la palette de son monde (au
 * plus trois) ; `null` sans couleur. La consigne de son image se redonne à partir de lui (`consigneFauteuil`).
 */
export function fauteuilAuxCouleurs(palette: string[]): Fauteuil | null {
  const c = palette.map(couleurValide).filter(Boolean).slice(0, 3);
  return c.length ? { description: FAUTEUIL_DE_DEPART.description, couleurs: c, de: "univers" } : null;
}

export type Tenue = { description: string; couleurs: string[]; accessoires: string[] };

export type FichePerso = {
  version: number;
  style: StylePerso;
  creee_le: string;
  /** « C'est moi ! » : le jour où il l'a validée (une version validée n'est jamais regénérée sans demande) */
  validee_le?: string;
  traits?: Traits;
  /** son métier ou sa passion (facultatif) : sa figurine s'habille en conséquence */
  habit?: string;
  tenue?: Tenue;
  fauteuil?: Fauteuil;
  references: Record<string, Reference>;
  /** le dossier de ses visages, faits à la demande à partir de sa référence (`figurine-expressions-serveur.ts`) */
  visages?: { dossier: string };
  /** son selfie, s'il l'a laissé (pour refaire sa figurine dans un nouveau style) */
  photo?: { chemin: string; accord_le?: string };
  /**
   * ✏️ les retouches qu'il a demandées avec ses mots, dans l'ordre, pour arriver à son image « assise » (la dernière
   * est la consigne de cette image : `consigneAttendue`, `fiches-serveur.ts`)
   */
  retouches?: string[];
  historique: Etape[];
};

// ─── les vérifications (ce qui est lu dans le seau ne fait pas foi tant qu'il n'est pas vérifié) ───────────────
const txt = (x: unknown, max = 4000) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const date = (x: unknown) => (typeof x === "string" && !Number.isNaN(Date.parse(x)) ? x : "");
const entier = (x: unknown) => (typeof x === "number" && Number.isInteger(x) && x >= 0 ? x : null);
const positif = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : undefined);
/** Un chemin du seau : relatif, sans « .. », sans rien de bizarre. */
export const cheminValide = (x: unknown): string => (typeof x === "string" && /^[A-Za-z0-9][A-Za-z0-9._\-/]{0,300}$/.test(x) && !x.includes("..") && !x.includes("//") ? x : "");
export const couleurValide = (x: unknown): string => (typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x) ? x.toLowerCase() : "");
const couleurs = (x: unknown, max = 6) => (Array.isArray(x) ? x.map(couleurValide).filter(Boolean).slice(0, max) : []);
const textes = (x: unknown, max: number, long = 200) => (Array.isArray(x) ? x.map((y) => txt(y, long)).filter(Boolean).slice(0, max) : []);

export function signatureValide(x: unknown): Signature | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const moteur = txt(o.moteur, 120);
  const consigne = txt(o.consigne, 20_000);
  const le = date(o.le);
  if (!moteur || !consigne || !le) return undefined;
  const sig: Signature = { moteur, consigne, entrees: Array.isArray(o.entrees) ? o.entrees.map(cheminValide).filter(Boolean).slice(0, 6) : [], le };
  if (txt(o.qualite, 20)) sig.qualite = txt(o.qualite, 20);
  if (o.fidelite === "high" || o.fidelite === "low") sig.fidelite = o.fidelite;
  if (o.fond === "transparent" || o.fond === "opaque") sig.fond = o.fond;
  if (positif(o.dureeS) !== undefined) sig.dureeS = positif(o.dureeS);
  if (positif(o.jetons) !== undefined) sig.jetons = positif(o.jetons);
  if (typeof o.empreinte === "string" && /^[a-f0-9]{16}$/.test(o.empreinte)) sig.empreinte = o.empreinte;
  return sig;
}

export function referenceValide(x: unknown): Reference | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const chemin = cheminValide(o.chemin);
  if (!chemin) return null;
  const signature = signatureValide(o.signature);
  return signature ? { chemin, signature } : { chemin };
}

export function etapesValides(x: unknown): Etape[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      const version = entier(o.version);
      const le = date(o.le);
      return version !== null && le ? { version, le, raison: txt(o.raison, 200), style: txt(o.style, 40) } : null;
    })
    .filter((e): e is Etape => Boolean(e))
    .slice(-100);
}

function traitsValides(x: unknown): Traits | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const t: Traits = {};
  for (const k of ["cheveux", "barbe", "visage", "sourcils", "yeux", "nez", "age", "signes", "expression", "accentuer"] as const) {
    const v = txt(o[k], 140);
    if (v) t[k] = v;
  }
  if (typeof o.lunettes === "boolean") t.lunettes = o.lunettes;
  if (txt(o.portrait, 320)) t.portrait = txt(o.portrait, 320);
  return Object.keys(t).length ? t : undefined;
}

export function fauteuilValide(x: unknown): Fauteuil | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const description = txt(o.description, 400);
  if (!description) return undefined;
  return { description, couleurs: couleurs(o.couleurs), de: o.de === "univers" ? "univers" : "depart" };
}

/** La fiche lue dans le seau, vérifiée ; `null` si elle ne tient pas (un style inconnu, une référence qui n'est pas du style…). */
export function fichePersoValide(x: unknown): FichePerso | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const version = entier(o.version);
  const style = STYLES_PERSO.find((st) => st === o.style);
  const creee_le = date(o.creee_le);
  if (version === null || !style || !creee_le) return null;
  const permis = REFERENCES_DU_STYLE[style];
  const references: Record<string, Reference> = {};
  for (const [nom, r] of Object.entries((o.references ?? {}) as Record<string, unknown>)) {
    const ref = permis.includes(nom) ? referenceValide(r) : null;
    if (ref) references[nom] = ref;
  }
  const f: FichePerso = { version, style, creee_le, references, historique: etapesValides(o.historique) };
  if (date(o.validee_le)) f.validee_le = date(o.validee_le);
  const traits = traitsValides(o.traits);
  if (traits) f.traits = traits;
  if (txt(o.habit, 60)) f.habit = txt(o.habit, 60);
  if (o.tenue && typeof o.tenue === "object") {
    const t = o.tenue as Record<string, unknown>;
    if (txt(t.description, 400)) f.tenue = { description: txt(t.description, 400), couleurs: couleurs(t.couleurs), accessoires: textes(t.accessoires, 8, 80) };
  }
  const fauteuil = fauteuilValide(o.fauteuil);
  if (fauteuil) f.fauteuil = fauteuil;
  const dossier = cheminValide((o.visages as Record<string, unknown> | undefined)?.dossier);
  if (dossier) f.visages = { dossier };
  const photo = o.photo as Record<string, unknown> | undefined;
  if (cheminValide(photo?.chemin)) f.photo = { chemin: cheminValide(photo?.chemin), ...(date(photo?.accord_le) ? { accord_le: date(photo?.accord_le) } : {}) };
  const retouches = textes(o.retouches, 10, 120);
  if (retouches.length) f.retouches = retouches;
  return f;
}

/** Tous les chemins d'une fiche (ses images, ses entrées, son dossier de visages, son selfie). */
export function cheminsDeLaFiche(f: FichePerso): string[] {
  return [
    ...Object.values(f.references).flatMap((r) => [r.chemin, ...(r.signature?.entrees ?? [])]),
    ...(f.visages ? [f.visages.dossier] : []),
    ...(f.photo ? [f.photo.chemin] : []),
  ];
}
/** Une fiche ne désigne que ce qui est à lui (rien dans le dossier d'un autre). */
export const ficheEstASoi = (f: FichePerso, h: string) => cheminsDeLaFiche(f).every((c) => c.startsWith(`${h}/`));

/** Elle est complète : toutes les images de référence de son style sont là. */
export const ficheComplete = (f: FichePerso) => REFERENCES_DU_STYLE[f.style].every((nom) => Boolean(f.references[nom]));
