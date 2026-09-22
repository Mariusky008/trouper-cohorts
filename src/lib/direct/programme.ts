// 🗓️ ET SI ON RELOOKAIT VOTRE JOURNÉE ?
//
// ═══ LE RENVERSEMENT QUI DÉCIDE DE TOUT LE FICHIER ══════════════════════════
//
// LA JOURNÉE NE S'INVENTE PAS. ELLE S'ASSEMBLE.
//
// La maquette proposait un générateur : on répond à quatre questions, et une
// journée sort — « 20 h, restaurant », « 4 réservations confirmées », quatre
// QR codes. Rien de tout ça n'existe. Personne n'a d'agenda branché, aucun
// créneau n'a été réservé, et un QR code promet un système derrière qu'il
// faudrait inventer en entier.
//
// OR IL N'Y AVAIT RIEN À INVENTER. Chaque commerce de ClikMe publie déjà sa
// journée — voir `MomentJour` : « 12 h – 14 h, le plat du jour, 14 € », avec
// l'heure ET le prix, déclarés par celui qui servira. Et les quatre événements
// de la ville portent leurs horaires d'ouverture et de fin. Tout ce qu'il faut
// pour une journée est donc déjà là, dit par ceux qui la feront.
//
// CE PARCOURS NE FABRIQUE DONC AUCUNE HEURE, AUCUN PRIX, AUCUNE DISPONIBILITÉ.
// Il prend ce qui a été annoncé pour aujourd'hui, garde ce qui tombe aux
// bonnes heures, et le met dans l'ordre. C'est moins spectaculaire qu'un
// générateur, et c'est la seule version qui soit vraie demain matin.
//
// ═══ CE QU'ON DEMANDE, ET CE QU'ON A RETIRÉ ═════════════════════════════════
//
// LA MAQUETTE POSAIT QUATRE QUESTIONS : moment, ambiance, durée, budget. Trois
// écrans de questions avant de voir quoi que ce soit — et c'est là qu'on perd
// les gens, alors que le relooking, lui, montre une image dès le premier écran.
//
// « AMBIANCE » EST PARTIE, ET IL FAUT DIRE POURQUOI. Pour répondre « calme » ou
// « animé », il faudrait que quelqu'un l'ait déclaré. Personne ne l'a fait : les
// envies posées sur les moments sont majoritairement « tout de suite » et « à
// emporter », ce qui ne dit rien d'une ambiance. Une pastille qui trie au
// hasard est pire qu'une pastille en moins — elle apprend que les réglages de
// ce produit ne servent à rien.
//
// « DURÉE » EST PARTIE AUSSI, et pour une raison plus simple : elle se déduit.
// Une journée qui commence à midi et finit au concert de 19 h dure ce qu'elle
// dure ; le dire à l'avance, c'est demander à quelqu'un de calculer à notre
// place.
//
// IL RESTE DONC TROIS CHOSES, ET LES TROIS CHANGENT VRAIMENT LE RÉSULTAT :
//
//   · QUAND       — quelles heures, donc quels moments sont ouverts.
//   · QUOI        — quelles sortes d'étapes, donc quelles branches. Déclaré.
//   · LE BUDGET   — sur les prix affichés par les commerçants. Déclaré.
//
// ET UN MOT LIBRE, QUI N'EST PAS DÉCORATIF. Il ne part pas dans un moteur qui
// ferait semblant de le comprendre : il est recopié tel quel dans le message
// envoyé à chaque commerçant. « On sera six, plutôt en terrasse » est traité
// par la seule chose capable de le traiter — un humain, derrière son comptoir.
//
// ═══ CE QU'ON NE DIT JAMAIS ═════════════════════════════════════════════════
//
// PAS DE « RÉSERVATION CONFIRMÉE », PAS DE QR CODE, PAS DE COMPTE À REBOURS.
// Exactement la règle du relooking, et pour la même raison : on peut envoyer
// une demande, on ne peut pas confirmer une table. Ce qui part est un message
// WhatsApp par commerce, montré avant d'être envoyé, et ce qui revient revient
// de lui.

import {
  estEvenement,
  evenementsDeLaVille,
  toutesLesCartes,
  type CarteAutour,
  type CleMetier,
  type EvenementVille,
  type ItemPaquet,
  type MomentJour,
} from "@/lib/direct/apercu-habitant";
import { prixEnEuros } from "@/lib/direct/relooking";

/* ═══ LA RARETÉ ═════════════════════════════════════════════════════════════

   « Elle apparaît rarement, une fois tous les 10–15 contenus, ou une seule
   fois par session/jour. »

   ELLE N'A PAS LE MÊME RANG QUE LE RELOOKING, ET C'EST TOUT CE QUI LES EMPÊCHE
   DE SE DISPUTER L'ÉCRAN. Deux annonces plein cadre qui tombent au même moment
   s'annulent : on en ferme une sans la lire, et probablement les deux. Six et
   dix ne se croisent jamais.

   LA JOURNÉE PASSE EN PREMIÈRE, et ce n'est pas arbitraire : on se relooke deux
   fois par an, on cherche quoi faire ce week-end toutes les semaines. Celle
   qu'on voit en premier doit être celle dont on se servira le plus. */
export const RANG_ANNONCE_JOURNEE = 6;

const CLE_VUE = "clikme-journee-vue-v1";

function ceJour(): string {
  return new Date().toLocaleDateString("fr-CA");
}

