// 🚧 LE PARCOURS QU'IL AURA — pour un commerce dont on n'a encore que la fiche
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « C'est l'ancien concept : pour les restaurants, les bars et les événements,
// le concept a évolué vers autre chose. L'app démo reprend bien les bons
// concepts mais la page commerçant est encore sur les anciens designs. "Qui est
// là" n'est plus d'actualité pour les restaurants : c'est un parcours en quatre
// étapes qui a été mis en place, et pour les bars, événements et sorties c'est
// un autre type de parcours. »
//
// IL A RAISON, ET LA CAUSE TIENT EN UNE LIGNE. La boutique choisit ce qu'elle
// montre d'après ce qu'elle TROUVE : `murDeLaCarte` cherche un avant-goût par
// l'identifiant du commerce, et un vrai restaurant entré depuis clikme.fr n'est
// dans aucune de ces tables. Faute d'avant-goût et faute de soirée, il tombait
// sur le dernier cas — le mur de présence, « Qui est là en ce moment ? » — dont
// ce dossier écrit lui-même qu'il est dépassé : « le mur de présence demandait
// d'être déjà convaincu ».
//
// ═══ ET ON NE FABRIQUE PAS L'AVANT-GOÛT QUI MANQUE ═════════════════════════
//
// LA TENTATION ÉTAIT D'EN COMPOSER UN depuis sa fiche : prendre sa première
// photo Google pour le plat, son métier pour l'accent, une phrase de chef
// écrite par nous. Ce serait exactement la faute que `carte-depuis-fiche.ts`
// refuse en tête de fichier — « une promesse attribuée à quelqu'un qui ne l'a
// pas faite, sur une page qui porte son nom » — et elle coûterait plus cher
// ici qu'ailleurs, parce que c'est SA page, qu'il la lit, et qu'il sait très
// bien qu'il n'a jamais dit ça.
//
// ON MONTRE DONC LE PARCOURS COMME UNE PROMESSE, PAS COMME UN CONTENU. Les
// quatre écrans sont nommés, chacun dit ce qu'il fera et ce qu'il attend de
// lui, et rien n'est présenté comme déjà rempli. C'est honnête, c'est raccord
// avec l'app — ce sont les mêmes écrans, dans le même ordre, avec les mêmes
// mots — et c'est le meilleur argument qu'on puisse lui faire : il voit
// exactement ce qu'il gagne en s'y mettant.
//
// ═══ ET C'EST UNE CONVERSATION, PLUS UNE PHOTO DE LA CARTE ═════════════════
//
// « On ne photographie plus le menu : on discute avec l'IA pour lui dire le
// menu et les spécificités qui iront dans le parcours en quatre étapes, avec la
// voix du restaurateur à l'étape 3. »
//
// LES DEUX SE TIENNENT, ET C'EST POUR ÇA QUE `comment` EST DANS CE FICHIER
// plutôt que dans le composant : l'étape 3 n'est pas un texte à saisir, c'est
// ce qu'il a DIT. La même conversation qui donne le plat donne la voix. Une
// photo de carte n'aurait jamais pu donner la seconde.

import type { CleMetier } from "@/lib/direct/apercu-habitant";

