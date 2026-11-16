/**
 * 🛋️ LA PIÈCE DU DUO — la décision du 15 novembre 2026 (`docs/univers/piece-du-duo.md`). Le propriétaire : « que
 * penses-tu de pouvoir choisir la pièce dans laquelle on se sent bien avec cette personne (et on peut en changer selon
 * l'humeur) […] avec toujours les mêmes éléments (télé, disque, cadre, le chat…) ? » ; puis « oui », avec ces cinq
 * pièces, et leurs images faites par une page d'essai de l'admin.
 *
 * Chaque conversation se passe dans une pièce choisie à deux (et changée selon l'humeur) ; toutes les pièces ont LES
 * MÊMES EMPLACEMENTS — la télé (les liens partagés), la platine (la chanson), les cadres (les photos), l'étagère (les
 * rendez-vous, les souvenirs), la fenêtre (la vue), deux places, le coin du chat — : chaque chose ne se fait qu'une fois,
 * et suit le duo d'une pièce à l'autre. Les pièces sont un catalogue, fait une fois pour tous (comme les compagnons).
 *
 * Ce fichier est partagé (l'écran et le serveur).
 */

/**
 * LES CINQ PIÈCES, REFAITES (15 novembre 2026, l'avis de la session de l'univers sur les premières, accepté par le
 * propriétaire : « je suis d'accord avec tout ») : elles se ressemblaient trop (le même coucher de soleil doré, le même
 * bois, le même pan de mur) — chacune a maintenant SA signature (`signature` : ses couleurs, ses matières, son moment) ;
 * les objets étaient entassés et petits — ils sont répartis, chacun à part, assez grands pour le doigt et pour le zoom ;
 * l'étagère et les cadres étaient pleins — ils sont vides ; les deux places sont proches, tournées l'une vers l'autre (la
 * caméra pourra les cadrer ensemble) ; la chambre : deux fauteuils devant la baie, plus le bord du lit ; la terrasse :
 * une véranda, une carafe de citronnade.
 *
 * TROIS LIEUX POUR LES PLUS JEUNES, ET DES OBJETS EN GRAND (16 novembre 2026, le propriétaire : « pour un ado de 15 ou
 * 20 ans, ce n'est pas du tout funky et cool : il veut sûrement être dans un hangar, un appartement à New York ou dans une
 * rue, toujours avec les mêmes objets mais en plus grand — ça fait petit, la télé ou le cadre ; une scène plus large où
 * l'on voit plus de choses, et les figurines seront donc plus petites ») : le hangar, l'appart à New York, la rue ; et
 * pour toutes, la consigne (`consignePieceDuo`) cadre plus large et fait les objets bien plus grands. Un lieu sans mur
 * de salon (la rue) dit où vont la platine, les cadres et l'étagère (`platine`, `cadres`, `etagere`).
 */
