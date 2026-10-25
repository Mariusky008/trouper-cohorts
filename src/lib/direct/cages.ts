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

export type Cage = "adore" | "un-jour" | "aujourdhui";

export const CAGES: Cage[] = ["adore", "un-jour", "aujourdhui"];

export const estCage = (v: unknown): v is Cage => v === "adore" || v === "un-jour" || v === "aujourdhui";

/** Les métiers où l'on réserve (une table, un rendez-vous) ; ailleurs, on passe. */
const ON_RESERVE = new Set(["restaurant", "bar", "coiffeur", "ongles"]);
/** Les métiers où ce qui se libère est une table ; un créneau chez ceux à rendez-vous. */
const TABLES = new Set(["restaurant", "bar"]);
const CRENEAUX = new Set(["coiffeur", "ongles"]);

/** Les trois libellés, en deux lignes chacun (`\n` = le retour à la ligne). */
export function libellesCages(branche: string): Record<Cage, string> {
  return {
    adore: "J’adore\nla vidéo",
    "un-jour": "Je viendrai\nun jour",
    aujourdhui: ON_RESERVE.has(branche) ? "Je réserve\naujourd’hui" : "Je passe\naujourd’hui",
  };
}

/** « quand une table se libère » : ce que le commerçant lui annoncera, s'il la prévient. */
export function quandPrevenir(branche: string): string {
  if (TABLES.has(branche)) return "quand une table se libère";
  if (CRENEAUX.has(branche)) return "quand un créneau se libère";
  return "quand il y a du nouveau";
}

/** Ce que la demande d'« aujourd'hui » dit au commerçant, dans le message qu'elle lui envoie. */
export function quoiAujourdhui(branche: string): string {
  if (TABLES.has(branche)) return "une table pour aujourd’hui";
  if (CRENEAUX.has(branche)) return "un rendez-vous aujourd’hui";
  return "un passage aujourd’hui";
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
