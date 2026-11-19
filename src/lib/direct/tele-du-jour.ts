/**
 * 📺 MA TÉLÉ DU JOUR (`docs/univers/decouvrir.md`, section 4.2 ; le lot D1) : chaque jour, les vidéos de mes passions —
 * les sélections de la nuit (`selection-serveur.ts`, le lot D0), mêlées selon mes poids, sans ce que j'ai déjà vu. Je
 * les regarde dans ma pièce (celle de Ma maison), la télé en grand écran : « ⏭ Suivante », « 📌 Garder » (elle va à la
 * télé de ma maison), « 📤 Envoyer à… » (un proche : elle passe sur la télé de notre duo).
 *
 * Les poids (un simple compte, pas d'IA) : regardée jusqu'au bout, +1 ; gardée, +2 ; passée avant 15 secondes, −1.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { IdTheme, VideoDuJour } from "./decouvrir";
import type { ImageSalon } from "./salon";
import type { ScenePiece } from "./ma-maison";

/** Une vidéo de ma télé du jour : celle de la sélection, et son thème. */
export type VideoTele = VideoDuJour & { theme: IdTheme };

/** Ce que l'écran reçoit. */
export type TeleDuJour = {
  /** mes passions (vide : « Tes passions » d'abord) */
  passions: IdTheme[];
  /** les vidéos qui m'attendent, dans l'ordre */
  videos: VideoTele[];
  /** déjà vues aujourd'hui (pour « 3 sur 24 ») */
  vuesAujourdhui: number;
  /** ma pièce (Ma maison), si je l'ai choisie ; ma figurine assise */
  scene: ScenePiece | null;
  figurine: ImageSalon | null;
  /** la sélection n'est pas encore faite (pas de clé YouTube, ou la première nuit n'est pas passée) */
  vide?: true;
};

export const TELE_DU_JOUR = {
  /** les vidéos envoyées à l'écran, au plus */
  max: 40,
  /** les vidéos vues dont on se souvient (les plus récentes) */
  vuesGardees: 400,
  /** passée avant ce nombre de secondes : « bof » */
  passeeAvant: 15,
  /** les poids, bornés */
  poidsMin: -5,
  poidsMax: 12,
} as const;

/** Le poids d'un thème, en part de la télé : 1 au départ, entre 0,3 et 3. */
export const partDuTheme = (poids: number | undefined) => Math.min(3, Math.max(0.3, 1 + (Number(poids) || 0) / 4));

/**
 * 🎛️ LE MÉLANGE : un « tourniquet pondéré » (chaque thème avance de sa part à chaque tour ; celui qui est le plus en
 * avance passe une vidéo, et recule du total). Les thèmes que je regarde le plus reviennent plus souvent, sans jamais
 * faire disparaître les autres ; le même ordre pour les mêmes poids. Sans doublon, sans ce que j'ai vu.
 */
export function melanger(listes: { theme: IdTheme; videos: VideoDuJour[] }[], poids: Record<string, number>, vues: ReadonlySet<string>, max: number = TELE_DU_JOUR.max): VideoTele[] {
  const restes = listes.map((l) => ({ theme: l.theme, part: partDuTheme(poids[l.theme]), file: l.videos.filter((v) => !vues.has(v.id)), avance: 0 }));
  const total = restes.reduce((a, r) => a + r.part, 0);
  const pris = new Set<string>();
  const sortie: VideoTele[] = [];
  while (sortie.length < max) {
    const vivants = restes.filter((r) => r.file.length);
    if (!vivants.length) break;
    for (const r of vivants) r.avance += r.part;
    const r = vivants.reduce((a, b) => (b.avance > a.avance ? b : a));
    r.avance -= total;
    const v = r.file.shift()!;
    if (pris.has(v.id)) continue;
    pris.add(v.id);
    sortie.push({ ...v, theme: r.theme });
  }
  return sortie;
}

/** Le nouveau poids d'un thème après une vidéo. */
export function nouveauPoids(avant: number | undefined, quoi: "fin" | "garde" | "passee"): number {
  const d = quoi === "garde" ? 2 : quoi === "fin" ? 1 : -1;
  return Math.min(TELE_DU_JOUR.poidsMax, Math.max(TELE_DU_JOUR.poidsMin, (Number(avant) || 0) + d));
}

/** « 4:05 », « 12:30 ». */
export function duree(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  return `${m}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;
}

export const PHRASES_TELE_DU_JOUR = {
  titre: "Ma télé du jour",
  attendent: (n: number) => (n > 1 ? `🎬 ${n} vidéos t’attendent` : n === 1 ? "🎬 Une vidéo t’attend" : "🎬 Tu as tout vu"),
  allumer: "▶ Allumer la télé",
  suivante: "⏭ Suivante",
  garder: "📌 Garder",
  gardee: "📌 Gardée : elle est à la télé de ta maison",
  dejaGardee: "📌 Déjà chez toi",
  envoyer: "📤 Envoyer à…",
  envoyerA: "À qui l’envoyer ?",
  envoyee: (prenom: string) => `📤 Envoyée à ${prenom} : elle passe sur votre télé`,
  pasDeProche: "Ajoute d’abord un proche : vous pourrez vous envoyer des vidéos.",
  voirPiece: "🛋️ Voir la pièce",
  grandEcran: "⛶ Grand écran",
  surYouTube: "▶ La regarder sur YouTube",
  illisible: "Celle-ci ne se lit pas ici : la suivante arrive.",
  fini: "Tu as tout vu pour aujourd’hui.",
  demain: "Ta télé se remplit chaque nuit : reviens demain.",
  bientot: "Ta télé s’allume bientôt : les vidéos du jour arrivent chaque nuit.",
  passions: "Tes passions",
  maisons: "🏡 Les maisons à visiter",
  annuler: "Annuler",
} as const;
