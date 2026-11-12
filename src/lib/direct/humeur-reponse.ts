/**
 * ☀️ MA FIGURINE ME RÉPOND — lot R3 du rituel du jour (`docs/univers/feuille-de-route.md`, lot R ; le propriétaire, le
 * 12 novembre 2026 : « oui tout est bien, vas-y »).
 *
 * Dès qu'il choisit son humeur du matin, SA figurine prend ce visage et lui dit une phrase — écrite, sans voix — qui
 * finit sur un geste utile (envoyer sa tête du jour, raconter à un proche, le mème « Je t'aime », un mème avec cette
 * tête, faire un vœu). Les phrases sont écrites d'avance (validées par le propriétaire le 12 novembre 2026) : tout de
 * suite, sans coût, sans risque. Elle se souvient de la veille (une remontée, une descente, une série) ; au troisième
 * jour difficile d'affilée, un mot doux à part, et le 3114 en petit. Le dimanche : « Ta semaine en visages ».
 *
 * Règles d'écriture : « tu » ; aucun accord au masculin ou au féminin (on ne devine jamais le genre) ; sur la
 * tristesse, la colère et « oh non », ni blague ni conseil ; rien de séducteur (les 15-17 ans voient les mêmes) ;
 * jamais le mot interdit à l'écran.
 *
 * FICHIER PARTAGÉ (le serveur choisit, l'écran affiche) ; sans import hors de `lib/direct` (vérifié sans téléphone :
 * `scripts/verifier-humeur.mjs`).
 */
import type { Sentiment } from "./ma-figurine";

/** Les humeurs douces (les mêmes que `HUMEURS_DOUCES`, `rituel.ts`) : un mot doux, jamais une blague. */
export const HUMEURS_DOUCES_R3: readonly Sentiment[] = ["tete", "tristesse", "colere"];
export const estDouce = (h: string | null | undefined) => Boolean(h && (HUMEURS_DOUCES_R3 as readonly string[]).includes(h));

