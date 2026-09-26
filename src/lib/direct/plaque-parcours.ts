/**
 * 🎞️ LA PLAQUE D'UN PARCOURS — ce que CE commerce-là a de quoi montrer.
 *
 * ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
 *
 * « Il faut que, lorsqu'on clique sur le menu du restaurant, la photo soit la
 * même que sur l'annonce, parce que présentement c'est toujours une lasagne
 * maison même quand je clique sur un magret grillé ou un poulet basquaise. »
 * Et, sur la déco : « même problème, les images du parcours ne matchent pas
 * avec l'annonce. »
 *
 * LES QUATRE PARCOURS ÉTAIENT DES DÉMONSTRATIONS D'UN SEUL COMMERCE. Chacun
 * avait son `COMMERCE_TABLE = "emporter"`, son `COMMERCE_DECO = "maison-dax"`,
 * son avant/après unique — et le bouton du paquet les ouvrait quelle que soit
 * la carte qu'on regardait. Sept restaurants, une seule lasagne.
 *
 * ON NE PEUT PAS NON PLUS PROMETTRE LES QUATRE ÉTAPES À TOUT LE MONDE. Le
 * rideau « entier → servi » demande DEUX photos du même plat ; la cuisinière
 * qui raconte demande une voix ou une vidéo. Le Bocal de Margot a les deux, la
 * boucherie aussi, le traiteur n'a ni l'un ni l'autre.
 *
 * ALORS CHAQUE ÉTAPE NE SE MONTRE QUE SI SA MATIÈRE EXISTE, et le compteur
 * « 1/4 » compte ce qui est là. Un commerce qui n'a publié qu'une photo et un
 * prix a un parcours de deux écrans, et c'est la vérité de ce qu'il a mis. La
 * règle de toute la démonstration depuis le début : on dégrade, on n'invente
 * pas. Inventer ici voudrait dire fabriquer une cuisinière au traiteur.
 */

import { toutesLesCartes, momentEnCours } from "@/lib/direct/apercu-habitant";
import type { CarteAutour, MomentJour } from "@/lib/direct/apercu-habitant";
import { CATEGORIES } from "@/lib/direct/choisir-commerce";

/** Le nom des temps possibles, dans l'ordre où ils se suivent. */
export type PasParcours = "chose" | "paire" | "voix" | "details" | "venir";

export type PlaqueParcours = {
  commerce: CarteAutour;
  /** L'offre que la carte du paquet montrait — c'est elle qu'on ouvre. */
  offre: MomentJour | null;
  /** La photo de cette offre. C'est la promesse : la même que sur l'annonce. */
  photo: string;
  /** La seconde photo, quand elle existe : le plat servi, le salon habillé. */
  photoDeux?: string;
  /** Le mot qui va sous la seconde photo. */
  motDeux?: string;
  /** Deux gros plans, quand le commerce en a. Sinon l'étape saute. */
  details: { photo: string; quoi: string }[];
  /** Les pas réellement jouables, dans l'ordre. Jamais vide : `chose` + `venir`. */
  pas: PasParcours[];
};

/**
 * L'OFFRE DU MIDI, ET NON CELLE DE L'HEURE QU'IL EST.
 *
 * L'écran de choix demande « ce midi, je mange quoi ? » : le parcours qu'il
 * ouvre doit donc parler du même repas, à onze heures du soir comme à midi.
 * Sans ça, la carte montrait un magret et le parcours ouvrait le service du
 * soir — le défaut qu'on répare, déplacé d'un écran.
 *
 * DOUZE HEURES TRENTE, parce que c'est l'heure où tout le monde sert.
 */
const MIDI = 12.5;

