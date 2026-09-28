/**
 * 📅 LA DEMANDE DE RENDEZ-VOUS — ce que devient le dernier écran des parcours.
 *
 * ═══ POURQUOI ELLE REMPLACE « Y ALLER » ════════════════════════════════════
 *
 * « Je remplacerais le dernier écran par : "Cette coupe vous plaît sur vous ?
 * Coupe homme · 22 € · Un barbier de la halle · Demander un rendez-vous →".
 * Et même chemin pour l'étape 4 de mode, qui est trop plate et sans intérêt. »
 *
 * LE DERNIER ÉCRAN NE FAISAIT RIEN, ET C'ÉTAIT SON DÉFAUT. Il félicitait
 * — « Envie de la faire pour de vrai ? » — puis proposait un itinéraire. Un
 * itinéraire est honnête et ne prouve rien : on peut l'ouvrir depuis n'importe
 * quelle fiche Google. Tout le parcours menait donc à la chose que ClikMe
 * n'apporte pas.
 *
 * CE QU'IL APPORTE, C'EST L'ESSAI QUI DEVIENT UNE DEMANDE. Quelqu'un a vu la
 * coupe sur lui, il la veut, et le commerçant reçoit ça — pas un clic anonyme,
 * mais « une personne a essayé VOTRE coupe et veut venir cette semaine ».
 *
 * ═══ CE QUE LE COMMERÇANT REÇOIT, ET CE QU'IL DÉCIDE ═══════════════════════
 *
 * « Le barbier reçoit la demande avec la coupe choisie et, si le client
 * l'accepte, son image d'essayage. C'est lui qui propose et confirme le
 * créneau. »
 *
 * DEUX CHOSES Y SONT IMPORTANTES, ET AUCUNE N'EST UN DÉTAIL.
 *
 * 1. L'IMAGE NE PART QUE SI ON LE VEUT. C'est le visage de quelqu'un avec une
 *    coupe qu'il n'a pas : on ne l'envoie pas dans le dos de la personne. Le
 *    réglage est donc visible sur l'écran, et il se coupe d'un doigt.
 * 2. AUCUN CRÉNEAU N'EST PROMIS. On n'affiche pas « mardi 14 h 30 » : personne
 *    n'a son planning, et un horaire inventé une seule fois fait perdre un
 *    commerçant pour toujours. On dit une ENVIE — « dès que possible », « cette
 *    semaine » — et c'est lui qui propose l'heure. C'est la même règle que les
 *    tables du restaurant : on n'annonce pas un nombre qu'il ne peut pas tenir.
 */

/** Ce que le parcours demande, selon ce qu'on vient d'essayer. */
export type MotsRdv = {
  /** La question du dernier écran. */
  question: string;
  /** Le grand bouton. */
  bouton: string;
  /** « la coupe », « la pièce » — pour les phrases qui en parlent. */
  chose: string;
  /** Ce que le commerçant lit dans sa notification. */
  notification: (quand: string) => string;
  /** Ce que dit le bandeau du réglage d'image. */
  image: string;
};

export const MOTS_RDV: Record<string, MotsRdv> = {
  coiffure: {
    question: "Cette coupe vous plaît sur vous\u202f?",
    bouton: "Demander un rendez-vous",
    chose: "la coupe",
    /* « QUELQU'UN » PLUTOT QUE « UN CLIENT », et c'est un ecart assume par
       rapport a sa phrase. Il avait ecrit « un client a essaye votre coupe » ;
       la carte du barbier montre trois hommes, celle des salons trois femmes,
       et la notification s'affiche sous les deux. Le genre n'apporte rien ici —
       ce qui compte est qu'une personne a essaye et veut venir. */
    notification: (q) => `Quelqu’un a essayé votre coupe et souhaite venir ${q}.`,
    image: "Joindre mon essai à la demande",
  },
  mode: {
    question: "Cette pièce vous plaît sur vous\u202f?",
    bouton: "Demander à l’essayer en boutique",
    chose: "la pièce",
    notification: (q) => `Quelqu’un a essayé cette pièce et souhaite venir ${q}.`,
    image: "Joindre mon essai à la demande",
  },
  /* LA DÉCO NE SE PORTE PAS, ELLE SE POSE. « Vous plaît sur vous » n'a pas de
     sens pour un fauteuil : l'essai s'est fait dans un salon, pas sur un corps,
     et la demande est d'aller le voir en vrai — parce qu'on ne juge pas une
     matière sur un écran. */
  deco: {
    question: "Cette pièce vous plaît chez vous\u202f?",
    bouton: "Demander à la voir en boutique",
    chose: "la pièce",
    notification: (q) => `Quelqu’un a essayé cette pièce chez lui et souhaite passer ${q}.`,
    image: "Joindre mon rendu à la demande",
  },
};

