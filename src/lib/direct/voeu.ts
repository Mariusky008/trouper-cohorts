/**
 * ✨ « MON VŒU » (11 novembre 2026, le brief du propriétaire et de son ingénieur ; les maquettes « ClikMe · Mon vœu »).
 *
 * Je dépose un vœu avec ma figurine. Chaque jour, des gens le découvrent et me répondent avec leur figurine ; quelqu'un
 * peut m'aider ; je le suis jusqu'à ce qu'il soit exaucé. Deux rendez-vous par jour : À MIDI, LA MISSION (encourager 3
 * vœux des autres, avec sa tête, en une minute : chaque mission faite fait passer son vœu en premier le lendemain) ; LE
 * SOIR, LES RÉPONSES (une notification vers 19 h ; elles arrivent au fil de la journée). Une série (la flamme) compte
 * les jours d'affilée de mission faite.
 *
 * Il vit dans « Découvrir » (décidé par le propriétaire le 11 novembre 2026) : la première page (sa bulle, les réponses,
 * la mission), puis les trois vœux à encourager, puis le mème du jour et les mèmes.
 *
 * Les règles, ici (le navigateur et le serveur) ; le serveur : `voeu-serveur.ts` ; la table : la migration
 * `20261111090000_clik_voeu.sql`. FICHIER PARTAGÉ.
 *
 *   · UN SEUL VŒU EN ROUTE à la fois (un vœu en pause ne compte pas : on peut en avoir un en pause, et pas d'autre) ;
 *   · 90 CARACTÈRES au plus ; jamais de coordonnées (numéro, adresse, courriel, lien, pseudo) ni d'alcool (loi Évin) ;
 *   · LES 15-17 ANS ne croisent que des vœux de 15-17 ans, et n'ont pas la catégorie « Du monde » ;
 *   · DES TÊTES, PAS DES LIKES : on encourage avec SES VISAGES DÉJÀ FAITS (sa joie, son euphorie…), un mot en sticker
 *     (« J'Y CROIS ! ») — jamais de nouvelle pose à fabriquer ; celui qui passe son tour n'apparaît jamais nulle part ;
 *   · JAMAIS DE VOIX DE SYNTHÈSE : une aide est une phrase écrite (dans sa bulle), ou SA voix (20 s au plus).
 */
import type { Sentiment } from "./ma-figurine";

export const TEXTE_VOEU_MAX = 90;
export const MOT_AIDE_MAX = 140;
/** Un vocal d'aide : 20 secondes au plus (comme le talkie-walkie). */
export const VOCAL_AIDE_MAX = 20;
/** La mission : 3 vœux à encourager par jour, au plus. */
export const MISSION = 3;
/** Un vœu reformulé peut revenir chez ceux qui l'ont vu il y a plus de 30 jours. */
export const JOURS_AVANT_DE_REVOIR = 30;

export type CleCategorie = "bouger" | "apprendre" | "monde" | "coup" | "conseil" | "projet" | "sortir";
/**
 * Les catégories (les tuiles de « Fais un vœu », sauf « Surprise »). `surPlace` : il faut être là (la ville) ; sinon le
 * vœu peut aussi être exaucé de loin, et voyager plus loin quand la ville l'a vu. `adultes` : pas pour les 15-17 ans.
 * `gouts` : les goûts de la carte de personnage qui vont avec (pour choisir à qui le montrer).
 */
export const CATEGORIES_VOEU: readonly { cle: CleCategorie; nom: string; emoji: string; surPlace: boolean; adultes?: boolean; gouts: readonly string[] }[] = [
  { cle: "bouger", nom: "Bouger", emoji: "🏃", surPlace: true, gouts: ["sport", "nature"] },
  { cle: "apprendre", nom: "Apprendre", emoji: "📚", surPlace: false, gouts: ["lecture", "musique", "bricolage", "cuisine"] },
  { cle: "monde", nom: "Du monde", emoji: "🤝", surPlace: true, adultes: true, gouts: ["sorties", "jeux"] },
  { cle: "coup", nom: "Coup de main", emoji: "🙌", surPlace: true, gouts: ["bricolage", "animaux"] },
  { cle: "conseil", nom: "Un conseil", emoji: "💡", surPlace: false, gouts: ["lecture", "mode"] },
  { cle: "projet", nom: "Mon projet", emoji: "🚀", surPlace: false, gouts: ["bricolage", "cinema", "voyages"] },
  { cle: "sortir", nom: "Sortir", emoji: "🎟️", surPlace: true, gouts: ["sorties", "cinema", "cuisine"] },
];
export const categorieDe = (c: unknown) => CATEGORIES_VOEU.find((x) => x.cle === c) ?? null;
export const categorieValide = (c: unknown): CleCategorie | null => categorieDe(c)?.cle ?? null;
/** Les tuiles d'un 15-17 ans (sans « Du monde »). */
export const categoriesPour = (adulte: boolean) => CATEGORIES_VOEU.filter((c) => adulte || !c.adultes);