export function annonceJourneeVue(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CLE_VUE) === ceJour();
  } catch {
    /* Stockage refusé : on la montre, plutôt que de la retirer à quelqu'un qui
       ne l'a jamais vue. */
    return false;
  }
}

export function marquerAnnonceJourneeVue() {
  try {
    window.localStorage.setItem(CLE_VUE, ceJour());
  } catch {
    /* Elle reviendra demain. Ce n'est pas grave : c'est une invitation. */
  }
}

/* ═══ LES CRÉNEAUX ══════════════════════════════════════════════════════════

   CINQ, ET CE SONT CEUX D'UNE VRAIE JOURNÉE, pas des tranches horaires
   régulières. On ne déjeune pas « de 12 à 14 » parce qu'un découpage le dit :
   on déjeune, et ça tombe là. Le verbe compte plus que l'heure — c'est lui
   qu'on lit sur l'écran du programme.

   LES BORNES NE SONT PAS DES PROMESSES. Elles servent à savoir quels moments
   publiés tombent dans quel temps de la journée ; l'heure affichée au client
   est toujours celle que le commerçant a écrite, jamais celle-ci. */
export type CleCreneau = "matin" | "midi" | "apresmidi" | "apero" | "soir";

export type Creneau = {
  cle: CleCreneau;
  /** Sur le programme : « Le midi ». */
  label: string;
  /** Le verbe de ce temps-là : « On déjeune ». */
  verbe: string;
  emoji: string;
  de: number;
  a: number;
};

export const CRENEAUX: Creneau[] = [
  { cle: "matin", label: "La matinée", verbe: "On commence", emoji: "☕", de: 8, a: 11.5 },
  { cle: "midi", label: "Le midi", verbe: "On déjeune", emoji: "🍽️", de: 11.5, a: 14.5 },
  { cle: "apresmidi", label: "L’après-midi", verbe: "On flâne", emoji: "🚶", de: 14.5, a: 18 },
  { cle: "apero", label: "L’apéro", verbe: "On prend un verre", emoji: "🥂", de: 18, a: 20 },
  { cle: "soir", label: "Le soir", verbe: "On finit la journée", emoji: "🌙", de: 20, a: 23.5 },
];

export function creneauDe(cle: CleCreneau): Creneau {
  return CRENEAUX.find((c) => c.cle === cle) ?? CRENEAUX[1];
}

/* ═══ 1. LE MOMENT — LES QUATRE CARTES DU PREMIER ÉCRAN ════════════════════

   QUATRE, ET CE SONT LES SIENNES : « Ce midi », « Cet après-midi », « Ce soir »,
   « Surprends-moi ». C'est ainsi qu'on y pense, et c'est la seule question dont
   la réponse est immédiate. Cocher soi-même cinq créneaux serait un travail de
   planification — or on ouvre cet écran justement pour ne pas planifier.

   « SURPRENDS-MOI » N'EST PAS UN QUATRIÈME MOMENT, C'EST L'ABSENCE DE CHOIX, et
   c'est pour ça qu'il ouvre la journée entière : qui ne choisit pas son moment
   ne veut pas qu'on lui en retire un. */
export type CleMoment = "midi" | "aprem" | "soir" | "surprise";

export type Moment = {
  cle: CleMoment;
  /** Sur la carte : « Ce midi ». */
  label: string;
  /** Les deux lignes dessous : « Bien manger, bien profiter ». */
  detail: string;
  /** Le pictogramme du rond : soleil, soleil couchant, lune, cadeau. */
  signe: "soleil" | "couchant" | "lune" | "cadeau";
  photo: string;
  creneaux: CleCreneau[];
};

/**
 * LES PHOTOS SONT CELLES DU DOSSIER, PAS DES IMAGES DE BANQUE NEUVES.
 * `LISEZ-MOI.md` l'interdit pour les commerces inventés, et la règle vaut ici :
 * une carte « Ce soir » illustrée par une terrasse qu'on n'a nulle part
 * ailleurs ferait une promesse que le reste du produit ne tient pas.
 */
export const MOMENTS: Moment[] = [
  {
    cle: "midi",
    label: "Ce midi",
    detail: "Bien manger, bien profiter",
    signe: "soleil",
    photo: "/direct/plat-axoa.jpg",
    creneaux: ["midi", "apresmidi"],
  },
  {
    cle: "aprem",
    label: "Cet après-midi",
    detail: "Activités, shopping, détente",
    signe: "couchant",
    photo: "/direct/vitrine-mode.jpg",
    creneaux: ["apresmidi", "apero"],
  },
  {
    cle: "soir",
    label: "Ce soir",
    detail: "Restaurant, bar, sortie, événement",
    signe: "lune",
    photo: "/direct/verre-au-comptoir.jpg",
    creneaux: ["apero", "soir"],
  },
  {
    cle: "surprise",
    label: "Surprends-moi",
    detail: "Une journée sur mesure",
    signe: "cadeau",
    photo: "",
    creneaux: ["matin", "midi", "apresmidi", "apero", "soir"],
  },
];

export function momentDe(cle: CleMoment): Moment {
  return MOMENTS.find((m) => m.cle === cle) ?? MOMENTS[0];
}

