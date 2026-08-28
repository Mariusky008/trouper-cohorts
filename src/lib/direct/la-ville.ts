// LA VILLE — CE QUE LES HABITANTS DISENT DE CE QUI SE PASSE ICI, MAINTENANT.
//
// LA TROISIÈME BRIQUE, ET LA DERNIÈRE. Chacune a une fonction, et une seule :
//   · LE DIRECT  — les acteurs de la ville parlent : commerçants, mairie,
//                  organisateurs. « Voilà ce qui se passe chez moi. »
//   · LA VILLE   — les habitants parlent. « Voilà ce que je vois, ce que je
//                  vis, ce que je cherche. »
//   · LES SALONS — les habitants vivent quelque chose ensemble.
//
// CE QUE CE FICHIER REFUSE D'ÊTRE, ET POURQUOI C'EST TOUT LE SUJET. Un forum
// local, c'est-à-dire un Facebook de quartier : des publications qui
// s'empilent, se commentent, se disputent, et restent. Trois choix de
// construction l'empêchent, et ils sont dans le code, pas dans une charte que
// personne ne lit :
//
//  1. TOUT DISPARAÎT. Un message vit quelques heures et s'efface — pour de
//     bon, `purger()` le supprime du stockage. On n'archive pas, on ne
//     « masque » pas. Quand on ouvre à 12 h 15, on ne voit pas hier.
//  2. ON NE PUBLIE PAS, ON DIT QUELQUE CHOSE. Pas de titre, pas de catégorie à
//     choisir, pas de brouillon : une phrase. C'est l'application qui range.
//  3. ON NE PARLE PAS DE TOUT. Un message porte un lieu et une heure, et il
//     s'affiche par distance. Ce qui n'est ni ici ni maintenant n'a pas de
//     place où s'accrocher.
//
// CE QUI PROLONGE LA VIE D'UN MESSAGE : les réponses et les réactions, jamais
// le temps qui passe. Ce que la ville a jugé utile reste un peu plus ; le
// reste s'en va. C'est le seul classement qu'on s'autorise, et il ne dépend
// pas de nous.
//
// L'ANONYMAT EST LE MÊME QUE PARTOUT AILLEURS ICI : un prénom, une initiale,
// une distance. Pas de visage, pas de nom de famille, pas de profil qu'on
// puisse suivre. Voir `apercu-habitant.ts` pour la règle complète.

/** Ce dont un message parle. Fermé : cinq natures, pas une de plus. */
export type NatureVille =
  | "question"
  | "evenement"
  | "bon-plan"
  | "coup-de-coeur"
  | "cherche";

export const NATURES: Record<
  NatureVille,
  { label: string; emoji: string; teinte: string }
> = {
  // LES DEUX SEULES COULEURS REPRISES SONT CELLES QUI VEULENT DÉJÀ DIRE ÇA.
  // Le rose est celui des événements de la ville, l'orange celui du coup de
  // pouce à un commerce : les réutiliser ici ne crée pas de sens nouveau, ça
  // confirme l'ancien. Les trois autres natures se distinguent par leur mot et
  // leur emoji — inventer cinq teintes de plus ferait perdre leur sens aux
  // sept qui existent.
  question: { label: "Question", emoji: "❓", teinte: "neutre" },
  evenement: { label: "Événement", emoji: "🎪", teinte: "rose" },
  "bon-plan": { label: "Bon plan", emoji: "💡", teinte: "neutre" },
  "coup-de-coeur": { label: "Coup de cœur", emoji: "❤️", teinte: "orange" },
  // « Cherche » est vert parce qu'il mène à un salon : c'est l'application qui
  // agit, pas une catégorie de plus.
  cherche: { label: "Cherche quelqu'un", emoji: "🙋", teinte: "verte" },
};

export type ReponseVille = {
  id: string;
  qui: string;
  texte: string;
  quand: string;
  /** Le commerçant ou l'organisateur qui répond chez lui. */
  officiel?: string;
};

