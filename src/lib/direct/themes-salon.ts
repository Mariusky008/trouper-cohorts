// 🌍 LES SUJETS D'UN SALON PUBLIC OUVERT CHEZ UN COMMERÇANT.
//
// « Sur la page commerçant, il faudrait que je puisse ouvrir un salon public
// si j'en ai envie — et ce salon irait aussi sur l'app, dans les salons
// publics. Ce bouton m'ouvre le salon, et je dois choisir une thématique en
// lien avec le commerçant chez qui je suis. »
//
// UNE LISTE PAR MÉTIER, PAS UN TITRE LIBRE D'ABORD. Un salon public se lit par
// toute la ville : un titre libre ouvre la porte aux salons hors sujet et aux
// insultes en vitrine. Quatre sujets qui parlent de CE commerce, plus « Autre… »
// pour ce que la liste n'a pas prévu — court, et sous la modération des salons
// (signaler, masquer).
//
// LA CLÉ EST CE QUI REND LE SALON UNIQUE : un sujet, chez un commerce, un seul
// salon. Si quelqu'un l'a déjà ouvert, on le rejoint au lieu d'en ouvrir un
// second — sinon dix salons d'une personne au lieu d'un de dix.
//
// FICHIER PARTAGÉ : aucune dépendance au serveur.
import type { PieceDuJour } from "@/lib/direct/piece-du-jour";

export type ThemeSalon = {
  /** Unique chez un commerce : `coupe`, `avis`, `jour-<pièce>`, `autre-<mots>`. */
  cle: string;
  emoji: string;
  /** Le sujet du salon, tel qu'il s'affiche partout. */
  titre: string;
  /** La première phrase proposée dans le salon vide — à envoyer telle quelle, ou à changer. */
  amorce?: string;
  /** La pièce du jour : sa photo et son nom vont sur la table du salon. */
  photo?: string;
  annonce?: string;
  prix?: string;
};

type Ligne = [cle: string, emoji: string, titre: string, amorce: string];

/** Les sujets de chaque métier. `{nom}` devient le nom du commerce. */
const PAR_METIER: Record<string, Ligne[]> = {
  coiffeur: [
    ["coupe", "💇", "Quelle coupe me conseillez-vous ?", "J’ai envie de changer de coupe : vous me conseillez quoi ?"],
    ["avant-apres", "✨", "Mes avant/après chez {nom}", "Voici mon avant/après chez {nom} :"],
    ["couleurs", "🎨", "Couleurs et mèches : vos idées", "Je pense à une nouvelle couleur, vous avez des idées ?"],
  ],
  ongles: [
    ["pose", "💅", "Quelle pose pour cette saison ?", "Je cherche une pose pour la saison, des idées ?"],
    ["mes-poses", "✨", "Mes poses chez {nom}", "Ma dernière pose chez {nom} :"],
    ["nail-art", "🎨", "Couleurs et nail art : vos idées", "Vous avez des idées de nail art ?"],
  ],
  mode: [
    ["porter", "👗", "Avec quoi le porter ?", "Avec quoi vous le porteriez ?"],
    ["essayages", "✨", "Mes essayages chez {nom}", "Mes essayages chez {nom}, vous en pensez quoi ?"],
    ["nouveautes", "🆕", "Les nouveautés de la semaine", "Vous avez vu ce qui vient d’arriver ?"],
  ],
  lunetier: [
    ["monture", "👓", "Quelle monture me va ?", "J’hésite entre plusieurs montures, vous me conseillez quoi ?"],
    ["essais", "✨", "Mes essais chez {nom}", "Mes essais chez {nom}, vous en pensez quoi ?"],
    ["nouveautes", "🆕", "Les nouvelles montures", "Vous avez vu les nouvelles montures ?"],
  ],
  fleuriste: [
    ["occasion", "💐", "Quel bouquet pour quelle occasion ?", "Je cherche un bouquet pour une occasion, des idées ?"],
    ["saison", "🌷", "Les fleurs de la saison", "Quelles fleurs vous plaisent en ce moment ?"],
    ["cadeaux", "🎁", "Idées de cadeaux", "Une idée de cadeau à me souffler ?"],
  ],
  restaurant: [
    ["plat-du-jour", "🍽️", "Le plat du jour, ça vaut le coup ?", "Quelqu’un a goûté le plat du jour ?"],
    ["ensemble", "🙋", "On y va ensemble ?", "Ça vous dit qu’on y aille ensemble ?"],
    ["preferes", "⭐", "Vos plats préférés chez {nom}", "Qu’est-ce que vous prenez, vous, ici ?"],
  ],
  bar: [
    ["ce-soir", "🍸", "On s’y retrouve ce soir ?", "On s’y retrouve ce soir ?"],
    ["soirees", "🎶", "Les soirées à venir", "Vous savez ce qui se prépare ?"],
    ["verres", "🍷", "Vos verres préférés chez {nom}", "Qu’est-ce que vous buvez, vous, ici ?"],
  ],
  librairie: [
    ["lectures", "📚", "Qu’est-ce que vous lisez en ce moment ?", "Vous lisez quoi en ce moment ?"],
    ["coups-de-coeur", "💡", "Vos coups de cœur de chez {nom}", "Votre dernier coup de cœur de chez {nom} ?"],
    ["offrir", "🎁", "Des livres à offrir", "Je cherche un livre à offrir, des idées ?"],
  ],
  artisan: [
    ["creations", "✨", "Vos créations préférées chez {nom}", "Laquelle de ses créations vous préférez ?"],
    ["cadeaux", "🎁", "Idées de cadeaux", "Une idée de cadeau à me souffler ?"],
    ["sur-mesure", "🛠️", "Une idée de pièce sur mesure ?", "J’ai une idée de pièce sur mesure, vous en pensez quoi ?"],
  ],
};

/** Le dernier de chaque liste, pour tous : ce qu'on pense du lieu. */
const AVIS: Ligne = ["avis", "💬", "Vos avis sur {nom}", "Vous en pensez quoi, de {nom} ?"];

/**
 * LES SUJETS PROPOSÉS CHEZ CE COMMERCE. Sa pièce du jour d'abord, quand il en a
 * publié une — c'est ce qui se passe chez lui aujourd'hui —, puis ceux de son
 * métier, puis les avis.
 */
export function themesDuLieu(c: { branche: string; nom: string }, jour?: PieceDuJour | null): ThemeSalon[] {
  const nommer = (t: string) => t.replace("{nom}", c.nom);
  const lignes = [...(PAR_METIER[c.branche] ?? PAR_METIER.artisan), AVIS];
  return [
    ...(jour
      ? [
          {
            cle: `jour-${jour.article.id}`.slice(0, 60),
            emoji: "🌟",
            titre: `${jour.article.nom} : vous en pensez quoi ?`,
            amorce: `Vous en pensez quoi, de « ${jour.article.nom} » ?`,
            photo: jour.article.photo,
            annonce: jour.article.nom,
            ...(jour.article.prix ? { prix: jour.article.prix } : {}),
          },
        ]
      : []),
    ...lignes.map(([cle, emoji, titre, amorce]) => ({ cle, emoji, titre: nommer(titre), amorce: nommer(amorce) })),
  ];
}

/** « Autre… » : le sujet qu'il a écrit, et une clé tirée de ses mots — deux fois le même sujet, un seul salon. */
export function themeLibre(texte: string): ThemeSalon | null {
  const titre = texte.replace(/\s+/g, " ").trim().slice(0, 60);
  if (titre.length < 3) return null;
  const mots = titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return mots ? { cle: `autre-${mots}`, emoji: "💬", titre } : null;
}
