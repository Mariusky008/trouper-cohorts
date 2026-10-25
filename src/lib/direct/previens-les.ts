/**
 * 📲 « OUI, PRÉVIENS-LES » — Mike écrit, le commerçant envoie, depuis SON WhatsApp.
 *
 * C'est l'étape 3 des cages (`docs/les-cages.md`). Dans le carnet, certains ont
 * laissé leur numéro à la fin d'une vidéo : « prévenez-moi quand une table se
 * libère ». Mike, l'assistant du comptoir, le propose (« 3 personnes attendent
 * ton signal ») ; le commerçant dit ce qui est VRAI aujourd'hui — quand, combien
 * de places s'il le sait, un petit plus s'il en veut un — et Mike écrit un message
 * par personne. Chacun part du WhatsApp du commerçant, à cette personne seulement :
 * jamais ClikMe, jamais toute la ville.
 *
 * LES RÈGLES DU CARNET DE MESSAGES, tenues ici (et revérifiées par la route) :
 *   · deux messages par semaine au plus, et pas deux le même jour ;
 *   · rien avant 9 h ni après 20 h 30 (heure de Paris) ;
 *   · un petit plus au plus un message sur cinq, jamais deux fois le même ;
 *     jamais d'alcool offert (loi Évin) ; et c'est le commerçant qui le choisit ;
 *   · pas de fausse urgence : les places, c'est lui qui les donne, ou on n'en parle pas ;
 *   · une seule question, à la fin, facile.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { FamilleDouble } from "./double-metiers";
import type { MessageEnvoye } from "./carnet";

/** Ce qui se libère chez lui : une table, un créneau — ou on passe, tout simplement. */
export type Sorte = "table" | "creneau" | "passage";

export function sorteDe(famille: FamilleDouble): Sorte {
  if (famille === "table" || famille === "bar") return "table";
  if (famille === "coiffure" || famille === "ongles" || famille === "seance") return "creneau";
  return "passage";
}

/** Les « quand » qu'on lui propose d'un appui (il peut ajouter l'heure). */
export function quandsDe(famille: FamilleDouble): string[] {
  if (famille === "table") return ["ce midi", "ce soir", "demain midi", "demain soir"];
  if (famille === "bar") return ["ce soir", "demain soir"];
  if (sorteDe(famille) === "creneau") return ["aujourd’hui", "demain"];
  return ["aujourd’hui", "demain", "ce week-end"];
}

/** Des petits plus à toucher, selon le métier — jamais imposés, jamais d'alcool. Le reste, il l'écrit. */
export function plusDe(famille: FamilleDouble): string[] {
  const p: Partial<Record<FamilleDouble, string[]>> = {
    table: ["le café", "le dessert", "une mise en bouche"],
    bar: ["une planche à partager", "le café"],
    coiffure: ["le soin", "le brushing"],
    ongles: ["le soin des mains", "la pose de vernis"],
    seance: ["le thé", "dix minutes de plus"],
    fleurs: ["une fleur en plus", "l’emballage cadeau"],
    mode: ["la retouche", "l’emballage cadeau"],
    createur: ["l’emballage cadeau", "un petit cadeau"],
    lunettes: ["le nettoyage des lunettes", "un étui"],
    librairie: ["le marque-page", "l’emballage cadeau"],
  };
  return p[famille] ?? ["un petit cadeau"];
}

/** La loi Évin : pas d'alcool offert, ni de promotion d'alcool. */
const ALCOOL =
  /\b(ap[ée]ro|ap[ée]ritifs?|vins?|bi[èe]res?|cocktails?|alcools?|champagnes?|kirs?|digestifs?|shots?|whisky|rhum|vodka|pastis|sangria|spritz|ros[ée]s?|mojitos?|liqueurs?|cidres?|cr[ée]mants?|prosecco|gin|tequila|punch|verre)\b/i;
export const plusPermis = (plus: string) => !ALCOOL.test(plus);

/** Le petit plus, nettoyé : quelques mots, sans point final. */
export const plusPropre = (plus: string) =>
  plus
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!]+$/, "")
    .slice(0, 60);
const memePlus = (a: string, b: string) => plusPropre(a).toLowerCase() === plusPropre(b).toLowerCase();

/** « 2026-10-25 », le jour de Paris d'un instant. */
const jourDe = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

