// LE GESTE DU JOUR — la colonne vertébrale de la démonstration, dans les mots
// du métier.
//
// CE QUE LA DÉMO RATAIT. Elle ouvrait sur le site et énumérait ce que ClikMe
// sait faire. Or le commerçant a déjà un site, ou s'en passe depuis dix ans :
// ce n'est pas la nouveauté. La nouveauté, c'est que cinq cents personnes
// cherchent où manger à midi et qu'il est invisible à onze heures.
//
// Le récit tient donc en quatre temps, et ce fichier les décline par métier :
//   1. CE QUE LES HABITANTS CHERCHENT, et OÙ ils le cherchent — Le Direct de
//      sa ville, qui n'était nommé nulle part dans l'ancienne démonstration.
//   2. OÙ DORT L'INFORMATION — l'ardoise, la vitrine, le carnet.
//   3. LE GESTE — photographier, ou dire.
//   4. CE QUI REVIENT — et c'est le seul moment où quelque chose revient VERS
//      lui. C'est l'image qui manquait, et c'est celle qui décide.
//
// « GOOGLE, INSTAGRAM, VOTRE VITRINE… » A DISPARU du deuxième temps, avec la
// liste `VITRINES` qui le servait : deux plateformes et un bout de verre dans
// la même énumération ouvraient un débat sur le référencement au lieu de
// fermer une évidence. Trois phrases courtes le remplacent, et elles ne
// parlent que de lui.
//
// LES CHIFFRES DU QUATRIÈME TEMPS SONT INVENTÉS, comme ceux de la vitrine de
// la ville, et pour la même raison : au lancement rien n'a été mesuré, et
// montrer zéro à celui qu'on veut convaincre revient à lui prouver qu'il n'a
// aucune raison de s'inscrire. L'écran qui les affiche porte l'étiquette
// « maquette » et le verbe au futur — c'est cette étiquette, et elle seule, qui
// sépare une projection d'un relevé.
//
// LE NOMBRE D'HABITANTS, LUI, PARLE DE LA VILLE, PAS DE NOUS. « 500 Dacquois se
// demandent où manger » est une affirmation sur une ville de vingt mille
// habitants. « 500 personnes cherchent où manger » se lisait « ClikMe a 500
// utilisateurs ici » — et le jour où il ouvre le fil et le trouve calme, il se
// sent trompé.
import { estRestauration } from "@/lib/direct/mots-metier";
import { vocabulaire } from "@/lib/site-internet/actions-flash";
import type { Confirmation, Secteur } from "@/lib/site-internet/metier-profiles";

export type RetourDuJour = {
  heure: string;
  icone: string;
  /** Le chiffre, mis en avant. Vide quand la ligne est une conclusion. */
  nombre: string;
  quoi: string;
  /** CE CHIFFRE-LÀ EST UNE DEMANDE QUI ARRIVE CHEZ LUI — l'étape 5 montre alors les messages reçus. */
  demande?: true;
};

/**
 * ═══ LES SALONS, À L'ÉTAPE 2 — juste après l'essai ═══════════════════════
 *
 * « À la fin de cette étape, c'est là qu'il faut dire qu'une fois le produit
 * essayé, le client peut ouvrir un salon entre amis ou public, où il pourrait
 * demander des avis, faire des comparaisons… C'est un endroit où les ventes
 * grimpent. Il faut montrer ces salons où le fantôme intervient, qu'on soit
 * seul ou avec des amis, et qui va nous aider à prendre une décision de chez
 * soi. » Le fantôme est celui DE LA BOUTIQUE — « avec sa casquette ».
 *
 * TROIS PHRASES, DANS LES MOTS DU MÉTIER : on ouvre un salon, son fantôme y
 * répond et conclut, et c'est là que ça se décide. `bilan` est ce que l'écran
 * affiche quand la dernière est dite.
 */
export type SalonsDuMetier = {
  ouvre: string;
  fantome: string;
  ventes: string;
  /** Le titre de la scène. */
  titre: string;
  /** « 2 pièces mises de côté » — ce que les salons ont décidé, à l'écran. */
  bilan: string;
};

/**
 * ═══ LA FAMILLE DU MÉTIER, ET ELLE DÉCIDE DE DEUX ÉCRANS ═══════════════════
 *
 * « J'étais sur la page d'accueil d'un coiffeur et au départ tout allait bien,
 * et tout à coup la démo était faite pour un restaurateur. »
 *
 * VOICI POURQUOI. Ce fichier choisit déjà, depuis longtemps, entre quatre
 * familles — la restauration, le commerce de passage, le travail sur
 * rendez-vous, et le reste — et il en tire tous les mots de la voix. Mais le
 * FIL DE LA VILLE montré à côté, lui, était écrit en dur : cinq cartes de
 * restaurant, pour tout le monde. Un coiffeur entendait donc « aujourd'hui,
 * six cents Dacquois vont chercher un créneau » au-dessus d'un menu à 19 € et
 * d'un panneau de réservation de table.
 *
 * DEUX SOURCES POUR UNE SEULE IDÉE, C'EST TOUJOURS CELLE QU'ON OUBLIE QUI
 * PARLE. La famille sort donc d'ici, avec le reste, et le fil s'écrit à partir
 * d'elle : les deux écrans ne peuvent plus diverger, parce qu'ils ne sont plus
 * décidés à deux endroits.
 */
export type FamilleMetier = "restauration" | "boutique" | "librairie" | "rdv" | "autre";

