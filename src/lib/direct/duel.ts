/**
 * ⚔️ LE DUEL D'UN SALON — « le lieu où le peut-être devient oui ».
 *
 * « Le salon ClikMe ne doit surtout pas être un simple chat où des amis
 * discutent d'un vêtement. WhatsApp sait déjà faire ça. Le salon doit être le
 * lieu où une hésitation se transforme en décision, puis en action. »
 *
 *   JE VOIS → J'HÉSITE → CLIKME M'AIDE À TRANCHER → JE DIS OUI → J'AGIS
 *
 * UN DUEL, C'EST A CONTRE B, ET RIEN DE PLUS. A est ce dont on parle (ou le
 * champion du duel d'avant) ; B est UN challenger choisi dans ce que le
 * commerce propose vraiment. Pas trois, pas cinq : « 1 duel = 1 challenger »,
 * et donc au plus une génération d'image par geste.
 *
 * ═══ QUI DÉCIDE ═══════════════════════════════════════════════════════════
 *
 * CELUI QUI A LANCÉ LE DUEL. Les autres votent, et leur vote compte — il se
 * voit, il se compte, il fait réagir le Fantôme — mais « le groupe conseille,
 * il ne décide jamais à la place de l'utilisateur ». Quand ses amis préfèrent
 * B et lui A, l'écran ne déclare pas B gagnant : il dit les deux, et c'est lui
 * qui garde A ou revoit B.
 *
 * ═══ CE QUI EST VRAI, ET SEULEMENT ÇA ═════════════════════════════════════
 *
 * Le verdict ne dit que des faits : son choix, celui du salon, le nombre de
 * voix, le gagnant. Aucun « plus lumineux », aucun « mieux pour votre
 * morphologie » — personne n'a analysé ça. Et « mis de côté » ne s'affiche que
 * si LE COMMERÇANT l'a dit (voir `reponse`).
 *
 * FICHIER PUR : lu par le téléphone, par le serveur (gestes rejoués) et par
 * les gardes. Ni fenêtre, ni stockage.
 */

export type Cote = "a" | "b";

/** Une des deux choses du duel. */
export type ObjetDuel = {
  id: string;
  nom: string;
  prix?: string;
  /** Sa vraie photo — celle du commerce. */
  photo?: string;
  /** La même, portée par la personne qui hésite, quand l'essayage a pu se faire. */
  essai?: string;
};

export type Duel = {
  id: string;
  /** Le rang du duel dans ce salon : 1, puis 2 après « Trouve-moi mieux »… */
  n: number;
  /** Qui l'a lancé, tel qu'il s'affiche. C'est lui qui décide. */
  par: string;
  /** La clé de son vote (voir `MOI` et `cleVotant`). */
  cleProprio: string;
  a: ObjetDuel;
  b: ObjetDuel;
  /** Le commerce dont viennent A et B. */
  commerce?: string;
  /** Le geste qui suit, dans les mots du métier : « Mettre de côté », « Réserver »… */
  action?: string;
  /** Une voix par personne, la dernière compte. */
  votes: Record<string, Cote>;
  /** Le nom affiché de chaque votant, pour son fantôme. */
  votants: Record<string, string>;
  /** Ce que le propriétaire garde, une fois le verdict vu. */
  fin?: Cote;
  /**
   * LA DEMANDE AU COMMERCE. `prete` : WhatsApp s'est ouvert avec le message
   * écrit — rien n'est encore parti. `envoyee` : il nous a dit l'avoir envoyé.
   * Jamais plus que ce qu'il a fait (voir `prevenir.ts`).
   */
  demande?: "prete" | "envoyee";
  /** LA RÉPONSE DU COMMERÇANT LUI-MÊME — et rien d'autre ne la pose. */
  reponse?: "confirme" | "refuse";
  /** L'essayage du challenger n'a pas pu se faire : on tranche sur les vraies photos. */
  essaiRate?: boolean;
  quand: string;
};

/** La clé de mon vote, sur ce téléphone. */
export const MOI = "moi";

export const autre = (c: Cote): Cote => (c === "a" ? "b" : "a");
export const lettre = (c: Cote) => (c === "a" ? "A" : "B");
export const objetDe = (d: Duel, c: Cote) => (c === "a" ? d.a : d.b);

