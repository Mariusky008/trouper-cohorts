/**
 * 🧾 LE TICKET DE MIKE — « Ce que Mike a fait pour toi », chaque semaine.
 *
 * C'est l'étape 5 des cages (`docs/les-cages.md`), le ticket de « Plus de
 * clients » des tours du fantôme, mais avec ce que ClikMe SAIT vraiment de sa
 * semaine — rien d'inventé, rien d'estimé :
 *   · les fantômes libérés à la fin de ses vidéos, cage par cage ;
 *   · les personnes venues (les passages qu'il a notés dans son carnet) ;
 *   · celles venues après son signal — le jour même ou le lendemain d'une
 *     invitation « Oui, préviens-les » : « +3 tables un jour calme » ;
 *   · les messages de Mike, et les réponses ;
 *   · (au comptoir) les vues de sa page, et la commission ClikMe : 0 €.
 *
 * Une semaine = les sept derniers jours ; on peut revoir les sept d'avant.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : le calcul est le même pour la route
 * (`api/site-internet/pro/carnet`, action « ticket ») et pour la démonstration.
 */
import type { Cage } from "./cages";
import type { LigneCarnet } from "./carnet";
import type { FamilleDouble } from "./double-metiers";
import { sorteDe } from "./previens-les";

export type Ticket = {
  /** Les fantômes libérés dans la semaine, cage par cage. */
  fantomes: Record<Cage, number>;
  /** Les personnes venues (au moins un passage noté), et les passages. */
  venus: number;
  passages: number;
  /** Venues le jour même ou le lendemain d'une invitation « Oui, préviens-les ». */
  apresSignal: number;
  /** Les messages envoyés (WhatsApp et Ma Maison), et les réponses reçues. */
  messages: number;
  reponses: number;
};

/** Ce qu'il faut pour calculer : ses cages, ses passages, ses messages (tous canaux). */
export type Gestes = {
  cages: { qui: string; cage: Cage; le: string }[];
  visites: { qui: string; jour: string }[];
  messages: { qui: string; le: string; canal: "whatsapp" | "maison"; modele: string; reponse: string; repondu?: string }[];
};

const JOUR = 86_400_000;
const jourDe = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const lendemain = (jour: string) => jourDe(Date.parse(`${jour}T12:00:00Z`) + JOUR);

/** Le ticket des sept jours qui finissent à `fin` (exclu : `debut`). */
export function calculerTicket(g: Gestes, fin: number): Ticket {
  const debut = fin - 7 * JOUR;
  const dans = (iso: string) => {
    const t = Date.parse(iso);
    return t > debut && t <= fin;
  };
  const jDebut = jourDe(debut);
  const jFin = jourDe(fin);
  const jourDans = (j: string) => j > jDebut && j <= jFin;

  const fantomes: Record<Cage, number> = { adore: 0, "un-jour": 0, aujourdhui: 0 };
  for (const c of g.cages) if (dans(c.le)) fantomes[c.cage] += 1;

  const visites = g.visites.filter((v) => jourDans(v.jour));
  const venus = new Set(visites.map((v) => v.qui));

  // APRÈS SON SIGNAL : une invitation WhatsApp (pas un message de Mike), puis un passage le jour même ou le lendemain.
  const signaux = g.messages.filter((m) => m.canal === "whatsapp" && !m.modele);
  const apres = new Set<string>();
  for (const v of visites) {
    if (apres.has(v.qui)) continue;
    if (signaux.some((m) => m.qui === v.qui && (jourDe(Date.parse(m.le)) === v.jour || lendemain(jourDe(Date.parse(m.le))) === v.jour))) apres.add(v.qui);
  }

  const envoyes = g.messages.filter((m) => dans(m.le));
  const reponses = g.messages.filter((m) => m.reponse && dans(m.repondu || m.le)).length;
  return { fantomes, venus: venus.size, passages: visites.length, apresSignal: apres.size, messages: envoyes.length, reponses };
}

/** Rien du tout cette semaine : la carte de l'accueil ne se montre pas. */
export const ticketVide = (t: Ticket) =>
  !t.fantomes.adore && !t.fantomes["un-jour"] && !t.fantomes.aujourdhui && !t.venus && !t.messages && !t.reponses;

export const totalFantomes = (t: Ticket) => t.fantomes.adore + t.fantomes["un-jour"] + t.fantomes.aujourdhui;

/** « +3 tables un jour calme », « +3 rendez-vous », « +3 clients » : la ligne des tours, dans les mots du métier. */
export function apresSignalEnMots(n: number, famille: FamilleDouble): string {
  const s = sorteDe(famille);
  if (s === "table") return `+${n} ${n > 1 ? "tables" : "table"} un jour calme`;
  if (s === "creneau") return `+${n} rendez-vous un jour calme`;
  return `+${n} ${n > 1 ? "clients" : "client"} un jour calme`;
}

/** « du 19 au 25 octobre » : les sept jours qui finissent à `fin`. */
export function periodeEnMots(fin: number): string {
  const f = (ms: number, mois: boolean) =>
    new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", ...(mois ? { month: "long" } : {}), timeZone: "Europe/Paris" });
  const debut = fin - 6 * JOUR;
  const memeMois = new Date(debut).getUTCMonth() === new Date(fin).getUTCMonth();
  return `du ${f(debut, !memeMois)} au ${f(fin, true)}`;
}

/**
 * LA DÉMONSTRATION : les gestes tirés du carnet inventé (ses dates sont relatives à
 * maintenant). Ses passages anciens sont posés tous les dix jours avant le dernier.
 */
export function gestesDuCarnet(lignes: LigneCarnet[]): Gestes {
  const g: Gestes = { cages: [], visites: [], messages: [] };
  for (const l of lignes) {
    g.cages.push({ qui: l.ref, cage: l.cage, le: l.le });
    if (l.dernierPassage) {
      for (let k = 0; k < l.passages; k++) g.visites.push({ qui: l.ref, jour: jourDe(Date.parse(`${l.dernierPassage}T12:00:00Z`) - k * 10 * JOUR) });
    }
    for (const m of l.messages) g.messages.push({ qui: l.ref, le: m.le, canal: m.canal ?? "whatsapp", modele: m.modele ?? "", reponse: m.reponse ?? "" });
  }
  return g;
}
