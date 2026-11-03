/**
 * 🪀 SA FIGURINE, FABRIQUÉE À PARTIR D'UN SELFIE — « qu'on implémente la création de la figurine automatiquement à
 * partir d'un selfie ».
 *
 * C'est l'étape 4 de `docs/figurines.md` (9.7, « La fabrication automatique ») dans sa forme la plus simple : un
 * selfie → sa figurine ENTIÈRE en caricature 3D, comme une photo produit (la tête très grosse sur un petit corps
 * tronqué à la taille, le ressort apparent, le socle en bois, les accessoires de son métier — `LE STYLE CLIKME`) →
 * deux propositions → il choisit et valide « C'est moi ». Les bustes d'avant (sans `SUFFIXE_ENTIERE`) restent posés
 * sur le ressort et le socle communs de l'appli.
 *
 * LES GARDE-FOUS (9.8) : son accord, coché par lui, jamais d'avance ; le selfie n'est pas gardé (il sert à la
 * fabrication et part avec la requête) ; rien ne passe dans une vidéo avant qu'il ait dit « C'est moi » ; trois essais
 * par jour au plus (une génération coûte).
 *
 * ICI : la consigne (une fonction pure, qu'on lit et qu'on vérifie sans serveur) et ce que le navigateur et le
 * serveur partagent. FICHIER PARTAGÉ.
 */
import type { FamilleDouble } from "./double-metiers";

/** Trois fabrications par jour et par commerce, au plus (`FIGURINE_ESSAIS_PAR_JOUR` pour changer). */
export const ESSAIS_PAR_JOUR = 3;
/** Le selfie, réduit dans le navigateur : 1 024 pixels au plus grand côté. */
export const SELFIE_MAX_PX = 1024;

/**
 * 🍂 SA FIGURINE DU MOIS : la même, habillée pour l'édition du moment (`EDITIONS_DATEES` de `collection.ts` : l'Automne,
 * Noël…). C'est celle que ses clients gagnent en venant pendant l'édition, et celle de ses vidéos. Elle se fabrique à
 * partir de SA figurine validée — pas d'un nouveau selfie : le visage ne change pas, seule la tenue change.
 */
export type EditionFigurine = {
  /** La clé de l'édition et son année (« automne-2026 ») : une édition manquée est manquée. */
  cle: string;
  nom: string;
  emoji: string;
  /** Les jours qui restent (édition en cours) ou avant qu'elle commence (la suivante). */
  jours: number;
  validee: string | null;
  proposee: string | null;
  /** Toutes les propositions de l'essai (deux, une par voie) ; `proposee` est la première. */
  proposees: string[];
  /** Le moteur de chacune (« Gemini », « OpenAI »), dans le même ordre. */
  voies: string[];
};

/** Où en est sa figurine : celle qu'il a validée, celle qui attend son « C'est moi », ses essais du jour, et son édition. */
export type EtatFigurinePro = {
  validee: string | null;
  proposee: string | null;
  /** Les propositions de son dernier essai (deux, une par voie) : il choisit celle qui lui ressemble. */
  proposees: string[];
  /** Le moteur de chacune (« Gemini », « OpenAI »), dans le même ordre : il dit lequel lui ressemble. */
  voies: string[];
  essaisRestants: number;
  /** L'édition du moment (`null` : aucune en cours) ; la suivante, pour la préparer. */
  edition: EditionFigurine | null;
  ensuite: { nom: string; emoji: string; jours: number } | null;
  /** 🗂 Toutes celles qu'il a validées, la plus récente d'abord. */
  collection: FigurineDeCollection[];
};

/**
 * 🗂 SA COLLECTION : chaque figurine qu'il a validée reste, même quand il en refait une ou que l'édition passe. Il la
 * revoit avec son histoire (créée quand, à quoi elle sert pendant l'édition, et après) et la remet dans un petit film
 * quand il en a envie.
 */
