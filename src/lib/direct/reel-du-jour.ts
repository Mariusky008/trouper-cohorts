/**
 * 🎞️ LE REEL DU JOUR — ce qui se décide sans téléphone (le dessin est dans `reel-montage.ts`).
 *
 * « Un tournage, deux vidéos » (le retour d'un testeur, 29 octobre — `docs/passation.md`, 5 ter) :
 * la longue (l'interview) pour sa page et Le Direct, et un Reel d'une dizaine de secondes, monté
 * tout seul des mêmes images, pour Instagram, TikTok et les Reels Facebook :
 *
 *   · L'ACCROCHE (`REEL.accroche`) : son plan le plus fort, la photo de son plat, en grand ;
 *   · SA PHRASE : une phrase qu'il a dite, avec sa voix et ses mots qui s'allument
 *     (`phraseDuReel` : celle qui nomme son plat ou son prix d'abord) — jamais une phrase écrite
 *     à sa place ;
 *   · L'APPEL (`REEL.appel`) : « LES 15 PREMIERS qui ouvrent ma cage dorée gagnent une surprise », avec
 *     le VRAI stock de ses surprises du jour (`appelDuReel` : sans surprise aujourd'hui, pas de chiffre
 *     inventé), la cage qui libère son fantôme, et le chemin.
 *
 * FICHIER PARTAGÉ (navigateur et essais) : aucun accès au téléphone ni à la base ici.
 */
import { motsDesSousTitres, type MotDit, type SousTitre } from "./interview-fantome";

/** Les temps du Reel, en secondes. Sa phrase dure ce qu'elle dure, entre `phraseMin` et `phraseMax`. */
export const REEL = { accroche: 2.4, appel: 3.3, phraseMin: 1.6, phraseMax: 4.8, accrocheSansPhrase: 4.2 } as const;

/** Sa phrase : la prise `k`, de `de` à `a` (en secondes depuis le début de la prise), et ses mots. */
export type PhraseDuReel = { k: number; de: number; a: number; mots: MotDit[] };

type PriseDuReel = {
  sousTitres: readonly SousTitre[];
  /** Sa réponse commence après la question du reporter : rien avant ne compte. */
  questionFin: number;
  coupe: number;
  /** Son son décodé : sans lui, sa voix ne peut pas être jouée de l'instant choisi. */
  audio: boolean;
  /** Ses hésitations (voir `interview-resserrer.ts`) : une phrase qui en contient une est laissée. */
  coupes?: readonly { de: number; a: number }[];
};

const finit = (m: string) => /[.!?…]$/.test(m);

/**
 * SA PHRASE LA PLUS FORTE, toutes réponses confondues : une phrase entière (de la ponctuation, ou d'un
 * silence, à la suivante), entre `phraseMin` et `phraseMax` secondes, sans hésitation dedans. Celle qui
 * nomme son plat ou son prix (`forts`) passe devant ; puis une exclamation ; puis la plus proche de
 * trois secondes et demie. Deux phrases courtes qui se suivent peuvent faire une phrase.
 * `null` : aucune ne va (pas de son, pas de mots) — le Reel se fait sans elle.
 */
export function phraseDuReel(prises: readonly PriseDuReel[], forts: ((mot: string) => boolean) | null): PhraseDuReel | null {
  let meilleure: (PhraseDuReel & { score: number }) | null = null;
  prises.forEach((p, k) => {
    if (!p.audio) return;
    const mots = motsDesSousTitres(p.sousTitres, forts).filter((w) => w.a >= p.questionFin - 0.05 && w.b <= p.coupe + 0.05);
    // LES PHRASES : coupées sur la ponctuation, ou sur un silence de plus d'une demi-seconde
    const phrases: MotDit[][] = [];
    let cur: MotDit[] = [];
    for (const w of mots) {
      const prev = cur[cur.length - 1];
      if (prev && (finit(prev.m) || w.a - prev.b > 0.55)) {
        phrases.push(cur);
        cur = [];
      }
      cur.push(w);
    }
    if (cur.length) phrases.push(cur);
    const essais = [...phrases, ...phrases.slice(0, -1).map((ph, i) => [...ph, ...phrases[i + 1]])];
    for (const ph of essais) {
      const de = ph[0].a;
      const a = ph[ph.length - 1].b;
      const duree = a - de;
      if (ph.length < 3 || duree < REEL.phraseMin || duree > REEL.phraseMax) continue;
      if ((p.coupes ?? []).some((c) => c.a > de + 0.05 && c.de < a - 0.05)) continue;
      const score = (ph.some((w) => w.fort) ? 10 : 0) + (/!$/.test(ph[ph.length - 1].m) ? 2 : 0) - Math.abs(duree - 3.5) - k * 0.1;
      if (!meilleure || score > meilleure.score) meilleure = { k, de, a, mots: ph, score };
    }
  });
  if (!meilleure) return null;
  const { k, de, a, mots } = meilleure;
  return { k, de: Math.max(0, de - 0.12), a: a + 0.25, mots };
}

/** La durée du Reel : l'accroche, sa phrase (s'il y en a une), l'appel. */
export const dureeDuReel = (phrase: PhraseDuReel | null) => (phrase ? REEL.accroche + (phrase.a - phrase.de) : REEL.accrocheSansPhrase) + REEL.appel;

/** L'appel, prêt à dessiner : la petite étiquette rose, les lignes en géant (`accent` en rose), la phrase dessous. */
export type AppelDuReel = { cage: boolean; etiquette: string; lignes: string[]; accent: string | null; sous: string; bas: string };

/**
 * L'APPEL DE LA FIN, comme une carte de question de l'interview. `surprises` : ce qu'il reste VRAIMENT dans
 * sa cage dorée aujourd'hui — « LES 15 PREMIERS qui ouvrent ma cage dorée gagnent une surprise » : c'est la
 * règle (premier arrivé, premier servi), dite simplement. `null` ou 0 : pas de cage, pas de chiffre — son
 * fantôme invite dans la famille. `motCle` : seulement quand l'envoi automatique du lien en message privé est
 * branché sur son compte (« Écris FANTÔME en commentaire ») — sinon, sa bio.
 */
export function appelDuReel(o: { surprises: number | null; motCle?: string | null }): AppelDuReel {
  const n = Math.max(0, Math.floor(o.surprises ?? 0));
  const mot = o.motCle?.trim().toLocaleUpperCase("fr-FR");
  const bas = mot ? `Écris ${mot} en commentaire` : "Lien dans ma bio";
  if (n > 1) return { cage: true, etiquette: "LA SURPRISE DU CHEF", lignes: [`LES ${n}`, "PREMIERS"], accent: String(n), sous: "qui ouvrent ma cage dorée gagnent une surprise.", bas };
  if (n === 1) return { cage: true, etiquette: "LA SURPRISE DU CHEF", lignes: ["LE", "PREMIER"], accent: null, sous: "qui ouvre ma cage dorée gagne une surprise.", bas };
  return { cage: false, etiquette: "MA FAMILLE DE FANTÔMES", lignes: ["REJOINS", "LA FAMILLE"], accent: null, sous: "Libère ton fantôme : je te gâte !", bas };
}
