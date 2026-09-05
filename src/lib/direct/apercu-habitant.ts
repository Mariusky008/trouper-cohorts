// ⚠️ MAQUETTE DE CONCEPT — CE FICHIER NE DÉCRIT PAS LE PRODUIT.
//
// Il alimente UNE seule page, `/autour-de-moi`, faite pour être montrée de la
// main à la main à quelques habitants et savoir si l'idée leur parle. Elle se
// joue comme si tout existait — c'est le seul moyen d'obtenir une réaction
// utile, et les gens à qui on la montre savent déjà que c'est un essai. Ce qui
// n'existe pas n'est donc écrit NULLE PART à l'écran ; c'est écrit ici, et la
// page est en `noindex` pour que personne ne tombe dessus par hasard.
//
// LES FONCTIONS MISES EN SCÈNE ET QUI N'EXISTENT PAS :
//
//   · l'annonce unique du jour avec ses moments horodatés (voir plus bas) ;
//   · choisir un métier et voir ce que ses commerces proposent maintenant ;
//   · chercher par envie, filtrer par prix ou par disponibilité immédiate ;
//   · les avis attachés à un plat, rappelés quand il revient à la carte.
//
// C'EST POURQUOI CES DONNÉES SONT ICI ET PAS DANS `cartes-demo.ts`. Ce dernier
// alimente la démonstration montrée aux COMMERÇANTS, et la règle y est absolue :
// on ne leur montre jamais un écran qui n'existe pas. Les deux fichiers restent
// séparés pour qu'une fonction imaginaire ne fuie jamais dans un argumentaire
// de vente.
//
// DEUX RÈGLES TIENNENT ENCORE ICI :
//   · aucun commerce inventé n'est nommé — ce sont des voisins anonymes ;
//   · les cartes sont le VRAI composant du produit (`CarteSwipe`).
//
// LES QUATORZE COMMERCES ONT ENFIN UNE PHOTO. Pendant des semaines, le
// coiffeur, la fleuriste, l'onglerie et la mode tombaient sur le repli du
// composant — dégradé et emoji — parce que `public/direct/` ne contenait que
// six images, toutes alimentaires. Ce sont pourtant les métiers que l'annonce
// horodatée a débloqués, donc ceux qu'on montre le plus. Voir
// `public/direct/LISEZ-MOI.md` pour le cadrage et la règle d'anonymat.
import type { CarteDirect } from "@/components/direct/carte-swipe";
import { flashEnCours, partEcoulee, tempsQuiReste } from "./flash";
import type { AnnoncePassee } from "@/lib/direct/historique";

/**
 * LES MÉTIERS, TELS QU'ON LES CHOISIT DANS LE BANDEAU.
 *
 * La mode est là pour une raison précise : c'est le métier qui n'avait rien à
 * dire tant qu'une annonce était une « carte du jour ». Avec la journée
 * horodatée, il a enfin un programme comme les autres.
 */
export const METIERS = [
  { cle: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { cle: "mode", label: "Mode", emoji: "👗" },
  { cle: "bar", label: "Bars", emoji: "🍸" },
  { cle: "coiffeur", label: "Coiffeurs", emoji: "💇" },
  { cle: "fleuriste", label: "Fleuristes", emoji: "💐" },
  { cle: "ongles", label: "Ongleries", emoji: "💅" },
] as const;

export type CleMetier = (typeof METIERS)[number]["cle"];

/** Une envie cochable. Les libellés changent avec le métier. */
export type Envie = { cle: string; label: string; emoji: string };

export const ENVIES: Record<CleMetier, Envie[]> = {
  restaurant: [
    { cle: "italien", label: "Italien", emoji: "🇮🇹" },
    { cle: "moins15", label: "Moins de 15 €", emoji: "💶" },
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "emporter", label: "À emporter", emoji: "🥡" },
    { cle: "partager", label: "Table à partager", emoji: "👥" },
  ],
  mode: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "solde", label: "En promo", emoji: "🏷️" },
    { cle: "arrivage", label: "Nouveautés", emoji: "✨" },
  ],
  bar: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "happy", label: "Happy hour", emoji: "🍷" },
    { cle: "musique", label: "Musique live", emoji: "🎶" },
    { cle: "terrasse", label: "En terrasse", emoji: "☀️" },
  ],
  coiffeur: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "moins30", label: "Moins de 30 €", emoji: "💶" },
    { cle: "couleur", label: "Couleur", emoji: "🎨" },
    { cle: "homme", label: "Coupe homme", emoji: "✂️" },
  ],
  fleuriste: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "moins20", label: "Moins de 20 €", emoji: "💶" },
    { cle: "saison", label: "De saison", emoji: "🌿" },
  ],
  ongles: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "pose", label: "Pose complète", emoji: "💅" },
    { cle: "moins35", label: "Moins de 35 €", emoji: "💶" },
  ],
};

/**
 * UN AVIS SUR CE QU'ON CONSOMME — pas sur l'établissement.
 *
 * Ailleurs on note une maison : une moyenne tirée sur des années, qui ne dit
 * rien de ce qu'il y a dans l'assiette aujourd'hui. Ici l'avis est attaché au
 * PLAT : quand le restaurateur remet sa lasagne à la carte, les avis d'il y a
 * trois semaines reviennent avec elle.
 */
export type AvisPlat = {
  note: number;
  texte: string;
  qui: string;
  quand: string;
  /**
   * LA PHOTO PRISE PAR CELUI QUI Y ÉTAIT.
   *
   * POURQUOI C'EST LA PIÈCE LA PLUS UTILE DE TOUT LE PRODUIT. Les gens
   * photographient déjà leur assiette, leurs ongles, leur bouquet, leur coupe.
   * C'est massif, quotidien, et aujourd'hui totalement invisible pour le
   * commerçant. On n'invente aucun geste : on rend visible celui qui existe.
   *
   * ET ÇA A LA BONNE ASYMÉTRIE — celle qui manquait à toutes les idées
   * « sociales » écartées avant. Le fil des habitants, l'appariement des
   * réservations : il fallait que tout le monde publie. Ici UNE photo suffit à
   * cinquante lecteurs. Cinq personnes motivées dans la ville remplissent
   * l'application.
   *
   * ELLE EST ATTACHÉE AU MOMENT, PAS À L'ÉTABLISSEMENT, et c'est ce qui la
   * distingue du mur de photos de Google : quand le restaurateur remet sa
   * garbure à la carte, son annonce ressort AVEC les photos que ses clients en
   * ont prises l'an dernier. Son annonce s'améliore toute seule à chaque fois
   * qu'il la republie, fabriquée par ses clients, sans qu'il touche à rien.
   *
   * ET ÇA RÈGLE LE MANQUE DE PHOTOS DES AUTRES MÉTIERS. `public/direct/` n'en
   * contient que six, toutes alimentaires ; le coiffeur, la fleuriste et
   * l'onglerie tombent sur un emoji. Or ce sont précisément les métiers où le
   * client photographie le plus — on ne photographie pas une coupe de cheveux
   * moins souvent qu'un plat.
   */
  photo?: string;
};

/**
 * UN MOMENT DE LA JOURNÉE D'UN COMMERCE.
 *
 * C'EST LE CŒUR DU CHANGEMENT, ET IL VIENT D'UN CONSTAT SUR LE TERRAIN. Le
 * produit demandait au commerçant cinq gestes répartis dans la journée : sa
 * carte à 11 h, ce qu'il lui reste à 14 h, ses places libres à 17 h 30. C'est
 * irréaliste — un restaurateur en plein service ne répond pas à 14 h, il est en
 * cuisine. Le produit lui demandait d'être joignable précisément aux heures où
 * il ne l'est jamais.
 *
 * À 10 h, en revanche, il connaît sa journée. Il pose UNE annonce et il y range
 * ses moments : le service de midi, les trois places à −20 %, la table
 * découverte du soir, les restes à venir chercher. Un seul geste, au seul
 * moment où il est disponible.
 *
 * DEUX CONSÉQUENCES, ET ELLES SONT LE VRAI GAIN :
 *
 *  1. LA CARTE VIT AVEC L'HEURE. Une seule annonce, mais elle n'affiche pas la
 *     même chose à 11 h et à 14 h : elle montre CE QUI VIENT. Le commerçant n'a
 *     rien retouché. C'est la promesse « ce qui se passe maintenant » tenue par
 *     la mécanique, et plus par sa bonne volonté.
 *  2. LES MÉTIERS SANS CARTE DU JOUR EXISTENT ENFIN. Un magasin de vêtements
 *     n'a pas de plat du jour, donc n'avait rien à dire, donc ne venait pas.
 *     Mais il a une journée : arrivage ce matin, essayage privé à 15 h, dernier
 *     jour des soldes à 18 h.
 */
/**
 * LE COLLECTIF — CE QUE LE COMMERÇANT NE PEUT PAS OFFRIR À UNE PERSONNE.
 *
 * ─── POURQUOI CE N'EST PAS UNE REMISE ──────────────────────────────────────
 *
 * Un boulanger n'allume pas un four pour trois pains ; pour douze, oui. Un
 * boucher ne vend pas un quart d'agneau ; à quatorze parts, si. Un restaurant
 * préfère une table de six à trois tables de deux. L'affaire n'existe QUE si
 * le groupe existe — c'est pour ça qu'elle ne coûte rien au commerçant, et
 * c'est ce qui la sépare d'un site de bons de réduction.
 *
 * ─── POURQUOI ELLE VIT SUR UN MOMENT ET PAS SUR LA CARTE ───────────────────
 *
 * Parce que c'est une FAÇON D'EN PROFITER, au même rang que le prix du jour ou
 * l'express — pas une conversation posée à côté. Elle se lit donc là où on lit
 * les prix, et c'est la comparaison qui lui donne son sens : « 50 € seul,
 * 45 € à dix » ne veut rien dire si les deux ne sont pas l'un sous l'autre.
 *
 * ─── CE QUE LE COMMERÇANT FAIT, ET QUAND ───────────────────────────────────
 *
 * Il pose le seuil le matin, en publiant sa journée, et il n'y revient jamais.
 * Aucune de ces valeurs ne lui demande d'être devant son téléphone : le compte
 * monte tout seul, et le prix tombe tout seul. C'est la seule forme qui tienne
 * pour un boulanger ou une vendeuse qui sont en boutique, pas sur un écran.
 */
export type Collectif = {
  /** Combien il en faut pour que ça se déclenche. */
  objectif: number;
  /** Combien s'y sont déjà mis. */
  participants: number;
  /**
   * LE PRIX UNE FOIS LE SEUIL ATTEINT — et il vaut POUR TOUT LE MONDE, y
   * compris les premiers inscrits. Sans cette règle, les premiers attendent au
   * lieu d'aller chercher du monde, et le compteur ne monte jamais.
   */
  prixGroupe?: string;
  /**
   * CE QUE LE NOMBRE DÉBLOQUE QUAND CE N'EST PAS UN PRIX. « il lance une
   * fournée à 17 h », « il découpe une bête entière ». Le mécanisme est le
   * même ; ce qui est en jeu change de métier en métier, et c'est justement ce
   * qui permet de n'en apprendre qu'un seul.
   */
  debloque?: string;
  /** Les prénoms de ceux qui y sont. Des inconnus — c'est tout le sujet. */
  qui?: string[];
  /**
   * LA FENÊTRE DE CONFIRMATION — ce qui donne du poids à un clic gratuit.
   *
   * ─── LE PROBLÈME QU'ELLE RÈGLE, ET IL TUE LE MÉCANISME SANS ELLE ────────
   *
   * S'inscrire ne coûte rien, donc ça ne vaut rien : douze inscrits peuvent
   * donner quatre présents, et le boulanger qui a chauffé son four pour rien
   * ne recommencera jamais. La réponse habituelle est l'empreinte bancaire.
   * Elle est hors de portée ici — et elle n'est pas nécessaire.
   *
   * ─── CE QUI LA REMPLACE : UN SECOND GESTE, PLUS TARD, AVEC UN DÉLAI ─────
   *
   * Le seuil n'est pas la fin, c'est le début d'une fenêtre courte. Quand il
   * tombe, tout le monde reçoit « c'est bon, confirmez avant 15 h », et SEULS
   * LES CONFIRMÉS COMPTENT. Le même clic redemandé quelques heures avant
   * sépare les curieux des vrais, parce qu'il arrive au moment où la personne
   * sait vraiment si elle vient. Si l'on retombe sous le seuil, ça n'a pas
   * lieu et personne n'a rien perdu.
   *
   * ─── ET LE COMMERÇANT N'EST JAMAIS ENGAGÉ PAR UN COMPTEUR ──────────────
   *
   * C'est lui qui appuie sur « je lance », avec le nombre de confirmés sous
   * les yeux. Deux conséquences qu'on ne code pas ici parce qu'elles vivent
   * dans son espace, mais qui font partie du même dessin :
   *   · IL POSE SON SEUIL AU-DESSUS DE SON BESOIN RÉEL — il lui faut huit, il
   *     demande douze. Les compagnies aériennes font ça depuis cinquante ans,
   *     ça ne coûte rien à construire, et ça absorbe la casse.
   *   · IL VOIT LA FIABILITÉ, PAS LES NOMS — « 9 confirmés, dont 7 qui
   *     viennent toujours ». Deux lapins de suite et l'on ne peut plus
   *     rejoindre de collectif pendant un temps. Dans une ville de vingt
   *     mille habitants, ça pèse plus qu'une empreinte bancaire, et c'est
   *     gratuit. Même mécanisme que la suspension du salon public : un seul
   *     système règle les deux.
   *
   * Absente : le seuil n'est pas tombé, on en est encore à réunir du monde.
   */
  fenetre?: {
    /** L'heure limite, telle qu'on l'écrit. */
    jusqua: string;
    /** Combien ont refait le geste. C'est CE nombre qui décide. */
    confirmes: number;
    /** VRAI quand c'est moi qui ai confirmé — pour ne pas le redemander. */
    moi?: boolean;
  };
};

/** Combien il en manque. Jamais négatif. */
export function manqueCollectif(c: Collectif): number {
  return Math.max(0, c.objectif - c.participants);
}

/** Le seuil est-il tombé ? */
export function collectifComplet(c: Collectif): boolean {
  return manqueCollectif(c) === 0;
}

/**
 * L'avancement, entre 0 et 1.
 *
 * JAMAIS ZÉRO EXACT DÈS QU'UNE PERSONNE S'EST ENGAGÉE : une jauge vide alors
 * qu'on vient d'appuyer donne l'impression que le geste n'a rien fait. On
 * plancher à 6 % — assez pour se voir, trop peu pour mentir. La même règle
 * qu'`avancement()` dans `cliks.ts`, et pour la même raison.
 */
export function avancementCollectif(c: Collectif): number {
  if (c.objectif <= 0) return 0;
  const p = Math.max(0, Math.min(1, c.participants / c.objectif));
  return p > 0 && p < 0.06 ? 0.06 : p;
}

/**
 * LA PHRASE, EN UNE LIGNE.
 *
 * ELLE DIT « POUR TOUT LE MONDE », ET CE N'EST PAS UN ORNEMENT : c'est la
 * seule information qui donne à celui qui lit une raison d'aller chercher les
 * trois qui manquent plutôt que d'attendre que d'autres le fassent.
 */
export function phraseCollectif(c: Collectif): string {
  // ─── DEUXIÈME TEMPS : LA FENÊTRE EST OUVERTE ───
  // Le compteur ne dit plus la même chose. Avant, il comptait des intentions ;
  // maintenant il compte des engagements, et c'est le seul qui décide. La
  // phrase doit donc changer de nature, pas seulement de chiffre — sinon on
  // croit que c'est acquis parce que la barre est pleine.
  if (c.fenetre) {
    const reste = Math.max(0, c.objectif - c.fenetre.confirmes);
    if (reste === 0) {
      return c.prixGroupe
        ? `C’est confirmé — ${c.prixGroupe} pour tout le monde.`
        : `C’est confirmé — ${c.debloque ?? "c’est débloqué"}.`;
    }
    const gens = reste === 1 ? "1 confirmation" : `${reste} confirmations`;
    return `Le compte y est. Encore ${gens} avant ${c.fenetre.jusqua}, et c’est lancé.`;
  }
  const m = manqueCollectif(c);
  if (m === 0) {
    return c.prixGroupe
      ? `C’est fait — ${c.prixGroupe} pour tout le monde.`
      : `C’est fait — ${c.debloque ?? "c’est débloqué"}.`;
  }
  const gens = m === 1 ? "1 personne" : `${m} personnes`;
  return c.prixGroupe
    ? `Encore ${gens} et il tombe à ${c.prixGroupe} pour tout le monde.`
    : `Encore ${gens} et ${c.debloque ?? "c’est débloqué"}.`;
}

/**
 * CE QUE COMPTE LA JAUGE — et il change de sens en cours de route.
 *
 * Avant la fenêtre : des intéressés, un clic gratuit. Pendant : des confirmés,
 * un second geste. La même barre, deux natures — c'est ce qui permet de n'en
 * avoir qu'une seule à l'écran, et c'est le libellé qui dit laquelle.
 */
export function compteCollectif(c: Collectif): { fait: number; mot: string } {
  return c.fenetre
    ? { fait: c.fenetre.confirmes, mot: "confirmés" }
    : { fait: c.participants, mot: "" };
}

/** L'avancement affiché : celui de la phase en cours. */
export function partCollectif(c: Collectif): number {
  if (!c.fenetre) return avancementCollectif(c);
  if (c.objectif <= 0) return 0;
  const p = Math.max(0, Math.min(1, c.fenetre.confirmes / c.objectif));
  return p > 0 && p < 0.06 ? 0.06 : p;
}

/**
 * LE COLLECTIF D'UNE CARTE, S'IL Y EN A UN — celui qu'on annonce sur la face.
 *
 * ON N'EN MONTRE QU'UN, ET C'EST LE PREMIER QUI N'EST PAS ENCORE PASSÉ. Deux
 * jauges sur la face d'une carte qu'on balaie en trois secondes ne se lisent
 * pas : on n'aurait plus une information, on aurait un tableau.
 */
export function collectifDeLaCarte(
  carte: { moments: MomentJour[] },
  heure?: number,
): { moment: MomentJour; col: Collectif } | null {
  for (const m of carte.moments) {
    // PASSÉ, ON NE L'ANNONCE PLUS : proposer de rejoindre un groupe dont
    // l'heure est derrière soi est la meilleure façon de perdre quelqu'un.
    if (heure != null && heure >= m.a) continue;
    if (m.collectif) return { moment: m, col: m.collectif };
  }
  return null;
}

