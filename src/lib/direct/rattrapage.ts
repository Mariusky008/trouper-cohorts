/**
 * ⏪ LE RATTRAPAGE D'UNE SÉANCE (`docs/univers/rattrapage.md`, 27 novembre 2026).
 *
 * Le propriétaire a raté la séance d'un groupe la veille au soir, et voulait quand même la voir : revoir la vidéo, voir
 * les réactions de ceux qui étaient là à leur seconde, réagir à son tour, et que le groupe le sache (« ⏪ vu en
 * rattrapage »). Maquette validée le 27 novembre 2026 : https://claude.ai/artifact/RkhHfxYRdXh9Mft4fXmyS2
 *
 * Une SÉANCE, c'est :
 *   · une fois d'un rendez-vous d'un groupe gardé (son salon, à l'heure : dix minutes avant, deux heures après) ;
 *   · ou l'essai d'une proposition (« 🎬 Essai »), pour ceux qui y sont entrés par « ▶ Entrer ».
 * Pendant la séance, chaque réaction et chaque mot est noté AVEC la vidéo et sa seconde (une « trace ») : c'est ce qui
 * permet de les rejouer plus tard. Une séance se rattrape pendant sept jours ; ensuite elle s'efface.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { ID_GROUPE, type PlaceGroupe } from "./groupes";

/** Une séance se rattrape pendant sept jours (décidé le 27 novembre 2026). */
export const RATTRAPAGE_JOURS = 7;
export const RATTRAPAGE_MS = RATTRAPAGE_JOURS * 24 * 3600_000;
/** Une vidéo d'une séance : jusqu'à six heures (une seconde au-delà n'a pas de sens). */
export const SECONDE_MAX = 6 * 3600;
/** Les traces lues pour une séance, au plus. */
export const TRACES_MAX = 400;

const ID_PROPOSITION = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const OCCURRENCE = /^\d{13}-(?:essai|[A-Za-z0-9_-]{1,8})$/;
export const ID_VIDEO_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

/**
 * La clé d'une séance : `<groupe>/<fois>-<rendez-vous, 6 signes>` pour un groupe, `<proposition>/<heure>-essai` pour un
 * essai. C'est aussi son chemin dans le seau, sous `groupes/seances/`.
 */
export const cleDuRdv = (gid: string, fois: number, rdv: string) => `${gid}/${Math.round(fois)}-${rdv.slice(-6)}`;
export const cleDeLEssai = (proposition: string, quand: number) => `${proposition}/${Math.round(quand)}-essai`;
export function cleSeanceValide(x: unknown): string | null {
  const c = String(x ?? "").trim();
  const [a, b, ...reste] = c.split("/");
  if (reste.length || !a || !b || !OCCURRENCE.test(b)) return null;
  if (b.endsWith("-essai") ? !ID_PROPOSITION.test(a) : !ID_GROUPE.test(a)) return null;
  return c;
}
/** Le groupe (ou la proposition) d'une séance, et son heure. */
export function partsDeLaSeance(cle: string): { groupe?: string; proposition?: string; quand: number } {
  const [a, b] = cle.split("/");
  const quand = Number(b.slice(0, 13)) || 0;
  return b.endsWith("-essai") ? { proposition: a, quand } : { groupe: a, quand };
}

/** Où est la vidéo, à l'instant d'une réaction : son identifiant YouTube et sa seconde. */
export type OuDansLaVideo = { video: string; t: number };
export function ouValide(x: unknown): OuDansLaVideo | null {
  const o = (x ?? {}) as { video?: unknown; t?: unknown };
  const video = String(o.video ?? "").trim();
  const t = Math.round(Number(o.t) * 10) / 10;
  return ID_VIDEO_YOUTUBE.test(video) && Number.isFinite(t) && t >= 0 && t <= SECONDE_MAX ? { video, t } : null;
}

