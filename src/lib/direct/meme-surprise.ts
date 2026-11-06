/**
 * 🎲 « SURPRENDS-MOI ! » — 7 novembre 2026 (le patron : « laisser la possibilité de créer un mème automatiquement en
 * fonction de ses traits de personnalité : c'est ClikMe qui le crée en appuyant sur “Surprends-moi !” »).
 *
 * Un toucher : ClikMe écrit SON mème, d'après sa carte de personnage (ses réponses, ce qu'il aime, sa façon de parler,
 * sa phrase fétiche) — jamais d'après ce qu'il a confié à sa figurine (« ce que ta figurine sait de toi ») : un mème
 * part chez d'autres. Il le lit, « 🎲 Encore » ou « C'est moi ✓ » : sa figurine ne le dit (la voix n'est fabriquée)
 * qu'une fois qu'il l'a choisi — c'est bien lui qui le lui fait dire (l'exception des voix, `CLAUDE.md`).
 *
 * L'IA l'écrit (`meme-surprise-serveur.ts`) ; sinon — pas de clé, une réponse qui dérape, ou ses tirages du jour
 * passés — une réplique de la réserve ci-dessous, choisie d'après sa carte (sans carte : les répliques pour tous).
 *
 * DES PHRASES QUI VONT À TOUT LE MONDE : celui qui parle, c'est « je » — jamais un accord au masculin ou au féminin
 * pour lui (« content », « prêt »…) : on ne devine jamais le genre. Rien d'alcoolisé (la loi Évin), rien sur le corps,
 * l'âge, la santé, l'argent ; aucune personne réelle, aucun commerce ni prix.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { CleGout, Reponses } from "./personnage";
import type { Sentiment } from "./ma-figurine";

/** Ce que ClikMe lui propose. `carte` : il a sa carte de personnage (sinon, on l'invite à la faire). */
export type Surprise = { texte: string; sentiment: Sentiment; danse: boolean; par: "ia" | "local"; carte: boolean };
type Replique = { texte: string; sentiment: Sentiment; danse?: boolean };

/** Les tirages écrits par l'IA, par jour (chacun coûte un appel) ; au-delà, la réserve. Et un plafond, tout compris. */
export const SURPRISES_IA_PAR_JOUR = 10;
export const SURPRISES_PAR_JOUR = 40;
/** Un mème court : il se dit en quelques secondes. */
export const SURPRISE_MAX = 120;

