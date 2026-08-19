// L'ACTE MÉTIER DE LA DÉMONSTRATION — « et ce n'est pas que pour les offres ».
//
// CE QU'IL RÉSOUT. La démo montrait UNE annonce, une seule fois. Le commerçant
// en concluait ce qu'il conclut toujours : « c'est un truc à promotions ». Or
// ce qu'on lui vend est un geste QUOTIDIEN — sa carte le matin, ses tables
// vides le soir, ce qu'il lui reste à 14 h, ses habitués. Tant qu'il ne voit
// pas la semaine entière, il n'achète qu'une fonctionnalité.
//
// D'OÙ VIENNENT CES GESTES : de `intentionsPour`, c'est-à-dire de la liste
// EXACTE que le commerçant trouvera dans son espace. Rien n'est écrit deux
// fois : l'emoji, l'intitulé du bouton, l'annonce produite et la promesse
// viennent tous de là. Conséquence directe, et c'est tout l'intérêt : la démo
// se décline d'elle-même sur les cinq cents métiers, et il est IMPOSSIBLE
// qu'elle montre un geste qui n'existe pas dans le produit — le jour où une
// intention change de mots, l'acte change avec elle.
//
// CE FICHIER N'AJOUTE QUE LA NARRATION : ce que l'assistante dit pour amener
// chaque geste, et la phrase que le COMMERÇANT prononce. Les faits (l'annonce,
// la promesse) restent chez `actions-flash`.
//
// LE COMMERÇANT PARLE, L'ASSISTANTE ÉCRIT — jamais l'inverse. Chaque temps est
// donc un couple : une phrase dite par lui (« Il me reste quatre tables pour ce
// soir »), une annonce écrite par elle. Elle ne sait pas combien il lui reste
// de tables, et cet acte ne doit jamais laisser croire le contraire.
import {
  heureLisible,
  intentionsPour,
  jourISO,
  vocabulaire,
  type Vocab,
} from "@/lib/site-internet/actions-flash";
import type { Confirmation, Secteur } from "@/lib/site-internet/metier-profiles";
import { estRestauration } from "@/lib/direct/mots-metier";

/** Un temps de l'acte : soit un geste du métier, soit la mémoire, à la fin. */
export type TempsMetier =
  | {
      genre: "geste";
      cle: string;
      emoji: string;
      /** L'intitulé du bouton, tel qu'il existe dans l'espace pro. */
      label: string;
      /** Ce que l'assistante dit pour amener ce temps — une seule idée. */
      dit: string;
      /** Ce que le COMMERÇANT dit. C'est toujours lui qui apporte le fait. */
      dis: string;
      /** Par quel geste il l'apporte : il le dit, ou il le montre en photo. */
      via: "voix" | "photo";
      /** L'annonce qui en sort — produite par le vrai moteur du produit. */
      annonce: string;
      /** Ce que ça peut lui rapporter, au conditionnel. */
      promesse: string;
    }
  | {
      genre: "memoire";
      dit: string;
      /** Les gestes déjà montrés, reclassés par ce qu'ils rapportent. */
      lignes: Array<{ emoji: string; label: string; resultat: string }>;
    };

/**
 * LA NARRATION, GESTE PAR GESTE.
 *
 * `rang` décide de l'ordre ET de ce qui passe à la trappe : on ne montre que
 * quatre temps. Cinq, et l'acte devient une liste ; le commerçant décroche
 * exactement là où on voulait qu'il se reconnaisse.
 *
 * `resultat` est un CHIFFRE INVENTÉ, et c'est assumé — voir `ville-vitrine.ts`
 * pour le raisonnement complet : au lancement, aucune mesure n'existe, et
 * montrer zéro à quelqu'un qu'on veut convaincre revient à lui démontrer qu'il
 * n'a aucune raison de s'inscrire. Ce sont des RAPPORTS (« deux fois plus »,
 * « un sur quatre »), jamais des mesures présentées comme relevées chez lui.
 */
