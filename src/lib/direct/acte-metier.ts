// L'ACTE MÉTIER DE LA DÉMONSTRATION — « et ce n'est pas tout ».
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

/**
 * Un temps de l'acte : un geste du métier, à son heure.
 *
 * C'ÉTAIT UNE UNION À DEUX BRANCHES. La seconde, « demande », portait la
 * demande inversée — ce que les habitants cherchent, retourné vers le
 * commerçant. Elle a été retirée : c'était la seule chose de toute la
 * démonstration qui n'existe pas encore dans le produit, et un écran sur
 * quatre qui décrit une fonction qu'on n'a pas rend les trois autres suspects.
 */
export type TempsMetier = {
      genre: "geste";
      cle: string;
      emoji: string;
      /** L'intitulé du bouton, tel qu'il existe dans l'espace pro. */
      label: string;
      /** L'heure où ce geste se fait. C'est elle qui transforme une liste de
       *  fonctions en une journée qui avance. */
      heure: string;
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
  /** L'heure de la journée où ce geste se fait. */
  heure: string;
  /** `resto` en second : `v.boutique` est VRAI pour un restaurant (c'est un
   *  commerce de passage), et une condition écrite dessus donnait au
   *  restaurateur la formulation prévue pour les boutiques. */
  dit: (v: Vocab, resto: boolean) => string;
  dis: (x: Record<string, string>, v: Vocab) => string;
  /** La carte du jour se PHOTOGRAPHIE — un micro à cet endroit décrirait un
   *  geste que le commerçant ne fait pas. Partout ailleurs, il parle. */
  via?: "photo";
  /** Le scénario de démonstration, par-dessus celui de l'intention. */
  valeurs?: (now: Date, resto: boolean) => Record<string, string>;
};

const NARRATION: Record<string, Narration> = {
  carte: {
    rang: 8,
    heure: "10 h",
    // IL MONTRE, ELLE LIT. C'est la fonction telle qu'elle existe : il
    // photographie son ardoise, l'assistante la déchiffre et l'écrit. Faire
    // dire au commerçant le menu déjà rédigé donnait deux fois la même phrase
    // de part et d'autre de la flèche — la transformation avait l'air nulle,
    // et l'assistante inutile.
    // CHAQUE TEMPS S'OUVRE SUR SON HEURE. Les phrases commençaient par « le
    // matin », « en fin de service », « un jour » : quatre repères flous qui
    // ne dessinaient pas une journée. L'heure dite à voix haute, en même temps
    // qu'elle s'affiche, fait le contraire — on suit une journée qui avance.
    dit: () => "10 h, vous me montrez votre ardoise. Je la lis, je publie.",
    dis: () => "Voilà l'ardoise d'aujourd'hui.",
    via: "photo",
  },
  arrivage: {
    rang: 1,
    heure: "7 h",
    dit: () => "7 h, vous me dites ce qui vient d'arriver. Je publie.",
    dis: () => "Ma livraison du matin vient d'arriver.",
    // AUCUN PRODUIT NOMMÉ, et c'est voulu : cette même intention sert un
    // boulanger, un fleuriste et un poissonnier. « Des fraises de Dordogne »
    // en désigne un et donne aux deux autres une démonstration qui parle du
    // commerce d'à côté.
    valeurs: () => ({ quoi: "tout ce qui est arrivé ce matin", combien: "" }),
  },
  reste: {
    rang: 4,
    heure: "14 h",
    // « EN FIN DE SERVICE » NE VEUT RIEN DIRE CHEZ UN FLEURISTE. Le même geste
    // se dit dans les mots du métier, sinon le commerçant comprend que la démo
    // parle d'un autre commerce que le sien.
    dit: (v) => `14 h, vous me dites ce qu'il vous ${v.boutique ? "reste en boutique" : "reste"}. Je publie.`,
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
    valeurs: (_now, resto): Record<string, string> => (resto ? {} : { combien: "6", quoi: "pièces du jour" }),
  },
  creneau: {
    rang: 2,
    heure: "17 h 30",
    // C'EST LE COMMERÇANT QUI COMPTE SES TABLES. L'assistante n'a pas son
    // cahier de réservations et n'en aura jamais : elle ne peut pas savoir
    // qu'il en reste quatre. Elle demande, il répond, elle écrit.
    dit: (v) => `17 h 30, des ${v.places} restent vides ? Dites-le-moi, je publie.`,
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
  },
  fideles: {
    rang: 6,
    heure: "18 h",
    dit: () => "Un geste pour vos habitués ? Dites-le-moi, je publie — ils l'apprennent en premier.",
    dis: (x) => `Je voudrais leur offrir ${x.quoi}.`,
  },
  realisation: {
    rang: 7,
    heure: "16 h",
    dit: () => "Vous terminez un beau travail : une photo, et je publie.",
    dis: (x) => `Je viens de terminer ${x.quoi}.`,
  },
  venir: {
    // LA DEMI-HEURE CREUSE, ET C'EST LE TEMPS QUI CONVAINC LE PLUS.
    // « Une raison de passer aujourd'hui » décrivait une fonction ; « 11 h 30,
    // une demi-heure que vous voulez remplir ? » décrit un moment que le
    // commerçant vient de vivre.
    rang: 3,
    heure: "11 h 30",
    dit: (_v, resto) =>
      resto
        ? "11 h 30 à midi, une demi-heure que vous voulez remplir ? Offrez le café, je publie."
        : "11 h 30, un creux que vous voulez remplir ? Une raison de passer, je publie.",
    dis: (x) => `Aujourd'hui, ${x.quoi}, de ${heureLisible(x.de)} à ${heureLisible(x.a)}.`,
    // Le scénario par défaut va de 10 h à 12 h ; on le cale sur le creux dont
    // parle la phrase, sinon l'écran annonce une heure et la voix une autre.
    valeurs: () => ({ quoi: "le café offert", combien: "", de: "11:30", a: "12:00" }),
  },
  evenement: {
    // LE SOIR, ET IL FERME L'ACTE. Il remplaçait « et un jour, ce sont eux qui
    // vous diront ce qu'ils cherchent » — la demande inversée, seule chose de
    // toute la démonstration qui n'existait pas encore dans le produit. Un
    // écran sur quatre décrivait une fonction qu'on n'a pas ; c'est le genre
    // de détail qui rend les trois autres suspects.
    rang: 5,
    heure: "18 h",
    dit: () => "Le soir, un événement à annoncer ? Je publie.",
    dis: (x) => `J'organise ${x.quoi}.`,
    // L'HEURE DOIT SUIVRE L'ÉVÉNEMENT. Le scénario de l'intention est celui
    // d'une journée portes ouvertes, à 10 h : servi tel quel, il annonçait une
    // soirée dégustation « à partir de 10 h ».
    valeurs: (_now, resto) =>
      resto
        ? { quoi: "une soirée dégustation", heure: "19:00" }
        : { quoi: "une journée portes ouvertes", heure: "10:00" },
  },
};