/**
 * LA SECONDE PHOTO SE DÉDUIT DE LA PREMIÈRE, par une convention de dépôt :
 * `plat-axoa.jpg` a pour servi `plat-axoa-servi.jpeg`. Les deux extensions
 * existent dans le dépôt, donc on essaie les deux.
 *
 * ON NE VÉRIFIE PAS LE FICHIER ICI — ce module est lu par le navigateur, qui
 * n'a pas de disque. La liste est donc écrite à la main, et c'est délibéré :
 * une paire qui manque doit se voir dans le code, pas s'inventer à l'exécution.
 */
const PAIRES: Record<string, { servi: string; mot: string }> = {
  "/direct/plat-lasagnes.jpg": { servi: "/direct/table/lasagnes-portion.jpg", mot: "La part, dans sa barquette" },
  "/direct/plat-axoa.jpg": { servi: "/direct/plat-axoa-servi.jpeg", mot: "Dans l’assiette" },
  "/direct/plat-basquaise.jpg": { servi: "/direct/plat-basquaise-servi.jpg", mot: "Dans l’assiette" },
  "/direct/plat-parmentier.jpg": { servi: "/direct/plat-parmentier-servi.jpeg", mot: "La part, à emporter" },
  "/direct/plat-garbure.jpg": { servi: "/direct/plat-garbure-servi.jpeg", mot: "Dans le bol" },
  /* LA DÉCO SE LIT DE LA MÊME FAÇON, et c'est ce qui rend ce fichier utile :
     « le fauteuil » et « le salon avec le fauteuil » sont un avant/après comme
     « le plat » et « la part ». Un seul mécanisme pour les deux paquets. */
  "/direct/deco/fauteuil-grand.jpg": { servi: "/direct/deco/salon-apres.jpg", mot: "Chez vous" },
};

/**
 * LA VOIX OU LA VIDÉO — l'étape « qui le fait » ne s'ouvre que pour eux.
 *
 * TROIS COMMERÇANTS SE SONT ENREGISTRÉS dans la démonstration : Margot, Serge
 * et Amanieu. Chez Bergine n'a pas de voix mais a une vidéo de son service, ce
 * qui répond à la même question — on voit qui cuisine. Les autres n'ont ni
 * l'une ni l'autre, et leur parcours saute cet écran.
 */
function saitRaconter(c: CarteAutour): boolean {
  /* IL FAUT QUELQUE CHOSE A DIRE, PAS SEULEMENT QUELQU'UN QUI PARLE. Cet écran
     est fait d'une PHRASE en grand et d'un bouton pour l'entendre : sans la
     phrase, il reste un titre — « Elle vous raconte son plat » — au-dessus du
     vide. C'est ce qui s'affichait chez Bergine, qui a une vidéo de service
     mais aucune signature. Une vidéo ne remplit pas un écran fait pour une
     citation ; mieux vaut une étape de moins. */
  return Boolean(c.voix?.recit || c.voix?.signature || c.voix?.extrait);
}

/**
 * LES GROS PLANS ÉCRITS À LA MAIN, quand un commerce en a de vrais.
 *
 * Maison Dax a deux photos rapprochées faites pour cet écran — le velours et
 * le coussin — et elles ne sont pas dans son catalogue au même titre que les
 * autres. Les déduire du catalogue n'en trouvait qu'une, donc l'étape sautait
 * chez le seul commerce pour qui elle avait été dessinée.
 */
const DETAILS_ECRITS: Record<string, { photo: string; quoi: string }[]> = {
  "maison-dax": [
    { photo: "/direct/deco/detail-velours.jpg", quoi: "Le velours côtelé" },
    { photo: "/direct/deco/detail-coussin.jpg", quoi: "Le coussin tissé" },
  ],
};

/**
 * LA PHOTO QUE LA CARTE DU PAQUET A DÉCLARÉE.
 *
 * C'EST ELLE, LA PROMESSE. « Il faut que la photo soit la même que sur
 * l'annonce » : la seule façon de la tenir à coup sûr est de lire la MÊME
 * source que l'écran de choix, et non de redeviner l'offre de son côté. La
 * cirière l'a montré — le paquet déclarait sa bougie posée sur une table, le
 * parcours retrouvait son atelier, et les deux étaient « la bonne photo » selon
 * qui la cherchait.
 */