export const PIECES_DUO = [
  {
    cle: "salon",
    nom: "Le salon",
    pour: "entre amis",
    emoji: "🛋️",
    moment: "soir",
    lieu: "a cosy living room in the evening",
    signature: "deep teal-blue walls, mustard-yellow and cream fabrics, dark wood and brass, a small fireplace with a gentle fire, warm table lamps",
    places: "a sofa and an armchair, close together and turned three-quarters toward each other, a small round coffee table between them",
    vue: "a tall window on the roofs of a city, with a few lit windows",
    chat: "a round cat basket with a cushion on the rug, near the fireplace",
    tele: "a flat TV on its own piece of wall",
  },
  {
    cle: "cuisine",
    nom: "La cuisine",
    pour: "en famille",
    emoji: "🍳",
    moment: "matin",
    lieu: "a bright family kitchen in the morning",
    signature: "white zellige tiles, sunny yellow and sage-green cupboards, light oak, a bowl of lemons, morning sun streaming in",
    places: "a small round wooden table with two chairs close together, turned three-quarters toward each other",
    vue: "a window above the sink on a sunny vegetable garden",
    chat: "a cushion for a cat on a little wooden bench",
    tele: "a small flat TV on the wall",
  },
  {
    cle: "terrasse",
    nom: "La terrasse",
    pour: "pour une citronnade au soleil",
    emoji: "🌇",
    moment: "matin",
    lieu: "a covered veranda terrace in full daylight: a solid roof and the white back wall of a house, wide open on the view",
    signature: "whitewashed walls, blue and white, terracotta tiles, an olive tree in a big pot, bougainvillea",
    places: "two outdoor armchairs close together, turned three-quarters toward each other; between them, a small low table with a glass carafe of lemonade with lemon slices and two glasses of lemonade",
    vue: "a bright blue sky over the sea and a white village",
    chat: "a cushion for a cat on a low stone bench",
    tele: "a flat TV on the back wall, sheltered under the roof",
  },
  {
    cle: "chambre",
    nom: "La chambre vue mer",
    pour: "en amoureux",
    emoji: "🌊",
    moment: "soir",
    lieu: "a peaceful bedroom by the sea (tender and calm, nothing suggestive)",
    signature: "linen white, soft blue and sand colours, light wood, sheer curtains; the bed neatly made, on one side of the room, only partly visible",
    places: "two small armchairs in front of the large bay window, close together and turned three-quarters toward each other, a little round side table between them",
    vue: "a large bay window with a wide view on the sea",
    chat: "a round cat basket on the rug, at the foot of the bed",
    tele: "a flat TV on a side wall, its screen visible to us",
  },
  {
    cle: "cafe",
    nom: "Le café",
    pour: "pour un café, entre copains",
    emoji: "☕",
    moment: "matin",
    lieu: "a small neighbourhood café on a rainy morning, a cosy refuge from the rain",
    signature: "cream walls, bottle-green tiles and green leather, brass and marble, raindrops running down the big window",
    places: "the end of a booth bench and a bistro chair, close together around a small round marble table holding two cups of coffee, turned three-quarters toward each other",
    vue: "a big window on a rainy street, raindrops on the glass, umbrellas passing by",
    chat: "a cushion for a cat on the window seat",
    tele: "a flat TV on the wall",
  },
  {
    cle: "hangar",
    nom: "Le hangar",
    pour: "entre potes",
    emoji: "🛹",
    moment: "soir",
    lieu: "a huge converted warehouse, the coolest hangout for teenagers and young adults: raw brick walls, a very high ceiling with exposed black metal beams, giant industrial windows",
    signature: "pink and electric-blue neon strip lights, colorful abstract street-art murals (no letters at all), a skateboard and a basketball hoop on the brick wall, string lights, big plants, a polished concrete floor; urban, funky and cool",
    places: "a big worn leather sofa and a giant bean bag, close together and turned three-quarters toward each other, a low table made of wooden crates between them",
    vue: "a giant industrial window on the city at dusk",
    chat: "an old cushion for a cat on a wooden pallet",
    tele: "a huge flat TV on the brick wall",
  },
  {
    cle: "newyork",
    nom: "L’appart à New York",
    pour: "entre amis, en ville",
    emoji: "🗽",
    moment: "nuit",
    lieu: "a cool apartment high up in New York City, with a huge window on the Manhattan skyline",
    signature: "exposed brick and black metal, a fire escape just outside the window, warm Edison bulbs and a purple-blue neon glow, a rack of sneakers, a guitar on the wall, big plants; urban, funky and cool",
    places: "a low modern sofa and a big round armchair, close together and turned three-quarters toward each other, a small coffee table with a bowl of popcorn between them",
    vue: "a huge window on the lit Manhattan skyline, the fire escape in front of it",
    chat: "a round cat bed on the wide windowsill",
    tele: "a huge flat TV on the brick wall",
  },
  {
    cle: "rue",
    nom: "La rue",
    pour: "pour traîner dehors",
    emoji: "🌆",
    moment: "soir",
    lieu: "a lively street corner in Brooklyn in the evening, seen from the sidewalk: the stoop of a brownstone building and the high brick wall of the building next to it",
    signature: "warm streetlights, colorful shop glows and neon without any letters, big colorful abstract street-art murals (no letters at all), string lights across the street, a fire hydrant, a basketball on the sidewalk; urban, funky and cool",
    places: "two upturned wooden crates on the sidewalk, close together and turned three-quarters toward each other",
    vue: "the street behind, a yellow taxi passing by, lit windows and the evening sky above the rooftops",
    chat: "a flattened cardboard box for a cat on the bottom step of the stoop",
    tele: "a huge outdoor LED screen mounted on the brick wall",
    platine: "A record player (a turntable) on a folding DJ table with a big speaker, on the OTHER side from the screen, with a few vinyl records beside it",
    cadres: "Two big EMPTY poster frames fixed on the brick wall: a plain light mat inside, no picture, no drawing",
    etagere: "One long wooden plank shelf fixed on the brick wall, completely EMPTY (nothing at all on it)",
  },
] as const;
export type PieceDuo = (typeof PIECES_DUO)[number]["cle"];
export const pieceDuoValide = (x: unknown): x is PieceDuo => PIECES_DUO.some((p) => p.cle === x);
export const pieceDuoDe = (x: PieceDuo) => PIECES_DUO.find((p) => p.cle === x)!;

