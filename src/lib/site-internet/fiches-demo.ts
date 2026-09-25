// 🎭 LES ADRESSES DE DÉMONSTRATION — un commerce par métier, sans base de données.
//
// ═══ POURQUOI ELLES EXISTENT ══════════════════════════════════════════════
//
// « Oui, des adresses de démo. » — et la raison est la même que celle du
// sélecteur de la maquette : ON NE JUGE PAS UN GABARIT SUR SON MEILLEUR CAS.
// La page d'un commerçant n'est pas la même chez un coiffeur, chez une
// onglerie et chez un restaurant — « les screenshots sont forcément
// différents » — et la seule façon de le vérifier est de pouvoir les ouvrir
// l'une après l'autre.
//
// ═══ CE QU'ELLES MONTRENT, ET CE QU'UN VRAI PROSPECT VOIT ═════════════════
//
// CE N'EST PAS LA MÊME PAGE, ET C'EST VOULU.
//
//   · Une adresse de démo montre le commerce COMPLET — ses moments du jour,
//     son catalogue, sa voix, ce qui revient chez lui. C'est ClikMe une fois
//     habité, c'est-à-dire ce qu'on vend.
//   · La page d'un vrai prospect, elle, ne montre que ce que sa fiche Google
//     contient, parce qu'inventer le reste serait lui attribuer des promesses
//     qu'il n'a pas faites. Voir `carte-depuis-fiche.ts`, qui explique
//     longuement pourquoi.
//
// LA CONFUSION ENTRE LES DEUX SERAIT LA SEULE FAUTE POSSIBLE ICI, et elle est
// écartée par le nom : ces commerces s'appellent « Un salon du centre », « Une
// friperie du vieux centre » — aucun n'existe, aucun n'est désignable, et leur
// adresse commence par `demo-`. Personne ne peut croire qu'il regarde le sien.
import { toutesLesCartes, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { carteDepuisFiche, type FicheCommercant } from "@/lib/site-internet/carte-depuis-fiche";

/**
 * LE MÉTIER → LE COMMERCE DU PAQUET QUI LE REPRÉSENTE LE MIEUX.
 *
 * Le paquet en contient vingt-cinq ; on en expose treize. Le critère n'est pas
 * « un par branche » — il n'y a que huit branches — mais UN PAR ÉCRAN
 * DIFFÉRENT : la friperie et le prêt-à-porter partagent la branche `mode` et
 * ne racontent pas la même chose, la boulangerie et le restaurant partagent
 * `restaurant` et n'ont ni le même avant-goût ni les mêmes temps.
 *
 * L'ORDRE EST CELUI DE L'INDEX, et il commence par les quatre qu'il a nommés.
 */
const DEMOS: Array<{ slug: string; carte: string; titre: string }> = [
  { slug: "demo-coiffeur", carte: "coif-centre", titre: "Un salon de coiffure" },
  { slug: "demo-onglerie", carte: "ongle-institut", titre: "Une onglerie" },
  { slug: "demo-restaurant", carte: "centre", titre: "Un restaurant" },
  { slug: "demo-mode", carte: "mode-centre", titre: "Une boutique de prêt-à-porter" },
  { slug: "demo-friperie", carte: "mode-friperie", titre: "Une friperie" },
  { slug: "demo-bar", carte: "bar-vins", titre: "Un bar à vins" },
  { slug: "demo-fleuriste", carte: "fleur-marche", titre: "Un fleuriste" },
  { slug: "demo-lunetier", carte: "lunetier-pietonne", titre: "Un opticien" },
  { slug: "demo-boulangerie", carte: "boulange", titre: "Une boulangerie" },
  { slug: "demo-boucherie", carte: "boucher", titre: "Une boucherie" },
  { slug: "demo-traiteur", carte: "traiteur", titre: "Un traiteur" },
  { slug: "demo-tatoueur", carte: "tatoueur", titre: "Un tatoueur" },
  { slug: "demo-bijoux", carte: "bijoux-atelier", titre: "Un atelier de bijoux" },
];

/**
 * ═══ ET UNE DERNIÈRE, QUI N'EST PAS COMME LES AUTRES ═══════════════════════
 *
 * LES TREIZE CI-DESSUS MONTRENT LE COMMERCE HABITÉ — ses moments, son
 * catalogue, sa voix, ce qui revient chez lui. C'est ce qu'on vend, et c'est
 * ce qu'il faut pouvoir regarder métier par métier.
 *
 * AUCUNE NE MONTRE CE QUE VOIT UN VRAI PROSPECT. Sa page, elle, se fabrique
 * depuis sa seule fiche Google — donc sans moment, sans catalogue, sans voix —
 * et c'est un tout autre écran. Il a fallu qu'il ouvre la page d'un vrai
 * coiffeur de Dax pour qu'on découvre quatre défauts qui n'existaient QUE sur
 * ce chemin-là : pas de photo en couverture, pas de prestations, pas d'accès
 * aux avis, et un salon qui ne s'ouvrait pas.
 *
 * CELLE-CI PASSE DONC PAR LE PONT, exactement comme la vraie : même fonction,
 * mêmes champs, mêmes trous. C'est la seule façon de voir venir ce genre de
 * défaut sans avoir à demander à quelqu'un d'ouvrir sa page.
 *
 * SES DONNÉES RESSEMBLENT À CE QU'APIFY RAMÈNE : des photos en `https://`, des
 * horaires par jour, une note, trois avis, des prestations déclarées — et rien
 * d'autre. Le commerce est inventé, et la page le dit en pied.
 */
const FICHE_PROSPECT: FicheCommercant = {
  slug: "demo-prospect",
  nom: "Un salon de quartier",
  metier: "Coiffeur",
  ville: "Dax",
  adresse: "Rue des Carmes, Dax",
  horaires: "Aujourd’hui, 9 h – 12 h et 14 h – 19 h",
  // DES CHEMINS LOCAUX PLUTÔT QUE DES ADRESSES GOOGLE, et c'est le seul écart
  // avec la vraie : une adresse `googleusercontent` ne se charge pas sur une
  // machine qui n'a pas le droit d'aller sur Internet, et on passerait son
  // temps à confondre « la page ne sait pas afficher la photo » avec « la
  // photo n'est pas arrivée ». Tout le reste du chemin est identique.
  photos: ["/direct/fauteuil-coiffeur.jpg", "/direct/salon-neuf.jpg", "/direct/avis-coupe.jpg"],
  note: "4,7",
  avis: 83,
  telephone: "+33600000000",
  mapsHref: "https://www.google.com/maps/search/Un+salon+de+quartier+Dax",
  avisHref: "https://search.google.com/local/reviews?placeid=demo",
  // AUCUNE PRESTATION DÉCLARÉE, ET C'EST LE CAS QU'IL FAUT VOIR. Un commerçant
  // à qui l'on envoie sa page pour la première fois n'a jamais ouvert son
  // espace : c'est exactement sa situation qui faisait disparaître le chapitre
  // « Les prestations ». La page retombe donc sur celles de son métier, sans
  // aucun prix, et le dit — voir `cataloguePropose`.
  avisGoogle: [
    { qui: "Sandra M.", texte: "Accueil chaleureux, on ne se sent jamais pressé. La coupe tient très bien.", note: 5 },
    { qui: "Julien P.", texte: "Rendez-vous pris le matin pour l’après-midi, c’est appréciable.", note: 5 },
    { qui: "Nadia B.", texte: "Bon conseil couleur, résultat naturel. Parking un peu compliqué.", note: 4 },
  ],
};

/**
 * ═══ ET UN SECOND PROSPECT, PARCE QU'UN COIFFEUR NE MONTRE PAS TOUT ═══════
 *
 * IL A FALLU QU'IL OUVRE LA PAGE D'UN VRAI RESTAURANT POUR VOIR LE DÉFAUT :
 * « c'est l'ancien concept, "Qui est là" n'est plus d'actualité pour les
 * restaurants ». Exactement le scénario que le prospect de démonstration existe
 * pour éviter — et il ne pouvait pas l'attraper, parce qu'il est coiffeur.
 *
 * ET CE N'EST PAS UN HASARD DE MÉTIER, C'EST UN PARTAGE DE MÉCANIQUE. Un
 * coiffeur, une onglerie, une boutique de mode ont leur essayage sur photo dès
 * la fiche Google : ils ne sont JAMAIS tombés sur le mur de présence. Les trois
 * familles qui y tombaient — la table, le comptoir, le métier de bouche —
 * n'avaient aucune démonstration. Le seul chemin où le défaut se voyait était
 * la page d'un vrai commerçant.
 *
 * UN RESTAURANT, DONC, ET LE MÊME PONT. Mêmes trous que le salon : pas de
 * moment, pas de catalogue, pas de voix. La seule différence est celle qui
 * compte — sa branche.
 */
const FICHE_PROSPECT_TABLE: FicheCommercant = {
  slug: "demo-prospect-table",
  nom: "Une table de quartier",
  metier: "Restaurant",
  ville: "Dax",
  adresse: "Rue Neuve, Dax",
  horaires: "Aujourd’hui, 12 h – 14 h et 19 h – 22 h",
  // MÊME ÉCART QUE POUR LE SALON, ET POUR LA MÊME RAISON : des chemins locaux
  // plutôt que des adresses `googleusercontent`, qui ne se chargent pas ici.
  photos: ["/direct/tables-libres.jpg", "/direct/tablee-du-soir.jpg", "/direct/terrasse-au-soleil.jpg"],
  note: "4,5",
  avis: 214,
  telephone: "+33600000000",
  mapsHref: "https://www.google.com/maps/search/Une+table+de+quartier+Dax",
  avisHref: "https://search.google.com/local/reviews?placeid=demo",
  // AUCUNE PRESTATION DÉCLARÉE, comme le salon : un restaurant à qui l'on
  // envoie sa page pour la première fois n'a jamais ouvert son espace.
  avisGoogle: [
    { qui: "Marc L.", texte: "Cuisine du marché, carte courte qui change. On sent que c’est fait le jour même.", note: 5 },
    { qui: "Élodie R.", texte: "Service rapide le midi, bon rapport qualité-prix. Un peu bruyant quand c’est plein.", note: 4 },
    { qui: "Hervé C.", texte: "Le plat du jour est toujours une bonne surprise. Pensez à réserver le soir.", note: 5 },
  ],
};

/**
 * ET LE COMPTOIR, PARCE QUE SON PARCOURS N'EST PAS CELUI DE LA TABLE.
 *
 * Trois temps au lieu de quatre écrans, et aucun des trois ne ressemble aux
 * autres — on écoute ce qui passera ce soir, on dit ce qu'on vient y chercher,
 * on parle à ceux qui y vont. C'est un texte entier que personne ne verrait
 * jamais sans cette entrée-là, puisque les deux bars de démonstration ont, eux,
 * leur soirée écrite.
 */
const FICHE_PROSPECT_COMPTOIR: FicheCommercant = {
  slug: "demo-prospect-bar",
  nom: "Un comptoir de quartier",
  metier: "Bar à vins",
  ville: "Dax",
  adresse: "Place de la Fontaine, Dax",
  horaires: "Aujourd’hui, 17 h – 1 h",
  photos: ["/direct/bar-salle.jpg", "/direct/table-salon-bougie.jpg"],
  note: "4,6",
  avis: 137,
  telephone: "+33600000000",
  mapsHref: "https://www.google.com/maps/search/Un+comptoir+de+quartier+Dax",
  avisHref: "https://search.google.com/local/reviews?placeid=demo",
  avisGoogle: [
    { qui: "Camille D.", texte: "Belle sélection au verre, le patron explique sans en faire trop.", note: 5 },
    { qui: "Yann B.", texte: "On y reste plus longtemps que prévu. Planche correcte pour accompagner.", note: 5 },
    { qui: "Sonia T.", texte: "Un peu serré le vendredi soir, mais l’ambiance vaut le coup.", note: 4 },
  ],
};

/** Toute adresse de démonstration commence par là, et rien d'autre ne le fait. */
export const PREFIXE_DEMO = "demo";

/** Vrai pour `demo`, l'index, comme pour `demo-coiffeur`. */
export function estAdresseDeDemo(slug: string): boolean {
  return slug === PREFIXE_DEMO || slug.startsWith(`${PREFIXE_DEMO}-`);
}

/** L'index : de quoi ouvrir les treize l'une après l'autre. */
export function listeDesDemos(): Array<{ slug: string; titre: string; nom: string; metier: string }> {
  const cartes = toutesLesCartes();
  return [
    // EN TÊTE, PARCE QUE C'EST CELLE QU'ON OUBLIE DE REGARDER. Les autres
    // montrent le produit ; celle-ci montre ce qu'on envoie vraiment par la
    // poste, et c'est là que les défauts se cachent.
    {
      slug: "demo-prospect",
      titre: "Un prospect, depuis sa seule fiche Google",
      nom: FICHE_PROSPECT.nom,
      metier: FICHE_PROSPECT.metier,
    },
    {
      slug: "demo-prospect-table",
      titre: "Un prospect restaurateur, même chemin",
      nom: FICHE_PROSPECT_TABLE.nom,
      metier: FICHE_PROSPECT_TABLE.metier,
    },
    {
      slug: "demo-prospect-bar",
      titre: "Un prospect au comptoir, même chemin",
      nom: FICHE_PROSPECT_COMPTOIR.nom,
      metier: FICHE_PROSPECT_COMPTOIR.metier,
    },
    ...DEMOS.flatMap((d) => {
      const c = cartes.find((x) => x.id === d.carte);
      return c ? [{ slug: d.slug, titre: d.titre, nom: c.nom, metier: c.metier }] : [];
    }),
  ];
}

/**
 * LE COMMERCE DERRIÈRE UNE ADRESSE DE DÉMONSTRATION, OU RIEN.
 *
 * Rien plutôt qu'un repli : `demo-plombier` n'existe pas, et rendre le salon
 * de coiffure à sa place ferait croire qu'on a une démonstration par métier
 * alors qu'on n'en a que treize. La page affiche alors l'index, qui dit
 * lesquelles existent.
 */
export function carteDeDemo(slug: string): CarteAutour | null {
  // LA DÉMO DU PROSPECT PASSE PAR LE PONT, pas par le paquet : voir
  // `FICHE_PROSPECT`. C'est la seule qui montre une page telle qu'un vrai
  // commerçant la reçoit.
  if (slug === "demo-prospect") return carteDepuisFiche(FICHE_PROSPECT);
  if (slug === "demo-prospect-table") return carteDepuisFiche(FICHE_PROSPECT_TABLE);
  if (slug === "demo-prospect-bar") return carteDepuisFiche(FICHE_PROSPECT_COMPTOIR);
  const d = DEMOS.find((x) => x.slug === slug);
  if (!d) return null;
  return toutesLesCartes().find((c) => c.id === d.carte) ?? null;
}