/** 🗣️ LES PHRASES, une dizaine par humeur (validées par le propriétaire le 12 novembre 2026). */
export const PHRASES_HUMEUR: Partial<Record<Sentiment, readonly string[]>> = {
  joie: [
    "Grosse énergie aujourd’hui ! Fais-en profiter un proche.",
    "Ce sourire, ça se partage. Tu l’envoies à qui ?",
    "Journée lumineuse en vue. Quelqu’un mérite d’en avoir un bout.",
    "J’adore cette tête-là. On la montre à quelqu’un ?",
    "Bonne humeur détectée. Elle est contagieuse, paraît-il.",
    "Aujourd’hui, tu rayonnes. Envoie un peu de soleil.",
    "Ça commence bien ! Dis bonjour à un proche avec ce sourire.",
    "Cette joie-là, garde-la… et donnes-en un peu.",
    "Le genre de matin qu’on aimerait copier-coller. Partage-le !",
    "De bonne humeur, c’est ta tête que je préfère.",
  ],
  euphorie: [
    "Mais qu’est-ce qui se passe ?! J’ai envie de danser.",
    "Niveau d’énergie : maximum. Quelqu’un doit être au courant !",
    "Aujourd’hui, rien ne t’arrête. Raconte-le à quelqu’un !",
    "Cette tête-là mérite d’être vue. Envoie-la !",
    "Il se passe un truc, je le sens. Tu le dis à qui en premier ?",
    "Je ne tiens plus en place sur mon fauteuil. Partage cette énergie !",
    "Alerte joie extrême ! Fais trembler la conversation d’un proche.",
    "On dirait un jour de victoire. Va le crier à quelqu’un !",
    "Ce feu-là, il faut le transmettre.",
    "Je danse déjà. Tu envoies la musique à qui ?",
  ],
  rire: [
    "Raconte ! Ou mieux : raconte-le à quelqu’un qui va rire aussi.",
    "Un fou rire dès le matin ? Je veux savoir.",
    "Ce rire-là, il faut le partager tant qu’il est chaud.",
    "Quelqu’un mérite d’entendre cette histoire.",
    "Je ris déjà et je ne sais même pas pourquoi. Raconte !",
    "Le rire, ça passe très bien par le talkie. Essaie.",
    "Qui t’a fait rire comme ça ? Réponds-lui !",
    "Avec cette énergie, ton prochain vocal va faire rire.",
    "Attention, ça va déborder. Mets-le dans une conversation.",
    "Un matin comme ça mérite un vocal. Au moins.",
  ],
  amour: [
    "Dis-le à quelqu’un aujourd’hui. Ça change une journée.",
    "Tu as le cœur grand ouvert. Quelqu’un mérite de le savoir.",
    "Un « je t’aime » envoyé le matin, ça tient toute la journée.",
    "Parent, ami, voisin : quelqu’un attend ces mots sans le savoir.",
    "Journée tendresse. Fais un cadeau à quelqu’un : trois mots.",
    "Ce cœur-là déborde. Fais-en profiter quelqu’un.",
    "L’amour, ça se dit. Ou ça s’envoie avec ta tête.",
    "Tant de cœurs autour de toi ! Fais-en voler un vers quelqu’un.",
    "Aujourd’hui, on dit aux gens qu’on les aime. C’est la règle.",
    "Un mot doux, une tête qui rougit : il ne manque que quelqu’un à qui l’envoyer.",
  ],
  grimace: [
    "Oh, toi, tu prépares une bêtise. J’en suis.",
    "Cette grimace mérite un mème. Je dis ça, je dis rien.",
    "Humeur : sale gosse. J’adore.",
    "Tu as la tête de quelqu’un qui va taquiner un proche. Vas-y.",
    "Grimace du matin, fou rire assuré avant midi.",
    "Je fais la même, regarde. Bon, la tienne est mieux.",
    "Qui va subir cette tête aujourd’hui ? Je veux des noms.",
    "Ça sent le mème de compétition. Je prépare la scène ?",
    "Tu me tires la langue ? Je te la tire aussi. 😜",
    "Avec cette tête, la journée ne va pas s’ennuyer.",
  ],
  tete: [
    "Une de ces journées… Je reste à côté de toi.",
    "Pas grave si ça part de travers. On avance doucement.",
    "Je ne dis rien, je m’assois juste là, avec toi.",
    "Les journées « oh non » finissent aussi. Je t’accompagne jusque-là.",
    "Je garde ta place au chaud, toute la journée.",
    "Ça arrive à tout le monde. Même aux figurines.",
    "Quelqu’un près de chez toi peut peut-être aider. Un vœu ?",
    "Aujourd’hui, on ne demande rien de plus. Juste être là.",
    "Je suis de ton côté. Toute la journée.",
    "Un pas après l’autre. Je marche avec toi.",
  ],
  tristesse: [
    "Je reste à côté de toi aujourd’hui.",
    "Pas besoin de sourire pour moi. Je suis là quand même.",
    "Les jours gris comptent aussi. Je ne bouge pas.",
    "Tu n’as rien à expliquer. Je m’assois près de toi.",
    "Tes proches verront ton humeur. Personne n’est loin.",
    "Une journée à la fois. Je suis là pour celle-ci.",
    "Pas de blague aujourd’hui. Juste une présence.",
    "Un vocal à un proche, quand tu veux. Et moi, je reste là.",
    "C’est d’accord d’avoir le cœur lourd. Je le porte un peu avec toi.",
    "Je garde ta tête du jour avec douceur.",
  ],
  colere: [
    "Je vois. Je m’assois à côté de toi, sans rien dire.",
    "Il y a des jours comme ça. Je reste dans ton camp.",
    "Tu as le droit. Je garde ta place, tranquillement.",
    "Ça bout ? Je reste là, je ne bouge pas.",
    "Pas de blague aujourd’hui, promis. Juste moi, à côté.",
    "Ta colère, je la respecte. Et je reste.",
    "Je ne te demande rien. Je suis de ton côté.",
    "Quand ça redescendra, je serai encore là.",
    "Même dans la tempête, je reste ta figurine.",
    "Si quelque chose peut changer, un vœu peut-être. Sinon, je reste là.",
  ],
};