export function photoDeLaCarte(id: string): string | undefined {
  let declaree: string | undefined;
  for (const cat of CATEGORIES) {
    const c = cat.cartes.find((x) => x.id === id);
    if (c) { declaree = c.photo; break; }
  }
  if (!declaree) return undefined;
  const commerce = toutesLesCartes().find((c) => c.id === id);
  if (!commerce) return declaree;
  /* ═══ LA MEME REGLE QUE L'ECRAN DE CHOIX, ET C'EST LE POINT ═══════════
     Le paquet n'affiche la photo declaree que si elle est celle d'un MOMENT
     de la journee : sinon il prend celle du commerce, pour ne pas montrer un
     plat en ecrivant le prix d'un autre. Si le parcours appliquait une regle
     differente, les deux ecrans pourraient montrer deux images et chacun aurait
     raison — c'est exactement ce qui arrivait a la ciriere. Une seule fonction,
     lue des deux cotes. */
  const surMesure = (commerce.moments ?? []).some((m) => m.photo === declaree);
  return surMesure ? declaree : commerce.photo || declaree;
}

/**
 * CE QUE CE COMMERCE PEUT MONTRER, et rien de plus.
 *
 * Renvoie `null` quand le commerce n'existe pas ou n'a publié aucune offre :
 * un parcours sans rien à ouvrir ne doit pas s'ouvrir du tout, plutôt que de
 * s'afficher vide. Même règle que les cartes du paquet.
 */
export function plaqueDuParcours(
  id: string,
  /* ═══ LE PARCOURS NE PROPOSE QUE CE QUE L'ÉCRAN SAIT DESSINER ═════════
     Un pas renvoyé ici mais absent du JSX donnerait un écran blanc au milieu
     du parcours — un défaut pire que l'étape manquante, parce qu'il compte
     dans « 2/4 ». L'écran dit donc ce qu'il sait faire, et on n'annonce rien
     d'autre. Le parcours restaurant ne dessine pas de gros plans ; celui de la
     déco ne dessine pas de cuisinière. */
  sait: PasParcours[] = ["chose", "paire", "voix", "details", "venir"],
): PlaqueParcours | null {
  const commerce = toutesLesCartes().find((c) => c.id === id);
  if (!commerce) return null;

  /* L'OFFRE QU'ON OUVRE EST CELLE QUI PORTE UNE PHOTO, en priorité celle du
     midi. Une offre sans image ne peut pas ouvrir un parcours qui commence par
     une image plein écran — on retombe alors sur la photo du commerce. */
  const declaree = photoDeLaCarte(id);
  const surMesure = declaree
    ? (commerce.moments ?? []).find((m) => m.photo === declaree)
    : undefined;
  const midi = (commerce.moments ?? []).filter((m) => m.photo && m.de < 14 && m.a > 11);
  const offre =
    surMesure ?? midi[0] ?? momentEnCours(commerce, MIDI) ?? (commerce.moments ?? [])[0] ?? null;
  const photo = declaree || offre?.photo || commerce.photo || "";
  if (!photo) return null;

  const paire = PAIRES[photo];

  /* ═══ LES GROS PLANS VIENNENT DE SA CARTE ═════════════════════════════
     L'étape « regardez les détails » montre deux photos rapprochées. Maison
     Dax en a deux faites pour ça ; les autres commerces ont les photos de leur
     catalogue, qui sont des gros plans de leurs pièces et font le même office.
     On écarte celle qui est déjà l'affiche : montrer deux fois la même image
     n'est pas un détail de plus, c'est un écran vide déguisé. */
  const details = DETAILS_ECRITS[id] ?? (commerce.catalogue ?? [])
    .filter((a) => a.photo && a.photo !== photo)
    .map((a) => ({ photo: a.photo as string, quoi: a.nom }))
    .filter((d, i, t) => t.findIndex((x) => x.photo === d.photo) === i)
    .slice(0, 2);

  const pas: PasParcours[] = ["chose"];
  if (paire && sait.includes("paire")) pas.push("paire");
  if (saitRaconter(commerce) && sait.includes("voix")) pas.push("voix");
  if (details.length >= 2 && sait.includes("details")) pas.push("details");
  pas.push("venir");

  return {
    commerce,
    offre,
    photo,
    photoDeux: paire?.servi,
    motDeux: paire?.mot,
    details,
    pas,
  };
}