/** Une réaction ou un mot de la séance, à sa seconde. `rattrapage` : laissé après coup (« ⏪ vu en rattrapage »). */
export type TraceSeance = {
  id: string;
  q: string;
  prenom: string;
  sorte: "reaction" | "texte";
  cle?: string;
  n?: number;
  texte?: string;
  video: string;
  t: number;
  le: number;
  rattrapage?: true;
};

/** Une vidéo passée pendant la séance. */
export type VideoDeLaSeance = { id: string; titre: string; chaine: string; duree: number };

/** Une séance, vue de la liste (la page du groupe, la carte de l'essai). */
export type SeanceResumee = {
  cle: string;
  nom: string;
  e: string;
  quand: number;
  /** ceux qui étaient là */
  la: PlaceGroupe[];
  /** ceux qui l'ont rattrapée */
  rattrapee: PlaceGroupe[];
  /** j'y étais */
  jY?: true;
  /** le grand moment : l'émotion qui a fait réagir le plus de monde à la même seconde, et leurs têtes (jamais un nombre) */
  moment?: { cle: string; video: string; t: number; qui: PlaceGroupe[] };
};

/** Une séance, à rattraper : tout ce qu'il faut pour la rejouer. */
export type SeanceARattraper = SeanceResumee & {
  videos: VideoDeLaSeance[];
  traces: TraceSeance[];
  /** les figurines de ceux qui ont laissé une trace (pour qu'elles prennent la scène) */
  figurines: Record<string, string>;
  /** ceux qui auraient pu être là et n'y étaient pas (les membres du groupe ; les places de l'essai) — sans moi */
  absents: PlaceGroupe[];
  /** moi (ma figurine s'allume dans le salon en rattrapage) */
  moi: PlaceGroupe;
};

/** Le temps lisible d'une seconde de vidéo : « 2:15 », « 1:02:05 ». */
export function aLaSeconde(t: number): string {
  const x = Math.max(0, Math.floor(t));
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  const sec = String(x % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Le grand moment d'une séance : les réactions groupées par émotion et par tranche de cinq secondes. */
export function grandMoment(traces: readonly TraceSeance[]): { cle: string; video: string; t: number; qui: string[] } | undefined {
  const par = new Map<string, { cle: string; video: string; t: number; qui: Set<string> }>();
  for (const x of traces) {
    if (x.sorte !== "reaction" || !x.cle || x.rattrapage) continue;
    const k = `${x.video}:${x.cle}:${Math.floor(x.t / 5)}`;
    const m = par.get(k) ?? { cle: x.cle, video: x.video, t: x.t, qui: new Set<string>() };
    m.qui.add(x.q);
    m.t = Math.min(m.t, x.t);
    par.set(k, m);
  }
  const l = [...par.values()].sort((a, b) => b.qui.size - a.qui.size || a.t - b.t);
  return l[0] ? { cle: l[0].cle, video: l[0].video, t: l[0].t, qui: [...l[0].qui] } : undefined;
}

/** (lot T3) Réagir en décalé : pas plus d'une réaction ou d'un mot toutes les secondes et demie, douze par minute. */
export const ECART_RATTRAPAGE_MS = 1500;
export const PAR_MINUTE_RATTRAPAGE = 12;

export const PHRASES_RATTRAPAGE = {
  absente: "Cette séance n’existe plus.",
  quelleReaction: "Quelle réaction ?",
  pasCetteVideo: "Cette vidéo n’est pas celle de la séance.",
  doucement: "Doucement 🙂 Un à la fois.",
  vide: "Écris quelque chose d’abord.",
  refus: (pourquoi: string) => `Ça ne passe pas : ${pourquoi}.`,
  ajoute: (e: string, t: string) => `Ton ${e} est ajouté à la séance, à ${t}. Le groupe le verra.`,
  ajouteMot: (t: string) => `Ton mot est ajouté à la séance, à ${t}. Le groupe le verra.`,
  pasLa: "Cette séance est celle d’un groupe.",
  passee: "Cette séance date de plus de sept jours.",
} as const;