/**
 * 🌤️ LES TROIS LUMIÈRES : chaque pièce existe au matin, au soir et la nuit (la même pièce, les mêmes emplacements ; la
 * lumière seule change), faites une fois. Son moment à elle (`moment`) est son image première (`decor.png`) ; les deux
 * autres en sont des retouches (`lumiere-<moment>.png`). La conversation prendra celle de l'heure (`momentDuoDe`) : la
 * variation de l'heure, sans rien générer par personne.
 */
export const MOMENTS_DUO = [
  { cle: "matin", nom: "Matin", emoji: "🌤️", lumiere: "daytime: clear natural daylight through the window, a bright sky outside, the lamps switched off" },
  { cle: "soir", nom: "Soir", emoji: "🌇", lumiere: "early evening, just after sunset: a deep blue and pink sky outside, the warm lamps of the room just switched on" },
  { cle: "nuit", nom: "Nuit", emoji: "🌙", lumiere: "night: dark outside (a night sky, a few stars or lit windows far away), the room lit only by its own warm lamps, cosy pools of light and soft shadows" },
] as const;
export type MomentDuo = (typeof MOMENTS_DUO)[number]["cle"];
export const momentDuoValide = (x: unknown): x is MomentDuo => MOMENTS_DUO.some((m) => m.cle === x);
/** Le moment d'une heure (de 0 à 23, à l'heure de Paris) : le matin de 7 h à 17 h, le soir jusqu'à 21 h, puis la nuit. */
export const momentDuoDe = (heure: number): MomentDuo => (heure >= 7 && heure < 17 ? "matin" : heure >= 17 && heure < 21 ? "soir" : "nuit");
/** Les deux moments à faire en retouche (ceux qui ne sont pas le sien). */
export const lumieresAFaire = (p: PieceDuo): MomentDuo[] => MOMENTS_DUO.map((m) => m.cle).filter((m) => m !== pieceDuoDe(p).moment);

/** Une zone sur l'image : x, y, largeur, hauteur, de 0 à 1. */
export type Zone = [number, number, number, number];
/** Où une figurine s'assoit : le point où elle touche son siège, et sa hauteur assise (en part de l'image). */
export type PlaceDuo = { x: number; y: number; hauteur: number };
/** Les emplacements, relevés sur la pièce par un modèle qui voit. */
export type EmplacementsDuo = {
  tele?: Zone;
  /**
   * 📐 (15 novembre 2026, le propriétaire : « la télé posée au mur est en perspective, donc plus large à droite qu'à
   * gauche ») les quatre coins de l'écran, posés à la main — en haut à gauche, en haut à droite, en bas à droite, en bas
   * à gauche, en fractions de l'image ; `tele` est alors leur boîte. La télé (`TeleDuo`, `coins`) s'y déforme.
   */
  teleCoins?: [number, number][];
  platine?: Zone;
  cadres: Zone[];
  etagere?: Zone;
  fenetre?: Zone;
  places: PlaceDuo[];
  chat?: { x: number; y: number };
};

/** Les emplacements, tels qu'on les montre (l'emoji, le nom). */
export const EMPLACEMENTS_DITS = {
  tele: { emoji: "📺", nom: "La télé", sert: "les liens que vous vous envoyez" },
  platine: { emoji: "🎵", nom: "La platine", sert: "votre chanson" },
  cadres: { emoji: "🖼️", nom: "Les cadres", sert: "vos photos" },
  etagere: { emoji: "📚", nom: "L’étagère", sert: "vos rendez-vous, vos souvenirs" },
  fenetre: { emoji: "🪟", nom: "La fenêtre", sert: "la vue, le temps qu’il fait" },
  places: { emoji: "🪑", nom: "Vos deux places", sert: "vos figurines" },
  chat: { emoji: "🐾", nom: "Le coin du chat", sert: "votre compagnon" },
} as const;

const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
function zoneValide(x: unknown): Zone | undefined {
  if (!Array.isArray(x) || x.length !== 4) return undefined;
  const z = x.map(fraction);
  if (z.some((v) => v === null)) return undefined;
  const [a, b, l, h] = z as number[];
  return l > 0.01 && h > 0.01 && a + l <= 1.02 && b + h <= 1.02 ? [a, b, l, h] : undefined;
}

