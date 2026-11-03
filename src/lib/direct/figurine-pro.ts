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

/** Où en est sa figurine : celle qu'il a validée, celle qui attend son « C'est moi », ses essais du jour. */
export type EtatFigurinePro = {
  validee: string | null;
  proposee: string | null;
  essaisRestants: number;
};

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

/** Le jour (Paris) d'un essai : les trois essais se comptent par jour. */
export const jourDe = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