/* ═══ 2. L'AMBIANCE — LA GRILLE DE HUIT ════════════════════════════════════

   HUIT VIGNETTES, LES SIENNES, DANS SON ORDRE. Elles se cumulent — une journée
   est faite de plusieurs choses — et aucune n'est cochée d'avance : une case
   pré-cochée décide à la place de quelqu'un, et on s'en aperçoit trop tard,
   devant le résultat.

   ═══ CE QUE CHAQUE AMBIANCE SAIT VRAIMENT REMPLIR ═══════════════════════════

   ET IL FAUT LE DIRE, PARCE QUE TOUTES NE SE VALENT PAS. Une ambiance n'est pas
   un mot-clé : elle se traduit en branches et en organisateurs DÉCLARÉS, sans
   quoi elle trierait au hasard — et une pastille qui trie au hasard apprend que
   les réglages de ce produit ne servent à rien.

   « ACTIVE » EST LA PLUS FAIBLE DES HUIT AUJOURD'HUI, et ce n'est pas un défaut
   de code : le jeu de démonstration ne contient aucun commerce ni aucun
   événement sportif. Elle tombe donc sur ce qui s'en approche le plus — les
   sorties de plein air où l'on marche — et si un jour une base de loisirs
   publie, elle la prendra sans qu'on touche à rien. En attendant, cochée seule,
   elle rendra peu : l'écran le dit plutôt que de remplir avec autre chose. */
export type CleAmbiance =
  | "gourmande"
  | "active"
  | "shopping"
  | "detente"
  | "festive"
  | "culturelle"
  | "famille"
  | "surprise";

export type Ambiance = {
  cle: CleAmbiance;
  label: string;
  photo: string;
  /** Les branches de commerce qui savent répondre. */
  branches: CleMetier[];
  /** Les organisateurs d'événements qui savent répondre. Voir `typeQui`. */
  organisateurs: string[];
  /** Vrai pour « Surprends-moi » : tout est permis. */
  tout?: boolean;
};

export const AMBIANCES: Ambiance[] = [
  {
    cle: "gourmande",
    label: "Gourmande",
    photo: "/direct/plat-lasagnes.jpg",
    branches: ["restaurant"],
    organisateurs: [],
  },
  {
    cle: "active",
    label: "Active",
    photo: "/direct/vide-grenier.jpg",
    branches: [],
    organisateurs: ["office", "association"],
  },
  {
    cle: "shopping",
    label: "Shopping",
    photo: "/direct/friperie-rayon.jpg",
    branches: ["mode", "artisan", "lunetier", "fleuriste"],
    organisateurs: ["association"],
  },
  {
    cle: "detente",
    label: "Détente",
    photo: "/direct/salon-bacs.jpg",
    branches: ["coiffeur", "ongles"],
    organisateurs: [],
  },
  {
    cle: "festive",
    label: "Festive",
    photo: "/direct/bar-planche.jpg",
    branches: ["bar"],
    organisateurs: ["mairie"],
  },
  {
    cle: "culturelle",
    label: "Culturelle",
    photo: "/direct/nocturne-musee.jpg",
    branches: [],
    organisateurs: ["musee"],
  },
  {
    cle: "famille",
    label: "En famille",
    photo: "/direct/concert-kiosque.jpg",
    branches: [],
    organisateurs: ["mairie", "office"],
  },
  {
    cle: "surprise",
    label: "Surprends-moi",
    photo: "",
    branches: [],
    organisateurs: [],
    tout: true,
  },
];

export function ambianceDe(cle: CleAmbiance): Ambiance {
  return AMBIANCES.find((a) => a.cle === cle) ?? AMBIANCES[0];
}

/* ═══ 3. LA DURÉE ══════════════════════════════════════════════════════════

   ELLE NE FILTRE RIEN, ELLE COMPTE. Trois heures ne changent pas ce qui est
   ouvert : elles changent le nombre d'étapes qu'on peut y tenir. C'est donc un
   plafond sur la longueur, pas un critère sur le contenu. */
export type CleDuree = "court" | "demi" | "complete";

export type Duree = {
  cle: CleDuree;
  label: string;
  /** Ce qu'on écrit dans le bandeau du récapitulatif : « Demi-journée (3-6 h) ». */
  entre: string;
  /** Le nombre d'étapes au maximum. */
  etapes: number;
};

export const DUREES: Duree[] = [
  { cle: "court", label: "2 - 3 h", entre: "2-3 h", etapes: 2 },
  { cle: "demi", label: "Demi-journée", entre: "3-6 h", etapes: 4 },
  { cle: "complete", label: "Journée complète", entre: "6 h et plus", etapes: 5 },
];

export function dureeDe(cle: CleDuree): Duree {
  return DUREES.find((d) => d.cle === cle) ?? DUREES[1];
}

/* ═══ 4. SEUL OU À PLUSIEURS ═══════════════════════════════════════════════

   ELLE NE CHANGE PAS LA JOURNÉE, ELLE CHANGE LE TOTAL ET LE MESSAGE. Les prix
   des commerçants sont par personne ; deux personnes, c'est deux fois — et le
   commerçant, lui, a besoin de savoir combien vous serez avant de répondre.
   C'est la seule des cinq questions dont la réponse part vraiment chez lui. */
export type CleCompagnie = "seul" | "plusieurs";

export const COMPAGNIES: { cle: CleCompagnie; label: string; personnes: number }[] = [
  { cle: "seul", label: "Seul(e)", personnes: 1 },
  { cle: "plusieurs", label: "À plusieurs", personnes: 2 },
];

export function personnesDe(cle: CleCompagnie): number {
  return COMPAGNIES.find((c) => c.cle === cle)?.personnes ?? 1;
}

