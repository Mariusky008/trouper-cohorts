/**
 * 🎬 LES SCÈNES DU FIL DE LA VILLE — un modèle par métier, posé sur les vrais
 * assets du commerce, et FIGÉ dans la publication au moment du partage.
 *
 * « L'utilisateur fait une action simple — partager un essai, une découverte
 * ou un message — et Clikme lui donne automatiquement la présentation
 * appropriée. » Ce fichier décide de cette présentation. Il ne fabrique
 * aucune image : une scène est une DESCRIPTION DE CALQUES (le décor, la zone
 * de l'affiche, le fantôme du commerce), que l'écran empile. Rien ne se
 * génère quand on ouvre le fil ou qu'on le fait défiler.
 *
 * ═══ LES QUATRE CHOSES QU'ON DISTINGUE, COMME DEMANDÉ ═════════════════════
 *
 *   · LE DÉCOR FIXE — la photo ClikMe du commerce (sa vraie devanture, au ton
 *     chaud, son fantôme déjà peint dedans : `couverture.ts`) quand elle
 *     existe ; sinon la devanture du modèle, dessinée autour de SES photos à
 *     lui (on voit son intérieur par la porte, son nom sur l'enseigne) ;
 *   · LE FANTÔME DU COMMERCE — déjà dans la photo ClikMe, ou posé en calque
 *     devant la devanture du modèle (`/direct/ville/hote-*.webp`) ;
 *   · LA ZONE DU CONTENU — l'affiche en vitrine : sa place exacte en fractions
 *     de la scène, sa perspective, son cadrage ;
 *   · LE CONTENU — l'essai du client, TEL QUEL. Jamais redessiné : pas de
 *     visage refait, pas de tenue changée, pas de coupe recoiffée.
 *
 * ═══ POURQUOI ON FIGE LA SCÈNE DANS LA PUBLICATION ════════════════════════
 *
 * « Une publication existante doit conserver son rendu si le commerce change
 * ensuite sa devanture ou son décor. » La scène est donc recopiée dans la
 * publication au moment du partage, avec sa version (`VERSION_SCENES`). Le
 * commerçant change sa photo : les publications suivantes prennent la
 * nouvelle, les anciennes gardent celle qu'elles montraient.
 *
 * ═══ CE QU'ON NE FAIT PAS ══════════════════════════════════════════════════
 *
 * On n'impose pas de décor : une photo prise sur place reste une photo, un
 * message reste léger. Une scène qui ne peut pas se monter (décor absent,
 * image cassée) retombe sur une carte simple avec le contenu d'origine — voir
 * `scene-ville.tsx`. Et rien n'est présenté comme vécu : l'affiche porte
 * « Essai virtuel », une salle enrichie de fantômes « Ambiance illustrée ».
 *
 * FICHIER PARTAGÉ : aucune dépendance au navigateur.
 */
import type { CarteAutour, CleMetier } from "@/lib/direct/apercu-habitant";

/** Monte quand le dessin d'un modèle change. Une scène figée garde la sienne. */
export const VERSION_SCENES = 1;

/** Ce que l'affiche doit laisser voir du sujet. */
export type Cadrage = "visage" | "en-pied" | "mains";

/** Une zone de la scène, en fractions (0 à 1) de sa largeur et de sa hauteur. */
export type Zone = { x: number; y: number; w: number; h: number };

/** Un calque d'image posé dans la scène : un fantôme, un objet de premier plan. */
export type Calque = { src: string; x: number; y: number; h: number; miroir?: boolean };

/**
 * L'AFFICHE EN VITRINE — où l'essai prend place.
 * `pivot` : la perspective, en degrés autour de l'axe vertical (0 = de face).
 */
export type Affiche = Zone & { pivot: number; cadrage: Cadrage; mot: string };

