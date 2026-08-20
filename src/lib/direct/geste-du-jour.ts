// LE GESTE DU JOUR — la colonne vertébrale de la démonstration, dans les mots
// du métier.
//
// CE QUE LA DÉMO RATAIT. Elle ouvrait sur le site et énumérait ce que ClikMe
// sait faire. Or le commerçant a déjà un site, ou s'en passe depuis dix ans :
// ce n'est pas la nouveauté. La nouveauté, c'est que cinq cents personnes
// cherchent où manger à midi et qu'il est invisible à onze heures.
//
// Le récit tient donc en quatre temps, et ce fichier les décline par métier :
//   1. CE QUE LES HABITANTS CHERCHENT — « où manger », « un rendez-vous ».
//   2. OÙ DORT L'INFORMATION — l'ardoise, la vitrine, le carnet.
//   3. LE GESTE — photographier, ou dire.
//   4. CE QUI REVIENT — et c'est le seul moment où quelque chose revient VERS
//      lui. C'est l'image qui manquait, et c'est celle qui décide.
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
  /** Ce que les habitants cherchent : « où manger », « un rendez-vous ». */
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
  /** Ce que l'assistante en tire, tel qu'elle l'affiche. */
  extrait: { titre: string; lignes: string[]; prix: string };
  /** Ce qui revient, heure par heure. Le cœur de la démonstration. */
  retours: RetourDuJour[];
};

/** CE QUE D'AUTRES MONTRENT DÉJÀ DE LUI, et qui ne montre pas l'essentiel.
 *  C'est vrai, c'est vérifiable, et c'est le seul argument qui fait dire à un
 *  restaurateur « effectivement, personne ne sait ce que je sers ». */
export const VITRINES = ["Google", "Instagram", "Facebook", "les passants"];

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
      cherchent: "où manger",
      combien: 500,
      heure: "11 h",
      support: "votre ardoise",
      ouDort: "À 11 h, votre menu du jour est sur votre ardoise.",
      pasVu: "ce que vous servez aujourd'hui",
      geste: "Photographiez-la.",
      parPhoto: true,
      extrait: {
        titre: "Menu du jour",
        lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
        prix: "19 €",
      },
      retours: [
        { heure: "11 h 17", icone: "❤️", nombre: "34", quoi: "personnes ont aimé votre menu" },
        { heure: "11 h 32", icone: "🍽️", nombre: "8", quoi: "plats précommandés" },
        { heure: "11 h 32", icone: "📅", nombre: "3", quoi: "tables réservées" },
        { heure: "12 h 00", icone: "📊", nombre: "", quoi: "Vous savez ce qui va se vendre." },
      ],
    };
  }

  // ── LES COMMERCES DE PASSAGE ───────────────────────────────────────────
  if (v.boutique) {
    return {
      cherchent: "ce qu'il y a de frais aujourd'hui",
      combien: 400,
      heure: "7 h",
      support: "votre vitrine",
      ouDort: "À 7 h, tout est en vitrine. Et ça s'arrête à votre porte.",
      pasVu: "ce qui est frais ce matin",
      geste: "Photographiez-la.",
      parPhoto: true,
      extrait: {
        titre: "Aujourd'hui en boutique",
        lignes: ["Sortis du four à 7 h", "Tourtière landaise", "Ce qui part le plus vite"],
        prix: "",
      },
      retours: [
        { heure: "7 h 40", icone: "❤️", nombre: "28", quoi: `${gentile} l'ont vu passer` },
        { heure: "8 h 15", icone: "🧺", nombre: "6", quoi: "pièces mises de côté" },
        { heure: "9 h 00", icone: "📊", nombre: "", quoi: "Vous savez ce qui va partir." },
      ],
    };
  }

  // ── TOUT CE QUI TRAVAILLE SUR RENDEZ-VOUS ──────────────────────────────
  if (v.surRdv) {
    return {
      cherchent: `${v.un} ${v.place}`,
      combien: 300,
      heure: "9 h",
      support: "votre carnet",
      ouDort: `À 9 h, vos ${v.places} libres sont dans votre carnet. Et nulle part ailleurs.`,
      pasVu: `ce qui est libre cet après-midi`,
      geste: "Dites-le-moi.",
      parPhoto: false,
      extrait: {
        titre: "Aujourd'hui",
        lignes: [`3 ${v.places} libres cet après-midi`, "À partir de 14 h"],
        prix: "",
      },
      retours: [
        { heure: "9 h 25", icone: "❤️", nombre: "22", quoi: `${gentile} l'ont vu passer` },
        // L'accord suit le genre du mot, qui est rangé à côté de lui : sans
        // ça on lisait « 3 créneaux demandées » sur l'écran d'un coiffeur.
        { heure: "10 h 10", icone: "📅", nombre: "3", quoi: `${v.places} demandé${v.un === "une" ? "es" : "s"}` },
        { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Votre après-midi est rempli." },
      ],
    };
  }

  // ── LE RESTE ───────────────────────────────────────────────────────────
  return {
    cherchent: "un artisan disponible",
    combien: 300,
    heure: "9 h",
    support: "votre téléphone",
    ouDort: "Ce que vous pouvez faire cette semaine, vous êtes seul à le savoir.",
    pasVu: "ce que vous pouvez prendre cette semaine",
    geste: "Dites-le-moi.",
    parPhoto: false,
    extrait: { titre: "Cette semaine", lignes: ["Disponible à partir de jeudi"], prix: "" },
    retours: [
      { heure: "9 h 25", icone: "❤️", nombre: "18", quoi: `${gentile} l'ont vu passer` },
      { heure: "10 h 40", icone: "📞", nombre: "2", quoi: "demandes reçues" },
      { heure: "11 h 00", icone: "📊", nombre: "", quoi: "Votre semaine se remplit." },
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