/** Ce qu'on dit d'une humeur dans une phrase (« Hier la colère, aujourd'hui le fou rire »). */
export const NOM_HUMEUR: Partial<Record<Sentiment, string>> = {
  joie: "la joie",
  rire: "le fou rire",
  euphorie: "l’euphorie",
  amour: "l’amour",
  grimace: "la grimace",
  tete: "le « oh non »",
  tristesse: "la tristesse",
  colere: "la colère",
};

/** 🔁 Le souvenir de la veille (validé avec les phrases) ; `X` : l'humeur d'hier, `Y` : celle d'aujourd'hui. */
export const SOUVENIRS = {
  remontee: ["Hier X, aujourd’hui Y : belle remontée !", "Quelle remontée depuis hier ! Ça me fait chaud au cœur."],
  descente: "Hier tu rayonnais, aujourd’hui c’est plus lourd. Je reste là.",
  serie: "N jours de bonne humeur d’affilée. Tu as un secret ?",
  deuxJours: "Encore une journée pas facile. Je ne bouge pas d’à côté de toi.",
  changement: "Hier X, aujourd’hui Y : tu ne t’ennuies jamais, toi.",
  /** Le troisième jour difficile d'affilée : un mot doux à part (le 3114 vient en dessous, en petit). */
  troisJours: "Trois jours que c’est lourd. Je reste là, tout près, aussi longtemps qu’il faut.",
} as const;
/** Les séries de bonne humeur qu'elle fête (pas tous les jours : ce serait banal). */
export const SERIES_FETEES = [3, 5, 7, 10, 14, 21] as const;
/** Combien de jours difficiles d'affilée font venir le 3114. */
export const JOURS_DIFFICILES_AIDE = 3;
/** 📞 La ligne d'aide, en petit sous la bulle (le numéro national, gratuit, jour et nuit). */
export const AIDE_3114 = { texte: "Si ça ne va vraiment pas, le 3114 répond jour et nuit.", tel: "3114" } as const;

/** 🗓️ « Ta semaine en visages », le dimanche — selon la semaine. */
export const SEMAINE = {
  titre: "Ma semaine en visages",
  soleil: "Une semaine plutôt soleil ☀️",
  montagnes: "Une semaine en montagnes russes 🎢",
  difficile: "Une semaine pas facile. La prochaine, on la commence ensemble.",
} as const;
export const LETTRES_JOURS = ["L", "M", "M", "J", "V", "S", "D"] as const;

/** 👉 Le geste au bout de la phrase. */
export type GesteHumeur = "envoyer" | "raconter" | "jetaime" | "meme" | "voeu" | "proches";
export const GESTES_HUMEUR: Record<GesteHumeur, string> = {
  envoyer: "📲 Envoyer ma tête du jour",
  raconter: "💬 Raconter à un proche",
  jetaime: "😍 Le mème « Je t’aime »",
  meme: "🎭 Un mème avec cette tête",
  voeu: "✨ Faire un vœu",
  proches: "💬 Écrire à un proche",
};
/** Ce que sa figurine dit dans le mème « ma tête du jour » (le studio s'ouvre avec ce texte et ce visage). */
export const TETE_DU_JOUR: Partial<Record<Sentiment, string>> = {
  joie: "Ma tête du jour ☀️ Et toi, ça va ?",
  euphorie: "Ma tête du jour 🤩 Je déborde d’énergie ! Et toi ?",
};
/** Le geste d'une humeur (douce : un vœu s'il n'en a pas en route, sinon un proche — en discret). */
export function gesteDe(h: Sentiment, aUnVoeu: boolean): GesteHumeur {
  if (h === "joie" || h === "euphorie") return "envoyer";
  if (h === "rire") return "raconter";
  if (h === "amour") return "jetaime";
  if (h === "grimace") return "meme";
  return aUnVoeu ? "proches" : "voeu";
}