/** Combien de temps montre l'acte. Quatre : au-delà, la journée devient une
 *  liste, et le commerçant décroche là où on voulait qu'il se reconnaisse. */
const GESTES_MAX = 4;

/**
 * L'ORDRE DE PASSAGE N'EST PAS LE MÊME PARTOUT, et un seul rang ne peut pas
 * décrire deux métiers.
 *
 * Chez un coiffeur, le créneau qui se libère EST le geste du métier : il passe
 * en tête. Chez un restaurant, la journée commence par l'ardoise, se poursuit
 * par le creux de midi et les invendus, et se termine sur un événement — le
 * créneau y est bon, mais il est cinquième, et l'acte n'en montre que quatre.
 */
const RANG_RESTAURATION: Record<string, number> = {
  carte: 1,
  venir: 2,
  reste: 3,
  evenement: 4,
  creneau: 5,
};

/** « 17 h 30 » → 1050. Sert à remettre les temps retenus dans l'ordre du jour. */
const enMinutes = (heure: string): number => {
  const m = /^(\d{1,2})\s*h(?:\s*(\d{1,2}))?/.exec(heure.trim());
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : 0;
};

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
  now: Date,
  combien = GESTES_MAX
): TempsMetier[] {
  const v = vocabulaire(metier, confirmation, secteur);
  const resto = estRestauration(metier);

  const rangDe = (cle: string) =>
    (resto ? RANG_RESTAURATION[cle] : undefined) ?? NARRATION[cle].rang;

  const gestes = intentionsPour(metier, confirmation, secteur)
    .filter((it) => NARRATION[it.cle])
    // D'abord CE QU'ON GARDE (le rang décide de ce qui passe à la trappe),
    // ensuite L'ORDRE DU JOUR. Trier une seule fois par rang donnait des
    // journées qui remontaient le temps — 17 h 30 avant 11 h 30 — alors que
    // tout l'acte repose sur l'idée qu'une journée avance.
    .sort((a, b) => rangDe(a.cle) - rangDe(b.cle))
    .slice(0, Math.max(1, combien))
    .sort((a, b) => enMinutes(NARRATION[a.cle].heure) - enMinutes(NARRATION[b.cle].heure))
    .map((it) => {
      const n = NARRATION[it.cle];
      const x = { ...it.demo(now), ...(n.valeurs ? n.valeurs(now, resto) : {}) };
      return {
        genre: "geste" as const,
        cle: it.cle,
        emoji: it.emoji,
        label: it.action,
        heure: n.heure,
        dit: n.dit(v, resto),
        dis: n.dis(x, v),
        via: n.via === "photo" ? ("photo" as const) : ("voix" as const),
        // L'ANNONCE VIENT DU PRODUIT, pas d'ici. C'est ce qui garantit que ce
        // qu'on montre en démonstration est mot pour mot ce qu'il obtiendra.
        annonce: it.brief(x),
        promesse: it.promesse,
      };
    });

  // LA DEMANDE INVERSÉE A ÉTÉ RETIRÉE. Elle fermait l'acte sur « et un jour,
  // ce sont eux qui vous diront ce qu'ils cherchent » — la seule chose de
  // toute la démonstration qui n'existe pas encore dans le produit. Un écran
  // sur quatre décrivait une fonction qu'on n'a pas, et c'est exactement ce
  // qui rend les trois autres suspects. Le soir est maintenant tenu par
  // l'événement, qui, lui, se publie vraiment.
  return gestes;
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
  return [INTRO_ACTE, ...temps.map((t) => t.dit), FIN_ACTE].join(" ");
}

/** Le démenti qui ouvre l'acte — et lui donne son titre. */
export const INTRO_ACTE = "Et ce n'est pas tout.";

/**
 * LA PHRASE QUI FERME L'ACTE — et le seul moment où on voit la journée entière.
 *
 * L'acte passait quatre écrans en quatre secondes chacun et s'arrêtait net sur
 * le dernier. On avait vu quatre choses ; on n'avait pas vu QU'ELLES FONT UNE
 * JOURNÉE, ce qui est précisément l'argument. Cette réplique donne le temps de
 * les rassembler à l'écran, et elle ne promet rien que le produit ne fasse :
 * elle constate qu'à chaque fois, il reparaît.
 */
export const FIN_ACTE =
  "Quatre gestes, une journée. Et à chaque fois, votre commerce revient dans leur écran.";
