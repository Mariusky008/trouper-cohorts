// LA VILLE — CE QUE LES HABITANTS DISENT DE CE QUI SE PASSE ICI, MAINTENANT.
//
// LA TROISIÈME BRIQUE, ET LA DERNIÈRE. Chacune a une fonction, et une seule :
//   · LE DIRECT  — les acteurs de la ville parlent : commerçants, mairie,
//                  organisateurs. « Voilà ce qui se passe chez moi. »
//   · LA VILLE   — les habitants parlent. « Voilà ce que je vois, ce que je
//                  vis, ce que je cherche. »
//   · LES SALONS — les habitants vivent quelque chose ensemble.
//
// CE QUE CE FICHIER REFUSE D'ÊTRE, ET POURQUOI C'EST TOUT LE SUJET. Un forum
// local, c'est-à-dire un Facebook de quartier : des publications qui
// s'empilent, se commentent, se disputent, et restent. Trois choix de
// construction l'empêchent, et ils sont dans le code, pas dans une charte que
// personne ne lit :
//
//  1. TOUT DISPARAÎT. Un message vit quelques heures et s'efface — pour de
//     bon, `purger()` le supprime du stockage. On n'archive pas, on ne
//     « masque » pas. Quand on ouvre à 12 h 15, on ne voit pas hier.
//  2. ON NE PUBLIE PAS, ON DIT QUELQUE CHOSE. Pas de titre, pas de catégorie à
//     choisir, pas de brouillon : une phrase. C'est l'application qui range.
//  3. ON NE PARLE PAS DE TOUT. Un message porte un lieu et une heure, et il
//     s'affiche par distance. Ce qui n'est ni ici ni maintenant n'a pas de
//     place où s'accrocher.
//
// CE QUI PROLONGE LA VIE D'UN MESSAGE : les réponses et les réactions, jamais
// le temps qui passe. Ce que la ville a jugé utile reste un peu plus ; le
// reste s'en va. C'est le seul classement qu'on s'autorise, et il ne dépend
// pas de nous.
//
// L'ANONYMAT EST LE MÊME QUE PARTOUT AILLEURS ICI : un prénom, une initiale,
// une distance. Pas de visage, pas de nom de famille, pas de profil qu'on
// puisse suivre. Voir `apercu-habitant.ts` pour la règle complète.
import { jourDe, sceneDAmbiance, sceneDeVitrine, type ContenuPartage, type SceneVille } from "@/lib/direct/scenes-ville";

/** Ce dont un message parle. Fermé : cinq natures, pas une de plus. */
export type NatureVille =
  | "question"
  | "evenement"
  | "bon-plan"
  | "coup-de-coeur"
  | "cherche";

export const NATURES: Record<
  NatureVille,
  { label: string; emoji: string; teinte: string }
> = {
  // LES DEUX SEULES COULEURS REPRISES SONT CELLES QUI VEULENT DÉJÀ DIRE ÇA.
  // Le rose est celui des événements de la ville, l'orange celui du coup de
  // pouce à un commerce : les réutiliser ici ne crée pas de sens nouveau, ça
  // confirme l'ancien. Les trois autres natures se distinguent par leur mot et
  // leur emoji — inventer cinq teintes de plus ferait perdre leur sens aux
  // sept qui existent.
  question: { label: "Question", emoji: "❓", teinte: "neutre" },
  evenement: { label: "Événement", emoji: "🎪", teinte: "rose" },
  "bon-plan": { label: "Bon plan", emoji: "💡", teinte: "neutre" },
  "coup-de-coeur": { label: "Coup de cœur", emoji: "❤️", teinte: "orange" },
  // « Cherche » est vert parce qu'il mène à un salon : c'est l'application qui
  // agit, pas une catégorie de plus.
  cherche: { label: "Cherche quelqu'un", emoji: "🙋", teinte: "verte" },
};

export type ReponseVille = {
  id: string;
  qui: string;
  texte: string;
  quand: string;
  /** Le commerçant ou l'organisateur qui répond chez lui. */
  officiel?: string;
};