export type SceneVitrine = {
  v: number;
  rendu: "vitrine";
  /**
   * LA PHOTO CLIKME DU COMMERCE, si on la prend pour décor — son fantôme est
   * déjà dedans. Absente : la devanture du modèle, dessinée.
   */
  decor?: string;
  /** Ce qu'on voit par la porte de la devanture dessinée : une photo à lui. */
  interieur?: string;
  enseigne: string;
  sousTitre: string;
  services: string[];
  affiche: Affiche;
  /** Le fantôme du commerce, en calque — absent quand le décor l'a déjà. */
  hote?: Calque;
};

export type SceneAmbiance = {
  v: number;
  rendu: "ambiance";
  /** Les fantômes posés dans la salle : la scène dit alors « Ambiance illustrée ». */
  fantomes: Calque[];
};

export type SceneVille = SceneVitrine | SceneAmbiance;

/* ═══ UN MODÈLE PAR MÉTIER ══════════════════════════════════════════════════
   « Prévoir un modèle de scène réutilisable par métier, puis l'adapter aux
   assets de chaque commerce, plutôt qu'un développement spécifique pour
   chaque boutique. » */
type ModeleVitrine = {
  cadrage: Cadrage;
  sousTitre: string;
  services: string[];
  mot: string;
  hote: string;
  /** Si le commerçant n'a aucune photo d'intérieur à montrer par la porte. */
  interieur: string;
};

const MODELES: Partial<Record<CleMetier, ModeleVitrine>> = {
  coiffeur: {
    cadrage: "visage",
    sousTitre: "Salon de coiffure",
    services: ["Coiffure", "Coloration", "Soins", "Conseils"],
    mot: "Une coupe qui me ressemble",
    hote: "/direct/ville/hote-coiffeur.webp",
    interieur: "/direct/salon-neuf.jpg",
  },
  mode: {
    cadrage: "en-pied",
    sousTitre: "Prêt-à-porter",
    services: ["Mode", "Accessoires", "Conseils", "Retouches"],
    mot: "Confiance en toute occasion",
    hote: "/direct/ville/hote-mode.webp",
    interieur: "/direct/vitrine-mode.jpg",
  },
  ongles: {
    cadrage: "mains",
    sousTitre: "Beauté des mains",
    services: ["Manucure", "Semi-permanent", "Nail art", "Conseils"],
    mot: "Des mains qui me ressemblent",
    hote: "/direct/ville/hote-onglerie.webp",
    interieur: "/direct/avis-cabine.jpg",
  },
  lunetier: {
    cadrage: "visage",
    sousTitre: "Opticien",
    services: ["Lunettes", "Solaires", "Examens", "Conseils"],
    mot: "Un regard qui me ressemble",
    hote: "/direct/ville/hote-opticien.webp",
    interieur: "/direct/lunetier.jpeg",
  },
  artisan: {
    cadrage: "mains",
    sousTitre: "Atelier",
    services: ["Créations", "Sur mesure", "Pièces uniques"],
    mot: "Fait à la main, ici",
    hote: "/direct/ville/hote-artisan.webp",
    interieur: "/direct/atelier-bijoux.jpg",
  },
};

/** Ce qu'une scène lit d'un commerce — de quoi la préparer sans la carte entière. */
export type CommerceDeScene = Pick<CarteAutour, "branche" | "nom" | "ville" | "photo"> &
  Partial<Pick<CarteAutour, "photos" | "sesPhotos" | "couverture" | "couvertureHote">>;

/** Les métiers dont un essai se partage en affiche, dans leur vitrine. */
export function aUneVitrine(branche: CleMetier | undefined): boolean {
  return Boolean(branche && MODELES[branche]);
}

/** Le fantôme du métier, pour une miniature ou un avatar. */
export function fantomeDuMetier(branche: CleMetier | undefined): string {
  const direct: Partial<Record<CleMetier, string>> = {
    restaurant: "/direct/ville/hote-serveur.webp",
    bar: "/direct/ville/hote-barman.webp",
    fleuriste: "/direct/ville/hote-fleuriste.webp",
    librairie: "/direct/ville/hote-libraire.webp",
  };
  return (branche && (MODELES[branche]?.hote ?? direct[branche])) || "/direct/ville/client-ravi.webp";
}