type Narration = {
  rang: number;
  dit: (v: Vocab) => string;
  dis: (x: Record<string, string>, v: Vocab) => string;
  /** La carte du jour se PHOTOGRAPHIE — un micro à cet endroit décrirait un
   *  geste que le commerçant ne fait pas. Partout ailleurs, il parle. */
  via?: "photo";
  /** Le scénario de démonstration, par-dessus celui de l'intention. */
  valeurs?: (now: Date, resto: boolean) => Record<string, string>;
  resultat: string;
};

const NARRATION: Record<string, Narration> = {
  carte: {
    rang: 1,
    // IL MONTRE, ELLE LIT. C'est la fonction telle qu'elle existe : il
    // photographie son ardoise, l'assistante la déchiffre et l'écrit. Faire
    // dire au commerçant le menu déjà rédigé donnait deux fois la même phrase
    // de part et d'autre de la flèche — la transformation avait l'air nulle,
    // et l'assistante inutile.
    dit: () => "Le matin, vous me montrez votre ardoise : je la lis, je l'écris.",
    dis: () => "Voilà l'ardoise d'aujourd'hui.",
    via: "photo",
    resultat: "3× plus vue le matin",
  },
  arrivage: {
    rang: 2,
    dit: () => "À la livraison, vous me dites ce qui vient d'arriver.",
    dis: () => "Ma livraison du matin vient d'arriver.",
    // AUCUN PRODUIT NOMMÉ, et c'est voulu : cette même intention sert un
    // boulanger, un fleuriste et un poissonnier. « Des fraises de Dordogne »
    // en désigne un et donne aux deux autres une démonstration qui parle du
    // commerce d'à côté.
    valeurs: () => ({ quoi: "tout ce qui est arrivé ce matin", combien: "" }),
    resultat: "parti avant midi 4 fois sur 5",
  },
  reste: {
    rang: 3,
    // « EN FIN DE SERVICE » NE VEUT RIEN DIRE CHEZ UN FLEURISTE. Le même geste
    // se dit dans les mots du métier, sinon le commerçant comprend que la démo
    // parle d'un autre commerce que le sien.
    dit: (v) => `En fin de ${v.boutique ? "journée" : "service"}, vous me dites ce qu'il vous reste.`,
    // SA PHRASE N'EST PAS L'ANNONCE, et c'est tout l'intérêt de la montrer.
    // Écrite à l'identique des deux côtés de la flèche, la transformation
    // avait l'air de ne rien faire — et l'assistante, d'être décorative.
    dis: (x, v) =>
      v.boutique
        ? `J'en ai encore ${x.combien}, autant qu'elles partent aujourd'hui.`
        : `J'ai encore ${x.combien} ${x.quoi}, je vais devoir les jeter.`,
    // Le scénario de l'intention est celui d'un restaurant (« 8 lasagnes
    // maison »). Servi à un fleuriste, il donnait une démonstration qui
    // parlait du commerce d'à côté.
    valeurs: (_now, resto) => (resto ? {} : { combien: "6", quoi: "pièces du jour" }),
    resultat: "3× plus de réponses le jeudi",
  },
  creneau: {
    rang: 4,
    // C'EST LE COMMERÇANT QUI COMPTE SES TABLES. L'assistante n'a pas son
    // cahier de réservations et n'en aura jamais : elle ne peut pas savoir
    // qu'il en reste quatre. Elle demande, il répond, elle écrit.
    dit: (v) => `Des ${v.places} restent vides aujourd'hui ? Dites-le-moi, j'écris.`,
    // Pas « il me reste », qui vient d'être dit au temps précédent : deux
    // cartes de suite ouvertes par les mêmes mots se lisent comme une seule.
    //
    // Et le moment se lit sur l'HEURE du scénario, il ne se décide pas ici :
    // écrit « ce soir » en dur, il annonçait « ce soir » au-dessus d'une
    // annonce qui disait « à 16 h ».
    dis: (x, v) =>
      `Encore ${x.combien} ${v.places} de libres ${Number(String(x.heure).slice(0, 2)) >= 18 ? "pour ce soir" : "cet après-midi"}.`,
    valeurs: (now, resto) => ({
      combien: "4",
      jour: jourISO(now),
      heure: resto ? "19:30" : "16:00",
      fin: "",
      quoi: "",
    }),
    resultat: "rempli en 40 min",
  },
  fideles: {
    rang: 5,
    dit: () => "Un geste pour vos habitués ? Ils l'apprennent en premier.",
    dis: (x) => `Je voudrais leur offrir ${x.quoi}.`,
    resultat: "1 client sur 4 revient",
  },
  realisation: {
    rang: 6,
    dit: () => "Vous terminez un beau travail : une photo, et je l'écris.",
    dis: (x) => `Je viens de terminer ${x.quoi}.`,
    resultat: "1 rendez-vous sur 5 vient de là",
  },
  venir: {
    rang: 7,
    dit: () => "Une raison de passer aujourd'hui, qui s'arrête toute seule.",
    dis: (x) => `Aujourd'hui, ${x.quoi}, de ${heureLisible(x.de)} à ${heureLisible(x.a)}.`,
    resultat: "2× plus de passages le matin",
  },
};

