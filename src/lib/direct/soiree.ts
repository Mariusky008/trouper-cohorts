// 👻 LA SOIRÉE — j'essaie, je me positionne, je participe, j'y vais.
//
// ═══ CE QUE CE FICHIER PORTE ═══════════════════════════════════════════════
//
// « Le Fantôme sert à essayer l'expérience avant d'y aller, puis éventuellement
// à se projeter dans cette soirée, et enfin à participer à la conversation
// collective autour de l'événement. »
//
// C'EST LA MÊME IDÉE QUE L'AVANT-GOÛT, DÉPLACÉE DANS LE TEMPS. Chez un
// restaurant, ce qu'on essaie est un PLAT et le geste final est de réserver.
// Chez un bar ou un événement, ce qu'on essaie est un MOMENT — il n'a pas encore
// eu lieu, il aura lieu ce soir — et le geste final n'est pas de réserver, c'est
// d'en être. D'où un troisième temps que le plat n'a pas : la conversation.
//
// ═══ LA RÈGLE PRODUIT, ET ELLE PASSE AVANT LE DESSIN ═══════════════════════
//
// « L'objectif n'est PAS de créer une mécanique de dating. »
//
// ELLE SE TIENT À TROIS ENDROITS DE CE FICHIER, ET IL FAUT LES TROIS :
//
//   · « Faire une rencontre » EST LA DERNIÈRE DES SIX INTENTIONS, et elle est
//     écrite comme les cinq autres. Une liste où elle serait première, seule
//     colorée ou seule cochée par défaut dirait l'inverse de ce paragraphe.
//   · L'ÉCRAN DES FANTÔMES NE SUIT PAS L'ESSAYAGE. « Ça remet immédiatement
//     ClikMe dans le dating. » C'est une correction qu'il a apportée contre ses
//     propres maquettes, et c'est la plus importante des sept : le produit
//     principal devient la soirée vivante, pas les personnes à rencontrer.
//   · LE LIVE DOIT SERVIR À QUELQU'UN QUI NE VEUT PARLER À PERSONNE. D'où les
//     `infos` et les `sondages` : l'heure du DJ, ce qu'il reste, ce qu'on joue
//     après. Quelqu'un qui vient avec son conjoint doit y trouver son compte,
//     sinon le Fantôme devient une application de rencontre avec un bar autour.
//
// ═══ CE QUE CE FICHIER NE FAIT PAS ════════════════════════════════════════
//
// IL N'ÉCRIT PAS LES SOIRÉES, IL LES PORTE. Dans le produit, le bar dit « ce
// soir, DJ set house » et dépose dix secondes de son ; l'assistante en fait un
// `EssaiSoiree`, et le Live se remplit tout seul au fil de la soirée. Ici, six
// soirées écrites à la main disent à quoi ressemble le résultat — et prouvent
// que la forme tient pour six choses qui n'ont rien en commun : un DJ set, une
// terrasse, un concert de jazz, un marché de producteurs, une nocturne de musée
// et un vide-grenier.

/**
 * ═══ CE QU'ON ESSAIE, ET CE N'EST PAS TOUJOURS DU SON ═════════════════════
 *
 * « Il ne faut donc pas coder "musique" en dur. »
 *
 * IL A RAISON, ET LE PIÈGE ÉTAIT PRÊT À SE REFERMER. La maquette montre une
 * forme d'onde et un bouton lecture : en la reproduisant telle quelle, on
 * obtenait un écran qui ne sait faire qu'une chose, et le bar à cocktails, le
 * musée et le vide-grenier seraient tombés dans le mur de présence — exactement
 * ce qui vient d'arriver au boucher.
 *
 * CINQ FORMES SUFFISENT À COUVRIR CE QU'UN LIEU PEUT FAIRE ESSAYER :
 *
 *   · `son`      — dix secondes du morceau, un extrait de l'artiste.
 *   · `film`     — un très court extrait : comedy club, spectacle.
 *   · `image`    — le cocktail de ce soir, l'affiche, la pièce exposée.
 *   · `geste`    — on touche et quelque chose arrive. La mécanique de
 *                  l'Avant-goût, réduite à un seul temps.
 *   · `question` — on répond, on apprend. Un musée, un vide-grenier : ce qu'on
 *                  essaie est une CURIOSITÉ, et c'est aussi valable qu'un son.
 *   · `recette`  — le barman monte le cocktail DEVANT VOUS, geste par geste.
 *
 * LA RECETTE EST ARRIVÉE APRÈS COUP, ET C'EST LUI QUI L'A DEMANDÉE. « Il n'y a
 * pas assez de plus-value quand on clique sur le fantôme pour avoir un effet
 * wow, j'ai trop envie d'y aller… on met l'accent sur un cocktail du soir que le
 * barman nous présente pas à pas pour nous donner envie. »
 *
 * IL A RAISON, ET LA DIFFÉRENCE EST DE NATURE. Écouter dix secondes, c'est
 * RECEVOIR quelque chose ; voir un verre se monter couche après couche, c'est
 * assister à un geste. Le premier informe, le second donne envie — et c'est la
 * seule chose que cet écran a à faire.
 */
export type FormeEssai = "son" | "film" | "image" | "geste" | "question" | "recette";

/**
 * UNE RÉACTION, À LA FIN DE L'ESSAI.
 *
 * TROIS, ET LA PREMIÈRE EST NÉGATIVE. « 😐 Pas trop · 🙂 Sympa · 🔥 Ça va être
 * bien ! » Trois réponses dont trois positives ne mesureraient rien, et le
 * commerçant a besoin que ce chiffre veuille dire quelque chose : c'est lui qui
 * lui dira si son affiche donne envie.
 */
export type ReactionEssai = {
  cle: string;
  emoji: string;
  mot: string;
  /**
   * LE DESSIN DE SA MAQUETTE, ET IL N'EST PAS UN ÉMOJI.
   *
   * Ses trois réactions sont deux VISAGES TRACÉS au trait dans un cercle, et une
   * flamme. Un émoji arrive avec ses couleurs et change de dessin d'un téléphone
   * à l'autre ; le tracé prend la couleur du texte et reste le même partout.
   * L'émoji reste pour la flamme, qui est la seule des trois à devoir être
   * chaude.
   */
  icone?: "neutre" | "sourire" | "feu";
};

/**
 * L'ESSAI D'UNE SOIRÉE — `trial_experience`.
 *
 * TOUT Y EST FACULTATIF SAUF LE NOM, LA FORME ET LA QUESTION. Un lieu qui n'a
 * pas encore déposé son extrait garde son écran : le chapeau, le titre et la
 * question suffisent à faire un essai honnête, et le média l'embellit le jour
 * où il arrive. C'est la règle de tout ce dossier — on montre ce qu'il y a, on
 * ne réserve pas un emplacement vide.
 */
