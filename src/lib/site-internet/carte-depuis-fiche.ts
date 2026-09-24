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
import { resolveMetierContent } from "@/lib/site-internet/metier-content";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

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
  /** Sa page d'avis Google, quand on connaît son `place_id`. */
  avisHref?: string;
  /** Les prestations déclarées, quand il en a déclaré. */
  services?: { nom: string; prix?: string; detail?: string }[];
  /**
   * LES AVIS GOOGLE, EN TOUTES LETTRES — et c'est la seule preuve qu'il a le
   * premier jour. Voir `avisGoogle` dans `apercu-habitant.ts` pour la raison
   * pour laquelle ils ne se mélangent pas aux avis laissés ici.
   */
  avisGoogle?: { qui: string; texte: string; note: number | null }[];
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
/**
 * ═══ UNE PHOTO GOOGLE PORTE SA TAILLE DANS SON ADRESSE ══════════════════════
 *
 * « La photo de couverture est bien en haut à gauche, en tout petit, mais elle
 * n'est pas lue apparemment. »
 *
 * CES ADRESSES SE TERMINENT PAR UN SUFFIXE DE TAILLE : `=w86-h86-k-no`,
 * `=s120`, `=w203-h152-k-no`. Ce n'est pas une décoration de l'URL, c'est une
 * COMMANDE adressée au serveur d'images : il rend exactement ce format. Le
 * champ `imageUrl` que rend le scraper est la VIGNETTE de la fiche — quatre-
 * vingt-six points de côté — et c'est elle qu'on posait en couverture sur
 * trois cent soixante-seize points de haut.
 *
 * ON DEMANDE DONC LA GRANDE. Le suffixe est réécrit en `=w1600-h1200`, ce que
 * le même serveur sait rendre sans qu'on change quoi que ce soit d'autre : ni
 * clé, ni appel supplémentaire, ni stockage. La même adresse, lue en entier.
 *
 * ET ON NE TOUCHE À RIEN D'AUTRE. Une adresse qui n'est pas celle de Google
 * ressort telle quelle : nos propres photos de démonstration sont des fichiers
 * du dépôt, et leur ajouter un suffixe donnerait une image introuvable.
 *
 * ═══ ON RÉÉCRIT LA TAILLE, PAS LE RESTE DU SUFFIXE ═════════════════════════
 *
 * « Les photos ne sont toujours pas lues. »
 *
 * LE SUFFIXE N'EST PAS QU'UNE TAILLE : `=w86-h86-k-no` porte DEUX commandes de
 * taille — `w86` et `h86` — et deux drapeaux, `k` et `no`, qui disent au
 * serveur d'images comment servir le fichier. En remplaçant le suffixe ENTIER
 * par `=w1600-h1200`, on jetait les drapeaux avec la taille. On demandait donc
 * une adresse que Google n'avait jamais émise, et sur les photos de lieux elle
 * revient en erreur — deux vignettes sur quatre manquaient dans sa bande, et
 * les deux qui restaient étaient nos propres fichiers, pas celles de Google.
 *
 * ON NE REMPLACE DONC QUE CE QU'ON VEUT CHANGER : les jetons de dimension
 * (`w…`, `h…`, `s…`, et le `c` de recadrage) sortent, tous les autres restent
 * dans leur ordre. `=w86-h86-k-no` devient `=w1600-h1200-k-no`, `=s120`
 * devient `=w1600-h1200`, et une adresse sans suffixe en reçoit un.
 *
 * ET LA PAGE NE PARIE PAS SUR CE SEUL FORMAT. Je ne peux pas joindre
 * `lh3.googleusercontent.com` depuis ici — le mandataire refuse la connexion —
 * donc je ne peux pas VÉRIFIER lequel des deux formats ce serveur accepte.
 * Écrire le plus probable et l'afficher serait remettre une hypothèse en
 * production. La vignette essaie donc `=s1600` si celle-ci échoue, et ne
 * s'efface qu'après les deux. Voir `bq-gal` dans `boutique.tsx`.
 */
export function enGrand(url: string): string {
  if (!/googleusercontent\.com|ggpht\.com/i.test(url)) return url;
  /* LE SUFFIXE EST TOUJOURS EN DERNIER, APRÈS UN « = », et il n'en existe
     qu'un : on remplace donc à partir du dernier signe égal, et on n'en ajoute
     un que s'il n'y en avait pas. */
  const i = url.lastIndexOf("=");
  const coupe = i > url.lastIndexOf("/");
  const base = coupe ? url.slice(0, i) : url;
  /* CE QUI N'EST PAS UNE DIMENSION SURVIT. Un jeton de dimension est une
     lettre de format suivie de chiffres, ou le `c` seul du recadrage. */
  const gardes = (coupe ? url.slice(i + 1) : "")
    .split("-")
    .filter((j) => j && !/^[whs]\d+$/i.test(j) && j.toLowerCase() !== "c");
  return [`${base}=w1600-h1200`, ...gardes].join("-");
}

