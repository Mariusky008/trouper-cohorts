"use client";

// ⛩️ LA PAGE D'UN COMMERCE — la boutique, au sens d'Etsy.
//
// Le pourquoi de cette page est en tête de `page.tsx`. Ici, les décisions de
// construction — et il n'y en a que cinq qui comptent.
//
// ═══ 1. L'ORDRE DES BLOCS EST LA MOITIÉ DU PRODUIT ═════════════════════════
//
// Elle OUVRE SUR AUJOURD'HUI. C'est contre-intuitif pour une page permanente,
// et c'est justement ce qui la distingue d'un site vitrine : la première chose
// qu'on lit chez un commerce, c'est ce qu'il a MAINTENANT. Le reste — sa carte,
// son histoire, ses horaires — ne bouge pas et peut attendre trois centimètres
// de défilement.
//
// Et ça protège la doctrine. `ArticleCatalogue` porte cet avertissement, qui
// est le plus important du dépôt : « le jour où l'écran principal montre tout
// ce que propose ce commerce, ClikMe n'a plus de raison d'exister ». Ici le
// catalogue a enfin le droit d'exister en section — c'est une page de
// boutique, on vient pour ça — mais JAMAIS EN PREMIER. Le présent garde le
// haut de page, partout, y compris là où il n'est pas le sujet.
//
// ═══ 2. ELLE NE DEMANDE RIEN AU COMMERÇANT ════════════════════════════════
//
// Chaque bloc se déduit de ce qu'il a déjà : ses moments du jour, ses annonces
// passées, son catalogue, sa fiche Google, ses photos. Il n'y a pas un seul
// champ à remplir de plus pour que cette page existe, et c'est délibéré — une
// page qui exige dix minutes de saisie n'existe pour personne.
//
// COROLLAIRE : TOUT EST FACULTATIF ET RIEN NE LAISSE DE TROU. Un commerce sans
// voix, sans passé, sans catalogue rend une page plus courte, jamais une page
// abîmée. Le sélecteur en haut sert exactement à vérifier ça sur les quatorze.
//
// ═══ 3. CE QUI REVIENT EST LE BLOC QUE LE DECK NE PEUT PAS AVOIR ══════════
//
// `historique.ts` interdit d'afficher les annonces passées telles quelles :
// « une liste d'annonces périmées est un cimetière, et un cimetière fait
// paraître mort un produit dont toute la promesse est d'être vivant ». La règle
// vaut pour le fil, et elle vaut ici aussi — donc on n'affiche pas l'archive,
// on affiche ce que `ceQuiRevient` en DÉDUIT : « la garbure, plutôt le jeudi ».
//
// C'est la seule information de tout le produit qu'aucune fiche Google, aucun
// site et aucun horaire ne saura jamais donner, et elle n'a de place nulle part
// ailleurs : dans le fil elle serait du passé, sur la page elle est la réponse
// exacte à « et sinon, il fait quoi ? ».
//
// ═══ 4. LA CONTINUITÉ SE JOUE SUR UN SEUL OBJET ═══════════════════════════
//
// On ne rapproche pas deux écrans en repeignant l'un aux couleurs de l'autre —
// on pose LE MÊME OBJET sur les deux. Ici c'est l'anneau du métier, importé
// tel quel de la carte (`components/direct/picto-metier`). Le reste de la page
// a le droit de ne rien avoir en commun avec le fil : c'est l'anneau, le nom et
// la photo qui disent « c'est le même commerce », comme le bandeau d'une
// boutique Etsy le dit sur chacune de ses fiches produit.
//
// ═══ 5. ELLE SORT DU CADRE FIXE DU DECK ═══════════════════════════════════
//
// `/autour-de-moi` verrouille le document et vit dans une hauteur mesurée : un
// paquet qu'on balaie ne défile pas. Une PAGE défile — c'est même sa nature, et
// c'est la seule chose ici qui ne doit surtout pas imiter le fil.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  HEURE_MAX,
  HEURE_MIN,
  moyenneAvis,
  motCatalogue,
  motDuMetier,
  seJoueMaintenant,
  toutesLesCartes,
  type ArticleCatalogue,
  type AvisPlat,
  type CarteAutour,
  type MomentJour,
} from "@/lib/direct/apercu-habitant";
import { ceQuiRevient, phraseHabitude } from "@/lib/direct/historique";
import { momentEnCours } from "@/lib/direct/apercu-habitant";
import { murDeLaCarte } from "@/lib/direct/fantomes";
import { MurContenu } from "@/components/direct/mur-contenu";
import { BlocFantome } from "@/components/direct/bloc-fantome";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import { personnaliteDe } from "@/lib/direct/personnalites";
import {
  ecrireDansSalon,
  heureCourte,
  monPrenom,
  ouvrirSalon,
} from "@/lib/direct/salons";
import {
  abonnerPiecesGardees,
  basculerPieceGardee,
  chargerPiecesGardees,
  piecesGardeesVides,
} from "@/lib/direct/pieces-gardees";
import { AnneauMetier, PictoMetier } from "@/components/direct/picto-metier";