export type MomentJour = {
  /** Début et fin en heures décimales — 11.5 vaut 11 h 30. */
  de: number;
  a: number;
  /**
   * QUAND IL L'A DIT — et c'est autre chose que `de`.
   *
   * LA DIFFÉRENCE QUI FAIT TOUT LE SUJET. `de` et `a` disent quand la chose est
   * VRAIE : le plat est servi de midi à 14 h. `publie` dit quand le commerçant
   * l'a ANNONCÉE. Les deux se confondent rarement : il prévient à 10 h pour un
   * service de midi, ou il sort de sa cuisine à 13 h 20 parce qu'il lui reste
   * trois portions et qu'il vient de le décider.
   *
   * CE QU'ON EN FAIT. Une annonce qui vient de tomber remonte en tête du paquet
   * et porte son heure. C'est la seule chose qu'aucune fiche Google, aucun site
   * et aucun horaire d'ouverture ne saura jamais dire : « il vient de se passer
   * quelque chose, il y a douze minutes, à trois cents mètres ».
   *
   * ET CE N'EST PAS UN DIRECT. On a hésité avec le mot, et il est faux : un
   * « direct » promet une caméra allumée, donc quelqu'un qui parle, donc une
   * performance — exactement ce qui bloque les commerçants depuis quinze ans, et
   * exactement ce qu'on vient de désamorcer avec le rond muet. Il y aurait trois
   * directs le premier mois et zéro le deuxième. Un MOMENT ne demande rien de
   * plus que ce qu'il fait déjà : il apparaît, il vit, il disparaît.
   *
   * FACULTATIF, ET L'ABSENCE VEUT DIRE QUELQUE CHOSE. Sans `publie`, le moment
   * n'est jamais frais. C'est voulu : si tout le paquet est frais, plus rien ne
   * l'est. La fraîcheur doit rester rare pour valoir quelque chose.
   */
  publie?: number;
  /**
   * LA PHOTO DE CE MOMENT-LÀ — et elle passe devant celle du commerce.
   *
   * LE DÉFAUT QUI L'A FAIT NAÎTRE : « on ne me demande pas de prendre la photo,
   * donc quand on voit l'annonce il n'y a aucune image, ce qui fait très vide ».
   * C'est exact, et c'est plus grave que « vide » : une carte sans image dans un
   * paquet qu'on balaie ne se regarde pas. Le plat est ce qui donne faim, pas le
   * nom du plat.
   *
   * POURQUOI SUR LE MOMENT ET PAS SUR LE COMMERCE. La photo du commerce est une
   * devanture : elle ne change jamais et ne dit rien d'aujourd'hui. Celle-ci est
   * l'assiette d'aujourd'hui, l'arrivage de ce matin, l'ardoise de midi. Deux
   * moments d'un même commerce n'ont aucune raison de partager une image.
   */
  photo?: string;
  /** L'heure telle qu'on l'écrit. */
  quand: string;
  /** Ce que c'est, en trois mots. */
  titre: string;
  /** Le détail, une ou deux lignes. */
  lignes?: string[];
  /**
   * SON CONSEIL DU JOUR — voir `Voix`.
   *
   * IL EST SUR LE MOMENT ET NON SUR LE COMMERCE, parce qu'il change avec ce
   * qu'il a : « prenez plutôt la bavette » n'a de sens que le jour où la côte
   * est moins belle. Une phrase attachée à la boutique deviendrait un slogan,
   * et un slogan ne se relit pas deux fois.
   *
   * IL PREND LA PLACE DU DÉTAIL, IL NE S'AJOUTE PAS. La carte affiche
   * aujourd'hui une ligne écrite par le produit — « Salade de saison · Prêtes
   * tout de suite, à emporter » — que personne n'a jamais lue. On remplace du
   * texte mort par une voix : zéro pixel de plus sur un écran déjà chargé.
   */
  conseil?: string;
  prix?: string;
  prixBarre?: string;
  etiquette?: string;
  /**
   * ⚡ UNE OFFRE QUI SE PÉRIME EN TRENTE MINUTES — voir `flash.ts`.
   *
   * POURQUOI C'EST UN CHAMP DU MOMENT ET PAS UN TYPE À PART. « Je ne ferais pas
   * du Flash le cœur de ClikMe : ce serait une mécanique puissante À
   * L'INTÉRIEUR du Direct. » Un type séparé aurait demandé un second classement,
   * un second archivage, une seconde façon de remonter dans le paquet — et
   * aurait fini par vivre à côté du produit au lieu de dedans. Ici il hérite de
   * tout : la fraîcheur qui le met en tête, la journée qui le porte, le soir qui
   * le range. La carte lit ce champ pour se dessiner autrement, et c'est la
   * seule chose qui change.
   */
  flash?: import("./flash").Flash;
  /**
   * CE QUI EST DONNÉ, PAS VENDU — et c'est autre chose qu'un prix à zéro.
   *
   * ─── D'OÙ ÇA VIENT ────────────────────────────────────────────────────
   *
   * « Est-ce que ce serait une bonne idée de mettre une partie réservée à ce
   * qu'on vend aussi en tant que client — je fais des portions de gâteau aux
   * pommes à 1 €, je fais de la couture à la maison ? »
   *
   * L'idée est juste et elle est native : « il me reste six parts à prendre
   * avant 18 h » a exactement la forme d'un moment — vrai maintenant, à côté,
   * et ça disparaît tout seul. Mais la VENTE entre particuliers met un
   * concurrent non déclaré à côté d'un commerçant qui paie un loyer et des
   * charges, au moment précis où on va lui demander de signer. Le DON, lui,
   * ne pose aucune de ces questions.
   *
   * ─── ET ON COMMENCE PAR LES COMMERÇANTS ───────────────────────────────
   *
   * Parce qu'une vue vide rend l'application plus pauvre, pas plus riche. Le
   * boulanger qui préfère offrir ses six viennoiseries de 19 h plutôt que les
   * jeter existe déjà, il est identifiable, et il remplit la vue dès le
   * premier jour. Les voisins viendront ensuite, dans un endroit qui vit.
   *
   * ─── POURQUOI UN DRAPEAU ET PAS « prix: "0 €" » ───────────────────────
   *
   * Un prix à zéro reste un prix : il se compare, il se négocie, et il ouvre
   * la porte au « 1 € » puis au « 3 € ». Le drapeau, lui, rend la vente
   * IMPOSSIBLE sur cette carte — le prix est effacé à la source, pas
   * déconseillé. C'est la même leçon que la carte à valider : ce qui compte
   * doit être impossible, pas recommandé.
   */
  offert?: boolean;
  /** Combien il en reste. Zéro : c'est complet. */
  places?: number;
  /** Ce que ce moment devient à plusieurs. Absent : il n'y a rien à rejoindre,
   *  et aucune jauge n'apparaît nulle part — ni ici, ni sur la face. */
  collectif?: Collectif;
  /** L'emoji du moment. */
  icone: string;
  /** Le libellé du bouton. Vide : rien à réserver, on passe, c'est tout. */
  action?: string;
  /** Les envies auxquelles CE moment répond. */
  envies: string[];
  /** Les avis, quand le moment porte sur quelque chose qui se goûte ou s'essaie. */
  avis?: AvisPlat[];
  /**
   * DIX SECONDES DE CE QUI SE PASSE VRAIMENT — et pas sur la face de la carte.
   *
   * OÙ ELLE VA, ET POURQUOI PAS AILLEURS. Une vidéo qui se lance dans un paquet
   * qu'on balaie rend l'application lourde, coûte de la donnée à quelqu'un
   * debout dans la rue, et retarde le geste. Sous le pli, elle a un vrai rôle :
   * on a vu le plat, il donne envie, on descend, et on voit la cuisine.
   *
   * ELLE PASSE LE FILTRE DU PRODUIT — celui qui a fait survivre les moments
   * horodatés, le digestif offert et le recrutement : beaucoup de commerçants
   * FILMENT DÉJÀ leur service pour leur story. Ce n'est pas un geste nouveau à
   * leur apprendre, c'est un fichier qu'ils ont déjà. C'est la seule raison pour
   * laquelle elle est ici.
   *
   * Muette, en boucle, dix secondes. Jamais de son qui démarre tout seul.
   */
  video?: { mp4: string; webm: string; affiche: string; mot: string };
  /**
   * COMBIEN DE VOISINS ONT DÉJÀ DEMANDÉ QUE ÇA REVIENNE.
   *
   * C'est le seul chiffre du produit qui vienne des habitants et pas du
   * commerçant, et c'est ce qui le rend intéressant pour les deux : celui qui
   * lit voit qu'il n'est pas seul à vouloir, celui qui cuisine apprend quoi
   * mettre à la carte jeudi — une information qu'il n'a nulle part ailleurs.
   *
   * Absent : personne ne l'a encore demandé, et on n'affiche donc aucun compte.
   * Un « 0 » affiché est un échec affiché ; le bouton se suffit à lui-même.
   */
  rappels?: number;
  /**
   * CE QUE LE COMMERÇANT A RÉPONDU. Quand il remet la chose à la carte, il pose
   * le jour, et ceux qui l'avaient demandée sont prévenus.
   *
   * C'EST LA MOITIÉ QUI COMPTE. Un bouton qui envoie une demande dans le vide
   * est une boîte à idées, et personne n'appuie deux fois sur une boîte à
   * idées. Ce qui fait revenir, c'est d'avoir vu une fois que ça marchait.
   */
  revient?: string;
};

/**
 * CE QU'UN COMMERCE RÉPOND QUAND QUELQU'UN ANNONCE QU'IL SORT.
 *
 * C'EST L'INVERSION DE TOUT LE PRODUIT, ET ELLE VIENT D'UN CONSTAT DE TERRAIN :
 * à Dax, aucun restaurant n'est complet. La capacité est abondante, donc elle
 * ne vaut rien — et une table qui se libère dans une salle à moitié vide
 * n'intéresse personne. Ce qui est rare dans cette ville, ce que tout le monde
 * s'arrache sans pouvoir l'attraper, c'est QUELQU'UN QUI A DÉCIDÉ DE SORTIR
 * DÉPENSER ET QUI N'A PAS ENCORE CHOISI OÙ.
 *
 * Quand l'offre dépasse la demande, on ne joue pas sur la rareté : on joue sur
 * la courtisation. L'habitant dit qu'il sort ; les commerces qui veulent le
 * recevoir se manifestent. Ce n'est pas une recherche filtrée — RIEN N'EXISTE
 * avant qu'il demande. Les cartes arrivent une par une, adressées à lui.
 *
 * ET CE N'EST PAS FORCÉMENT UNE REMISE. Dans une ville où tout le monde est à
 * moitié vide, l'attention vaut plus que 10 % : « je vous garde la table près
 * de la fenêtre » a plus d'effet qu'un prix barré, et ne coûte rien.
 *
 * LE COMMERÇANT NE RÉPOND PAS PENDANT LE SERVICE — il a armé son offre le
 * matin, avec la même ardoise que ses moments. Ça se déclenche tout seul.
 */
export type Reponse = {
  /**
   * CE QU'IL OFFRE — et c'est ça qu'on lit en premier sur la carte.
   *
   * LE DÉFAUT QUE ÇA CORRIGE, MESURÉ SUR DE VRAIES PERSONNES. Les premières
   * réponses ne donnaient « pas du tout envie » : une phrase aimable, sans
   * photo, sans prix, sans avis, et rien à gagner. Une attention seule ne fait
   * pas se lever quelqu'un — il faut qu'il se sente PRIVILÉGIÉ.
   *
   * Le cadeau n'est pas une remise, et la différence n'est pas cosmétique : un
   * digestif offert coûte deux euros au restaurateur et se raconte, « −10 % »
   * lui coûte deux euros aussi et ne se raconte pas. Ce qui engage, c'est qu'on
   * vous donne quelque chose, pas qu'on vous fasse un prix.
   */
  cadeau: string;
  /** Le mot du commerçant, court et adressé. Il vient SOUS le cadeau. */
  texte: string;
  /** Jusqu'à quand il la tient. Une proposition sans échéance ne fait pas bouger. */
  tenu: string;
  /** Dans combien de secondes elle arrive. La maquette échelonne les réponses :
   *  toutes en même temps, on ne verrait pas qu'elles VIENNENT de commerces. */
  apres: number;
};

/**
 * CE QU'UN COMMERCE CHERCHE — DES BRAS, PAS DES CLIENTS.
 *
 * POURQUOI CETTE SECONDE NATURE D'ANNONCE EXISTE. Jusqu'ici la page ne portait
 * que l'actualité COMMERCIALE d'un commerce : ce qu'il propose à manger, à
 * essayer, à réserver. Or ce n'est pas toute son actualité, et ce n'est même pas
 * celle qui lui fait le plus mal. À Dax, première station thermale de France, la
 * saison décide de l'année, et le mur de mars c'est de trouver deux personnes.
 *
 * TROIS RAISONS QUE ÇA VIVE ICI ET PAS SUR UN SITE D'EMPLOI :
 *
 *  1. C'EST LE MÊME LECTEUR. Dans une ville de vingt mille habitants, celui qui
 *     regarde où déjeuner, son fils, sa voisine, c'est le vivier de saisonniers.
 *     À Paris ce seraient deux audiences ; ici c'est la même personne.
 *  2. C'EST CE QUI SE PAIE DÉJÀ. Un commerçant ne paiera jamais pour publier son
 *     plat du jour — il croit que Facebook est gratuit. Il paie déjà pour
 *     recruter, et il reçoit des candidatures de Bordeaux qui ne viendront pas.
 *  3. UN SITE D'EMPLOI A DES CANDIDATS ; ICI IL Y A DES VOISINS QUI OUVRENT
 *     L'APPLICATION POUR AUTRE CHOSE. Ce n'est pas une offre d'emploi, c'est
 *     « le bar à deux cents mètres de chez toi cherche quelqu'un ».
 *
 * ET SURTOUT : PAS DE CV, PAS DE FORMULAIRE. On reprend exactement la mécanique
 * de l'invitation — « passez me voir jeudi entre 15 h et 17 h ». C'est déjà
 * comme ça qu'on embauche un saisonnier dans une ville de cette taille. Le
 * produit n'ajoute pas un site d'emploi : il enlève le site d'emploi.
 *
 * CE N'EST PAS UN MOMENT DE LA JOURNÉE, C'EST UN ÉTAT DU COMMERÇANT. Une
 * recherche dure trois semaines, elle ne dépend pas de l'heure, et elle ne
 * s'affiche donc jamais entre deux plats dans le paquet : elle a son entrée à
 * elle, et elle vit sur la fiche du commerce.
 */
export type Recrutement = {
  /** Le poste, tel qu'on le dirait à quelqu'un. */
  poste: string;
  /** La période. Le mot « saison » décide de tout dans cette ville. */
  quand: string;
  /** Le contrat en une ligne, horaires compris — c'est la vraie question. */
  contrat: string;
  /**
   * LA PAYE, ÉCRITE. Une annonce locale sans salaire ne fait venir personne, et
   * le commerçant qui le cache passe pour celui qui a quelque chose à cacher.
   */
  paye: string;
  /** Le mot du patron, court. C'est lui qui fait la différence avec Indeed. */
  qui: string;
  /** QUAND ON PASSE. Le cœur du truc : on ne postule pas, on pousse la porte. */
  passez: string;
  /**
   * Depuis combien de temps c'est en ligne. COURT : cette chaîne finit dans la
   * pastille du haut de la carte, qui partage sa ligne avec « Y aller » —
   * « en ligne depuis 12 jours » s'y coupait au milieu (mesuré à 402 px).
   */
  depuis: string;
};

/**
 * LE MENU DU JOUR — CE QU'ON VIENT VOIR, ET RIEN D'AUTRE.
 *
 * LE DÉFAUT QU'IL CORRIGE. La carte d'un restaurant affichait le MOMENT en
 * cours : à 11 h « manger avec le service », à 14 h « les restes ». C'était la
 * démonstration d'une mécanique — une annonce qui vit avec l'heure — mais du
 * point de vue de celui qui regarde, c'était une carte qui ne répond jamais à
 * la seule question qu'il se pose : QU'EST-CE QU'ON MANGE. Et la photo suivait
 * le moment, donc on tombait sur une salle vide ou une devanture au lieu d'une
 * assiette.
 *
 * Le menu du jour devient donc l'ancre : la même en haut de la carte à toute
 * heure, avec sa description, son prix et LA PHOTO DU PLAT. Les moments
 * horodatés n'ont pas disparu — ils sont descendus sous le pli, à leur vraie
 * place : le programme de la journée, qu'on déroule si le plat donne envie.
 *
 * Le commerçant n'a pas plus de travail : il pose son plat du jour le matin,
 * comme il l'écrit déjà sur son ardoise, et il coche ce qu'il propose autour.
 */
export type MenuDuJour = {
  /** Le plat, écrit comme sur l'ardoise. */
  plat: string;
  /** Ce qu'il y a autour : entrée, dessert, ce qui l'accompagne. */
  description: string;
  prix: string;
  /** LA PHOTO DU PLAT, pas celle de la salle. C'est elle qui fait venir. */
  photo: string;
  cadrage?: string;
};

// ═══════════════════════════════════════════════════════════════════════
// LE CATALOGUE — CE QU'IL PROPOSE D'HABITUDE.
//
// LA DISTINCTION QUE CE PRODUIT DOIT TENIR, ET QU'IL PERDRAIT ICI EN PREMIER :
//
//   LE DIRECT    = vivant, maintenant, éphémère. C'est l'annonce.
//   LE CATALOGUE = permanent, référence. C'est « et sinon, il fait quoi ? »
//
// LE RISQUE EST DE DEVENIR UN CATALOGUE, et il est réel : un catalogue est
// plus facile à remplir, plus facile à mesurer, et c'est ce que fait déjà
// tout le monde. Le jour où l'écran principal montre « tout ce que propose ce
// commerce », ClikMe n'a plus de raison d'exister. Le catalogue est donc
// SECONDAIRE PARTOUT : un bouton discret sous l'annonce, jamais une section,
// jamais un onglet, et jamais à côté de « En parler » ou de « Réserver ».
//
// IL EXISTE POUR UNE SEULE RAISON UTILE, ET ELLE EST DANS LE SALON : quand
// quelqu'un dit « moi je préférerais autre chose », il faut qu'il puisse le
// DIRE EN UN GESTE au lieu de le taper. Le catalogue est la liste de choix
// qui manquait à la proposition.
//
// IL FONCTIONNE POUR TOUS LES MÉTIERS, et c'est pour ça qu'il ne s'appelle
// pas « les menus ». Un coiffeur a des prestations, une fleuriste des
// créations, une boutique des produits. Le mot change à l'écran ; le
// mécanisme, jamais.

/** Une entrée du catalogue : un plat, une prestation, un produit, une création. */
export type ArticleCatalogue = {
  id: string;
  nom: string;
  /** Ce qu'il y a autour. Une ligne, jamais un paragraphe. */
  detail?: string;
  prix?: string;
  photo?: string;
  /** Le rayon : « Entrées », « Coupes », « Bouquets »… Facultatif. */
  rayon?: string;
};

/**
 * COMMENT CE MÉTIER APPELLE SON CATALOGUE.
 *
 * Le libellé se déduit du métier déclaré, sans que le commerçant ait à
 * choisir quoi que ce soit — il n'a pas à apprendre notre vocabulaire pour
 * que sa page soit juste. Ce qui n'est pas reconnu retombe sur « le
 * catalogue », qui est vrai pour tout le monde et faux pour personne.
 */
export function motCatalogue(metier: string): {
  emoji: string;
  /** Sur le bouton : « Voir la carte ». */
  verbe: string;
  /** En titre de la feuille : « La carte ». */
  titre: string;
} {
  const m = metier.toLowerCase();
  if (/restaurant|bistrot|traiteur|brasserie|pizz/.test(m))
    return { emoji: "🍽️", verbe: "Voir la carte", titre: "La carte" };
  if (/bar|caviste|vins/.test(m))
    return { emoji: "🍷", verbe: "Voir la carte", titre: "La carte" };
  if (/boulanger|pâtiss|patiss|choco|primeur|fromag|boucher/.test(m))
    return { emoji: "🥖", verbe: "Voir les produits", titre: "Les produits" };
  if (/coiffeur|barbier|institut|esthét|esthet|ongulaire|ongle|massage|spa/.test(m))
    return { emoji: "✂️", verbe: "Voir les prestations", titre: "Les prestations" };
  if (/fleurist/.test(m))
    return { emoji: "💐", verbe: "Voir les créations", titre: "Les créations" };
  if (/porter|friperie|mode|boutique|chauss|bijou|opticien|librairie/.test(m))
    return { emoji: "🛍️", verbe: "Voir les produits", titre: "Les produits" };
  if (/garage|garagiste|réparat|reparat|plomb|électric|electric|artisan/.test(m))
    return { emoji: "🔧", verbe: "Voir les prestations", titre: "Les prestations" };
  return { emoji: "📖", verbe: "Voir le catalogue", titre: "Le catalogue" };
}

/**
 * L'OFFRE PROPOSÉE À UNE SEULE PERSONNE À LA FOIS — le tour de rôle.
 *
 * LE PROBLÈME QUE PERSONNE NE SAIT TRAITER. « Il me reste deux croissants. »
 * Aucune plateforme ne sait publier ça : envoyé à quatre cents abonnés, ça fait
 * trois cent quatre-vingt-dix-huit déçus et une course à qui clique le plus
 * vite. Alors le commerçant ne le dit pas, et les deux croissants sont jetés.
 * C'est vrai tous les soirs, dans tous les commerces de bouche de la ville.
 *
 * CE QU'ON FAIT À LA PLACE : ça part à UNE personne, qui a cinq minutes. Elle
 * prend, ou elle passe, ou elle ne répond pas — et ça continue tout seul chez
 * la suivante. Le commerçant a appuyé une fois et n'a plus rien à faire.
 *
 * POURQUOI C'EST UN TOUR ET PAS UNE LOTERIE, et c'est tout le sujet moral.
 * L'ordre n'est pas le hasard et surtout pas la vitesse de clic : c'est celui
 * qui n'a rien reçu depuis le plus longtemps qui passe devant. Une course de
 * rapidité désigne toujours les mêmes gagnants — ceux qui ont le téléphone en
 * main — et apprend à tous les autres que ce n'est pas pour eux. Un tour de
 * rôle, lui, donne une raison de rester abonné même quand on n'a pas eu celui
 * d'aujourd'hui : on remonte dans la file.
 *
 * ET C'EST POUR ÇA QUE L'ATTENTE EST ÉCRITE. « 4 personnes après vous » dit
 * deux choses en cinq mots : que ce n'est pas une publicité de masse, et que
 * si on ne répond pas quelqu'un d'autre l'aura. C'est le seul compte à rebours
 * du produit qui soit honnête — il n'est pas là pour presser, il est là parce
 * qu'il y a vraiment quelqu'un derrière.
 */
export type TourDeRole = {
  /** Ce qu'il reste, dit comme il le dirait : « 2 croissants aux amandes ». */
  quoi: string;
  detail?: string;
  prix?: string;
  prixBarre?: string;
  /** Combien de minutes j'ai pour répondre. */
  minutes: number;
  /** Combien attendent derrière moi si je passe. */
  apres: number;
};

/**
 * LE BULLETIN DU JOUR — ce que seuls les abonnés voient.
 *
 * D'OÙ VIENT L'IDÉE : « comme un bulletin météo du jour du commerçant ». Elle
 * est juste, et voici pourquoi. Un abonnement qui ne donne que des offres est
 * un abonnement à de la publicité : on s'en désabonne au bout de trois
 * semaines. Ce qui fait revenir, c'est la CURIOSITÉ — savoir comment va
 * quelqu'un qu'on croise deux fois par semaine sans jamais lui parler.
 *
 * CE QU'ON A REFUSÉ D'Y METTRE, ET C'EST AUSSI IMPORTANT. Pas de vlog, pas de
 * dédicaces, pas de direct réservé aux membres : tout cela suppose un
 * commerçant qui produit du contenu et qui a du temps. Or tout ce qu'on sait de
 * lui dit l'inverse — il n'est pas sur son téléphone, il a les mains prises, et
 * il arrêtera en neuf jours. Ce qui reste ici tient en UN GESTE : une humeur
 * qu'on désigne du doigt, et une phrase. C'est le maximum de ce qu'on peut lui
 * demander tous les jours, et c'est déjà quelque chose qu'aucune chaîne ne
 * pourra jamais imiter — parce qu'une chaîne n'a pas d'humeur.
 */
export type Bulletin = {
  /** Un doigt sur un visage, le matin. Rien à écrire. */
  humeur: { emoji: string; mot: string };
  /** Ce qui vient d'arriver, en une phrase. Facultatif, et souvent absent. */
  mot?: string;
  tour?: TourDeRole;
};

