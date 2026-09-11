// 🎭 LES NEUF LANGAGES D'UNE SEULE ANNONCE
//
// ═══ LA RÈGLE, ET ELLE VIENT DU TERRAIN ═══════════════════════════════════
//
// « Pour bien reconnaître un type de commerçant d'un autre, et ne pas avoir
// l'impression que c'est le même type de commerçant… NE CONÇOIS PAS NEUF TYPES
// D'ANNONCES. CONÇOIS UN SYSTÈME D'ANNONCES QUI SAIT PARLER NEUF LANGAGES. »
//
// CE FICHIER EST EXACTEMENT CETTE FRONTIÈRE. Ce qui ne change jamais — l'ordre
// des blocs, la hauteur du grand bouton, la place de la photo, du prix, du pied
// — reste dans le composant. Ce qui change d'un métier à l'autre est ici, en
// données, et se lit d'un coup d'œil : neuf entrées, les mêmes huit champs.
//
// ═══ POURQUOI LES MOTS SONT DES DONNÉES ═════════════════════════════════════
//
// LE DÉFAUT MESURÉ : un bar proposait « Réserver mon plat ». C'était écrit dans
// une chaîne de ternaires au milieu de l'écran —
//
//     dessus && ["restaurant","bar","boulangerie"].includes(dessus.branche)
//       ? "Réserver mon plat" : "Réserver"
//
// — c'est-à-dire qu'un métier se rajoutait en modifiant une condition à
// quatorze mille lignes du début du fichier. Personne ne relit ça, et la preuve
// est que « bar » y était depuis le début. C'est la MÊME faute que les mots de
// l'essai et que la table de routage des murs : une règle par métier, écrite
// dans le code, se désynchronise du métier qu'elle décrit.
//
// ═══ CE QUI PEUT VARIER, ET CE QUI NE LE PEUT PAS ═══════════════════════════
//
// PEUT VARIER : la couleur d'accent, la graisse et la chasse du titre,
// l'étiquette d'urgence, le verbe du geste secondaire, le nom de l'accès
// secondaire, et le vocabulaire de ce qu'on compte.
//
// NE PEUT PAS : l'ordre des blocs, la taille du grand bouton, la position du
// prix, la barre du bas. Un utilisateur doit reconnaître une annonce ClikMe
// avant de reconnaître le métier — sinon on n'a pas neuf personnalités, on a
// neuf applications.
//
// ═══ L'ACCENT N'EST PAS UNE DÉCORATION ══════════════════════════════════════
//
// La menthe est la couleur du commerce depuis le début du produit (réserver, y
// aller), l'ambre celle de l'urgence, le violet celle du fantôme. CES TROIS-LÀ
// NE BOUGENT PAS : elles disent ce que fait un bouton, pas chez qui l'on est.
// L'accent d'un métier se pose ailleurs — sur l'étiquette d'urgence, sur le
// filet du titre, sur le nom du commerce. C'est ce qui fait qu'une friperie et
// un bar ne se ressemblent pas au premier coup d'œil, sans qu'aucun des deux
// cesse d'être ClikMe.