export type MessageVille = {
  id: string;
  qui: string;
  /** Un repère public, jamais une adresse : « près des Arènes ». */
  ou: string;
  distance: string;
  metres: number;
  texte: string;
  nature: NatureVille;
  /** L'instant de la parole, en millisecondes. C'est lui qui décide de tout. */
  a: number;
  /** Combien de temps il vit, en minutes, avant réponses et réactions. */
  dure: number;
  coeurs: number;
  monCoeur?: boolean;
  reponses: ReponseVille[];
  photo?: string;
  /** Pour un « cherche » : ceux que ça intéresse, et le salon s'il est ouvert. */
  interesses?: string[];
  salon?: string;
};

/** Ce qu'un message gagne à être utile. Voir l'en-tête : le seul classement. */
const BONUS_REPONSE = 45;
const BONUS_COEUR = 6;
const PLAFOND = 12 * 60;

/** Dans combien de minutes ce message s'efface. Négatif : il est déjà parti. */
export function resteMinutes(m: MessageVille, maintenant = Date.now()): number {
  const gagne = m.reponses.length * BONUS_REPONSE + m.coeurs * BONUS_COEUR;
  const vie = Math.min(m.dure + gagne, PLAFOND);
  return Math.round(vie - (maintenant - m.a) / 60_000);
}

/** « il reste 2 h », « il reste 20 min » — jamais un compte à rebours à la seconde. */
export function resteDit(m: MessageVille, maintenant = Date.now()): string {
  const r = resteMinutes(m, maintenant);
  if (r <= 0) return "";
  if (r < 60) return `${r} min`;
  return `${Math.round(r / 60)} h`;
}