export type GesteDuJour = {
  /** Voir `FamilleMetier` : ce qui décide AUSSI du fil de la ville montré à côté. */
  famille: FamilleMetier;
  /**
   * ═══ LEUR GARDE-ROBE, AVEC SES PIÈCES — l'étape 2, chez la mode seulement ═══
   *
   * « Les clients peuvent essayer la tenue à partir de leur photo, mais aussi
   * en fouillant dans la garde-robe qu'ils auront enregistrée sur ClikMe, pour
   * voir si dans le magasin il y a quelque chose qui irait avec tel ou tel de
   * leurs vêtements. » `dit` est la phrase de Léa, entre l'essai et les
   * salons ; `titre`, celui de la scène (`scene-garde-robe.tsx`).
   */
  gardeRobe?: { dit: string; titre: string };
  /** LE MOMENT DE LA JOURNÉE OÙ ÇA SE JOUE CHEZ LUI : « Ce midi », « Ce
   *  matin », « Cette semaine ». L'acte l'ouvrait sur « Ce midi » pour tout le
   *  monde — un boulanger dont la fournée sort à 7 h et un plombier qui remplit
   *  sa semaine y lisaient une démonstration écrite pour le restaurant d'en
   *  face. */
  quand: string;
  /** LE VERBE DE LA RECHERCHE, parce qu'il ne se conjugue pas sur le même
   *  complément : on « se demande où manger », mais on « cherche un créneau ».
   *  Écrit en dur dans la réplique, il donnait « vont se demander un créneau ». */
  verbe: string;
  /** Ce que les habitants cherchent : « où manger », « un créneau ». */
  cherchent: string;
  /** Combien, dans SA ville, chaque jour. Une affirmation sur la ville. */
  combien: number;
  /** L'heure où ça se joue chez lui. */
  heure: string;
  /** Où dort l'information aujourd'hui : « votre ardoise », « votre vitrine ». */
  support: string;
  /** La phrase entière : « À 11 h, votre menu est sur votre ardoise. » */
  ouDort: string;
  /** Ce que les autres montrent déjà de lui — et ce qu'ils ne montrent pas. */
  pasVu: string;
  /** Le geste, à l'impératif : « Photographiez-la. » — c'est le titre de l'acte. */
  geste: string;
  /**
   * LA PHRASE QUI OUVRE L'ACTE DU GESTE, et elle dit à quoi ça sert.
   *
   * « Photographiez-la. C'est tout. » énonçait un ordre sans destination : on
   * ne savait pas ce qu'on rejoignait en le faisant. La phrase nomme donc Le
   * Direct — celui qu'on vient de lui montrer pendant deux actes — avant de
   * demander le geste.
   */
  gesteDit: string;
  /**
   * LE MÊME GESTE, EN UNE PROPOSITION — pour la visite guidée d'une minute.
   *
   * `gesteDit` met huit mots avant le verbe : « Pour rejoindre Le Direct, tout
   * ce que vous avez à faire, c'est de me dire… ». C'est juste à l'écrit, où
   * l'œil saute en avant ; à la voix, on attend. Celle-ci met le verbe en
   * tête, là où on l'entend. Absente, on retombe sur `gesteDit`.
   *
   * « "Pour y être" : ce n'est pas très compréhensible dans le contexte de la
   * phrase. » LE « Y » NE RENVOYAIT À RIEN : la phrase d'avant parle de ses
   * portants, de son ardoise ou de son carnet, pas du Direct. Elle nomme donc
   * ce qu'on rejoint — « Pour apparaître dans Le Direct » —, en tête, toujours.
   */
  gesteCourt?: string;
  /**
   * VRAI QUAND LE GESTE EST UNE PHOTO — et la restauration n'en est plus.
   *
   * « On ne photographie plus le menu : on discute avec l'IA pour lui dire le
   * menu et les spécificités qui iront dans le parcours en quatre étapes, avec
   * la voix du restaurateur à l'étape 3. »
   *
   * DEUX RAISONS, ET LA SECONDE EST LA VRAIE. La première est pratique : une
   * ardoise photographiée donne trois lignes de texte, jamais « ce qu'il a de
   * particulier ». La seconde décide : L'ÉTAPE 3 DU PARCOURS EST SA VOIX, et
   * une photo ne peut pas la produire. La même conversation qui donne le plat
   * donne la voix — c'est pour ça qu'il n'y a plus deux gestes à demander.
   *
   * LA VITRINE, ELLE, RESTE UNE PHOTO. Ce qu'un boulanger ou un fleuriste a ce
   * matin SE VOIT ; le dire prendrait plus de temps que le montrer, et il n'y a
   * pas de parcours en quatre écrans derrière à remplir.
   */
  parPhoto: boolean;
  /**
   * CE QUE L'ASSISTANTE LUI DEMANDE, quand le geste est une conversation.
   *
   * ÉCRIT ICI PARCE QUE LA QUESTION EST DU MÉTIER, pas de l'interface. « Qu'est-
   * ce que vous servez aujourd'hui ? » chez un restaurateur, « qu'est-ce qu'il
   * vous reste » chez un coiffeur : c'est la première phrase qu'il entend, et
   * une question générique — « que voulez-vous annoncer ? » — se répond par un
   * silence.
   *
   * SA RÉPONSE, ELLE, N'EST PAS ÉCRITE : elle se compose depuis `extrait`, qui
   * est déjà ce que l'assistante en tire. Les recopier serait garantir qu'un
   * jour la réponse dise autre chose que la carte qui en sort.
   */
  demande: string;
  /** CE QUI PART, avec son verbe déjà accordé : « votre menu part », « vos
   *  tables libres partent ». La phrase de l'acte du geste se construit autour
   *  — et « votre menu » servi à un coiffeur donnait une démonstration qui
   *  parlait du commerce d'à côté. Le verbe voyage avec le sujet parce qu'il
   *  s'accorde avec lui : le laisser dans la réplique obligeait à deviner le
   *  nombre depuis l'autre bout du fichier. */
  envoi: string;
  /** Ce que l'assistante en tire, tel qu'elle l'affiche. */
  extrait: { titre: string; lignes: string[]; prix: string };
  /**
   * CE QUI EST PUBLIÉ, EN UN GROUPE NOMINAL — pour la phrase qui ouvre le
   * dernier acte : « Une fois votre menu dans Le Direct… ». Il se déduisait de
   * `envoi` en retirant le verbe, et donnait chez un commerce de passage
   * « Une fois ce que vous avez ce matin dans Le Direct » — « ce n'est pas du
   * bon français ». Absent, on garde la déduction, juste pour les autres.
   */
  publie?: string;
  /**
   * LA SECONDE PHRASE DU GESTE, quand le métier a plus à dire que « je
   * l'écris, et ça part ». Chez une boutique de vêtements, c'est là que tient
   * l'essayage : la pièce part, et chacun peut la porter avant de venir.
   */
  suite?: string;
  /** La phrase de la demande, à l'acte de la ville, quand « ils réservent » ne se dit pas chez lui. */
  convaincus?: string;
  /**
   * LA PHRASE DU PARTAGE, au dernier acte. « Au-delà d'avoir essayé
   * virtuellement un vêtement, les gens vont surtout avoir un moyen très
   * sympa de partager leur découverte, et c'est ce qui fait toute la
   * différence, grâce aux salons de discussion qui s'ouvrent entre amis ou
   * pour tous. » Absente : la phrase de tous les métiers.
   */
  partage?: string;
  /**
   * LE GESTE EST UNE PHOTO DE LA PIÈCE ET UN MOT À SA VOIX — la boutique de
   * vêtements. « Ce n'est pas une description, mais plutôt qu'on montre à
   * l'assistante une photo du vêtement, et on laisse un vocal pour donner des
   * infos aux clients quand ils l'essaient virtuellement. » L'écran de l'acte
   * montre alors la photo envoyée et la bulle du vocal, et le fil de la ville
   * ne montre que des boutiques de vêtements.
   */
  photoEtVoix?: boolean;
  /** Ce que dit son vocal, pour l'exemple — affiché sous la bulle, jamais prêté à quelqu'un de réel. */
  motVoix?: string;
  /** La photo de la pièce de l'exemple, quand on n'a pas encore la sienne. */
  pieceExemple?: string;
  /** Ce qui revient, heure par heure. Le cœur de la démonstration. */
  retours: RetourDuJour[];
  /** Voir `SalonsDuMetier`. */
  salons: SalonsDuMetier;
  /**
   * LA PHRASE QUI OUVRE L'ÉTAPE 3 QUAND L'ÉTAPE 2 A MONTRÉ L'ESSAI ET SES
   * SALONS : « Mais pour l'essayer, encore faut-il la découvrir. » Elle remplace
   * « le plus important n'est pas votre page », qui ne suivait plus rien.
   */
  liaison: string;
};