export type MessageVille = {
  id: string;
  qui: string;
  /** Un repère public, jamais une adresse : « près des Arènes ». */
  ou: string;
  distance: string;
  metres: number;
  texte: string;
  nature: NatureVille;
  /** L'instant de la parole, en millisecondes. C'est lui qui décide de tout. */
  a: number;
  /** Combien de temps il vit, en minutes, avant réponses et réactions. */
  dure: number;
  coeurs: number;
  monCoeur?: boolean;
  reponses: ReponseVille[];
  photo?: string;
  /** Pour un « cherche » : ceux que ça intéresse, et le salon s'il est ouvert. */
  interesses?: string[];
  salon?: string;
  /**
   * ═══ CE QUE LA VILLE EST DEVENUE : UN FIL SOCIAL LOCAL ══════════════════
   *
   * « Cette page rassemble les publications des habitants : essayages
   * partagés, découvertes réelles, vie locale. » Les cinq natures restent la
   * vie locale ; deux genres s'y ajoutent, et ils NE S'EFFACENT PAS :
   * « Les essais et découvertes restent disponibles jusqu'à suppression par
   * leur auteur. » L'éphémère reste la règle de tout le reste — c'est ce qui
   * empêche le fil de devenir un forum de quartier.
   */
  genre?: "essai" | "decouverte";
  /** « Mes amis » ou « Public dans ma ville ». Absent : public (la vie locale). */
  visibilite?: "amis" | "public";
  /** Ne s'efface pas (essais, découvertes). */
  persistant?: boolean;
  /**
   * Le commerce d'origine — on l'ouvre en touchant son nom. `photo` : sa
   * miniature, pour la carte simple quand la scène ne peut pas se monter.
   */
  commerce?: { id: string; nom: string; photo?: string };
  /**
   * ═══ LA PRÉSENTATION, FIGÉE AU PARTAGE — voir `scenes-ville.ts` ═══
   *
   * La scène (la vitrine où l'essai devient affiche, l'ambiance illustrée
   * d'une salle) est recopiée ici au moment où l'on publie. Le commerçant
   * change sa devanture : cette publication garde la sienne.
   */
  scene?: SceneVille;
  /**
   * CE QU'ON A PARTAGÉ D'UN COMMERCE : un plat de son menu (avec son jour),
   * un produit, un événement. Le lien vers le commerce est dans `commerce`.
   */
  contenu?: ContenuPartage;
  /** Un mot vocal : son adresse (data: avant l'envoi) et sa durée en secondes. */
  audio?: { src: string; duree: number };
  /** L'article ou la coupe essayés : « Essayer sur moi » repart de là. */
  reference?: { carte: string; piece: string; nom: string };
  /**
   * « VÉCU SUR PLACE » SEULEMENT QUAND L'AUTEUR LE DIT. Jamais déduit d'une
   * adoption ni d'une réservation.
   */
  vecu?: boolean;
  /** La publication dont celle-ci est la suite. */
  suite?: string;
};

/** Ce qu'un message gagne à être utile. Voir l'en-tête : le seul classement. */
const BONUS_REPONSE = 45;
const BONUS_COEUR = 6;
const PLAFOND = 12 * 60;

/** Dans combien de minutes ce message s'efface. Négatif : il est déjà parti. */
export function resteMinutes(m: MessageVille, maintenant = Date.now()): number {
  if (m.persistant) return Number.MAX_SAFE_INTEGER;
  const gagne = m.reponses.length * BONUS_REPONSE + m.coeurs * BONUS_COEUR;
  const vie = Math.min(m.dure + gagne, PLAFOND);
  return Math.round(vie - (maintenant - m.a) / 60_000);
}

/** « il reste 2 h », « il reste 20 min » — jamais un compte à rebours à la seconde. */
export function resteDit(m: MessageVille, maintenant = Date.now()): string {
  if (m.persistant) return "";
  const r = resteMinutes(m, maintenant);
  if (r <= 0) return "";
  if (r < 60) return `${r} min`;
  return `${Math.round(r / 60)} h`;
}