/**
 * ═══ L'ESSAYAGE : UNE TÊTE PAR ANNONCE ═════════════════════════════════════
 *
 * « Pour chaque coupe, on va quand même mettre la bonne tête. »
 *
 * IL AVAIT RAISON, ET C'ÉTAIT LE MÊME DÉFAUT QUE LES LASAGNES. Le parcours
 * coiffure montrait un seul avant/après quel que soit le salon ouvert : on
 * choisissait un dégradé chez le barbier et on voyait un carré sur une femme.
 *
 * L'AVANT SE PARTAGE QUAND C'EST LA MÊME PERSONNE, et c'est lui qui l'a dit
 * carte par carte : « annonce 1 : photo 1, c'est l'après, le avant tu l'as
 * déjà » ; « annonce 3 : photo 9, tu l'as déjà, c'est la dame de la photo 5 ».
 * Un essayage compare une personne à elle-même — plusieurs après, un seul
 * avant, sauf quand la coupe est celle d'un homme et que la personne change.
 */
export type PaireEssai = { avant: string; apres: string };

const AVANT_ELLE_COIFFURE = "/direct/accueil/moi-coiffure-avant.jpg";
const AVANT_ELLE_MODE = "/direct/accueil/moi-mode-sans.jpg";

export const ESSAIS: Record<string, PaireEssai> = {
  // ── BEAUTÉ ───────────────────────────────────────────────────────────────
  "coif-nouveau": { avant: AVANT_ELLE_COIFFURE, apres: "/direct/essai/coif-nouveau-apres.jpg" },
  // LE BARBIER COUPE DES CHEVEUX D'HOMME : sa paire est à lui, les deux photos.
  "coif-barbier": { avant: "/direct/essai/coif-barbier-avant.jpg", apres: "/direct/essai/coif-barbier-apres.jpg" },
  "coif-halle": { avant: AVANT_ELLE_COIFFURE, apres: "/direct/essai/coif-halle-apres.jpg" },
  "coif-centre": { avant: AVANT_ELLE_COIFFURE, apres: "/direct/accueil/moi-coiffure-apres.jpg" },

  // ── MODE ─────────────────────────────────────────────────────────────────
  "mode-friperie": { avant: AVANT_ELLE_MODE, apres: "/direct/essai/mode-friperie-apres.jpg" },
  // MÊME CHOSE AU PRÊT-À-PORTER HOMME : on n'essaie pas une veste d'homme sur
  // elle, donc la paire entière change.
  "mode-homme": { avant: "/direct/essai/mode-homme-avant.jpg", apres: "/direct/essai/mode-homme-apres.jpg" },
  "mode-depot": { avant: AVANT_ELLE_MODE, apres: "/direct/essai/mode-depot-apres.jpg" },
  "mode-centre": { avant: AVANT_ELLE_MODE, apres: "/direct/accueil/moi-mode-avec.jpg" },
};

/** La paire de CE commerce, ou celle du parcours par défaut s'il n'en a pas. */
export function essaiDuCommerce(id: string, secours: PaireEssai): PaireEssai {
  return ESSAIS[id] ?? secours;
}

