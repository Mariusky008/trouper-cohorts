/**
 * 🎁 MON CADEAU OFFERT — le même geste pour tous les métiers, dit avec leurs mots.
 *
 * « Le commerçant lance "3 consos offertes" dans le salon de sa soirée ; seuls
 * les fantômes qui ont dit "Je compte venir" participent, par tirage au sort ;
 * chaque gagnant reçoit un code, que le commerçant valide d'un appui ; une
 * seule par personne ; il voit combien sont vraiment venus grâce à ça. »
 *
 * PUIS ÉLARGI À TOUS LES MÉTIERS, ET C'EST SA RÈGLE :
 *
 *   · LE BAR offre des consos — dans le salon de sa soirée (parmi ceux qui
 *     comptent venir) ou dans un salon ouvert sur son lieu.
 *   · LE RESTAURANT, LA COIFFURE, LES ONGLES, LE FLEURISTE, LA LIBRAIRIE :
 *     « c'est juste s'il y a un salon d'ouvert, public ou privé, il peut
 *     l'envoyer dedans. » Rien d'autre à faire pour participer qu'être dans
 *     la conversation.
 *   · LA MODE ET LA DÉCO (les créateurs) ont, en plus et au choix du
 *     commerçant, ceux qui ont gardé une pièce de chez eux en favori.
 *   · LES PROFESSIONS RÉGLEMENTÉES N'EN ONT PAS (santé, droit, et l'opticien,
 *     profession de santé) : la déontologie l'interdit, comme pour ProClik.
 *
 * ICI : les mots de chaque métier, et les réglages posés une fois dans
 * l'Espace Pro (`metadata.cadeau_offert`). Le tirage, les codes et leur
 * validation sont dans `lib/direct/cadeaux.ts`.
 *
 * Fichier partagé : l'Espace Pro, le serveur et l'application le lisent.
 */

/** D'où viennent ceux qui participent au tirage. */
export type Parmi = "viennent" | "salon" | "favoris";

export type ProfilCadeau = {
  emoji: string;
  /** « conso offerte » — le singulier, pour « 1 conso offerte ». */
  un: string;
  /** « consos offertes ». */
  plusieurs: string;
  /** Ce qu'on offre d'habitude, proposé tel quel. */
  quoi: string;
  /** Les durées de validité du code proposées, en minutes. */
  durees: number[];
  /** Le mot du tampon quand le code est validé. */
  merci: string;
  /** « Côté bar », « Côté restaurant »… */
  cote: string;
  /** Le lieu où l'on montre le code. */
  sur: string;
  /** L'alcool offert est encadré : la note de la loi Évin. */
  alcool?: boolean;
  /** Mode et déco : ceux qui ont gardé une pièce en favori peuvent aussi participer. */
  favoris?: boolean;
};

const MIN = 1;
const JOUR = 24 * 60 * MIN;

/**
 * LES MOTS DE CHAQUE MÉTIER. Les clés sont celles des branches de
 * l'application (`CleMetier`), recopiées ici plutôt qu'importées : l'Espace
 * Pro ne doit pas dépendre du catalogue des annonces pour neuf libellés.
 */
export const PROFILS_CADEAU: Record<string, ProfilCadeau> = {
  bar: {
    emoji: "🥂",
    un: "conso offerte",
    plusieurs: "consos offertes",
    quoi: "Une boisson au choix, avec ou sans alcool",
    durees: [30, 45],
    merci: "Santé !",
    cote: "Côté bar",
    sur: "au comptoir",
    alcool: true,
  },
  restaurant: {
    emoji: "🍰",
    un: "dessert offert",
    plusieurs: "desserts offerts",
    quoi: "Un dessert ou un café, au choix",
    durees: [JOUR, 7 * JOUR],
    merci: "Bon appétit !",
    cote: "Côté restaurant",
    sur: "en fin de repas",
  },
  coiffeur: {
    emoji: "💆",
    un: "soin offert",
    plusieurs: "soins offerts",
    quoi: "Un soin profond avec votre prochaine coupe",
    durees: [7 * JOUR, 30 * JOUR],
    merci: "À très vite !",
    cote: "Côté salon",
    sur: "au salon",
  },
  ongles: {
    emoji: "💅",
    un: "soin des mains offert",
    plusieurs: "soins des mains offerts",
    quoi: "Un soin des mains avec votre prochaine pose",
    durees: [7 * JOUR, 30 * JOUR],
    merci: "À très vite !",
    cote: "Côté onglerie",
    sur: "à l’onglerie",
  },
  fleuriste: {
    emoji: "💐",
    un: "petit bouquet offert",
    plusieurs: "petits bouquets offerts",
    quoi: "Un petit bouquet de saison",
    durees: [JOUR, 7 * JOUR],
    merci: "Belle journée !",
    cote: "Côté boutique",
    sur: "en boutique",
  },
  librairie: {
    emoji: "📚",
    un: "livre offert",
    plusieurs: "livres offerts",
    quoi: "Un livre de poche au choix",
    durees: [7 * JOUR, 30 * JOUR],
    merci: "Bonne lecture !",
    cote: "Côté librairie",
    sur: "en caisse",
  },
  mode: {
    emoji: "🎁",
    un: "cadeau",
    plusieurs: "cadeaux",
    quoi: "10 % sur la pièce de votre choix",
    durees: [7 * JOUR, 30 * JOUR],
    merci: "Profitez-en !",
    cote: "Côté boutique",
    sur: "en caisse",
    favoris: true,
  },
  artisan: {
    emoji: "🎁",
    un: "cadeau",
    plusieurs: "cadeaux",
    quoi: "Un petit cadeau de l’atelier",
    durees: [7 * JOUR, 30 * JOUR],
    merci: "Profitez-en !",
    cote: "Côté atelier",
    sur: "à l’atelier",
    favoris: true,
  },
};

