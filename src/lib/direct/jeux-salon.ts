/**
 * 🙋🎯 LES JEUX DU SALON (26 novembre 2026, demandés par le propriétaire ; `docs/univers/decouvrir.md`, section 41 ;
 * maquette validée https://claude.ai/artifact/ABjUPW9VGQVqzdDDmPLFea).
 *
 * - **🙋 « Qui est d'accord ? »** (lot 2) : quelqu'un lance une phrase sur la vidéo ; tout le salon vote 👍 / 👎 pendant
 *   30 secondes, lui aussi ; une pancarte au-dessus de chaque figurine qui vote ; le résultat : les têtes de chaque camp,
 *   **sans chiffre ni pourcentage**.
 * - **🎯 « Je te mets au défi »** (lot 3) : Paul choisit Léa et lui pose une question Oui/Non sur la suite de la vidéo,
 *   et dit quand on le saura (dans 30 s, 1 min, à la fin). Léa répond d'abord (ou « Pas maintenant », sans rien perdre),
 *   sa réponse reste cachée ; les autres peuvent tenter leur chance. **Le moment de vérité** : à l'heure dite, ceux qui
 *   regardent (pas Paul ni Léa) disent ce qu'ils ont vu ; personne d'autre : Paul et Léa doivent être d'accord ; sinon,
 *   pas de points. Jamais une réponse inventée par l'appli. +10 à Léa si elle trouve (à Paul sinon), +5 aux autres qui
 *   trouvent ; des points pour 3 défis par jour ; **jamais de total en public** (le sien, chez soi).
 *
 * Les limites : un seul jeu à la fois dans un salon ; un jeu lancé par personne et par vidéo. Ce qui est écrit est relu
 * comme le reste du salon (pas dans une séance entre proches).
 *
 * Ce fichier : les règles, ce que le téléphone voit, les phrases. Le serveur : `jeux-salon-serveur.ts`.
 */
import { TEXTE_SALON_MAX } from "./salons-ouverts";

export const JEUX_SALON = {
  /** 🙋 Le temps de voter. */
  voteMs: 30_000,
  /** Le résultat reste à l'écran, puis la carte s'en va seule. */
  resultatMs: 12_000,
  /** La phrase : comme un message du salon. */
  texteMax: TEXTE_SALON_MAX,
  // ─── 🎯 le défi ───
  /** Le défié répond d'abord : les autres tentent leur chance après lui, ou après ce temps. */
  reponseMs: 20_000,
  /** Le moment de vérité : le temps de dire ce qu'on a vu. */
  veriteMs: 30_000,
  /** « On le saura » : dans 30 s, dans 1 min (ou à la fin de la vidéo). */
  quandS: [30, 60] as readonly number[],
  /** La fin de la vidéo : pas trop près (le temps de répondre), pas plus loin qu'une demi-heure. */
  finMinS: 25,
  finMaxS: 1800,
  pointsDefie: 10,
  pointsLanceur: 10,
  pointsAutres: 5,
  /** Les points comptent pour autant de défis par jour (par personne). */
  defisParJour: 3,
  /** Pas deux défis à la même personne dans l'heure. */
  memePersonneMs: 3600_000,
} as const;

export type SorteJeu = "accord" | "defi";
export type VoteJeu = "oui" | "non";
export const voteValide = (x: unknown): x is VoteJeu => x === "oui" || x === "non";