export type EssaiSoiree = {
  id: string;
  forme: FormeEssai;
  /** Le petit titre coloré : « LE SON DE CE SOIR », « LE COCKTAIL DE CE SOIR ». */
  chapeau: string;
  /** La pastille de droite, en deux lignes : « DJ SET / House & Good Vibes ». */
  etiquette?: { haut: string; bas: string };
  /** Ce qu'on propose, en une phrase de deux lignes. */
  titre: string;
  /** Le fichier, quand le lieu l'a déposé. Absent : voir le type. */
  media?: string;
  /** Pour `son` et `film` : la durée annoncée, en secondes. */
  duree?: number;
  /** Pour `question` : ce qu'on apprend une fois qu'on a répondu. */
  reponses?: { cle: string; mot: string }[];
  verite?: string;
  /** Pour `geste` : ce que dit le bouton, et ce qui se révèle après. */
  geste?: string;
  apres?: string;
  /**
   * POUR `recette` : le verre qui se monte, couche après couche.
   *
   * CHAQUE ÉTAPE EST UN GESTE ET UNE COULEUR. Le geste est ce que le barman dit
   * en le faisant — « je givre le verre », « deux traits d'amer » — la couleur
   * est ce qui apparaît dans le verre. On ne montre pas une liste
   * d'ingrédients : on montre quelqu'un en train de faire quelque chose.
   *
   * `part` EST LA HAUTEUR DE LA COUCHE, en parts du verre. Elles n'ont pas
   * besoin de faire un compte rond : un verre qu'on remplit aux trois quarts
   * ressemble plus à un verre qu'un verre rempli à ras bord.
   */
  etapes?: { emoji: string; mot: string; dit: string; teinte: string; part: number }[];
  /** Ce qui se pose sur le bord à la fin : la rondelle, la feuille, la paille. */
  garniture?: string;
  /** « Ça vous met dans l'ambiance ? » */
  question: string;
  reactions: ReactionEssai[];
};

/**
 * ═══ CE QU'ON CHERCHE CE SOIR ═════════════════════════════════════════════
 *
 * ELLES SONT COMMUNES À TOUTES LES SOIRÉES, et ce n'est pas une économie : une
 * intention est ce que la PERSONNE cherche, pas ce que le lieu propose. Les
 * laisser définir par chaque bar aurait donné des listes différentes d'un lieu à
 * l'autre, donc rien à compter, donc rien à rendre au commerçant.
 *
 * L'ORDRE EST LE SIEN, ET IL COMPTE. « Faire une rencontre n'est qu'une
 * intention parmi plusieurs, jamais l'élément central de l'expérience » : elle
 * est donc la sixième, et elle est écrite exactement comme les cinq autres.
 */
export type Intention = { cle: string; emoji: string; mot: string; detail: string };

export const INTENTIONS: Intention[] = [
  { cle: "fete", emoji: "🎉", mot: "Faire la fête", detail: "Danser, sortir, profiter" },
  { cle: "amis", emoji: "👥", mot: "Être entre amis", detail: "On vient en bande" },
  { cle: "musique", emoji: "🎵", mot: "Profiter de la musique", detail: "Venu pour le son" },
  { cle: "verre", emoji: "🍸", mot: "Boire un verre tranquille", detail: "Sans bruit, sans presse" },
  { cle: "decouvrir", emoji: "✨", mot: "Découvrir quelque chose", detail: "Voir ce que ça donne" },
  { cle: "rencontre", emoji: "❤️", mot: "Faire une rencontre", detail: "Ouvert à ce qui vient" },
];

export function intentionDe(cle: string | undefined): Intention | undefined {
  return INTENTIONS.find((i) => i.cle === cle);
}

/**
 * UN FANTÔME PRÉSENT, ET IL EN DIT LE MOINS POSSIBLE.
 *
 * « Chaque Fantôme visible affiche SEULEMENT son identifiant, son avatar, sa
 * présence et une phrase. Pas de profil dating détaillé : pas de bio longue,
 * d'âge, de recherche homme/femme, de swipe, de matching. »
 *
 * IL N'Y A DONC NI ÂGE, NI GENRE, NI PHOTO DANS CE TYPE, et ce n'est pas un
 * oubli à combler plus tard : c'est la définition du Fantôme. Ce qu'on voit d'un
 * inconnu, c'est une couleur, un numéro et ce qu'il cherche ce soir — et c'est
 * précisément ce qui permet de lui parler sans que ce soit gênant.
 */
export type FantomePresent = {
  id: string;
  /** « Violet 34 » : la couleur et le nombre du Fantôme personnel. */
  nom: string;
  teinte: string;
  /** Le petit accessoire de son fantôme, quand il en a un. */
  accessoire?: string;
  intention: string;
  mot: string;
  /** Vrai : il est dans le Live en ce moment. */
  present: boolean;
};

/**
 * UN MESSAGE DU LIVE, ET IL Y EN A QUATRE SORTES.
 *
 * « Comme sur la maquette, prévoir quatre filtres : Tout · Infos · Questions ·
 * Sondages. » Les filtres ne sont pas un rangement cosmétique : ils sont ce qui
 * fait la différence entre un salon utile et un chat qui défile. Quelqu'un qui
 * veut seulement l'heure du DJ touche « Infos » et a fini.
 */
export type SorteMessage = "mot" | "info" | "question" | "sondage" | "fantome";

export type MessageLive = {
  id: string;
  sorte: SorteMessage;
  qui: string;
  /** La photo de l'auteur, quand c'en est un. Le lieu porte son enseigne. */
  photo?: string;
  /** Le lieu et l'organisateur sont certifiés : c'est ce qui rend une info sûre. */
  maison?: boolean;
  heure: string;
  mot: string;
  coeurs?: number;
  /** Pour un sondage : ce qu'on peut voter, et ce que les autres ont voté. */
  options?: { cle: string; mot: string; voix: number }[];
  /**
   * CE MESSAGE RÉPOND-IL À L'ESSAI QU'ON VIENT DE FAIRE ?
   *
   * « Le Fantôme ClikMe peut donc reconnecter l'essayage initial avec ce qui se
   * passe réellement pendant la soirée. C'est important. »
   *
   * ET C'EST LA SEULE CHOSE DE TOUT CE FICHIER QU'AUCUNE AUTRE APPLICATION NE
   * PEUT FAIRE : « le son que vous avez essayé tout à l'heure sera joué vers
   * 23 h » n'a de sens que pour quelqu'un qui l'a essayé. Le message ne se
   * dessine donc que là — sinon il devient une notification de plus.
   */
  siEssaye?: string;
};

