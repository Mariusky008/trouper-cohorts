/**
 * 🎵 LE SALON MUSIQUE (`docs/univers/decouvrir.md`, section 36 ; le lot M1, 22 novembre 2026) : ce qui ne dépend pas du
 * serveur.
 *
 * Le propriétaire : « il faut que ce soit un salon dédié seulement à la musique, où les gens peuvent proposer des
 * musiques, et quand il n'y en a pas, il y a automatiquement des clips qui passent, qu'on peut écouter avec les autres. »
 *
 * Le salon de la musique (le thème `musique` des salons par passion) a **sa platine** : le morceau qui passe (à la même
 * seconde pour tous), et **la file** des morceaux proposés — un seul par personne, les ❤️ des présents font monter les
 * leurs. La file vide : **la radio du salon** (la sélection du jour, en boucle, comme la télé des autres salons).
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { VideoSalon } from "./salons-ouverts";
import type { IdTheme } from "./decouvrir";

/** Le salon où la platine tourne. */
export const THEME_MUSIQUE: IdTheme = "musique";
export const estSalonMusique = (theme: IdTheme | undefined | null) => theme === THEME_MUSIQUE;

/** La file : dix morceaux au plus ; de 30 secondes à 15 minutes ; sans durée connue (YouTube muet), trois minutes et demie. */
export const PLATINE = { fileMax: 10, dureeMin: 30, dureeMax: 15 * 60, dureeParDefaut: 210, lienMax: 300 } as const;

/** Un morceau proposé : la vidéo, qui (`q`, son prénom), quand, et les ❤️ des présents (leurs `q`). */
export type PropositionMorceau = { video: VideoSalon; q: string; prenom: string; le: number; coeurs: string[] };
/** Celui qui passe : parti à `depart` (ms, l'heure du serveur). */
export type MorceauEnCours = PropositionMorceau & { depart: number };
/** Ce qui est écrit sur le salon (`platine.json`). `n` : change à chaque morceau (le téléphone sait qu'il faut changer). */
export type PlatineSalon = { enCours?: MorceauEnCours; file: PropositionMorceau[]; n: number; dernier?: { q: string; prenom: string; titre: string; fin: number } };

const dureeDe = (v: VideoSalon) => (v.duree >= PLATINE.dureeMin ? v.duree : PLATINE.dureeParDefaut);
/** La fin d'un morceau (ms). */
export const finDuMorceau = (m: MorceauEnCours) => m.depart + dureeDe(m.video) * 1000;
/** Où en est le morceau qui passe (secondes). */
export const positionMorceau = (m: MorceauEnCours, ms: number) => Math.max(0, Math.min(dureeDe(m.video), (ms - m.depart) / 1000));

/** La file dans l'ordre où elle passera : le plus aimé d'abord, à égalité le plus ancien. */
export const fileDansLOrdre = (file: readonly PropositionMorceau[]) => [...file].sort((a, b) => b.coeurs.length - a.coeurs.length || a.le - b.le);

/**
 * ⏭️ LA PLATINE À L'HEURE : le morceau fini laisse la place au premier de la file, parti à la fin du précédent (s'il vient
 * de finir) ou maintenant (si personne ne l'a vu finir depuis longtemps) ; la file vide, plus rien ne passe (la radio).
 * Rend la platine telle quelle si rien n'a bougé.
 */
export function platineALHeure(p: PlatineSalon, maintenant: number): PlatineSalon {
  let x = p;
  for (let tour = 0; tour < PLATINE.fileMax + 1; tour++) {
    if (x.enCours && finDuMorceau(x.enCours) > maintenant) return x;
    const fin = x.enCours ? finDuMorceau(x.enCours) : maintenant;
    const dernier = x.enCours ? { q: x.enCours.q, prenom: x.enCours.prenom, titre: x.enCours.video.titre, fin } : x.dernier;
    const [suivant, ...reste] = fileDansLOrdre(x.file);
    if (!suivant) return x.enCours ? { file: [], n: x.n + 1, ...(dernier ? { dernier } : {}) } : x;
    // (fini il y a moins de dix secondes : le suivant part à sa fin, pour tous pareil ; sinon, maintenant)
    const depart = maintenant - fin < 10_000 ? fin : maintenant;
    x = { enCours: { ...suivant, depart }, file: reste, n: x.n + 1, ...(dernier ? { dernier } : {}) };
  }
  return x;
}