/** Une seule décimale, virgule française : « 4,7 ». */
function note1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="bq-et" aria-label={`${note1(note)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= pleines ? "on" : ""} aria-hidden="true">
          ★
        </i>
      ))}
    </span>
  );
}

/**
 * L'ÉTAT D'UN MOMENT, à l'heure qu'il est.
 *
 * TROIS ÉTATS ET PAS DEUX. « Passé » et « à venir » suffiraient à un planning ;
 * il en manque un troisième qui est le seul qui compte — CE QUI SE JOUE
 * MAINTENANT. C'est la raison d'être du produit, et sur une page permanente
 * c'est ce qui la distingue d'un horaire d'ouverture.
 */
function etatDuMoment(m: MomentJour, heure: number): "en-cours" | "passe" | "a-venir" {
  if (seJoueMaintenant(m, heure)) return "en-cours";
  return heure >= m.a ? "passe" : "a-venir";
}

/** Les avis semés sur les moments, remontés au niveau du commerce. */
function avisDuCommerce(c: CarteAutour): AvisPlat[] {
  const tous: AvisPlat[] = [];
  for (const m of c.moments) for (const a of m.avis ?? []) tous.push(a);
  return tous;
}

/**
 * CE QUI VEUT DIRE « AUJOURD'HUI », DANS UNE DATE ÉCRITE À LA MAIN.
 *
 * La date d'un avis est du texte libre — « ce midi », « samedi dernier », « en
 * mars ». On ne calcule donc pas, on reconnaît les quelques tournures qui
 * disent aujourd'hui, et tout le reste est traité comme ancien : c'est le bon
 * sens du doute. Un titre « Vu chez eux aujourd'hui » posé au-dessus d'une
 * photo légendée « mardi dernier » se contredit à trois centimètres d'écart, et
 * c'est le genre de détail qui décide si l'on croit le reste de l'écran.
 */
function duJour(quand: string): boolean {
  return /^(à l'instant|aujourd'hui|ce (midi|matin|soir)|il y a \d+ (min|h)|maintenant)/i.test(
    quand.trim(),
  );
}

/**
 * LE MUR DES CLIENTS — toutes les photos de tous ses moments, mises en commun.
 *
 * IL A QUITTÉ LE PLI POUR VENIR ICI, et il y est mieux : une photo prise par un
 * client est une preuve PERMANENTE, pas une information du jour. Elle répond à
 * « c'est comment chez lui ? », pas à « j'y vais ? » — donc à la question de
 * cette page et pas à celle du paquet.
 *
 * C'EST CE QUE GOOGLE NE SAIT PAS FAIRE : ses photos sont collées à
 * l'établissement et datent de trois ans. Ici chacune reste attachée au moment
 * qu'elle montre, et revient avec lui quand le plat revient à la carte.
 */
function murDuCommerce(c: CarteAutour): Array<{ src: string; qui: string; quand: string }> {
  return avisDuCommerce(c)
    .filter((a) => a.photo)
    .map((a) => ({ src: a.photo as string, qui: a.qui, quand: a.quand }))
    // Celles du jour en premier. Tri stable : l'ordre des moments est conservé
    // entre photos de meme fraicheur.
    .sort((a, b) => Number(duJour(b.quand)) - Number(duJour(a.quand)));
}

/** Le catalogue, groupé par rayon, dans l'ordre où les rayons apparaissent. */
function parRayon(articles: ArticleCatalogue[]): Array<[string, ArticleCatalogue[]]> {
  const ordre: string[] = [];
  const par = new Map<string, ArticleCatalogue[]>();
  for (const a of articles) {
    const r = a.rayon || "";
    if (!par.has(r)) {
      par.set(r, []);
      ordre.push(r);
    }
    par.get(r)!.push(a);
  }
  return ordre.map((r) => [r, par.get(r)!] as [string, ArticleCatalogue[]]);
}

/**
 * ═══ UN CHAPITRE, ET LA PAGE EN RACONTE HUIT ══════════════════════════════
 *
 * « C'est impossible de s'y retrouver et c'est très mal fait. Il faut quelque
 * chose de beaucoup plus aéré, avec des sections claires, des titres pour qu'on
 * sache où on est, et que la page du commerçant raconte une histoire où l'on va
 * de section en section en comprenant ce qui se passe. »
 *
 * MESURE AVANT : ONZE MILLE DEUX CENTS POINTS DE DÉFILEMENT SUR UN TÉLÉPHONE.
 * Vingt-sept écrans, sans un seul repère — les sections s'enchaînaient au même
 * rythme, avec la même graisse, et rien ne disait ni où l'on était, ni combien
 * il restait, ni pourquoi cette section venait après l'autre.
 *
 * UN CHAPITRE PORTE TROIS CHOSES, ET LA TROISIÈME EST LA NOUVELLE :
 *
 *   · SON RANG — « 3 / 8 ». C'est ce qui manquait le plus : sans lui, on ne
 *     sait pas si l'on est au début ou à la fin, donc on ne sait pas s'il faut
 *     continuer. Un lecteur qui ne sait pas où il en est s'arrête.
 *   · SON TITRE, en grand, et il nomme la section — pas le produit.
 *   · CE À QUOI IL RÉPOND, en une ligne. « Ce qu'il vend tous les jours, pas
 *     seulement aujourd'hui » explique en huit mots pourquoi cette section
 *     existe et pourquoi elle vient APRÈS le présent. C'est ça, raconter une
 *     histoire : chaque section répond à la question que la précédente a
 *     laissée ouverte.
 *
 * ET IL EST LE MÊME PARTOUT. Huit en-têtes écrits à la main auraient huit
 * graisses, huit espacements et huit tons — c'est exactement ce qui donnait
 * l'impression d'un flux continu.
 */
function Chapitre({
  n,
  sur,
  titre,
  dit,
  ton,
}: {
  n: number;
  sur: number;
  titre: string;
  /** La question à laquelle ce chapitre répond. Une ligne, jamais deux. */
  dit: string;
  /** « essai » pour le mur, qui est le seul chapitre violet. */
  ton?: string;
}) {
  /**
   * ═══ LE « 3 / 8 » EST PARTI, ET C'EST LA MAQUETTE QUI LE DIT ══════════════
   *
   * « Il faut que ce soit absolument identique au design. »
   *
   * SES TROIS MAQUETTES N'ONT AUCUN NUMÉRO DE SECTION. Elles enchaînent
   * « Nos prestations phares », « Aujourd'hui à la boucherie », « Nos coups de
   * cœur du moment » — des titres de rayon, pas des chapitres d'un livre.
   *
   * IL A EXISTÉ POUR UNE VRAIE RAISON : « des titres pour qu'on sache où on
   * est », sur une page de six mille points sans repère. Cette raison est
   * traitée depuis que la barre d'onglets existe — elle dit où l'on est ET
   * permet d'aller ailleurs. Le numéro faisait doublon avec elle, et il donnait
   * à une vitrine l'air d'un formulaire en huit étapes.
   *
   * `n` ET `sur` RESTENT DANS LA SIGNATURE. Ils ne s'affichent plus, mais ils
   * ordonnent encore les sections dans le code et une garde les lit pour
   * vérifier que l'ordre ne bouge pas. Les retirer demanderait de toucher huit
   * appels pour ne rien gagner à l'écran.
   */
  return (
    <header className={`bq-ch${ton ? ` ${ton}` : ""}`} data-rang={n} data-sur={sur}>
      <h2>{titre}</h2>
      <p>{dit}</p>
    </header>
  );
}

/**
 * COMBIEN DE CHAPITRES — le dénominateur du « 3 / 8 ».
 *
 * IL EST FIXE, ET C'EST VOLONTAIRE. Un commerce sans avis n'affiche pas le
 * chapitre 5, et son numéro manque dans la suite : c'est ce qu'il faut. Un
 * dénominateur qui change d'un commerce à l'autre ferait croire que la page
 * elle-même change, alors que c'est le commerce qui a moins à montrer. Le rang
 * dit où l'on est dans L'HISTOIRE, pas dans cette page-là.
 */
const CHAPITRES = 8;

/**
 * ═══ CE QU'ON APPELLE « LE COMMERCE », CHEZ CHACUN ═════════════════════════
 *
 * « La navigation est identique : À essayer · Aujourd'hui · Produits /
 * Prestations · Le commerce · Avis · Infos. »
 *
 * L'ONGLET EST TOUJOURS À LA MÊME PLACE, LE MOT EST CELUI DU MÉTIER. C'est
 * exactement l'équilibre qu'il décrit — « 80 % de structure identique, 20 %
 * d'expérience métier ». Un coiffeur dit « Le salon », une boutique dit « Le
 * magasin », un tatoueur dit « L'atelier » : ce sont leurs mots, et les
 * entendre confirme qu'on est bien chez eux. Ce qui ne bouge pas, c'est le
 * QUATRIÈME onglet en partant de la gauche.
 *
 * « LE COMMERCE » EST LE REPLI, ET IL NE PRÉTEND RIEN. Un métier absent de
 * cette table prend le mot générique plutôt que d'emprunter celui d'un autre —
 * c'est la règle de tout ce dossier depuis que le mur des bougies s'est
 * retrouvé chez un hypnothérapeute.
 */
const CHEZ_EUX: [RegExp, string][] = [
  // « ONGULAIRE » NE CONTIENT PAS « ONGL ». Premier jet : `/ongl/` — et la
  // prothésiste ongulaire tombait sur le repli « Le commerce », alors qu'elle
  // est le métier le plus salon du paquet. Le mot s'écrit o-n-g-u-l-a-i-r-e ;
  // une racine devinée plutôt que lue sur la donnée rate exactement le cas
  // qu'elle visait.
  [/coiffeur|coiffure|barbier|ongulaire|onglerie|proth[ée]siste|esth[ée]t|beaut|institut/i, "Le salon"],
  [/tatou|bijou|bracelet|collier|cirier|ciri[èe]re|artisan|atelier|potier|couturi/i, "L’atelier"],
  // LE HYPNOTHÉRAPEUTE PASSE AVANT LE TRAITEUR, ET C'EST L'ORDRE QUI LE FAIT :
  // « thérapeute » et « traiteur » ne se croisent pas, mais la première liste
  // qui matche gagne, donc les métiers les plus spécifiques passent devant.
  [/hypno|psycho|sophro|th[ée]rapeute|ost[ée]o/i, "Le cabinet"],
  [/restaurant|bistrot|brasserie|traiteur|pizz/i, "Le restaurant"],
  [/bar|caviste|vins/i, "Le bar"],
  [/boulanger|p[âa]tiss|choco|primeur|fromag|boucher|[ée]picer/i, "La boutique"],
  [/mode|pr[êe]t-[àa]-porter|friperie|fripe|opticien|lunet|fleurist/i, "Le magasin"],
];

/**
 * L'ONGLET PORTE LE MOT, PAS L'ARTICLE — ET IL GARDE SA MAJUSCULE.
 *
 * Premier jet : un `replace` de l'article, et l'onglet affichait « prestations »
 * en bas de casse au milieu de cinq onglets capitalisés. Retirer « Les » à
 * « Les prestations » ne laisse pas un mot écrit, ça laisse un mot décapité.
 */
function sansArticle(titre: string): string {
  const nu = titre.replace(/^(les|la|le|l’|l')\s*/i, "");
  return nu.charAt(0).toUpperCase() + nu.slice(1);
}

function chezEux(metier: string): string {
  return CHEZ_EUX.find(([r]) => r.test(metier))?.[1] ?? "Le commerce";
}

export function Boutique() {
  const cartes = useMemo(() => toutesLesCartes(), []);
  const [id, setId] = useState("emporter");
  /** Le rond de la voix, agrandi et sonore. Il se referme en changeant de commerce. */
  const [voixOuverte, setVoixOuverte] = useState(false);
  /**
   * A-T-ON POUSSÉ LA PORTE DE L'ATELIER ?
   *
   * Faux : on voit la vitrine — le bloc Fantôme des maquettes. Vrai : on voit
   * l'écran d'essai, qui n'a pas changé. Voir le commentaire au montage.
   */
  const [essaiOuvert, setEssaiOuvert] = useState(false);
  /** Le style touché dans la bande, pour le passer à l'essai. */
  const [styleChoisi, setStyleChoisi] = useState<string | undefined>(undefined);
  /** On est entré par « Surprends-moi ». Voir `surprendre` dans `MurContenu`. */
  const [surprendre, setSurprendre] = useState(false);
  const c = useMemo(() => cartes.find((x) => x.id === id) ?? cartes[0], [cartes, id]);

  /**
   * L'HEURE VRAIE, AVEC LE MÊME REPLI QUE LE FIL.
   *
   * À 3 h du matin, un commerce dont tous les moments sont passés se lit comme
   * un commerce fermé pour de bon. Le repli sur midi hors des heures
   * d'ouverture est la règle du deck ; la page la reprend telle quelle, sinon
   * les deux écrans raconteraient deux journées différentes.
   *
   * MONTÉE APRÈS LE PREMIER RENDU, sans quoi le serveur et le navigateur
   * calculeraient deux heures différentes et React refuserait l'hydratation.
   */
  const [heure, setHeure] = useState(12);
  useEffect(() => {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    setHeure(h >= HEURE_MIN && h <= HEURE_MAX ? h : 12);
  }, []);

  const rond = motDuMetier(c.metier, c.branche);
  /**
   * LE TITRE DU CATALOGUE, ET UN DÉFAUT QUE SEULE CETTE PAGE POUVAIT RÉVÉLER.
   *
   * Deux fonctions nomment le même objet, et elles ne se rencontraient jamais :
   * `motDuMetier` écrit le mot dans l'anneau de la carte, `motCatalogue` écrit
   * le titre de la feuille du catalogue. Sur le fil, l'un est sur la photo et
   * l'autre derrière un bouton, à deux gestes de distance. Ici ils sont sur le
   * MÊME ÉCRAN, à quatre cents points l'un de l'autre — et l'hypnothérapeute
   * portait « LES SÉANCES » dans son anneau et « Le catalogue » en titre.
   *
   * ON GARDE `motCatalogue`, QUI EST FAIT POUR ÇA — « Les produits » vaut mieux
   * que « La fournée » pour la liste permanente d'un boulanger. Mais quand il
   * retombe sur son mot passe-partout, l'anneau en sait davantage : c'est le
   * seul cas où on lui préfère celui du métier.
   */
  const langage = personnaliteDe({ branche: c.branche, metier: c.metier });
  const catal = motCatalogue(c.metier);
  const mots = catal.titre === "Le catalogue" ? { ...catal, titre: rond.carte } : catal;
  /**
   * ═══ « CE QUI REVIENT » SE CALCULE APRÈS LE MONTAGE, ET C'EST OBLIGATOIRE ══
   *
   * DÉFAUT TROUVÉ PAR UNE GARDE, ET IL ÉTAIT LÀ DEPUIS LE DÉBUT. Le serveur
   * écrivait « plutôt le jeudi » et le navigateur « plutôt le mardi » : React
   * refusait l'hydratation de toute la page (erreur 418), et plus rien ne
   * répondait au doigt en dessous.
   *
   * LA CAUSE EST DANS `jourDe` : une annonce est datée « il y a 12 jours », et
   * le jour de la semaine se déduit d'AUJOURD'HUI. Or cette page est prérendue —
   * son HTML est écrit à la compilation. « Plutôt le jeudi » était donc le jour
   * qu'il faisait LE JOUR DU DÉPLOIEMENT, et il se contredisait dès le
   * lendemain.
   *
   * UNE DÉDUCTION RELATIVE À AUJOURD'HUI NE PEUT PAS ÊTRE PRÉRENDUE. C'est la
   * même règle que l'heure, trois lignes plus haut, écrite pour la même raison :
   * le serveur et le navigateur ne sont pas le même jour. La section apparaît
   * donc après le montage, ce qui est exact — avant, on n'a pas l'information.
   */
  const [habitudes, setHabitudes] = useState<ReturnType<typeof ceQuiRevient>>([]);
  useEffect(() => setHabitudes(ceQuiRevient(c.passees)), [c.passees]);
  const avis = useMemo(() => avisDuCommerce(c), [c]);
  const mur = useMemo(() => murDuCommerce(c), [c]);
  const rayons = useMemo(() => parRayon(c.catalogue ?? []), [c.catalogue]);
  const enCours = c.moments.filter((m) => etatDuMoment(m, heure) === "en-cours");
  const aVenir = c.moments.filter((m) => etatDuMoment(m, heure) === "a-venir");

  /**
   * LA PHOTO DE TÊTE : CELLE DU COMMERCE, PAS CELLE DU JOUR.
   *
   * C'est l'inverse exact de la carte du fil, où `MomentJour.photo` passe
   * devant celle du commerce parce que « le plat est ce qui donne faim, pas le
   * nom du plat ». Ici on n'est plus dans l'annonce : la salle, la devanture,
   * l'atelier disent QUI C'EST, ce qui est précisément la question de cette
   * page. La photo du jour, elle, reste sur les moments, à sa place.
   */
  const photoTete = c.sesPhotos?.[0]?.src || c.photo || c.moments[0]?.photo || "";

  /**
   * ═══ LE MUR DU COMMERCE, ET L'ESSAI EN DIRECT, SUR SA PAGE ════════════════
   *
   * « Il faut aussi mettre en vedette les murs des commerçants, avec
   * possibilité de faire des essayages en direct sur leur page d'accueil. »
   *
   * ON MONTE LE MÊME COMPOSANT, PAS UN SECOND. `MurContenu` sait déjà tout
   * faire : il ouvre sur l'essai chez les métiers qui en ont un, sur le mur
   * chez les autres, il parle les mots du métier, il dépose et il prévient le
   * commerçant. En réécrire une version « pour la page » garantirait qu'un jour
   * les deux divergent — c'est exactement la faute qui a donné trois copies de
   * la table de routage, et qui les a fait diverger toutes les trois.
   *
   * IL RECOIT LE MÊME MUR QUE LA FEUILLE DU FIL, construit par `murDeLaCarte`
   * avec le catalogue et le moment du commerce : ce qu'on essaie ici est ce que
   * l'annonce vend, comme là-bas.
   */
  const murDuLieu = useMemo(
    () =>
      murDeLaCarte({
        id: c.id,
        nom: c.nom,
        metier: c.metier,
        branche: c.branche,
        ville: c.ville,
        distance: c.distance,
        photo: c.photo,
        google: c.google,
        telephone: c.telephone,
        catalogue: c.catalogue,
        moment: momentEnCours(c, heure),
      }),
    [c, heure],
  );
  const onEssaie = murDuLieu.depot === "essai";

  /**
   * COMBIEN DE SECTIONS DANS LA COLONNE DE GAUCHE — et pourquoi on les compte.
   *
   * Sur ordinateur, la page est une grille de deux colonnes. Le mur est seul à
   * droite et il est beaucoup plus haut que la section qui lui fait face : une
   * grille partageant ses rangées, la rangée entière prenait la hauteur du mur
   * et laissait un vide de cinq cents points sous « En ce moment ». Mesuré à
   * 1440 points.
   *
   * LE MUR DOIT DONC COUVRIR TOUTES LES RANGÉES DE LA COLONNE DE GAUCHE, et
   * leur nombre dépend de ce que ce commerce a — un hypnothérapeute n'a ni
   * habitudes, ni avis, ni habitués. En couvrir trop fabrique des rangées vides
   * à la fin, en couvrir trop peu ramène le vide. On les compte donc ici, où
   * l'on sait exactement lesquelles vont s'afficher, et le nombre part dans une
   * variable CSS. C'est la seule information que la feuille de style ne peut
   * pas déduire seule.
   */
  /**
   * ═══ OU SUIS-JE DANS L'HISTOIRE ═══════════════════════════════════════════
   *
   * « Des titres pour qu'on sache où on est. »
   *
   * LES TITRES NE SUFFISENT PAS, ET C'EST LE POINT. Un titre dit où l'on est
   * AU MOMENT OÙ ON LE CROISE ; trois écrans plus bas, on ne sait déjà plus
   * dans quelle section on lit. Sur une page de six mille points, c'est
   * l'essentiel du temps qu'on y passe.
   *
   * UN BANDEAU COLLANT PORTE LE CHAPITRE COURANT. Il apparaît quand on a
   * dépassé la tête de page et dit « 3 / 8 · La carte ». Rien de plus : ce
   * n'est pas un menu, c'est un repère.
   *
   * L'OBSERVATEUR PLUTOT QU'UN CALCUL AU DEFILEMENT. Écouter le défilement
   * oblige à mesurer huit positions à chaque pixel parcouru ; l'observateur ne
   * réveille le navigateur que lorsqu'une section franchit la ligne. Sur un
   * téléphone, la différence se sent au doigt.
   */
  /** Quelle section occupe le haut de l'écran — c'est l'onglet allumé. */
  const [sectionVue, setSectionVue] = useState("essayer");
  /**
   * LA POCHE DES PIÈCES MISES DE CÔTÉ, ET SON TIROIR.
   *
   * Le cœur du bandeau ne faisait rien : l'envol du cœur, depuis le résultat
   * d'essayage, désignait donc un bouton décoratif. C'est la MÊME poche que
   * celle de l'accueil — un second magasin aurait donné deux listes, et celle
   * qu'on ne regarde pas se vide toute seule.
   */
  const gardees = useSyncExternalStore(
    abonnerPiecesGardees,
    chargerPiecesGardees,
    piecesGardeesVides,
  );
  const [pocheOuverte, setPocheOuverte] = useState(false);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".bq-s"));
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        // CELLE QUI OCCUPE LE HAUT DE L'ECRAN GAGNE. Deux sections sont
        // visibles en même temps la moitié du temps ; sans ce tri, l'onglet
        // allumé clignote entre les deux à chaque pixel.
        const vues = entrees
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const cible = vues[0]?.target as HTMLElement | undefined;
        if (!cible) return;
        if (cible.id) setSectionVue(cible.id);
      },
      // LA LIGNE EST AU QUART HAUT DE L'ECRAN : c'est là que l'oeil lit, pas
      // au bord. Une marge négative en bas empêche qu'une section à peine
      // entrée par le bas prenne la main.
      { rootMargin: "-22% 0px -68% 0px", threshold: 0 },
    );
    for (const x of sections) obs.observe(x);
    return () => obs.disconnect();
  }, [c.id]);

  /**
   * ═══ LE COMPTE DES RANGÉES EST PARTI AVEC LA GRILLE ═══════════════════════
   *
   * Il servait à une seule chose : dire à la colonne de droite combien de
   * rangées de gauche elle devait couvrir, faute de quoi la rangée partagée
   * prenait la hauteur du mur et laissait cinq cents points de vide. Un calcul
   * juste, pour une mise en page qui n'existe plus — voir la feuille de style.
   *
   * ON NE GARDE PAS UN CALCUL « AU CAS OÙ ». Une variable qui n'alimente plus
   * rien continue d'être maintenue par celui qui la lit, et c'est du temps pris
   * à comprendre une mise en page morte.
   */

  /**
   * ═══ LA NAVIGATION, IDENTIQUE PARTOUT ═════════════════════════════════════
   *
   * « Je pense que c'est très important de conserver cette construction
   * commune. C'est justement ce qui va faire que quelqu'un qui a compris ClikMe
   * chez un coiffeur saura immédiatement l'utiliser chez un bar, un tatoueur ou
   * un fleuriste. »
   *
   * L'ORDRE EST FIXE, LES MOTS SONT CEUX DU MÉTIER. « À essayer » est toujours
   * le premier onglet — c'est la seule chose qu'on ne peut pas faire ailleurs,
   * et la mettre en tête est tout le pari de cette page. Les suivants gardent
   * leur RANG quel que soit le commerce ; seuls leurs mots changent.
   *
   * UN ONGLET QUI N'A RIEN À MONTRER NE SE DESSINE PAS. Un hypnothérapeute n'a
   * ni catalogue ni avis : lui peindre deux onglets morts apprendrait qu'on
   * peut appuyer sur un onglet sans que rien ne se passe, ce qui abîme les
   * quatre autres. C'est la même règle que les compteurs à zéro sous le rail.
   */
  /**
   * DEUX ONGLETS VOISINS NE PORTENT PAS LE MÊME MOT.
   *
   * Chez le tatoueur, `motCatalogue` dit « L'atelier » et `chezEux` dit
   * « L'atelier » : la barre affichait « 🏷️ Atelier · 🏠 L'atelier », côte à
   * côte, et deux onglets identiques ne disent plus lequel ouvre quoi.
   *
   * C'EST L'ONGLET DU LIEU QUI CÈDE, et c'est le bon des deux : le mot du
   * catalogue est la chose que ce commerçant VEND — il porte de l'information.
   * « Le commerce » ne prétend rien, ce qui est exactement ce qu'on veut d'un
   * repli. Voir la même règle partout dans ce dossier.
   */
  const motCarte = rayons.length > 0 ? sansArticle(mots.titre) : "";
  const motLieu0 = chezEux(c.metier);
  const motLieu =
    motCarte && sansArticle(motLieu0).toLowerCase() === motCarte.toLowerCase()
      ? "Le commerce"
      : motLieu0;

  /**
   * ═══ LE PREMIER ONGLET DIT CE QUE LE BLOC OUVRE VRAIMENT ══════════════════
   *
   * « Un bouton qui ouvre autre chose que ce qu'il annonce est la promesse la
   * plus concrète qu'un écran puisse rompre. »
   *
   * IL DISAIT « À ESSAYER » PARTOUT, Y COMPRIS LÀ OÙ IL N'Y A RIEN À ESSAYER.
   * Chez le bar, l'onglet promettait un essayage et le bloc affichait « Faites
   * savoir que vous êtes ici » : un mur de présence, c'est-à-dire précisément
   * ce que ce mot ne désigne pas. Sa table des métiers prévoit bien quelque
   * chose pour un bar — « un morceau de la soirée de ce soir » — mais ce
   * parcours n'existe pas encore, et un libellé n'est pas une fonctionnalité.
   *
   * L'ORDRE NE BOUGE PAS, LE MOT SUIT LE CONTENU — et c'est exactement le
   * partage qu'il décrit : la structure est commune, le cœur est ce qui change
   * selon le métier. Le jour où le bar a son parcours, il reprend « À essayer »
   * tout seul, sans qu'on touche à cette liste.
   */
  const motCoeur =
    onEssaie || murDuLieu.gout || murDuLieu.soiree ? "À essayer" : "Qui est là";

  const onglets = [
    { id: "essayer", mot: motCoeur, picto: "✨" },
    // « CE SOIR » CHEZ UN BAR, ET CE N'EST PAS UN SYNONYME. La journée d'un bar
    // commence quand celle des autres finit ; lui écrire « Aujourd'hui » à 19 h
    // parlerait d'un après-midi que personne n'est venu chercher.
    { id: "aujourdhui", mot: c.branche === "bar" ? "Ce soir" : "Aujourd’hui", picto: "⚡" },
    // L'ONGLET PORTE LE MOT, PAS L'ARTICLE. « Les prestations » et « L'ardoise »
    // sont des titres de SECTION — ils se lisent en grand, seuls sur leur
    // ligne. Dans une barre de six onglets, l'article coûte trois caractères
    // par onglet et c'est lui qui pousse « Infos » hors de l'écran. Sa
    // maquette écrit « Prestations », pas « Les prestations ».
    ...(rayons.length > 0
      ? [{ id: "carte", mot: motCarte, picto: "🏷️" }]
      : []),
    { id: "qui", mot: motLieu, picto: "🏠" },
    ...(mur.length > 0 || avis.length > 0 ? [{ id: "avis", mot: "Avis", picto: "💬" }] : []),
    { id: "infos", mot: "Infos", picto: "ℹ️" },
  ];

  /**
   * ALLER À UNE SECTION SANS LA COLLER SOUS LA BARRE.
   *
   * `scrollIntoView` pose le haut de la section au haut de la FENÊTRE, c'est-à-
   * dire DERRIÈRE les onglets, qui sont collants : on arrive sur un titre qu'on
   * ne voit pas. On retire donc la hauteur de la barre, mesurée sur la barre
   * elle-même plutôt que devinée — elle change de hauteur avec la taille de
   * police du téléphone.
   */
  const allerA = (id: string) => {
    const cible = document.getElementById(id);
    if (!cible) return;
    const barre = document.querySelector<HTMLElement>(".bq-nav");
    const haut = cible.getBoundingClientRect().top + window.scrollY - (barre?.offsetHeight ?? 0) - 6;
    window.scrollTo({ top: haut, behavior: "smooth" });
    setSectionVue(id);
  };

  return (
    <div className="bq">
      <Styles />

      {/* ─── LE SÉLECTEUR DE MAQUETTE ───
          IL N'EXISTE QUE PARCE QUE C'EST UNE MAQUETTE, et il est le seul
          element de la page qui disparaitra a l'atterrissage. Sa raison
          d'etre : cette page doit tenir sur QUATORZE commerces tres inegaux —
          un restaurant qui a tout, une cireuse qui n'a qu'un catalogue, un
          hypnotherapeute sans photo. On ne juge pas un gabarit sur son
          meilleur cas. */}
      <div className="bq-maq">
        <span className="bq-maq-l">Maquette · un autre commerce</span>
        <div className="bq-maq-c">
          {cartes.map((x) => (
            <button
              key={x.id}
              type="button"
              className={x.id === c.id ? "on" : ""}
              onClick={() => {
                setId(x.id);
                setVoixOuverte(false);
                // ON REVIENT À LA VITRINE EN CHANGEANT DE COMMERCE. Rester dans
                // l'atelier ferait arriver chez le boucher sur un écran de
                // cadrage, sans avoir vu ce qu'il y a à essayer.
                setEssaiOuvert(false);
                setStyleChoisi(undefined);
                // ET L'INTENTION DE SURPRISE PART AVEC. Gardée, elle aurait
                // envoyé le commerce SUIVANT sur la recherche dès la photo
                // prise, alors qu'on n'a rien demandé chez lui.
                setSurprendre(false);
                window.scrollTo({ top: 0 });
              }}
            >
              {x.nom}
            </button>
          ))}
        </div>
      </div>

      {/* ─── LE BANDEAU DE BOUTIQUE ───
          Retour a gauche, geste a droite, et rien entre les deux. La sortie
          vers le fil est la chose la plus importante de cette barre : une page
          ouverte depuis l'application qui n'offre pas de chemin de retour se
          termine par un onglet ferme, et on ne revient pas. C'est le meme
          raisonnement que `barre-direct.tsx`, ecrit il y a longtemps et
          toujours juste. */}
      <section className="bq-hero">
        {/* LE BANDEAU EST DANS LA TETE DE PAGE, PAS AU-DESSUS D'ELLE. Pose en
            absolu sur la page, il se calait sur le haut du DOCUMENT et venait
            recouvrir le selecteur de maquette. Une barre qui flotte doit avoir
            pour repere la chose sur laquelle elle flotte. */}
        {/* ═══ LA BARRE DU HAUT, TELLE QU'ELLE EST DESSINEE ════════════════

            Ses trois maquettes portent la meme : un rond de retour a gauche, le
            mot ClikMe a cote, puis trois ronds a droite — garder, partager, le
            reste. Des pastilles rondes translucides sur la photo, pas des
            boutons a libelle.

            LE NOM DU PRODUIT EST DANS LA BARRE, ET IL N'Y ETAIT PAS. On entrait
            sur la page d'un commercant sans savoir chez qui on etait — ClikMe,
            un annuaire, le site du salon ? C'est la seule chose de cette barre
            qui ne soit pas un geste, et c'est celle qui manquait. */}
        <header className="bq-tete">
          <div className="bq-tete-g">
            <Link className="bq-rond" href="/autour-de-moi" prefetch={false} aria-label="Revenir au direct">
              <i aria-hidden="true">←</i>
            </Link>
            <span className="bq-marque" aria-hidden="true">
              Clik<b>Me</b>
            </span>
          </div>
          <div className="bq-tete-d">
            {/* ═══ LE CŒUR OUVRE LA POCHE, IL NE FAIT PLUS RIEN ════════════════

                « Quand j'appuie sur "je le mets de côté", le cœur part, mais je
                ne retrouve pas cet article dans le cœur en haut à droite. »

                IL N'ÉTAIT BRANCHÉ SUR RIEN, et c'est ce qui rendait l'envol
                mensonger : le cœur montait vers un bouton décoratif. Il compte
                maintenant les pièces mises de côté et les montre — c'est la
                MÊME poche que celle du bandeau de l'accueil, voir
                `lib/direct/pieces-gardees.ts`, jamais une seconde liste. */}
            <button
              type="button"
              className={`bq-rond${gardees.length ? " plein" : ""}`}
              aria-label={
                gardees.length
                  ? `Vos pièces mises de côté (${gardees.length})`
                  : "Vos pièces mises de côté, pour l’instant vides"
              }
              aria-expanded={pocheOuverte}
              onClick={() => setPocheOuverte((v) => !v)}
            >
              <i aria-hidden="true">{gardees.length ? "❤️" : "♡"}</i>
              {gardees.length > 0 && <s>{gardees.length}</s>}
            </button>
            <button type="button" className="bq-rond" aria-label="Partager">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="18" cy="5.5" r="2.6" />
                <circle cx="6" cy="12" r="2.6" />
                <circle cx="18" cy="18.5" r="2.6" />
                <path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" />
              </svg>
            </button>
            <button type="button" className="bq-rond" aria-label="Plus d’options">
              <i aria-hidden="true">···</i>
            </button>
          </div>
          {/* ═══ LE TIROIR DE LA POCHE ══════════════════════════════════════

              IL S'OUVRE SOUS LE CŒUR, là où le cœur vient d'arriver, et il se
              referme d'un appui. Une poche qu'on ne peut ni ouvrir ni vider
              se remplit une fois puis ne sert plus.

              LA VIGNETTE EST LE RENDU, PAS LE CATALOGUE : on se souvient de la
              pièce SUR SOI, et la photo du mannequin ne rappellerait pas le
              même moment. */}
          {pocheOuverte && (
            <div className="bq-poche" role="dialog" aria-label="Vos pièces mises de côté">
              {gardees.length === 0 ? (
                <p className="bq-poche-v">
                  Rien de mis de côté pour l’instant. Essayez une pièce, puis
                  «&nbsp;Je la mets de côté&nbsp;»&nbsp;: vous la retrouverez ici.
                </p>
              ) : (
                <ul>
                  {gardees.map((x) => (
                    <li key={`${x.carte}-${x.piece}`}>
                      {x.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={x.image} alt="" />
                      ) : (
                        <i aria-hidden="true">🤍</i>
                      )}
                      <span>
                        <b>{x.nom}</b>
                        {x.lieu}
                        {x.prix ? ` · ${x.prix}` : ""}
                      </span>
                      <button
                        type="button"
                        aria-label={`Retirer ${x.nom}`}
                        onClick={() => basculerPieceGardee({ ...x })}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>

        {photoTete ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoTete} alt="" style={{ objectPosition: `center ${c.cadrage || "50%"}` }} />
        ) : (
          <div className="bq-hero-vide" aria-hidden="true" />
        )}
        <div className="bq-hero-voile" aria-hidden="true" />

        {/* ═══ L'ANNEAU DU MÉTIER N'EST PLUS SUR CETTE PAGE ════════════════

            IL AVAIT UNE BONNE RAISON D'Y ÊTRE : « c'est lui, et lui seul, qui
            fait qu'on reconnaît le commerce d'un écran à l'autre. » Il est le
            lien visuel entre la carte du fil et la page.

            AUCUNE DES TROIS MAQUETTES NE LE PORTE, et en le remettant à
            l'échelle de la nouvelle tête de page on voit pourquoi : il tombe
            dans le coin bas-droit, là où sont maintenant les étiquettes du
            commerce, et il les recouvre. Un anneau de cent points sur une tête
            de page qui porte un nom en enseigne, une devise, trois faits et
            quatre étiquettes n'est plus un repère, c'est un obstacle.

            CE QU'IL DISAIT EST DIT AILLEURS, ET MIEUX : le premier onglet porte
            le pictogramme du métier, et le fantôme du bloc tient son outil.
            Voir `FantomeMetier`. */}

        {/* ═══ « OÙ SUIS-JE ? », ET ON RÉPOND EN QUATRE LIGNES ═══════════════

            « Grande photo immersive + nom + métier + distance + note +
            ouvert/fermé + trois ou quatre caractéristiques. Le commerce doit
            rester très présent. »

            LES TROIS FAITS ÉTAIENT SUR UNE SEULE LIGNE, ET ELLE DÉBORDAIT.
            « Une prothésiste ongulaire · 340 m · ★ 4,8 (51 avis) » passait sous
            l'anneau et se coupait à droite : le nom du commerce, c'est-à-dire la
            réponse à la question de cette section, était la première chose
            illisible. Chaque fait prend sa ligne, avec son repère à gauche —
            c'est la mise en page de ses trois maquettes, et elle tient sur tous
            les noms parce qu'elle ne dépend plus de leur longueur.

            L'HORAIRE ENTRE ICI, ET IL MANQUAIT. « Ouvert jusqu'à 19 h » décide
            quelque chose — on y va maintenant, ou on n'y va pas — alors qu'il
            n'était lisible qu'à six mille points plus bas, dans les infos. */}
        <div className="bq-hero-c">
          <h1>{c.nom}</h1>
          <p className="bq-metier">
            {c.metier} · {c.ville}
          </p>
          {/* ═══ LA LIGNE MANUSCRITE SOUS LE NOM ══════════════════════════════

              « Des ongles qui vous ressemblent ♡ » · « Des looks qui vous
              ressemblent ♡ » · « Des produits de qualite, pres de chez vous ♡ »

              LES TROIS MAQUETTES EN PORTENT UNE, et c'est la seule phrase de la
              page ecrite par le commercant pour dire ce qu'il PROMET, par
              opposition a ce qu'il vend. Elle est deja dans les donnees —
              `voix.signature` — et elle ne se voyait qu'a quatre mille points
              plus bas, dans la section « qui vous recevra ».

              ELLE N'INVENTE RIEN QUAND ELLE MANQUE. Un commerce sans signature
              n'en affiche pas : ecrire une devise a la place de quelqu'un est
              exactement ce qu'un produit local ne doit jamais faire. */}
          {c.voix?.signature && (
            <p className="bq-devise">
              {c.voix.signature} <i aria-hidden="true">♡</i>
            </p>
          )}
          <ul className="bq-faits">
            <li>
              <i aria-hidden="true">📍</i>
              {c.ville} · {c.distance}
            </li>
            {c.google && (
              <li>
                <i aria-hidden="true">★</i>
                <b>{c.google.note}</b>
                <u>({c.google.avis} avis)</u>
              </li>
            )}
            {c.fiche.horaires && (
              <li>
                <i aria-hidden="true">🕐</i>
                {c.fiche.horaires}
              </li>
            )}
          </ul>
          {/* LES TROIS OU QUATRE CARACTÉRISTIQUES, ET ELLES EXISTAIENT DÉJÀ.
              `Mur.etiquettes` les porte depuis le premier jour — « Cuisine
              française », « Terrasse » — et elles ne se voyaient nulle part sur
              cette page. On en montre quatre au plus : au-delà, ce n'est plus
              un portrait, c'est une liste de mots-clés. */}
          {murDuLieu.etiquettes.length > 0 && (
            <ul className="bq-tags">
              {murDuLieu.etiquettes.slice(0, 4).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ═══ LA NAVIGATION, ET ELLE EST LA MÊME CHEZ TOUT LE MONDE ═══════════
          Voir `onglets` plus haut : l'ordre ne bouge pas d'un commerce à
          l'autre, les mots sont ceux du métier. Elle colle sous le haut de
          l'écran, parce qu'un menu qu'on ne retrouve qu'en remontant de six
          mille points n'est pas un menu. */}
      <nav className="bq-nav" aria-label="Sections de la page">
        <ul>
          {onglets.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={sectionVue === o.id ? "on" : undefined}
                aria-current={sectionVue === o.id ? "true" : undefined}
                onClick={() => allerA(o.id)}
              >
                <i aria-hidden="true">{o.picto}</i>
                {o.mot}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ─── AUJOURD'HUI, ET C'EST LA PREMIERE CHOSE ───
          Voir le point 1 en tete de fichier. Ce bloc peut etre VIDE, et le cas
          vide est celui qui compte le plus : un commercant qui n'a rien publie
          ce matin doit le voir ecrit sur sa propre page. C'est ce qui rend le
          geste du matin non negociable, et c'est exactement le role du drapeau
          `silencieux` dans le fil. */}
      {/* ═══ LE BANDEAU DE CHAPITRE EST PARTI, ET LES ONGLETS L'ONT REMPLACÉ ═

          Il a existé pour une bonne raison — « des titres pour qu'on sache où
          on est », et un titre ne dit où l'on est qu'au moment où on le croise.
          Il collait donc sous le haut de l'écran et rappelait « 3 / 8 · La
          carte ».

          LA BARRE D'ONGLETS FAIT LE MÊME TRAVAIL, EN MIEUX : elle dit où l'on
          est ET permet d'aller ailleurs, là où le bandeau ne faisait que dire.
          Les deux collants empilés prenaient soixante-dix points en haut de
          chaque écran, l'un au-dessus de l'autre, pour annoncer deux fois la
          même section — et sur le cœur de la page, c'est soixante-dix points
          pris au plat.

          LE CALCUL DU CHAPITRE RESTE : c'est le même observateur qui allume
          l'onglet courant. Voir la section vue dans le composant. */}

      {/* ═══ LE CŒUR : « QU'EST-CE QUE JE PEUX ESSAYER ICI ? » ═══════════════

          « Une vraie page commerciale AVEC un énorme cœur "À essayer". Parce
          que si on pousse trop l'essayage, on ne sait plus où on est ; et si on
          pousse trop la fiche commerciale, ClikMe redevient un Google ou un
          Instagram amélioré. »

          IL EST PASSÉ EN PREMIÈRE POSITION, ET C'EST LE CHANGEMENT DE FOND.
          Il était deuxième, derrière « En ce moment », et le raisonnement d'alors
          se tenait : le présent garde le haut de page. Mais on arrivait sur une
          liste de créneaux — c'est-à-dire sur ce que n'importe quel site de
          réservation sait faire — et la seule chose qu'aucun ne sait faire
          attendait un défilement. La page répond maintenant dans l'ordre de ses
          deux questions : « où suis-je ? » par la photo et le nom, puis
          « qu'est-ce que je peux essayer ici ? », immédiatement.

          ET LE PRÉSENT N'A RIEN PERDU : il est juste en dessous, au deuxième
          rang, toujours au-dessus du catalogue et de l'histoire.

          C'EST CE BLOC, ET LUI SEUL, QUI CHANGE SELON LE MÉTIER. Tout le reste
          de cette page est le même gabarit pour les quatorze commerces — c'est
          le « 80 % identique / 20 % métier » du brief. Ici, un coiffeur pose sa
          coupe sur un visage, une onglerie sa pose sur une main, un restaurant
          fait jouer avec le plat du jour : `MurContenu` sait déjà lequel, et
          c'est pour ça qu'on monte LE MÊME COMPOSANT que dans le fil plutôt
          qu'une seconde version « pour la page ». Voir `murDuLieu` plus haut. */}
      <section className={`bq-s bq-mur${onEssaie ? " essai" : ""}`} id="essayer">
        {/* UN SEUL TITRE, ET C'EST CELUI DU COMPOSANT. Premier jet : j'avais
            ecrit le mien au-dessus, et la page affichait « Ce que les gens ont
            laisse ici » suivi de « Ce que les gens ont laisse ici aujourd'hui ».
            Le mur sait deja se presenter, dans les mots de son metier — il ne
            reste que l'etiquette de section, qui dit ou l'on est dans la page. */}
        {/* LE CHAPITRE PORTE LE TITRE DU MÉTIER, IL NE LE REMPLACE PAS.
            Premier jet : j'avais écrit « Essayez sur vous » ici et masqué la
            tête du composant — ce qui effaçait « Vos ongles, avant de venir »,
            c'est-à-dire précisément le travail fait pour qu'un coiffeur et une
            onglerie ne disent pas la même chose. Les mots du métier remontent
            donc dans le chapitre ; rien n'est écrit deux fois, et rien n'est
            perdu. Voir `Mur.essai.mots` dans `lib/direct/fantomes.ts`. */}
        {/* ═══ PAS DE TITRE DE SECTION AU-DESSUS DU PANNEAU ════════════════

            Aucune des trois maquettes n'en met : on passe des onglets AU BLOC,
            directement. Et c'est juste — le panneau porte déjà sa question en
            vingt-cinq points (« Quel style d'ongles vous fait envie
            aujourd'hui ? »). Un titre au-dessus ferait deux titres pour un seul
            écran, dont le premier serait plus petit que le second.

            IL RESTE POUR LES COMMERCES SANS ESSAI. Là, le bloc n'est pas la
            vitrine mais le mur de présence ou l'avant-goût, qui ne se
            présentent pas tout seuls. Voir plus bas : c'est la même règle que
            le premier onglet, qui dit ce que le cœur ouvre. */}
        {/* ═══ PLUS DE TITRE DE SECTION AU-DESSUS DU PANNEAU, POUR PERSONNE ══

            Aucune des trois maquettes n'en met : on passe des onglets AU BLOC.

            IL SURVIVAIT POUR LES COMMERCES SANS ESSAI, au motif que le mur de
            présence et l'avant-goût « ne se présentent pas tout seuls ». Ce
            n'est plus vrai depuis que la vitrine s'affiche pour tout le monde :
            elle porte sa question en vingt-trois points — « Qui est là en ce
            moment ? », « Et si vous goûtiez la garbure landaise avant d'y
            aller ? » — et un titre au-dessus ferait deux titres pour un écran,
            dont le premier serait plus petit que le second. */}
        {/* LA CLASSE DIT LEQUEL DES DEUX EST MONTÉ, ET ELLE EST NÉCESSAIRE.
            Les deux vivent dans le même `.mu` — donc sous la même encre claire
            — mais ils ne veulent pas le même fond : la vitrine est un panneau
            ROSE sur la page claire, l'atelier est une NUIT. Peindre le fond
            sombre sur les deux poserait le panneau rose au milieu d'un
            rectangle noir. Voir la feuille, section « l'atelier garde sa
            nuit ». */}
        <div className={`mu bq-mu${essaiOuvert ? " atelier" : " vitrine"}`}>
          {/* ═══ ON OUVRE SUR LA PRISE DE VUE, PAS SUR LE MUR ════════════════

              Ses trois maquettes disent la même chose, et elles la disent
              trois fois : le grand bouton « Je me prends en photo » est le
              premier objet du bloc, chez le coiffeur, chez la boutique et chez
              l'onglerie. Le mur des essayages vient APRÈS.

              OR `entree` ENVOIE SUR LE MUR DÈS QU'IL Y A DU MONDE DESSUS, et
              c'est la bonne règle DANS LE FIL : là-bas on arrive par le
              fantôme de la barre, qui ne dit rien de ce qu'on veut, et voir dix
              personnes portant la chose donne plus envie que l'écran de prise
              de vue. ICI, ON EST VENU CHEZ CE COMMERÇANT et l'onglet qu'on
              regarde s'appelle « À essayer » : il a annoncé ce qu'il ouvre.

              C'EST EXACTEMENT CE POUR QUOI `ouvrirSur` EXISTE — « un bouton
              qui ouvre autre chose que ce qu'il annonce est la promesse la plus
              concrète qu'un écran puisse rompre ». Le mur n'est pas perdu : la
              croix du parcours d'essai y mène, et les photos des clientes ont
              leur propre section plus bas. */}
          {/* ═══ LA VITRINE D'ABORD, L'ATELIER ENSUITE ═════════════════════

              « Le design n'a rien à voir avec le design que je t'ai donné. »

              LA PAGE MONTAIT `MurContenu` TEL QUEL : on obtenait l'écran du
              FIL, posé dans un cadre sombre, au milieu d'une page de commerce.
              Ses trois maquettes ne montrent pas cet écran-là. Elles montrent
              une VITRINE — un panneau rose, le fantôme avec l'outil du métier,
              une question en grand, un bouton, une bande de styles.

              LES DEUX EXISTENT, ET DANS CET ORDRE. `BlocFantome` est ce qu'on
              voit en arrivant : il donne envie et il ouvre la porte.
              `MurContenu` est ce qu'il y a derrière la porte, et il n'a pas
              changé — c'est lui qui sait cadrer, appeler le modèle, protéger
              le visage, noter le rendu et l'envoyer au salon. En réécrire une
              version « pour la page » aurait garanti qu'un jour les deux
              divergent.

              LE PASSAGE DE L'UN À L'AUTRE EST UN SEUL ÉTAT. Pas de feuille qui
              monte, pas de navigation : le bloc s'efface, l'atelier prend sa
              place au même endroit de la page, et la croix y ramène. */}
          {/* ═══ LA VITRINE EST LA PORTE DE TOUS LES MÉTIERS ═════════════════

              « Il y a certains métiers qui n'ont pas leur fantôme, comme le
              boucher ou les restaurants, magasin de vêtements, bars… pourtant
              je t'ai bien mis les fantômes. »

              LES MASCOTTES ÉTAIENT LÀ, LE BLOC NE L'ÉTAIT PAS. Cette ligne
              disait `onEssaie && …` : seuls les métiers qui essaient sur photo
              voyaient la vitrine. Un restaurant, un bar, un boucher tombaient
              directement sur le parcours du plat ou sur le mur de présence — et
              n'avaient donc ni fantôme, ni question, ni bouton. C'était un
              verrou que j'avais posé, pas un fichier qui manquait.

              TOUS L'ONT MAINTENANT, ET CE QU'IL ANNONCE RESTE VRAI. Voir
              `QuoiEssayer` : la question et le geste suivent ce qu'il y a
              derrière — un essayage, un avant-goût, ou le mur. */}
          {!essaiOuvert ? (
            <BlocFantome
              mur={murDuLieu}
              /* L'ORDRE EST CELUI DE LA VÉRITÉ, PAS CELUI DES ARRIVÉES. La
                 soirée passe devant l'Avant-goût, qui passe devant le mur —
                 c'est le même ordre que dans `MurContenu`, et il doit l'être :
                 la vitrine annonce ce que la porte ouvre. Deux ordres
                 différents donneraient un bouton qui promet un parcours et
                 ouvre un mur. */
              quoi={
                onEssaie
                  ? "essai"
                  : murDuLieu.soiree
                    ? "soiree"
                    : murDuLieu.gout
                      ? "gout"
                      : "mur"
              }
              onPhoto={() => setEssaiOuvert(true)}
              onImporter={() => setEssaiOuvert(true)}
              /* « SURPRENDS-MOI » OUVRE LE MÊME ATELIER, AVEC UNE INTENTION.
                 Il faut une photo avant de pouvoir poser quoi que ce soit ; on
                 part donc sur la prise de vue comme le grand bouton, et c'est à
                 sa validation que le parcours bifurque vers la recherche plutôt
                 que vers la grille. Voir `surprendre` dans `MurContenu`. */
              onSurprise={() => {
                setSurprendre(true);
                setEssaiOuvert(true);
              }}
              onStyle={(id) => {
                setStyleChoisi(id);
                setEssaiOuvert(true);
              }}
              styleChoisi={styleChoisi}
            />
          ) : (
            <MurContenu
              key={c.id}
              mur={murDuLieu}
              ouvrirSur={onEssaie ? "depot" : undefined}
              surprendre={surprendre}
              /* CE QU'ON A DÉSIGNÉ DANS LA VITRINE ARRIVE JUSQU'À L'ATELIER.
                 La page gardait ce choix pour elle : on appuyait sur une pièce
                 et l'atelier s'ouvrait sur la grille, c'est-à-dire devant le
                 choix qu'on venait de faire. */
              piecePrechoisie={styleChoisi}
              /**
               * LE DERNIER GESTE DE L'AVANT-GOÛT MÈNE À L'OFFRE DU JOUR.
               *
               * SANS LUI, LE PARCOURS FINISSAIT SUR RIEN. `EcranGout` ne
               * dessine son bouton final que si on lui donne quelque chose à
               * faire ; la page ne lui donnait rien, donc on jouait cinq écrans
               * pour arriver devant un récapitulatif sans issue. C'est le
               * défaut le plus cher qu'un parcours puisse avoir : il n'échoue
               * pas, il s'arrête.
               *
               * ET IL MÈNE OÙ LE MOT PROMET. « Gardez-la-moi » chez le boucher,
               * « Réserver » chez le restaurant : les deux sont écrits sur
               * l'offre du jour, quelques sections plus bas, avec ce qu'il
               * reste et l'heure de service. On y emmène plutôt que d'ouvrir un
               * second chemin qui dirait la même chose autrement.
               */
              onReserver={() => allerA("aujourdhui")}
              /**
               * ═══ « EN PARLER AVEC MES AMIS » OUVRE UN VRAI SALON ═══════════
               *
               * « Ça devrait conduire sur un salon de discussion sur l'app. »
               *
               * IL RETOMBAIT SUR LA FEUILLE DE PARTAGE DU TÉLÉPHONE, parce que
               * cette page n'a pas la mécanique du fil — elle n'a pas de paquet
               * de cartes, donc pas de « carte du dessus » à laquelle accrocher
               * une conversation. Envoyer le rendu par SMS n'est pas la même
               * chose que l'ouvrir dans ClikMe : l'un sort de l'app, l'autre y
               * fait entrer ses amis.
               *
               * ON ÉCRIT DONC LE SALON ICI, ET ON Y EMMÈNE. `ouvrirSalon` le
               * crée s'il n'existe pas — la clé est le commerce plus la pièce,
               * donc deux personnes qui essaient la même veste se retrouvent au
               * même endroit — `ecrireDansSalon` y pose le rendu et la note, et
               * `/autour-de-moi?salon=` l'ouvre sur sa page. C'est le MÊME
               * salon que celui de l'annonce, jamais un second.
               */
              onSalon={(o) => {
                const cle = `essai-${c.id}-${o.quoi}`;
                ouvrirSalon({
                  cle,
                  sujet: o.quoi,
                  ou: c.nom,
                  parQui: monPrenom() || "Vous",
                  quand: "Aujourd’hui",
                  annonce: o.quoi,
                  prix: o.prix,
                  distance: c.distance,
                  photo: o.image,
                });
                ecrireDansSalon(cle, {
                  qui: monPrenom() || "Vous",
                  voix: "moi",
                  texte: o.note
                    ? `J’ai essayé « ${o.quoi} »${o.prix ? ` (${o.prix})` : ""} sur moi. Je mets ${o.note}/5 — vous en pensez quoi ?`
                    : `J’ai essayé « ${o.quoi} »${o.prix ? ` (${o.prix})` : ""} sur moi. Ça me va ou pas ?`,
                  quand: heureCourte(),
                  photo: o.image,
                });
                window.location.href = `/autour-de-moi?salon=${encodeURIComponent(cle)}`;
              }}
            />
          )}
        </div>
      </section>


      <section className="bq-s" id="aujourdhui">
        <Chapitre
          n={2}
          sur={CHAPITRES}
          titre={
            enCours.length
              ? "En ce moment"
              : aVenir.length
                ? "Ce qui arrive"
                : "Rien d’annoncé aujourd’hui"
          }
          dit="Ce qui se passe ici à cette heure-ci. C’est la seule chose qui ne sera plus vraie demain."
        />

        {!c.moments.length && (
          <p className="bq-vide">
            Ce commerce n’a rien publié ce matin. Sa page reste ouverte&nbsp;: sa carte, ses
            horaires et le chemin sont plus bas.
          </p>
        )}

        <ol className="bq-mom">
          {c.moments.map((m) => {
            const etat = etatDuMoment(m, heure);
            return (
              <li key={m.titre} className={`bq-m ${etat}`}>
                {m.photo && (
                  <div className="bq-m-p">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt="" />
                  </div>
                )}
                <div className="bq-m-c">
                  <div className="bq-m-h">
                    <b>{m.quand}</b>
                    {etat === "en-cours" && <span className="bq-pt">en ce moment</span>}
                    {m.etiquette && <span className="bq-eti">{m.etiquette}</span>}
                    {m.offert && <span className="bq-off">offert</span>}
                  </div>
                  <div className="bq-m-t">
                    <i aria-hidden="true">{m.icone}</i>
                    {m.titre}
                  </div>
                  {/* LE CONSEIL PREND LA PLACE DU DETAIL, il ne s'y ajoute
                      pas — meme regle que sur la carte du fil. Une voix qui
                      choisit a votre place vaut mieux qu'une ligne de plus. */}
                  {m.conseil ? (
                    <p className="bq-m-cs">
                      «&nbsp;{m.conseil}&nbsp;»
                      {c.voix?.prenom ? <s> — {c.voix.prenom}</s> : null}
                    </p>
                  ) : (
                    m.lignes?.length ? (
                      <ul className="bq-m-l">
                        {m.lignes.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ) : null
                  )}
                  <div className="bq-m-b">
                    {/* LA TYPO D'AFFICHE EST FAITE POUR « 11 € », PAS POUR
                        « a partir de 12 € ». Au-dela de sept signes elle occupe
                        la moitie de la ligne et crie plus fort que le titre du
                        moment — or ce qu'on lit d'abord doit rester ce qu'on
                        propose, pas son prix. */}
                    {m.prix && (
                      <span className={`bq-prix${m.prix.length > 7 ? " long" : ""}`}>{m.prix}</span>
                    )}
                    {typeof m.places === "number" && etat !== "passe" && (
                      <span className="bq-pl">
                        {m.places} place{m.places > 1 ? "s" : ""}
                      </span>
                    )}
                    {/* LE GESTE N'EXISTE QUE TANT QUE LA CHOSE EST VRAIE. Un
                        bouton « Reserver » sous un moment termine depuis deux
                        heures est un bouton qui ment, et c'est celui-la qu'on
                        appuie en premier. */}
                    {m.action && etat !== "passe" && (
                      <button type="button" className="bq-act">
                        {m.action}
                      </button>
                    )}
                    {etat === "passe" && <span className="bq-fini">terminé</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ─── SA CARTE ───
          LE SEUL ENDROIT DU PRODUIT OU LE CATALOGUE A LE DROIT D'ETRE UNE
          SECTION. Partout ailleurs il est « un bouton discret sous l'annonce,
          jamais une section, jamais un onglet » — parce qu'un catalogue est
          plus facile a remplir que du present, et que le produit s'y
          dissoudrait. Ici on est sur la page de la boutique : c'est ce qu'on
          vient chercher. La doctrine tient quand meme, et c'est l'ORDRE qui la
          tient — le present est passe avant. */}
      {rayons.length > 0 && (
        <section className="bq-s" id="carte">
          {/* PAS D'EMOJI ICI, ALORS QUE `motCatalogue` EN FOURNIT UN. Les
              quatre autres intitules de section n'en portent pas ; celui-la
              seul en aurait eu un, et un livre ouvert au-dessus des seances
              d'un hypnotherapeute dit de surcroit autre chose que ce qu'il y a
              dessous. Un intitule est une etiquette, pas un emplacement
              d'icone. */}
          <Chapitre
            n={3}
            sur={CHAPITRES}
            titre={mots.titre}
            dit="Ce qu’on trouve ici tous les jours, et pas seulement aujourd’hui."
          />
          {rayons.map(([rayon, articles]) => (
            <div className="bq-ray" key={rayon || "sans-rayon"}>
              {rayon && <div className="bq-ray-t">{rayon}</div>}
              <ul className="bq-art">
                {articles.map((a) => (
                  <li key={a.id}>
                    {/* LA VIGNETTE EXISTE MEME SANS PHOTO, ET C'EST VOLONTAIRE.
                        La plupart des articles n'en auront jamais — on ne va pas
                        demander une photo par ligne de carte a un restaurateur.
                        Sans emplacement reserve, les lignes photographiees sont
                        decalees et les autres collees au bord : la colonne
                        zigzague, et une carte qui zigzague se lit comme une
                        faute de mise en page. Un carre sourd tient le rang. */}
                    {a.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photo} alt="" />
                    ) : (
                      <span className="bq-art-v" aria-hidden="true" />
                    )}
                    <div>
                      <b>{a.nom}</b>
                      {a.detail && <span>{a.detail}</span>}
                    </div>
                    {a.prix && <em>{a.prix}</em>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ═══ LE GESTE, ET SON VERBE EST CELUI DU MÉTIER ════════════════════

          « La conversion : le CTA dépend du métier — Réserver · Mettre de côté ·
          Voir en boutique · Commander · Appeler · Y aller. »

          IL N'Y EN AVAIT PAS. La page montrait l'essai, le présent, le
          catalogue, l'histoire, les avis et les horaires — et ne demandait
          jamais rien. On pouvait la lire en entier sans rencontrer un seul
          geste qui engage, ce qui est la définition d'une vitrine.

          ELLE EST ICI, ENTRE L'OFFRE ET LA RÉASSURANCE, et pas en bas de page.
          On vient de lire ce qu'il vend ; la preuve sociale et les horaires
          servent à ceux qui hésitent ENCORE, pas à ceux qui sont déjà décidés.
          Les faire défiler jusqu'au pied pour trouver le bouton, c'est leur
          faire relire des arguments dont ils n'ont plus besoin.

          LE VERBE VIENT DE `Personnalite.reserver` — le même fichier que le
          bouton de l'annonce, donc le même mot au même endroit du parcours. On
          ne réserve pas un plat dans un bar, on ne prend pas rendez-vous chez
          une fleuriste, et « Réserver » tout court ne dit pas ce qui va se
          passer. */}
      {/* ═══ LA RANGÉE DE RÉASSURANCE, TELLE QU'ELLE EST DESSINÉE ══════════

          Ses trois maquettes finissent toutes par la même rangée de cartes
          roses : « Prenez rendez-vous · en ligne en quelques clics », « Nos
          clientes nous adorent · ★ 4,9 (112 avis) », « 12 rue Saint-Pierre ·
          Dax ». Chez le boucher elles sont quatre, avec « Appeler ».

          ELLE REMPLACE LA BANDE VERTE, et ce n'est pas qu'une question de
          couleur. La bande faisait un grand bouton plein pleine largeur —
          c'est le dessin du DIRECT, où l'on décide en trois secondes devant une
          offre qui expire. Ici on est au bas d'une vitrine qu'on vient de
          parcourir : on ne pousse pas, on RANGE les quatre chemins possibles
          côte à côte et on laisse choisir.

          LE VERBE DU MÉTIER RESTE SUR LA PREMIÈRE — « Réserver une table »,
          « Mettre de côté », « Prendre rendez-vous ». Voir `Personnalite`. */}
      <section className="bq-fin" aria-label="Aller plus loin">
        <ul className="bq-fin-l">
          <li>
            <button type="button" onClick={() => allerA("essayer")}>
              <i aria-hidden="true">📅</i>
              <b>{langage.reserver}</b>
              <em>En quelques secondes</em>
              <s aria-hidden="true">→</s>
            </button>
          </li>
          {c.google && (
            <li>
              <button type="button" onClick={() => allerA("avis")}>
                <i aria-hidden="true">👥</i>
                <b>On en parle bien</b>
                <em>
                  ★ {c.google.note} ({c.google.avis} avis)
                </em>
                <s aria-hidden="true">→</s>
              </button>
            </li>
          )}
          <li>
            <a href={c.itineraire} target="_blank" rel="noreferrer">
              <i aria-hidden="true">📍</i>
              <b>Nous trouver</b>
              <em>
                {c.fiche.ou || c.ville} · {c.distance}
              </em>
              <s aria-hidden="true">→</s>
            </a>
          </li>
          {/* APPELER N'APPARAIT QUE S'IL A DÉCLARÉ UN NUMÉRO. Le numéro de
              fiction sert à écrire une démonstration, pas à faire composer un
              vrai téléphone à quelqu'un qui appuierait pour de bon. */}
          {c.telephone && (
            <li>
              <a href={`tel:${c.telephone.replace(/\s+/g, "")}`}>
                <i aria-hidden="true">📞</i>
                <b>Appeler</b>
                <em>{c.telephone}</em>
                <s aria-hidden="true">→</s>
              </a>
            </li>
          )}
        </ul>
      </section>

      {/* ─── QUI C'EST ───
          LA SIGNATURE EST LA REPONSE PERMANENTE a « pourquoi chez lui plutot
          qu'en grande surface » — celle qu'un artisan sait dire en trois mots
          et n'ecrit nulle part. Elle ne change jamais, donc elle ne coute rien
          a entretenir, et c'est le seul texte de cette page qu'aucune fiche
          Google ne contient. */}
      {(c.voix || c.fiche.mot) && (
        <section className="bq-s alt" id="qui">
          <Chapitre
            n={4}
            sur={CHAPITRES}
            titre="Qui vous recevra"
            dit="Une personne, pas une enseigne. C’est elle que vous verrez en poussant la porte."
          />
          {/* ─── LE ROND S'OUVRE, ET IL FALLAIT QU'IL LE FASSE ───
              Dans le pli, toucher le rond ouvrait la vidéo par-dessus l'écran
              avec le son : « le son existe, mais sur appui ». Le bloc a
              déménagé ici, et le geste serait mort avec le déménagement si on
              n'avait rien fait — on aurait retiré une fonction en croyant
              ranger une page.
              PAS DE FEUILLE PAR-DESSUS ICI, ET C'EST LA DIFFÉRENCE ENTRE LES
              DEUX ÉCRANS. Dans un paquet qu'on balaie, on ne quitte pas la
              pile : il faut recouvrir. Sur une page, le rond peut simplement
              s'agrandir sur place — un écran de moins pour le même geste.
              MUET AU DÉPART, TOUJOURS. Le son qui démarre tout seul dans une
              file d'attente est la façon la plus rapide de faire fermer une
              application. */}
          <div className={`bq-voix${voixOuverte ? " ouverte" : ""}`}>
            <div className="bq-voix-r">
              {c.voix?.video ? (
                <button
                  type="button"
                  className={`bq-voix-t${voixOuverte ? " on" : ""}`}
                  aria-label={
                    voixOuverte
                      ? "Refermer la vidéo"
                      : `Voir et entendre ${c.voix.prenom}`
                  }
                  aria-pressed={voixOuverte}
                  onClick={() => setVoixOuverte((v) => !v)}
                >
                  <video
                    key={c.id}
                    poster={c.voix.video.affiche}
                    muted={!voixOuverte}
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  >
                    {c.voix.video.webm && <source src={c.voix.video.webm} type="video/webm" />}
                    <source src={c.voix.video.mp4} type="video/mp4" />
                  </video>
                  <i aria-hidden="true">{voixOuverte ? "▾" : "🔊"}</i>
                </button>
              ) : (
                <span>{(c.voix?.prenom || c.nom).slice(0, 1)}</span>
              )}
            </div>
            <div className="bq-voix-c">
              {c.voix?.prenom && (
                <div className="bq-voix-n">
                  {c.voix.prenom}
                  {c.voix.role ? <s>, {c.voix.role}</s> : null}
                </div>
              )}
              {/* L'ESPACE INSECABLE AVANT LE GUILLEMET FERMANT est la regle
                  typographique francaise, et elle a ici un effet mesurable :
                  sans elle le guillemet tombait seul sur une ligne a lui. */}
              {c.voix?.signature && <p className="bq-sig">«&nbsp;{c.voix.signature}&nbsp;»</p>}
              {c.fiche.mot && <p className="bq-mot">{c.fiche.mot}</p>}
            </div>
          </div>

          {/* SES PHOTOS SONT LEGENDEES, et ce n'est pas de la decoration :
              « la salle » et « un autre jour » ne disent pas la meme chose
              qu'une bande d'images. Sans legende on ne sait pas si le plat
              qu'on voit est servi AUJOURD'HUI — exactement la confusion qu'une
              carte du jour existe pour eviter. */}
          {c.sesPhotos && c.sesPhotos.length > 0 && (
            <div className="bq-gal">
              {c.sesPhotos.map((p) => (
                <figure key={p.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.quoi} />
                  <figcaption>{p.quoi}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── CE QU'ILS EN DISENT ───
          LES AVIS SEMES SUR LES MOMENTS, remontes ici. Ils ne remplacent pas la
          note Google, qui est un chiffre declare et reste dans le bandeau : ils
          disent AUTRE CHOSE, qui est ce que quelqu'un a mange precisement, un
          jour precis. Deux natures de preuve, jamais melangees — melanger une
          vitrine et un temoignage est ce qui rend les avis illisibles ailleurs. */}
      {/* UNE SEULE SECTION POUR LES DEUX PREUVES, ET C'EST LA LEÇON QU'ON VIENT
          D'APPRENDRE. Le mur montre les photos, les avis donnent les mots — mais
          ce sont LES MÊMES AVIS. Deux sections auraient affiché deux fois la
          photo de Camille à quinze centimètres d'écart, c'est-à-dire le doublon
          exact qu'on vient de retirer du pli. Les vignettes ont donc quitté les
          cartes d'avis : l'image est en haut, une fois, datée et signée.
          LE VIDE EST DIT, PAS CACHÉ. C'est le démarrage à froid : tant que
          personne n'a photographié il n'y a rien, et l'écrire est ce qui donne
          envie d'être le premier. */}
      {(mur.length > 0 || avis.length > 0) && (
        <section className="bq-s" id="avis">
          <Chapitre
            n={5}
            sur={CHAPITRES}
            titre={mur.some((ph) => duJour(ph.quand)) ? "Vu chez eux aujourd’hui" : "Vu chez eux"}
            dit="Des photos et des mots laissés par des gens qui y sont allés. Rien n’est écrit par le commerce."
          />

          {mur.length > 0 ? (
            <div className="bq-vu">
              {mur.map((ph, n) => (
                <figure key={`${ph.src}-${n}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.src} alt={`Chez ${c.nom}, photo de ${ph.qui}`} loading="lazy" />
                  <figcaption>
                    <b>📸 {ph.qui}</b>
                    <em className={duJour(ph.quand) ? "jour" : ""}>{ph.quand}</em>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="bq-vu-vide">
              <i aria-hidden="true">📷</i>
              Personne n’a encore photographié ce qui a été servi ici.
            </div>
          )}

          {avis.length > 0 && (
            <>
              <div className="bq-note">
                <b>{note1(moyenneAvis(avis))}</b>
                <div>
                  <Etoiles note={moyenneAvis(avis)} />
                  <span>
                    {avis.length} avis laissés ici
                    {c.google ? ` · ${c.google.note} sur Google (${c.google.avis})` : ""}
                  </span>
                </div>
              </div>
              <ul className="bq-avis">
                {avis.slice(0, 4).map((a, i) => (
                  <li key={`${a.qui}-${i}`}>
                    <p>«&nbsp;{a.texte}&nbsp;»</p>
                    <span>
                      <Etoiles note={a.note} /> {a.qui} · {a.quand}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* ─── CE QUI REVIENT ───
          Voir le point 3 en tete de fichier. Deduit, jamais declare, et absent
          des que l'historique est trop court pour qu'on ait le droit d'en
          parler — `ceQuiRevient` exige trois occurrences avant de nommer une
          habitude, et deux tiers du meme jour avant de nommer un jour. */}
      {habitudes.length > 0 && (
        <section className="bq-s alt" id="revient">
          <Chapitre
            n={6}
            sur={CHAPITRES}
            titre={c.voix?.prenom ? `Ce qui revient chez ${c.voix.prenom}` : "Ce qui revient ici"}
            dit="Son rythme, déduit du mois dernier. Utile pour savoir quand revenir."
          />
          {/* PAS DE PRONOM, ET CE N'EST PAS UN DÉTAIL DE STYLE. Le produit ne
              connaît pas le genre du commerçant — il connaît un prénom quand il
              y en a un, et rien d'autre. « Ce qu'il a publié » écrit sous le nom
              d'une cuisinière est une faute que le lecteur voit tout de suite,
              et elle se répète sur la moitié des quatorze fiches. */}
          {/* LE TITRE ET LA PHRASE SONT MONTES DANS LE CHAPITRE. Les laisser
              ici les aurait ecrits deux fois a dix points d'ecart — c'est
              exactement ce qui donnait l'impression d'un flux sans reperes. Ce
              qui reste est la seule chose que le chapitre ne dit pas : que
              c'est une DEDUCTION, et pas une promesse du commercant. */}
          <p className="bq-int">
            Ce n’est pas une promesse&nbsp;: c’est ce qu’on a vu passer.
          </p>
          <ul className="bq-hab">
            {habitudes.map((h) => {
              /* SA MEILLEURE RÉPONSE N'EST PAS UNE ARCHIVE, C'EST UN MESSAGE.
                 Le geste existait dans le pli et il descend avec le bloc — sans
                 lui, « ce qui revient » ne serait qu'une statistique, et une
                 statistique ne se touche pas.
                 ICI C'EST UN LIEN, PLUS UNE FEUILLE. Dans le paquet il fallait
                 une feuille par-dessus : on ne quitte pas une pile qu'on
                 balaie. Sur une page, WhatsApp s'ouvre directement — un écran
                 de moins pour le même geste.
                 ET C'EST UNE QUESTION, PAS UNE COMMANDE. « Je prends la
                 garbure » engage le commerçant sur une chose qui n'existe
                 peut-être plus et le met en faute de ne pas l'avoir. */
              const ecrire = commentPrevenir({
                telephone: c.telephone || numeroDeFiction(c.id),
                quoi: h.titre.toLowerCase(),
                demande: true,
              });
              return (
                <li key={h.titre}>
                  <b>{h.titre}</b>
                  <span>{phraseHabitude(h)}</span>
                  {h.prix && <em>{h.prix}</em>}
                  <a className="bq-hab-b" href={ecrire.whatsapp} target="_blank" rel="noreferrer">
                    En redemander
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── LE PRATIQUE ───
          Il vient tard EXPRES. C'est ce qu'on cherche quand on a deja decide,
          donc ce qu'on cherche en descendant — le mettre en haut reviendrait a
          dire que cette page est un horaire d'ouverture. */}
      <section className="bq-s alt" id="infos">
        <Chapitre
          n={7}
          sur={CHAPITRES}
          titre="Y aller"
          dit="L’adresse, les horaires, et de quoi le prévenir avant de passer."
        />
        <dl className="bq-inf">
          <div>
            <dt>L’adresse</dt>
            <dd>
              {c.fiche.ou}
              <s>
                {c.ville} · {c.distance}
              </s>
            </dd>
          </div>
          <div>
            <dt>Les horaires</dt>
            <dd>{c.fiche.horaires}</dd>
          </div>
          {/* IL RECRUTE — descendu du pli, et c'est ici qu'il tient.
              Une recherche de bras dure trois semaines : elle ne dépend pas du
              jour, donc elle n'avait rien à faire dans un paquet trié par ordre
              de disparition. Elle est en revanche exactement ce qu'on veut
              trouver sur la page permanente d'un commerce. */}
          {c.recrute && (
            <div>
              <dt>Il recrute</dt>
              <dd>
                {c.recrute.poste}
                <s>
                  {c.recrute.contrat} · {c.recrute.paye}
                  <br />
                  Passez {c.recrute.passez}
                </s>
              </dd>
            </div>
          )}
          {c.site && (
            <div>
              <dt>Son site</dt>
              {/* AFFICHE, PAS CLIQUABLE — les commerces d'ici sont inventes, et
                  un domaine invente qui existerait vraiment enverrait un
                  testeur chez un inconnu. Meme regle que dans le fil. */}
              <dd>{c.site}</dd>
            </div>
          )}
        </dl>
        <div className="bq-y">
          <a className="bq-y-p" href={c.itineraire} target="_blank" rel="noreferrer">
            Itinéraire<i aria-hidden="true">→</i>
          </a>
          <button type="button" className="bq-y-s">
            Le prévenir
          </button>
        </div>
      </section>

      {/* ─── SES HABITUES ───
          PAR COMMERCE, JAMAIS GLOBAL, et c'est la difference entre un
          attachement et une competition. Un classement de ville designerait des
          derniers et se ferait jouer ; chez un commercant il n'y a pas de
          perdant, il y a ceux qui viennent souvent et les autres. Prenom et
          initiale, jamais plus : ce sont des voisins, pas des comptes. */}
      {c.pouces && c.pouces.length > 0 && (
        <section className="bq-s" id="habitues">
          <Chapitre
            n={8}
            sur={CHAPITRES}
            titre="Ceux qui le font connaître"
            dit="Les habitants qui l’ont proposé à leurs amis. C’est ce qui remplit une salle, pas la publicité."
          />
          <ul className="bq-po">
            {c.pouces.map((p) => (
              <li key={p.qui}>
                <span aria-hidden="true">{p.qui.slice(0, 1)}</span>
                <b>{p.qui}</b>
                <em>{p.combien}×</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── LA PORTE VERS LA VILLE ───
          C'EST LE BLOC LE PLUS IMPORTANT DE LA PAGE, et il est en bas.
          Une page de commercant qui vit dans le site de sa ville transforme
          chaque lien qu'il diffuse — son sac, sa vitrine, sa carte de visite —
          en une entree vers le catalogue. C'est le seul moteur d'acquisition du
          produit qui ne coute rien : il ne demande au commercant que de faire
          ce qu'il faisait deja, donner son adresse.
          IL SE RETIRE AVEC LUI. `collectif_actif` existe deja cote production :
          un commercant qui sort du collectif perd cette porte, et sa page
          reste. C'est le bon equilibre, et il doit lui etre dit clairement. */}
      <Link className="bq-porte" href="/autour-de-moi" prefetch={false}>
        <span className="bq-porte-t">
          <span className="bq-porte-k">Le reste de {c.ville}</span>
          <b>Ce qui se passe en ce moment, à côté</b>
        </span>
        <i aria-hidden="true">→</i>
      </Link>

      {/* ═══ LA DERNIÈRE PHRASE EST DE SA MAIN ═══════════════════════════════

          « Plus qu'une manucure, un moment pour vous ♡ » · « De belles viandes,
          de bons moments ♡ » · « Des femmes, des styles, une même confiance ♡ »

          LES TROIS MAQUETTES FINISSENT DESSUS, entre deux filets. Ce n'est pas
          une mention : c'est ce que le commerçant a envie qu'on retienne, et
          c'est la seule chose de toute la page qu'aucune fiche d'annuaire ne
          contiendra jamais.

          ELLE NE S'INVENTE PAS. Sans signature déclarée, le pied se réduit à
          l'aveu de maquette — écrire une devise à la place de quelqu'un est
          exactement ce qu'un produit local ne doit pas faire. */}
      {c.voix?.signature && (
        <p className="bq-sign">
          <i aria-hidden="true" />
          <span>{c.voix.signature} ♡</span>
          <i aria-hidden="true" />
        </p>
      )}

      <footer className="bq-pied">
        Maquette&nbsp;: ce commerce est inventé, ses photos sont des illustrations. Rien n’est
        publié, rien n’est réservable.
      </footer>
    </div>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */

        /* ─── ELLE DEFILE, ET C'EST TOUT LE POINT ───
           Le deck verrouille html et body : un paquet qu'on balaie ne defile
           pas. Une page defile. C'est la seule chose ici qui ne doit surtout
           pas imiter le fil, et il faut donc DEFAIRE le verrou pose par la
           feuille du deck si les deux se croisent un jour. */
        html:has(.bq),body:has(.bq){height:auto;overflow:visible;margin:0;
          background:#FFFFFF;overscroll-behavior-y:none;}

        /* ═══ LA PAGE COMMERCANT EST CLAIRE, ET C'EST LA MAQUETTE QUI LE DIT ══
           « Le design n'a rien a voir avec le design que je t'ai donne. Il faut
           que ce soit absolument identique. »

           ELLE ETAIT SOMBRE PARCE QUE LE FIL L'EST, et c'etait le raisonnement
           faux. Le fil est sombre parce qu'on le regarde comme une vitrine la
           nuit : des cartes lumineuses sur du noir. Une page de commercant est
           une BOUTIQUE — on y entre, il y fait clair, et ses trois maquettes
           sont toutes les trois sur fond blanc.

           LES NOMS DES VARIABLES NE CHANGENT PAS. L'encre reste l'encre, le
           pale reste le texte secondaire : seules leurs valeurs
           s'inversent. Renommer aurait demande de reecrire six cents lignes de
           feuille pour le meme resultat, et d'en oublier trois. */
        .bq{--bq-fond:#FFFFFF;--bq-encre:#151B33;--bq-pale:#6E7690;
          --bq-menthe:#E8267F;--bq-ambre:#E08600;--bq-ligne:rgba(20,16,40,.09);
          --bq-carte:#FBF8FC;
          --bq-rose:#FFF3F8;--bq-doux:#F7F3FF;
          background:#FFFFFF;
          color:var(--bq-encre);font-family:'Inter',system-ui,-apple-system,sans-serif;
          max-width:560px;margin:0 auto;min-height:100vh;
          padding-bottom:calc(28px + env(safe-area-inset-bottom));
          -webkit-font-smoothing:antialiased;}
        .bq *{box-sizing:border-box;}

        /* ─── LE SELECTEUR DE MAQUETTE ───
           Volontairement moche et volontairement en haut : il ne doit jamais
           passer pour un element du produit. Il disparait a l'atterrissage. */
        .bq-maq{background:#0B1218;border-bottom:1px solid var(--bq-ligne);
          padding:calc(7px + env(safe-area-inset-top)) 10px 8px;}
        .bq-maq-l{display:block;font-size:9.5px;font-weight:800;letter-spacing:.14em;
          text-transform:uppercase;color:#6F8A7C;margin-bottom:6px;}
        .bq-maq-c{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
          -webkit-overflow-scrolling:touch;}
        .bq-maq-c::-webkit-scrollbar{display:none;}
        .bq-maq-c button{flex:none;font-family:inherit;font-size:11.5px;font-weight:700;
          border:1px solid var(--bq-ligne);background:transparent;color:#9FB3A7;
          border-radius:20px;padding:6px 11px;white-space:nowrap;cursor:pointer;}
        .bq-maq-c button.on{background:var(--bq-menthe);color:#FFFFFF;border-color:transparent;}

        /* ─── LE BANDEAU ───
           Il se pose SUR la photo, jamais au-dessus d'elle : une barre pleine
           serait une bordure de plus entre l'oeil et l'image, et c'est le
           reproche exact qui a fait sortir les deux bandeaux du flux dans le
           deck. */
        .bq-tete{position:absolute;top:0;left:0;right:0;z-index:4;
          display:flex;align-items:center;justify-content:space-between;
          padding:12px 12px 22px;
          background:linear-gradient(180deg,rgba(4,8,6,.72) 0%,rgba(4,8,6,0) 100%);}
        /* ═══ LA BARRE DU HAUT : DES PASTILLES RONDES SUR LA PHOTO ═════════
           Voir le composant. Elles sont translucides et floutees : posees en
           aplat, elles decoupent des trous dans l'image ; transparentes, elles
           disparaissent sur un fond clair. */
        .bq-tete-g,.bq-tete-d{display:flex;align-items:center;gap:8px;}
        .bq-rond{width:38px;height:38px;flex:none;border-radius:50%;
          display:inline-flex;align-items:center;justify-content:center;
          text-decoration:none;cursor:pointer;font-family:inherit;
          color:#FFFFFF;background:rgba(18,14,32,.34);
          border:1px solid rgba(255,255,255,.26);
          backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
        .bq-rond i{font-style:normal;font-size:16px;line-height:1;}
        .bq-rond svg{width:17px;height:17px;fill:none;stroke:currentColor;
          stroke-width:1.9;stroke-linecap:round;}
        .bq-rond:active{transform:scale(.94);}
        /* LE COEUR PLEIN PORTE SON COMPTE, comme la poche de l'accueil : un
           coeur qui change de couleur dit qu'il s'est passe quelque chose, un
           coeur qui compte dit COMBIEN, et c'est ce qui fait qu'on l'ouvre. */
        .bq-rond{position:relative;}
        .bq-rond.plein{border-color:rgba(240,38,155,.7);
          background:rgba(240,38,155,.2);}
        .bq-rond s{position:absolute;top:-3px;right:-3px;min-width:17px;
          height:17px;padding:0 4px;border-radius:999px;display:grid;
          place-items:center;text-decoration:none;font-size:10px;
          font-weight:900;color:#fff;background:#F0269B;
          border:2px solid rgba(12,10,22,.9);}

        /* ═══ LE TIROIR DES PIECES MISES DE COTE ═══════════════════════════

           IL S'OUVRE SOUS LE COEUR, la ou le coeur vient d'arriver. Une poche
           qu'on ne peut ni ouvrir ni vider se remplit une fois puis ne sert
           plus — et l'envol du coeur, depuis le resultat d'essayage, devient
           un mensonge. */
        .bq-poche{position:absolute;z-index:30;top:calc(100% + 8px);right:12px;
          width:min(300px,calc(100vw - 28px));max-height:min(60vh,420px);
          overflow:auto;border-radius:18px;padding:12px;
          background:rgba(12,10,22,.96);border:1px solid rgba(255,255,255,.16);
          backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          box-shadow:0 26px 60px -22px rgba(0,0,0,.95);
          animation:bqPoche .26s cubic-bezier(.16,1,.3,1) both;}
        @keyframes bqPoche{
          from{opacity:0;transform:translateY(-8px) scale(.98);}
          to{opacity:1;transform:none;}}
        .bq-poche-v{margin:0;padding:8px 6px;font-size:12.8px;line-height:1.45;
          color:#B9C6D8;}
        .bq-poche ul{list-style:none;margin:0;padding:0;}
        .bq-poche li{display:flex;align-items:center;gap:10px;padding:8px;
          border-radius:13px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);margin-bottom:7px;
          font-size:12.5px;color:#B9C6D8;}
        .bq-poche li:last-child{margin-bottom:0;}
        .bq-poche img{flex:none;width:42px;height:52px;object-fit:cover;
          object-position:center 18%;border-radius:9px;display:block;}
        .bq-poche li>i{flex:none;display:grid;place-items:center;width:42px;
          height:52px;border-radius:9px;font-style:normal;font-size:19px;
          background:rgba(255,255,255,.06);}
        .bq-poche li span{flex:1;min-width:0;}
        .bq-poche li b{display:block;font-size:13.5px;font-weight:850;
          color:#fff;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .bq-poche li button{flex:none;width:28px;height:28px;border-radius:50%;
          display:grid;place-items:center;font:inherit;font-size:11px;
          font-weight:800;cursor:pointer;color:#8DA0B4;background:none;
          border:1px solid rgba(255,255,255,.14);}
        /* LE NOM DU PRODUIT, DANS LA LETTRE DU PRODUIT. Le « Me » porte la
           couleur : c'est le logo, et il est le meme partout. */
        .bq-marque{font-size:20px;font-weight:800;letter-spacing:-.02em;
          color:#FFFFFF;text-shadow:0 2px 12px rgba(0,0,0,.5);}
        .bq-marque b{font-weight:800;color:#FF2D8E;}

        /* ─── LA TETE DE PAGE ───
           Elle est plus haute que sur l'ancienne version parce qu'elle porte
           maintenant tout ce que la maquette y met : le nom en enseigne, la
           devise, trois faits, les etiquettes. Le panneau blanc du dessous
           remonte dessus de vingt points, ce qui la fait paraitre plus courte
           qu'elle ne l'est — c'est le dessin des trois maquettes. */
        .bq-hero{position:relative;height:376px;overflow:hidden;}
        .bq-hero img{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-hero-vide{width:100%;height:100%;
          background:linear-gradient(160deg,#E9DCEF,#F6EEF6);}
        .bq-hero-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(14,8,24,.42) 0%,rgba(14,8,24,.08) 26%,
            rgba(14,8,24,.42) 62%,rgba(14,8,24,.78) 100%);}
        .bq-hero-c{position:absolute;left:16px;right:16px;bottom:34px;z-index:2;}

        /* ═══ LE NOM EN ENSEIGNE ═══════════════════════════════════════════
           Un serif tres contraste, en casse normale. C'est la premiere chose
           qu'on voit de la page, et c'est elle qui fait la difference entre
           une fiche d'annuaire et une devanture. Voir la fonte d'enseigne dans
           layout.tsx pour pourquoi cette lettre-la. */
        .bq-hero-c h1{margin:0;font-family:var(--font-enseigne),Georgia,serif;
          font-size:clamp(30px,8.4vw,38px);font-weight:500;line-height:1.04;
          letter-spacing:-.01em;color:#FFFFFF;
          text-shadow:0 2px 20px rgba(0,0,0,.6);}
        .bq-metier{margin:5px 0 0;font-size:13px;font-weight:600;color:#E4DCEC;
          text-shadow:0 1px 10px rgba(0,0,0,.8);}
        /* LA DEVISE, DE LA MAIN DU COMMERCANT. Voir le composant : elle ne
           s'invente pas quand elle manque. */
        .bq-devise{margin:6px 0 0;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:19px;line-height:1.15;color:#FFFFFF;
          text-shadow:0 2px 14px rgba(0,0,0,.7);}
        .bq-devise i{font-style:normal;color:#FF8FC4;}

        /* ─── LES TROIS FAITS, UN PAR LIGNE, AVEC LEUR REPERE EN COULEUR ─── */
        .bq-faits{list-style:none;margin:10px 0 0;padding:0;
          display:flex;flex-direction:column;gap:4px;}
        .bq-faits li{display:flex;align-items:center;gap:8px;
          font-size:13px;font-weight:650;color:#FFFFFF;
          text-shadow:0 1px 10px rgba(0,0,0,.85);}
        .bq-faits i{font-style:normal;font-size:13px;width:16px;text-align:center;}
        .bq-faits b{font-weight:800;}
        .bq-faits u{text-decoration:none;font-weight:600;opacity:.82;}

        .bq-tags{list-style:none;margin:11px 0 0;padding:0 0 2px;display:flex;gap:7px;
          overflow-x:auto;scrollbar-width:none;}
        .bq-tags::-webkit-scrollbar{display:none;}
        .bq-tags li{flex:none;font-size:12px;font-weight:650;color:#FFFFFF;
          padding:7px 13px;border-radius:99px;white-space:nowrap;
          background:rgba(18,14,32,.42);border:1px solid rgba(255,255,255,.28);
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}

        /* ═══ LE PANNEAU BLANC QUI CHEVAUCHE LA PHOTO ══════════════════════

           C'est le geste central des trois maquettes, et celui qui fait toute la
           difference de profondeur : la barre d'onglets n'est pas POSEE sous la
           photo, elle MONTE DESSUS, avec deux grands coins arrondis en haut.
           L'image continue derriere, et la page a l'air d'une carte glissee
           par-dessus une vitrine.

           ELLE RESTE COLLANTE EN DEFILANT. Le chevauchement est le dessin de
           l'arrivee ; une fois qu'on descend, c'est une barre de navigation
           ordinaire et elle doit rester a portee de pouce. */
        .bq-nav{position:sticky;top:0;z-index:30;
          margin-top:-26px;border-radius:26px 26px 0 0;
          background:#FFFFFF;
          box-shadow:0 -10px 30px -18px rgba(30,16,50,.5);}
        .bq-nav ul{list-style:none;margin:0;padding:0 8px;display:flex;gap:0;
          overflow-x:auto;scrollbar-width:none;}
        .bq-nav ul::-webkit-scrollbar{display:none;}
        .bq-nav li{flex:none;}
        .bq-nav button{display:inline-flex;flex-direction:column;align-items:center;
          gap:5px;cursor:pointer;
          font-family:inherit;font-size:12.5px;font-weight:700;white-space:nowrap;
          color:#8A90A6;background:none;border:none;
          padding:14px 12px 11px;border-bottom:2.5px solid transparent;
          transition:color .16s ease,border-color .16s ease;}
        .bq-nav button i{font-style:normal;font-size:16px;line-height:1;
          filter:grayscale(1);opacity:.6;transition:filter .16s ease,opacity .16s ease;}
        /* CELUI QU'ON LIT PASSE EN MAGENTA, PICTOGRAMME COMPRIS. Les autres
           sont en gris et leur pictogramme est desature : c'est ce qui fait
           qu'on voit l'onglet actif du coin de l'oeil, sans le chercher. */
        .bq-nav button.on{color:var(--bq-menthe);border-bottom-color:var(--bq-menthe);}
        .bq-nav button.on i{filter:none;opacity:1;}

        /* ═══ LA RANGEE DE REASSURANCE ═════════════════════════════════════
           Voir le composant : elle remplace la bande verte pleine largeur, qui
           etait le dessin du DIRECT pose au bas d'une vitrine. */
        .bq-fin{margin:4px 14px 26px;}
        .bq-fin-l{list-style:none;margin:0;padding:0;
          display:grid;grid-template-columns:repeat(2,1fr);gap:9px;}
        .bq-fin-l li{display:flex;}
        .bq-fin-l button,.bq-fin-l a{position:relative;flex:1;min-width:0;
          display:flex;flex-direction:column;align-items:flex-start;gap:2px;
          text-decoration:none;text-align:left;cursor:pointer;font-family:inherit;
          padding:14px 40px 14px 14px;border-radius:18px;
          background:var(--bq-rose);border:1px solid rgba(232,38,127,.1);}
        .bq-fin-l button:active,.bq-fin-l a:active{transform:scale(.98);}
        .bq-fin-l i{font-style:normal;font-size:17px;line-height:1;margin-bottom:4px;}
        .bq-fin-l b{font-size:13.5px;font-weight:800;line-height:1.2;
          color:var(--bq-encre);}
        .bq-fin-l em{font-style:normal;font-size:11.5px;line-height:1.3;
          color:var(--bq-pale);}
        /* LA FLECHE EST DANS UN ROND MAGENTA, en bas a droite de chaque carte —
           c'est le dessin des trois maquettes, et c'est ce qui dit que la carte
           entiere est un geste et pas un encart d'information. */
        .bq-fin-l s{position:absolute;right:11px;bottom:12px;text-decoration:none;
          width:26px;height:26px;border-radius:50%;
          display:inline-flex;align-items:center;justify-content:center;
          font-size:13px;color:#FFFFFF;background:var(--bq-menthe);}

        /* ═══ LA SIGNATURE DU PIED ═════════════════════════════════════════
           « Plus qu'une manucure, un moment pour vous ♡ » · « De belles
           viandes, de bons moments ♡ » · « Des femmes, des styles, une meme
           confiance ♡ ». Les trois maquettes finissent dessus, entre deux
           filets. Ce n'est pas une mention legale : c'est la derniere chose que
           le commercant dit, et elle est de sa main. */
        .bq-sign{display:flex;align-items:center;gap:14px;
          margin:8px 20px 18px;}
        .bq-sign i{flex:1;height:1px;background:rgba(20,16,40,.1);}
        .bq-sign span{font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:19px;line-height:1.2;color:#9A7FB0;text-align:center;}

        /* ─── L'ANNEAU DU METIER ───
           MEME OBJET QUE SUR LA CARTE, meme diametre, meme dessin. C'est le
           bandeau de boutique : la seule chose qui doit etre identique entre
           l'annonce et la page, et elle suffit. */
        .bq-anneau{position:absolute;right:16px;bottom:14px;z-index:2;
          width:86px;height:86px;display:flex;flex-direction:column;
          align-items:center;justify-content:center;text-align:center;}
        .bq-anneau .cd-po-c{position:absolute;inset:0;width:100%;height:100%;
          overflow:visible;pointer-events:none;}
        .bq-anneau .cd-po-h{fill:none;stroke:rgba(61,226,166,.2);stroke-width:1.5;}
        .bq-anneau .cd-po-l{fill:url(#cdPorteL);}
        .bq-anneau .cd-po-a{fill:none;stroke:url(#cdPorteG);stroke-width:4.5;
          filter:drop-shadow(0 0 6px rgba(61,226,166,.42));}
        .bq-an-t{position:relative;z-index:1;display:block;max-width:66px;
          font-size:8.5px;font-weight:900;letter-spacing:.04em;line-height:1.15;
          text-transform:uppercase;color:#D8FFEE;text-wrap:balance;
          text-shadow:0 1px 8px rgba(0,0,0,.7);}
        .bq-anneau>svg:not(.cd-po-c){position:relative;z-index:1;
          width:30px;height:30px;margin:4px 0 0;
          stroke:#F2FBF6;stroke-width:1.7;fill:none;
          stroke-linecap:round;stroke-linejoin:round;
          filter:drop-shadow(0 1px 6px rgba(0,0,0,.55));}

        /* ─── LES SECTIONS ───
           Une alternance tres faible — quatre centiemes d'opacite — separe les
           blocs sans dessiner de cadres. Sur un fond quasi noir, une bordure
           franche fabrique des boites, et une page en boites se lit comme un
           formulaire. */
        /* ═══ L'AIR EST LA MOITIE DE LA REFONTE ═══
           « Il faut quelque chose de beaucoup plus aere, avec des sections
           claires. » Mesure avant : onze mille deux cents points de defilement
           sur un telephone, vingt-sept ecrans au meme rythme. Le probleme
           n'etait pas la quantite — c'est une page de boutique, elle a le droit
           d'etre longue — mais le RYTHME : rien ne separait deux sections, donc
           tout se lisait comme une seule liste sans fin.
           QUARANTE-DEUX POINTS EN HAUT, TRENTE-HUIT EN BAS, ET UN FILET. Un
           lecteur a besoin de savoir qu'il a fini quelque chose avant de
           commencer autre chose ; c'est ce blanc-la qui le lui dit, et rien
           d'autre ne peut le faire a sa place. */
        .bq-s{padding:42px 18px 38px;position:relative;}
        .bq-s + .bq-s::before{content:"";position:absolute;left:18px;right:18px;
          top:0;height:1px;background:var(--bq-ligne);}
        .bq-s.alt{background:rgba(255,255,255,.028);}
        .bq-k{font-size:9.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;
          color:var(--bq-menthe);margin-bottom:7px;}
        .bq-h{margin:0 0 4px;font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:25px;font-weight:400;line-height:1.06;letter-spacing:.005em;}

        /* ═══ LE REPERE DU CHAPITRE COURANT ═══
           Il est collant en haut de la page et ne montre qu'une chose : ou l'on
           est. Fond floute, pas de fond plein — il passe par-dessus des photos,
           et un bandeau opaque de quarante points sur un telephone coute un
           dixieme de l'ecran a chaque instant.
           IL N'APPARAIT QU'UNE FOIS LA TETE DE PAGE DEPASSEE : au sommet, le nom
           du commerce est deja sous les yeux, et un repere qui repete ce qu'on
           voit n'est que du bruit. */
        .bq-ou{position:sticky;top:0;z-index:12;display:flex;align-items:center;
          gap:7px;height:0;overflow:hidden;padding:0 16px;
          opacity:0;transition:opacity .18s ease,height .18s ease;
          background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.88));
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
          border-bottom:1px solid transparent;}
        .bq-ou.vu{height:38px;opacity:1;border-bottom-color:var(--bq-ligne);}
        .bq-ou b{font-size:12.5px;font-weight:900;color:var(--bq-menthe);
          font-variant-numeric:tabular-nums;}
        .bq-ou i{font-style:normal;font-size:10.5px;font-weight:800;
          color:rgba(61,226,166,.5);margin-left:-4px;}
        .bq-ou span{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;font-size:12.5px;font-weight:800;
          color:var(--bq-encre);}

        /* ═══ LE CHAPITRE ═══ voir le composant Chapitre.
           SON RANG EST LA CHOSE NOUVELLE : « 3 / 8 » dit d'un coup d'oeil ou
           l'on est et combien il reste. Sans lui, un lecteur qui ne sait pas
           s'il est au debut ou a la fin s'arrete. */
        /* ═══ LE TITRE DE SECTION, COMME UN TITRE DE RAYON ═════════════════
           Ses maquettes ecrivent « Nos prestations phares », « Aujourd'hui a la
           boucherie » — en gras, en casse normale, de la taille d'un titre de
           rayon. Pas en lettres d'affiche : l'affiche est la lettre du DIRECT,
           ou l'on crie une offre du jour ; une vitrine ne crie pas. */
        .bq-ch{margin:0 0 18px;}
        .bq-ch h2{margin:0;font-size:clamp(21px,5.6vw,25px);font-weight:820;
          line-height:1.14;letter-spacing:-.022em;color:var(--bq-encre);}
        /* LA LIGNE QUI DIT A QUOI CE CHAPITRE REPOND. C'est elle qui fait
           l'histoire : chaque section repond a la question que la precedente a
           laissee ouverte, et elle l'ecrit au lieu de compter dessus. */
        .bq-ch p{margin:7px 0 0;max-width:34em;font-size:13px;line-height:1.5;
          color:var(--bq-pale);}
        .bq-int{margin:9px 0 0;font-size:12.5px;line-height:1.5;color:var(--bq-pale);}
        .bq-vide{margin:12px 0 0;font-size:13px;line-height:1.55;color:var(--bq-pale);
          background:var(--bq-carte);border-radius:16px;padding:14px 15px;}

        /* ─── LES MOMENTS ───
           Ce sont les memes objets que dans le fil, poses a plat au lieu d'etre
           empiles : ici on ne balaie pas, on parcourt une journee. */
        .bq-mom{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:10px;}
        .bq-m{display:flex;gap:12px;background:var(--bq-carte);border-radius:18px;
          padding:12px;border:1px solid transparent;}
        /* CE QUI SE JOUE MAINTENANT EST LE SEUL BLOC COLORE DE LA PAGE. Si tout
           est mis en avant, plus rien ne l'est — c'est la regle de la fraicheur
           dans le fil, appliquee ici a la journee. */
        /* EN CLAIR, LE MENTHE DEVIENT UN LISERE ROSE ET UN FOND PRESQUE BLANC.
           Le vert du theme sombre etait la couleur du DIRECT — « ceci vous
           engage » sur du noir. Sur du blanc il fait etiquette de pharmacie, et
           surtout il ne s'accorde avec rien d'autre de la maquette, qui est
           entierement rose et magenta. */
        .bq-m.en-cours{border-color:rgba(232,38,127,.24);
          background:linear-gradient(160deg,#FFF4F8,#FFFBFD);
          box-shadow:0 12px 30px -24px rgba(232,38,127,.7);}
        .bq-m.passe{opacity:.44;}
        .bq-m-p{flex:none;width:74px;height:74px;border-radius:14px;overflow:hidden;
          background:#F1ECF5;}
        .bq-m-p img{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-m-c{flex:1;min-width:0;}
        .bq-m-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px;}
        .bq-m-h b{font-size:11px;font-weight:800;letter-spacing:.05em;
          text-transform:uppercase;color:var(--bq-pale);}
        .bq-pt{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:#FFFFFF;background:var(--bq-menthe);border-radius:20px;padding:3px 8px;}
        /* LE BLANC SUR L'AMBRE NE PASSAIT PAS. Mesure faite : deux virgule huit
           pour un, sur du neuf points et demi en capitales — c'est-a-dire la
           taille de texte qui en demande le PLUS. L'encre sombre sur le meme
           ambre monte a pres de six, garde la couleur de la promotion, et se
           lit. Cette pastille ne s'affiche qu'a certaines heures, ce qui
           explique qu'elle ait echappe aux mesures precedentes. */
        .bq-eti{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:#2A1B02;background:var(--bq-ambre);border-radius:20px;padding:3px 8px;}
        .bq-off{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:var(--bq-encre);background:rgba(20,16,40,.13);border-radius:20px;padding:3px 8px;}
        .bq-m-t{display:flex;align-items:center;gap:7px;font-size:15.5px;font-weight:700;
          line-height:1.25;}
        .bq-m-t i{font-style:normal;font-size:15px;}
        /* ═══ SUR LA CARTE D'UN MOMENT, LE GRIS COURANT NE SUFFIT PAS ═══════
           La carte est teintee ; le pale de la page est calcule pour du blanc.
           A douze points et demi, l'ecart tombe sous le seuil — mesure sur le
           bar, la boulangerie, la boucherie, le traiteur et la fleuriste. La
           citation juste en dessous avait deja tranche pour une encre plus
           sombre : les deux textes de la meme carte prennent donc la meme. */
        .bq-m-l{list-style:none;margin:5px 0 0;padding:0;font-size:12.5px;line-height:1.45;
          color:#4A5168;}
        .bq-m-cs{margin:6px 0 0;font-size:13px;line-height:1.45;color:#4A5168;font-style:italic;}
        /* LA SIGNATURE DU CONSEIL EST PLUS SOMBRE QUE LE GRIS COURANT. A onze
           points et demi sur la carte teintee d'un moment, le pale du reste de
           la page tombe sous le seuil — et c'est le nom du commercant qui
           signe sa phrase, donc le dernier texte qu'on veut voir palir. */
        .bq-m-cs s{text-decoration:none;font-style:normal;color:#4A5168;font-size:11.5px;}
        .bq-m-b{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:9px;}
        /* LE PRIX QUITTE LA LETTRE D'AFFICHE. Anton est la fonte du DIRECT, ou
           l'on crie « 9 € » sur une ardoise ; sur une vitrine il donne un air
           de promotion a un tarif de salon. */
        .bq-prix{font-size:18px;font-weight:850;color:var(--bq-encre);
          letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
        .bq-prix.long{font-family:inherit;font-size:13px;font-weight:800;
          letter-spacing:.01em;}
        .bq-pl{font-size:11px;font-weight:700;color:var(--bq-pale);}
        .bq-fini{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
          color:var(--bq-pale);}
        .bq-act{margin-left:auto;font-family:inherit;font-size:12.5px;font-weight:800;
          cursor:pointer;border:none;border-radius:20px;padding:9px 16px;
          background:var(--bq-menthe);color:#FFFFFF;}
        .bq-act:active{transform:scale(.96);}

        /* ─── CE QUI REVIENT ───
           Une liste, pas des cartes : c'est une deduction, pas une offre. Lui
           donner l'apparence d'une annonce ferait croire qu'on peut la prendre. */
        .bq-hab{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:1px;}
        .bq-hab li{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;
          padding:11px 0;border-bottom:1px solid var(--bq-ligne);}
        .bq-hab li:last-child{border-bottom:none;}
        .bq-hab b{font-size:14.5px;font-weight:700;}
        .bq-hab span{font-size:12px;color:var(--bq-pale);}
        .bq-hab em{margin-left:auto;font-style:normal;font-size:13px;font-weight:800;
          color:var(--bq-ambre);font-variant-numeric:tabular-nums;}
        /* EN CONTOUR, PAS EN APLAT. C'est une question posee au commercant, pas
           une commande : le geste doit se voir sans peser autant que
           « Reserver », qui est plus haut et qui engage. */
        .bq-hab-b{flex:none;text-decoration:none;font-size:11.5px;font-weight:800;
          color:var(--bq-menthe);border:1px solid rgba(61,226,166,.34);
          border-radius:20px;padding:6px 11px;white-space:nowrap;}
        .bq-hab-b:active{background:rgba(61,226,166,.13);}

        /* ─── LE CATALOGUE ─── */
        .bq-ray{margin-top:16px;}
        .bq-ray-t{font-size:10.5px;font-weight:900;letter-spacing:.13em;
          text-transform:uppercase;color:var(--bq-pale);margin-bottom:6px;}
        .bq-art{list-style:none;margin:0;padding:0;}
        .bq-art li{display:flex;align-items:center;gap:11px;padding:9px 0;
          border-bottom:1px solid var(--bq-ligne);}
        .bq-art li:last-child{border-bottom:none;}
        .bq-art img,.bq-art .bq-art-v{flex:none;width:46px;height:46px;border-radius:11px;
          object-fit:cover;display:block;}
        .bq-art .bq-art-v{background:#FBF8FC;}
        .bq-art li>div{flex:1;min-width:0;}
        .bq-art b{display:block;font-size:14px;font-weight:650;line-height:1.25;}
        .bq-art span{display:block;font-size:12px;color:var(--bq-pale);margin-top:1px;}
        .bq-art em{flex:none;font-style:normal;font-size:14px;font-weight:800;
          color:var(--bq-ambre);font-variant-numeric:tabular-nums;}

        /* ─── QUI C'EST ───
           LE ROND EST LARGE, ET CE N'ETAIT PAS EVIDENT. La peur n'a jamais ete
           celle des pixels mais celle du FORMAT : une video plein ecran est une
           performance, un rond n'en est pas une. On peut donc l'agrandir sans
           rien reveiller de ce qui bloquait les commercants. */
        .bq-voix{display:flex;gap:14px;align-items:flex-start;margin-top:14px;}
        .bq-voix-r{flex:none;width:88px;height:88px;border-radius:50%;overflow:hidden;
          background:linear-gradient(150deg,#FFE8F1,#F3ECFA);
          border:1px solid rgba(232,38,127,.2);
          display:flex;align-items:center;justify-content:center;
          transition:width .26s ease,height .26s ease,border-radius .26s ease;}
        .bq-voix-r video{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-voix-r span{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:34px;color:var(--bq-menthe);}
        .bq-voix-t{position:relative;width:100%;height:100%;padding:0;border:none;
          background:none;cursor:pointer;display:block;}
        /* LA PASTILLE DIT CE QUE FAIT L'APPUI. Un rond qui joue une video muette
           sans rien afficher ne se touche pas : on croit regarder une image. */
        .bq-voix-t i{position:absolute;right:5px;bottom:5px;font-style:normal;
          font-size:11px;line-height:1;padding:4px 5px;border-radius:50%;
          background:rgba(4,10,8,.66);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* ─── OUVERT : LE ROND DEVIENT UN CARRE ARRONDI, PLEINE LARGEUR ───
           LA FORME RONDE ETAIT LA PROTECTION DU COMMERCANT — un rond en marge
           n'est pas une performance, une video plein ecran en est une. Ici on ne
           la met pas plein ecran : elle prend la largeur de la colonne, en
           quatre-tiers, et le texte descend dessous. C'est assez pour voir un
           geste, et ca ne demande toujours a personne de faire l'acteur. */
        .bq-voix.ouverte{flex-direction:column;gap:12px;}
        .bq-voix.ouverte .bq-voix-r{width:100%;height:auto;aspect-ratio:4/3;
          border-radius:20px;}
        .bq-voix.ouverte .bq-voix-t i{right:9px;bottom:9px;font-size:14px;padding:7px 9px;
          border-radius:14px;}
        .bq-voix-c{flex:1;min-width:0;}
        .bq-voix-n{font-size:15px;font-weight:800;}
        .bq-voix-n s{text-decoration:none;font-weight:600;color:var(--bq-pale);}
        .bq-sig{margin:6px 0 0;font-size:15px;line-height:1.4;
          color:var(--bq-encre);font-style:italic;}
        .bq-mot{margin:8px 0 0;font-size:12.5px;line-height:1.55;color:var(--bq-pale);}

        .bq-gal{display:flex;gap:9px;overflow-x:auto;margin-top:16px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .bq-gal::-webkit-scrollbar{display:none;}
        .bq-gal figure{flex:none;width:146px;margin:0;}
        .bq-gal img{width:146px;height:104px;object-fit:cover;border-radius:13px;display:block;}
        .bq-gal figcaption{margin-top:5px;font-size:11px;color:var(--bq-pale);line-height:1.3;}

        /* ─── LES AVIS ─── */
        .bq-note{display:flex;align-items:center;gap:12px;margin-top:14px;}
        .bq-note>b{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:38px;font-weight:400;line-height:1;}
        .bq-note span{display:block;font-size:11.5px;color:var(--bq-pale);margin-top:2px;}
        .bq-et i{font-style:normal;font-size:12px;color:#3B4A42;}
        .bq-et i.on{color:var(--bq-ambre);}
        .bq-avis{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        .bq-avis li{background:var(--bq-carte);border-radius:16px;padding:12px;}
        .bq-avis p{margin:0;font-size:13.5px;line-height:1.45;}
        .bq-avis span{display:block;margin-top:5px;font-size:11px;color:var(--bq-pale);}

        /* ─── LE MUR DES CLIENTS ───
           EN BANDE QUI DEFILE, pas en grille. Une grille dit « galerie » et se
           parcourt du regard sans qu'on s'arrete ; une bande fait defiler une
           photo a la fois, avec son prenom et son heure sous elle. Ce sont ces
           deux mots qui font la preuve — la meme image sans eux ne prouve plus
           rien. */
        .bq-vu{display:flex;gap:9px;overflow-x:auto;margin-top:14px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .bq-vu::-webkit-scrollbar{display:none;}
        .bq-vu figure{flex:none;width:154px;margin:0;}
        .bq-vu img{width:154px;height:120px;object-fit:cover;border-radius:14px;display:block;}
        .bq-vu figcaption{margin-top:6px;display:flex;align-items:baseline;gap:6px;
          flex-wrap:wrap;font-size:11px;}
        .bq-vu figcaption b{font-weight:800;color:var(--bq-encre);}
        .bq-vu figcaption em{font-style:normal;color:var(--bq-pale);}
        /* Celles du jour portent la menthe : c'est la seule chose qui distingue
           une preuve d'aujourd'hui d'une preuve de mars. */
        .bq-vu figcaption em.jour{color:var(--bq-menthe);font-weight:700;}
        .bq-vu-vide{margin-top:14px;display:flex;align-items:center;gap:10px;
          background:var(--bq-carte);border-radius:16px;padding:14px 15px;
          font-size:12.5px;line-height:1.5;color:var(--bq-pale);}
        .bq-vu-vide i{font-style:normal;font-size:17px;}

        /* ─── LE PRATIQUE ─── */
        .bq-inf{margin:14px 0 0;}
        .bq-inf>div{padding:11px 0;border-bottom:1px solid var(--bq-ligne);}
        .bq-inf>div:last-child{border-bottom:none;}
        .bq-inf dt{font-size:10.5px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:var(--bq-pale);margin-bottom:3px;}
        .bq-inf dd{margin:0;font-size:14px;line-height:1.4;}
        .bq-inf dd s{display:block;text-decoration:none;font-size:12px;
          color:var(--bq-pale);margin-top:2px;}
        .bq-y{display:flex;gap:9px;margin-top:16px;}
        .bq-y-p,.bq-y-s{flex:1;font-family:inherit;font-size:13.5px;font-weight:800;
          text-align:center;text-decoration:none;border-radius:22px;padding:13px 12px;
          cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
        .bq-y-p{background:var(--bq-menthe);color:#FFFFFF;border:none;}
        .bq-y-p i{font-style:normal;}
        .bq-y-s{background:transparent;color:var(--bq-encre);
          border:1px solid rgba(255,255,255,.2);}
        .bq-y-p:active,.bq-y-s:active{transform:scale(.97);}

        /* ─── SES HABITUES ─── */
        .bq-po{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:1px;}
        .bq-po li{display:flex;align-items:center;gap:10px;padding:9px 0;
          border-bottom:1px solid var(--bq-ligne);}
        .bq-po li:last-child{border-bottom:none;}
        .bq-po span{flex:none;width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-size:13px;
          font-weight:800;color:var(--bq-menthe);background:rgba(61,226,166,.13);}
        .bq-po b{flex:1;font-size:13.5px;font-weight:650;}
        .bq-po em{font-style:normal;font-size:12.5px;font-weight:800;color:var(--bq-pale);}

        /* ─── LA PORTE VERS LA VILLE ───
           Elle est la seule chose de la page a porter la menthe en aplat sur
           toute sa largeur. C'est deliberement le point le plus lumineux du
           bas de page : c'est le geste qu'on veut, et il ne doit pas se
           chercher. */
        .bq-porte{display:flex;align-items:center;gap:12px;text-decoration:none;
          margin:22px 16px 0;padding:17px 18px;border-radius:22px;color:#FFFFFF;
          background:linear-gradient(120deg,#FF5BA8,#E8267F);
          box-shadow:0 18px 40px -26px rgba(232,38,127,.9);}
        .bq-porte-t{flex:1;min-width:0;}
        .bq-porte-k{display:block;font-size:10px;font-weight:900;letter-spacing:.14em;
          text-transform:uppercase;opacity:.72;margin-bottom:2px;}
        .bq-porte b{display:block;font-size:15px;font-weight:800;line-height:1.25;}
        .bq-porte i{flex:none;font-style:normal;font-size:19px;font-weight:700;}
        .bq-porte:active{transform:scale(.985);}

        .bq-pied{margin:20px 16px 0;font-size:10.5px;line-height:1.5;color:var(--bq-pale);
          text-align:center;}

        /* ═══ LE MUR MONTE SUR LA PAGE ═══
           LE COMPOSANT APPORTE SON PROPRE DECOR, et il est fait pour une
           feuille qui occupe tout l'ecran : un fond opaque, une largeur maximale
           et une hauteur minimale d'ecran entier. Pose dans une section de page,
           ces trois-la creaient un trou noir de huit cents points au milieu du
           contenu. On les neutralise ici plutot que de les retirer la-bas : la
           feuille du fil en a besoin, cette page non. */
        /* ═══ LA FEUILLE DU MUR REPEIGNAIT TOUT LE DOCUMENT ═══
           Elle porte html:has(.mu),body:has(.mu){background:#070B12} — juste
           quand le mur EST la page, faux des qu'il n'en est qu'une section. Le
           fond de la boutique passait du bleu-vert #05090C au bleu du mur, sur
           toute la page, et ca ne se voit qu'en comparant deux ecrans cote a
           cote. Mesure : rgb(7,11,18) au lieu de rgb(5,9,12).
           ON REPREND LA MAIN AVEC UN SELECTEUR PLUS PRECIS plutot que de
           retirer la regle la-bas : la feuille du fil en a besoin, et une regle
           supprimee pour un appelant se paie chez l'autre. */
        html:has(.bq):has(.mu),body:has(.bq):has(.mu){background:var(--bq-fond,#05090C);}
        /* DEUX CLASSES, PAS UNE, ET CE N'EST PAS DU ZELE.
           .mu et .bq-mu ont la MEME specificite, et la feuille du mur est
           rendue a l'interieur de cet element — donc APRES celle de la page dans
           le document. A egalite, c'est la derniere qui gagne : min-height:100vh
           l'emportait, et le panneau d'essai tenait neuf cents points pour quatre
           cent quatre-vingt-dix de contenu. Mesure a 1440x900 : exactement la
           hauteur de l'ecran, ce qui est la signature de ce defaut.
           .mu.bq-mu passe devant sans rien changer chez l'autre appelant. */
        /* ═══ L'ATELIER GARDE SA NUIT, ET C'ETAIT LE DEFAUT LE PLUS GRAVE ═══

           « Les textes sont invisibles ou tres tonalite sur tonalite sur toutes
           les pages. »

           IL AVAIT RAISON, ET LA CAUSE TIENT EN UN MOT : transparent. Tout ce
           qui vit dans .mu — le mur des essayages, le parcours d'essai,
           l'Avant-gout — est ecrit pour un fond de nuit : .mu pose
           color:#EAF0F6 sur background:#070B12. En neutralisant le fond pour
           que le composant tienne dans une section de page, on a garde l'encre
           BLANCHE et retire le NOIR : blanc sur blanc, sur toutes les pages,
           chez tous les metiers.

           ET SES MAQUETTES DE L'AVANT-GOUT SONT SOMBRES. Les cinq ecrans du
           magret sont dessines sur une nuit bleue, photo pleine largeur, titre
           blanc, accent magenta. Le bon geste n'est donc pas d'eclaircir le
           parcours — ce serait le decoiffer — c'est de LUI RENDRE SON FOND.

           LE PANNEAU NOIR EST AUSSI CE QUE LA PAGE RACONTE. Dehors la vitrine
           claire, le panneau rose, la question ; dedans l'atelier, ou l'on
           joue. Le passage de l'un a l'autre se voit d'un coup d'oeil. */
        .mu.bq-mu{max-width:none;min-height:0;margin:12px 0 0;
          background:transparent;}
        .mu.bq-mu.atelier{margin:14px 0 0;padding:16px 12px 20px;
          border-radius:24px;overflow:hidden;
          background:linear-gradient(178deg,#101829 0%,#070B12 58%);
          box-shadow:0 22px 50px -34px rgba(10,14,30,.75);}
        /* LA SECTION DU COEUR RESSERRE SA GOUTTIERE. Le panneau rose posait sa
           propre marge de dix points PAR-DESSUS les dix-huit de la section : il
           se retrouvait a vingt-huit points du bord quand la maquette l'y met a
           onze. Le panneau ne pose plus rien, la section decide, et le bloc
           prend enfin la largeur qu'il a chez lui. */
        .bq-s.bq-mur{padding-left:12px;padding-right:12px;}
        /* LE COMPOSANT SE PRESENTE DEJA — ICI, C'EST LE CHAPITRE QUI LE FAIT.
           La page affichait « Ce que les gens laissent ici » puis « Ce que les
           gens ont laisse ici aujourd'hui » a dix points d'ecart. Le nom du
           commerce, le titre et la phrase montent dans l'en-tete de chapitre ;
           ce qui reste du composant est ce qu'il est seul a savoir faire : le
           geste, la legende du pouce, et les cartes. */
        /* SAUF SUR LE MUR D'ESSAI, ET C'EST UNE CORRECTION. Le titre du
           composant repetait le chapitre de la page — « Ce que les gens
           laissent ici » deux fois a dix points d'ecart — donc on le cachait.
           Depuis que le mur se cadre sur UNE PIECE, ce titre ne repete plus
           rien : il dit « 3 essayages de cette piece » ou « 7 essayages dans le
           magasin », c'est-a-dire la seule chose qui distingue les deux vues.
           Le cacher, c'etait poser une grille de vignettes sans dire de quoi
           elle parle. */
        .bq-mu .mu-chez,
        .bq-mu .mu-haut:not(.essai)>h2,
        .bq-mu .mu-haut-r h2,
        .bq-mu .mu-haut:not(.essai)>p,
        .bq-mu .mu-e-tete{display:none;}
        .bq-mu .mu-haut{padding-top:0;}
        .bq-mu .mu-haut-r{justify-content:flex-start;}
        .bq-mur.essai{background:linear-gradient(180deg,rgba(139,125,246,.1),
          rgba(139,125,246,.03) 60%,transparent);
          border-top:1px solid rgba(139,125,246,.24);}
        .bq-mur.essai .bq-k{color:#6D5BF6;}

        @media (min-width:600px){
          .bq{border-left:1px solid var(--bq-ligne);border-right:1px solid var(--bq-ligne);}
          .bq-hero{height:320px;}
          .bq-hero-c h1{font-size:38px;}
        }

        /* ═══ LA GRILLE A DEUX COLONNES EST PARTIE, ET ELLE LAISSAIT UN TROU ══
           « Je ne sais pas pourquoi il y a ce vide au milieu de la page toute
           blanche. »
           LE VIDE ETAIT MECANIQUE, ET IL VENAIT D'UN SELECTEUR MORT. La grille
           envoyait la section du mur dans la colonne de droite ; elle a change
           de nom en passant en tete, donc plus rien ne
           correspondait. Les sections nommees une a une restaient a gauche,
           l'essai se placait tout seul a droite, et la premiere rangee de
           gauche n'avait plus personne : six cents points de blanc.
           MAIS ON NE REPARE PAS LE SELECTEUR, ON RETIRE LA GRILLE. Elle avait
           ete ecrite pour l'ancienne page sombre, et elle repondait a une vraie
           remarque — « soixante pour cent de l'ecran ne servaient a rien sur un
           ordinateur ». Ses trois maquettes, elles, sont des ECRANS DE
           TELEPHONE, en une colonne, du premier pixel au dernier. Une page qui
           se reorganise en deux colonnes sur grand ecran n'est plus la meme
           page, et c'est exactement ce qu'il vient de constater.
           CE QUI RESTE SUR GRAND ECRAN : la meme colonne, centree, un peu plus
           large. On ne remplit pas l'ecran pour le remplir. */
        @media (min-width:1040px){
          .bq{max-width:600px;}
          .bq-hero{height:400px;}
          .bq-hero-c h1{font-size:44px;}
        }

        /* Une personne qui a demande moins d'animation n'a pas demande moins
           d'informations : seuls les mouvements tombent. */
        @media (prefers-reduced-motion:reduce){
          .bq *{animation:none !important;transition:none !important;}
        }
      `,
      }}
    />
  );
}
