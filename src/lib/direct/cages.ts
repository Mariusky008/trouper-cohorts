/**
 * 🔓 LES TROIS CAGES, À LA FIN DU FILM D'UN COMMERÇANT.
 *
 * « Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir. À la fin
 * de votre vidéo, chacun libère son fantôme de sa cage. » C'est ce que montre
 * la démonstration aux commerçants (`outils/tour-du-fantome`) ; ici, c'est le
 * vrai geste, dans l'application des habitants.
 *
 * TROIS CAGES, TROIS SENS — et plus trois avis. Les trois petits fantômes
 * (« J'aime pas / Sympa / J'adore ») disaient ce qu'on PENSAIT du film ; les
 * cages disent où l'on EN EST avec le commerce, et c'est ce que le commerçant
 * peut utiliser : « J'adore la vidéo » (il aime, il n'a rien promis), « Je
 * viendrai un jour » (il a envie, pas de date), « Je réserve / Je passe
 * aujourd'hui » (c'est décidé). « J'adore : on comprend pas » — d'où les
 * libellés en entier, sur deux lignes.
 *
 * CE QUE LA PERSONNE LAISSE : son fantôme et son prénom, qu'elle a déjà
 * choisis la plupart du temps (sinon on les lui demande, comme partout). Son
 * numéro WhatsApp, SEULEMENT pour « un jour », et seulement si elle veut que le
 * commerçant la prévienne : c'est lui qui écrira, depuis son WhatsApp à lui —
 * jamais ClikMe. « Aujourd'hui » n'en a pas besoin : elle le prévient elle-même,
 * et il a son numéro par le message.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */

import { familleDuDouble } from "./double-metiers";

export type Cage = "adore" | "un-jour" | "aujourdhui";

export const CAGES: Cage[] = ["adore", "un-jour", "aujourdhui"];

export const estCage = (v: unknown): v is Cage => v === "adore" || v === "un-jour" || v === "aujourdhui";

/**
 * LES MOTS DU MÉTIER. « Pour chaque corps de métier, il faut que ces trois appellations soient pile-poil dans le
 * jargon du métier pour faire mouche » (le propriétaire, 1er novembre 2026) — les mêmes que dans les démos
 * (`outils/tour-du-fantome`, `VARIANTES`). Le sens des trois cages ne change pas : il aime, il viendra, c'est décidé.
 *
 * - à table (restaurant, bar) : on réserve ;
 * - à rendez-vous (coiffure, ongles, séances — hypnose, massage, sophrologie…) : c'est décidé quand on prend
 *   rendez-vous, pas forcément pour le jour même ;
 * - en atelier (cours, stages) : on réserve sa place ;
 * - en boutique (et la boulangerie) : on passe.
 */
type Sorte = "table" | "rendez-vous" | "atelier" | "boutique";

function sorte(branche: string, metier?: string | null): Sorte {
  const m = (metier ?? "").toLowerCase();
  const f = familleDuDouble({ branche, metier });
  if (f === "table") return branche === "restaurant" || /restaur|pizz|burger|traiteur/.test(m) ? "table" : "boutique";
  if (f === "bar") return "table";
  if (f === "coiffure" || f === "ongles" || f === "seance") return "rendez-vous";
  if (f === "createur" && /atelier|cours|stage|initiation/.test(m)) return "atelier";
  return "boutique";
}

const LIBELLES: Record<Sorte, Record<Cage, string>> = {
  table: { adore: "Ça donne\nenvie", "un-jour": "Je réserverai\nun jour", aujourdhui: "Je réserve\naujourd’hui" },
  "rendez-vous": { adore: "Ça me\ntente", "un-jour": "Je prendrai\nrendez-vous", aujourdhui: "Je prends\nrendez-vous" },
  atelier: { adore: "Ça me\ntente", "un-jour": "Je m’inscrirai\nun jour", aujourdhui: "Je réserve\nma place" },
  boutique: { adore: "Ça me\nplaît", "un-jour": "Je passerai\nun jour", aujourdhui: "Je passe\naujourd’hui" },
};

/** Les trois libellés, en deux lignes chacun (`\n` = le retour à la ligne). Le métier départage les
 *  « créateurs & indépendants » (une céramiste, un hypnothérapeute). */
export function libellesCages(branche: string, metier?: string | null): Record<Cage, string> {
  const l = LIBELLES[sorte(branche, metier)];
  const f = familleDuDouble({ branche, metier });
  // une séance (hypnose, massage…) fait du bien — pas un tatouage ; la boulangerie, comme la table, donne envie
  if (f === "seance" && !/tatou|tattoo|pierc/.test((metier ?? "").toLowerCase())) return { ...l, adore: "Ça me ferait\ndu bien" };
  if (f === "table") return { ...l, adore: "Ça donne\nenvie" };
  return l;
}

/** « quand une table se libère » : ce que le commerçant lui annoncera, s'il la prévient. */
export function quandPrevenir(branche: string, metier?: string | null): string {
  const s = sorte(branche, metier);
  if (s === "table") return "quand une table se libère";
  if (s === "rendez-vous") return "quand un créneau se libère";
  if (s === "atelier") return "quand une place se libère";
  return "quand il y a du nouveau";
}

/** Ce que la demande de la troisième cage dit au commerçant, dans le message qu'elle lui envoie. */
export function quoiAujourdhui(branche: string, metier?: string | null): string {
  const s = sorte(branche, metier);
  if (s === "table") return "une table pour aujourd’hui";
  if (s === "rendez-vous") return "un rendez-vous";
  if (s === "atelier") return "une place à l’atelier";
  return "un passage aujourd’hui";
}

/** Ce que veut dire la troisième cage, en une ligne (le carnet du commerçant). */
export function sensDecide(branche: string, metier?: string | null): string {
  const s = sorte(branche, metier);
  if (s === "rendez-vous") return "C’est décidé : ils prennent rendez-vous.";
  if (s === "atelier") return "C’est décidé : ils réservent leur place.";
  return "C’est décidé : ils ont dit venir le jour même.";
}

/** Ce que dit la bulle d'un fantôme de la troisième cage, dans la vitrine. */
export function gesteDecide(branche: string, metier?: string | null): string {
  const s = sorte(branche, metier);
  if (s === "table") return "🍽️ a réservé aujourd’hui";
  if (s === "rendez-vous") return "📅 a pris rendez-vous";
  if (s === "atelier") return "🎟️ a réservé sa place";
  return "🚶 passe aujourd’hui";
}

/**
 * LE NUMÉRO, NETTOYÉ — au format international sans « + » (« 33612345678 »),
 * celui qu'attend un lien `wa.me`. `null` s'il ne ressemble pas à un numéro :
 * mieux vaut le redemander que garder un numéro où personne ne répondra.
 */
export function numeroWhatsApp(saisie: string): string | null {
  const chiffres = saisie.replace(/\D/g, "");
  let n = chiffres;
  if (/^0[1-9]\d{8}$/.test(n)) n = `33${n.slice(1)}`;
  else if (n.startsWith("00")) n = n.slice(2);
  if (!/^[1-9]\d{7,14}$/.test(n)) return null;
  // Un numéro français a neuf chiffres après l'indicatif : un de plus ou de moins est une faute de frappe.
  if (n.startsWith("33") && n.length !== 11) return null;
  return n;
}
