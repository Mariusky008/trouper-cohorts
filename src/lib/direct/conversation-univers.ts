/**
 * 💬 LA CONVERSATION — chantier « Univers », lot 3 (`docs/univers/feuille-de-route.md`, section 6 ; écrans 5 à 7 de
 * l'inscription).
 *
 *   5. LA TRANSITION : la phrase du propriétaire (« Ta figurine est prête ! Maintenant, j'aimerais découvrir ce qui fait
 *      ton univers… ») et la précision : une interprétation artistique, pas un diagnostic ;
 *   6. LA CONVERSATION avec Pablito, À L'ÉCRIT (on peut dicter : sa voix devient du texte, qu'il relit avant d'envoyer).
 *      Une question ouverte, puis il rebondit ; des réponses courtes ; jamais deux fois la même question ; « Je préfère
 *      ne pas en parler » à chaque échange. Pendant qu'il parle, SON UNIVERS S'ESQUISSE sans rien générer (les couleurs
 *      de l'écran, des vignettes). En coulisse, à chaque échange, ce qui est compris se range en trois colonnes : ce
 *      qu'il a dit (avec sa phrase, vérifiée), ce qu'on interprète, ce qu'on ne sait pas. Gardée, en privé ; on la
 *      reprend où on l'avait laissée ;
 *   7. LA PROPOSITION : ce que Pablito a compris, ce qu'il imagine (« je t'imagine dans… », jamais « tu es quelqu'un
 *      de… ») ; il corrige ou complète, retire un élément ; « C'est mon univers ! » : la fiche de son univers (version 1,
 *      `monde.ts`), que le lot 4 mettra en image.
 *
 * LES GARDE-FOUS (section 6.3) : jamais de diagnostic ; jamais d'invention (une chose « dite » porte sa phrase) ; les
 * sujets sensibles ne sont ni creusés ni gardés ; pas de vie amoureuse (on parle amitié et famille : il a peut-être
 * 15 ans) ; QUELQU'UN QUI VA MAL : la conversation s'arrête de jouer, répond avec égards et donne les numéros d'aide.
 *
 * LES DÉCISIONS DU PROPRIÉTAIRE (12 novembre 2026, « fais ce que tu penses être le mieux ») : le message d'aide est
 * écrit ici avec les numéros officiels ; le modèle est le plus capable de ceux du compte (sans nouvelle clé), le petit en
 * secours ; Pablito écrit, sans voix (ses phrases fixes pourront être enregistrées un jour : `PHRASES_FIXES`).
 *
 * Ce fichier est partagé (l'écran et le serveur). FICHIER PUR.
 */

/** Son message : 500 caractères au plus. */
export const MESSAGE_MAX = 500;
/** À partir de combien de ses réponses Pablito peut proposer « une première esquisse ». */
export const REPONSES_AVANT_ESQUISSE = 4;
/** Au-delà, Pablito propose de lui-même de passer à la suite (la conversation n'a pas de durée imposée, mais une fin). */
export const REPONSES_MAX = 16;
/** Les corrections de la proposition, au plus. */
export const CORRECTIONS_MAX = 6;

export const PREFERE_PAS = "Je préfère ne pas en parler";

/**
 * 🎙️ LES PHRASES FIXES DE PABLITO — écrites (aucune voix de synthèse). Le propriétaire pourra les enregistrer un jour,
 * comme le reste de la voix de Pablito : ce sont elles qu'il faudrait dire.
 */
export const PHRASES_FIXES = {
  transition: "Ta figurine est prête ! Maintenant, j’aimerais découvrir ce qui fait ton univers…",
  precision: "Ce que je vais imaginer, c’est une interprétation artistique de ce que tu me racontes. Pas un diagnostic, promis.",
  liberte: "Tu peux t’arrêter quand tu veux, et reprendre plus tard. Et si une question te dérange, dis-le-moi.",
  premiereQuestion: "Pour commencer : raconte-moi un endroit où tu te sens vraiment bien. Ça peut être un lieu réel, un souvenir, ou un endroit rêvé.",
  esquisse: "J’ai de quoi faire une première esquisse de ton univers. Tu veux voir ce que j’imagine ?",
  proposition: "Voilà ce que j’imagine. Dis-moi si c’est toi, ou ce qu’il faut changer.",
  validee: "Ton univers est prêt à être créé ✨",
} as const;

