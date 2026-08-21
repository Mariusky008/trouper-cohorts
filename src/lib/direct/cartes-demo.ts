// LES CARTES DU DIRECT MONTRÉES PENDANT LA DÉMONSTRATION.
//
// LE DÉFAUT QUE ÇA CORRIGE, ET IL EST GROS. La démonstration parlait du Direct
// sans jamais le montrer. Le commerçant entendait « votre menu part dans Le
// Direct » et voyait un encadré stylisé qui ne ressemblait à rien. Or c'est le
// mode swipe qui fait comprendre le système d'un seul coup d'œil : une carte
// plein écran, une photo, un prix, trois gestes. Tant qu'il ne l'a pas vu, il
// ne sait pas ce qu'on lui vend.
//
// TROIS RÈGLES GOUVERNENT CE FICHIER, ET AUCUNE N'EST NÉGOCIABLE :
//
//  1. AUCUN COMMERCE INVENTÉ N'EST NOMMÉ. Les cartes de l'acte 3 décrivent ce
//     que les habitants voient dans la ville — donc d'AUTRES commerces. Leur
//     donner un nom, ce serait fabriquer trois faux voisins ; leur donner LE
//     sien, ce serait lui faire croire qu'il y est déjà. Elles portent donc un
//     métier et une ville, et rien de plus.
//
//  2. SES CARTES À LUI NE DISENT QUE CE QU'IL A SAISI. Le menu vient de
//     `geste-du-jour`, les gestes de la journée de `acte-metier` — c'est-à-dire
//     des mêmes sources que le reste de la démonstration. Rien n'est réécrit
//     ici, sinon la promesse et le produit divergeraient au premier ajustement.
//
//  3. LES PHOTOS SONT LES SIENNES. Celles de sa fiche Google, déjà affichées
//     sur son site. Une image d'illustration achetée ailleurs serait plus jolie
//     et moins convaincante : ce qui frappe, c'est de voir SON commerce dans
//     l'écran de ses clients. Quand il n'en a aucune, la carte tombe sur un
//     fond dégradé et l'emoji du métier — jamais sur la photo d'un autre.
import type { CarteDirect } from "@/components/direct/carte-swipe";
import { estRestauration } from "@/lib/direct/mots-metier";

/**
 * LES QUATRE PHOTOS D'ILLUSTRATION — et le périmètre étroit de leur emploi.
 *
 * Elles ne servent qu'à deux choses : les cartes de la VILLE (qui décrivent
 * d'autres commerces que celui qui regarde), et le repli quand un commerçant
 * n'a aucune photo sur sa fiche Google. Partout ailleurs ce sont les SIENNES —
 * voir la règle 3 en tête de fichier.
 *
 * Un fichier absent n'est pas une panne : la carte empile l'image sur un
 * dégradé, et c'est le dégradé qui reste. Voir `carte-swipe.tsx`.
 */
const PHOTOS = {
  plat: "/direct/plat-du-jour.jpg",
  tables: "/direct/tables-libres.jpg",
  four: "/direct/sortie-du-four.jpg",
  vitrine: "/direct/vitrine-du-soir.jpg",
} as const;

/**
 * OÙ REGARDER DANS CHACUNE — vérifié en les posant dans le vrai cadre.
 *
 * Le sujet de trois d'entre elles est dans la moitié BASSE, c'est-à-dire sous
 * le voile qui porte le nom et le prix : les tables vides et les viennoiseries
 * disparaissaient presque entièrement. On descend donc le point de visée pour
 * remonter le sujet dans la zone lisible.
 *
 * La marge de manœuvre est limitée — ces images ne dépassent le cadre que de
 * 8 % en hauteur, on ne peut pas les recadrer beaucoup depuis ici. Un tirage
 * avec le sujet plus haut ferait mieux ; celui-ci fait déjà la différence.
 */
const CADRAGE: Record<string, string> = {
  [PHOTOS.plat]: "68%",
  [PHOTOS.tables]: "100%",
  [PHOTOS.four]: "100%",
  [PHOTOS.vitrine]: "72%",
};
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";
import type { TempsMetier } from "@/lib/direct/acte-metier";

