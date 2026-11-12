/**
 * 🏡 L'UNIVERS MAÎTRE — chantier « Univers », lot 1, le socle (`docs/univers/feuille-de-route.md`, section 4.3).
 *
 * Son univers est d'abord une fiche : ce que la conversation a compris (« sa proposition »), l'ambiance, les éléments
 * du décor et LA RAISON de chacun, les règles (« la mer reste au fond »), ce qu'on ne sait pas encore, les PLACES où
 * une figurine peut s'asseoir (relevées sur le décor), qui peut entrer, et les souvenirs laissés par les visiteurs.
 * Les images en découlent : le décor (sans figurine, 9:16) et l'image vedette (avec sa figurine, pour la découverte et
 * le partage), chacune signée comme celles du personnage (`perso.ts`).
 *
 * NE JAMAIS INVENTER (`elementsVerifies`). Un élément « dit » porte une phrase que la personne a vraiment écrite : le
 * code le vérifie dans ses messages. Sinon, l'élément est montré pour ce qu'il est, une interprétation.
 *
 * Rangé dans `<habitant>/monde/` (`fiches-serveur.ts`). « monde », pas « univers » : dans le code d'aujourd'hui,
 * l'univers est le métier ou la passion qui habille la figurine (`<habitant>/univers.json`). À l'écran, on dit
 * toujours « ton univers ».
 *
 * FICHIER PUR : il se vérifie sans téléphone (`scripts/verifier-fiches.mjs`).
 */
import { cheminValide, couleurValide, etapesValides, referenceValide, type Etape, type Reference } from "./perso";

/** « Film, chaleureux » : la charte des univers validée au lot 0 (12 novembre 2026). */
export const STYLES_MONDE = ["film-chaleureux-1"] as const;
export type StyleMonde = (typeof STYLES_MONDE)[number];

/** D'où vient un élément : il l'a dit (sa phrase, vérifiée), ou c'est une interprétation (montrée comme telle). */
export type SourceElement = "dit" | "interpretation";
export type ElementMonde = {
  id: string;
  quoi: string;
  pourquoi: string;
  source: SourceElement;
  /** où il est sur le décor : x, y, largeur, hauteur, de 0 à 1 (« Les clés de ton univers » : il le touche) */
  zone?: [number, number, number, number];
  /** il l'a validé : il est verrouillé (une retouche ne l'enlève pas) */
  valide?: boolean;
};
/** Une place : où une figurine s'assoit, à quelle taille (`echelle`), en fraction du décor. */
export type PlaceMonde = { id: string; x: number; y: number; echelle: number };
export const DIRECTIONS_LUMIERE = ["gauche", "droite", "haut", "face"] as const;
export type SceneMonde = { sol: number; places: PlaceMonde[]; lumiere: { vient_de: (typeof DIRECTIONS_LUMIERE)[number]; couleur: string } };
/** Qui peut entrer : tout le monde, mes proches, moi seul (« mes proches », par défaut : section 13 de la feuille de route). */
export const VISIBILITES = ["tous", "proches", "moi"] as const;
export type Visibilite = (typeof VISIBILITES)[number];
export const VISIBILITE_PAR_DEFAUT: Visibilite = "proches";
/** Un souvenir laissé par un visiteur : un objet posé PAR-DESSUS le décor (rien n'est regénéré) ; visible une fois accepté. */
export type Souvenir = { id: string; de: string; objet: string; mot?: string; le: string; accepte_le?: string };

export type FicheMonde = {
  version: number;
  style: StyleMonde;
  creee_le: string;
  validee_le?: string;
  proposition: string;
  ambiance: { lumiere: string; palette: string[] };
  elements: ElementMonde[];
  regles: string[];
  inconnus: string[];
  scene: SceneMonde;
  references: { decor?: Reference; vedette?: Reference };
  visibilite: Visibilite;
  souvenirs: Souvenir[];
  historique: Etape[];
};

const txt = (x: unknown, max = 400) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
const date = (x: unknown) => (typeof x === "string" && !Number.isNaN(Date.parse(x)) ? x : "");
const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
const ident = (x: unknown) => (typeof x === "string" && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(x) ? x : "");
const textes = (x: unknown, max: number) => (Array.isArray(x) ? x.map((y) => txt(y, 200)).filter(Boolean).slice(0, max) : []);

function elementValide(x: unknown): ElementMonde | null {
  const o = (x ?? {}) as Record<string, unknown>;
  const id = ident(o.id);
  const quoi = txt(o.quoi, 200);
  if (!id || !quoi) return null;
  const e: ElementMonde = { id, quoi, pourquoi: txt(o.pourquoi, 300), source: o.source === "dit" ? "dit" : "interpretation" };
  if (Array.isArray(o.zone) && o.zone.length === 4 && o.zone.every((v) => fraction(v) !== null)) e.zone = o.zone as [number, number, number, number];
  if (o.valide === true) e.valide = true;
  return e;
}

