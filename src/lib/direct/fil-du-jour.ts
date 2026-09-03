// LE FIL DE SA JOURNÉE — les moments où Léa a quelque chose à demander.
//
// ─── LE DÉFAUT QUI L'A FAIT NAÎTRE ────────────────────────────────────────
//
// « Si le commerçant oublie de mettre son menu à 10 h et qu'il ouvre Léa à
// 15 h, elle va quand même lui demander son menu du jour. »
//
// C'est exact, et c'est plus grave qu'une maladresse : à 15 h, le service est
// fini. Une assistante qui demande le plat du jour à 15 h prouve en une phrase
// qu'elle ne sait pas quelle heure il est, donc qu'elle ne suit rien du tout.
// Tout le reste — la mémoire, les chiffres, le rond qui respire — s'effondre
// derrière cette seule phrase.
//
// ─── CE QUE CE FICHIER APPORTE ────────────────────────────────────────────
//
// Une journée n'est pas une conversation : c'est une SUITE DE RENDEZ-VOUS.
// Chacun a son heure et sa question. Léa ouvre sur celui où l'on est, pas sur
// le premier de la liste. À 15 h elle ne demande pas le plat de midi : elle
// demande ce qui reste, ou ce qui se passe ce soir.
//
// ─── ET IL EST À LUI, PAS À NOUS ──────────────────────────────────────────
//
// « Un planning clair accessible au commerçant, qu'on peut même modifier s'il
// le veut, et où il pourra aussi mettre ses jours off. » C'est juste : nos
// heures par défaut sont une hypothèse sur un métier, pas une connaissance de
// SON commerce. Celui qui ferme le lundi et sert jusqu'à 15 h doit pouvoir le
// dire une fois, et ne plus jamais y penser.
//
// ─── CE QUE ÇA NE FAIT PAS ENCORE, ET IL FAUT LE DIRE ─────────────────────
//
// Ce fil décide de CE QU'ELLE DIT QUAND IL L'OUVRE. Il ne la fait pas venir
// à lui : une notification à 11 h 30 demande un serveur, des comptes et une
// autorisation système — trois choses qui n'existent pas encore ici. Le
// planning est la moitié qui se construit maintenant ; l'autre viendra avec
// le compte commerçant.

import type { CleMetier } from "@/lib/direct/apercu-habitant";

const CLE = "clikme.fil.v1";

/** Un rendez-vous de la journée : une heure, et ce qu'elle demande à ce moment-là. */
export type Rendezvous = {
  /** Identifiant stable — c'est lui qu'on stocke, pas le libellé. */
  cle: string;
  /** L'heure décimale à laquelle ce moment commence. */
  heure: number;
  /** Ce que c'est, en trois mots, pour la liste qu'il lit. */
  quoi: string;
  /** Ce que Léa demande à ce moment-là. C'est sa phrase, mot pour mot. */
  question: string;
  /** Éteint : elle passe au suivant. Un bar n'a pas de service de midi. */
  actif: boolean;
};

export type FilDuJour = {
  rendezvous: Rendezvous[];
  /** Les jours où elle ne dit rien. 0 = dimanche, 1 = lundi… */
  joursOff: number[];
};

/**
 * LES FILS PAR DÉFAUT, MÉTIER PAR MÉTIER.
 *
 * CE SONT DES HYPOTHÈSES, ET ELLES SE MODIFIENT. Un restaurant sert à midi et
 * le soir, une boulangerie vit le matin, un salon se remplit par annulations.
 * Ces heures-là sont ce qu'on croit savoir du métier ; lui sait le reste.
 *
 * LA RÈGLE DE COMPOSITION : chaque rendez-vous doit avoir une raison d'exister
 * à CETTE heure-là et pas une autre. « Une photo » à 11 h 30 parce que le plat
 * existe enfin ; « il vous en reste ? » à 13 h 30 parce que c'est là que la
 * dernière minute se joue ; « à donner ? » à 19 h parce que c'est l'heure où
 * l'on jette. Un rendez-vous sans raison d'heure est un rappel de plus, et un
 * rappel de plus se coupe au bout de trois jours.
 */
