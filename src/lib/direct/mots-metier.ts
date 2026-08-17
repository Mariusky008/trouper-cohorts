// LES MOTS DU MÉTIER.
//
// Le défaut que ce module corrige : un coiffeur se voyait demander « Combien
// vous en reste-t-il ? » avec l'exemple « 2 tables », et un champ « le lien
// vers votre carte du jour » dont le bouton s'appelait « Voir l'ardoise ». Ces
// mots viennent de la restauration ; chez un coiffeur, ils ne veulent rien
// dire, et un formulaire qui ne parle pas votre langue ne se remplit pas.
//
// UN SEUL ENDROIT POUR CES MOTS. Ils apparaissent dans l'espace du commerçant
// (la question) ET sur la carte de l'habitant (le bouton). Écrits deux fois,
// ils finiraient par se contredire — le commerçant remplirait « la carte du
// jour » et l'habitant lirait « voir les prestations ».
//
// LE MOT « CATALOGUE » N'APPARAÎT NULLE PART, quel que soit le métier : Le
// Direct n'est pas un catalogue, et le vocabulaire est ce qui tient cette
// promesse au quotidien.

export type MotsMetier = {
  /** La question posée au commerçant pour « ce qu'il reste ». */
  resteLabel: string;
  /** Ce qu'on écrit dans le champ vide. */
  resteExemple: string;
  /** Les trois unités de son métier, en clair. */
  resteAide: string;
  /** La question posée au commerçant pour le lien. */
  lienLabel: string;
  lienAide: string;
  /** Le bouton que l'habitant verra sur la carte. */
  lienBouton: string;
};

/** Le repli : neutre, jamais faux. Mieux vaut « en savoir plus » chez un
 *  garagiste que « voir l'ardoise ». */
const NEUTRE: MotsMetier = {
  resteLabel: "Combien vous en reste-t-il ?",
  resteExemple: "2 places",
  resteAide: "Écrivez l'unité de votre métier — 2 places, 3 créneaux, 1 lot.",
  lienLabel: "Un lien vers vos prestations",
  lienAide: "Un bouton « En savoir plus » apparaît sur votre carte.",
  lienBouton: "En savoir plus",
};

type Regle = { motifs: RegExp; mots: MotsMetier };

const REGLES: Regle[] = [
  {
    motifs: /restaur|brasserie|bistrot|pizz|creperie|traiteur|bar\b|cafe|salon de the/,
    mots: {
      resteLabel: "Combien vous en reste-t-il ?",
      resteExemple: "2 tables",
      resteAide: "Écrivez l'unité de votre métier — 2 tables, 3 couverts, 1 menu.",
      lienLabel: "Le lien vers votre carte du jour",
      lienAide: "Un bouton « Voir l'ardoise » apparaît sur votre carte.",
      lienBouton: "Voir l'ardoise",
    },
  },
  {
    motifs: /coiffeur|coiffure|barbier|estheti|onglerie|institut|spa\b|massage|tatou|piercing|manucure|prothesiste/,
    mots: {
      resteLabel: "Combien de créneaux vous reste-t-il ?",
      resteExemple: "2 créneaux",
      resteAide: "Écrivez l'unité de votre métier — 2 créneaux, 1 place, 3 rendez-vous.",
      lienLabel: "Le lien vers vos prestations et vos tarifs",
      lienAide: "Un bouton « Voir les prestations » apparaît sur votre carte.",
      lienBouton: "Voir les prestations",
    },
  },
  {
    motifs: /boulanger|patissier|viennoiser|chocolat|confiseur|glacier|fromag|boucher|charcut|poissonn|primeur|epicerie|caviste/,
    mots: {
      resteLabel: "Combien vous en reste-t-il ?",
      resteExemple: "3 parts",
      resteAide: "Écrivez l'unité de votre métier — 3 parts, 6 pièces, 2 plateaux.",
      lienLabel: "Le lien vers vos produits",
      lienAide: "Un bouton « Voir les produits » apparaît sur votre carte.",
      lienBouton: "Voir les produits",
    },
  },
  {
    motifs: /fleuri/,
    mots: {
      resteLabel: "Combien vous en reste-t-il ?",
      resteExemple: "3 bouquets",
      resteAide: "Écrivez l'unité de votre métier — 3 bouquets, 1 composition, 12 tiges.",
      lienLabel: "Le lien vers vos compositions",
      lienAide: "Un bouton « Voir les compositions » apparaît sur votre carte.",
      lienBouton: "Voir les compositions",
    },
  },
  {
    motifs: /sport|fitness|yoga|danse|cours|ecole|atelier|club/,
    mots: {
      resteLabel: "Combien de places vous reste-t-il ?",
      resteExemple: "4 places",
      resteAide: "Écrivez l'unité de votre métier — 4 places, 2 créneaux, 1 session.",
      lienLabel: "Le lien vers votre programme",
      lienAide: "Un bouton « Voir le programme » apparaît sur votre carte.",
      lienBouton: "Voir le programme",
    },
  },
  {
    motifs: /garage|mecani|carross|plomb|electric|menuis|serrur|artisan|peintre|macon/,
    mots: {
      resteLabel: "Combien de créneaux vous reste-t-il ?",
      resteExemple: "1 créneau",
      resteAide: "Écrivez l'unité de votre métier — 1 créneau, 2 rendez-vous.",
      lienLabel: "Le lien vers vos tarifs",
      lienAide: "Un bouton « Voir les tarifs » apparaît sur votre carte.",
      lienBouton: "Voir les tarifs",
    },
  },
];