/**
 * LA VOIX DU COMMERÇANT — et tout y est facultatif, sans exception.
 *
 * LE CONSTAT D'OÙ ELLE SORT. « Il manque toujours la dimension humaine ; le
 * personal branding est ce qui fonctionne le mieux pour vendre et aucun
 * commerçant ne sait le faire. » C'est exact, et la raison est simple : tout
 * ce qu'on leur propose depuis quinze ans suppose qu'ils PRODUISENT quelque
 * chose — des photos, des vidéos, des publications, une ligne éditoriale. Ils
 * n'ont ni le temps, ni l'envie, ni le métier pour ça. Alors ils ne font rien,
 * et on en conclut qu'ils ne veulent pas.
 *
 * CE QU'ON DEMANDE À LA PLACE, ET C'EST TOUTE L'ASTUCE : rien de nouveau. Un
 * commerçant CONSEILLE toute la journée — « prenez plutôt la bavette
 * aujourd'hui, la côte je la trouve moins belle ». Il le dit cinquante fois
 * par jour, gratuitement, sans y penser, et ça ne sort jamais de sa boutique.
 * On lui demande d'écrire une fois ce qu'il vient de dire à voix haute.
 *
 * ET C'EST STRICTEMENT INCOPIABLE. Un prix se copie, une photo se copie, une
 * promotion se copie. Un jugement, non : il n'appartient qu'à celui qui le
 * porte. Ni un supermarché, ni une chaîne, ni le voisin de la même rue ne
 * peuvent reprendre « la côte, je la trouve moins belle aujourd'hui ».
 *
 * TOUT EST FACULTATIF, ET LA CARTE SANS VOIX EST EXACTEMENT CELLE D'AVANT.
 * Un commerçant qui ne veut rien dire ne dit rien, et son annonce ne perd pas
 * une ligne : elle retombe sur sa description. Une fonction qui punit ceux qui
 * ne s'en servent pas se fait détester par les trois quarts de la ville.
 */
export type Voix = {
  /** Son prénom, tel qu'il se présente à son comptoir. */
  prenom: string;
  /** À la première personne : « boulanger », « cuisinière », « fleuriste ». */
  role?: string;
  /**
   * SA PHOTO, À LUI — et elle est absente de toute la maquette, exprès.
   *
   * `public/direct/LISEZ-MOI.md` interdit les visages reconnaissables : les
   * commerces d'ici sont inventés, et coller le visage d'un inconnu trouvé sur
   * une banque d'images sur une fausse boulangerie est exactement ce qu'on
   * s'interdit. La démonstration montre donc l'initiale dans un rond — qui est
   * aussi, et c'est heureux, la dégradation du vrai produit pour le commerçant
   * qui ne veut pas donner sa tête.
   */
  portrait?: string;
  /**
   * SA VIDÉO — une dizaine de secondes, muette, en boucle, dans le rond.
   *
   * DEUX CORRECTIONS DE TERRAIN, ET ELLES DISENT LA MÊME CHOSE. La première
   * version tenait dans trente-quatre pixels et durait trois secondes ; verdict
   * sur l'iPhone : « la vidéo est minuscule, on ne voit quasiment rien, et trois
   * secondes c'est trop court ». Les deux défauts n'en font qu'un : à cette
   * taille et à cette durée, il ne s'est RIEN PASSÉ. On voit qu'il y a une
   * image, on ne voit pas ce qu'elle montre.
   *
   * OÙ EST LA BONNE TAILLE, ALORS. La peur n'a jamais été celle des pixels,
   * c'est celle du FORMAT : une vidéo plein écran est une performance, et
   * personne ne veut faire l'acteur. Un rond, même large, n'est pas une
   * performance — il ne prend pas la place de l'annonce, il ne se met pas
   * au-dessus du plat, il ne demande pas de cadrage. On peut donc le doubler
   * sans rien réveiller de ce qui bloquait : ce qui protégeait le commerçant,
   * c'était la FORME ronde et la place en marge, pas la petitesse.
   *
   * ET LA DURÉE SUIT LA MÊME LOGIQUE. Un geste a un début et une fin : sortir
   * une plaque du four, retourner une pièce, faire signe. Trois secondes en
   * coupent la moitié et donnent une saccade ; une dizaine en laisse passer un
   * entier, et la boucle cesse de clignoter. C'est plus long à filmer d'à peu
   * près rien — on ne lui demande toujours qu'un seul geste, une seule prise.
   *
   * MUETTE, JAMAIS UNE TÊTE PARLANTE. Le son qui démarre tout seul dans une
   * file d'attente est la façon la plus rapide de faire fermer une application
   * — sur iPhone il est de toute façon bloqué. On y met un GESTE, pas un
   * discours. Le son existe, mais sur appui : on touche le rond, il s'agrandit,
   * et là on l'entend.
   *
   * JAMAIS RÉCLAMÉE, TOUJOURS CHANGEABLE. La règle n'est pas « filmée une
   * fois » mais « jamais obligatoire » : qu'il la refasse le jour où il a une
   * nouvelle devanture ou une idée, tant mieux. Ce qu'il ne faut pas, c'est que
   * le produit la lui demande tous les matins — c'est ainsi que meurent les
   * vlogs, en neuf jours.
   *
   * ELLE N'APPARAÎT QUE LÀ OÙ LE ROND EST DÉJÀ : avec sa phrase, sur sa fiche,
   * sur sa porte. Rien de neuf ne se pose sur la photo — c'est la règle qu'on
   * a mis des semaines à tenir, et une vidéo posée dans un coin serait un objet
   * de plus entre l'œil et le plat.
   */
  video?: { mp4: string; webm?: string; affiche?: string };
  /**
   * ÉCRITE UNE FOIS POUR TOUTES : « Ma pâte lève 18 heures », « Je désosse
   * moi-même », « Je vais chercher mes fleurs à Bordeaux le mardi ».
   *
   * C'est la réponse permanente à « pourquoi chez lui plutôt qu'en grande
   * surface » — celle qu'un artisan sait dire en trois mots et n'écrit nulle
   * part. Elle ne change jamais, donc elle ne coûte rien à entretenir.
   */
  signature?: string;
};

/**
 * CE QU'IL PENSE AVOIR CE SOIR — la file du matin.
 *
 * Voir `file-attente.ts` pour le raisonnement complet. En deux lignes : le tour
 * de rôle n'atteignait que les gens qui ouvraient l'application au bon moment,
 * c'est-à-dire personne. On se met donc dans la file LE MATIN, en un appui, et
 * l'offre du soir descend dans cette file-là.
 *
 * IL NE PROMET RIEN, ET C'EST ÉCRIT COMME TEL. « S'il en reste » : un
 * boulanger qui aurait tout vendu ne doit pas se retrouver en faute d'avoir
 * bien travaillé. C'est la différence entre une file d'attente et une
 * réservation, et elle doit se lire dans la phrase elle-même.
 */
export type FileDuSoir = {
  /** Ce qu'on attend, dans ses mots : « des croissants », « de la bavette ». */
  quoi: string;
  /** Quand il saura : « ce soir vers 18 h », « en fin de matinée ». */
  quand: string;
  /** Combien attendent déjà. Jamais inventé — voir les règles de dégradation. */
  combien: number;
};

export type CarteAutour = {
  id: string;
  /** Voir `FileDuSoir`. Absente chez la plupart : elle ne vaut que là où il y a
   *  vraiment un reste possible, et c'est lui qui l'arme le matin. */
  file?: FileDuSoir;
  /**
   * CE QU'IL A DÉJÀ PUBLIÉ — voir `historique.ts`.
   *
   * ON NE L'AFFICHE JAMAIS TEL QUEL. Une liste d'annonces périmées est un
   * cimetière, et un cimetière fait paraître mort un produit dont toute la
   * promesse est d'être vivant. On s'en sert pour deux choses : lui permettre
   * de REMETTRE une annonce en un appui, et déduire CE QUI REVIENT — « la
   * garbure, plutôt le jeudi », qui est la seule question que les gens se
   * posent vraiment.
   */
  passees?: AnnoncePassee[];
  /** Voir `Voix`. Absente chez la plupart, et c'est le cas normal. */
  voix?: Voix;
  branche: CleMetier;
  photo?: string;
  /**
   * LES AUTRES PHOTOS DE L'ANNONCE — le carrousel du commerçant.
   *
   * DEMANDÉ PAR DE VRAIES PERSONNES : « on m'a demandé si on pouvait voir
   * d'autres photos sur l'annonce ». Une seule image demande de décider sur un
   * cadrage ; trois racontent l'endroit.
   *
   * FACULTATIF, ET C'EST VOULU. Quand il est absent, la galerie se DÉDUIT de ce
   * que le commerçant a déjà publié aujourd'hui — la photo de l'annonce, celle
   * du menu, celles de chaque moment de sa journée. On ne lui demande donc rien
   * de plus pour que ça marche, et on n'invente rien à sa place : ce sont ses
   * images, celles qu'il a mises lui-même.
   */
  photos?: string[];
  /**
   * SES PHOTOS À LUI — la salle, la devanture, ses autres plats.
   *
   * LE DÉFAUT QU'ELLES RÈGLENT, RELEVÉ AU TEST : « à part une photo du menu, il
   * n'y a pas grand-chose comme info dans l'annonce quand on scrolle ». C'était
   * vrai. Sous le pli il y avait la journée, trois lignes de fiche, et le mur
   * des clients — vide le premier jour. On demandait de choisir un endroit sur
   * une seule image, cadrée sur une assiette.
   *
   * D'OÙ ELLES VIENNENT, ET C'EST TOUT L'INTÉRÊT : de sa fiche Google, reprises
   * au moment où on lui fabrique son site. Le commerçant ne photographie rien
   * de plus et ne remplit rien de plus — et son annonce n'est pas vide le
   * premier jour. C'est la seule réponse honnête au démarrage à froid : on ne
   * peut pas demander à un commerce qui n'a encore aucun client sur ClikMe
   * d'attendre que ses clients photographient pour être présentable.
   *
   * ELLES SONT SÉPARÉES DU MUR DES CLIENTS, ET JAMAIS MÉLANGÉES. Les siennes
   * sont choisies, les leurs sont vraies : les confondre ferait passer une
   * vitrine pour un témoignage, et c'est exactement ce qui rend les avis
   * illisibles ailleurs.
   *
   * ELLES SONT LÉGENDÉES, et ce n'est pas de la décoration. « La salle » et
   * « un autre jour » ne disent pas la même chose qu'une bande d'images : sans
   * légende, on ne sait pas si le plat qu'on voit est servi AUJOURD'HUI — et
   * c'est précisément la confusion qu'une carte du jour existe pour éviter.
   */
  sesPhotos?: { src: string; quoi: string }[];
  cadrage?: string;
  /** Anonyme : ce sont les voisins de celui qui lit. */
  nom: string;
  metier: string;
  ville: string;
  itineraire: string;
  metres: number;
  distance: string;
  /** LA JOURNÉE, dans l'ordre. C'est l'annonce unique posée le matin. */
  moments: MomentJour[];
  /**
   * CETTE CARTE A ÉTÉ PRÉPARÉE POUR UNE VISITE, ET ELLE N'EST PAS EN LIGNE.
   *
   * Voir `preparation.ts`. Elle vit dans le téléphone de celui qui démarche et
   * nulle part ailleurs — publier la carte d'un vrai commerce avant son accord
   * le ferait passer pour un client sans qu'il ait rien signé, ce que
   * LISEZ-MOI.md interdit explicitement. Le drapeau sert à le DIRE à l'écran :
   * une démonstration qui laisse croire que c'est déjà en ligne est un
   * mensonge, et celui-là se paie le jour où il le découvre.
   */
  prepare?: boolean;
  /**
   * IL N'A RIEN PUBLIÉ AUJOURD'HUI — il n'a pas fait son planning ce matin.
   *
   * POURQUOI CE DRAPEAU EXISTE, ALORS QUE TOUTES LES AUTRES FICHES ONT UNE
   * JOURNÉE PLEINE. Les commerces de la maquette sont écrits une fois pour
   * toutes et publient donc éternellement : sans ce drapeau, on ne verrait
   * jamais le cas qui décide de tout le produit — celui du commerçant qui
   * n'a rien dit. Or c'est LUI qu'il faut pouvoir montrer : derrière le cœur,
   * ses abonnés lisent « Rien aujourd'hui » à côté de trois voisins qui ont
   * quelque chose. C'est ce que ses clients voient quand il ne publie pas, et
   * c'est ce qui rend le geste du matin non négociable.
   *
   * IL SORT DU PAQUET, COMME EN VRAI. Pas de planning, pas de carte dans Le
   * Direct : `autourDeMoi` l'écarte. Son annonce d'emploi, elle, reste — une
   * recherche de bras dure trois semaines et ne dépend pas du jour.
   */
  silencieux?: boolean;
  /**
   * CE QUE SEULS SES ABONNÉS VOIENT. Voir `Bulletin` au-dessus. Absent chez la
   * plupart — un commerçant qui n'a rien à dire aujourd'hui ne dit rien, et le
   * silence est une information exacte.
   */
  bulletin?: Bulletin;
  /**
   * SON NUMÉRO — celui par lequel on le PRÉVIENT.
   *
   * Voir `prevenir.ts` : c'est le dernier centimètre du produit, celui où tout
   * se perdait. Absent dans la maquette, où un numéro de fiction est calculé à
   * la place — un numéro inventé au hasard existe vraiment chez quelqu'un, et
   * la première démonstration enverrait « je prends les 2 croissants » à un
   * inconnu. Le vrai produit portera le numéro déclaré par le commerçant.
   */
  telephone?: string;
  /** Ce que la fiche ajoute quand on descend. */
  fiche: { ou: string; horaires: string; mot: string };
  /** Ce qu'il propose à quelqu'un qui vient d'annoncer qu'il sort. Absent : il
   *  n'a rien armé, il ne répond pas — et c'est le cas le plus fréquent. */
  reponse?: Reponse;
  /** Ce qu'il cherche comme bras. Absent : il ne recrute pas, et c'est le cas
   *  de la plupart des commerces la plupart du temps. */
  recrute?: Recrutement;
  /** Ce qu'on mange aujourd'hui. Les métiers de bouche en ont un ; les autres
   *  n'en ont pas, et leur carte continue de montrer le moment en cours. */
  menu?: MenuDuJour;
  /**
   * CE QU'IL PROPOSE D'HABITUDE. Voir le grand commentaire au-dessus de
   * `ArticleCatalogue` : c'est la référence permanente, pas l'actualité.
   *
   * FACULTATIF, ET SON ABSENCE NE FAIT RIEN APPARAÎTRE. Un commerce sans
   * catalogue n'a pas de bouton : on ne montre jamais une porte qui ouvre sur
   * une pièce vide. C'est aussi ce qui rend l'alimentation automatique
   * possible plus tard — la fiche du commerçant remplira ce champ, et le
   * bouton apparaîtra tout seul le jour où il y a quelque chose derrière.
   */
  catalogue?: ArticleCatalogue[];
  /**
   * SES HABITUÉS — CEUX QUI LE FONT CONNAÎTRE.
   *
   * POURQUOI CETTE LISTE EXISTE, ET POURQUOI ELLE EST PAR COMMERCE. « Le
   * soutenir » ne se comprenait pas : on ne voyait ni à quoi sert le geste, ni
   * ce qu'il produit. Un compteur privé ne répond à rien — un chiffre que
   * personne ne regarde n'est pas une récompense.
   *
   * Ce qui rend le geste lisible, c'est de voir qu'il ARRIVE QUELQUE PART. Le
   * commerçant voit qui le fait connaître, et cette liste est ce qu'il voit.
   * Dans une ville de vingt mille habitants, être dans les habitués de sa
   * boulangerie a une valeur réelle, et elle ne coûte rien à personne.
   *
   * ELLE EST PAR COMMERCE, JAMAIS GLOBALE, et c'est délibéré. Un classement de
   * ville désignerait des derniers, se ferait jouer, et transformerait un geste
   * d'attachement en compétition. Chez un commerçant, il n'y a pas de perdant :
   * il y a ceux qui viennent souvent et les autres.
   *
   * PRÉNOM ET INITIALE, JAMAIS PLUS. Ce sont des voisins, pas des comptes.
   */
  pouces?: { qui: string; combien: number }[];
  /**
   * SON SITE, QUAND IL EN A UN. Affiché, pas cliquable dans la maquette : les
   * commerces d'ici sont inventés, et un domaine inventé qui existerait vraiment
   * enverrait un testeur chez un inconnu. Le vrai produit porte l'adresse
   * déclarée par le commerçant.
   */
  site?: string;
};

const VILLE = "Dax";
const YALLER = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(VILLE);
const YALLER_VILLE = YALLER;

/**
 * CE QUI SE PASSE DANS LA VILLE — publié par quelqu'un qui n'est pas un commerce.
 *
 * POURQUOI ÇA CHANGE LA NATURE DU PRODUIT, ET PAS SEULEMENT SON CATALOGUE.
 * Jusqu'ici ClikMe demandait « qu'est-ce qui se passe dans votre
 * ÉTABLISSEMENT », et n'avait donc de réponse que pour les jours où l'on veut
 * consommer. C'est peu : on ne cherche pas un restaurant tous les jours, et
 * c'est la raison la plus simple pour laquelle personne n'ouvrait l'application
 * spontanément.
 *
 * La mairie, l'office de tourisme, une association, un musée, une salle de
 * spectacle publient exactement la même chose — quelque chose qui a lieu, à un
 * endroit, à une heure. Le moteur ne change pas ; seul le publicateur change, et
 * les cartes se rangent toutes seules. L'habitant, lui, n'a plus besoin d'avoir
 * envie d'acheter pour avoir une raison d'ouvrir.
 *
 * ET LA CARTE DOIT ÊTRE DIFFÉRENTE, sinon on ne gagne rien. Un concert n'est pas
 * un plat du jour : il a une date plutôt qu'une heure de service, il est souvent
 * gratuit, et ce qui décide n'est pas le prix mais l'envie d'y être. Elle a donc
 * sa couleur, son grand cartouche de date, et elle dit qui l'organise — parce
 * que « la mairie » et « une association de quartier » ne promettent pas la même
 * soirée.
 */
export type TypeOrganisateur =
  | "mairie"
  | "office"
  | "association"
  | "musee"
  | "salle"
  | "organisateur";

export const ORGANISATEURS: Record<TypeOrganisateur, { label: string; emoji: string }> = {
  mairie: { label: "La mairie", emoji: "🏛️" },
  office: { label: "Office de tourisme", emoji: "🗺️" },
  association: { label: "Association", emoji: "🤝" },
  musee: { label: "Musée", emoji: "🖼️" },
  salle: { label: "Salle de spectacle", emoji: "🎭" },
  organisateur: { label: "Organisateur", emoji: "🎪" },
};

export type EvenementVille = {
  id: string;
  /** Ce que c'est, en quatre mots. C'est la plus grosse ligne de la carte. */
  quoi: string;
  /** Le détail, deux lignes au plus. */
  lignes: string[];
  qui: string;
  typeQui: TypeOrganisateur;
  photo?: string;
  cadrage?: string;
  /** Le jour tel qu'on le dit. « Ce soir » vaut mieux qu'une date. */
  jour: string;
  heure: string;
  /** Bornes en heures décimales, pour savoir si ça se joue maintenant. */
  de: number;
  a: number;
  /** Vrai si c'est aujourd'hui — sinon la pastille annonce le jour. */
  aujourdhui: boolean;
  lieu: string;
  metres: number;
  distance: string;
  itineraire: string;
  /** Absent : c'est gratuit, et c'est écrit en toutes lettres. */
  prix?: string;
  /** Le mot de l'organisateur, sous le pli. */
  mot: string;
  /** Ce qu'il faut savoir avant d'y aller. */
  pratique: string[];
};

const EVENEMENTS: EvenementVille[] = [
  {
    id: "kiosque",
    quoi: "Concert au kiosque",
    lignes: ["Trio de jazz landais", "Sortez vos chaises, on reste jusqu'à la nuit"],
    qui: "La mairie",
    typeQui: "mairie",
    photo: "/direct/concert-kiosque.jpg",
    cadrage: "50%",
    jour: "Ce soir",
    heure: "19 h",
    de: 19,
    a: 22,
    aujourdhui: true,
    lieu: "Kiosque du parc Théodore-Denis",
    metres: 450,
    distance: "450 m",
    itineraire: YALLER_VILLE,
    mot: "On installe le kiosque à 18 h. Il n'y a pas de chaises : les gens apportent les leurs, s'assoient dans l'herbe, et ça marche très bien comme ça depuis quatre ans.",
    pratique: ["Gratuit, sans réservation", "Annulé s'il pleut, on prévient ici"],
  },
  {
    id: "marche-nuit",
    quoi: "Marché de producteurs, le soir",
    lignes: ["Vingt producteurs du département", "On achète, on s'assoit, on mange sur place"],
    qui: "Office de tourisme",
    typeQui: "office",
    photo: "/direct/marche-producteurs.jpg",
    cadrage: "50%",
    jour: "Jeudi",
    heure: "18 h – 22 h",
    de: 18,
    a: 22,
    aujourdhui: false,
    lieu: "Sous les halles",
    metres: 300,
    distance: "300 m",
    itineraire: YALLER_VILLE,
    prix: "Entrée libre",
    mot: "Chaque producteur fait goûter. Prévoyez de dîner sur place plutôt qu'avant : il y a des tables et c'est fait pour.",
    pratique: ["Entrée libre", "Paiement en espèces chez la plupart"],
  },
  {
    id: "expo",
    quoi: "Nocturne au musée",
    lignes: ["L'expo sur les bains romains", "Visite guidée à 19 h et à 20 h 30"],
    qui: "Musée de Borda",
    typeQui: "musee",
    photo: "/direct/nocturne-musee.jpg",
    cadrage: "50%",
    jour: "Vendredi",
    heure: "18 h – 22 h",
    de: 18,
    a: 22,
    aujourdhui: false,
    lieu: "Rue des Carmes",
    metres: 380,
    distance: "380 m",
    itineraire: YALLER_VILLE,
    prix: "5 €",
    mot: "Le vendredi soir, on ouvre jusqu'à 22 h et l'entrée passe à 5 €. C'est le moment où il y a le moins de monde dans les salles.",
    pratique: ["5 €, gratuit pour les moins de 18 ans", "Deux visites guidées, 45 min"],
  },
  {
    id: "vide-grenier",
    quoi: "Vide-grenier du quartier",
    lignes: ["Quatre-vingts exposants", "Buvette tenue par l'association"],
    qui: "Les Amis du Sablar",
    typeQui: "association",
    photo: "/direct/vide-grenier.jpg",
    cadrage: "50%",
    jour: "Dimanche",
    heure: "8 h – 17 h",
    de: 8,
    a: 17,
    aujourdhui: false,
    lieu: "Quartier du Sablar",
    metres: 700,
    distance: "700 m",
    itineraire: YALLER_VILLE,
    mot: "On tient la buvette toute la journée, et ce qu'elle rapporte finance les sorties des enfants du quartier. Venez tôt, les bonnes affaires partent avant 10 h.",
    pratique: ["Gratuit pour les visiteurs", "Emplacement exposant : 8 € les 3 mètres"],
  },
];

