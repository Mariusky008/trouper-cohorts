// LE PLAT DU JOUR, ET LE MOMENT DE LA JOURNÉE.
//
// Ce module ne contient AUCUN pixel : il ne dit pas à quoi ressemble l'écran,
// il dit ce qui est vrai. Le dessin arrive séparément, et ces règles ne
// bougeront pas avec lui.
//
// TROIS RÈGLES, et la première est la seule qui compte vraiment :
//
//   1. LE MOMENT TRIE, IL NE FILTRE PAS. À midi, les menus remontent en tête ;
//      ils ne masquent rien. Une place libre à 11 h 30 reste visible à 11 h —
//      elle remonte même très haut, puisqu'elle expire dans l'heure. Filtrer
//      par l'heure rendrait invisible ce qui est le plus urgent.
//
//   2. CE QUI MEURT LE PLUS TÔT PASSE DEVANT. Un fil chronologique est bavard ;
//      un fil trié par échéance est utile. À 14 h, un créneau à 15 h vaut plus
//      qu'une offre valable jusqu'à dimanche.
//
//   3. UN PLAT DU JOUR MEURT À LA FIN DU SERVICE, PAS À MINUIT. C'est le
//      reproche fait à toutes les applications de ville : à 15 h, elles
//      affichent encore le menu de midi et paraissent mortes.
import { heureLocale } from "./degradation";
import { modeleDuMetier } from "./modeles-fiche";
import type { Publication } from "./publications";

const str = (v: unknown) => (v == null ? "" : String(v));

export const MOMENTS = ["matin", "dejeuner", "apresmidi", "soir", "nuit"] as const;
export type Moment = (typeof MOMENTS)[number];

/** Les bornes sont larges à dessein : quelqu'un qui ouvre à 10 h 05 cherche
 *  déjà où déjeuner, et à 13 h 55 il cherche encore. */
export function momentDuJour(quand: Date = new Date()): Moment {
  const h = heureLocale(quand);
  if (h >= 7 && h < 10) return "matin";
  if (h >= 10 && h < 14) return "dejeuner";
  if (h >= 14 && h < 17) return "apresmidi";
  if (h >= 17 && h < 23) return "soir";
  return "nuit";
}

/**
 * Qui peut publier un plat du jour.
 *
 * UNE SEULE DÉFINITION, celle du modèle de fiche. Ce module tenait sa propre
 * liste de métiers, et elle avait déjà divergé : un café obtenait la fiche
 * « Menu du jour » mais se voyait refuser la publication d'un plat du jour.
 * Deux endroits décidaient qui sert à manger — il n'en faut qu'un.
 *
 * Un métier qui n'a rien de neuf chaque jour ne doit PAS pouvoir publier ici :
 * une seule publication ennuyeuse et l'habitant cesse d'ouvrir l'application.
 */
export function estRestauration(activite: string): boolean {
  return modeleDuMetier(str(activite)) === "menu";
}

/** Fin du service, en heure LOCALE, au format ISO.
 *
 *  Midi s'arrête à 14 h 30, le soir à 22 h 30. Si l'heure est déjà passée, on
 *  vise le service suivant : un plat publié à 15 h est celui du soir, pas un
 *  menu déjà expiré à la seconde où il est enregistré. */
export function finDeService(quand: Date = new Date(), service?: "midi" | "soir"): string {
  // On ne CALCULE pas quel service viser, on essaie les échéances dans l'ordre
  // et on prend la première encore à venir. La version qui déduisait le service
  // de l'heure se trompait à 23 h : elle visait le dîner du lendemain alors que
  // le prochain service est le déjeuner.
  const candidats = service
    ? [instantLocal(quand, service === "midi" ? 14 : 22, 30, 0), instantLocal(quand, service === "midi" ? 14 : 22, 30, 1)]
    : [
        instantLocal(quand, 14, 30, 0), // le déjeuner du jour
        instantLocal(quand, 22, 30, 0), // le dîner du jour
        instantLocal(quand, 14, 30, 1), // le déjeuner de demain
      ];
  for (const t of candidats) if (t > quand.getTime()) return new Date(t).toISOString();
  return new Date(candidats[candidats.length - 1]).toISOString();
}

