/**
 * ✨ LES MÈMES PRÊTS À PARTIR — 6 novembre 2026 (« des mèmes prêts pour chaque occasion, pour supprimer la page
 * blanche ; on choisit, on touche, c'est parti ; et un mème du jour qui change chaque matin ») : un toucher écrit le
 * texte, choisit le visage (et la danse), et sa figurine le dit aussitôt. Les fêtes ne viennent qu'à leur moment (la
 * semaine d'avant) ; le lundi a le sien, le vendredi aussi.
 *
 * DES PHRASES QUI VONT À TOUT LE MONDE : jamais un accord au masculin ou au féminin pour celui qui parle (« fier »,
 * « réveillé »…) — on ne devine jamais le genre. Rien d'alcoolisé (la loi Évin).
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import type { Sentiment } from "./ma-figurine";

export type MemePret = { cle: string; emoji: string; nom: string; texte: string; sentiment?: Sentiment; danse?: boolean };

/** Toujours là. */
const TOUJOURS: MemePret[] = [
  { cle: "anniv", emoji: "🎂", nom: "Joyeux anniversaire", texte: "Joyeux anniversaire ! Un an de plus, et toujours aussi canon. Bon, presque.", sentiment: "euphorie", danse: true },
  { cle: "retard", emoji: "⏰", nom: "J’arrive en retard", texte: "J’arrive ! Enfin… je pars. Enfin… je cherche mes clés.", sentiment: "grimace" },
  { cle: "desole", emoji: "🙏", nom: "Pardon", texte: "Pardon, pardon, pardon. Je t’offre un café et on n’en parle plus ?", sentiment: "tristesse" },
  { cle: "bravo", emoji: "👏", nom: "Bravo", texte: "Bravo ! Quelle classe. Je vais le raconter à tout le monde.", sentiment: "euphorie" },
  { cle: "merci", emoji: "💛", nom: "Merci", texte: "Merci ! Sérieusement, tu es une personne en or.", sentiment: "joie" },
  { cle: "bonne-nuit", emoji: "🌙", nom: "Bonne nuit", texte: "Bonne nuit ! Dors bien, et ne rêve pas trop de moi.", sentiment: "joie" },
  { cle: "manque", emoji: "🥺", nom: "Tu me manques", texte: "Tu me manques. Voilà, c’est dit. On se voit quand ?", sentiment: "tristesse" },
  { cle: "je-t-aime", emoji: "😍", nom: "Je t’aime", texte: "Je t’aime. Voilà, c’est dit. Et ma figurine est tout à fait d’accord.", sentiment: "amour" },
  { cle: "fou-rire", emoji: "😂", nom: "Fou rire", texte: "Non mais attends… j’en peux plus. Arrête, j’ai mal aux joues.", sentiment: "rire" },
];

/** Selon le jour de la semaine (0 : dimanche). */
const SEMAINE: Record<number, MemePret> = {
  1: { cle: "lundi", emoji: "😴", nom: "Lundi matin", texte: "Lundi matin. Mon corps est là. Mon cerveau arrive mardi.", sentiment: "grimace" },
  5: { cle: "vendredi", emoji: "🎉", nom: "Vivement le week-end", texte: "Plus que quelques heures avant le week-end. Je compte les minutes. Et les secondes.", sentiment: "euphorie", danse: true },
  6: { cle: "samedi", emoji: "🕺", nom: "C’est le week-end", texte: "C’est le week-end ! Aujourd’hui, mon seul objectif : ne rien faire. Et le faire bien.", sentiment: "joie", danse: true },
};