/** Des vœux tout prêts, concrets et réalisables par un voisin (jamais d'alcool). Retoucher la tuile : le suivant. */
export const VOEUX_PRETS: Record<CleCategorie, readonly string[]> = {
  bouger: [
    "Quelqu’un pour courir avec moi le dimanche matin",
    "Un partenaire de padel cette semaine",
    "Une balade à vélo le week-end, à deux c’est mieux",
    "Reprendre la marche : qui m’accompagne le soir ?",
    "Trouver un groupe de foot du jeudi soir",
    "Me remettre à la natation, avec quelqu’un",
  ],
  apprendre: [
    "Apprendre trois accords de guitare",
    "Qu’on m’apprenne à faire un vrai pain maison",
    "Progresser en anglais en discutant un peu",
    "Savoir changer une chambre à air",
    "Apprendre à coudre un ourlet",
    "Faire mes premières photos réussies",
  ],
  monde: [
    "Rencontrer des gens pour un jeu de société",
    "Trouver des voisins pour un pique-nique",
    "Des gens pour aller au marché ensemble le samedi",
    "Une partie de pétanque avec des gens d’ici",
    "Rencontrer d’autres parents du quartier",
    "Un café pour parler de livres",
  ],
  coup: [
    "Un coup de main pour monter une armoire",
    "Quelqu’un pour garder mon chat ce week-end",
    "De l’aide pour un petit déménagement samedi",
    "Un coup de pouce pour réparer mon vélo",
    "Arroser mes plantes pendant mes vacances",
    "Quelqu’un pour m’aider à repeindre une chambre",
  ],
  conseil: [
    "Un regard neuf sur mon CV avant lundi",
    "Un conseil pour bien choisir mon premier vélo",
    "Une bonne idée de cadeau pour ma mère",
    "Des conseils pour réussir mon entretien",
    "Une recette facile pour recevoir à dîner",
    "Comment bien commencer un potager ?",
  ],
  projet: [
    "Des idées de nom pour ma petite boutique",
    "Un avis sur le logo de mon projet",
    "Quelqu’un pour tester mon appli",
    "De l’aide pour lancer ma chaîne de vidéos",
    "Des retours sur mes premiers dessins",
    "Un coup de pouce pour organiser une brocante",
  ],
  sortir: [
    "Quelqu’un pour aller voir un film ce week-end",
    "Découvrir un bon resto du coin avec quelqu’un",
    "Aller à un concert près d’ici, à plusieurs",
    "Une sortie au musée ce dimanche",
    "Faire un escape game : il nous manque une personne",
    "Aller voir la mer un dimanche, à deux voitures",
  ],
};

/**
 * 🙂 LES TÊTES POUR ENCOURAGER (la mission) : SES VISAGES DÉJÀ FAITS (pas encore fait : sa figurine de tous les jours et
 * l'emoji), avec un mot en sticker. Jamais de nouvelle pose (décidé le 11 novembre 2026).
 */
export type Tete = { cle: string; nom: string; mot: string; emoji: string; visage: Sentiment };
export const TETES_ENCOURAGER: readonly Tete[] = [
  { cle: "jycrois", nom: "J’y crois !", mot: "J’Y CROIS !", emoji: "🤩", visage: "euphorie" },
  { cle: "tropbien", nom: "Trop bien", mot: "TROP BIEN !", emoji: "😄", visage: "joie" },
  { cle: "courage", nom: "Courage", mot: "COURAGE !", emoji: "💪", visage: "victoire" },
  { cle: "moiaussi", nom: "Moi aussi !", mot: "MOI AUSSI !", emoji: "🙋", visage: "rire" },
];
/** 🙂 Les têtes pour répondre à une réponse (le soir). */
export const TETES_REPONDRE: readonly Tete[] = [
  { cle: "merci", nom: "Merci !", mot: "MERCI !", emoji: "🥰", visage: "amour" },
  { cle: "mdr", nom: "Mort de rire", mot: "MDR", emoji: "😂", visage: "rire" },
  { cle: "grave", nom: "Grave", mot: "GRAVE !", emoji: "🤩", visage: "euphorie" },
  { cle: "tropbien", nom: "Trop bien", mot: "TROP BIEN !", emoji: "😄", visage: "joie" },
];
export const teteDe = (cle: unknown, liste: readonly Tete[] = TETES_ENCOURAGER) => liste.find((t) => t.cle === cle) ?? null;