// ─── la réserve, d'après sa carte ────────────────────────────────────────────────────────────────
/** D'après ses réponses au questionnaire de sa carte (`personnage.ts` : `QUESTIONS`). */
const PAR_REPONSE: Record<keyof Reponses, Record<"a" | "b", Replique[]>> = {
  ton: {
    a: [
      { texte: "J’ai une blague pour toi, mais je la garde pour ce soir. Prépare-toi, c’est du lourd.", sentiment: "rire" },
      { texte: "Ma mission du jour : te faire rire au moins une fois. C’est fait ? Non ? J’insiste.", sentiment: "grimace" },
      { texte: "Je ne fais pas le clown. Je fais du spectacle vivant. Nuance.", sentiment: "grimace" },
    ],
    b: [
      { texte: "Je suis quelqu’un de sérieux. Très sérieux. Sauf là, maintenant.", sentiment: "grimace" },
      { texte: "Réunion importante avec moi-même : j’ai décidé de t’envoyer ce mème. Vote à l’unanimité.", sentiment: "joie" },
    ],
  },
  jeu: {
    a: [
      { texte: "Je n’ai pas perdu. J’ai laissé gagner. Nuance.", sentiment: "colere" },
      { texte: "Ce n’est pas de la mauvaise foi. C’est une autre version des faits.", sentiment: "grimace" },
      { texte: "Revanche. Ce soir. Et cette fois, c’est moi qui compte les points.", sentiment: "colere" },
    ],
    b: [
      { texte: "Gagner ? Bof. Moi, je joue pour l’ambiance. Et pour les gâteaux.", sentiment: "rire" },
      { texte: "J’ai perdu, mais avec le sourire. Ça, c’est la classe.", sentiment: "joie" },
    ],
  },
  sort: {
    a: [
      { texte: "Aujourd’hui, tout me réussit. Profites-en : demande-moi n’importe quoi.", sentiment: "euphorie", danse: true },
      { texte: "Ma bonne étoile m’a dit de t’écrire. Je ne discute jamais avec ma bonne étoile.", sentiment: "joie" },
    ],
    b: [
      { texte: "J’ai encore fait une gaffe. Je ne te dis pas laquelle. Tu le sauras bien assez tôt.", sentiment: "grimace" },
      { texte: "Petit bilan du jour : deux gaffes, un fou rire, zéro regret.", sentiment: "rire" },
    ],
  },
  elan: {
    a: [
      { texte: "J’ai une idée. Je ne sais pas encore laquelle, mais j’y vais.", sentiment: "euphorie", danse: true },
      { texte: "On y va ? Je ne sais pas où, mais on y va.", sentiment: "euphorie", danse: true },
    ],
    b: [
      { texte: "J’ai bien réfléchi. Longtemps. Très longtemps. Et ma réponse est : peut-être.", sentiment: "grimace" },
      { texte: "Je ne traîne pas. Je savoure chaque seconde.", sentiment: "joie" },
    ],
  },
  tete: {
    a: [{ texte: "Avant de t’écrire, j’ai fait trois brouillons. Celui-là, c’est le meilleur.", sentiment: "joie" }],
    b: [{ texte: "J’agis d’abord. Je réfléchirai demain. Peut-être.", sentiment: "rire" }],
  },
  gout: {
    a: [
      { texte: "Ma devise : il y a toujours de la place pour le dessert.", sentiment: "joie" },
      { texte: "Je ne mange pas de sucre. Je mange des gâteaux. Ce n’est pas pareil.", sentiment: "grimace" },
    ],
    b: [{ texte: "Le sucré, c’est bien. Mais le fromage, c’est la vie.", sentiment: "euphorie" }],
  },
  rythme: {
    a: [
      { texte: "Bonjour ! Oui, il est tôt. Non, je ne regrette rien.", sentiment: "euphorie" },
      { texte: "Debout avant le réveil. Encore. Je suis une légende.", sentiment: "euphorie", danse: true },
    ],
    b: [
      { texte: "Le matin, je n’existe pas. Reviens cet après-midi, je serai là.", sentiment: "tristesse" },
      { texte: "Il est tard, j’ai plein d’énergie, et personne pour en profiter. Sauf toi.", sentiment: "euphorie", danse: true },
    ],
  },
};

/** D'après ce qu'il aime (`GOUTS`). */
const PAR_GOUT: Record<CleGout, Replique[]> = {
  cuisine: [{ texte: "J’ai cuisiné. Ça ne ressemble à rien, mais c’est délicieux. Enfin… je crois.", sentiment: "rire" }],
  sport: [{ texte: "J’ai fait du sport aujourd’hui. Bon, j’en ai regardé. Ça compte.", sentiment: "grimace" }],
  musique: [{ texte: "J’ai une chanson dans la tête depuis ce matin. Maintenant, elle est dans la tienne. Avec plaisir.", sentiment: "euphorie", danse: true }],
  cinema: [{ texte: "Ce soir, un film. Toi, tu apportes le pop-corn. Moi, je commente tout.", sentiment: "joie" }],
  lecture: [{ texte: "Encore un chapitre. Juste un. Bon, trois. Il est deux heures du matin.", sentiment: "grimace" }],
  nature: [{ texte: "Une balade, du vent, des arbres : voilà mon idée du grand luxe.", sentiment: "joie" }],
  voyages: [{ texte: "Ma valise est faite. Ma destination, beaucoup moins.", sentiment: "rire" }],
  jeux: [{ texte: "Une partie ? Je te préviens : je ne perds jamais. Sauf quand je perds.", sentiment: "grimace" }],
  mode: [{ texte: "Ma tenue du jour mérite un défilé. Je te laisse applaudir.", sentiment: "euphorie", danse: true }],
  bricolage: [{ texte: "J’ai réparé un truc. Il me reste trois vis en trop. C’est normal ?", sentiment: "grimace" }],
  animaux: [{ texte: "Un chien m’a fait la fête dans la rue. Enfin quelqu’un qui me comprend.", sentiment: "joie" }],
  sorties: [{ texte: "Ce soir, on sort ? Je m’occupe de l’ambiance, toi du reste.", sentiment: "euphorie", danse: true }],
};

