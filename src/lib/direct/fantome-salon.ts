/**
 * 👻 LE FANTÔME DU SALON — une machine à états, pas une mascotte.
 *
 * « Le Fantôme observe ce qui se passe dans le salon et réagit uniquement
 * lorsqu'il a quelque chose d'utile, drôle ou pertinent à apporter. Il ne doit
 * jamais devenir un chatbot qui parle toutes les 10 secondes. »
 *
 * ═══ COMMENT IL MARCHE ═════════════════════════════════════════════════════
 *
 * Le salon produit des ÉVÉNEMENTS (un ami arrive, quelqu'un hésite, une voix
 * tombe, le gagnant est déclaré, le magasin répond). Chaque événement donne au
 * Fantôme, au plus, trois choses :
 *
 *   1. une HUMEUR — l'état de son animation (curieux, il cherche, il fête) ;
 *   2. parfois une LIGNE — une ou deux lignes dans le fil, jamais plus ;
 *   3. parfois une PROPOSITION — la carte « Vous hésitez ? Je peux vous aider
 *      à trancher ».
 *
 * ═══ CE QUI LE RETIENT DE PARLER ═══════════════════════════════════════════
 *
 *   · LE DÉLAI : pas plus d'une ligne toutes les 25 secondes. Seuls les
 *     moments qui comptent passent outre — le challenger prêt, le gagnant, la
 *     demande partie, la réponse du magasin.
 *   · LES HUMAINS : quand ils discutent, il se fait discret (`quiet`) et ne
 *     dit rien qui ne soit pas l'un de ces moments.
 *   · LA MÉMOIRE : il ne dit jamais deux fois la même chose sur le même duel.
 *
 * ═══ CE QU'IL NE DIT JAMAIS ════════════════════════════════════════════════
 *
 * Rien qu'il ne sache. Ni stock, ni taille, ni « dernière pièce », ni « tout le
 * monde l'achète », ni réponse du magasin qui n'est pas venue. Ses phrases
 * sont écrites ici, une par événement, et aucune n'avance un fait que
 * l'événement ne porte pas.
 *
 * FICHIER PUR : ni fenêtre, ni horloge (on lui passe `maintenant`).
 */

export type Humeur =
  | "idle"
  | "curious"
  | "thinking"
  | "searching"
  | "excited"
  | "love"
  | "surprised"
  | "pointing"
  | "whisper"
  | "celebrate"
  | "urgent"
  | "quiet";

export type TypeEvenement =
  | "salon_created"
  | "owner_alone"
  | "friend_joined"
  | "first_message"
  | "positive_reaction"
  | "negative_reaction"
  | "mixed_opinions"
  | "hesitation_detected"
  | "inactivity"
  | "challenger_requested"
  | "challenger_searching"
  | "challenger_ready"
  | "vote_cast"
  | "vote_lead_changed"
  | "consensus_detected"
  | "tie_detected"
  | "owner_agrees_with_group"
  | "owner_disagrees_with_group"
  | "winner_declared"
  | "new_challenger_requested"
  | "action_available"
  | "reservation_requested"
  | "request_sent"
  | "merchant_confirmed"
  | "merchant_declined"
  | "essai_rate"
  | "humans_talking";

export type Evenement = {
  type: TypeEvenement;
  /** Ce sur quoi il porte (l'identifiant d'un duel) : ne pas le redire. */
  sur?: string;
  /** Ce que l'événement sait, et rien d'autre. */
  qui?: string;
  lettre?: "A" | "B";
  /** Le groupe a-t-il voté ? Le Fantôme ne fête pas un « gagnant » choisi seul. */
  groupe?: boolean;
  /** « Mise de côté confirmée », « Réservation confirmée »… — ce que le magasin a dit. */
  confirme?: string;
};

/** Le rôle de chaque phrase : ce qu'elle fait pour le salon. */
export type Role = "animateur" | "revelateur" | "conseiller" | "accelerateur";

export type Intervention = {
  humeur: Humeur;
  /** Combien de temps cette humeur dure avant de revenir au fond (ms). Absent : jusqu'au prochain événement. */
  pendant?: number;
  ligne?: { texte: string; role: Role };
  /** Montrer la carte « Fais-moi trancher ». */
  proposer?: boolean;
};