/**
 * 🫶 QUELQU'UN QUI VA MAL. La conversation s'arrête de jouer : ce message, avec égards, et les numéros officiels — le
 * 3114 (numéro national de prévention du suicide, gratuit, jour et nuit), le 119 (Allô Enfance en Danger, pour un
 * mineur en danger, gratuit, jour et nuit), et le 15 ou le 112 en urgence. Écrit avec soin ; aucun conseil, aucune
 * analyse.
 */
export const MESSAGE_AIDE = [
  "Merci de me l’avoir dit. Ce que tu traverses compte plus que ton univers, et je ne veux pas jouer avec ça.",
  "Tu n’as pas à garder ça pour toi : des personnes sont là pour t’écouter, gratuitement, à toute heure.",
].join("\n");
export const NUMEROS_AIDE = [
  { numero: "3114", dit: "Si tu as des idées noires ou des pensées suicidaires : le 3114, gratuit, jour et nuit." },
  { numero: "119", dit: "Si tu as moins de 18 ans et que tu es en danger, ou qu’un enfant l’est : le 119, gratuit, jour et nuit." },
  { numero: "15", dit: "En cas d’urgence : le 15 (ou le 112)." },
] as const;

/**
 * Le filet de sécurité, sans modèle : des mots qui disent qu'on va mal. Le modèle juge aussi (`detresse`) ; l'un ou
 * l'autre suffit.
 */
const DETRESSE =
  /\b(suicid\w*|me tuer|me suicider|en finir|mettre fin a mes jours|plus envie de vivre|envie de mourir|veux mourir|me faire du mal|me mutiler|scarif\w*|personne ne m.aimerait si je|disparaitre pour toujours)\b/;
const aPlat = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ");
export const ditQuIlVaMal = (texte: string) => DETRESSE.test(aPlat(texte));

export type Auteur = "pablito" | "moi";
export type MessageConversation = { id: string; de: Auteur; texte: string; le: string; aide?: boolean };
/** L'univers qui s'esquisse pendant qu'il parle : trois couleurs, des vignettes (« l'atelier », « la mer »). */
export type Esquisse = { couleurs: string[]; vignettes: string[] };
/** Les trois colonnes : ce qu'il a dit (sa phrase), ce qu'on interprète (pourquoi), ce qu'on ne sait pas. */
export type Comprehension = { dits: { quoi: string; phrase: string }[]; interpretations: { quoi: string; pourquoi: string }[]; inconnus: string[] };
export type ElementPropose = { id: string; quoi: string; pourquoi: string; source: "dit" | "interpretation" };
export type PropositionUnivers = { texte: string; lumiere: string; palette: string[]; elements: ElementPropose[]; regles: string[]; inconnus: string[] };

export type EtapeConversation = "transition" | "conversation" | "aide" | "proposition" | "validee";
export type EtatConversation = {
  etape: EtapeConversation;
  messages: MessageConversation[];
  esquisse: Esquisse;
  /** Pablito a de quoi faire une première esquisse */
  assez: boolean;
  proposition?: PropositionUnivers;
  /** il attend la réponse de Pablito (après la réponse du serveur) */
  attend: boolean;
  /** la dictée est branchée */
  dictee: boolean;
  /** sa figurine validée (lot 2), pour la montrer à côté de Pablito */
  figurine?: string;
  /** la version de la fiche de son univers, une fois validée */
  version?: number;
};

export const ESQUISSE_DE_DEPART: Esquisse = { couleurs: ["#f6d9a8", "#e7b77a", "#7a4b2a"], vignettes: [] };

/** Son message, nettoyé : 1 à 500 caractères ; « » sinon. */
export function messageValide(x: unknown): string {
  const t = typeof x === "string" ? x.replace(/[\u0000-\u0008\u000b-\u001f<>]/g, " ").replace(/[ \t]+/g, " ").trim() : "";
  return t && t.length <= MESSAGE_MAX ? t : "";
}
export const couleurEsquisse = (x: unknown) => (typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x) ? x.toLowerCase() : "");
export const vignetteValide = (x: unknown) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 28) : "");
