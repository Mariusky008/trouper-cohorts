/**
 * 📈 CE QUE SES ANNONCES LUI RAPPORTENT — sa journée, et sa semaine.
 *
 * « Je ne vois aucune stat de ma journée ou des précédentes pour me motiver à
 * chaque jour poster quelque chose. »
 *
 * C'EST LE SEUL RETOUR QU'UN COMMERÇANT AIT JAMAIS sur ce qu'il publie (voir
 * `journees-passees.ts`). Et le chiffre qui le fait revenir n'est pas le total :
 * c'est la DIFFÉRENCE entre les jours où il a publié et ceux où il n'a rien
 * dit. Une barre rose haute à côté d'une barre grise basse, ça se comprend sans
 * lire.
 *
 * ─── EN DÉMONSTRATION, LES CHIFFRES SONT SIMULÉS — ET L'ÉCRAN LE DIT ──────
 *
 * Il n'y a pas encore de compte commerçant, donc personne ne compte ses vues.
 * Les chiffres d'ici sont calculés — toujours les mêmes pour un même jour,
 * plus hauts les jours où il a publié — et chaque bloc porte la mention
 * « démonstration ». Chez un vrai commerçant (son lien pro), ils viennent des
 * compteurs de sa page, jour par jour, dans cette même forme `JourStats` — voir
 * `lib/site-internet/compteurs-jour.ts` — et la mention disparaît.
 *
 * FICHIER PARTAGÉ : aucune dépendance au DOM.
 */
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { jourDe, type Comptoir, type Publication } from "@/lib/direct/comptoir";

export type JourStats = {
  /** `AAAA-MM-JJ`. */
  jour: string;
  /** « lun. », « mar. »… et « auj. » pour aujourd'hui. */
  court: string;
  aujourdhui: boolean;
  publie: boolean;
  /** Ce qu'il a publié ce jour-là, s'il l'a fait ici. */
  titre?: string;
  vues: number;
  ecoutes: number;
  demandes: number;
  partages: number;
};

/** Ce qu'une « demande » veut dire dans son métier : au singulier, au pluriel. */
const DEMANDES: Record<FamilleDouble, [string, string]> = {
  table: ["demande de table", "demandes de table"],
  bar: ["table réservée", "tables réservées"],
  coiffure: ["demande de rendez-vous", "demandes de rendez-vous"],
  ongles: ["demande de rendez-vous", "demandes de rendez-vous"],
  mode: ["pièce mise de côté", "pièces mises de côté"],
  fleurs: ["bouquet commandé", "bouquets commandés"],
  createur: ["création mise de côté", "créations mises de côté"],
  lunettes: ["demande d’essayage", "demandes d’essayage"],
  seance: ["demande de séance", "demandes de séance"],
  librairie: ["livre mis de côté", "livres mis de côté"],
};

/** « 1 demande de table », « 6 demandes de table » — le mot suit le nombre. */
export function demandesEnMots(famille: FamilleDouble, n: number): string {
  return DEMANDES[famille][n > 1 ? 1 : 0];
}

/** « 1 personne », « 2 personnes ». */
export const accord = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

/** Les visites d'une journée ordinaire, sans annonce — un petit commerce de quartier. */
const BASE: Record<FamilleDouble, number> = {
  table: 34, bar: 26, coiffure: 21, ongles: 17, mode: 23, fleurs: 15, createur: 12, lunettes: 11, seance: 9, librairie: 14,
};

/** Combien une annonce multiplie les visites, en moyenne. */
const EFFET = 3.4;