/** Un temps de l'acte 7, tel qu'il s'affiche : un titre, sa phrase, sa carte. */
export type TempsIllustre = {
  /** L'heure, en gros au-dessus. C'est elle qui fait la journée. */
  heure: string;
  /** CE QU'IL PEUT FAIRE À CETTE HEURE-LÀ, en une question courte.
   *  Sans ce titre, les quatre cartes se lisaient comme quatre écrans de
   *  produit ; avec lui, comme quatre moments de sa journée. */
  titre: string;
  /** Ce que le commerçant dit — ou, pour la demande inversée, ce qu'il reçoit. */
  dit: string;
  /** Ce que ça donne dans Le Direct. */
  carte: CarteDirect;
  /** L'intitulé du geste attendu de l'habitant sur cette carte. */
  action: string;
  /**
   * LA COULEUR DE CE MOMENT DE LA JOURNÉE.
   *
   * LE DÉFAUT QU'ELLE CORRIGE. Les quatre temps s'enchaînaient dans exactement
   * la même livrée — même vert, même cadre, même composition — et seul le texte
   * changeait. En quatre secondes chacun, on ne lit pas quatre textes : on voit
   * quatre fois le même écran, et on conclut que le produit fait une seule
   * chose. La couleur n'est pas une décoration ici, c'est ce qui dit « on a
   * changé de moment ».
   *
   * Elle suit le SENS du geste, pas un cycle : l'ambre de l'ardoise, la brique
   * de ce qui allait à la poubelle, le bleu des places libres, le violet de la
   * demande qui vient vers lui.
   */
  teinte: string;
};

/** La couleur de chaque geste — voir `teinte`. */
const TEINTE: Record<string, string> = {
  carte: "#F0B429",
  arrivage: "#F08A29",
  reste: "#D2604A",
  creneau: "#4EA8DE",
  fideles: "#E86AA6",
  realisation: "#7C5CFC",
  venir: "#3DE2A6",
};
const TEINTE_DEMANDE = "#9B7BFF";

/** Le mot d'action de l'habitant, dans les termes du métier. On ne « veut » pas
 *  une table, on la réserve ; on ne « réserve » pas une fournée, on la veut. */
export function motDAction(g: GesteDuJour): string {
  if (g.cherchent === "où manger") return "Je réserve";
  return "Je veux";
}

/**
 * ACTE 3 — CE QUE LES HABITANTS VOIENT EN OUVRANT LE DIRECT.
 *
 * Trois cartes, aucun nom. Elles disent la VILLE, pas lui — et c'est
 * exactement ce qui rend l'acte suivant douloureux : il n'y est pas.
 */
export function cartesDeLaVille(ville: string): CarteDirect[] {
  return [
    {
      photo: PHOTOS.plat,
      cadrage: CADRAGE[PHOTOS.plat],
      nom: "Un restaurant du centre",
      metier: "Restaurant",
      ville,
      reste: "Jusqu'à 14 h",
      icone: "🍽️",
      quoi: "Le menu du jour",
      lignes: ["Servi jusqu'à 14 h"],
      prix: "19 €",
      social: "4 ont réservé",
    },
    {
      photo: PHOTOS.tables,
      cadrage: CADRAGE[PHOTOS.tables],
      nom: "Une table à deux rues",
      metier: "Restaurant",
      ville,
      reste: "Ce midi",
      icone: "🕐",
      quoi: "Il reste 3 tables",
      lignes: ["Pour 12 h 30"],
      social: "1 a réservé",
    },
    {
      photo: PHOTOS.four,
      cadrage: CADRAGE[PHOTOS.four],
      nom: "Une boulangerie",
      metier: "Boulangerie",
      ville,
      reste: "Ce matin",
      icone: "🥐",
      quoi: "Ce qui vient de sortir du four",
      lignes: ["Depuis 7 h"],
      social: "9 l'ont vu passer",
    },
  ];
}

/**
 * ACTE 5 — SA CARTE À LUI, telle qu'elle apparaît une fois la photo prise.
 *
 * C'est le moment de bascule de toute la démonstration : le même contenu qu'il
 * vient de photographier, mais dans l'écran de ses clients.
 */
