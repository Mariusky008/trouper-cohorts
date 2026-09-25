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
/**
 * « DE » + UN GROUPE QUI COMMENCE PAR UN ARTICLE, EN FRANÇAIS CORRECT.
 *
 * `court` vaut « les cheveux », « le dessin tatoué », « la monture » selon le
 * métier, et on l'écrivait derrière « de » sans rien faire : la consigne disait
 * « la finition DE LES CHEVEUX ». Personne ne l'avait vu parce que personne ne
 * lit un prompt de deux mille signes en entier — et un modèle qui bute sur une
 * faute de français au milieu d'une phrase d'instruction y perd un peu de ce
 * qu'on lui demande.
 */
function du(x: string): string {
  const t = x.trim();
  if (/^les\s/i.test(t)) return `des ${t.slice(4)}`;
  if (/^le\s/i.test(t)) return `du ${t.slice(3)}`;
  if (/^la\s/i.test(t)) return `de la ${t.slice(3)}`;
  if (/^l['’]/i.test(t)) return `de ${t}`;
  if (/^un\s|^une\s/i.test(t)) return `de ${t}`;
  return `de ${t}`;
}

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
  /**
   * ═══ Y A-T-IL UNE DEUXIÈME IMAGE ? ════════════════════════════════════════
   *
   * « Your request was rejected by the safety system. »
   *
   * DEUX PHOTOGRAPHIES DE PERSONNES RÉELLES, ET UNE DEMANDE DE REPORTER L'UNE
   * SUR L'AUTRE : c'est ce que le filtre arrête, et il a raison de le faire en
   * général. La route rejoue donc SANS la référence — voir `parOpenAI`.
   *
   * ALORS LA CONSIGNE NE DOIT PLUS LA NOMMER. Un texte qui décrit « IMAGE 2 »
   * quand une seule image est jointe envoie le modèle chercher une consigne
   * qu'il n'a pas : il la devine, et deviner est exactement ce qui le fait
   * refabriquer un portrait.
   */
  avecReference = true,
): string {
  /**
   * CE QU'ON MODIFIE, ET LE REPLI EST VOLONTAIREMENT ÉTROIT.
   *
   * Sans `change`, on ne dit PAS « votre tête » — c'est la faute qu'on vient de
   * corriger. On dit « la zone montrée par la deuxième image », qui laisse le
   * modèle déduire au lieu de lui donner un organe entier à refaire.
   */
  const quoi =
    change?.trim() ||
    (avecReference ? "uniquement ce que montre la deuxième image" : "uniquement ce qui est décrit ci-dessous");
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
    ...(avecReference
      ? [
          "IMAGE 2 — LA RÉFÉRENCE. Elle montre le travail d'un professionnel, souvent",
          "SUR QUELQU'UN D'AUTRE. Elle ne sert qu'à montrer une chose, et une seule.",
          "RIEN de la personne de l'image 2 ne doit passer sur l'image 1 : ni son",
          "visage, ni sa morphologie, ni son âge, ni sa carnation, ni ses yeux, ni sa",
          "pilosité, ni ses vêtements, ni ses accessoires, ni son décor.",
          "",
        ]
      : [
          // SANS RÉFÉRENCE, ON LE DIT, ET ON DIT POURQUOI. Le modèle n'a plus
          // qu'une image et une description écrite : lui laisser croire qu'il
          // manque une pièce le pousse à l'inventer.
          "IL N'Y A PAS D'AUTRE IMAGE. Le travail à faire est décrit en toutes",
          "lettres plus bas ; il n'y a rien à déduire d'une seconde photo.",
          "",
        ]),
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
    /* ═══ ON REMPLACE, ON NE RETOUCHE PAS PAR-DESSUS ══════════════════════

       « Le résultat Clikme garde presque la longueur et la forme de la
       coiffure d'origine. Le contrôle le plus utile après génération est très
       concret : si des cheveux descendent encore sur les épaules, la
       transformation a échoué, même si la couleur a changé. »

       CETTE CONSIGNE NE DISAIT NULLE PART QUE L'EXISTANT DISPARAÎT. Elle
       disait ce qui change, elle disait que le changement doit être visible,
       et elle passait quarante lignes à protéger tout le reste. Un modèle qui
       lit ça restyle : il change la couleur, il ajoute du volume, il garde la
       longueur — parce qu'on ne lui a jamais dit de la couper.

       C'EST LA MOITIÉ DU TRAVAIL QU'ON N'AVAIT PAS DEMANDÉE. Raccourcir, c'est
       enlever ; enlever ne se déduit pas de « modifie ». Et ça vaut pour les
       huit métiers : le lunetier doit retirer la monture d'avant sous peine
       d'en superposer deux, la boutique doit retirer le haut d'avant sous
       peine de le laisser dépasser.

       LA PHRASE DE CONTRÔLE EST LA SIENNE, RENDUE GÉNÉRIQUE. Donner au modèle
       le critère d'échec en même temps que la cible vaut mieux que dix
       interdictions : il sait à quoi comparer son propre résultat. */
    ...(decrire
      ? [
          `RÉSULTAT ATTENDU : ${decrire}.`,
          /* LA TOURNURE EST IMPERSONNELLE, ET C'EST UNE NÉCESSITÉ. `court` vaut
             « les cheveux », « la monture », « le vêtement porté sur le
             buste » : accorder un participe derrière donnait « les cheveux de
             l'image 1 EST REMPLACÉ ». Même faute que « la finition DE LES
             cheveux », et même remède — une phrase qui n'a rien à accorder. */
          `Sur l'image 1, on REMPLACE ${court} : on ne retouche pas par-dessus.`,
          "Ce qui était là avant ne doit plus se voir nulle part dans le",
          "résultat, même partiellement, même sur un bord.",
          `CONTRÔLE : si l'on reconnaît encore ${court} de l'image 1 dans le`,
          "résultat, c'est un échec, même si la couleur a changé.",
          ...(avecReference
            ? [
                /* ═══ QUAND IL Y A UNE PHOTO, C'EST ELLE QUI DÉCIDE ══════════

                   « Ce n'est toujours pas la même coupe. »

                   CES DEUX LIGNES DISAIENT L'INVERSE : « cette description est
                   la CIBLE, exécute-la » et « l'image 2 ne sert qu'à confirmer
                   la couleur, la matière et la finition ». Le texte l'emportait
                   donc sur la photo — et le jour où une description est écrite
                   de mémoire plutôt que devant l'image, le modèle exécute
                   fidèlement la mauvaise coupe. C'est arrivé, et c'est mesuré :
                   voir `c-femme` dans `fantomes.ts`, dont la description niait
                   le dégradé que sa propre photo montre.

                   JE L'AVAIS ÉCRIT POUR UNE BONNE RAISON, et elle tient
                   toujours : « reproduis ce que l'image 2 montre des cheveux »
                   demandait au modèle de DÉDUIRE une coupe d'une photo de
                   quelqu'un d'autre, puis de la poser ailleurs — deux
                   opérations difficiles au lieu d'une, et quand la déduction
                   ratait il refabriquait un portrait.

                   LES DEUX SE CONCILIENT, ET L'ORDRE EST LA CLÉ. La description
                   dit OÙ REGARDER — « un carré dégradé, des mèches devant, des
                   pointes effilées » — et l'image dit À QUOI ÇA RESSEMBLE. Le
                   modèle n'a plus à deviner ce qu'on veut, et il n'a plus à
                   croire un texte contre ce qu'il voit.

                   ET LA DERNIÈRE LIGNE EST CELLE QUI COMPTE VRAIMENT : elle
                   rend une description imparfaite inoffensive. C'est la seule
                   forme de correction qui survive au prochain oubli. */
                `L'image 2 montre ce résultat sur quelqu'un d'autre. C'est ELLE qui fait foi`,
                `pour la forme ${du(court)} : la longueur, le tombé, les mèches, la`,
                "matière et la finition.",
                /* ═══ ET CETTE PRÉSÉANCE NE VAUT QUE POUR ÇA ═════════════

                   « Ce n'est même plus les mêmes vêtements, et la tête non
                   plus réellement. »

                   LA PHRASE DISAIT « SI LES DEUX NE CONCORDENT PAS, C'EST
                   L'IMAGE QUI A RAISON » — sans dire sur quoi. Posée juste
                   avant une liste qui protège le visage, les vêtements et le
                   décor, elle pouvait s'entendre comme une permission
                   générale : l'image 2 montre une AUTRE personne, dans
                   d'autres vêtements, sur un autre fond, et on venait de lui
                   donner le dernier mot.

                   ELLE EST DONC BORNÉE À CE QU'ELLE DEVAIT TRANCHER. Une règle
                   de préséance sans domaine est une règle qui déborde — et
                   celle-ci débordait sur tout ce que la consigne passe
                   quarante lignes à protéger. */
                `La description ci-dessus dit quoi regarder dans l'image 2. Si les deux`,
                `ne concordent pas SUR ${court.toUpperCase()}, c'est l'image qui a raison.`,
                "Cette préséance ne vaut QUE pour cela : sur tout le reste — le visage,",
                "les vêtements, le décor, la pose — c'est l'image 1 qui fait foi, toujours.",
              ]
            : ["Exécute cette description sur la personne de l'image 1."]),
        ]
      : avecReference
        ? [
            `Reproduis fidèlement ce que l'image 2 montre ${du(court)} : la forme, la`,
            "longueur, la couleur, la matière, le motif, la finition et la brillance.",
          ]
        : [
            // NI DESCRIPTION NI RÉFÉRENCE : c'est le cas le plus pauvre, et il
            // ne doit pas se taire. Dire « change ceci » sans dire en quoi
            // laisse le modèle libre, et libre il refait un portrait.
            `Applique un ${court} plausible et soigné, de la même famille que ce que`,
            "porte déjà la personne, sans changer quoi que ce soit d'autre.",
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

/**
 * ═══ LA CONSIGNE NUE — CELLE QU'ON ÉCRIRAIT DANS CHATGPT ═══════════════════
 *
 * « ChatGPT réalise un rendu beaucoup plus naturel et ajusté à la photo de
 * départ que via ClikMe. Ça fait un moment qu'on essaie de réaliser quelque
 * chose comme ChatGPT et on est encore et toujours très loin, alors qu'on
 * utilise leur API. »
 *
 * ═══ CE QUI NOUS SÉPARE DE CHATGPT, ET CE N'EST PAS LE MODÈLE ══════════════
 *
 * C'EST LE MÊME MOTEUR, LE MÊME POINT D'ENTRÉE, LA MÊME FIDÉLITÉ D'ENTRÉE.
 * Quatre choses seulement diffèrent, et nous les avons toutes les quatre
 * ajoutées nous-mêmes, chacune pour une bonne raison :
 *
 *   1. LA RECOMPOSITION. Après la génération, on repose les pixels du visage
 *      d'origine par-dessus le rendu, avec un fondu de huit à dix-huit points.
 *      C'est ce qui garantit l'identité — et c'est aussi ce qui donne l'air
 *      d'une tête collée : le modèle a re-éclairé le visage pour la nouvelle
 *      coupe, et on repose par-dessus un visage éclairé pour l'ancienne.
 *      ChatGPT ne fait rien de tel.
 *   2. LE MASQUE. Il interdit au modèle de retoucher hors de la couronne de
 *      cheveux. Il ne peut donc pas rattraper une ombre sur la joue, un reflet
 *      sur l'épaule, un contre-jour dans la nuque — tout ce qui fait qu'une
 *      coupe a l'air POSÉE SUR quelqu'un plutôt que collée devant.
 *   3. LA RÉDUCTION À HUIT CENTS POINTS avant l'envoi, pour tenir le budget de
 *      temps d'une fonction serveur. ChatGPT reçoit la photo entière.
 *   4. CETTE CONSIGNE-CI. Deux mille signes d'interdictions — « le visage trait
 *      pour trait », « absolument rien d'autre ne bouge », « un résultat
 *      identique est un échec ». Chaque ligne a été ajoutée après un défaut
 *      constaté, et l'ensemble tire le modèle vers la prudence : une image
 *      qu'on retouche le moins possible est une image qui a l'air retouchée.
 *
 * ═══ CE QUE CETTE FONCTION SERT À MESURER ══════════════════════════════════
 *
 * ELLE EST LA PHRASE QU'ON TAPERAIT DANS CHATGPT, et rien de plus. Avec le
 * mode brut — voir `essai-genere.ts` — elle part sans masque et le rendu
 * revient sans recomposition, sur une photo moins réduite. C'est donc la
 * comparaison à UNE SEULE VARIABLE qu'on n'avait jamais faite : notre pile,
 * sans nos quatre ajouts.
 *
 * ET ELLE TRANCHE UNE QUESTION QU'ON NE PEUT PAS TRANCHER EN LISANT DU CODE.
 * Si le rendu brut ressemble à celui de ChatGPT, le défaut est dans nos
 * verrous, et il faut les refaire autrement — un fondu qui suit la lumière
 * plutôt qu'un contour, un masque plus large, une consigne plus courte. S'il
 * reste mauvais, le défaut est ailleurs, et on aura cessé de soupçonner les
 * bons.
 *
 * ELLE NE PROTÈGE RIEN, ET C'EST ASSUMÉ. Le visage peut bouger ; c'est
 * exactement ce que le mode brut sert à voir. Il ne doit donc jamais devenir
 * le mode par défaut sans qu'on ait regardé ce qu'il rend.
 */
export function consigneBrute(
  partie: string,
  change?: string,
  decrire?: string,
  avecReference = true,
): string {
  const quoi = change?.trim() || "la zone concernée";
  return [
    `Voici la photo d'une personne, montrant ${partie}.`,
    decrire
      ? `Modifie ${quoi} pour obtenir : ${decrire}.`
      : `Modifie ${quoi} en suivant la seconde image.`,
    avecReference && decrire
      ? "La seconde image montre le résultat visé sur quelqu'un d'autre : elle ne sert que de référence pour la forme, la couleur et la matière."
      : "",
    "Garde la même personne, la même pose, le même cadrage et la même lumière.",
    "Le résultat doit ressembler à une vraie photographie de cette personne.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * ═══ LA CONSIGNE CALQUÉE SUR CELLE QUI MARCHE ══════════════════════════════
 *
 * « Dis-moi ce que tu as demandé à l'API pour réaliser cette coupe, ainsi je
 * le dirai à mon codeur pour qu'il fasse à l'identique. »
 *
 * IL EST ALLÉ CHERCHER LE TEXTE EXACT, ET LE VOICI TRADUIT EN GABARIT. C'est
 * la seule formulation de ce dossier dont on ait la preuve qu'elle rend le bon
 * résultat sur SA photo. Tout le reste — trois mille neuf cents signes
 * d'interdictions accumulées — n'a jamais produit que des rendus qu'il refuse.
 *
 * ═══ CE QUI LA DISTINGUE DE LA NÔTRE, ET C'EST STRUCTUREL ══════════════════
 *
 *   · ELLE DÉSIGNE L'IMAGE DE BASE EN PREMIÈRE PHRASE, et elle la DÉCRIT :
 *     « the photograph of the client showing … ». La nôtre présentait deux
 *     images à rôles égaux et expliquait ensuite lequel était lequel.
 *   · ELLE DIT « CHANGE ONLY … », une seule fois, au lieu de répartir la même
 *     idée sur quarante lignes de protections.
 *   · ELLE ORDONNE D'EFFACER L'EXISTANT, explicitement — c'est la ligne qu'on
 *     n'avait pas du tout, et celle qui laissait les longueurs sur les épaules.
 *   · ELLE EST EN ANGLAIS, d'un bout à l'autre, et d'un seul tenant.
 *   · ELLE FINIT PAR « Output only the edited photograph. »
 *
 * ═══ CE QUE JE N'AI PAS RECOPIÉ, ET POURQUOI ═══════════════════════════════
 *
 * IL A MIS LA RÉFÉRENCE EN PREMIER ET LA CLIENTE EN SECOND. Nous envoyons la
 * cliente en premier. Sur `/v1/images/edits`, la PREMIÈRE image est la toile :
 * c'est elle que le modèle édite, et c'est elle dont le masque prend les
 * dimensions. Inverser l'ordre risquerait de rendre la photo de la RÉFÉRENCE
 * retouchée — c'est-à-dire une autre femme, exactement le défaut qu'on vient
 * de corriger.
 *
 * ET SON OUTIL N'EST PAS CETTE API. Il l'a écrit lui-même : « j'ai appelé
 * l'outil de création d'images intégré à cette conversation, pas directement
 * l'API publique ». L'ordre des images n'y veut donc pas forcément dire la
 * même chose. La phrase est recopiée ; la place des images reste celle que
 * notre point d'entrée impose. L'inversion se mesure au banc d'essai, où elle
 * ne casse rien si elle échoue.
 *
 * LA DESCRIPTION RESTE EN FRANÇAIS AU MILIEU DE L'ANGLAIS. Elle vit dans les
 * données du métier — `decrire` — et la traduire pièce par pièce serait une
 * seconde source de vérité à maintenir, donc une seconde source d'erreur. Ces
 * modèles lisent les deux langues dans la même phrase.
 */
export function consigneCalquee(
  partie: string,
  change?: string,
  decrire?: string,
  avecReference = true,
): string {
  /* LE « uniquement » FRANÇAIS SORT, PARCE QUE L'ANGLAIS DIT DÉJÀ « ONLY ».
     Sans ça la phrase donnait « Change ONLY uniquement les cheveux », et une
     consigne qui bégaie dans deux langues est une consigne qu'on lit mal. */
  const quoi =
    change?.trim().replace(/^uniquement\s+/i, "") || "the area shown in the second image";
  const court = quoi.split(":")[0].trim() || quoi;
  return [
    `Edit the FIRST image as the base: the photograph of a client showing ${partie}.`,
    "Preserve this person's exact facial identity, expression, face shape, body,",
    "pose, clothes, accessories, framing, lighting and background.",
    avecReference
      ? `Change ONLY this, and nothing else — ${quoi} — to match the SECOND image, treating that second image solely as a visual reference for ${court}, never as a face, body, clothing or background reference.`
      : `Change ONLY this, and nothing else — ${quoi} — following the written specification below.`,
    decrire ? `Reproduce the geometry faithfully: ${decrire}.` : "",
    /* LA LIGNE QU'ON N'AVAIT PAS DU TOUT, et celle qui laissait les longueurs
       sur les épaules. Raccourcir, c'est ENLEVER, et « modifier » ne le dit
       pas. On nomme la chose en français entre parenthèses plutôt que de la
       traduire : traduire chaque métier serait une seconde vérité à tenir. */
    `Completely remove what is currently there (${court}); nothing of it may remain visible in the result, not even partially, not even at an edge.`,
    "Do not produce a flat, generic or artificial-looking result.",
    "Fit it naturally at the scale of the base photograph, maintaining photographic",
    "realism and the existing lighting.",
    "Output only the edited photograph.",
  ]
    .filter(Boolean)
    .join("\n");
}
