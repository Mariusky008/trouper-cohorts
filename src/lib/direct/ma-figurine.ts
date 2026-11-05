/**
 * 🗣️ SA PROPRE FIGURINE — DÈS LE DÉPART (4 novembre 2026, le propriétaire : « le plus simple et le mieux, c'est qu'on
 * ait la possibilité de créer sa figurine dès le départ, mais qu'on bénéficie d'options supplémentaires à chaque fois
 * qu'on achète quelque chose chez un commerçant »). Avant, il fallait 10 figurines gagnées.
 *
 * LA RÈGLE :
 *   1. il envoie une photo de lui (« C'est bien moi sur la photo ») — sans compte, on lui en ouvre un (sa ville) ;
 *   2. le moteur d'image fabrique sa figurine tout de suite (`ma-figurine-fabrique-serveur.ts`) : bouche fermée, puis
 *      bouche ouverte. Sans moteur branché, ClikMe la fait à la main (l'admin), comme avant ;
 *   3. il lui fait dire un message — un texte lu par une voix (ElevenLabs : la seule voix fabriquée de ClikMe, décidée
 *      par le propriétaire le 4 novembre 2026), ou SA voix enregistrée —, choisit son visage, les commerces qu'elle
 *      cite, et l'envoie : un lien `/figurine/<id>` ;
 *   4. CHAQUE ACHAT CHEZ UN COMMERÇANT (une visite validée au comptoir = une figurine gagnée, `figurinesEnTout`) LUI
 *      OUVRE UNE OPTION DE PLUS (`OPTIONS_FIGURINE`) : un visage, des voix, le cadre doré…
 * CE QU'ELLE CITE, C'EST LUI QUI LE CHOISIT, parmi les commerces où il a des figurines : jamais « vu récemment chez… »
 * (on ne dit pas à ses proches où il est allé et quand).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Collection } from "./collection";
import { TOTAL_COLLECTION } from "./collection";

/**
 * 🎁 SES OPTIONS, UNE DE PLUS À CHAQUE ACHAT — `n` : le nombre de figurines gagnées (tous commerces confondus) qui
 * l'ouvre. Au départ (0) : sa figurine qui parle, avec son texte, la joie, la voix « Douce », l'envoi. Changer cette
 * liste change la page, la route et les essais à la fois.
 */
export const OPTIONS_FIGURINE = [
  { n: 1, cle: "colere", emoji: "😠", titre: "La colère", dit: "son visage en colère" },
  { n: 2, cle: "voix", emoji: "🎙️", titre: "Toutes les voix, et la tienne", dit: "Pétillante, Chaleureuse, Posée… ou ta propre voix" },
  { n: 3, cle: "tristesse", emoji: "😢", titre: "La tristesse", dit: "son visage triste" },
  { n: 4, cle: "euphorie", emoji: "🤩", titre: "L’euphorie", dit: "son visage euphorique" },
  { n: 5, cle: "or", emoji: "✨", titre: "Le cadre doré", dit: "tes messages arrivent dans un cadre en or" },
] as const;
export type CleOption = (typeof OPTIONS_FIGURINE)[number]["cle"];
/** Ses options ouvertes, d'après ses figurines gagnées. */
export const optionsOuvertes = (total: number): Set<CleOption> => new Set(OPTIONS_FIGURINE.filter((o) => total >= o.n).map((o) => o.cle));
/** La prochaine option à ouvrir (`null` : toutes ouvertes). */
export const optionSuivante = (total: number) => OPTIONS_FIGURINE.find((o) => total < o.n) ?? null;
/** Ce sentiment est-il ouvert ? (la joie l'est dès le départ ; « aucun » aussi). */
export const sentimentOuvert = (s: Sentiment | null, total: number) => !s || s === "joie" || optionsOuvertes(total).has(s as CleOption);
/** Cette voix est-elle ouverte ? (« Douce » dès le départ ; les autres, et la sienne, avec l'option « voix »). */
export const voixOuverte = (v: CleVoix | "micro", total: number) => v === "douce" || optionsOuvertes(total).has("voix");

/** Un message : 15 secondes au plus ; il cite 4 commerces au plus. */
export const DUREE_MAX_MESSAGE = 15;
export const COMMERCES_MAX_MESSAGE = 4;