/** Les salons d'un métier, avec le mot de ce qu'on y décide. */
function salons(
  ils: "ils" | "elles",
  fantomeDe: string,
  conclut: string,
  ventes: string,
  bilan: string,
): SalonsDuMetier {
  const amis = ils === "elles" ? "entre amies" : "entre amis";
  const chez = ils === "elles" ? "chez elles" : "chez eux";
  return {
    ouvre: `Et d'un clic, ${ils} ouvrent un salon : ${amis}, ou ouvert à toute la ville. On y demande des avis, on compare, on hésite…`,
    /* « …ces salons où le fantôme intervient, qu'on soit seul ou avec des amis,
       et qui va nous aider à prendre une décision de chez soi » : c'est le duel
       d'« Ensemble » (`duel-salon.tsx`) — il oppose leur choix à une autre
       pièce de la boutique, on vote, et la gagnante devient une demande. */
    fantome: `Et ${fantomeDe} est là, qu'${ils} soient seul${ils === "elles" ? "e" : ""}s ou ${amis} : il répond à leurs questions, les aide à trancher et, quand ${ils} se décident, ${conclut}.`,
    ventes: `C'est là que ${ventes} : depuis ${chez}.`,
    titre: ils === "elles" ? "Un essai, un clic, et elles en parlent." : "Un clic, et ils en parlent.",
    bilan,
  };
}

/**
 * CE QUE L'HABITANT VOIT EN OUVRANT LE DIRECT, dans la rue, à midi moins dix.
 *
 * C'EST LA PIÈCE QUI MANQUAIT À TOUTE LA DÉMONSTRATION. Le Direct n'y était
 * jamais montré : le commerçant entendait « votre annonce circule » sans
 * jamais voir OÙ. Or c'est là toute la nouveauté — pas un annuaire qu'on
 * consulte chez soi la veille, un écran qu'on ouvre dans la rue au moment où
 * l'on choisit.
 *
 * Ces lignes décrivent la VILLE, pas ce métier : c'est ce que tout le monde y
 * verra, et c'est ce qui rend l'acte suivant douloureux — il n'y est pas.
 */