/**
 * CE QUE LE PAQUET PEUT CONTENIR — un commerce ou un événement.
 *
 * Les deux se balaient pareil, se gardent pareil et se partagent pareil : c'est
 * exactement ce qu'on veut, et c'est pour ça qu'ils partagent le même paquet
 * plutôt que de vivre dans deux écrans. Ce qui les sépare est SOUS le pli, là où
 * un commerce déroule sa journée et où un événement dit qui l'organise.
 */
export type ItemPaquet = CarteAutour | EvenementVille;

/** Le seul endroit où l'on distingue les deux. Ailleurs, on les traite pareil. */
export function estEvenement(x: ItemPaquet): x is EvenementVille {
  return "typeQui" in x;
}

/** Les événements, du plus proche au plus loin. Aujourd'hui d'abord. */
export function evenementsDeLaVille(): EvenementVille[] {
  return [...EVENEMENTS].sort(
    (a, b) => Number(b.aujourdhui) - Number(a.aujourdhui) || a.metres - b.metres,
  );
}

/**
 * LA CARTE D'UN ÉVÉNEMENT, dans le composant du produit.
 *
 * Même dessin, même geste — c'est ce qui fait qu'on ne change pas
 * d'application entre « où je déjeune » et « qu'est-ce qui se passe ce soir ».
 * Ce qui change : la pastille du haut porte le JOUR et non une échéance, et le
 * prix dit « Gratuit » en toutes lettres quand il n'y en a pas. Un prix absent
 * laisse croire qu'on ne sait pas ; écrire « gratuit » est la moitié de
 * l'argument.
 */
export function carteDEvenement(e: EvenementVille, heure: number): CarteDirect {
  const enCours = e.aujourdhui && heure >= e.de && heure < e.a;
  return {
    photo: e.photo,
    cadrage: e.cadrage,
    nom: e.quoi,
    metier: e.qui,
    ville: VILLE,
    distance: e.distance,
    itineraire: e.itineraire,
    reste: enCours ? `● En ce moment · jusqu'à ${e.a} h` : `${e.jour} · ${e.heure}`,
    icone: ORGANISATEURS[e.typeQui].emoji,
    quoi: e.lieu,
    lignes: e.lignes,
    prix: e.prix ?? "Gratuit",
    etiquette: e.aujourdhui ? "AUJOURD'HUI" : e.jour.toUpperCase(),
  };
}

export const HEURE_MIN = 8;
export const HEURE_MAX = 23;


