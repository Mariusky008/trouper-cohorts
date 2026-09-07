// ⚔️ BATTLE — LE SPORT SOCIAL DE L'ARGUMENTATION
//
// ⚠️ MAQUETTE DE CONCEPT. Ce fichier alimente UNE page, `/battle`, faite pour
// être montrée de la main à la main. Elle se joue comme si tout existait —
// c'est le seul moyen d'obtenir une réaction utile — et elle est en `noindex`
// pour que personne ne tombe dessus par hasard.
//
// ─── CE QUI N'EXISTE PAS, ET QUI EST MIS EN SCÈNE ──────────────────────────
//
//   · la reconnaissance vocale : rien n'est enregistré, rien n'est transcrit.
//     L'onde qui bat pendant qu'on parle est une animation, et elle ne mesure
//     RIEN. C'est le mensonge le plus gros de cette maquette, et c'est celui
//     qu'il faut lever en premier dans le vrai produit ;
//   · l'arbitrage : les notes sont écrites ici, pas calculées par un modèle ;
//   · l'appariement : l'adversaire est tiré d'une liste de six, il n'y a pas
//     de file d'attente ni d'Elo ;
//   · le paiement des 0,99 € : le bouton ouvre l'analyse, il n'encaisse rien ;
//   · le classement : il ne bouge pas, sauf pour y faire entrer la partie
//     qu'on vient de jouer.
//
// ─── CE QUI EST VRAI, ET QUI EST LE SUJET DE L'ESSAI ───────────────────────
//
// La BOUCLE. Chercher un adversaire, accepter un sujet, parler trois minutes
// chacun, voir un verdict motivé, et avoir envie de cliquer sur REVANCHE.
// C'est la seule chose que cette page doit permettre de juger.
//
// ─── LE POINT DE FOND, ET IL DÉCIDE DU RESTE ───────────────────────────────
//
// UNE IA NE PEUT PAS ARBITRER « LA VÉRITÉ ». Sur « je préfère Nolan à
// Spielberg », il n'y a rien à vérifier ; sur « Spielberg a réalisé quatorze
// films avant 1980 », il y a un fait. Les deux ne se notent donc pas de la
// même façon, et les mélanger dans une note unique fabrique un arbitre qu'on
// prend en défaut au premier match — c'est-à-dire un arbitre mort.
//
// La grille sépare donc formellement CE QUI SE JUGE (la logique, la structure,
// la réfutation, la clarté) de CE QUI SE VÉRIFIE (l'exactitude factuelle), et
// le verdict le dit à l'écran. Quand un point n'est ni l'un ni l'autre, elle
// l'écrit aussi : « ce point n'a pas pu être tranché objectivement » est une
// réponse honnête, et c'est ce qui rend le reste crédible.

/** Un joueur, tel qu'il apparaît partout : sa carte est son identité. */
export type Joueur = {
  id: string;
  prenom: string;
  /**
   * L'ELO, PAS LE NOMBRE DE VICTOIRES.
   *
   * Un classement au nombre de victoires se farme : on défie des débutants et
   * on monte. Un Elo ne récompense que ce qui a coûté quelque chose — battre
   * plus fort que soi rapporte, battre plus faible ne rapporte presque rien.
   * C'est la seule mécanique connue qui tienne dans la durée, et elle est
   * empruntée aux échecs pour cette raison-là.
   */
  score: number;
  battles: number;
  victoires: number;
  /** La série en cours. Elle vaut plus que le total : c'est elle qui fait rejouer. */
  serie: number;
  /** Son taux de victoire par thème — voir `THEMES`. */
  fort: { theme: string; part: number }[];
  couleur: "rouge" | "bleu";
  /** Absent chez les humains : c'est ce qui distingue un entraînement. */
  robot?: { style: string; explique: string };
};