/** Depuis combien de temps c'est dit. */
export function ilYA(m: MessageVille, maintenant = Date.now()): string {
  const min = Math.max(0, Math.round((maintenant - m.a) / 60_000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  // LES ESSAIS ET LES DÉCOUVERTES RESTENT : « 50 h » ne se lit pas, « 2 j » oui.
  if (min < 24 * 60) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} j`;
}

// ─── CE QUE L'APPLICATION COMPREND TOUTE SEULE ─────────────────────────────
//
// « ClikMe comprend automatiquement » — mais ici, sans modèle de langue : des
// mots-clés, et rien d'autre. C'est volontairement pauvre, et c'est pour ça
// que le résultat est MONTRÉ et CORRIGEABLE avant l'envoi. Un rangement
// silencieux qui se trompe est pire qu'une case à cocher : la personne ne
// comprend pas où son message est parti, et n'écrit plus.
//
// En production, ce serait un modèle. La règle de conception ne changerait
// pas : on montre ce qu'on a compris, on laisse corriger d'un appui.

/**
 * L'ORDRE EST L'ALGORITHME. Le premier qui reconnaît gagne, donc les tournures
 * les plus spécifiques passent d'abord.
 *
 * DÉFAUT MESURÉ : « Il reste des huîtres au marché » tombait dans
 * « Événement », parce que le mot « marché » était examiné avant la tournure
 * « il reste ». Or un marché est un lieu autant qu'un événement, tandis que
 * « il reste » ne veut dire qu'une chose. On range donc du plus précis au plus
 * général : chercher quelqu'un, aimer, signaler ce qui reste, puis nommer un
 * type de sortie.
 */
const INDICES: { nature: NatureVille; mots: RegExp }[] = [
  {
    nature: "cherche",
    mots: /\b(quelqu'un (veut|voudrait|serait|cherche|dispo)|qui veut|ça tente|ca tente|je cherche (quelqu'un|des gens)|on se fait|qui vient)\b/i,
  },
  {
    nature: "coup-de-coeur",
    mots: /\b(incroyable|magnifique|excellent|d[ée]licieux|g[ée]nial|super bien|j'adore|coup de c(œ|oe)ur|une tuerie|top)\b/i,
  },
  {
    nature: "bon-plan",
    mots: /\b(il reste|profitez|gratuit|moiti[ée] prix|r[ée]duction|bon plan|dernier|derni[èe]re|je viens de voir|il y a encore)\b/i,
  },
  {
    nature: "evenement",
    mots: /\b(concert|spectacle|match|f[êe]te|festival|march[ée]|expo|nocturne|feria|vide-grenier|s[ée]ance|repr[ée]sentation|ce soir|demain soir)\b/i,
  },
];

/**
 * Range une phrase. Une question l'emporte sur tout le reste : le point
 * d'interrogation est le seul signe qui ne se discute pas, et quelqu'un qui
 * demande attend une réponse avant d'être classé.
 */
export function comprendre(texte: string): NatureVille {
  const t = texte.trim();
  if (/\?\s*$/.test(t) || /^(quelqu'un sait|est-ce que|qui sait|c'est quoi|pourquoi|comment)\b/i.test(t)) {
    // …sauf si la question EST une recherche de gens : « qui veut venir ? »
    const c = INDICES.find((i) => i.nature === "cherche");
    return c && c.mots.test(t) ? "cherche" : "question";
  }
  for (const i of INDICES) if (i.mots.test(t)) return i.nature;
  return "bon-plan";
}

// ─── CE QU'ON TROUVE EN ARRIVANT ───────────────────────────────────────────
//
// SANS ÇA, LA BRIQUE NE SE COMPREND PAS — et c'est son plus gros risque. Une
// annonce de commerçant est utile toute seule ; une place de village vide dit
// « personne ne parle ici », ce qui est le signal le plus fort pour ne pas
// revenir. Ces messages sont donc semés, et datés RELATIVEMENT à l'ouverture :
// à quelque heure qu'on arrive, on tombe sur une ville qui vient de parler.
//
// LES LIEUX SONT DE VRAIS REPÈRES PUBLICS DE DAX — les Arènes, la Fontaine
// chaude, les halles. Les commerces cités sont les enseignes inventées de la
// maquette, jamais de vrais commerçants : on ne fait dire à personne ce qu'il
// n'a pas dit, en bien comme en mal.

const min = (n: number) => n * 60_000;

/* LES COMMERCES DE LA DÉMONSTRATION QUE LE FIL CITE — de quoi préparer leur
   scène (`scenes-ville.ts`) avec leurs photos à eux, celles de leurs cartes
   dans `apercu-habitant.ts`. */
const SALON_DU_CENTRE = {
  branche: "coiffeur" as const,
  nom: "Un salon du centre",
  ville: "Dax",
  photo: "/direct/coiffure-femme-face.jpg",
  photos: ["/direct/coiffure-femme-face.jpg", "/direct/fauteuil-coiffeur.jpg", "/direct/salon-neuf.jpg"],
};
const DEPOT_VENTE = {
  branche: "mode" as const,
  nom: "Un dépôt-vente de la place",
  ville: "Dax",
  photo: "/direct/mode-manteau-leopard.jpg",
  photos: ["/direct/mode-manteau-leopard.jpg", "/direct/friperie-rayon.jpg"],
};
const PROTHESISTE = { branche: "ongles" as const, nom: "Une prothésiste ongulaire", ville: "Dax", photo: "/direct/pose-ongles.jpg" };
const LUNETIER = { branche: "lunetier" as const, nom: "Un lunetier de la rue piétonne", ville: "Dax", photo: "/direct/lunettes3.jpeg" };

export function messagesSemes(maintenant = Date.now()): MessageVille[] {
  const vitrine = (c: Parameters<typeof sceneDeVitrine>[0]) => sceneDeVitrine(c) ?? undefined;
  return [
    /* ═══ CE QUE LES AMIS ONT PARTAGÉ ═══ — des amis de démonstration, comme
       ceux des salons : Karim et Léa y sont déjà. Les références d'essai sont
       de vraies pièces des murs de démonstration : « Essayer sur moi » part
       de la même coupe, des mêmes lunettes. Chaque essai entre dans la
       vitrine de SON commerce — voir `scenes-ville.ts`. */
    {
      id: "va1",
      qui: "Léa",
      ou: "Un salon du centre",
      distance: "300 m",
      metres: 300,
      texte: "Et si je passais au carré ? 💇‍♀️",
      nature: "question",
      genre: "essai",
      visibilite: "amis",
      persistant: true,
      commerce: { id: "coif-centre", nom: "Un salon du centre", photo: "/direct/salon-neuf.jpg" },
      reference: { carte: "coif-centre", piece: "c-femme", nom: "Carré long, de face" },
      photo: "/direct/accueil/coiffure-apres.jpg",
      scene: vitrine(SALON_DU_CENTRE),
      a: maintenant - min(15),
      dure: 180,
      coeurs: 12,
      reponses: [
        { id: "va1r1", qui: "Karim", texte: "Franchement il te va très bien !", quand: "il y a 9 min" },
      ],
    },
    {
      id: "va7",
      qui: "Camille",
      ou: "Autour de Dax",
      distance: "1 km",
      metres: 1000,
      texte: "Une balade sympa près de Dax ? 🌿",
      nature: "question",
      a: maintenant - min(22),
      dure: 240,
      coeurs: 8,
      reponses: [
        { id: "va7r1", qui: "Marc", texte: "Les barthes de l'Adour, au coucher du soleil.", quand: "il y a 18 min" },
        { id: "va7r2", qui: "Inès", texte: "Le bois de Boulogne, à côté du lac.", quand: "il y a 15 min" },
      ],
    },
    {
      // LA PHOTO DU PLAT, DIRECTEMENT — celle de son menu, avec son jour :
      // demain, elle dira « Au menu le … », pas « Menu du jour ».
      id: "va2",
      qui: "Thomas",
      ou: "Chez Bergine",
      distance: "400 m",
      metres: 400,
      texte: "Ça vous tente pour ce midi ?",
      nature: "coup-de-coeur",
      genre: "decouverte",
      visibilite: "public",
      persistant: true,
      commerce: { id: "centre", nom: "Chez Bergine", photo: "/direct/tables-libres.jpg" },
      contenu: {
        type: "plat",
        nom: "Garbure landaise, magret grillé",
        detail: "Pommes sarladaises",
        prix: "19 €",
        photo: "/direct/plat-garbure.jpg",
        jour: jourDe(maintenant),
      },
      photo: "/direct/plat-garbure.jpg",
      a: maintenant - min(40),
      dure: 180,
      coeurs: 11,
      reponses: [],
    },
    {
      // UN MOT VOCAL, SANS DÉCOR : le son de la soirée, et une phrase.
      id: "va4",
      qui: "Camille",
      ou: "Près des Halles",
      distance: "250 m",
      metres: 250,
      texte: "Il y a de la musique près des Halles ! 🎶",
      nature: "bon-plan",
      audio: { src: "/direct/soiree/son-de-ce-soir.wav", duree: 12 },
      a: maintenant - min(48),
      dure: 240,
      coeurs: 5,
      reponses: [],
    },
    {
      // LA SALLE DU BAR, AVEC DEUX CLIENTS FANTÔMES : « Ambiance illustrée ».
      id: "va5",
      qui: "Karim",
      ou: "Un bar à vins",
      distance: "350 m",
      metres: 350,
      texte: "On se retrouve ici samedi ?",
      nature: "evenement",
      genre: "decouverte",
      visibilite: "public",
      persistant: true,
      commerce: { id: "bar-vins", nom: "Un bar à vins", photo: "/direct/verre-au-comptoir.jpg" },
      contenu: { type: "lieu", nom: "La salle, avant le service", photo: "/direct/bar-salle.jpg" },
      photo: "/direct/bar-salle.jpg",
      scene: sceneDAmbiance(),
      a: maintenant - min(70),
      dure: 180,
      coeurs: 24,
      reponses: [],
    },
    {
      id: "va6",
      qui: "Camille",
      ou: "Une prothésiste ongulaire",
      distance: "210 m",
      metres: 210,
      texte: "Pastel ou plus osé ? 💅",
      nature: "question",
      genre: "essai",
      visibilite: "public",
      persistant: true,
      commerce: { id: "ongle-institut", nom: "Une prothésiste ongulaire", photo: "/direct/pose-ongles.jpg" },
      reference: { carte: "ongle-institut", piece: "p-pastel", nom: "Pastel" },
      photo: "/direct/ongles2.jpeg",
      scene: vitrine(PROTHESISTE),
      a: maintenant - min(95),
      dure: 180,
      coeurs: 16,
      reponses: [],
    },
    {
      // LA TROUVAILLE D'UNE FLEURISTE : la photo du bouquet, rien d'autre.
      // Pas de décor d'atelier tant qu'aucun modèle ne lui convient.
      id: "va8",
      qui: "Léa",
      ou: "Une fleuriste du marché",
      distance: "380 m",
      metres: 380,
      texte: "Des bouquets qui font du bien 🌸",
      nature: "coup-de-coeur",
      genre: "decouverte",
      visibilite: "public",
      persistant: true,
      vecu: true,
      commerce: { id: "fleur-marche", nom: "Une fleuriste du marché", photo: "/direct/bouquet-du-jour.jpg" },
      contenu: { type: "produit", nom: "Le bouquet du jour", photo: "/direct/bouquet-du-jour.jpg" },
      photo: "/direct/bouquet-du-jour.jpg",
      a: maintenant - min(130),
      dure: 180,
      coeurs: 9,
      reponses: [],
    },
    {
      id: "va9",
      qui: "Inès",
      ou: "Un dépôt-vente de la place",
      distance: "260 m",
      metres: 260,
      texte: "Cette tenue pour samedi ? 🧥",
      nature: "question",
      genre: "essai",
      visibilite: "public",
      persistant: true,
      commerce: { id: "mode-depot", nom: "Un dépôt-vente de la place", photo: "/direct/friperie-rayon.jpg" },
      reference: { carte: "mode-depot", piece: "m-leopard", nom: "Manteau léopard" },
      photo: "/direct/essai/mode-depot-apres.jpg",
      scene: vitrine(DEPOT_VENTE),
      a: maintenant - min(160),
      dure: 180,
      coeurs: 7,
      reponses: [],
    },
    {
      id: "va3",
      qui: "Léa",
      ou: "Un lunetier de la rue piétonne",
      distance: "500 m",
      metres: 500,
      texte: "Je les ai essayées sur moi… trop ou pas assez ?",
      nature: "question",
      genre: "essai",
      visibilite: "public",
      persistant: true,
      commerce: { id: "lunetier-pietonne", nom: "Un lunetier de la rue piétonne", photo: "/direct/lunetier.jpeg" },
      reference: { carte: "lunetier-pietonne", piece: "l-fuchsia", nom: "Papillon fuchsia translucide" },
      photo: "/direct/lunettes2.jpeg",
      scene: vitrine(LUNETIER),
      a: maintenant - min(190),
      dure: 180,
      coeurs: 9,
      reponses: [],
    },
    {
      id: "v1",
      qui: "Camille",
      ou: "Devant les Arènes",
      distance: "200 m",
      metres: 200,
      texte: "Quelqu'un sait pourquoi il y a autant de monde devant les Arènes ?",
      nature: "question",
      a: maintenant - min(12),
      dure: 180,
      coeurs: 2,
      reponses: [
        {
          id: "v1r1",
          qui: "Marc",
          texte: "C'est la répétition de la banda avant la feria, ça finit vers 19 h.",
          quand: "il y a 9 min",
        },
        { id: "v1r2", qui: "Sonia", texte: "Ah merci, je me demandais aussi.", quand: "il y a 6 min" },
      ],
    },
    {
      id: "v4",
      qui: "Julien",
      ou: "Rue des Carmes",
      distance: "450 m",
      metres: 450,
      texte: "Cette boulangerie est incroyable, le pain sort du four à 16 h 😍",
      nature: "coup-de-coeur",
      a: maintenant - min(115),
      dure: 240,
      coeurs: 24,
      photo: "/direct/sortie-du-four.jpg",
      reponses: [],
    },
    {
      // LE PONT ENTRE LES DEUX BRIQUES. Un « cherche » qui rassemble assez de
      // monde n'est plus un message : c'est une sortie. C'est là que La Ville
      // et Les Salons cessent d'être deux fonctions côte à côte.
      id: "v5",
      qui: "Nadia",
      ou: "Centre-ville",
      distance: "260 m",
      metres: 260,
      texte: "Quelqu'un cherche à faire quelque chose ce soir ? Je suis seule et j'ai pas envie de rester chez moi.",
      nature: "cherche",
      a: maintenant - min(40),
      dure: 300,
      coeurs: 4,
      interesses: ["Léa", "Karim", "Fatou"],
      reponses: [
        { id: "v5r1", qui: "Léa", texte: "Moi ! Je suis dispo à partir de 19 h.", quand: "il y a 26 min" },
      ],
    },
    {
      id: "v6",
      qui: "Hélène",
      ou: "Près des Arènes",
      distance: "220 m",
      metres: 220,
      texte: "Quelqu'un connaît un bon endroit pour déjeuner près des Arènes ?",
      nature: "question",
      a: maintenant - min(75),
      dure: 240,
      coeurs: 0,
      reponses: [
        { id: "v6r1", qui: "Marc", texte: "Le Bocal de Margot, les lasagnes sont faites le matin. 👍", quand: "il y a 61 min" },
        { id: "v6r2", qui: "Julie", texte: "Chez Bergine aussi, la garbure vaut le détour.", quand: "il y a 52 min" },
        { id: "v6r3", qui: "Hélène", texte: "Parfait, merci à vous deux !", quand: "il y a 40 min" },
      ],
    },
  ];
}

// ─── CE QUE LE NAVIGATEUR GARDE ────────────────────────────────────────────
//
// Même stockage que les avis, les rappels et les salons, et pour la même
// raison : on écrit, on ferme, on revient, et c'est encore là. Rien ne quitte
// le téléphone : la maquette n'a pas de serveur de conversation.

// CE QU'ON ÉCRIT, ET CE QU'ON N'ÉCRIT SURTOUT PAS.
//
// DÉFAUT CORRIGÉ ICI, ET IL VIDAIT LA VILLE. On enregistrait la liste ENTIÈRE,
// exemples compris. Or un exemple porte un instant absolu (`a`), calculé au
// premier chargement : une fois écrit, il cesse d'être « il y a douze minutes »
// et devient « mardi à 14 h 02 ». Le lendemain, la purge — qui fait bien son
// travail — les effaçait tous, et La Ville s'ouvrait sur une place vide. Le
// premier message envoyé suffisait à déclencher l'écriture, donc à condamner
// les exemples.
//
// LA RÈGLE EST DONC : LES EXEMPLES NE SONT JAMAIS ÉCRITS. Ils sont resemés à
// chaque ouverture, toujours relatifs à l'instant présent — c'est ce que
// promet l'en-tête de ce fichier. On n'écrit que ce que le visiteur a fait :
// ses propres messages, et ses retouches sur les exemples (son cœur, ses
// réponses, son intérêt, le salon qu'il a ouvert).
const CLE = "clikme-ville-v2";
/** L'ancien format écrivait les exemples ; on ne le relit pas, on le jette. */
const CLE_MORTE = "clikme-ville-v1";

/** Ce que le visiteur a ajouté SUR un exemple. Le reste vient de la graine. */
type Retouche = {
  monCoeur?: boolean;
  reponses?: ReponseVille[];
  interesses?: string[];
  salon?: string;
};
type Etat = { miennes: MessageVille[]; retouches: Record<string, Retouche> };

const VIDE: Etat = { miennes: [], retouches: {} };
const abonnes = new Set<() => void>();
export const VILLE_VIDE: MessageVille[] = [];
let etat: Etat | null = null;
let cache: MessageVille[] | null = null;

/**
 * CE QUE LA PERSONNE A ÉCRIT, SANS LES EXEMPLES DE LA DÉMONSTRATION — dans une
 * vraie ville, les voisins et les amis de démonstration seraient inventés.
 * Voir `source-ville.ts`.
 */
export function sansLesExemples(messages: MessageVille[]): MessageVille[] {
  const exemples = new Set(messagesSemes().map((m) => m.id));
  return messages.filter((m) => !exemples.has(m.id));
}

/**
 * ═══ LE FIL PARTAGÉ, DANS LA VRAIE VILLE ═══════════════════════════════════
 *
 * Sur `/ville/<ville>`, ce qui est publié ici part au serveur et en revient —
 * voir `ville-sync.ts`, qui se branche ici. Le fil rendu par le serveur
 * (`fil`) remplace alors les exemples : on y lit les publications des autres
 * habitants, celles qu'on a le droit de voir. Dans la démonstration, personne
 * n'est branché et rien ne change.
 */
type PartageVille = {
  publier: (m: MessageVille) => void;
  geste: (id: string, g: { type: "coeur" } | { type: "interesse" } | { type: "reponse"; texte: string }) => void;
  retirer: (id: string) => void;
};
let partage: PartageVille | null = null;
let fil: MessageVille[] | null = null;
let amisDuFil: string[] = [];
export function brancherLePartageVille(p: PartageVille | null): void {
  partage = p;
  if (!p) {
    fil = null;
    amisDuFil = [];
    cache = null;
  }
}
/** Le fil tel que le serveur le rend, et les amis qu'il connaît. */
export function poserLeFil(messages: MessageVille[], amis: string[]): void {
  fil = messages;
  amisDuFil = amis;
  cache = etat ? composer(etat) : null;
  abonnes.forEach((f) => f());
}
/** Les prénoms des amis selon le serveur — vide hors de la vraie ville. */
export function amisPartages(): string[] {
  return amisDuFil;
}

/** Recolle les exemples frais et ce que le visiteur en a fait. */
function composer(e: Etat): MessageVille[] {
  // LA VRAIE VILLE : ce que rend le serveur, plus ce que je viens d'écrire et
  // qu'il n'a pas encore confirmé. Aucun exemple.
  if (fil) {
    const dejaLa = new Set(fil.map((m) => m.id));
    return [...e.miennes.filter((m) => !dejaLa.has(m.id) && resteMinutes(m) > 0), ...fil];
  }
  const semes = messagesSemes().map((m) => {
    const r = e.retouches[m.id];
    if (!r) return m;
    return {
      ...m,
      coeurs: m.coeurs + (r.monCoeur ? 1 : 0),
      monCoeur: r.monCoeur,
      reponses: [...m.reponses, ...(r.reponses ?? [])],
      interesses: r.interesses ?? m.interesses,
      salon: r.salon ?? m.salon,
    };
  });
  // LA PURGE NE PORTE QUE SUR CE QUI EST ÉCRIT, et c'est tout son sens : ce que
  // le visiteur a dit s'efface vraiment au bout de quelques heures — la
  // promesse tient — pendant que la maquette reste peuplée.
  return [...e.miennes.filter((m) => resteMinutes(m) > 0), ...semes];
}

function lire(): Etat {
  if (etat) return etat;
  if (typeof window === "undefined") return VIDE;
  try {
    window.localStorage.removeItem(CLE_MORTE);
    const brut = window.localStorage.getItem(CLE);
    const e = brut ? (JSON.parse(brut) as Etat) : VIDE;
    etat = { miennes: e.miennes ?? [], retouches: e.retouches ?? {} };
  } catch {
    etat = VIDE;
  }
  return etat;
}

function garder(e: Etat) {
  etat = e;
  cache = composer(e);
  try {
    window.localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* Stockage plein ou refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/** Retouche un exemple, ou modifie un message du visiteur : même appel. */
function retoucher(id: string, f: (r: Retouche) => Retouche, g: (m: MessageVille) => MessageVille) {
  const e = lire();
  // UNE PUBLICATION DU FIL PARTAGÉ : l'écran répond tout de suite, le serveur
  // confirme au prochain relevé.
  if (fil?.some((m) => m.id === id)) {
    fil = fil.map((m) => (m.id === id ? g(m) : m));
    cache = composer(e);
    abonnes.forEach((x) => x());
    return;
  }
  if (e.miennes.some((m) => m.id === id)) {
    garder({ ...e, miennes: e.miennes.map((m) => (m.id === id ? g(m) : m)) });
    return;
  }
  garder({ ...e, retouches: { ...e.retouches, [id]: f(e.retouches[id] ?? {}) } });
}

/**
 * CE QUE LA VILLE MONTRE MAINTENANT : les exemples, toujours frais, et ce que
 * le visiteur a dit tant que ça vit encore.
 */
export function chargerVille(): MessageVille[] {
  if (cache) return cache;
  if (typeof window === "undefined") return VILLE_VIDE;
  cache = composer(lire());
  return cache;
}

export function abonnerVille(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Dire quelque chose. Le rangement est déjà fait, et déjà montré. */
export function direQuelqueChose(texte: string, nature: NatureVille, photo?: string) {
  const e = lire();
  const neuf: MessageVille = {
    id: `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    qui: "Vous",
    ou: "Autour de vous",
    distance: "0 m",
    metres: 0,
    texte: texte.trim(),
    nature,
    a: Date.now(),
    // TROIS HEURES, PAS UN JOUR. C'est la durée qui fait qu'à midi on ne voit
    // pas la veille. Elle s'allonge si la ville répond, pas autrement.
    dure: 180,
    coeurs: 0,
    reponses: [],
    photo,
    interesses: nature === "cherche" ? [] : undefined,
    // LA VIE LOCALE EST PUBLIQUE — c'est ce qu'elle a toujours été.
    visibilite: "public",
  };
  garder({ ...e, miennes: [neuf, ...e.miennes] });
  partage?.publier(neuf);
  return neuf;
}

