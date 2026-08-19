// « VOUS L'AVEZ FAIT CINQ JOURS SUR SEPT. »
//
// LE RISQUE QUE ÇA SURVEILLE. « Il me reste 8 lasagnes à 9 € » est excellent
// tant que c'est du surplus. Répété tous les jours à la même heure, ça devient
// un horaire : dans une ville de vingt mille habitants où les mêmes gens
// circulent, les habitués apprennent à venir à 14 h — et le commerçant vend à
// 9 € ce qu'il vendait à 16 €. Il ne s'en aperçoit qu'au bout de plusieurs
// semaines, quand son ticket moyen a baissé sans qu'il sache pourquoi.
//
// CE QUE ÇA N'EST PAS. Ce n'est ni un blocage, ni un conseil, ni un score. Le
// commerçant est adulte et c'est son commerce : on lui donne un FAIT qu'il ne
// peut pas voir tout seul — combien de jours d'affilée, et à quelle heure — et
// il en fait ce qu'il veut. Un produit qui juge les décisions commerciales de
// quelqu'un se fait fermer au bout d'une semaine.
//
// ET SURTOUT : ÇA SE TAIT PRESQUE TOUJOURS. En dessous du seuil, rien du tout.
// Un panneau qui parle à chaque visite finit par ne plus être lu — c'est la
// leçon du diagnostic qu'on a retiré de la page d'accueil du commerçant.
import { jourParis } from "@/lib/jour-paris";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** La fenêtre observée. Une semaine : assez pour voir une habitude, assez court
 *  pour qu'un pic de fin de mois ne compte pas comme une règle. */
export const FENETRE_JOURS = 7;

/** LE SEUIL. À trois jours sur sept, c'est du surplus — ça arrive, et c'est
 *  même le signe que la fonction sert. À quatre, ça devient un rendez-vous que
 *  les habitués peuvent apprendre. C'est là qu'un fait devient utile à dire. */
export const SEUIL_JOURS = 4;

/** L'écart maximal entre la première et la dernière publication d'une journée
 *  type pour qu'on parle d'une HEURE. Au-delà d'une heure et demie, ce n'est
 *  plus un horaire, c'est du hasard — et le dire serait inventer un motif. */
const ETALEMENT_MAX_MIN = 90;

export type Habitude = {
  /** Le nombre de JOURS distincts avec au moins une portion publiée. */
  jours: number;
  /** Vrai au-delà du seuil : c'est la seule condition pour dire quelque chose. */
  signaler: boolean;
  /** « 14 h 10 » quand les publications tombent toujours au même moment.
   *  Vide quand elles sont dispersées — auquel cas il n'y a pas d'horaire à
   *  signaler, seulement une fréquence. */
  heure: string;
};

export const SANS_HABITUDE: Habitude = { jours: 0, signaler: false, heure: "" };

/** Les minutes depuis minuit, à PARIS.
 *
 *  `getHours()` lirait l'horloge du serveur — en UTC en production. Le défaut a
 *  déjà été payé une fois sur les échéances du fil, où toutes les annonces
 *  s'affichaient deux heures trop tôt. */
function minutesParis(iso: string): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    const s = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(t));
    const [h, m] = s.split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
  } catch {
    return null;
  }
}

const enHeure = (min: number): string => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, "0")}`;

/**
 * Depuis combien de jours ce commerce brade ce qu'il lui reste.
 *
 * DES JOURS DISTINCTS, pas des annonces : publier trois fois dans la même
 * journée n'apprend rien de plus aux habitués qu'une seule fois. C'est la
 * RÉPÉTITION QUOTIDIENNE qui crée l'habitude, pas le volume.
 *
 * Panne, table absente, colonne non migrée : `SANS_HABITUDE`, et l'écran se
 * tait. C'est une remarque de confort — la faire échouer bruyamment
 * empêcherait de publier, ce qui serait infiniment pire que de ne rien dire.
 */
export async function habitudePortion(supabase: unknown, siteId: string): Promise<Habitude> {
  if (!siteId) return SANS_HABITUDE;
  const depuis = new Date(Date.now() - FENETRE_JOURS * 24 * 3600 * 1000).toISOString();
  try {
    const { data, error } = await (supabase as Supabase)
      .from("clik_campaign")
      .select("created_at")
      .eq("site_id", siteId)
      .eq("type", "portion")
      .gte("created_at", depuis);
    if (error || !Array.isArray(data)) return SANS_HABITUDE;

    const lignes = data as Record<string, unknown>[];
    // UN JOUR = UN JOUR DE DAX. Grouper sur l'ISO brut ferait de deux
    // publications du même soir — 23 h 30 et 00 h 30 heure de Paris — deux
    // jours, et de toute publication après 22 h un jour de trop.
    const jours = new Set<string>();
    const minutes: number[] = [];
    for (const r of lignes) {
      const iso = str(r.created_at);
      if (!iso) continue;
      jours.add(jourParis(new Date(iso)));
      const m = minutesParis(iso);
      if (m != null) minutes.push(m);
    }

    const n = jours.size;
    if (n < SEUIL_JOURS) return { jours: n, signaler: false, heure: "" };

    // L'HEURE N'EST DITE QUE SI ELLE EXISTE. C'est elle qui fait la différence
    // entre du surplus — qui tombe quand il tombe — et un rendez-vous que les
    // clients peuvent apprendre. Dispersée, on ne mentionne que la fréquence.
    minutes.sort((a, b) => a - b);
    const etale = minutes.length > 1 ? minutes[minutes.length - 1] - minutes[0] : 0;
    const heure =
      minutes.length > 1 && etale <= ETALEMENT_MAX_MIN
        ? enHeure(minutes.reduce((s, v) => s + v, 0) / minutes.length)
        : "";

    return { jours: n, signaler: true, heure };
  } catch {
    return SANS_HABITUDE;
  }
}