export const THEMES = [
  { cle: "societe", nom: "Société", emoji: "🏛️" },
  { cle: "ia", nom: "Intelligence artificielle", emoji: "🤖" },
  { cle: "philo", nom: "Philosophie", emoji: "🧠" },
  { cle: "sport", nom: "Sport", emoji: "⚽" },
  { cle: "cinema", nom: "Cinéma", emoji: "🎬" },
  { cle: "travail", nom: "Travail", emoji: "💼" },
  { cle: "ecole", nom: "École", emoji: "🎒" },
  { cle: "science", nom: "Science", emoji: "🔬" },
] as const;

export type CleTheme = (typeof THEMES)[number]["cle"];

/**
 * ═══ LES FORMATS, COMPTÉS EN TOURS ET PAS EN ROUNDS ═══
 *
 * DÉFAUT RAPPORTÉ, ET IL RENDAIT LE JEU INJOUABLE : « ça nous redemande de
 * parler trois minutes indéfiniment ». Ce n'était pas une boucle — c'était
 * l'arithmétique. Trois rounds veulent dire SIX prises de parole, et six fois
 * trois minutes font DIX-HUIT MINUTES de parole d'affilée. Personne ne tient,
 * et au quatrième tour on croit que le match est cassé.
 *
 * QUATRE TOURS, ET C'EST LE MINIMUM D'UN VRAI ÉCHANGE : A ouvre, B répond, A
 * réplique, B conclut. En dessous il n'y a pas de débat, il y a deux monologues
 * — et au-dessus il n'y a plus de tension, il y a de l'endurance.
 *
 * ET C'EST LA DURÉE TOTALE QU'ON MONTRE, pas le temps par tour. « 3 minutes
 * chacun » ne dit rien de ce qu'on s'engage à faire ; « 6 minutes en tout » le
 * dit exactement. C'est le seul chiffre qu'on regarde avant d'accepter une
 * partie, aux échecs comme ici.
 *
 * LE TEMPS RESTE LE GARDE-FOU CONTRE LA TRICHE. Sur un format long, certains
 * liront un texte préparé à côté — on ne peut pas l'empêcher, on peut rendre ça
 * inutile. Trente secondes en direct ne se lisent pas : ça se pense.
 */
export const FORMATS = [
  { cle: "blitz", nom: "Blitz", duree: 30, tours: 4, emoji: "⚡",
    quoi: "30 secondes par tour. Pas le temps de lire une fiche." },
  { cle: "classic", nom: "Classic", duree: 90, tours: 4, emoji: "⚔️",
    quoi: "1 min 30 par tour. Le format de référence." },
  { cle: "expert", nom: "Expert", duree: 180, tours: 4, emoji: "🎓",
    quoi: "3 minutes par tour. Pour ceux qui construisent." },
  { cle: "roast", nom: "Roast", duree: 45, tours: 4, emoji: "🔥",
    quoi: "45 secondes, sujet volontairement provocateur." },
] as const;

/** La durée totale d'un match, écrite comme on l'annonce : « 6 min ». */
export function dureeTotale(duree: number, tours: number): string {
  const s = duree * tours;
  return s < 120 ? `${s} s` : `${Math.round(s / 60)} min`;
}

export type CleFormat = (typeof FORMATS)[number]["cle"];

export type Sujet = { id: string; theme: CleTheme; question: string };

export const SUJETS: Sujet[] = [
  { id: "s1", theme: "ia", question: "L'intelligence artificielle va-t-elle supprimer plus d'emplois qu'elle n'en créera ?" },
  { id: "s2", theme: "ecole", question: "Faut-il interdire les téléphones à l'école jusqu'au lycée ?" },
  { id: "s3", theme: "travail", question: "La semaine de quatre jours est-elle une bonne idée pour tout le monde ?" },
  { id: "s4", theme: "societe", question: "Les réseaux sociaux nous rendent-ils plus seuls ?" },
  { id: "s5", theme: "philo", question: "Peut-on être libre sans être responsable ?" },
  { id: "s6", theme: "sport", question: "Le sport de haut niveau est-il compatible avec la santé ?" },
  { id: "s7", theme: "cinema", question: "Un film peut-il être un chef-d'œuvre s'il ennuie tout le monde ?" },
  { id: "s8", theme: "science", question: "Faut-il financer l'exploration spatiale avant les océans ?" },
  { id: "s9", theme: "societe", question: "La voiture individuelle a-t-elle encore sa place en ville ?" },
  { id: "s10", theme: "travail", question: "Le télétravail abîme-t-il plus les équipes qu'il ne les aide ?" },
];