/** Les fêtes : leur jour (MM-JJ), à partir de la semaine d'avant. */
const FETES: { jour: string; meme: MemePret }[] = [
  { jour: "01-01", meme: { cle: "bonne-annee", emoji: "🎆", nom: "Bonne année", texte: "Bonne année ! Cette année, c’est décidé : je deviens une meilleure version de moi. Dès demain.", sentiment: "euphorie", danse: true } },
  { jour: "02-14", meme: { cle: "saint-valentin", emoji: "💘", nom: "Saint-Valentin", texte: "Joyeuse Saint-Valentin ! Je t’aurais bien offert des fleurs, mais je t’offre ma figurine. C’est mieux.", sentiment: "amour" } },
  { jour: "05-31", meme: { cle: "fete-des-meres", emoji: "💐", nom: "Fête des mères", texte: "Bonne fête maman ! Merci pour tout. Surtout pour moi.", sentiment: "joie" } },
  { jour: "06-21", meme: { cle: "musique", emoji: "🎶", nom: "Fête de la musique", texte: "C’est la fête de la musique ! Écoute bien… voilà. C’était mon plus beau concert.", sentiment: "euphorie", danse: true } },
  { jour: "10-31", meme: { cle: "halloween", emoji: "🎃", nom: "Halloween", texte: "Bouh ! Je t’ai fait peur ? Non ? Bon. Donne-moi quand même des bonbons.", sentiment: "grimace" } },
  { jour: "12-25", meme: { cle: "noel", emoji: "🎄", nom: "Joyeux Noël", texte: "Joyeux Noël ! J’ai été très sage cette année. Enfin… presque.", sentiment: "euphorie", danse: true } },
];

/** Le mème du jour : une phrase qui change chaque matin (la même pour tout le monde ce jour-là). */
const DU_JOUR: { texte: string; sentiment?: Sentiment; danse?: boolean }[] = [
  { texte: "Aujourd’hui, j’ai décidé de tout faire. Enfin… demain plutôt.", sentiment: "grimace" },
  { texte: "Je ne suis pas en retard. C’est le reste du monde qui est en avance.", sentiment: "joie" },
  { texte: "J’ai fait du sport aujourd’hui. J’ai couru… après le bus.", sentiment: "rire" },
  { texte: "Mon plat préféré ? Celui qu’on me cuisine.", sentiment: "joie" },
  { texte: "Petit rappel du jour : tu es une personne géniale. Voilà. Tu peux reprendre ta journée.", sentiment: "euphorie" },
  { texte: "Je ne me parle pas à moi-même. Je fais une réunion d’équipe.", sentiment: "grimace" },
  { texte: "J’ai rangé ma chambre. Enfin… j’ai fermé la porte.", sentiment: "rire" },
  { texte: "Aujourd’hui, je danse. Pourquoi ? Pourquoi pas.", sentiment: "euphorie", danse: true },
  { texte: "Mon téléphone est à cinq pour cent. Moi aussi.", sentiment: "tristesse" },
  { texte: "Café d’abord. Les questions après.", sentiment: "colere" },
  { texte: "J’ai voulu garder mon sérieux cinq minutes. Record : trente secondes.", sentiment: "rire" },
  { texte: "Si tu reçois ce message, c’est que tu fais partie de mes personnes préférées.", sentiment: "joie" },
  { texte: "Je ne manque pas de motivation. Je suis en mode économie d’énergie.", sentiment: "grimace" },
  { texte: "Aujourd’hui, mon super-pouvoir : trouver une place pour me garer du premier coup.", sentiment: "euphorie" },
];

const hachage = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** « 2026-11-06 » (heure de Paris). */
const jourParis = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

/** Les mèmes prêts du moment : le mème du jour, la fête qui approche, le jour de la semaine, puis les autres. */
export function memesDuMoment(d = new Date()): MemePret[] {
  const jour = jourParis(d);
  const l = DU_JOUR[hachage(jour) % DU_JOUR.length];
  const duJour: MemePret = { cle: "du-jour", emoji: "🔥", nom: "Le mème du jour", texte: l.texte, ...(l.sentiment ? { sentiment: l.sentiment } : {}), ...(l.danse ? { danse: true } : {}) };
  // (une fête : la semaine d'avant, et le jour même)
  const an = Number(jour.slice(0, 4));
  const t = new Date(`${jour}T12:00:00Z`).getTime();
  const fetes = FETES.filter((f) => {
    for (const a of [an, an + 1]) {
      const ecart = (new Date(`${a}-${f.jour}T12:00:00Z`).getTime() - t) / 86_400_000;
      if (ecart >= 0 && ecart <= 7) return true;
    }
    return false;
  }).map((f) => f.meme);
  const semaine = SEMAINE[new Date(`${jour}T12:00:00Z`).getUTCDay()];
  return [duJour, ...fetes, ...(semaine ? [semaine] : []), ...TOUJOURS];
}

/** Son tout premier mème, déjà écrit (« le premier mème en moins de deux minutes »). */
export const PREMIER_MEME = "Salut ! C’est moi… en figurine. Avoue, je suis encore mieux en vrai.";
