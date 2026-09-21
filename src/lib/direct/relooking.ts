// LE RELOOKING — quatre commerces, un seul look, et une adresse pour chacun.
//
// ═══ CE QUE CE FICHIER RENVERSE ═════════════════════════════════════════════
//
// TOUT LE RESTE DE CLIKME DEMANDE « QU'EST-CE QU'IL Y A AUTOUR DE MOI ? ». Le
// paquet trie par distance, les murs sont attachés à un commerce, l'essayage
// part d'une annonce. C'est une question de commerçant, et elle a une limite :
// personne ne se réveille en voulant aller chez un lunetier.
//
// CELUI-CI DEMANDE « À QUOI JE POURRAIS RESSEMBLER ? », et les commerces
// deviennent la RÉPONSE. C'est le même catalogue, les mêmes distances, les
// mêmes numéros — lu par l'autre bout. On se réveille en voulant changer de
// tête ; le coiffeur à 220 m est ce qu'il faut pour ça.
//
// ═══ ET IL FABRIQUE UNE CHOSE QUI N'EXISTE NULLE PART ═══════════════════════
//
// UN PANIER RÉPARTI SUR QUATRE COMMERCES QUI NE SE CONNAISSENT PAS. Aucune
// place de marché ne sait faire ça, parce qu'il faudrait une logistique
// commune. Ici il n'y en a pas : on marche. Le coiffeur amène un client au
// lunetier sans le savoir, et c'est la seule chose que ce produit peut offrir
// qu'un annuaire, une plateforme de réservation ou une boutique en ligne ne
// peuvent pas.
//
// ═══ CE QU'IL NE PROMET PAS, ET C'EST ÉCRIT DANS LE TYPE ════════════════════
//
// IL NE RÉSERVE RIEN. « Organiser mon relooking » laisserait croire qu'on
// coordonne quatre agendas ; aucun de ces commerces n'a d'API, et un bouton
// qui n'aboutit à rien coûte plus cher que pas de bouton du tout — c'est le
// cœur qui s'envolait vers une poche vide, avec un montant écrit dessus.
//
// CE QU'ON FAIT À LA PLACE : UN MESSAGE PAR COMMERCE, SUR SON WHATSAPP, qu'on
// envoie l'un après l'autre. C'est la mécanique de tout le reste du produit
// (voir `prevenir.ts`), et elle marche pour la même raison : le commerçant lit
// WhatsApp dans la journée, il n'a rien à installer, ça ne coûte rien.
//
// ET LES LIGNES NE SONT PAS DE MÊME NATURE. Une coupe est un CRÉNEAU, une
// veste est un OBJET avec une taille et un stock, une monture est un essayage
// qu'aucun prix affiché ne résume — il y a l'ordonnance, les verres, la
// mutuelle. Les mettre sous un total unique avec des cases à cocher en ferait
// un panier, et un panier ça se paie. Chaque ligne porte donc son `genre`, et
// c'est lui qui écrit le bouton.

import {
  toutesLesCartes,
  type ArticleCatalogue,
  type CarteAutour,
  type CleMetier,
} from "./apercu-habitant";
import { murDeLaCarte, type Piece } from "./fantomes";
import { numeroDeFiction } from "./prevenir";

/* ════════════════════════════════════════════════════════════════════════════
   LES POSTES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * CE QUE LA LIGNE EST, ET DONC CE QUE SON BOUTON A LE DROIT DE DIRE.
 *
 * « Il faut que la ligne dise ce qu'elle est : je prends rendez-vous / je mets
 * de côté / je passe voir. »
 *
 * TROIS GESTES, TROIS ENGAGEMENTS DIFFÉRENTS. Un rendez-vous prend un créneau
 * dans la journée de quelqu'un — c'est le seul qui ENGAGE le commerçant. Un
 * article se met de côté : on demande qu'on ne le vende pas dans l'heure, et
 * c'est tout. Un essayage ne se réserve pas, il s'annonce : « je passe cette
 * semaine ». Les confondre, c'est promettre un créneau chez un lunetier qui
 * n'en donne pas et faire garder une monture qu'il faut venir essayer.
 */
export type GenreLigne = "rendez-vous" | "article" | "sur-place";