const CARTES: CarteAutour[] = [
  // ── RESTAURANTS ──────────────────────────────────────────────────────────
  {
    id: "centre",
    // SA CARTE. Ce qu'il sert TOUS LES JOURS — à ne pas confondre avec le
    // plat du jour, qui est l'annonce. Voir `ArticleCatalogue`.
    catalogue: [
      { id: "c-ent-1", rayon: "Entrées", nom: "Garbure landaise", detail: "Le bouillon du jour, chou et confit.", prix: "8 €", photo: "/direct/plat-garbure.jpg" },
      { id: "c-ent-2", rayon: "Entrées", nom: "Œuf mimosa", detail: "Comme à la maison.", prix: "6 €" },
      { id: "c-pl-1", rayon: "Plats", nom: "Axoa de veau", detail: "Piment doux, pommes de terre.", prix: "16 €", photo: "/direct/plat-axoa.jpg" },
      { id: "c-pl-2", rayon: "Plats", nom: "Poulet basquaise", detail: "Riz, poivrons du pays.", prix: "15 €", photo: "/direct/plat-basquaise.jpg" },
      { id: "c-pl-3", rayon: "Plats", nom: "Lasagnes maison", detail: "Faites le matin.", prix: "14 €", photo: "/direct/plat-lasagnes.jpg" },
      { id: "c-de-1", rayon: "Desserts", nom: "Gâteau basque", detail: "Cerise noire.", prix: "6 €" },
      { id: "c-de-2", rayon: "Desserts", nom: "Café gourmand", prix: "7 €" },
    ],
    // SES PHOTOS, telles qu'on les reprendrait de sa fiche Google en lui
    // faisant son site. Images d'illustration en attendant les siennes —
    // et uniquement celles qui sont libres d'enseigne, de filigrane et de
    // visage : voir public/direct/LISEZ-MOI.md, section « ses photos ».
    sesPhotos: [
      { src: "/direct/tables-libres.jpg", quoi: "La salle" },
      { src: "/direct/terrasse-au-soleil.jpg", quoi: "La terrasse, à l'ombre le midi" },
      { src: "/direct/plat-axoa.jpg", quoi: "Axoa de veau, un autre jour" },
    ],
    branche: "restaurant",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Chez Bergine",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 400,
    distance: "400 m",
    pouces: [
      { qui: "Hélène M.", combien: 14 },
      { qui: "Karim B.", combien: 9 },
      { qui: "Sofia R.", combien: 6 },
    ],
    site: "chezbergine.fr",
    fiche: {
      ou: "Rue piétonne, à côté de la halle",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h",
      mot: "Cuisine du marché, carte changée chaque matin. Terrasse à l'ombre le midi.",
    },
    recrute: {
      poste: "Un serveur ou une serveuse",
      quand: "Pour la saison, d'avril à octobre",
      contrat: "CDD saisonnier · 35 h · deux jours de repos consécutifs",
      paye: "1 750 € net + les pourboires",
      qui: "On est cinq en salle, on mange ensemble avant le service. L'expérience n'est pas obligatoire, l'envie si.",
      passez: "mardi ou mercredi, entre 15 h et 17 h",
      depuis: "il y a 2 jours",
    },
    reponse: {
      cadeau: "Le digestif maison offert",
      texte: "Venez, je vous garde la table près de la fenêtre.",
      tenu: "12 h 40",
      apres: 5,
    },
    menu: {
      plat: "Garbure landaise, magret grillé",
      description: "Pommes sarladaises · Pastis landais en dessert",
      prix: "19 €",
      photo: "/direct/plat-garbure.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        de: 11, a: 11.5, quand: "11 h", icone: "👨‍🍳",
        titre: "Manger avec l'équipe",
        lignes: [
          "À la table du personnel, avant l'ouverture",
          "Apéritif et café offerts",
        ],
        prix: "12 €", places: 2, action: "Réserver", envies: ["moins15"],
      },
      {
        de: 11.5, a: 12, quand: "11 h 30 – 12 h", icone: "☕",
        titre: "Le café gourmand offert",
        lignes: [
          "Pour tous ceux qui s'assoient avant midi",
          "Le menu reste au même prix",
        ],
        prix: "19 €", etiquette: "CAFÉ OFFERT", places: 12,
        action: "Réserver", envies: ["maintenant"],
      },
      {
        de: 12, a: 14, quand: "12 h – 14 h", icone: "🍽️",
        titre: "Le service du midi",
        video: {
          mp4: "/direct/service-cuisine.mp4",
          webm: "/direct/service-cuisine.webm",
          affiche: "/direct/service-cuisine.jpg",
          mot: "En cuisine, pendant le service",
        },
        lignes: ["Le menu du jour, en salle ou en terrasse", "Dernière commande à 13 h 45"],
        prix: "19 €", places: 8, action: "Réserver", envies: [],
        rappels: 5,
        avis: [
          { note: 5, texte: "La garbure vaut le détour.", qui: "Hélène", quand: "la semaine dernière",
            // LES PHOTOS SEMÉES SONT CELLES DE `public/direct/`, RÉEMPLOYÉES.
            // Elles ne sont pas là pour décorer : sans une seule photo de
            // client à l'ouverture, on ne voit pas que l'annonce se remplit
            // toute seule, et c'est tout l'intérêt du mécanisme.
            photo: "/direct/plat-du-jour.jpg" },
          { note: 4, texte: "Magret cuit pile comme il faut.", qui: "Karim", quand: "il y a 3 semaines",
            photo: "/direct/tablee-du-soir.jpg" },
          { note: 4, texte: "Bon rapport qualité-prix le midi.", qui: "Sofia", quand: "en février" },
        ],
      },
      {
        de: 14, a: 15, quand: "14 h", icone: "🥡", publie: 14,
        titre: "Les restes, à emporter",
        lignes: ["Ce qui n'est pas parti du service", "Sur place, tant qu'il y en a"],
        prix: "7 €", places: 5, action: "Gardez-m'en une part", envies: ["moins15", "maintenant", "emporter"],
        rappels: 3,
      },
      {
        de: 19, a: 22, quand: "19 h – 22 h", icone: "🌙", publie: 21,
        titre: "Service du soir",
        lignes: ["Entrée + plat + dessert", "Dernière commande à 21 h 30"],
        prix: "26 €", places: 6, action: "Réserver", envies: [],
        // UNE TABLE DE SIX VAUT MIEUX QUE TROIS TABLES DE DEUX, et c'est vrai
        // pour lui : un service, une nappe, un passage en cuisine. Il concede
        // huit euros sur un couvert qu'il n'aurait pas rempli.
        collectif: {
          objectif: 6, participants: 4, prixGroupe: "18 €",
          qui: ["Inès", "Marc", "Chloé", "Karim"],
        },
        avis: [
          { note: 5, texte: "On a fini à onze heures sans voir le temps passer.", qui: "Paul", quand: "samedi dernier",
            photo: "/direct/tablee-du-soir.jpg" },
          { note: 4, texte: "Service du soir plus calme, on en profite.", qui: "Inès", quand: "le mois dernier" },
        ],
      },
    ],
  },
  {
    id: "emporter",
    passees: [
      { ilYa: 1, titre: "Les deux plats du jour", prix: "11 €", vues: 302, pris: 22 },
      { ilYa: 3, titre: "Les deux plats du jour", prix: "11 €", vues: 288, pris: 19 },
      { ilYa: 7, titre: "La garbure landaise", prix: "13 €", vues: 341, pris: 31 },
      { ilYa: 8, titre: "Les deux plats du jour", prix: "11 €", vues: 276, pris: 17 },
      { ilYa: 14, titre: "La garbure landaise", prix: "13 €", vues: 355, pris: 34 },
      { ilYa: 21, titre: "La garbure landaise", prix: "13 €", vues: 328, pris: 29 },
    ],
    file: { quoi: "des parts à emporter", quand: "après 13 h", combien: 11 },
    // ─── LA PREMIÈRE VOIX DE LA MAQUETTE ───
    // C'est la carte à menu qu'on rencontre le plus tôt : c'est donc elle qui
    // doit montrer ce que la fonction change. Pas de portrait — LISEZ-MOI.md
    // interdit les visages reconnaissables, et l'initiale est de toute façon
    // la dégradation du vrai produit pour qui ne veut pas donner sa tête.
    voix: {
      prenom: "Margot",
      role: "cuisinière",
      signature: "Je fais mes pâtes le matin même.",
      // ─── LA DOUBLURE DE LA MAQUETTE, ET CE QU'ON EN SAIT ───
      //
      // C'est le plan de service qui existe déjà dans le produit. Vérification
      // faite image par image : une ENSEIGNE LISIBLE apparaît au second plan,
      // sur une carte de menu posée sur la table. Arbitrage rendu — « c'est une
      // démo, donc personne ne la verra, donc ce n'est pas important s'il y a
      // une enseigne » — et il tient : le fichier est déjà en ligne sur un
      // moment, l'enseigne est petite, et c'est une maquette.
      //
      // CE QUI RESTE VRAI QUAND MÊME, ET QUI EST NOTÉ DANS LISEZ-MOI.md : le
      // rond s'agrandit sur appui, donc l'enseigne devient lisible là où elle
      // ne l'était pas. Le jour où un vrai commerçant filme la sienne, ce
      // fichier disparaît de toute façon.
      //
      // L'AUTRE VIDÉO DISPONIBLE RESTE DEHORS, et ce n'est pas la même
      // question : `coiffure` montre DEUX VISAGES reconnaissables, de face,
      // en gros plan. Une enseigne au second plan est une question de marque ;
      // un visage est le droit à l'image de quelqu'un qui n'a rien signé.
      video: {
        mp4: "/direct/service-cuisine.mp4",
        webm: "/direct/service-cuisine.webm",
        affiche: "/direct/service-cuisine.jpg",
      },
    },
    catalogue: [
      { id: "e-1", rayon: "Sur place", nom: "Lasagnes maison", detail: "Faites le matin.", prix: "11 €", photo: "/direct/plat-lasagnes.jpg" },
      { id: "e-2", rayon: "Sur place", nom: "Curry de légumes", detail: "Végétarien.", prix: "11 €" },
      { id: "e-3", rayon: "Sur place", nom: "Formule du midi", detail: "Plat, dessert, café.", prix: "15 €", photo: "/direct/plat-formule.jpg" },
      { id: "e-4", rayon: "À emporter", nom: "La part de lasagnes", detail: "Dans sa barquette.", prix: "9 €", photo: "/direct/portion-a-emporter.jpg" },
      { id: "e-5", rayon: "Desserts", nom: "Riz au lait", prix: "4 €" },
      { id: "e-6", rayon: "Desserts", nom: "Gâteau du jour", detail: "Ça dépend du matin.", prix: "4,50 €" },
    ],
    // SES PHOTOS, telles qu'on les reprendrait de sa fiche Google en lui
    // faisant son site. Images d'illustration en attendant les siennes —
    // et uniquement celles qui sont libres d'enseigne, de filigrane et de
    // visage : voir public/direct/LISEZ-MOI.md, section « ses photos ».
    sesPhotos: [
      { src: "/direct/plat-formule.jpg", quoi: "La formule, un autre jour" },
      { src: "/direct/plat-basquaise.jpg", quoi: "Poulet basquaise, un autre jour" },
    ],
    branche: "restaurant",
    photo: "/direct/portion-a-emporter.jpg",
    cadrage: "50%",
    nom: "Le Bocal de Margot",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 180,
    distance: "180 m",
    pouces: [
      { qui: "Camille D.", combien: 11 },
      { qui: "Bastien L.", combien: 5 },
    ],
    site: "lebocaldemargot.fr",
    fiche: {
      ou: "Petite rue derrière l'église",
      horaires: "Aujourd'hui, 11 h – 14 h 30",
      mot: "Deux plats par jour, cuisinés le matin. Quand c'est fini, c'est fini.",
    },
    reponse: {
      cadeau: "Une part de dessert en plus",
      texte: "Il me reste de la lasagne, je vous la mets de côté.",
      tenu: "13 h 15",
      apres: 9,
    },
    menu: {
      plat: "Lasagnes maison",
      description: "Salade de saison · Prêtes tout de suite, à emporter",
      prix: "11 €",
      photo: "/direct/plat-lasagnes.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        // LA SOUPE DU JOUR QU'ON NE RESERVIRA PAS. Une cuisine ne resert pas sa
        // soupe le lendemain ; elle la jette. Deux litres offerts valent mieux.
        de: 14, a: 15, quand: "à partir de 14 h", icone: "🥣", publie: 14,
        offert: true,
        titre: "La soupe qui reste du midi",
        lignes: ["Apportez un contenant", "Tant qu'il y en a"],
        places: 4, action: "Je passe la prendre",
        envies: ["maintenant", "emporter"],
      },
      {
        de: 11, a: 13, quand: "11 h – 13 h", icone: "🍲",
        titre: "Les deux plats du jour",
        // UN JUGEMENT, PAS UNE DESCRIPTION — voir `conseil`. « Faites le
        // matin » serait une information de plus ; « prenez les lasagnes »
        // est quelqu'un qui choisit à votre place, et c'est ce qu'on ne
        // trouve nulle part ailleurs.
        conseil: "Prenez les lasagnes, la pâte est de ce matin.",
        lignes: ["Lasagnes maison", "Curry de légumes"],
        prix: "11 €", places: 14, action: "Gardez-m'en une part", envies: ["italien", "moins15", "maintenant", "emporter"],
        // LA COMMANDE GROUPEE DU MIDI — le cas le plus banal qui soit dans un
        // bureau : quelqu'un descend chercher pour tout le monde. Cinq parts
        // preparees ensemble et retirees en un passage lui coutent moins de
        // travail que cinq clients etales sur deux heures, et c'est la seule
        // raison pour laquelle il peut lacher deux euros.
        // ELLE EST SUR LA PREMIERE CARTE DU PAQUET, ET C'EST DELIBERE :
        // mesure faite, le premier collectif n'apparaissait qu'a la cinquieme
        // annonce. Quelqu'un qui en regarde trois et repose son telephone ne
        // rencontrait jamais la fonction — autant dire qu'elle n'existait pas.
        collectif: {
          objectif: 5, participants: 3, prixGroupe: "9 €",
          qui: ["Camille", "Bastien", "Sofia"],
        },
      },
      {
        de: 13, a: 17, quand: "à partir de 13 h", icone: "🔥", publie: 13.2,
        titre: "Dernières portions",
        lignes: ["Lasagnes maison", "Prêtes tout de suite"],
        prix: "8 €", etiquette: "IL EN RESTE 8", places: 8,
        action: "Gardez-m'en une part", envies: ["italien", "moins15", "maintenant", "emporter"],
        avis: [
          { note: 5, texte: "Les meilleures lasagnes de la ville.", qui: "Camille", quand: "ce midi",
            photo: "/direct/portion-a-emporter.jpg" },
          { note: 5, texte: "Généreux, et encore chaud à la maison.", qui: "Bastien", quand: "il y a 2 semaines" },
          { note: 4, texte: "Très bon. J'aurais pris deux parts.", qui: "Nadia", quand: "il y a 1 mois" },
          { note: 4, texte: "Bien fondant, pas gras du tout.", qui: "Pierre", quand: "en mars" },
        ],
      },
    ],
  },
  {
    id: "deux-rues",
    catalogue: [
      { id: "d-1", rayon: "Entrées", nom: "Salade landaise", detail: "Gésiers, magret séché.", prix: "12 €" },
      { id: "d-2", rayon: "Plats", nom: "Parmentier de canard", prix: "16 €" },
      { id: "d-3", rayon: "Plats", nom: "Pièce du boucher", detail: "Frites maison.", prix: "19 €" },
      { id: "d-4", rayon: "Plats", nom: "Poisson du jour", detail: "Selon l'arrivage.", prix: "18 €" },
      { id: "d-5", rayon: "Desserts", nom: "Tarte du jour", prix: "6 €" },
    ],
    // SES PHOTOS, telles qu'on les reprendrait de sa fiche Google en lui
    // faisant son site. Images d'illustration en attendant les siennes —
    // et uniquement celles qui sont libres d'enseigne, de filigrane et de
    // visage : voir public/direct/LISEZ-MOI.md, section « ses photos ».
    sesPhotos: [
      { src: "/direct/terrasse-au-soleil.jpg", quoi: "La terrasse" },
      { src: "/direct/plat-basquaise.jpg", quoi: "Poulet basquaise, un autre jour" },
      { src: "/direct/plat-formule.jpg", quoi: "La formule du midi, un autre jour" },
    ],
    branche: "restaurant",
    photo: "/direct/tables-libres.jpg",
    cadrage: "100%",
    nom: "L'Ardoise Landaise",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 250,
    distance: "250 m",
    pouces: [
      { qui: "Bruno P.", combien: 8 },
      { qui: "Ana T.", combien: 7 },
      { qui: "Nadia S.", combien: 3 },
    ],
    site: "ardoise-landaise.fr",
    fiche: {
      ou: "Place du marché, sous les arcades",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h 30",
      mot: "Salle de trente couverts, cuisine ouverte. On peut venir sans réserver.",
    },
    reponse: {
      cadeau: "L'apéritif maison offert",
      texte: "Deux tables au calme sous les arcades, à vous de choisir.",
      tenu: "13 h",
      apres: 16,
    },
    menu: {
      plat: "Axoa de veau",
      description: "Riz de pays · Gâteau basque · Sous les arcades",
      prix: "16 €",
      photo: "/direct/plat-axoa.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        de: 11, a: 14, quand: "ce midi", icone: "🕐", publie: 11.5,
        // ─── ON N'ANNONCE PAS UN NOMBRE QU'IL NE PEUT PAS TENIR ───
        //
        // « Il est écrit souvent "il reste 4 tables", or nous ne pouvons pas
        // savoir combien de tables il reste puisque le restaurateur ne nous le
        // dit pas. »
        //
        // C'est exact, et la distinction est nette : un STOCK qu'il a préparé,
        // il le connaît — vingt portions le matin, douze vendues, il en reste
        // huit, et c'est lui qui le dit à Léa. Une CAPACITÉ, non : les tables se
        // libèrent et se reprennent toute la journée, personne ne recompte la
        // salle entre deux services. Écrire un chiffre là revient à l'inventer,
        // et un chiffre inventé une seule fois fait perdre quelqu'un pour
        // toujours — c'est la règle qu'on s'est déjà donnée pour les vues et les
        // réservations.
        //
        // `places` reste, parce qu'il sert à savoir s'il y a de la place —
        // pas à l'afficher.
        titre: "De la place, sans attendre",
        lignes: ["Plat + dessert", "On vous installe"],
        prix: "16 €", places: 4, action: "Réserver", envies: ["maintenant"],
        avis: [
          { note: 5, texte: "Servi en dix minutes, et c'était bon.", qui: "Bruno", quand: "mardi dernier",
            photo: "/direct/tables-libres.jpg" },
          { note: 5, texte: "Sous les arcades, la lumière est belle.", qui: "Ana", quand: "il y a 10 jours",
            photo: "/direct/tablee-du-soir.jpg" },
          { note: 4, texte: "Les arcades à l'ombre, parfait l'été.", qui: "Nadia", quand: "il y a 2 semaines" },
        ],
      },
      {
        de: 19, a: 22.5, quand: "20 h", icone: "🎲",
        titre: "La table des 6 inconnus",
        lignes: [
          "Six couverts, six personnes qui ne se connaissent pas",
          "Plat + verre compris · On mélange, on verra bien",
        ],
        prix: "22 €", places: 2, action: "Je prends une place", envies: ["partager"],
        // CELUI-CI ETAIT DEJA UN COLLECTIF SANS EN PORTER LE NOM : six couverts,
        // deux places restantes, et la table n'a lieu que si elle est pleine.
        // Le seuil ne fait donc tomber AUCUN prix — il decide si la chose
        // existe. C'est la meme jauge que chez le boulanger qui allume son
        // four, et c'est ce qui montre que la mecanique n'est pas un systeme
        // de remises deguise.
        collectif: {
          objectif: 6, participants: 4,
          debloque: "la table a lieu",
          qui: ["Bruno", "Ana", "Nadia", "Hugo"],
        },
        // LA PREUVE QUE LE BOUTON SERT A QUELQUE CHOSE. Sans un cas deja
        // exauce a l'ecran, « faites-le revenir » est une boite a idees, et
        // personne n'appuie deux fois sur une boite a idees.
        rappels: 7, revient: "jeudi",
      },
    ],
  },
  {
    id: "boulange",
    // ─── SON MOIS, TEL QU'IL S'EST PASSÉ ───
    // Les décalages sont en JOURS et non en dates : une date en dur vieillit,
    // et la maquette dirait « jeudi 28 août » six mois plus tard. Le jour de
    // la semaine se recalcule — c'est exactement ce dont `ceQuiRevient` a
    // besoin pour oser dire « plutôt le mercredi ».
    passees: [
      { ilYa: 1, titre: "La fournée de 17 h", prix: "4,20 €", vues: 214, pris: 9 },
      { ilYa: 2, titre: "La fournée de 17 h", prix: "4,20 €", vues: 198, pris: 6 },
      { ilYa: 3, titre: "Pain de campagne au levain", prix: "4,80 €", vues: 176, pris: 11 },
      { ilYa: 4, titre: "La fournée de 17 h", prix: "4,20 €", vues: 203, pris: 7 },
      { ilYa: 7, titre: "Pain de campagne au levain", prix: "4,80 €", vues: 188, pris: 14 },
      { ilYa: 8, titre: "La fournée de 17 h", prix: "4,20 €", vues: 191, pris: 5 },
      { ilYa: 10, titre: "Pain de campagne au levain", prix: "4,80 €", vues: 169, pris: 12 },
      { ilYa: 11, titre: "La fournée de 17 h", prix: "4,20 €", vues: 205, pris: 8 },
    ],
    // LE CAS D'ÉCOLE : c'est de ces croissants-là que le tour de rôle parle le
    // soir. La file et le tour de rôle sont les deux moitiés d'une même chose.
    file: {
      quoi: "des viennoiseries",
      quand: "en fin de journée",
      combien: 7,
    },
    voix: {
      prenom: "Amanieu",
      role: "boulanger",
      signature: "Ma pâte lève dix-huit heures.",
    },
    // LE BULLETIN LE PLUS IMPORTANT DE LA MAQUETTE, et c'est celui qui porte
    // le tour de rôle. « Il me reste deux croissants » est l'exemple exact
    // qu'aucune plateforme ne sait traiter — voir `TourDeRole`.
    //
    // L'HUMEUR EST BOUGONNE, ET C'EST DÉLIBÉRÉ. La tentation serait de ne
    // montrer que des commerçants heureux ; ce serait de la publicité, et
    // personne n'y reviendrait. Un boulanger dont le four a lâché à 5 h est
    // exactement ce qu'on ne peut lire nulle part ailleurs, et c'est ça qu'on
    // ouvre le lendemain matin pour voir comment ça s'est fini.
    bulletin: {
      humeur: { emoji: "😤", mot: "bougon" },
      mot: "Le four a lâché à 5 h, réparé à 7. Tout est parti avec deux heures de retard, alors ne me demandez pas comment va la journée.",
      tour: {
        quoi: "2 croissants aux amandes",
        // UNE SEULE LIGNE, MESURÉE. À deux lignes la bande dépassait 215 points
        // et poussait la photo de l'annonce hors de l'écran — or elle
        // interrompt déjà, elle n'a pas à occuper la place.
        detail: "Les derniers de la fournée.",
        prix: "1,20 €",
        prixBarre: "2,40 €",
        minutes: 5,
        apres: 4,
      },
    },
    catalogue: [
      { id: "b-1", rayon: "Pains", nom: "Tourte de seigle", detail: "Cuisson longue, se garde une semaine.", prix: "4,20 €", photo: "/direct/sortie-du-four.jpg" },
      { id: "b-2", rayon: "Pains", nom: "Tradition", prix: "1,30 €" },
      { id: "b-3", rayon: "Pains", nom: "Pain aux céréales", prix: "3,10 €" },
      { id: "b-4", rayon: "Viennoiseries", nom: "Croissant au beurre", prix: "1,25 €" },
      { id: "b-5", rayon: "Pâtisseries", nom: "Gâteau basque", detail: "Crème ou cerise.", prix: "3,50 €" },
      { id: "b-6", rayon: "Pâtisseries", nom: "Tarte aux pommes", detail: "La part.", prix: "3,20 €" },
    ],
    branche: "restaurant",
    photo: "/direct/sortie-du-four.jpg",
    cadrage: "100%",
    nom: "Le Pétrin d'Amanieu",
    metier: "Boulangerie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 600,
    distance: "600 m",
    pouces: [{ qui: "Martine G.", combien: 6 }],
    fiche: {
      ou: "Avenue principale, en face de l'arrêt de bus",
      horaires: "Aujourd'hui, 6 h 30 – 19 h 30",
      mot: "Pains au levain, tout est fait sur place.",
    },
    recrute: {
      poste: "Quelqu'un pour la vente, le matin",
      quand: "Toute l'année, à partir de maintenant",
      contrat: "CDI · 25 h · 6 h 30 – 12 h 30, dimanche de repos",
      paye: "1 350 € net pour 25 h",
      qui: "Le matin, c'est le meilleur moment de la boutique. Il faut aimer se lever, le reste s'apprend en trois jours.",
      passez: "n'importe quel matin, après 10 h",
      depuis: "il y a une semaine",
    },
    menu: {
      plat: "La formule du midi",
      description: "Sandwich pain de campagne · Part de tarte · Boisson",
      prix: "8,50 €",
      photo: "/direct/plat-formule.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        // CE QUI RESTE À LA FERMETURE, ET QUI PARTAIT À LA POUBELLE. Le
        // boulanger le fait déjà — il le donne aux habitués qui passent au bon
        // moment. Ici, toute la rue le sait, et personne ne jette.
        de: 18.5, a: 19.5, quand: "à partir de 18 h 30", icone: "🥐", publie: 18.5,
        offert: true,
        titre: "Les viennoiseries qui restent",
        lignes: ["Ce qui n'est pas vendu à la fermeture", "À prendre au comptoir"],
        places: 8, action: "Je passe les prendre",
        envies: ["maintenant", "emporter"],
      },
      {
        de: 8, a: 11, quand: "ce matin", icone: "🥐", publie: 8,
        titre: "La fournée de 7 h",
        lignes: ["Pains au levain", "Viennoiseries encore tièdes"],
        prix: "1,30 €", places: 40, envies: ["moins15", "maintenant", "emporter"],
      },
      {
        de: 11, a: 14, quand: "11 h – 14 h", icone: "🥪",
        titre: "Formule du midi",
        lignes: ["Sandwich au choix", "Boisson + dessert"],
        prix: "8,50 €", places: 20, action: "Gardez-m'en une",
        envies: ["moins15", "maintenant", "emporter"],
        avis: [
          { note: 4, texte: "Pain frais, ça change tout.", qui: "Thomas", quand: "hier" },
          { note: 3, texte: "Correct, un peu petit pour moi.", qui: "Léa", quand: "il y a 2 semaines" },
        ],
      },
      // LE SEUL CAS OU LE NOMBRE NE FAIT PAS TOMBER UN PRIX : IL ALLUME UN
      // FOUR. Sans les douze, la fournee n'existe pas — le boulanger ne
      // rallume pas pour trois pains. C'est la meme jauge, le meme geste, et
      // ce qui est en jeu a change de nature : c'est ce qui prouve que la
      // mecanique n'est pas un systeme de remises deguise.
      {
        de: 14, a: 17, quand: "17 h", icone: "🔥",
        titre: "La fournée de 17 h",
        conseil: "Le pain de campagne d'aujourd'hui est meilleur que la tradition.",
        lignes: ["Pain de campagne au levain", "Seulement si vous êtes douze"],
        prix: "4,20 €", places: 12, envies: ["maintenant", "emporter"],
        // CELUI-CI EST AU DEUXIÈME TEMPS, ET C'EST DÉLIBÉRÉ : les autres
        // montrent un compteur qui monte, celui-ci montre ce qui se passe
        // APRÈS. Sans un cas déjà en fenêtre à l'écran, personne ne comprend
        // que le seuil n'est pas la fin — et c'est justement le mécanisme qui
        // fait qu'un clic gratuit finit par valoir quelque chose.
        collectif: {
          objectif: 12, participants: 12,
          debloque: "il lance la fournée à 17 h",
          qui: ["Martine", "Sofia", "Paul", "Léa", "Hugo"],
          fenetre: { jusqua: "15 h", confirmes: 10 },
        },
      },
      {
        de: 18, a: 19.5, quand: "18 h", icone: "🏷️", publie: 18,
        titre: "Ce qui reste, à moitié prix",
        lignes: ["Pains et viennoiseries du jour", "Jusqu'à la fermeture"],
        prix: "0,65 €", prixBarre: "1,30 €", etiquette: "−50 %", places: 12,
        envies: ["moins15", "maintenant", "emporter"],
        rappels: 4,
      },
    ],
  },
  // ── LA BOUCHERIE ─────────────────────────────────────────────────────────
  //
  // ELLE EST RANGEE DANS « RESTAURANTS », comme la boulangerie : le paquet a
  // six familles et les metiers de bouche y tiennent ensemble. Une septieme
  // pastille pour un seul commerce couterait plus a la barre du haut qu'elle
  // ne rapporterait.
  //
  // C'EST LE CAS LE PLUS FORT DU COLLECTIF, ET DE LOIN. Un boucher ne peut pas
  // vous vendre un quart d'agneau — la bete ne se decoupe pas en quarts de
  // client. A quatorze parts, si. Le salon n'est plus une conversation, c'est
  // une table de partage : quatorze parts nommees, chacun prend la sienne, et
  // si ce n'est pas complet a 20 h ca s'annule et personne ne paie. Il vend
  // une bete entiere en un apres-midi, a un prix qu'il n'obtiendrait jamais
  // autrement, avec zero perte.
  //
  // SA PHOTO A MIS TROIS ENVOIS A ARRIVER, ET LES DEUX PREMIERS PORTAIENT UN
  // FILIGRANE — le credit d'un photographe incruste en travers de l'image. Il
  // se serait imprime sur le flyer, et l'image n'etait pas a nous. La carte est
  // restee sur son degrade entre-temps : un fichier absent n'est pas une panne,
  // les deux couches de `carte-swipe.tsx` existent pour ca. Le troisieme envoi
  // est propre — verifie sur les quatre bords, la ou un filigrane se cache.
  {
    id: "boucher",
    passees: [
      { ilYa: 2, titre: "La côte de bœuf maturée", prix: "34 €/kg", vues: 241, pris: 6 },
      { ilYa: 6, titre: "Les plats cuisinés du jour", prix: "12 €", vues: 132, pris: 18 },
      { ilYa: 9, titre: "La côte de bœuf maturée", prix: "34 €/kg", vues: 233, pris: 5 },
      { ilYa: 13, titre: "Les plats cuisinés du jour", prix: "12 €", vues: 141, pris: 21 },
      { ilYa: 16, titre: "La côte de bœuf maturée", prix: "34 €/kg", vues: 219, pris: 7 },
      { ilYa: 20, titre: "Les plats cuisinés du jour", prix: "12 €", vues: 128, pris: 16 },
    ],
    file: { quoi: "de la bavette", quand: "vers 18 h", combien: 4 },
    voix: {
      prenom: "Serge",
      role: "boucher",
      signature: "Je désosse et je découpe moi-même.",
    },
    bulletin: {
      humeur: { emoji: "😄", mot: "content" },
      mot: "J'ai eu la bazadaise que j'attendais depuis trois semaines. Elle est au frigo, elle en a pour quarante jours.",
    },
    catalogue: [
      { id: "bo-1", rayon: "Boeuf", nom: "Côte de bœuf maturée", detail: "40 jours, race bazadaise.", prix: "34 €/kg" },
      { id: "bo-2", rayon: "Boeuf", nom: "Bavette d’aloyau", prix: "24 €/kg" },
      { id: "bo-3", rayon: "Agneau", nom: "Gigot", detail: "Agneau de lait des Pyrénées.", prix: "26 €/kg" },
      { id: "bo-4", rayon: "Volaille", nom: "Poulet fermier des Landes", prix: "14 €/kg" },
      { id: "bo-5", rayon: "Charcuterie", nom: "Ventrèche sèche", detail: "Maison, séchée trois mois.", prix: "28 €/kg" },
    ],
    branche: "restaurant",
    photo: "/direct/etal-boucher.jpg",
    cadrage: "50%",
    nom: "Une boucherie du centre",
    metier: "Boucherie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 340,
    distance: "340 m",
    pouces: [{ qui: "Jean-Marc T.", combien: 7 }],
    fiche: {
      ou: "Rue du marché, en face de la halle",
      horaires: "Aujourd’hui, 7 h – 13 h et 15 h 30 – 19 h 30",
      mot: "Bêtes achetées entières à des éleveurs des Landes. On découpe sur place.",
    },
    recrute: {
      poste: "Un apprenti boucher",
      quand: "À la rentrée",
      contrat: "Apprentissage · 35 h · dimanche et lundi de repos",
      paye: "Selon l’âge, grille apprentissage",
      qui: "Le métier s’apprend au billot, pas dans un livre. Il faut se lever tôt et ne pas avoir peur du froid.",
      passez: "n’importe quel matin avant 11 h",
      depuis: "il y a 3 jours",
    },
    moments: [
      {
        de: 7, a: 13, quand: "ce matin", icone: "🔪",
        titre: "La côte de bœuf maturée",
        // IL DÉCONSEILLE SA PIÈCE LA PLUS CHÈRE, ET C'EST TOUT LE SUJET. Un
        // commerçant qui dit « celle-là, pas aujourd'hui » gagne en une
        // phrase une confiance qu'aucune promotion n'achète. C'est aussi la
        // preuve que ce n'est pas de la publicité déguisée : une plateforme
        // n'écrirait jamais ça à sa place.
        conseil: "La côte, attendez jeudi. Aujourd'hui, prenez la bavette.",
        lignes: ["Bazadaise, 40 jours de maturation", "Coupée à l’épaisseur que vous voulez"],
        prix: "34 €/kg", places: 6, action: "Gardez-la-moi",
        envies: ["maintenant"],
      },
      // LA BETE — le collectif qui ne ressemble a rien d'autre dans le produit.
      // Ce n'est ni une remise ni un declenchement : c'est un PARTAGE. Le
      // seuil n'est pas un objectif marketing, c'est le nombre de parts que
      // fait l'animal.
      {
        de: 8, a: 20, quand: "découpe demain matin", icone: "🐑",
        titre: "Un agneau entier, en quatorze parts",
        lignes: [
          "Agneau de lait des Pyrénées, acheté à l’éleveur",
          "Gigot, côtelettes, épaule, collier — chacun prend la sienne",
        ],
        prix: "22 € la part", places: 3, envies: [],
        collectif: {
          objectif: 14, participants: 11,
          debloque: "il achète la bête et la découpe demain",
          qui: ["Jean-Marc", "Hélène", "Karim", "Sofia", "Paul", "Anne"],
        },
      },
      {
        de: 15.5, a: 19.5, quand: "18 h", icone: "🏷️", publie: 15.5,
        titre: "Les plats cuisinés du jour",
        lignes: ["Ce qui a été préparé le matin", "Jusqu’à la fermeture"],
        prix: "6 €", prixBarre: "9 €", etiquette: "−30 %", places: 8,
        action: "Gardez-m'en une part", envies: ["moins15", "maintenant", "emporter"],
        rappels: 3,
      },
    ],
  },
  {
    id: "tablee",
    catalogue: [
      { id: "g-1", rayon: "La table d'hôtes", nom: "Le menu du soir", detail: "Entrée, plat, dessert, verre compris.", prix: "17 €", photo: "/direct/plat-du-jour.jpg" },
      { id: "g-2", rayon: "La table d'hôtes", nom: "Menu enfant", prix: "9 €" },
      { id: "g-3", rayon: "À la carte", nom: "Garbure", prix: "9 €", photo: "/direct/plat-garbure.jpg" },
      { id: "g-4", rayon: "À la carte", nom: "Axoa de veau", prix: "16 €", photo: "/direct/plat-axoa.jpg" },
      { id: "g-5", rayon: "Boissons", nom: "Pichet de rouge", detail: "50 cl.", prix: "7 €" },
    ],
    // SES PHOTOS, telles qu'on les reprendrait de sa fiche Google en lui
    // faisant son site. Images d'illustration en attendant les siennes —
    // et uniquement celles qui sont libres d'enseigne, de filigrane et de
    // visage : voir public/direct/LISEZ-MOI.md, section « ses photos ».
    sesPhotos: [
      { src: "/direct/tables-libres.jpg", quoi: "La grande table, avant le service" },
      { src: "/direct/plat-axoa.jpg", quoi: "Axoa de veau, un autre soir" },
    ],
    branche: "restaurant",
    photo: "/direct/tablee-du-soir.jpg",
    cadrage: "50%",
    nom: "La Grande Tablée",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 320,
    distance: "320 m",
    pouces: [{ qui: "Chloé V.", combien: 4 }],
    site: "lagrandetablee.fr",
    fiche: {
      ou: "Quai, au bord de l'eau",
      horaires: "Ce soir, à partir de 19 h 30",
      mot: "Une grande table commune une fois par semaine. On s'assoit avec qui vient.",
    },
    menu: {
      plat: "Poulet basquaise",
      description: "Riz · Fromage de brebis · Servi à la grande table",
      prix: "17 €",
      photo: "/direct/plat-basquaise.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        de: 17, a: 23, quand: "20 h", icone: "🎲", publie: 19.5,
        titre: "La grande table des inconnus",
        lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
        prix: "17 €", places: 2, action: "Réserver", envies: ["partager"],
        avis: [
          { note: 5, texte: "Une table de six, on ne se connaissait pas.", qui: "Chloé", quand: "il y a 15 jours",
            photo: "/direct/tablee-du-soir.jpg" },
        ],
      },
    ],
  },
  {
    id: "traiteur",
    catalogue: [
      { id: "t-1", rayon: "À emporter", nom: "Parmentier de canard", detail: "Part individuelle.", prix: "12 €" },
      { id: "t-2", rayon: "À emporter", nom: "Poulet basquaise", detail: "Pour deux.", prix: "19 €", photo: "/direct/plat-basquaise.jpg" },
      { id: "t-3", rayon: "À emporter", nom: "Garbure", detail: "Le litre.", prix: "11 €", photo: "/direct/plat-garbure.jpg" },
      { id: "t-4", rayon: "Sur commande", nom: "Plateau apéritif", detail: "Pour six, 24 h à l'avance.", prix: "38 €" },
      { id: "t-5", rayon: "Sur commande", nom: "Repas de famille", detail: "Entrée, plat, dessert, à partir de huit.", prix: "22 € / pers." },
    ],
    branche: "restaurant",
    photo: "/direct/vitrine-du-soir.jpg",
    cadrage: "72%",
    nom: "Maison Lartigue",
    metier: "Traiteur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 350,
    distance: "350 m",
    pouces: [
      { qui: "Julie A.", combien: 12 },
      { qui: "Marc E.", combien: 10 },
    ],
    site: "maison-lartigue.fr",
    fiche: {
      ou: "Rue du port, à l'angle",
      horaires: "Aujourd'hui, 9 h – 19 h 30",
      mot: "Ce qui n'est pas parti dans la journée passe à moitié prix la dernière heure.",
    },
    recrute: {
      poste: "Un commis, en extra le week-end",
      quand: "Les samedis et quelques dimanches, jusqu'en septembre",
      contrat: "Extra déclaré · 8 h à 14 h · payé à la journée",
      paye: "95 € net la journée",
      qui: "Pour les gros week-ends, on est débordés à deux. Étudiant bienvenu, on forme sur place.",
      passez: "le jeudi, entre 15 h et 18 h",
      depuis: "il y a 4 jours",
    },
    menu: {
      plat: "Parmentier de canard",
      description: "En barquette · Salade · À réchauffer ou à manger sur place",
      prix: "12 €",
      photo: "/direct/plat-parmentier.jpg",
      cadrage: "50%",
    },
    moments: [
      {
        de: 10, a: 18, quand: "toute la journée", icone: "🍱", publie: 10,
        titre: "Les barquettes du jour",
        lignes: ["Six plats au choix", "À emporter"],
        prix: "12 €", places: 25, action: "Gardez-m'en une",
        envies: ["maintenant", "emporter"],
      },
      {
        de: 18, a: 19.5, quand: "18 h", icone: "🥡",
        titre: "Ce qui reste de la journée",
        lignes: ["Barquettes du jour", "Moitié prix jusqu'à 19 h 30"],
        prix: "6 €", prixBarre: "12 €", etiquette: "−50 %", places: 7,
        action: "Gardez-m'en une", envies: ["moins15", "maintenant", "emporter"],
        avis: [
          { note: 4, texte: "Pour 6 €, franchement rien à dire.", qui: "Julie", quand: "avant-hier",
            photo: "/direct/vitrine-du-soir.jpg" },
          { note: 5, texte: "J'y passe tous les vendredis soir.", qui: "Marc", quand: "il y a 3 semaines" },
        ],
      },
    ],
  },

  // ── MODE ─────────────────────────────────────────────────────────────────
  // Le métier qui n'existait pas dans le produit tant qu'une annonce était une
  // carte du jour. Avec la journée horodatée, il a un programme comme les autres.
  {
    id: "mode-centre",
    // MÊME MÉCANIQUE, AUTRE MÉTIER : c'est tout l'intérêt de ne pas avoir
    // appelé ça « les menus ».
    catalogue: [
      { id: "m-1", rayon: "Nouveautés", nom: "Manteau laine col montant", detail: "Du 36 au 44.", prix: "129 €" },
      { id: "m-2", rayon: "Nouveautés", nom: "Robe imprimée", detail: "Trois coloris.", prix: "69 €" },
      { id: "m-3", rayon: "Toujours en rayon", nom: "Chemise en lin", prix: "49 €" },
      { id: "m-4", rayon: "Toujours en rayon", nom: "Jean droit", detail: "Coupe haute.", prix: "79 €" },
      { id: "m-5", rayon: "Accessoires", nom: "Écharpe alpaga", prix: "39 €" },
    ],
    branche: "mode",
    // LA VITRINE, ENFIN LA SIENNE. Elle remplace `portant-boutique.jpg`, qui
    // portait une enseigne lisible, un logo de marque sur la boutique voisine
    // et neuf visages de face, dans une rue qui n'est pas Dax — LISEZ-MOI.md
    // nommait deja l'argumentaire commercant comme le moment de la retirer, et
    // un flyer imprime en est un. Celle-ci ne montre ni visage ni enseigne
    // lisible.
    // ELLE EST PETITE : 387 points de large pour une carte affichee sur 390
    // points a deux fois la densite. Elle sera donc legerement molle sur un
    // telephone recent — visible, pas genant, et a remplacer par un tirage
    // plus grand quand il y en aura un.
    photo: "/direct/vitrine-mode.jpg",
    cadrage: "50%",
    nom: "Une boutique de la rue piétonne",
    metier: "Prêt-à-porter",
    ville: VILLE,
    itineraire: YALLER,
    metres: 210,
    distance: "210 m",
    pouces: [
      { qui: "Élodie N.", combien: 5 },
      { qui: "Thomas W.", combien: 3 },
    ],
    site: "boutique-rue-pietonne.fr",
    fiche: {
      ou: "Rue piétonne, à côté du kiosque",
      horaires: "Aujourd'hui, 10 h – 19 h",
      mot: "Petites séries, marques françaises. On peut faire mettre de côté.",
    },
    recrute: {
      poste: "Quelqu'un le samedi",
      quand: "Toute l'année, tous les samedis",
      contrat: "CDI · 8 h le samedi · idéal étudiant",
      paye: "480 € net par mois",
      qui: "Le samedi je suis seule et je ne peux pas m'occuper de trois personnes en cabine. Pas besoin de connaître la mode, il faut aimer parler aux gens.",
      passez: "un mardi ou un mercredi après-midi",
      depuis: "il y a 12 jours",
    },
    reponse: {
      cadeau: "Une retouche offerte sur votre achat",
      texte: "Je vous sors les nouveautés à votre taille avant que vous arriviez.",
      tenu: "19 h",
      apres: 7,
    },
    moments: [
      {
        de: 10, a: 13, quand: "ce matin", icone: "✨",
        titre: "L'arrivage est en vitrine",
        lignes: ["La collection d'automne", "Déballée ce matin"],
        places: 30, envies: ["arrivage", "maintenant"],
        avis: [
          { note: 5, texte: "Des marques qu'on ne trouve pas ailleurs ici.", qui: "Élodie", quand: "le mois dernier" },
          { note: 4, texte: "Conseil honnête, on ne m'a rien poussé.", qui: "Thomas", quand: "en juin" },
        ],
      },
      {
        de: 15, a: 17, quand: "15 h", icone: "🪞",
        titre: "Essayage privé",
        lignes: ["La boutique pour vous seule, 30 min", "Sur rendez-vous"],
        places: 2, action: "Réserver", envies: [],
        avis: [
          { note: 5, texte: "La boutique pour moi toute seule, et elle m'a tout sorti à ma taille.", qui: "Manon", quand: "il y a 10 jours",
            photo: "/direct/avis-cabine.jpg" },
        ],
        rappels: 6,
      },
      // LE CAS LE PLUS SIMPLE, ET LE PLUS PARLANT : dix pantalons valent mieux
      // qu'un. Elle en commande une serie au lieu d'en vendre trois, et les
      // cinq euros qu'elle lache sont pris sur un volume qu'elle n'aurait pas
      // fait. Personne ne l'obtient seul, d'ou le salon.
      {
        de: 10, a: 19, quand: "toute la journée", icone: "👖",
        titre: "Le pantalon en lin",
        lignes: ["Coupe droite, du 36 au 44", "Trois coloris en rayon"],
        prix: "50 €", places: 14, envies: ["arrivage"],
        collectif: {
          objectif: 10, participants: 7, prixGroupe: "45 €",
          qui: ["Élodie", "Manon", "Thomas", "Inès"],
        },
      },
      {
        de: 17, a: 19, quand: "18 h", icone: "🏷️",
        titre: "Dernier jour des soldes",
        lignes: ["Tout le rayon d'été", "Jusqu'à la fermeture"],
        prix: "−40 %", etiquette: "DERNIER JOUR", places: 60,
        envies: ["solde", "maintenant"],
      },
    ],
  },
  {
    id: "mode-friperie",
    catalogue: [
      { id: "fr-1", rayon: "Arrivages", nom: "Vestes des années 70", detail: "Pièces uniques.", prix: "à partir de 35 €", photo: "/direct/friperie-rayon.jpg" },
      { id: "fr-2", rayon: "Arrivages", nom: "Chemises rayées", prix: "18 €" },
      { id: "fr-3", rayon: "Toujours en rayon", nom: "Jeans vintage", detail: "Du 36 au 46.", prix: "29 €" },
      { id: "fr-4", rayon: "Toujours en rayon", nom: "Pulls en laine", prix: "22 €" },
      { id: "fr-5", rayon: "Le service", nom: "Dépôt-vente", detail: "On reprend vos pièces, 50/50." },
    ],
    branche: "mode",
    photo: "/direct/friperie-rayon.jpg",
    cadrage: "50%",
    nom: "Une friperie du vieux centre",
    metier: "Friperie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 470,
    distance: "470 m",
    fiche: {
      ou: "Vieille ville, ruelle pavée",
      horaires: "Aujourd'hui, 11 h – 19 h",
      mot: "Pièces chinées une par une. Ce qui part le matin ne revient pas.",
    },
    moments: [
      {
        de: 11, a: 19, quand: "aujourd'hui", icone: "🧥", publie: 11,
        titre: "40 pièces sorties ce matin",
        lignes: ["Manteaux et vestes d'hiver", "Une seule de chaque"],
        prix: "à partir de 12 €", places: 40, envies: ["arrivage", "maintenant"],
      },
    ],
  },

  // ── BARS ─────────────────────────────────────────────────────────────────
  {
    id: "bar-vins",
    catalogue: [
      { id: "v-1", rayon: "Au verre", nom: "Blanc sec des Landes", prix: "5 €", photo: "/direct/verre-au-comptoir.jpg" },
      { id: "v-2", rayon: "Au verre", nom: "Rouge de Tursan", prix: "5,50 €" },
      { id: "v-3", rayon: "À grignoter", nom: "Planche mixte", detail: "Charcuterie et fromages, pour deux.", prix: "16 €" },
      { id: "v-4", rayon: "À grignoter", nom: "Olives et amandes", prix: "4 €" },
      { id: "v-5", rayon: "Sans alcool", nom: "Jus de pomme fermier", prix: "3,50 €" },
    ],
    // DEUX VUES DU MEME LIEU. Le carrousel ne s'allumait que sur les
    // restaurants, dont les moments portent deja une photo de plat ; partout
    // ailleurs il n'y avait qu'une image et le carrousel restait invisible.
    // Ces listes sont la pour que la fonction se voie a l'essai. Elles sont
    // faites d'images DEJA presentes : rien n'est invente, mais deux salons
    // partagent leurs interieurs et deux bars leurs comptoirs — a remplacer
    // par de vraies photos de chaque commerce. Voir public/direct/LISEZ-MOI.md.
    photos: ["/direct/verre-au-comptoir.jpg", "/direct/terrasse-au-soleil.jpg"],
    branche: "bar",
    photo: "/direct/verre-au-comptoir.jpg",
    cadrage: "50%",
    nom: "Un bar à vins",
    metier: "Bar à vins",
    ville: VILLE,
    itineraire: YALLER,
    metres: 190,
    distance: "190 m",
    pouces: [{ qui: "Rémi H.", combien: 8 }],
    fiche: {
      ou: "Rue piétonne, première à droite",
      horaires: "Aujourd'hui, 17 h – 1 h",
      mot: "Une quarantaine de références au verre, planches de la région.",
    },
    reponse: {
      cadeau: "Le premier verre offert",
      texte: "Poussez la porte, je vous installe au comptoir.",
      tenu: "19 h",
      apres: 6,
    },
    moments: [
      {
        de: 17, a: 20, quand: "18 h – 20 h", icone: "🍷",
        titre: "Deux verres pour un",
        lignes: ["Verre de vin + planche"],
        prix: "9 €", places: 20, action: "Réserver", envies: ["maintenant", "happy"],
        // ON NE DEPLACE PAS UN VIGNERON POUR TROIS CURIEUX. Le seuil ne touche
        // ni au prix ni au stock : il fait VENIR QUELQU'UN. C'est la variante
        // la plus eloignee de la remise, et celle qui montre le mieux que la
        // jauge est un outil de coordination avant d'etre un outil de prix.
        collectif: {
          objectif: 15, participants: 12,
          debloque: "il fait venir le vigneron jeudi",
          qui: ["Anaïs", "Vincent", "Léo", "Marion"],
        },
        avis: [
          { note: 5, texte: "La planche est généreuse.", qui: "Anaïs", quand: "vendredi" },
          { note: 4, texte: "Bon choix de vins nature.", qui: "Vincent", quand: "il y a 2 semaines" },
        ],
      },
      {
        de: 20, a: 23, quand: "21 h", icone: "🎶",
        titre: "Concert acoustique",
        lignes: ["Duo guitare-voix", "Entrée libre"],
        etiquette: "GRATUIT", places: 35, envies: ["musique"],
        rappels: 9,
      },
    ],
  },
  {
    id: "bar-terrasse",
    catalogue: [
      { id: "bt-1", rayon: "Au comptoir", nom: "Demi pression", prix: "3 €" },
      { id: "bt-2", rayon: "Au comptoir", nom: "Café", prix: "1,60 €" },
      { id: "bt-3", rayon: "Apéritif", nom: "Spritz", prix: "7 €", photo: "/direct/verre-au-comptoir.jpg" },
      { id: "bt-4", rayon: "Apéritif", nom: "Planche à partager", detail: "Pour deux ou trois.", prix: "14 €" },
      { id: "bt-5", rayon: "Sans alcool", nom: "Limonade artisanale", prix: "4 €" },
    ],
    // DEUX VUES DU MEME LIEU. Le carrousel ne s'allumait que sur les
    // restaurants, dont les moments portent deja une photo de plat ; partout
    // ailleurs il n'y avait qu'une image et le carrousel restait invisible.
    // Ces listes sont la pour que la fonction se voie a l'essai. Elles sont
    // faites d'images DEJA presentes : rien n'est invente, mais deux salons
    // partagent leurs interieurs et deux bars leurs comptoirs — a remplacer
    // par de vraies photos de chaque commerce. Voir public/direct/LISEZ-MOI.md.
    photos: ["/direct/terrasse-au-soleil.jpg", "/direct/verre-au-comptoir.jpg"],
    branche: "bar",
    photo: "/direct/terrasse-au-soleil.jpg",
    cadrage: "50%",
    nom: "Une terrasse au soleil",
    metier: "Bar",
    ville: VILLE,
    itineraire: YALLER,
    metres: 310,
    distance: "310 m",
    fiche: {
      ou: "Sur la place, côté fontaine",
      horaires: "Aujourd'hui, 10 h – 21 h",
      mot: "Terrasse au soleil jusqu'en fin d'après-midi. Bières locales, limonades maison.",
    },
    recrute: {
      poste: "Deux personnes en terrasse",
      quand: "De juin à septembre, la grosse saison",
      contrat: "CDD saisonnier · 35 h · services du soir, coupure possible",
      paye: "1 800 € net + le partage du pot",
      qui: "L'été, la terrasse fait le double du dedans. On cherche deux personnes, pas une : c'est plus facile à deux quand on débute.",
      passez: "tous les jours, entre 15 h et 17 h",
      depuis: "il y a 3 jours",
    },
    moments: [
      {
        de: 8, a: 20, quand: "toute la journée", icone: "☀️", publie: 12,
        // MÊME RÈGLE QUE PLUS HAUT : une terrasse ne se recompte pas.
        titre: "De la place en terrasse",
        lignes: ["Plein sud", "Sans réserver"],
        places: 3, envies: ["maintenant", "terrasse"],
        avis: [
          { note: 5, texte: "Plein soleil jusqu'à sept heures.", qui: "Rémi", quand: "dimanche",
            photo: "/direct/avis-verre.jpg" },
          { note: 4, texte: "On y reste jusqu'au coucher du soleil.", qui: "Sonia", quand: "samedi dernier",
            photo: "/direct/tables-libres.jpg" },
        ],
      },
    ],
  },

  // ── COIFFEURS ────────────────────────────────────────────────────────────
  {
    id: "coif-centre",
    voix: {
      prenom: "Yann",
      role: "coiffeur",
      signature: "Je coupe seul, je prends le temps.",
      // Pas de vidéo non plus — voir la note chez Margot : les deux fichiers
      // disponibles violent les règles de photos du produit.
    },
    catalogue: [
      { id: "k-1", rayon: "Coupes", nom: "Coupe femme", detail: "Shampoing, coupe, brushing.", prix: "38 €", photo: "/direct/avis-coupe.jpg" },
      { id: "k-2", rayon: "Coupes", nom: "Coupe homme", prix: "22 €" },
      { id: "k-3", rayon: "Coupes", nom: "Coupe enfant", detail: "Jusqu'à 12 ans.", prix: "16 €" },
      { id: "k-4", rayon: "Couleurs", nom: "Coloration végétale", detail: "Sans ammoniaque.", prix: "58 €" },
      { id: "k-5", rayon: "Couleurs", nom: "Balayage", detail: "Selon la longueur.", prix: "à partir de 75 €" },
      { id: "k-6", rayon: "Soins", nom: "Soin profond", detail: "Vingt minutes, avec massage.", prix: "18 €" },
    ],
    // DEUX VUES DU MEME LIEU. Le carrousel ne s'allumait que sur les
    // restaurants, dont les moments portent deja une photo de plat ; partout
    // ailleurs il n'y avait qu'une image et le carrousel restait invisible.
    // Ces listes sont la pour que la fonction se voie a l'essai. Elles sont
    // faites d'images DEJA presentes : rien n'est invente, mais deux salons
    // partagent leurs interieurs et deux bars leurs comptoirs — a remplacer
    // par de vraies photos de chaque commerce. Voir public/direct/LISEZ-MOI.md.
    photos: ["/direct/fauteuil-coiffeur.jpg", "/direct/salon-neuf.jpg"],
    branche: "coiffeur",
    photo: "/direct/fauteuil-coiffeur.jpg",
    cadrage: "50%",
    nom: "Un salon du centre",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 220,
    distance: "220 m",
    pouces: [
      { qui: "Camille D.", combien: 7 },
      { qui: "Yann F.", combien: 4 },
    ],
    site: "salon-du-centre-dax.fr",
    fiche: {
      ou: "Rue piétonne, au-dessus de la pharmacie",
      horaires: "Aujourd'hui, 9 h – 19 h",
      mot: "Quatre fauteuils, sans rendez-vous quand il reste de la place.",
    },
    reponse: {
      cadeau: "Le café et le brushing offerts",
      texte: "Le fauteuil du fond est libre, je vous prends dès votre arrivée.",
      tenu: "dans 40 min",
      apres: 5,
    },
    moments: [
      {
        // UN DÉSISTEMENT NE DURE PAS ONZE HEURES. Ce moment courait de 8 h à
        // 19 h en annonçant « dans 20 min » : à neuf heures du matin comme à six
        // heures du soir, la même place venait de se libérer. C'était faux, et
        // c'est devenu visible en horodatant les annonces — une place libérée à
        // 8 h qu'on dit fraîche à 18 h ne trompe personne deux fois.
        de: 14, a: 15.5, quand: "à 14 h 30", icone: "💇", publie: 14,
        titre: "Une place vient de se libérer",
        lignes: ["Coupe + brushing", "45 minutes"],
        prix: "28 €", places: 1, action: "Réserver", envies: ["maintenant", "moins30"],
        avis: [
          { note: 5, texte: "Elle écoute avant de couper, ça change tout.", qui: "Camille", quand: "il y a 3 semaines",
            photo: "/direct/avis-coupe.jpg" },
          { note: 5, texte: "Pris sans rendez-vous, sorti une heure après.", qui: "Yann", quand: "en juillet" },
          { note: 4, texte: "Brushing impeccable, tenue trois jours.", qui: "Fatou", quand: "le mois dernier" },
        ],
      },
      {
        de: 8, a: 19, quand: "16 h 30", icone: "✂️",
        titre: "Coupe homme",
        lignes: ["Tondeuse + ciseaux", "20 minutes"],
        prix: "18 €", places: 3, action: "Réserver", envies: ["moins30", "homme"],
        // LE TROU DE FIN D'APRES-MIDI, COMBLE A DEUX. Une seule coupe a 15 €
        // dans un creux, c'est une perte ; deux qui s'enchaînent, c'est une
        // heure pleine. Le seuil est donc de DEUX, et c'est le plus petit
        // collectif du produit — assez petit pour qu'on aille chercher un
        // inconnu, ce qui est exactement le geste qu'on veut voir naître.
        collectif: {
          objectif: 2, participants: 1, prixGroupe: "15 €",
          qui: ["Yann"],
        },
      },
    ],
  },
  {
    id: "coif-nouveau",
    // CELUI-LÀ N'A RIEN PUBLIÉ AUJOURD'HUI. Voir `silencieux` : il est suivi
    // par défaut dans la démonstration, donc c'est lui qui porte la ligne
    // « Rien aujourd'hui » derrière le cœur, à côté de trois voisins qui ont
    // quelque chose à dire. Son annonce d'emploi, elle, tient toujours.
    silencieux: true,
    catalogue: [
      { id: "cn-1", rayon: "Coupes", nom: "Coupe et brushing", prix: "35 €", photo: "/direct/salon-neuf.jpg" },
      { id: "cn-2", rayon: "Coupes", nom: "Coupe homme et barbe", prix: "28 €" },
      { id: "cn-3", rayon: "Couleurs", nom: "Coloration végétale", detail: "Cheveux blancs compris.", prix: "55 €" },
      { id: "cn-4", rayon: "Soins", nom: "Soin hydratant", detail: "Vingt minutes.", prix: "16 €" },
      { id: "cn-5", rayon: "Offre d'ouverture", nom: "Première visite", detail: "−20 % le premier mois." },
    ],
    // DEUX VUES DU MEME LIEU. Le carrousel ne s'allumait que sur les
    // restaurants, dont les moments portent deja une photo de plat ; partout
    // ailleurs il n'y avait qu'une image et le carrousel restait invisible.
    // Ces listes sont la pour que la fonction se voie a l'essai. Elles sont
    // faites d'images DEJA presentes : rien n'est invente, mais deux salons
    // partagent leurs interieurs et deux bars leurs comptoirs — a remplacer
    // par de vraies photos de chaque commerce. Voir public/direct/LISEZ-MOI.md.
    photos: ["/direct/salon-neuf.jpg", "/direct/fauteuil-coiffeur.jpg"],
    branche: "coiffeur",
    photo: "/direct/salon-neuf.jpg",
    cadrage: "50%",
    nom: "Un salon qui vient d'ouvrir",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 500,
    distance: "500 m",
    fiche: {
      ou: "Quartier des écoles",
      horaires: "Aujourd'hui, 10 h – 18 h",
      mot: "Salon ouvert ce mois-ci. Colorations végétales, sur rendez-vous.",
    },
    recrute: {
      poste: "Un coiffeur ou une coiffeuse",
      quand: "Dès que possible, sur le long terme",
      contrat: "CDI · 35 h sur 4 jours · samedi travaillé",
      paye: "1 900 € net, évolutif au bout d'un an",
      qui: "Le salon a deux mois et le carnet se remplit plus vite que prévu. Le deuxième fauteuil vous attend, avec votre façon de travailler.",
      passez: "le lundi, quand le salon est fermé, ou après 18 h",
      depuis: "il y a 5 jours",
    },
    reponse: {
      cadeau: "Le diagnostic et le brushing offerts",
      texte: "Première visite : venez, on prend le temps.",
      tenu: "18 h",
      apres: 12,
    },
    moments: [
      {
        de: 8, a: 18, quand: "cette semaine", icone: "🎨",
        titre: "Couleur + coupe",
        lignes: ["Végétale ou classique", "1 h 30"],
        prix: "55 €", prixBarre: "69 €", etiquette: "OUVERTURE", places: 6,
        action: "Réserver", envies: ["couleur"],
        // UN SALON QUI VIENT D'OUVRIR A PEU D'AVIS, et c'est la vérité : deux,
        // pas trente. Lui en inventer une pleine page le rendrait moins
        // crédible que son propre « on vient d'ouvrir ».
        avis: [
          { note: 5, texte: "Végétale sur cheveux blancs, très réussi.", qui: "Martine", quand: "il y a 10 jours" },
          { note: 4, texte: "Salon tout neuf, accueil au top.", qui: "Léa", quand: "ce mois-ci" },
        ],
      },
    ],
  },

  // ── FLEURISTES ───────────────────────────────────────────────────────────
  {
    id: "fleur-marche",
    // UNE HUMEUR SANS PHRASE — et c'est le cas le plus fréquent. Le bulletin
    // n'oblige à rien : un doigt sur un visage le matin suffit, et ça reste
    // quelque chose que ses abonnés n'auraient nulle part ailleurs.
    bulletin: { humeur: { emoji: "🥰", mot: "amoureuse" } },
    catalogue: [
      { id: "f-1", rayon: "Bouquets", nom: "Bouquet du marché", detail: "Ce qui est arrivé le matin.", prix: "18 €", photo: "/direct/bouquet-du-jour.jpg" },
      { id: "f-2", rayon: "Bouquets", nom: "Bouquet rond blanc", detail: "Renoncules et eucalyptus.", prix: "32 €" },
      { id: "f-3", rayon: "Plantes", nom: "Plante verte d'intérieur", detail: "Pot compris.", prix: "24 €" },
      { id: "f-4", rayon: "Occasions", nom: "Composition deuil", detail: "Sur commande, même jour.", prix: "à partir de 55 €" },
      { id: "f-5", rayon: "Occasions", nom: "Décor de mariage", detail: "Devis après rendez-vous." },
    ],
    branche: "fleuriste",
    photo: "/direct/bouquet-du-jour.jpg",
    cadrage: "50%",
    nom: "Une fleuriste du marché",
    metier: "Fleuriste",
    ville: VILLE,
    itineraire: YALLER,
    metres: 150,
    distance: "150 m",
    pouces: [{ qui: "Maryse C.", combien: 9 }],
    fiche: {
      ou: "Sous la halle du marché",
      horaires: "Aujourd'hui, 8 h – 19 h",
      mot: "Un bouquet composé chaque matin avec ce qui est arrivé. Producteurs des Landes.",
    },
    moments: [
      {
        // LES FLEURS DE FIN DE MARCHÉ. Elles ne tiendront pas jusqu'à demain,
        // et elles sont encore belles ce soir : c'est exactement l'objet du don.
        de: 18, a: 19, quand: "à partir de 18 h", icone: "🌹", publie: 18,
        offert: true,
        titre: "Les fleurs de fin de marché",
        lignes: ["Encore belles ce soir, plus demain", "Sous la halle"],
        places: 6, action: "Je passe les prendre",
        envies: ["maintenant", "emporter"],
      },
      {
        de: 8, a: 19, quand: "jusqu'à 19 h", icone: "💐",
        titre: "Bouquet du jour",
        lignes: ["Fleurs de saison", "Prêt en cinq minutes"],
        prix: "15 €", places: 12, action: "Mettez-m'en un de côté",
        envies: ["maintenant", "moins20", "saison"],
        // CHEZ UNE FLEURISTE, LE NOMBRE NE SERT PAS A NEGOCIER : il sert a
        // FAIRE VENIR CE QU'ELLE NE COMMANDE PAS POUR UNE PERSONNE. Elle ne
        // fait pas monter un seau de pivoines de Dordogne pour trois tiges —
        // le trajet et l'invendu mangent la marge. Pour huit bouquets, oui.
        // Le seuil est donc une COMMANDE FERME au producteur, pas une remise,
        // et c'est le cas ou le mecanisme cree quelque chose qui n'existait
        // simplement pas dans la ville ce jour-la.
        collectif: {
          objectif: 8, participants: 5,
          debloque: "elle fait monter les pivoines de Dordogne",
          qui: ["Maryse", "Chloé", "Anne", "Lucie", "Pierre"],
        },
        avis: [
          { note: 5, texte: "Il a tenu dix jours sur ma table.", qui: "Maryse", quand: "il y a une semaine",
            photo: "/direct/avis-bouquet.jpg" },
        ],
      },
      {
        de: 17, a: 19, quand: "18 h", icone: "🌿", publie: 17,
        titre: "Il reste 4 bouquets",
        lignes: ["Composés ce matin", "À emporter"],
        prix: "12 €", prixBarre: "18 €", etiquette: "−30 %", places: 4,
        action: "Mettez-m'en un de côté", envies: ["maintenant", "moins20"],
      },
    ],
  },

  // ── ONGLERIES ────────────────────────────────────────────────────────────
  {
    id: "ongle-institut",
    catalogue: [
      { id: "o-1", rayon: "Pose", nom: "Pose complète gel", detail: "Environ 1 h 30.", prix: "55 €", photo: "/direct/pose-ongles.jpg" },
      { id: "o-2", rayon: "Pose", nom: "Remplissage", detail: "Toutes les trois semaines.", prix: "40 €" },
      { id: "o-3", rayon: "Vernis", nom: "Semi-permanent", prix: "28 €", photo: "/direct/avis-ongles.jpg" },
      { id: "o-4", rayon: "Soins", nom: "Manucure russe", detail: "Sans coupe de cuticules.", prix: "35 €" },
      { id: "o-5", rayon: "Soins", nom: "Beauté des pieds", prix: "38 €" },
    ],
    branche: "ongles",
    photo: "/direct/pose-ongles.jpg",
    cadrage: "50%",
    nom: "Une prothésiste ongulaire",
    metier: "Prothésiste ongulaire",
    ville: VILLE,
    itineraire: YALLER,
    metres: 340,
    distance: "340 m",
    fiche: {
      ou: "Rue commerçante, au premier étage",
      horaires: "Aujourd'hui, 10 h – 19 h",
      mot: "Sur rendez-vous. Les désistements sont annoncés ici plutôt que perdus.",
    },
    moments: [
      {
        // MÊME CORRECTION QUE CHEZ LE COIFFEUR : un désistement a une heure.
        de: 11, a: 13, quand: "à 11 h 30", icone: "💅", publie: 11,
        titre: "Un désistement",
        lignes: ["Remplissage", "45 minutes"],
        prix: "30 €", places: 1, action: "Réserver", envies: ["maintenant", "moins35"],
      },
      {
        de: 8, a: 19, quand: "17 h", icone: "✨",
        titre: "Pose complète",
        lignes: ["Gel ou semi-permanent", "1 h 15"],
        prix: "45 €", places: 2, action: "Réserver", envies: ["pose"],
        // ELLE N'OUVRE PAS SON SAMEDI POUR UNE PERSONNE. Quatre poses a la
        // suite paient la journee ; une seule, non. Le seuil decide donc si le
        // samedi existe — et les quatre y gagnent dix euros parce qu'elle n'a
        // pas de trou entre elles.
        collectif: {
          objectif: 4, participants: 2, prixGroupe: "35 €",
          qui: ["Sarah", "Inès"],
        },
        avis: [
          { note: 5, texte: "Elle a tenu trois semaines sans un éclat.", qui: "Sarah", quand: "le mois dernier",
            photo: "/direct/avis-ongles.jpg" },
        ],
      },
    ],
  },
];

