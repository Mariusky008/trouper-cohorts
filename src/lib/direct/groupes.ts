/**
 * 👥 MES GROUPES — LES PROPOSITIONS (« On se retrouve ? ») : le lot G2 (`docs/univers/mes-groupes.md`).
 *
 * Quelqu'un propose de se retrouver à une heure, autour d'une passion et d'une vidéo : un nom, quand, pour qui (tout le
 * monde — les adultes seulement — ou ses proches), 4 ou 8 places, un mot s'il veut. Les autres confirment leur place, ou
 * proposent une autre heure. À l'heure dite, on entre :
 *   · ouverte à tout le monde : le salon de la passion, dans Découvrir (8 places, le gradin) ;
 *   · entre proches : la séance chez celui qui propose (4 places), avec la vidéo choisie.
 * « Maintenant » et ouverte à tout le monde : pas de proposition, on va tout de suite au salon de la passion.
 *
 * Les règles de toujours : jamais un chiffre inventé (celui qui propose a sa place : « 1/8 », jamais « 0/8 ») ; pas de
 * vote, pas de points ; le nom et le mot passent la modération des salons (`refusDuMessage`) ; « Signaler » : trois
 * personnes, et la proposition disparaît. Les 15-17 ans ne proposent et ne voient que des propositions entre proches.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { THEMES_DECOUVRIR, type IdTheme } from "./decouvrir";
import { refusDuMessage } from "./salons-ouverts";

export type PourQui = "tous" | "proches";
export const PLACES_GROUPE = [4, 8] as const;
export type PlacesGroupe = (typeof PLACES_GROUPE)[number];
export const NOM_GROUPE_MAX = 28;
export const MOT_GROUPE_MAX = 80;
/** On peut entrer dix minutes avant l'heure, et jusqu'à deux heures après. */
export const OUVERT_AVANT_MS = 10 * 60_000;
export const OUVERT_APRES_MS = 2 * 3600_000;
/** Une proposition se fait pour les quatorze prochains jours au plus. */
export const HORIZON_MS = 14 * 24 * 3600_000;
/** Trois signalements de personnes différentes : la proposition disparaît. */
export const SIGNALEMENTS_GROUPE = 3;
/** Trois propositions à venir par personne, au plus. */
export const PROPOSITIONS_MAX = 3;

/** Une personne qui a sa place : son prénom, sa figurine. */
export type PlaceGroupe = { q: string; prenom: string; src: string };

/** Une proposition, telle que l'écran la voit. */
export type PropositionGroupe = {
  id: string;
  nom: string;
  theme: IdTheme;
  e: string;
  video: { id: string; titre: string } | null;
  /** l'heure du rendez-vous (ms) */
  quand: number;
  pour: PourQui;
  places: PlacesGroupe;
  mot?: string;
  /** celui qui propose (son prénom) ; `mienne` : c'est moi */
  de: string;
  mienne?: true;
  /** ceux qui ont leur place (celui qui propose en premier) */
  confirmes: PlaceGroupe[];
  /** j'ai ma place */
  jY?: true;
  /** la dernière autre heure proposée (pas par celui qui propose) */
  autre?: { prenom: string; quand: number; q: string };
  /** on peut entrer (dix minutes avant, deux heures après) */
  ouverte?: true;
};

export const themeDuGroupe = (t: unknown) => THEMES_DECOUVRIR.find((x) => x.id === t) ?? null;
export const estOuverte = (quand: number, maintenant: number) => maintenant >= quand - OUVERT_AVANT_MS && maintenant <= quand + OUVERT_APRES_MS;

/** Pourquoi un nom ou un mot ne passe pas (`null` : il passe). */
export function refusDuGroupe(texte: string, max: number): string | null {
  const t = texte.replace(/\s+/g, " ").trim();
  if ([...t].length > max) return `${max} signes au plus`;
  return refusDuMessage(t);
}

const HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "2-digit" });
const JOUR = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
const CLE_JOUR = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** « 20 h », « 20 h 30 » (heure de Paris). */
export function heureLisible(ms: number): string {
  const [h, m] = HEURE.format(ms).split(":");
  return m && m !== "00" ? `${Number(h)} h ${m}` : `${Number(h)} h`;
}
/** « Ce soir 20 h », « Demain 21 h », « Samedi 20 h 30 », « Le 12 décembre 20 h ». */
export function quandLisible(ms: number, maintenant = Date.now()): string {
  const jour = CLE_JOUR.format(ms);
  const auj = CLE_JOUR.format(maintenant);
  const dem = CLE_JOUR.format(maintenant + 24 * 3600_000);
  const h = heureLisible(ms);
  if (jour === auj) return `${Number(HEURE.format(ms).split(":")[0]) >= 18 ? "Ce soir" : "Aujourd’hui"} ${h}`;
  if (jour === dem) return `Demain ${h}`;
  const j = JOUR.format(ms);
  if (ms - maintenant < 7 * 24 * 3600_000) {
    const nom = j.split(" ")[0];
    return `${nom[0].toUpperCase()}${nom.slice(1)} ${h}`;
  }
  return `Le ${j.split(" ").slice(1).join(" ")} ${h}`;
}

/** (Paris) le décalage avec l'heure universelle à cet instant, en minutes. */
function decalageParis(ms: number): number {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(ms);
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return (Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute")) - Math.floor(ms / 60_000) * 60_000) / 60_000;
}
/** L'instant d'un jour (dans `jours` jours, heure de Paris) à `h` heures `m` minutes. */
export function aParis(jours: number, h: number, m = 0, maintenant = Date.now()): number {
  const [a, mo, j] = CLE_JOUR.format(maintenant + jours * 24 * 3600_000).split("-").map(Number);
  const brut = Date.UTC(a, mo - 1, j, h, m);
  return brut - decalageParis(brut) * 60_000;
}

export const PHRASES_PROPOSITIONS = {
  rangee: "Propositions de groupes",
  lancer: "Lancer",
  confirmer: "Je confirme ma place",
  confirme: "✓ Ma place est prise",
  laisser: "Laisser ma place",
  autreHeure: "🕘 Autre heure",
  entrer: "▶ Entrer",
  complet: "Complet",
  confirmes: (n: number, places: number) => `${n}/${places} confirmé${n > 1 ? "s" : ""}`,
  propose: (prenom: string) => `Proposé par ${prenom}`,
  autre: (prenom: string, quand: string) => `🕘 ${prenom} propose ${quand}`,
  prendreHeure: "Prendre cette heure",
  retirer: "Retirer",
  signaler: "Signaler",
  signale: "Merci : c’est signalé.",
  pourProches: "👥 Entre proches",
  // l'écran « Proposer »
  titre: "Proposer",
  sonNom: "Son nom",
  nomIndice: "Soirée foot",
  passion: "La passion",
  video: "La vidéo pour commencer",
  unLien: "Un lien",
  lienIndice: "Colle un lien YouTube",
  nouveautes: "Nouveautés",
  nouveautesSous: "Les vidéos du jour de la passion",
  quand: "Quand",
  maintenant: "Maintenant",
  ceSoir: "Ce soir",
  demain: "Demain",
  autreJour: "Un autre jour",
  pourQui: "Pour qui",
  tous: "Tout le monde",
  tousSous: "Adultes",
  proches: "Mes proches",
  places: "Places",
  mot: "Un mot (si tu veux)",
  motIndice: "Tout le monde est bienvenu !",
  publier: "📣 Publier",
  allerAuSalon: "▶ Aller au salon",
  ouVa: (tous: boolean, maintenant: boolean) => (maintenant && tous ? "Elle ouvre le salon de la passion, dans Découvrir" : tous ? "Elle ira dans « Propositions de groupes », pour tout le monde" : "Elle ira dans « Propositions de groupes », chez tes proches"),
  publiee: "📣 Ta proposition est dans « Propositions de groupes »",
  jeunes: "Entre 15 et 17 ans, on se retrouve entre proches.",
  ferme: "Les propositions ouvertes à tout le monde sont en pause.",
  tropDePropositions: `${PROPOSITIONS_MAX} propositions à venir au plus : retire-en une d’abord.`,
  // l'autre heure
  autreTitre: "🕘 Un autre horaire ?",
  proposerHeure: "Proposer",
  autreEnvoye: "🕘 C’est proposé : tout le monde le voit sur la carte.",
} as const;