function sceneValide(x: unknown): SceneMonde {
  const o = (x ?? {}) as Record<string, unknown>;
  const l = (o.lumiere ?? {}) as Record<string, unknown>;
  const vu = new Set<string>();
  const places = (Array.isArray(o.places) ? o.places : [])
    .map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const id = ident(q.id);
      const x = fraction(q.x);
      const y = fraction(q.y);
      const echelle = typeof q.echelle === "number" && q.echelle > 0.2 && q.echelle <= 3 ? q.echelle : 1;
      if (!id || x === null || y === null || vu.has(id)) return null;
      vu.add(id);
      return { id, x, y, echelle };
    })
    .filter((p): p is PlaceMonde => Boolean(p))
    .slice(0, 6);
  return {
    sol: fraction(o.sol) ?? 0.78,
    places,
    lumiere: { vient_de: DIRECTIONS_LUMIERE.find((d) => d === l.vient_de) ?? "gauche", couleur: couleurValide(l.couleur) || "#ffd9a0" },
  };
}

function souvenirValide(x: unknown): Souvenir | null {
  const o = (x ?? {}) as Record<string, unknown>;
  const id = ident(o.id);
  const de = typeof o.de === "string" && /^[a-f0-9]{16}$/.test(o.de) ? o.de : "";
  const objet = txt(o.objet, 80);
  const le = date(o.le);
  if (!id || !de || !objet || !le) return null;
  return { id, de, objet, le, ...(txt(o.mot, 140) ? { mot: txt(o.mot, 140) } : {}), ...(date(o.accepte_le) ? { accepte_le: date(o.accepte_le) } : {}) };
}

export function ficheMondeValide(x: unknown): FicheMonde | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const version = typeof o.version === "number" && Number.isInteger(o.version) && o.version >= 1 ? o.version : null;
  const style = STYLES_MONDE.find((st) => st === o.style);
  const creee_le = date(o.creee_le);
  if (version === null || !style || !creee_le) return null;
  const elements: ElementMonde[] = [];
  for (const e of (Array.isArray(o.elements) ? o.elements : []).map(elementValide)) {
    if (e && !elements.some((x) => x.id === e.id) && elements.length < 24) elements.push(e);
  }
  const refs = (o.references ?? {}) as Record<string, unknown>;
  const decor = referenceValide(refs.decor);
  const vedette = referenceValide(refs.vedette);
  const ambiance = (o.ambiance ?? {}) as Record<string, unknown>;
  const f: FicheMonde = {
    version,
    style,
    creee_le,
    proposition: txt(o.proposition, 600),
    ambiance: { lumiere: txt(ambiance.lumiere, 120), palette: Array.isArray(ambiance.palette) ? ambiance.palette.map(couleurValide).filter(Boolean).slice(0, 6) : [] },
    elements,
    regles: textes(o.regles, 12),
    inconnus: textes(o.inconnus, 12),
    scene: sceneValide(o.scene),
    references: { ...(decor ? { decor } : {}), ...(vedette ? { vedette } : {}) },
    visibilite: VISIBILITES.find((v) => v === o.visibilite) ?? VISIBILITE_PAR_DEFAUT,
    souvenirs: (Array.isArray(o.souvenirs) ? o.souvenirs : []).map(souvenirValide).filter((s): s is Souvenir => Boolean(s)).slice(-200),
    historique: etapesValides(o.historique),
  };
  if (date(o.validee_le)) f.validee_le = date(o.validee_le);
  return f;
}

export const cheminsDuMonde = (f: FicheMonde): string[] =>
  [f.references.decor, f.references.vedette].filter((r): r is Reference => Boolean(r)).flatMap((r) => [r.chemin, ...(r.signature?.entrees ?? [])]);
export const mondeEstASoi = (f: FicheMonde, h: string) => cheminsDuMonde(f).every((c) => cheminValide(c) && c.startsWith(`${h}/`));

/** Une phrase, ramenée à ses mots (minuscules, sans accents ni ponctuation) : pour retrouver une citation. */
export const sesMots = (x: string) =>
  x
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * 🔎 NE JAMAIS INVENTER : un élément « dit » doit citer une phrase qu'il a vraiment écrite (au moins trois mots, retrouvés
 * tels quels dans l'un de ses messages). Sinon il redevient une « interprétation », montrée comme telle. `retrogrades` :
 * les éléments qui ont changé.
 */
export function elementsVerifies(f: FicheMonde, sesMessages: string[]): { fiche: FicheMonde; retrogrades: string[] } {
  const dits = sesMessages.map((m) => ` ${sesMots(m)} `);
  const retrogrades: string[] = [];
  const elements = f.elements.map((e) => {
    if (e.source !== "dit") return e;
    const cite = sesMots(e.pourquoi);
    const trouve = cite.split(" ").length >= 3 && dits.some((m) => m.includes(` ${cite} `));
    if (trouve) return e;
    retrogrades.push(e.id);
    return { ...e, source: "interpretation" as const };
  });
  return { fiche: { ...f, elements }, retrogrades };
}

/** Les souvenirs que les visiteurs voient : ceux qu'il a acceptés. */
export const souvenirsVisibles = (f: FicheMonde) => f.souvenirs.filter((s) => Boolean(s.accepte_le));
