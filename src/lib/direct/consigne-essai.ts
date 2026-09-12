// 🪞 LA CONSIGNE DE L'ESSAI — ce qu'on demande au modèle d'image, mot pour mot.
//
// ═══ POURQUOI ELLE VIT DANS UNE BIBLIOTHÈQUE ET NON DANS LA ROUTE ══════════
//
// PARCE QUE C'EST DU CONTENU DE PRODUIT, PAS DE LA PLOMBERIE. Cette fonction ne
// fait aucun appel réseau, ne lit aucun en-tête, ne dépend de rien : elle écrit
// une phrase. Et c'est LA phrase dont dépend la moitié du résultat.
//
// ET PARCE QU'ENFERMÉE DANS LA ROUTE, ELLE N'ÉTAIT PAS VÉRIFIABLE. Une route ne
// se teste qu'en la faisant tourner, avec un serveur, une clé et un faux
// fournisseur ; une fonction pure se lit et se mesure en trois lignes. Le seul
// défaut grave de tout l'essayage — « ce n'est pas exactement ma tête ni les
// mêmes lunettes » — venait d'ici, et rien ne le surveillait.

/**
 * LA CONSIGNE, ET ELLE EST LA MOITIÉ DU RÉSULTAT.
 *
 * ═══ TROISIÈME ÉCRITURE, ET LES DEUX PREMIÈRES ONT ÉCHOUÉ POUR DEUX RAISONS
 *     DIFFÉRENTES ═══════════════════════════════════════════════════════════
 *
 * PREMIER ESSAI, PREMIER DÉFAUT : « ne modifie RIEN d'autre que la zone
 * concernée ». Une phrase générale, qu'un modèle d'image applique
 * généreusement : il redresse, il rajeunit, il lisse la peau. Réponse : nommer
 * les traits un par un et interdire explicitement d'embellir.
 *
 * SECOND ESSAI, ET IL A EMPIRÉ LE DÉFAUT : « il m'a changé le visage ET il m'a
 * mis des lunettes ». Sur une photo où il n'en portait aucune. Deux causes,
 * toutes les deux dans ce fichier, toutes les deux instructives.
 *
 * ═══ CAUSE 1 : ON DEMANDAIT DE REPRODUIRE LA RÉFÉRENCE « SUR VOTRE TÊTE » ══
 *
 * La phrase était : « Reproduis EXACTEMENT ce que montre la deuxième image,
 * appliqué à VOTRE TÊTE ». Or la deuxième image montre UNE AUTRE PERSONNE en
 * entier — un jeune homme blond aux boucles courtes. « Reproduis ce que montre
 * cette image sur ta tête » se lit donc, très raisonnablement, comme « donne-lui
 * cette tête-là ». Le modèle a fait exactement ce qu'on lui demandait.
 *
 * LA CONFUSION ÉTAIT DANS NOS DONNÉES AUTANT QUE DANS LA PHRASE. `partie`
 * servait à deux choses incompatibles : CE QU'ON PHOTOGRAPHIE (« votre tête »,
 * pour l'écran de prise de vue) et CE QU'ON MODIFIE. Ce sont deux choses
 * différentes — on photographie une tête pour changer des CHEVEUX — et les
 * confondre donnait au modèle la permission de refaire le visage. D'où
 * `change`, qui ne dit qu'une chose : « uniquement les cheveux ».
 *
 * ET ON DIT MAINTENANT CE QU'EST LA SECONDE IMAGE : quelqu'un d'autre, dont
 * rien ne doit passer. C'est la clause qui manquait entièrement.
 *
 * ═══ CAUSE 2 : NOMMER UN OBJET, C'EST LE FAIRE APPARAÎTRE ═════════════════
 *
 * La liste du coiffeur disait : « Les lunettes exactement telles qu'elles sont :
 * même forme, même couleur, même monture, même position sur le nez. » Écrite
 * pour PROTÉGER les lunettes de quelqu'un qui en porte, cette phrase AFFIRME
 * qu'il y en a. Servie avec une photo qui n'en montre aucune, elle décrit un
 * objet absent — et un modèle d'image qui reçoit la description détaillée d'un
 * objet le dessine. C'est la faute la plus contre-intuitive de tout ce travail :
 * la phrase censée empêcher un défaut l'a créé.
 *
 * LA RÈGLE QUI EN SORT, ET ELLE VAUT POUR TOUTE CONSIGNE D'IMAGE : ne jamais
 * décrire au présent de l'indicatif un objet dont on ne sait pas s'il est là.
 * Toute mention d'accessoire est donc CONDITIONNELLE — « si elle en porte…, si
 * elle n'en porte pas… » — et une garde le vérifie, parce que c'est exactement
 * le genre de phrase qu'on réécrit sans y penser.
 *
 * ═══ CE QUI VIENT DU MÉTIER, ET POURQUOI ═════════════════════════════════
 *
 * `change` et `garder` arrivent de l'écran parce qu'ils ne peuvent pas être les
 * mêmes partout : chez le coiffeur les lunettes ne sont pas concernées, chez le
 * lunetier elles sont précisément ce qui change — et il faut alors demander de
 * RETIRER celles qui sont là, sans quoi le modèle en superpose deux paires.
 */