/** Sans carte : des répliques pour tout le monde. */
const POUR_TOUS: Replique[] = [
  { texte: "Aujourd’hui, ma figurine parle à ma place. Elle le fait mieux que moi.", sentiment: "joie" },
  { texte: "Je t’envoie ce mème au lieu de t’appeler. C’est plus mignon, avoue.", sentiment: "joie" },
  { texte: "Message important : rien. Je voulais juste te faire un coucou.", sentiment: "joie" },
  { texte: "Petite pause dans ma journée pour te dire que tu es une personne formidable.", sentiment: "euphorie" },
  { texte: "Ma figurine a plus de style que moi. Je ne sais pas comment le prendre.", sentiment: "grimace" },
  { texte: "Ce mème n’a aucun sens. C’est ce qui fait son charme.", sentiment: "rire" },
  { texte: "Tu as souri ? Parfait. Ma journée est réussie.", sentiment: "euphorie", danse: true },
  { texte: "J’avais un truc très important à te dire. J’ai oublié. Coucou quand même !", sentiment: "rire" },
];

/** Ce que sa carte lui ouvre dans la réserve (sans carte : les répliques pour tous). */
export function repliquesDe(carte: { reponses: Reponses; gouts: readonly CleGout[]; phrase?: string } | null): Replique[] {
  if (!carte) return POUR_TOUS;
  const l: Replique[] = [];
  for (const q of Object.keys(PAR_REPONSE) as (keyof Reponses)[]) l.push(...(PAR_REPONSE[q][carte.reponses[q]] ?? []));
  for (const g of carte.gouts) l.push(...(PAR_GOUT[g] ?? []));
  // (sa phrase fétiche : ses mots à lui, déjà relus quand il a fait sa carte)
  const phrase = (carte.phrase ?? "").trim().replace(/[.!?…\s]+$/, "");
  if (phrase && phrase.length <= SURPRISE_MAX - 30) l.push({ texte: `Comme je dis toujours : ${phrase} !`, sentiment: "euphorie" });
  return l;
}

/** Une réplique de la réserve, pas encore proposée (`sauf`) ; toutes déjà vues : on recommence. */
export function repliqueLocale(carte: Parameters<typeof repliquesDe>[0], sauf: readonly string[], hasard = Math.random): Replique {
  const toutes = repliquesDe(carte);
  const neuves = toutes.filter((r) => !sauf.includes(r.texte));
  const l = neuves.length ? neuves : toutes;
  return l[Math.floor(hasard() * l.length) % l.length];
}

// ─── ce que l'IA rend, relu ──────────────────────────────────────────────────────────────────────
const aPlat = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ");
/** Rien d'alcoolisé (la loi Évin). */
export const parleDAlcool = (t: string) =>
  /\b(alcools?|bieres?|vins?|aperos?|aperitifs?|cocktails?|champagnes?|whisky|vodka|rhum|tequila|ivres?|bourres?|picoler?|mojitos?|spritz|pinard|cuites?|gueule de bois)\b/.test(aPlat(t));