/**
 * SON NOM SUR L'ENSEIGNE. Les commerces de la démonstration ont des noms qui
 * décrivent (« Un salon du centre ») : en lettres dorées sur un auvent, ça ne
 * se lit pas comme un nom. On y met alors le métier, et le nom reste sous la
 * publication, là où on le touche.
 */
function enseigneDe(c: CommerceDeScene, m: ModeleVitrine): string {
  const nom = c.nom.trim();
  return /^(un|une|des|le salon|la boutique)\s/i.test(nom) ? m.sousTitre : nom;
}

/** Une photo d'intérieur à lui, si on en trouve une — jamais le produit essayé. */
function interieurDe(c: CommerceDeScene, m: ModeleVitrine): string {
  const parMot = (c.sesPhotos ?? []).find((p) => /salle|salon|boutique|int[ée]rieur|atelier|cabine|magasin|lieu/i.test(p.quoi));
  if (parMot) return parMot.src;
  const autres = (c.photos ?? []).filter((p) => p && p !== c.photo);
  return autres[autres.length - 1] ?? m.interieur;
}

/**
 * LA SCÈNE DE VITRINE D'UN COMMERCE — préparée une fois par modèle, adaptée à
 * ses assets. `null` pour un métier sans vitrine : l'essai part alors en carte
 * simple, avec le nom et la miniature du commerce.
 */
export function sceneDeVitrine(c: CommerceDeScene | undefined): SceneVitrine | null {
  if (!c) return null;
  const m = MODELES[c.branche];
  if (!m) return null;
  const ville = (c.ville || "").trim();
  const enseigne = enseigneDe(c, m);
  const base = {
    v: VERSION_SCENES,
    rendu: "vitrine" as const,
    enseigne,
    // LE MÉTIER UNE FOIS, PAS DEUX : sous une enseigne qui le dit déjà, la ville seule.
    sousTitre: enseigne === m.sousTitre ? ville : ville ? `${m.sousTitre} · ${ville}` : m.sousTitre,
    services: m.services,
  };
  // SA PHOTO CLIKME, QUAND ELLE EXISTE : la vraie devanture, le fantôme déjà
  // peint. L'affiche se pose du côté où il n'est pas, pour ne jamais le
  // cacher, et se tourne légèrement vers le centre de la rue.
  if (c.couverture && /^https:\/\//.test(c.couverture)) {
    const h = c.couvertureHote;
    const aDroite = !h || h.x + h.w / 2 >= 0.5;
    const w = m.cadrage === "en-pied" ? 0.3 : 0.38;
    return {
      ...base,
      decor: c.couverture,
      affiche: {
        x: aDroite ? 0.07 : 0.93 - w,
        y: 0.2,
        w,
        h: 0.64,
        pivot: aDroite ? 8 : -8,
        cadrage: m.cadrage,
        mot: m.mot,
      },
    };
  }
  // LA DEVANTURE DU MODÈLE : sa porte ouverte sur son intérieur, son nom en
  // haut, ses services sur le pilier, son fantôme sur le pas de la porte.
  const enPied = m.cadrage === "en-pied";
  return {
    ...base,
    interieur: interieurDe(c, m),
    affiche: {
      x: 0.085,
      y: 0.245,
      w: enPied ? 0.3 : 0.42,
      h: 0.62,
      pivot: 0,
      cadrage: m.cadrage,
      mot: m.mot,
    },
    hote: { src: m.hote, x: enPied ? 0.6 : 0.66, y: 0.97, h: 0.5 },
  };
}

