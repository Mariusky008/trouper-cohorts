// 🌉 LE PONT — la fiche Google d'un commerçant devient une carte du Direct.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Il va falloir changer pour que les pages d'accueil des commerçants
// deviennent le style exact de /autour-de-moi/boutique. »
//
// L'EN-TÊTE DE LA MAQUETTE L'ANNONÇAIT DEPUIS LE PREMIER JOUR : « cette page
// lit CARTES et pas Supabase. Le pont entre les deux est le vrai chantier, il
// est commun aux trois maquettes, et il n'est pas ici. » Le voici.
//
// ET IL EST PLUS PETIT QU'ON NE CROIT, parce que les trois mille lignes de la
// boutique pendent toutes à UN SEUL objet — un `CarteAutour`. Il n'y a donc pas
// un dessin à recopier : il y a un objet à fabriquer.
//
// ═══ LA DIFFICULTÉ N'EST PAS TECHNIQUE, ELLE EST DE VÉRITÉ ════════════════
//
// UNE FICHE GOOGLE NE CONTIENT PAS CE QUI FAIT CETTE PAGE. Elle a le nom,
// l'adresse, les horaires, la note, les photos. Elle n'a NI les moments du
// jour, NI le catalogue, NI la voix du commerçant, NI ce qui revient chez lui —
// c'est-à-dire précisément ce que ClikMe ajoute au monde, et ce qu'aucun
// annuaire ne sait.
//
// ON NE LES INVENTE DONC PAS. La tentation était forte : fabriquer trois
// moments plausibles à partir des horaires, écrire un faux mot du patron,
// improviser un catalogue depuis les services Google. Ce serait la même faute
// que la remise de « −40 % » posée un jour sur un vrai commerce de Dax : une
// promesse attribuée à quelqu'un qui ne l'a pas faite, sur une page qui porte
// son nom.
//
// CE QUI EST VIDE RESTE VIDE, ET LA BOUTIQUE SAIT FAIRE. C'est même une de ses
// règles fondatrices : « un commerce sans voix, sans passé, sans catalogue rend
// une page plus courte, jamais une page abîmée ». Un prospect voit donc sa
// vraie page — la sienne, avec ses vraies informations — et les blocs que seul
// ClikMe peut remplir apparaissent le jour où il les remplit. C'est aussi le
// meilleur argument de vente qu'on puisse lui faire : il voit exactement ce
// qu'il gagne en s'y mettant.
import type { CarteAutour, CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";

/** Ce que la page sait déjà de lui, et rien de plus. */
export type FicheCommercant = {
  slug: string;
  nom: string;
  metier: string;
  ville: string;
  adresse?: string;
  /** « Aujourd'hui, 9 h – 19 h », déjà mis en forme par la page. */
  horaires?: string;
  photos?: string[];
  note?: string;
  avis?: number;
  telephone?: string;
  site?: string;
  /** L'itinéraire, déjà construit par la page (Google Maps). */
  mapsHref?: string;
  /** Les prestations déclarées, quand il en a déclaré. */
  services?: { nom: string; prix?: string; detail?: string }[];
};

/**
 * ═══ LA BRANCHE, ET ELLE DÉCIDE DE TOUT L'ESSAI ═══════════════════════════
 *
 * C'est elle qui choisit le Fantôme, les mots du métier, et surtout CE QU'ON
 * ESSAIE — une coupe, une pose d'ongles, un vêtement, un bouquet. Se tromper
 * ici ne donne pas une page un peu fausse : ça donne un salon de coiffure qui
 * propose d'essayer un bouquet.
 *
 * ELLE NE PASSE PAS PAR `brancheDeLaDemande`. Celle-là lit la phrase d'un
 * habitant qui cherche quelque chose — « je voudrais une coupe » — et son repli
 * est « restaurant », ce qui est juste pour une recherche et faux pour une
 * fiche : un métier inconnu n'est pas un restaurant, c'est un métier inconnu.
 * D'où une table à nous, et un repli sur le commerce générique.
 */
export function brancheDuMetier(metier: string): CleMetier {
  const t = (metier || "").toLowerCase();
  if (/coiff|barbier|cheveu/.test(t)) return "coiffeur";
  if (/ongle|onglerie|manucure|nail/.test(t)) return "ongles";
  if (/fleur|fleurist/.test(t)) return "fleuriste";
  if (/bar\b|brasserie|caviste|vin|bière|biere|pub/.test(t)) return "bar";
  if (/restaur|pizz|burger|crêper|creper|traiteur|table/.test(t)) return "restaurant";
  if (/vêtement|vetement|prêt-à-porter|pret-a-porter|friperie|boutique|mode|chaussur/.test(t))
    return "mode";
  /**
   * ET LES MÉTIERS QUI N'ONT PAS DE BRANCHE À EUX TOMBENT DANS « ARTISAN ».
   *
   * IL N'Y A QUE HUIT BRANCHES, et ce n'est pas un oubli : une branche porte
   * une MÉCANIQUE D'ESSAI, pas un code NAF. Un boulanger, un boucher, un
   * cirier, un bijoutier partagent la même — on regarde un objet fabriqué, on
   * le met de côté — et lui donner huit branches identiques n'ajouterait que
   * huit endroits où diverger.
   *
   * CE N'EST DONC PAS UN REPLI PAR DÉFAUT, C'EST LA BONNE RÉPONSE. Le repli
   * par défaut, lui, est le même : un métier qu'on ne reconnaît pas est un
   * artisan jusqu'à preuve du contraire, ce qui rend une page honnête plutôt
   * qu'une page qui propose d'essayer une coupe chez un plombier.
   */
  if (/tatou/.test(t)) return "artisan";
  if (/lunet|optic/.test(t)) return "lunetier";
  return "artisan";
}

/**
 * LES MOMENTS DU JOUR, ET IL N'Y EN A AUCUN.
 *
 * C'EST LA DÉCISION LA PLUS IMPORTANTE DE CE FICHIER, et elle mérite d'être
 * écrite plutôt que subie. `moments` est obligatoire dans le type parce que
 * dans le Direct, une carte SANS moment n'a rien à dire — elle ne devrait pas
 * être dans le paquet. Mais une PAGE de commerce n'est pas une carte du paquet :
 * elle existe même quand il ne se passe rien aujourd'hui, exactement comme la
 * vitrine d'une boutique reste une vitrine le dimanche.
 *
 * ON REND DONC UN TABLEAU VIDE, ET LA BOUTIQUE LE SUPPORTE : son premier
 * chapitre s'efface, et la page commence au suivant. Le jour où il publie son
 * premier moment, le chapitre apparaît tout seul.
 *
 * FABRIQUER DES MOMENTS À PARTIR DES HORAIRES AURAIT ÉTÉ PIRE QUE LE VIDE.
 * « Ouvert de 9 h à 19 h » n'est pas un moment : un moment, c'est « il reste
 * quatre parts », « la fournée de 16 h sort », « une place à 15 h 30 ». Les
 * inventer remplirait l'écran de phrases que le commerçant n'a jamais dites, et
 * qu'un client pourrait venir lui réclamer.
 */
function sansMoments(): MomentJour[] {
  return [];
}

/**
 * LA DISTANCE, QUAND ON NE SAIT PAS OÙ EST LE LECTEUR.
 *
 * Dans le Direct, elle est calculée depuis la position de l'habitant. Sur la
 * page d'un commerçant, il n'y a pas d'habitant : il y a lui, qui regarde sa
 * propre page, ou un client venu par un lien. On rend donc ce qu'on sait — la
 * ville — et zéro mètre, ce qui fait disparaître la mention plutôt que
 * d'afficher « à 0 m », qui serait faux et visible.
 */
export function carteDepuisFiche(f: FicheCommercant): CarteAutour {
  const photos = (f.photos ?? []).filter(Boolean);
  const services = (f.services ?? []).filter((s) => s.nom);
  return {
    id: f.slug,
    branche: brancheDuMetier(f.metier),
    nom: f.nom,
    metier: f.metier,
    ville: f.ville,
    itineraire: f.mapsHref ?? "",
    metres: 0,
    distance: "",
    moments: sansMoments(),
    fiche: {
      ou: f.adresse ?? "",
      horaires: f.horaires ?? "",
      /**
       * LE MOT DU COMMERÇANT RESTE VIDE, ET C'EST VOULU.
       *
       * C'est la ligne manuscrite sous son nom — « Je fais mes pâtes le matin
       * même » — et c'est peut-être la plus personnelle de toute la page. Une
       * phrase générée serait une phrase qu'il n'a pas dite, signée de sa main,
       * sur la page qui porte son nom. La boutique n'affiche rien quand elle
       * est vide, et c'est exactement ce qu'il faut.
       */
      mot: "",
    },
    photo: photos[0],
    photos: photos.length > 1 ? photos : undefined,
    telephone: f.telephone || undefined,
    site: f.site || undefined,
    // LA NOTE VIENT DE GOOGLE ET ON LE DIT AINSI : c'est la seule chose de
    // cette page qu'il n'a pas écrite et qui parle pourtant de lui.
    google: f.note ? { note: f.note, avis: f.avis ?? 0 } : undefined,
    /**
     * SES PRESTATIONS DEVIENNENT SON CATALOGUE, QUAND IL EN A DÉCLARÉ.
     *
     * C'est la seule donnée de la fiche qui se traduit sans rien inventer : une
     * prestation a un nom et parfois un prix, un article de catalogue aussi. Le
     * rayon est celui du métier, faute de mieux — Google ne range pas les
     * prestations, et deviner des rayons produirait des intitulés qu'il n'a pas
     * choisis.
     */
    catalogue: services.length
      ? services.map((s, i) => ({
          id: `${f.slug}-s${i}`,
          rayon: "Prestations",
          nom: s.nom,
          detail: s.detail,
          prix: s.prix,
        }))
      : undefined,
  };
}