/** Les quatre coins d'un écran, s'ils tiennent debout (quatre points dans l'image, assez écartés). */
export function coinsValides(x: unknown): [number, number][] | null {
  if (!Array.isArray(x) || x.length !== 4) return null;
  const c = x.map((p) => (Array.isArray(p) && p.length === 2 ? [fraction(p[0]), fraction(p[1])] : [null, null]));
  if (c.some(([a, b]) => a === null || b === null)) return null;
  const pts = c as [number, number][];
  const b = boiteDesCoins(pts);
  return b[2] > 0.02 && b[3] > 0.015 ? pts.map(([a, z]) => [Math.round(a * 1000) / 1000, Math.round(z * 1000) / 1000] as [number, number]) : null;
}
/** La boîte de quatre coins : x, y, largeur, hauteur. */
export function boiteDesCoins(c: [number, number][]): Zone {
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].map((v) => Math.round(v * 1000) / 1000);
  return [x1, y1, Math.round((x2 - x1) * 1000) / 1000, Math.round((y2 - y1) * 1000) / 1000];
}

/** Les emplacements relevés, vérifiés (des fractions de l'image ; ce qui est faux est laissé de côté). */
export function emplacementsValides(o: unknown): EmplacementsDuo {
  const r = (o ?? {}) as Record<string, unknown>;
  const places = (Array.isArray(r.places) ? r.places : [])
    .map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const x = fraction(q.x);
      const y = fraction(q.y);
      const hauteur = fraction(q.hauteur);
      return x !== null && y !== null && hauteur !== null && hauteur >= 0.08 && hauteur <= 0.6 ? { x, y, hauteur } : null;
    })
    .filter((p): p is PlaceDuo => Boolean(p))
    .slice(0, 2);
  const c = (r.chat ?? {}) as Record<string, unknown>;
  const cx = fraction(c.x);
  const cy = fraction(c.y);
  const coins = coinsValides(r.teleCoins);
  const tele = coins ? boiteDesCoins(coins) : zoneValide(r.tele);
  const platine = zoneValide(r.platine);
  const etagere = zoneValide(r.etagere);
  const fenetre = zoneValide(r.fenetre);
  return {
    ...(tele ? { tele } : {}),
    ...(coins ? { teleCoins: coins } : {}),
    ...(platine ? { platine } : {}),
    cadres: (Array.isArray(r.cadres) ? r.cadres : []).map(zoneValide).filter((z): z is Zone => Boolean(z)).slice(0, 4),
    ...(etagere ? { etagere } : {}),
    ...(fenetre ? { fenetre } : {}),
    places,
    ...(cx !== null && cy !== null ? { chat: { x: cx, y: cy } } : {}),
  };
}

/** Assez grand pour le doigt et pour le zoom : au moins 9 % de la largeur de l'image, et 5 % de sa hauteur. */
export const ZONE_MIN = { largeur: 0.09, hauteur: 0.05 } as const;
/**
 * ⚠️ CE QUI GÊNERAIT LE DOIGT : deux objets qui se chevauchent (on toucherait le cadre au lieu de la platine), un objet
 * trop petit (zoomé, un timbre-poste), deux places trop loin l'une de l'autre (la caméra ne les cadrerait pas ensemble).
 * La fenêtre n'y est pas (l'étagère peut être sous elle).
 */
