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
    question: "Cette coupe vous plaît sur vous ?",
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
    question: "Cette pièce vous plaît sur vous ?",
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
    question: "Cette pièce vous plaît chez vous ?",
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
export type ChiffresCommerce = { essais: number; gardes: number; contacts: number };

export const CHIFFRES: Record<string, ChiffresCommerce> = {
  // ── BEAUTÉ ───────────────────────────────────────────────────────────────
  "coif-nouveau": { essais: 214, gardes: 47, contacts: 11 },
  "coif-barbier": { essais: 168, gardes: 39, contacts: 14 },
  "coif-halle": { essais: 132, gardes: 28, contacts: 7 },
  "coif-centre": { essais: 286, gardes: 61, contacts: 19 },
  // ── MODE ─────────────────────────────────────────────────────────────────
  "mode-friperie": { essais: 149, gardes: 34, contacts: 9 },
  "mode-homme": { essais: 121, gardes: 26, contacts: 8 },
  "mode-depot": { essais: 97, gardes: 31, contacts: 12 },
  "mode-centre": { essais: 243, gardes: 58, contacts: 16 },
  // ── DÉCO ─────────────────────────────────────────────────────────────────
  "maison-dax": { essais: 176, gardes: 44, contacts: 13 },
  cirier: { essais: 88, gardes: 19, contacts: 5 },
  "fleur-marche": { essais: 103, gardes: 22, contacts: 6 },
};

/** Les chiffres de ce commerce, ou de quoi ne rien afficher. */
export function chiffresDu(id: string): ChiffresCommerce | null {
  return CHIFFRES[id] ?? null;
}
