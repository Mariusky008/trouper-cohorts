// LE MODE PRÉPARATION — LES COMMERCES DE LA RUE QU'ON VA FAIRE.
//
// ─── LE PROBLÈME QU'IL RÈGLE, ET IL SE JOUE EN DIX SECONDES ────────────────
//
// On entre dans une boucherie, on tend un téléphone, et on montre une
// application où l'on balaie LES COMMERCES DES AUTRES. Le boucher fait alors
// le calcul que tout le monde fait, et il a raison de le faire :
//
//   · « c'est pour les restaurants » — il n'a vu que des assiettes ;
//   · « je n'ai pas le temps » — on lui décrit un geste à apprendre ;
//   · « il n'y a personne dessus » — et c'est vrai le premier jour.
//
// Trois objections, et il n'y a pas quatre-vingt-dix secondes pour trois.
//
// ─── CE QUI LES DÉMOLIT D'UN COUP ──────────────────────────────────────────
//
// Il balaie, et C'EST SA BOUCHERIE. Son nom, son adresse, ses horaires, sa
// photo, la date d'aujourd'hui. On n'explique plus rien : « je l'ai préparée
// ce matin, elle est prête, vous dites oui et elle est en ligne ».
//
// C'est la seule démonstration qui fonctionne À ZÉRO UTILISATEUR — donc la
// seule qui vaille le premier jour, qui est justement celui où l'on convainc.
//
// ─── ET POURQUOI ELLE NE PART JAMAIS EN LIGNE ──────────────────────────────
//
// `public/direct/LISEZ-MOI.md` pose la règle, et elle vaut ici plus qu'ailleurs :
// « une devanture identifiable ferait passer un vrai commerçant pour un client
// de ClikMe sans qu'il ait rien signé ». Publier la carte d'un commerce avant
// son accord, ce serait exactement ça.
//
// TOUT RESTE DONC DANS LE TÉLÉPHONE DE CELUI QUI DÉMARCHE. `localStorage`, sur
// son appareil, rien envoyé nulle part, rien de partagé, rien d'indexé. Et la
// carte le dit à l'écran — « prête à publier, pas encore en ligne » — ce qui
// n'affaiblit pas l'argument : ça le transforme en invitation.

import type { CarteAutour, CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";

const CLE = "clikme.preparation.v1";

/** Un commerce préparé avant la visite. Le strict nécessaire pour une carte. */
export type CommercePrepare = {
  id: string;
  nom: string;
  /** Le libellé de son métier, tel qu'il le dirait — « Boucherie », pas un code. */
  metier: string;
  branche: CleMetier;
  adresse: string;
  horaires: string;
  /** À quelle distance on le dit. « 180 m », « à deux minutes ». */
  distance: string;
  metres: number;
  /** Sa photo, en data-URL. Elle ne quitte pas l'appareil. */
  photo?: string;
  /** CE QU'IL A AUJOURD'HUI — le seul champ qui demande de le connaître un peu.
   *  C'est aussi celui qui fait la différence : « côte de bœuf maturée » sur sa
   *  propre carte vaut mille explications sur le principe du produit. */
  quoi: string;
  detail?: string;
  prix?: string;
  /**
   * SA VOIX — le prénom et le conseil du jour. Voir `Voix` dans les fiches.
   *
   * POURQUOI C'EST DANS L'OUTIL DE TERRAIN. C'est la seule chose de tout ce
   * formulaire qu'on ne peut pas préparer la veille : il faut être devant lui
   * et lui poser la question. Et c'est précisément le moment où elle se pose
   * le mieux — « qu'est-ce que vous conseilleriez à quelqu'un qui entre
   * aujourd'hui ? ». Il répond en trois secondes, sans y penser, parce qu'il
   * l'a déjà dit dix fois ce matin. On note, et sa carte cesse d'être une
   * fiche produit avant même qu'il ait dit oui.
   *
   * FACULTATIF, comme le reste de la voix.
   */
  prenom?: string;
  role?: string;
  conseil?: string;
  /** Ce qu'il pourrait débloquer à plusieurs. Facultatif : la plupart des
   *  premières visites se font très bien sans. */
  collectif?: {
    objectif: number;
    participants: number;
    prixGroupe?: string;
    debloque?: string;
  };
};

/** L'emoji du moment, deviné du métier. Neutre en dernier recours : mieux vaut
 *  un point qu'un symbole qui parle du commerce d'à côté. */
function icone(branche: CleMetier, metier: string): string {
  const m = metier.toLowerCase();
  if (/boulanger|pâtiss|patiss/.test(m)) return "🥐";
  if (/bouch|charcut/.test(m)) return "🔪";
  if (/poissonn/.test(m)) return "🐟";
  if (/fromag/.test(m)) return "🧀";
  if (/caviste|vin/.test(m)) return "🍷";
  if (/primeur|fruit|légume|legume/.test(m)) return "🥕";
  return { restaurant: "🍽️", mode: "👗", bar: "🍸", coiffeur: "💇", fleuriste: "💐", ongles: "💅" }[
    branche
  ];
}

/**
 * LE LIBELLÉ DU BOUTON, DANS SES MOTS.
 *
 * SANS LUI, LE MOMENT N'A PAS D'ACTION et « Réserver » s'affiche éteint sur la
 * carte — vu à l'écran. Un bouton gris sur sa propre annonce, au moment précis
 * où l'on veut qu'il se projette dedans, est le pire détail possible.
 *
 * ET « RÉSERVER » NE VEUT RIEN DIRE CHEZ UN BOUCHER. Le produit tient déjà ce
 * raisonnement dans `mots-metier.ts` ; on ne l'importe pas pour trois cas, mais
 * on suit la même règle.
 */
function action(branche: CleMetier, metier: string): string {
  const m = metier.toLowerCase();
  if (/bouch|charcut|poissonn|fromag|boulanger|pâtiss|patiss|primeur|traiteur/.test(m))
    return "Gardez-la-moi";
  if (branche === "fleuriste") return "Mettez-m’en un de côté";
  if (branche === "mode") return "Mettez-le-moi de côté";
  return "Réserver";
}

/**
 * LA LISTE VIDE EST UNE CONSTANTE, ET LE CACHE N'EST PAS UNE OPTIMISATION.
 *
 * `useSyncExternalStore` compare les instantanés PAR IDENTITÉ : une fonction
 * qui rend un tableau neuf à chaque appel déclare un changement à chaque
 * rendu, et React boucle jusqu'à l'écran blanc. C'est exactement ce qui est
 * arrivé — l'application ne s'ouvrait plus du tout. On relit donc le stockage
 * une seule fois, et on ne le relit qu'après une écriture.
 */
const AUCUN: CommercePrepare[] = [];
let cache: CommercePrepare[] | null = null;

/** Ce qui est stocké aujourd'hui. Jamais d'exception : un brouillon illisible
 *  ne doit pas empêcher l'application de s'ouvrir devant un commerçant. */
export function chargerPreparation(): CommercePrepare[] {
  if (typeof window === "undefined") return AUCUN;
  if (cache) return cache;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as CommercePrepare[]) : AUCUN;
  } catch {
    cache = AUCUN;
  }
  return cache;
}