/** Ce que le propriétaire a voté. */
export const voteProprio = (d: Duel): Cote | undefined => d.votes[d.cleProprio];

/** Les voix, celles de tout le salon et celles des autres seulement. */
export function compte(d: Duel) {
  let a = 0;
  let b = 0;
  let autresA = 0;
  let autresB = 0;
  for (const [cle, c] of Object.entries(d.votes)) {
    if (c === "a") a++;
    else b++;
    if (cle === d.cleProprio) continue;
    if (c === "a") autresA++;
    else autresB++;
  }
  return { a, b, autresA, autresB, autres: autresA + autresB, total: a + b };
}

/**
 * ═══ LE VERDICT, DIT COMME IL EST ══════════════════════════════════════════
 *
 *   · `seul`      — personne d'autre n'a voté : « Vous préférez B. »
 *   · `accord`    — le salon va dans son sens (ou ne tranche pas) : « B gagne 3–1. »
 *   · `desaccord` — ses amis préfèrent l'autre : on dit les deux, il choisit.
 *   · `egalite`   — autant de voix de chaque côté, la sienne comprise.
 *
 * Rien tant que le propriétaire n'a pas voté : c'est son hésitation.
 */
export type Verdict =
  | { genre: "seul"; gagnant: Cote; score: [number, number] }
  | { genre: "accord"; gagnant: Cote; score: [number, number] }
  | { genre: "desaccord"; proprio: Cote; groupe: Cote; score: [number, number] }
  | { genre: "egalite"; proprio: Cote; score: [number, number] };

export function verdict(d: Duel): Verdict | null {
  const p = voteProprio(d);
  if (!p) return null;
  const k = compte(d);
  const score: [number, number] = [k.a, k.b];
  if (k.autres === 0) return { genre: "seul", gagnant: p, score };
  if (k.a === k.b) return { genre: "egalite", proprio: p, score };
  if (k.autresA !== k.autresB) {
    const groupe: Cote = k.autresA > k.autresB ? "a" : "b";
    if (groupe !== p) return { genre: "desaccord", proprio: p, groupe, score };
  }
  return { genre: "accord", gagnant: p, score };
}

/** Le gagnant tel qu'il est retenu : ce qu'il a gardé, sinon ce que dit le verdict. */
export function gagnantDe(d: Duel): Cote | undefined {
  if (d.fin) return d.fin;
  const v = verdict(d);
  return v && (v.genre === "seul" || v.genre === "accord") ? v.gagnant : undefined;
}

/** « 3–1 », le gagnant d'abord. */
export function scoreLisible(d: Duel, gagnant: Cote): string {
  const k = compte(d);
  return gagnant === "a" ? `${k.a}–${k.b}` : `${k.b}–${k.a}`;
}

/** Qui mène, quand quelqu'un mène. */
export function enTeteDuDuel(d: Duel): Cote | undefined {
  const k = compte(d);
  return k.a === k.b ? undefined : k.a > k.b ? "a" : "b";
}

/** Le duel qui se joue maintenant : le dernier lancé. */
export const duelCourant = (duels: Duel[] | undefined): Duel | undefined => (duels?.length ? duels[duels.length - 1] : undefined);

// ─── LE CHALLENGER ─────────────────────────────────────────────────────────

/** Ce que le commerce a de vrai à proposer : une photo, un nom, un prix. */
export type Candidat = {
  id: string;
  nom: string;
  prix?: string;
  photo: string;
  /** Pour l'essayage : la photo de référence et ce que la pièce couvre. */
  reference?: string;
  couvre?: string;
  decrire?: string;
  decrireEn?: string;
};

