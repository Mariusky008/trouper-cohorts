// 👔 MON DRESSING — les vêtements de l'habitant, et ce qui va avec.
//
// ═══ CE QU'IL A DEMANDÉ ════════════════════════════════════════════════════
//
// « Pour les magasins de vêtements il faudra que cette fonctionnalité soit
// présente aussi sur leur page commerçant, parce que si un client va sur leur
// page sans aller sur le Direct, il faut bien qu'il ait aussi cette possibilité
// de mettre ses vêtements, qui seront enregistrés dans "sa maison" et valables
// sur les pages commerçants de magasins de vêtements tout comme sur
// l'application ClikMe. Donc il faut bien penser l'ensemble. »
//
// ═══ UN SEUL DRESSING, TROIS PORTES ════════════════════════════════════════
//
// Ma Maison (la pièce « Mon dressing »), l'essai d'une boutique de vêtements
// dans l'application, et la page publique de cette boutique : les trois lisent
// LE MÊME DÉPÔT (voir `dressing-depot.ts`). Une chemise ajoutée depuis la page
// d'un magasin est dans Ma Maison, et elle sert devant la veste d'un autre
// magasin. C'est tout l'intérêt : le dressing appartient à l'habitant, pas à
// la boutique qui l'a vu se remplir.
//
// CE FICHIER-CI NE TOUCHE NI AU RÉSEAU NI À L'ÉCRAN. Il dit ce qu'est un
// vêtement, lit ce qu'en dit l'analyse, et décide ce qui se porte ensemble. Le
// serveur, le téléphone et les trois écrans s'appuient sur les mêmes règles :
// écrites deux fois, elles finiraient par se contredire devant le client.
//
// ═══ « CE QUI VA AVEC » EST UNE RÈGLE QU'ON PEUT DIRE, PAS UN SCORE OPAQUE ═══
//
// La règle des surprises vaut ici : « pas de proposition sans raison vraiment
// racontable en une phrase ». Deux choses seulement décident :
//
//   1. LA PLACE. Une veste se porte sur un haut et un bas, pas sur une autre
//      veste. Chaque pièce de boutique appelle des places (`PLACES`) et le
//      dressing les remplit.
//   2. LES COULEURS. Les neutres (blanc, beige, gris, noir, marine, jean) vont
//      avec tout ; les tons de terre vont entre eux ; et une seule couleur vive
//      par tenue. C'est ce qu'un vendeur dirait au comptoir, et c'est ce que la
//      phrase du look peut répéter sans mentir.

// ─── CE QU'EST UN VÊTEMENT ─────────────────────────────────────────────────

/** La place qu'il occupe sur une tenue. Mêmes familles que `duel.ts`, plus les chaussures. */
export type SorteVetement = "dessus" | "haut" | "maille" | "bas" | "robe" | "chaussures" | "accessoire";
export const SORTES_VETEMENT: SorteVetement[] = ["dessus", "haut", "maille", "bas", "robe", "chaussures", "accessoire"];

export const NOM_SORTE: Record<SorteVetement, string> = {
  dessus: "Veste",
  haut: "Haut",
  maille: "Pull",
  bas: "Bas",
  robe: "Robe",
  chaussures: "Chaussures",
  accessoire: "Accessoire",
};

/**
 * LES FILTRES DE LA MAQUETTE — « Tous · Hauts · Pantalons · Chaussures ·
 * Accessoires ». Une veste et un pull se rangent avec les hauts : c'est là
 * qu'on les cherche dans un placard. Les robes ont leur filtre, montré
 * seulement quand il y en a une.
 */