export const MOI: Joueur = {
  id: "moi",
  prenom: "Vous",
  score: 1284,
  battles: 128,
  victoires: 74,
  serie: 7,
  couleur: "bleu",
  fort: [
    { theme: "philo", part: 82 },
    { theme: "ia", part: 76 },
    { theme: "sport", part: 71 },
    { theme: "travail", part: 63 },
  ],
};

export const ADVERSAIRES: Joueur[] = [
  { id: "emma", prenom: "Emma", score: 742, battles: 61, victoires: 33, serie: 2, couleur: "rouge",
    fort: [{ theme: "societe", part: 74 }, { theme: "cinema", part: 68 }] },
  { id: "thomas", prenom: "Thomas", score: 1842, battles: 214, victoires: 158, serie: 4, couleur: "rouge",
    fort: [{ theme: "ia", part: 88 }, { theme: "science", part: 79 }] },
  { id: "sarah", prenom: "Sarah", score: 1801, battles: 190, victoires: 138, serie: 8, couleur: "rouge",
    fort: [{ theme: "philo", part: 84 }, { theme: "societe", part: 77 }] },
  { id: "lucas", prenom: "Lucas", score: 1744, battles: 176, victoires: 122, serie: 1, couleur: "rouge",
    fort: [{ theme: "travail", part: 81 }, { theme: "sport", part: 70 }] },
  { id: "nadia", prenom: "Nadia", score: 1310, battles: 98, victoires: 57, serie: 3, couleur: "rouge",
    fort: [{ theme: "ecole", part: 79 }, { theme: "societe", part: 66 }] },
  { id: "marc", prenom: "Marc", score: 1198, battles: 143, victoires: 71, serie: 0, couleur: "rouge",
    fort: [{ theme: "cinema", part: 72 }, { theme: "philo", part: 61 }] },
];

/**
 * LES TROIS ROBOTS D'ENTRAÎNEMENT.
 *
 * ═══ ILS NE SONT PAS UN CONFORT, ILS SONT LA PORTE D'ENTRÉE ═══
 *
 * Un jeu à deux en direct a un problème que rien d'autre n'a : le premier
 * joueur n'a personne en face. Un classement vide, une file d'attente vide, et
 * la personne referme. Les robots règlent ça — on peut jouer la première
 * battle dans les dix secondes qui suivent l'installation, sans attendre
 * personne, et arriver devant un humain en sachant déjà à quoi ça ressemble.
 *
 * ILS ONT DES STYLES, PAS SEULEMENT DES NIVEAUX. « Battre un robot 1200 » ne
 * dit rien ; « tenir face au Fact-checker » apprend quelque chose. C'est aussi
 * ce qui rend l'entraînement rejouable, ce qu'un simple curseur de difficulté
 * ne fait jamais.
 */
export const ROBOTS: Joueur[] = [
  { id: "r-socrate", prenom: "Socrate", score: 1200, battles: 0, victoires: 0, serie: 0, couleur: "rouge",
    fort: [{ theme: "philo", part: 90 }],
    robot: { style: "Le questionneur",
      explique: "Il ne vous contredit jamais. Il vous pose la question qui fait tomber votre propre argument." } },
  { id: "r-fact", prenom: "Vérif", score: 1500, battles: 0, victoires: 0, serie: 0, couleur: "rouge",
    fort: [{ theme: "science", part: 92 }],
    robot: { style: "Le fact-checker",
      explique: "Il attend le premier chiffre que vous lâchez, et il le vérifie. Excellent pour apprendre à ne dire que ce qu'on sait." } },
  { id: "r-provoc", prenom: "Brasier", score: 900, battles: 0, victoires: 0, serie: 0, couleur: "rouge",
    fort: [{ theme: "societe", part: 70 }],
    robot: { style: "Le provocateur",
      explique: "Il cherche à vous faire sortir de vos gonds. Utile : on perd surtout quand on s'énerve." } },
];