/** Les moments encore d'actualité — en cours, ou à venir dans la journée. */
export function momentsRestants(c: CarteAutour, heure: number): MomentJour[] {
  return c.moments.filter((m) => heure < m.a);
}

/**
 * LE MOMENT QUE LA CARTE AFFICHE — celui qui se passe, sinon le prochain.
 *
 * C'est ce qui fait qu'une seule annonce ne montre pas la même chose à 11 h et
 * à 14 h, sans que le commerçant ait retouché quoi que ce soit.
 */
export function momentEnCours(c: CarteAutour, heure: number): MomentJour | null {
  return c.moments.find((m) => heure >= m.de && heure < m.a) ?? momentsRestants(c, heure)[0] ?? null;
}

/** Vrai si le moment se passe en ce moment même, faux s'il est à venir. */
export function seJoueMaintenant(m: MomentJour, heure: number): boolean {
  return heure >= m.de && heure < m.a;
}

/**
 * COMBIEN DE TEMPS UNE ANNONCE RESTE « FRAÎCHE » — quatre-vingt-dix minutes.
 *
 * PLUS COURT, ON NE LA VOIT PAS. Personne n'ouvre l'application dans les dix
 * minutes qui suivent une publication ; une fraîcheur de quart d'heure ne
 * servirait qu'à ceux qui y sont déjà.
 *
 * PLUS LONG, ELLE NE VEUT PLUS RIEN DIRE. « Il y a quatre heures » n'est pas
 * une nouvelle, c'est la journée. Et surtout : au-delà, la moitié du paquet
 * serait en tête, ce qui revient à n'avoir plus de tête du tout.
 */