export const FIL_PAR_METIER: Record<string, Rendezvous[]> = {
  restaurant: [
    { cle: "midi", heure: 9.5, quoi: "Le service de midi", actif: true,
      question: "Quel est votre plat du jour, et à quel prix ?" },
    { cle: "photo", heure: 11.5, quoi: "La photo du plat", actif: true,
      question: "Le plat est prêt ? Une photo et je le mets en ligne." },
    { cle: "reste", heure: 13.5, quoi: "La dernière minute", actif: true,
      question: "Il vous en reste combien ?" },
    { cle: "bilan", heure: 14.5, quoi: "La fin de service", actif: true,
      question: "Service fini. Voilà ce que ça a donné." },
    { cle: "soir", heure: 17.5, quoi: "Le service du soir", actif: true,
      question: "Quelque chose de prévu ce soir ?" },
    { cle: "don", heure: 21.5, quoi: "Ce qui reste, plutôt que jeté", actif: false,
      question: "Il vous reste des choses à donner ?" },
  ],
  bar: [
    { cle: "soir", heure: 16, quoi: "Ce qui se passe ce soir", actif: true,
      question: "Qu’est-ce qui se passe chez vous ce soir, et à partir de quelle heure ?" },
    { cle: "photo", heure: 18, quoi: "L’ambiance", actif: true,
      question: "La terrasse est ouverte ? Une photo si vous voulez." },
    { cle: "places", heure: 20, quoi: "Les places libres", actif: true,
      question: "Il vous reste des tables ?" },
  ],
  coiffeur: [
    { cle: "creneaux", heure: 9, quoi: "Les créneaux du jour", actif: true,
      question: "Il vous reste des créneaux aujourd’hui, et à quelle heure ?" },
    { cle: "desist", heure: 11, quoi: "Les désistements", actif: true,
      question: "Une annulation à remplir ?" },
    { cle: "aprem", heure: 14.5, quoi: "L’après-midi", actif: true,
      question: "Des places cet après-midi ?" },
    { cle: "bilan", heure: 18.5, quoi: "La fin de journée", actif: true,
      question: "Journée finie. Voilà ce que ça a donné." },
  ],
  ongles: [
    { cle: "creneaux", heure: 9.5, quoi: "Les créneaux du jour", actif: true,
      question: "Il vous reste des créneaux aujourd’hui, et à quelle heure ?" },
    { cle: "desist", heure: 11.5, quoi: "Les désistements", actif: true,
      question: "Une annulation à remplir ?" },
    { cle: "montrer", heure: 16, quoi: "Une pose à montrer", actif: true,
      question: "Une réalisation à montrer aujourd’hui ?" },
    { cle: "bilan", heure: 18.5, quoi: "La fin de journée", actif: true,
      question: "Journée finie. Voilà ce que ça a donné." },
  ],
  mode: [
    { cle: "arrivage", heure: 10, quoi: "L’arrivage du jour", actif: true,
      question: "Qu’est-ce que vous avez reçu aujourd’hui, et à quel prix ?" },
    { cle: "vitrine", heure: 14, quoi: "La vitrine", actif: true,
      question: "Une pièce à mettre en avant cet après-midi ?" },
    { cle: "reste", heure: 17.5, quoi: "Les dernières tailles", actif: true,
      question: "Il vous reste des tailles sur quelque chose ?" },
  ],
  fleuriste: [
    { cle: "arrivage", heure: 8.5, quoi: "L’arrivage du matin", actif: true,
      question: "Qu’est-ce que vous avez de beau ce matin, et à quel prix ?" },
    { cle: "midi", heure: 12, quoi: "Les bouquets prêts", actif: true,
      question: "Des bouquets prêts à emporter ?" },
    { cle: "don", heure: 18, quoi: "Ce qui ne tiendra pas", actif: true,
      question: "Des fleurs qui ne tiendront pas demain ?" },
  ],
};

const parDefaut = (branche: CleMetier | string): FilDuJour => ({
  rendezvous: (FIL_PAR_METIER[branche] ?? FIL_PAR_METIER.restaurant).map((r) => ({ ...r })),
  joursOff: [],
});