/** Les métiers qui n'en ont pas : l'opticien est une profession de santé. */
const EXCLUS = new Set(["lunetier"]);

/** Le profil d'un métier, ou rien quand il n'a pas droit au geste. */
export function profilCadeau(branche: string | undefined | null): ProfilCadeau | null {
  if (!branche || EXCLUS.has(branche)) return null;
  return PROFILS_CADEAU[branche] ?? null;
}

/** « 1 conso offerte », « 3 consos offertes ». */
export function combienDe(p: Pick<ProfilCadeau, "un" | "plusieurs">, n: number) {
  return `${n} ${n > 1 ? p.plusieurs : p.un}`;
}

/** « 45 min », « 24 h », « 7 jours ». */
export function dureeLisible(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < JOUR) return `${Math.round(minutes / 60)} h`;
  if (minutes === JOUR) return "24 h";
  return `${Math.round(minutes / JOUR)} jours`;
}

/** Qui participe, dit comme on le dirait. */
export function parmiLisible(parmi: Parmi) {
  return parmi === "viennent" ? "ceux qui comptent venir" : parmi === "favoris" ? "ceux qui ont gardé une pièce" : "les membres du salon";
}

export type ReglagesCadeau = {
  actif: boolean;
  nombre: number;
  quoi: string;
  /** En minutes : une des `durees` du métier. */
  duree: number;
  /** Où il l'envoie. Les favoris n'existent que pour la mode et la déco. */
  canaux: { salons: boolean; favoris: boolean };
  at: string;
};

export const QUOI_CONSO_PAR_DEFAUT = PROFILS_CADEAU.bar.quoi;

export function reglagesParDefaut(branche: string | undefined | null): ReglagesCadeau {
  const p = profilCadeau(branche) ?? PROFILS_CADEAU.mode;
  return { actif: false, nombre: 3, quoi: p.quoi, duree: p.durees[p.durees.length - 1], canaux: { salons: true, favoris: !!p.favoris }, at: "" };
}

/** Tout ce qui vient d'ailleurs (la base, le formulaire) passe par ici : bornes et défauts. */
export function normaliserReglagesCadeau(v: unknown, branche: string | undefined | null): ReglagesCadeau {
  const p = profilCadeau(branche) ?? PROFILS_CADEAU.mode;
  const d = reglagesParDefaut(branche);
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const n = Math.round(Number(o.nombre));
  const duree = Number(o.duree);
  const c = o.canaux && typeof o.canaux === "object" ? (o.canaux as Record<string, unknown>) : {};
  let salons = c.salons === undefined ? true : c.salons === true;
  const favoris = !!p.favoris && (c.favoris === undefined ? d.canaux.favoris : c.favoris === true);
  // AU MOINS UN ENDROIT OÙ L'ENVOYER : sans quoi le réglage ne servirait à rien.
  if (!salons && !favoris) salons = true;
  return {
    actif: o.actif === true,
    nombre: Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3,
    quoi: (typeof o.quoi === "string" ? o.quoi.trim().slice(0, 80) : "") || p.quoi,
    duree: p.durees.includes(duree) ? duree : d.duree,
    canaux: { salons, favoris },
    at: typeof o.at === "string" ? o.at : "",
  };
}

/** Le réglage posé ; l'ancien `consos_offertes` des bars est relu tel quel. */
export function lireReglagesCadeau(metadata: Record<string, unknown> | null | undefined, branche: string | undefined | null): ReglagesCadeau {
  const brut = metadata?.cadeau_offert ?? metadata?.consos_offertes;
  return brut ? normaliserReglagesCadeau(brut, branche) : reglagesParDefaut(branche);
}