export type SemaineVisages = { jours: { jour: string; lettre: string; humeur: Sentiment | null }[]; texte: string; ton: "soleil" | "montagnes" | "difficile" };
/**
 * La réponse de sa figurine, pour l'écran. `souvenir` : une phrase sur la veille ; `aide` : le 3114 en petit dessous ;
 * `semaine` : le dimanche, sa semaine en visages.
 */
export type ReponseHumeur = { humeur: Sentiment; texte: string; geste: GesteHumeur; doux: boolean; souvenir?: true; aide?: true; semaine?: SemaineVisages };
/** Ce qui est gardé (`<habitant>/humeurs.json`) : ses humeurs des 21 derniers jours, les phrases déjà dites, la dernière réponse. */
export type HistoriqueHumeurs = { jours?: Record<string, string>; vus?: Record<string, number[]>; souvenirLe?: string; dernier?: ReponseHumeur & { jour: string } };

// ─── les jours (l'heure de Paris arrive déjà faite : « AAAA-MM-JJ ») ─────────────────────────────────────────────────
const midi = (jour: string) => new Date(`${jour}T12:00:00Z`);
export function jourDecale(jour: string, n: number): string {
  const d = midi(jour);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** 0 = lundi … 6 = dimanche. */
export const rangDuJour = (jour: string) => (midi(jour).getUTCDay() + 6) % 7;

/** L'espace fine insécable avant « ? ! : ; » (le signe ne part jamais seul à la ligne). */
export const typo = (t: string) => t.replace(/ ([?!:;])/g, " $1");
function graine(x: string): number {
  let n = 0;
  for (const c of x) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}
const humeurConnue = (x: unknown): x is Sentiment => typeof x === "string" && x in NOM_HUMEUR;

/** Les jours d'affilée (aujourd'hui compris) dont l'humeur passe le test. */
function serie(jours: Record<string, string>, jour: string, test: (h: string) => boolean): number {
  let n = 0;
  for (let k = 0; k < 60; k++) {
    const h = jours[jourDecale(jour, -k)];
    if (!h || !test(h)) break;
    n++;
  }
  return n;
}

/** 🗓️ Sa semaine (du lundi à aujourd'hui, dimanche), s'il a donné son humeur au moins deux jours. */
export function semaineDe(jour: string, jours: Record<string, string>): SemaineVisages | undefined {
  if (rangDuJour(jour) !== 6) return undefined;
  const liste = LETTRES_JOURS.map((lettre, k) => {
    const j = jourDecale(jour, k - 6);
    const h = jours[j];
    return { jour: j, lettre, humeur: humeurConnue(h) ? h : null };
  });
  const donnees = liste.filter((x) => x.humeur);
  if (donnees.length < 2) return undefined;
  const douces = donnees.filter((x) => estDouce(x.humeur)).length;
  const bonnes = donnees.length - douces;
  const ton = douces > bonnes ? "difficile" : douces === 0 || bonnes >= douces * 3 ? "soleil" : "montagnes";
  return { jours: liste, texte: typo(SEMAINE[ton]), ton };
}

/**
 * 🧠 LA RÉPONSE DU JOUR : la phrase (un souvenir de la veille quand il y a lieu, sinon une de la banque, jamais deux fois
 * avant d'avoir tout dit), le geste, le 3114 au-delà de deux jours difficiles, la semaine le dimanche. Rend aussi
 * l'historique à garder. La même humeur redemandée le même jour : la même réponse.
 */
export function reponseHumeur(h: Sentiment, jour: string, hist: HistoriqueHumeurs, aUnVoeu: boolean): { reponse: ReponseHumeur; hist: HistoriqueHumeurs } {
  if (hist.dernier?.jour === jour && hist.dernier.humeur === h) {
    const { jour: _j, ...reponse } = hist.dernier;
    void _j;
    return { reponse, hist };
  }
  // (ses 21 derniers jours ; aujourd'hui, la dernière humeur choisie)
  const garder = new Set(Array.from({ length: 21 }, (_, k) => jourDecale(jour, -k)));
  const jours = Object.fromEntries(Object.entries({ ...(hist.jours ?? {}), [jour]: h }).filter(([j, x]) => garder.has(j) && humeurConnue(x)));
  const hier = jours[jourDecale(jour, -1)] as Sentiment | undefined;
  const doux = estDouce(h);
  const nomme = (t: string) => t.replace("X", NOM_HUMEUR[hier as Sentiment] ?? "").replace("Y", NOM_HUMEUR[h] ?? "");
  let texte = "";
  let aide = false;
  let souvenir = false;
  if (doux) {
    const difficiles = serie(jours, jour, estDouce);
    if (difficiles >= JOURS_DIFFICILES_AIDE) aide = true;
    if (difficiles === JOURS_DIFFICILES_AIDE) texte = SOUVENIRS.troisJours;
    else if (difficiles === 2) texte = SOUVENIRS.deuxJours;
    else if (hier && !estDouce(hier)) texte = SOUVENIRS.descente;
    souvenir = Boolean(texte);
  } else {
    const bonnes = serie(jours, jour, (x) => !estDouce(x));
    if (hier && estDouce(hier)) texte = nomme(SOUVENIRS.remontee[graine(jour) % SOUVENIRS.remontee.length]);
    else if ((SERIES_FETEES as readonly number[]).includes(bonnes)) texte = SOUVENIRS.serie.replace("N", String(bonnes));
    // (un simple changement d'humeur : pas deux jours de suite, sinon ce serait tous les jours)
    else if (hier && hier !== h && hist.souvenirLe !== jourDecale(jour, -1)) texte = nomme(SOUVENIRS.changement);
    souvenir = Boolean(texte);
  }
  const vus = { ...(hist.vus ?? {}) };
  if (!texte) {
    const banque = PHRASES_HUMEUR[h] ?? PHRASES_HUMEUR.joie!;
    const dits = new Set((vus[h] ?? []).filter((k) => k >= 0 && k < banque.length));
    const libres = banque.map((_, k) => k).filter((k) => !dits.has(k));
    const choix = libres.length ? libres : banque.map((_, k) => k);
    const k = choix[graine(`${jour}|${h}`) % choix.length];
    texte = banque[k];
    vus[h] = [...(libres.length ? [...dits] : []), k];
  }
  const semaine = semaineDe(jour, jours);
  const reponse: ReponseHumeur = {
    humeur: h,
    texte: typo(texte),
    geste: gesteDe(h, aUnVoeu),
    doux,
    ...(souvenir ? { souvenir: true as const } : {}),
    ...(aide ? { aide: true as const } : {}),
    ...(semaine ? { semaine } : {}),
  };
  return { reponse, hist: { jours, vus, souvenirLe: souvenir ? jour : hist.souvenirLe, dernier: { ...reponse, jour } } };
}

/** Une réponse relue (ce que le seau a gardé) : rien d'inventé, rien de cassé. */
export function reponseValide(x: unknown, jour: string): ReponseHumeur | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  if (r.jour !== jour || !humeurConnue(r.humeur) || typeof r.texte !== "string" || !(typeof r.geste === "string" && r.geste in GESTES_HUMEUR)) return null;
  const { jour: _j, ...reponse } = r as unknown as ReponseHumeur & { jour: string };
  void _j;
  return reponse;
}