export function consigne(
  partie: string,
  garder: string[] = [],
  change?: string,
): string {
  /**
   * CE QU'ON MODIFIE, ET LE REPLI EST VOLONTAIREMENT ÉTROIT.
   *
   * Sans `change`, on ne dit PAS « votre tête » — c'est la faute qu'on vient de
   * corriger. On dit « la zone montrée par la deuxième image », qui laisse le
   * modèle déduire au lieu de lui donner un organe entier à refaire.
   */
  const quoi = change?.trim() || "uniquement ce que montre la deuxième image";
  /**
   * LA FORME COURTE, POUR LA SECONDE MENTION.
   *
   * `change` porte la version complète — « uniquement les cheveux : leur coupe,
   * leur longueur, leur couleur et leur implantation » — parce que c'est elle
   * qui cadre le travail. Répétée telle quelle vingt lignes plus bas, elle
   * donnait « ne voir de différence QUE sur uniquement les cheveux : leur
   * coupe, leur longueur… », une phrase que personne ne lit jusqu'au bout, pas
   * même un modèle. On coupe donc au deux-points et on retire le « uniquement »,
   * qui a déjà servi.
   */
  const court = quoi.split(":")[0].replace(/^uniquement\s+/i, "").trim() || quoi;

  return [
    // LA RÈGLE LA PLUS IMPORTANTE EST LA PREMIÈRE PHRASE, et c'est délibéré :
    // c'est là que l'attention d'un modèle est la plus forte. Elle était
    // enterrée au milieu d'une liste de tirets.
    "La personne de la première image doit rester EXACTEMENT la même personne.",
    "On ne fabrique pas un portrait : on retouche une photographie existante.",
    "",
    "═══ LES DEUX IMAGES N'ONT PAS LE MÊME RÔLE ═══",
    "",
    `IMAGE 1 — LA PERSONNE. La photo d'un client, montrant ${partie}.`,
    "C'est elle qu'on modifie, et c'est la SEULE personne qui doit apparaître",
    "dans le résultat.",
    "",
    "IMAGE 2 — LA RÉFÉRENCE. Elle montre le travail d'un professionnel, souvent",
    "SUR QUELQU'UN D'AUTRE. Elle ne sert qu'à montrer une chose, et une seule.",
    "RIEN de la personne de l'image 2 ne doit passer sur l'image 1 : ni son",
    "visage, ni sa morphologie, ni son âge, ni sa carnation, ni ses yeux, ni sa",
    "pilosité, ni ses vêtements, ni ses accessoires, ni son décor.",
    "",
    "═══ LA SEULE CHOSE À FAIRE ═══",
    "",
    `Sur l'image 1, modifier ${quoi}.`,
    // LES ARTICLES SONT NEUTRES, ET C'EST NÉCESSAIRE. « sa forme, sa longueur »
    // accordait le texte sur UN objet ; `change` dit tantôt « les cheveux »,
    // tantôt « la monture », tantôt « les ongles ». Un accord qui se trompe une
    // fois sur deux fait douter le modèle de ce dont on parle.
    `Reproduis fidèlement ce que l'image 2 montre de ${court} : la forme, la`,
    "longueur, la couleur, la matière, le motif, la finition et la brillance.",
    "Absolument rien d'autre de l'image 1 ne bouge.",
    "",
    "═══ CE QUI RESTE STRICTEMENT IDENTIQUE À L'IMAGE 1 ═══",
    "",
    "On doit pouvoir superposer le résultat et l'image 1 et ne voir de",
    `différence QUE sur ${court}.`,
    "",
    "- Le visage trait pour trait : la forme et la largeur du nez, la bouche, les yeux,",
    "  les sourcils, la mâchoire, le front, les oreilles, les rides, les cernes,",
    "  les grains de beauté, les cicatrices, la pilosité et la barbe telles qu'elles sont.",
    "- L'âge, la carnation, le teint, la corpulence et l'expression tels qu'ils sont.",
    "- La pose, l'angle de la tête, le cadrage, l'arrière-plan, la lumière et les ombres.",
    "- Les vêtements et leur couleur.",
    ...garder.map((g) => `- ${g}`),
    "",
    // ═══ LA RÈGLE QUI MANQUAIT, ET ELLE A SA PROPRE SECTION ═══
    //
    // Elle existait, en un tiret, au milieu d'une liste de négations — « n'ajoute
    // aucun objet ». Une négation isolée perd toujours contre une description
    // affirmative placée ailleurs. Elle est maintenant seule sous son titre, et
    // elle nomme les objets qu'un modèle ajoute spontanément à un portrait.
    "═══ N'AJOUTE RIEN QUI NE SOIT DÉJÀ SUR L'IMAGE 1 ═══",
    "",
    "- Si la personne de l'image 1 NE PORTE PAS de lunettes, alors le résultat",
    "  n'en porte AUCUNE. C'est une erreur grave d'en ajouter.",
    "- Même règle pour un bijou, une montre, un chapeau, une écharpe, une barbe,",
    "  une moustache, un tatouage, du maquillage : ce qui n'est pas visible sur",
    "  l'image 1 n'existe pas et ne doit pas apparaître.",
    "- Ce qui EST visible sur l'image 1 reste exactement tel quel, à la même",
    "  place, de la même forme et de la même couleur.",
    "- N'ajoute aucun texte, aucun filigrane, aucun doigt, aucun membre.",
    "",
    "═══ CE QU'IL NE FAUT SURTOUT PAS FAIRE ═══",
    "",
    "- Ne rajeunis pas, n'amincis pas, ne lisse pas la peau, n'efface aucune ride,",
    "  aucun défaut, aucune asymétrie. N'« améliore » pas la photo.",
    "- Ne redresse pas la pose, ne recadre pas, ne change pas l'objectif ni la profondeur de champ.",
    "- Ne remplace aucun accessoire porté par la personne par un autre qui irait mieux.",
    "",
    "Le résultat doit ressembler à la photographie d'origine retouchée par un professionnel,",
    "et non à un nouveau portrait de quelqu'un qui lui ressemble.",
    "",
    "Rends uniquement l'image modifiée.",
  ].join("\n");
}
