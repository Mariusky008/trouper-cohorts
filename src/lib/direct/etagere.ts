/**
 * 📚 L'ÉTAGÈRE — les figurines se souviennent (cahier des charges : `docs/univers/etagere.md` ; validé par le
 * propriétaire le 13 novembre 2026 : « on va construire cette feature »).
 *
 * « WhatsApp oublie tout ; sur ClikMe, vos deux figurines retiennent ce qui compte entre vous, le rangent sur votre
 * étagère, et te le ressortent au bon moment. » Quatre genres : une date, une promesse, un goût, une blague.
 *
 * Ici, LES RÈGLES, sans serveur (le navigateur et `scripts/verifier-etagere.mjs` les lisent aussi) : les mots, le
 * catalogue des emojis, ce qu'un objet noté doit être pour être gardé (`objetValide` : la citation recopiée mot pour
 * mot, les dates qui tiennent debout), le rangement (`ranger` : deux par passage, trois par jour, quarante par
 * étagère, jamais deux fois la même chose), ce que chacun en lit (`titrePour`, `detailPour` : « Le permis de Léa »
 * chez moi, « Ton permis » chez elle), les rayons, et la banque des phrases de la figurine qui voit noter.
 *
 * LE MOT. À l'écran, l'étagère garde des « souvenirs » ; les cadeaux des visites s'appellent tous « cadeaux ». Dans le
 * code, l'étagère dit `objet`, jamais `souvenir` (le mot désigne déjà les cadeaux des visites : `OBJETS_SOUVENIR`).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici, aucun import qui ne soit pas un type.
 */

export const GENRES = ["date", "promesse", "gout", "blague"] as const;
export type GenreObjet = (typeof GENRES)[number];
export const SORTES = ["epreuve", "fete", "evenement"] as const;
export type SorteDate = (typeof SORTES)[number];
/**
 * `actif` : sur l'étagère ; `tenue` : une promesse tenue (lot E2) ; `fierte` : une épreuve réussie (lot E2) ; `passe` :
 * partie sans bruit (rien n'en reste à l'écran) ; `sommeil` : une promesse qu'on ne relance plus ; `retire` : retirée par
 * l'un des deux (une pierre tombale : ce message ne sera plus jamais noté) ; (lot E5) `propose` : la figurine demande
 * avant de ranger (« 📌 Je le range ? ») — rien ne se voit avant un « oui ».
 */
export type EtatObjet = "actif" | "tenue" | "fierte" | "passe" | "sommeil" | "retire" | "propose";
/**
 * 📌 (lot E5) LA QUESTION : à qui elle est posée (8 signes tirés de son identifiant, ou « deux » : le premier qui
 * répond décide), jusqu'à quand ; `issue` : une épreuve réussie à ranger dans les fiertés ; `par8` : un dépôt de
 * l'autre (« Marc veut ranger sur votre étagère »).
 */
export type Demande = { a: string; jusqua: string; issue?: true; par8?: string };
export type RayonCle = "fiertes" | "avenir" | "aime";

/** Ce que le seau garde (`fils/<paire>/etagere.json`). Jamais l'identifiant d'un habitant : 8 signes tirés de lui. */
export type ObjetGarde = {
  id: string;
  genre: GenreObjet;
  sorte?: SorteDate;
  emoji: string;
  /** « Le permis » : 28 signes au plus, sans prénom ni possessif. */
  titre: string;
  /** « Ton permis » : pour celui que ça concerne. */
  titreToi?: string;
  /** Qui est concerné : 8 signes tirés de son identifiant, ou « deux ». */
  concerne: string;
  nuance?: "aime" | "envie";
  /** La phrase exacte, telle qu'elle a été dite. */
  citation: string;
  /** Qui l'a dite. */
  de8: string;
  /** L'identifiant du message d'où elle vient. */
  message: string;
  /** Quand ce message a été envoyé (« Dit par Léa · ven. 13 nov., 18:42 »). */
  messageLe?: string;
  /** Quand elle a été notée. */
  le: string;
  /** Le jour (« 2026-11-19 »), pour une date ; une promesse peut en avoir un. */
  quand?: string;
  /** Les mots employés pour ce jour (« jeudi prochain »). */
  ditQuand?: string;
  annuel?: boolean;
  etat: EtatObjet;
  /** La dernière action de l'un des deux (« ia » : l'issue dite par le modèle). */
  change?: { le: string; par8: string };
  /** 🏆 Une fierté : l'emoji d'avant (la voiture devenue trophée). */
  emojiAvant?: string;
  /** ✋ (lot E4) déposé à la main, pas noté par les figurines : pas de citation ; `de8` : qui l'a déposé. */
  depose?: true;
  /** 📌 (lot E5) la question qui attend (un souvenir proposé, ou l'issue d'une épreuve). */
  demande?: Demande;
  /** 🪦 (lot E5) pourquoi c'est une pierre tombale : un « non », 48 heures sans réponse, ou retiré. */
  raison?: "non" | "sans-reponse" | "retire";
  /** (lot E5) l'issue de cette épreuve a reçu un « non » : elle n'est plus jamais demandée. */
  sansIssue?: true;
};

/**
 * 🃏 CE QUI S'INSÈRE DANS LE FIL (lot E2), à son heure, pour les deux : une fierté (« 🏆 RANGÉ EN HAUT DE VOTRE
 * ÉTAGÈRE »), une promesse tenue (« ✅ PROMESSE TENUE », `n` : les promesses tenues entre eux à ce moment), une relance
 * (« VOS FIGURINES SE SOUVIENNENT », `n` : 21 ou 60 jours ; 0 : le lendemain du jour prévu).
 */
export type GenreCarte = "fierte" | "tenue" | "relance" | "rallume";
export type CarteGardee = { id: string; genre: GenreCarte; objet: string; le: string; n?: number };
export type CarteVue = { id: string; genre: GenreCarte; le: string; n?: number; objet: ObjetVu; nouvelle: boolean };
/** ✨ (lot E3) « L'ÉTAGÈRE SE RALLUME » : pas d'objet, le moment où ils se sont reparlé. */
export type CarteRallume = { id: string; le: string; nouvelle: boolean };

/** Ce qu'un des deux en voit : le titre déjà tourné pour lui, le détail composé. */
export type ObjetVu = {
  id: string;
  genre: GenreObjet;
  sorte?: SorteDate;
  emoji: string;
  titre: string;
  detail: string;
  citation: string;
  /** Qui l'a dit (« moi » : celui qui regarde), quand. */
  de: "moi" | "lui";
  ditPar: string;
  ditLe: string;
  le: string;
  quand?: string;
  annuel?: boolean;
  etat: EtatObjet;
  rayon: RayonCle;
  /** Ça le concerne, lui (celui qui regarde) ; ou les deux. */
  pourMoi: boolean;
  deux: boolean;
  /** ✅ Quand la promesse a été tenue (« Annuler » pendant 24 h). */
  tenueLe?: string;
  /** ✋ (lot E4) déposé à la main (« Déposé par toi ») : pas de citation. */
  depose?: true;
  /** 🏡 (lot E4, « Mon étagère ») d'où il vient : l'étagère avec ce proche (sa clé) ; rien : déposé sur la mienne. */
  avec?: { prenom: string; cle: string };
  /** 👀 (lot E4) montré aux visiteurs de mon univers ; `peutMontrer` : ça ne concerne que moi. */
  montre?: boolean;
  peutMontrer?: boolean;
};

/** 🎭 L'étagère dans la scène de la conversation (relue avec la conversation vivante, toutes les 4 s). */
export type EtagereScene = {
  /** Les objets visibles, du plus ancien au plus récent (les cartes du fil, le mur). */
  objets: ObjetVu[];
  /** Ceux qu'il n'a pas encore vus se poser (l'envol, une fois par personne). */
  nouveaux: string[];
  /** 🃏 Les fiertés, les promesses tenues, les relances (lot E2) ; `nouvelle` : il ne l'a pas encore vue se jouer. */
  cartes?: CarteVue[];
  /** Les promesses tenues entre eux. */
  tenues?: number;
  /** L'un des deux l'a mise en pause. */
  pause?: { moi: boolean };
  /** 🕸️ (lot E3) l'état de leur relation, et ce que sa figurine lui dit, à lui seul, quand l'étagère prend la poussière. */
  etat?: EtatEtagere;
  poussiere?: { jours: number; texte: string; bouton: string };
  rallumes?: CarteRallume[];
  /** 📌 (lot E5) les questions qui l'attendent, lui ; `aJouer` : celle que la scène joue (une par jour). */
  questions?: QuestionVue[];
  aJouer?: string;
};

/**
 * 📌 (lot E5) UNE QUESTION, telle que celui qui décide la voit : le souvenir (déjà tourné pour lui), jusqu'à quand,
 * la phrase de la figurine, et laquelle des deux figurines la pose (`qui`).
 */
export type QuestionVue = { id: string; objet: ObjetVu; jusqua: string; issue?: true; depot?: true; phrase: string; qui: "moi" | "lui" };

/** 📚 La page « Votre étagère ». */
export type EtagereVue = {
  prenom: string;
  image: string;
  objets: ObjetVu[];
  tenues: number;
  pause: { moi: boolean } | null;
  /** 🕸️ (lot E3) « ✨ Bien éclairée · vous vous êtes parlé 5 jours sur 7 », « 🕸️ Elle prend la poussière · 12 jours sans un mot ». */
  etat?: EtatEtagere;
  phraseEtat?: string;
};

