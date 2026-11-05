/**
 * 🌍 LE RÉSEAU DES FIGURINES — 5 novembre 2026, le patron : « que cette figurine crée une sorte de réseau social
 * indépendant, où ma figurine va faire sa vie, rencontrer des gens, discuter, s'amuser, et je suis spectateur de la
 * façon dont elle a interagi avec des amis, des proches, des inconnus — ce qui me permet de voir les choses
 * différemment, de me réinventer, d'apprendre, de faire de nouvelles rencontres, de m'améliorer ».
 *
 *   · CHAQUE JOUR, UNE RENCONTRE HORS DE SON ENTOURAGE : un commerçant, un membre de sa ville, un personnage… ou Pablito
 *     (« quand il n'y a personne sur l'app » — et pour la toute première). Le sujet suit l'interlocuteur.
 *   · SES AMIS ET PROCHES : des discussions qu'il lance quand il veut (`AMIS_PAR_JOUR` par jour).
 *   · CHAQUE JOUR, UNE CONVERSATION DIFFÉRENTE (« sinon on va se lasser ») : un format du jour (`FORMATS`), choisi par
 *     `choisirFormat` — jamais un des derniers, de préférence un qui lui ressemble (ses caractéristiques).
 *   · ELLE FINIT TOUJOURS PAR UNE CARTE SOUVENIR, et par une question pour lui (« Et toi ? ») : sa réponse — ce qu'il dit
 *     de lui — nourrit les conversations suivantes.
 *
 * DES PERSONNAGES IMAGINAIRES, JAMAIS DE VRAIES PERSONNES : « un politique, un influenceur », oui, mais inventés par
 * ClikMe et dits imaginaires à l'écran — faire parler un vrai élu ou un vrai influenceur, ce serait lui prêter des mots
 * qu'il n'a pas dits. L'élue de quartier ne parle jamais de partis, d'élections ni de vote.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

/** Ses amis et proches : combien de discussions il peut lancer par jour (chacune est écrite par l'IA). */
export const AMIS_PAR_JOUR = 3;

export const PERSONNAGES = [
  {
    cle: "pablito",
    gouts: [],
    nom: "Pablito",
    emoji: "🧑",
    role: "la figurine du patron de ClikMe",
    sujet: "la vie des figurines, ClikMe, et l'art de s'amuser de tout",
    facon: "drôle, accueillant, un peu farceur ; il adore les grimaces",
    accroche: "Bienvenue dans le monde des figurines ! Ici, on rencontre du monde, on rit, on apprend.",
  },
  {
    cle: "mado",
    gouts: ["sorties", "animaux", "bricolage"],
    nom: "Mado",
    emoji: "🏡",
    role: "élue de quartier (imaginaire)",
    sujet: "la vie du quartier : la fête des voisins, le marché, les idées pour rendre la rue plus sympa — JAMAIS de partis, d'élections, de vote ni d'opinion politique",
    facon: "chaleureuse, pleine d'idées, elle connaît tout le monde",
    accroche: "Moi, mon truc, c'est le quartier : la fête des voisins, le marché, les bancs au soleil.",
  },
  {
    cle: "leo",
    gouts: ["cuisine", "mode", "sorties"],
    nom: "Léo",
    emoji: "📸",
    role: "influenceur (imaginaire)",
    sujet: "les bons petits plats, les tendances, et la vraie vie derrière les écrans",
    facon: "enthousiaste, des mots d'aujourd'hui, toujours un défi photo à proposer",
    accroche: "Hello ! Moi je partage les bons plans… mais la vraie vie, c'est hors de l'écran, hein.",
  },
  {
    cle: "suzie",
    gouts: ["sport", "nature"],
    nom: "Suzie",
    emoji: "🏃",
    role: "coach sportive (imaginaire)",
    sujet: "bouger, se motiver, les petits défis du quotidien",
    facon: "énergique, encourageante, jamais culpabilisante",
    accroche: "Salut ! Petit échauffement de la bonne humeur, et c'est parti.",
  },
  {
    cle: "gaston",
    gouts: ["lecture", "bricolage", "jeux"],
    nom: "Gaston",
    emoji: "👴",
    role: "grand-père conteur (imaginaire)",
    sujet: "les histoires d'autrefois, les leçons de la vie, la patience",
    facon: "lent, malicieux, plein de proverbes qu'il invente",
    accroche: "Assieds-toi, petite figurine. J'ai une histoire, et elle finit bien.",
  },
  {
    cle: "nina",
    gouts: ["musique", "cinema", "mode"],
    nom: "Nina",
    emoji: "🎨",
    role: "artiste de rue (imaginaire)",
    sujet: "la créativité, oser, voir la beauté partout",
    facon: "rêveuse, poétique, pleine d'images",
    accroche: "Tu vois ce mur gris ? Moi j'y vois déjà un arc-en-ciel.",
  },
  {
    cle: "pistache",
    gouts: ["lecture", "nature", "animaux"],
    nom: "Professeur Pistache",
    emoji: "🔬",
    role: "scientifique farfelu (imaginaire)",
    sujet: "les curiosités du monde, les « le saviez-vous ? », les petites expériences",
    facon: "passionné, un peu distrait, il adore les questions",
    accroche: "Le saviez-vous ? Une question par jour rend plus curieux. Je viens de l'inventer.",
  },
  {
    cle: "lou",
    gouts: ["voyages", "nature", "sport"],
    nom: "Capitaine Lou",
    emoji: "🧭",
    role: "exploratrice (imaginaire)",
    sujet: "l'aventure, sortir de sa zone de confort, les découvertes près de chez soi",
    facon: "intrépide, drôle, elle raconte ses expéditions",
    accroche: "L'aventure commence au coin de la rue. La preuve : je suis là.",
  },
  {
    cle: "rosa",
    gouts: ["cuisine", "voyages"],
    nom: "Rosa",
    emoji: "🍲",
    role: "cheffe cuisinière (imaginaire)",
    sujet: "les goûts, les recettes de famille, le plaisir de partager un repas",
    facon: "généreuse, gourmande, elle parle avec les mains",
    accroche: "Viens, goûte ! Chez moi, personne ne repart le ventre vide.",
  },
  {
    cle: "max",
    gouts: ["jeux", "cinema", "musique"],
    nom: "Max",
    emoji: "🎮",
    role: "joueur passionné (imaginaire)",
    sujet: "les jeux, la stratégie, l'esprit d'équipe, perdre avec le sourire",
    facon: "taquin, compétitif mais beau joueur",
    accroche: "Partie rapide ? Le perdant fait une grimace. Je suis déjà prêt.",
  },
] as const;
export type ClePersonnage = (typeof PERSONNAGES)[number]["cle"];
export const personnageDe = (cle: unknown) => PERSONNAGES.find((p) => p.cle === cle) ?? null;