/* ═══ 5. LE BUDGET, PAR PERSONNE ET POUR LA JOURNÉE ════════════════════════

   C'EST SA FORMULATION, ET ELLE EST MEILLEURE QUE LA MIENNE. J'avais mis un
   plafond PAR ÉTAPE, en me disant qu'on ne connaît pas le nombre d'étapes. Mais
   personne ne raisonne comme ça : on se dit « je mets cinquante euros dans ma
   journée », pas « quinze euros par arrêt ». Le plafond porte donc sur le total
   de la journée, pour une personne.

   CE QUI N'A PAS DE PRIX AFFICHÉ N'EST JAMAIS ÉCARTÉ. Un moment sans prix n'est
   pas un moment cher : on n'en sait rien. Le filtrer punirait le commerçant qui
   n'a pas rempli et cacherait au client une étape peut-être gratuite. Même
   règle que les tailles — voir `aMaTaille` dans `tailles.ts`. */
export type CleBudget = "petit" | "moyen" | "confort";

export type Budget = {
  cle: CleBudget;
  label: string;
  /** Les signes de la maquette : €, €€, €€€. */
  signe: string;
  /** Entre parenthèses : « (- de 20 €) ». */
  entre: string;
  /** Le plafond du total, par personne. Absent : aucun plafond. */
  plafond?: number;
};

export const BUDGETS: Budget[] = [
  { cle: "petit", label: "Petit", signe: "€", entre: "- de 20 €", plafond: 20 },
  { cle: "moyen", label: "Moyen", signe: "€€", entre: "20 - 50 €", plafond: 50 },
  { cle: "confort", label: "Confort", signe: "€€€", entre: "+ de 50 €" },
];

export function budgetDe(cle: CleBudget): Budget {
  return BUDGETS.find((b) => b.cle === cle) ?? BUDGETS[1];
}

/* ═══ UN CANDIDAT : UNE CHOSE QUI SE PASSE VRAIMENT ═════════════════════════ */

export type Candidat = {
  /** `${commerce}|${titre}` ou l'identifiant de l'événement. Unique dans la journée. */
  cle: string;
  /** Le lieu, tel qu'il s'annonce. */
  ou: string;
  /** Le métier, ou l'organisateur pour un événement. */
  qui: string;
  /** CE QUI SE PASSE — le titre du moment publié, jamais une phrase de notre main. */
  quoi: string;
  lignes: string[];
  photo?: string;
  /** L'HEURE TELLE QU'ELLE A ÉTÉ ÉCRITE PAR CELUI QUI LA TIENT. */
  quand: string;
  de: number;
  a: number;
  /** Son prix affiché, s'il y en a un. */
  prix?: string;
  /** Le prix en euros, pour le budget et le total. Zéro : rien d'affiché. */
  euros: number;
  /** Vrai quand c'est donné. Voir `offert` sur `MomentJour`. */
  offert?: boolean;
  /**
   * SON PRIX EST UN TARIF, PAS UN COÛT — « 34 €/kg ». Il s'affiche, il ne
   * s'additionne pas, et l'écran doit pouvoir le DIRE au niveau de l'étape :
   * l'ambre est la couleur de ce que cette étape coûte, et un tarif au kilo
   * n'est pas ça. Voir `auPoids`.
   */
  tarif?: boolean;
  /**
   * LE GESTE QUE LE COMMERÇANT A ÉCRIT LUI-MÊME : « Réserver », « Je passe la
   * prendre ». C'est lui qui dit si sa chose se retient ou se vient chercher,
   * et c'est donc lui qui décide des mots de la demande. Voir `messageDeLEtape`.
   */
  action?: string;
  metres: number;
  distance: string;
  /* L'AMBIANCE N'EST PLUS UN CHAMP DU CANDIDAT, et c'est une correction : une
     friperie sert « Shopping » quand « Shopping » est coché, et rien de
     particulier quand on n'a coché que « Surprends-moi ». Elle dépend donc de
     ce qui est demandé, pas du commerce. Voir `ambianceDuCandidat`. */
  creneau: CleCreneau;
  /** L'un ou l'autre, jamais les deux. */
  carte?: CarteAutour;
  evenement?: EvenementVille;
};

/**
 * ═══ SE RECOUVRENT-ELLES VRAIMENT, OU SE TOUCHENT-ELLES SEULEMENT ? ════════
 *
 * MESURÉ : un service de 11 h à 13 h atterrissait dans « La matinée », qui
 * s'arrête à 11 h 30. C'était vrai au sens strict — les deux tranches se
 * recouvrent d'une demi-heure — et faux à la lecture : on ne déjeune pas le
 * matin parce qu'un service a commencé trois minutes avant la fin de la
 * matinée. Un programme qui écrit « La matinée · 11 h – 13 h » se contredit
 * tout seul, et une contradiction sur un écran d'horaires coûte la confiance
 * de tout le reste.
 *
 * TROIS QUARTS D'HEURE, C'EST LE SEUIL. En dessous, on ne fait que frôler le
 * moment : la chose existe à ce créneau-là mais ne s'y vit pas.
 */
const RECOUVREMENT_MINIMAL = 0.75;

/**
 * ═══ UN PRIX AU POIDS N'EST PAS UN COÛT D'ÉTAPE ════════════════════════════
 *
 * MESURÉ SUR LE PREMIER PROGRAMME COMPLET : la côte de bœuf du boucher est
 * affichée « 34 €/kg », et le total de la journée l'a additionnée comme s'il
 * s'agissait de 34 €. C'est faux dans les deux sens — on peut en prendre trois
 * cents grammes comme deux kilos — et c'est exactement le genre de chiffre
 * qu'on regarde une fois et sur lequel on décide.
 *
 * ON GARDE SON PRIX À L'ÉCRAN, ON LE SORT DU TOTAL. Le « 34 €/kg » reste
 * affiché, parce que c'est son prix et qu'il renseigne ; il rejoint simplement
 * les étapes dont on ne connaît pas le coût, et le total le dit.
 *
 * « 22 € LA PART » RESTE COMPTÉ, ET LA DIFFÉRENCE EST NETTE : une part est une
 * unité qu'on achète entière, un kilo est une quantité qu'on choisit. La
 * première est un prix, la seconde est un tarif.
 */
