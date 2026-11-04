/**
 * 🗣️ SA PROPRE FIGURINE — « à 10 figurines, chez vous ou ailleurs, vos clients ont leur propre figurine : elle parle
 * avec leur voix, part chez leurs proches… et cite leurs commerces préférés, dont le vôtre. »
 * (`docs/figurines.md`, 9.7.)
 *
 * LA RÈGLE : 10 FIGURINES GAGNÉES, TOUS COMMERCES CONFONDUS (`figurinesEnTout`). Chaque commerce récompense sa
 * collection (la figurine d'or, son cadeau) ; ClikMe récompense le réseau (sa figurine à soi). Ensuite :
 *   1. il envoie une photo de lui (« C'est bien moi sur la photo ») ;
 *   2. ClikMe fabrique sa figurine — à la main pour l'instant — et pose ses deux images (bouche fermée, ouverte) ;
 *   3. il lui fait dire un message — un texte lu par une voix au choix (ElevenLabs : la seule voix fabriquée de ClikMe,
 *      décidée par le propriétaire le 4 novembre 2026), ou SA voix enregistrée —, choisit son visage (ses expressions),
 *      les commerces qu'elle cite, et l'envoie : un lien `/figurine/<id>`.
 * CE QU'ELLE CITE, C'EST LUI QUI LE CHOISIT, parmi les commerces où il a des figurines : jamais « vu récemment chez… »
 * (on ne dit pas à ses proches où il est allé et quand).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Collection } from "./collection";
import { TOTAL_COLLECTION } from "./collection";

export const SEUIL_MA_FIGURINE = 10;
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
 * LA DÉMONSTRATION : la figurine de Léa (la cliente des démos, avec son accord). Sans compte, on lui fait dire une de
 * ces phrases, dans la voix qu'on veut : chaque voix se fabrique une fois, puis se garde (jamais un texte libre ici).
 */
export const PHRASES_DEMO = [
  { cle: "resto", texte: "Coucou ! On se fait un resto ce soir ? Je t’invite !" },
  { cle: "anniv", texte: "Joyeux anniversaire ! Passe me voir, je t’offre un café." },
  { cle: "merci", texte: "Merci pour hier soir, c’était génial ! On remet ça quand tu veux." },
] as const;
export type ClePhrase = (typeof PHRASES_DEMO)[number]["cle"];
export const phraseDemo = (x: unknown) => PHRASES_DEMO.find((p) => p.cle === x) ?? null;

/** Ce que la page sait de la démonstration : ses expressions déjà faites, et si les voix sont branchées. */
export type DemoFigurine = { expressions: Expressions; complete: boolean; voix: boolean };

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
 *   · « a-gagner » : moins de 10 ;
 *   · « photo » : 10 atteint, sa photo à envoyer (ou à renvoyer : `refus`) ;
 *   · « fabrication » : photo reçue, ClikMe fabrique sa figurine ;
 *   · « prete » : sa figurine est là, il peut la faire parler ;
 *   · « bientot » : 10 atteint, mais la suite n'est pas encore activée (migration pas appliquée).
 */
export type EtapeMaFigurine = "a-gagner" | "photo" | "fabrication" | "prete" | "bientot";

export type CommerceCite = { slug: string; nom: string; figurine: string };

export type EtatMaFigurine = {
  total: number;
  seuil: number;
  etape: EtapeMaFigurine;
  prenom: string;
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
      commerces: (CommerceCite & { ville: string })[];
    };

export const idMessageValide = (id: string) => /^[a-z0-9]{12}$/.test(id);
export const lienMessage = (id: string) => `/figurine/${id}`;

/** « Léa t'a envoyé sa figurine 🔊 » : le texte qui part avec le lien. */
export const texteDuMessage = (prenom: string) => `${prenom || "Quelqu’un"} t’a envoyé sa figurine 🔊`;
