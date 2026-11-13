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
 * l'un des deux (une pierre tombale : ce message ne sera plus jamais noté).
 */
export type EtatObjet = "actif" | "tenue" | "fierte" | "passe" | "sommeil" | "retire";
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
};

/**
 * 🃏 CE QUI S'INSÈRE DANS LE FIL (lot E2), à son heure, pour les deux : une fierté (« 🏆 RANGÉ EN HAUT DE VOTRE
 * ÉTAGÈRE »), une promesse tenue (« ✅ PROMESSE TENUE », `n` : les promesses tenues entre eux à ce moment), une relance
 * (« VOS FIGURINES SE SOUVIENNENT », `n` : 21 ou 60 jours ; 0 : le lendemain du jour prévu).
 */
export type GenreCarte = "fierte" | "tenue" | "relance";
export type CarteGardee = { id: string; genre: GenreCarte; objet: string; le: string; n?: number };
export type CarteVue = { id: string; genre: GenreCarte; le: string; n?: number; objet: ObjetVu; nouvelle: boolean };

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
};

/** 📚 La page « Votre étagère ». */
export type EtagereVue = {
  prenom: string;
  image: string;
  objets: ObjetVu[];
  tenues: number;
  pause: { moi: boolean } | null;
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
  return "votre blague";
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
 */
export function ranger(objets: readonly ObjetGarde[], proposes: readonly ObjetPropose[], o: { aujourdhui: string; le: string; nouvelId: () => string }): { objets: ObjetGarde[]; neufs: string[] } {
  const liste = objets.map((x) => ({ ...x }));
  const neufs: string[] = [];
  let duJour = liste.filter((x) => x.etat !== "retire" && jourDe(x.le) === o.aujourdhui).length;
  for (const p of proposes.slice(0, ETAGERE.parPassage)) {
    if (liste.some((x) => x.message === p.message && x.etat === "retire")) continue;
    const meme = liste.find((x) => x.etat !== "retire" && x.etat !== "passe" && ((x.genre === p.genre && aPlat(x.titre) === aPlat(p.titre)) || x.message === p.message));
    if (meme) {
      // (la même chose, redite : la date se met à jour)
      if (p.quand && meme.etat === "actif") {
        meme.quand = p.quand;
        if (p.ditQuand) meme.ditQuand = p.ditQuand;
      }
      continue;
    }
    if (duJour >= ETAGERE.parJour) continue;
    const id = o.nouvelId();
    liste.push({ ...p, id, le: o.le, etat: "actif" });
    neufs.push(id);
    duJour++;
  }
  // (quarante au plus : le plus ancien goût s'en va)
  while (liste.filter(visible).length > ETAGERE.max) {
    const vieux = liste.filter((x) => x.genre === "gout" && x.etat === "actif").sort((a, b) => a.le.localeCompare(b.le))[0];
    if (!vieux) break;
    Object.assign(vieux, { etat: "passe" as const });
  }
  // (les entrées gardées : les pierres tombales et les objets partis d'abord)
  let rangees = liste;
  while (rangees.length > ETAGERE.gardes) {
    const k = rangees.findIndex((x) => !visible(x));
    rangees = k >= 0 ? rangees.filter((_, i) => i !== k) : rangees.slice(1);
  }
  return { objets: rangees, neufs };
}

/** 🪦 Une pierre tombale : plus aucun texte, seulement de quoi ne jamais renoter ce message. */
export const pierreTombale = (x: ObjetGarde, par8: string, le: string): ObjetGarde => ({
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
});

// ─── ce que dit la figurine qui voit noter ────────────────────────────────────────────────────────
/** 🗨️ La phrase de l'autre figurine quand un objet se pose (une au hasard, jamais deux fois de suite) — à valider par le propriétaire. */
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
  "Vos figurines notent une ou deux choses par conversation, au plus. Rien de sensible (santé, argent, amours). Tout se voit des deux côtés, et chacun peut retirer un souvenir. Les visiteurs de ton univers ne voient pas votre étagère.";

// ─── lot E2 : plus tard ────────────────────────────────────────────────────────────────────────────
/** Le titre, sa première lettre en minuscule (« le permis de Léa »). */
export const minuscule = (t: string) => (t ? t[0].toLocaleLowerCase("fr-FR") + t.slice(1) : t);

/**
 * ⏳ LE TEMPS PASSE SUR L'ÉTAGÈRE (sans bruit) : une épreuve sans nouvelles trois jours après s'en va ; un événement
 * s'en va le surlendemain ; un anniversaire passé revient l'année suivante ; une promesse relancée deux fois s'endort
 * (elle reste, on ne la relance plus).
 */
export function vieillir(objets: readonly ObjetGarde[], aujourdhui: string): { objets: ObjetGarde[]; change: boolean } {
  let change = false;
  const l = objets.map((o) => {
    if (o.etat !== "actif") return o;
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
  return { objets: l, change };
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
/** epreuve, anniv, anniv3, evenement, lendemain : pour l'autre ; encourage : pour celui que ça concerne. */
export type CasRappel = "epreuve" | "anniv" | "anniv3" | "evenement" | "lendemain" | "encourage";
const RANG_RAPPEL: Record<CasRappel, number> = { epreuve: 1, encourage: 1, anniv: 2, anniv3: 3, evenement: 4, lendemain: 5 };
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

/** 💪 Ce que dit SA figurine à celui que ça concerne, le jour J (à valider par le propriétaire). */
export const ENCOURAGEMENTS: readonly string[] = ["C’est le grand jour {e} Je croise tout ce que j’ai 🤞", "Aujourd’hui, c’est ton jour {e} Tu vas assurer 💪", "Respire un grand coup {e} Je suis avec toi"];
/** La phrase du rappel (l'appli la compose, pas le modèle) : `titre` est déjà tourné pour lui ; `idees` : deux goûts. */
export function phraseRappel(cas: CasRappel, titre: string, emoji: string, idees: string[] = [], graine = ""): string {
  const t = minuscule(titre);
  if (cas === "encourage") return ENCOURAGEMENTS[hache(graine || titre) % ENCOURAGEMENTS.length].replace("{e}", emoji);
  if (cas === "epreuve") return `Aujourd’hui, c’est ${t} ${emoji} Un petit mot avant le départ ?`;
  if (cas === "anniv") return /anniv/i.test(titre) ? `C’est ${t} ${emoji} Tu lui souhaites ?` : `Aujourd’hui, c’est ${t} ${emoji} Un petit mot ?`;
  if (cas === "anniv3") return `Dans 3 jours, ${t} ${emoji}${idees.length ? ` Des idées : ${idees.join(", ")}` : ""}`;
  if (cas === "evenement") return `Aujourd’hui, ${t} ${emoji}`;
  return `Hier, c’était ${t} ${emoji} Tu lui demandes comment c’était ?`;
}
/** 🔔 La notification du matin, quand il y a un rappel : le rappel fait le titre (7.2). */
export function notifRappel(cas: CasRappel, titre: string, emoji: string, idees = false): { titre: string; corps: string } {
  const t = minuscule(titre);
  if (cas === "anniv3") return { titre: `📌 Dans 3 jours : ${t} ${emoji}`, corps: idees ? "Ta figurine a des idées. Viens voir 👀" : "Ta figurine t’en parle ce matin." };
  if (cas === "lendemain") return { titre: `📌 Hier : ${t} ${emoji}`, corps: "Tu lui demandes comment c’était ? Ta figurine t’attend." };
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
export const RANGS_LIGNE = { rappel: 2.9, note: 2.8, relance: 2.7 } as const;
export function ligneEtagere(x: { rappel?: Rappel | null; nouveau?: ObjetGarde | null; relance?: { objet: ObjetGarde; n: number } | null }, moi8: string): LigneEtagere | null {
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

// ─── ce que disent les figurines, plus tard (à valider par le propriétaire) ────────────────────────
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