export function alertesEmplacements(e: EmplacementsDuo): string[] {
  // (son nom, sa zone, féminin ?, sa hauteur compte ? — une étagère est fine : seule sa largeur compte)
  type Objet = [string, Zone, boolean, boolean];
  const objets: Objet[] = [
    ...(e.tele ? [["la télé", e.tele, true, true] as Objet] : []),
    ...(e.platine ? [["la platine", e.platine, true, true] as Objet] : []),
    ...e.cadres.map((z, k) => [e.cadres.length > 1 ? `le cadre ${k + 1}` : "le cadre", z, false, true] as Objet),
    ...(e.etagere ? [["l’étagère", e.etagere, true, false] as Objet] : []),
  ];
  const dit: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  for (let i = 0; i < objets.length; i++)
    for (let j = i + 1; j < objets.length; j++) {
      const [a, za] = objets[i];
      const [b, zb] = objets[j];
      const l = Math.min(za[0] + za[2], zb[0] + zb[2]) - Math.max(za[0], zb[0]);
      const h = Math.min(za[1] + za[3], zb[1] + zb[3]) - Math.max(za[1], zb[1]);
      // (un recouvrement de plus d'un dixième de la plus petite des deux)
      if (l > 0 && h > 0 && l * h > 0.1 * Math.min(za[2] * za[3], zb[2] * zb[3])) dit.push(`${a} et ${b} se chevauchent`);
    }
  for (const [n, z, f, hauteur] of objets) {
    const petit = `${n} est ${f ? "petite" : "petit"}`;
    if (z[2] < ZONE_MIN.largeur) dit.push(`${petit} (${pct(z[2])} de la largeur)`);
    else if (hauteur && z[3] < ZONE_MIN.hauteur) dit.push(`${petit} (${pct(z[3])} de la hauteur)`);
  }
  if (e.places.length === 2 && Math.abs(e.places[0].x - e.places[1].x) > 0.5) dit.push(`les deux places sont loin l’une de l’autre (${pct(Math.abs(e.places[0].x - e.places[1].x))} de la largeur)`);
  return dit.map((x) => x.charAt(0).toUpperCase() + x.slice(1));
}

/** Ce que la page d'essais montre de chaque pièce. */
export type PieceDuoVue = {
  cle: PieceDuo;
  nom: string;
  pour: string;
  emoji: string;
  decor?: string;
  emplacements?: EmplacementsDuo;
  releveRate?: string;
  /** (les pièces refaites) son moment à elle, ses deux autres lumières faites, ses zones posées à la main, ses alertes */
  moment: MomentDuo;
  lumieres: Partial<Record<MomentDuo, string>>;
  ajuste?: boolean;
  alertes: string[];
};
export type EtatPiecesDuo = { pieces: PieceDuoVue[]; moteurs: { image: boolean; regard: boolean } };

/** 💶 Le coût, environ (novembre 2026) : une pièce en haute qualité ; le relevé, quelques millièmes. */
export const COUT_PIECE_DUO = 0.17;

// ─── 🧩 L'EFFET « COLLAGE » : LE PREMIER ESSAI DE LA MAQUETTE (`piece-du-duo.md`, section 5) ─────────────────────────
/**
 * Deux vraies figurines dans une vraie pièce, de deux façons, côte à côte : POSÉES sur l'image de la pièce (chacune
 * assise sans son fauteuil, faite une fois par personne ; une ombre au sol, la lumière de la pièce, la taille de son
 * siège), ou GÉNÉRÉES avec la pièce (une image du duo, faite une fois par duo et par pièce). Le propriétaire choisit en
 * regardant les deux.
 */
export type FigurineDuo = { id: string; nom: string; image: string };
export type ChoixCollage = { piece: PieceDuo; a: string; b: string; moment?: MomentDuo; avis?: AvisCollage; note?: string };
export const AVIS_COLLAGE = [
  { cle: "posees", dit: "👍 Les posées tiennent" },
  { cle: "generee", dit: "👍 La générée, nettement mieux" },
  { cle: "aucune", dit: "👎 Aucune ne va" },
] as const;
export type AvisCollage = (typeof AVIS_COLLAGE)[number]["cle"];
export const avisCollageValide = (x: unknown): x is AvisCollage => AVIS_COLLAGE.some((a) => a.cle === x);
export type EtatCollage = {
  figurines: FigurineDuo[];
  choix: ChoixCollage | null;
  /** (le choix) la pièce dans la lumière choisie, les lumières faites de cette pièce, ses deux places (de gauche à
   * droite), et ce qui est fait */
  decor?: string;
  moment?: MomentDuo;
  moments: MomentDuo[];
  places: PlaceDuo[];
  poses: { a?: string; b?: string };
  generee?: string;
  moteur: boolean;
};
/** Deux places, si la pièce n'a pas été relevée (pour la caméra et les posées seulement : l'image du duo attend les vraies). */
export const PLACES_PAR_DEFAUT: PlaceDuo[] = [
  { x: 0.36, y: 0.72, hauteur: 0.17 },
  { x: 0.64, y: 0.72, hauteur: 0.17 },
];
/** Sur la figurine assise sans fauteuil (détourée au plus près), le point qui touche le siège, de haut en bas. */
export const ANCRE_ASSISE = 0.66;
/** 💶 Deux poses sans fauteuil et une image du duo, environ. */
export const COUT_COLLAGE = 0.55;