/* ═══ L'AMBIANCE D'UN LIEU ══════════════════════════════════════════════════
   « Bar, soirée : photo réelle de l'intérieur ; si elle est mise en scène avec
   des fantômes, afficher "Ambiance illustrée". » Deux clients fantômes, posés
   au premier plan, jamais au milieu de la salle. Seulement sur la photo du
   commerçant : la photo prise par un habitant reste une photo. */
export function sceneDAmbiance(): SceneAmbiance {
  return {
    v: VERSION_SCENES,
    rendu: "ambiance",
    fantomes: [
      { src: "/direct/ville/client-verre.webp", x: 0.16, y: 1.02, h: 0.52 },
      { src: "/direct/ville/client-rit.webp", x: 0.84, y: 1.02, h: 0.48, miroir: true },
    ],
  };
}

/* ═══ QUEL RENDU POUR QUEL CONTENU ═════════════════════════════════════════ */

/** Ce qu'on partage d'un commerce dans « Une découverte ». */
export type ContenuPartage = {
  type: "plat" | "produit" | "evenement" | "lieu" | "photo";
  nom: string;
  detail?: string;
  prix?: string;
  photo?: string;
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

/** Le cadrage d'un essai d'après le métier — pour une carte simple aussi. */
export function cadrageDe(branche: CleMetier | undefined): Cadrage {
  return (branche && MODELES[branche]?.cadrage) || "visage";
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
const calque = (v: unknown): Calque | undefined => {
  if (!v || typeof v !== "object") return undefined;
  const c = v as Record<string, unknown>;
  const src = image(c.src);
  if (!src || !src.startsWith("/direct/ville/")) return undefined;
  return { src, x: nombre(c.x, -0.2, 1.2, 0.5), y: nombre(c.y, 0, 1.2, 1), h: nombre(c.h, 0.05, 1, 0.5), ...(c.miroir ? { miroir: true } : {}) };
};

/**
 * RELIRE UNE SCÈNE venue du serveur ou du stockage — tout ce qui n'est pas
 * reconnu tombe, et une scène illisible devient `undefined` : la publication
 * s'affiche alors en carte simple, sans rien perdre de son contenu.
 */
export function lireScene(v: unknown): SceneVille | undefined {
  if (!v || typeof v !== "object") return undefined;
  const s = v as Record<string, unknown>;
  if (s.rendu === "ambiance") {
    const f = (Array.isArray(s.fantomes) ? s.fantomes : []).map(calque).filter((x): x is Calque => Boolean(x)).slice(0, 4);
    return { v: nombre(s.v, 1, 99, 1), rendu: "ambiance", fantomes: f };
  }
  if (s.rendu !== "vitrine" || !s.affiche || typeof s.affiche !== "object") return undefined;
  const a = s.affiche as Record<string, unknown>;
  const cadrage: Cadrage = a.cadrage === "en-pied" || a.cadrage === "mains" ? a.cadrage : "visage";
  const decor = image(s.decor);
  const interieur = image(s.interieur);
  if (!decor && !interieur) return undefined;
  const hote = calque(s.hote);
  return {
    v: nombre(s.v, 1, 99, 1),
    rendu: "vitrine",
    ...(decor ? { decor } : {}),
    ...(interieur ? { interieur } : {}),
    enseigne: chaine(s.enseigne, 60),
    sousTitre: chaine(s.sousTitre, 60),
    services: (Array.isArray(s.services) ? s.services : []).map((x) => chaine(x, 24)).filter(Boolean).slice(0, 5),
    affiche: {
      x: nombre(a.x, 0, 1, 0.08),
      y: nombre(a.y, 0, 1, 0.24),
      w: nombre(a.w, 0.1, 1, 0.42),
      h: nombre(a.h, 0.1, 1, 0.62),
      pivot: nombre(a.pivot, -25, 25, 0),
      cadrage,
      mot: chaine(a.mot, 60),
    },
    ...(hote ? { hote } : {}),
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
  };
}
