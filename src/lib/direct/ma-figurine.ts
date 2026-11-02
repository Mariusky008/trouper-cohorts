/**
 * 🗣️ SA PROPRE FIGURINE — « à 10 figurines, chez vous ou ailleurs, vos clients ont leur propre figurine : elle parle
 * avec leur voix, part chez leurs proches… et cite leurs commerces préférés, dont le vôtre. »
 * (`docs/figurines.md`, 9.7.)
 *
 * LA RÈGLE : 10 FIGURINES GAGNÉES, TOUS COMMERCES CONFONDUS (`figurinesEnTout`). Chaque commerce récompense sa
 * collection (la figurine d'or, son cadeau) ; ClikMe récompense le réseau (sa figurine à soi). Ensuite :
 *   1. il envoie une photo de lui (« C'est bien moi sur la photo ») ;
 *   2. ClikMe fabrique sa figurine — à la main pour l'instant — et pose ses deux images (bouche fermée, ouverte) ;
 *   3. il enregistre un message avec SA voix (jamais une voix fabriquée), choisit les commerces qu'elle cite, et
 *      l'envoie : un lien `/figurine/<id>`.
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
  messages: { id: string; le: string; ecoutes: number; signale: boolean }[];
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
      commerces: (CommerceCite & { ville: string })[];
    };

export const idMessageValide = (id: string) => /^[a-z0-9]{12}$/.test(id);
export const lienMessage = (id: string) => `/figurine/${id}`;

/** « Léa t'a envoyé sa figurine 🔊 » : le texte qui part avec le lien. */
export const texteDuMessage = (prenom: string) => `${prenom || "Quelqu’un"} t’a envoyé sa figurine 🔊`;