/** La famille d'une chose, d'après son nom : une veste ne se compare pas à un jean. */
const FAMILLES: [string, RegExp][] = [
  ["dessus", /\b(veste|surchemise|blouson|manteau|doudoune|parka|trench|caban|perfecto|bomber|kimono)\b/i],
  ["haut", /\b(chemise|chemisier|blouse|polo|t-shirt|tee-shirt|top|marini[eè]re|d[ée]bardeur|body)\b/i],
  ["maille", /\b(pull|gilet|cardigan|sweat|maille|col roul[ée])\b/i],
  ["robe", /\b(robe|combinaison)\b/i],
  ["bas", /\b(jean|pantalon|chino|jupe|short|legging)\b/i],
  ["tenue", /\b(costume|tailleur|ensemble)\b/i],
  ["accessoire", /\b([ée]charpe|sac|ceinture|bonnet|chapeau|foulard|bijou|collier|bracelet|boucles?)\b/i],
  ["lunettes", /\b(lunettes?|monture|solaire)\b/i],
  ["coupe", /\b(coupe|carr[ée]|frange|d[ée]grad[ée]|brushing|balayage|m[eè]ches|couleur|chignon|tresses?|boucles)\b/i],
  ["ongles", /\b(pose|vernis|manucure|nail|ongles?|semi)\b/i],
  ["plat", /\b(plat|menu|formule|dessert|entr[ée]e|burger|pizza|salade|magret|garbure|tarte)\b/i],
  ["fleurs", /\b(bouquet|fleurs?|composition|plante)\b/i],
];
export function familleDe(nom: string): string {
  return FAMILLES.find(([, re]) => re.test(nom))?.[0] ?? "autre";
}

/** La teinte, quand le nom la dit. Sert à proposer une vraie alternative, pas un doublon. */
const TEINTES: [string, RegExp][] = [
  ["vert", /\b(kaki|vert|olive|sapin|for[eê]t)\b/i],
  ["clair", /\b(beige|sable|[ée]cru|cr[eè]me|camel|blanc|ivoire|naturel|lin)\b/i],
  ["sombre", /\b(noir|marine|anthracite|gris fonc[ée]|brut)\b/i],
  ["bleu", /\b(bleu|ciel|denim|jean)\b/i],
  ["chaud", /\b(brique|rouge|bordeaux|rouille|orange|corail|terracotta)\b/i],
  ["rose", /\b(rose|orchid[ée]e|fuchsia|lilas|violet)\b/i],
  ["brun", /\b(marron|chocolat|cognac|caramel|tabac)\b/i],
];
export function teinteDe(nom: string): string | undefined {
  return TEINTES.find(([, re]) => re.test(nom))?.[0];
}