/**
 * LES TROIS ENVIES, ET PAS UN CRÉNEAU.
 *
 * « Après le clic, le client choisit simplement "dès que possible", "cette
 * semaine" ou "une autre date". »
 *
 * TROIS, PARCE QUE TROIS SE CHOISISSENT SANS LIRE. Un calendrier demande de
 * décider avant de savoir ce qui est libre ; ces trois-là disent seulement à
 * quel point on est pressé, ce que tout le monde sait de soi.
 */
export type Delai = { cle: string; mot: string; dit: string; icone: string };

export const DELAIS: Delai[] = [
  { cle: "vite", mot: "Dès que possible", dit: "dès que possible", icone: "⚡" },
  { cle: "semaine", mot: "Cette semaine", dit: "cette semaine", icone: "📆" },
  { cle: "autre", mot: "Une autre date", dit: "à un autre moment", icone: "🗓️" },
];

/**
 * ═══ LES TROIS CHIFFRES DU COMMERÇANT ══════════════════════════════════════
 *
 * « Tu affiches la photo de sa coupe, accompagnée de trois informations :
 * combien de personnes l'ont essayée, combien l'ont enregistrée, combien ont
 * contacté le salon à partir de cette coupe. »
 *
 * ILS RACONTENT UN ENTONNOIR, ET C'EST TOUT LEUR INTÉRÊT. Cent qui essaient,
 * vingt qui gardent, six qui écrivent : le commerçant lit d'un coup d'œil que
 * cette réalisation-là travaille pour lui. « Il comprend alors qu'il pourrait
 * identifier les réalisations qui donnent envie aux habitants de venir chez
 * lui, et les remettre en avant. »
 *
 * ═══ ET ON ÉCRIT QUE CE SONT DES EXEMPLES ══════════════════════════════════
 *
 * « Dans la démo, les données seraient explicitement illustratives ; ensuite,
 * ce seraient les actions réellement mesurées. »
 *
 * C'EST LA RÈGLE DE TOUT CE PRODUIT, et elle a déjà été payée ailleurs : « il
 * est écrit souvent "il reste 4 tables", or nous ne pouvons pas savoir combien
 * il reste de tables ». Un chiffre montré sans dire d'où il vient est pris pour
 * une mesure. L'écran porte donc la mention, en toutes lettres, et pas en
 * petit dans un coin.
 *
 * LES NOMBRES NE SONT PAS TIRÉS AU HASARD : ils sont écrits ici, donc stables
 * d'une démonstration à l'autre. Un chiffre qui change entre deux ouvertures se
 * remarque, et à partir de là plus rien n'est cru.
 */
/**
 * ═══ LES MOTS DU PANNEAU, PAR BRANCHE ══════════════════════════════════════
 *
 * « En fait, à la fin de tous les écrans de tous les commerçants visités, il
 * faudrait avoir ce "côté commerçant" avec ses stats. Pour toutes les autres
 * catégories, faire la même chose pour avoir la même logique et le même
 * impact en fin de parcours. »
 *
 * L'ENTONNOIR EST LE MÊME PARTOUT, LES VERBES NON. « 214 l'ont essayée » a du
 * sens pour une coupe ; un magret ne s'essaie pas, il se regarde, et personne
 * n'« écrit » à un restaurant — on y réserve une table. Si l'on gardait les
 * mêmes mots, le panneau dirait faux dans quatre parcours sur cinq pour ne pas
 * avoir à écrire douze lignes ici.
 *
 * TROIS COLONNES ET PAS QUATRE, ET C'EST VRAI DE TOUTES LES BRANCHES : ce qui
 * se regarde, ce qui se garde, ce qui se transforme en quelqu'un qui pousse la
 * porte. Le commerçant lit l'écart entre la première et la dernière, et c'est
 * tout ce que ce panneau a à dire.
 */