/** Mike n'écrit pas avant 9 h ni après 20 h 30, heure de Paris. */
export function heureOuverte(maintenant = Date.now()): boolean {
  const [h, m] = new Date(maintenant)
    .toLocaleTimeString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":")
    .map(Number);
  const x = h * 60 + m;
  return x >= 9 * 60 && x < 20 * 60 + 30;
}
export const HEURES_FERMEES = "Mike n’écrit pas avant 9 h ni après 20 h 30.";

/** Peut-on lui écrire maintenant ? Sinon, pourquoi — en mots simples. */
export function peutLuiEcrire(messages: MessageEnvoye[], maintenant = Date.now()): { oui: boolean; pourquoi: string } {
  const aujourdhui = jourDe(maintenant);
  if (messages.some((m) => jourDe(Date.parse(m.le)) === aujourdhui)) return { oui: false, pourquoi: "Déjà prévenu aujourd’hui" };
  const semaine = messages.filter((m) => maintenant - Date.parse(m.le) < 7 * 86_400_000).length;
  if (semaine >= 2) return { oui: false, pourquoi: "Déjà deux messages cette semaine" };
  return { oui: true, pourquoi: "" };
}

/** Le petit plus peut-il partir avec SON message ? Pas s'il y en avait un dans ses quatre derniers, ni le même qu'avant. */
export function plusPourLui(messages: MessageEnvoye[], plus: string): boolean {
  if (!plusPropre(plus)) return false;
  if (messages.slice(0, 4).some((m) => plusPropre(m.plus))) return false;
  return !messages.some((m) => m.plus && memePlus(m.plus, plus));
}

const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * LE MESSAGE D'UNE PERSONNE. Le premier rappelle qui écrit et pourquoi (elle n'a
 * peut-être pas son numéro) ; les suivants vont droit au fait. Puis ce qui est vrai
 * aujourd'hui, une question facile, et le petit plus s'il y en a un.
 */
export function messagePour(o: {
  prenom: string;
  commerce: string;
  famille: FamilleDouble;
  quand: string;
  heure?: string;
  /** Les places (ou créneaux) qu'il reste, s'il l'a dit. */
  places?: number;
  plus?: string;
  tu: boolean;
  premier: boolean;
}): string {
  const sorte = sorteDe(o.famille);
  const heure = (o.heure ?? "").trim();
  const quand = heure ? `${o.quand} à ${heure}` : o.quand;
  const n = o.places && o.places > 0 ? Math.floor(o.places) : 0;
  const fait =
    sorte === "table"
      ? n
        ? n > 1
          ? `il reste ${n} places ${quand}`
          : `il reste une place ${quand}`
        : `il reste de la place ${quand}`
      : sorte === "creneau"
        ? n > 1
          ? `il reste ${n} créneaux ${quand}`
          : `un créneau vient de se libérer ${quand}`
        : `${quand}, c’est le bon moment pour passer`;
  const question =
    sorte === "table"
      ? n === 1
        ? o.tu
          ? "Je te la garde ?"
          : "Je vous la garde ?"
        : o.tu
          ? "Tu viens à combien ?"
          : "Vous venez à combien ?"
      : sorte === "creneau"
        ? o.tu
          ? "Je te le garde ?"
          : "Je vous le garde ?"
        : o.tu
          ? "Tu passes ?"
          : "Vous passez ?";
  const prenom = o.prenom.trim();
  const debut = o.premier
    ? `Bonjour${prenom ? ` ${prenom}` : ""}, c’est ${o.commerce} ! ${o.tu ? "Tu nous as demandé de te prévenir" : "Vous nous avez demandé de vous prévenir"} à la fin de notre vidéo : c’est le moment 😊 ${Cap(fait)}.`
    : prenom
      ? `${prenom}, ${fait}.`
      : `${Cap(fait)}.`;
  const plus = plusPropre(o.plus ?? "");
  return `${debut} ${question}${plus ? ` Et ${plus}, c’est cadeau 🎁` : ""}`.replace(/[ \u00a0\u202f]?([?!:])/g, "\u00a0$1");
}

/** Le lien qui ouvre SA conversation dans le WhatsApp du commerçant, le message prêt. */
export const lienWhatsApp = (numero: string, texte: string) => `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