export const ETAGERE = {
  /** Deux objets au plus par passage du modèle. */
  parPassage: 2,
  /** Trois nouveaux objets par paire et par jour. */
  parJour: 3,
  /** Quarante objets visibles par étagère (au-delà, le plus ancien goût s'en va). */
  max: 40,
  /** Six passages du modèle par paire et par jour. */
  passagesParJour: 6,
  /** Le dernier message lu doit avoir une minute : l'échange s'est posé. */
  attente: 60_000,
  /** Le verrou d'un passage. */
  verrou: 90_000,
  /** Les messages donnés au modèle, au plus ; et leurs signes. */
  messagesLus: 12,
  signesMessage: 300,
  /** Au moins un message de vingt signes transcrits. */
  signesMin: 20,
  titreMax: 28,
  citationMax: 140,
  /** Une date : entre aujourd'hui et dans 400 jours. */
  joursMax: 400,
  /** Les objets vus par personne, gardés. */
  vusGardes: 120,
  /** Les entrées gardées (les pierres tombales comprises). */
  gardes: 200,
} as const;

/** 📌 (lot E5) « Je le range ? » : 48 heures pour répondre ; une date plus proche : jusqu'à son soir (20 h UTC), et au moins trois heures. */
export const ACCORD = { heures: 48, soirUtc: "20:00:00", auMoins: 3 * 3_600_000 } as const;

// ─── le catalogue des emojis ───────────────────────────────────────────────────────────────────────
/**
 * Le modèle choisit dans cette liste fermée. Jamais d'alcool, de tabac, de médicament, d'arme, de drapeau ni de
 * symbole religieux. Hors liste : celui du genre.
 */
export const CATALOGUE: readonly string[] = [
  // les jours qui comptent
  "🚗", "🎓", "📝", "🏅", "💼", "🎂", "🎉", "🎈", "📅", "⭐",
  // le sport
  "⚽", "🏀", "🎾", "🏊", "🚴", "🥾", "🏃", "⛷️", "🧗",
  // les sorties
  "🎤", "🎧", "🎬", "🎸", "🎹", "🎨", "📸", "🎮", "📖", "🎡",
  // les voyages, la maison
  "✈️", "🧳", "🏖️", "⛰️", "🏕️", "🚆", "🏠", "📦",
  // à table
  "🍝", "🍕", "🥐", "🍰", "🍪", "☕", "🍣", "🍔", "🍫", "🍦", "🧁", "🍓", "🥗",
  // la nature
  "💐", "🌷", "🌻", "🪴", "🌊",
  // les bêtes
  "🐶", "🐱", "🦆", "🐰", "🐴", "🐠",
  // le reste
  "🧦", "🎁", "🧸", "🧩", "🎲", "🪁", "🤝", "💛", "😂",
];
/** L'emoji d'un genre, quand le modèle en choisit un hors liste. */
export const EMOJI_DU_GENRE: Record<GenreObjet, string> = { date: "📅", promesse: "🤝", gout: "💛", blague: "😂" };
const sansVariante = (e: string) => e.replace(/️/g, "");
export const emojiDuCatalogue = (e: unknown, genre: GenreObjet): string => {
  const x = typeof e === "string" ? sansVariante(e.trim()) : "";
  return CATALOGUE.find((c) => sansVariante(c) === x) ?? EMOJI_DU_GENRE[genre];
};