export type FigurineDeCollection = {
  url: string;
  /** `selfie` (sa figurine de tous les jours) ou l'édition et son année (« automne-2026 »). */
  cle: string;
  /** « Ma figurine », ou le nom de l'édition (« Automne »). */
  nom: string;
  emoji: string;
  /** Le jour où il l'a validée (AAAA-MM-JJ, à Paris). */
  le: string;
  /** Les dates de son édition (AAAA-MM-JJ) ; `null` pour sa figurine de tous les jours. */
  debut: string | null;
  fin: string | null;
  /** Sa figurine de tous les jours d'aujourd'hui (pas une qu'il a refaite depuis). */
  actuelle: boolean;
  /** Celle que le Studio met dans ses films si on ne choisit pas (`figurineDuMoment`). */
  dansLesFilms: boolean;
};

/** La figurine de ses vidéos : celle du mois si elle est prête, sinon sa figurine tout court. */
export const figurineDuMoment = (e: EtatFigurinePro | null | undefined) => e?.edition?.validee ?? e?.validee ?? null;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** « 20 décembre » ; « 20 décembre 2026 » avec l'année. */
const jourEnMots = (j: string, annee = false) => `${+j.slice(8, 10) === 1 ? "1er" : +j.slice(8, 10)} ${MOIS[+j.slice(5, 7) - 1]}${annee ? ` ${j.slice(0, 4)}` : ""}`;
/** « Novembre 2026 ». */
export const moisEnMots = (j: string) => `${MOIS[+j.slice(5, 7) - 1].replace(/^./, (c) => c.toUpperCase())} ${j.slice(0, 4)}`;

/**
 * L'HISTOIRE D'UNE FIGURINE, en trois lignes : quand il l'a créée, à quoi elle sert pendant son édition, et après.
 * `aujourdhui` : AAAA-MM-JJ (à Paris). Les mots sont pour lui, au comptoir : on le tutoie.
 */
export function histoireDeLaFigurine(f: FigurineDeCollection, aujourdhui: string): { titre: string; moment: "toujours" | "en-cours" | "passee"; creee: string; pendant: string; apres: string } {
  const creee = `Créée en ${moisEnMots(f.le).toLowerCase()}`;
  const garder = "Elle reste dans ta collection, et tu peux toujours la mettre dans un petit film.";
  if (!f.debut || !f.fin) {
    return {
      titre: `${f.emoji} ${f.nom}`,
      moment: "toujours",
      creee,
      pendant: f.actuelle
        ? "Ta figurine de tous les jours, faite d’après ton selfie. C’est elle qu’on habille à chaque édition, et elle présente tes petits films tant que l’édition n’a pas la sienne."
        : "Ta figurine de tous les jours, faite d’après un selfie, avant celle d’aujourd’hui.",
      apres: f.actuelle ? "Si tu en refais une, celle-ci reste ici, dans ta collection." : `Tu en as refait une depuis. ${garder}`,
    };
  }
  const enCours = aujourdhui <= f.fin;
  return {
    titre: `${f.emoji} Édition ${f.nom}`,
    moment: enCours ? "en-cours" : "passee",
    creee,
    pendant: enCours
      ? `Édition ${f.nom}, jusqu’au ${jourEnMots(f.fin)} : tes clients la gagnent en venant chez toi${f.dansLesFilms ? ", et elle présente tes petits films" : ""}.`
      : `Édition ${f.nom}, du ${jourEnMots(f.debut)} au ${jourEnMots(f.fin, true)} : tes clients la gagnaient en venant chez toi, et elle présentait tes petits films.`,
    apres: enCours ? `Après le ${jourEnMots(f.fin)}, elle ne se gagne plus. ${garder}` : `L’édition est finie : elle ne se gagne plus. ${garder}`,
  };
}