/**
 * PUBLIER DANS LA VILLE — un essai, une découverte, ou la suite d'une
 * publication. Toujours un geste : rien n'y est publié automatiquement.
 */
export function publierDansLaVille(o: {
  texte: string;
  genre?: "essai" | "decouverte";
  nature?: NatureVille;
  photo?: string;
  visibilite: "amis" | "public";
  commerce?: { id: string; nom: string; photo?: string };
  reference?: { carte: string; piece: string; nom: string };
  vecu?: boolean;
  suite?: string;
  scene?: SceneVille;
  contenu?: ContenuPartage;
  audio?: { src: string; duree: number };
  /** Le lieu d'un message sur la ville — facultatif. */
  ou?: string;
}) {
  const e = lire();
  const neuf: MessageVille = {
    id: `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    qui: "Vous",
    ou: o.commerce?.nom ?? (o.ou?.trim() || "Autour de vous"),
    distance: "0 m",
    metres: 0,
    texte: o.texte.trim(),
    nature: o.nature ?? (o.genre === "essai" ? "question" : o.genre === "decouverte" ? "coup-de-coeur" : comprendre(o.texte)),
    genre: o.genre,
    visibilite: o.visibilite,
    persistant: Boolean(o.genre),
    commerce: o.commerce,
    reference: o.reference,
    vecu: o.vecu,
    suite: o.suite,
    a: Date.now(),
    dure: 180,
    coeurs: 0,
    reponses: [],
    photo: o.photo,
    ...(o.scene ? { scene: o.scene } : {}),
    ...(o.contenu ? { contenu: o.contenu } : {}),
    ...(o.audio ? { audio: o.audio } : {}),
  };
  garder({ ...e, miennes: [neuf, ...e.miennes] });
  partage?.publier(neuf);
  return neuf;
}

/** Retirer sa publication — l'auteur seul, et elle disparaît vraiment. */
export function retirerDeLaVille(id: string) {
  const e = lire();
  if (fil) fil = fil.filter((m) => m.id !== id);
  garder({ ...e, miennes: e.miennes.filter((m) => m.id !== id) });
  partage?.retirer(id);
}

/* ═══ LA SUITE DE VOS ÉCHANGES ══════════════════════════════════════════════
   « Un bloc compact, uniquement lorsqu'il existe une nouveauté réelle
   concernant l'utilisateur : réponse à une question… » On retient, pour
   chacune de MES publications, combien de réponses on a déjà vues. */
const CLE_VUS = "clikme-ville-vus-v1";
export const AUCUN_VU: Record<string, number> = {};
let vus: Record<string, number> | null = null;
const abonnesVus = new Set<() => void>();
export function chargerVus(): Record<string, number> {
  if (vus) return vus;
  if (typeof window === "undefined") return AUCUN_VU;
  try {
    vus = JSON.parse(window.localStorage.getItem(CLE_VUS) ?? "{}") ?? {};
  } catch {
    vus = {};
  }
  return vus ?? AUCUN_VU;
}
export function abonnerVus(f: () => void) {
  abonnesVus.add(f);
  return () => void abonnesVus.delete(f);
}
export function marquerVu(id: string, n: number) {
  const avant = chargerVus();
  if (avant[id] === n) return;
  vus = { ...avant, [id]: n };
  try {
    window.localStorage.setItem(CLE_VUS, JSON.stringify(vus));
  } catch {
    /* rien */
  }
  abonnesVus.forEach((f) => f());
}

export function reagirVille(id: string) {
  retoucher(
    id,
    (r) => ({ ...r, monCoeur: !r.monCoeur }),
    (m) => ({ ...m, coeurs: m.coeurs + (m.monCoeur ? -1 : 1), monCoeur: !m.monCoeur }),
  );
  partage?.geste(id, { type: "coeur" });
}

export function repondreVille(id: string, texte: string) {
  const r: ReponseVille = {
    id: `r${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
    qui: "Vous",
    texte: texte.trim(),
    quand: "à l'instant",
  };
  retoucher(
    id,
    (x) => ({ ...x, reponses: [...(x.reponses ?? []), r] }),
    (m) => ({ ...m, reponses: [...m.reponses, r] }),
  );
  partage?.geste(id, { type: "reponse", texte: r.texte });
}

/** Sur un « cherche » : dire que ça vous intéresse. */
export function caMInteresse(id: string) {
  // LA LISTE DE DÉPART VIENT DE LA GRAINE, pas de la retouche : sans ça, dire
  // « ça m'intéresse » ferait disparaître Léa, Karim et Fatou de l'écran.
  const depart = (i: string) => messagesSemes().find((m) => m.id === i)?.interesses ?? [];
  const bascule = (l: string[]) =>
    l.includes("Vous") ? l.filter((x) => x !== "Vous") : [...l, "Vous"];
  retoucher(
    id,
    (r) => ({ ...r, interesses: bascule(r.interesses ?? depart(id)) }),
    (m) => ({ ...m, interesses: bascule(m.interesses ?? []) }),
  );
  partage?.geste(id, { type: "interesse" });
}

/** Marque le salon ouvert depuis un message, pour ne pas en ouvrir deux. */
export function salonDepuisVille(id: string, cle: string) {
  retoucher(id, (r) => ({ ...r, salon: cle }), (m) => ({ ...m, salon: cle }));
}