export const FRAICHEUR_MIN = 90;

/**
 * DEPUIS COMBIEN DE TEMPS, EN MINUTES — ou `null` s'il ne l'a pas annoncé,
 * si c'était il y a trop longtemps, ou si l'annonce n'est plus vraie.
 *
 * LES TROIS CONDITIONS COMPTENT AUTANT. La dernière est celle qu'on oublie :
 * une annonce publiée il y a vingt minutes POUR CE SOIR n'est pas un moment,
 * c'est une prévision. Ce qui remonte en tête, c'est ce qui est vrai
 * MAINTENANT et qui vient d'être dit.
 */
export function fraicheur(m: MomentJour, heure: number): number | null {
  if (m.publie == null) return null;
  if (!seJoueMaintenant(m, heure)) return null;
  const min = Math.round((heure - m.publie) * 60);
  return min >= 0 && min <= FRAICHEUR_MIN ? min : null;
}

/** Le moment frais d'un commerce — le plus récent s'il y en a plusieurs. */
export function momentFrais(
  c: CarteAutour,
  heure: number,
): { moment: MomentJour; ilYa: number } | null {
  let mieux: { moment: MomentJour; ilYa: number } | null = null;
  for (const m of c.moments) {
    const f = fraicheur(m, heure);
    if (f != null && (!mieux || f < mieux.ilYa)) mieux = { moment: m, ilYa: f };
  }
  return mieux;
}

/**
 * COMMENT ON L'ÉCRIT — et jamais en secondes ni en « 0 min ».
 *
 * « À L'INSTANT » PLUTÔT QU'UN CHIFFRE SOUS LA MINUTE. Un compteur qui affiche
 * « il y a 0 min » a l'air cassé, et un qui descend à la seconde transforme une
 * nouvelle en chronomètre — on a déjà un compte à rebours dans ce produit, et
 * un seul suffit.
 */
export function ilYa(min: number): string {
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  return "il y a 1 h";
}

/**
 * CE QUI EST OUVERT MAINTENANT, DANS CE MÉTIER, DU PLUS PRÈS AU PLUS LOIN.
 *
 * Un commerce n'apparaît que s'il lui reste au moins un moment dans la journée.
 * Le tri par distance n'est pas cosmétique : on ne choisit pas un commerce, on
 * choisit un commerce où on a le temps d'aller.
 */
export function autourDeMoi(heure: number, branche: CleMetier): CarteAutour[] {
  // CELUI QUI N'A RIEN PUBLIÉ N'EST PAS DANS LE PAQUET. Voir `silencieux` :
  // pas de planning le matin, pas de carte dans la journée. C'est la règle du
  // produit, pas une exception de maquette.
  return CARTES.filter(
    (c) => c.branche === branche && !c.silencieux && momentsRestants(c, heure).length > 0,
  ).sort((a, b) => a.metres - b.metres);
}

/**
 * CE QU'UN COMMERCE SUIVI A DIT AUJOURD'HUI — ou rien du tout.
 *
 * C'EST LE CONTENU DE LA PASTILLE DU CŒUR, et sa règle tient en deux lignes :
 * on rend le moment qu'il affiche maintenant, et à défaut le dernier de sa
 * journée. Le second cas est marqué `passe`, parce que « ce midi » et « dans
 * une heure » n'appellent pas le même geste : on ne se déplace pas pour ce qui
 * est fini, on le lit.
 *
 * RIEN N'EST INVENTÉ QUAND IL N'A RIEN DIT. La fonction rend `null`, et
 * l'écran écrit « Rien aujourd'hui ». Remplir ce trou avec sa fiche ou son
 * dernier plat serait le pire service à lui rendre : ses abonnés croiraient
 * qu'il a publié, et il n'aurait plus aucune raison de le faire.
 */
/**
 * CE QU'ON GAGNE À SUIVRE CE COMMERCE-LÀ — une phrase par métier.
 *
 * LE DÉFAUT QU'ELLE CORRIGE, RELEVÉ À L'ESSAI : « pour s'abonner ça m'a l'air
 * très loin et pas très clair des avantages qu'on en retire ». La promesse
 * disait « soyez prévenu avant les autres de ce qu'il propose » — la même
 * partout, donc vraie nulle part. C'est une phrase, pas un bénéfice : elle ne
 * décrit rien qu'on puisse imaginer recevoir.
 *
 * CE QUI CHANGE : chaque métier promet L'INFORMATION QU'IL EST SEUL À AVOIR ET
 * QUI CHANGE TOUS LES JOURS. C'est exactement le raisonnement de l'autocollant
 * de vitrine — voir `public/qr-devanture.html` — et ce n'est pas un hasard :
 * suivre un commerce et photographier son QR sont le même geste, à deux
 * endroits différents. Les deux doivent donc promettre la même chose, sans quoi
 * l'un des deux ment.
 *
 * C'EST UN COMPLÉMENT, PAS UNE PHRASE, et la correction vient de l'essai :
 * « Ce qu'il a aujourd'hui, avant les autres » — « c'est très étrange comme
 * texte ». Juste : une liste de choses posée sous un verbe à l'infinitif ne
 * s'adresse à personne. La fonction rend donc de quoi compléter « Recevez en
 * priorité … », qui a un sujet, un verbe et un destinataire.
 */
export function promesseDeSuivi(c: CarteAutour): string {
  const m = c.metier.toLowerCase();
  if (/boulang/.test(m)) return "l'heure des fournées et ce qu'il reste le soir";
  if (/pâtiss|patiss|chocolat/.test(m)) return "les pièces du jour, en quantité limitée";
  if (/bouch|charcut/.test(m)) return "la pièce du jour et ce qu'il en reste";
  if (/poissonn/.test(m)) return "l'arrivage du matin, et d'où il vient";
  if (/fromag/.test(m)) return "ce qui est à point cette semaine";
  if (/primeur|épicer|epicer/.test(m)) return "les prix du jour et ce qui arrive le matin";
  if (/fleur/.test(m)) return "ce qui est arrivé du marché le matin";
  if (/coiff/.test(m)) return "les rendez-vous qui se libèrent dans la journée";
  // « PROTHÉSISTE ONGULAIRE » NE CONTIENT PAS « ONGLERIE », et c'est le genre
  // de trou qui ne se voit pas : la promesse retombait sur le défaut, « ses
  // offres du jour », qui ne dit rien à personne. Les libellés de métier sont
  // ceux que les commerçants emploient, pas ceux de nos six familles.
  if (/ongle|ongul|institut|esthé|esthe|beauté|beaute/.test(m))
    return "les créneaux annulés du jour";
  if (/cavist/.test(m)) return "ce qui est ouvert à la dégustation";
  // « CE QUI SE PASSE ICI CE SOIR » — sauf qu'on n'y est pas. La promesse se
  // lit sur une annonce, à distance : « ici » y désigne le téléphone, pas le
  // bar. Le pronom règle la question sans rallonger la phrase.
  if (/bar|café|cafe|brasser/.test(m)) return "ce qui s'y passe le soir";
  if (/mode|vêtement|vetement|friperie|prêt-à|pret-a|chaussur/.test(m))
    return "les nouveautés et les tailles qu'il reste";
  if (/traiteur/.test(m)) return "les plats cuisinés du jour";
  if (/restaur|table|brasser/.test(m)) return "le menu du jour et les dernières places";
  return "ses offres du jour";
}

/**
 * COMMENT ON NOMME UN COMMERCE APRÈS UN VERBE — « Suivre… ».
 *
 * LE DÉFAUT, RELEVÉ À L'ESSAI : « Suivre Un bar à vins », « la formulation est
 * étrange ». Elle l'est. Les commerces de la maquette sont anonymes — « Un bar
 * à vins », « Une boucherie du centre » — parce qu'ils sont inventés et qu'on
 * ne met pas une vraie enseigne dans une démonstration. Mais un article
 * indéfini collé derrière un verbe donne une phrase qui n'existe pas en
 * français : on ne suit pas « un » bar, on suit CE bar-là.
 *
 * L'ARTICLE PORTE LE GENRE, et c'est ce qui rend la règle exacte sans qu'on
 * ait à déclarer le genre de chaque fiche : « Un bar » → « ce bar », « Une
 * boucherie » → « cette boucherie ». Les noms propres et les enseignes qui
 * commencent par un article défini ne bougent pas : « Suivre Le Pétrin
 * d'Amanieu » se dit très bien.
 */
export function nommerApresUnVerbe(nom: string): string {
  if (/^Une /.test(nom)) return `cette ${nom.slice(4)}`;
  if (/^Un [aeiouyéèêh]/i.test(nom)) return `cet ${nom.slice(3)}`;
  if (/^Un /.test(nom)) return `ce ${nom.slice(3)}`;
  return nom;
}

export function nouvelleDuJour(
  c: CarteAutour,
  heure: number,
): { moment: MomentJour; passe: boolean } | null {
  if (c.silencieux || c.moments.length === 0) return null;
  const m = momentEnCours(c, heure);
  if (m) return { moment: m, passe: false };
  return { moment: c.moments[c.moments.length - 1], passe: true };
}

/**
 * CEUX QUI CHERCHENT DES BRAS, TOUS MÉTIERS CONFONDUS.
 *
 * PAS DE FILTRE SUR L'HEURE, ET C'EST LA DIFFÉRENCE DE NATURE. Une annonce
 * commerciale n'existe que pendant son moment ; une recherche d'employé dure
 * trois semaines et se lit aussi bien à 22 h qu'à midi. Un salon fermé le lundi
 * recrute quand même le lundi.
 *
 * PAS DE FILTRE SUR LE MÉTIER NON PLUS : quelqu'un qui cherche du travail dans
 * sa ville ne cherche pas « dans la coiffure », il cherche à côté de chez lui.
 * Le tri par distance est donc le seul qui compte.
 */
/**
 * TOUS LES COMMERCES, SANS FILTRE.
 *
 * Sert à « mon espace », qui doit retrouver un commerce gardé même si son métier
 * n'est plus celui qu'on regarde et même s'il n'a plus de moment aujourd'hui.
 * Ailleurs on filtre toujours : ici on rend ce qu'on a gardé, pas ce qui est
 * ouvert.
 */
export function toutesLesCartes(): CarteAutour[] {
  return CARTES;
}

export function ceuxQuiRecrutent(): CarteAutour[] {
  return CARTES.filter((c) => c.recrute).sort((a, b) => a.metres - b.metres);
}

/**
 * CE QUI EST OFFERT MAINTENANT, DANS TOUTE LA VILLE.
 *
 * ─── POURQUOI UNE VUE À PART, ET PAS UN MÉLANGE ───────────────────────────
 *
 * Même raison que les embauches : ça ne se glisse pas entre deux plats. Un
 * invendu offert au milieu des cartes payantes brouille les deux — on ne sait
 * plus si le paquet montre ce qu'on peut acheter ou ce qu'on peut prendre.
 *
 * ET SURTOUT, C'EST LA GARANTIE QU'ON DOIT AU COMMERÇANT. Le jour où les
 * voisins publieront ici aussi, une tarte offerte ne devra jamais apparaître
 * dans l'onglet « Restaurant » à côté de La Table de Margot. La séparation est
 * posée maintenant, pendant qu'il n'y a que des commerçants dedans : c'est
 * beaucoup plus facile que de l'ajouter après.
 *
 * ─── CE QUI EST PASSÉ N'EST PLUS OFFERT ───────────────────────────────────
 *
 * Un don a une heure de fin, et elle est vraie : les viennoiseries de 19 h ne
 * sont plus là à 21 h. On ne montre donc que ce qui est encore à prendre —
 * une vue de dons périmés serait pire que pas de vue du tout.
 */
export function cequiEstOffert(heure: number): CarteAutour[] {
  return CARTES.filter((c) => c.moments.some((m) => estAPrendre(m, heure)))
    .map((c) => ({ ...c, moments: c.moments.filter((m) => estAPrendre(m, heure)) }))
    .sort((a, b) => a.metres - b.metres);
}

/**
 * À PRENDRE VEUT DIRE MAINTENANT, PAS « PAS ENCORE FINI ».
 *
 * DÉFAUT MESURÉ : à midi, l'entrée annonçait deux commerces — les viennoiseries
 * de 18 h 30 et les fleurs de 18 h. C'était vrai au sens où ça n'était pas
 * encore passé, et faux au sens qui compte : on ne peut rien prendre à midi.
 * Une entrée qui promet deux dons et ouvre sur deux cartes qu'on ne peut pas
 * aller chercher est pire que pas d'entrée du tout.
 */
function estAPrendre(m: MomentJour, heure: number): boolean {
  return !!m.offert && heure >= m.de && heure < m.a;
}

/** Le moment offert d'un commerce — celui qui est à prendre en ce moment. */
export function momentOffert(c: CarteAutour, heure: number): MomentJour | null {
  return c.moments.find((m) => estAPrendre(m, heure)) ?? null;
}