/**
 * 🎭 LA TAILLE D'UNE FIGURINE ASSISE. Une place dit où la figurine touche son siège (`x`, `y`) et `hauteur` : du haut de
 * sa tête jusqu'au siège (ce qu'on trace à la main sur la page d'essais, « La place de gauche ») ; le siège est aux deux
 * tiers de la figurine (`ANCRE_ASSISE`), ses jambes en dessous. Sa hauteur entière, de la tête aux pieds, compte pour au
 * moins `HAUTEUR_MIN_DUO` de l'image. LA TAILLE DES SIÈGES DE LA PIÈCE, PAS PLUS : les pièces sont faites pour de petites
 * figurines (des sièges d'un quart de la largeur) ; plus grandes (48 % de la hauteur, le 15 novembre), le moteur refaisait
 * la pièce en gros plan sur les deux fauteuils — plus d'étagère, plus de cadres, plus de chat.
 */
export const HAUTEUR_MIN_DUO = 0.2;
/** (la largeur d'une figurine assise, grosse tête comprise, à peu près, en part de sa hauteur) */
const LARGEUR_SUR_HAUTEUR = 0.62;
/** La hauteur entière des deux figurines assises (la même pour les deux), en part de la hauteur de l'image. */
export const hauteurDuo = (places: PlaceDuo[]): number => Math.max(HAUTEUR_MIN_DUO, ...(places.length ? places : PLACES_PAR_DEFAUT).map((p) => p.hauteur / ANCRE_ASSISE));

/** Autour des deux figurines assises, de la tête aux pieds, avec des marges (en part de leur hauteur). */
function autourDesFigurines(places: PlaceDuo[], ratio: number, marge: { haut: number; bas: number; cotes: number }): Zone {
  const ps = places.length ? places : PLACES_PAR_DEFAUT;
  const hz = hauteurDuo(ps);
  const demi = (LARGEUR_SUR_HAUTEUR / 2 + marge.cotes) * hz * ratio;
  const x1 = Math.max(0, Math.min(...ps.map((p) => p.x)) - demi);
  const x2 = Math.min(1, Math.max(...ps.map((p) => p.x)) + demi);
  const y1 = Math.max(0, Math.min(...ps.map((p) => p.y)) - (ANCRE_ASSISE + marge.haut) * hz);
  const y2 = Math.min(1, Math.max(...ps.map((p) => p.y)) + (1 - ANCRE_ASSISE + marge.bas) * hz);
  return [x1, y1, Math.max(0.01, x2 - x1), Math.max(0.01, y2 - y1)];
}

/**
 * LA ZONE DES DEUX PLACES (x, y, largeur, hauteur, en fractions de l'image) : les deux figurines de la tête aux pieds,
 * un peu de marge — la caméra de la pièce vivante y glisse pour la conversation. `ratio` : la hauteur de l'image sur sa
 * largeur (1,5 pour 1024 × 1536).
 */
export const zoneDesPlaces = (places: PlaceDuo[], ratio = 1.5): Zone => autourDesFigurines(places, ratio, { haut: 0.12, bas: 0.1, cotes: 0.08 });
/** Les deux figurines seules, de la tête aux pieds (ce que les objets protégés ne doivent pas couper). */
export const zoneDesFigurines = (places: PlaceDuo[], ratio = 1.5): Zone => autourDesFigurines(places, ratio, { haut: 0.08, bas: 0.05, cotes: 0.05 });
/**
 * LA ZONE PEINTE pour l'image du duo (le masque, puis le recollage) : les figurines déjà posées à leur taille, avec de
 * l'air au-dessus des têtes et le sol sous les pieds — le reste de la pièce n'est pas touché. (Trop juste, le premier
 * essai : les têtes coupées ; trop grande, le second : la pièce refaite en gros plan.)
 */
export const zoneDuMasque = (places: PlaceDuo[], ratio = 1.5): Zone => autourDesFigurines(places, ratio, { haut: 0.25, bas: 0.18, cotes: 0.18 });

/** 🛋️ La pièce vivante : le duo (ses deux prénoms) et ses images faites, par « pièce-moment ». */
export type DuoVivant = { a: { id: string; nom: string }; b: { id: string; nom: string }; duos: Partial<Record<string, string>> };
/** Ce que la maquette reçoit : les pièces (leurs lumières, leurs emplacements), le duo, et le moment de l'heure à Paris. */
export type EtatPieceVivante = { pieces: PieceDuoVue[]; duo: DuoVivant | null; maintenant: MomentDuo; moteur: boolean };