export type ClePoste = "coiffure" | "mode" | "lunettes" | "ongles";

export type Poste = {
  cle: ClePoste;
  /** Sur la tuile : « Coiffure ». */
  label: string;
  /** Où le chercher dans la ville. */
  branche: CleMetier;
  genre: GenreLigne;
  /** Le bouton de la ligne : « Je prends rendez-vous ». */
  geste: string;
  /** Sous le nom, en petit : ce que cette ligne est. */
  nature: string;
  /** Ce qui part sur le WhatsApp du commerçant, complété avec la pièce. */
  demande: (quoi: string) => string;
  /**
   * SA PLACE DANS LA JOURNÉE, ET ELLE N'EST PAS NÉGOCIABLE.
   *
   * On ne fait pas les ongles avant d'enfiler un pull, et on n'essaie pas des
   * montures avec les cheveux mouillés. L'ordre est une contrainte de métier,
   * pas une préférence d'écran : c'est exactement ce qu'une amie dirait en
   * organisant la journée, et c'est ce qui fait qu'un carnet de route vaut
   * mieux qu'une liste.
   */
  rang: number;
  /** Pourquoi il est là dans l'ordre. Écrit à l'écran, sous l'étape. */
  pourquoi: string;
};

export const POSTES: Poste[] = [
  {
    cle: "coiffure",
    label: "Coiffure",
    branche: "coiffeur",
    genre: "rendez-vous",
    geste: "Je prends rendez-vous",
    nature: "Rendez-vous",
    demande: (quoi) =>
      `auriez-vous un créneau pour « ${quoi} » cette semaine ou la suivante ?`,
    rang: 1,
    pourquoi: "En premier : tout le reste s’essaie avec la coupe qu’on aura.",
  },
  {
    cle: "mode",
    label: "Mode",
    branche: "mode",
    genre: "article",
    geste: "Je la mets de côté",
    nature: "À essayer en boutique",
    demande: (quoi) =>
      `pourriez-vous me mettre « ${quoi} » de côté ? Je passe l’essayer dans les jours qui viennent.`,
    rang: 2,
    pourquoi: "Juste après le salon : on essaie avec la nouvelle coupe.",
  },
  {
    cle: "lunettes",
    label: "Lunettes",
    branche: "lunetier",
    genre: "sur-place",
    geste: "Je passe essayer",
    nature: "Essayage sur place",
    demande: (quoi) =>
      `je voudrais essayer « ${quoi} ». Quels sont vos horaires cette semaine ?`,
    rang: 3,
    pourquoi: "Une monture s’essaie sur place — le prix dépend des verres.",
  },
  {
    cle: "ongles",
    label: "Ongles",
    branche: "ongles",
    genre: "rendez-vous",
    geste: "Je prends rendez-vous",
    nature: "Rendez-vous",
    demande: (quoi) =>
      `auriez-vous un créneau pour « ${quoi} » ? Je suis assez libre.`,
    rang: 4,
    pourquoi: "En dernier : on ne se rhabille pas avec du vernis frais.",
  },
];

export function posteDe(cle: ClePoste): Poste {
  return POSTES.find((p) => p.cle === cle) ?? POSTES[0];
}

/* ════════════════════════════════════════════════════════════════════════════
   LES STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

export type CleStyle = "naturel" | "urbain" | "audacieux" | "surprise";

/**
 * ═══ POUR QUI ON RELOOKE ════════════════════════════════════════════════════
 *
 * « On mélange femme et homme. Il faut savoir qui on relooke pour proposer des
 * vêtements, coiffures, lunettes spécifiques. »
 *
 * C'ÉTAIT LE DÉFAUT LE PLUS VISIBLE DU PARCOURS, et il rendait tout le reste
 * inutile : un look qui mêle un carré long et une veste cirée pour homme ne
 * ressemble à personne. Pire, il se voyait à l'écran — la coupe montrée était
 * portée par une femme, la veste par un homme, et l'avant-après promettait
 * donc un rendu impossible.
 *
 * LA QUESTION SE POSE AU DÉPART, EN DEUX APPUIS, et c'est le seul endroit où
 * elle ne coûte rien : avant, on n'a encore rien construit. Posée plus tard —
 * au moment du style, ou pire à la sélection — elle obligerait à refaire le
 * look entier.
 *
 * ET ELLE NE DEMANDE PAS UNE IDENTITÉ. « Pour qui ? » porte sur des RAYONS,
 * pas sur des personnes : on choisit dans quel rayon ClikMe va chercher, et
 * c'est un renseignement de boutique, pas une déclaration. Rien n'est gardé —
 * la réponse vit le temps du parcours et disparaît avec lui.
 */
