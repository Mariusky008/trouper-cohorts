/**
 * 🏆 LE COMPTOIR — ce qu'il a publié, et ce que ça lui a rapporté en points.
 *
 * « Que le fantôme soit plus présent et gamifiant. » Le jeu ne compte que ce
 * qu'il a VRAIMENT fait : une annonce publiée, une photo, sa voix, un jour de
 * plus d'affilée. Aucune vue inventée, aucun « 142 personnes ont vu » posé à
 * la main — un chiffre gonflé une seule fois fait perdre le commerçant pour
 * toujours (voir le bilan de l'ancienne assistante).
 *
 * TOUT VIT DANS LE TÉLÉPHONE, POUR L'INSTANT. Il n'y a pas encore de compte
 * commerçant ; quand il existera, `Publication` est exactement ce qui partira
 * en base — c'est pour ça qu'elle porte déjà ses dates de début et de fin.
 *
 * FICHIER NAVIGATEUR : lit et écrit `localStorage`, toujours dans un try.
 */
import type { FamilleDouble } from "@/lib/direct/double-metiers";

export type Publication = {
  id: string;
  famille: FamilleDouble;
  /** « principal » : la mission du jour ; « relance » : il en reste. */
  genre: "principal" | "relance";
  nom: string;
  prix: string;
  /** Une ligne de plus : « Plus que 5 parts ». */
  detail?: string;
  /** Les photos, réduites (data-URL JPEG). */
  photos: string[];
  /** Son mot aux clients, à sa voix (data-URL audio) — l'étape 2 de l'Expérience. */
  voix?: string;
  voixSecondes?: number;
  /** Ce qu'il a dit, écrit : sous-titre du lecteur, et repli sans audio. */
  voixTexte?: string;
  jours: number;
  publieLe: number;
  finLe: number;
};

export type Comptoir = {
  publications: Publication[];
  points: number;
  /** Les jours où il a publié, « 2026-10-03 ». */
  jours: string[];
  badges: string[];
};

const vide = (): Comptoir => ({ publications: [], points: 0, jours: [], badges: [] });
/** Un comptoir par commerce : sa famille pour ceux de la démonstration, son identifiant pour les autres. */
const cle = (qui: string) => `clikme-comptoir-v1-${qui}`;

