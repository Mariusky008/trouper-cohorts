/**
 * 🎬 LES SCÈNES DU FIL DE LA VILLE — de VRAIS décors, chacun avec sa zone
 * d'affiche définie, et la scène FIGÉE dans la publication au partage.
 *
 * « L'utilisateur fait une action simple — partager un essai, une découverte
 * ou un message — et Clikme lui donne automatiquement la présentation
 * appropriée. » Ce fichier décide de cette présentation. Il ne fabrique
 * aucune image : une scène est une DESCRIPTION DE CALQUES que l'écran empile.
 * Rien ne se génère quand on ouvre le fil ou qu'on le fait défiler.
 *
 * ═══ CE QUI A CHANGÉ, ET POURQUOI ═════════════════════════════════════════
 *
 * La première version dessinait une devanture générique autour des photos du
 * commerce, et posait l'affiche « du côté où le fantôme n'est pas ». Deux
 * retours, justes tous les deux : « les devantures ressemblent à de petites
 * vitrines dessinées », et « cette règle est trop approximative — selon la
 * photo, l'affiche peut masquer une porte ou paraître suspendue dans le
 * vide ». Il faut une zone définie pour chaque décor.
 *
 * DONC : UN DÉCOR = UNE VRAIE PHOTO DU COMMERCE + SES MESURES, posées une
 * fois et enregistrées avec elle —
 *
 *   · LA ZONE DE L'AFFICHE : ses quatre coins sur la photo. Ils donnent son
 *     emplacement ET sa perspective (l'écran en tire une transformation
 *     projective : l'affiche suit le plan de la vitrine) ;
 *   · LE CADRAGE de l'essai : visage, tenue entière, mains ;
 *   · LES CALQUES : le fantôme du commerce, à sa place, à son échelle, avec
 *     son ombre de contact — absent quand la photo ClikMe l'a déjà ;
 *   · LE PREMIER PLAN : les morceaux de la photo qui passent DEVANT (le bord
 *     d'une table, un objet de la vitrine). L'écran les redessine par-dessus,
 *     découpés dans la photo elle-même : aucun fichier de plus.
 *
 * Pour un vrai commerçant, ces mesures se posent sur sa photo ClikMe dans
 * l'administration (`/admin/humain/scenes`) et vivent dans son diagnostic
 * (`sceneVille`). Pour la démonstration, elles sont ici, sur les vraies
 * photos de ses commerces.
 *
 * SANS DÉCOR MESURÉ, PAS DE DÉCOR : l'essai part dans une belle carte simple,
 * avec la photo et le nom du vrai commerce. « La devanture générique risque
 * d'uniformiser tous les magasins et d'affaiblir le réalisme recherché. »
 *
 * ═══ POURQUOI ON FIGE LA SCÈNE DANS LA PUBLICATION ════════════════════════
 *
 * « Une publication existante doit conserver son rendu si le commerce change
 * ensuite sa devanture. » La scène est recopiée dans la publication au
 * partage, avec sa version (`VERSION_SCENES`).
 *
 * FICHIER PARTAGÉ : aucune dépendance au navigateur.
 */
import type { CarteAutour, CleMetier } from "@/lib/direct/apercu-habitant";

/** Monte quand le format d'une scène change. Une scène illisible tombe en carte simple. */
export const VERSION_SCENES = 2;

/** Ce que l'affiche doit laisser voir du sujet. */
export type Cadrage = "visage" | "en-pied" | "mains";

/** Un point de la photo, en fractions (0 à 1) de sa largeur et de sa hauteur. */
export type Point = [number, number];
/** Quatre coins : haut-gauche, haut-droite, bas-droite, bas-gauche. */
export type Quad = [Point, Point, Point, Point];

/**
 * UN CALQUE POSÉ DANS LA SCÈNE — un fantôme. `x` : son milieu ; `y` : là où
 * il touche le sol (ou le bord qui le cache) ; `h` : sa hauteur, en fractions
 * de la scène. `ombre` : une ombre de contact sous lui ; `filtre` : de quoi
 * le mettre dans la lumière de la photo (plus chaud, plus sombre) ; `lueur` :
 * la lumière dorée de la salle qui accroche ses contours.
 */