/**
 * SA TENUE DE TOUS LES JOURS, quand le selfie ne montre que son visage, et DEUX OU TROIS PETITS ACCESSOIRES DE SON
 * MÉTIER, portés ou accrochés à sa tenue — c'est ce qui rend la figurine drôle et la sienne. Rien sur la tête ni sur le
 * visage (ses cheveux font la ressemblance), rien d'alcoolisé (loi Évin).
 */
const METIER: Record<FamilleDouble, { tenue: string; accessoires: string }> = {
  table: {
    tenue: "un tablier de cuisine foncé sur une chemise, manches retroussées",
    accessoires: "une cuillère en bois qui dépasse de la poche du tablier, un torchon à carreaux sur l'épaule",
  },
  bar: {
    tenue: "une chemise, manches retroussées, et un tablier de barista",
    accessoires: "un torchon sur l'épaule, une petite tasse de café fumante accrochée à la ceinture du tablier",
  },
  coiffure: {
    tenue: "une tenue noire soignée de coiffeur ou de coiffeuse",
    accessoires: "un peigne et une paire de ciseaux qui dépassent d'une poche, un petit séchoir accroché à la ceinture",
  },
  ongles: {
    tenue: "une tenue claire et soignée d'esthéticienne",
    accessoires: "un petit flacon de vernis rose et une lime à ongles qui dépassent d'une poche",
  },
  fleurs: {
    tenue: "un tablier de fleuriste en toile sur un pull",
    accessoires: "un sécateur dans la poche du tablier, d'où dépassent aussi quelques fleurs fraîches",
  },
  mode: {
    tenue: "une tenue soignée, dans l'air du temps",
    accessoires: "un mètre ruban de couturière autour du cou, un petit sac shopping au creux du bras",
  },
  createur: {
    tenue: "un tablier d'atelier en toile",
    accessoires: "un crayon et un petit outil d'atelier dans la poche du tablier",
  },
  lunettes: {
    tenue: "une chemise simple et soignée",
    accessoires: "un étui à lunettes et un petit chiffon dans la poche de chemise",
  },
  seance: {
    tenue: "une tenue simple et soignée de son métier",
    accessoires: "un petit carnet de rendez-vous glissé dans la poche",
  },
  librairie: {
    tenue: "un pull en maille",
    accessoires: "un livre coincé sous le bras, un marque-page qui dépasse de la poche",
  },
};

/**
 * LE STYLE CLIKME — celui des figurines du propriétaire (sa figurine d'Halloween, faite avec Gemini). L'histoire des
 * essais réels du 3 novembre 2026, pour ne pas la refaire :
 *   1. un buste réaliste sur une coupelle : « loin de la figurine cartoony » ;
 *   2. fidélité « high » : le selfie collé sur un petit corps ;
 *   3. fidélité « low » : une caricature, mais un autre homme (cheveux bruns au lieu de poivre et sel) → ses traits en mots ;
 *   4. « joli, mais ça fait pas avatar figurine, et je ne souris pas » → la matière dite, son expression à lui ;
 *   5. « c'est pas moi, ça fait photo / peinture » : le BUSTE SEUL détouré restait un portrait découpé. Ce qui fait la
 *      figurine de son exemple : UN OBJET ENTIER photographié en studio (le ressort apparent, le socle en bois, les
 *      chaussures posées dessus, une même lumière partout). D'où la figurine entière (`SUFFIXE_ENTIERE`), la consigne
 *      écrite EN ANGLAIS sur le modèle du prompt Gemini qu'il nous a donné (photo produit de face, tronquée à la taille,
 *      ressort apparent, socle rond en bois, objets miniatures autour, netteté partout), et une proposition de Gemini.
 * Ses traits, sa tenue de métier et les tenues d'édition restent en français dedans : les deux moteurs les lisent.
 */