function auPoids(t: string | undefined): boolean {
  return !!t && /(\/\s*(kg|kilo|l|litre)\b|\bau\s+kilo|\ble\s+kilo|\/\s*100\s*g)/i.test(t);
}

function chevauche(a1: number, a2: number, b1: number, b2: number): boolean {
  return Math.min(a2, b2) - Math.max(a1, b1) >= RECOUVREMENT_MINIMAL;
}

function candidatDuMoment(
  c: CarteAutour,
  m: MomentJour,
  creneau: CleCreneau,
): Candidat {
  return {
    cle: `${c.id}|${m.titre}`,
    ou: c.nom,
    qui: c.metier,
    quoi: m.titre,
    lignes: m.lignes ?? [],
    photo: m.photo ?? c.photo,
    quand: m.quand,
    de: m.de,
    a: m.a,
    prix: m.offert ? undefined : m.prix,
    euros: m.offert || auPoids(m.prix) ? 0 : prixEnEuros(m.prix),
    tarif: auPoids(m.prix),
    offert: m.offert,
    action: m.action,
    metres: c.metres,
    distance: c.distance,
    creneau,
    carte: c,
  };
}

function candidatDEvenement(e: EvenementVille, creneau: CleCreneau): Candidat {
  return {
    cle: e.id,
    ou: e.lieu,
    qui: e.qui,
    quoi: e.quoi,
    lignes: e.lignes,
    photo: e.photo,
    /* « CE SOIR · 19 H » NE SE REMPLACE PAS PAR « VERS 19 H ». L'organisateur a
       déclaré une heure de début et une heure de fin ; c'est la seule chose de
       tout ce parcours qui soit un créneau au sens strict, et il faut le dire
       comme tel. */
    quand: `${e.heure} – ${e.a} h`,
    de: e.de,
    a: e.a,
    prix: e.prix,
    euros: prixEnEuros(e.prix),
    offert: !e.prix,
    metres: e.metres,
    distance: e.distance,
    creneau,
    evenement: e,
  };
}

/**
 * ═══ CE QUI SE PASSE VRAIMENT DANS CE CRÉNEAU ══════════════════════════════
 *
 * ON NE REGARDE QUE CE QUI A ÉTÉ PUBLIÉ POUR AUJOURD'HUI. Un moment marqué
 * `demain` est écarté — il est vrai, mais pas aujourd'hui — et un commerce
 * silencieux ou seulement préparé n'entre pas : il n'a rien annoncé, et une
 * journée bâtie sur du silence enverrait quelqu'un devant une porte close.
 *
 * L'ORDRE EST CELUI DE LA DISTANCE, et c'est le seul tri honnête dont on
 * dispose : on n'a ni contrat, ni commission, ni note à faire remonter. À
 * égalité d'envie et d'heure, le plus près gagne, parce qu'une journée se fait
 * à pied.
 */
export function candidatsDuCreneau(
  creneau: Creneau,
  ambiances: CleAmbiance[],
): Candidat[] {
  const choisies = ambiances.map(ambianceDe);
  const tout = choisies.some((a) => a.tout) || choisies.length === 0;
  const branches = new Set<string>(choisies.flatMap((a) => a.branches));
  const organisateurs = new Set<string>(choisies.flatMap((a) => a.organisateurs));

  const sortis: Candidat[] = [];

  for (const ev of evenementsDeLaVille()) {
    if (!ev.aujourdhui) continue;
    if (!tout && !organisateurs.has(ev.typeQui)) continue;
    if (!chevauche(ev.de, ev.a, creneau.de, creneau.a)) continue;
    sortis.push(candidatDEvenement(ev, creneau.cle));
  }

  for (const c of toutesLesCartes()) {
    if (c.silencieux || c.prepare) continue;
    if (!tout && !branches.has(c.branche)) continue;
    for (const m of c.moments ?? []) {
      if (m.demain) continue;
      if (!chevauche(m.de, m.a, creneau.de, creneau.a)) continue;
      sortis.push(candidatDuMoment(c, m, creneau.cle));
    }
  }

  /* ═══ CE DONT LE CŒUR TOMBE DANS LE CRÉNEAU PASSE DEVANT ═════════════════

     MESURÉ, ET LA CAUSE EST DANS LA DONNÉE : le bar à vins publie son happy
     hour avec `de: 17` et « 18 h – 20 h ». Les deux sont vrais pour lui — sa
     carte apparaît dès 17 h, l'offre court de 18 à 20 — mais pour nous, `de`
     le rendait éligible à l'après-midi, qui s'arrête à 18 h.

     ON NE CORRIGE PAS SA DONNÉE, ON CHOISIT MIEUX. Le milieu d'un moment dit
     mieux que son début à quel temps de la journée il appartient. Ce n'est
     qu'une PRÉFÉRENCE : quand rien d'autre ne se présente, on garde le
     candidat plutôt que de laisser un trou. */
  const dedans = (x: Candidat) => {
    const coeur = (x.de + x.a) / 2;
    return coeur >= creneau.de && coeur < creneau.a ? 0 : 1;
  };

  /* L'ORDRE EST CELUI DE LA DISTANCE, et c'est le seul tri honnête dont on
     dispose : on n'a ni contrat, ni commission, ni note à faire remonter. */
  return sortis.sort(
    (a, b) => dedans(a) - dedans(b) || a.metres - b.metres || a.de - b.de,
  );
}

