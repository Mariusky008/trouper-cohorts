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
  /**
   * ═══ CE QUE LA PIÈCE EST, EN TOUTES LETTRES ══════════════════════════════
   *
   * « La coiffure sélectionnée — un carré plongeant — n'a pas été créée sur la
   * photo originale. »
   *
   * QUATRIÈME ÉCRITURE, ET LE DÉFAUT N'EST PLUS LE MÊME. Les trois premières
   * cherchaient à PROTÉGER le visage, et elles y arrivaient de mieux en mieux.
   * Celle-ci corrige l'autre moitié : le travail demandé n'était jamais fait.
   *
   * LA CONSIGNE DISAIT « reproduis fidèlement ce que l'image 2 montre des
   * cheveux ». C'est-à-dire : DÉDUIS une coupe d'une photographie de quelqu'un
   * d'autre, puis pose-la sur une autre tête. Deux opérations difficiles au lieu
   * d'une — et quand la déduction rate, le modèle ne pose rien : il se rabat sur
   * ce qu'il sait faire, c'est-à-dire refabriquer un portrait. Les deux moitiés
   * du défaut rapporté sont la même faute.
   *
   * UNE PHRASE CHANGE LE PROBLÈME DE NATURE. « Un carré long qui s'arrête sous
   * la mâchoire, coupé net, raie au milieu, sans dégradé » est une CIBLE, pas
   * une devinette. Le modèle n'a plus à interpréter une image, il a à exécuter
   * une description ; la référence ne sert plus qu'à confirmer la couleur, la
   * matière et la finition. Voir `decrire` dans `fantomes.ts`.
   */
  decrire?: string,
  /**
   * ═══ UN MASQUE ACCOMPAGNE-T-IL CETTE CONSIGNE ? ═══════════════════════════
   *
   * « Ce prompt accompagne le masque, il ne le remplace pas. »
   *
   * C'EST EXACT, ET L'INVERSE L'EST AUSSI : un masque sans phrase qui le nomme
   * est moins bien respecté. Le modèle reçoit une image d'alpha ; lui dire en
   * toutes lettres qu'il existe une zone éditable, et que le reste est protégé,
   * aligne le texte et la contrainte au lieu de les laisser se contredire.
   *
   * LA PHRASE N'EST ÉCRITE QUE S'IL Y A VRAIMENT UN MASQUE. Annoncer une zone
   * éditable qui n'a pas été envoyée ferait chercher au modèle une limite qui
   * n'existe pas — et c'est exactement le genre d'instruction contradictoire qui
   * lui fait tout recalculer. Voir `lib/direct/visage.ts`.
   */
  avecMasque?: boolean,
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
    // ELLE ARRIVE EN TROISIÈME, JUSTE APRÈS LES DEUX RÈGLES DE FOND, parce que
    // c'est là que l'attention d'un modèle est encore forte et que cette
    // phrase-ci est une CONTRAINTE, pas une préférence : elle décrit ce que le
    // masque lui interdit déjà techniquement.
    ...(avecMasque
      ? [
          "Un masque accompagne cette demande : ne modifiez QUE la zone éditable qu'il désigne.",
          "Tout ce que le masque protège doit ressortir pixel pour pixel identique à la première image.",
        ]
      : []),
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
    // ═══ LA CIBLE EST ÉCRITE, ELLE N'EST PLUS À DEVINER ═══
    //
    // C'EST LA LIGNE QUI MANQUAIT, et son absence a produit la moitié du défaut :
    // « la coiffure sélectionnée n'a pas été créée sur la photo originale ». On
    // demandait de déduire une coupe d'une photo, puis de la poser. Quand la
    // déduction rate, le modèle se rabat sur ce qu'il sait faire — refabriquer
    // un portrait — et c'est exactement ce qu'on a vu.
    ...(decrire
      ? [
          `RÉSULTAT ATTENDU, EN TOUTES LETTRES : ${decrire}.`,
          "Cette description est la CIBLE. Exécute-la sur la personne de l'image 1.",
          `L'image 2 ne sert qu'à confirmer la couleur, la matière et la finition de ${court}.`,
        ]
      : [
          `Reproduis fidèlement ce que l'image 2 montre de ${court} : la forme, la`,
          "longueur, la couleur, la matière, le motif, la finition et la brillance.",
        ]),
    "Absolument rien d'autre de l'image 1 ne bouge.",
    "",
    // ═══ ET LE TRAVAIL DOIT ÊTRE VISIBLE ═══
    //
    // L'AUTRE MOITIÉ DU DÉFAUT : le rendu ressemblait à la photo de départ, à
    // quelques pixels près. Toute la consigne insistait sur ce qui NE DOIT PAS
    // bouger — et un modèle prudent obéit en ne faisant rien. Il faut donc dire
    // aussi que l'inaction est un échec.
    `Le changement doit être NET et VISIBLE sur ${court} : si l'on met le`,
    "résultat à côté de l'image 1, la différence doit sauter aux yeux.",
    "Un résultat identique à l'image 1 est un échec au même titre qu'un",
    "résultat qui change le visage.",
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
    // ═══ SAUF QUAND CE SONT LES VETEMENTS QU'ON ESSAIE ═══════════════════════
    //
    // « Je ne comprends pas pourquoi l'IA change les proportions et la tête
    // complètement. »
    //
    // LA CONSIGNE SE CONTREDISAIT, ET SUR CE MÉTIER-LÀ SEULEMENT. Elle disait
    // en haut « modifier UNIQUEMENT le vêtement porté sur le buste », et vingt
    // lignes plus bas, dans la liste de ce qui ne bouge pas : « Les vêtements et
    // leur couleur. » Les deux phrases s'annulent. Un modèle d'image à qui l'on
    // demande une chose et son contraire ne s'arrête pas pour demander : il
    // tranche, et il tranche en refabriquant — ce qui donne exactement une pose
    // qui change, des jambes qui bougent et une ceinture qui disparaît.
    //
    // ELLE ÉTAIT JUSTE POUR LES SEPT AUTRES MÉTIERS : chez le coiffeur, le
    // tatoueur ou l'onglerie, garder les vêtements est précisément ce qu'on
    // veut. La ligne reste donc, sauf là où elle contredit le travail demandé.
    ...(/v[êe]tement|tenue|habit|buste|robe|pantalon/i.test(quoi)
      ? []
      : ["- Les vêtements et leur couleur."]),
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
