// CE QU'IL PROPOSE TOUS LES JOURS — coché une fois, appliqué tout seul.
//
// ─── LA DEMANDE, ET ELLE EST JUSTE ────────────────────────────────────────
//
// « Ces options devraient être proposées automatiquement dans son annonce s'il
// a coché les cases sur son profil, et Léa devra les mettre dans son résumé
// quand elle lui a demandé son menu du jour avec prix et portions. Et elles
// pourront être supprimées d'un clic si certaines ne lui paraissent pas
// possibles pour le jour en question. »
//
// ─── CE QUE ÇA CHANGE, ET C'EST PLUS QU'UN CONFORT ────────────────────────
//
// Jusqu'ici, une annonce ne contenait que ce qu'il avait dit à voix haute ce
// matin-là. Or un restaurant qui veut remplir ses heures creuses le veut TOUS
// LES JOURS ; il ne va pas le redire chaque matin, et au troisième jour il ne
// le dit plus du tout. Ce qui est permanent doit se déclarer une fois.
//
// LE PIÈGE ÉVITÉ : un réglage coché une fois et appliqué en silence devient
// une annonce qu'il n'a pas voulue. C'est pour ça que rien ne part sans
// passer par la carte à valider, et que chaque option s'enlève d'un doigt pour
// LE JOUR EN COURS sans jamais toucher au réglage permanent. Cocher décide de
// ce qui est PROPOSÉ, jamais de ce qui est publié.
//
// ─── POURQUOI ELLES EXISTENT DÉJÀ DANS LE PAQUET ──────────────────────────
//
// Aucune n'invente un affichage : les heures creuses sont un moment avec sa
// fenêtre et son prix barré, la tablée est un `collectif`, les dernières
// portions sont `places` + `prixBarre`, le don est `offert`. On branche du
// permanent sur des cartes qui savent déjà les montrer.