/**
 * ═══ CE QUI ARRIVE, ET À QUELLE HEURE ═════════════════════════════════════
 *
 * « L'intérêt du système est également que la page ne soit pas figée. Avant la
 * soirée : 18 Fantômes ont laissé une intention. À 21 h : 43 personnes
 * participent au Live. À 22 h 30 : le DJ commence. À 23 h : le morceau que vous
 * avez essayé est sur le point d'être joué. À minuit : comment est l'ambiance
 * maintenant ? L'utilisateur a donc une raison de revenir plusieurs fois dans
 * ClikMe pendant la même soirée. »
 *
 * C'EST LA SEULE CHOSE DE SON CAHIER DES CHARGES QUI NE SE VOIT PAS SUR UN
 * ÉCRAN ARRÊTÉ, et c'est pour ça qu'elle est facile à oublier. Un Live sans
 * horloge est une conversation ; un Live avec un programme est une soirée qui
 * avance, et c'est ce qui donne une raison de rouvrir l'application à 22 h.
 *
 * LE PROGRAMME EST ÉCRIT PAR LE LIEU, PAS DEVINÉ. Le bar sait à quelle heure
 * son DJ commence ; personne d'autre ne le sait. Ce que l'écran ajoute, c'est
 * de dire lequel de ces temps est PASSÉ, lequel est MAINTENANT et lequel est le
 * prochain — et ça, ça se calcule.
 *
 * `siEssaye` EXISTE ICI AUSSI, et c'est le même mot que dans le fil : « le
 * morceau que vous avez essayé est sur le point d'être joué » ne se dit qu'à
 * quelqu'un qui l'a essayé.
 */
export type TempsFort = {
  /** L'heure en décimal : 22.5 pour 22 h 30. */
  quand: number;
  /** « 22 h 30 » — écrit, parce que « 22.5 » ne se lit pas. */
  heure: string;
  emoji: string;
  quoi: string;
  siEssaye?: string;
};

/**
 * LES MOTS RAPIDES SOUS LE LIVE.
 *
 * Trois phrases toutes faites, propres à la soirée : « Ça va être lourd ! »,
 * « Hâte de goûter le cocktail », « On y sera ! ». Elles ne servent pas à
 * gagner du temps — on écrit vite sur un téléphone — elles servent à MONTRER
 * qu'on peut parler ici, et de quoi. Un champ vide au bas d'un écran ne dit rien
 * de ce qu'on peut y dire.
 */
export type MotRapide = { emoji: string; mot: string };

/**
 * UNE SOIRÉE — l'objet qui relie les trois temps.
 *
 * « L'essayage, le Fantôme laissé et le Live ne sont pas trois fonctionnalités
 * indépendantes : ce sont trois états successifs de la même expérience. » D'où
 * un seul objet, et un seul identifiant. Trois tables séparées auraient donné
 * trois écrans qui ne se connaissent pas — et le message du Fantôme ClikMe,
 * celui qui raccroche l'essai au Live, serait devenu impossible à écrire.
 */
/**
 * ═══ UNE SOIRÉE, OU UN RENDEZ-VOUS DE LA VILLE ════════════════════════════
 *
 * « Il faut différencier les événements. Si c'est le marché sous les halles on
 * ne peut pas parler de "tester cette soirée", mais plutôt comme un restaurant
 * qui met en avant un produit au travers d'un parcours. Il va falloir dissocier
 * les événements en deux : les soirées festives et les événements locaux non
 * festifs. »
 *
 * IL A RAISON, ET LE DÉFAUT VENAIT D'UNE ABSTRACTION FAITE TROP TÔT. Un bar qui
 * fait une soirée et une mairie qui tient un marché partagent une mécanique —
 * on essaie un bout, on laisse un Fantôme, on suit le Live — et j'en ai conclu
 * qu'ils partageaient aussi le VOCABULAIRE. C'est faux. La mécanique est la
 * même, les mots ne le sont pas : « Essayer cette soirée » sous un marché de
 * producteurs à 18 h sonne comme une invitation à faire la fête devant des
 * cageots de légumes, et personne n'appuie sur un bouton qui se trompe sur ce
 * qu'il y a derrière.
 *
 * DEUX NATURES, ET RIEN D'AUTRE NE CHANGE. Aucune seconde table, aucun second
 * composant : les mêmes trois temps, les mêmes écrans, le même Fantôme. Ce qui
 * bifurque tient dans `MOTS_NATURE` — sept mots par nature — et c'est
 * exactement la taille du vrai désaccord. Deux tables séparées auraient
 * divergé ; sept mots ne divergent pas.
 */
export type NatureSoiree = "festive" | "locale";

/**
 * LES SEPT MOTS QUI CHANGENT, ET AUCUN N'EST DÉCORATIF.
 *
 * `geste` EST LE PLUS IMPORTANT : c'est le grand bouton de l'annonce, et c'est
 * lui qu'il a cité. Les six autres suivent parce qu'un bouton qui dit « Voir ce
 * marché » suivi d'un écran qui dit « la soirée est finie » se contredit à voix
 * haute, et c'est pire que l'erreur d'origine.
 *
 * LE PARCOURS EST LE MOT DE L'ÉVÉNEMENT LOCAL, et c'est le sien : « comme un
 * restaurant qui met en avant un produit au travers d'un parcours ». On ne
 * « sort » pas au marché — on y passe, on goûte, on rapporte. Le mot dit un
 * chemin qu'on fait, pas une nuit qu'on choisit.
 */
export type MotsNature = {
  /** Le grand bouton de l'annonce. */
  geste: string;
  /** Ce qu'on essaie, au génitif : « un bout de … ». */
  ce: string;
  /** Le titre du troisième temps. */
  live: string;
  /** Ce qu'on rejoint en laissant son Fantôme. */
  dedans: string;
  /** Quand tout est terminé. */
  fini: string;
  /** La question du second temps. */
  cherche: string;
  /** Le moment, dit comme il se vit. */
  moment: string;
};

export const MOTS_NATURE: Record<NatureSoiree, MotsNature> = {
  festive: {
    geste: "Essayer cette soirée",
    ce: "cette soirée",
    live: "de ce soir",
    dedans: "dans la soirée",
    fini: "🌙 La soirée est finie",
    cherche: "vous cherchez ce soir ?",
    moment: "ce soir",
  },
  locale: {
    /**
     * « VOIR » ET NON « ESSAYER », PARCE QU'ON N'ESSAIE PAS UN MARCHÉ. On
     * essaie une coupe sur sa tête et une ambiance sur son humeur ; un marché
     * de producteurs, on va le VOIR, et ce qu'on veut savoir avant d'y aller
     * c'est ce qu'on y trouvera. Le verbe change la promesse, donc il change
     * qui appuie.
     */
    geste: "Voir ce qui s’y passe",
    ce: "ce rendez-vous",
    live: "en direct",
    dedans: "parmi ceux qui y vont",
    fini: "🧺 C’est terminé pour aujourd’hui",
    cherche: "vous venez y chercher ?",
    moment: "aujourd’hui",
  },
};

/** À défaut de nature déclarée, c'est une soirée : c'est le cas d'origine. */
export function motsDe(s: Soiree | undefined): MotsNature {
  return MOTS_NATURE[s?.nature ?? "festive"];
}