/** Ce que le téléphone reçoit : le morceau qui passe (sans les `q` des cœurs), la file dans l'ordre, et le dernier fini. */
export type MorceauVu = { video: VideoSalon; q: string; prenom: string; coeurs: number; aime: boolean; mien: boolean };
export type PlatineVue = { enCours?: MorceauVu & { depart: number }; file: MorceauVu[]; n: number; dernier?: { q: string; prenom: string; titre: string; fin: number }; maPlace?: number };
export function vueDeLaPlatine(p: PlatineSalon, moi: string): PlatineVue {
  const vu = (m: PropositionMorceau): MorceauVu => ({ video: m.video, q: m.q, prenom: m.prenom, coeurs: m.coeurs.length, aime: m.coeurs.includes(moi), mien: m.q === moi });
  const file = fileDansLOrdre(p.file).map(vu);
  const k = file.findIndex((m) => m.mien);
  return { ...(p.enCours ? { enCours: { ...vu(p.enCours), depart: p.enCours.depart } } : {}), file, n: p.n, ...(p.dernier ? { dernier: p.dernier } : {}), ...(k >= 0 ? { maPlace: k + 1 } : {}) };
}

/**
 * 💃 RÉAGIR EN MUSIQUE : dans le salon musique, les réactions de la barre (« J'adore » et « Rire » restent) ; 💃 fait
 * danser sa figurine, 🎶 la fait chanter (une note au-dessus d'elle), quelques secondes, chez tout le monde.
 */
export const REACTIONS_MUSIQUE = [
  { cle: "feu", e: "🔥", nom: "Ça brûle" },
  { cle: "chante", e: "🎶", nom: "Je chante" },
  { cle: "danse", e: "💃", nom: "Je danse" },
  { cle: "coeur", e: "❤️", nom: "J’adore" },
  { cle: "rire", e: "😂", nom: "Rire" },
] as const;
export const reactionMusiqueDe = (x: unknown) => REACTIONS_MUSIQUE.find((r) => r.cle === x);

export const PHRASES_PLATINE = {
  info: "🎵 Un morceau proposé passe pour tout le salon, à la même seconde ; sinon, la radio du salon",
  proposer: "🎵 Proposer un morceau",
  proposerSuivant: "🎵 Proposer le suivant",
  titreFeuille: "Proposer un morceau",
  chapo: "Il passe pour tout le salon, à la même seconde. Un seul morceau à la fois par personne dans la file.",
  lien: "Un lien YouTube",
  lienAide: "Colle le lien d’un clip ou d’un morceau",
  ouRadio: "Ou un clip de la radio du jour",
  envoyer: "Le proposer",
  choix: (prenom: string) => `🎵 Le choix de ${prenom}`,
  monChoix: "🎵 Ton choix",
  radio: "📻 La radio du salon",
  aSuivre: "À suivre",
  maPlace: (n: number) => (n === 1 ? "Ton morceau passe juste après" : `Ton morceau est ${n}ᵉ dans la file`),
  cetait: (prenom: string) => `C’était le choix de ${prenom}`,
  voirFiche: "Voir sa fiche",
  propose: (titre: string) => `🎵 « ${titre} » est dans la file`,
  partTout: (titre: string) => `🎵 « ${titre} » part maintenant`,
  dejaUn: "Ton morceau est déjà dans la file : il passera bientôt.",
  filePleine: "La file est pleine : réessaie après le prochain morceau.",
  pasYouTube: "Ce lien n’est pas une vidéo YouTube.",
  pasIci: "Ce morceau ne peut pas passer ici.",
  tropLong: "Un morceau de 30 secondes à 15 minutes.",
  pasMusique: "La platine tourne seulement dans le salon de la musique.",
  retirer: "Retirer",
  aimer: "Faire monter ce morceau",
};