/**
 * LE MÊME COMMERCE, SANS CE QU'IL DONNE — et c'est la garantie qu'on lui doit.
 *
 * DÉFAUT MESURÉ, ET IL CASSAIT LA PROMESSE : « Les viennoiseries qui restent »
 * apparaissait en tête de l'onglet Restaurant, entre l'axoa de veau et le
 * poulet basquaise. Le don étant frais, il remontait comme n'importe quelle
 * annonce — donc le paquet payant montrait du gratuit.
 *
 * On ne peut pas décider ça carte par carte : c'est la VUE qui décide. Le
 * paquet des métiers voit les commerces sans leurs dons ; la vue « à prendre »
 * ne voit que les dons. Chaque écran est alors cohérent avec ce qu'il promet.
 */
export function sansCeQuiEstOffert(c: CarteAutour): CarteAutour {
  return c.moments.some((m) => m.offert)
    ? { ...c, moments: c.moments.filter((m) => !m.offert) }
    : c;
}

/**
 * LA CARTE D'UNE RECHERCHE D'EMPLOI, dans le même composant que les autres.
 *
 * Même dessin, même geste, même photo du commerce — c'est ce qui fait qu'on ne
 * change pas d'application pour passer de « où je déjeune » à « qui embauche ».
 * Seule l'accroche change : le poste remplace le plat, la paye remplace le prix.
 *
 * LA PAYE EST À LA PLACE DU PRIX, et ce n'est pas un détail de mise en page :
 * c'est le chiffre qu'on cherche des yeux, et le cacher est la première raison
 * pour laquelle on ne répond pas à une annonce.
 */
export function carteDeRecrutement(c: CarteAutour): CarteDirect {
  const r = c.recrute;
  return {
    photo: c.photo,
    cadrage: c.cadrage,
    nom: c.nom,
    metier: c.metier,
    metierEmoji: emojiDuMetier(c.branche),
    ville: c.ville,
    distance: c.distance,
    itineraire: c.itineraire,
    reste: r ? `On recrute · ${r.depuis}` : "",
    icone: "🙋",
    quoi: r?.poste ?? "",
    lignes: r ? [r.quand, r.contrat] : undefined,
    prix: r?.paye,
    etiquette: "SANS CV",
  };
}

/** Combien de commerces chaque métier a en ligne à cette heure-là. */
export function comptesParMetier(heure: number): Record<CleMetier, number> {
  const n = {} as Record<CleMetier, number>;
  for (const m of METIERS) n[m.cle] = autourDeMoi(heure, m.cle).length;
  return n;
}

/** Ceux dont AU MOINS UN moment restant répond à toutes les envies cochées. */
export function selonEnvies(
  cartes: CarteAutour[],
  envies: string[],
  heure: number,
): CarteAutour[] {
  if (!envies.length) return cartes;
  return cartes.filter((c) =>
    momentsRestants(c, heure).some((m) => envies.every((e) => m.envies.includes(e))),
  );
}

/**
 * LA MOYENNE, ARRONDIE AU DIXIÈME. Zéro avis noté : rien à afficher.
 *
 * LES AVIS SANS NOTE NE COMPTENT PAS, et ce n'est pas un détail : depuis qu'on
 * peut ajouter une photo sans mettre d'étoiles, un avis peut n'être QU'une
 * photo. Mesuré : une photo posée sur un plat noté 4,5 le faisait tomber à 3,6,
 * parce qu'elle entrait dans le calcul comme un zéro. Photographier un plat
 * qu'on aime ne doit jamais lui coûter une étoile.
 */
export function moyenneAvis(avis: AvisPlat[]): number {
  const notes = avis.filter((a) => a.note > 0);
  if (!notes.length) return 0;
  return Math.round((notes.reduce((t, a) => t + a.note, 0) / notes.length) * 10) / 10;
}

/** Ceux qui portent une note — les seuls qu'on compte quand on dit « N avis ». */
export function avisNotes(avis: AvisPlat[]): AvisPlat[] {
  return avis.filter((a) => a.note > 0);
}

/**
 * LA CARTE TELLE QU'ELLE S'AFFICHE À CETTE HEURE-LÀ.
 *
 * Le commerce et le moment en cours fusionnent en un seul objet, celui que le
 * composant du produit sait dessiner. C'est ici, et nulle part ailleurs, que
 * « une annonce qui vit avec l'heure » devient concret.
 */
/**
 * LES PHOTOS DE L'ANNONCE, DANS L'ORDRE OÙ ON LES REGARDE.
 *
 * Celle qui est déjà à l'écran vient EN PREMIER : sans ça, le premier point du
 * carrousel ne correspondrait pas à ce qu'on voit, et le deuxième appui
 * ramènerait en arrière. Les doublons sautent — un commerce qui réutilise la
 * même image pour deux moments ne doit pas donner deux fois le même point.
 */
export function photosDeLAnnonce(c: CarteAutour, heure: number): string[] {
  const affichee = carteAffichee(c, heure).photo;
  const brutes = c.photos?.length
    ? c.photos
    : [c.photo, c.menu?.photo, ...c.moments.map((m) => m.photo)];
  const vues = new Set<string>();
  const liste: string[] = [];
  for (const p of [affichee, ...brutes]) {
    if (!p || vues.has(p)) continue;
    vues.add(p);
    liste.push(p);
  }
  return liste;
}

/**
 * L'HEURE, ET SEULEMENT SI C'EN EST UNE.
 *
 * LE DÉFAUT, RELEVÉ À L'ESSAI : « ce rectangle jaune prend de la place sur
 * chaque annonce et ne sert à rien ». Sur la boucherie il disait « MAINTENANT ·
 * CE MATIN » — deux fois la même chose, sur une carte qui est de toute façon
 * celle d'aujourd'hui. « Aujourd'hui », « ce matin », « cette semaine », « toute
 * la journée » : aucun n'apprend rien à quelqu'un qui regarde l'annonce du
 * jour, et chacun coûtait un rectangle sur toutes les cartes.
 *
 * CE QUI RESTE, ET C'EST LA SEULE CHOSE QUI MANQUAIT VRAIMENT : une BORNE.
 * « 11 h – 13 h », « jusqu'à 19 h », « 17 h » répondent à « est-ce que je peux
 * encore y aller », et rien d'autre sur la carte n'y répond — ni le plat, ni le
 * prix, ni le nom, ni la distance. La règle tient donc en une ligne : s'il y a
 * un chiffre, c'est une heure et elle sert ; sinon, il n'y a pas de rectangle.
 */
function borneHoraire(quand: string): boolean {
  return /\d/.test(quand);
}

/** La fraîcheur telle qu'elle s'écrit sur la carte, ou rien. */
function fraicheurEcrite(m: MomentJour, heure: number): string | undefined {
  const f = fraicheur(m, heure);
  return f == null ? undefined : ilYa(f);
}

/**
 * LE PICTOGRAMME DE SON MÉTIER — voir `CarteDirect.metierEmoji`.
 *
 * DÉCLARÉ ICI ET PAS RECOPIÉ : quatre fonctions fabriquent des cartes
 * (l'annonce, l'événement, le recrutement, la réponse à une invitation). Une
 * constante recopiée quatre fois se désynchronise à la première correction, et
 * le métier disparaîtrait sur trois cartes sur quatre sans que rien ne le dise.
 */
export function emojiDuMetier(branche: string): string {
  return METIERS.find((m) => m.cle === branche)?.emoji ?? "📍";
}

export function carteAffichee(c: CarteAutour, heure: number): CarteDirect {
  // ─── CE QUI VIENT DE TOMBER PREND LA CARTE ───
  //
  // LE DÉFAUT QUE ÇA CORRIGE, ET IL S'EST VU AU PREMIER ESSAI. La carte
  // remontait bien en tête du paquet, mais elle continuait d'afficher le moment
  // « en cours » — c'est-à-dire le premier de la liste dont la fenêtre couvre
  // l'heure. À 8 h 18, la boulangerie remontait pour sa fournée de 7 h et
  // montrait « MENU DU JOUR · La formule du midi », avec la pastille « il y a
  // 18 min » posée à côté. Le classement disait une chose et la carte en
  // montrait une autre.
  //
  // LA RÈGLE EST DONC LA MÊME DES DEUX CÔTÉS : ce qui fait remonter la carte
  // est ce que la carte montre. Un menu du jour est une permanence, une annonce
  // fraîche est un événement — et un événement passe devant une permanence. Le
  // menu ne disparaît pas pour autant : il attend sous le pli, comme le reste
  // de la journée.
  // ═══ ⚡ UN FLASH EN COURS PASSE DEVANT TOUT LE RESTE ═══
  //
  // LE DÉFAUT MESURÉ : le plat du jour et le Flash publiés dans la même minute,
  // la carte montrait le plat. `momentFrais` départage à l'horodatage, et à
  // égalité c'est le premier publié qui gagne — donc l'ordinaire devant
  // l'exceptionnel, exactement l'inverse de ce qu'on veut.
  //
  // ET CE N'EST PAS QU'UNE HISTOIRE D'ÉGALITÉ. Un Flash dure trente minutes et
  // disparaît ; le menu du jour sera encore là dans deux heures. Entre les deux,
  // celui qui se périme passe devant — c'est la même règle que la fraîcheur,
  // poussée d'un cran pour la seule chose du produit qui ait un compte à
  // rebours.
  const enFlash = c.moments.find((m) => m.flash && flashEnCours(m.flash, heure));
  const f = momentFrais(c, heure);
  const m = enFlash ?? f?.moment ?? momentEnCours(c, heure);
  // QUAND IL Y A UN MENU DU JOUR, C'EST LUI QU'ON MONTRE — photo comprise. Le
  // moment en cours ne disparaît pas : il passe dans la pastille du haut, qui
  // dit ce qui se joue en ce moment, et le programme complet attend sous le pli.
  // ET LE MENU DU JOUR CÈDE AUSSI. Sans ce `!enFlash`, un restaurant qui a un
  // menu voyait son Flash recouvert par sa formule de midi : la carte reprenait
  // son dessin habituel, et le compte à rebours n'apparaissait nulle part.
  if (c.menu && !f && !enFlash) {
    return {
      photo: c.menu.photo,
      cadrage: c.menu.cadrage ?? c.cadrage,
      nom: c.nom,
      metier: c.metier,
      metierEmoji: emojiDuMetier(c.branche),
    metierEmoji: emojiDuMetier(c.branche),
      ville: c.ville,
      distance: c.distance,
      itineraire: c.itineraire,
      // ─── LA PASTILLE NE RÉPÈTE PLUS LE MENU, ELLE DIT JUSQU'À QUAND ───
      //
      // Elle affichait le titre du moment : « 🍲 Les deux plats du jour » —
      // au-dessus d'une carte qui dit déjà « MENU DU JOUR · LASAGNES MAISON ·
      // 11 € ». Trois façons d'écrire la même chose sur un écran dont toute la
      // promesse est qu'on le comprenne en une seconde. « Est-ce vraiment
      // utile, cette mention ? » — pas sous cette forme.
      //
      // CE QUE LA CARTE NE DIT NULLE PART, en revanche, c'est L'HEURE : ni le
      // plat, ni le prix, ni le nom, ni la distance ne répondent à « est-ce
      // que je peux encore y aller ». C'est la seule chose qui manquait, et
      // c'est la seule que la pastille garde.
      reste:
        m && borneHoraire(m.quand)
          ? `${seJoueMaintenant(m, heure) ? m.icone + " " : ""}${m.quand}`
          : "",
      icone: "🍽️",
      quoi: c.menu.plat,
      lignes: [c.menu.description],
      // SA VOIX, SI ELLE EXISTE — voir `Voix` et `MomentJour.conseil`. Le
      // conseil vient du moment en cours : c'est ce qu'il conseille
      // AUJOURD'HUI, pas une phrase de vitrine.
      conseil: m?.conseil,
      voix: c.voix,
      prix: c.menu.prix,
      etiquette: "MENU DU JOUR",
      frais: m ? fraicheurEcrite(m, heure) : undefined,
    };
  }
  return {
    // LA PHOTO DU MOMENT PASSE DEVANT CELLE DU COMMERCE — voir `MomentJour.photo`.
    // Ce qu'il vient de sortir du four vaut mieux que sa devanture, qui ne dit
    // rien d'aujourd'hui.
    photo: m?.photo || c.photo,
    cadrage: c.cadrage,
    nom: c.nom,
    metier: c.metier,
    metierEmoji: emojiDuMetier(c.branche),
    ville: c.ville,
    distance: c.distance,
    itineraire: c.itineraire,
    // Le badge du haut ne dit plus une échéance mais QUAND ça se passe : c'est
    // devenu l'information principale de la carte.
    // ON NE PRÉFIXE PAS UN MOMENT QUI SE NOMME DÉJÀ « MAINTENANT ». La
    // pastille de la prothésiste ongulaire sortait « MAINTENANT · MAINTENANT »
    // — vu sur la capture d'un flyer, pas dans un test. Le préfixe existe pour
    // dire que le moment se joue en ce moment ; quand son propre libellé le dit
    // déjà, il n'ajoute rien et il se lit comme un bégaiement.
    // ON NE PRÉFIXE PAS UN LIBELLÉ QUI COUVRE DÉJÀ TOUTE LA JOURNÉE. « Maintenant
    // · maintenant » chez la prothésiste, « Maintenant · aujourd'hui » sur une
    // carte préparée : le préfixe existe pour dire qu'un moment se joue en ce
    // moment, et quand le libellé le dit déjà il se lit comme un bégaiement.
    // MÊME RÈGLE QUE PLUS HAUT — voir `borneHoraire`. Le préfixe « Maintenant »
    // ne survit que devant une vraie borne : « Maintenant · ce matin » disait
    // deux fois la même chose et occupait un rectangle sur chaque annonce.
    reste:
      m && borneHoraire(m.quand)
        ? seJoueMaintenant(m, heure)
          ? `Maintenant · ${m.quand}`
          : m.quand
        : "",
    icone: m?.icone ?? "📍",
    quoi: m?.titre ?? "",
    lignes: m?.lignes,
    conseil: m?.conseil,
    voix: c.voix,
    // ─── CE QUI EST OFFERT LE DIT, ET N'A AUCUN PRIX ───
    //
    // DÉFAUT VU SUR LA CAPTURE : la carte des viennoiseries offertes ressemblait
    // à n'importe quelle autre, en moins bien — un titre, une photo, et un vide
    // là où les autres ont un prix. Rien ne disait que c'était donné : ça se
    // lisait comme une carte cassée, pas comme un cadeau.
    //
    // ET LE PRIX EST EFFACÉ ICI AUSSI, en plus du drapeau sur le moment. Une
    // carte offerte qui traînerait un prix — parce qu'on a coché la case sans
    // vider le champ — vendrait quelque chose qu'on annonce comme gratuit.
    // C'est le genre d'erreur qu'on ne rattrape pas devant toute une ville.
    prix: m?.offert ? undefined : m?.prix,
    prixBarre: m?.offert ? undefined : m?.prixBarre,
    etiquette: m?.offert ? "OFFERT" : m?.etiquette,
    // ⚡ CE QUI SE PÉRIME DANS QUELQUES MINUTES — voir `flash.ts`. On ne passe
    // que le compte et la part écoulée : la carte n'a pas à connaître la
    // mécanique, seulement le temps qu'il reste.
    flash:
      m?.flash && flashEnCours(m.flash, heure)
        ? { reste: tempsQuiReste(m.flash, heure), part: partEcoulee(m.flash, heure) }
        : undefined,
    frais: m ? fraicheurEcrite(m, heure) : undefined,
    // PAS DE LIGNE « SOCIAL » ICI. Le nombre de moments y était écrit une
    // première fois, et la pastille de défilement le répétait dix pixels plus
    // bas, avec en prime le cœur vert qui veut dire « gardé » partout ailleurs
    // dans le produit. Une seule fois, au seul endroit sur lequel on appuie.
  };
}

/**
 * LES SUGGESTIONS SOUS LE CHAMP — pas des choix, des amorces.
 *
 * LE DÉFAUT QU'ELLES CORRIGENT, ET IL A ÉTÉ MESURÉ SUR DE VRAIES PERSONNES. La
 * première version posait deux questions à choix multiples : « vous sortez pour
 * quoi » puis « quand ». Personne n'a vu la différence avec le mode normal — et
 * ils avaient raison : deux appuis sur des options pré-écrites, c'est un filtre.
 * Rien de la personne ne partait, donc rien ne pouvait revenir qui lui soit
 * adressé.
 *
 * On demande donc une PHRASE. Même quatre mots. C'est elle qui s'affiche en haut
 * de la conversation, c'est à elle que les commerces répondent, et c'est ce qui
 * fait la différence entre une liste de résultats et une réponse.
 *
 * Les suggestions ne remplacent pas le champ : elles le remplissent. Un appui
 * pour ceux qui n'ont pas envie d'écrire, le clavier pour les autres.
 */
export const SORTIES = [
  { cle: "restaurant", label: "Déjeuner, rapide et pas cher", emoji: "🍽️" },
  { cle: "restaurant", label: "Une bonne table ce midi", emoji: "🍷" },
  { cle: "bar", label: "Boire un verre en terrasse", emoji: "☀️" },
  { cle: "coiffeur", label: "Me faire couper les cheveux", emoji: "💇" },
  { cle: "mode", label: "Trouver une veste", emoji: "👗" },
] as const satisfies readonly { cle: CleMetier; label: string; emoji: string }[];

/**
 * À QUI LA DEMANDE PART, D'APRÈS CE QUI EST ÉCRIT.
 *
 * Reconnaissance de mots, pas de compréhension : c'est une maquette, et une
 * poignée de mots-clés suffit à ce que la démonstration ne se trompe pas de
 * métier devant quelqu'un. Le vrai produit ferait autrement ; ce qu'on teste
 * ici, c'est l'effet, pas le moteur.
 */
export function brancheDeLaDemande(texte: string): CleMetier {
  const t = texte.toLowerCase();
  if (/coiff|cheveu|coupe|brushing|couleur/.test(t)) return "coiffeur";
  if (/ongle|manucure|vernis/.test(t)) return "ongles";
  if (/fleur|bouquet|plante/.test(t)) return "fleuriste";
  if (/verre|bar|bière|biere|apéro|apero|terrasse|vin/.test(t)) return "bar";
  if (/veste|robe|vêtement|vetement|fringue|boutique|jean|pull|chaussure/.test(t)) return "mode";
  return "restaurant";
}

/** Les commerces d'une branche qui ont armé quelque chose, dans l'ordre où
 *  leurs réponses arrivent. Les autres ne répondent pas, et c'est normal. */
export function repondeurs(heure: number, branche: CleMetier): CarteAutour[] {
  return autourDeMoi(heure, branche)
    .filter((c) => c.reponse)
    .sort((a, b) => (a.reponse?.apres ?? 0) - (b.reponse?.apres ?? 0));
}

/**
 * LA CARTE D'UNE INVITATION — riche, désirable, et balayable comme les autres.
 *
 * DEUX ERREURS CORRIGÉES ICI, TOUTES DEUX VUES SUR DE VRAIES PERSONNES.
 *
 * La première version renvoyait la carte du jour avec un liseré vert : personne
 * ne sentait qu'on s'adressait à lui. La deuxième a remplacé la carte par une
 * bulle de messagerie : on sentait bien la réponse, mais « ça ne donne pas du
 * tout envie » — plus de photo, plus de prix, plus d'avis, plus de swipe.
 *
 * Une invitation a besoin des deux : le ton personnel ET tout ce qui fait
 * saliver. Donc la vraie carte du produit, avec sa photo plein cadre, son prix
 * et ses avis — mais dont l'accroche n'est plus le plat, c'est LE CADEAU, et
 * dont la ligne en dessous est le mot du commerçant, entre guillemets.
 */
export function carteDeReponse(c: CarteAutour, heure: number): CarteDirect {
  const m = momentEnCours(c, heure);
  return {
    photo: c.photo,
    cadrage: c.cadrage,
    nom: c.nom,
    metier: c.metier,
    metierEmoji: emojiDuMetier(c.branche),
    ville: c.ville,
    distance: c.distance,
    itineraire: c.itineraire,
    // COURT, PARCE QUE LA PASTILLE PARTAGE SA LIGNE AVEC « Y ALLER ». Mesuré au
    // navigateur : « Rien que pour vous · jusqu'à 12 h 40 » passait sous le
    // bouton dès 402 px de large, et se coupait au milieu de l'heure à 360 px.
    reste: c.reponse ? `Pour vous · ${c.reponse.tenu}` : "",
    // LE CADEAU EST L'ACCROCHE, pas le plat : c'est la seule ligne qui fasse se
    // lever quelqu'un, et elle doit être la plus grosse de la carte.
    icone: "🎁",
    quoi: c.reponse?.cadeau ?? "",
    lignes: c.reponse ? [`« ${c.reponse.texte} »`, ...(m?.lignes?.slice(0, 1) ?? [])] : undefined,
    prix: m?.prix,
    prixBarre: m?.prixBarre,
    etiquette: "INVITATION",
  };
}

/**
 * LES AVIS À MONTRER SUR UNE INVITATION.
 *
 * Ceux du moment en cours d'abord — c'est ce qu'on va manger ou essayer tout à
 * l'heure, donc c'est ce qui compte. Mais un moment n'en porte pas toujours : à
 * 11 h le restaurant du centre propose la table du personnel, qui n'a pas
 * d'avis, et l'invitation partait sans une étoile. C'est exactement le défaut
 * mesuré (« pas d'avis »), et le pire moment pour l'avoir : une invitation sans
 * note demande de se déplacer sur une promesse et rien d'autre.
 *
 * Alors on retombe sur les avis d'un autre moment de la même journée. Ce n'est
 * pas un mensonge : ce sont bien les clients de cette maison, sur autre chose
 * qu'elle sert. C'est ce que fait n'importe quel guide, sauf qu'ici la
 * précision revient dès que le moment noté est celui qui se joue.
 */
export function avisDuMoment(c: CarteAutour, heure: number): AvisPlat[] {
  const m = momentEnCours(c, heure);
  if (m?.avis?.length) return m.avis;
  return c.moments.find((x) => x.avis?.length)?.avis ?? [];
}