export type Soiree = {
  /** `event_id` : ce qui relie toutes les données de la même soirée. */
  id: string;
  /**
   * FESTIVE OU LOCALE — voir `NatureSoiree`. Facultative, et son absence vaut
   * « festive » : c'est ce qu'étaient toutes les entrées avant qu'il fasse
   * remarquer que le marché n'en était pas une.
   */
  nature?: NatureSoiree;
  /** Le lieu, tel qu'il s'annonce. */
  lieu: string;
  /** « Ce soir », « Jeudi soir ». */
  quand: string;
  /** Le titre de l'essai, en deux morceaux — le second prend l'accent. */
  titre: string;
  suite: string;
  phrase: string;
  /** L'annotation manuscrite de la maquette. « Même soirée, mêmes envies. » */
  note?: string;
  photo?: string;
  accent: string;
  /** Un ou plusieurs essais. Voir la pagination en bas de l'écran. */
  essais: EssaiSoiree[];
  /** Combien ont laissé une intention avant l'ouverture des portes. */
  intentions: number;
  /** Combien sont dans le Live en ce moment. */
  dansLeLive: number;
  fantomes: FantomePresent[];
  live: MessageLive[];
  rapides: MotRapide[];
  /** Ce qui arrive, heure par heure. Voir `TempsFort`. */
  programme?: TempsFort[];
};

/**
 * OÙ EN EST LA SOIRÉE, À CETTE HEURE-CI.
 *
 * ELLE REND TROIS CHOSES ET NON UNE : ce qui vient de se passer, ce qui se
 * passe, ce qui arrive. Un écran qui n'affiche que « prochain temps » devient
 * muet à la fin de la soirée — précisément au moment où l'on rouvre pour savoir
 * si ça vaut encore le coup de sortir.
 */
export function ouEnEstLaSoiree(
  programme: TempsFort[] | undefined,
  heure: number,
): { passes: TempsFort[]; maintenant?: TempsFort; suivant?: TempsFort } {
  const l = [...(programme ?? [])].sort((a, b) => a.quand - b.quand);
  const passes = l.filter((t) => t.quand <= heure);
  return {
    passes,
    // « MAINTENANT » DURE UNE DEMI-HEURE. Au-delà, « le DJ commence » devant
    // quelqu'un qui arrive à minuit est une information fausse d'une heure et
    // demie — et c'est exactement le genre de détail qui fait qu'on cesse de
    // croire un écran.
    maintenant: passes.length ? (heure - passes[passes.length - 1].quand <= 0.5 ? passes[passes.length - 1] : undefined) : undefined,
    suivant: l.find((t) => t.quand > heure),
  };
}

/** Les trois réactions, identiques partout. Voir `ReactionEssai`. */
const AMBIANCE: ReactionEssai[] = [
  { cle: "non", emoji: "😐", mot: "Pas trop", icone: "neutre" },
  { cle: "oui", emoji: "🙂", mot: "Sympa", icone: "sourire" },
  { cle: "feu", emoji: "🔥", mot: "Ça va être bien !", icone: "feu" },
];

/**
 * ═══ SOIRÉE 1 — LE BAR À VINS : ON ESSAIE UN VERRE, PUIS UNE PLANCHE ══════
 *
 * DEUX ESSAIS, ET C'EST CE QUE LA MAQUETTE MONTRE avec ses deux points en bas
 * d'écran. Le premier est une IMAGE — le verre du soir — le second une
 * QUESTION. Deux formes différentes dans la même soirée : c'est la preuve que
 * l'objet est générique, et c'est aussi plus agréable que deux fois la même
 * chose.
 */
