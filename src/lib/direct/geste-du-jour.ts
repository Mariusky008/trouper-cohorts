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
};

export type GesteDuJour = {
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
  /** Le geste, à l'impératif : « Photographiez-la. » */
  geste: string;
  /** Vrai quand le geste est une PHOTO — un coiffeur, lui, dicte. */
  parPhoto: boolean;
  /** CE QUI PART, avec son verbe déjà accordé : « votre menu part », « vos
   *  tables libres partent ». La phrase de l'acte du geste se construit autour
   *  — et « votre menu » servi à un coiffeur donnait une démonstration qui
   *  parlait du commerce d'à côté. Le verbe voyage avec le sujet parce qu'il
   *  s'accorde avec lui : le laisser dans la réplique obligeait à deviner le
   *  nombre depuis l'autre bout du fichier. */
  envoi: string;
  /** Ce que l'assistante en tire, tel qu'elle l'affiche. */
  extrait: { titre: string; lignes: string[]; prix: string };
  /** Ce qui revient, heure par heure. Le cœur de la démonstration. */
  retours: RetourDuJour[];
};

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

export function gesteDuJour(
  metier: string,
  confirmation: Confirmation,
  secteur: Secteur,
  villeAff: string
): GesteDuJour {
  const v = vocabulaire(metier, confirmation, secteur);
  const gentile = habitantsDe(villeAff);

  // ── LA RESTAURATION ────────────────────────────────────────────────────
  if (estRestauration(metier)) {
    return {
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
      geste: "Photographiez-la.",
      parPhoto: true,
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
        { heure: "11 h 17", icone: "❤️", nombre: "34", quoi: "personnes auront aimé votre menu" },
        { heure: "11 h 32", icone: "📅", nombre: "3", quoi: "tables réservées" },
        { heure: "12 h 00", icone: "📊", nombre: "", quoi: "Vous saurez si votre menu prend." },
      ],
    };
  }

  // ── LES COMMERCES DE PASSAGE ───────────────────────────────────────────
  if (v.boutique) {
    return {
      quand: "Ce matin",
      verbe: "chercher",
      cherchent: "ce qu'il y a de frais",
      combien: 800,
      heure: "7 h",
      support: "votre vitrine",
      ouDort: "Vous, à cette heure-là, tout est déjà en vitrine.",
      pasVu: "Elle est magnifique. Mais elle s'arrête à votre porte. Et eux sont à quatre cents mètres, en train de choisir.",
      geste: "Photographiez-la.",
      parPhoto: true,
      envoi: "ce que vous avez ce matin part",
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
        { heure: "8 h 15", icone: "🧺", nombre: "6", quoi: "pièces mises de côté" },
        { heure: "9 h 00", icone: "📊", nombre: "", quoi: "Vous saurez ce qui plaît aujourd'hui." },
      ],
    };
  }

  // ── TOUT CE QUI TRAVAILLE SUR RENDEZ-VOUS ──────────────────────────────
  if (v.surRdv) {
    return {
      quand: "Aujourd'hui",
      verbe: "chercher",
      cherchent: `${v.un} ${v.place}`,
      combien: 600,
      heure: "9 h",
      support: "votre carnet",
      ouDort: `Vous, à cette heure-là, vos ${v.places} libres sont dans votre carnet.`,
      pasVu: `Vous êtes le seul à les voir. Et eux cherchent, maintenant, à quatre cents mètres de chez vous.`,
      geste: "Dites-le-moi.",
      parPhoto: false,
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
        { heure: "10 h 10", icone: "📅", nombre: "3", quoi: `${v.places} demandé${v.un === "une" ? "es" : "s"}` },
        { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Vous saurez si votre après-midi se remplit." },
      ],
    };
  }

  // ── LE RESTE ───────────────────────────────────────────────────────────
  return {
    quand: "Cette semaine",
    verbe: "chercher",
    cherchent: "un artisan disponible",
    combien: 300,
    heure: "9 h",
    support: "votre téléphone",
    ouDort: "Ce que vous pouvez prendre cette semaine, vous êtes seul à le savoir.",
    pasVu: "Personne d'autre ne peut le deviner. Et eux cherchent, maintenant, à quelques rues de chez vous.",
    geste: "Dites-le-moi.",
    parPhoto: false,
    envoi: "votre disponibilité part",
    extrait: { titre: "Cette semaine", lignes: ["Disponible à partir de jeudi"], prix: "" },
    retours: [
      { heure: "9 h 25", icone: "❤️", nombre: "18", quoi: `${gentile} l'auront vu passer` },
      { heure: "10 h 40", icone: "📞", nombre: "2", quoi: "demandes reçues" },
      { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Vous saurez si votre semaine se remplit." },
    ],
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
export function direRetours(g: GesteDuJour): { say: string; phrases: string[] } {
  const phrases = g.retours.map((r) =>
    r.nombre ? `À ${r.heure}, ${r.nombre} ${r.quoi}.` : r.quoi
  );
  return { say: ["Et voilà ce qui se passera ensuite.", ...phrases].join(" "), phrases };
}