/**
 * QUELLE AMBIANCE CE CANDIDAT SERT-IL, PARMI CELLES QU'ON A COCHÉES ?
 *
 * ON NE LE RANGE PAS UNE FOIS POUR TOUTES : une friperie sert « Shopping », et
 * rien d'autre tant que « Shopping » est coché ; si l'on n'a coché que
 * « Surprends-moi », elle ne sert aucune ambiance en particulier et ne doit pas
 * empêcher la suivante de sortir. La réponse dépend donc de ce qui est coché,
 * pas seulement du commerce.
 */
function ambianceDuCandidat(x: Candidat, cochees: CleAmbiance[]): CleAmbiance {
  for (const cle of cochees) {
    const a = ambianceDe(cle);
    if (a.tout) continue;
    if (x.evenement && a.organisateurs.includes(x.evenement.typeQui)) return cle;
    if (x.carte && a.branches.includes(x.carte.branche)) return cle;
  }
  return "surprise";
}

/* ═══ LE PROGRAMME ═════════════════════════════════════════════════════════ */

export type EtapeProgramme = Candidat & {
  /** Le rang dans la journée, à partir de 1. */
  n: number;
  /** Ce qu'il reste à marcher depuis l'étape précédente. Zéro pour la première. */
  depuisPrecedent: number;
};

export type Programme = {
  etapes: EtapeProgramme[];
  /** LES CRÉNEAUX OÙ IL N'Y AVAIT RIEN — et on le dit, on ne les efface pas. */
  vides: Creneau[];
  /**
   * LE BUDGET A ÉTÉ DÉPASSÉ, ET ON NE LE CACHE PAS. Plutôt qu'un trou dans la
   * journée, on garde l'étape et le bandeau porte la mention : un chiffre juste
   * avec un avertissement vaut mieux qu'un chiffre faux sans.
   */
  deborde: boolean;
  /** Une ou deux. Les prix des commerçants sont par personne. */
  personnes: number;
};

/**
 * ═══ ON ASSEMBLE, ON NE GÉNÈRE PAS ═════════════════════════════════════════
 *
 * UNE ÉTAPE PAR CRÉNEAU, ET JAMAIS DEUX. Deux restaurants à midi ne sont pas
 * une journée, c'est une liste de résultats — et une liste de résultats est
 * exactement ce qu'on est venu éviter. Quand un créneau a plusieurs candidats,
 * on en propose un et on garde les autres sous le bouton « Remplacer ».
 *
 * `cle` FAIT TOURNER LE CHOIX SANS HASARD. Un tirage aléatoire donnerait une
 * journée différente à chaque rendu de React, y compris pendant qu'on la
 * regarde. Ici le même numéro rend toujours la même journée, et « Remplacer »
 * avance simplement d'un cran.
 *
 * DEUX FOIS LE MÊME LIEU DANS LA JOURNÉE, NON. Déjeuner et dîner chez le même
 * restaurateur est un défaut visible à l'œil nu ; c'est aussi, pour lui, une
 * demande qui se lit comme une erreur.
 */