export const SUFFIXE_ENTIERE = "-entiere";
/** Une figurine entière (avec son ressort et son socle) ? Sinon, un buste d'avant, posé sur le ressort commun. */
export const figurineEntiere = (url: string | null | undefined) => Boolean(url && /-entiere\.png(\?|#|$)/.test(url));

/** La matière : un objet, pas une photo ni une peinture. */
/**
 * LA MATIÈRE — sixième essai réel : la forme était la bonne (ressort, socle, chaussures), mais « elle me ressemble et
 * fait pas figurine » : un vrai homme photographié (peau à pores, vrais tissus). Ce qui dit « jouet » : la peau de
 * résine lisse et un peu brillante, des vêtements SCULPTÉS et peints, et une photo de MINIATURE (objectif macro,
 * arrière-plan flou) — `photoProduit`.
 */
const MATIERE =
  "- A small hand-painted resin collectible TOY, about 20 cm tall, not a real person: smooth, slightly glossy resin skin with no pores and a soft airbrushed blush; hair sculpted in solid glossy locks (no fine photographic hair); stubble or beard painted as tiny dots; glossy painted eyes; the clothes SCULPTED in resin and painted (stiff folds, painted fabric texture), not real fabric. Features slightly simplified, like a sculpted caricature figurine. NOT a photo of a real person, NOT an illustration, NOT a digital painting.";

/** La photo produit, et le fond (transparent, ou un vert uni que le serveur retire). */
const photoProduit = (fond: "transparent" | "vert") => [
  "THE PHOTO:",
  "- A straight-on macro product photo of a miniature collectible: the whole figurine visible, from the top of the head to the bottom of the base, centered, with some margin around it.",
  "- Warm, soft, directional studio lighting with small specular highlights on the resin, as in a high-end atelier. The figurine sharp from head to base, every item on the base crisp. Very high definition, clean edges.",
  fond === "transparent"
    ? "- Transparent background."
    : "- A perfectly flat, uniform chroma-key green background (#00B140): no gradient, no texture, no shadow on it. Nothing green on the figurine.",
  "- No text, no logo, no engraved plaque, no scenery, no other person.",
];

/** Le corps de la figurine : tronquée à la taille, le ressort apparent, le socle en bois. */
const FIGURINE_ENTIERE = [
  "- Standing pose, arms crossed over the chest.",
  "- An oversized head (about three times normal size, roughly a third of the figurine's total height including the base) on a small, slim body with narrow shoulders; the neck visible.",
  "- Truncated at the waist: the lower torso (the hem of the jacket, apron, sweater or skirt, slightly flared) transitions into a substantial, exposed, metal coiled bobble-spring mechanism supporting the upper body.",
  // SEPTIÈME ESSAI RÉEL : « il y a les jambes en trop » — un pantalon et des chaussures plantées sur le socle, le
  // ressort entre les deux. Les chaussures demandées sur le socle y faisaient mettre des pieds : elles sont VIDES.
  "- NO LEGS, NO TROUSERS, NO FEET: nothing at all below the hem of the top except the spring. The spring is the only thing between the body and the base.",
  "- The spring stands central on a round varnished wooden display base.",
];

/**
 * 🔎 SES TRAITS, EN MOTS — troisième essai réel (3 novembre 2026) : « ne me ressemble pas vraiment ». En fidélité basse
 * (nécessaire pour la caricature), le moteur réinterprète… et perd ce qui le fait reconnaître : des cheveux gris poivre
 * et sel avec du volume devenus bruns, la barbe de trois jours disparue. D'où, AVANT la fabrication, un regard sur le
 * selfie (`decrireTraits`, le modèle de vision du dressing) qui écrit ses traits noir sur blanc dans la consigne.
 * Seulement ce qu'on voit, sans jugement ; le selfie n'est toujours pas gardé — ses traits en mots, oui (avec sa
 * figurine), pour garder la ressemblance quand on l'habille pour l'édition du mois.
 */
export type Traits = {
  cheveux?: string;
  barbe?: string;
  visage?: string;
  sourcils?: string;
  yeux?: string;
  nez?: string;
  age?: string;
  signes?: string;
  /** Son expression sur le selfie (« sérieux, bouche fermée ») : la figurine la garde. */
  expression?: string;
  lunettes?: boolean;
};

/** La question posée au modèle de vision (en anglais : c'est là qu'il est le plus précis), la réponse en français. */
export const QUESTION_TRAITS =
  "A sculptor will make a caricature figurine of the person in this photo and must get the likeness right. " +
  "Describe ONLY what is visible, precisely, in short French phrases of a few words, with no judgement and no name. " +
  'Answer as JSON: {"cheveux": exact colour (e.g. "gris poivre et sel", "châtain clair avec quelques mèches grises"), length, thickness, texture and how they are styled (e.g. "épais, ondulés, coiffés en arrière avec du volume sur le dessus"), ' +
  '"barbe": facial hair exactly as seen (e.g. "barbe de trois jours grise", "moustache brune") or "aucune", ' +
  '"visage": face shape, jaw and cheekbones (e.g. "visage allongé, mâchoire carrée, pommettes marquées"), ' +
  '"sourcils": shape and thickness, "yeux": colour and shape, "nez": shape and size, ' +
  '"age": apparent age range (e.g. "la cinquantaine"), ' +
  '"expression": the facial expression exactly as seen (e.g. "sérieux, sourcils légèrement froncés, bouche fermée, ne sourit pas" or "grand sourire"), ' +
  '"signes": other features that make this person recognizable (forehead wrinkles, dimples, crow\'s feet, a mole, freckles) or "", ' +
  '"lunettes": true if wearing glasses, else false}.';

const MOTS_MAX = 140;
const propreTrait = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MOTS_MAX) : "");