export type Personnalite = {
  /** Le nom du langage. Sert aux gardes et aux classes CSS. */
  cle: string;
  /**
   * LA COULEUR D'ACCENT DU MÉTIER.
   *
   * Elle ne touche JAMAIS un bouton d'action : la menthe veut dire « ceci vous
   * engage » dans tout le produit, et repeindre le grand bouton en rose chez
   * une onglerie ferait perdre ce sens partout ailleurs.
   */
  accent: string;
  /** L'encre lisible SUR l'accent — calculée à la main, pas devinée. */
  encre: string;
  /**
   * L'ACCENT DÉLAYÉ, POUR CE QUI L'ENTOURE — halo, piste de cadran, filet.
   *
   * IL EST ÉCRIT, PAS CALCULÉ. `color-mix()` le produirait en une ligne, mais
   * il ne s'affiche pas partout et une couleur qui disparaît sur un téléphone
   * se remarque par son ABSENCE, ce qui ne se débogue pas. Quatre caractères de
   * plus par métier valent mieux qu'un halo qui manque sur un iPhone.
   */
  halo: string;
  /**
   * LA PERSONNALITÉ DU TITRE.
   *
   * · `gras` — condensé, capitales, très serré. Le plat, l'offre, l'urgence.
   * · `editorial` — plus grande chasse, moins de graisse, un peu d'air. La
   *   mode, l'artisanat, ce qui se regarde avant de se consommer.
   * · `clair` — casse normale, graisse moyenne. L'information : un poste, un
   *   événement municipal. Crier une offre d'emploi la rend suspecte.
   *
   * TROIS, PAS NEUF. Une police par métier ferait neuf applications ; trois
   * familles de ton suffisent à ce qu'un bar ne ressemble pas à une mairie.
   */
  titre: "gras" | "editorial" | "clair";
  /**
   * L'ÉTIQUETTE D'URGENCE PAR DÉFAUT — le bloc 2 du brief.
   *
   * Elle ne s'affiche QUE si l'annonce n'a rien de plus précis à dire : un
   * Flash, une fraîcheur (« il y a 12 min »), une remise. Voir le composant :
   * ce champ est le dernier recours, pas le premier choix, sinon toutes les
   * cartes d'un métier portent le même bandeau et il cesse d'être lu.
   */
  tag: string;
  /**
   * LE GESTE SECONDAIRE — « Réserver mon plat », « Prendre rendez-vous ».
   *
   * C'est le champ qui a motivé ce fichier. On ne réserve pas un plat dans un
   * bar, on ne prend pas rendez-vous chez une fleuriste, et « Réserver » tout
   * court ne dit pas ce qui va se passer.
   */
  reserver: string;
  /** L'accès secondaire : « Voir la carte », « Voir la boutique ». */
  ailleurs: string;
  /**
   * CE QU'ON COMPTE, AU SINGULIER ET AU PLURIEL.
   *
   * « Il en reste 3 » est vrai partout et ne veut rien dire nulle part. Trois
   * quoi — trois tables, trois bouquets, trois créneaux ? Le mot compte plus que
   * le nombre : il dit ce qu'on vient chercher.
   */
  unite: [string, string];
};

/**
 * LES NEUF, DANS L'ORDRE DU BRIEF.
 *
 * Un métier absent de cette table n'est pas une erreur : il prend `DEFAUT`, qui
 * est le langage le plus neutre du lot. C'est l'inverse du repli qui donnait le
 * mur des bougies à un hypnothérapeute — ici, le repli ne prétend rien savoir.
 */