// ─── les mots à plat ───────────────────────────────────────────────────────────────────────────────
/** Minuscules, sans accents, sans ponctuation ni emoji, espaces réduits : pour retrouver une citation dans un message. */
export function aPlat(t: string): string {
  return String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
/** La citation se retrouve, mot pour mot, dans le message (le garde-fou contre l'invention). */
export const citationTrouvee = (citation: string, texte: string) => {
  const c = aPlat(citation);
  return c.length >= 3 && ` ${aPlat(texte)} `.includes(` ${c} `);
};

/**
 * 🚫 RIEN DE SENSIBLE (3.2) : la santé, un deuil, une dispute, l'argent, les amours, le corps, la religion, la
 * politique, la justice, la violence, le harcèlement — ou quelqu'un qui va mal. Un seul de ces mots dans l'échange :
 * rien n'est noté de tout l'échange (le modèle n'est même pas appelé). Le modèle a la même consigne : un double filet.
 */
// (des mots entiers, au pluriel près ; pas les mots qui ont un autre sens courant : « mort de rire », « une enceinte »,
// « un avocat » au marché, « prêt », « la médaille d'argent »)
const SENSIBLE = new RegExp(
  `(?:^| )(?:${[
    "malade", "maladie", "hopital", "hosto", "urgences", "medecin", "docteur", "dentiste", "kine", "psy", "therapie", "operer", "opere", "operee", "chimio", "cancer", "tumeur", "diagnostic", "ordonnance", "medicament", "grossesse", "fausse couche", "ivg",
    "deces", "decede", "decedee", "deuil", "enterrement", "obseques", "funerailles", "suicide", "depression", "deprime", "deprimee", "angoisse", "crise d angoisse", "je vais mal", "ca va mal",
    "dispute", "engueule", "engueuler", "rupture", "divorce", "separation", "separe", "separee", "larguer", "largue", "larguee",
    "fric", "thune", "dette", "credit", "salaire", "loyer", "banque", "decouvert", "impot", "chomage",
    "amoureux", "amoureuse", "crush", "rencard", "sexe", "coucher avec",
    "poids", "kilo", "regime", "grossi", "maigri",
    "religion", "eglise", "mosquee", "synagogue", "priere", "prier", "ramadan", "careme",
    "politique", "election", "voter", "manif",
    "tribunal", "police", "plainte", "proces", "garde a vue", "prison",
    "violence", "harcele", "harcelee", "harcelement", "agresse", "agressee", "agression", "menace",
  ]
    .map((m) => `${m}s?`)
    .join("|")})(?: |$)`,
);
export const echangeSensible = (textes: readonly string[]) => textes.some((t) => SENSIBLE.test(aPlat(t)));

/** 🔒 Rien de privé : pas de suite de six chiffres (un numéro), pas d'adresse électronique. */
export const prive = (t: string) => /\d{6,}/.test(String(t).replace(/[\s.\-]/g, "")) || /\S+@\S+\.\S+/.test(t);

// ─── les jours ─────────────────────────────────────────────────────────────────────────────────────
export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Un jour (« 2026-11-19 ») qui existe ; `null` sinon. */
export function jourValide(x: unknown): string | null {
  const m = ISO.exec(typeof x === "string" ? x.trim() : "");
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
const enDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const enIso = (d: Date) => d.toISOString().slice(0, 10);
export const ajouterJours = (iso: string, n: number) => enIso(new Date(enDate(iso).getTime() + n * 86_400_000));
/** Combien de jours de `a` à `b` (positif si `b` est après). */
export const ecartJours = (a: string, b: string) => Math.round((enDate(b).getTime() - enDate(a).getTime()) / 86_400_000);
export const jourDeLaSemaine = (iso: string) => JOURS[enDate(iso).getUTCDay()];
/** Le jour, à l'heure de Paris, d'un horodatage (« 2026-11-13 »). */
export const jourDe = (le: string | number) => {
  const d = new Date(le);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
};
const numero = (d: number) => (d === 1 ? "1er" : String(d));
/** « jeudi 19 nov. » */
export const jourCourt = (iso: string) => {
  const d = enDate(iso);
  return `${JOURS[d.getUTCDay()]} ${numero(d.getUTCDate())} ${MOIS_COURTS[d.getUTCMonth()]}`;
};
/** « le 4 décembre » */
export const leJourDuMois = (iso: string) => {
  const d = enDate(iso);
  return `le ${numero(d.getUTCDate())} ${MOIS[d.getUTCMonth()]}`;
};
/** « vendredi 13 novembre 2026 » (ce que le modèle lit). */
export const jourEnToutesLettres = (iso: string) => {
  const d = enDate(iso);
  return `${JOURS[d.getUTCDay()]} ${numero(d.getUTCDate())} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
/** « ven. 13 nov., 18:42 » (quand une phrase a été dite). */
export const momentCourt = (le: string) => {
  const d = new Date(le);
  if (Number.isNaN(d.getTime())) return "";
  const iso = jourDe(le);
  const h = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const x = enDate(iso);
  return `${JOURS_COURTS[x.getUTCDay()]} ${numero(x.getUTCDate())} ${MOIS_COURTS[x.getUTCMonth()]}, ${h}`;
};

// ─── ce que chacun lit ─────────────────────────────────────────────────────────────────────────────
/** « de Léa », « d’Inès », « d’Hugo ». */
export const deDevant = (prenom: string) => (/^[aeiouàâäéèêëîïôöùûüœh]/i.test(prenom.trim()) ? `d’${prenom.trim()}` : `de ${prenom.trim()}`);

/** Le titre se lit des deux côtés : « Le permis de Léa » chez moi, « Ton permis » chez Léa, « Le resto italien » pour les deux. */
export function titrePour(o: Pick<ObjetGarde, "titre" | "titreToi" | "concerne">, moi8: string, prenomAutre: string): string {
  if (o.concerne === "deux") return o.titre;
  if (o.concerne === moi8) return o.titreToi || o.titre;
  return `${o.titre} ${deDevant(prenomAutre)}`;
}

/** Le détail sous le titre : l'appli le compose, pas le modèle. */
export function detailPour(o: ObjetGarde, moi8: string, prenomAutre: string, aujourdhui: string): string {
  if (o.etat === "fierte") return o.quand ? `réussi le ${jourCourt(o.quand)}` : "réussi";
  if (o.genre === "promesse" && o.etat === "sommeil") return `promis le ${jourCourt(jourDe(o.le)).replace(/^\S+ /, "")}`;
  if (o.genre === "date") return o.quand ? (o.annuel ? leJourDuMois(o.quand) : jourCourt(o.quand)) : "";
  if (o.genre === "promesse") {
    if (o.etat === "tenue") return `promesse tenue le ${jourCourt(jourDe(o.change?.le ?? o.le)).replace(/^\S+ /, "")}`;
    if (o.quand && ecartJours(aujourdhui, o.quand) >= 0) return `promis pour ${jourCourt(o.quand)}`;
    const j = ecartJours(jourDe(o.le), aujourdhui);
    return j >= 21 ? `promis il y a ${Math.floor(j / 7)} semaines` : `promis le ${jourCourt(jourDe(o.le)).replace(/^\S+ /, "")}`;
  }
  if (o.genre === "gout") {
    const envie = o.nuance === "envie";
    if (o.concerne === "deux") return envie ? "vous en avez envie" : "vous adorez";
    if (o.concerne === moi8) return envie ? "tu en as envie" : "tu adores";
    return envie ? `${prenomAutre} en a envie` : `${prenomAutre} adore`;
  }
  // (lot E4 : une blague déposée sur sa propre étagère, ou vue par un visiteur)
  if (o.concerne === moi8) return "ta blague";
  return o.concerne === "deux" ? "votre blague" : `la blague ${deDevant(prenomAutre)}`;
}

/** Les trois rayons : « Nos fiertés », « À venir », « Ce qu'on aime ». */
export const RAYONS: { cle: RayonCle; nom: string }[] = [
  { cle: "fiertes", nom: "Nos fiertés" },
  { cle: "avenir", nom: "À venir" },
  { cle: "aime", nom: "Ce qu’on aime" },
];
export const rayonDe = (o: Pick<ObjetGarde, "genre" | "etat">): RayonCle =>
  o.etat === "fierte" || o.etat === "tenue" ? "fiertes" : o.genre === "date" || o.genre === "promesse" ? "avenir" : "aime";

/** Ce qui se voit sur l'étagère. */
export const visible = (o: Pick<ObjetGarde, "etat">) => o.etat === "actif" || o.etat === "tenue" || o.etat === "fierte" || o.etat === "sommeil";

/** Ce que celui qui regarde (`moi8`) voit d'un objet. */
export function vueDe(o: ObjetGarde, c: { moi8: string; prenomMoi: string; prenomAutre: string; aujourdhui: string }): ObjetVu {
  const moi = o.de8 === c.moi8;
  return {
    id: o.id,
    genre: o.genre,
    ...(o.sorte ? { sorte: o.sorte } : {}),
    emoji: o.emoji,
    titre: titrePour(o, c.moi8, c.prenomAutre),
    detail: detailPour(o, c.moi8, c.prenomAutre, c.aujourdhui),
    citation: o.citation,
    de: moi ? "moi" : "lui",
    ditPar: moi ? c.prenomMoi : c.prenomAutre,
    ditLe: o.messageLe || o.le,
    le: o.le,
    ...(o.quand ? { quand: o.quand } : {}),
    ...(o.annuel ? { annuel: true } : {}),
    etat: o.etat,
    rayon: rayonDe(o),
    pourMoi: o.concerne === c.moi8,
    deux: o.concerne === "deux",
    ...(o.etat === "tenue" && o.change?.le ? { tenueLe: o.change.le } : {}),
    ...(o.depose ? { depose: true as const } : {}),
  };
}

// ─── ce qu'un objet noté doit être pour être gardé ─────────────────────────────────────────────────
/** Ce que le modèle lit d'un message (et ce que le serveur sait de lui). */
export type MessageLu = { n: number; id: string; de8: string; texte: string; jour: string; le: string };
export type ContexteNote = {
  messages: readonly MessageLu[];
  /** Les deux de la paire. */
  gens: readonly { prenom: string; h8: string }[];
  aujourdhui: string;
  /** Les mots passent (`motPasse` côté serveur : aucun mot interdit, rien d'alcoolisé). */
  passe: (t: string) => boolean;
};
export type ObjetPropose = Omit<ObjetGarde, "id" | "le" | "etat" | "change">;

const POSSESSIF = /^(son|sa|ses|mon|ma|mes|ton|ta|tes|leur|leurs|notre|nos|votre|vos)\s/i;
const A_TOI = /^(ton|ta|tes|t’|t')\s?/i;
const nettoyer = (x: unknown) =>
  (typeof x === "string" ? x : "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/^["«»“”\s]+|["«»“”\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
const majuscule = (t: string) => (t ? t[0].toLocaleUpperCase("fr-FR") + t.slice(1) : t);
const DEUX = new Set(["deux", "les deux", "tous les deux", "toutes les deux", "vous deux", "eux deux", "nous deux", "ensemble"]);

/**
 * ✅ UN OBJET PROPOSÉ PAR LE MODÈLE, VÉRIFIÉ (4.4). Il est jeté, sans rien dire, si : le genre ou la sorte n'existent pas ;
 * la citation ne se retrouve pas, mot pour mot, dans le message désigné ; un mot ne passe pas (interdit, alcool, sujet
 * sensible), ou il y a un numéro, une adresse électronique ; le titre porte un prénom ou un possessif ; on ne sait pas
 * qui est concerné ; la date ne tient pas debout (passée, à plus de 400 jours, ou pas le jour de la semaine dit).
 */
export function objetValide(x: unknown, c: ContexteNote): ObjetPropose | null {
  if (!x || typeof x !== "object") return null;
  const b = x as Record<string, unknown>;
  const genre = (GENRES as readonly string[]).includes(String(b.genre)) ? (b.genre as GenreObjet) : null;
  if (!genre) return null;
  const msg = c.messages.find((m) => m.n === Number(b.message));
  if (!msg) return null;
  // la citation : la phrase exacte
  const citation = nettoyer(b.citation);
  if (citation.length < 3 || citation.length > ETAGERE.citationMax || !citationTrouvee(citation, msg.texte)) return null;
  // le titre : court, sans prénom ni possessif
  const titre = majuscule(nettoyer(b.titre));
  if (titre.length < 2 || titre.length > ETAGERE.titreMax || POSSESSIF.test(titre)) return null;
  const prenoms = c.gens.map((g) => aPlat(g.prenom)).filter(Boolean);
  const portePrenom = (t: string) => prenoms.some((p) => ` ${aPlat(t)} `.includes(` ${p} `));
  if (portePrenom(titre)) return null;
  let titreToi = majuscule(nettoyer(b.titre_toi ?? b.titreToi));
  if (titreToi && (titreToi.length > ETAGERE.titreMax || !A_TOI.test(titreToi) || portePrenom(titreToi))) titreToi = "";
  // les mots passent
  const textes = [titre, citation, titreToi].filter(Boolean);
  if (!textes.every((t) => c.passe(t)) || textes.some(prive) || echangeSensible(textes)) return null;
  // qui est concerné
  const cq = aPlat(nettoyer(b.concerne));
  let concerne = "";
  if (DEUX.has(cq)) concerne = "deux";
  else {
    const qui = c.gens.filter((g) => aPlat(g.prenom) === cq);
    if (qui.length === 1) concerne = qui[0].h8;
    else if (qui.length === 2) concerne = msg.de8;
  }
  if (!concerne) return null;
  const o: ObjetPropose = { genre, emoji: emojiDuCatalogue(b.emoji, genre), titre, concerne, citation, de8: msg.de8, message: msg.id, messageLe: msg.le };
  if (titreToi && concerne !== "deux") o.titreToi = titreToi;
  // une date, et le jour d'une promesse
  if (genre === "date") {
    const sorte = (SORTES as readonly string[]).includes(String(b.sorte)) ? (b.sorte as SorteDate) : null;
    if (!sorte) return null;
    o.sorte = sorte;
    if (sorte === "fete") o.annuel = true;
  }
  if (genre === "date" || (genre === "promesse" && b.quand)) {
    const quand = dateQuiTient(b.quand, nettoyer(b.dit), c.aujourdhui, Boolean(o.annuel));
    if (!quand) return null;
    o.quand = quand;
    const dit = nettoyer(b.dit);
    if (dit && dit.length <= 40) o.ditQuand = dit;
  }
  if (genre === "gout") o.nuance = b.nuance === "envie" ? "envie" : "aime";
  return o;
}

/**
 * 📅 La date tient debout : un vrai jour, entre aujourd'hui et dans 400 jours ; si les mots nomment un jour de la
 * semaine (« jeudi prochain »), elle tombe ce jour-là. Un anniversaire passé cette année prend sa prochaine occurrence.
 */
export function dateQuiTient(x: unknown, dit: string, aujourdhui: string, annuel: boolean): string | null {
  let q = jourValide(x);
  if (!q) return null;
  if (annuel) for (let k = 0; k < 3 && ecartJours(aujourdhui, q) < 0; k++) q = jourValide(`${Number(q.slice(0, 4)) + 1}${q.slice(4)}`) ?? ajouterJours(q, 365);
  const e = ecartJours(aujourdhui, q);
  if (e < 0 || e > ETAGERE.joursMax) return null;
  const nomme = JOURS.find((j) => ` ${aPlat(dit)} `.includes(` ${j} `));
  if (nomme && jourDeLaSemaine(q) !== nomme) return null;
  return q;
}

// ─── le rangement ──────────────────────────────────────────────────────────────────────────────────
/**
 * 📚 RANGER CE QUI VIENT D'ÊTRE NOTÉ (3.3) : deux au plus par passage ; trois nouveaux par paire et par jour ; une même
 * chose (même genre et même titre, ou même message) n'est notée qu'une fois — elle est mise à jour (sa date) ; un
 * message dont un objet a été retiré ne l'est plus jamais ; quarante objets visibles au plus (au-delà, le plus ancien
 * goût s'en va, jamais une fierté ni une date). Rend la liste rangée, et les objets tout neufs.
 *
 * 📌 (lot E5) `demander` : la question à poser pour ce souvenir (il se range alors « proposé », rien ne se voit avant
 * un « oui ») ; `null` : il se range tout de suite (le réglage « Ma figurine range sans me demander »). Une question
 * qui attend compte comme un souvenir : elle n'est pas notée deux fois, et compte dans les trois par jour.
 */
export function ranger(
  objets: readonly ObjetGarde[],
  proposes: readonly ObjetPropose[],
  o: { aujourdhui: string; le: string; nouvelId: () => string; demander?: (p: ObjetPropose) => Demande | null },
): { objets: ObjetGarde[]; neufs: string[]; questions: string[] } {
  const liste = objets.map((x) => ({ ...x }));
  const neufs: string[] = [];
  const questions: string[] = [];
  // (ce qu'ils ont déposé à la main ne compte pas : trois par jour, c'est pour les figurines)
  let duJour = liste.filter((x) => x.etat !== "retire" && !x.depose && jourDe(x.le) === o.aujourdhui).length;
  for (const p of proposes.slice(0, ETAGERE.parPassage)) {
    if (liste.some((x) => x.message === p.message && x.etat === "retire")) continue;
    const meme = liste.find((x) => x.etat !== "retire" && x.etat !== "passe" && ((x.genre === p.genre && aPlat(x.titre) === aPlat(p.titre)) || x.message === p.message));
    if (meme) {
      // (la même chose, redite : la date se met à jour)
      if (p.quand && (meme.etat === "actif" || meme.etat === "propose")) {
        meme.quand = p.quand;
        if (p.ditQuand) meme.ditQuand = p.ditQuand;
      }
      continue;
    }
    if (duJour >= ETAGERE.parJour) continue;
    const id = o.nouvelId();
    const demande = o.demander?.(p) ?? null;
    liste.push(demande ? { ...p, id, le: o.le, etat: "propose", demande } : { ...p, id, le: o.le, etat: "actif" });
    neufs.push(id);
    if (demande) questions.push(id);
    duJour++;
  }
  return { objets: borner(liste), neufs, questions };
}

/**
 * Quarante souvenirs visibles au plus (au-delà, le plus ancien goût s'en va) ; deux cents entrées gardées (les pierres
 * tombales et les objets partis s'en vont d'abord — jamais une question qui attend).
 */
export function borner(objets: readonly ObjetGarde[]): ObjetGarde[] {
  const liste = objets.map((x) => ({ ...x }));
  while (liste.filter(visible).length > ETAGERE.max) {
    const vieux = liste.filter((x) => x.genre === "gout" && x.etat === "actif").sort((a, b) => a.le.localeCompare(b.le))[0];
    if (!vieux) break;
    Object.assign(vieux, { etat: "passe" as const });
  }
  let rangees = liste;
  while (rangees.length > ETAGERE.gardes) {
    const k = rangees.findIndex((x) => !visible(x) && x.etat !== "propose");
    rangees = k >= 0 ? rangees.filter((_, i) => i !== k) : rangees.slice(1);
  }
  return rangees;
}

/** 🪦 Une pierre tombale : plus aucun texte, seulement de quoi ne jamais renoter ce message — et (lot E5) pourquoi. */
export const pierreTombale = (x: ObjetGarde, par8: string, le: string, raison: NonNullable<ObjetGarde["raison"]> = "retire"): ObjetGarde => ({
  id: x.id,
  genre: x.genre,
  emoji: "",
  titre: "",
  concerne: "",
  citation: "",
  de8: "",
  message: x.message,
  le: x.le,
  etat: "retire",
  change: { le, par8 },
  raison,
});

// ─── lot E5 : « Je le range ? » (le 14 novembre 2026, `docs/univers/etagere-accord.md`) ──────────
/**
 * ⏳ JUSQU'À QUAND la question attend : 48 heures ; pour une date plus proche, jusqu'au soir de ce jour-là (et au moins
 * trois heures, pour qu'une question posée le soir même ait le temps d'être vue).
 */
export function jusquaDe(le: string, quand?: string): string {
  const t = Date.parse(le) || Date.now();
  let fin = t + ACCORD.heures * 3_600_000;
  const soir = quand && jourValide(quand) ? Date.parse(`${quand}T${ACCORD.soirUtc}Z`) : NaN;
  if (!Number.isNaN(soir) && soir < fin) fin = Math.max(soir, t + ACCORD.auMoins);
  return new Date(fin).toISOString();
}
/** À qui se pose la question d'un souvenir : celui qu'il concerne (même si c'est l'autre qui l'a dit), ou « deux ». */
export const aQuiDemander = (o: Pick<ObjetGarde, "concerne">) => (o.concerne === "deux" ? "deux" : o.concerne);
/** La question attend encore : un souvenir proposé, ou l'issue d'une épreuve, avant `jusqua`. */
export const enQuestion = (o: Pick<ObjetGarde, "etat" | "demande">, maintenant = Date.now()) =>
  Boolean(o.demande) && (o.etat === "propose" || (o.etat === "actif" && Boolean(o.demande?.issue))) && Date.parse(o.demande!.jusqua) > maintenant;
/** C'est à lui de répondre (celui à qui elle est posée ; « deux » : l'un ou l'autre). */
export const decide = (o: Pick<ObjetGarde, "demande">, moi8: string) => Boolean(o.demande) && (o.demande!.a === moi8 || o.demande!.a === "deux");

/** 🏆 L'issue d'une épreuve (« JE L'AI !!! ») devient une question à celui qu'elle concerne (jamais deux fois après un « non »). */
export function questionDIssue(objets: readonly ObjetGarde[], ids: readonly string[], o: { aujourdhui: string; le: string }): { objets: ObjetGarde[]; questions: string[] } {
  const questions: string[] = [];
  const l = objets.map((x) => {
    if (!ids.includes(x.id) || !issueAttendue(x, o.aujourdhui) || x.sansIssue || x.demande) return x;
    questions.push(x.id);
    return { ...x, demande: { a: aQuiDemander(x), jusqua: jusquaDe(o.le), issue: true as const } };
  });
  return { objets: l, questions };
}

/**
 * ✓ / ✗ LA RÉPONSE de celui qui décide : « oui » range le souvenir (une épreuve réussie : la fierté, sa carte) ; « non »
 * l'écarte pour toujours (la pierre tombale « non » ; une issue : plus jamais demandée) ; `quand` : le jour corrigé avant
 * de ranger (ça vaut un « oui »). L'autre n'est pas prévenu d'un « non ».
 */
export function repondre(
  objets: readonly ObjetGarde[],
  id: string,
  oui: boolean,
  c: { moi8: string; le: string; quand?: string; maintenant?: number },
): { objets: ObjetGarde[]; cartes: CarteGardee[] } | { erreur: string; statut: number } {
  const o = objets.find((x) => x.id === id);
  if (!o || !enQuestion(o, c.maintenant)) return { erreur: "Cette question n’attend plus de réponse.", statut: 404 };
  if (!decide(o, c.moi8)) return { erreur: "C’est à celui que ça concerne de répondre.", statut: 403 };
  const change = { le: c.le, par8: c.moi8 };
  const sans = (x: ObjetGarde): ObjetGarde => {
    const y = { ...x };
    delete y.demande;
    return y;
  };
  if (o.demande?.issue) {
    if (!oui) return { objets: objets.map((x) => (x === o ? { ...sans(x), sansIssue: true as const } : x)), cartes: [] };
    return {
      objets: objets.map((x) => (x === o ? { ...sans(x), etat: "fierte" as const, emojiAvant: x.emoji, emoji: "🏆", change } : x)),
      cartes: [{ id: `f-${o.id}`, genre: "fierte", objet: o.id, le: c.le }],
    };
  }
  if (!oui) return { objets: objets.map((x) => (x === o ? pierreTombale(x, c.moi8, c.le, "non") : x)), cartes: [] };
  return { objets: borner(objets.map((x) => (x === o ? { ...sans(x), etat: "actif" as const, change, ...(c.quand ? { quand: c.quand, ditQuand: undefined } : {}) } : x))), cartes: [] };
}

/** Le panneau que brandit la figurine. */
export const PANNEAU_QUESTION = "📌 Je le range ?";
/** Au « non » : elle range l'objet dans sa poche. */
export const PHRASE_NON = "D’accord, j’oublie.";
/** « , jeudi 19 », « , le 4 décembre » : le jour d'un souvenir, dit en passant. */
const jourEnPassant = (o: Pick<ObjetGarde, "quand" | "annuel">) => (o.quand ? (o.annuel ? `, ${leJourDuMois(o.quand)}` : `, ${jourCourt(o.quand).split(" ").slice(0, 2).join(" ")}`) : "");
/**
 * 🗨️ LA BULLE DE LA QUESTION (validée par le propriétaire le 14 novembre 2026) : « J'ai entendu : ton permis, jeudi
 * 19. » ; à deux : « J'ai entendu : le resto italien. On le garde ? » ; l'issue : « J'ai entendu : c'est réussi ! Je
 * range ça dans vos fiertés ? 🏆 » ; le dépôt de l'autre : « Marc veut ranger sur votre étagère : ton concert, samedi.
 * D'accord ? »
 */
export function phraseQuestion(o: ObjetGarde, moi8: string, prenomAutre: string): string {
  if (o.demande?.issue) return "J’ai entendu : c’est réussi ! Je range ça dans vos fiertés ? 🏆";
  if (o.depose && o.demande?.par8 && o.demande.par8 !== moi8) return `${prenomAutre} veut ranger sur votre étagère : ${sonTitre(o, moi8)}${jourEnPassant(o)}. D’accord ?`;
  if (o.concerne === "deux") return `J’ai entendu : ${minuscule(o.titre)}${jourEnPassant(o)}. On le garde ?`;
  return `J’ai entendu : ${sonTitre(o, moi8)}${jourEnPassant(o)}.`;
}
/** Laquelle des deux figurines pose la question : celle de celui qui l'a dit ; une issue, un dépôt : la sienne. */
export const quiDemande = (o: ObjetGarde, moi8: string): "moi" | "lui" => (o.demande?.issue || o.depose ? "moi" : o.de8 === moi8 ? "moi" : "lui");
/** « Sans réponse, elle oublie dans 2 jours » (« demain », « ce soir »). */
export function oubliDans(jusqua: string, aujourdhui: string): string {
  const e = ecartJours(aujourdhui, jourDe(jusqua) || aujourdhui);
  return e >= 2 ? `dans ${e} jours` : e === 1 ? "demain" : "ce soir";
}
/** 🔔 L'envoi du matin, quand il n'a rien d'autre à dire : « 📌 Ta figurine a 2 choses à te demander ». */
export const notifQuestions = (n: number): { titre: string; corps: string } => ({
  titre: `📌 Ta figurine a ${n > 1 ? `${n} choses` : "une chose"} à te demander`,
  corps: "Elle attend ton oui pour les ranger sur ton étagère.",
});
/** ⚙️ Le réglage (dans « Moi »). */
export const REGLAGE_RANGE_SEUL = {
  titre: "Ma figurine range sans me demander",
  aide: "Ce que vos figurines notent sur toi se range tout de suite sur votre étagère, sans « Je le range ? ». Ce qu’un proche y dépose pour toi se demande toujours.",
} as const;

// ─── ce que dit la figurine qui voit noter ────────────────────────────────────────────────────────
/** 🗨️ La phrase de l'autre figurine quand un objet se pose (une au hasard, jamais deux fois de suite) — validées par le propriétaire le 13 novembre 2026. */
export const PHRASES_NOTE: Record<GenreObjet, readonly string[]> = {
  date: ["C’est noté 📌 On y pensera ce jour-là", "Je retiens la date, promis 📅", "Ce jour-là, on envoie de la chance 🍀"],
  promesse: ["Promis, c’est promis 🤝 Je surveille", "Noté ! On verra qui tient parole 👀", "Je garde ça bien en vue 🤝"],
  gout: ["Bon à savoir 💛 Je garde ça", "Je note, ça peut servir 🎁", "Ça, je ne l’oublierai pas 💛"],
  blague: ["Celle-là, on la garde 😂", "Rangée avec nos meilleures 🏅", "Je la ressortirai, compte sur moi 😏"],
};
const hache = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function phraseDeNote(genre: GenreObjet, graine: string, avant = ""): string {
  const l = PHRASES_NOTE[genre];
  const k = hache(graine) % l.length;
  return l[k] === avant ? l[(k + 1) % l.length] : l[k];
}

/** Les règles, en clair (la page de l'étagère). */
export const REGLES_ETAGERE =
  "Vos figurines notent une ou deux choses par conversation, au plus, et demandent avant de les ranger. Rien de sensible (santé, argent, amours). Tout se voit des deux côtés, et chacun peut retirer un souvenir. Les visiteurs de ton univers ne voient pas votre étagère.";

// ─── lot E2 : plus tard ────────────────────────────────────────────────────────────────────────────
/** Le titre, sa première lettre en minuscule (« le permis de Léa »). */
export const minuscule = (t: string) => (t ? t[0].toLocaleLowerCase("fr-FR") + t.slice(1) : t);

/**
 * ⏳ LE TEMPS PASSE SUR L'ÉTAGÈRE (sans bruit) : une épreuve sans nouvelles trois jours après s'en va ; un événement
 * s'en va le surlendemain ; un anniversaire passé revient l'année suivante ; une promesse relancée deux fois s'endort
 * (elle reste, on ne la relance plus).
 *
 * 📌 (lot E5) Une question sans réponse à temps s'en va, sans bruit, et n'est plus reproposée (la pierre tombale
 * « sans-reponse ») ; l'issue d'une épreuve sans réponse : plus de question (l'épreuve suit son cours). `expires` : combien.
 */
export function vieillir(objets: readonly ObjetGarde[], aujourdhui: string, maintenant = Date.now()): { objets: ObjetGarde[]; change: boolean; expires: number } {
  let change = false;
  let expires = 0;
  const l = objets.map((x) => {
    if (x.etat === "propose") {
      if (enQuestion(x, maintenant)) return x;
      expires++;
      return (change = true), pierreTombale(x, "", new Date(maintenant).toISOString(), "sans-reponse");
    }
    if (x.etat !== "actif") return x;
    // (l'issue qui attend sa réponse : l'épreuve reste là le temps de la question)
    if (x.demande?.issue && enQuestion(x, maintenant)) return x;
    const o = { ...x };
    if (o.demande) {
      expires++;
      change = true;
      delete o.demande;
    }
    if (o.genre === "date" && o.quand) {
      const e = ecartJours(o.quand, aujourdhui);
      if (o.sorte === "epreuve" && e > 3) return (change = true), { ...o, etat: "passe" as const };
      if (o.sorte === "evenement" && e > 1) return (change = true), { ...o, etat: "passe" as const };
      if (o.annuel && e > 0) {
        let q = o.quand;
        for (let k = 0; k < 3 && ecartJours(q, aujourdhui) > 0; k++) q = jourValide(`${Number(q.slice(0, 4)) + 1}${q.slice(4)}`) ?? ajouterJours(q, 365);
        return (change = true), { ...o, quand: q };
      }
    }
    if (o.genre === "promesse" && !o.quand && ecartJours(jourDe(o.le), aujourdhui) >= ETAGERE_E2.sommeil) return (change = true), { ...o, etat: "sommeil" as const };
    return o;
  });
  return { objets: l, change, expires };
}

export const ETAGERE_E2 = {
  /** Les relances d'une promesse (en jours), puis le sommeil. */
  relances: [21, 60] as readonly number[],
  sommeil: 67,
  /** « Annuler » une promesse tenue : pendant 24 h. */
  annuler: 24 * 3_600_000,
  /** Deux rappels au plus par matin. */
  rappels: 2,
  /** Les cartes gardées. */
  cartes: 120,
} as const;

/** 🍝 LES RELANCES DUES : à 21 et 60 jours d'une promesse ; le lendemain du jour prévu (« Alors, c'est fait ? »). */
export function relancesDues(objets: readonly ObjetGarde[], cartes: readonly CarteGardee[], aujourdhui: string, le: string): CarteGardee[] {
  const neuves: CarteGardee[] = [];
  const deja = new Set(cartes.filter((c) => c.genre === "relance").map((c) => `${c.objet}:${c.n ?? 0}`));
  for (const o of objets) {
    if (o.genre !== "promesse" || o.etat !== "actif") continue;
    if (o.quand) {
      if (ecartJours(o.quand, aujourdhui) >= 1 && !deja.has(`${o.id}:0`)) neuves.push({ id: `r0-${o.id}`, genre: "relance", objet: o.id, le, n: 0 });
      continue;
    }
    const age = ecartJours(jourDe(o.le), aujourdhui);
    // (la plus récente qui est due, une seule à la fois)
    const n = [...ETAGERE_E2.relances].reverse().find((j) => age >= j);
    if (n && !deja.has(`${o.id}:${n}`)) neuves.push({ id: `r${n}-${o.id}`, genre: "relance", objet: o.id, le, n });
  }
  return neuves;
}

/** Ce que le modèle dit de l'issue d'une épreuve (4.4). */
export type Issue = { id: string; resultat: "reussi" | "rate" | "reporte"; quand?: string };
export const issueValide = (x: unknown): Issue | null => {
  if (!x || typeof x !== "object") return null;
  const b = x as Record<string, unknown>;
  const r = b.resultat === "reussi" || b.resultat === "rate" || b.resultat === "reporte" ? b.resultat : null;
  return typeof b.id === "string" && r ? { id: b.id, resultat: r, ...(jourValide(b.quand) ? { quand: jourValide(b.quand)! } : {}) } : null;
};
/** Une épreuve attend son issue : son jour est arrivé (du jour J à J+3). */
export const issueAttendue = (o: ObjetGarde, aujourdhui: string) =>
  o.genre === "date" && o.sorte === "epreuve" && o.etat === "actif" && Boolean(o.quand) && ecartJours(o.quand!, aujourdhui) >= 0 && ecartJours(o.quand!, aujourdhui) <= 3;

/**
 * 🏆 LES ISSUES : réussi → une fierté (le trophée, tout en haut, la carte) ; raté → elle s'en va, sans bruit (aucune
 * carte, aucune blague) ; reporté → le nouveau jour s'il est dit, sinon elle s'en va.
 */
export function appliquerIssues(objets: readonly ObjetGarde[], issues: readonly Issue[], o: { aujourdhui: string; le: string; par8: string }): { objets: ObjetGarde[]; cartes: CarteGardee[] } {
  const cartes: CarteGardee[] = [];
  const l = objets.map((x) => {
    const i = issues.find((y) => y.id === x.id);
    if (!i || !issueAttendue(x, o.aujourdhui)) return x;
    if (i.resultat === "reussi") {
      cartes.push({ id: `f-${x.id}`, genre: "fierte", objet: x.id, le: o.le });
      return { ...x, etat: "fierte" as const, emojiAvant: x.emoji, emoji: "🏆", change: { le: o.le, par8: o.par8 } };
    }
    if (i.resultat === "reporte" && i.quand && ecartJours(o.aujourdhui, i.quand) > 0 && ecartJours(o.aujourdhui, i.quand) <= ETAGERE.joursMax) return { ...x, quand: i.quand, ditQuand: undefined };
    return { ...x, etat: "passe" as const };
  });
  return { objets: l, cartes };
}

// ─── les rappels du matin (7.1) ────────────────────────────────────────────────────────────────────
/**
 * epreuve, anniv, anniv3, evenement, lendemain : pour l'autre ; encourage : pour celui que ça concerne ; (lot E4) mien :
 * un jour qu'il a posé lui-même sur SON étagère.
 */
export type CasRappel = "epreuve" | "anniv" | "anniv3" | "evenement" | "lendemain" | "encourage" | "mien";
const RANG_RAPPEL: Record<CasRappel, number> = { epreuve: 1, encourage: 1, mien: 1.5, anniv: 2, anniv3: 3, evenement: 4, lendemain: 5 };
export type Rappel = { cas: CasRappel; objet: ObjetGarde; rang: number };
/** Les rappels d'aujourd'hui sur une étagère, pour celui qui regarde (`moi8`). */
export function rappelsDe(objets: readonly ObjetGarde[], moi8: string, aujourdhui: string): Rappel[] {
  const r: Rappel[] = [];
  for (const o of objets) {
    if (o.genre !== "date" || o.etat !== "actif" || !o.quand) continue;
    const e = ecartJours(aujourdhui, o.quand);
    const pourMoi = o.concerne === moi8;
    let cas: CasRappel | null = null;
    if (o.sorte === "epreuve" && e === 0) cas = pourMoi ? "encourage" : "epreuve";
    else if (o.sorte === "fete" && !pourMoi && e === 0) cas = "anniv";
    else if (o.sorte === "fete" && !pourMoi && e === 3) cas = "anniv3";
    else if (o.sorte === "evenement" && !pourMoi && e === 0) cas = "evenement";
    else if (o.sorte === "evenement" && !pourMoi && e === -1) cas = "lendemain";
    if (cas) r.push({ cas, objet: o, rang: RANG_RAPPEL[cas] });
  }
  return r.sort((a, b) => a.rang - b.rang);
}
/** Deux au plus par matin (dans l'ordre : une épreuve, un anniversaire, un anniversaire dans 3 jours, un événement, le lendemain) ; et un encouragement. */
export function garderRappels<T extends { cas: CasRappel; rang: number }>(l: readonly T[]): T[] {
  const tries = [...l].sort((a, b) => a.rang - b.rang);
  return [...tries.filter((x) => x.cas === "encourage").slice(0, 1), ...tries.filter((x) => x.cas !== "encourage").slice(0, ETAGERE_E2.rappels)];
}

/** 💪 Ce que dit SA figurine à celui que ça concerne, le jour J (validé par le propriétaire le 13 novembre 2026). */
export const ENCOURAGEMENTS: readonly string[] = ["C’est le grand jour {e} Je croise tout ce que j’ai 🤞", "Aujourd’hui, c’est ton jour {e} Tu vas assurer 💪", "Respire un grand coup {e} Je suis avec toi"];
/** La phrase du rappel (l'appli la compose, pas le modèle) : `titre` est déjà tourné pour lui ; `idees` : deux goûts. */
export function phraseRappel(cas: CasRappel, titre: string, emoji: string, idees: string[] = [], graine = ""): string {
  const t = minuscule(titre);
  if (cas === "encourage") return ENCOURAGEMENTS[hache(graine || titre) % ENCOURAGEMENTS.length].replace("{e}", emoji);
  if (cas === "epreuve") return `Aujourd’hui, c’est ${t} ${emoji} Un petit mot avant le départ ?`;
  if (cas === "anniv") return /anniv/i.test(titre) ? `C’est ${t} ${emoji} Tu lui souhaites ?` : `Aujourd’hui, c’est ${t} ${emoji} Un petit mot ?`;
  if (cas === "anniv3") return `Dans 3 jours, ${t} ${emoji}${idees.length ? ` Des idées : ${idees.join(", ")}` : ""}`;
  if (cas === "evenement") return `Aujourd’hui, ${t} ${emoji}`;
  if (cas === "mien") return `Aujourd’hui : ${t} ${emoji} Tu l’avais posé sur ton étagère 📌`;
  return `Hier, c’était ${t} ${emoji} Tu lui demandes comment c’était ?`;
}
/** 🔔 La notification du matin, quand il y a un rappel : le rappel fait le titre (7.2). */
export function notifRappel(cas: CasRappel, titre: string, emoji: string, idees = false): { titre: string; corps: string } {
  const t = minuscule(titre);
  if (cas === "anniv3") return { titre: `📌 Dans 3 jours : ${t} ${emoji}`, corps: idees ? "Ta figurine a des idées. Viens voir 👀" : "Ta figurine t’en parle ce matin." };
  if (cas === "lendemain") return { titre: `📌 Hier : ${t} ${emoji}`, corps: "Tu lui demandes comment c’était ? Ta figurine t’attend." };
  if (cas === "mien") return { titre: `📌 Aujourd’hui : ${t} ${emoji}`, corps: "Tu l’avais posé sur ton étagère. Ta figurine t’en parle ce matin." };
  const corps = cas === "epreuve" ? "Un petit mot avant le départ ? Ta figurine t’attend." : cas === "anniv" ? "Tu lui souhaites ? Ta figurine t’attend." : "Un petit mot ? Ta figurine t’attend.";
  return { titre: `📌 Aujourd’hui : ${t} ${emoji}`, corps };
}
/** 🎭 Les mots du mème proposé avec un rappel (le studio s'ouvre avec eux). */
export function memeDuRappel(cas: CasRappel, emoji: string): string {
  if (cas === "epreuve") return `Tu vas gérer ${emoji}`;
  if (cas === "anniv") return "Joyeux anniversaire ! 🎂";
  if (cas === "anniv3") return `Ça approche ${emoji}`;
  if (cas === "evenement") return `Profite à fond ${emoji}`;
  if (cas === "lendemain") return `Alors, c’était comment ? ${emoji}`;
  return `C’est le grand jour ${emoji}`;
}

// ─── la ligne de « Chez moi » (8.1) ────────────────────────────────────────────────────────────────
/** « son permis », « sa finale », « ses pivoines », « ton permis », « le resto italien ». */
export function sonTitre(o: Pick<ObjetGarde, "titre" | "titreToi" | "concerne">, moi8: string): string {
  if (o.concerne === moi8) return minuscule(o.titreToi || o.titre);
  if (o.concerne === "deux") return minuscule(o.titre);
  const m = /^(les|le|la)\s+(.+)$/i.exec(o.titre) ?? /^(l’|l')(.+)$/i.exec(o.titre);
  if (!m) return minuscule(o.titre);
  const art = m[1].toLowerCase();
  return `${art === "les" ? "ses" : art === "la" ? "sa" : "son"} ${m[2]}`;
}
/** Ce que la ligne d'une personne dit de leur étagère (la première qui s'applique), et son rang parmi les autres événements. */
export type LigneEtagere = { txt: string; rang: number };
/** ☀️ Un rappel du matin, tel que « Chez moi » le montre (jamais l'identifiant d'un habitant : sa clé). */
export type RappelVu = { id: string; cle: string; prenom: string; image: string; cas: CasRappel; texte: string; emoji: string; meme: string; fait: boolean };
export const RANGS_LIGNE = { question: 2.95, rappel: 2.9, note: 2.8, relance: 2.7 } as const;
export function ligneEtagere(x: { question?: ObjetGarde | null; rappel?: Rappel | null; nouveau?: ObjetGarde | null; relance?: { objet: ObjetGarde; n: number } | null }, moi8: string): LigneEtagere | null {
  // 📌 (lot E5) une question qui l'attend : juste après un message non lu
  if (x.question) return { txt: `📌 Ta figurine te demande : ${sonTitre(x.question, moi8)} ?`, rang: RANGS_LIGNE.question };
  if (x.rappel && x.rappel.cas !== "encourage") {
    const o = x.rappel.objet;
    const quand = x.rappel.cas === "anniv3" ? "Dans 3 jours" : x.rappel.cas === "lendemain" ? "Hier" : "Aujourd’hui";
    return { txt: `📌 ${quand} : ${sonTitre(o, moi8)} ${o.emoji}`, rang: RANGS_LIGNE.rappel };
  }
  if (x.nouveau) {
    const o = x.nouveau;
    const jour = o.genre === "date" && o.quand && !o.annuel ? `, ${jourCourt(o.quand).split(" ").slice(0, 2).join(" ")}` : o.annuel && o.quand ? `, ${leJourDuMois(o.quand)}` : "";
    return { txt: `📌 Noté : ${sonTitre(o, moi8)}${jour}`, rang: RANGS_LIGNE.note };
  }
  if (x.relance) {
    const { objet: o, n } = x.relance;
    return { txt: n ? `${o.emoji} ${o.titre} : promis il y a ${n >= 60 ? "2 mois" : `${Math.floor(n / 7)} semaines`}` : `${o.emoji} ${o.titre} : alors, c’est fait ?`, rang: RANGS_LIGNE.relance };
  }
  return null;
}

// ─── ce que disent les figurines, plus tard (validé par le propriétaire le 13 novembre 2026) ────────
/** 🏆 Une fierté : la figurine de celui qui n'est pas concerné. */
export const phraseFierte = (prenom: string | null) => (prenom ? `${prenom}, c’est réussi ! 🏆 Je range ça tout en haut` : "C’est réussi ! 🏆 Je range ça tout en haut");
/** ✅ Une promesse tenue. */
export const phraseTenue = (n: number) => `${n} promesse${n > 1 ? "s" : ""} tenue${n > 1 ? "s" : ""} ! On est des gens fiables 😎`;
/** 🍝 Une relance : les deux figurines s'en mêlent, une fois (la première prend l'emoji du souvenir). */
export const RELANCE_PREMIERE: readonly string[] = ["{n}… ça attend toujours {e}", "{n}, et toujours rien {e}", "On en parle, de ça ? {e} Ça fait {n}"];
export const RELANCE_SECONDE: readonly string[] = ["Je dis ça, je dis rien 🙄", "Moi, je dis : ce soir 👀", "Il n’est jamais trop tard 😏"];
export function phrasesRelance(n: number, emoji: string, graine: string): [string, string] {
  const duree = n >= 60 ? "Deux mois" : n ? `${Math.floor(n / 7)} semaines` : "";
  const k = hache(graine);
  const modele = RELANCE_PREMIERE[k % RELANCE_PREMIERE.length];
  const premiere = n ? modele.replace("{n}", modele.startsWith("{n}") ? duree : duree.toLowerCase()).replace("{e}", emoji) : `Alors, c’est fait ? ${emoji}`;
  return [premiere, RELANCE_SECONDE[k % RELANCE_SECONDE.length]];
}
/** « Ça fait 3 semaines 👀 », « Ça fait 2 mois 👀 », « C'était prévu hier. Alors, c'est fait ? » */
export const dureeRelance = (n: number) => (n >= 60 ? "Ça fait 2 mois 👀" : n ? `Ça fait ${Math.floor(n / 7)} semaines 👀` : "C’était prévu hier. Alors, c’est fait ?");
/** « le jeudi 23 octobre » */
export const leJourLong = (le: string) => {
  const iso = jourDe(le);
  if (!iso) return "";
  const d = enDate(iso);
  return `le ${JOURS[d.getUTCDay()]} ${numero(d.getUTCDate())} ${MOIS[d.getUTCMonth()]}`;
};

// ─── lot E3 : la poussière et les idées ────────────────────────────────────────────────────────────
/**
 * 🕸️ LE BAROMÈTRE DE LA RELATION (9) — pas d'un message, personne n'est noté : `eclairee` (un message de l'un ou de
 * l'autre depuis moins de 4 jours), `calme` (4 à 9 jours), `poussiere` (10 jours ou plus). Seulement pour une étagère
 * qui a au moins un souvenir, et une paire qui s'est déjà dit au moins six messages (un proche tout neuf ne prend pas
 * la poussière).
 */
export type EtatEtagere = "eclairee" | "calme" | "poussiere";
export const POUSSIERE = { eclairee: 4, poussiere: 10, messagesMin: 6 } as const;
export const joursSansUnMot = (dernier: number, maintenant: number) => Math.max(0, Math.floor((maintenant - dernier) / 86_400_000));
export function etatEtagere(x: { dernier: number; messages: number; objets: number; maintenant: number }): EtatEtagere | null {
  if (!x.objets || x.messages < POUSSIERE.messagesMin || !x.dernier) return null;
  const j = (x.maintenant - x.dernier) / 86_400_000;
  return j < POUSSIERE.eclairee ? "eclairee" : j < POUSSIERE.poussiere ? "calme" : "poussiere";
}
/** « 5 jours sur 7 » : les jours, sur les sept derniers (aujourd'hui compris), où l'un des deux a envoyé un message. */
export function joursSurSept(ts: readonly number[], aujourdhui: string): number {
  const debut = ajouterJours(aujourdhui, -6);
  return new Set(ts.map((x) => jourDe(x)).filter((j) => j && j >= debut && j <= aujourdhui)).size;
}
export function phraseEtat(etat: EtatEtagere | null | undefined, x: { jours: number; surSept: number }): string {
  if (etat === "eclairee") return `✨ Bien éclairée · vous vous êtes parlé ${x.surSept} jour${x.surSept > 1 ? "s" : ""} sur 7`;
  if (etat === "poussiere") return `🕸️ Elle prend la poussière · ${x.jours} jours sans un mot`;
  return "";
}
/**
 * 🕸️ « RIEN QUE POUR TOI, DE TA FIGURINE » : l'accroche vient de l'étagère — le dernier événement passé, sinon un goût,
 * sinon la blague, sinon rien. Chacun a la sienne ; personne ne voit celle de l'autre.
 */
export function carteDePoussiere(objets: readonly ObjetGarde[], moi8: string, prenomAutre: string, jours: number, aujourdhui: string): { texte: string; bouton: string } {
  const base = `${jours} jours sans un mot… Votre étagère prend la poussière.`;
  const ev = objets.filter((o) => o.genre === "date" && o.sorte === "evenement" && o.etat !== "retire" && o.etat !== "propose" && o.titre && o.quand && o.quand < aujourdhui).sort((a, b) => (a.quand ?? "").localeCompare(b.quand ?? "")).pop();
  if (ev?.quand) {
    const qui = ev.concerne === "deux" ? "Vous aviez" : ev.concerne === moi8 ? "Tu avais" : `${prenomAutre} avait`;
    return { texte: `${base} ${qui} ${sonTitre(ev, moi8).replace(/^son /, ev.concerne === "deux" ? "votre " : ev.concerne === moi8 ? "ton " : "son ")} ${leJourDuMois(ev.quand)} ${ev.emoji}`.replace(/  +/g, " "), bouton: "🎙️ Lui demander comment c’était" };
  }
  const g = objets.filter((o) => o.genre === "gout" && o.etat === "actif" && o.concerne !== moi8).pop();
  if (g) return { texte: `${base} ${g.nuance === "envie" ? `Sur votre étagère, il y a ${minuscule(g.titre)}` : `${g.concerne === "deux" ? "Vous adorez" : `${prenomAutre} adore`} ${minuscule(g.titre)}`} ${g.emoji}`, bouton: "🎙️ Lui faire signe" };
  const b = objets.filter((o) => o.genre === "blague" && o.etat === "actif").pop();
  if (b) return { texte: `${base} Et votre blague : ${minuscule(b.titre)} ${b.emoji}`, bouton: "🎙️ Lui faire signe" };
  return { texte: base, bouton: "🎙️ Lui faire signe" };
}
/**
 * ✨ SE RALLUMER : le premier message après dix jours ou plus sans un mot (de l'un ou de l'autre) — « L'ÉTAGÈRE SE
 * RALLUME ». Les reprises de la dernière semaine, qui n'ont pas encore leur carte.
 */
export function rallumages(ts: readonly number[], deja: ReadonlySet<string>, maintenant: number): { id: string; le: string }[] {
  const tri = [...ts].sort((a, b) => a - b);
  const r: { id: string; le: string }[] = [];
  for (let k = POUSSIERE.messagesMin; k < tri.length; k++) {
    if (tri[k] - tri[k - 1] < POUSSIERE.poussiere * 86_400_000 || maintenant - tri[k] > 7 * 86_400_000) continue;
    const id = `a-${tri[k].toString(36)}`;
    if (!deja.has(id)) r.push({ id, le: new Date(tri[k]).toISOString() });
  }
  return r;
}
/** ✨ Ce que disent les figurines en se réveillant (validé par le propriétaire le 13 novembre 2026). */
export const PHRASES_RALLUME: readonly string[] = ["C’est reparti ✨", "Ah, enfin ! ✨ On s’ennuyait", "Les revoilà ✨"];
/** 🕸️ Sur sa ligne, dans « Chez moi » (le cas 5) : l'avatar passe en gris. */
export const LIGNE_POUSSIERE = { txt: "🕸️ Votre étagère prend la poussière", rang: 0.5 } as const;

/** 🎁 (7.4) Ce qu'il ou elle aime, pour la feuille « Offrir » : deux goûts au plus, les plus récents. */
export const idees = (objets: readonly Pick<ObjetVu, "genre" | "etat" | "pourMoi" | "emoji" | "titre" | "le">[]) =>
  objets
    .filter((o) => o.genre === "gout" && o.etat === "actif" && !o.pourMoi)
    .sort((a, b) => b.le.localeCompare(a.le))
    .slice(0, 2);
/** 🎭 (7.5) Les mots du mème de leur blague. */
export const memeDeLaBlague = (o: Pick<ObjetGarde, "titre" | "emoji">) => `${o.titre} ${o.emoji}`;

// ─── lot E3 : ce qu'on mesure (13) ─────────────────────────────────────────────────────────────────
/** Les compteurs du jour (`stats/etagere/<jour>.json`). */
export type StatsJourEtagere = {
  notes: number;
  paires: number;
  retires: number;
  dates: number;
  rappels: number;
  suivis: number;
  tenues: number;
  rallumees: number;
  deposes: number;
  /** 📌 (lot E5) les questions posées ; rangées par un « oui » ; refusées ; sans réponse ; rangées par le réglage ; dates corrigées avant de ranger. */
  proposes: number;
  oui: number;
  refuses: number;
  expires: number;
  auto: number;
  corriges: number;
};
export const STATS_VIDES: StatsJourEtagere = { notes: 0, paires: 0, retires: 0, dates: 0, rappels: 0, suivis: 0, tenues: 0, rallumees: 0, deposes: 0, proposes: 0, oui: 0, refuses: 0, expires: 0, auto: 0, corriges: 0 };
/**
 * Les seuils d'alerte : plus de 2 souvenirs par paire et par jour ; plus de 15 % retirés ; plus de 10 % de dates
 * changées ; moins de 30 % de rappels suivis ; (lot E5, sur cinq questions closes au moins) plus de 30 % refusées, plus
 * de 50 % sans réponse, plus de 10 % de dates corrigées avant de ranger.
 */
export function alertesEtagere(s: StatsJourEtagere): string[] {
  const a: string[] = [];
  if (s.paires && s.notes / s.paires > 2) a.push("Plus de 2 souvenirs par paire et par jour : la consigne note trop.");
  if (s.notes && s.retires / s.notes > 0.15) a.push("Plus de 15 % des souvenirs retirés : la consigne note trop, ou mal.");
  if (s.notes && s.dates / s.notes > 0.1) a.push("Plus de 10 % de dates changées à la main : le modèle comprend mal les jours.");
  if (s.rappels >= 5 && s.suivis / s.rappels < 0.3) a.push("Moins de 30 % des rappels suivis d'un message : le rappel ne sert pas assez.");
  const closes = (s.oui || 0) + (s.refuses || 0) + (s.expires || 0);
  if (closes >= 5 && s.refuses / closes > 0.3) a.push("Plus de 30 % des « Je le range ? » refusés : la consigne note mal.");
  if (closes >= 5 && s.expires / closes > 0.5) a.push("Plus de 50 % des « Je le range ? » sans réponse : la question passe inaperçue.");
  if (s.oui >= 5 && s.corriges / s.oui > 0.1) a.push("Plus de 10 % des dates corrigées avant de ranger : le modèle comprend mal les jours.");
  return a;
}

// ─── lot E4 : « Mon étagère », et déposer à la main (le 14 novembre 2026) ─────────────────────────
/**
 * 🏡 MON ÉTAGÈRE, CHEZ MOI (le propriétaire : « que les choses que je dis dans mes conversations s'ajoutent aussi dans
 * mon univers […] et que je puisse manuellement en déposer si j'en ai envie ») : ce que nos figurines notent qui me
 * concerne (moi, ou nous deux), dans toutes mes conversations — chaque souvenir garde d'où il vient (« noté avec
 * Léa ») ; et ce que je dépose moi-même (« ＋ Déposer »), ici ou sur l'étagère que je partage avec un proche. Rien que
 * pour moi : je choisis, souvenir par souvenir, ce que les visiteurs de mon univers voient (seulement ce qui ne
 * concerne que moi ; jamais la phrase dite, ni avec qui).
 */
export const RAYONS_MIENS: { cle: RayonCle; nom: string }[] = [
  { cle: "fiertes", nom: "Mes fiertés" },
  { cle: "avenir", nom: "À venir" },
  { cle: "aime", nom: "Ce que j’aime" },
];
export const REGLES_MON_ETAGERE =
  "Ce que vos figurines notent sur toi, dans toutes tes conversations, se range aussi ici. Tu peux y déposer ce que tu veux. Rien que pour toi : tu choisis ce que tes visiteurs voient.";
export const DEPOT = {
  /** Ce qu'on peut déposer en un jour (toutes étagères confondues). */
  parJour: 12,
  /** Les souvenirs déposés sur mon étagère, au plus. */
  perso: 80,
  /** Mon étagère : les souvenirs montrés, au plus. */
  montres: 40,
} as const;

/** Ce qu'on dépose : son genre (un goût ou une envie : le genre « goût », sa nuance). */
export type GenreDepot = "date" | "promesse" | "gout" | "envie" | "blague";
export const GENRES_DEPOT: { cle: GenreDepot; nom: string; emoji: string; indice: string }[] = [
  { cle: "date", nom: "Une date", emoji: "📅", indice: "Le concert" },
  { cle: "promesse", nom: "Une promesse", emoji: "🤝", indice: "Le resto promis" },
  { cle: "gout", nom: "Un goût", emoji: "💛", indice: "Les pivoines" },
  { cle: "envie", nom: "Une envie", emoji: "✨", indice: "Le saut en parachute" },
  { cle: "blague", nom: "Une blague", emoji: "😂", indice: "Le canard" },
];
/** Une date : un événement (le rappel le jour même), une épreuve (l'encouragement, puis « 🏆 C'est réussi »), tous les ans. */
export const SORTES_DEPOT: { cle: SorteDate; nom: string }[] = [
  { cle: "evenement", nom: "🎉 Un événement" },
  { cle: "epreuve", nom: "🍀 Une épreuve" },
  { cle: "fete", nom: "🎂 Tous les ans" },
];

const POSSESSIFS_DEPOT: Record<string, "le" | "la" | "les"> = { mon: "le", ton: "le", son: "le", ma: "la", ta: "la", sa: "la", mes: "les", tes: "les", ses: "les" };
/**
 * ✍️ LE TITRE D'UN SOUVENIR DÉPOSÉ : on l'écrit comme on parle (« Mon permis », « Ton anniversaire ») ; il se range comme
 * ceux des figurines, sans possessif (« Le permis », « L’anniversaire ») — « Ton permis » pour celui que ça concerne,
 * « Le permis de Léa » pour l'autre. « Notre », « nos » restent (« nous deux » : le même titre des deux côtés).
 */
export function titreDepose(t: unknown, deux: boolean): { titre: string; titreToi?: string } {
  const x = majuscule(nettoyer(t));
  const m = /^(mon|ton|son|ma|ta|sa|mes|tes|ses)\s+(.+)$/i.exec(x);
  if (!m) return { titre: x };
  const art = POSSESSIFS_DEPOT[m[1].toLowerCase()];
  const reste = m[2];
  const voyelle = /^[aeiouyàâäéèêëîïôöùûü]/i.test(reste);
  const titre = art === "les" ? `Les ${reste}` : voyelle ? `L’${reste}` : `${art === "la" ? "La" : "Le"} ${reste}`;
  if (deux) return { titre };
  return { titre, titreToi: art === "les" ? `Tes ${reste}` : art === "la" && !voyelle ? `Ta ${reste}` : `Ton ${reste}` };
}

/** 🎂 La prochaine fois qu'un jour revient (un anniversaire tapé avec l'année de naissance). */
export function prochaineFois(iso: string, aujourdhui: string): string | null {
  const j = jourValide(iso);
  if (!j) return null;
  const md = j.slice(5);
  for (let an = Number(aujourdhui.slice(0, 4)); an <= Number(aujourdhui.slice(0, 4)) + 1; an++) {
    const q = jourValide(`${an}-${md}`) ?? `${an}-02-28`;
    if (ecartJours(aujourdhui, q) >= 0) return q;
  }
  return null;
}

/** Un souvenir déposé, prêt à ranger (l'identifiant, l'heure et le « message » sont posés par le serveur). */
export type Depot = Omit<ObjetGarde, "id" | "le" | "etat" | "change" | "message">;
/**
 * ✅ CE QU'ON DÉPOSE, VÉRIFIÉ : un genre ; un nom (2 à 28 signes ; aucun mot interdit, rien d'alcoolisé, pas de numéro
 * ni d'adresse ; rien de sensible : l'étagère garde les bons moments) ; un emoji du catalogue (sinon celui du genre) ;
 * une date pour une date (dans l'année qui vient ; « tous les ans » : sa prochaine fois), un jour possible pour une
 * promesse ; pour qui (sur mon étagère : moi ; sur la nôtre : moi, lui, ou nous deux).
 */
export function depotValide(x: unknown, c: { aujourdhui: string; passe: (t: string) => boolean; moi8: string; lui8?: string }): { objet: Depot } | { erreur: string } {
  if (!x || typeof x !== "object") return { erreur: "Demande incomplète." };
  const b = x as Record<string, unknown>;
  const g = GENRES_DEPOT.find((d) => d.cle === b.genre)?.cle;
  if (!g) return { erreur: "Dis ce que c’est : une date, une promesse, un goût…" };
  const genre: GenreObjet = g === "envie" ? "gout" : g;
  const pour = c.lui8 ? (b.pour === "moi" ? c.moi8 : b.pour === "lui" ? c.lui8 : "deux") : c.moi8;
  const t = titreDepose(b.titre, pour === "deux");
  if (t.titre.length < 2) return { erreur: "Donne-lui un nom." };
  if (t.titre.length > ETAGERE.titreMax) return { erreur: `Un nom court : ${ETAGERE.titreMax} signes au plus.` };
  const textes = [t.titre, t.titreToi ?? ""].filter(Boolean);
  if (!textes.every((y) => c.passe(y)) || textes.some(prive)) return { erreur: "Ce nom ne passe pas : choisis-en un autre." };
  if (echangeSensible(textes)) return { erreur: "L’étagère garde les bons moments : rien sur la santé, l’argent ou les amours." };
  const o: Depot = { genre, emoji: emojiDuCatalogue(b.emoji, genre), titre: t.titre, concerne: pour, citation: "", de8: c.moi8, depose: true };
  if (t.titreToi && pour !== "deux" && t.titreToi.length <= ETAGERE.titreMax) o.titreToi = t.titreToi;
  if (genre === "gout") o.nuance = g === "envie" ? "envie" : "aime";
  if (genre === "date") {
    o.sorte = (SORTES as readonly string[]).includes(String(b.sorte)) ? (b.sorte as SorteDate) : "evenement";
    if (o.sorte === "fete") o.annuel = true;
  }
  if (genre === "date" || (genre === "promesse" && b.quand)) {
    const q = o.annuel ? prochaineFois(String(b.quand ?? ""), c.aujourdhui) : jourValide(b.quand);
    const e = q ? ecartJours(c.aujourdhui, q) : -1;
    if (!q || e < 0 || e > ETAGERE.joursMax) return { erreur: "Choisis un jour à venir (dans l’année qui vient)." };
    o.quand = q;
  }
  return { objet: o };
}

/** Il me concerne : moi, ou nous deux (ce qui se range aussi sur mon étagère). */
export const meConcerne = (o: Pick<ObjetGarde, "etat" | "concerne">, moi8: string) => visible(o) && (o.concerne === moi8 || o.concerne === "deux");

/** ☀️ Les rappels du matin de ce que j'ai posé sur mon étagère : le jour venu (une épreuve : l'encouragement). */
export function rappelsMiens(objets: readonly ObjetGarde[], aujourdhui: string): Rappel[] {
  return objets
    .filter((o) => o.etat === "actif" && o.quand === aujourdhui && (o.genre === "date" || o.genre === "promesse"))
    .map((o): Rappel => (o.genre === "date" && o.sorte === "epreuve" ? { cas: "encourage", objet: o, rang: RANG_RAPPEL.encourage } : { cas: "mien", objet: o, rang: RANG_RAPPEL.mien }));
}

/** 👀 Ce qu'un visiteur voit d'un souvenir montré : l'emoji, le titre (sans « ton »), le détail ; jamais la phrase, ni avec qui. */
export type VitrineObjet = { id: string; emoji: string; titre: string; detail: string; rayon: RayonCle };
export const vitrineDe = (o: ObjetGarde, prenomHote: string, aujourdhui: string): VitrineObjet => ({
  id: o.id,
  emoji: o.emoji,
  titre: o.titre,
  detail: detailPour(o, "", prenomHote, aujourdhui),
  rayon: rayonDe(o),
});

/** 🏡 La page « Mon étagère ». */
export type MonEtagereVue = {
  image: string;
  objets: ObjetVu[];
  /** Combien sont montrés aux visiteurs. */
  montres: number;
  /** J'ai un univers (sinon, rien à montrer : personne ne me rend visite) ; ma clé, pour le voir comme mes visiteurs. */
  univers: boolean;
  cle?: string;
  /** 📌 (lot E5) « ✨ À ranger » : mes questions en attente, de toutes mes conversations (l'objet dit d'où il vient). */
  aRanger?: QuestionVue[];
};
