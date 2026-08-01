// Actions Flash — le commerçant ne part jamais d'une page blanche.
//
// RÈGLE NON NÉGOCIABLE DE CE FICHIER : une Action Flash est une QUESTION, jamais
// une phrase pré-écrite. Proposer « Une place s'est libérée à 15 h » en un geste,
// c'est faire annoncer à un commerçant un fait que personne n'a vérifié — à ses
// vrais clients, en son nom. Toute information qui engage le commerce (heure,
// remise, quantité, prestation) est SAISIE par lui. Jamais suggérée, jamais
// pré-remplie avec une valeur plausible.
//
// Le partage du travail :
//   - ce fichier décide QUOI demander → déterministe, lisible, testable ;
//   - l'assistante (api/site-internet/pro/announce) décide COMMENT l'écrire.
// On ne laisse pas un modèle choisir les faits, et on ne laisse pas un gabarit
// figé choisir le ton.
//
// Corollaire volontaire : aucune valeur par défaut sur les champs chiffrés.
// Suggérer « -20 % », c'est décider de la marge du commerçant à sa place.
import type { Confirmation, Secteur } from "./metier-profiles";

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export type ChampType = "heure" | "nombre" | "pourcent" | "texte" | "jour";

export type Champ = {
  cle: string;
  /** La question posée, à la deuxième personne. */
  label: string;
  type: ChampType;
  /** Exemple montré en filigrane — jamais une valeur pré-remplie. */
  exemple?: string;
  requis: boolean;
};

export type Intention = {
  cle: string;
  emoji: string;
  /** Toujours interrogatif : le commerçant confirme, il ne se voit pas imposer un fait. */
  titre: string;
  sous: string;
  champs: Champ[];
  /** Le brief factuel envoyé à l'assistante — uniquement ce que le pro a saisi. */
  brief: (v: Record<string, string>) => string;
  /** Moment où l'annonce doit disparaître d'elle-même (null = pas d'échéance connue). */
  fin: (v: Record<string, string>, now: Date) => Date | null;
  /**
   * Des réponses toutes faites, pour la DÉMONSTRATION uniquement.
   *
   * Dans l'espace pro on POSE les questions — le commerçant est seul à connaître
   * ses horaires. Dans la démo, un prospect qui découvre le produit ne doit rien
   * saisir : il clique une fois et voit le résultat. Même moteur, même annonce
   * finale ; seule la provenance des réponses change.
   */
  demo: (now: Date) => Record<string, string>;
};

/* ─────────────────────────── Dates et horaires ─────────────────────────── */

/** `YYYY-MM-DD` en heure LOCALE (toISOString décalerait d'un jour le soir). */
export function jourISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Les 7 prochains jours, pour un menu déroulant : aujourd'hui, demain, puis nommés. */
export function joursProches(now: Date, n = 7): Array<{ valeur: string; label: string }> {
  const out: Array<{ valeur: string; label: string }> = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    out.push({ valeur: jourISO(d), label: libelleJour(jourISO(d), now) });
  }
  return out;
}

/** « aujourd'hui » / « demain » / « samedi 9 » — ce qu'un humain dirait. */
export function libelleJour(iso: string, now: Date): string {
  if (!iso) return "";
  const d = decoupeJour(iso);
  if (!d) return "";
  const zero = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((zero(d) - zero(now)) / 86400000);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric" }).format(d);
}

