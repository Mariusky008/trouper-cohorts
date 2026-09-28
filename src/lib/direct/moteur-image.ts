// 🎨 LE MOTEUR D'IMAGE — celui de ChatGPT, demandé au compte.
//
// ═══ LA CAUSE, ET ELLE N'ÉTAIT NI DANS LA PHRASE NI DANS LE MASQUE ══════════
//
// « Nous sommes bien connectés à OpenAI, tout comme ChatGPT, pourtant le
// résultat est totalement différent et très mauvais. »
//
// CONNECTÉS AU MÊME FOURNISSEUR, PAS AU MÊME MOTEUR. La route écrivait en dur
// `gpt-image-1` — le premier modèle d'image d'OpenAI, celui d'avril 2025 — et
// c'est lui qui a rendu tous les essais refusés depuis des semaines. ChatGPT,
// lui, a changé de moteur trois fois depuis : `gpt-image-1.5` fin 2025,
// `gpt-image-2` le 21 avril 2026, et Images 2.5 le 8 septembre 2026, dont le
// point fort annoncé est précisément de mieux garder la personne d'une photo
// de référence.
//
// NOUS FAISIONS MÊME PIRE QUE NE RIEN DEMANDER. Sans champ `model`, l'API
// d'édition prend aujourd'hui `gpt-image-1.5` d'elle-même ; en écrivant
// `gpt-image-1`, on la forçait à redescendre d'une génération.
//
// CE QUI EST ÉCRIT ICI N'EST PAS DE MÉMOIRE. La liste vient du paquet officiel
// d'OpenAI (`openai` 7.23.0, publié le 23 septembre 2026) : ce sont les
// identifiants que le point d'entrée `/v1/images/edits` déclare accepter, mot
// pour mot. Et même cette liste ne décide pas seule : on demande d'abord au
// compte ce qu'il peut appeler — voir `moteursDImage`.
//
// ═══ ET C'EST EXACTEMENT LE DÉFAUT DES DEUX PHOTOS ═════════════════════════
//
// Sur les deux essais ClikMe, le costume, l'allée et la pose sont restés ; le
// visage, lui, est devenu celui du mannequin de la photo de coupe — la peau,
// les yeux, la mâchoire. C'est la faiblesse connue de ce premier modèle : deux
// portraits en entrée, et l'identité de la référence déborde sur la personne.
// Aucune phrase ne l'en a jamais empêché, et on en a écrit huit.

/**
 * ═══ L'ORDRE DE PRÉFÉRENCE ═════════════════════════════════════════════════
 *
 *   · `chatgpt-image-latest` D'ABORD, parce que c'est la comparaison qu'il
 *     fait : « quand je donne ma photo et la coupe à ChatGPT, le résultat est
 *     parfait dans 100 % des cas ». Ce nom désigne le moteur que ChatGPT
 *     utilise, et il suit ChatGPT quand ChatGPT change — on n'aura pas à
 *     revenir ici au prochain modèle.
 *   · PUIS LES DEUX IMAGES 2.5, la détaillée avant la rapide : une coupe se
 *     juge sur la mèche, et la route a cinq minutes devant elle.
 *   · PUIS 2, 1.5 et enfin 1, du plus récent au plus ancien.
 *
 * `gpt-image-1-mini` N'Y EST PAS. C'est un modèle d'économie ; on ne l'essaie
 * pas sur le visage de quelqu'un qui décide d'une coupe.
 */
export const PREFERENCE = [
  "chatgpt-image-latest",
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare",
  "gpt-image-2",
  "gpt-image-1.5",
  "gpt-image-1",
] as const;

/**
 * CE QUE LE CATALOGUE DU COMPTE PERMET, DANS L'ORDRE DE PRÉFÉRENCE.
 *
 * UN NOM SANS SA DATE EST UN ALIAS, et c'est lui qu'on préfère : il suit les
 * corrections du fournisseur. Mais si le compte ne liste que l'instantané daté
 * — `gpt-image-2.5-flare-2026-09-08` —, on le prend plutôt que de sauter une
 * génération entière pour une question d'écriture.
 *
 * FONCTION PURE, ET C'EST POUR ÇA QU'ELLE EST SÉPARÉE. La route d'essai et
 * celle du catalogue doivent tomber sur la même réponse ; si chacune
 * recalculait son choix, le banc afficherait « en service » un moteur que
 * l'essai n'appelle pas. Voir `/api/direct/modeles-image`.
 */
export function choisirDansLeCatalogue(ids: readonly string[]): string[] {
  const liste: string[] = [];
  for (const voulu of PREFERENCE) {
    if (ids.includes(voulu)) {
      liste.push(voulu);
      continue;
    }
    const dates = ids
      .filter((id) => id.startsWith(`${voulu}-`) && /^\d{4}-\d{2}-\d{2}$/.test(id.slice(voulu.length + 1)))
      .sort()
      .reverse();
    if (dates.length) liste.push(dates[0]);
  }
  return liste;
}