/**
 * LE SECOND FORMAT, QUAND LE PREMIER N'EST PAS VENU.
 *
 * `=s1600` demande le plus grand côté et laisse le serveur choisir l'autre.
 * C'est la forme la plus ancienne et la plus largement acceptée ; elle sert de
 * filet, pas de premier choix, parce qu'elle ne garantit pas le rapport.
 */
export function enGrandAutrement(url: string): string {
  if (!/googleusercontent\.com|ggpht\.com/i.test(url)) return "";
  const i = url.lastIndexOf("=");
  const base = i > url.lastIndexOf("/") ? url.slice(0, i) : url;
  return `${base}=s1600`;
}

export function carteDepuisFiche(f: FicheCommercant): CarteAutour {
  /* CHAQUE PHOTO EST DEMANDÉE EN GRAND — voir `enGrand` juste au-dessus. */
  const photos = (f.photos ?? []).filter(Boolean).map(enGrand);
  const services = (f.services ?? []).filter((s) => s.nom);
  /**
   * LES PRESTATIONS DE SON MÉTIER, QUAND IL N'A ENCORE RIEN SAISI.
   *
   * ELLES N'ONT PAS DE PRIX, ET C'EST LA LIGNE À NE PAS FRANCHIR. Un coiffeur
   * fait des coupes — l'écrire n'invente rien sur lui, et sans ça le chapitre
   * qui répond à « qu'est-ce qu'on trouve chez lui ? » disparaissait purement
   * et simplement de la page de tous les prospects. Un TARIF, lui, serait une
   * promesse commerciale qu'il n'a pas faite : `demoServices` n'en porte
   * aucun, et c'est exactement pour cette raison qu'on s'en sert.
   *
   * La durée et le détail viennent du même endroit, et ne disent rien d'autre
   * que ce que fait le métier. Voir `metier-content.ts`.
   */
  const proposees = services.length
    ? []
    : (resolveMetierContent(f.metier, resolveMetier(f.metier).profil).demoServices ?? []).map((s, i) => ({
        id: `${f.slug}-p${i}`,
        rayon: "Prestations",
        nom: s.name,
        detail: [s.duration, s.desc].filter(Boolean).join(" · ") || undefined,
      }));
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
    /**
     * ═══ SES PHOTOS GOOGLE N'ARRIVAIENT NULLE PART ════════════════════════
     *
     * « Il manque toutes les photos recueillies sur la fiche Google, qui ont
     * normalement leur propre section dans les infos du commerçant. »
     *
     * DEUX CHAMPS POUR LA MÊME CHOSE, ET LA PAGE LISAIT L'AUTRE. Ce pont
     * remplissait `photo` (la couverture) et `photos` (la liste brute), et la
     * boutique affiche sa galerie depuis `sesPhotos` — un troisième champ, que
     * personne ne remplissait ici. Résultat : la section existait, la donnée
     * existait, et elles ne se rencontraient jamais. Sur la page de TOUS les
     * prospects.
     *
     * LA LÉGENDE RESTE VIDE, ET C'EST LA SEULE RÉPONSE HONNÊTE. Les photos des
     * commerces de démonstration sont légendées à la main — « la salle », « un
     * autre jour » — parce que quelqu'un a regardé chaque image. Celles-ci
     * viennent de Google : on ne sait pas ce qu'elles montrent. Écrire « Chez
     * lui » ou « Son intérieur » sous une photo qu'on n'a pas regardée, c'est
     * la même faute que le reste de ce dossier refuse — affirmer à sa place.
     * La galerie sait se passer de légende ; voir `bq-gal`.
     */
    sesPhotos: photos.map((src) => ({ src, quoi: "" })),
    telephone: f.telephone || undefined,
    site: f.site || undefined,
    // LA NOTE VIENT DE GOOGLE ET ON LE DIT AINSI : c'est la seule chose de
    // cette page qu'il n'a pas écrite et qui parle pourtant de lui.
    google: f.note ? { note: f.note, avis: f.avis ?? 0, lien: f.avisHref } : undefined,
    // LE CHAPITRE « VU CHEZ EUX » NE TENAIT QU'À SES MOMENTS, qui sont vides
    // ici : la page d'un prospect n'avait donc AUCUNE preuve sociale, et le
    // bouton « On en parle bien » défilait vers une ancre absente.
    avisGoogle: (f.avisGoogle ?? []).filter((a) => a.texte).slice(0, 4),
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
      : proposees,
    // Vrai seulement quand ce sont celles du MÉTIER et pas les siennes : c'est
    // ce drapeau qui fait écrire, sous le chapitre, qu'elles sont proposées.
    cataloguePropose: services.length === 0 && proposees.length > 0,
  };
}