export const LE_DIRECT_MONTRE = [
  { icone: "🍽️", quoi: "Les menus du jour" },
  { icone: "🕐", quoi: "Les tables qui restent" },
  { icone: "🥐", quoi: "Ce qui vient de sortir du four" },
];

/**
 * « Dacquois », « Bordelais »… et « habitants » quand on ne sait pas.
 *
 * ON N'INVENTE PAS UN GENTILÉ. Les règles françaises sont irrégulières —
 * Dax donne Dacquois, Pau donne Palois — et une ville mal nommée devant
 * quelqu'un qui y vit coûte plus cher que le mot ne rapporte. La liste est
 * donc courte et explicite, et le repli est neutre.
 */
const GENTILES: Record<string, string> = {
  dax: "Dacquois",
  bordeaux: "Bordelais",
  bayonne: "Bayonnais",
  biarritz: "Biarrots",
  pau: "Palois",
  "mont-de-marsan": "Montois",
};

export function habitantsDe(villeAff: string): string {
  const clef = villeAff
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");
  return GENTILES[clef] || "habitants";
}

/**
 * CE QUI OUVRE LE SOIR ET NE SERT PAS DE MENU DU JOUR.
 *
 * VOLONTAIREMENT ÉTROITE. « Brasserie » n'y est pas : une brasserie sert à midi,
 * et lui demander sa soirée à dix-huit heures raterait le service qui la fait
 * vivre. La règle du dossier vaut ici comme ailleurs — mieux vaut une famille
 * générale et juste qu'une famille précise et fausse.
 */
/** LE LIBRAIRE, ET CE QUI LUI RESSEMBLE : le bouquiniste, la librairie de BD. */
const LA_LIBRAIRIE = /librair|bouquin|bande[ -]dessin|\bbd\b|manga/i;

/** LA BOUTIQUE DE VÊTEMENTS — les mêmes mots que `brancheDuMetier`, sans « boutique » seul, qui dit tous les commerces. */
const LA_MODE = /v[êe]tement|pr[êe]t[- ]?[àa][- ]porter|friperie|\bmode\b|chaussur|lingerie|concept[- ]store|dressing/i;
/** …sauf quand le métier dit autre chose avant : une boutique de fleurs, de lunettes, de bijoux. */
const PAS_LA_MODE = /fleur|coiff|ongl|optic|lunet|bijou|librair/i;

const LE_COMPTOIR_DU_SOIR = /\bbar\b|bar à|caviste|pub\b|cave à (vin|bière|biere)|à vins?\b|à bières?\b/i;