export function composerProgramme(opts: {
  moment: CleMoment;
  ambiances: CleAmbiance[];
  duree: CleDuree;
  budget: CleBudget;
  compagnie?: CleCompagnie;
  cle?: number;
  /** Les décalages par créneau, quand on a appuyé sur « Remplacer ». */
  decales?: Partial<Record<CleCreneau, number>>;
  /** Les créneaux décochés sur l'écran du programme. */
  retires?: CleCreneau[];
}): Programme {
  const m = momentDe(opts.moment);
  const d = dureeDe(opts.duree);
  const b = budgetDe(opts.budget);
  const base = opts.cle ?? 0;
  const retires = new Set<string>(opts.retires ?? []);

  const retenues: Candidat[] = [];
  const vides: Creneau[] = [];
  const lieuxPris = new Set<string>();
  const ambiancesServies = new Set<CleAmbiance>();
  let cumul = 0;
  let deborde = false;

  for (const cleCreneau of m.creneaux) {
    if (retenues.length >= d.etapes) break;
    if (retires.has(cleCreneau)) continue;
    const creneau = creneauDe(cleCreneau);
    const tous = candidatsDuCreneau(creneau, opts.ambiances).filter(
      (x) => !lieuxPris.has(x.carte?.id ?? x.evenement?.id ?? x.cle),
    );
    if (tous.length === 0) {
      /* UN CRÉNEAU VIDE N'EST PAS UNE PANNE, c'est un fait sur la ville à cette
         heure-ci. On le garde pour le dire, au lieu de refermer le trou en
         silence — un programme qui saute l'après-midi sans rien dire laisse
         croire qu'on a oublié. */
      vides.push(creneau);
      continue;
    }

    /* ═══ CHAQUE AMBIANCE COCHÉE DOIT APPARAÎTRE AU MOINS UNE FOIS ═════════

       MESURÉ : en cochant cinq ambiances, on obtenait trois fois la même. La
       cause n'était pas un bug — le tri par distance est juste, et le concert
       du kiosque est à 450 m quand le bar est à 190. À une étape par créneau,
       le plus proche gagnait toujours. Or cocher cinq ambiances et en recevoir
       une seule n'est pas une réponse. */
    const neufs = tous.filter(
      (x) => !ambiancesServies.has(ambianceDuCandidat(x, opts.ambiances)),
    );
    let liste = neufs.length > 0 ? neufs : tous;

    /* ═══ LE BUDGET PORTE SUR LE TOTAL DE LA JOURNÉE, PAR PERSONNE ═════════

       C'EST SA FORMULATION, ET ELLE EST MEILLEURE QUE LA MIENNE : personne ne
       se dit « quinze euros par arrêt », on se dit « je mets cinquante euros
       dans ma journée ».

       ON NE JETTE RIEN QUAND PLUS RIEN NE TIENT : une étape hors budget vaut
       mieux qu'un trou, à condition de le DIRE. Le bandeau porte alors la
       mention, et le chiffre reste juste. */
    if (b.plafond) {
      const plafond = b.plafond;
      const tiennent = liste.filter((x) => cumul + x.euros <= plafond);
      if (tiennent.length > 0) liste = tiennent;
      else deborde = true;
    }

    const decale = opts.decales?.[cleCreneau] ?? 0;
    const choisi = liste[(base + decale) % liste.length];
    retenues.push(choisi);
    cumul += choisi.euros;
    ambiancesServies.add(ambianceDuCandidat(choisi, opts.ambiances));
    lieuxPris.add(choisi.carte?.id ?? choisi.evenement?.id ?? choisi.cle);
  }

  /* L'ORDRE EST CELUI DE LA JOURNÉE, PAS CELUI DES HEURES D'OUVERTURE. Trier
     sur `de` mettait la fleuriste — ouverte depuis 8 h et retenue pour
     l'après-midi — devant le déjeuner de 11 h 30 : `de` dit quand la chose
     COMMENCE À ÊTRE VRAIE, pas quand on y va. */
  const rang = (x: Candidat) => m.creneaux.indexOf(x.creneau);
  const ordre = [...retenues].sort((a, b2) => rang(a) - rang(b2) || a.de - b2.de);
  const etapes = ordre.map((x, i) => ({
    ...x,
    n: i + 1,
    /* LA MARCHE ENTRE DEUX ÉTAPES EST UN ÉCART DE DISTANCE AU POINT DE DÉPART,
       et rien de plus. On n'a pas leurs coordonnées : prétendre calculer un
       itinéraire réel serait inventer un chemin. L'écart est une MINORATION
       honnête — c'est au moins ça — et l'écran l'écrit comme tel. */
    depuisPrecedent: i === 0 ? 0 : Math.abs(x.metres - ordre[i - 1].metres),
  }));

  return {
    etapes,
    vides,
    deborde,
    personnes: personnesDe(opts.compagnie ?? "seul"),
  };
}

export function apercuDuJour(combien = 3): EtapeProgramme[] {
  const p = composerProgramme({
    moment: "surprise",
    ambiances: ["surprise"],
    duree: "complete",
    budget: "confort",
  });
  return p.etapes.filter((e) => e.photo).slice(0, combien);
}

/** Combien d'autres possibilités pour ce créneau-là. Sert à « Remplacer ». */
export function autresPour(creneau: CleCreneau, ambiances: CleAmbiance[]): number {
  return candidatsDuCreneau(creneauDe(creneau), ambiances).length;
}

/**
 * ═══ ÉCRIRE UNE DISTANCE COMME ON LA DIT ═══════════════════════════════════
 *
 * MESURÉ : deux étapes à cent quatre-vingts et cent quatre-vingt-dix mètres
 * donnaient « 0,2 km ». C'est exact et personne ne parle comme ça — en dessous
 * du kilomètre on compte en mètres, et un « 0,2 » se lit comme un arrondi
 * suspect plutôt que comme une marche de rien du tout.
 */
