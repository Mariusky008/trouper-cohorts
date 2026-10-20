/**
 * 🎬 L'ÉPISODE — « dire à un artisan de placer son téléphone là où il fabrique
 * son produit, qu'il clique sur “Démarrer la session” et qu'il arrête quand il a
 * terminé, et que ça crée une super vidéo : Épisode 1 de sa série 2026. Ensuite,
 * il n'a plus qu'à publier sur ses réseaux et ClikMe. »
 *
 * Trente minutes de vidéo pèsent plus d'un gigaoctet : un navigateur de
 * téléphone ne les garde pas. La session filme donc en MORCEAUX de quelques
 * secondes, note chacun (ce qui bouge, ce qui s'entend) et ne garde que le
 * meilleur de chaque tranche de temps — l'histoire reste couverte du début à la
 * fin. À côté, une image toutes les quelques secondes, pour les accélérés.
 *
 * Ce fichier ne touche ni la caméra ni l'écran : ce qu'on garde, la note d'un
 * morceau, le plan du montage, le numéro de l'épisode. Le tournage est dans
 * `episode-session.ts`, le film dans `episode-montage.ts`, l'écran dans
 * `app/autour-de-moi/assistante/episode-comptoir.tsx`.
 */

/** Un morceau de tournage : assez long pour un geste, assez court pour qu'on en jette sans regret. */
export const MORCEAU_S = 6;
/** Les morceaux gardés en mémoire, au plus (un mégaoctet et demi chacun environ). */
export const GARDES_MAX = 40;
/** Les images de l'accéléré, au plus (une cinquantaine de kilooctets chacune). */
export const IMAGES_MAX = 220;
/** Une image toutes les deux secondes au début ; l'écart double quand il y en a trop. */
export const IMAGE_PAS_S = 2;
/** La session s'arrête toute seule au bout d'une heure : « maximum 1 heure » (le temps d'une préparation). */
export const SESSION_MAX_S = 60 * 60;
/** En dessous, il n'y a pas d'épisode à monter. */
export const SESSION_MIN_S = 30;

/** Les temps de la signature ClikMe, les mêmes que l'interview et le film du spécialiste. */
export const TITRE_S = 3.1;
export const FIN_S = 4.3;

const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/* ═══ CE QU'ON MESURE PENDANT UN MORCEAU ═══════════════════════════════════ */

/**
 * Quatre fois par seconde, sur une image minuscule : combien elle a changé
 * depuis la précédente (`mouvement`, 0 à 255), sa lumière (`lumiere`, 0 à 255),
 * et le niveau du micro (`son`, en décibels).
 */
export type Mesures = { n: number; mouvement: number; pic: number; lumiere: number; son: number };

export const mesuresVides = (): Mesures => ({ n: 0, mouvement: 0, pic: 0, lumiere: 0, son: 0 });

export function mesurer(m: Mesures, mouvement: number, lumiere: number, son: number): Mesures {
  return { n: m.n + 1, mouvement: m.mouvement + mouvement, pic: Math.max(m.pic, mouvement), lumiere: m.lumiere + lumiere, son: m.son + son };
}

/**
 * LA NOTE D'UN MORCEAU, de 0 à 1 : ses mains qui travaillent (ce qui bouge)
 * comptent pour l'essentiel, le son pour un peu (le fouet, la pâte qu'on tape).
 * Deux moments ne valent rien : le noir (le téléphone retourné, la lumière
 * éteinte) et la secousse (on a pris ou cogné le téléphone : toute l'image change).
 */
export function noter(m: Mesures): number {
  if (!m.n) return 0;
  const mouvement = m.mouvement / m.n;
  const lumiere = m.lumiere / m.n;
  const son = m.son / m.n;
  let note = 0.75 * borne((mouvement - 0.8) / 7) + 0.25 * borne((son + 50) / 30);
  if (lumiere < 18) note *= 0.2;
  if (m.pic > 45) note *= 0.5;
  return Math.round(note * 1000) / 1000;
}

/* ═══ CE QU'ON GARDE ════════════════════════════════════════════════════════ */

export type MorceauNote = { n: number; debut: number; duree: number; score: number };

/**
 * LA RÉSERVE : pleine, elle lâche le morceau qui manquera le moins — celui
 * dont le départ laisse le plus petit trou, et le moins bon à trou égal. Les
 * gardés restent répartis sur toute la session, et ce sont les plus vivants
 * de chaque moment.
 *
 * LE DERNIER ARRIVÉ EST TOUJOURS GARDÉ : c'est la fin de la session, le produit
 * fini — la révélation de l'épisode.
 *
 * `jeter` : appelé pour chaque morceau qu'on lâche (le tournage libère sa mémoire).
 */
export class Reserve<T extends MorceauNote> {
  private gardes: T[] = [];
  private dernier: T | null = null;

  constructor(
    private readonly max = GARDES_MAX,
    private readonly jeter: (m: T) => void = () => {},
  ) {}

  ajouter(m: T) {
    const avant = this.dernier;
    this.dernier = m;
    if (!avant) return;
    this.gardes.push(avant);
    if (this.gardes.length > this.max) this.lacher();
  }

