/**
 * 🪀 SA FIGURINE, FABRIQUÉE À PARTIR D'UN SELFIE — « qu'on implémente la création de la figurine automatiquement à
 * partir d'un selfie ».
 *
 * C'est l'étape 4 de `docs/figurines.md` (9.7, « La fabrication automatique ») dans sa forme la plus simple : un
 * selfie → sa figurine en caricature 3D (la tête énorme sur un petit corps, jusqu'aux hanches, les accessoires de son
 * métier — `STYLE`) → il valide « C'est moi ». Le ressort et le socle sont COMMUNS, dessinés par l'appli (`studio-montage.ts`) : on ne fait
 * générer que le buste, ce qui rend la découpe simple et la marque reconnaissable.
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
};

/** Où en est sa figurine : celle qu'il a validée, celle qui attend son « C'est moi », ses essais du jour, et son édition. */
export type EtatFigurinePro = {
  validee: string | null;
  proposee: string | null;
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
 * LE STYLE CLIKME — celui des figurines faites à la main (la figurine d'Halloween du propriétaire) : une caricature
 * tendre et drôle, PAS un buste réaliste. Le premier essai réel (novembre 2026) a rendu un buste réaliste posé sur une
 * coupelle en bois : « on est loin de la figurine cartoony ». D'où : la tête énorme, le petit corps, les traits un peu
 * forcés mais lui, les accessoires, et le corps qui s'arrête aux hanches (le ressort part de sous ses vêtements).
 */
const STYLE = [
  "LE STYLE (le plus important après la ressemblance) :",
  "- Une figurine de collection à tête dodelinante (« bobblehead »), style caricature 3D tendre et drôle, comme un personnage de film d'animation : PAS un buste réaliste, PAS une statue.",
  "- Une TÊTE ÉNORME, à peu près aussi haute que tout le reste du corps visible, posée sur un petit corps fin.",
  "- Les traits caricaturés avec affection : un grand sourire franc qui montre les dents, des yeux pétillants et expressifs. On le reconnaît au premier coup d'œil.",
  "- Une résine peinte à la main très haut de gamme, finition satinée, couleurs vives et chaleureuses, détails fins et nets (coutures, mailles, reflets dans les yeux), peinture impeccable sans aucune bavure.",
  "- Rendu de photo produit en très haute définition : net partout, éclairage de studio doux, contours nets et propres.",
];

/** LE CADRAGE : le haut du corps jusqu'aux hanches, et RIEN dessous — le ressort et le socle sont ceux de ClikMe. */
const cadrage = (fond: "transparent" | "vert") => [
  "LE CADRAGE :",
  "- La figurine de face, centrée, les bras croisés, du haut de la tête jusqu'aux hanches.",
  "- Le corps s'arrête aux hanches : le bas de la tenue (veste, tablier, pull ou jupe), un peu évasé, termine la figurine. Pas de jambes.",
  "- RIEN sous la figurine : pas de coupelle, pas de ressort, pas de socle, pas de support, pas d'ombre portée. Le ressort sera fixé sous ses vêtements.",
  "- Toute la figurine visible, avec un peu de marge autour.",
  fond === "transparent"
    ? "- Fond transparent."
    : "- Un fond vert d'incrustation uni et parfaitement plat (#00B140), sans dégradé, sans texture, sans ombre. Rien de vert sur la figurine.",
  "- Aucun texte, aucun logo, aucune plaque, aucune autre personne.",
];

/**
 * LA CONSIGNE, MOT POUR MOT.
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
export function consigneFigurine(famille: FamilleDouble, fond: "transparent" | "vert"): string {
  const m = METIER[famille] ?? METIER.createur;
  return [
    "Transforme la personne de cette photo en figurine de collection à tête dodelinante, caricature 3D tendre et drôle, photographiée en studio.",
    "",
    "LA RESSEMBLANCE AVANT TOUT :",
    "- Garde son visage : la forme du visage, les yeux, le nez, la bouche, la mâchoire, la couleur de peau, l'âge, la coupe et la couleur des cheveux, la barbe ou la moustache s'il y en a.",
    "- Garde ce qui le rend unique (ses rides, ses fossettes, ses sourcils) : ne le rajeunis pas, ne le change pas en quelqu'un d'autre.",
    "- S'il porte des lunettes, garde-les telles quelles ; s'il n'en porte pas, n'en ajoute pas. Rien sur la tête ni sur le visage qui ne soit pas sur la photo.",
    "",
    ...STYLE,
    "",
    "SA TENUE :",
    `- Une tenue de son métier, gaie et soignée : ${m.tenue}, dans les couleurs de ses vêtements sur la photo si on les voit.`,
    `- Deux ou trois petits accessoires de son métier, soignés et drôles, portés ou accrochés à sa tenue : ${m.accessoires}.`,
    "",
    ...cadrage(fond),
  ].join("\n");
}

/**
 * LA TENUE DE CHAQUE ÉDITION — la même figurine, déguisée, avec des accessoires généreux (la figurine d'Halloween du
 * propriétaire en porte une demi-douzaine : chapeau, sac décoré, chat noir, breloques). Les chapeaux et bonnets sont
 * permis ici, cheveux visibles et visage dégagé. Rien d'alcoolisé (loi Évin). Clés : celles de `EDITIONS_DATEES`.
 */
export const TENUES_EDITION: Record<string, string> = {
  hiver:
    "un bonnet à pompon en grosse laine, une écharpe tricotée, des moufles, une broche en flocon de neige, et une tasse de chocolat chaud fumante au creux du bras",
  "saint-valentin":
    "un pull rouge à petits cœurs, une broche en cœur, un petit bouquet de roses rouges au creux du bras, et un ballon en forme de cœur attaché au poignet",
  printemps:
    "une chemise à petites fleurs, une couronne de fleurs fraîches dans les cheveux, un arrosoir miniature accroché à la ceinture, et un papillon posé sur l'épaule",
  musique:
    "un t-shirt à notes de musique, un casque audio autour du cou, une petite guitare en bandoulière, et des lunettes de soleil accrochées au col (pas sur le visage)",
  ete: "une chemise hawaïenne colorée, un chapeau de paille, des lunettes de soleil accrochées à la poche (pas sur le visage), et une glace à l'italienne dans une main",
  automne:
    "un pull en grosse maille couleur rouille, une écharpe à carreaux, un panier en osier rempli de pommes et de champignons au bras, et une feuille d'érable dorée épinglée comme une broche",
  halloween:
    "une tenue de sorcière ou de sorcier violet foncé à motifs, un chapeau de sorcière à ruban de dentelle avec une petite citrouille épinglée, un sac en paille décoré de chauves-souris et d'une toile d'araignée d'où sort la tête d'un petit chat noir, et un bracelet à breloques (un petit fantôme, un bonbon d'Halloween)",
  noel: "un bonnet de Père Noël rouge à pompon blanc, un gros pull de Noël tricoté à rennes et flocons, une écharpe rayée rouge et blanche, un sucre d'orge qui dépasse de la poche, et un petit paquet cadeau à nœud doré sous le bras",
};

/**
 * LA CONSIGNE DE L'ÉDITION : la figurine de l'image, la même, déguisée pour l'édition. Le visage, la pose, les
 * proportions et le cadrage ne bougent pas — c'est ce qui fait d'une édition « la même figurine, déguisée ».
 */
export function consigneEdition(cleEdition: string, nomEdition: string, fond: "transparent" | "vert"): string {
  const tenue = TENUES_EDITION[cleEdition] ?? "une tenue de saison avec deux ou trois accessoires de saison";
  return [
    `Déguise cette figurine pour l'édition « ${nomEdition} » : ${tenue}.`,
    "",
    "C'EST LA MÊME FIGURINE :",
    "- Garde exactement le même visage : les mêmes traits, le même grand sourire, la même couleur de peau, les mêmes cheveux (visibles sous un éventuel chapeau), la même barbe s'il y en a, les mêmes lunettes s'il en porte (et aucune s'il n'en porte pas).",
    "- La même pose (les bras croisés), les mêmes proportions (la tête énorme sur le petit corps), le même style de caricature 3D en résine peinte.",
    "- Ne change que la tenue et les accessoires dits plus haut, généreux et pleins de détails, soignés et drôles. Rien sur le visage.",
    "",
    "LA FINITION :",
    ...STYLE.slice(4),
    "",
    ...cadrage(fond),
  ].join("\n");
}

/** Le jour (Paris) d'un essai : les trois essais se comptent par jour. */
export const jourDe = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