import type { CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";

const CLE = "clikme.options.v1";

/** Un réglage chiffré d'une option — ce qu'il ajuste sans y penser deux fois. */
export type Reglage = { cle: string; label: string; valeur: number; unite: string };

export type OptionAnnonce = {
  cle: string;
  /** Le titre tel qu'il se lit sur son profil ET sur la carte. */
  titre: string;
  /** Pourquoi ça existe, en une ligne — il coche en connaissance de cause. */
  quoi: string;
  icone: string;
  /** Cochée : Léa la proposera à chaque annonce. */
  cochee: boolean;
  /** Les chiffres de cette option. Vides pour celles qui n'en ont pas. */
  reglages: Reglage[];
};

/**
 * LE CATALOGUE, MÉTIER PAR MÉTIER.
 *
 * CE SONT DES FAÇONS DE REMPLIR UNE JOURNÉE, pas des fonctionnalités. Chacune
 * répond à un problème que le commerçant a déjà : le creux de 11 h, ce qui va
 * partir à la poubelle, la table de quatre occupée par deux.
 *
 * AUCUNE N'EST COCHÉE PAR DÉFAUT. Une option cochée d'avance est une décision
 * prise à sa place — la même faute que la fiche Google mise d'office, qu'il a
 * relevée. Il coche ce qu'il veut, et ce qu'il ne coche pas n'existe pas.
 */
export const OPTIONS_PAR_METIER: Record<string, OptionAnnonce[]> = {
  restaurant: [
    {
      cle: "creux",
      titre: "Je remplis mes heures creuses",
      quoi: "Quelques places à prix réduit juste avant le coup de feu.",
      icone: "🕚",
      cochee: false,
      reglages: [
        { cle: "places", label: "places", valeur: 4, unite: "" },
        { cle: "remise", label: "de remise", valeur: 20, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 11, unite: "h" },
        { cle: "a", label: "jusqu’à", valeur: 11.5, unite: "h" },
      ],
    },
    {
      cle: "reste",
      titre: "Il m’en reste : dernières portions",
      quoi: "En fin de service, ce qui reste part à prix cassé.",
      icone: "⏳",
      cochee: false,
      reglages: [
        { cle: "remise", label: "de remise", valeur: 40, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 13.5, unite: "h" },
      ],
    },
    {
      cle: "tablee",
      titre: "Partager une table avec des inconnus",
      quoi: "Une grande table où l’on s’assoit à plusieurs.",
      icone: "🍽️",
      cochee: false,
      reglages: [{ cle: "places", label: "places", valeur: 6, unite: "" }],
    },
    {
      cle: "don",
      titre: "Je donne ce que je jette",
      quoi: "Ce qui n’est pas vendu à la fermeture, offert plutôt que jeté.",
      icone: "🎁",
      cochee: false,
      reglages: [{ cle: "de", label: "à partir de", valeur: 21.5, unite: "h" }],
    },
  ],
  bar: [
    {
      cle: "creux",
      titre: "Je remplis mes heures creuses",
      quoi: "L’apéro à prix réduit avant que ça se remplisse.",
      icone: "🕕",
      cochee: false,
      reglages: [
        { cle: "places", label: "places", valeur: 8, unite: "" },
        { cle: "remise", label: "de remise", valeur: 20, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 17, unite: "h" },
        { cle: "a", label: "jusqu’à", valeur: 18.5, unite: "h" },
      ],
    },
    {
      cle: "tablee",
      titre: "Partager une table avec des inconnus",
      quoi: "Une tablée où l’on s’assoit sans se connaître.",
      icone: "🍷",
      cochee: false,
      reglages: [{ cle: "places", label: "places", valeur: 6, unite: "" }],
    },
    {
      cle: "don",
      titre: "Je donne ce que je jette",
      quoi: "L’ardoise de fin de soirée, offerte plutôt que jetée.",
      icone: "🎁",
      cochee: false,
      reglages: [{ cle: "de", label: "à partir de", valeur: 23, unite: "h" }],
    },
  ],
  coiffeur: [
    {
      cle: "creux",
      titre: "Je remplis mes heures creuses",
      quoi: "Les créneaux du milieu d’après-midi, à prix réduit.",
      icone: "🕒",
      cochee: false,
      reglages: [
        { cle: "places", label: "créneaux", valeur: 2, unite: "" },
        { cle: "remise", label: "de remise", valeur: 20, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 14, unite: "h" },
        { cle: "a", label: "jusqu’à", valeur: 16, unite: "h" },
      ],
    },
    {
      cle: "reste",
      titre: "Il me reste des créneaux",
      quoi: "En fin de journée, ce qui n’est pas pris part moins cher.",
      icone: "⏳",
      cochee: false,
      reglages: [
        { cle: "remise", label: "de remise", valeur: 30, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 17, unite: "h" },
      ],
    },
  ],
  ongles: [
    {
      cle: "creux",
      titre: "Je remplis mes heures creuses",
      quoi: "Les créneaux du milieu de journée, à prix réduit.",
      icone: "🕒",
      cochee: false,
      reglages: [
        { cle: "places", label: "créneaux", valeur: 2, unite: "" },
        { cle: "remise", label: "de remise", valeur: 20, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 14, unite: "h" },
        { cle: "a", label: "jusqu’à", valeur: 16, unite: "h" },
      ],
    },
    {
      cle: "reste",
      titre: "Il me reste des créneaux",
      quoi: "En fin de journée, ce qui n’est pas pris part moins cher.",
      icone: "⏳",
      cochee: false,
      reglages: [
        { cle: "remise", label: "de remise", valeur: 30, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 17, unite: "h" },
      ],
    },
  ],
  mode: [
    {
      cle: "reste",
      titre: "Dernières tailles, dernier jour",
      quoi: "Ce qu’il reste d’une série, à prix réduit.",
      icone: "🏷️",
      cochee: false,
      reglages: [
        { cle: "remise", label: "de remise", valeur: 30, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 16, unite: "h" },
      ],
    },
    {
      cle: "creux",
      titre: "Je remplis mes heures creuses",
      quoi: "Un conseil personnalisé quand la boutique est vide.",
      icone: "🕒",
      cochee: false,
      reglages: [
        { cle: "places", label: "personnes", valeur: 3, unite: "" },
        { cle: "remise", label: "de remise", valeur: 10, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 14, unite: "h" },
        { cle: "a", label: "jusqu’à", valeur: 16, unite: "h" },
      ],
    },
  ],
  fleuriste: [
    {
      cle: "reste",
      titre: "Il m’en reste : derniers bouquets",
      quoi: "En fin de journée, ce qui reste part à prix cassé.",
      icone: "⏳",
      cochee: false,
      reglages: [
        { cle: "remise", label: "de remise", valeur: 40, unite: "%" },
        { cle: "de", label: "à partir de", valeur: 17, unite: "h" },
      ],
    },
    {
      cle: "don",
      titre: "Je donne ce que je jette",
      quoi: "Les fleurs qui ne tiendront pas demain, offertes.",
      icone: "🎁",
      cochee: false,
      reglages: [{ cle: "de", label: "à partir de", valeur: 18, unite: "h" }],
    },
  ],
};

const parDefaut = (branche: CleMetier | string): OptionAnnonce[] =>
  (OPTIONS_PAR_METIER[branche] ?? OPTIONS_PAR_METIER.restaurant).map((o) => ({
    ...o,
    reglages: o.reglages.map((r) => ({ ...r })),
  }));

export const AUCUNE_OPTION: OptionAnnonce[] = [];
let cache: Record<string, OptionAnnonce[]> | null = null;

function lire(): Record<string, OptionAnnonce[]> {
  if (typeof window === "undefined") return {};
  if (cache) return cache;
  try {
    const brut = window.localStorage.getItem(CLE);
    cache = brut ? (JSON.parse(brut) as Record<string, OptionAnnonce[]>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * SES OPTIONS — les nôtres, avec ses réglages par-dessus.
 *
 * On repart TOUJOURS du catalogue du métier : le jour où l'on ajoute une
 * option, celui qui a déjà réglé les siennes doit la voir apparaître, pas
 * rester avec la liste de l'an dernier. Même règle que le fil de la journée.
 */
export function optionsDe(commerce: string, branche: CleMetier | string): OptionAnnonce[] {
  const v = lire()[commerce];
  if (!v) return parDefaut(branche);
  const sien = new Map(v.map((o) => [o.cle, o]));
  return parDefaut(branche).map((o) => {
    const s = sien.get(o.cle);
    if (!s) return o;
    const vals = new Map((s.reglages ?? []).map((r) => [r.cle, r.valeur]));
    return {
      ...o,
      cochee: s.cochee === true,
      reglages: o.reglages.map((r) => ({ ...r, valeur: vals.get(r.cle) ?? r.valeur })),
    };
  });
}

export function enregistrerOptions(commerce: string, v: OptionAnnonce[]) {
  const tout = { ...lire(), [commerce]: v };
  cache = tout;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(tout));
  } catch {
    /* Quota plein : on garde en mémoire, l'écran continue. */
  }
}

const val = (o: OptionAnnonce, cle: string, defaut: number) =>
  o.reglages.find((r) => r.cle === cle)?.valeur ?? defaut;

/** L'heure telle qu'on l'écrit sur une annonce. */
const hhmm = (h: number) => {
  const m = Math.round((h % 1) * 60);
  return m ? `${Math.floor(h)} h ${String(m).padStart(2, "0")}` : `${Math.floor(h)} h`;
};

/** Le prix réduit, écrit comme un prix — « 11,20 € » et pas « 11.2 ». */
function reduit(prix: string, remise: number): string {
  const n = Number(prix.replace(",", ".").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  const r = n * (1 - remise / 100);
  const arrondi = r >= 10 ? Math.round(r) : Math.round(r * 2) / 2;
  return `${String(arrondi).replace(".", ",")} €`;
}

/**
 * CE QUE CHAQUE OPTION DEVIENT SUR L'ANNONCE.
 *
 * Une option n'est pas une décoration : elle produit un MOMENT, avec sa
 * fenêtre, son prix et son bouton — exactement comme si le commerçant l'avait
 * dictée. C'est ce qui garantit qu'elle s'affiche vraiment dans le paquet et
 * qu'elle n'est pas une case à cocher qui ne fait rien.
 *
 * ELLE S'APPUIE SUR L'ANNONCE PRINCIPALE : le titre du plat, son prix. Sans
 * plat, une heure creuse n'a rien à vendre — on ne rend donc rien.
 */
export function momentDeLOption(
  o: OptionAnnonce,
  base: { titre: string; prix: string; icone: string },
  heure: number,
): Omit<MomentJour, "publie"> | null {
  if (!base.titre.trim()) return null;
  const commun = { envies: [] as string[], icone: o.icone };

  if (o.cle === "creux") {
    const de = val(o, "de", 11);
    const a = val(o, "a", 11.5);
    const remise = val(o, "remise", 20);
    const bas = reduit(base.prix, remise);
    return {
      ...commun,
      de,
      a,
      quand: `${hhmm(de)} – ${hhmm(a)}`,
      titre: `${base.titre} avec l’équipe`,
      lignes: [`${val(o, "places", 4)} places à l’heure creuse`],
      prix: bas || undefined,
      prixBarre: bas ? base.prix : undefined,
      etiquette: `−${remise} %`,
      places: val(o, "places", 4),
      action: "Je prends une place",
    };
  }

  if (o.cle === "reste") {
    const de = Math.max(heure, val(o, "de", 13.5));
    const remise = val(o, "remise", 40);
    const bas = reduit(base.prix, remise);
    return {
      ...commun,
      de,
      a: Math.min(24, de + 1.5),
      quand: `à partir de ${hhmm(de)}`,
      titre: `${base.titre} — dernières portions`,
      lignes: ["Ce qui reste part à prix réduit"],
      prix: bas || undefined,
      prixBarre: bas ? base.prix : undefined,
      etiquette: `−${remise} %`,
      action: "Gardez-m’en une part",
    };
  }

  if (o.cle === "tablee") {
    const places = val(o, "places", 6);
    return {
      ...commun,
      de: heure,
      a: Math.min(24, heure + 4),
      quand: "ce midi",
      titre: "La table partagée",
      lignes: ["On s’assoit à plusieurs, on ne se connaît pas"],
      prix: base.prix || undefined,
      places,
      action: "Je prends une place",
      collectif: { objectif: places, participants: 0, debloque: "la table est lancée" },
    };
  }

  if (o.cle === "don") {
    const de = val(o, "de", 21.5);
    return {
      ...commun,
      de,
      a: Math.min(24, de + 1),
      quand: `à partir de ${hhmm(de)}`,
      titre: "Ce qui reste, plutôt que jeté",
      lignes: ["À prendre sur place, tant qu’il y en a"],
      offert: true,
      action: "Je passe les prendre",
    };
  }

  return null;
}