/**
 * ═══ CEUX QUI L'ONT DÉJÀ ESSAYÉE ═══════════════════════════════════════════
 *
 * « Il manque une étape : les avis et les fantômes de 3 personnes qui ont
 * essayé la tenue. Donc je t'ai mis 3 personnes en attaché par type de tenue. »
 *
 * TROIS PERSONNES PAR COUPE ET PAR TENUE, ET C'EST LE NOMBRE QUI COMPTE. Une
 * seule se lit comme une mise en scène ; trois corps, trois âges, trois rues,
 * ça se lit comme un fait. C'est le même écran que le mur de l'application,
 * ramené au démarrage — voir `mur-contenu.tsx`.
 *
 * ELLES REMPLACENT LES TROIS PORTRAITS MUETS. La version précédente montrait
 * bien trois photos, mais celles d'une seule pièce — le blazer rose — et sans
 * un mot. Sous la veste cirée du prêt-à-porter homme, l'écran annonçait « la
 * même veste » en affichant trois femmes en rose ; j'avais donc retiré l'étape
 * là où elle mentait. Avec une série par commerce, elle revient partout, et
 * elle dit vrai partout.
 *
 * CHAQUE MOT LÈVE UN DOUTE DIFFÉRENT, et c'est la règle qu'on s'est donnée sur
 * les trois premiers : la tenue du bureau, la couleur au soleil, la peur de la
 * couleur. Trois fois « superbe » n'apprend rien, et on ne lit que le premier.
 */
export type Essayeur = {
  photo: string;
  /** Un prénom, comme partout ailleurs dans le produit. */
  qui: string;
  /** Ce qu'elle ou il en dit — un doute levé, pas un compliment. */
  mot: string;
  /** Un à cinq fantômes. Le cinquième a des yeux en cœur. */
  note: number;
  /** Où, et avec quoi. Ce qui se vérifie sur l'image même. */
  ou: string;
  /**
   * ═══ DEUX PREUVES, ET IL NE FAUT PAS LES CONFONDRE ════════════════════
   *
   * « Je distinguerais clairement les simulations d'essayage des résultats
   * réellement réalisés au salon : ce sont deux preuves différentes. »
   *
   * IL A RAISON, ET C'EST LA DISTINCTION LA PLUS IMPORTANTE DE L'ÉCRAN.
   * « salon » dit : cette personne est allée chez lui, il a fait la coupe, la
   * photo est de sa tête. C'est la preuve qu'il SAIT FAIRE.
   * « essai » dit : cette personne a mis sa photo dans l'application, et voilà
   * ce que ça donnerait. C'est la preuve que ça LUI IRAIT.
   *
   * LES DEUX ONT LEUR VALEUR, ET AUCUNE NE REMPLACE L'AUTRE. Trois essais et
   * zéro réalisation, c'est un catalogue de rendus ; trois réalisations et
   * zéro essai, c'est le book d'un coiffeur. Ensemble, ça dit « ça se fait
   * ici, et ça vous irait ».
   *
   * LES MÉLANGER SANS LE DIRE SERAIT FAIRE PASSER UN RENDU POUR UNE TÊTE, ce
   * que ce produit refuse partout ailleurs. La répartition ci-dessous est
   * celle de la démonstration, et elle est illustrative comme le reste : deux
   * réalisations et un essai par série, pour que les deux preuves se voient
   * sur le même écran.
   */
  preuve: "salon" | "essai";
};

const D = "/direct/essayeurs/";