export type MotsCote = {
  /** « Côté salon », « Côté cuisine » — chez qui l'on vient de passer. */
  cote: string;
  /** La pastille qui y mène, en fin de parcours. */
  pastille: string;
  /** Les trois marches, dans l'ordre. */
  vus: string;
  gardes: string;
  contacts: string;
};

export const MOTS_COTE: Record<string, MotsCote> = {
  coiffure: {
    cote: "salon",
    pastille: "Et côté salon\u202f?",
    vus: "l’ont essayée",
    gardes: "l’ont gardée",
    contacts: "ont écrit",
  },
  mode: {
    cote: "boutique",
    pastille: "Et côté boutique\u202f?",
    vus: "l’ont essayée",
    gardes: "l’ont gardée",
    contacts: "ont écrit",
  },
  deco: {
    cote: "boutique",
    pastille: "Et côté boutique\u202f?",
    vus: "l’ont essayée",
    gardes: "l’ont gardée",
    contacts: "ont écrit",
  },
  /* LE RESTAURANT NE FAIT PAS ESSAYER, IL FAIT VENIR. On ne pose pas un magret
     sur soi : on le regarde, on le garde pour midi, et la dernière marche est
     une table demandée — le geste que la dernière étape propose vraiment. */
  restaurant: {
    cote: "cuisine",
    pastille: "Voir les stats de ce plat",
    vus: "l’ont regardé",
    gardes: "l’ont gardé pour midi",
    contacts: "ont demandé une table",
  },
  /* LA SORTIE N'A PAS DE CLIENT, ELLE A DU MONDE. « Ont écrit » ne dit rien
     d'un concert ; ce que l'organisateur veut savoir, c'est combien ont écouté
     l'extrait et combien ont dit qu'ils y seraient. */
  sortie: {
    cote: "organisateur",
    pastille: "Et côté organisateur\u202f?",
    vus: "l’ont écoutée",
    gardes: "l’ont gardée",
    contacts: "ont dit «\u202fj’y serai\u202f»",
  },
};

export function motsCoteDe(branche: string | undefined): MotsCote {
  return MOTS_COTE[branche ?? ""] ?? MOTS_COTE.mode;
}

export type ChiffresCommerce = {
  essais: number;
  gardes: number;
  contacts: number;
  /**
   * ═══ CINQ COMPTES, ET PLUS UNE MOYENNE ════════════════════════════════
   *
   * « Pour la moyenne, on ne veut pas voir ce que la personne précédente a mis,
   * mais seulement la moyenne des fantômes — donc pas 4,3, mais plutôt tous
   * les fantômes avec le nombre de votes pour chaque fantôme. »
   *
   * UN CHIFFRE UNIQUE CACHE LA SALLE. Deux commerces à 4,3 peuvent avoir des
   * salles très différentes : l'un fait l'unanimité en tiède, l'autre a
   * quarante enthousiastes et dix mécontents. Le premier doit rassurer, le
   * second doit comprendre qui il déçoit — et le même chiffre leur dit la même
   * chose. Les cinq comptes disent la forme, c'est-à-dire ce qu'il y a à faire.
   *
   * ET LA MOYENNE ÉCRITE À LA MAIN A DISPARU. Elle vivait à côté des trois
   * chiffres, sans aucun lien avec eux : deux vérités pour une seule chose, et
   * c'est toujours la seconde qui ment le jour où l'on corrige la première.
   * Les répartitions ont été posées pour retomber sur les moyennes d'alors —
   * à un dixième près au pire, parce qu'un 4,6 ne survit pas à une vraie queue
   * de « pas pour moi », et que c'est le chiffre qui était trop beau.
   *
   * LES CINQ SONT DANS L'ORDRE DE L'ÉCHELLE — de « pas pour moi » à « j'en
   * veux ». Voir `lib/direct/reaction-fantome.ts` pour les mots de chaque
   * métier.
   */
  votes: readonly number[];
};

/**
 * COMBIEN DE PERSONNES ONT RÉPONDU.
 *
 * C'EST LA SEULE CHOSE QU'ON DÉRIVE DES VOTES, et il n'y a plus de fonction
 * `moyenneDe` à côté : elle n'aurait eu aucun appelant. Le panneau du
 * commerçant montre la SALLE — les cinq comptes — et plus un chiffre unique.
 * Une moyenne calculée que personne n'affiche est un commentaire déguisé en
 * code : le jour où quelqu'un la rebranche, elle a déjà cessé d'être juste.
 */
