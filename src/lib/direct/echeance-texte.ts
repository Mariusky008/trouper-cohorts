// QUAND CETTE ANNONCE CESSE-T-ELLE D'ÊTRE VRAIE ?
//
// Le commerçant écrit « Un créneau s'est libéré lundi 10 de 11h à 13h » et ne
// remplit aucune date de fin — il vient de la donner, dans sa phrase. Sans
// échéance, l'annonce reste au fil pendant trois jours, sept dans une ville
// calme, et le lundi 10 est passé depuis longtemps. C'est exactement ce qu'on
// promet de ne jamais faire : « le fil ne garde que ce qui est encore vrai ».
//
// CE MODULE NE DEVINE PAS, IL LIT. En l'absence de repère explicite, il rend
// `null` et rien ne change. Une échéance inventée est pire qu'une échéance
// absente : elle fait disparaître une annonce encore valable, et le commerçant
// ne comprend pas pourquoi son offre n'est plus là.
//
// TROIS PRINCIPES :
//
//   1. LA FIN, PAS LE DÉBUT. « de 11h à 13h » expire à 13 h. Prendre la
//      première heure retirerait l'annonce avant même le créneau.
//   2. JAMAIS DANS LE PASSÉ. Un repère déjà écoulé aujourd'hui désigne le
//      prochain — sauf si le texte nomme une date précise, auquel cas cette
//      date fait foi et l'annonce est simplement périmée.
//   3. UNE BORNE HAUTE. Rien au-delà de soixante jours : « le 12 septembre »
//      lu un 20 octobre voudrait dire l'année suivante, et une annonce qui
//      resterait onze mois au fil serait un bug plus coûteux qu'une absence.

const ZONE = "Europe/Paris";

/** Au-delà, on refuse la déduction : c'est plus probablement une erreur de
 *  lecture qu'une offre valable deux mois. */
export const HORIZON_MAX_MS = 60 * 24 * 3600 * 1000;

const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

/** Les champs de date/heure LOCAUX d'un instant. On passe par `Intl` plutôt que
 *  par `getHours()` : le serveur n'est pas dans le fuseau de la ville. */
function champsLocaux(quand: Date): { annee: number; mois: number; jour: number; h: number; min: number; jourSemaine: number } {
  try {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short",
    }).formatToParts(quand);
    const lire = (t: string) => Number(f.find((x) => x.type === t)?.value ?? NaN);
    const js = String(f.find((x) => x.type === "weekday")?.value ?? "");
    const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(js);
    return {
      annee: lire("year"), mois: lire("month"), jour: lire("day"),
      h: lire("hour") % 24, min: lire("minute"),
      jourSemaine: idx >= 0 ? idx : new Date(quand).getUTCDay(),
    };
  } catch {
    const d = new Date(quand);
    return {
      annee: d.getUTCFullYear(), mois: d.getUTCMonth() + 1, jour: d.getUTCDate(),
      h: d.getUTCHours(), min: d.getUTCMinutes(), jourSemaine: d.getUTCDay(),
    };
  }
}

/** L'instant absolu correspondant à `h:min` locales, `joursPlus` jours après
 *  `quand`. Calculé par ÉCART depuis l'heure locale courante, jamais avec
 *  `setHours` : c'est ce qui casse aux changements d'heure. */
function instantLocal(quand: Date, h: number, min: number, joursPlus: number): number {
  const c = champsLocaux(quand);
  const ecartMin = (h * 60 + min) - (c.h * 60 + c.min) + joursPlus * 1440;
  return quand.getTime() + ecartMin * 60_000;
}

/** Le nombre de jours à ajouter pour tomber sur le prochain `cible` (0=dimanche).
 *  0 si c'est aujourd'hui. */
function joursJusquA(courant: number, cible: number): number {
  return (cible - courant + 7) % 7;
}

type Heure = { h: number; min: number };