/** Un écran du parcours, et ce qu'il attend de lui pour exister. */
export type EtapePromise = {
  n: number;
  /** Le titre de l'écran, tel que l'app l'écrit. */
  titre: string;
  /** Ce que l'habitant y fait. Écrit de son point de vue à lui. */
  dit: string;
  /** Ce qu'il doit fournir pour que cet écran existe. */
  fournir?: string;
  /**
   * OU BIEN POURQUOI ON NE LUI DEMANDE RIEN — et les deux raisons ne sont pas
   * la même.
   *
   * IL A FALLU DEUX MOTS DIFFÉRENTS, ET LE BAR L'A MONTRÉ. Le dernier écran du
   * restaurant tourne CE SOIR avec ce que la page sait déjà de lui : son nom,
   * sa distance, son téléphone. Les deux derniers temps du comptoir, non — ils
   * n'attendent rien de lui parce que ce sont les HABITANTS qui les
   * remplissent, mais ils ne s'ouvriront que le jour où sa soirée existe. Un
   * « déjà prêt » sur ces deux-là aurait dit qu'un tiers de son parcours tourne
   * sans lui, ce qui est faux.
   *
   * LA PHRASE EST DONC ÉCRITE ICI, PAS DANS LE COMPOSANT. Chaque étape sait
   * pourquoi elle n'a besoin de rien ; un libellé unique ne pouvait dire que
   * l'une des deux raisons, donc mentir sur l'autre.
   */
  sans?: string;
};

export type ParcoursPromis = {
  cle: "gout" | "soiree";
  /** Ce que le parcours fait, en une ligne, dans les mots de son métier. */
  titre: string;
  /**
   * LA MÊME CHOSE, MAIS DITE À SES CLIENTS.
   *
   * DEUX VOIX DANS UN SEUL PANNEAU, ET C'EST VOULU. Ce bloc est la VITRINE
   * telle que ses clients la verront — question manuscrite, Fantôme, grande
   * phrase — posée sur sa page à lui pour qu'il voie ce qu'elle donnera. La
   * phrase du haut est donc écrite pour eux ; ce qui est écrit pour lui
   * commence plus bas, à la bande et aux étapes.
   *
   * SANS CE CHAMP, `titre` SERVAIT AUX DEUX : « on goûte VOTRE plat » s'affichait
   * à la place de la phrase que lisent ses clients, et le panneau se mettait à
   * tutoyer le commerçant au milieu de sa propre vitrine.
   */
  vitrine: string;
  /**
   * CE QU'IL N'Y A PAS ENCORE, À LA PLACE DU GRAND BOUTON.
   *
   * SES MOTS : « au lieu d'avoir "essayer le menu" on peut dire "le chef n'a
   * encore rien mis" ». La phrase est juste et elle est gentille — elle dit que
   * quelqu'un doit poser quelque chose, pas que la page est cassée.
   *
   * ELLE EST ÉCRITE PAR PARCOURS, PAS DÉDUITE DU MÉTIER. Un premier jet la
   * décidait sur la même expression régulière qui sépare ce qui se sert de ce
   * qui se fabrique — et cette expression compte le bar parmi les tables. Un
   * bar à vins lisait donc « le chef n'a encore rien mis » au-dessus des trois
   * temps de sa soirée. Le parcours, lui, sait toujours de quoi il parle.
   */
  rien: string;
  /** « 4 écrans », « 3 temps ». Écrit ici parce que le compte suit les étapes. */
  combien: string;
  etapes: EtapePromise[];
  /** Comment la matière est recueillie. Une conversation, jamais un formulaire. */
  comment: string;
};

/**
 * ON NE SERT PAS PARTOUT, ET LE MOT CHANGE AVEC.
 *
 * Reprend la distinction déjà faite dans `bloc-fantome.tsx` : chez un
 * restaurant on goûte le plat du jour avant d'y aller ; chez un boucher on ne
 * goûte rien — on repart avec une pièce crue qu'on cuira soi-même, et ce qui se
 * joue chez lui ce sont SES SECRETS. Deux mots, un seul parcours.
 */
const SERT = /restaur|pizz|burger|crêper|creper|table|brasserie|bistro|cantine|traiteur/i;

/**
 * LES MÉTIERS DE BOUCHE QUI ONT L'AVANT-GOÛT SANS ÊTRE DE LA BRANCHE
 * « RESTAURANT ».
 *
 * CE N'EST PAS UNE LISTE DE SOUHAITS, C'EST UN CONSTAT. `retour-commercant.ts`
 * pose déjà les chiffres d'entonnoir du boucher, du boulanger et du traiteur, et
 * `avant-gout.ts` écrit leurs parcours : ces trois-là ONT la mécanique dans
 * l'app, ils tombent simplement dans la branche fourre-tout « artisan ». Un
 * tatoueur ou un bijoutier, qui y tombent aussi, n'ont pas d'avant-goût — on ne
 * leur en promet donc pas.
 */