const sansAccent = (s: string) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Les mots à employer pour ce métier.
 *
 * Fonctionne aussi bien sur le libellé catalogué (« Restaurant ») que sur la
 * saisie libre du commerçant (« restauration rapide ») : les deux arrivent ici
 * selon l'écran, et exiger l'un des deux ferait retomber la moitié des
 * commerces sur le repli neutre.
 */
export function motsMetier(activite: string): MotsMetier {
  const a = sansAccent(activite);
  if (!a) return NEUTRE;
  for (const r of REGLES) if (r.motifs.test(a)) return r.mots;
  return NEUTRE;
}

/** Le seul mot dont l'habitant a besoin : le libellé du bouton. */
export function boutonLien(activite: string): string {
  return motsMetier(activite).lienBouton;
}

/**
 * CE MÉTIER SERT-IL À MANGER, À HEURE FIXE ?
 *
 * Deux choses en dépendent, et elles ont la même racine : un service se joue
 * dans une fenêtre de la journée, décidée d'avance, pas dans un délai à partir
 * du moment où l'on appuie sur « publier ».
 *
 *   • L'EXPRESS. « Moins cher à qui vient dans l'heure » ne veut rien dire pour
 *     un restaurateur qui prépare son service à 9 h et veut remplir le creux de
 *     11 h 30 à 11 h 45. Il lui faut deux heures, pas une durée.
 *   • LA CARTE DU JOUR. Elle n'existe que là où le menu change chaque jour.
 *     Proposer « votre carte du jour » à un garagiste serait absurde.
 *
 * Le motif reprend celui de la règle « restauration » ci-dessus. Il vit à part
 * plutôt que d'être déduit de `motsMetier` : deux commerces peuvent partager le
 * même vocabulaire de « table » sans servir à heure fixe, et l'inverse arrivera.
 */
const RESTAURATION = /restaur|brasserie|bistrot|pizz|creperie|traiteur|bar\b|cafe|salon de the|cantine|burger|sushi|snack|friterie|food/;

export function estRestauration(activite: string): boolean {
  const a = sansAccent(activite);
  return Boolean(a) && RESTAURATION.test(a);
}

/** Les mots de l'express : une durée chez la plupart, une plage à table. */
export type MotsExpress = {
  /** La phrase sous le titre « L'express », dans l'écran du commerçant. */
  sous: string;
  /** VRAI quand on demande deux heures au lieu d'une durée. */
  plage: boolean;
  /** L'explication sous les champs. */
  note: string;
};

export function expressMots(activite: string): MotsExpress {
  if (estRestauration(activite)) {
    return {
      sous: "Moins cher entre deux heures que vous choisissez — remplit un creux de service",
      plage: true,
      note:
        "Vous choisissez le moment : par exemple entre 11 h 30 et 11 h 45, pour remplir le début " +
        "de service. Le prix réduit ne vaut QUE pendant cette plage, et l'express disparaît tout " +
        "seul à la fin ; vos autres façons restent.",
    };
  }
  return {
    sous: "Moins cher à qui vient dans l'heure — remplit un creux",
    plage: false,
    note:
      "Le prix doit être inférieur à votre prix habituel — c'est ce qui fait venir vite. " +
      "Passé ce délai, l'express disparaît tout seul ; vos autres façons restent.",
  };
}