/** La réponse du modèle, nettoyée : des chaînes courtes, rien d'autre. `null` s'il n'y a rien d'utile. */
export function traitsDe(o: Record<string, unknown>): Traits | null {
  const t: Traits = {};
  for (const k of ["cheveux", "barbe", "visage", "sourcils", "yeux", "nez", "age", "signes", "expression"] as const) {
    const v = propreTrait(o[k]);
    if (v) t[k] = v;
  }
  if (typeof o.lunettes === "boolean") t.lunettes = o.lunettes;
  return Object.keys(t).length ? t : null;
}

/** Ses traits, une ligne chacun, pour la consigne. */
export function traitsEnMots(t: Traits | null | undefined): string[] {
  if (!t) return [];
  const l: string[] = [];
  if (t.cheveux) l.push(`- Ses cheveux : ${t.cheveux}. Exactement cette couleur et cette coiffure.`);
  if (t.barbe) l.push(/^aucune/i.test(t.barbe) ? "- Pas de barbe ni de moustache." : `- Sa barbe : ${t.barbe}. Exactement comme ça.`);
  if (t.visage) l.push(`- Son visage : ${t.visage}.`);
  if (t.sourcils) l.push(`- Ses sourcils : ${t.sourcils}.`);
  if (t.yeux) l.push(`- Ses yeux : ${t.yeux}.`);
  if (t.nez) l.push(`- Son nez : ${t.nez}.`);
  if (t.age) l.push(`- Son âge : ${t.age} — ne le rajeunis pas.`);
  if (t.signes) l.push(`- Ce qui le rend reconnaissable : ${t.signes}.`);
  if (t.expression) l.push(`- Son expression : ${t.expression}. Garde-la telle quelle.`);
  if (t.lunettes === false) l.push("- Il ne porte pas de lunettes : n'en ajoute pas.");
  if (t.lunettes === true) l.push("- Il porte des lunettes : garde-les, de la même forme.");
  return l;
}