export type Genre = "femme" | "homme";

/**
 * CE COMMERCE HABILLE-T-IL CE RAYON-LÀ ?
 *
 * ON LIT LE MÉTIER, ET C'EST LUI QUI LE DIT : « Prêt-à-porter homme » est un
 * rayon homme, « Friperie » est les deux — une friperie ne trie pas ses
 * portants par genre, et c'est d'ailleurs ce qu'on aime chez elle. Le reste
 * est réputé féminin tant que le commerçant ne dit pas autre chose, parce que
 * c'est ce que ses pièces montrent.
 */
export function commerceDuGenre(metier: string, genre: Genre): boolean {
  const m = metier.toLowerCase();
  if (/friperie|dépôt|depot|vintage/.test(m)) return true;
  const homme = /\bhomme|barbier|masculin/.test(m);
  return genre === "homme" ? homme : !homme;
}

/**
 * LE STYLE DÉSIGNE DE VRAIES PIÈCES, IL NE DÉCRIT PAS UNE AMBIANCE.
 *
 * ═══ POURQUOI C'EST ÉCRIT À LA MAIN, ET PAS DEVINÉ ═════════════════════════
 *
 * Il aurait été plus court de classer les pièces par mots-clés — « audacieux »
 * attrape ce qui est fuchsia, « naturel » ce qui est écru. Ça marche sur ces
 * quarante pièces-là et ça casse à la quarante-et-unième, sans prévenir, chez
 * un commerçant qui ne saura pas pourquoi sa veste n'apparaît jamais.
 *
 * SURTOUT, CE SONT DE VRAIES PIÈCES DE VRAIS COMMERÇANTS. La coupe vient de la
 * page du salon, la monture de celle du lunetier — voir `piecesDuCommerce`.
 * C'est la garantie qui tient tout le parcours : ce qu'on montre est faisable,
 * parce que c'est le commerçant qui l'a mis sur sa page. Une coupe générée
 * librement serait magnifique et refusée au comptoir, et ce refus-là ne se
 * rattrape pas.
 *
 * ═══ ON LES DÉSIGNE PAR LEUR NOM, ET PAS PAR LEUR IDENTIFIANT ══════════════
 *
 * CE FUT LA PREMIÈRE ÉCRITURE, ET ELLE NE MARCHAIT QU'À MOITIÉ. `murDeLaCarte`
 * fusionne deux sources — le catalogue du commerçant et les pièces du modèle —
 * et écarte les doublons SUR LA PHOTO OU SUR LE NOM. Chez le lunetier, dont les
 * quatre montures sont photographiées, ce sont les siennes qui gagnent : les
 * identifiants du modèle disparaissent, et un style qui les citait ne trouvait
 * plus rien. Chez le coiffeur, dont une seule prestation a une photo, c'est
 * l'inverse. Le même style se serait donc comporté différemment d'un métier à
 * l'autre, pour une raison invisible depuis ici.
 *
 * LE NOM, LUI, SURVIT À LA FUSION : c'est précisément ce sur quoi elle
 * dédoublonne. « Carrée écaille, verres dégradés » désigne la même monture des
 * deux côtés.
 *
 * CE QUI N'EST PAS LISTÉ RETOMBE SUR LES PIÈCES DU COMMERCE. Un style qui ne
 * trouve rien ne doit pas faire disparaître la ligne : il vaut mieux proposer
 * autre chose que rien.
 */