/** Un jeu du salon, tel que chacun le voit (jamais un compte : les `q`). */
export type JeuVu = {
  id: string;
  sorte: SorteJeu;
  /** Qui l'a lancé. */
  de: string;
  prenom: string;
  texte: string;
  debut: number;
  /** Les votes ferment à cette heure (ms, l'heure du serveur). */
  fin: number;
  /** Le vote de chacun (son `q`). 🎯 Dans un défi, avant le moment de vérité : le mien seulement (les autres, cachés). */
  votes: Record<string, VoteJeu>;
  // ─── 🎯 le défi ───
  /** Le défié. */
  a?: string;
  aPrenom?: string;
  /** Le moment de vérité commence (= `fin`) et finit (`finVerite`). */
  finVerite?: number;
  /** Ceux qui ont déjà répondu (avant le moment de vérité : leurs réponses restent cachées). */
  repondu?: string[];
  /** Le défié a dit « Pas maintenant ». */
  pasMaintenant?: true;
  /** Au moment de vérité : ceux qui ont dit ce qu'ils ont vu ; au résultat, ce qu'ils ont dit. */
  temoins?: Record<string, VoteJeu | true>;
  /** Le résultat : ce que la vidéo a montré (`null` : on ne sait pas — pas de points). */
  verdict?: VoteJeu | null;
  /** Les points gagnés (le « +10 » qui saute ; seulement ceux qui comptent). */
  points?: Record<string, number>;
};

/** 🎯 Ce que la vidéo a montré : ceux qui regardent (pas le lanceur ni le défié) ; sinon les deux, d'accord ; sinon rien. */
export function verdictDuDefi(de: string, a: string, temoins: Record<string, VoteJeu>): VoteJeu | null {
  const autres = Object.entries(temoins).filter(([q]) => q !== de && q !== a);
  if (autres.length) {
    const g = campGagnant(Object.fromEntries(autres));
    return g === "oui" || g === "non" ? g : null;
  }
  const x = temoins[de];
  return x && temoins[a] === x ? x : null;
}

/** 🎯 Les points d'un défi (avant le plafond du jour) : le défié qui trouve, sinon le lanceur ; les autres qui trouvent. */
export function pointsDuDefi(de: string, a: string, votes: Record<string, VoteJeu>, verdict: VoteJeu | null): Record<string, number> {
  const r = votes[a];
  if (!verdict || !r) return {};
  const p: Record<string, number> = r === verdict ? { [a]: JEUX_SALON.pointsDefie } : { [de]: JEUX_SALON.pointsLanceur };
  for (const [q, v] of Object.entries(votes)) if (q !== a && q !== de && v === verdict) p[q] = JEUX_SALON.pointsAutres;
  return p;
}

/** Le camp le plus fourni (`egalite` : autant des deux côtés ; `null` : personne n'a voté). */
export function campGagnant(votes: Record<string, VoteJeu>): VoteJeu | "egalite" | null {
  const l = Object.values(votes);
  if (!l.length) return null;
  const oui = l.filter((v) => v === "oui").length;
  const non = l.length - oui;
  return oui === non ? "egalite" : oui > non ? "oui" : "non";
}

/** Où en est le jeu à `ms` : on vote, (🎯) le moment de vérité, on voit le résultat, ou c'est fini (la carte s'en va). */
export function etapeDuJeu(j: Pick<JeuVu, "fin" | "finVerite">, ms: number): "vote" | "verite" | "resultat" | "fini" {
  const fin = j.finVerite ?? j.fin;
  return ms < j.fin ? "vote" : ms < fin ? "verite" : ms < fin + JEUX_SALON.resultatMs ? "resultat" : "fini";
}
/** 🎯 La fin de tout (le résultat compris). */
export const finDuJeu = (j: Pick<JeuVu, "fin" | "finVerite">) => (j.finVerite ?? j.fin) + JEUX_SALON.resultatMs;

/** Trois débuts de phrase, pour aller vite (on peut toujours écrire la sienne). */
export const DEBUTS_ACCORD = ["C’est impossible à refaire", "Je n’aurais jamais osé", "C’est truqué"] as const;

