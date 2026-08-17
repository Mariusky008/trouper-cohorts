// LES FAÇONS, MISES EN FORME POUR LA CARTE.
//
// Un seul endroit pour les trois écrans qui affichent des cartes. La mise en
// forme dépend de l'HEURE (« Arrivée avant 12 h 47 »), donc elle ne peut pas se
// faire dans la carte, qui est un composant client : le rendu du serveur et
// celui du navigateur donneraient deux textes différents, et React signalerait
// une divergence à chaque annonce.
//
// C'est aussi ce qui garantit que la même campagne se lit pareil dans le fil et
// dans Mes commerces — deux formulations pour un même prix, et l'habitant croit
// à deux offres.
import { etatDe, manque, FACON_LABEL, FACON_PROMESSE, avancement, type Campagne } from "./cliks";

/** Le prix d'une façon : ce qu'on paie AVEC elle.
 *
 *  Le cadeau se prend au prix normal — c'est sa définition, on ne paie pas
 *  moins, on reçoit en plus. Les deux autres affichent leur prix réduit. */
function prixDe(c: Campagne): number | null {
  if (c.type === "cadeau" || c.type === "simple") return c.prixInitial;
  return c.prixGroupe ?? c.prixInitial;
}

const euro = (v: number | null): string =>
  v == null ? "" : `${v.toFixed(2).replace(/[.,]00$/, "").replace(".", ",")} €`;

/** L'heure limite en clair, dans le fuseau de la ville. */
function heureCourte(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    // `2-digit` est nécessaire pour obtenir « 09:56 » de façon stable, mais on
    // n'écrit pas « 09 h 56 » en français : on dit « 9 h 56 ». Le zéro de tête
    // ne se voyait presque pas tant que l'heure servait de badge ; depuis que la
    // plage d'un express s'écrit « Entre 09 h 56 et 10 h 06 », il se lit comme
    // une horloge d'ordinateur au milieu d'une phrase.
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
    })
      .format(new Date(t))
      .replace(":", " h ")
      .replace(/^0/, "");
  } catch {
    return "";
  }
}

/** Aujourd'hui, ou un autre jour ? Une heure seule (« avant 12 h 47 ») ne veut
 *  rien dire si l'échéance tombe demain. */
function memeJour(iso: string, maintenant: number): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  const jour = (x: number) => {
    try {
      return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short" }).format(new Date(x));
    } catch {
      return String(new Date(x).getUTCDate());
    }
  };
  return jour(t) === jour(maintenant);
}

/**
 * La contrainte de temps, formulée SELON LA FAÇON.
 *
 * Les trois n'ont pas le même rapport au temps, et le dire pareil les rendrait
 * interchangeables :
 *   · le cadeau court jusqu'à la fin — « Aujourd'hui, jusqu'à 13 h 45 » ;
 *   · l'express récompense la vitesse — « Arrivée avant 12 h 47 » ;
 *   · le groupe se ferme — « Groupe fermé à 12 h 20 ».
 */
function quandDe(c: Campagne, maintenant: number): string {
  const h = heureCourte(c.echeance);
  if (!h) return "";
  const auj = memeJour(c.echeance, maintenant);
  if (c.type === "express") {
    // UNE PLAGE SE DIT AVEC SES DEUX BOUTS. « Arrivée avant 11 h 45 » sur un
    // service qui ne commence qu'à 11 h 30 ferait venir à 11 h des gens qui
    // trouveraient porte close — et le commerçant, lui, croyait avoir annoncé
    // un créneau de quinze minutes.
    //
    // Le début n'est dit que s'il est ENCORE DEVANT : une fois 11 h 30 passée,
    // « entre 11 h 30 et 11 h 45 » se lit comme une consigne d'attente alors
    // qu'il faut venir maintenant.
    const d = c.debut ? Date.parse(c.debut) : NaN;
    if (Number.isFinite(d) && d > maintenant) {
      const hd = heureCourte(c.debut);
      if (hd) return memeJour(c.debut, maintenant) ? `Entre ${hd} et ${h}` : `Entre ${hd} et ${h}, demain`;
    }
    return auj ? `Arrivée avant ${h}` : `Arrivée avant ${h}, demain`;
  }
  if (c.type === "collectif") return auj ? `Groupe fermé à ${h}` : `Groupe fermé à ${h}, demain`;
  if (c.type === "simple") return auj ? `À prendre avant ${h}` : `À prendre avant ${h}, demain`;
  return auj ? `Aujourd'hui, jusqu'à ${h}` : `Jusqu'à ${h}, demain`;
}

export type FaconVue = {
  id: string;
  type: "simple" | "cadeau" | "express" | "collectif";
  label: string;
  promesse: string;
  prix: string;
  quand: string;
  compte: string;
  part: number | null;
  etat: "ouverte" | "presque" | "complete" | "epuise";
  /** VRAI quand cette personne a déjà pris cette façon. La carte cesse alors de
   *  la proposer : elle la confirme. */
  mienne: boolean;
};

/**
 * Les façons d'une annonce, prêtes à afficher.
 *
 * Les terminées sont RETIRÉES : une échéance passée n'est pas un choix, et la
 * laisser à l'écran ferait cliquer sur une porte fermée. Une façon épuisée,
 * elle, RESTE — barrée. La nuance compte : « tout est parti » raconte que
 * d'autres l'ont prise, ce qui donne envie des deux autres.
 */
export function faconsVue(
  facons: readonly Campagne[] | undefined,
  /** Les campagnes auxquelles CETTE personne participe déjà. La carte ne doit
   *  pas reproposer ce qui est acquis : on lisait « 16 € · table à partager »
   *  sur une offre rejointe dix minutes plus tôt, ce qui donnait l'impression
   *  qu'il fallait recommencer.
   *
   *  AVANT `maintenant`, et c'est délibéré : l'horloge garde sa valeur par
   *  défaut, évaluée DANS la fonction. Passée par l'appelant, elle serait lue
   *  pendant le rendu d'un composant — ce que la règle `react-hooks/purity`
   *  refuse, à raison. */
  miennes?: ReadonlySet<string>,
  maintenant: number = Date.now()
): FaconVue[] {
  const out: FaconVue[] = [];
  for (const c of facons ?? []) {
    const etat = etatDe(c, maintenant);
    if (etat === "terminee") continue;
    const m = manque(c);
    out.push({
      id: c.id,
      type: c.type,
      // Le nom du commerçant prime sur le nôtre : « table à partager » ne veut
      // rien dire chez un fleuriste, et c'est lui qui connaît son métier.
      label: c.nom || FACON_LABEL[c.type],
      promesse: FACON_PROMESSE[c.type],
      // Un « à prendre » sans prix affiche « Prix habituel » : écrire « 0 € »
      // ou laisser vide ferait croire à la gratuité.
      prix: c.type === "simple" && !c.prixInitial ? "Prix habituel" : euro(prixDe(c)),
      quand: quandDe(c, maintenant),
      // Le compteur ne s'affiche que pour le groupe, et il dit COMBIEN SONT
      // DÉJÀ LÀ plutôt que combien il manque : sur une carte du fil, on choisit
      // une porte, on ne calcule pas. Le « combien il manque » revient sur
      // l'écran du Clik, où il devient une raison d'appuyer.
      compte:
        c.type === "collectif" && c.objectif
          ? m > 0
            ? `${c.participants} / ${c.objectif} déjà intéressés`
            : "C'est complet, le prix est débloqué"
          : "",
      part: c.type === "collectif" ? avancement(c) : null,
      etat,
      mienne: miennes?.has(c.id) ?? false,
    });
  }
  return out;
}