export type Style = {
  cle: CleStyle;
  /** Sur la tuile : « Naturel chic ». */
  nom: string;
  /** Le nom du look, en tête du résultat : « Moderne et élégant ». */
  titre: string;
  /** La phrase sous le titre. */
  phrase: string;
  /**
   * LES PIÈCES DE CE STYLE, PAR RAYON PUIS PAR POSTE, DÉSIGNÉES PAR LEUR NOM.
   *
   * DEUX LISTES ET PAS UNE, parce qu'un style n'est pas la même chose des deux
   * côtés : « audacieux » chez une femme, c'est une robe à pois dorés ; chez un
   * homme, un costume vert en lin. Une liste commune donnait des looks qui
   * mélangeaient les deux — le défaut exact qu'on corrige.
   */
  pieces: Record<Genre, Partial<Record<ClePoste, string[]>>>;
};

export const STYLES: Style[] = [
  {
    cle: "naturel",
    nom: "Naturel chic",
    titre: "Naturel et soigné",
    phrase: "Rien de spectaculaire, tout juste. Des pièces qui se portent tous les jours.",
    pieces: {
      femme: {
        coiffure: ["Carré long, de face", "Coupe femme", "Boucles longues, frange"],
        mode: ["Ensemble maille beige", "Pull mohair vert d’eau", "Pulls en laine"],
        lunettes: ["Carrée écaille, verres dégradés", "Épaisse dégradée caramel"],
        ongles: ["Pastel amande, motif feuille", "Manucure russe", "Pose complète gel"],
      },
      homme: {
        coiffure: ["Boucles courtes, de face", "Coupe homme"],
        mode: ["Pull col roulé écru", "Chemise en lin bleu ciel", "Polo marine et chino beige"],
        lunettes: ["Carrée écaille, verres dégradés", "Épaisse dégradée caramel"],
        ongles: ["Manucure russe"],
      },
    },
  },
  {
    cle: "urbain",
    nom: "Urbain",
    titre: "Urbain et net",
    phrase: "Des matières franches et des coupes droites. Ça tient du matin au soir.",
    pieces: {
      femme: {
        coiffure: ["Carré cuivré, dégradé", "Carré long, de face"],
        mode: ["Chemise en jean", "Jeans vintage", "Marinière rose et pantalon vichy"],
        lunettes: ["Épaisse dégradée caramel", "Œil-de-chat vert bouteille"],
        ongles: ["Semi-permanent", "Pastel amande, motif feuille"],
      },
      homme: {
        coiffure: ["Motif rasé, nuque", "Boucles courtes, de face", "Coupe homme"],
        mode: ["Veste en jean brut", "Veste cirée kaki", "Marinière et jean large"],
        lunettes: ["Épaisse dégradée caramel", "Œil-de-chat vert bouteille"],
        ongles: ["Semi-permanent"],
      },
    },
  },
  {
    cle: "audacieux",
    nom: "Audacieux",
    titre: "Audacieux et assumé",
    phrase: "Une pièce forte et tout le reste autour. On vous remarquera, c’est fait pour.",
    pieces: {
      femme: {
        coiffure: ["Carré cuivré, dégradé", "Boucles longues, frange", "Balayage"],
        mode: ["Robe à pois dorés", "Vestes des années 70", "Robe à volants corail"],
        lunettes: ["Papillon fuchsia translucide", "Œil-de-chat vert bouteille"],
        ongles: ["Dégradé pailleté", "Motif cœurs, pose amande"],
      },
      homme: {
        coiffure: ["Motif rasé, nuque", "Boucles courtes, de face"],
        mode: ["Costume vert en lin", "Blouson aviateur, col mouton", "Chemise à carreaux et chino brique"],
        lunettes: ["Œil-de-chat vert bouteille", "Épaisse dégradée caramel"],
        ongles: ["Manucure russe"],
      },
    },
  },
  {
    cle: "surprise",
    nom: "Surprends-moi",
    titre: "Moderne et élégant",
    phrase: "Un look authentique, avec des commerces sélectionnés près de chez vous.",
    /** VIDE EXPRÈS : « ClikMe choisit pour vous » pioche dans tout le paquet. */
    pieces: { femme: {}, homme: {} },
  },
];

export function styleDe(cle: CleStyle): Style {
  return STYLES.find((s) => s.cle === cle) ?? STYLES[0];
}

/* ════════════════════════════════════════════════════════════════════════════
   LE LOOK
   ═══════════════════════════════════════════════════════════════════════════ */