/** Combien de gestes avant la mémoire. Quatre : voir `rang` ci-dessus. */
const GESTES_MAX = 4;

/**
 * Les temps de l'acte, pour ce métier-là.
 *
 * `now` est passé plutôt que lu, parce que cet acte est calculé sur le SERVEUR
 * et rendu par un composant client : un `new Date()` pris des deux côtés
 * donnerait deux journées différentes et React remonterait tout le bloc.
 */
export function acteMetier(
  metier: string,
  confirmation: Confirmation,
  secteur: Secteur,
  now: Date
): TempsMetier[] {
  const v = vocabulaire(metier, confirmation, secteur);
  const resto = estRestauration(metier);

  const gestes = intentionsPour(metier, confirmation, secteur)
    .filter((it) => NARRATION[it.cle])
    .sort((a, b) => NARRATION[a.cle].rang - NARRATION[b.cle].rang)
    .slice(0, GESTES_MAX)
    .map((it) => {
      const n = NARRATION[it.cle];
      const x = { ...it.demo(now), ...(n.valeurs ? n.valeurs(now, resto) : {}) };
      return {
        genre: "geste" as const,
        cle: it.cle,
        emoji: it.emoji,
        label: it.action,
        dit: n.dit(v),
        dis: n.dis(x, v),
        via: n.via === "photo" ? ("photo" as const) : ("voix" as const),
        // L'ANNONCE VIENT DU PRODUIT, pas d'ici. C'est ce qui garantit que ce
        // qu'on montre en démonstration est mot pour mot ce qu'il obtiendra.
        annonce: it.brief(x),
        promesse: it.promesse,
      };
    });

  if (!gestes.length) return [];

  return [
    ...gestes,
    {
      genre: "memoire",
      dit: "Et je retiens ce qui marche chez vous : le jour, l'heure, ce qui fait revenir.",
      // Les gestes qu'il vient de voir, reclassés. C'est ce rappel qui fait
      // comprendre la mémoire sans l'expliquer : ce sont SES annonces, avec ce
      // qu'elles ont donné — pas une fonctionnalité de plus à écouter.
      lignes: gestes.slice(0, 3).map((g) => ({
        emoji: g.emoji,
        label: g.label,
        resultat: NARRATION[g.cle].resultat,
      })),
    },
  ];
}

/**
 * TOUT L'ACTE EN UNE SEULE RÉPLIQUE, et c'est un choix de mise en scène.
 *
 * Chaque temps pourrait être une étape de la démo. Il y en aurait alors seize
 * au compteur, et « étape 9 / 16 » est une raison de partir. Ils sont donc
 * enchaînés dans une seule réplique, et chaque carte apparaît au moment où la
 * voix commence SA phrase : le commerçant en reçoit un à la fois — ce qui
 * était le but — sans que la démonstration ait l'air de s'allonger.
 */
export function direActe(temps: TempsMetier[]): string {
  return [INTRO_ACTE, ...temps.map((t) => t.dit)].join(" ");
}

/** Le démenti qui ouvre l'acte — et lui donne son titre. */
export const INTRO_ACTE = "Et ce n'est pas que pour les offres.";