/**
 * ═══ UN REFUS DE MOTEUR N'EST PAS UN ESSAI RATÉ ═══════════════════════════
 *
 * Un compte peut lister un modèle et ne pas avoir le droit de l'appeler —
 * organisation à vérifier, palier d'usage trop bas, accès progressif. Le
 * fournisseur répond alors 403 ou 404, ou 400 en désignant le champ `model`.
 *
 * ON DESCEND AU SUIVANT PLUTÔT QUE D'ÉCHOUER. Ce refus arrive en une fraction
 * de seconde, avant toute génération : le client ne le paie pas en attente, il
 * le paierait en écran d'erreur.
 *
 * ET ON NE CONFOND PAS AVEC UN RÉGLAGE REFUSÉ. « input_fidelity is not
 * supported for this model » parle d'un modèle mais refuse un champ — la route
 * le retire et rejoue, voir `parOpenAI`. Ici, seul un refus qui porte sur le
 * modèle lui-même fait changer de moteur.
 */
export function moteurRefuse(statut: number, corps: string): boolean {
  if (statut === 403 || statut === 404) return true;
  if (statut !== 400) return false;
  try {
    const e = (JSON.parse(corps) as { error?: { code?: string; param?: string } }).error;
    if (e?.code === "model_not_found" || e?.param === "model") return true;
  } catch {
    /* UN CORPS QUI N'EST PAS DU JSON SE LIT EN TEXTE, juste en dessous. */
  }
  return /model[^.]{0,80}(does not exist|not found|not available|not supported|no access|do not have access)/i.test(corps);
}

/**
 * LES MOTEURS QU'ON SAIT REFUSÉS, POUR NE PAS LES RÉESSAYER À CHAQUE ESSAI.
 *
 * UNE INSTANCE DE FONCTION SERT PLUSIEURS CLIENTS À LA SUITE. Sans cette
 * mémoire, chacun paierait le même aller-retour refusé avant d'arriver au bon
 * moteur. Elle s'oublie au bout d'une heure : un accès se débloque aussi.
 */
const refuses = new Map<string, number>();
const OUBLI_REFUS = 3_600_000;

export function noterRefus(modele: string): void {
  refuses.set(modele, Date.now());
}

function estRefuse(modele: string): boolean {
  const quand = refuses.get(modele);
  if (quand === undefined) return false;
  if (Date.now() - quand > OUBLI_REFUS) {
    refuses.delete(modele);
    return false;
  }
  return true;
}

/** Le catalogue lu, gardé quelques heures : il ne change pas d'un essai à l'autre. */
let memo: { quand: number; ids: string[] } | null = null;
const DUREE_CATALOGUE = 6 * 3_600_000;

async function catalogue(cle: string, base: string): Promise<string[] | null> {
  if (memo && Date.now() - memo.quand < DUREE_CATALOGUE) return memo.ids;
  try {
    const r = await fetch(`${base}/v1/models`, {
      headers: { authorization: `Bearer ${cle}` },
      // CINQ SECONDES, PAS PLUS : c'est du temps pris sur le budget du rendu.
      signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { id?: string }[] };
    const ids = (j.data ?? []).map((m) => String(m?.id ?? "")).filter(Boolean);
    memo = { quand: Date.now(), ids };
    return ids;
  } catch {
    return null;
  }
}

export type Moteurs = {
  /** Du premier essayé au dernier recours. Jamais vide. */
  liste: string[];
  /** D'où vient le premier — c'est ce que le banc affiche à côté de son nom. */
  pourquoi: string;
};

/**
 * ═══ QUEL MOTEUR APPELER, ET POURQUOI CELUI-LÀ ════════════════════════════
 *
 * `OPENAI_IMAGE_MODEL` GAGNE TOUJOURS, et seul : c'est une décision
 * d'exploitation, prise en connaissance de cause, et un repli silencieux vers
 * un autre moteur la contredirait sans prévenir. ATTENTION À CE QU'ELLE
 * CONTIENT EN PRODUCTION : si elle vaut encore `gpt-image-1`, c'est elle qui
 * garde l'ancien moteur, et rien de ce fichier ne sert.
 *
 * SINON ON DEMANDE AU COMPTE, et on prend ce qu'il a de plus proche de
 * ChatGPT. Si le catalogue ne répond pas, on part sur la liste de préférence
 * entière : le premier refus coûte une fraction de seconde, et l'on descend.
 */
export async function moteursDImage(cle: string, base: string): Promise<Moteurs> {
  const force = (process.env.OPENAI_IMAGE_MODEL ?? "").trim();
  if (force) return { liste: [force], pourquoi: "imposé par OPENAI_IMAGE_MODEL" };
  const ids = await catalogue(cle, base);
  const presents = ids ? choisirDansLeCatalogue(ids) : [];
  const candidats = presents.length ? presents : [...PREFERENCE];
  /* ON ÉCARTE CE QUI VIENT D'ÊTRE REFUSÉ — MAIS JAMAIS TOUT. Une liste vide
     ne rendrait rien ; mieux vaut réessayer le dernier que de ne rien tenter. */
  const libres = candidats.filter((m) => !estRefuse(m));
  const liste = libres.length ? libres : [candidats[candidats.length - 1]];
  return {
    liste,
    pourquoi: presents.length
      ? "le plus proche de ChatGPT dans le catalogue du compte"
      : "catalogue illisible : ordre de préférence",
  };
}