/**
 * Toutes les heures citées, dans l'ordre.
 *
 * Accepte « 13h », « 13 h 30 », « 13h30 », « 13:30 ». Pas « 13 » seul : dans
 * « lundi 10 de 11h à 13h », le « 10 » est un quantième, et le prendre pour une
 * heure ferait expirer l'annonce à 10 h du matin.
 */
function heuresCitees(t: string): Heure[] {
  const out: Heure[] = [];
  const re = /\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const h = Number(m[1]);
    const min = m[2] == null ? 0 : Number(m[2]);
    if (h <= 23 && min <= 59) out.push({ h, min });
  }
  return out;
}

/** Les moments nommés, quand aucune heure chiffrée n'est donnée. Les bornes
 *  sont celles de `dejeuner.ts` là où elles existent déjà. */
const MOMENTS: Array<{ re: RegExp; h: number; min: number }> = [
  { re: /\bce matin\b/, h: 12, min: 0 },
  { re: /\b(?:ce )?midi\b/, h: 14, min: 30 },
  { re: /\bcet(?:te)? apres.?midi\b/, h: 18, min: 0 },
  { re: /\bce soir\b/, h: 23, min: 0 },
  { re: /\bdans la journee\b|\baujourd.?hui\b/, h: 23, min: 59 },
];

export type Deduction = { expireLe: string; raison: string } | null;

/**
 * L'échéance déduite d'un texte d'annonce.
 *
 * `null` quand le texte ne porte aucun repère de fin exploitable — et c'est le
 * cas le plus fréquent, volontairement.
 */
export function echeanceDuTexte(texte: string, maintenant: Date = new Date()): Deduction {
  const t = norm(texte);
  if (!t.trim()) return null;

  const heures = heuresCitees(t);
  // La DERNIÈRE heure citée : dans « de 11h à 13h », c'est la fin.
  const fin: Heure | null = heures.length ? heures[heures.length - 1] : null;
  const c = champsLocaux(maintenant);

  // ── ① Une date explicite : « le 12 septembre », « 12 septembre » ─────────
  const mDate = t.match(
    new RegExp(`\\b(\\d{1,2})\\s*(?:er)?\\s+(${MOIS.join("|")})\\b`)
  );
  if (mDate) {
    const jour = Number(mDate[1]);
    const mois = MOIS.indexOf(mDate[2]) + 1;
    const inst = instantDateCivile(maintenant, jour, mois, fin ?? { h: 23, min: 59 });
    return borner(inst, maintenant, `date « ${mDate[1]} ${mDate[2]} »`);
  }

  // ── ② Un jour de semaine, éventuellement avec son quantième ─────────────
  //     « lundi 17 » : le quantième précise DE QUEL lundi il s'agit.
  //
  //     Les deux négations sont indispensables, et la seconde a été apprise à
  //     la dure :
  //       · `(?!\s*[h:])` — sans elle, « jeudi 8h » lisait « 8 » comme un
  //         quantième et cherchait le prochain jeudi 8 du mois, le 8 octobre
  //         au lieu de ce soir. Un nombre collé à un « h » est une heure.
  //       · `(?!\d)` — sans elle, « jeudi 19h » revenait en arrière sur le
  //         seul chiffre « 1 », qui lui passait la première négation, et
  //         désignait le prochain jeudi 1ᵉʳ du mois. Un quantième s'écrit en
  //         entier ou pas du tout.
  const mJour = t.match(new RegExp(`\\b(${JOURS.join("|")})\\b(?:\\s+(\\d{1,2})(?!\\d)(?!\\s*[h:]))?`));
  if (mJour) {
    const cible = JOURS.indexOf(mJour[1]);
    const quantieme = mJour[2] ? Number(mJour[2]) : null;
    const heureFin = fin ?? { h: 23, min: 59 };

    let plus = joursJusquA(c.jourSemaine, cible);
    // Aujourd'hui, mais l'heure est passée : c'est le même jour la semaine
    // prochaine. « samedi 19 h » lu un samedi à 21 h ne parle pas de ce soir.
    if (plus === 0 && instantLocal(maintenant, heureFin.h, heureFin.min, 0) <= maintenant.getTime()) {
      plus = 7;
    }
    // Le quantième corrige : si « lundi 10 » ne tombe pas sur le prochain
    // lundi, on cherche le lundi qui porte ce numéro, dans les deux mois.
    if (quantieme != null && quantieme >= 1 && quantieme <= 31) {
      const trouve = lundiQuiPorte(maintenant, cible, quantieme);
      if (trouve != null) plus = trouve;
    }
    return borner(instantLocal(maintenant, heureFin.h, heureFin.min, plus), maintenant, `« ${mJour[0].trim()} »`);
  }

  // ── ③ « demain » ────────────────────────────────────────────────────────
  if (/\bdemain\b/.test(t)) {
    const h = fin ?? { h: 23, min: 59 };
    return borner(instantLocal(maintenant, h.h, h.min, 1), maintenant, "« demain »");
  }

  // ── ④ Une heure de fin, sans jour : c'est aujourd'hui ───────────────────
  //     « jusqu'à 18h », « de 16h à 18h », « ce soir jusqu'à 22h ».
  if (fin) {
    const inst = instantLocal(maintenant, fin.h, fin.min, 0);
    // Déjà passée : le texte parle du lendemain (« ouvert jusqu'à 9h » lu à
    // 23 h), pas d'une annonce morte à la naissance.
    const j = inst > maintenant.getTime() ? 0 : 1;
    return borner(instantLocal(maintenant, fin.h, fin.min, j), maintenant, `heure « ${fin.h} h »`);
  }

  // ── ⑤ Un moment nommé, sans heure chiffrée ──────────────────────────────
  for (const m of MOMENTS) {
    if (!m.re.test(t)) continue;
    const inst = instantLocal(maintenant, m.h, m.min, 0);
    if (inst > maintenant.getTime()) return borner(inst, maintenant, "moment de la journée");
    // Le moment est passé : on ne reporte PAS au lendemain. « ce matin » lu à
    // 15 h ne veut pas dire demain matin — il ne veut plus rien dire.
    return null;
  }

  return null;
}