function decoupeJour(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * « 11:11 » → « 11 h 11 », « 18:00 » → « 18 h ».
 *
 * Le champ `<input type="time">` rend toujours `HH:MM`. Passé tel quel dans le
 * brief, le commerçant recevait une annonce qui disait « à 11:11 » — une notation
 * d'horloge d'ordinateur, que personne n'écrit dans un message à ses clients.
 */
export function heureLisible(hhmm: string): string {
  const t = decoupeHeure(hhmm);
  if (!t) return String(hhmm ?? "").trim();
  return `${t.h} h${t.mn ? ` ${String(t.mn).padStart(2, "0")}` : ""}`;
}

function decoupeHeure(hhmm: string): { h: number; mn: number } | null {
  const m = /^(\d{1,2})[:h](\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h > 23 || mn > 59 ? null : { h, mn };
}

/**
 * Le moment exact où une annonce s'arrête. C'est la pièce qui rend honnête une
 * offre « de 16 h à 18 h » : à 18 h elle disparaît du site ET du catalogue,
 * sans que le commerçant ait à y penser.
 *
 * Sans jour donné, une heure déjà passée désigne demain — dire « jusqu'à 9 h »
 * à 14 h ne peut vouloir dire que le lendemain matin.
 */
export function moment(now: Date, hhmm: string, iso?: string): Date | null {
  const t = decoupeHeure(hhmm);
  if (!t) return null;
  const base = iso ? decoupeJour(iso) : null;
  if (iso && !base) return null;
  const d = base ? new Date(base) : new Date(now);
  d.setHours(t.h, t.mn, 0, 0);
  if (!base && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime() <= now.getTime() ? null : d;
}

/** Fin du jour désigné (23 h 59) — pour ce qui vaut « toute la journée ». */
export function finDeJour(now: Date, iso?: string): Date | null {
  const base = iso ? decoupeJour(iso) : new Date(now);
  if (!base) return null;
  const d = new Date(base);
  d.setHours(23, 59, 0, 0);
  return d.getTime() <= now.getTime() ? null : d;
}

const dansNJours = (now: Date, n: number): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
};

/* ─────────────────────────── Vocabulaire du métier ─────────────────────── */

export type Vocab = {
  /** Ce qui se libère chez ce commerce : un créneau, une table, une place… */
  place: string;
  places: string;
  /** Où l'on vient : « au salon », « en boutique »… */
  lieu: string;
  /** Le métier travaille sur rendez-vous → les intentions « créneau » ont un sens. */
  surRdv: boolean;
  /** Commerce de passage → « arrivage du jour » a un sens, « créneau » non. */
  boutique: boolean;
};

export function vocabulaire(metier: string, confirmation: Confirmation, secteur: Secteur): Vocab {
  const m = sansAccents(metier);
  const est = (r: RegExp) => r.test(m);

  if (est(/restaurant|brasserie|pizzeria|creperie|bistrot|bar\b|cantine|burger|sushi/))
    return { place: "table", places: "tables", lieu: "en salle", surRdv: true, boutique: false };

  if (est(/cours|yoga|pilates|danse|salle de sport|fitness|escalade|poterie|atelier/))
    return { place: "place", places: "places", lieu: "à l'atelier", surRdv: true, boutique: false };

  if (est(/coiffeur|coiffure|barbier|esthetic|ongul|onglerie|institut|spa|massage|beaute|bronzage|tatou/))
    return { place: "créneau", places: "créneaux", lieu: "au salon", surRdv: true, boutique: false };

  if (est(/boulangerie|patisserie|boucherie|charcuterie|poissonnerie|fromagerie|primeur|epicerie|caviste|chocolat|glacier|traiteur/))
    return { place: "commande", places: "commandes", lieu: "en boutique", surRdv: false, boutique: true };

  if (est(/fleuriste|librairie|boutique|magasin|concept store|decoration|bijou|vetement|pret-a-porter|friperie/))
    return { place: "commande", places: "commandes", lieu: "en boutique", surRdv: false, boutique: true };

  // Défaut : on se fie au modèle métier plutôt qu'à un mot-clé qu'on n'a pas prévu.
  const rdv = confirmation === "reserve" || confirmation === "rappel";
  return {
    place: rdv ? "créneau" : "rendez-vous",
    places: rdv ? "créneaux" : "rendez-vous",
    lieu: secteur === "soin" ? "au cabinet" : "sur place",
    surRdv: rdv,
    boutique: false,
  };
}

/* ──────────────────────────── Les intentions ───────────────────────────── */

/**
 * Les grandes intentions, déclinées dans le vocabulaire du métier. On n'écrit
 * pas dix annonces pour cinq cents métiers : on écrit dix questions, et le
 * métier choisit lesquelles ont un sens.
 */
export function intentionsPour(metier: string, confirmation: Confirmation, secteur: Secteur): Intention[] {
  const v = vocabulaire(metier, confirmation, secteur);
  const j = (x: Record<string, string>, now: Date) => libelleJour(x.jour, now);
  const liste: Intention[] = [];

  if (v.surRdv) {
    liste.push({
      cle: "creneau",
      emoji: "🕐",
      titre: `Un ${v.place} s'est libéré ?`,
      sous: "Prévenez ceux qui attendaient une place.",
      champs: [
        { cle: "jour", label: "Quel jour ?", type: "jour", requis: true },
        { cle: "heure", label: "À quelle heure ?", type: "heure", requis: true },
        { cle: "quoi", label: "Pour quelle prestation ?", type: "texte", exemple: "une couleur", requis: false },
      ],
      brief: (x) =>
        `Un ${v.place} s'est libéré ${libelleJour(x.jour, new Date())} à ${heureLisible(x.heure)}` +
        `${x.quoi ? ` pour ${x.quoi}` : ""}. Les client·es peuvent me répondre pour le réserver.`,
      fin: (x, now) => moment(now, x.heure, x.jour),
      demo: (now) => ({ jour: jourISO(dansNJours(now, 1)), heure: "16:00", quoi: "" }),
    });

    liste.push({
      cle: "dispo",
      emoji: "📅",
      titre: `Vos derniers ${v.places} de la semaine ?`,
      sous: "Dites ce qu'il vous reste, sans promettre plus.",
      champs: [
        { cle: "combien", label: `Combien de ${v.places} restants ?`, type: "nombre", requis: true },
        { cle: "quand", label: "Sur quelle période ?", type: "texte", exemple: "cette semaine", requis: true },
      ],
      brief: (x) => `Il me reste ${x.combien} ${v.places} disponibles ${x.quand}.`,
      fin: (_x, now) => dansNJours(now, 3),
      demo: () => ({ combien: "3", quand: "cette semaine" }),
    });
  }

  liste.push({
    cle: "venir",
    emoji: "☕",
    titre: "Faire venir du monde aujourd'hui ?",
    sous: "Une raison simple de pousser la porte.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce que vous proposez ?", type: "texte", exemple: "le café offert", requis: true },
      { cle: "de", label: "À partir de quelle heure ?", type: "heure", requis: true },
      { cle: "a", label: "Jusqu'à quelle heure ?", type: "heure", requis: true },
    ],
    brief: (x) => `Aujourd'hui de ${heureLisible(x.de)} à ${heureLisible(x.a)} : ${x.quoi}. J'invite les gens à passer ${v.lieu}.`,
    fin: (x, now) => moment(now, x.a),
    demo: () => ({ quoi: "le café offert", de: "10:00", a: "12:00" }),
  });

  liste.push({
    cle: "offre",
    emoji: "⚡",
    titre: "Une offre sur quelques heures ?",
    sous: "Elle disparaît toute seule à l'heure que vous fixez.",
    champs: [
      { cle: "quoi", label: "Sur quoi porte l'offre ?", type: "texte", exemple: "tout le magasin", requis: true },
      { cle: "combien", label: "Quelle remise ?", type: "pourcent", requis: true },
      { cle: "de", label: "De quelle heure ?", type: "heure", requis: true },
      { cle: "a", label: "À quelle heure ?", type: "heure", requis: true },
    ],
    brief: (x) => `Offre de -${x.combien} % sur ${x.quoi}, aujourd'hui de ${heureLisible(x.de)} à ${heureLisible(x.a)} uniquement.`,
    fin: (x, now) => moment(now, x.a),
    demo: () => ({ quoi: "toutes les prestations", combien: "20", de: "16:00", a: "18:00" }),
  });

  liste.push({
    cle: "nouveaute",
    emoji: "✨",
    titre: "Une nouveauté à montrer ?",
    sous: "Ce qui vient d'arriver et que personne ne sait encore.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce qui est nouveau ?", type: "texte", exemple: "une nouvelle collection", requis: true },
      { cle: "des", label: "Disponible à partir de quand ?", type: "jour", requis: false },
    ],
    brief: (x) =>
      `Nouveauté ${v.lieu} : ${x.quoi}.` + (x.des ? ` Disponible à partir de ${libelleJour(x.des, new Date())}.` : ""),
    fin: (_x, now) => dansNJours(now, 7),
    demo: () => ({ quoi: "notre nouvelle collection", des: "" }),
  });

  if (v.boutique) {
    liste.push({
      cle: "arrivage",
      emoji: "🧺",
      titre: "Un arrivage du jour à faire connaître ?",
      sous: "Ce qui est frais ce matin et parti ce soir.",
      champs: [
        { cle: "quoi", label: "Qu'est-ce qui est arrivé ?", type: "texte", exemple: "des fraises de Dordogne", requis: true },
        { cle: "combien", label: "En quelle quantité ?", type: "texte", exemple: "une vingtaine de barquettes", requis: false },
      ],
      brief: (x) => `Arrivage du jour : ${x.quoi}${x.combien ? ` (${x.combien})` : ""}, disponible ${v.lieu}.`,
      fin: (_x, now) => finDeJour(now),
      demo: () => ({ quoi: "un arrivage tout frais de ce matin", combien: "" }),
    });
  }

  liste.push({
    cle: "realisation",
    emoji: "📸",
    titre: "Montrer ce que vous venez de faire ?",
    sous: "Votre travail d'aujourd'hui vaut mieux qu'un slogan.",
    champs: [{ cle: "quoi", label: "Qu'avez-vous réalisé ?", type: "texte", exemple: "une pose sur ongles courts", requis: true }],
    brief: (x) => `Je viens de terminer : ${x.quoi}. Je le montre à mes client·es.`,
    fin: (_x, now) => dansNJours(now, 7),
    demo: () => ({ quoi: "une pièce dont je suis fier·e" }),
  });

  liste.push({
    cle: "evenement",
    emoji: "🎉",
    titre: "Un événement à annoncer ?",
    sous: "Une date que les gens doivent noter.",
    champs: [
      { cle: "quoi", label: "Quel événement ?", type: "texte", exemple: "une dégustation", requis: true },
      { cle: "jour", label: "Quel jour ?", type: "jour", requis: true },
      { cle: "heure", label: "À quelle heure ?", type: "heure", requis: false },
    ],
    brief: (x) => `J'organise ${x.quoi} ${j(x, new Date())}${x.heure ? ` à partir de ${heureLisible(x.heure)}` : ""}, ${v.lieu}.`,
    fin: (x, now) => finDeJour(now, x.jour),
    demo: (now) => ({ quoi: "une journée portes ouvertes", jour: jourISO(dansNJours(now, 3)), heure: "10:00" }),
  });

  liste.push({
    cle: "fideles",
    emoji: "💚",
    titre: "Un geste pour vos habitués ?",
    sous: "Ceux qui reviennent méritent de l'apprendre en premier.",
    champs: [
      { cle: "quoi", label: "Que leur proposez-vous ?", type: "texte", exemple: "un soin des mains offert", requis: true },
      { cle: "jusqua", label: "Jusqu'à quel jour ?", type: "jour", requis: false },
    ],
    brief: (x) =>
      `Pour mes client·es fidèles : ${x.quoi}` + (x.jusqua ? `, jusqu'à ${libelleJour(x.jusqua, new Date())}` : "") + ".",
    fin: (x, now) => (x.jusqua ? finDeJour(now, x.jusqua) : dansNJours(now, 7)),
    demo: () => ({ quoi: "une petite attention à la prochaine visite", jusqua: "" }),
  });

  liste.push({
    cle: "horaires",
    emoji: "🕰️",
    titre: "Un changement d'horaires ?",
    sous: "Éviter à quelqu'un de trouver porte close.",
    champs: [
      { cle: "quoi", label: "Qu'est-ce qui change ?", type: "texte", exemple: "fermé jeudi après-midi", requis: true },
      { cle: "jusqua", label: "Jusqu'à quel jour ?", type: "jour", requis: false },
    ],
    brief: (x) => `Changement d'horaires : ${x.quoi}${x.jusqua ? `, jusqu'à ${libelleJour(x.jusqua, new Date())}` : ""}.`,
    fin: (x, now) => (x.jusqua ? finDeJour(now, x.jusqua) : dansNJours(now, 7)),
    demo: () => ({ quoi: "ouverture exceptionnelle ce dimanche matin", jusqua: "" }),
  });

  return liste;
}