export type LigneLook = {
  poste: Poste;
  /** L'identifiant de la carte : c'est par là qu'on ouvre son annonce. */
  carte: string;
  lieu: string;
  metier: string;
  metres: number;
  distance: string;
  telephone: string;
  /**
   * CE NUMÉRO EST INVENTÉ — et c'est ce qui décide si WhatsApp s'ouvre.
   *
   * Les commerces de la maquette n'existent pas, donc leurs numéros non plus :
   * `numeroDeFiction` tire dans la plage que l'ARCEP réserve à la fiction, et
   * ouvrir WhatsApp dessus l'ouvrirait sur le carnet d'adresses. On montre donc
   * le message QUI PARTIRAIT. Le jour où un commerçant déclare son numéro, le
   * drapeau tombe et le chemin d'à côté s'ouvre tout seul. Même règle que
   * `telFiction` sur le mur.
   */
  telFiction: boolean;
  piece: {
    id: string;
    nom: string;
    prixTexte: string;
    photo: string;
    /** Ce que la pièce EST, en toutes lettres. Voir `decrire` dans fantomes.ts. */
    decrire?: string;
  };
  /**
   * LE PRIX EN NOMBRE, POUR POUVOIR L'ADDITIONNER — et il peut valoir zéro.
   *
   * « à partir de 89 € » n'est pas un prix, c'est un plancher. On le lit quand
   * même, parce qu'un total qui ignore les verres serait faux dans l'autre
   * sens ; mais la ligne garde son libellé exact, et l'écran dit « à partir
   * de » quand c'est le cas. Un total rond sur une monture, c'est la promesse
   * qu'on découvre fausse en caisse.
   */
  prix: number;
  /** Vrai quand le prix affiché est un plancher (« à partir de »). */
  aPartirDe: boolean;
};

export type Look = {
  style: Style;
  titre: string;
  phrase: string;
  lignes: LigneLook[];
};

/** « 129 € » → 129. « à partir de 75 € » → 75. « » → 0. */
export function prixEnEuros(t: string | undefined): number {
  if (!t) return 0;
  const m = t.replace(/ /g, " ").match(/(\d[\d\s]*)(?:[,.](\d{1,2}))?\s*€/);
  if (!m) return 0;
  const entier = Number(m[1].replace(/\s/g, ""));
  return Number.isFinite(entier) ? entier : 0;
}

function estUnPlancher(t: string | undefined): boolean {
  return !!t && /à partir/i.test(t);
}

/**
 * LES COMMERCES DE CE POSTE, DU PLUS PRÈS AU PLUS LOIN.
 *
 * LA DISTANCE DÉCIDE, ET C'EST LE SEUL TRI HONNÊTE ICI. Un relooking se fait à
 * pied dans la même demi-journée : un salon à 220 m et un autre à 500 m ne
 * sont pas interchangeables, et rien d'autre ne nous autorise à préférer l'un
 * à l'autre — on n'a ni contrat, ni commission, ni note à faire remonter.
 */
export function commercesDuPoste(cle: ClePoste, genre?: Genre): CarteAutour[] {
  const p = posteDe(cle);
  const tous = toutesLesCartes()
    .filter((c) => c.branche === p.branche)
    .sort((a, b) => a.metres - b.metres);
  /**
   * LE RAYON NE TRIE QUE LES COMMERCES QUI EN ONT UN.
   *
   * Une boutique de vêtements a un rayon ; un lunetier, une prothésiste, un
   * salon n'en ont pas — ils habillent tout le monde, et les écarter parce
   * qu'ils ne portent pas « homme » dans leur nom viderait le parcours de
   * trois postes sur quatre. On ne filtre donc que la mode.
   *
   * ET UN FILTRE QUI NE TROUVE RIEN NE VIDE PAS LE LOOK : mieux vaut proposer
   * la boutique d'à côté que de retirer la ligne.
   */
  if (!genre || p.branche !== "mode") return tous;
  const siens = tous.filter((c) => commerceDuGenre(c.metier, genre));
  return siens.length > 0 ? siens : tous;
}

