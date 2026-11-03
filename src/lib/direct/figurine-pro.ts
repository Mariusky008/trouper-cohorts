/**
 * 🪀 SA FIGURINE, FABRIQUÉE À PARTIR D'UN SELFIE — « qu'on implémente la création de la figurine automatiquement à
 * partir d'un selfie ».
 *
 * C'est l'étape 4 de `docs/figurines.md` (9.7, « La fabrication automatique ») dans sa forme la plus simple : un
 * selfie → un buste de figurine (la tête un peu plus grosse, le haut du corps jusqu'à la coupelle en bois) → il
 * valide « C'est moi ». Le ressort et le socle sont COMMUNS, dessinés par l'appli (`studio-montage.ts`) : on ne fait
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
};

/** La figurine de ses vidéos : celle du mois si elle est prête, sinon sa figurine tout court. */
export const figurineDuMoment = (e: EtatFigurinePro | null | undefined) => e?.edition?.validee ?? e?.validee ?? null;

/** Ce qu'il porte quand le selfie ne montre que son visage : une tenue simple de son métier, rien de plus. */
const TENUE: Record<FamilleDouble, string> = {
  table: "un tablier de cuisine foncé sur une chemise",
  bar: "une chemise simple, manches retroussées",
  coiffure: "une tenue noire simple de coiffeur ou de coiffeuse",
  ongles: "une tenue claire et simple d'esthéticienne",
  fleurs: "un tablier de fleuriste en toile sur un pull",
  mode: "une tenue soignée et simple, dans l'air du temps",
  createur: "un tablier d'atelier en toile",
  lunettes: "une chemise simple et soignée",
  seance: "une tenue simple et claire",
  librairie: "un pull simple",
};

/**
 * LA CONSIGNE, MOT POUR MOT.
 *
 * Deux leçons de l'essayage (`consigne-essai.ts`) sont reprises telles quelles : nommer les traits un par un et
 * interdire d'embellir ; et ne JAMAIS affirmer un accessoire (« ses lunettes ») — c'est ce qui en fait ajouter à
 * quelqu'un qui n'en porte pas. On dit donc : s'il en porte, on les garde ; sinon, on n'en ajoute pas.
 *
 * `fond` : « transparent » quand le moteur sait rendre un fond transparent ; sinon un VERT D'INCRUSTATION uni, que le
 * serveur retire (`detourerSurFondUni`). Vert et pas magenta : le magenta est trop près des tons de la peau (un
 * détourage d'essai a troué un visage dans l'ombre) ; le vert est loin de toute peau — c'est pour ça que le cinéma
 * l'utilise.
 */
export function consigneFigurine(famille: FamilleDouble, fond: "transparent" | "vert"): string {
  return [
    "Transforme la personne de cette photo en figurine de collection à tête dodelinante (« bobblehead »), photographiée en studio.",
    "",
    "LA RESSEMBLANCE AVANT TOUT :",
    "- Garde exactement son visage : la forme du visage, les yeux, le nez, la bouche, la mâchoire, la couleur de peau, l'âge, la coupe et la couleur des cheveux, la barbe ou la moustache s'il y en a.",
    "- N'embellis pas, ne rajeunis pas, ne lisse pas la peau, ne change pas les traits.",
    "- S'il porte des lunettes, garde-les telles quelles ; s'il n'en porte pas, n'en ajoute pas. N'ajoute aucun bijou, chapeau ou accessoire absent de la photo.",
    "- Un sourire naturel et chaleureux.",
    "",
    "LE STYLE :",
    "- Une figurine en résine peinte à la main, haut de gamme, très détaillée, éclairage de studio doux.",
    "- La tête environ 1,6 fois plus grosse que la normale, sur un corps plus petit, comme une figurine de collection.",
    "",
    "LE CADRAGE :",
    "- Seulement la tête et le haut du corps, jusqu'à la taille, les bras croisés.",
    `- Les vêtements visibles sur la photo ; si la photo ne montre que le visage, ${TENUE[famille] ?? TENUE.createur}.`,
    "- Le buste se termine à la taille sur une petite coupelle ronde en bois verni, comme le haut d'une figurine à ressort.",
    "- RIEN sous la coupelle : pas de ressort, pas de socle, pas de support, pas de table, pas d'ombre portée.",
    "- Vue de face, centrée, la figurine entière visible avec de la marge autour.",
    fond === "transparent"
      ? "- Fond transparent."
      : "- Un fond vert d'incrustation uni et parfaitement plat (#00B140), sans dégradé, sans texture, sans ombre. Rien de vert sur la figurine.",
    "- Aucun texte, aucun logo, aucune autre personne.",
  ].join("\n");
}

/**
 * LA TENUE DE CHAQUE ÉDITION — une seule chose qui change, pour que la figurine reste reconnaissable d'un mois à
 * l'autre. Rien d'alcoolisé (loi Évin), rien qui couvre le visage. Clés : celles de `EDITIONS_DATEES`.
 */
export const TENUES_EDITION: Record<string, string> = {
  hiver: "une écharpe en grosse laine et un bonnet en tricot",
  "saint-valentin": "un pull rouge orné d'un petit cœur brodé, et un petit cœur rouge posé sur la coupelle",
  printemps: "une chemise à petites fleurs et une fleur à la boutonnière",
  musique: "un casque audio autour du cou",
  ete: "une chemise légère à manches courtes et un chapeau de paille",
  automne: "un pull en grosse maille couleur rouille, une écharpe à carreaux, et quelques feuilles d'automne posées sur la coupelle",
  halloween: "un chapeau de sorcière noir et orange, et une petite citrouille posée sur la coupelle",
  noel: "un bonnet de Père Noël rouge et blanc, et une écharpe rouge",
};

/**
 * LA CONSIGNE DE L'ÉDITION : la figurine de l'image, la même, habillée pour l'édition. Le visage, la pose, le cadrage
 * et la coupelle ne bougent pas — c'est ce qui fait d'une édition « la même figurine, déguisée ».
 */
export function consigneEdition(cleEdition: string, nomEdition: string, fond: "transparent" | "vert"): string {
  const tenue = TENUES_EDITION[cleEdition] ?? "une tenue de saison simple";
  return [
    `Habille cette figurine pour l'édition « ${nomEdition} » : ${tenue}.`,
    "",
    "C'EST LA MÊME FIGURINE :",
    "- Garde exactement le même visage : les mêmes traits, la même expression, la même couleur de peau, les mêmes cheveux, la même barbe s'il y en a, les mêmes lunettes s'il en porte (et aucune s'il n'en porte pas).",
    "- La même pose (les bras croisés), la même taille, le même cadrage, le même style de résine peinte, le même éclairage.",
    "- La même petite coupelle ronde en bois verni sous le buste, et RIEN dessous : pas de ressort, pas de socle, pas d'ombre portée.",
    "- Ne change que la tenue et les accessoires dits plus haut. Rien sur le visage.",
    fond === "transparent"
      ? "- Fond transparent."
      : "- Un fond vert d'incrustation uni et parfaitement plat (#00B140), sans dégradé, sans texture, sans ombre. Rien de vert sur la figurine.",
    "- Aucun texte, aucun logo, aucune autre personne.",
  ].join("\n");
}

/** Le jour (Paris) d'un essai : les trois essais se comptent par jour. */
export const jourDe = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