/**
 * 🎲 LES FORMATS : ce qui rend chaque conversation différente. `affinites` : les caractéristiques de sa carte qui le
 * rendent plus probable (un audacieux reçoit plus souvent un défi, un curieux une découverte). `ouverture`, `reponse`,
 * `partage`, `question` : sans l'IA, la conversation composée suit quand même le format.
 */
export const FORMATS = [
  {
    cle: "defi",
    nom: "Le défi",
    consigne: "elles se lancent un petit défi amusant, faisable dans la journée",
    affinites: ["audace", "humour"],
    ouverture: "Je te lance un défi : faire un compliment à un inconnu avant ce soir !",
    reponse: "Défi accepté… et toi, tu en fais deux. Ha !",
    partage: "Le défi du jour : un compliment à un inconnu avant ce soir.",
    question: "Et toi, quel petit défi te lancerais-tu aujourd’hui ?",
  },
  {
    cle: "plutot",
    nom: "Plutôt ceci ou cela ?",
    consigne: "elles jouent à « plutôt ceci ou cela ? » et défendent leurs choix avec humour",
    affinites: ["mauvaiseFoi", "humour"],
    ouverture: "Plutôt pizza froide au petit-déjeuner, ou soupe brûlante en plein été ?",
    reponse: "Pizza froide, sans hésiter. Et je défends mon choix jusqu’au bout !",
    partage: "Le grand débat : pizza froide au petit-déjeuner ou soupe en plein été.",
    question: "Et toi : plutôt pizza froide au petit-déjeuner, ou soupe brûlante en plein été ?",
  },
  {
    cle: "et-si",
    nom: "Et si… ?",
    consigne: "elles imaginent une situation folle (« et si demain… ? ») et ce qu'elles feraient",
    affinites: ["curiosite", "audace"],
    ouverture: "Et si demain, les figurines pouvaient voler ? Tu irais où ?",
    reponse: "Au-dessus du marché, pour tout voir d’en haut ! Et après, la mer.",
    partage: "Et si… les figurines pouvaient voler ? Chacune a dit où elle irait.",
    question: "Et toi, si tu pouvais voler demain, tu irais où ?",
  },
  {
    cle: "conseil",
    nom: "Le conseil",
    consigne: "elles s'échangent un conseil utile et bienveillant pour la semaine",
    affinites: ["fidelite"],
    ouverture: "Un conseil pour ta semaine : un petit plaisir chaque jour, même minuscule.",
    reponse: "Noté ! Le mien : dire merci plus souvent. Ça change tout.",
    partage: "Les conseils échangés : un petit plaisir chaque jour, et dire merci plus souvent.",
    question: "Et toi, quel conseil donnerais-tu à un ami cette semaine ?",
  },
  {
    cle: "decouverte",
    nom: "La découverte",
    consigne: "l'une apprend à l'autre quelque chose de vrai et de surprenant",
    affinites: ["curiosite"],
    ouverture: "Tu savais que les pieuvres ont trois cœurs ?",
    reponse: "Trois ?! Moi qui ai déjà du mal à suivre avec un seul !",
    partage: "Une découverte : les pieuvres ont trois cœurs.",
    question: "Et toi, qu’as-tu découvert de surprenant ces derniers temps ?",
  },
  {
    cle: "reve",
    nom: "Le grand rêve",
    consigne: "elles parlent d'un rêve ou d'un projet, et de la première petite étape pour s'en approcher",
    affinites: ["audace", "chance"],
    ouverture: "Mon grand rêve ? Organiser la plus belle fête de quartier du monde.",
    reponse: "J’adore ! Première petite étape : en parler à tes voisins cette semaine.",
    partage: "Un grand rêve, et sa première petite étape.",
    question: "Et toi, quel est ton grand rêve… et ta première petite étape ?",
  },
  {
    cle: "quiz",
    nom: "Le quiz",
    consigne: "l'une pose trois questions-surprises à l'autre, avec des réponses drôles",
    affinites: ["curiosite", "mauvaiseFoi"],
    ouverture: "Question-surprise : combien de pattes a une araignée ?",
    reponse: "Huit ! Et autant de chaussettes à trouver chaque matin, la pauvre.",
    partage: "Le quiz du jour : l’araignée, ses huit pattes… et ses chaussettes.",
    question: "Et toi, quelle question-surprise poserais-tu à un ami ?",
  },
  {
    cle: "mission",
    nom: "La mission secrète",
    consigne: "elles inventent une mission secrète et gentille à accomplir dans le quartier",
    affinites: ["audace", "chance"],
    ouverture: "Mission secrète : laisser un petit mot gentil quelque part dans le quartier.",
    reponse: "Mission acceptée. Personne ne saura que c’était nous !",
    partage: "La mission secrète : un petit mot gentil, quelque part dans le quartier.",
    question: "Et toi, quelle mission secrète et gentille ferais-tu dans ton quartier ?",
  },
  {
    cle: "compliment",
    nom: "Le compliment",
    consigne: "elles se disent sincèrement ce qu'elles admirent l'une chez l'autre",
    affinites: ["fidelite"],
    ouverture: "Je vais te dire un truc : j’admire ta bonne humeur.",
    reponse: "Oh, ça me touche ! Moi, j’admire ta curiosité.",
    partage: "Deux compliments sincères, échangés de bon cœur.",
    question: "Et toi, qu’admires-tu chez un de tes proches ?",
  },
  {
    cle: "petit-pas",
    nom: "Le petit pas",
    consigne: "elles cherchent une petite habitude à changer pour se sentir mieux, et se motivent",
    affinites: ["fidelite", "audace"],
    ouverture: "Moi, je voudrais ranger un peu chaque soir. Un petit pas !",
    reponse: "Bonne idée ! Moi, appeler un proche chaque semaine. On se motive ?",
    partage: "Un petit pas chacun : ranger un peu chaque soir, appeler un proche.",
    question: "Et toi, quelle petite habitude aimerais-tu changer ?",
  },
] as const;
export type CleFormat = (typeof FORMATS)[number]["cle"];
export const formatDe = (cle: unknown) => FORMATS.find((f) => f.cle === cle) ?? null;