/** « 69 € », « à partir de 35 € » → 69, 35. */
export function prixEnNombre(prix?: string): number | undefined {
  const m = (prix ?? "").replace(/\s/g, "").match(/(\d+(?:[,.]\d+)?)/);
  if (!m) return undefined;
  const v = Number(m[1].replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
}

/** Ce que ses duels passés disent de lui — seulement quand ils le disent plusieurs fois. */
export type Preferences = { teinte?: string; famille?: string };

/**
 * ═══ CHOISIR UN CHALLENGER — UNE OPÉRATION LÉGÈRE, SANS IA ═════════════════
 *
 * « Sélectionner plusieurs candidats potentiels avec une opération légère ;
 * les classer ; générer uniquement le challenger choisi. »
 *
 * LE CLASSEMENT EST SIMPLE ET SE LIT : même famille d'abord (une veste contre
 * une veste), même partie du corps, un prix voisin, et une teinte différente —
 * le challenger doit être une vraie alternative, pas le même article dans la
 * même couleur. Ce qui a déjà été mis en duel dans ce salon ne revient pas.
 * Ses préférences n'ajoutent qu'un demi-point, et seulement quand elles sont
 * observées plusieurs fois : on ne surinterprète pas un vote.
 */
export function choisirChallenger(
  a: Pick<ObjetDuel, "id" | "nom" | "prix" | "photo">,
  pool: Candidat[],
  deja: Set<string>,
  prefs: Preferences = {},
): Candidat | null {
  const famA = familleDe(a.nom);
  const teinteA = teinteDe(a.nom);
  const prixA = prixEnNombre(a.prix);
  const couvreA = pool.find((p) => p.id === a.id)?.couvre;
  let meilleur: Candidat | null = null;
  let note = -Infinity;
  for (const p of pool) {
    if (!p.photo || p.id === a.id || deja.has(p.id) || (a.photo && p.photo === a.photo) || p.nom === a.nom) continue;
    let n = 0;
    const fam = familleDe(p.nom);
    if (fam === famA && fam !== "autre") n += 3;
    else if (famA === "autre" || fam === "autre") n += 0.5;
    if (couvreA && p.couvre === couvreA) n += 1;
    const prixP = prixEnNombre(p.prix);
    if (prixA && prixP) {
      const ecart = Math.abs(prixP - prixA) / prixA;
      n += ecart <= 0.4 ? 1 : ecart <= 0.8 ? 0.5 : 0;
    }
    const t = teinteDe(p.nom);
    if (t && teinteA && t !== teinteA) n += 0.5;
    if (prefs.teinte && t === prefs.teinte) n += 0.5;
    if (n > note) {
      note = n;
      meilleur = p;
    }
  }
  return meilleur;
}

/** La chose dont parle le salon, retrouvée parmi ce que vend le commerce. */
export function retrouverDansLePool(pool: Candidat[], o: { nom?: string; photo?: string }): Candidat | undefined {
  const nom = (o.nom ?? "").toLowerCase();
  return (
    pool.find((p) => o.photo && (p.photo === o.photo || p.reference === o.photo)) ??
    (nom ? pool.find((p) => p.nom.toLowerCase() === nom || nom.includes(p.nom.toLowerCase())) : undefined)
  );
}

// ─── LES MOTS ──────────────────────────────────────────────────────────────

/** « une adversaire », « un adversaire » : l'article suit la chose, pas le mot. */
const FEMININS =
  /^(la |l'|une )?(veste|surchemise|chemise|chemisier|blouse|robe|jupe|doudoune|parka|marini[eè]re|combinaison|[ée]charpe|coupe|frange|couleur|pose|manucure|table|soir[ée]e|formule|tarte|salade|pizza|composition|plante|monture|paire|tenue|pi[eè]ce|bougie)\b/i;
export const estFeminin = (nom: string) => FEMININS.test(nom.trim());

/**
 * LE MESSAGE AU COMMERCE, DANS LES MOTS DE SON MÉTIER.
 *
 * On DEMANDE, on ne déclare pas : « pourriez-vous me la mettre de côté ? » et
 * pas « je la prends ». Le commerçant reste libre, et sa réponse — par le
 * lien, quand il y en a un — est la seule chose qui fera dire « confirmé ».
 */
export function messageAuCommerce(o: {
  famille: string;
  objet: Pick<ObjetDuel, "nom" | "prix">;
  prenom?: string;
  /** Le lien où il répond d'un appui (vraie ville seulement). */
  lien?: string;
}): string {
  const quoi = `« ${o.objet.nom} »${o.objet.prix ? ` (${o.objet.prix})` : ""}`;
  const signature = o.prenom ? ` — ${o.prenom}` : "";
  let corps: string;
  if (o.famille === "coiffure" || o.famille === "ongles" || o.famille === "seance") {
    corps = `Bonjour, je voudrais prendre rendez-vous pour ${quoi}, mon choix sur ClikMe. Quand auriez-vous un créneau ?`;
  } else if (o.famille === "table" || o.famille === "bar") {
    corps = `Bonjour, je voudrais réserver pour ${quoi}, notre choix sur ClikMe. Auriez-vous de la place ?`;
  } else {
    corps = `Bonjour, pourriez-vous me mettre de côté ${quoi} ? C'est mon choix sur ClikMe, je passe très vite.`;
  }
  return `${corps}${signature}${o.lien ? `\n\nRépondre en un appui : ${o.lien}` : ""}`;
}

/** Ce que l'écran dit de la demande, et rien de plus que ce qui s'est passé. */
export function etatDeLaDemande(d: Duel): { mot: string; ton: "attente" | "envoyee" | "confirme" | "refuse" } | null {
  if (d.reponse === "confirme") return { mot: d.action === "Réserver" || d.action === "Prendre rendez-vous" ? "Confirmé par le commerce" : "Mise de côté confirmée", ton: "confirme" };
  if (d.reponse === "refuse") return { mot: "Plus disponible", ton: "refuse" };
  if (d.demande === "envoyee") return { mot: "Demande envoyée", ton: "envoyee" };
  if (d.demande === "prete") return { mot: "Message prêt dans WhatsApp", ton: "attente" };
  return null;
}