export function gesteDuJour(
  metier: string,
  confirmation: Confirmation,
  secteur: Secteur,
  villeAff: string,
  /** LA BRANCHE DE SA PAGE, quand on la connaît : « mode » vaut tous les mots du métier — sa page dit déjà « la pièce qui vous plaît ». */
  branche?: string
): GesteDuJour {
  const v = vocabulaire(metier, confirmation, secteur);
  const gentile = habitantsDe(villeAff);

  // ── LA RESTAURATION ────────────────────────────────────────────────────
  if (estRestauration(metier)) {
    /**
     * ═══ LE COMPTOIR EST DANS CETTE FAMILLE, MAIS PAS AU MÊME MOMENT ═══════
     *
     * « Le système dont je parle est juste pour les bars et les sorties. »
     *
     * UN BAR À VINS S'ENTENDAIT DEMANDER SON MENU DU JOUR, et sa démonstration
     * répondait « Garbure landaise, magret grillé, dessert maison, 19 € ».
     * C'était déjà vrai avec l'ardoise photographiée ; la conversation l'a
     * seulement rendu lisible, parce qu'on voit maintenant SA réponse écrite en
     * toutes lettres à côté de la question.
     *
     * LA FAMILLE NE CHANGE PAS, LE MOMENT ET L'OBJET SI. Le fil de la ville
     * reste celui de la restauration — on y cherche où sortir comme on y
     * cherche où manger, et écrire un cinquième fil pour deux lignes de
     * dialogue reviendrait à créer une liste de plus qui divergera. Ce qui
     * change est ce qui devait changer : chez lui ça se joue à dix-huit heures,
     * et ce qu'il a à dire n'est pas une carte, c'est une soirée.
     */
    if (LE_COMPTOIR_DU_SOIR.test(metier)) {
      return {
        famille: "restauration",
        quand: "Ce soir",
        verbe: "se demander",
        cherchent: "où sortir",
        combien: 700,
        heure: "18 h",
        support: "votre ardoise",
        ouDort: "Vous, à cette heure-là, ce qui se passe chez vous ce soir, vous êtes seul à le savoir.",
        pasVu: "Votre devanture le dit très bien. Mais elle ne se lit que de la rue. Et eux sont à quatre cents mètres, en train de choisir.",
        geste: "Dites-le-moi.",
        gesteDit: "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me dire ce qui se passe chez vous ce soir.",
        gesteCourt: "Pour apparaître dans Le Direct, dites-moi ce qui se passe chez vous ce soir.",
        parPhoto: false,
        demande: "Qu'est-ce qui se passe chez vous ce soir ?",
        envoi: "votre soirée part",
        extrait: {
          titre: "Ce soir",
          lignes: ["Jazz en trio, à partir de 21 h", "Ardoise et verres au comptoir"],
          prix: "",
        },
        retours: [
          { heure: "18 h 20", icone: "❤️", nombre: "41", quoi: `${gentile} l'auront vu passer` },
          { heure: "19 h 05", icone: "🍷", nombre: "9", quoi: "ont dit qu'ils venaient", demande: true },
          { heure: "20 h 00", icone: "📊", nombre: "", quoi: "Avant l'ouverture, vous saurez à quoi ressemble votre soirée." },
        ],
        salons: salons("ils", "le fantôme de votre bar", "il vous envoie leur demande", "vos soirées se remplissent", "🍷 2 places demandées"),
        liaison: "Mais pour venir, encore faut-il vous découvrir.",
      };
    }
    return {
      famille: "restauration",
      quand: "Ce midi",
      verbe: "se demander",
      cherchent: "où manger",
      combien: 1000,
      heure: "11 h",
      support: "votre ardoise",
      // TROIS PHRASES, PAS UNE COMPARAISON. La version d'avant opposait Google,
      // Instagram et « votre vitrine » — deux plateformes et un bout de verre
      // dans la même liste, et un pronom qui ne renvoyait à rien. Ça ouvrait un
      // débat sur le référencement au lieu de fermer une évidence : son menu du
      // jour n'existe nulle part.
      ouDort: "Vous, à cette heure-là, votre ardoise est devant votre porte.",
      pasVu: "Elle est très bien. Mais elle ne se lit que de la rue. Et eux sont à quatre cents mètres, en train de choisir.",
      /* ═══ IL NE PHOTOGRAPHIE PLUS SON ARDOISE, IL M'EN PARLE ═════════

         Voir `parPhoto` dans le type, qui porte le pourquoi : une photo
         d'ardoise donne trois lignes et ne donnera jamais la voix de l'étape 3.
         L'ardoise reste le CONSTAT — c'est là que son menu dort à onze heures —
         elle n'est simplement plus le geste. */
      geste: "Dites-le-moi.",
      gesteDit: "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me dire ce que vous servez aujourd'hui.",
      gesteCourt: "Pour apparaître dans Le Direct, dites-moi ce que vous servez aujourd'hui.",
      parPhoto: false,
      demande: "Qu'est-ce que vous servez aujourd'hui ?",
      envoi: "votre menu part",
      extrait: {
        titre: "Menu du jour",
        lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
        prix: "19 €",
      },
      // LES PRÉCOMMANDES ONT DISPARU DE CETTE LISTE : la fonction n'existe pas.
      // Les j'aime et les réservations, si. Un seul élément faux au milieu de
      // deux vrais suffit à rendre les deux autres suspects.
      retours: [
        // « AIMÉ » EST LE MOT DU CODE, « LIKÉ » EST CELUI DU GESTE. L'habitant
        // appuie sur un cœur : c'est ce mot-là qu'il emploie, et c'est celui
        // qui fait le lien avec ce qu'on vient de lui montrer à l'acte 3.
        { heure: "11 h 17", icone: "❤️", nombre: "34", quoi: "personnes auront liké votre menu" },
        { heure: "11 h 32", icone: "📅", nombre: "3", quoi: "tables réservées", demande: true },
        { heure: "12 h 00", icone: "📊", nombre: "", quoi: "En un midi, vous saurez si votre menu plaît." },
      ],
      salons: salons("ils", "le fantôme de votre restaurant", "il vous envoie leur réservation", "vos tables se remplissent", "📅 2 réservations demandées"),
      liaison: "Mais pour venir, encore faut-il vous découvrir.",
    };
  }

  /**
   * ── LA LIBRAIRIE ───────────────────────────────────────────────────────
   *
   * « La démo de la page du commerçant n'est pas appropriée : la voix de Léa
   * parle de produits frais, et toute la démonstration est basée sur des
   * vêtements ou autre chose qui n'a rien à voir avec les livres. »
   *
   * ELLE ÉTAIT RANGÉE AVEC LES COMMERCES DE PASSAGE, et c'est la famille du
   * primeur : « ce qu'il y a de frais ce matin », la vitrine qu'on
   * photographie, des pièces mises de côté — et un fil de la ville fait d'une
   * friperie et d'un magasin de prêt-à-porter. Rien de ce qu'on vient
   * chercher chez un libraire.
   *
   * CE QU'ON VIENT CHERCHER CHEZ LUI, C'EST SON CONSEIL. Le livre qu'il a
   * aimé cette semaine, qu'il est seul à pouvoir défendre — et c'est
   * exactement ce que sa page sait faire (« Ton prochain livre »). Ce qu'il
   * dit, c'est donc son coup de cœur, pas une photo ; ce qui revient, ce sont
   * des livres mis de côté.
   */
  if (LA_LIBRAIRIE.test(metier)) {
    return {
      famille: "librairie",
      quand: "Cette semaine",
      verbe: "chercher",
      cherchent: "leur prochain livre",
      combien: 500,
      heure: "10 h",
      support: "votre table des coups de cœur",
      ouDort: "Vous, à cette heure-là, vos coups de cœur sont sur votre table, avec leur petit mot.",
      pasVu: "Elle est très belle. Mais elle ne se lit qu'en poussant votre porte. Et eux sont à quatre cents mètres, sans idée de lecture.",
      geste: "Dites-le-moi.",
      gesteDit: "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me dire quel livre vous avez aimé cette semaine.",
      gesteCourt: "Pour apparaître dans Le Direct, dites-moi quel livre vous avez aimé cette semaine.",
      parPhoto: false,
      demande: "Quel livre conseillez-vous cette semaine ?",
      envoi: "votre coup de cœur part",
      extrait: {
        titre: "Le coup de cœur du libraire",
        lignes: ["Un roman qu'on ne lâche plus", "Je vous le mets de côté"],
        prix: "",
      },
      retours: [
        { heure: "10 h 40", icone: "❤️", nombre: "26", quoi: `${gentile} l'auront vu passer` },
        { heure: "12 h 15", icone: "📚", nombre: "5", quoi: "livres mis de côté", demande: true },
        { heure: "18 h 00", icone: "📊", nombre: "", quoi: "En une semaine, vous saurez quels livres donnent envie." },
      ],
      salons: salons("ils", "le fantôme de votre librairie", "il vous demande de leur mettre le livre de côté", "vos livres trouvent leurs lecteurs", "📚 2 livres demandés"),
      liaison: "Mais pour le lire, encore faut-il le découvrir.",
    };
  }

  /**
   * ── LA BOUTIQUE DE VÊTEMENTS ─────────────────────────────────────────────
   *
   * « Étape 3 : pour un magasin de vêtements, on parle de ce qu'il y a de
   * frais au lieu de parler de ce qu'il y a de nouveau. Étape 4 : un magasin
   * de vêtements ne va pas photographier sa vitrine, mais plutôt parler de son
   * arrivage ou de la pièce qu'il veut mettre en lumière ce jour-là, pour
   * qu'elle soit vue d'un maximum de gens. Il suffit de parler à son
   * assistante IA, de lui décrire le vêtement du jour, et l'IA fait tout le
   * reste en la présentant à un maximum de personnes et en proposant de la
   * porter virtuellement avant de passer à la boutique. »
   *
   * ELLE ÉTAIT RANGÉE AVEC LE PRIMEUR, comme le libraire avant elle : « ce
   * qu'il y a de frais ce matin », la vitrine qu'on photographie. Ce qu'on
   * vient chercher chez elle, c'est ce qui vient d'arriver ; ce qu'elle a à
   * dire, c'est UNE pièce, décrite — et ce que sa page sait faire de plus
   * qu'une autre, c'est la faire essayer. Le fil de la ville reste celui des
   * boutiques : on y cherche une pièce comme on y cherche une baguette.
   */
  if (branche === "mode" || (LA_MODE.test(metier) && !PAS_LA_MODE.test(metier))) {
    return {
      famille: "boutique",
      quand: "Aujourd'hui",
      verbe: "chercher",
      cherchent: "ce qu'il y a de nouveau en boutique",
      combien: 800,
      heure: "10 h",
      support: "vos portants",
      ouDort: "Vous, ce matin, votre nouvel arrivage est sur vos portants.",
      pasVu: "Il est superbe. Mais il ne se voit qu'en poussant votre porte. Et eux sont à quatre cents mètres, en train de choisir.",
      /* UNE PHOTO ET UN VOCAL, PAS UNE DESCRIPTION. « On montre à
         l'assistante une photo du vêtement, et on laisse un vocal pour donner
         des infos aux clients quand ils l'essaient virtuellement. » */
      geste: "Montrez-moi la pièce du jour.",
      gesteDit:
        "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me montrer la pièce du jour en photo, et de me laisser un vocal.",
      gesteCourt: "Pour apparaître dans Le Direct, montrez-moi la pièce du jour en photo, et laissez-moi un vocal pour vos clientes.",
      parPhoto: false,
      photoEtVoix: true,
      demande: "Montrez-moi la pièce du jour, et dites-moi ce que vos clientes doivent savoir.",
      motVoix: "Elle tombe parfaitement, je la porte moi-même. Du 36 au 44, et les retouches sont offertes.",
      pieceExemple: "/direct/mode-chemise-volants-rose.jpeg",
      envoi: "votre pièce du jour part",
      suite:
        "Je m'occupe du reste : elle part sur votre page et dans Le Direct, chacun l'essaie sur sa propre photo, et c'est votre voix qui leur en parle.",
      /* « "Puis vous demande de la mettre" : ça ne veut rien dire. » La phrase
         était entière, c'est la voix qui la coupait au 500e caractère de
         l'acte (voir la route `tts`). Elle dit maintenant aussi le salon, que
         l'étape 2 vient de montrer. */
      convaincus:
        "Et quand une pièce leur plaît, ils l'essaient, en parlent dans leur salon, puis vous demandent de la leur mettre de côté. La demande arrive directement chez vous.",
      publie: "votre pièce du jour",
      partage:
        "Et en un clic, elles la partagent : entre amies dans leurs salons privés, et avec toute la ville dans le salon public.",
      extrait: {
        titre: "La pièce du jour",
        lignes: ["Chemise à volants rose poudré", "Du 36 au 44 · à essayer sur soi"],
        prix: "59 €",
      },
      /* « Les heures et les nombres ne sont pas bons : 15 h 30, 549 habitants
         l'auront vue passer ; 16 h 05, 19 l'auront essayée virtuellement. » */
      retours: [
        { heure: "15 h 30", icone: "❤️", nombre: "549", quoi: `${gentile} l'auront vue passer` },
        { heure: "16 h 05", icone: "👗", nombre: "19", quoi: "l'auront essayée virtuellement" },
        /* « Étape 5 : les demandes qui arrivent chez elle. » Les salons sont
           montrés à l'étape 2 ; ici, c'est ce qui en sort et arrive chez elle. */
        { heure: "17 h", icone: "🛍️", nombre: "3", quoi: "clientes vous auront demandé de la mettre de côté", demande: true },
        { heure: "18 h 00", icone: "📊", nombre: "", quoi: "En une journée, vous saurez quelle pièce donne envie." },
      ],
      gardeRobe: {
        dit: "Mieux encore : elles ouvrent leur garde-robe, enregistrée sur ClikMe, choisissent leur jean préféré, et voient aussitôt ce qui, chez vous, irait avec.",
        titre: "Leur jean préféré ? Voilà ce qui irait avec.",
      },
      salons: salons("elles", "le fantôme de votre boutique", "il vous demande de la mettre de côté", "vos ventes se décident", "🛍️ 2 mises de côté demandées"),
      liaison: "Mais pour l'essayer, encore faut-il la découvrir.",
    };
  }

  // ── LES COMMERCES DE PASSAGE ───────────────────────────────────────────
  if (v.boutique) {
    return {
      famille: "boutique",
      quand: "Ce matin",
      verbe: "chercher",
      cherchent: "ce qu'il y a de frais",
      combien: 800,
      heure: "7 h",
      support: "votre vitrine",
      ouDort: "Vous, à cette heure-là, tout est déjà en vitrine.",
      pasVu: "Elle est magnifique. Mais elle s'arrête à votre porte. Et eux sont à quatre cents mètres, en train de choisir.",
      geste: "Photographiez-la.",
      gesteDit: "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de photographier votre vitrine.",
      gesteCourt: "Pour apparaître dans Le Direct, photographiez votre vitrine.",
      parPhoto: true,
      /* JAMAIS AFFICHÉE ICI, mais le champ est obligatoire, et une question
         vide serait pire qu'une question juste : le jour où un fleuriste passe
         à la conversation, la phrase est déjà écrite dans ses mots. */
      demande: "Qu'est-ce que vous avez de frais ce matin ?",
      envoi: "ce que vous avez ce matin part",
      publie: "votre vitrine du matin",
      // AUCUN MOT DE BOULANGER : cette branche sert aussi un fleuriste, un
      // primeur et un poissonnier. « Sortis du four à 7 h · Tourtière
      // landaise » en désignait un seul et donnait aux autres une
      // démonstration qui parlait du commerce d'à côté.
      extrait: {
        titre: "Aujourd'hui en boutique",
        lignes: ["Arrivé ce matin", "Ce qui part le plus vite"],
        prix: "",
      },
      retours: [
        { heure: "7 h 40", icone: "❤️", nombre: "28", quoi: `${gentile} l'auront vu passer` },
        { heure: "8 h 15", icone: "🧺", nombre: "6", quoi: "pièces mises de côté", demande: true },
        { heure: "9 h 00", icone: "📊", nombre: "", quoi: "En une matinée, vous saurez ce qui plaît." },
      ],
      salons: salons("ils", "le fantôme de votre boutique", "il vous demande de leur mettre de côté", "vos ventes se décident", "🧺 2 mises de côté demandées"),
      liaison: "Mais pour en profiter, encore faut-il vous découvrir.",
    };
  }

  // ── TOUT CE QUI TRAVAILLE SUR RENDEZ-VOUS ──────────────────────────────
  if (v.surRdv) {
    return {
      famille: "rdv",
      quand: "Aujourd'hui",
      verbe: "chercher",
      cherchent: `${v.un} ${v.place}`,
      combien: 600,
      heure: "9 h",
      support: "votre carnet",
      ouDort: `Vous, à cette heure-là, vos ${v.places} libres sont dans votre carnet.`,
      pasVu: `Vous êtes le seul à les voir. Et eux cherchent, maintenant, à quatre cents mètres de chez vous.`,
      geste: "Dites-le-moi.",
      gesteDit: `Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me dire ce qu'il vous reste de ${v.places} libres.`,
      gesteCourt: `Pour apparaître dans Le Direct, dites-moi ce qu'il vous reste de ${v.places} libres.`,
      parPhoto: false,
      demande: `Qu'est-ce qu'il vous reste de ${v.places} libres aujourd'hui ?`,
      envoi: `vos ${v.places} libres partent`,
      extrait: {
        titre: "Aujourd'hui",
        lignes: [`3 ${v.places} libres cet après-midi`, "À partir de 14 h"],
        prix: "",
      },
      retours: [
        { heure: "9 h 25", icone: "❤️", nombre: "22", quoi: `${gentile} l'auront vu passer` },
        // L'accord suit le genre du mot, qui est rangé à côté de lui : sans
        // ça on lisait « 3 créneaux demandées » sur l'écran d'un coiffeur.
        { heure: "10 h 10", icone: "📅", nombre: "3", quoi: `${v.places} demandé${v.un === "une" ? "es" : "s"}`, demande: true },
        { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Vous saurez si votre après-midi se remplit." },
      ],
      salons: salons("ils", "votre fantôme", "il vous envoie leur demande", "votre agenda se remplit", `📅 2 ${v.places} demandé${v.un === "une" ? "es" : "s"}`),
      liaison: "Mais pour venir, encore faut-il vous découvrir.",
    };
  }

  // ── LE RESTE ───────────────────────────────────────────────────────────
  return {
    famille: "autre",
    quand: "Cette semaine",
    verbe: "chercher",
    cherchent: "un artisan disponible",
    combien: 300,
    heure: "9 h",
    support: "votre téléphone",
    ouDort: "Ce que vous pouvez prendre cette semaine, vous êtes seul à le savoir.",
    pasVu: "Personne d'autre ne peut le deviner. Et eux cherchent, maintenant, à quelques rues de chez vous.",
    geste: "Dites-le-moi.",
    gesteDit: "Pour rejoindre Le Direct, tout ce que vous avez à faire, c'est de me dire quand vous êtes disponible.",
    gesteCourt: "Pour apparaître dans Le Direct, dites-moi quand vous êtes disponible.",
    parPhoto: false,
    demande: "Quand êtes-vous disponible cette semaine ?",
    envoi: "votre disponibilité part",
    extrait: { titre: "Cette semaine", lignes: ["Disponible à partir de jeudi"], prix: "" },
    retours: [
      { heure: "9 h 25", icone: "❤️", nombre: "18", quoi: `${gentile} l'auront vu passer` },
      { heure: "10 h 40", icone: "📞", nombre: "2", quoi: "demandes reçues", demande: true },
      { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Vous saurez si votre semaine se remplit." },
    ],
    salons: salons("ils", "votre fantôme", "il vous envoie leur demande", "vos clients se décident", "📞 2 demandes reçues"),
    liaison: "Mais pour vous appeler, encore faut-il vous découvrir.",
  };
}

/**
 * CE QU'ELLE DIT PENDANT QUE LES LIGNES TOMBENT.
 *
 * LE DÉFAUT QUE ÇA CORRIGE : la réplique de cet acte tenait en six mots — « et
 * voilà ce qui se passera ensuite » — pendant que quatre lignes mettaient six
 * secondes à s'afficher. La voix finissait, l'acte suivant démarrait, et
 * l'écran le plus important de la démonstration disparaissait AVANT d'avoir
 * montré une seule ligne. Mesuré au navigateur : zéro ligne visible.
 *
 * Elle lit donc ce qui revient, ligne par ligne. C'est aussi mieux ainsi : un
 * chiffre entendu ET lu se retient, un chiffre seulement affiché se survole.
 */
/** La phrase du partage, pour tous les métiers qui n'en ont pas une à eux. */
const PARTAGE = "Et en un clic, ils en parlent : entre amis dans leurs salons privés, et avec toute la ville dans le salon public.";

export function direRetours(
  g: GesteDuJour,
  /** FAUX QUAND L'ÉTAPE 2 A DÉJÀ MONTRÉ LES SALONS : on ne les redit pas ici, l'étape montre ce qui en revient. */
  avecPartage = true,
): { say: string; phrases: string[] } {
  /* DEUX RELEVÉS ET LA CONCLUSION, comme avant — mais la conclusion n'est plus
     comptée comme un relevé : c'est elle qui ferme, et l'écran l'affiche à
     part. Rien n'est retiré ici ; la coupe, quand il en faudra une, se fera
     dans `retours`, où chaque métier écrit les siens. */
  /* LES CHIFFRES, PUIS LE PARTAGE. La conclusion de chaque métier (« en un
     midi, vous saurez si votre menu plaît ») n'est plus dite : l'écran
     l'affiche sous les compteurs, et la voix garde son temps pour ce qui
     fait la différence — les salons où l'on en parle, en un clic. */
  /* « Étape 5 : les demandes qui arrivent chez elle. » QUAND L'ÉTAPE 2 A
     MONTRÉ LES SALONS, LE PARTAGE N'EST PLUS REDIT ICI : les chiffres
     finissent sur la demande qui arrive chez lui (`demande`), et l'écran
     montre ces messages reçus. */
  const phrases = [
    ...g.retours.filter((r) => r.nombre).map((r) => `À ${r.heure}, ${r.nombre} ${r.quoi}.`),
    ...(avecPartage ? [g.partage ?? PARTAGE] : []),
  ];
  /**
   * ═══ « VOTRE MENU » ÉTAIT ÉCRIT EN DUR, POUR TOUT LE MONDE ═══════════════
   *
   * « J'ai écouté la démo pour un tatoueur et ce n'était pas du tout
   * approprié : on parlait de repas servi… donc c'est que c'est le cas pour
   * d'autres métiers aussi. »
   *
   * IL A RAISON, ET C'EST LA DERNIÈRE PHRASE DE LA VISITE. Tout ce fichier
   * choisit ses mots selon le métier — le carnet du coiffeur, la vitrine du
   * primeur, le créneau du tatoueur — et la conclusion, celle qu'on emporte,
   * disait « votre menu » à un tatoueur, à un fleuriste et à un ostéopathe.
   *
   * ELLE SE DÉDUIT MAINTENANT DE `envoi`, qui porte déjà le bon mot pour
   * chaque famille : « votre menu part », « vos créneaux libres partent »,
   * « ce que vous avez ce matin part ». On retire le verbe et il reste le
   * SUJET — c'est-à-dire exactement ce qu'on vient de publier. Une seule
   * source, donc pas de seconde liste à tenir à jour.
   *
   * ET LA PHRASE DIT QUE C'EST UNE PROJECTION. Les chiffres qui suivent ne
   * sont pas une promesse : l'écran le dit, la voix doit le dire aussi.
   */
  const quoi = g.publie ?? (g.envoi.replace(/\s+(part|partent)$/i, "").trim() || "votre annonce");
  return {
    say: [`Une fois ${quoi} dans Le Direct, voilà ce qui pourrait se passer.`, ...phrases].join(" "),
    phrases,
  };
}