/** « Je peux aider » : trois phrases toutes prêtes par catégorie (l'IA de « Surprends-moi » les adapte au vœu). */
export const PHRASES_AIDE: Record<CleCategorie, readonly string[]> = {
  bouger: ["Je fais ça aussi, on y va ensemble ?", "Je connais un groupe près d’ici", "Je peux t’accompagner une fois"],
  apprendre: ["Je sais faire, je te montre !", "Je connais quelqu’un qui donne des cours", "On peut apprendre ensemble"],
  monde: ["Je suis partant, on s’organise ?", "J’en connais d’autres que ça tente", "Je peux venir, avec un ami"],
  coup: ["Je peux t’aider, dis-moi quand", "J’ai les outils qu’il faut", "Je suis libre ce week-end"],
  conseil: ["J’ai une idée pour toi", "Je suis passé par là, je t’explique", "Je connais la bonne personne"],
  projet: ["J’adore l’idée, je t’aide", "J’ai un peu d’expérience là-dedans", "Je peux te donner mon avis"],
  sortir: ["Je viens avec toi !", "Je connais une bonne adresse", "On peut y aller à plusieurs"],
};

/**
 * 🔒 JAMAIS DE COORDONNÉES dans un vœu, une phrase d'aide ou un vocal (transcrit) : numéro, courriel, lien, pseudo de
 * réseau, adresse. Le contact passe uniquement par « Proches », après acceptation. Rend la raison, ou « ».
 */
export function coordonneesDans(t: string): string {
  const x = String(t ?? "");
  const chiffres = x.replace(/[\s.\-–()/]/g, "");
  if (/(?:\+|00)\d{8,}|0[1-9]\d{8}/.test(chiffres) || /\d{2}[\s.\-]\d{2}[\s.\-]\d{2}[\s.\-]\d{2}/.test(x)) return "Pas de numéro de téléphone : vous vous parlerez par vos figurines.";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(x)) return "Pas d’adresse e-mail : vous vous parlerez par vos figurines.";
  if (/(https?:\/\/|www\.)|\b[\w-]+\.(?:com|fr|net|org|io|me|be|ch|ly|gg)\b/i.test(x)) return "Pas de lien : vous vous parlerez par vos figurines.";
  if (/(^|\s)@[\w.]{2,}/.test(x) || /\b(insta|instagram|snap|snapchat|tiktok|whatsapp|telegram|discord|facebook|messenger)\b/i.test(x)) return "Pas de réseau ni de pseudo : vous vous parlerez par vos figurines.";
  if (/\b\d{1,4}\s*(bis|ter)?\s*,?\s*(rue|avenue|av\.|boulevard|bd|chemin|impasse|allée|allee|place|route|quai)\b/i.test(x)) return "Pas d’adresse : vous vous retrouverez dans un lieu public, après en avoir parlé.";
  return "";
}