/**
 * LES PIÈCES ESSAYABLES DE CE COMMERCE.
 *
 * ON PASSE PAR SON MUR, ET C'EST VOULU. `murDeLaCarte` fait déjà le travail
 * délicat : il met les pièces DU COMMERÇANT devant celles du modèle, garde
 * leurs photos, et n'emprunte jamais le PNG détouré d'une autre pièce. Refaire
 * ce tri ici donnerait une deuxième vérité sur le catalogue d'un commerce, et
 * c'est le genre de doublon qui diverge en trois semaines.
 */
export function piecesDuCommerce(c: CarteAutour): Piece[] {
  const mur = murDeLaCarte({
    id: c.id,
    nom: c.nom,
    metier: c.metier,
    branche: c.branche,
    ville: c.ville,
    distance: c.distance,
    photo: c.photo,
    telephone: c.telephone,
    catalogue: c.catalogue as ArticleCatalogue[] | undefined,
  });
  return (mur.essai?.pieces ?? []).filter((p) => !p.bientot && !!p.photo);
}

/** Un tirage stable : la même graine donne toujours le même look. */
function graine(t: string): number {
  let n = 0;
  for (const c of t) n = (n * 31 + c.charCodeAt(0)) % 100000;
  return n;
}

/** Pour comparer un nom de pièce sans buter sur une virgule ou un accent. */
function pareil(a: string): string {
  return a
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * COMPOSER LE LOOK — un commerce et une pièce par poste demandé.
 *
 * ═══ LE PREMIER LOOK PREND LE PLUS PROCHE DE CHAQUE MÉTIER ═════════════════
 *
 * SANS CLÉ, LE TIRAGE VAUT ZÉRO ET DÉSIGNE LE PREMIER DE LA LISTE — qui est
 * triée par distance. C'est la seule règle défendable pour un premier
 * affichage : on n'a ni contrat, ni commission, ni note à faire remonter, et
 * un relooking se fait à pied dans la même demi-journée.
 *
 * « VOIR UN AUTRE STYLE » FAIT TOURNER LES COMMERCES, ET C'EST VOULU. Sans
 * cette rotation, le parcours deviendrait une vitrine offerte au plus proche :
 * le salon à 220 m sortirait à chaque fois, celui à 500 m jamais — alors qu'ils
 * sont deux à vouloir des clients, et que celui qui vient d'ouvrir en a le plus
 * besoin.
 *
 * LA CLÉ EST LA GRAINE, et elle sert aussi à une chose plus bête : un tirage
 * vraiment aléatoire changerait la proposition à chaque rendu de React,
 * c'est-à-dire sous les yeux de quelqu'un qui est en train de la lire.
 *
 * ET CHAQUE POSTE A SA PROPRE GRAINE POUR LA PIÈCE. Avec une graine commune,
 * les quatre postes prenaient le même rang dans leurs listes respectives : le
 * look entier basculait d'un bloc, et deux styles voisins sortaient la même
 * monture. Le nom du poste entre donc dans le calcul.
 */
export function composerLook(opts: {
  postes: ClePoste[];
  style: CleStyle;
  /** Pour qui on cherche. Voir `Genre` : c'est un rayon, pas une identité. */
  genre: Genre;
  /** Ce qui distingue ce tirage-ci du précédent. Vide : le plus proche. */
  cle?: string;
}): Look {
  const style = styleDe(opts.style);
  const gCommerce = graine(opts.cle ?? "");

  const lignes: LigneLook[] = [];
  for (const clePoste of POSTES.map((p) => p.cle)) {
    if (!opts.postes.includes(clePoste)) continue;
    const poste = posteDe(clePoste);
    const commerces = commercesDuPoste(clePoste, opts.genre);
    if (!commerces.length) continue;

    const c = commerces[gCommerce % commerces.length];
    const pieces = piecesDuCommerce(c);
    if (!pieces.length) continue;

    const voulus = (style.pieces[opts.genre][clePoste] ?? []).map(pareil);
    const candidates = voulus.length
      ? pieces.filter((x) => voulus.includes(pareil(x.nom)))
      : pieces;
    const dans = candidates.length ? candidates : pieces;
    const gPiece = graine(`${opts.style}|${opts.genre}|${opts.cle ?? ""}|${clePoste}`);
    const piece = dans[gPiece % dans.length];
    if (!piece) continue;

    lignes.push({
      poste,
      carte: c.id,
      lieu: c.nom,
      metier: c.metier,
      metres: c.metres,
      distance: c.distance,
      telephone: c.telephone || numeroDeFiction(c.id),
      telFiction: !c.telephone,
      piece: {
        id: piece.id,
        nom: piece.nom,
        prixTexte: piece.prix,
        photo: piece.photo,
        decrire: piece.decrire,
      },
      prix: prixEnEuros(piece.prix),
      aPartirDe: estUnPlancher(piece.prix),
    });
  }

  return { style, titre: style.titre, phrase: style.phrase, lignes };
}

/**
 * LE TOTAL, ET IL NE S'ÉCRIT JAMAIS COMME UNE REMISE.
 *
 * « 134 € au lieu de 342 € » se lit comme une réduction. Ce n'en est pas une :
 * c'est simplement moins d'articles. Écrit avec un prix barré, on le découvre
 * en caisse — exactement le genre de petit mensonge qui décide si on réouvre
 * l'application. La fonction ne renvoie donc pas de « prix barré » : elle
 * renvoie COMBIEN de lignes sur combien, et c'est ce que l'écran affiche.
 */
export function totalDuLook(lignes: LigneLook[]): {
  euros: number;
  aPartirDe: boolean;
  combien: number;
} {
  return {
    euros: lignes.reduce((s, l) => s + l.prix, 0),
    aPartirDe: lignes.some((l) => l.aPartirDe),
    combien: lignes.length,
  };
}

/**
 * LE CARNET DE ROUTE — ce qui transforme une liste en demi-journée.
 *
 * ═══ POURQUOI CET ÉCRAN EXISTE ═════════════════════════════════════════════
 *
 * SANS LUI, IL MANQUAIT LE QUAND. On avait un look, quatre prix et quatre
 * adresses — c'est-à-dire un tableau d'inspiration, la chose la plus facile à
 * regarder et la plus facile à ne jamais faire. Un relooking, ce n'est pas
 * quatre achats : c'est une matinée, dans un ordre, avec 1,2 km à pied entre
 * les deux bouts.
 *
 * ET C'EST LUI QUI DONNE ENFIN UN EMPLOI AUX DISTANCES. « 350 m » sous une
 * ligne de panier ne sert à rien ; « 350 m, puis 70 m jusqu'au suivant » est
 * un trajet.
 *
 * L'ORDRE EST CELUI DU MÉTIER, pas celui de la distance : la coupe d'abord —
 * tout s'essaie avec — les ongles en dernier, parce qu'on ne se rhabille pas
 * avec du vernis frais. Voir `rang` sur chaque poste.
 */
export type EtapeCarnet = LigneLook & {
  /** Le rang dans la matinée, à partir de 1. */
  n: number;
  /** Ce qu'il reste à marcher depuis l'étape précédente. Zéro pour la première. */
  depuisPrecedent: number;
};

export function carnetDeRoute(lignes: LigneLook[]): EtapeCarnet[] {
  const ordre = [...lignes].sort(
    (a, b) => a.poste.rang - b.poste.rang || a.metres - b.metres,
  );
  return ordre.map((l, i) => ({
    ...l,
    n: i + 1,
    // LA MARCHE ENTRE DEUX COMMERCES EST UN ÉCART DE DISTANCE AU POINT DE
    // DÉPART, ET RIEN DE PLUS. On n'a pas leurs coordonnées : prétendre
    // calculer un itinéraire réel serait inventer un chemin. L'écart est une
    // MINORATION honnête — c'est au moins ça — et l'écran l'écrit comme tel.
    depuisPrecedent: i === 0 ? 0 : Math.abs(l.metres - ordre[i - 1].metres),
  }));
}

/** La distance totale, en mètres, du premier au dernier commerce. */
export function metresDuCarnet(etapes: EtapeCarnet[]): number {
  return etapes.reduce((s, e) => s + e.depuisPrecedent, 0) + (etapes[0]?.metres ?? 0);
}

/**
 * LE MESSAGE QUI PART CHEZ CE COMMERÇANT-LÀ.
 *
 * ═══ UN PAR COMMERCE, ET JAMAIS UN POUR TOUS ═══════════════════════════════
 *
 * Le coiffeur n'a pas à savoir qu'on passe ensuite chez le lunetier, et le
 * lunetier n'a pas à lire une liste de courses où il est troisième. Chacun
 * reçoit SA demande, écrite dans les mots de son métier — c'est ce qui fait
 * qu'elle se traite en dix secondes entre deux clients, et c'est la condition
 * pour que ça marche vraiment plutôt que d'en avoir l'air.
 *
 * LE MOT « RELOOKING » N'Y EST PAS. Il n'a aucun sens pour celui qui le reçoit
 * — « je prépare un relooking » se lit comme une opération commerciale — et il
 * porte un sous-entendu qu'on ne veut ni pour le client ni pour le commerce.
 *
 * CLIKME EST NOMMÉ UNE FOIS. Assez pour que le commerçant sache d'où ça vient,
 * pas assez pour que le message ressemble à de la publicité. Même règle que
 * `prevenir.ts`, et pour la même raison.
 */
export function messageDeLaLigne(l: LigneLook, prenom?: string): string {
  const signature = prenom ? `\n${prenom}` : "";
  return `Bonjour, ${l.poste.demande(l.piece.nom)} Je vous écris depuis ClikMe.${signature}`;
}

/**
 * LA CONSIGNE DU RENDU — ce que le modèle d'image a le droit de changer.
 *
 * ═══ ELLE SE CONSTRUIT À PARTIR DES POSTES CHOISIS ═════════════════════════
 *
 * C'est la différence avec un essayage ordinaire, et c'est la seule chose
 * délicate de ce parcours. Chez le coiffeur, les lunettes doivent rester ;
 * chez le lunetier, elles sont précisément ce qui change. Ici on fait les DEUX
 * en même temps — et la liste de ce qu'il faut préserver doit donc se calculer,
 * poste par poste, au lieu d'être écrite une fois pour toutes.
 *
 * CE QUI RESTE VRAI QUOI QU'ON CHOISISSE : le visage. Les traits, l'âge, la
 * carnation, l'expression. C'est le défaut le plus grave qu'un essai puisse
 * avoir — « ce n'est pas exactement ma tête, donc assez déçu » — parce qu'il
 * annule le sens de l'exercice : si ce n'est pas moi, ça ne me dit rien sur
 * moi. Un relooking qui rajeunit est un catalogue avec une photo d'inconnu.
 */
export function consigneDuLook(lignes: LigneLook[]): {
  change: string;
  garder: string[];
  decrire: string;
} {
  const a = (c: ClePoste) => lignes.some((l) => l.poste.cle === c);
  const zones: string[] = [];
  if (a("coiffure")) zones.push("les cheveux");
  if (a("mode")) zones.push("les vêtements");
  if (a("lunettes")) zones.push("les lunettes");
  if (a("ongles")) zones.push("les ongles");

  const garder = [
    "les traits du visage, l’âge et la carnation, à l’identique",
    "la pose, le cadrage et le fond",
  ];
  if (!a("coiffure")) garder.push("la coiffure et la couleur des cheveux");
  if (!a("lunettes")) garder.push("les lunettes, ou leur absence");
  if (!a("mode")) garder.push("les vêtements");

  /**
   * LA DESCRIPTION TIENT DANS TROIS CENTS CARACTÈRES, ET ON LA COUPE ICI.
   *
   * La route borne ce champ — voir `decrire` dans `api/direct/essayer` — et un
   * `slice(0, 300)` appliqué là-bas tomberait au milieu d'un mot : « une veste
   * cirée kaki, col en velours côtelé bord ». Le modèle exécuterait alors une
   * phrase tronquée sans savoir qu'elle l'est. On enlève donc des pièces
   * ENTIÈRES depuis la fin jusqu'à ce que ça rentre : mieux vaut trois
   * consignes justes qu'une quatrième à moitié dite.
   */
  const morceaux = lignes.map((l) => l.piece.decrire ?? l.piece.nom).filter(Boolean);
  while (morceaux.length > 1 && morceaux.join(" ; ").length > 300) morceaux.pop();

  return {
    change: zones.join(", ") || "la zone concernée",
    garder,
    decrire: morceaux.join(" ; ").slice(0, 300),
  };
}