/**
 * LA CONSIGNE, MOT POUR MOT (en anglais : voir `LE STYLE CLIKME`).
 *
 * Deux leçons de l'essayage (`consigne-essai.ts`) sont reprises telles quelles : nommer les traits un par un et
 * interdire de le changer ; et ne JAMAIS affirmer un accessoire du visage (« ses lunettes ») — c'est ce qui en fait
 * ajouter à quelqu'un qui n'en porte pas. On dit donc : s'il en porte, on les garde ; sinon, on n'en ajoute pas.
 *
 * `fond` : « transparent » quand le moteur sait rendre un fond transparent ; sinon un VERT D'INCRUSTATION uni, que le
 * serveur retire (`detourerSurFondUni`). Vert et pas magenta : le magenta est trop près des tons de la peau (un
 * détourage d'essai a troué un visage dans l'ombre) ; le vert est loin de toute peau — c'est pour ça que le cinéma
 * l'utilise.
 */
export function consigneFigurine(famille: FamilleDouble, fond: "transparent" | "vert", traits?: Traits | null): string {
  const m = METIER[famille] ?? METIER.createur;
  const vus = traitsEnMots(traits);
  return [
    "A detailed collectible bobblehead figurine of the person in this photo — the upper body on a spring, with no legs — as a straight-on studio product shot.",
    "",
    "LIKENESS (the most important):",
    "- The figurine's face retains the specific features and expression of the person in the photo: the same face shape, eyes, nose, mouth, jaw, eyebrows, skin tone, age, hair colour and hairstyle, facial hair. Anyone who knows them recognises them at first glance.",
    "- Keep what makes them unique (wrinkles, dimples, eyebrows). Do not beautify, do not make them younger, do not turn them into someone else.",
    "- Their expression from the photo: if they are not smiling, the figurine does not smile (mouth closed).",
    "- If they wear glasses, keep them; if not, add none. Nothing on the head or face that is not in the photo.",
    ...(vus.length ? ["- Their features as seen in the photo (written in French — follow them exactly):", ...vus.map((l) => `  ${l}`)] : []),
    "",
    "THE FIGURINE:",
    ...FIGURINE_ENTIERE,
    "- The caricature is in the proportions (the big head) and in their distinctive features, slightly accentuated (face shape, jaw, nose, eyebrows). The eyes keep their shape and size.",
    `- Outfit of their trade (in French): ${m.tenue} — in the colours of the clothes in the photo when visible.`,
    `- Two or three small, neat, funny accessories of their trade worn on the outfit (in French): ${m.accessoires}.`,
    "- On the base, beside the spring: a small pair of EMPTY shoes matching the outfit, set down side by side with nobody in them (no feet, no legs), and one or two miniature sculpted items of their trade.",
    MATIERE,
    "",
    ...photoProduit(fond),
  ].join("\n");
}

/**
 * LA TENUE DE CHAQUE ÉDITION (une par mois : `EDITIONS_DATEES`) — la même figurine, déguisée, avec des accessoires généreux (la figurine d'Halloween du
 * propriétaire en porte une demi-douzaine : chapeau, sac décoré, chat noir, breloques). Les chapeaux et bonnets sont
 * permis ici, cheveux visibles et visage dégagé. Rien d'alcoolisé (loi Évin). Clés : celles de `EDITIONS_DATEES`.
 */