/** L'instant d'une date civile (jour/mois) à l'heure donnée. Si la date est
 *  déjà passée cette année, on vise l'année suivante — mais la borne des
 *  soixante jours rejettera presque toujours ce cas. */
function instantDateCivile(maintenant: Date, jour: number, mois: number, h: Heure): number {
  const c = champsLocaux(maintenant);
  for (const annee of [c.annee, c.annee + 1]) {
    // Jours écoulés entre la date courante et la cible, via UTC : on ne compare
    // que des quantièmes, l'heure est réappliquée ensuite en local.
    const aujourdhui = Date.UTC(c.annee, c.mois - 1, c.jour);
    const cible = Date.UTC(annee, mois - 1, jour);
    const plus = Math.round((cible - aujourdhui) / 86_400_000);
    if (plus >= 0) return instantLocal(maintenant, h.h, h.min, plus);
  }
  return instantLocal(maintenant, h.h, h.min, 0);
}

/** Dans combien de jours tombe le prochain `jourSemaine` portant le quantième
 *  `quantieme` ? `null` si aucun dans les deux mois. */
function lundiQuiPorte(maintenant: Date, jourSemaine: number, quantieme: number): number | null {
  const c = champsLocaux(maintenant);
  for (let plus = 0; plus <= 62; plus++) {
    const d = new Date(Date.UTC(c.annee, c.mois - 1, c.jour + plus));
    if (d.getUTCDay() === jourSemaine && d.getUTCDate() === quantieme) return plus;
  }
  return null;
}

/** Refuse ce qui est déjà passé ou trop loin. C'est le garde-fou : mieux vaut
 *  pas d'échéance qu'une mauvaise. */
function borner(instant: number, maintenant: Date, raison: string): Deduction {
  const t0 = maintenant.getTime();
  if (!Number.isFinite(instant) || instant <= t0) return null;
  if (instant - t0 > HORIZON_MAX_MS) return null;
  return { expireLe: new Date(instant).toISOString(), raison };
}