export type Calque = { src: string; x: number; y: number; h: number; miroir?: boolean; ombre?: boolean; filtre?: string; lueur?: boolean };

/** Le décor d'un commerce, mesuré une fois. */
export type DecorMesure = {
  decor: string;
  /** Largeur sur hauteur de la photo : la scène prend sa forme exacte. */
  ratio: number;
  coins: Quad;
  calques?: Calque[];
  devant?: Point[][];
};

export type SceneVitrine = {
  v: number;
  rendu: "vitrine";
  decor: string;
  ratio: number;
  affiche: { coins: Quad; cadrage: Cadrage; mot: string };
  calques?: Calque[];
  devant?: Point[][];
};

export type SceneAmbiance = {
  v: number;
  rendu: "ambiance";
  decor: string;
  ratio: number;
  /** Les fantômes posés dans la salle : la scène dit alors « Ambiance illustrée ». */
  calques: Calque[];
  devant?: Point[][];
};

export type SceneVille = SceneVitrine | SceneAmbiance;

/* ═══ CE QUE CHAQUE MÉTIER MONTRE SUR SON AFFICHE ══════════════════════════ */
const AFFICHE_DU_METIER: Partial<Record<CleMetier, { cadrage: Cadrage; mot: string; hote: string }>> = {
  coiffeur: { cadrage: "visage", mot: "Une coupe qui me ressemble", hote: "/direct/ville/hote-coiffeur.webp" },
  mode: { cadrage: "en-pied", mot: "Confiance en toute occasion", hote: "/direct/ville/hote-mode.webp" },
  ongles: { cadrage: "mains", mot: "Des mains qui me ressemblent", hote: "/direct/ville/hote-onglerie.webp" },
  lunetier: { cadrage: "visage", mot: "Un regard qui me ressemble", hote: "/direct/ville/hote-opticien.webp" },
  artisan: { cadrage: "mains", mot: "Fait à la main, ici", hote: "/direct/ville/hote-artisan.webp" },
};

/** Le cadrage d'un essai d'après le métier — pour une carte simple aussi. */
export function cadrageDe(branche: CleMetier | undefined): Cadrage {
  return (branche && AFFICHE_DU_METIER[branche]?.cadrage) || "visage";
}

/**
 * LA MENTION SOUS UN ESSAI — « « Essayé chez » reste ambigu : cela peut
 * laisser croire que la personne s'est réellement rendue dans le salon ».
 * L'essai est virtuel (le coin le dit) ; le commerce, lui, PROPOSE la coupe,
 * la tenue, la pose. Hors essai, simplement « Chez ».
 */
export function mentionDuCommerce(branche: CleMetier | undefined, essai: boolean): string {
  if (!essai) return "Chez";
  const mots: Partial<Record<CleMetier, string>> = {
    coiffeur: "Coupe proposée par",
    mode: "Tenue proposée par",
    ongles: "Pose proposée par",
    lunetier: "Monture proposée par",
    artisan: "Création proposée par",
  };
  return (branche && mots[branche]) || "Proposé par";
}

/** Le fantôme du métier, pour une miniature ou un avatar. */
export function fantomeDuMetier(branche: CleMetier | undefined): string {
  const direct: Partial<Record<CleMetier, string>> = {
    restaurant: "/direct/ville/hote-serveur.webp",
    bar: "/direct/ville/hote-barman.webp",
    fleuriste: "/direct/ville/hote-fleuriste.webp",
    librairie: "/direct/ville/hote-libraire.webp",
  };
  return (branche && (AFFICHE_DU_METIER[branche]?.hote ?? direct[branche])) || "/direct/ville/client-ravi.webp";
}

/* ═══ LES DÉCORS MESURÉS DE LA DÉMONSTRATION ═══════════════════════════════
   Sur les vraies photos de ses commerces, mesurées à la main sur une grille.
   Une seule devanture s'y prête aujourd'hui : la vitrine de la boutique de
   prêt-à-porter (`vitrine-mode.jpg`, la photo de son lieu). La vitrine de
   Noël au piano reste écartée — ni un salon, ni la saison. Les autres
   commerces de la démonstration partent en carte simple, et c'est voulu. */