export function saCarte(
  g: GesteDuJour,
  nom: string,
  metierLabel: string,
  ville: string,
  photo?: string
): CarteDirect {
  // Sa photo d'abord. Sans elle, une illustration qui correspond à ce qu'il
  // vient de photographier — et hors restauration, la vitrine, qui ne montre le
  // métier de personne en particulier.
  const repli = g.cherchent === "où manger"
    ? PHOTOS.plat
    : /boulanger|pâtissier|patissier/i.test(metierLabel)
      ? PHOTOS.four
      : PHOTOS.vitrine;
  return {
    photo: photo || repli,
    // Le cadrage n'est connu que pour NOS illustrations : celles du commerçant
    // gardent le centre, faute de savoir ce qu'elles montrent.
    cadrage: photo ? undefined : CADRAGE[repli],
    nom,
    metier: metierLabel,
    ville,
    reste: g.heure === "11 h" ? "Jusqu'à 14 h" : "Aujourd'hui",
    icone: g.cherchent === "où manger" ? "🍽️" : "✨",
    quoi: g.extrait.titre,
    lignes: g.extrait.lignes,
    prix: g.extrait.prix || undefined,
  };
}

/**
 * CE QUE L'HABITANT LIT SUR LA CARTE.
 *
 * PAS L'INTITULÉ DU BOUTON DE L'ESPACE PRO. « Montrer ma carte du jour » est ce
 * que le COMMERÇANT appuie ; sur la carte reçue par le client, ça se lit comme
 * une consigne adressée à lui. Le fait est le même, le point de vue change —
 * c'est la même règle que partout ailleurs dans cette démonstration : il parle,
 * elle écrit, et ce qui sort est écrit pour celui qui va le lire.
 */
const VU_PAR_HABITANT: Record<string, string> = {
  carte: "Le menu du jour",
  arrivage: "Arrivé ce matin",
  reste: "Il en reste",
  creneau: "Il reste des places",
  fideles: "Pour les habitués",
  realisation: "Vient d'être terminé",
  venir: "Aujourd'hui seulement",
  // Les trois gestes occasionnels manquaient : ils ne sont jamais montrés dans
  // l'acte 7 (qui ne raconte qu'une journée ordinaire), mais ils sont bel et
  // bien proposés dans « Créer une annonce d'essai ». Sans eux, la carte
  // reprenait l'intitulé du bouton du commerçant — « Annoncer un événement » —
  // sur l'écran de son client.
  nouveaute: "Nouveau ici",
  evenement: "À ne pas manquer",
  horaires: "Bon à savoir",
};

/**
 * L'IMAGE DE REPLI, quand le commerçant n'a aucune photo sur sa fiche Google.
 *
 * ELLE SUIT LE GESTE **ET** LE MÉTIER, et il a fallu les deux. La première
 * version ne regardait que le geste : un coiffeur qui annonçait ses créneaux
 * libres recevait la photo d'une SALLE DE RESTAURANT, parce que c'est l'image
 * rangée sous « des places restent libres ». C'est exactement le défaut qu'on
 * traque depuis le début de cette démonstration — montrer au commerçant le
 * commerce d'à côté — et il était réintroduit par la porte de derrière.
 *
 * Les quatre illustrations disponibles parlent toutes de restauration ou de
 * boulangerie, sauf la vitrine. Hors de ces deux métiers, c'est donc la vitrine
 * qui sert, systématiquement : elle n'est jamais juste, mais elle n'est jamais
 * FAUSSE. Une image approximative se pardonne ; une image qui montre un autre
 * métier détruit l'argument.
 */
function photoDeRepli(cle: string, resto: boolean, boulangerie: boolean): string {
  if (resto) {
    if (cle === "carte" || cle === "reste") return PHOTOS.plat;
    if (cle === "creneau") return PHOTOS.tables;
    return PHOTOS.vitrine;
  }
  if (boulangerie && (cle === "arrivage" || cle === "carte" || cle === "reste")) return PHOTOS.four;
  return PHOTOS.vitrine;
}

/** L'emoji d'ambiance de chaque geste, quand il n'y a pas de photo à mettre. */
const ICONE_TEMPS: Record<string, string> = {
  carte: "🍽️",
  arrivage: "🚚",
  reste: "🥘",
  creneau: "🕐",
  fideles: "❤️",
  realisation: "📸",
  venir: "🎉",
  nouveaute: "✨",
  evenement: "🎪",
  horaires: "🕘",
};

/**
 * CE QU'IL PEUT FAIRE À CETTE HEURE-LÀ, en une question.
 *
 * C'est le titre demandé au-dessus de chaque carte de l'acte 7 : quatre écrans
 * qui s'enchaînent sans titre se lisent comme un catalogue de fonctions, et le
 * commerçant décroche exactement là où on voulait qu'il se reconnaisse.
 */