const LANGAGES: Personnalite[] = [
  /**
   * 🍽️ LE RESTAURANT — « la nourriture doit donner faim avant que le texte soit
   * lu ». Le titre est donc le plus gras du lot, et l'accent est chaud.
   */
  {
    cle: "restaurant",
    accent: "#FF9E5A",
    encre: "#2A1205",
    halo: "rgba(255,158,90,.42)",
    titre: "gras",
    tag: "⚡ En ce moment",
    reserver: "Réserver mon plat",
    ailleurs: "Voir la carte",
    unite: ["part", "parts"],
  },
  /**
   * 🍸 LE BAR — « l'annonce ne doit pas seulement vendre un produit, elle doit
   * vendre l'envie d'être là. » D'où l'accent le plus saturé de la table, et
   * une étiquette qui parle d'un moment et non d'un article.
   */
  {
    cle: "bar",
    accent: "#FF4D8D",
    encre: "#2A0715",
    halo: "rgba(255,77,141,.42)",
    titre: "gras",
    tag: "🔥 Ce soir",
    reserver: "Réserver une table",
    ailleurs: "Voir l’ardoise",
    unite: ["place", "places"],
  },
  /**
   * 👗 LA MODE — « le vêtement doit rester le héros ; ne pas transformer
   * l'annonce en catalogue. » Titre éditorial, accent sobre.
   */
  {
    cle: "mode",
    accent: "#E8C9A0",
    encre: "#241A0D",
    halo: "rgba(232,201,160,.38)",
    titre: "editorial",
    tag: "🆕 Vient d’arriver",
    reserver: "Mettre de côté",
    ailleurs: "Voir la boutique",
    unite: ["pièce", "pièces"],
  },
  /**
   * 💇 LE COIFFEUR — « le résultat visuel doit être immédiatement
   * compréhensible ; le prix et le créneau très faciles à trouver. »
   */
  {
    cle: "coiffeur",
    accent: "#C9A7FF",
    encre: "#1B1030",
    halo: "rgba(201,167,255,.42)",
    titre: "editorial",
    tag: "🆕 Nouveau look",
    reserver: "Prendre rendez-vous",
    ailleurs: "Voir les prestations",
    unite: ["créneau", "créneaux"],
  },
  /**
   * 💅 L'ONGLERIE — « l'annonce doit presque donner l'impression : et si je
   * faisais ça aujourd'hui ? »
   */
  {
    cle: "ongles",
    accent: "#FF9ECF",
    encre: "#2D0C1E",
    halo: "rgba(255,158,207,.42)",
    titre: "editorial",
    tag: "🆕 Nouveau",
    reserver: "Prendre rendez-vous",
    ailleurs: "Voir les poses",
    unite: ["créneau", "créneaux"],
  },
  /**
   * 💐 LA FLEURISTE — « la photo des fleurs doit faire 80 % du travail
   * émotionnel. » Le titre laisse donc de l'air, et l'accent reste clair.
   */
  {
    cle: "fleuriste",
    accent: "#7FE3B0",
    encre: "#062218",
    halo: "rgba(127,227,176,.42)",
    titre: "editorial",
    tag: "⚡ En ce moment",
    reserver: "M’en mettre un de côté",
    ailleurs: "Voir la boutique",
    unite: ["bouquet", "bouquets"],
  },
  /**
   * 🕯️ LE CRÉATEUR — « c'est la catégorie où l'on peut donner le plus d'espace
   * à l'image et au vide. Ne surtout pas imposer un design commercial agressif
   * à un artiste. » Pas d'étiquette criarde, pas de capitales.
   */
  {
    cle: "createur",
    accent: "#D8C7A6",
    encre: "#211A0E",
    halo: "rgba(216,199,166,.38)",
    titre: "editorial",
    tag: "🆕 Nouvelle création",
    reserver: "Réserver la pièce",
    ailleurs: "Découvrir l’atelier",
    unite: ["pièce", "pièces"],
  },
  /**
   * 🪡 LE TATOUEUR — demandé depuis le terrain : « c'est un commerce qui est
   * souvent demandé ».
   *
   * CE N'EST PAS UN CRÉATEUR PARMI D'AUTRES, ET L'ESSAI EXPLIQUE POURQUOI. Une
   * céramiste vend un objet qu'on pose chez soi ; un tatoueur pose un dessin SUR
   * VOUS, et pour toujours. C'est le métier où « voir avant » vaut le plus cher :
   * on ne revient pas sur un tatouage, et l'hésitation est la règle, pas
   * l'exception. La même mécanique que les ongles et la coupe, sur l'avant-bras.
   *
   * L'ACCENT EST ENCRE ET CUIVRE, PAS FLUO. Le métier a son esthétique — noir,
   * trait net, peu de couleurs — et lui coller un rose de salon de beauté serait
   * exactement le genre de faute que ce fichier existe pour empêcher.
   */
  {
    cle: "tatoueur",
    accent: "#D9A066",
    encre: "#241305",
    halo: "rgba(217,160,102,.4)",
    titre: "editorial",
    tag: "🆕 Nouveau flash",
    reserver: "Demander un rendez-vous",
    ailleurs: "Voir les flashs",
    unite: ["créneau", "créneaux"],
  },
  /**
   * 🎪 CE QUI SE PASSE EN VILLE — « date, heure et lieu sont prioritaires. Ne
   * pas présenter un événement municipal comme un produit commercial. »
   */
  {
    cle: "evenement",
    accent: "#8BD6FF",
    encre: "#05202E",
    halo: "rgba(139,214,255,.42)",
    titre: "clair",
    tag: "📅 Aujourd’hui",
    reserver: "Y aller",
    ailleurs: "Voir l’événement",
    unite: ["place", "places"],
  },
  /**
   * 🙋 ILS RECRUTENT — « le design doit être moins promotion et plus
   * opportunité claire. » Aucun accent chaud, aucune capitale : une offre
   * d'emploi criée se lit comme une arnaque.
   */
  {
    cle: "recrute",
    accent: "#9FB4CC",
    encre: "#0B141E",
    halo: "rgba(159,180,204,.36)",
    titre: "clair",
    tag: "🙋 Ils recrutent",
    reserver: "Je postule",
    ailleurs: "Voir l’offre",
    unite: ["poste", "postes"],
  },
];

