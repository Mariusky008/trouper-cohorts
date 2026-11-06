/**
 * 🎬 LES SCÉNARIOS DES ÉPISODES — 6 novembre 2026, le patron, sur la page « Rencontres » : « les gens se fichent de ce
 * type de thématique (« défi lancé sans préchauffage… ») ; en fonction de la personne tirée au sort pour la discussion
 * du jour, c'est nous qui devons orienter la conversation » :
 *   · AVEC UN AMI, ON CHOISIT LE THÈME (`THEMES_AMIS`) : la dispute (pour rire), l'amour, la sortie, le voyage… ;
 *   · AVEC UN COMMERÇANT, SON MÉTIER DONNE L'ÉPISODE (`scenarioMetier`) : le coiffeur lui propose un style (« sur toi,
 *     je verrais bien… ») et on peut l'essayer (le module d'essai de sa page) ; la boutique de vêtements, un look ; le
 *     tatoueur, un motif ; le restaurant, son menu du jour (ses vrais plats, s'ils sont connus) ; à chaque métier sa
 *     façon de parler.
 * La figurine du commerçant ne promet rien (ni prix, ni offre, ni horaire) : ce n'est pas le commerçant qui parle.
 *
 * `visuel` : l'épisode finit par sa figurine relookée (le moteur d'image, d'après la proposition) — l'effet « c'est
 * incroyable ce qu'ils ont fait ».
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";

export type ThemeAmi = { cle: string; emoji: string; nom: string; consigne: string; membre: boolean };

/** Les thèmes à choisir avec un ami (`membre` : aussi pour un membre de sa ville, qu'il ne connaît pas). */
export const THEMES_AMIS: readonly ThemeAmi[] = [
  {
    cle: "dispute",
    emoji: "💥",
    nom: "La dispute (pour rire)",
    consigne: "une fausse dispute, pour rire, sur un sujet futile du quotidien (l'ananas sur la pizza, le dernier biscuit, qui choisit la musique en voiture) ; chacune défend son camp avec une mauvaise foi magnifique, et elles finissent réconciliées",
    membre: true,
  },
  {
    cle: "amour",
    emoji: "💘",
    nom: "L'amour",
    consigne: "l'amour version comédie romantique : le rendez-vous idéal, la pire technique de drague, la chanson pour faire sa déclaration ; tendre et drôle, jamais intime, jamais l'une envers l'autre",
    membre: false,
  },
  {
    cle: "sortie",
    emoji: "🎉",
    nom: "La sortie",
    consigne: "elles organisent une sortie ensemble (quoi faire, où aller, qui choisit) et se chamaillent sur chaque détail, jusqu'au plan final, précis et drôle — sans fixer de vrai rendez-vous",
    membre: true,
  },
  {
    cle: "voyage",
    emoji: "✈️",
    nom: "Le voyage",
    consigne: "le voyage de leurs rêves, ensemble : la destination, ce qu'elles mettent dans la valise, laquelle se perd, laquelle goûte tout",
    membre: true,
  },
  {
    cle: "bouffe",
    emoji: "🍕",
    nom: "La bouffe",
    consigne: "leur plat préféré, leur pire recette, le dîner idéal et le plat qu'elles ne mangeront jamais ; des détails qui donnent faim",
    membre: true,
  },
  {
    cle: "secrets",
    emoji: "🤫",
    nom: "Les petits secrets",
    consigne: "elles s'avouent des petits secrets inoffensifs et drôles : une manie, un plaisir coupable, une peur ridicule ; rien de sensible",
    membre: true,
  },
  {
    cle: "futur",
    emoji: "🔮",
    nom: "Dans 10 ans",
    consigne: "elles imaginent leur vie dans dix ans, en grand et en drôle : le métier, la maison, l'habitude qu'elles auront toujours",
    membre: true,
  },
  {
    cle: "defi",
    emoji: "🏆",
    nom: "Le défi",
    consigne: "elles se lancent un défi amusant et faisable, à relever cette semaine, et se taquinent sur qui va le réussir",
    membre: true,
  },
];
export const themeAmiDe = (cle: unknown) => THEMES_AMIS.find((t) => t.cle === cle) ?? null;

/**
 * Ce que l'épisode chez un commerçant propose à la fin, et le lien pour aller plus loin sur SA page (`onglet` : l'essai
 * ou la carte). `visuel` : ce que le moteur d'image change sur sa figurine (« hairstyle », « outfit »…).
 */
export type ScenarioMetier = {
  cle: string;
  emoji: string;
  nom: string;
  consigne: string;
  /** Ce que la figurine du commerçant propose (le mot, pour la page) : « une coupe », « un look »… */
  propose: string;
  action?: { texte: string; onglet?: "experience" | "carte" };
  visuel?: "coiffure" | "tenue" | "lunettes" | "tatouage" | "bijou";
};