const TITRE_TEMPS: Record<string, string> = {
  carte: "Votre carte du jour",
  arrivage: "Votre arrivage du matin",
  reste: "Il vous en reste ?",
  creneau: "Vous avez des places vides ?",
  fideles: "Un geste pour vos habitués ?",
  realisation: "Vous venez de terminer un beau travail ?",
  venir: "Une raison de passer aujourd'hui ?",
};

/**
 * « CRÉER UNE ANNONCE D'ESSAI » — l'annonce qu'il vient de composer, DANS LE DIRECT.
 *
 * LE DÉFAUT QUE ÇA CORRIGE. Le parcours d'essai se terminait sur un encadré
 * maison : sa photo en fond, son texte par-dessus, deux pastilles « Votre
 * site » et « Catalogue ». Joli, et sans rapport avec ce que ses clients
 * verront réellement — c'est-à-dire la carte du mode swipe, la même que dans
 * la démonstration, la même que dans le fil de la ville. Il cliquait sur une
 * proposition et n'apprenait pas ce qu'il obtiendrait.
 *
 * On lui montre donc l'objet, pas une représentation de l'objet. Et comme il
 * n'existe qu'un seul composant de carte, la promesse ne peut plus diverger du
 * produit : le jour où la carte change, elle change ici aussi.
 *
 * CE QUI EST ÉCRIT DESSUS reste ce que le moteur a produit — `brief()`, mot
 * pour mot. Rien n'est reformulé ici.
 */
export function carteDAnnonce(opts: {
  /** La clé de l'intention choisie (`carte`, `reste`, `creneau`…). */
  cle: string;
  /** L'emoji de l'intention — le secours quand la clé n'a pas d'icône à elle. */
  emoji: string;
  /** L'annonce construite, telle qu'elle sera diffusée. */
  annonce: string;
  nom: string;
  metierLabel: string;
  ville: string;
  /** SA photo. Sans elle, une illustration cohérente avec le geste et le métier. */
  photo?: string;
  /** L'échéance déjà mise en forme (« jusqu'à 14 h »), si le moteur en calcule une. */
  reste?: string;
}): CarteDirect {
  const resto = estRestauration(opts.metierLabel);
  const boulangerie = /boulanger|pâtissier|patissier|viennoiserie/i.test(opts.metierLabel);
  const repli = photoDeRepli(opts.cle, resto, boulangerie);
  return {
    photo: opts.photo || repli,
    cadrage: opts.photo ? undefined : CADRAGE[repli],
    nom: opts.nom,
    metier: opts.metierLabel,
    ville: opts.ville,
    reste: opts.reste || undefined,
    icone: ICONE_TEMPS[opts.cle] || opts.emoji,
    // Jamais `intention.action` : « Montrer ma carte du jour » est ce que LE
    // COMMERÇANT appuie. Sur l'écran de son client, ça se lit comme un ordre.
    quoi: VU_PAR_HABITANT[opts.cle] || "En ce moment",
    lignes: opts.annonce ? [opts.annonce] : undefined,
  };
}

/**
 * LE MOT D'ACTION, déduit du seul métier.
 *
 * `motDAction` a besoin du geste du jour, que le parcours d'annonce d'essai n'a
 * pas : il part d'une intention, pas d'une journée. Le métier suffit — c'est
 * déjà lui qui décide dans l'autre fonction.
 */
export function motDActionMetier(metierLabel: string): string {
  return estRestauration(metierLabel) ? "Je réserve" : "Je veux";
}

/**
 * ACTE 7 — LA JOURNÉE, HEURE PAR HEURE, ILLUSTRÉE DANS LE DIRECT.
 *
 * Chaque temps de `acte-metier` devient un écran : l'heure, ce qu'il peut
 * faire, ce qu'il dit, et la carte que ses clients reçoivent. L'annonce
 * affichée sur la carte est celle que produit le VRAI moteur du produit — pas
 * une reformulation écrite ici.
 */