/** Le langage neutre. Il ne prétend rien savoir du métier. */
const DEFAUT: Personnalite = {
  cle: "defaut",
  accent: "#B9C6D6",
  encre: "#0B141E",
  halo: "rgba(185,198,214,.34)",
  titre: "clair",
  tag: "⚡ En ce moment",
  reserver: "Réserver",
  ailleurs: "Voir",
  unite: ["place", "places"],
};

/**
 * QUEL LANGAGE POUR QUELLE ANNONCE.
 *
 * ON REGARDE LA BRANCHE, PUIS LE MÉTIER. « artisan » est un sac — il contient
 * une cirière, une créatrice de bijoux et un hypnothérapeute — exactement comme
 * pour les murs (voir `modeleDeLaBranche`). Un sac se vide sur le métier, et ce
 * qui n'en sort pas prend le langage neutre plutôt que celui du voisin.
 *
 * L'ÉTAT DE L'ANNONCE PASSE AVANT SON MÉTIER. Un restaurant qui recrute n'est
 * pas un restaurant ce jour-là : c'est une offre d'emploi, et elle doit se lire
 * comme telle. Même chose pour un événement.
 */
export function personnaliteDe(a: {
  branche?: string | null;
  metier?: string | null;
  /** Vrai quand la carte affichée est une offre d'emploi. */
  recrute?: boolean;
  /** Vrai quand la carte affichée est un événement. */
  evenement?: boolean;
}): Personnalite {
  const par = (cle: string) => LANGAGES.find((l) => l.cle === cle) ?? DEFAUT;
  if (a.evenement) return par("evenement");
  if (a.recrute) return par("recrute");
  const b = a.branche ?? "";
  if (b === "restaurant" || b === "boulangerie") return par("restaurant");
  if (b === "bar") return par("bar");
  if (b === "mode") return par("mode");
  if (b === "coiffeur") return par("coiffeur");
  if (b === "ongles") return par("ongles");
  if (b === "fleuriste") return par("fleuriste");
  if (b === "evenement") return par("evenement");
  if (b === "artisan") {
    const m = (a.metier ?? "").toLowerCase();
    // UN HYPNOTHÉRAPEUTE N'EST PAS UN CRÉATEUR. Il ne vend pas une pièce, il
    // vend une séance — et « Nouvelle création · Réserver la pièce » sur une
    // consultation serait la même absurdité que de lui proposer d'essayer une
    // bougie sur sa table.
    if (/tatou|tattoo|pierc/.test(m)) return par("tatoueur");
    if (/cir|bougie|bijou|bracelet|collier|joaill|ceram|céram|potier|atelier|creat|créat/.test(m)) {
      return par("createur");
    }
    return DEFAUT;
  }
  return DEFAUT;
}

/** Toutes les personnalités, pour les gardes et la page de jugement. */
export const PERSONNALITES = LANGAGES;