/**
 * ═══ LA GRILLE D'ARBITRAGE ═══
 *
 * CINQ CRITÈRES, ET LE DERNIER N'EST PAS COMME LES AUTRES.
 *
 * Les quatre premiers jugent une PERFORMANCE : la façon dont on construit, dont
 * on répond, dont on reste dans le sujet, dont on convainc. Ils s'appliquent à
 * tout, y compris à une opinion pure — on peut très bien défendre « je préfère
 * Nolan » avec une structure impeccable ou avec un sophisme.
 *
 * LE CINQUIÈME VÉRIFIE UN FAIT, et il ne s'applique que là où il y a un fait.
 * C'est pour ça qu'il peut être ABSENT d'une battle entière, et que l'écran
 * doit alors le dire au lieu de mettre une note au hasard. Un arbitre qui note
 * l'exactitude d'une préférence est un arbitre qu'on n'écoute plus.
 */
export const CRITERES = [
  { cle: "arguments", nom: "Arguments", quoi: "Ce qui est avancé, et ce qui le soutient." },
  { cle: "refutation", nom: "Réfutation", quoi: "A-t-il répondu aux points précis de l'autre ?" },
  { cle: "pertinence", nom: "Pertinence", quoi: "Est-on resté sur la question posée ?" },
  { cle: "clarte", nom: "Clarté", quoi: "Se suit-on sans effort ?" },
  { cle: "exactitude", nom: "Exactitude", quoi: "Les faits vérifiables sont-ils justes ?" },
] as const;

export type CleCritere = (typeof CRITERES)[number]["cle"];

/** Une note par critère. `undefined` sur l'exactitude : rien n'était vérifiable. */
export type Notes = Partial<Record<CleCritere, number>>;

export type Releve = {
  /** Le prénom concerné. */
  qui: string;
  /** « faute » : une erreur factuelle. « sophisme » : une faute de logique. */
  genre: "faute" | "sophisme" | "fort" | "hors";
  quoi: string;
};

/**
 * CE QUE L'ARBITRE RÉPOND, ET CE QU'IL FAUT PAYER POUR LIRE.
 *
 * ON NE FAIT JAMAIS PAYER LE RÉSULTAT. Le vainqueur, les notes et le total
 * sont gratuits, toujours : faire payer le score transformerait le jeu en
 * péage, et personne ne rejoue pour découvrir s'il a gagné.
 *
 * ON FAIT PAYER LE POURQUOI. « Thomas l'emporte parce qu'il a démonté votre
 * deuxième argument sans jamais nier le premier » est la seule chose qui fait
 * PROGRESSER, et c'est donc la seule qui ait une valeur qu'on accepte de
 * payer. La différence entre les deux est tout le modèle.
 */
export type Arbitrage = {
  notes: Record<string, Notes>;
  /** Le vainqueur, par identifiant. */
  vainqueur: string;
  /** Ce que tout le monde voit — une phrase, pas une analyse. */
  verdict: string;
  /** Ce que l'analyse complète ajoute. */
  analyse: string[];
  releves: Releve[];
  /** Vrai quand la question ne portait aucun fait vérifiable. */
  sansFait: boolean;
};