export type Filtre = "tous" | "hauts" | "bas" | "robes" | "chaussures" | "accessoires";
export const FILTRES: { cle: Filtre; nom: string; sortes: SorteVetement[] }[] = [
  { cle: "tous", nom: "Tous", sortes: SORTES_VETEMENT },
  { cle: "hauts", nom: "Hauts", sortes: ["haut", "maille", "dessus"] },
  { cle: "bas", nom: "Pantalons", sortes: ["bas"] },
  { cle: "robes", nom: "Robes", sortes: ["robe"] },
  { cle: "chaussures", nom: "Chaussures", sortes: ["chaussures"] },
  { cle: "accessoires", nom: "Accessoires", sortes: ["accessoire"] },
];

/** UN VOCABULAIRE FERMÉ DE COULEURS : l'analyse choisit dedans, elle n'invente pas. */
export type CleCouleur =
  | "blanc"
  | "ecru"
  | "beige"
  | "camel"
  | "marron"
  | "noir"
  | "gris"
  | "marine"
  | "jean"
  | "bleu"
  | "kaki"
  | "vert"
  | "rouge"
  | "bordeaux"
  | "rose"
  | "jaune"
  | "orange"
  | "violet"
  | "multicolore";

/**
 * LA FAMILLE DE CHAQUE COULEUR — c'est elle que la règle lit.
 *   neutre : va avec tout.
 *   terre  : va avec les neutres et avec les autres tons de terre.
 *   vive   : une seule par tenue.
 */
type Famille = "neutre" | "terre" | "vive";
export const COULEURS: Record<CleCouleur, { nom: string; hex: string; famille: Famille }> = {
  blanc: { nom: "Blanc", hex: "#F3F0E8", famille: "neutre" },
  ecru: { nom: "Écru", hex: "#E9DFC8", famille: "neutre" },
  beige: { nom: "Beige", hex: "#D6C1A0", famille: "neutre" },
  camel: { nom: "Camel", hex: "#B9874F", famille: "terre" },
  marron: { nom: "Marron", hex: "#6A4630", famille: "terre" },
  noir: { nom: "Noir", hex: "#1C1C1C", famille: "neutre" },
  gris: { nom: "Gris", hex: "#8E8E8E", famille: "neutre" },
  marine: { nom: "Marine", hex: "#22304B", famille: "neutre" },
  jean: { nom: "Bleu jean", hex: "#4D6E98", famille: "neutre" },
  bleu: { nom: "Bleu", hex: "#3B6CC6", famille: "vive" },
  kaki: { nom: "Kaki", hex: "#6C6B40", famille: "terre" },
  vert: { nom: "Vert", hex: "#3E7A4B", famille: "vive" },
  rouge: { nom: "Rouge", hex: "#B5302C", famille: "vive" },
  bordeaux: { nom: "Bordeaux", hex: "#6C1E2C", famille: "terre" },
  rose: { nom: "Rose", hex: "#E2A0B4", famille: "vive" },
  jaune: { nom: "Jaune", hex: "#E3B93A", famille: "vive" },
  orange: { nom: "Orange", hex: "#D8762D", famille: "vive" },
  violet: { nom: "Violet", hex: "#6D4A8F", famille: "vive" },
  multicolore: { nom: "Multicolore", hex: "#B07CC6", famille: "vive" },
};
export const CLES_COULEUR = Object.keys(COULEURS) as CleCouleur[];

export type StyleVetement = "decontracte" | "chic" | "sport" | "urbain" | "classique";
export const STYLES: Record<StyleVetement, string> = {
  decontracte: "Décontracté",
  chic: "Chic",
  sport: "Sport",
  urbain: "Urbain",
  classique: "Classique",
};

export type Saison = "toutes" | "printemps-ete" | "automne-hiver";
export const SAISONS: Record<Saison, string> = {
  toutes: "Toutes saisons",
  "printemps-ete": "Printemps-été",
  "automne-hiver": "Automne-hiver",
};

export type Vetement = {
  id: string;
  sorte: SorteVetement;
  /** « Chemise blanche » : court, au singulier quand c'est un objet, comme on le dirait. */
  nom: string;
  couleur: CleCouleur;
  style?: StyleVetement;
  matiere?: string;
  saison?: Saison;
  /** Une adresse affichable : URL signée du serveur, ou adresse locale du téléphone. */
  photo: string;
  ajouteLe: number;
};