export function tempsIllustres(
  temps: TempsMetier[],
  g: GesteDuJour,
  nom: string,
  metierLabel: string,
  ville: string,
  photos: string[]
): TempsIllustre[] {
  const action = motDAction(g);
  const resto = g.cherchent === "où manger";
  // Le pain sort d'un four ; les fleurs, non. Faute de savoir distinguer les
  // deux depuis ici, on ne sert la photo du four qu'à ceux dont le métier le
  // dit en toutes lettres.
  const boulangerie = /boulanger|pâtissier|patissier|viennoiserie/i.test(metierLabel);
  // AUCUN TEMPS NE REPREND L'IMAGE DU PRÉCÉDENT.
  //
  // L'intention était déjà écrite ici — « la même image quatre fois de suite
  // donne l'impression que rien ne se passe » — mais elle ne tenait que pour
  // SES photos. Sur le repli, elle tombait : le geste « carte du jour » et le
  // geste « il m'en reste » sont tous deux rangés sous la photo du plat, donc
  // deux des quatre écrans étaient rigoureusement identiques. Mesuré au
  // navigateur sur un restaurant sans photo : 11 h et 14 h, même image.
  //
  // On tient donc un registre. Quand l'image juste est déjà prise, on descend
  // dans les autres illustrations. Une image approximative se pardonne ; deux
  // fois la même fait croire que le produit ne fait qu'une chose.
  //
  // MAIS LE MÉTIER PASSE AVANT LA VARIÉTÉ, et la première version l'avait
  // oublié : en cherchant une image inédite, un restaurant qui annonçait ses
  // tables libres recevait la photo d'un four à viennoiseries. C'est le défaut
  // qu'on traque depuis le début — montrer au commerçant le commerce d'à côté —
  // et il rentrait par la porte de derrière une deuxième fois. La substitution
  // ne sort donc JAMAIS des images de son métier.
  //
  // Quand le vivier est épuisé (quatre temps, trois images pour la
  // restauration), on reprend la PLUS ANCIENNE : une image revient, mais jamais
  // deux fois de suite. Une répétition à trois écrans d'écart ne se remarque
  // pas ; deux écrans identiques à la suite, si.
  const vivier = resto
    ? [PHOTOS.plat, PHOTOS.tables, PHOTOS.vitrine]
    : boulangerie
      ? [PHOTOS.four, PHOTOS.vitrine]
      : [PHOTOS.vitrine];
  // Les images déjà servies, de la plus ancienne à la plus récente.
  const servies: string[] = [];
  const servir = (img: string) => {
    const deja = servies.indexOf(img);
    if (deja >= 0) servies.splice(deja, 1);
    servies.push(img);
    return img;
  };
  /** L'image de ce temps : la sienne, sinon l'illustration la moins vue. */
  const imagePour = (cle: string, sienne?: string): string => {
    if (sienne && !servies.includes(sienne)) return sienne;
    const voulue = photoDeRepli(cle, resto, boulangerie);
    if (!servies.includes(voulue)) return voulue;
    return vivier.find((p) => !servies.includes(p)) ?? servies[0];
  };
  return temps.map((t, i) => {
    // SES photos d'abord ; l'illustration seulement s'il n'en a pas assez.
    const sienne = photos.length ? photos[i % photos.length] : undefined;
    const photo = servir(imagePour(t.genre === "demande" ? "" : t.cle, sienne));
    // Le cadrage n'est connu que pour NOS illustrations : les siennes gardent
    // le centre, faute de savoir ce qu'elles montrent.
    const cadrage = photo === sienne ? undefined : CADRAGE[photo];

    if (t.genre === "demande") {
      return {
        heure: t.heure,
        titre: "Les habitants cherchent quelque chose",
        dit: t.question,
        action,
        teinte: TEINTE_DEMANDE,
        carte: {
          photo,
          cadrage,
          nom,
          metier: metierLabel,
          ville,
          reste: "Demain midi",
          icone: "🔎",
          quoi: t.proposition,
          lignes: [t.question],
        },
      };
    }

    return {
      heure: t.heure,
      titre: TITRE_TEMPS[t.cle] || t.label,
      dit: t.dis,
      action,
      teinte: TEINTE[t.cle] || "#3DE2A6",
      carte: {
        photo,
        cadrage,
        nom,
        metier: metierLabel,
        ville,
        reste: t.heure,
        icone: ICONE_TEMPS[t.cle] || t.emoji,
        quoi: VU_PAR_HABITANT[t.cle] || t.label,
        lignes: [t.annonce],
      },
    };
  });
}