export function total(n: Notes): number {
  const v = Object.values(n).filter((x): x is number => typeof x === "number");
  if (!v.length) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

/**
 * LE CLASSEMENT.
 *
 * Il est écrit, pas calculé — mais la ligne du joueur y est insérée à sa place
 * réelle, sinon la maquette mentirait sur la seule chose qu'elle promet de
 * montrer : où l'on se situe.
 */
export const CLASSEMENT: Joueur[] = [...ADVERSAIRES]
  .concat([
    { id: "chloe", prenom: "Chloé", score: 1655, battles: 160, victoires: 108, serie: 2, couleur: "rouge", fort: [] },
    { id: "karim", prenom: "Karim", score: 1502, battles: 121, victoires: 76, serie: 5, couleur: "rouge", fort: [] },
    { id: "ines", prenom: "Inès", score: 1421, battles: 104, victoires: 63, serie: 0, couleur: "rouge", fort: [] },
    { id: "paul", prenom: "Paul", score: 1102, battles: 88, victoires: 41, serie: 0, couleur: "rouge", fort: [] },
  ])
  .sort((a, b) => b.score - a.score);

/**
 * ═══ CE QUE L'ARBITRE DIT DE CETTE BATTLE-LÀ ═══
 *
 * Écrit à la main, un par sujet, parce qu'un verdict générique se repère en
 * une lecture — et qu'un arbitre qu'on ne croit pas ne sert à rien. Deux des
 * trois portent un fait vérifiable ; le troisième n'en porte aucun, et c'est
 * exprès : c'est le cas que la grille doit savoir traiter.
 */
export const ARBITRAGES: Record<string, (moi: string, lui: string) => Arbitrage> = {
  s1: (moi, lui) => ({
    notes: {
      [moi]: { arguments: 87, refutation: 82, pertinence: 91, clarte: 84, exactitude: 74 },
      [lui]: { arguments: 79, refutation: 71, pertinence: 83, clarte: 80, exactitude: 91 },
    },
    vainqueur: moi,
    verdict: "Vous l'emportez sur la réfutation : vous avez répondu à ses trois points, il n'a répondu qu'à un des vôtres.",
    analyse: [
      "Votre deuxième argument — la création d'emplois indirects — a été posé puis SOUTENU par un exemple précis, ce qui le rend difficile à écarter d'un mot. C'est ce qui vous vaut vos 87 en argumentation.",
      "Votre point faible est ailleurs : vous avez avancé un chiffre de destruction d'emplois sans dire d'où il venait, et il est contestable. C'est ce qui fait tomber votre exactitude à 74 alors que le reste est au-dessus de 80.",
      "Lui a été le plus exact des deux — 91 — mais il a passé son dernier tour à défendre un point que vous n'attaquiez plus. La pertinence en souffre, et surtout la réfutation : sur trois de vos arguments, deux sont restés sans réponse.",
      "Ce qui aurait renversé la battle : reprendre votre chiffre en disant simplement d'où il sort. Il ne vous restait rien d'autre à faire.",
    ],
    releves: [
      { qui: lui, genre: "fort", quoi: "A cité une source vérifiable sur le taux d'automatisation." },
      { qui: moi, genre: "faute", quoi: "Le chiffre de « 40 % des métiers » ne correspond à aucune étude identifiable sous cette forme." },
      { qui: lui, genre: "hors", quoi: "Le dernier tour porte sur un point qui n'était plus contesté." },
    ],
    sansFait: false,
  }),
  s2: (moi, lui) => ({
    notes: {
      [moi]: { arguments: 78, refutation: 69, pertinence: 88, clarte: 86, exactitude: 81 },
      [lui]: { arguments: 84, refutation: 88, pertinence: 79, clarte: 74, exactitude: 83 },
    },
    vainqueur: lui,
    verdict: "Il l'emporte de peu : vous étiez plus clair, il a mieux répondu. Sur ce format, répondre pèse plus que bien dire.",
    analyse: [
      "Vous ouvrez mieux que lui : votre premier tour pose la question de l'âge plutôt que celle de l'interdiction, ce qui déplace le terrain à votre avantage. La pertinence et la clarté vous reviennent nettement.",
      "Mais il a fait la seule chose qui compte au round 2 : il a repris VOTRE distinction et l'a retournée. Une réfutation qui utilise le cadre de l'adversaire vaut plus que trois arguments neufs, et la grille le note ainsi.",
      "Vous avez laissé passer son analogie avec la cigarette sans la discuter. C'était le point faible de son tour — une analogie n'est pas un argument — et il est resté debout jusqu'à la fin.",
      "Ce qui aurait renversé la battle : dire à voix haute que l'analogie n'en est pas une. Dix secondes auraient suffi.",
    ],
    releves: [
      { qui: lui, genre: "sophisme", quoi: "Analogie non justifiée entre le téléphone et le tabac — jamais relevée." },
      { qui: moi, genre: "fort", quoi: "Distinction nette entre interdire l'objet et encadrer l'usage." },
    ],
    sansFait: false,
  }),
  s7: (moi, lui) => ({
    notes: {
      [moi]: { arguments: 81, refutation: 77, pertinence: 85, clarte: 90 },
      [lui]: { arguments: 86, refutation: 74, pertinence: 82, clarte: 79 },
    },
    vainqueur: moi,
    verdict: "Vous l'emportez sur la clarté. Aucune note d'exactitude : la question ne portait aucun fait vérifiable.",
    analyse: [
      "Cette battle est le cas que l'arbitrage doit savoir traiter. « Un film peut-il être un chef-d'œuvre s'il ennuie » ne contient AUCUNE affirmation vérifiable : il n'y a rien à confirmer ni à démentir. Mettre une note d'exactitude ici aurait été inventer une mesure.",
      "Le reste se juge très bien pour autant. Il construit mieux que vous — son idée du chef-d'œuvre comme objet historique plutôt que comme expérience est plus solide que la vôtre.",
      "Mais il l'énonce mal : deux de ses trois tours partent dans une parenthèse dont il ne revient pas. On perd le fil, et un argument qu'on ne suit pas ne convainc pas, même juste.",
      "Vous gagnez donc en disant moins, mais en le disant de façon qu'on puisse le répéter. C'est une victoire d'orateur, pas de penseur — et l'analyse le dit plutôt que de vous laisser croire le contraire.",
    ],
    releves: [
      { qui: lui, genre: "fort", quoi: "Distingue la valeur historique de la valeur ressentie." },
      { qui: lui, genre: "hors", quoi: "Deux digressions non refermées." },
    ],
    sansFait: true,
  }),
};

/**
 * ═══ LES SEULS SUJETS QU'ON PROPOSE DANS LA MAQUETTE ═══
 *
 * DÉFAUT MESURÉ À L'ÉCRAN, ET IL SAUTAIT AUX YEUX : le tirage prenait un sujet
 * parmi les dix, et le repli servait l'arbitrage de « l'IA va-t-elle supprimer
 * des emplois » — si bien qu'après un débat sur la voiture en ville, le verdict
 * parlait de taux d'automatisation. Un arbitre qui commente un autre match est
 * la façon la plus rapide de perdre la personne à qui on montre la page.
 *
 * TROIS SUJETS QUI TIENNENT VALENT MIEUX QUE DIX QUI MENTENT. Les sept autres
 * restent dans `SUJETS` — ils servent à montrer l'étendue des thèmes dans la
 * liste — mais on ne les tire pas tant que leur arbitrage n'est pas écrit.
 * C'est la même règle que partout ici : la maquette met en scène, elle ne
 * raconte pas n'importe quoi.
 */
export const SUJETS_JOUABLES: Sujet[] = SUJETS.filter((s) => s.id in ARBITRAGES);

/** L'arbitrage d'un sujet. Le repli n'existe que pour satisfaire le type. */
export function arbitrer(sujet: Sujet, moi: string, lui: string): Arbitrage {
  const ecrit = ARBITRAGES[sujet.id];
  if (ecrit) return ecrit(moi, lui);
  return ARBITRAGES.s1(moi, lui);
}