/** Un nombre de 0 à 1, toujours le même pour la même graine (le même jour, le même habitant : le même choix). */
export function hasard(graine: string): number {
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * LE FORMAT DU JOUR : pas un de ses 6 derniers ; parmi les autres, celui qui lui ressemble le plus (ses caractéristiques
 * sur les affinités du format), avec une part de hasard pour qu'il soit surpris.
 */
export function choisirFormat(deja: readonly string[], valeurs: Partial<Record<string, number>>, graine: string): (typeof FORMATS)[number] {
  const recents = new Set(deja.slice(-6));
  const possibles = FORMATS.filter((f) => !recents.has(f.cle));
  const liste = possibles.length ? possibles : [...FORMATS];
  let meilleur = liste[0];
  let note = -1;
  for (const f of liste) {
    const affinite = f.affinites.reduce((n, c) => n + (Number(valeurs[c]) || 50), 0) / f.affinites.length;
    const n = affinite + 60 * hasard(`${graine}|${f.cle}`);
    if (n > note) {
      note = n;
      meilleur = f;
    }
  }
  return meilleur;
}

/**
 * LE PERSONNAGE DU JOUR : celui qu'il a vu il y a le plus longtemps (ou jamais) — Pablito, seulement quand il les a
 * tous vus ; à égalité, celui qui partage ses goûts (Rosa pour la cuisine, Suzie pour le sport…), puis le hasard (le
 * même pour lui : chacun ne les découvre pas dans le même ordre). `vuLe` : le jour où il l'a vu (« » : jamais).
 */
export function choisirPersonnage(vuLe: (cle: string) => string, gouts: readonly string[], graine: string): (typeof PERSONNAGES)[number] {
  const quand = (p: (typeof PERSONNAGES)[number]) => vuLe(p.cle) || (p.cle === "pablito" ? "0" : "");
  const note = (p: (typeof PERSONNAGES)[number]) => (p.gouts as readonly string[]).filter((g) => gouts.includes(g)).length + hasard(`${graine}|${p.cle}`);
  return [...PERSONNAGES].sort((x, y) => quand(x).localeCompare(quand(y)) || note(y) - note(x))[0];
}

/** Sa réponse à la question de fin (« Et toi ? ») : 300 caractères au plus. */
export const REPONSE_MAX = 300;