const BOUCHE = /bouch|charcut|boulang|pâtiss|patiss|traiteur|fromag|poissonn|primeur/i;

/**
 * LE PARCOURS QUE CETTE PAGE FERA, OU RIEN.
 *
 * RIEN EST LE CAS NORMAL ET MAJORITAIRE : un coiffeur, une onglerie, une
 * boutique de mode ont déjà leur essayage sur photo et n'ont jamais vu le mur de
 * présence. C'est aux trois familles qui y tombaient — la table, le comptoir, le
 * métier de bouche — que ce fichier répond.
 */
export function parcoursPromis(c: {
  branche: CleMetier | string;
  metier: string;
}): ParcoursPromis | undefined {
  const m = c.metier || "";

  /* LE COMPTOIR D'ABORD : un bar peut s'appeler « brasserie », et `SERT` compte
     la brasserie comme une table. La branche, elle, a déjà tranché — c'est elle
     qui range ce commerce dans le fil de la ville, et deux réponses
     différentes à la même question donneraient une vitrine qui annonce un
     parcours et une porte qui en ouvre un autre. */
  if (c.branche === "bar") return LE_COMPTOIR;
  if (c.branche === "restaurant" || SERT.test(m)) return laTable(true);
  if (BOUCHE.test(m)) return laTable(false);
  return undefined;
}

/**
 * ═══ LES QUATRE ÉCRANS, DANS L'ORDRE DE `ecransDuGout` ════════════════════
 *
 * LES TITRES NE SONT PAS RÉÉCRITS POUR L'OCCASION. « Je vous montre
 * l'intérieur ? » est le titre que `avant-gout.ts` compose pour le rideau ; le
 * jour où il change là-bas, il faut qu'il change ici — et c'est exactement ce
 * qu'un commerçant vérifiera, puisqu'on vient de lui promettre cet écran-là.
 *
 * ON NE PEUT PAS LES IMPORTER : là-bas ils se composent à partir d'un `Gout`
 * qui n'existe pas ici, c'est toute la raison de ce fichier. Ils sont donc
 * recopiés, et ce commentaire est le lien entre les deux.
 */
function laTable(sert: boolean): ParcoursPromis {
  const chose = sert ? "votre plat du jour" : "votre pièce du jour";
  return {
    cle: "gout",
    titre: sert
      ? "On goûte votre plat avant d’y aller"
      : "On découvre vos secrets avant de venir",
    vitrine: sert
      ? "Le plat du jour, goûté d’ici, en quatre écrans — dès qu’il est posé."
      : "La pièce du jour et ce qu’elle cache, en quatre écrans — dès qu’elle est posée.",
    rien: sert ? "Le chef n’a encore rien mis" : "Rien n’est encore en vitrine",
    combien: "4 écrans",
    etapes: [
      {
        n: 1,
        titre: "On ouvre",
        dit: `${chose[0].toUpperCase()}${chose.slice(1)}, son prix, et ce que vous en dites.`,
        fournir: sert ? "Le plat du jour et sa photo" : "La pièce du jour et sa photo",
      },
      {
        n: 2,
        /* SON TITRE EXACT, VOIR `ecransDuGout`. */
        titre: "Je vous montre l’intérieur ?",
        dit: "On tire un rideau avec le doigt, entre les deux photos. C’est le seul écran qu’un concurrent ne peut pas copier : il tient à une donnée, pas à un effet.",
        fournir: sert
          ? "Une seconde photo, le même plat une fois servi"
          : "Une seconde photo, la même pièce une fois tranchée",
      },
      {
        n: 3,
        titre: "Ce que vous en dites",
        dit: "Votre phrase, écrite en grand — et votre voix dessus, en un bouton. Quatre personnes sur cinq lisent sans écouter : la voix est un bonus, jamais le contenu.",
        fournir: "Trente secondes de conversation. C’est là que votre voix est prise.",
      },
      {
        n: 4,
        titre: "Maintenant",
        dit: "Le plat, le prix, la distance, et le bouton pour vous écrire. Rien d’autre.",
        /* LE SEUL DES QUATRE QUI MARCHERAIT CE SOIR : la page a déjà son nom,
           son adresse, sa distance et son téléphone. Le dire change la lecture
           de toute la liste — sans cette ligne, elle se lit « il faut tout
           fournir avant que quoi que ce soit marche ». */
        sans: "Déjà prêt, avec ce qu’on sait de vous",
      },
    ],
    comment: sert
      ? "On ne photographie plus votre carte. On en parle : vous dites votre plat du jour, ce qu’il a de particulier, deux mots sur la maison — et cette conversation remplit les quatre écrans. Votre voix telle quelle à l’étape 3."
      : "On ne photographie plus votre étal. On en parle : vous dites votre pièce du jour, comment vous la travaillez, d’où elle vient — et cette conversation remplit les quatre écrans. Votre voix telle quelle à l’étape 3.",
  };
}