const DECORS_DE_LA_DEMO: Record<string, DecorMesure> = {
  // L'AFFICHE PREND LA PLACE DU MANNEQUIN DE GAUCHE, derrière la vitre, et
  // s'arrête au-dessus des objets posés au sol de la vitrine : rien ne la
  // coupe. LE FANTÔME EST AU PREMIER PLAN, DEVANT LA VITRINE, COUPÉ PAR LE
  // BAS DU CADRE comme quelqu'un qui passe devant l'objectif : sans trottoir
  // dans la photo, c'est la seule place où il ne flotte pas.
  "mode-centre": {
    decor: "/direct/vitrine-mode.jpg",
    ratio: 387 / 516,
    // « L'AFFICHE EN PERSPECTIVE » : un grand panneau posé dans la vitrine,
    // tourné vers la rue — le bord gauche, plus proche, est plus haut que le
    // droit. Il s'arrête avant la silhouette beige du premier mannequin.
    coins: [
      [0.05, 0.285],
      [0.385, 0.318],
      [0.385, 0.728],
      [0.05, 0.77],
    ],
    calques: [{ src: "/direct/ville/hote-mode.webp", x: 0.8, y: 1.07, h: 0.4, filtre: "brightness(.97) sepia(.1)" }],
  },
};

/**
 * LES SALLES MESURÉES : où deux clients fantômes peuvent s'asseoir, et ce qui
 * passe devant eux. « Dans le bar, les placer derrière le bord de table quand
 * la perspective l'exige. » Repérées par la photo elle-même — une autre photo
 * de salle n'a pas ces mesures, et reste une photo.
 */
const SALLES_MESUREES: Record<string, Omit<SceneAmbiance, "v" | "rendu">> = {
  "/direct/bar-salle.jpg": {
    decor: "/direct/bar-salle.jpg",
    ratio: 450 / 300,
    calques: [
      // « TROP BLANCS PAR RAPPORT À LA LUMIÈRE DORÉE » : on les baisse au
      // niveau de la salle, on les réchauffe, et la lueur pose sur leurs
      // contours la lumière des lampes. La scène, elle, ne bouge pas.
      // DERRIÈRE LA GRANDE TABLE : on ne voit que le haut, comme quelqu'un d'assis.
      { src: "/direct/ville/client-verre.webp", x: 0.42, y: 0.8, h: 0.56, lueur: true, filtre: "brightness(.78) sepia(.42) saturate(1.25) contrast(.96)" },
      // DERRIÈRE LA TABLE DE DROITE, plus loin donc plus petit — et plus sombre.
      { src: "/direct/ville/client-rit.webp", x: 0.87, y: 0.68, h: 0.34, miroir: true, lueur: true, filtre: "brightness(.72) sepia(.42) saturate(1.25) contrast(.96)" },
    ],
    devant: [
      // La grande table et tout ce qui est en dessous.
      [
        [0.232, 0.668],
        [0.53, 0.577],
        [0.82, 0.606],
        [0.92, 0.636],
        [0.92, 0.76],
        [0.66, 0.9],
        [0.64, 1],
        [0.2, 1],
      ],
      // La table de droite.
      [
        [0.708, 0.566],
        [0.8, 0.546],
        [1, 0.533],
        [1, 1],
        [0.7, 1],
      ],
    ],
  },
};

/** Ce qu'une scène lit d'un commerce — de quoi la préparer sans la carte entière. */
export type CommerceDeScene = Pick<CarteAutour, "branche" | "nom" | "ville" | "photo"> &
  Partial<Pick<CarteAutour, "id" | "photos" | "sesPhotos" | "couverture" | "sceneVille">>;

/**
 * LA SCÈNE DE VITRINE D'UN COMMERCE — seulement s'il a un décor MESURÉ :
 * celui posé sur sa photo ClikMe dans l'administration, ou celui de la
 * démonstration. `null` sinon : l'essai part en carte simple, avec le nom et
 * la photo du vrai commerce.
 */