  /** Les morceaux gardés, dans l'ordre du tournage — le dernier arrivé en dernier. */
  liste(): T[] {
    return this.dernier ? [...this.gardes, this.dernier] : [...this.gardes];
  }

  get nombre() {
    return this.gardes.length + (this.dernier ? 1 : 0);
  }

  /**
   * Celui qui s'en va : celui dont le départ laisse le plus petit trou entre ses
   * deux voisins, pesé par sa note — un morceau moyen au milieu d'autres part
   * avant un beau morceau isolé.
   */
  private lacher() {
    const l = this.gardes;
    let k = 0;
    let mieux = Infinity;
    for (let i = 0; i < l.length; i++) {
      const avant = i > 0 ? l[i - 1].debut : 0;
      const apres = i + 1 < l.length ? l[i + 1].debut : (this.dernier?.debut ?? l[i].debut);
      const cout = (apres - avant) * (0.4 + l[i].score);
      if (cout < mieux) {
        mieux = cout;
        k = i;
      }
    }
    this.jeter(l[k]);
    l.splice(k, 1);
  }
}

/**
 * LES IMAGES DE L'ACCÉLÉRÉ : une toutes les `pas` secondes. Trop nombreuses,
 * on en lâche une sur deux et l'écart double — elles couvrent toujours toute la
 * session.
 */
export class Accelere<T extends { t: number }> {
  pas = IMAGE_PAS_S;
  images: T[] = [];
  private derniere = -Infinity;

  constructor(private readonly max = IMAGES_MAX) {}

  /** Faut-il prendre une image à l'instant `t` (secondes de session) ? Oui : l'instant est retenu tout de suite (l'image, elle, arrive un peu après). */
  aPrendre(t: number) {
    if (t - this.derniere < this.pas) return false;
    this.derniere = t;
    return true;
  }

  ajouter(i: T) {
    this.images.push(i);
    if (this.images.length > this.max) {
      this.images = this.images.filter((_, k) => k % 2 === 0);
      this.pas *= 2;
    }
  }
}

/* ═══ LE PLAN DU MONTAGE ════════════════════════════════════════════════════ */

/**
 * `episode` : le film entier, deux à quatre minutes pour une session d'une
 * demi-heure — pour ClikMe et sa page. `bande` : la bande-annonce de ses
 * réseaux, une trentaine de secondes (Instagram et Facebook ne prennent en Reel
 * que 90 secondes au plus — voir `REEL_MAX_S`).
 */
export type GenreMontage = "episode" | "bande";

/**
 * Ce que le film enchaîne. Les instants `de`/`a`/`heure` sont en secondes de
 * SESSION ; `duree` en secondes de FILM. `k` : l'indice du morceau dans la liste
 * gardée ; `depuis` : où on entre dans le morceau.
 */
export type Bloc =
  | { genre: "titre"; duree: number }
  | { genre: "accelere"; de: number; a: number; duree: number; vitesse: number }
  | { genre: "moment"; k: number; depuis: number; duree: number; heure: number; legende?: string }
  | { genre: "revelation"; k: number; depuis: number; duree: number; tenue: number }
  | { genre: "fin"; duree: number };

/** La durée visée de l'épisode : un dixième de la session, entre 40 secondes et 4 minutes. */
export function dureeVisee(sessionS: number): number {
  return Math.round(borne(sessionS * 0.12, 40, 240));
}

export const dureeDuPlan = (plan: Bloc[]) => plan.reduce((s, b) => s + b.duree + (b.genre === "revelation" ? b.tenue : 0), 0);

/** Les choisis : le meilleur de chaque fenêtre de temps, pour que l'histoire avance ; complétés par les meilleurs restants. */
function choisir(candidats: (MorceauNote & { k: number })[], combien: number, jusqua: number): (MorceauNote & { k: number })[] {
  if (combien >= candidats.length) return [...candidats];
  const fenetre = Math.max(1, jusqua) / combien;
  const pris = new Set<number>();
  for (let i = 0; i < combien; i++) {
    const dedans = candidats.filter((m) => m.debut >= i * fenetre && m.debut < (i + 1) * fenetre && !pris.has(m.k));
    const meilleur = dedans.sort((a, b) => b.score - a.score)[0];
    if (meilleur) pris.add(meilleur.k);
  }
  for (const m of [...candidats].sort((a, b) => b.score - a.score)) {
    if (pris.size >= combien) break;
    pris.add(m.k);
  }
  return candidats.filter((m) => pris.has(m.k));
}

/**
 * LE PLAN : le titre ; puis, dans l'ordre du tournage, l'accéléré du temps qui
 * passe et un moment en vrai, l'un après l'autre ; la révélation (la fin de la
 * session, le produit fini, tenue un instant) ; la carte de fin.
 *
 * LA BANDE-ANNONCE accroche d'abord : le produit fini en deux secondes, puis
 * ses cinq meilleurs gestes, vite, et la révélation.
 *
 * `images` : les instants des images de l'accéléré.
 */