export type Memoire = {
  /** Son humeur de fond. */
  fond: Humeur;
  /** Discret jusqu'à cette heure-là (ms), parce que des humains parlent. */
  calmeJusqua: number;
  /** La dernière fois qu'il a écrit une ligne (ms). */
  derniereLigne: number;
  /** Ce qu'il a déjà dit — type d'événement et duel. */
  dits: string[];
};

export const MEMOIRE_NEUVE: Memoire = { fond: "idle", calmeJusqua: 0, derniereLigne: -Infinity, dits: [] };

/** Pas plus d'une ligne par période, pendant une discussion. */
export const COOLDOWN_MS = 25_000;
/** Ce que dure la discrétion quand des humains discutent. */
export const CALME_MS = 30_000;

/** Les moments qui comptent : ils passent même pendant le délai. */
const CRITIQUES = new Set<TypeEvenement>([
  "challenger_ready",
  "winner_declared",
  "request_sent",
  "merchant_confirmed",
  "merchant_declined",
  "essai_rate",
]);

/**
 * LA TABLE DES RÉACTIONS — une ligne par événement. Les phrases tiennent sur
 * une ligne, deux au plus. Ton : chaleureux, complice, légèrement drôle, jamais
 * commercial agressif (« On vous la garde ? » plutôt que « Souhaitez-vous
 * procéder à la réservation ? »).
 */
function reaction(e: Evenement): Intervention {
  switch (e.type) {
    case "salon_created":
      return { humeur: "idle" };
    case "owner_alone":
      return { humeur: "curious", proposer: true };
    case "friend_joined":
      return { humeur: "excited", pendant: 1800, ...(e.qui ? { ligne: { texte: `${e.qui} arrive, juste à temps pour voter 👋`, role: "animateur" } } : {}) };
    case "first_message":
      return { humeur: "curious", pendant: 2000 };
    case "positive_reaction":
      return { humeur: "love", pendant: 2200 };
    case "negative_reaction":
      return { humeur: "curious", pendant: 2000 };
    case "mixed_opinions":
      return { humeur: "curious", ligne: { texte: "Ouh… ça débat 👀", role: "animateur" }, proposer: true };
    case "hesitation_detected":
      return { humeur: "curious", proposer: true };
    // LE SILENCE NE DÉCLENCHE RIEN DE PLUS QU'UN REGARD : on ne relance pas un salon qui se repose.
    case "inactivity":
      return { humeur: "curious", pendant: 2500 };
    case "challenger_requested":
    case "challenger_searching":
    case "new_challenger_requested":
      return { humeur: "searching" };
    case "challenger_ready":
      return { humeur: "pointing", pendant: 2600 };
    case "vote_cast":
      return { humeur: "excited", pendant: 1500 };
    case "vote_lead_changed":
      return { humeur: "surprised", pendant: 2000, ...(e.lettre ? { ligne: { texte: `Là, ${e.lettre} prend l'avantage.`, role: "revelateur" } } : {}) };
    case "consensus_detected":
      return { humeur: "love", pendant: 2600, ligne: { texte: "Tout le monde est d'accord 😄", role: "revelateur" } };
    case "tie_detected":
      return { humeur: "surprised", pendant: 2000, ligne: { texte: "Égalité parfaite 😄", role: "animateur" } };
    case "owner_agrees_with_group":
      return { humeur: "excited", pendant: 1800 };
    case "owner_disagrees_with_group":
      return { humeur: "whisper", pendant: 3000, ligne: { texte: "Le groupe conseille. C'est vous qui décidez.", role: "conseiller" } };
    case "winner_declared":
      return {
        humeur: "celebrate",
        pendant: 3200,
        ...(e.groupe ? { ligne: { texte: "Bon… je crois qu'on tient notre gagnant.", role: "revelateur" as Role } } : {}),
      };
    case "action_available":
      return { humeur: "pointing", pendant: 2400 };
    case "reservation_requested":
      return { humeur: "thinking" };
    case "request_sent":
      return { humeur: "celebrate", pendant: 3000, ligne: { texte: "C'est parti ✅ La demande est chez le magasin.", role: "accelerateur" } };
    case "merchant_confirmed":
      return { humeur: "celebrate", pendant: 3600, ligne: { texte: `${e.confirme ?? "Confirmé"} par le magasin ✅`, role: "revelateur" } };
    case "merchant_declined":
      return { humeur: "surprised", pendant: 2600, ligne: { texte: "Le magasin ne l'a plus. Je vous en trouve un autre ?", role: "conseiller" } };
    case "essai_rate":
      return { humeur: "whisper", pendant: 3200, ligne: { texte: "L'essayage n'a pas marché cette fois, mais on peut quand même trancher.", role: "conseiller" } };
    case "humans_talking":
      return { humeur: "quiet" };
  }
}