export const TENUES_EDITION: Record<string, string> = {
  galette:
    "une couronne dorée de galette des rois posée de travers sur la tête, un pull douillet couleur crème, une écharpe en grosse laine, et une part de galette dorée avec une petite fève en porcelaine au creux du bras",
  "saint-valentin":
    "un pull rouge à petits cœurs, une broche en cœur, un petit bouquet de roses rouges au creux du bras, et un ballon en forme de cœur attaché au poignet",
  printemps:
    "une chemise à petites fleurs, une couronne de fleurs fraîches dans les cheveux, un arrosoir miniature accroché à la ceinture, et un papillon posé sur l'épaule",
  paques:
    "un pull pastel, des oreilles de lapin en peluche sur un serre-tête, un petit panier en osier rempli d'œufs en chocolat colorés au bras, et un poussin jaune posé sur l'épaule",
  "fete-des-meres":
    "une chemise à fleurs, un grand bouquet de fleurs fraîches enveloppé de papier kraft au creux du bras, une broche en forme de cœur, et une petite boîte cadeau à ruban rose",
  musique:
    "un t-shirt à notes de musique, un casque audio autour du cou, une petite guitare en bandoulière, et des lunettes de soleil accrochées au col (pas sur le visage)",
  ete: "une chemise hawaïenne colorée, un chapeau de paille, des lunettes de soleil accrochées à la poche (pas sur le visage), et une glace à l'italienne dans une main",
  vacances:
    "une chemise de plage à rayures, un chapeau de paille à ruban, une bouée canard autour de la taille, et un seau et une pelle de plage accrochés à la main",
  rentree:
    "un gilet en maille, un cartable d'écolier rétro sur le dos, un crayon à papier géant coincé sous le bras, et une pomme rouge posée dans la poche",
  automne:
    "un béret en laine couleur moutarde orné d'une feuille d'érable rousse, un gros pull en grosse maille rouille et moutarde, une écharpe épaisse à carreaux orange et marron, un panier en osier rempli de champignons, de châtaignes et de pommes rouges au bras, et des feuilles mortes rousses et dorées posées sur les épaules et le béret",
  halloween:
    "une tenue de sorcière ou de sorcier violet foncé à motifs, un chapeau de sorcière à ruban de dentelle avec une petite citrouille épinglée, un sac en paille décoré de chauves-souris et d'une toile d'araignée d'où sort la tête d'un petit chat noir, et un bracelet à breloques (un petit fantôme, un bonbon d'Halloween)",
  noel: "un bonnet de Père Noël rouge à pompon blanc, un gros pull de Noël tricoté à rennes et flocons, une écharpe rayée rouge et blanche, un sucre d'orge qui dépasse de la poche, et un petit paquet cadeau à nœud doré sous le bras",
};

/**
 * LA CONSIGNE DE L'ÉDITION : la figurine de l'image, la même, déguisée pour l'édition. Le visage, la pose, les
 * proportions, le ressort et le socle ne bougent pas — c'est ce qui fait d'une édition « la même figurine, déguisée ».
 */
export function consigneEdition(cleEdition: string, nomEdition: string, fond: "transparent" | "vert", traits?: Traits | null): string {
  const tenue = TENUES_EDITION[cleEdition] ?? "une tenue de saison avec deux ou trois accessoires de saison";
  const vus = traitsEnMots(traits);
  return [
    `Dress up this collectible bobblehead figurine (the upper body on a spring, with no legs) for its « ${nomEdition} » edition, as a straight-on studio product shot.`,
    "",
    "IT IS THE SAME FIGURINE:",
    "- Keep exactly the same face: the same features, the same expression, the same skin tone, the same hair (visible under any hat), the same facial hair, the same glasses if any (and none if none).",
    "- The same pose (arms crossed), the same proportions (the oversized head on the small body), the same painted-resin style.",
    ...FIGURINE_ENTIERE,
    ...(vus.length ? ["- Their features (written in French — keep them exactly):", ...vus.map((l) => `  ${l}`)] : []),
    "",
    "THE EDITION OUTFIT:",
    `- COMPLETELY REPLACE THE OUTFIT — no garment from before; anyone sees at first glance which edition it is (in French): ${tenue}.`,
    "- Every accessory listed, generous, full of detail, neat and funny. Nothing on the face.",
    "- On the base, beside the spring: a small pair of EMPTY shoes (no feet, no legs) and one or two miniature items matching the edition.",
    MATIERE,
    "",
    ...photoProduit(fond),
  ].join("\n");
}

/** Le jour (Paris) d'un essai : les trois essais se comptent par jour. */
export const jourDe = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
