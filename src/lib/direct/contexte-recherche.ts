// 🔎 LA RECHERCHE DU FANTÔME SE MONTRE DANS LE MONDE DU SALON.
//
// « La vidéo Recherche ne peut effectivement pas rester "vêtements" pour tous
// les métiers. Je ne ferais pas 50 vidéos : 4 variantes suffisent. Le moteur
// choisit la vidéo selon le sujet du salon. »
//
//   · `fashion_beauty` — vêtements, coiffure, ongles, bijoux, lunettes ;
//   · `food`           — restaurants, boulangeries, cafés ;
//   · `going_out`      — terrasses, concerts, bars, événements ;
//   · `generic`        — tout le reste, et quand on ne sait pas.
//
// DANS LE DOUTE, `generic` : un salon de fleuriste ou de librairie ne doit
// jamais voir passer des pulls. `familleDuDouble` répond « mode » quand elle
// ne reconnaît rien ; ici, ce « mode » par défaut ne vaut que pour une vraie
// boutique de mode.

import { familleDuDouble } from "./double-metiers";

export type ContexteRecherche = "fashion_beauty" | "food" | "going_out" | "generic";

export function contexteDeRecherche(p: {
  /** Le salon parle d'une sortie (un concert, un bar à vins…). */
  sortie?: boolean;
  /** Le commerce dont parle le salon, s'il y en a un. */
  carte?: { branche?: string | null; metier?: string | null };
}): ContexteRecherche {
  if (p.sortie) return "going_out";
  const c = p.carte;
  if (!c) return "generic";
  const m = (c.metier ?? "").toLowerCase();
  switch (familleDuDouble(c)) {
    case "coiffure":
    case "ongles":
    case "lunettes":
      return "fashion_beauty";
    case "mode":
      return c.branche === "mode" || /v[êe]tement|pr[êe]t-[àa]-porter|mode|friperie|chauss|maroquin|lingerie|boutique/.test(m)
        ? "fashion_beauty"
        : "generic";
    case "createur":
      return /bijou|bracelet|collier|bague|joaill/.test(m) ? "fashion_beauty" : "generic";
    case "table":
      return "food";
    case "bar":
      return "going_out";
    default:
      return "generic";
  }
}