/**
 * LE FIL VIDE EST UNE CONSTANTE — `useSyncExternalStore` compare les
 * instantanés par identité, et une fonction qui rend un objet neuf à chaque
 * appel fait boucler React jusqu'à l'écran blanc. C'est arrivé une fois dans
 * ce produit ; la règle vaut pour tout magasin qu'on ajoute.
 */
export const AUCUN_FIL: FilDuJour | null = null;
let cache: Record<string, FilDuJour> | null = null;

function lire(): Record<string, FilDuJour> {
  if (typeof window === "undefined") return {};
  if (cache) return cache;
  try {
    const brut = window.localStorage.getItem(CLE);
    cache = brut ? (JSON.parse(brut) as Record<string, FilDuJour>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

const abonnes = new Set<() => void>();

export function abonnerFil(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/** Son fil, tel qu'il l'a réglé — ou celui de son métier s'il n'y a pas touché. */
export function filDuJour(commerce: string, branche: CleMetier | string): FilDuJour {
  const v = lire()[commerce];
  if (!v) return parDefaut(branche);
  // ON REPART TOUJOURS DU DÉFAUT ET ON APPLIQUE SES RÉGLAGES PAR-DESSUS : le
  // jour où l'on ajoute un rendez-vous au métier, ceux qui ont déjà réglé leur
  // fil doivent le voir apparaître, pas rester avec la liste de l'an dernier.
  const sien = new Map(v.rendezvous?.map((r) => [r.cle, r]) ?? []);
  return {
    rendezvous: parDefaut(branche).rendezvous.map((r) => {
      const s = sien.get(r.cle);
      return s ? { ...r, heure: s.heure, actif: s.actif } : r;
    }),
    joursOff: Array.isArray(v.joursOff) ? v.joursOff : [],
  };
}

export function enregistrerFil(commerce: string, f: FilDuJour) {
  const v = { ...lire(), [commerce]: f };
  cache = v;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* Quota plein : on garde en mémoire, l'écran continue. */
  }
  abonnes.forEach((x) => x());
}

/**
 * OÙ ON EN EST DANS SA JOURNÉE — le dernier rendez-vous commencé.
 *
 * PAS LE PLUS PROCHE, LE DERNIER COMMENCÉ. À 15 h, le plus proche serait celui
 * de 17 h 30 : Léa parlerait du service du soir alors qu'il vient de finir
 * celui de midi et qu'il a peut-être encore trois portions à écouler. Le
 * dernier commencé est celui dans lequel il EST.
 *
 * Avant le premier, on rend le premier : ouvrir à 7 h, c'est préparer midi.
 */
export function ouEnEstOn(f: FilDuJour, heure: number): Rendezvous | null {
  const actifs = f.rendezvous.filter((r) => r.actif).sort((a, b) => a.heure - b.heure);
  if (!actifs.length) return null;
  let courant = actifs[0];
  for (const r of actifs) if (heure >= r.heure) courant = r;
  return courant;
}

/** Ce qui vient après — pour qu'elle puisse dire quand elle repassera. */
export function apresCa(f: FilDuJour, heure: number): Rendezvous | null {
  return (
    f.rendezvous
      .filter((r) => r.actif && r.heure > heure)
      .sort((a, b) => a.heure - b.heure)[0] ?? null
  );
}

/** Les jours, dans l'ordre où on les lit — lundi d'abord, comme un agenda. */
export const JOURS = [
  { n: 1, l: "Lun" },
  { n: 2, l: "Mar" },
  { n: 3, l: "Mer" },
  { n: 4, l: "Jeu" },
  { n: 5, l: "Ven" },
  { n: 6, l: "Sam" },
  { n: 0, l: "Dim" },
];

/** Vrai si c'est un jour où il ne travaille pas — Léa se tait ce jour-là. */
export function estJourOff(f: FilDuJour, quand: Date = new Date()): boolean {
  return f.joursOff.includes(quand.getDay());
}

/** L'heure telle qu'on l'écrit dans le planning. */
export function hhmm(h: number): string {
  const m = Math.round((h % 1) * 60);
  return m ? `${Math.floor(h)} h ${String(m).padStart(2, "0")}` : `${Math.floor(h)} h`;
}
