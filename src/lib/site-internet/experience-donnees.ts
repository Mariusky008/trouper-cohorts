// 🍽️ CE QUE LE RESTAURATEUR DONNE À SON EXPÉRIENCE — et les scènes qu'on en fait.
//
// « Je m'occupe de la page admin du commerçant, et tu fais : le moteur
// redessine la photo […] le restaurateur voit la scène dans son espace
// commerçant et peut la refuser pour garder sa photo d'origine. »
//
// RANGÉ DANS LE DIAGNOSTIC, À CÔTÉ DE LA PHOTO CLIKME (`diagnostic.experience`),
// pour la même raison qu'elle : aucune migration, et la page le lit déjà.
//
// CE FICHIER NE FAIT QUE LIRE ET DÉCIDER — aucun appel au moteur, aucun
// disque. La page et la carte l'importent ; la fabrication est dans
// `experience-scenes.ts`, côté serveur seulement.

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Une boîte en fractions de l'image (0 à 1). */
export type Boite = { x: number; y: number; l: number; h: number };

/**
 * UNE SCÈNE, ET OÙ ELLE EN EST.
 *
 * - `attente`  : à fabriquer (photo neuve, ou « refaire » demandé) ;
 * - `en-cours` : le moteur travaille (`at` dit depuis quand) ;
 * - `prete`    : faite, montrée sur sa page ;
 * - `echec`    : le moteur n'a pas su (`erreur`), on réessaiera ;
 * - `refusee`  : il a préféré sa photo d'origine — la scène est gardée
 *                (`url`), il peut la reprendre.
 */
export type EtatScene = {
  etat: "attente" | "en-cours" | "prete" | "echec" | "refusee";
  /** LA PHOTO DONT ELLE EST FAITE. Une scène ne vaut que pour cette photo-là. */
  source: string;
  url?: string;
  essais?: number;
  at?: string;
  erreur?: string;
  modele?: string;
  /** Scène du cuisinier : où le fantôme est assis (on le rend touchable). */
  boite?: Boite;
};

export type PlatDuChef = {
  nom: string;
  prix?: string;
  /** SA photo du plat — c'est elle qu'on montre tant que la scène n'est pas là. */
  photo: string;
  /** Ce qu'il en dit (« Ce plat, c'est celui que je cuisine… ») : écrit, et dit de sa voix. */
  phrase?: string;
  /** La partie de la phrase en rose, si elle est donnée. */
  phraseFort?: string;
};

export type ExperienceResto = {
  plat?: PlatDuChef;
  /** La photo du cuisinier (étape 3). */
  chef?: { photo: string };
  scenePlat?: EtatScene;
  sceneChef?: EtatScene;
};

/* ═══ LES DIMENSIONS DES SCÈNES, CELLES DES MAQUETTES ═══════════════════════
   Toute scène rendue y est remise : la page les compose en pour cent, et une
   scène d'un autre format ferait tomber le fantôme à côté de sa boîte. */
export const SCENE_PLAT = { l: 941, h: 761 } as const;
export const SCENE_CHEF = { l: 941, h: 1672 } as const;

const ETATS = new Set(["attente", "en-cours", "prete", "echec", "refusee"]);

function lireBoite(v: unknown): Boite | undefined {
  if (!v || typeof v !== "object") return undefined;
  const b = v as Record<string, unknown>;
  const n = (k: string) => (typeof b[k] === "number" && Number.isFinite(b[k]) ? (b[k] as number) : NaN);
  const [x, y, l, h] = [n("x"), n("y"), n("l"), n("h")];
  if ([x, y, l, h].some((v) => Number.isNaN(v))) return undefined;
  if (x < 0 || y < 0 || l <= 0 || h <= 0 || x + l > 1.02 || y + h > 1.02) return undefined;
  return { x, y, l, h };
}

function lireScene(v: unknown): EtatScene | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const etat = s(o.etat);
  const source = s(o.source);
  if (!ETATS.has(etat) || !source) return undefined;
  return {
    etat: etat as EtatScene["etat"],
    source,
    url: /^https?:\/\//i.test(s(o.url)) ? s(o.url) : undefined,
    essais: typeof o.essais === "number" ? o.essais : undefined,
    at: s(o.at) || undefined,
    erreur: s(o.erreur).slice(0, 300) || undefined,
    modele: s(o.modele) || undefined,
    boite: lireBoite(o.boite),
  };
}

/** L'EXPÉRIENCE TELLE QUE LE DIAGNOSTIC LA GARDE — rien de ce qui est mal formé. */
export function experienceDuDiagnostic(diag: unknown): ExperienceResto | null {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const e = d.experience;
  if (!e || typeof e !== "object") return null;
  const o = e as Record<string, unknown>;
  const p = (o.plat && typeof o.plat === "object" ? o.plat : null) as Record<string, unknown> | null;
  const c = (o.chef && typeof o.chef === "object" ? o.chef : null) as Record<string, unknown> | null;
  const plat: PlatDuChef | undefined =
    p && s(p.nom) && /^https?:\/\//i.test(s(p.photo))
      ? {
          nom: s(p.nom).slice(0, 80),
          prix: s(p.prix).slice(0, 20) || undefined,
          photo: s(p.photo),
          phrase: s(p.phrase).slice(0, 220) || undefined,
          phraseFort: s(p.phraseFort).slice(0, 120) || undefined,
        }
      : undefined;
  const chef = c && /^https?:\/\//i.test(s(c.photo)) ? { photo: s(c.photo) } : undefined;
  return { plat, chef, scenePlat: lireScene(o.scenePlat), sceneChef: lireScene(o.sceneChef) };
}

/** LA SCÈNE À MONTRER : faite, pour CETTE photo, et pas refusée. */
export function sceneMontree(scene: EtatScene | undefined, photo: string | undefined): EtatScene | undefined {
  return scene && scene.etat === "prete" && scene.url && photo && scene.source === photo ? scene : undefined;
}

/* ═══ QUAND RELANCER LE MOTEUR ════════════════════════════════════════════
   La même règle que l'hôte de la photo ClikMe : trois essais à dix minutes
   d'écart, puis un par jour. Un rendu qui tourne depuis plus de six minutes
   est tenu pour perdu (la route s'arrête à cinq). */
const DIX_MINUTES = 10 * 60_000;
const UN_JOUR = 24 * 3600_000;
const PERDU = 6 * 60_000;

export function sceneAFaire(scene: EtatScene | undefined, maintenant = Date.now()): boolean {
  if (!scene) return false;
  const depuis = scene.at ? maintenant - Date.parse(scene.at) : Infinity;
  if (scene.etat === "attente") return true;
  if (scene.etat === "en-cours") return !(depuis < PERDU);
  if (scene.etat === "echec") return (scene.essais ?? 0) < 3 ? !(depuis < DIX_MINUTES) : !(depuis < UN_JOUR);
  return false;
}