/** Un nombre entre 0 et 1, toujours le même pour un même texte. */
function hasard(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/**
 * A-T-IL PUBLIÉ CE JOUR-LÀ ? Ce qu'il a fait ici fait foi. Avant sa première
 * annonce, la démonstration lui prête une semaine type — quatre jours sur six —
 * pour que le graphique montre ce qui l'attend au lieu d'un mur de zéros.
 */
function aPublie(c: Comptoir, famille: FamilleDouble, jour: string, premierJour: string | null): boolean {
  if (c.jours.includes(jour)) return true;
  if (premierJour && jour >= premierJour) return false;
  return hasard(`${famille}:${jour}:publie`) < 0.64;
}

/**
 * LA JOURNÉE EN COURS MONTE AU FIL DES HEURES. Une annonce publiée à 11 h n'a
 * pas déjà fait toutes ses vues à 11 h 05 : la courbe d'une journée grimpe vite
 * le premier quart d'heure, puis ralentit jusqu'au soir.
 */
function partDeLaJournee(maintenant: number, depuis: number | null): number {
  const d = new Date(maintenant);
  const heure = d.getHours() + d.getMinutes() / 60;
  const journee = Math.min(1, Math.max(0.08, (heure - 7) / 14));
  if (depuis === null) return journee;
  const minutes = Math.max(0, (maintenant - depuis) / 60_000);
  return Math.min(journee, 0.12 + 0.88 * (1 - Math.exp(-minutes / 150)));
}

/** Les sept derniers jours, aujourd'hui compris, du plus ancien au plus récent. */
export function semaineDuComptoir(c: Comptoir, famille: FamilleDouble, maintenant = Date.now()): JourStats[] {
  const premierJour = c.jours.length ? [...c.jours].sort()[0] : null;
  const auj = jourDe(maintenant);
  const jours: JourStats[] = [];
  for (let k = 6; k >= 0; k--) {
    const t = maintenant - k * 86_400_000;
    const jour = jourDe(t);
    const aujourdhui = jour === auj;
    const publie = aujourdhui ? c.jours.includes(jour) : aPublie(c, famille, jour, premierJour);
    const pubs: Publication[] = c.publications.filter((p) => jourDe(p.publieLe) === jour);
    const avecVoix = pubs.some((p) => !!p.voix) || (!pubs.length && publie && hasard(`${famille}:${jour}:voix`) < 0.6);
    const h = hasard(`${famille}:${jour}`);
    let vues = BASE[famille] * (0.8 + h * 0.45) * (publie ? EFFET * (0.85 + hasard(`${jour}:${famille}:x`) * 0.4) : 1);
    if (aujourdhui) {
      const premiere = pubs.length ? Math.min(...pubs.map((p) => p.publieLe)) : null;
      vues *= partDeLaJournee(maintenant, publie ? premiere : null);
    }
    const v = Math.max(aujourdhui ? 0 : 3, Math.round(vues));
    jours.push({
      jour,
      court: aujourdhui ? "auj." : JOURS_COURTS[new Date(t).getDay()],
      aujourdhui,
      publie,
      titre: pubs.find((p) => p.genre === "principal")?.nom ?? pubs[0]?.nom,
      vues: v,
      ecoutes: avecVoix ? Math.round(v * (0.24 + h * 0.1)) : 0,
      demandes: publie ? Math.round(v * (0.035 + h * 0.02)) : Math.round(v * 0.01),
      partages: publie ? Math.round(v * (0.05 + h * 0.03)) : 0,
    });
  }
  return jours;
}

/** « 3,4× plus » : la moyenne des jours publiés sur celle des jours sans annonce (aujourd'hui exclu). */
export function effetDesAnnonces(semaine: JourStats[]): number | null {
  const passes = semaine.filter((j) => !j.aujourdhui);
  const avec = passes.filter((j) => j.publie);
  const sans = passes.filter((j) => !j.publie);
  if (!avec.length || !sans.length) return null;
  const m = (l: JourStats[]) => l.reduce((s, j) => s + j.vues, 0) / l.length;
  return Math.round((m(avec) / Math.max(1, m(sans))) * 10) / 10;
}

const JOURS_LONGS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/** La phrase du fantôme en arrivant : ce que sa dernière annonce a fait. */
export function phraseDeLaVeille(semaine: JourStats[], quoi: string): string | null {
  const dernier = [...semaine].reverse().find((j) => !j.aujourdhui && j.publie);
  // ZÉRO N'EST PAS UNE NOUVELLE À ANNONCER EN ARRIVANT — chez un vrai
  // commerçant, une journée sans visite comptée arrive.
  if (!dernier || dernier.vues <= 0) return null;
  const hier = semaine[semaine.length - 2]?.jour === dernier.jour;
  const [a, m, d] = dernier.jour.split("-").map(Number);
  const quand = hier ? "Hier" : `${JOURS_LONGS[new Date(a, m - 1, d).getDay()]} dernier`;
  return `${quand}, ${dernier.vues} personnes ont vu ${dernier.titre ? `« ${dernier.titre} »` : quoi.toLowerCase()}.`;
}