/** Depuis combien de temps c'est dit. */
export function ilYA(m: MessageVille, maintenant = Date.now()): string {
  const min = Math.max(0, Math.round((maintenant - m.a) / 60_000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  return `${Math.round(min / 60)} h`;
}

// ─── CE QUE L'APPLICATION COMPREND TOUTE SEULE ─────────────────────────────
//
// « ClikMe comprend automatiquement » — mais ici, sans modèle de langue : des
// mots-clés, et rien d'autre. C'est volontairement pauvre, et c'est pour ça
// que le résultat est MONTRÉ et CORRIGEABLE avant l'envoi. Un rangement
// silencieux qui se trompe est pire qu'une case à cocher : la personne ne
// comprend pas où son message est parti, et n'écrit plus.
//
// En production, ce serait un modèle. La règle de conception ne changerait
// pas : on montre ce qu'on a compris, on laisse corriger d'un appui.

/**
 * L'ORDRE EST L'ALGORITHME. Le premier qui reconnaît gagne, donc les tournures
 * les plus spécifiques passent d'abord.
 *
 * DÉFAUT MESURÉ : « Il reste des huîtres au marché » tombait dans
 * « Événement », parce que le mot « marché » était examiné avant la tournure
 * « il reste ». Or un marché est un lieu autant qu'un événement, tandis que
 * « il reste » ne veut dire qu'une chose. On range donc du plus précis au plus
 * général : chercher quelqu'un, aimer, signaler ce qui reste, puis nommer un
 * type de sortie.
 */
const INDICES: { nature: NatureVille; mots: RegExp }[] = [
  {
    nature: "cherche",
    mots: /\b(quelqu'un (veut|voudrait|serait|cherche|dispo)|qui veut|ça tente|ca tente|je cherche (quelqu'un|des gens)|on se fait|qui vient)\b/i,
  },
  {
    nature: "coup-de-coeur",
    mots: /\b(incroyable|magnifique|excellent|d[ée]licieux|g[ée]nial|super bien|j'adore|coup de c(œ|oe)ur|une tuerie|top)\b/i,
  },
  {
    nature: "bon-plan",
    mots: /\b(il reste|profitez|gratuit|moiti[ée] prix|r[ée]duction|bon plan|dernier|derni[èe]re|je viens de voir|il y a encore)\b/i,
  },
  {
    nature: "evenement",
    mots: /\b(concert|spectacle|match|f[êe]te|festival|march[ée]|expo|nocturne|feria|vide-grenier|s[ée]ance|repr[ée]sentation|ce soir|demain soir)\b/i,
  },
];

/**
 * Range une phrase. Une question l'emporte sur tout le reste : le point
 * d'interrogation est le seul signe qui ne se discute pas, et quelqu'un qui
 * demande attend une réponse avant d'être classé.
 */
export function comprendre(texte: string): NatureVille {
  const t = texte.trim();
  if (/\?\s*$/.test(t) || /^(quelqu'un sait|est-ce que|qui sait|c'est quoi|pourquoi|comment)\b/i.test(t)) {
    // …sauf si la question EST une recherche de gens : « qui veut venir ? »
    const c = INDICES.find((i) => i.nature === "cherche");
    return c && c.mots.test(t) ? "cherche" : "question";
  }
  for (const i of INDICES) if (i.mots.test(t)) return i.nature;
  return "bon-plan";
}

// ─── CE QU'ON TROUVE EN ARRIVANT ───────────────────────────────────────────
//
// SANS ÇA, LA BRIQUE NE SE COMPREND PAS — et c'est son plus gros risque. Une
// annonce de commerçant est utile toute seule ; une place de village vide dit
// « personne ne parle ici », ce qui est le signal le plus fort pour ne pas
// revenir. Ces messages sont donc semés, et datés RELATIVEMENT à l'ouverture :
// à quelque heure qu'on arrive, on tombe sur une ville qui vient de parler.
//
// LES LIEUX SONT DE VRAIS REPÈRES PUBLICS DE DAX — les Arènes, la Fontaine
// chaude, les halles. Les commerces cités sont les enseignes inventées de la
// maquette, jamais de vrais commerçants : on ne fait dire à personne ce qu'il
// n'a pas dit, en bien comme en mal.

const min = (n: number) => n * 60_000;

export function messagesSemes(maintenant = Date.now()): MessageVille[] {
  return [
    {
      id: "v1",
      qui: "Camille",
      ou: "Devant les Arènes",
      distance: "200 m",
      metres: 200,
      texte: "Quelqu'un sait pourquoi il y a autant de monde devant les Arènes ?",
      nature: "question",
      a: maintenant - min(12),
      dure: 180,
      coeurs: 2,
      reponses: [
        {
          id: "v1r1",
          qui: "Marc",
          texte: "C'est la répétition de la banda avant la feria, ça finit vers 19 h.",
          quand: "il y a 9 min",
        },
        { id: "v1r2", qui: "Sonia", texte: "Ah merci, je me demandais aussi.", quand: "il y a 6 min" },
      ],
    },
    {
      id: "v2",
      qui: "Thomas",
      ou: "Place de la Fontaine chaude",
      distance: "150 m",
      metres: 150,
      texte: "Je viens de voir un super groupe jouer place de la Fontaine chaude 🔥",
      nature: "bon-plan",
      a: maintenant - min(28),
      dure: 180,
      coeurs: 18,
      photo: "/direct/concert-kiosque.jpg",
      reponses: [
        { id: "v2r1", qui: "Inès", texte: "Ils jouent jusqu'à quand ?", quand: "il y a 21 min" },
        { id: "v2r2", qui: "Thomas", texte: "Ils viennent de dire encore trois morceaux.", quand: "il y a 18 min" },
      ],
    },
    {
      id: "v3",
      qui: "Sarah",
      ou: "Kiosque du parc",
      distance: "300 m",
      metres: 300,
      texte: "Il y a encore des places pour le concert de ce soir ?",
      nature: "question",
      a: maintenant - min(58),
      dure: 240,
      coeurs: 1,
      reponses: [
        {
          id: "v3r1",
          qui: "La mairie",
          texte: "C'est en accès libre, il n'y a pas de billet. Venez avec de quoi vous asseoir.",
          quand: "il y a 44 min",
          officiel: "Organisateur",
        },
        { id: "v3r2", qui: "Paul", texte: "On y sera à 19 h, il y a de la place sur l'herbe.", quand: "il y a 31 min" },
      ],
    },
    {
      id: "v4",
      qui: "Julien",
      ou: "Rue des Carmes",
      distance: "450 m",
      metres: 450,
      texte: "Cette boulangerie est incroyable, le pain sort du four à 16 h 😍",
      nature: "coup-de-coeur",
      a: maintenant - min(115),
      dure: 240,
      coeurs: 24,
      photo: "/direct/sortie-du-four.jpg",
      reponses: [],
    },
    {
      // LE PONT ENTRE LES DEUX BRIQUES. Un « cherche » qui rassemble assez de
      // monde n'est plus un message : c'est une sortie. C'est là que La Ville
      // et Les Salons cessent d'être deux fonctions côte à côte.
      id: "v5",
      qui: "Nadia",
      ou: "Centre-ville",
      distance: "260 m",
      metres: 260,
      texte: "Quelqu'un cherche à faire quelque chose ce soir ? Je suis seule et j'ai pas envie de rester chez moi.",
      nature: "cherche",
      a: maintenant - min(40),
      dure: 300,
      coeurs: 4,
      interesses: ["Léa", "Karim", "Fatou"],
      reponses: [
        { id: "v5r1", qui: "Léa", texte: "Moi ! Je suis dispo à partir de 19 h.", quand: "il y a 26 min" },
      ],
    },
    {
      id: "v6",
      qui: "Hélène",
      ou: "Près des Arènes",
      distance: "220 m",
      metres: 220,
      texte: "Quelqu'un connaît un bon endroit pour déjeuner près des Arènes ?",
      nature: "question",
      a: maintenant - min(75),
      dure: 240,
      coeurs: 0,
      reponses: [
        { id: "v6r1", qui: "Marc", texte: "Le Bocal de Margot, les lasagnes sont faites le matin. 👍", quand: "il y a 61 min" },
        { id: "v6r2", qui: "Julie", texte: "Chez Bergine aussi, la garbure vaut le détour.", quand: "il y a 52 min" },
        { id: "v6r3", qui: "Hélène", texte: "Parfait, merci à vous deux !", quand: "il y a 40 min" },
      ],
    },
  ];
}

// ─── CE QUE LE NAVIGATEUR GARDE ────────────────────────────────────────────
//
// Même stockage que les avis, les rappels et les salons, et pour la même
// raison : on écrit, on ferme, on revient, et c'est encore là. Rien ne quitte
// le téléphone : la maquette n'a pas de serveur de conversation.

// CE QU'ON ÉCRIT, ET CE QU'ON N'ÉCRIT SURTOUT PAS.
//
// DÉFAUT CORRIGÉ ICI, ET IL VIDAIT LA VILLE. On enregistrait la liste ENTIÈRE,
// exemples compris. Or un exemple porte un instant absolu (`a`), calculé au
// premier chargement : une fois écrit, il cesse d'être « il y a douze minutes »
// et devient « mardi à 14 h 02 ». Le lendemain, la purge — qui fait bien son
// travail — les effaçait tous, et La Ville s'ouvrait sur une place vide. Le
// premier message envoyé suffisait à déclencher l'écriture, donc à condamner
// les exemples.
//
// LA RÈGLE EST DONC : LES EXEMPLES NE SONT JAMAIS ÉCRITS. Ils sont resemés à
// chaque ouverture, toujours relatifs à l'instant présent — c'est ce que
// promet l'en-tête de ce fichier. On n'écrit que ce que le visiteur a fait :
// ses propres messages, et ses retouches sur les exemples (son cœur, ses
// réponses, son intérêt, le salon qu'il a ouvert).
const CLE = "clikme-ville-v2";
/** L'ancien format écrivait les exemples ; on ne le relit pas, on le jette. */
const CLE_MORTE = "clikme-ville-v1";

/** Ce que le visiteur a ajouté SUR un exemple. Le reste vient de la graine. */
type Retouche = {
  monCoeur?: boolean;
  reponses?: ReponseVille[];
  interesses?: string[];
  salon?: string;
};
type Etat = { miennes: MessageVille[]; retouches: Record<string, Retouche> };

const VIDE: Etat = { miennes: [], retouches: {} };
const abonnes = new Set<() => void>();
export const VILLE_VIDE: MessageVille[] = [];
let etat: Etat | null = null;
let cache: MessageVille[] | null = null;

/** Recolle les exemples frais et ce que le visiteur en a fait. */
function composer(e: Etat): MessageVille[] {
  const semes = messagesSemes().map((m) => {
    const r = e.retouches[m.id];
    if (!r) return m;
    return {
      ...m,
      coeurs: m.coeurs + (r.monCoeur ? 1 : 0),
      monCoeur: r.monCoeur,
      reponses: [...m.reponses, ...(r.reponses ?? [])],
      interesses: r.interesses ?? m.interesses,
      salon: r.salon ?? m.salon,
    };
  });
  // LA PURGE NE PORTE QUE SUR CE QUI EST ÉCRIT, et c'est tout son sens : ce que
  // le visiteur a dit s'efface vraiment au bout de quelques heures — la
  // promesse tient — pendant que la maquette reste peuplée.
  return [...e.miennes.filter((m) => resteMinutes(m) > 0), ...semes];
}

function lire(): Etat {
  if (etat) return etat;
  if (typeof window === "undefined") return VIDE;
  try {
    window.localStorage.removeItem(CLE_MORTE);
    const brut = window.localStorage.getItem(CLE);
    const e = brut ? (JSON.parse(brut) as Etat) : VIDE;
    etat = { miennes: e.miennes ?? [], retouches: e.retouches ?? {} };
  } catch {
    etat = VIDE;
  }
  return etat;
}

function garder(e: Etat) {
  etat = e;
  cache = composer(e);
  try {
    window.localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* Stockage plein ou refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/** Retouche un exemple, ou modifie un message du visiteur : même appel. */
function retoucher(id: string, f: (r: Retouche) => Retouche, g: (m: MessageVille) => MessageVille) {
  const e = lire();
  if (e.miennes.some((m) => m.id === id)) {
    garder({ ...e, miennes: e.miennes.map((m) => (m.id === id ? g(m) : m)) });
    return;
  }
  garder({ ...e, retouches: { ...e.retouches, [id]: f(e.retouches[id] ?? {}) } });
}

/**
 * CE QUE LA VILLE MONTRE MAINTENANT : les exemples, toujours frais, et ce que
 * le visiteur a dit tant que ça vit encore.
 */
export function chargerVille(): MessageVille[] {
  if (cache) return cache;
  if (typeof window === "undefined") return VILLE_VIDE;
  cache = composer(lire());
  return cache;
}

export function abonnerVille(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Dire quelque chose. Le rangement est déjà fait, et déjà montré. */
export function direQuelqueChose(texte: string, nature: NatureVille, photo?: string) {
  const e = lire();
  const neuf: MessageVille = {
    id: `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    qui: "Vous",
    ou: "Autour de vous",
    distance: "0 m",
    metres: 0,
    texte: texte.trim(),
    nature,
    a: Date.now(),
    // TROIS HEURES, PAS UN JOUR. C'est la durée qui fait qu'à midi on ne voit
    // pas la veille. Elle s'allonge si la ville répond, pas autrement.
    dure: 180,
    coeurs: 0,
    reponses: [],
    photo,
    interesses: nature === "cherche" ? [] : undefined,
  };
  garder({ ...e, miennes: [neuf, ...e.miennes] });
  return neuf;
}

export function reagirVille(id: string) {
  retoucher(
    id,
    (r) => ({ ...r, monCoeur: !r.monCoeur }),
    (m) => ({ ...m, coeurs: m.coeurs + (m.monCoeur ? -1 : 1), monCoeur: !m.monCoeur }),
  );
}

export function repondreVille(id: string, texte: string) {
  const r: ReponseVille = {
    id: `r${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
    qui: "Vous",
    texte: texte.trim(),
    quand: "à l'instant",
  };
  retoucher(
    id,
    (x) => ({ ...x, reponses: [...(x.reponses ?? []), r] }),
    (m) => ({ ...m, reponses: [...m.reponses, r] }),
  );
}

/** Sur un « cherche » : dire que ça vous intéresse. */
export function caMInteresse(id: string) {
  // LA LISTE DE DÉPART VIENT DE LA GRAINE, pas de la retouche : sans ça, dire
  // « ça m'intéresse » ferait disparaître Léa, Karim et Fatou de l'écran.
  const depart = (i: string) => messagesSemes().find((m) => m.id === i)?.interesses ?? [];
  const bascule = (l: string[]) =>
    l.includes("Vous") ? l.filter((x) => x !== "Vous") : [...l, "Vous"];
  retoucher(
    id,
    (r) => ({ ...r, interesses: bascule(r.interesses ?? depart(id)) }),
    (m) => ({ ...m, interesses: bascule(m.interesses ?? []) }),
  );
}

/** Marque le salon ouvert depuis un message, pour ne pas en ouvrir deux. */
export function salonDepuisVille(id: string, cle: string) {
  retoucher(id, (r) => ({ ...r, salon: cle }), (m) => ({ ...m, salon: cle }));
}