export function scenarioMetier(metier: string): ScenarioMetier {
  const m = (metier || "").toLowerCase();
  const branche = brancheDuMetier(metier);
  if (branche === "coiffeur")
    return {
      cle: "coiffure",
      emoji: "✂️",
      nom: "Le style qu'il te faut",
      propose: "un style",
      consigne:
        "la figurine du salon regarde la figurine A et lui propose UN style de coupe précis qui lui irait, justifié par sa personnalité (« toi qui… ») ; la figurine A hésite, pose des questions, se laisse convaincre ; le style est nommé clairement (« un dégradé court, plus long sur le dessus »). Uniquement la coupe : jamais un mot sur le visage, le corps ou l'âge",
      action: { texte: "✂️ Essayer ce style sur moi", onglet: "experience" },
      visuel: "coiffure",
    };
  if (branche === "mode")
    return {
      cle: "look",
      emoji: "👗",
      nom: "Le look qu'il te faut",
      propose: "un look",
      consigne:
        "la figurine de la boutique compose pour la figurine A UN look précis (une pièce phare, ses couleurs, comment la porter), justifié par sa personnalité ; la figurine A négocie un détail, puis adopte le look. Jamais un mot sur le corps, la taille ou l'âge ; aucune marque",
      action: { texte: "👗 L’essayer sur moi", onglet: "experience" },
      visuel: "tenue",
    };
  if (branche === "lunetier")
    return {
      cle: "lunettes",
      emoji: "👓",
      nom: "Les lunettes qui te ressemblent",
      propose: "des lunettes",
      consigne: "la figurine de l'opticien propose à la figurine A UNE monture précise (forme, couleur, matière), justifiée par sa personnalité ; elles en rient, la figurine A les adopte. Rien sur la vue ni la santé ; aucune marque",
      action: { texte: "👓 Les essayer sur moi", onglet: "experience" },
      visuel: "lunettes",
    };
  if (branche === "restaurant")
    return {
      cle: "menu",
      emoji: "🍽️",
      nom: "Le menu du jour",
      propose: "un menu",
      consigne:
        "elles composent ensemble LE menu de la figurine A (une entrée, un plat, un dessert), d'après ses goûts et sa personnalité ; la figurine du restaurant défend ses plats avec gourmandise, la figurine A hésite entre deux, puis choisit. Aucun prix, aucune offre, aucun alcool",
      action: { texte: "🍽️ Voir sa carte", onglet: "carte" },
    };
  if (branche === "bar")
    return {
      cle: "ambiance",
      emoji: "🎶",
      nom: "La soirée qui te ressemble",
      propose: "une soirée",
      consigne: "elles imaginent la soirée idéale de la figurine A dans ce lieu : la musique, le jeu, la table où s'asseoir, la boisson SANS alcool qu'elle commanderait ; aucun prix, aucun alcool",
    };
  if (branche === "fleuriste")
    return {
      cle: "bouquet",
      emoji: "💐",
      nom: "Le bouquet qui te ressemble",
      propose: "un bouquet",
      consigne: "la figurine du fleuriste compose pour la figurine A UN bouquet précis (les fleurs, les couleurs, ce qu'elles disent), justifié par sa personnalité, et elles se demandent à qui elle l'offrirait",
    };
  if (branche === "ongles")
    return {
      cle: "ongles",
      emoji: "💅",
      nom: "Les ongles qui te ressemblent",
      propose: "une manucure",
      consigne: "la figurine du salon propose à la figurine A UNE manucure précise (couleurs, motif), justifiée par sa personnalité ; elles en rient et la figurine A l'adopte",
    };
  if (branche === "librairie")
    return {
      cle: "livre",
      emoji: "📚",
      nom: "Le livre qu'il te faut",
      propose: "un livre",
      consigne: "la figurine du libraire devine le genre de livre et l'histoire qui iraient à la figurine A, d'après sa personnalité, et lui raconte l'histoire en deux mots ; sans citer de titre ni d'auteur",
      action: { texte: "📚 Trouver mon prochain livre", onglet: "experience" },
    };
  if (/tatou|tattoo/.test(m))
    return {
      cle: "tatouage",
      emoji: "🖋️",
      nom: "Le tatouage qui te ressemble",
      propose: "un tatouage",
      consigne:
        "la figurine du tatoueur dessine en mots, pour la figurine A, UN petit motif qui lui ressemble (un symbole de sa personnalité, ce qu'il raconte) et propose de le poser sur l'avant-bras ; la figurine A hésite, puis adore. Rien d'autre sur le corps",
      action: { texte: "🖋️ L’essayer sur moi", onglet: "experience" },
      visuel: "tatouage",
    };
  if (/bijou|joaill|bague|collier|bracelet/.test(m))
    return {
      cle: "bijou",
      emoji: "💍",
      nom: "Le bijou qui te ressemble",
      propose: "un bijou",
      consigne: "la figurine du bijoutier propose à la figurine A UN bijou précis (la pièce, la matière, le détail qui lui ressemble), justifié par sa personnalité ; aucun prix, aucune marque",
      action: { texte: "💍 L’essayer sur moi", onglet: "experience" },
      visuel: "bijou",
    };
  if (/boulang|pâtiss|patiss|chocolat|viennois/.test(m))
    return {
      cle: "gourmandise",
      emoji: "🥐",
      nom: "La gourmandise qui te ressemble",
      propose: "une gourmandise",
      consigne: "la figurine de la boutique devine LA gourmandise qui ressemble à la figurine A (croustillante, fondante, surprenante…) d'après sa personnalité ; elles se disputent gentiment la dernière ; aucun prix",
    };
  return {
    cle: "metier",
    emoji: "🛠️",
    nom: "Les coulisses du métier",
    propose: "un geste du métier",
    consigne: "la figurine du commerçant raconte un geste précis de son métier, avec passion ; la figurine A s'y essaie en imagination, rate drôlement, puis se découvre un petit talent",
  };
}

/** L'épisode chez un commerçant : ce qu'il a proposé (« Un dégradé court… »), et pourquoi (« toi qui… »). */
export const PROPOSITION_MAX = 90;
export const POURQUOI_MAX = 200;