export function sceneDeVitrine(c: CommerceDeScene | undefined): SceneVitrine | null {
  if (!c) return null;
  const metier = AFFICHE_DU_METIER[c.branche];
  if (!metier) return null;
  const d = c.sceneVille ?? (c.id ? DECORS_DE_LA_DEMO[c.id] : undefined);
  if (!d) return null;
  return {
    v: VERSION_SCENES,
    rendu: "vitrine",
    decor: d.decor,
    ratio: d.ratio,
    affiche: { coins: d.coins, cadrage: metier.cadrage, mot: metier.mot },
    ...(d.calques?.length ? { calques: d.calques } : {}),
    ...(d.devant?.length ? { devant: d.devant } : {}),
  };
}

/**
 * L'AMBIANCE D'UNE SALLE — « Bar, soirée : photo réelle de l'intérieur ; si
 * elle est mise en scène avec des fantômes, afficher "Ambiance illustrée". »
 * Seulement sur une photo mesurée du commerçant ; une photo prise par un
 * habitant reste une photo.
 */
export function sceneDAmbiance(photo: string | undefined): SceneAmbiance | undefined {
  const s = photo ? SALLES_MESUREES[photo] : undefined;
  return s ? { v: VERSION_SCENES, rendu: "ambiance", ...s } : undefined;
}

/* ═══ QUEL RENDU POUR QUEL CONTENU ═════════════════════════════════════════ */

/** Ce qu'on partage d'un commerce dans « Une découverte ». */
export type ContenuPartage = {
  type: "plat" | "produit" | "evenement" | "lieu" | "photo";
  nom: string;
  detail?: string;
  prix?: string;
  photo?: string;
  /** Le menu du jour est une formule : la photo ne montre qu'un de ses plats. */
  formule?: boolean;
  /**
   * LE JOUR DU MENU, pour un plat du jour (AAAA-MM-JJ). « Une ancienne
   * publication ne doit pas laisser croire que le plat est toujours le menu
   * du jour » : passé ce jour, la publication dit « Au menu le 3 oct. ».
   */
  jour?: string;
};

/** Les métiers où une découverte se montre en ambiance de salle. */
export function estUnLieuDeSortie(branche: CleMetier | undefined): boolean {
  return branche === "bar";
}

/** Le jour de Paris, AAAA-MM-JJ. */
export function jourDe(t = Date.now()): string {
  return new Date(t).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
}