/** Ce que l'analyse (ou la personne) dit d'une pièce, avant qu'elle soit rangée. */
export type Fiche = Omit<Vetement, "id" | "photo" | "ajouteLe">;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const dans = <T extends string>(liste: readonly T[], v: unknown): T | undefined =>
  liste.includes(v as T) ? (v as T) : undefined;

/** Un nom propre : court, une majuscule, sans guillemets ni balises. */
export function nomPropre(v: unknown, repli = ""): string {
  const n = str(v).replace(/[<>"«»]/g, "").replace(/\s+/g, " ").slice(0, 48);
  return n ? n[0].toUpperCase() + n.slice(1) : repli;
}

/**
 * RELIRE UNE FICHE — venue de l'analyse, du serveur ou du téléphone. Ce qui
 * n'est pas dans le vocabulaire est laissé de côté plutôt que deviné ; seule
 * la place et la couleur sont exigées, parce que ce sont elles qui décident.
 */
export function lireFiche(o: unknown): Fiche | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const sorte = dans(SORTES_VETEMENT, r.sorte);
  const couleur = dans(CLES_COULEUR, r.couleur);
  if (!sorte || !couleur) return null;
  const style = dans(Object.keys(STYLES) as StyleVetement[], r.style);
  const saison = dans(Object.keys(SAISONS) as Saison[], r.saison);
  const matiere = str(r.matiere).toLowerCase().replace(/[^a-zà-ÿ' -]/g, "").slice(0, 24);
  return {
    sorte,
    couleur,
    nom: nomPropre(r.nom, `${NOM_SORTE[sorte]} ${COULEURS[couleur].nom.toLowerCase()}`),
    ...(style ? { style } : {}),
    ...(saison ? { saison } : {}),
    ...(matiere ? { matiere } : {}),
  };
}

/** Une photo affichable : adresse du site, https, ou adresse locale du téléphone. */
const PHOTO_OK = /^(\/(?!\/)|https:\/\/|blob:|data:image\/)/;

export function lireVetement(o: unknown): Vetement | null {
  const f = lireFiche(o);
  if (!f) return null;
  const r = o as Record<string, unknown>;
  const id = str(r.id).slice(0, 64);
  const photo = str(r.photo);
  if (!id || !PHOTO_OK.test(photo)) return null;
  const t = Number(r.ajouteLe);
  return { id, ...f, photo, ajouteLe: Number.isFinite(t) && t > 0 ? t : 0 };
}

// ─── LIRE UNE PIÈCE DE BOUTIQUE PAR SON NOM ────────────────────────────────

const mots = (s: string) => new RegExp(`(^|[^a-zà-ÿ])(${s})([^a-zà-ÿ]|$)`, "i");

/** Les mêmes familles que `duel.ts`, et les chaussures que le comptoir n'avait pas. */
const SORTES_PAR_NOM: [SorteVetement, RegExp][] = [
  ["chaussures", mots("baskets?|sneakers?|chaussures?|bottes?|bottines?|boots|mocassins?|derbys?|derbies|sandales?|escarpins?|ballerines?|espadrilles?|tennis")],
  ["robe", mots("robes?|combinaisons?")],
  ["dessus", mots("vestes?|surchemises?|blousons?|manteaux?|manteau|doudounes?|parkas?|trench|caban|perfecto|bomber|kimono|blazers?")],
  ["maille", mots("pulls?|gilets?|cardigans?|sweats?|sweat-shirts?|hoodies?|mailles?|col roul[ée]")],
  ["haut", mots("chemises?|chemisiers?|blouses?|polos?|t-shirts?|tee-shirts?|tops?|marini[eè]res?|d[ée]bardeurs?|bodys?")],
  ["bas", mots("jeans?|pantalons?|chinos?|jupes?|shorts?|leggings?|joggings?|bermudas?")],
  ["accessoire", mots("[ée]charpes?|sacs?|ceintures?|bonnets?|chapeaux?|chapeau|casquettes?|foulards?|bijoux?|colliers?|bracelets?|lunettes?|montres?")],
];

const COULEURS_PAR_NOM: [CleCouleur, RegExp][] = [
  ["jean", mots("jean|denim|brut")],
  ["marine", mots("marine|navy")],
  ["blanc", mots("blanc(he)?s?|optique")],
  ["ecru", mots("[ée]cru(e)?s?|cr[eè]me|ivoire|naturel(le)?s?")],
  ["beige", mots("beiges?|sable|lin")],
  ["camel", mots("camel|cognac|caramel|moutarde")],
  ["marron", mots("marron|chocolat|tabac|brun(e)?s?")],
  ["noir", mots("noir(e)?s?|anthracite")],
  ["gris", mots("gris(e)?s?|chin[ée](e)?s?")],
  ["kaki", mots("kaki|olive|militaire")],
  ["vert", mots("vert(e)?s?|sapin|[ée]meraude")],
  ["bordeaux", mots("bordeaux|prune|lie de vin")],
  ["rouge", mots("rouges?|brique|rouille|terracotta")],
  ["rose", mots("roses?|poudr[ée](e)?s?|fuchsia")],
  ["jaune", mots("jaunes?")],
  ["orange", mots("oranges?|corail")],
  ["violet", mots("violet(te)?s?|lilas|mauve")],
  ["bleu", mots("bleu(e)?s?|ciel|turquoise")],
];

export function sorteDuNom(nom: string, couvre?: "buste" | "silhouette" | "bas"): SorteVetement | undefined {
  const parNom = SORTES_PAR_NOM.find(([, re]) => re.test(nom))?.[0];
  if (parNom) return parNom;
  return couvre === "bas" ? "bas" : couvre === "silhouette" ? "robe" : couvre === "buste" ? "haut" : undefined;
}

export function couleurDuNom(nom: string): CleCouleur | undefined {
  return COULEURS_PAR_NOM.find(([, re]) => re.test(nom))?.[0];
}

/** La pièce de la boutique, telle que le dressing la regarde. */
export type PieceBoutique = {
  id: string;
  nom: string;
  photo: string;
  prix?: string;
  sorte?: SorteVetement;
  couleur?: CleCouleur;
  /** Ce que le commerçant en dit — le look s'en sert si le filtre refuse sa photo. */
  decrire?: string;
};

// ─── CE QUI SE PORTE ENSEMBLE ──────────────────────────────────────────────

/**
 * LES PLACES QU'APPELLE UNE PIÈCE. Chaque ligne est une tenue complète :
 * « veste » demande un haut (ou une maille), un bas, des chaussures. Les
 * places marquées `facultative` sont un plus, jamais une condition.
 */
type Place = { sortes: SorteVetement[]; facultative?: boolean };
const PLACES: Record<SorteVetement, Place[]> = {
  dessus: [{ sortes: ["haut", "maille"] }, { sortes: ["bas"] }, { sortes: ["chaussures"] }],
  haut: [{ sortes: ["bas"] }, { sortes: ["chaussures"] }, { sortes: ["dessus", "maille"], facultative: true }],
  maille: [{ sortes: ["bas"] }, { sortes: ["chaussures"] }, { sortes: ["haut"], facultative: true }],
  bas: [{ sortes: ["haut", "maille"] }, { sortes: ["chaussures"] }, { sortes: ["dessus"], facultative: true }],
  robe: [{ sortes: ["chaussures"] }, { sortes: ["dessus", "maille"], facultative: true }],
  chaussures: [{ sortes: ["haut", "maille"] }, { sortes: ["bas"] }],
  accessoire: [{ sortes: ["haut", "maille"] }, { sortes: ["bas"] }, { sortes: ["chaussures"] }],
};

/** Les sortes qu'une pièce peut accueillir à côté d'elle. */
export function sortesQuiVontAvec(s: SorteVetement): SorteVetement[] {
  return [...new Set(PLACES[s].flatMap((p) => p.sortes))];
}

/**
 * DEUX COULEURS VONT-ELLES ENSEMBLE ? Inconnue : on ne juge pas (une pièce de
 * boutique dont le nom ne dit pas la couleur ne bloque rien).
 */
export function couleursAccordees(a?: CleCouleur, b?: CleCouleur): boolean {
  if (!a || !b) return true;
  const fa = COULEURS[a].famille;
  const fb = COULEURS[b].famille;
  if (fa === "neutre" || fb === "neutre") return true;
  if (fa === "terre" && fb === "terre") return true;
  // Ton sur ton : une seule couleur vive, donc permis — sauf deux imprimés.
  if (a === b) return a !== "multicolore";
  // Une couleur vive avec un ton de terre : seulement le kaki ou le camel, qui
  // calment presque tout. Deux couleurs vives différentes : jamais.
  if ((fa === "vive" && fb === "terre") || (fa === "terre" && fb === "vive")) {
    const terre = fa === "terre" ? a : b;
    return terre === "kaki" || terre === "camel";
  }
  return false;
}

/** Une tenue entière tient-elle ? Au plus une couleur vive, et chaque paire accordée. */
export function tenueAccordee(couleurs: (CleCouleur | undefined)[]): boolean {
  const connues = couleurs.filter(Boolean) as CleCouleur[];
  const vives = new Set(connues.filter((c) => COULEURS[c].famille === "vive"));
  if (vives.size > 1) return false;
  for (let i = 0; i < connues.length; i++) for (let j = i + 1; j < connues.length; j++) if (!couleursAccordees(connues[i], connues[j])) return false;
  return true;
}

/** UNE TENUE SE LIT DE HAUT EN BAS : la veste, le haut, le bas, les chaussures. */
const ORDRE_TENUE: SorteVetement[] = ["dessus", "maille", "haut", "robe", "bas", "chaussures", "accessoire"];
export const enOrdreDeTenue = (vs: Vetement[]) => [...vs].sort((a, b) => ORDRE_TENUE.indexOf(a.sorte) - ORDRE_TENUE.indexOf(b.sorte));

/** Les pièces du dressing qui vont avec la pièce de la boutique — la maquette les compte. */
export function compatibles(piece: PieceBoutique, dressing: Vetement[]): Vetement[] {
  const sorte = piece.sorte ?? sorteDuNom(piece.nom);
  if (!sorte) return [];
  const accueil = new Set(sortesQuiVontAvec(sorte));
  return enOrdreDeTenue(dressing.filter((v) => accueil.has(v.sorte) && couleursAccordees(piece.couleur ?? couleurDuNom(piece.nom), v.couleur)));
}

// ─── LES LOOKS ─────────────────────────────────────────────────────────────

export type Look = {
  /** « Le look actuel », « Chic décontracté »… — distinct d'un look à l'autre. */
  titre: string;
  sous: string;
  pieces: Vetement[];
  /** La phrase qu'on peut dire : « Elle va avec votre chemise blanche et votre jean bleu. » */
  raison: string;
};

const PLURIELS = /^(baskets|sneakers|chaussures|bottes|bottines|boots|mocassins|derbys|derbies|sandales|escarpins|ballerines|espadrilles|tennis|lunettes|boucles)\b/i;
/** « votre chemise blanche », « vos baskets blanches ». */
export function votreVetement(v: Pick<Vetement, "nom">): string {
  const n = v.nom.charAt(0).toLowerCase() + v.nom.slice(1);
  return `${PLURIELS.test(n) ? "vos" : "votre"} ${n}`;
}

const enListe = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/** Le pronom de la pièce de boutique : « Elle va avec… », « Il va avec… », « Ils vont avec… ». */
function pronom(nom: string): string {
  const n = nom.trim().toLowerCase();
  if (PLURIELS.test(n) || /^(jeans|chinos)\b/.test(n)) return "Ils vont";
  return /^(veste|chemise|robe|jupe|surchemise|parka|doudoune|marini[eè]re|blouse|chemisier|ceinture|écharpe|echarpe|casquette|montre)\b/.test(n)
    ? "Elle va"
    : "Il va";
}

/** Les styles d'une tenue, du plus présent au moins présent — ils donnent son nom au look. */
function stylesDe(pieces: Vetement[]): StyleVetement[] {
  const n = new Map<StyleVetement, number>();
  for (const p of pieces) if (p.style) n.set(p.style, (n.get(p.style) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([st]) => st);
}

const NOMS_DE_LOOK: Record<StyleVetement, { titre: string; sous: string }> = {
  decontracte: { titre: "Chic décontracté", sous: "Élégant au quotidien" },
  chic: { titre: "Soirée chic", sous: "Pour sortir" },
  sport: { titre: "Esprit sport", sous: "Confortable et vif" },
  urbain: { titre: "Esprit urbain", sous: "Moderne et polyvalent" },
  classique: { titre: "Classique", sous: "Intemporel" },
};

/**
 * LES TENUES QUE LE DRESSING PERMET AVEC CETTE PIÈCE — jusqu'à trois, et
 * aucune n'est un doublon d'une autre. La première est la plus accordée ; c'est
 * elle que la maquette appelle « le look actuel ». Une place obligatoire que le
 * dressing ne peut pas remplir, et il n'y a pas de look : on ne propose pas une
 * veste « avec rien en bas ».
 */
export function looksPossibles(piece: PieceBoutique, dressing: Vetement[], max = 3): Look[] {
  const sorte = piece.sorte ?? sorteDuNom(piece.nom);
  if (!sorte) return [];
  const couleurPiece = piece.couleur ?? couleurDuNom(piece.nom);
  const places = PLACES[sorte];
  const candidats = places.map((pl) =>
    dressing
      .filter((v) => pl.sortes.includes(v.sorte) && couleursAccordees(couleurPiece, v.couleur))
      // Les plus récentes d'abord : ce qu'on vient d'ajouter est ce qu'on porte en ce moment.
      .sort((a, b) => b.ajouteLe - a.ajouteLe),
  );
  if (places.some((pl, i) => !pl.facultative && candidats[i].length === 0)) return [];

  // Toutes les combinaisons, bornées : quelques dizaines de pièces au plus.
  let combos: Vetement[][] = [[]];
  places.forEach((pl, i) => {
    const options: (Vetement | null)[] = candidats[i].slice(0, 6);
    if (pl.facultative) options.push(null);
    const suite: Vetement[][] = [];
    for (const c of combos) for (const o of options) suite.push(o ? [...c, o] : c);
    combos = suite.slice(0, 400);
  });
  const valides = combos.filter((c) => tenueAccordee([couleurPiece, ...c.map((v) => v.couleur)]));

  // LE MEILLEUR D'ABORD : un style commun, puis des neutres, puis la place facultative remplie.
  const note = (c: Vetement[]) => {
    const styles = new Set(c.map((v) => v.style).filter(Boolean));
    const neutres = c.filter((v) => COULEURS[v.couleur].famille === "neutre").length;
    return (styles.size <= 1 ? 3 : 0) + neutres + c.length * 0.5;
  };
  valides.sort((a, b) => note(b) - note(a));

  const looks: Look[] = [];
  const vus = new Set<string>();
  const titres = new Set<string>();
  /* DEUX LOOKS QUI NE DIFFÈRENT QUE PAR LA PIÈCE FACULTATIVE n'en font pas
     deux : on compare ce qui est obligatoire. Le tri a déjà mis devant la
     version où la place facultative est remplie. */
  const obligatoire = (v: Vetement) => places.some((pl) => !pl.facultative && pl.sortes.includes(v.sorte));
  for (const c of valides) {
    if (looks.length >= max) break;
    const cle = c.filter(obligatoire).map((v) => v.id).sort().join("|");
    if (vus.has(cle)) continue;
    vus.add(cle);
    /* LE NOM VIENT DU STYLE LE PLUS PRÉSENT QUI N'A PAS ENCORE SERVI : un
       t-shirt urbain sur un jean décontracté donne « Esprit urbain » quand
       « Chic décontracté » est déjà pris. */
    const libre = stylesDe(c).map((st) => NOMS_DE_LOOK[st]).find((n) => !titres.has(n.titre));
    const nom =
      looks.length === 0
        ? { titre: "Le look actuel", sous: "Casual et intemporel" }
        : (libre ?? { titre: `Autre idée ${looks.length + 1}`, sous: "Une autre façon de la porter" });
    titres.add(nom.titre);
    const enOrdre = enOrdreDeTenue(c);
    looks.push({
      ...nom,
      pieces: enOrdre,
      raison: `${pronom(piece.nom)} avec ${enListe(enOrdre.map(votreVetement))}.`,
    });
  }
  return looks;
}

/** « Cette veste se combine avec 7 pièces de votre dressing. » */
export function phraseCompatibles(piece: PieceBoutique, n: number): string {
  const nom = piece.nom.trim();
  const premier = nom.split(/\s+/)[0]?.toLowerCase() ?? "";
  const dem = PLURIELS.test(premier) ? "Ces" : /^(veste|chemise|robe|jupe|surchemise|parka|doudoune|blouse)$/.test(premier) ? "Cette" : "Ce";
  const quoi = premier || "pièce";
  const verbe = dem === "Ces" ? "se combinent" : "se combine";
  return `${dem} ${quoi} ${verbe} avec ${n} pièce${n > 1 ? "s" : ""} de votre dressing.`;
}

/** Le minimum pour qu'un look soit possible : la maquette dit « au moins 3 pièces ». */
export const PIECES_MIN = 3;
/** Au-delà, on demande de faire de la place : un dressing n'est pas une galerie. */
export const PIECES_MAX = 60;

/** « cette veste », « ce pull », « ces baskets » — pour « Réserver cette veste ». */
export function cettePiece(nom: string): string {
  const premier = nom.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!premier) return "cette pièce";
  if (PLURIELS.test(premier) || /^(jeans|chinos)$/.test(premier)) return `ces ${premier}`;
  return /^(veste|chemise|robe|jupe|surchemise|parka|doudoune|blouse|chemisier|marini[eè]re|combinaison|casquette|ceinture|écharpe|echarpe|montre|salopette)$/.test(premier)
    ? `cette ${premier}`
    : `ce ${premier}`;
}

const NOM_DE_PLACE: Record<string, string> = {
  "haut|maille": "un haut",
  haut: "un haut",
  maille: "un pull",
  bas: "un bas (jean, pantalon, jupe)",
  chaussures: "des chaussures",
  "dessus|maille": "une veste ou un pull",
};

/** Ce qui manque au dressing pour habiller cette pièce : « un bas », « des chaussures ». */
export function placesManquantes(piece: PieceBoutique, dressing: Vetement[]): string[] {
  const sorte = piece.sorte ?? sorteDuNom(piece.nom);
  if (!sorte) return [];
  const couleurPiece = piece.couleur ?? couleurDuNom(piece.nom);
  return PLACES[sorte]
    .filter((pl) => !pl.facultative && !dressing.some((v) => pl.sortes.includes(v.sorte) && couleursAccordees(couleurPiece, v.couleur)))
    .map((pl) => NOM_DE_PLACE[pl.sortes.join("|")] ?? NOM_SORTE[pl.sortes[0]].toLowerCase());
}