/**
 * ═══ ET LE COMPTOIR N'A PAS LE MÊME PARCOURS ══════════════════════════════
 *
 * « Le système dont je parle est juste pour les bars et les sorties : la
 * découverte du son qui sera joué, ensuite ce qu'on recherche dans cette
 * soirée, et enfin le Live de la soirée. »
 *
 * TROIS TEMPS, ET LEUR ORDRE EST LE SUJET. On ne goûte pas un bar : ce qu'on y
 * essaie N'A PAS ENCORE EU LIEU. D'où le son avant tout le reste — c'est la
 * seule chose de la soirée qui existe déjà à seize heures — puis ce qu'on vient
 * y chercher, puis les gens. Les trois libellés sont ceux de l'écran d'accueil
 * (`TEMPS_SOIREE`), au mot près et pour la même raison que plus haut.
 */
const LE_COMPTOIR: ParcoursPromis = {
  cle: "soiree",
  titre: "On essaie un bout de votre soirée",
  vitrine: "Un bout de la soirée, essayé d’ici, en trois temps — dès qu’elle est annoncée.",
  rien: "La soirée n’est pas encore annoncée",
  combien: "3 temps",
  etapes: [
    {
      n: 1,
      titre: "On l’entend avant",
      dit: "Dix secondes du son de ce soir, jouées sur la carte. C’est ce qui décide, et c’est la seule chose de la soirée qui existe déjà à seize heures.",
      fournir: "Ce qui passe ce soir : le style, le groupe, la playlist",
    },
    {
      n: 2,
      titre: "On dit ce qu’on cherche",
      dit: "Danser, s’asseoir au calme, être douze — chacun pose son intention avant de venir, et vous les lisez avant l’ouverture.",
      /* RIEN À PRÉPARER, MAIS PAS « DÉJÀ PRÊT » : les intentions viennent des
         habitants, et elles se posent SUR une soirée. Sans le premier temps, il
         n'y a rien à chercher. */
      sans: "Rien à préparer : ce sont les habitants qui écrivent",
    },
    {
      n: 3,
      titre: "On parle à ceux qui y vont",
      dit: "Le Live de la soirée : ceux qui viennent se parlent avant, et le groupe est déjà formé quand il pousse la porte.",
      sans: "Rien à préparer : le Live s’ouvre avec la soirée",
    },
  ],
  comment:
    "On ne remplit pas un formulaire d’événement. On en parle : vous dites ce qui se passe ce soir, à quelle heure, quelle ambiance — et cette conversation ouvre les trois temps.",
};