/**
 * 🎭 CE QU'ELLE RESSENT — un message peut porter un sentiment : la figurine le joue chez celui qui le reçoit (elle
 * sautille de joie, tremble de colère, s'affaisse de tristesse, bondit d'euphorie). Ses images ne changent pas : c'est
 * le mouvement, la couleur et ce qui flotte autour qui le disent (`figurine-qui-parle.tsx`).
 */
export const SENTIMENTS = [
  { cle: "joie", emoji: "😄", nom: "La joie", court: "Joie", dit: "pleine de joie" },
  { cle: "colere", emoji: "😠", nom: "La colère", court: "Colère", dit: "en colère" },
  { cle: "tristesse", emoji: "😢", nom: "La tristesse", court: "Tristesse", dit: "un peu triste" },
  { cle: "euphorie", emoji: "🤩", nom: "L’euphorie", court: "Euphorie", dit: "euphorique" },
] as const;
export type Sentiment = (typeof SENTIMENTS)[number]["cle"];
export const sentimentValide = (x: unknown): Sentiment | null => (SENTIMENTS.some((v) => v.cle === x) ? (x as Sentiment) : null);
export const sentimentDe = (x: unknown) => SENTIMENTS.find((v) => v.cle === x) ?? null;

/**
 * 🎭 SES EXPRESSIONS, SUR SON VISAGE (4 novembre 2026 : « les émotions devaient être réelles, avec des expressions du
 * visage de la figurine, et pas un décor ») — pour chaque sentiment, deux images de SA figurine : la bouche fermée
 * (`n`) et la bouche ouverte (`p`, pour parler). Le moteur d'image les fait une fois, à partir de sa figurine
 * (`figurine-expressions-serveur.ts`) ; tant qu'elles manquent, elle bouge seulement.
 */
export type ImagesExpression = { n: string; p: string };
export type Expressions = Partial<Record<Sentiment, ImagesExpression>>;

/**
 * ✍️ ELLE DIT CE QU'IL ÉCRIT — un texte, lu par une voix choisie (ElevenLabs, côté serveur). C'est la seule voix
 * fabriquée de ClikMe, décidée par le propriétaire le 4 novembre 2026 (« on devrait pouvoir la faire parler avec une
 * voix lambda en mettant un texte ») ; jamais la voix du téléphone. Sa propre voix, enregistrée, reste possible.
 */
export const TEXTE_MAX = 140;
export const VOIX_FIGURINE = [
  { cle: "douce", nom: "Douce", emoji: "👩" },
  { cle: "petillante", nom: "Pétillante", emoji: "👱‍♀️" },
  { cle: "chaleureuse", nom: "Chaleureuse", emoji: "👨" },
  { cle: "posee", nom: "Posée", emoji: "🧔" },
] as const;
export type CleVoix = (typeof VOIX_FIGURINE)[number]["cle"];
export const voixValide = (x: unknown): CleVoix | null => (VOIX_FIGURINE.some((v) => v.cle === x) ? (x as CleVoix) : null);
/** Un texte propre : une ligne, sans caractères de contrôle, `TEXTE_MAX` au plus. */
export const texteValide = (x: unknown): string =>
  String(x ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TEXTE_MAX);

/**
 * 🎤 LA DÉMONSTRATION QU'ON FAIT PARLER SOI-MÊME (4 novembre 2026 : « je choisis l'émotion, je tape ce que je veux
 * qu'elle dise et je l'envoie à quelqu'un… si c'est bluffant, je voudrais créer ma propre figurine ») : la figurine du
 * propriétaire de ClikMe (son choix), sans compte. N'importe qui lui fait dire SON texte (`mots-interdits.ts` filtre),
 * dans une voix au choix, et l'envoie : un lien `/figurine/<id>`, où celui qui le reçoit lit « message écrit par … avec
 * la figurine de démonstration ». Les lectures sont comptées (par visiteur et pour tous, chaque jour) : chacune coûte.
 */