export function jourDe(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function chargerComptoir(qui: string): Comptoir {
  try {
    const brut = window.localStorage.getItem(cle(qui));
    if (!brut) return vide();
    const c = JSON.parse(brut) as Partial<Comptoir>;
    return { ...vide(), ...c };
  } catch {
    return vide();
  }
}

/**
 * ON GARDE, QUITTE À OUBLIER LES MÉDIAS LES PLUS ANCIENS. Le stockage du
 * téléphone tient cinq mégaoctets : plutôt que de perdre l'annonce du jour,
 * on retire d'abord les photos et la voix des annonces terminées.
 */
export function garderComptoir(qui: string, c: Comptoir): void {
  const essai = (x: Comptoir) => {
    window.localStorage.setItem(cle(qui), JSON.stringify(x));
  };
  try {
    essai(c);
    return;
  } catch {
    /* plein : on allège */
  }
  const maintenant = Date.now();
  const allege: Comptoir = {
    ...c,
    publications: c.publications.map((p) => (p.finLe < maintenant ? { ...p, photos: p.photos.slice(0, 1), voix: undefined } : p)),
  };
  try {
    essai(allege);
  } catch {
    try {
      essai({ ...allege, publications: allege.publications.slice(-3) });
    } catch {
      /* rien à faire : l'écran garde l'état en mémoire */
    }
  }
}

/** Combien de jours d'affilée, en finissant aujourd'hui (ou hier, s'il n'a pas encore publié). */
export function serie(c: Comptoir, maintenant = Date.now()): number {
  const fait = new Set(c.jours);
  let n = 0;
  let t = maintenant;
  if (!fait.has(jourDe(t))) t -= 86_400_000;
  while (fait.has(jourDe(t))) {
    n++;
    t -= 86_400_000;
  }
  return n;
}

/** Les badges, et ce qui les gagne. Dans l'ordre où on les rencontre. */
export const BADGES: { id: string; icone: string; nom: string; gagne: (c: Comptoir) => boolean }[] = [
  { id: "premiere", icone: "🎉", nom: "Première annonce", gagne: (c) => c.publications.length >= 1 },
  { id: "voix", icone: "🎙️", nom: "Ta voix en ligne", gagne: (c) => c.publications.some((p) => !!p.voix) },
  { id: "photographe", icone: "📸", nom: "Photographe", gagne: (c) => c.publications.some((p) => p.photos.length >= 3) },
  { id: "relance", icone: "⚡", nom: "Rien ne se perd", gagne: (c) => c.publications.some((p) => p.genre === "relance") },
  { id: "serie3", icone: "🔥", nom: "3 jours d’affilée", gagne: (c) => serie(c) >= 3 },
  { id: "serie7", icone: "🏆", nom: "Une semaine complète", gagne: (c) => serie(c) >= 7 },
];

/** Les points d'une annonce : publier, montrer, parler. */
export function pointsDe(p: Pick<Publication, "photos" | "voix" | "genre">): number {
  return (p.genre === "relance" ? 15 : 20) + Math.min(p.photos.length, 3) * 10 + (p.voix ? 20 : 0);
}

/** Les niveaux du fantôme, au fil des points. */
export const NIVEAUX = [
  { des: 0, nom: "Fantôme timide" },
  { des: 60, nom: "Fantôme du quartier" },
  { des: 200, nom: "Fantôme connu" },
  { des: 500, nom: "Fantôme star" },
  { des: 1000, nom: "Légende de la ville" },
];

export function niveauDe(points: number): { nom: string; suivant: { nom: string; des: number } | null; part: number } {
  let i = 0;
  while (i + 1 < NIVEAUX.length && points >= NIVEAUX[i + 1].des) i++;
  const suivant = NIVEAUX[i + 1] ?? null;
  const part = suivant ? (points - NIVEAUX[i].des) / (suivant.des - NIVEAUX[i].des) : 1;
  return { nom: NIVEAUX[i].nom, suivant, part };
}

/**
 * PUBLIER : l'annonce entre, les points tombent, la série avance, et les
 * badges nouvellement gagnés sont rendus — c'est la fête qui les annonce.
 */
export function publier(c: Comptoir, p: Publication): { comptoir: Comptoir; gagnes: string[]; points: number } {
  const points = pointsDe(p);
  const jour = jourDe(p.publieLe);
  const suivant: Comptoir = {
    ...c,
    publications: [...c.publications, p],
    points: c.points + points,
    jours: c.jours.includes(jour) ? c.jours : [...c.jours, jour].slice(-60),
  };
  const gagnes = BADGES.filter((b) => !c.badges.includes(b.id) && b.gagne(suivant)).map((b) => b.id);
  return { comptoir: { ...suivant, badges: [...c.badges, ...gagnes] }, gagnes, points };
}

/** Ce qui est en ligne maintenant. */
export function enLigne(c: Comptoir, maintenant = Date.now()): Publication[] {
  return c.publications.filter((p) => p.publieLe <= maintenant && p.finLe > maintenant);
}

/** Retirer une annonce : elle sort de la page, les points restent acquis. */
export function retirer(c: Comptoir, id: string, maintenant = Date.now()): Comptoir {
  return { ...c, publications: c.publications.map((p) => (p.id === id ? { ...p, finLe: maintenant } : p)) };
}

/**
 * LA FIN D'UNE ANNONCE : « 1 jour » veut dire jusqu'à ce soir, pas vingt-quatre
 * heures — un plat du jour publié à 11 h ne doit pas être encore là demain
 * midi. Au-delà, on compte des fins de journée.
 */
export function finApres(jours: number, depuis = Date.now()): number {
  const d = new Date(depuis);
  d.setHours(23, 59, 0, 0);
  return d.getTime() + (Math.max(1, jours) - 1) * 86_400_000;
}