/**
 * ═══ INTERPRÉTER UN ÉVÉNEMENT ══════════════════════════════════════════════
 *
 * Rend la mémoire suivante et ce que le Fantôme fait — l'humeur toujours, la
 * ligne seulement si le délai, la discrétion et la mémoire la laissent passer.
 */
export function interpreter(m: Memoire, e: Evenement, maintenant: number): { memoire: Memoire; intervention: Intervention } {
  const r = reaction(e);
  let memoire = { ...m };
  if (e.type === "humans_talking") memoire = { ...memoire, calmeJusqua: maintenant + CALME_MS };
  const calme = maintenant < memoire.calmeJusqua;
  memoire = { ...memoire, fond: calme ? "quiet" : "idle" };
  const critique = CRITIQUES.has(e.type);
  let ligne = r.ligne;
  if (ligne) {
    const cle = `${e.type}|${e.sur ?? ""}`;
    const tropTot = maintenant - memoire.derniereLigne < COOLDOWN_MS;
    if (memoire.dits.includes(cle) || (!critique && (tropTot || calme))) ligne = undefined;
    else memoire = { ...memoire, derniereLigne: maintenant, dits: [...memoire.dits, cle].slice(-40) };
  }
  // DISCRET PENDANT QUE LES HUMAINS PARLENT : son humeur s'efface, sauf les grands moments.
  const humeur = calme && !critique && r.humeur !== "searching" ? "quiet" : r.humeur;
  return { memoire, intervention: { ...r, humeur, ...(ligne ? { ligne } : { ligne: undefined }) } };
}

// ─── CE QU'IL LIT DANS LA CONVERSATION ─────────────────────────────────────

/** « J'hésite », « je ne sais pas », « laquelle ? », « on tranche ? »… */
const HESITATION =
  /(j['’]?h[ée]site|je (ne )?sais pas|sais pas trop|laquelle|lequel|ou bien|entre les deux|autre chose|vous prendriez|tu prendrais|on tranche|aidez[- ]moi|aide[- ]moi|dur de choisir|je choisis quoi|vous en pensez quoi)/i;
const POSITIF = /(j['’]?adore|\btop\b|canon|parfait|trop bien|g[ée]nial|styl[ée]|magnifique|sublime|bon choix|j['’]?aime|❤️|😍|🔥|👌)/i;
const NEGATIF = /(\bbof\b|\bmoyen\b|pas fan|j['’]?aime pas|je n['’]aime pas|trop cher|pas terrible|non merci)/i;
/** Une autre option évoquée : « mais la beige… aussi », « plutôt l'autre ». */
const AUTRE = /(\bmais\b.*\b(aussi|autre|version|plut[oô]t)\b|\bplut[oô]t\b|\bl['’]autre\b|une autre)/i;

export type Lecture = { hesite: boolean; positif: boolean; negatif: boolean; autre: boolean };

export function lireMessage(texte: string): Lecture {
  const t = texte || "";
  return { hesite: HESITATION.test(t), positif: POSITIF.test(t), negatif: NEGATIF.test(t), autre: AUTRE.test(t) };
}

/**
 * DES AVIS QUI NE VONT PAS DANS LE MÊME SENS : quelqu'un aime, et quelqu'un
 * d'autre parle d'autre chose (ou n'aime pas). Lu sur les derniers messages,
 * de personnes différentes.
 */
export function avisPartages(messages: { qui: string; texte: string }[]): boolean {
  const recents = messages.slice(-5);
  const qui = new Set(recents.map((m) => m.qui));
  if (qui.size < 2) return false;
  const l = recents.map((m) => lireMessage(m.texte));
  return l.some((x) => x.positif) && l.some((x) => x.negatif || x.autre || x.hesite);
}