export const IMAGES_DEMO = { neutre: "/collection/demo-neutre.webp", parle: "/collection/demo-parle.webp" } as const;
export const PRENOM_MAX = 24;
/** Un prénom propre (facultatif) : des lettres, des espaces, des traits d'union, `PRENOM_MAX` au plus. */
export const prenomValide = (x: unknown): string =>
  String(x ?? "")
    .replace(/[^\p{L}\p{M} '’-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PRENOM_MAX);


/** Ses figurines, tous commerces confondus : celles de ses collections en cours, plus 10 par collection déjà finie. */
export function figurinesEnTout(familles: { collection?: Collection | null }[]): number {
  return familles.reduce((n, f) => {
    const c = f.collection;
    if (!c) return n;
    const finiesAvant = Math.max(0, c.trophees.length - (c.complete ? 1 : 0));
    return n + c.gagnees + finiesAvant * TOTAL_COLLECTION;
  }, 0);
}

/**
 * Où il en est :
 *   · « photo » : sa photo à envoyer (ou à renvoyer : `refus`) — dès le départ ;
 *   · « fabrication » : photo reçue, sa figurine se fabrique (le moteur : `auto` ; sinon ClikMe, à la main) ;
 *   · « prete » : sa figurine est là, il peut la faire parler ;
 *   · « bientot » : la suite n'est pas encore activée (migration pas appliquée).
 */
export type EtapeMaFigurine = "photo" | "fabrication" | "prete" | "bientot";

export type CommerceCite = { slug: string; nom: string; figurine: string };

export type EtatMaFigurine = {
  /** Ses figurines gagnées, tous commerces confondus : ce qui ouvre ses options (`OPTIONS_FIGURINE`). */
  total: number;
  etape: EtapeMaFigurine;
  prenom: string;
  /** Il a un compte (le cookie de l'appareil) ; sans lui, sa photo ouvre son compte dans la ville choisie. */
  compte: boolean;
  /** Sa figurine se fabrique par le moteur d'image (sinon : à la main, par ClikMe). */
  auto?: boolean;
  /** Il peut la refaire aujourd'hui (le moteur), encore tant de fois. */
  refaire?: number;
  /** Ses deux images (adresses signées, une heure). */
  neutre?: string;
  parle?: string;
  /** Sa photo n'a pas pu servir : pourquoi (« Photo trop floue »). */
  refus?: string;
  /** Les commerces que sa figurine peut citer : ceux où il a des figurines. */
  commerces: CommerceCite[];
  messages: { id: string; le: string; ecoutes: number; signale: boolean; sentiment?: Sentiment | null; texte?: string }[];
  /** Ses expressions déjà faites (adresses signées), et s'il en manque encore (le moteur d'image les fait). */
  expressions?: Expressions;
  expressionsAFaire?: boolean;
  /** Un texte peut être lu par une voix (ElevenLabs branché). */
  voixTexte?: boolean;
};

/** Ce que voit celui qui reçoit un message (`/figurine/<id>`). */
export type MessageFigurine =
  | { signale: true; prenom: string }
  | {
      signale: false;
      id: string;
      prenom: string;
      neutre: string;
      parle: string;
      duree: number;
      /** Ce qu'elle ressent dans ce message (aucun : elle parle, simplement). */
      sentiment: Sentiment | null;
      /** Son visage pour ce sentiment, s'il est fait (sinon `neutre` et `parle`). */
      expression?: ImagesExpression | null;
      /** Ce qu'elle dit, quand le message vient d'un texte (il s'affiche en bulle). */
      texte?: string;
      /** Un message de la démonstration : écrit par `prenom` avec la figurine de ClikMe (pas la sienne). */
      demo?: boolean;
      /** ✨ Le cadre doré (une option de l'expéditeur). */
      or?: boolean;
      commerces: (CommerceCite & { ville: string })[];
    };

export const idMessageValide = (id: string) => /^[a-z0-9]{12}$/.test(id);
export const lienMessage = (id: string) => `/figurine/${id}`;

/** « Léa t'a envoyé sa figurine 🔊 » : le texte qui part avec le lien (une démonstration : « une figurine qui parle »). */
export const texteDuMessage = (prenom: string, demo = false) => `${prenom || "Quelqu’un"} t’a envoyé ${demo ? "une figurine qui parle" : "sa figurine"} 🔊`;