export function distanceEnMots(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * CE QU'ON MARCHE ENTRE LES ÉTAPES, ET RIEN D'AUTRE.
 *
 * LE TRAJET DEPUIS CHEZ SOI N'EN FAIT PAS PARTIE, et la distinction compte :
 * le panneau de la carte dit « entre les activités ». Y glisser les cent
 * quatre-vingts mètres qui séparent la première étape de la maison ferait un
 * chiffre qui ne correspond à aucune des deux phrases.
 */
export function metresEntreLesEtapes(p: Programme): number {
  return p.etapes.reduce((s, e) => s + e.depuisPrecedent, 0);
}

/** La distance totale, du point de départ à la dernière étape. */
export function metresDuProgramme(p: Programme): number {
  return (
    p.etapes.reduce((s, e) => s + e.depuisPrecedent, 0) + (p.etapes[0]?.metres ?? 0)
  );
}

/**
 * ═══ CE QUE ÇA COÛTE, ET CE QU'ON N'EN SAIT PAS ════════════════════════════
 *
 * LE TOTAL EST UN PLANCHER, JAMAIS UNE ADDITION. Il ne compte que les prix
 * affichés ; les étapes sans prix ne sont ni estimées ni moyennées. Une
 * estimation serait pire qu'un silence : on la lirait comme un engagement, et
 * elle serait fausse chez la moitié des commerces.
 *
 * ET ON DIT COMBIEN D'ÉTAPES ON N'A PAS PU COMPTER. « À partir de 34 € » sur
 * quatre étapes dont deux sans prix, c'est un chiffre qui trompe ; « à partir
 * de 34 €, deux étapes sans prix affiché » est un chiffre qu'on peut utiliser.
 */
export function totalDuProgramme(p: Programme): {
  /** Par personne. Les prix des commerçants sont tous par personne. */
  parPersonne: number;
  /** Pour tout le monde : le précédent multiplié par le nombre de personnes. */
  total: number;
  personnes: number;
  sansPrix: number;
  offertes: number;
  /** « 71 € / pers. », ou « Aucun prix affiché ». */
  texte: string;
} {
  const parPersonne = p.etapes.reduce((s, e) => s + e.euros, 0);
  const offertes = p.etapes.filter((e) => e.offert).length;
  /* UN SEUL COMPTE POUR DEUX CAS, parce que c'est la même chose à l'arrivée :
     un prix qu'on ne connaît pas et un prix au kilo laissent l'un comme l'autre
     le total incomplet. Les distinguer à l'écran ferait une nuance que personne
     n'a demandée devant un chiffre qu'on lit en une seconde. */
  const sansPrix = p.etapes.filter((e) => !e.offert && e.euros === 0).length;
  const texte =
    parPersonne === 0
      ? sansPrix > 0
        ? "Aucun prix affiché"
        : "Gratuit"
      : `${parPersonne} € / pers.`;
  return {
    parPersonne,
    total: parPersonne * p.personnes,
    personnes: p.personnes,
    sansPrix,
    offertes,
    texte,
  };
}

/**
 * ═══ LE MESSAGE QUI PART CHEZ CE COMMERÇANT-LÀ ═════════════════════════════
 *
 * UN PAR ÉTAPE, ET JAMAIS UN POUR TOUS. Le restaurateur n'a pas à savoir qu'on
 * finit la soirée au bar d'à côté, et le bar n'a pas à lire un programme où il
 * est quatrième. Chacun reçoit SA demande — c'est ce qui la rend traitable en
 * dix secondes entre deux clients. Même règle que `messageDeLaLigne` pour le
 * relooking, et pour les mêmes raisons.
 *
 * IL DEMANDE, IL NE CONFIRME RIEN. « Est-ce qu'il reste de la place » et non
 * « je réserve » : on n'a pas son agenda, et ce parcours ne prétendra jamais
 * l'avoir.
 *
 * LE MOT LIBRE EST RECOPIÉ TEL QUEL, et c'est tout son intérêt : « on sera six,
 * plutôt en terrasse » n'est traitable par aucun moteur, et l'est parfaitement
 * par la personne qui lit.
 *
 * UN ÉVÉNEMENT DE LA VILLE NE REÇOIT RIEN. On n'écrit pas à la mairie pour lui
 * dire qu'on passera au kiosque — c'est gratuit, sans réservation, et un
 * message serait au mieux inutile.
 */
export function messageDeLEtape(e: EtapeProgramme, prenom?: string, mot?: string): string {
  const signature = prenom ? `\n${prenom}` : "";
  const precision = mot?.trim() ? `\n${mot.trim()}` : "";
  /* ON NE DEMANDE PAS « S'IL RESTE DE LA PLACE » À UNE FLEURISTE. La place est
     la question d'une table et d'une terrasse ; ailleurs, la question est la
     disponibilité. Une demande écrite dans les mots d'un autre métier se lit
     comme un envoi automatique — et un envoi automatique ne se traite pas. */
  /* C'EST SON MOT À LUI QUI TRANCHE, PAS SA BRANCHE. Le boucher est rangé avec
     les restaurants — sa côte de bœuf maturée n'a pourtant pas de « place » à
     garder, elle se met de côté. Il a déjà écrit le geste sur son moment :
     « Réserver » ou « Je passe la prendre ». Aucune supposition à faire. */
  const assis = /réserv/i.test(e.action ?? "");
  const question = assis
    ? "Est-ce qu’il reste de la place ?"
    : "Est-ce que c’est encore disponible ?";
  return `Bonjour, je vous ai vu sur ClikMe : « ${e.quoi} », ${e.quand}. ${question}${precision}${signature}`;
}

/** Cette étape se demande-t-elle, ou se vit-elle sans prévenir personne ? */
export function seDemande(e: EtapeProgramme): boolean {
  return !!e.carte;
}

/**
 * LE PROGRAMME EN TEXTE, POUR LE SALON.
 *
 * C'EST LÀ QUE CE PARCOURS PREND TOUT SON SENS, et c'est ce qui le distingue du
 * relooking : un relooking se fait seul, une journée se décide à plusieurs.
 * ClikMe a déjà les salons et les voix — voir `proposer` et `donnerSaVoix` dans
 * `salons.ts` : une journée proposée devient une proposition qu'on vote, pas un
 * message de plus dans un fil.
 */
export function texteDuProgramme(p: Programme): string {
  return p.etapes
    .map((e) => `${e.quand} · ${e.quoi} — ${e.ou}`)
    .join("\n");
}

/** Le titre court d'une journée, pour la proposition du salon. */
export function titreDuProgramme(p: Programme): string {
  const n = p.etapes.length;
  if (n === 0) return "Une journée";
  const premiere = p.etapes[0];
  const derniere = p.etapes[n - 1];
  if (n === 1) return premiere.quoi;
  return `${premiere.quoi}, puis ${derniere.quoi.toLowerCase()}`;
}

/** Un item du paquet, pour rouvrir la carte d'une étape. */
export function itemDeLEtape(e: EtapeProgramme): ItemPaquet | undefined {
  return e.carte ?? e.evenement;
}

/** Vrai quand cet item est un événement de la ville. Ré-exporté par commodité. */
export { estEvenement };