export function planDuMontage(o: { morceaux: MorceauNote[]; images: number[]; session: number; genre: GenreMontage }): Bloc[] {
  const tous = o.morceaux.map((m, k) => ({ ...m, k }));
  const derniere = tous[tous.length - 1];
  if (!derniere) return [];
  const candidats = tous.slice(0, -1).filter((m) => m.duree >= 2.2);
  const bande = o.genre === "bande";
  const momentDe = (m: MorceauNote) => Math.min(m.duree - 0.55, bande ? 2.8 : 5.2);
  const imagesEntre = (de: number, a: number) => o.images.filter((t) => t > de && t < a).length;
  const accelere = (de: number, a: number): Bloc | null => {
    const n = imagesEntre(de, a);
    if (n < 3) return null;
    const duree = Math.round(borne(n / 10, bande ? 0.9 : 1.2, bande ? 1.2 : 3.2) * 100) / 100;
    return { genre: "accelere", de, a, duree, vitesse: Math.max(2, Math.round((a - de) / duree)) };
  };
  const revelation: Bloc = {
    genre: "revelation",
    k: derniere.k,
    depuis: derniere.duree > 3 ? 0.35 : 0,
    duree: Math.max(0.8, Math.min(derniere.duree - 0.45, bande ? 3 : 5.5)),
    tenue: bande ? 1.8 : 2.4,
  };

  const construire = (choisis: (MorceauNote & { k: number })[]): Bloc[] => {
    const plan: Bloc[] = [{ genre: "titre", duree: bande ? 2.6 : TITRE_S }];
    if (bande && derniere.duree > 2.5) {
      // L'ACCROCHE : le produit fini d'abord — « comment il est né ? »
      plan.push({ genre: "moment", k: derniere.k, depuis: Math.max(0.35, derniere.duree - 2.6), duree: 2, heure: derniere.debut, legende: "Comment il est né ?" });
    }
    let fin = 0;
    choisis.forEach((m, i) => {
      const acc = accelere(fin, m.debut);
      if (acc) plan.push(acc);
      const legende = i === 0 ? "C’est parti !" : !bande && i === choisis.length - 1 && choisis.length >= 3 ? "Dernière ligne droite…" : undefined;
      plan.push({ genre: "moment", k: m.k, depuis: 0.35, duree: Math.round(momentDe(m) * 100) / 100, heure: m.debut, ...(legende ? { legende } : {}) });
      fin = m.debut + m.duree;
    });
    const acc = accelere(fin, derniere.debut);
    if (acc) plan.push(acc);
    plan.push(revelation, { genre: "fin", duree: FIN_S });
    return plan;
  };

  if (bande) {
    const meilleurs = [...candidats].sort((a, b) => b.score - a.score).slice(0, 5);
    return construire(meilleurs.sort((a, b) => a.debut - b.debut));
  }
  // L'ÉPISODE : autant de moments que la durée visée en laisse, répartis sur toute la session
  const vise = dureeVisee(o.session);
  for (let n = candidats.length; n >= 1; n--) {
    const plan = construire(choisir(candidats, n, derniere.debut));
    if (dureeDuPlan(plan) <= vise + 3 || n === 1) return plan;
  }
  return construire([]);
}

/* ═══ SA SÉRIE : SAISON ET NUMÉRO ═══════════════════════════════════════════ */

const cleSerie = (commerce: string) => `clikme-episodes:${commerce}`;

/** L'année à Paris : la saison de sa série. */
export const saisonDe = (d = new Date()) => Number(new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" }).format(d));

/** Le numéro du prochain épisode : un de plus que le dernier publié cette saison (gardé sur ce téléphone). */
export function prochainEpisode(commerce: string, d = new Date()): { saison: number; numero: number } {
  const saison = saisonDe(d);
  try {
    const s = JSON.parse(localStorage.getItem(cleSerie(commerce)) ?? "null") as { saison?: number; dernier?: number } | null;
    return { saison, numero: s?.saison === saison && Number.isFinite(s.dernier) ? (s.dernier ?? 0) + 1 : 1 };
  } catch {
    return { saison, numero: 1 };
  }
}

/** Il l'a publié : le suivant prendra le numéro d'après. */
export function retenirEpisode(commerce: string, saison: number, numero: number) {
  try {
    localStorage.setItem(cleSerie(commerce), JSON.stringify({ saison, dernier: numero }));
  } catch {
    /* navigation privée : le numéro repartira de 1 */
  }
}

/** Son titre dans Le Direct : 140 signes au plus. */
export function texteDeLEpisode(saison: number, numero: number, produit: string, prix: string): string {
  return `🎬 Saison ${saison} · Épisode ${numero} : ${produit.trim()}${prix.trim() ? ` · ${prix.trim()}` : ""}`.replace(/\s+/g, " ").slice(0, 140);
}

/** « 12 min », « 1 h 05 » : l'heure de la session, sur l'image. */
export function enDuree(s: number): string {
  const m = Math.floor(s / 60);
  if (m < 1) return `${Math.max(0, Math.round(s))} s`;
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}