/** Un texte propre : une ligne, des espaces simples. */
export const texteNet = (t: unknown, max: number) =>
  String(t ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export type StatutVoeu = "en_route" | "pause" | "exauce" | "annule" | "remplace";

/** Le jour (heure de Paris) d'un instant : « 2026-11-11 ». */
export const jourDe = (d: Date | string | number = new Date()) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const enJours = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/**
 * « 6 jours en route » : depuis sa création (le jour même : 1), sans compter ses pauses (ni celle en cours). Modifier le
 * vœu ne remet jamais le compteur à zéro.
 */
export function joursEnRoute(v: { cree_le: string; jours_pause?: number | null; pause_le?: string | null; fini_le?: string | null; statut?: string }, maintenant = new Date()): number {
  const fin = v.fini_le ? jourDe(v.fini_le) : jourDe(maintenant);
  let n = enJours(jourDe(v.cree_le), fin) + 1 - (Number(v.jours_pause) || 0);
  if (v.statut === "pause" && v.pause_le) n -= enJours(jourDe(v.pause_le), fin);
  return Math.max(1, n);
}

/** Ce que l'auteur voit de son vœu. */
export type MonVoeu = {
  id: string;
  texte: string;
  categorie: CleCategorie;
  statut: StatutVoeu;
  jours: number;
  /** combien de personnes l'ont découvert (montré), en tout */
  vues: number;
  /** combien de têtes d'encouragement, en tout (« ils y croient ») */
  croient: number;
  /** les têtes de ceux qui y croient (les plus récents d'abord, 12 au plus) */
  tetes: string[];
  aides: number;
};
/** Une réponse à son vœu (un encouragement avec une tête, ou une aide) : seul l'auteur la voit. */
export type ReponseVoeu = {
  id: number;
  genre: "encourage" | "aide";
  prenom: string;
  /** sa tête (le visage de cette réaction, ou sa figurine de tous les jours) */
  tete: string;
  /** sa figurine bouche fermée et ouverte, pour qu'elle parle (une aide en vocal) */
  images?: { n: string; p: string };
  mot?: string;
  emoji?: string;
  texte?: string;
  son?: string;
  le: string;
  vue: boolean;
  /** une aide : il lui a répondu avec sa figurine (ils sont devenus proches), ou « Pas pour moi » (l'autre ne le sait pas) */
  decision?: "accepte" | "refuse";
  /** (acceptée : la clé de son profil, pour ouvrir leur conversation dans « Proches ») */
  cle?: string;
  /** 🙂 la tête que l'auteur lui a répondue (`TETES_REPONDRE` : merci, mdr, grave, tropbien) */
  merci?: string;
};
/**
 * ↩️ UN RETOUR : l'auteur d'un vœu a répondu avec SA tête à la tête (ou à l'aide) qu'on lui avait envoyée (le lot 2,
 * 12 novembre 2026) — « Léa t'a répondu : MERCI ! ».
 */
export type RetourVoeu = {
  id: number;
  prenom: string;
  /** sa tête (le visage de cette réponse, s'il est fait ; sinon sa figurine) */
  tete: string;
  mot: string;
  emoji: string;
  /** son vœu (ce à quoi on avait répondu) */
  voeu: string;
  le: string;
  vu: boolean;
  /** 🎉 son vœu est exaucé, grâce à lui (il gagne « A exaucé un vœu ») */
  exauce?: boolean;
};

/**
 * 🎉 LA FÊTE D'UN VŒU EXAUCÉ (le lot 3, la maquette 5) : sa figurine euphorique entourée des têtes qui l'ont porté,
 * en combien de jours, grâce à qui, ses compteurs.
 */
export type FeteVoeu = {
  texte: string;
  jours: number;
  /** combien de figurines l'ont porté (ses encouragements et ses aides) */
  porte: number;
  tetes: string[];
  par: { prenom: string; tete: string; cle?: string } | null;
  /** ses vœux exaucés, en tout */
  exauces: number;
  /** les vœux qu'il a aidé à exaucer */
  aides: number;
};
/** 📒 « Mes vœux », dans « Moi » (la maquette « Mes vœux ») */
export type MesVoeux = {
  voeux: { id: string; texte: string; statut: StatutVoeu; jours: number; le: string; fini?: string; par?: string }[];
  /** ceux qu'il a aidé à exaucer : combien, leurs prénoms, leurs têtes */
  aides: { n: number; prenoms: string[]; tetes: string[] };
  /** le montrer sur sa carte de personnage (« 🌟 A exaucé 2 vœux ») */
  montrer: boolean;
};
/** Les vœux qu'il a aidé à exaucer : `<habitant>/voeux/aides-exaucees.json` (lu aussi par sa carte de personnage). */
export const cheminAidesExaucees = (h: string) => `${h}/voeux/aides-exaucees.json`;
/** Le montrer sur sa carte (allumé par défaut) : `<habitant>/voeux/montrer.json`, `{ oui }`. */
export const cheminMontrer = (h: string) => `${h}/voeux/montrer.json`;
/** Pablito propose de le reformuler : en route depuis 5 jours, et personne n'a encore proposé son aide. */
export const JOURS_AVANT_REFORMULER = 5;
/** Un vœu à encourager (une carte de la mission). */
export type CarteVoeu = {
  vue: number;
  voeu: string;
  texte: string;
  categorie: CleCategorie;
  prenom: string;
  jours: number;
  figurine: string;
  geste: "" | "encourage" | "aide" | "passe";
  /** sa ville, quand ce n'est pas la sienne (« Vevey ») */
  ville?: string;
  /** un vœu « sur place » d'une autre ville : on l'encourage avec sa tête, on ne peut pas y aider (12 novembre 2026) */
  loin?: boolean;
};
export type Mission = { jour: string; cartes: CarteVoeu[]; faite: boolean; serie: number };
export type EtatVoeu = {
  /** sa figurine est prête (sinon, rien à faire ici encore) */
  figurine: boolean;
  /** lui : son prénom, sa figurine, et ses têtes pour encourager (celles qu'il a déjà faites ; sinon, sa figurine) */
  moi?: { prenom: string; neutre: string; parle: string; tetes: Record<string, string>; fete?: { n: string; p: string } };
  /** sa ville (« Dax ») */
  ville?: string;
  /** ses 18 ans : `null` tant qu'il ne l'a pas dit (on le lui demande une fois) */
  adulte: boolean | null;
  voeu: MonVoeu | null;
  reponses: ReponseVoeu[];
  nonVues: number;
  /** ↩️ les têtes qu'on lui a répondues (à ses encouragements, à ses aides) */
  retours: RetourVoeu[];
  mission: Mission | null;
  /** (la migration n'est pas encore passée : « Mon vœu » arrive bientôt) */
  indisponible?: boolean;
};