/* ────────────────────────── Ce qu'on montre d'abord ────────────────────── */

/**
 * Trois propositions, pas dix. Un écran de dix vignettes, c'est la page blanche
 * avec des étapes en plus — et la valeur promise ici est justement de ne pas
 * avoir à choisir. Le reste tient derrière « Une autre idée ».
 *
 * Le classement dépend de l'heure et du jour, parce qu'à 9 h du matin et à 16 h
 * on n'a pas le même problème.
 */
export function recommandees(liste: Intention[], now: Date, n = 3): Intention[] {
  const h = now.getHours();
  const jourSemaine = now.getDay(); // 0 = dimanche
  const veilleDeWeekend = jourSemaine === 4 || jourSemaine === 5;

  const score = (cle: string): number => {
    switch (cle) {
      // Un désistement se traite dans l'heure : prioritaire pendant qu'on travaille.
      case "creneau":
        return h >= 8 && h < 19 ? 100 : 40;
      // Le creux d'après-midi se comble le matin ou juste avant.
      case "venir":
        return h >= 9 && h < 16 ? 90 : 45;
      case "offre":
        return h >= 11 && h < 18 ? 80 : 50;
      // Ce qui est arrivé le matin doit se dire le matin.
      case "arrivage":
        return h < 13 ? 95 : 30;
      case "evenement":
        return veilleDeWeekend ? 75 : 40;
      // En fin de journée, on remplit la suite plutôt que l'instant.
      case "dispo":
        return h >= 17 || jourSemaine === 1 ? 70 : 35;
      case "realisation":
        return h >= 16 ? 60 : 38;
      case "nouveaute":
        return 55;
      case "fideles":
        return 33;
      case "horaires":
        return 20;
      default:
        return 25;
    }
  };

  return [...liste].sort((a, b) => score(b.cle) - score(a.cle) || a.cle.localeCompare(b.cle)).slice(0, n);
}

/** Les champs obligatoires encore vides — le garde-fou contre l'annonce à trous. */
export function manquants(it: Intention, v: Record<string, string>): Champ[] {
  return it.champs.filter((c) => c.requis && !String(v[c.cle] ?? "").trim());
}
