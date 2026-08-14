// LES SIX MODÈLES DE FICHE.
//
// Le modèle découle du métier. Il change LE VOCABULAIRE ET L'ACTION, jamais la
// structure : trois niveaux de lecture — envie, décision, preuve — identiques
// partout. C'est ce qui permet d'ajouter un métier sans redessiner un écran.
//
// DEUX ACTIONS, DEUX MOMENTS. La spécification en décrit deux qui semblent se
// contredire pour une boutique — « Mettre de côté » au §4, « Voir l'itinéraire »
// au §7. Ce n'est pas une contradiction : ce sont deux instants différents.
//
//   `actionCarte`  — dans le fil, avant tout engagement. Elle demande peu :
//                    mettre de côté, prendre un créneau, voir le menu.
//   `actionFinale` — après le déblocage de l'avantage. Là, le verbe doit
//                    transformer un gain numérique en acte dans la vraie ville :
//                    on ne « met plus de côté », on y va.
//
// Les confondre produirait soit une carte qui engage trop tôt, soit un écran de
// victoire qui ne dit pas quoi faire ensuite.
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

const str = (v: unknown) => (v == null ? "" : String(v));

export const MODELES = ["menu", "creneau", "produit", "derniere-chance", "seance", "maintenant"] as const;
export type ModeleFiche = (typeof MODELES)[number];

export type DefinitionModele = {
  /** Ce que la carte annonce, en tête. */
  titre: string;
  /** Les champs propres au modèle, dans l'ordre de lecture du niveau « décision ». */
  champs: readonly string[];
  actionCarte: string;
  /** Vrai si le modèle porte un compte à rebours plutôt qu'une simple échéance. */
  urgence: boolean;
};

export const MODELE: Record<ModeleFiche, DefinitionModele> = {
  menu: {
    titre: "Menu du jour",
    // Une ardoise réelle a DES PALIERS DE PRIX et plusieurs plats par service.
    // La réduire à un titre unique, c'est perdre ce qui la rend crédible.
    champs: ["ardoise", "paliers", "entrees", "plats", "desserts", "tablesRestantes", "finDeService"],
    actionCarte: "Voir le menu",
    urgence: false,
  },
  creneau: {
    titre: "Créneau libéré",
    champs: ["heure", "prestation", "duree", "prix", "expireLe"],
    actionCarte: "Prendre le créneau",
    urgence: true,
  },
  produit: {
    titre: "Produit disponible",
    champs: ["photos", "tailles", "coloris", "stock"],
    actionCarte: "Mettre de côté",
    urgence: false,
  },
  "derniere-chance": {
    titre: "Dernière chance",
    champs: ["produit", "ancienPrix", "prix", "quantite", "compteARebours"],
    actionCarte: "Réserver 30 minutes",
    urgence: true,
  },
  seance: {
    titre: "Prochaine séance",
    champs: ["debut", "placesRestantes", "duree", "lieu"],
    actionCarte: "Prendre une place",
    urgence: true,
  },
  maintenant: {
    titre: "Disponible maintenant",
    champs: ["service", "delai", "atelier"],
    actionCarte: "Venir",
    urgence: false,
  },
};

/** Métier → modèle. Les libellés viennent du référentiel `metier-profiles`,
 *  jamais d'une chaîne inventée : une faute de frappe ici enverrait un
 *  restaurant sur le modèle « produit disponible ». */
const PAR_METIER: Record<string, ModeleFiche> = {
  restaurant: "menu",
  "café / salon de thé": "menu",
  "traiteur événementiel": "menu",
  bar: "menu",

  coiffeur: "creneau",
  "coiffeur à domicile": "creneau",
  barbier: "maintenant",
  esthéticienne: "creneau",
  "institut de beauté": "creneau",
  "centre esthétique automobile": "creneau",
  spa: "creneau",
  "salon de massage": "creneau",
  "salon de bronzage": "creneau",
  tatoueur: "creneau",
  "prothésiste ongulaire": "creneau",
  maquilleuse: "creneau",
  toiletteur: "creneau",
  "photographe de mariage": "creneau",

  bijouterie: "produit",
  "magasin de décoration": "produit",
  "boutique de robes de mariée": "produit",
  opticien: "produit",

  fleuriste: "derniere-chance",
  chocolatier: "derniere-chance",
  "épicerie fine": "derniere-chance",
  caviste: "derniere-chance",

  "salle de sport": "seance",
  "coach sportif": "seance",
  "professeur de yoga": "seance",
  "professeur de danse": "seance",

  garagiste: "maintenant",
  carrossier: "maintenant",
  "lavage automobile premium": "maintenant",
  serrurier: "maintenant",
  plombier: "maintenant",
  électricien: "maintenant",
};

/** Repli par mots du libellé brut : une fiche Google mal catégorisée ne doit pas
 *  priver un commerce de son modèle. L'ordre compte — « boulangerie » avant
 *  « boutique », sinon une boulangerie tomberait sur le modèle produit. */
const PAR_TEXTE: Array<[RegExp, ModeleFiche]> = [
  [/restaurant|resto|bistrot|brasserie|pizz|cr[eê]per|traiteur|caf[ée]|salon de th[ée]|\bbar\b/i, "menu"],
  [/boulanger|p[âa]tisser|primeur|poissonn|fromager|boucher|fleurist|glacier|chocolat/i, "derniere-chance"],
  [/coiffeur|barbier|esth[ée]ti|institut|spa|massage|ongle|tatou|beaut[ée]|photograph/i, "creneau"],
  [/yoga|pilates|sport|danse|cours|atelier|cin[ée]ma|salle de/i, "seance"],
  [/r[ée]parat|cordonnier|pressing|garage|serrur|plomb|[ée]lectric|d[ée]pann/i, "maintenant"],
  [/v[êe]tement|chaussure|librairie|d[ée]coration|boutique|mode|bijou|maroquin|opticien|magasin/i, "produit"],
];

export function modeleDuMetier(activite: string): ModeleFiche {
  const a = str(activite);
  const { entry } = resolveMetier(a);
  if (entry && PAR_METIER[entry.label]) return PAR_METIER[entry.label];
  for (const [motif, modele] of PAR_TEXTE) if (motif.test(a)) return modele;
  // Repli le plus neutre : « disponible maintenant » ne promet ni stock, ni
  // créneau, ni menu — donc il ne peut pas mentir sur ce qu'on trouvera.
  return "maintenant";
}

/** §7 — le bouton APRÈS le déblocage. Un verbe de métier transforme l'avantage
 *  numérique en acte dans la vraie ville. */
export function actionFinale(activite: string): string {
  switch (modeleDuMetier(activite)) {
    case "menu":
      return "Réserver ma table";
    case "creneau":
      return "Prendre le créneau";
    case "derniere-chance":
      return "Mettre de côté";
    case "seance":
      return "Prendre ma place";
    case "produit":
      return "Voir l'itinéraire";
    default:
      return "Y aller";
  }
}

/** Le libellé d'action à afficher dans le fil. */
export function actionCarte(activite: string): string {
  return MODELE[modeleDuMetier(activite)].actionCarte;
}