/** « Menu du jour » aujourd'hui, « Au menu le 3 oct. » ensuite. */
export function etiquetteDuMenu(jour: string | undefined, maintenant = Date.now()): string {
  if (!jour) return "À la carte";
  if (jour === jourDe(maintenant)) return "Menu du jour";
  const d = new Date(`${jour}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "À la carte";
  return `Au menu le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

/* ═══ CE QUI VIENT DU RÉSEAU : on ne recopie que ce qu'on sait dessiner ════ */
const nombre = (v: unknown, min: number, max: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const chaine = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
/** Une image d'ici (`/direct/…`) ou rangée chez nous (https). */
const image = (v: unknown) => {
  const s = chaine(v, 600);
  return /^https:\/\//i.test(s) || /^\/[a-z0-9/_.-]+$/i.test(s) ? s : undefined;
};
const point = (v: unknown): Point | undefined => {
  if (!Array.isArray(v) || v.length !== 2) return undefined;
  const [x, y] = v.map(Number);
  return Number.isFinite(x) && Number.isFinite(y) ? [Math.min(1.2, Math.max(-0.2, x)), Math.min(1.2, Math.max(-0.2, y))] : undefined;
};
const polygone = (v: unknown): Point[] | undefined => {
  if (!Array.isArray(v) || v.length < 3 || v.length > 16) return undefined;
  const l = v.map(point);
  return l.every(Boolean) ? (l as Point[]) : undefined;
};
const quad = (v: unknown): Quad | undefined => {
  const l = polygone(v);
  return l && l.length === 4 ? (l as Quad) : undefined;
};
/** Un filtre CSS de lumière, et rien d'autre. */
const filtre = (v: unknown) => {
  const s = chaine(v, 80);
  return /^((brightness|sepia|saturate|contrast|hue-rotate)\([0-9.]+(deg)?\)\s*)+$/.test(s) ? s : undefined;
};
const calque = (v: unknown): Calque | undefined => {
  if (!v || typeof v !== "object") return undefined;
  const c = v as Record<string, unknown>;
  const src = image(c.src);
  if (!src || !src.startsWith("/direct/ville/")) return undefined;
  const f = filtre(c.filtre);
  return {
    src,
    x: nombre(c.x, -0.2, 1.2, 0.5),
    y: nombre(c.y, 0, 1.3, 1),
    h: nombre(c.h, 0.05, 1, 0.4),
    ...(c.miroir ? { miroir: true } : {}),
    ...(c.ombre ? { ombre: true } : {}),
    ...(c.lueur ? { lueur: true } : {}),
    ...(f ? { filtre: f } : {}),
  };
};
const calques = (v: unknown) => (Array.isArray(v) ? v : []).map(calque).filter((x): x is Calque => Boolean(x)).slice(0, 4);
const devants = (v: unknown) => (Array.isArray(v) ? v : []).map(polygone).filter((x): x is Point[] => Boolean(x)).slice(0, 4);

/** Relire un décor mesuré — celui posé dans l'administration, par exemple. */
export function lireDecor(v: unknown): DecorMesure | undefined {
  if (!v || typeof v !== "object") return undefined;
  const d = v as Record<string, unknown>;
  const decor = image(d.decor);
  const coins = quad(d.coins);
  if (!decor || !coins) return undefined;
  const c = calques(d.calques);
  const dv = devants(d.devant);
  return { decor, ratio: nombre(d.ratio, 0.3, 3, 1.5), coins, ...(c.length ? { calques: c } : {}), ...(dv.length ? { devant: dv } : {}) };
}

/**
 * RELIRE UNE SCÈNE venue du serveur ou du stockage — tout ce qui n'est pas
 * reconnu tombe, et une scène illisible (ou d'un ancien format) devient
 * `undefined` : la publication s'affiche alors en carte simple, sans rien
 * perdre de son contenu.
 */
export function lireScene(v: unknown): SceneVille | undefined {
  if (!v || typeof v !== "object") return undefined;
  const s = v as Record<string, unknown>;
  const decor = image(s.decor);
  if (!decor) return undefined;
  const base = { v: nombre(s.v, 1, 99, VERSION_SCENES), decor, ratio: nombre(s.ratio, 0.3, 3, 1.5) };
  const dv = devants(s.devant);
  if (s.rendu === "ambiance") {
    const c = calques(s.calques);
    return c.length ? { ...base, rendu: "ambiance", calques: c, ...(dv.length ? { devant: dv } : {}) } : undefined;
  }
  if (s.rendu !== "vitrine" || !s.affiche || typeof s.affiche !== "object") return undefined;
  const a = s.affiche as Record<string, unknown>;
  const coins = quad(a.coins);
  if (!coins) return undefined;
  const cadrage: Cadrage = a.cadrage === "en-pied" || a.cadrage === "mains" ? a.cadrage : "visage";
  const c = calques(s.calques);
  return {
    ...base,
    rendu: "vitrine",
    affiche: { coins, cadrage, mot: chaine(a.mot, 60) },
    ...(c.length ? { calques: c } : {}),
    ...(dv.length ? { devant: dv } : {}),
  };
}

/** Relire un contenu partagé — même règle. */
export function lireContenu(v: unknown): ContenuPartage | undefined {
  if (!v || typeof v !== "object") return undefined;
  const c = v as Record<string, unknown>;
  const types = ["plat", "produit", "evenement", "lieu", "photo"] as const;
  const type = types.find((t) => t === c.type);
  const nom = chaine(c.nom, 120);
  if (!type || !nom) return undefined;
  const photo = image(c.photo);
  const jour = /^\d{4}-\d{2}-\d{2}$/.test(chaine(c.jour, 10)) ? chaine(c.jour, 10) : undefined;
  return {
    type,
    nom,
    ...(chaine(c.detail, 160) ? { detail: chaine(c.detail, 160) } : {}),
    ...(chaine(c.prix, 30) ? { prix: chaine(c.prix, 30) } : {}),
    ...(photo ? { photo } : {}),
    ...(jour ? { jour } : {}),
    ...(c.formule ? { formule: true } : {}),
  };
}