export const voixDe = (votes: readonly number[]) => votes.reduce((a, b) => a + b, 0);

export const CHIFFRES: Record<string, ChiffresCommerce> = {
  // ── BEAUTÉ ───────────────────────────────────────────────────────────────
  "coif-nouveau": { essais: 214, gardes: 47, contacts: 11, votes: [1, 1, 1, 22, 20] },
  "coif-barbier": { essais: 168, gardes: 39, contacts: 14, votes: [1, 1, 4, 6, 23] },
  "coif-halle": { essais: 132, gardes: 28, contacts: 7, votes: [2, 2, 2, 2, 20] },
  "coif-centre": { essais: 286, gardes: 61, contacts: 19, votes: [2, 2, 4, 14, 38] },
  // ── MODE ─────────────────────────────────────────────────────────────────
  "mode-friperie": { essais: 149, gardes: 34, contacts: 9, votes: [1, 1, 3, 6, 20] },
  "mode-homme": { essais: 121, gardes: 26, contacts: 8, votes: [1, 1, 2, 4, 17] },
  "mode-depot": { essais: 97, gardes: 31, contacts: 12, votes: [1, 1, 1, 1, 16] },
  "mode-centre": { essais: 243, gardes: 58, contacts: 16, votes: [2, 2, 5, 7, 35] },
  // ── DÉCO ─────────────────────────────────────────────────────────────────
  "maison-dax": { essais: 176, gardes: 44, contacts: 13, votes: [2, 2, 2, 4, 27] },
  cirier: { essais: 88, gardes: 19, contacts: 5, votes: [1, 1, 2, 2, 12] },
  "fleur-marche": { essais: 103, gardes: 22, contacts: 6, votes: [1, 1, 1, 6, 13] },
  /* ── RESTAURANTS ─────────────────────────────────────────────────────────
     PLUS DE MONDE QUE PARTOUT AILLEURS, ET C'EST LA VERITE DU METIER. Un plat
     du jour se regarde le matin par toute une ville ; une coupe de cheveux se
     regarde par ceux qui pensent a se faire couper les cheveux. Les tables
     demandees restent basses en proportion — on ne reserve pas pour un midi ou
     l'on passe sans prevenir. */
  centre: { essais: 412, gardes: 78, contacts: 23, votes: [2, 2, 3, 23, 57] },
  emporter: { essais: 268, gardes: 54, contacts: 17, votes: [2, 2, 2, 16, 34] },
  "deux-rues": { essais: 337, gardes: 61, contacts: 14, votes: [3, 3, 3, 16, 46] },
  boulange: { essais: 194, gardes: 42, contacts: 9, votes: [2, 2, 2, 2, 33] },
  boucher: { essais: 226, gardes: 47, contacts: 12, votes: [2, 2, 2, 10, 31] },
  tablee: { essais: 289, gardes: 58, contacts: 21, votes: [2, 2, 2, 6, 49] },
  traiteur: { essais: 151, gardes: 33, contacts: 8, votes: [1, 1, 5, 5, 20] },
  // ── SORTIES ──────────────────────────────────────────────────────────────
  /* LA DERNIERE COLONNE N'EST PAS INVENTEE ICI : c'est `intentions` de la
     soiree, le nombre de Fantomes qui ont dit qu'ils y seraient — 26 au
     kiosque. Deux ecrans de la meme demonstration qui comptent la meme chose
     doivent dire le meme nombre, sinon aucun des deux n'est cru. */
  kiosque: { essais: 318, gardes: 64, contacts: 18, votes: [2, 2, 2, 9, 52] },
  "bar-vins": { essais: 142, gardes: 29, contacts: 18, votes: [1, 1, 2, 7, 19] },
  "bar-terrasse": { essais: 176, gardes: 38, contacts: 11, votes: [1, 1, 5, 9, 21] },
  "marche-nuit": { essais: 97, gardes: 21, contacts: 9, votes: [1, 1, 2, 3, 13] },
  expo: { essais: 84, gardes: 19, contacts: 7, votes: [1, 1, 1, 2, 13] },
  "vide-grenier": { essais: 121, gardes: 26, contacts: 14, votes: [1, 1, 3, 5, 15] },
};

/** Les chiffres de ce commerce, ou de quoi ne rien afficher. */
export function chiffresDu(id: string): ChiffresCommerce | null {
  return CHIFFRES[id] ?? null;
}