/** L'instant correspondant à `h:m` en heure LOCALE, `joursPlus` jours plus tard.
 *
 *  Calculé par écart depuis l'heure locale courante, jamais avec `setHours` :
 *  le serveur n'est pas dans le fuseau de la ville. Réserve honnête : les deux
 *  nuits de changement d'heure par an décalent le résultat d'une heure — sans
 *  conséquence ici, où l'échéance sert à retirer un menu du fil. */
function instantLocal(quand: Date, h: number, m: number, joursPlus: number): number {
  const minutesMaintenant = heureLocale(quand) * 60 + minuteLocale(quand);
  const ecart = h * 60 + m - minutesMaintenant + joursPlus * 1440;
  return quand.getTime() + ecart * 60_000;
}

function minuteLocale(quand: Date): number {
  try {
    const p = new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone: "Europe/Paris" }).formatToParts(quand);
    const n = Number(p.find((x) => x.type === "minute")?.value);
    return Number.isFinite(n) ? n : quand.getUTCMinutes();
  } catch {
    return quand.getUTCMinutes();
  }
}

/** Ce qu'un moment met en avant. Une famille absente n'est pas exclue : elle
 *  passe simplement après. */
const EN_TETE: Record<Moment, ReadonlySet<string>> = {
  matin: new Set(["offre", "ville"]),
  dejeuner: new Set(["menu"]),
  apresmidi: new Set(["place"]),
  soir: new Set(["evenement", "menu"]),
  nuit: new Set(),
};

const MS_LOIN = Number.MAX_SAFE_INTEGER;

/** Millisecondes avant disparition. Sans échéance : traité comme très loin,
 *  donc en fin de groupe — jamais exclu. */
function expireDans(p: Pick<Publication, "expireLe">, maintenant: number): number {
  const t = p.expireLe ? Date.parse(p.expireLe) : NaN;
  return Number.isFinite(t) ? Math.max(0, t - maintenant) : MS_LOIN;
}

/**
 * Le tri du fil pour un moment donné.
 *
 * Deux groupes seulement — « ce que ce moment met en avant », puis le reste — et
 * dans chaque groupe, la plus courte échéance d'abord. Volontairement simple :
 * un score pondéré à cinq facteurs se règle au doigt mouillé et devient
 * indébogable au premier utilisateur qui trouve l'ordre bizarre.
 */
export function trierParMoment<T extends Pick<Publication, "famille" | "expireLe" | "publieLe">>(
  publications: readonly T[],
  moment: Moment = momentDuJour(),
  maintenant: number = Date.now()
): T[] {
  const tete = EN_TETE[moment];
  return [...publications].sort((a, b) => {
    const ga = tete.has(String(a.famille)) ? 0 : 1;
    const gb = tete.has(String(b.famille)) ? 0 : 1;
    if (ga !== gb) return ga - gb;
    const ea = expireDans(a, maintenant);
    const eb = expireDans(b, maintenant);
    if (ea !== eb) return ea - eb;
    // À égalité stricte, le plus récent d'abord : c'est le seul cas où la
    // chronologie a encore un sens.
    return Date.parse(str(b.publieLe)) - Date.parse(str(a.publieLe));
  });
}

/** Le libellé du moment, côté habitant. « nuit » n'a pas de nom : à 3 h du
 *  matin on ne met rien en avant, et l'écran garde son titre habituel. */
export const MOMENT_LABEL: Record<Moment, string> = {
  matin: "Ce matin",
  dejeuner: "Le déjeuner",
  apresmidi: "Maintenant",
  soir: "Ce soir",
  nuit: "",
};