/** L'instantané du serveur : la même instance à chaque appel, pour la même
 *  raison que ci-dessus. */
export function preparationVide(): CommercePrepare[] {
  return AUCUN;
}

const abonnes = new Set<() => void>();

export function abonnerPreparation(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function garder(l: CommercePrepare[]) {
  cache = l.length ? l : AUCUN;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(l));
  } catch {
    /* Quota plein : la photo est trop lourde. On ne casse rien, on n'ajoute pas. */
  }
  abonnes.forEach((f) => f());
}

export function ajouterPreparation(c: Omit<CommercePrepare, "id">): CommercePrepare {
  const neuf: CommercePrepare = { ...c, id: `prep-${Date.now().toString(36)}` };
  // LE DERNIER AJOUTÉ PASSE DEVANT : on prépare la boutique juste avant d'y
  // entrer, et c'est celle-là qu'on veut voir en tête en poussant la porte.
  garder([neuf, ...chargerPreparation()]);
  return neuf;
}

export function retirerPreparation(id: string) {
  garder(chargerPreparation().filter((c) => c.id !== id));
}

export function viderPreparation() {
  garder([]);
}

/**
 * LA CARTE, TELLE QUE LE PAQUET L'ATTEND.
 *
 * UN SEUL MOMENT, OUVERT TOUTE LA JOURNÉE. On ne connaît pas ses horaires de
 * service et on ne va pas les inventer : un moment qui se fermerait à une heure
 * fausse ferait disparaître sa carte pendant qu'on la lui montre — le pire des
 * défauts possibles à cet instant précis.
 */
export function carteDuPrepare(c: CommercePrepare): CarteAutour {
  const m: MomentJour = {
    de: 0,
    a: 24,
    quand: "aujourd’hui",
    icone: icone(c.branche, c.metier),
    titre: c.quoi,
    lignes: c.detail ? [c.detail] : undefined,
    prix: c.prix,
    action: action(c.branche, c.metier),
    envies: [],
    collectif: c.collectif,
    conseil: c.conseil || undefined,
  };
  return {
    id: c.id,
    branche: c.branche,
    photo: c.photo,
    cadrage: "50%",
    nom: c.nom,
    metier: c.metier,
    ville: "Dax",
    itineraire: "https://www.google.com/maps/dir/?api=1&destination=Dax",
    metres: c.metres,
    distance: c.distance,
    fiche: {
      ou: c.adresse,
      horaires: c.horaires,
      mot: "",
    },
    moments: [m],
    // SA VOIX N'EXISTE QUE S'IL A DONNÉ UN PRÉNOM. Sans lui, on ne signe rien :
    // une carte signée « — , boucher » serait pire que pas de signature.
    voix: c.prenom ? { prenom: c.prenom, role: c.role || undefined } : undefined,
    // LE MARQUEUR EST PORTÉ PAR LA CARTE, pas par un réglage global : on peut
    // avoir préparé six commerces et en croiser un vrai entre deux.
    prepare: true,
  };
}