const SOIREE_BAR_VINS: Soiree = {
  /** Un bar qui fait sa soirée : c'est le cas d'origine, et le mot juste. */
  nature: "festive",
  id: "bar-vins-ce-soir",
  lieu: "Un bar à vins",
  quand: "Ce soir",
  titre: "Essayez un bout de ",
  suite: "cette soirée",
  phrase: "Le bar vous fait découvrir un avant-goût de ce qui vous attend.",
  note: "Même soirée,\nmêmes envies.",
  photo: "/direct/verre-au-comptoir.jpg",
  accent: "#C77DFF",
  essais: [
    {
      id: "verre",
      forme: "image",
      chapeau: "LE VERRE DE CE SOIR",
      etiquette: { haut: "AU VERRE", bas: "Jurançon sec" },
      titre: "Regardez ce qu’on ouvre à 18 h, et ce qu’il y a autour.",
      media: "/direct/verre-au-comptoir.jpg",
      question: "Ça vous met dans l’ambiance ?",
      reactions: AMBIANCE,
    },
    {
      id: "planche",
      forme: "question",
      chapeau: "LA PLANCHE",
      titre: "À votre avis, d’où vient le fromage de la planche ?",
      reponses: [
        { cle: "pyrenees", mot: "Des Pyrénées" },
        { cle: "landes", mot: "Des Landes" },
        { cle: "espagne", mot: "D’Espagne" },
        { cle: "partout", mot: "Un peu de partout" },
      ],
      verite:
        "Des trois. Lou va chercher la tomme en vallée d’Aspe, la brebis à Ossau et le chorizo à Irún — trois routes différentes pour une planche à 12 €.",
      question: "Ça vous donne envie de passer ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 18,
  dansLeLive: 24,
  rapides: [
    { emoji: "🍷", mot: "Hâte de goûter ça" },
    { emoji: "👋", mot: "On passe vers 19 h" },
    { emoji: "❓", mot: "Il reste de la place ?" },
  ],
  programme: [
    { quand: 18, heure: "18 h", emoji: "🍷", quoi: "On ouvre la première bouteille", siEssaye: "verre" },
    { quand: 19, heure: "19 h", emoji: "🧀", quoi: "Les planches sortent" },
    { quand: 22, heure: "22 h", emoji: "🎶", quoi: "Le vinyle du jeudi" },
    { quand: 24, heure: "minuit", emoji: "🌙", quoi: "On ferme" },
  ],
  fantomes: [
    { id: "f1", nom: "Rose 12", teinte: "#FF7EB6", accessoire: "♡", intention: "verre", mot: "Toujours partante pour un bon verre et de belles discussions.", present: true },
    { id: "f2", nom: "Violet 34", teinte: "#A855F7", accessoire: "🕶️", intention: "decouvrir", mot: "Ici pour goûter ce que je ne connais pas.", present: true },
    { id: "f3", nom: "Bleu 27", teinte: "#5B8DEF", accessoire: "🧢", intention: "amis", mot: "On vient à quatre, on prendra la grande table.", present: true },
    { id: "f4", nom: "Orange 41", teinte: "#FF8A5B", intention: "verre", mot: "Un verre après le boulot, sans plus.", present: false },
    { id: "f5", nom: "Vert 29", teinte: "#3DE2A6", accessoire: "🎧", intention: "musique", mot: "Il paraît qu’il y a un vinyle le jeudi.", present: true },
    { id: "f6", nom: "Jaune 26", teinte: "#FFC24B", intention: "rencontre", mot: "Si tu as un bon sens de l’humour, viens me parler !", present: true },
  ],
  live: [
    // LA VOIX DU COMPTOIR EST CELLE DU PAQUET. « Dites-moi ce que vous aimez
    // boire d'habitude, et je vous fais goûter autre chose. C'est tout mon
    // métier » était le mot de Serge dans son Avant-goût ; il n'a pas disparu
    // avec lui, il a trouvé l'endroit où on peut vraiment lui répondre.
    { id: "m0", sorte: "info", qui: "Le bar à vins", maison: true, heure: "17:55", mot: "Serge est au comptoir ce soir. Dites-lui ce que vous buvez d’habitude, il vous fera goûter autre chose 🍷", coeurs: 14 },
    { id: "m1", sorte: "question", qui: "Lucas", heure: "18:12", mot: "Vous ouvrez jusqu’à quelle heure ce soir ?" },
    { id: "m2", sorte: "info", qui: "Le bar à vins", maison: true, heure: "18:14", mot: "Jusqu’à minuit, et la cuisine s’arrête à 22 h 👌", coeurs: 9 },
    { id: "m3", sorte: "mot", qui: "Emma", heure: "18:31", mot: "On vient vers 19 h à trois 🍷", coeurs: 5 },
    {
      id: "m4",
      sorte: "sondage",
      qui: "Le bar à vins",
      maison: true,
      heure: "18:40",
      mot: "On ouvre quoi en deuxième bouteille ?",
      options: [
        { cle: "rouge", mot: "Un madiran", voix: 14 },
        { cle: "blanc", mot: "Un jurançon sec", voix: 21 },
        { cle: "orange", mot: "Un vin orange", voix: 8 },
      ],
    },
    {
      id: "m5",
      sorte: "fantome",
      qui: "Fantôme ClikMe",
      heure: "18:52",
      mot: "Le verre que vous avez regardé tout à l’heure est ouvert : il en reste six.",
      coeurs: 12,
      siEssaye: "verre",
    },
  ],
};

/**
 * ═══ SOIRÉE 2 — LA TERRASSE : ON ESSAIE LA LUMIÈRE ════════════════════════
 *
 * CE QU'ON ESSAIE ICI N'EST NI UN SON NI UN GOÛT, C'EST UNE HEURE. Une terrasse
 * plein sud ne se raconte pas autrement : ce qui décide, c'est de savoir à quoi
 * elle ressemble au moment où l'on viendra. Le geste fait tomber la lumière du
 * soir sur la photo — c'est tout, et c'est exactement ce qu'on venait voir.
 */
const SOIREE_TERRASSE: Soiree = {
  /** Une terrasse un soir d'été — on y va pour l'ambiance, pas pour acheter. */
  nature: "festive",
  id: "bar-terrasse-ce-soir",
  lieu: "Une terrasse au soleil",
  quand: "Ce soir",
  titre: "Essayez un bout de ",
  suite: "cette fin de journée",
  phrase: "La terrasse vous montre à quoi elle ressemble à l’heure où vous viendrez.",
  note: "Même terrasse,\nmêmes envies.",
  photo: "/direct/terrasse-au-soleil.jpg",
  accent: "#FFB24B",
  essais: [
    /**
     * ═══ LE COCKTAIL DU SOIR, MONTÉ DEVANT VOUS ═══════════════════════════
     *
     * « On met l'accent sur un cocktail du soir que le barman nous présente pas
     * à pas pour nous donner envie. »
     *
     * CINQ GESTES, ET AUCUN N'EST UNE LIGNE D'INGRÉDIENT. « Je givre le verre
     * au sucre de canne » n'est pas la même phrase que « sucre de canne » : la
     * première montre quelqu'un, la seconde remplit un tableau. C'est toute la
     * différence entre une recette et une envie.
     *
     * LE VERRE SE REMPLIT VRAIMENT, couche par couche, dans la couleur de
     * chaque geste. On ne raconte pas le cocktail, on le regarde se faire.
     */
    {
      id: "cocktail",
      forme: "recette",
      chapeau: "LE COCKTAIL DE CE SOIR",
      etiquette: { haut: "SIGNATURE", bas: "Le Landais" },
      titre: "Lou le monte devant vous, geste par geste.",
      garniture: "🍋",
      etapes: [
        { emoji: "🧊", mot: "La glace", dit: "Trois gros glaçons, jamais de pilée : ça fondrait trop vite.", teinte: "#CFE8FF", part: 0.26 },
        { emoji: "🥃", mot: "L’armagnac", dit: "Quatre centilitres d’un petit producteur de Gabarret.", teinte: "#C97A2E", part: 0.3 },
        { emoji: "🍯", mot: "Le sirop de pin", dit: "Un trait. C’est lui qui fait dire « tiens, c’est quoi ? ».", teinte: "#E8B04B", part: 0.14 },
        { emoji: "🍋", mot: "Le citron", dit: "Pressé au moment, sinon ça tourne amer en dix minutes.", teinte: "#F2E06A", part: 0.16 },
        { emoji: "🫧", mot: "L’eau de Dax", dit: "On allonge doucement, et on ne remue pas. Le reste se fait tout seul.", teinte: "#9FD8F2", part: 0.14 },
      ],
      question: "Ça vous met dans l’ambiance ?",
      reactions: AMBIANCE,
    },
    {
      id: "lumiere",
      forme: "geste",
      chapeau: "LA LUMIÈRE DE 19 H",
      etiquette: { haut: "PLEIN SUD", bas: "Ombre après 20 h" },
      titre: "Touchez la photo : voilà la terrasse quand le soleil tombe.",
      media: "/direct/terrasse-au-soleil.jpg",
      geste: "Faire tomber le soir",
      apres: "Et maintenant…",
      question: "Ça vous met dans l’ambiance ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 11,
  dansLeLive: 16,
  rapides: [
    { emoji: "☀️", mot: "On arrive avant que ça tourne" },
    { emoji: "👋", mot: "Vous gardez une table ?" },
    { emoji: "🍹", mot: "Hâte de goûter le cocktail" },
  ],
  programme: [
    { quand: 18, heure: "18 h", emoji: "🌤️", quoi: "Le soleil passe derrière les platanes", siEssaye: "lumiere" },
    { quand: 19.5, heure: "19 h 30", emoji: "🍹", quoi: "Le cocktail du soir" },
    { quand: 22, heure: "22 h", emoji: "🌙", quoi: "Dernier service en terrasse" },
  ],
  fantomes: [
    { id: "t1", nom: "Indigo 31", teinte: "#7C93FF", intention: "verre", mot: "Plutôt team terrasse, rires et discussions sans prise de tête.", present: true },
    { id: "t2", nom: "Rose 68", teinte: "#FF4FA3", accessoire: "🌸", intention: "amis", mot: "On est cinq, on cherche de l’ombre.", present: true },
    { id: "t3", nom: "Vert 29", teinte: "#3DE2A6", intention: "decouvrir", mot: "Jamais venu ici, on verra bien.", present: true },
    { id: "t4", nom: "Lila 37", teinte: "#C77DFF", accessoire: "♡", intention: "rencontre", mot: "Ici pour de belles surprises.", present: false },
  ],
  live: [
    // MÊME CHOSE POUR LOU. « À partir de dix-huit heures, le soleil passe
    // derrière les platanes. C'est le meilleur moment, et personne ne le sait »
    // : une phrase de patronne, qui n'a de valeur que dite au bon moment.
    { id: "t-m0", sorte: "info", qui: "Une terrasse au soleil", maison: true, heure: "17:20", mot: "À partir de 18 h, le soleil passe derrière les platanes. C’est le meilleur moment, et personne ne le sait 😌 — Lou", coeurs: 13 },
    { id: "t-m1", sorte: "info", qui: "Une terrasse au soleil", maison: true, heure: "17:40", mot: "Il reste trois tables à l’ombre. Sans réservation, premier arrivé.", coeurs: 7 },
    { id: "t-m2", sorte: "question", qui: "Tom", heure: "17:58", mot: "Le soleil tape jusqu’à quelle heure ?" },
    { id: "t-m3", sorte: "mot", qui: "Une terrasse au soleil", maison: true, heure: "18:02", mot: "Ça tourne vers 20 h, après c’est l’ombre des platanes 😌", coeurs: 11 },
    {
      id: "t-m4",
      sorte: "sondage",
      qui: "Une terrasse au soleil",
      maison: true,
      heure: "18:20",
      mot: "On sort le grand parasol ou pas ?",
      options: [
        { cle: "oui", mot: "Oui, il fait fort", voix: 18 },
        { cle: "non", mot: "Non, c’est parfait", voix: 6 },
      ],
    },
    {
      id: "t-m5",
      sorte: "fantome",
      qui: "Fantôme ClikMe",
      heure: "18:35",
      mot: "La lumière que vous avez essayée arrive dans quarante minutes.",
      coeurs: 8,
      siEssaye: "lumiere",
    },
  ],
};

/**
 * ═══ SOIRÉE 3 — LE CONCERT AU KIOSQUE : ON ESSAIE LE SON ══════════════════
 *
 * C'EST SA MAQUETTE, AU TRAIT. « Découvrez 10 secondes du morceau qui donnera le
 * ton. » C'est aussi le seul essai du fichier qui a besoin d'un FICHIER : voir
 * `scripts/son-de-soiree.mjs`, qui fabrique l'extrait tant que le kiosque n'a
 * pas déposé le sien.
 *
 * ET C'EST UN ÉVÉNEMENT, PAS UN COMMERCE. La mécanique est la même au mot près,
 * ce qui est le point de tout ce fichier : un bar qui organise une soirée et une
 * mairie qui organise un concert font la même chose.
 */
const SOIREE_KIOSQUE: Soiree = {
  /** Un concert est une sortie : on choisit d'y passer sa soirée. */
  nature: "festive",
  id: "kiosque-ce-soir",
  lieu: "Concert au kiosque",
  quand: "Ce soir, 19 h",
  titre: "Essayez un bout de ",
  suite: "cette soirée",
  phrase: "Le kiosque vous fait découvrir un avant-goût de ce qui vous attend.",
  note: "Même soirée,\nmêmes envies.",
  photo: "/direct/concert-kiosque.jpg",
  accent: "#E56BE0",
  essais: [
    {
      id: "son",
      forme: "son",
      chapeau: "LE SON DE CE SOIR",
      etiquette: { haut: "TRIO JAZZ", bas: "Standards landais" },
      titre: "Découvrez 10 secondes du morceau qui donnera le ton.",
      media: "/direct/soiree/son-de-ce-soir.wav",
      duree: 10,
      question: "Ça vous met dans l’ambiance ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 26,
  dansLeLive: 43,
  rapides: [
    { emoji: "🔥", mot: "Ça va être lourd !" },
    { emoji: "🪑", mot: "J’apporte des chaises" },
    { emoji: "👋", mot: "On y sera !" },
  ],
  programme: [
    { quand: 18, heure: "18 h", emoji: "🪑", quoi: "On installe le kiosque" },
    { quand: 19, heure: "19 h", emoji: "🎺", quoi: "Premier morceau" },
    { quand: 21, heure: "21 h", emoji: "🎧", quoi: "Le morceau que vous avez essayé", siEssaye: "son" },
    { quand: 22, heure: "22 h", emoji: "👏", quoi: "Dernier morceau" },
  ],
  fantomes: [
    { id: "k1", nom: "Violet 34", teinte: "#A855F7", accessoire: "🕶️", intention: "musique", mot: "Ici pour le son, et pour l’herbe fraîche.", present: true },
    { id: "k2", nom: "Bleu 27", teinte: "#5B8DEF", accessoire: "🧢", intention: "amis", mot: "On vient à six avec les enfants.", present: true },
    { id: "k3", nom: "Orange 41", teinte: "#FF8A5B", intention: "decouvrir", mot: "Je n’ai jamais écouté de jazz en vrai.", present: true },
    { id: "k4", nom: "Rose 12", teinte: "#FF7EB6", accessoire: "♡", intention: "fete", mot: "On finira au bar d’après, qui vient ?", present: true },
    { id: "k5", nom: "Indigo 31", teinte: "#7C93FF", intention: "verre", mot: "Une bière dans l’herbe et je suis bien.", present: false },
  ],
  live: [
    { id: "k-m1", sorte: "question", qui: "Lucas", photo: "", heure: "17:12", mot: "Quelqu’un sait à quelle heure ça commence vraiment ?" },
    { id: "k-m2", sorte: "info", qui: "La mairie", maison: true, heure: "17:14", mot: "Installation à 18 h, premier morceau à 19 h 👌", coeurs: 12 },
    { id: "k-m3", sorte: "mot", qui: "Emma", heure: "17:18", mot: "On vient vers 19 h avec des amis ! 🔥", coeurs: 8 },
    { id: "k-m4", sorte: "question", qui: "Tom", heure: "17:20", mot: "C’est du jazz toute la soirée ?" },
    { id: "k-m5", sorte: "mot", qui: "La mairie", maison: true, heure: "17:22", mot: "Standards au début, plus libre après 21 h 😏", coeurs: 16 },
    {
      id: "k-m6",
      sorte: "sondage",
      qui: "La mairie",
      maison: true,
      heure: "17:45",
      mot: "Qui pense arriver avant 19 h ?",
      options: [
        { cle: "avant", mot: "Moi", voix: 22 },
        { cle: "apres", mot: "Plus tard", voix: 17 },
      ],
    },
    {
      id: "k-m7",
      sorte: "fantome",
      qui: "Fantôme ClikMe",
      heure: "18:25",
      mot: "Le son que vous avez essayé tout à l’heure sera joué vers 21 h. 🎧",
      coeurs: 24,
      siEssaye: "son",
    },
  ],
};

/**
 * ═══ SOIRÉE 4 — LE MARCHÉ DE NUIT : ON ESSAIE UN PRODUCTEUR ═══════════════
 *
 * CE QU'ON ESSAIE EST UNE QUESTION, et c'est la bonne forme pour un marché :
 * vingt producteurs ne se résument pas en une image, mais une seule chose
 * surprend et suffit à donner envie d'y aller.
 */
const SOIREE_MARCHE: Soiree = {
  /** SON EXEMPLE, MOT POUR MOT. Vingt producteurs sous les halles à 18 h : on
   * y passe, on goûte, on dîne sur place. « Essayer cette soirée » ne décrivait
   * rien de ce qui s'y fait. */
  nature: "locale",
  id: "marche-nuit-ce-soir",
  lieu: "Marché de producteurs, le soir",
  quand: "Jeudi, 18 h",
  titre: "Essayez un bout de ",
  suite: "ce marché",
  phrase: "Vingt producteurs sous les halles. En voilà un, avant d’y aller.",
  note: "Même marché,\nmêmes envies.",
  photo: "/direct/marche-producteurs.jpg",
  accent: "#3DE2A6",
  essais: [
    {
      id: "producteur",
      forme: "question",
      chapeau: "LE PRODUCTEUR DE CE SOIR",
      etiquette: { haut: "20 STANDS", bas: "Tous du département" },
      titre: "À votre avis, combien de kilomètres a fait le plus lointain ?",
      reponses: [
        { cle: "dix", mot: "Moins de 10 km" },
        { cle: "trente", mot: "Une trentaine" },
        { cle: "soixante", mot: "Une soixantaine" },
        { cle: "cent", mot: "Plus de 100 km" },
      ],
      verite:
        "Soixante-deux. C’est le fromager d’Ossau, et c’est le seul qui vienne d’aussi loin : les dix-neuf autres sont à moins de trente kilomètres des halles.",
      question: "Ça vous donne envie d’y passer ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 9,
  dansLeLive: 12,
  rapides: [
    { emoji: "🧺", mot: "On vient dîner sur place" },
    { emoji: "❓", mot: "Il y a des tables ?" },
    { emoji: "👋", mot: "On y sera !" },
  ],
  programme: [
    { quand: 18, heure: "18 h", emoji: "🧺", quoi: "Les stands ouvrent" },
    { quand: 19.5, heure: "19 h 30", emoji: "🍽️", quoi: "On dîne aux tables" },
    { quand: 22, heure: "22 h", emoji: "🌙", quoi: "On remballe" },
  ],
  fantomes: [
    { id: "ma1", nom: "Vert 29", teinte: "#3DE2A6", intention: "decouvrir", mot: "Je viens surtout pour goûter des choses.", present: true },
    { id: "ma2", nom: "Jaune 26", teinte: "#FFC24B", intention: "amis", mot: "On dîne sur place à quatre.", present: true },
    { id: "ma3", nom: "Bleu 27", teinte: "#5B8DEF", intention: "verre", mot: "Un verre de blanc et une assiette, c’est tout.", present: false },
  ],
  live: [
    { id: "ma-m1", sorte: "info", qui: "Office de tourisme", maison: true, heure: "16:30", mot: "Vingt producteurs ce soir. Tables sous les halles, arrivez tôt pour en avoir une.", coeurs: 6 },
    { id: "ma-m2", sorte: "question", qui: "Nadia", heure: "17:02", mot: "On peut payer par carte ?" },
    { id: "ma-m3", sorte: "mot", qui: "Office de tourisme", maison: true, heure: "17:05", mot: "La plupart sont en espèces. Distributeur place Roger-Ducos.", coeurs: 9 },
    {
      id: "ma-m4",
      sorte: "fantome",
      qui: "Fantôme ClikMe",
      heure: "17:30",
      mot: "Le fromager dont vous avez deviné la route est au fond, à droite.",
      coeurs: 5,
      siEssaye: "producteur",
    },
  ],
};

/**
 * ═══ SOIRÉE 5 — LA NOCTURNE AU MUSÉE : ON ESSAIE UNE PIÈCE ════════════════
 *
 * UNE IMAGE, ET UNE SEULE. Un musée n'a pas besoin d'un extrait de dix secondes
 * : il a une pièce, et la regarder de près avant d'y aller est exactement ce
 * qu'on fait dans la salle.
 */
const SOIREE_EXPO: Soiree = {
  /** Une nocturne de musée se visite. Le mot « soirée » promettait une fête
   * là où il y a un parcours, des salles et une heure de fermeture. */
  nature: "locale",
  id: "expo-vendredi",
  lieu: "Nocturne au musée",
  quand: "Vendredi, 18 h",
  titre: "Essayez un bout de ",
  suite: "cette nocturne",
  phrase: "Le musée vous montre une pièce de l’expo avant que vous entriez.",
  note: "Même soirée,\nmêmes curiosités.",
  photo: "/direct/nocturne-musee.jpg",
  accent: "#7C93FF",
  essais: [
    {
      id: "piece",
      forme: "image",
      chapeau: "LA PIÈCE DE CE SOIR",
      etiquette: { haut: "BAINS ROMAINS", bas: "Visite à 19 h" },
      titre: "Regardez ce qu’on a sorti des réserves pour cette expo.",
      media: "/direct/nocturne-musee.jpg",
      question: "Ça vous donne envie d’entrer ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 7,
  dansLeLive: 9,
  rapides: [
    { emoji: "🎟️", mot: "On vient à deux" },
    { emoji: "❓", mot: "La visite dure combien ?" },
    { emoji: "✨", mot: "Hâte de voir ça" },
  ],
  programme: [
    { quand: 18, heure: "18 h", emoji: "🚪", quoi: "Ouverture de la nocturne" },
    { quand: 19, heure: "19 h", emoji: "🗣️", quoi: "Première visite guidée" },
    { quand: 20.5, heure: "20 h 30", emoji: "🗣️", quoi: "Seconde visite guidée" },
    { quand: 22, heure: "22 h", emoji: "🌙", quoi: "Fermeture" },
  ],
  fantomes: [
    { id: "e1", nom: "Indigo 31", teinte: "#7C93FF", intention: "decouvrir", mot: "Je passe après le travail, seul, et ça me va.", present: true },
    { id: "e2", nom: "Rose 12", teinte: "#FF7EB6", intention: "amis", mot: "On vient à trois pour la visite de 19 h.", present: true },
  ],
  live: [
    { id: "e-m1", sorte: "info", qui: "Musée de Borda", maison: true, heure: "16:00", mot: "Vendredi, ouvert jusqu’à 22 h et entrée à 5 €. Visites guidées à 19 h et 20 h 30.", coeurs: 8 },
    { id: "e-m2", sorte: "question", qui: "Karim", heure: "16:40", mot: "La visite guidée dure combien de temps ?" },
    { id: "e-m3", sorte: "mot", qui: "Musée de Borda", maison: true, heure: "16:44", mot: "Quarante-cinq minutes. On peut rester après dans les salles.", coeurs: 6 },
    {
      id: "e-m4",
      sorte: "fantome",
      qui: "Fantôme ClikMe",
      heure: "17:10",
      mot: "La pièce que vous avez regardée est dans la deuxième salle, à gauche.",
      coeurs: 4,
      siEssaye: "piece",
    },
  ],
};

/**
 * ═══ SOIRÉE 6 — LE VIDE-GRENIER : ON ESSAIE LA CHASSE ═════════════════════
 *
 * IL PROUVE QUE LA MÉCANIQUE TIENT LOIN DE LA NUIT. Un vide-grenier n'a ni DJ,
 * ni cocktail, ni scène — et il a exactement le même besoin : savoir si ça vaut
 * le déplacement, dire ce qu'on cherche, et poser une question à l'organisateur
 * avant de traverser la ville.
 */
const SOIREE_VIDE_GRENIER: Soiree = {
  /** Un vide-grenier commence à huit heures du matin : appeler ça une soirée
   * était faux au sens propre, avant même d'être faux au sens du ton. */
  nature: "locale",
  id: "vide-grenier-dimanche",
  lieu: "Vide-grenier",
  quand: "Dimanche, 8 h",
  titre: "Essayez un bout de ",
  suite: "cette matinée",
  phrase: "Ce qu’on y trouve, avant de traverser la ville pour le voir.",
  note: "Même chasse,\nmêmes trouvailles.",
  accent: "#FF8A5B",
  essais: [
    {
      id: "trouvaille",
      forme: "question",
      chapeau: "LA TROUVAILLE DE L’AN DERNIER",
      etiquette: { haut: "120 EXPOSANTS", bas: "Allées du Sablar" },
      titre: "À votre avis, qu’est-ce qui est parti le plus vite l’an dernier ?",
      reponses: [
        { cle: "vinyles", mot: "Les vinyles" },
        { cle: "outils", mot: "Les vieux outils" },
        { cle: "vaisselle", mot: "La vaisselle" },
        { cle: "velos", mot: "Les vélos d’enfant" },
      ],
      verite:
        "Les vélos d’enfant. Tous partis avant 10 h, et c’est pour ça que les habitués arrivent à l’ouverture avec un café à la main.",
      question: "Ça vous donne envie de venir tôt ?",
      reactions: AMBIANCE,
    },
  ],
  intentions: 14,
  dansLeLive: 19,
  rapides: [
    { emoji: "☕", mot: "On y sera à l’ouverture" },
    { emoji: "❓", mot: "On se gare où ?" },
    { emoji: "🔎", mot: "Je cherche des vinyles" },
  ],
  programme: [
    { quand: 8, heure: "8 h", emoji: "☕", quoi: "Ouverture des allées" },
    { quand: 10, heure: "10 h", emoji: "🚲", quoi: "Les vélos d’enfant partent", siEssaye: "trouvaille" },
    { quand: 17, heure: "17 h", emoji: "📦", quoi: "On remballe" },
  ],
  fantomes: [
    { id: "v1", nom: "Jaune 26", teinte: "#FFC24B", intention: "decouvrir", mot: "Je cherche des vinyles, si vous en voyez faites signe.", present: true },
    { id: "v2", nom: "Vert 29", teinte: "#3DE2A6", intention: "amis", mot: "On fait les allées à deux, tranquille.", present: true },
    { id: "v3", nom: "Bleu 27", teinte: "#5B8DEF", intention: "fete", mot: "On finit au café du coin après.", present: false },
  ],
  live: [
    { id: "v-m1", sorte: "info", qui: "Le comité des fêtes", maison: true, heure: "07:10", mot: "120 exposants, allées du Sablar. Parking gratuit derrière la halle.", coeurs: 11 },
    { id: "v-m2", sorte: "question", qui: "Sonia", heure: "07:35", mot: "Ça finit à quelle heure ?" },
    { id: "v-m3", sorte: "mot", qui: "Le comité des fêtes", maison: true, heure: "07:38", mot: "On remballe vers 17 h, mais le meilleur part le matin 😉", coeurs: 7 },
    {
      id: "v-m4",
      sorte: "sondage",
      qui: "Le comité des fêtes",
      maison: true,
      heure: "08:15",
      mot: "On ouvre la buvette à quelle heure ?",
      options: [
        { cle: "huit", mot: "Dès 8 h", voix: 16 },
        { cle: "dix", mot: "10 h suffit", voix: 4 },
      ],
    },
  ],
};

/**
 * ═══ LA TABLE, INDEXÉE PAR COMMERCE ET PAR ÉVÉNEMENT ══════════════════════
 *
 * ELLE MÊLE LES DEUX EXPRÈS, et c'est ce que son cahier des charges demande :
 * « penser l'ensemble autour d'un objet Event/Experience, même lorsqu'il s'agit
 * d'une soirée organisée par un bar ». Un bar qui fait une soirée et une mairie
 * qui fait un concert sont la même chose du point de vue du Fantôme ; deux
 * tables séparées auraient fini par diverger, et c'est le bar qui aurait perdu.
 *
 * ET L'ABSENCE EST LE CAS NORMAL. Un commerce sans soirée garde le mur de
 * présence ou son Avant-goût. Le jour où l'assistante interroge un patron de bar
 * à 17 h, c'est cette fonction qui rendra sa soirée.
 */
export const SOIREES: Record<string, Soiree> = {
  "bar-vins": SOIREE_BAR_VINS,
  "bar-terrasse": SOIREE_TERRASSE,
  kiosque: SOIREE_KIOSQUE,
  "marche-nuit": SOIREE_MARCHE,
  expo: SOIREE_EXPO,
  "vide-grenier": SOIREE_VIDE_GRENIER,
};

export function soireeDuLieu(id: string | undefined): Soiree | undefined {
  return id ? SOIREES[id] : undefined;
}

/**
 * LES QUATRE FILTRES DU LIVE.
 *
 * `tout` N'EST PAS UN FILTRE, C'EST L'ABSENCE DE FILTRE — et il est premier
 * parce que c'est l'état par défaut d'une conversation. Les trois autres sont
 * des réponses à trois besoins différents : savoir (infos), demander
 * (questions), peser (sondages).
 */
export const FILTRES_LIVE: { cle: "tout" | SorteMessage; emoji: string; mot: string }[] = [
  { cle: "tout", emoji: "💬", mot: "Tout" },
  { cle: "info", emoji: "📣", mot: "Infos" },
  { cle: "question", emoji: "❓", mot: "Questions" },
  { cle: "sondage", emoji: "📊", mot: "Sondages" },
];

/**
 * CE QUE LE FILTRE LAISSE PASSER.
 *
 * LE MESSAGE DU FANTÔME CLIKME PASSE DANS « INFOS », et ce n'est pas un
 * rangement par défaut : « le son que vous avez essayé sera joué vers 23 h » EST
 * une information sur la soirée, au même titre que l'heure du DJ. La ranger
 * ailleurs la rendrait invisible à quelqu'un qui ne veut que les faits — c'est
 * précisément la personne à qui elle sert le plus.
 */
export function passeLeFiltre(m: MessageLive, filtre: string): boolean {
  if (filtre === "tout") return true;
  if (filtre === "info") return m.sorte === "info" || m.sorte === "fantome";
  return m.sorte === filtre;
}