export const PHRASES_JEUX = {
  accord: "🙋 Qui est d’accord ?",
  accordChapo: "Lance une phrase sur la vidéo. Tout le salon vote, toi aussi.",
  accordPlace: "Ta phrase sur la vidéo",
  relue: "Relue avant de partir, comme ce qu’on écrit au salon.",
  relueSeance: "Entre proches : rien n’est relu.",
  lancer: "Lancer la question",
  demande: (prenom: string) => `${prenom} demande`,
  tuDemandes: "Tu demandes",
  daccord: "👍 D’accord",
  pasDaccord: "👎 Pas d’accord",
  aVote: "✓ C’est noté",
  resultat: "Le salon a parlé",
  personne: "Personne n’a voté cette fois.",
  egalite: "Le salon est partagé.",
  campOui: "👍 D’accord",
  campNon: "👎 Pas d’accord",
  unJeuDeja: "Un jeu est déjà en cours dans ce salon : attends qu’il se termine.",
  dejaLance: "Tu as déjà lancé un jeu sur cette vidéo. Attends la suivante.",
  fini: "Ce jeu est terminé.",
  annuler: "Annuler",
  pasDeVideo: "Il faut une vidéo à la télé pour lancer un jeu.",
  // 🎯 le défi
  defi: "🎯 Je te mets au défi",
  defier: (prenom: string) => `🎯 Défier ${prenom}`,
  defiChoisir: "Qui défies-tu ?",
  defiPersonne: "Personne d’autre n’est là pour l’instant.",
  defiPlace: "Ta question sur la suite de la vidéo",
  defiSous: "Une question sur ce qui va arriver, réponse Oui ou Non.",
  onLeSaura: "On le saura",
  dans: (s: number) => (s >= 60 ? `dans ${Math.round(s / 60)} min` : `dans ${s} s`),
  aLaFin: "à la fin de la vidéo",
  lancerDefi: "Lancer le défi",
  teDefie: (prenom: string) => `${prenom} te met au défi`,
  tuDefies: (prenom: string) => `Tu défies ${prenom}`,
  defie: (de: string, a: string) => `${de} défie ${a}`,
  oui: "Oui",
  non: "Non",
  pasMaintenant: "Pas maintenant",
  reglesDefie: (prenom: string) => `Les autres répondent après toi. +10 si tu trouves, +10 pour ${prenom} si tu te trompes.`,
  gardee: "Ta réponse reste secrète jusqu’au moment de vérité.",
  aRepondu: (prenom: string) => `${prenom} a répondu`,
  reflechit: (prenom: string) => `${prenom} répond d’abord…`,
  tenter: "Tente ta chance : +5 si tu trouves.",
  reponseDans: (s: number) => `La vidéo répond dans ${s} s`,
  verite: "La vidéo vient de répondre. Qu’avez-vous vu ?",
  veriteOui: "Oui",
  veriteNon: "Non",
  veriteSous: "Ce sont ceux qui regardent qui tranchent, pas les deux joueurs.",
  veriteSousSeuls: "Personne d’autre n’est là : vous devez être d’accord tous les deux.",
  merciTemoin: "✓ Merci, c’est noté.",
  aTrouve: (prenom: string) => `${prenom} a trouvé !`,
  rate: (a: string, de: string) => `Raté pour ${a} : ${de} gagne`,
  sansVerdict: "On ne sait pas ce qui s’est passé : pas de points cette fois.",
  pasRepondu: (prenom: string) => `${prenom} n’a pas répondu : pas de points cette fois.`,
  aDitPasMaintenant: (prenom: string) => `${prenom} : pas maintenant.`,
  pasToi: "Tu ne peux pas te défier toi-même.",
  plusLa: "Cette personne n’est plus là.",
  dejaDefie: "Tu as déjà défié cette personne il y a moins d’une heure.",
  videoFinit: "La vidéo se termine : attends la suivante.",
  sesReponses: "Leurs réponses",
  mesDefis: "🎯 Mes défis",
  mesPoints: (n: number) => `${n} points`,
  mesPointsSous: "Il n’y a que toi qui les vois.",
} as const;