export const ESSAYEURS: Record<string, Essayeur[]> = {
  // ── BEAUTÉ ───────────────────────────────────────────────────────────────
  "coif-nouveau": [
    { photo: `${D}coif-nouveau-1.jpg`, preuve: "salon", qui: "Hélène", note: 5, ou: "Devant chez elle",
      mot: "Mes boucles, je les subissais. Là je les porte." },
    { photo: `${D}coif-nouveau-2.jpg`, preuve: "salon", qui: "Sofia", note: 4, ou: "Au marché aux fleurs",
      mot: "Il faut du produit les jours humides, sinon ça gonfle." },
    { photo: `${D}coif-nouveau-3.jpg`, preuve: "essai", qui: "Awa", note: 5, ou: "En terrasse",
      mot: "Je sors du lit, je secoue, c'est fait." },
  ],
  "coif-barbier": [
    { photo: `${D}coif-barbier-1.jpg`, preuve: "salon", qui: "Serge", note: 5, ou: "Devant l'épicerie",
      mot: "Il rattrape les épis au lieu de lutter contre." },
    { photo: `${D}coif-barbier-2.jpg`, preuve: "salon", qui: "Marc", note: 4, ou: "Rue du marché",
      mot: "Au bout de six semaines elle bouge, mais elle reste nette." },
    { photo: `${D}coif-barbier-3.jpg`, preuve: "essai", qui: "Hugo", note: 5, ou: "Devant le café",
      mot: "Première fois qu'on me demande ce que je fais le matin." },
  ],
  "coif-halle": [
    { photo: `${D}coif-halle-1.jpg`, preuve: "salon", qui: "Martine", note: 5, ou: "Sous les arcades",
      mot: "Le cuivré tient trois mois sans virer orange." },
    { photo: `${D}coif-halle-2.jpg`, preuve: "salon", qui: "Nadia", note: 4, ou: "Devant la librairie",
      mot: "Les pointes demandent un passage tous les deux mois." },
    { photo: `${D}coif-halle-3.jpg`, preuve: "essai", qui: "Camille", note: 5, ou: "Devant le bistrot",
      mot: "J'avais peur du roux sur ma peau. C'est ce qui l'éclaire." },
  ],

  // ── MODE ─────────────────────────────────────────────────────────────────
  "mode-friperie": [
    { photo: `${D}mode-friperie-1.jpg`, preuve: "salon", qui: "Lucie", note: 5, ou: "En terrasse",
      mot: "Le noir dessous calme les fleurs. Ça passe au bureau." },
    { photo: `${D}mode-friperie-2.jpg`, preuve: "salon", qui: "Awa", note: 5, ou: "Devant la librairie",
      mot: "Trouvé en friperie, donc personne d'autre ne l'a." },
    { photo: `${D}mode-friperie-3.jpg`, preuve: "essai", qui: "Martine", note: 4, ou: "Place de la fontaine",
      mot: "La coupe longue allonge, même quand on est petite." },
  ],
  "mode-homme": [
    { photo: `${D}mode-homme-1.jpg`, preuve: "salon", qui: "Rémi", note: 5, ou: "Devant le café",
      mot: "Elle prend la pluie de Dax sans faire imperméable." },
    { photo: `${D}mode-homme-2.jpg`, preuve: "salon", qui: "Bruno", note: 5, ou: "Sur les allées",
      mot: "Je la mets à vélo tous les matins depuis l'automne." },
    { photo: `${D}mode-homme-3.jpg`, preuve: "essai", qui: "Paul", note: 4, ou: "Au marché",
      mot: "Prenez une taille au-dessus si vous mettez un pull." },
  ],
  "mode-depot": [
    { photo: `${D}mode-depot-1.jpg`, preuve: "salon", qui: "Inès", note: 5, ou: "Devant la librairie",
      mot: "Le léopard sur du prune, ça ne crie pas. J'ai essayé pour voir." },
    { photo: `${D}mode-depot-2.jpg`, preuve: "salon", qui: "Chloé", note: 4, ou: "Sur les allées",
      mot: "Chaud sans être lourd. Je l'ai mis tout l'hiver." },
    { photo: `${D}mode-depot-3.jpg`, preuve: "essai", qui: "Léa", note: 5, ou: "Devant l'épicerie",
      mot: "Déposé par quelqu'un d'ici. Ça compte, pour moi." },
  ],
};

/** Ceux qui ont essayé chez CE commerce, ou rien — et l'étape saute. */
export function essayeursDu(id: string): Essayeur[] {
  return ESSAYEURS[id] ?? [];
}
