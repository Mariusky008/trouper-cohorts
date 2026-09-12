# Les photos d'illustration du Direct

Vingt-quatre photos : quatorze commerces, six plats du jour, quatre événements
de la ville, et trois photos « de client ». Elles ne servent qu'à DEUX cas :

1. **Les cartes de la ville** montrées à l'acte 3 de la démonstration. Elles
   décrivent d'autres commerces que celui qui regarde — on ne peut donc pas y
   mettre ses photos à lui, et on ne veut nommer personne.
2. **Le repli** quand un commerçant n'a aucune photo sur sa fiche Google.

Partout ailleurs, ce sont SES photos qui sont affichées. C'est délibéré : ce qui
frappe un commerçant, c'est de voir son propre commerce dans l'écran de ses
clients, pas une image de banque plus jolie que la réalité.

## Les noms de fichiers attendus

Le code les cherche à ces adresses exactes. Un fichier absent n'est pas une
panne : la carte retombe sur son fond dégradé (voir `carte-swipe.tsx`, où
l'image et le dégradé sont deux couches empilées, précisément pour ça).

| Fichier                | Ce qu'il montre                                  |
|------------------------|--------------------------------------------------|
| `plat-du-jour.jpg`     | Une assiette de plat du jour                      |
| `tables-libres.jpg`    | Une salle de restaurant, tables vides             |
| `sortie-du-four.jpg`   | Des viennoiseries qui sortent du four             |
| `vitrine-du-soir.jpg`  | Une vitrine de commerce éclairée, le soir         |
| `portion-a-emporter.jpg` | Une part soulevée d'un plat entamé              |
| `tablee-du-soir.jpg`   | Une tablée conviviale, le soir                    |
| `portant-boutique.jpg` | **RETIRÉE DU PRODUIT** — enseigne lisible, logo de marque voisin, neuf visages de face. Remplacée par `vitrine-mode.jpg`. |
| `friperie-rayon.jpg`   | Des rayons de friperie, cintres serrés            |
| `etal-boucher.jpg`     | Un étal de boucherie : côtes, saucisses, paupiettes. 626 × 877. Les deux premiers envois portaient un filigrane de photographe — celui-ci est vérifié sur les quatre bords. |
| `vitrine-mode.jpg`     | Une vitrine de prêt-à-porter, mannequins habillés. Ni visage, ni enseigne lisible. 387 points de large : légèrement molle sur un téléphone récent. |
| `verre-au-comptoir.jpg`| Un comptoir de bar à vins, fûts au plafond        |
| `terrasse-au-soleil.jpg` | Une terrasse en plein soleil                    |
| `fauteuil-coiffeur.jpg`| Un fauteuil de coiffeur libre                     |
| `salon-neuf.jpg`       | Un salon de coiffure qui vient d'ouvrir           |
| `bouquet-du-jour.jpg`  | Un bouquet devant une fenêtre                     |
| `pose-ongles.jpg`      | Une main aux ongles posés                         |

## Les six plats du jour

C'est la photo qui décide qu'on y va — pas celle de la salle. Chaque restaurant
montre SON plat : trois cartes partageant la même assiette se voyait
immédiatement.

| Fichier                  | Le plat                                         |
|--------------------------|-------------------------------------------------|
| `plat-garbure.jpg`       | Garbure landaise dans sa marmite                |
| `plat-lasagnes.jpg`      | Lasagnes maison au plat                         |
| `plat-axoa.jpg`          | Axoa de veau en cocotte                         |
| `plat-basquaise.jpg`     | Poulet basquaise à la poêle                     |
| `plat-parmentier.jpg`    | Parmentier de canard entamé                     |
| `plat-formule.jpg`       | Sandwich, boisson et chips                      |

## Les quatre événements de la ville

Publiés par la mairie, l'office de tourisme, un musée, une association. Même
cadre que les cartes de commerce.

| Fichier                     | Ce qu'il montre                              |
|-----------------------------|----------------------------------------------|
| `concert-kiosque.jpg`       | Un concert, guitares et fumigènes             |
| `marche-producteurs.jpg`    | Un étal de producteur                         |
| `nocturne-musee.jpg`        | Un grand hall de musée                        |
| `vide-grenier.jpg`          | Un étal de brocante                           |

## Les trois photos « de client »

Elles n'illustrent PAS un commerce : elles jouent les photos que les clients
ajoutent à leur avis, et c'est un tout autre registre. Elles doivent avoir
l'air prises au téléphone — une photo de banque d'images en guise de photo de
cliente détruit exactement ce qu'on veut montrer. Aucune contrainte de cadre :
elles s'affichent en vignettes carrées et sur le mur du commerce.

| Fichier              | Ce qu'il montre                                   |
|----------------------|---------------------------------------------------|
| `avis-coupe.jpg`     | Une coupe terminée, vue de dos                    |
| `avis-ongles.jpg`    | Une main aux ongles finis                         |
| `avis-bouquet.jpg`   | Un bouquet une fois rentré à la maison            |
| `avis-cabine.jpg`    | Une cliente et le vêtement qu'elle essaie         |
| `avis-verre.jpg`     | Un apéritif sur une table de terrasse, au couchant |

## La vidéo

Une seule, sous le pli, sur « Le service du midi » de Chez Bergine.

| Fichier                | Ce que c'est                                        |
|------------------------|-----------------------------------------------------|
| `service-cuisine.mp4`  | 10 s, H.264, 502 Ko — téléphones et Safari          |
| `service-cuisine.webm` | La même en VP9, 562 Ko — navigateurs sans H.264     |
| `service-cuisine.jpg`  | L'affiche, 28 Ko — la SEULE chose téléchargée avant qu'on lance |

**Elle n'est jamais sur la face de la carte**, et ce n'est pas négociable : une
vidéo dans un paquet qu'on balaie rend l'application lourde, coûte de la donnée
à quelqu'un debout dans la rue, et retarde le geste. Sous le pli, elle a un vrai
rôle : on a vu le plat, il donne envie, on descend, on voit la cuisine.

Muette, en boucle, dix secondes, `preload="none"`. Jamais de son qui démarre
tout seul. Deux sources parce qu'un navigateur livré sans codec propriétaire
resterait sinon sur l'affiche sans rien dire.

Format attendu pour les suivantes : vertical, 10 s maximum, sans musique.

## LA RÈGLE QUI VAUT POUR TOUTES

Aucune enseigne lisible, aucun logo, aucun visage reconnaissable. Les commerces
de la maquette sont des voisins anonymes — « un salon du centre », « une
boutique de la rue piétonne ». Une devanture identifiable ferait passer un vrai
commerçant pour un client de ClikMe sans qu'il ait rien signé, et ça vaut aussi
pour l'image des gens.

DEUX EXCEPTIONS RESTENT, ET ELLES SONT DATÉES. `avis-cabine.jpg` porte un
visage de face, `avis-verre.jpg` une marque sur trois verres. Le propriétaire du
produit les a validées explicitement : la page est en `noindex`, elle se partage
par lien à une trentaine de testeurs, et elle n'a aucun but commercial.

**Ce sont donc les deux premières à remplacer le jour où la page sort de ce
cercle** — mise en ligne publique, capture dans un dossier investisseur,
argumentaire commerçant.

LA TROISIÈME A DÉJÀ ÉTÉ RETIRÉE, et c'est ce seuil-là qui l'a décidé.
`portant-boutique.jpg` — enseigne lisible, logo de marque sur la boutique
voisine, neuf visages de face — est sortie du produit le jour où l'on a
fabriqué un flyer imprimé par métier. Un imprimé distribué en main propre EST
un argumentaire commerçant : la ligne ci-dessus n'était pas une précaution
d'écriture, c'était une échéance, et elle est arrivée.

UNE QUATRIÈME A FAILLI ENTRER, DEUX FOIS. Les deux premiers envois
d'`etal-boucher.jpg` portaient un filigrane de photographe incrusté en travers
de l'image ; il se serait imprimé sur le flyer, et l'image n'était pas à nous.
Le troisième est propre.

**COMMENT ON LE VÉRIFIE, PARCE QUE ÇA NE SE VOIT PAS SUR LA VIGNETTE :** un
filigrane se cache sur un bord, en gris translucide, et disparaît dès qu'on
regarde l'image en petit. On découpe donc les quatre bords, on les redresse et
on les agrandit — voir `boucher-bords.png` dans le brouillon. Trente secondes,
et ça évite un tirage à jeter.

Les deux photos de portion et de tablée avaient été ajoutées parce que deux moments n'avaient AUCUNE
image juste : « il m'en reste » tombait sur l'assiette du menu du jour (une
image qui contredit son texte), et « une table à partager » sur une devanture
vide. Elles ne sont pas là pour varier — elles sont là parce que la carte ment
sans elles.

## Le format, et pourquoi il n'est pas négociable

- **Vertical, ratio 3:4.** Le cadre de la carte est en 3/4,15 : une photo
  horizontale s'y fait couper les deux côtés.
- **1200 × 1600 px** suffit. La plus grande carte fait 250 px de large en CSS ;
  sur un téléphone à 3×, ça monte à 750 px physiques.
- **JPEG, 200 à 400 Ko.** Le fond est très sombre, monter en qualité ne se voit
  pas et coûte du temps de chargement à un moment où l'on ne peut pas se le
  permettre.

## LE CADRAGE — c'est ce qui compte le plus

Le bas de la carte est recouvert d'un voile dégradé qui porte le nom, le métier,
l'offre et le prix. Ce voile est opaque à 72 % dès 58 % de la hauteur.

| Zone de l'image | Ce qu'on en voit                                    |
|-----------------|------------------------------------------------------|
| 0 – 15 %        | Légèrement assombri (le badge du temps y est posé)   |
| **15 – 50 %**   | **Pleinement visible — le sujet va ICI**             |
| 58 – 100 %      | Noirci, puis illisible                                |

Autrement dit : **le sujet doit être dans la moitié haute**, pas au centre. Une
assiette parfaitement centrée disparaît à moitié sous le texte.

Le recadrage est en `cover` centré : une image plus haute que 3:4 est rognée en
haut ET en bas, symétriquement. Prévoir un peu d'air au-dessus du sujet.


## Le carrousel de l'annonce — ce qui manque

Depuis que l'annonce accepte plusieurs photos (`CarteAutour.photos`), il en
faut deux ou trois par commerce. Quand rien n'est fourni, la galerie se déduit
de ce qui existe déjà : la photo de l'annonce, celle du menu, celles de chaque
moment de la journée. Ça suffit pour les **restaurants**, dont les moments
portent chacun une photo de plat.

**Partout ailleurs, il n'y avait qu'une seule image**, donc pas de carrousel.
Pour que la fonction se voie à l'essai, quatre fiches se prêtent provisoirement
leurs images :

| Fiche | Photos aujourd'hui | À remplacer par |
|---|---|---|
| Un salon du centre | `fauteuil-coiffeur` + `salon-neuf` | deux vues de CE salon |
| Un salon qui vient d'ouvrir | `salon-neuf` + `fauteuil-coiffeur` | deux vues de CE salon |
| Un bar à vins | `verre-au-comptoir` + `terrasse-au-soleil` | deux vues de CE bar |
| Une terrasse au soleil | `terrasse-au-soleil` + `verre-au-comptoir` | deux vues de CE bar |

Deux salons ne partagent pas leur intérieur dans la vraie vie : c'est un
emprunt de maquette, pas une intention.

**Ce qui reste sans carrousel, faute d'images :** la boutique de la rue
piétonne, la friperie, la fleuriste, la prothésiste ongulaire, la boulangerie
et le traiteur. Il leur faudrait **une ou deux photos chacun** — la devanture,
un rayon, un produit — pour que leur annonce se raconte comme celle d'un
restaurant.


## Ses photos, au bas de l'annonce — et quatre fichiers à ne pas y mettre

Sous le pli, l'annonce ne montrait presque rien après le menu : une photo de
plat, trois lignes de fiche, et le mur des clients — vide le premier jour. On
demandait de choisir un endroit sur une seule image, cadrée sur une assiette.

`CarteAutour.sesPhotos` répond à ça. Ce sont **les photos du commerçant**, du
genre de celles qu'on reprend de sa fiche Google en lui fabriquant son site :
il ne photographie rien de plus, et son annonce n'est pas vide le premier jour.
Elles sont **légendées** — « la salle », « un autre jour » — et **séparées du
mur des clients**, qui suit : les siennes sont choisies, les leurs sont vraies.

### La règle, et pourquoi elle est plus stricte ici qu'ailleurs

Ce bloc AFFIRME que ces images appartiennent au commerce nommé juste au-dessus.
Une photo qui porte l'enseigne d'un autre commerce, le filigrane d'un
photographe, ou des visages reconnaissables, attribue donc à quelqu'un ce qui
est à un autre — et le dit noir sur blanc, avec une légende. Une image
d'illustration passe ailleurs ; ici elle ment.

**Quatre fichiers sont écartés de `sesPhotos` pour cette raison :**

| Fichier | Ce qu'on y voit vraiment | Pourquoi il ne peut pas servir ici |
|---|---|---|
| `vitrine-du-soir.jpg` | La devanture éclairée de **La Commanderie** | Enseigne d'un vrai commerce, parfaitement lisible |
| `service-cuisine.jpg` | Un curry sur une table de terrasse, enseigne **ZAW** et carte des cocktails | Ce n'est pas une cuisine — le nom du fichier ment — et l'image est marquée |
| `plat-parmentier.jpg` | Un parmentier, filigrane **« Photo MAMSOOK »** | Crédit d'un photographe incrusté dans l'image |
| `tablee-du-soir.jpg` | Une tablée, le soir | Visages reconnaissables de personnes réelles |

Ces quatre-là servent encore ailleurs (photo d'annonce, photo de menu, mur des
clients) : **ils y posent le même problème**, en moins explicite. Les remplacer
règle les deux d'un coup — c'est la première chose à faire avant de montrer la
maquette à un commerçant qui reconnaîtrait La Commanderie.

### Ce qui est renseigné aujourd'hui

Quatre restaurants, avec les seules images vérifiées libres d'enseigne, de
filigrane et de visage : `tables-libres`, `terrasse-au-soleil`, `plat-axoa`,
`plat-basquaise`, `plat-formule`.

| Fiche | Ses photos |
|---|---|
| Chez Bergine | la salle, la terrasse, un plat d'un autre jour |
| Le Bocal de Margot | deux plats d'autres jours |
| L'Ardoise Landaise | la terrasse, deux plats d'autres jours |
| La Grande Tablée | la grande table, un plat d'un autre soir |

**Ce qui manque :** le Pétrin d'Amanieu et Maison Lartigue n'ont rien, faute
d'image juste — un fournil et un laboratoire ne se remplacent pas par une salle
de restaurant. Et rien pour les métiers hors bouche. Il faudrait **deux ou trois
photos par commerce** : le lieu, la devanture, un produit.

## Les deux vidéos, et pourquoi aucune ne peut servir de portrait

Vérifiées image par image le jour où l'on a voulu les mettre dans le rond de la
voix du commerçant, qui s'agrandit sur appui.

- **`coiffure.mp4` / `.webm` — INUTILISABLE.** Deux visages reconnaissables, de
  face, en gros plan pendant toute la séquence. C'est le cas le plus net
  d'interdiction de ce document. Le fichier n'est utilisé nulle part dans le
  produit ; il ne doit pas commencer à l'être.
- **`service-cuisine.mp4` / `.webm` — GARDÉE, ARBITRAGE RENDU.** Une **enseigne
  lisible** apparaît au second plan, sur une carte de menu posée sur la table.
  Décision : « c'est une démo, donc personne ne la verra, donc ce n'est pas
  important s'il y a une enseigne ». Elle sert donc de doublure à la voix de
  Margot, en plus du moment où elle était déjà.
  **Ce qui reste à savoir** : le rond de la voix s'agrandit sur appui, donc
  l'enseigne devient lisible là où elle ne l'était pas. Le fichier disparaîtra
  le jour où un vrai commerçant filmera la sienne.

**La différence entre les deux n'est pas une question de degré.** Une enseigne
au second plan est une question de marque, et elle s'arbitre. Un visage est le
droit à l'image d'une personne qui n'a rien signé, et il ne s'arbitre pas au
motif que l'audience est petite — c'est précisément l'argument qui ne tient
devant personne. `coiffure` reste donc dehors.

## 👻 Les photos du fantôme — ce qui est arrivé, ce qui manque encore

Huit fichiers ont été livrés. Trois portaient un nom qui ne correspondait pas à
ce qui était demandé, et ils ont été renommés à l'arrivée : `bougie-seule.png.png`
→ `bougie-seule.png`, et deux `.jpeg` gardés tels quels (`table-salon.jpeg`,
`vinyles-a-donner.jpeg`).

### Ce qui marche, et pourquoi

| Fichier | Ce qu'il fait |
|---|---|
| `poignet-avant.jpg` | **Fabriqué ici**, par recadrage de `poignet-bracelet.jpg` sur la partie sans bijou. C'est l'AVANT de l'essai chez la bijoutière. |
| `poignet-bracelet.jpg` | L'APRÈS. **Le même bras, la même lumière, le même fond** — c'est la seule condition pour qu'un avant-après démontre quelque chose. |
| `table-salon.jpeg` | L'AVANT de l'essai chez la cirière : la table vide. |
| `table-salon-bougie.jpg` | **Fabriqué ici** à la main, avant que le calcul existe. L'écran ne s'en sert plus : il compose la même image tout seul, en direct. Gardé comme point de comparaison. |
| `vinyles-a-donner.jpeg` | La carte « je donne 20 vinyles » sur le mur de Margot. |
| `billets-concert.jpg` | La carte « je cherche 2 places ». |
| `poignet-nu.jpg` | Une carte du mur de la bijoutière. Ce n'est pas un poignet nu — c'est un buste, bras croisés — donc il ne sert pas à l'essai. |

### Ce qui a changé : on n'a plus besoin de paires

Cette section demandait des **paires** — le même poignet nu puis portant le
bijou, la même table vide puis garnie — parce que poser une découpe sur un
poignet donnait un bijou **qui flottait**, et qu'il fallait donc photographier
chaque résultat à l'avance.

**Ce n'est plus vrai, et ça change ce qu'on doit demander.** Le rendu se calcule
maintenant dans le téléphone, sur la photo du client, en une soixantaine de
millisecondes (`src/lib/direct/essai.ts`). Une pièce n'a donc plus besoin de sa
photo de résultat : elle a besoin de **sa propre découpe**, une seule fois.

Ce qui manquait au bijou n'était pas une photo, c'étaient deux choses : l'arc
arrière doit passer **derrière** le bras, et la pièce doit prendre **la lumière
de la peau**. Les deux sont faites.

#### Les découpes fabriquées ici

| Fichier | D'où il vient |
|---|---|
| `decoupe-bracelet.png` | Produit par **notre propre détourage** (`src/lib/direct/detourage.ts`) à partir de `bracelet-seul.png` reposé sur un fond de papier, avec ombre et grain — c'est-à-dire « la photo telle que le commerçant l'aurait prise ». |
| `decoupe-collier.png` | Idem, sur fond gris. Le détourage a percé tout seul la boucle fermée du collier ET son buste d'exposition. |
| `decoupe-bougies.png` | Idem, sur fond bois. |

#### Ce qui manque encore, et ce n'est plus le même besoin

| Fichier | Ce qu'il montre | Ce qu'il débloque |
|---|---|---|
| `cou-nu.jpg` | Un décolleté **nu**, sans visage, à plat et à la lumière du jour. | Le collier. Un collier essayé sur un **poignet** donne une chaîne drapée sur une main — le calcul fait ce qu'on lui demande, c'est la demande qui est fausse. Il faut le bon endroit du corps, pas une paire. |
| `table-salon-fleurs.jpg` *(ou une découpe)* | La bougie aux fleurs séchées. | Une découpe sur fond uni suffit maintenant — la photo de la table garnie n'est plus nécessaire. |

`poignet-riviere.jpg` **n'est plus demandé** : le bracelet rivière s'essaie.

**La règle a donc changé de forme mais pas de fond : ce qu'on montre doit avoir
été fabriqué pour la personne qui regarde. Avant on le photographiait, maintenant
on le calcule — mais on ne l'emprunte toujours pas.**

### Un arbitrage à confirmer

`vinyles-a-donner.jpeg` montre des pochettes de disques avec des **visages
imprimés reconnaissables** (Louis Armstrong, Joan Baez) et des marques de labels.
Ce sont des objets photographiés, pas des personnes présentes — et c'est
exactement la photo que quelqu'un prendrait pour donner ses vinyles. Elle est
donc gardée, dans le même esprit que les deux exceptions datées plus haut, **et
elle attend la même validation explicite qu'elles.**


---

## 🪞 L'essayage sur soi — ce qu'il faut fournir, et ce qu'il coûte

L'essai ne calcule plus le rendu lui-même. Il envoie **deux photos** à un modèle
d'image : celle du client, et **celle du commerçant**. Cette bascule vient d'une
démonstration faite sur le terrain — la même main et la même photo de référence
données à ChatGPT ou Gemini rendent un résultat parfait, là où le calcul
géométrique rendait des taches de couleur.

### Ce qu'une pièce doit porter

| Champ | Ce que c'est |
|---|---|
| `reference` | **La photo du travail fini, sur une vraie personne.** C'est elle qu'on essaie, et c'est elle qu'on voit dans la grille. Un aplat de couleur ne se désire pas. |
| `photo` | Ce qui s'affiche sur la vignette. En général la même image. |

**La photo de référence est le produit.** Plus elle est nette, bien éclairée et
cadrée serré sur la zone (les ongles, le poignet), meilleur est le rendu. Une
photo de catalogue sur fond blanc marche moins bien qu'une photo prise sur une
cliente : le modèle a besoin de voir comment la chose se pose sur une peau.

### Ce qu'il faut sur le serveur

`GEMINI_API_KEY` (recommandé) ou `OPENAI_API_KEY`. Sans l'une des deux, l'écran
affiche la raison et propose de reprendre la photo — **il ne retombe jamais sur
l'ancien moteur**, dont le rendu a été jugé sans appel.

Réglages facultatifs : `GEMINI_IMAGE_MODEL`, `OPENAI_IMAGE_MODEL`,
`GEMINI_BASE_URL`, `OPENAI_BASE_URL` (ces deux dernières servent à pointer vers
un faux fournisseur en recette, pour éprouver tout le chemin sans dépenser).

### Ce que ça coûte, et ce que ça implique

Quelques centimes et quelques secondes par essai. Le quota de trois fantômes par
jour, qui existait pour une raison de produit, plafonne aussi la facture.

**Et la photo du client sort du téléphone.** C'était l'argument du moteur
précédent (« rien n'est envoyé »). L'écran le dit désormais en toutes lettres au
moment du rendu, et rien n'est conservé côté serveur.

### Le coiffeur et le prêt-à-porter — ce qui existe, ce qui manque

Deux murs d'essai ont été ajoutés. Ils tombaient jusque-là sur ceux de l'onglerie
et de la bijoutière : « Photographiez votre main » chez un coiffeur.

| Fichier | D'où il vient | Ce qu'il fait |
|---|---|---|
| `mode-combinaison.jpg` | **Découpé ici** dans `vitrine-mode.jpg` (le mannequin central) | Référence de la combinaison beige. Aucun visage. Un peu molle : la source ne fait que 387 points de large. |
| `mode-chemise-jean.jpg` | **Découpé ici** dans `avis-cabine.jpg` (le vêtement seul) | Référence de la chemise en jean. **Le recadrage retire le visage** qui se trouvait dans la source — une dérivation qui améliore la règle au lieu de l'entamer. |
| `avis-coupe.jpg` | Déjà présent | Référence du motif rasé sur la nuque. Vu de dos, aucun visage : c'est la meilleure référence de coiffure du dépôt. |

#### Ce qui manque, et ce n'est plus un problème de calcul

| Fichier | Ce qu'il montre | Ce qu'il débloque |
|---|---|---|
| `coiffure-balayage.jpg` | Une tête vue de trois quarts, **balayage fini**, sans visage reconnaissable de préférence. | La pièce « Balayage miel ». |
| `coiffure-carre.jpg` | Un carré dégradé fini, même règle. | La pièce « Carré dégradé ». |
| `mode-robe.jpg` | La robe à carreaux seule, sur mannequin ou à plat. | La pièce « Robe à carreaux ». |
| `portrait-avant.jpg` | **Une tête, de face, cheveux dégagés, sans visage reconnaissable** — un défi, mais c'est la seule chose qui manque pour que le chemin « voir avec la photo d'exemple » démontre quelque chose chez le coiffeur. | La démonstration sans sortir son téléphone. |

### Les coupes de face, et le tatoueur — ce qu'il faut déposer

Deux demandes du terrain, le même besoin : **une référence vue du même angle que
la photo du client.**

> « Il faudrait une coupe de devant pour homme et une coupe de devant pour femme,
> si besoin de photo tu me donnes les intitulés et je les mets. »

> « Il faut aussi le rajouter dans cette démo dans la section des artisans :
> tatoueur, parce que c'est un commerce qui est souvent demandé. »

**Le défaut que ça corrige est plus profond qu'un manque de choix.** La seule
référence de coiffure essayable est `avis-coupe.jpg` : un motif rasé sur une
**nuque**, donc vue de dos. Or on se photographie **de face**. Le modèle recevait
une photo de face et une référence de dos, et devait deviner le reste. Un même
angle des deux côtés n'est pas un agrément, c'est la condition pour que le rendu
tienne.

**Les cinq sont arrivées.** Deux portent un autre nom que celui demandé, et
c'est le code qui s'est aligné sur les fichiers — renommer une image livrée est
le meilleur moyen de perdre la trace de ce qu'elle montre.

| Fichier livré | Ce qu'il montre | Ce qu'il débloque |
|---|---|---|
| `coiffure-homme-face.jpg` | Un homme de face, boucles courtes travaillées. | La pièce « Boucles courtes, de face », **et la photo d'exemple du coiffeur** — enfin un visage de face au lieu d'une nuque. |
| `coiffure-femme-face.jpg` | Une femme de face, carré long dégradé. | La pièce « Carré long, de face ». |
| `atelier-tatouage.jpeg` | L'atelier. *Livrée en 2500 × 3320 pour 2 Mo* — **réduite ici à 1054 × 1400 (275 Ko)** : c'est un fond de carte de 390 points, et deux mégaoctets en 4G se paient au premier chargement. | La carte du tatoueur, et le fond de son mur. |
| `cartoon-santa-muerte-portrait-1.webp` | **Une planche de flash** — un dessin sur fond blanc, pas un tatouage sur peau. C'est exactement la bonne référence : c'est ce que le tatoueur propose, et le modèle a pour travail de le poser sur l'avant-bras. | La pièce « Santa Muerte à la rose ». *La pièce a été renommée pour ce que la photo montre* — elle s'appelait « Serpent fin » en attendant l'image, et garder ce nom aurait refait la faute de la vignette de vernis : on choisit une chose et on en reçoit une autre. |
| `avant-bras.jpg` | Un avant-bras nu sur fond blanc. | La photo d'exemple du tatoueur. |

### Onze de plus, et les dernières « bientôt » du corps sont tombées

Un second envoi a réglé ce qui restait ouvert ci-dessus. Les fichiers portent
des noms génériques — le code s'est aligné sur eux plutôt que de les renommer.

| Fichier livré | Ce qu'il montre | La pièce qu'il débloque |
|---|---|---|
| `tattou1.jpg` | Un chat tribal au trait plein, détouré sur fond blanc. | « Chat tribal, trait plein » — une planche de flash, donc la référence exacte dont le modèle a besoin. |
| `tattou2.jpeg` | Une hirondelle et des fleurs de cerisier, encre bleue. | « Hirondelle et fleurs de cerisier ». **Remplace la « Branche fleurie »**, qui était marquée « bientôt » et portait la photo de l'ATELIER faute de mieux. Le tatoueur annonçait trois flashs sur sa carte et n'en avait qu'un d'essayable. |
| `coiffure1.jpg` | Une femme de face, boucles longues et frange. | « Boucles longues, frange ». **Remplace « Balayage miel »** (`coiffure-balayage.jpg`, qui n'est donc plus demandé). |
| `coiffure2.jpg` | Une femme de face, carré cuivré dégradé. | « Carré cuivré, dégradé ». **Remplace « Carré dégradé »**, qui portait la photo d'un fauteuil. |
| `ongles1.jpeg` | Une pose longue à décors noirs et rouges. | « Pose longue, décors noirs ». |
| `ongles2.jpeg` | Une pose amande pastel, motif feuille blanc. | « Pastel amande, motif feuille ». |
| `vetement1.jpeg` | Blouse imprimée et jean flare, en pied, fond neutre. | « Blouse imprimée et jean flare ». |
| `vetement2.jpg` | Ensemble molleton rose, en pied. | « Ensemble molleton rose ». |
| `vetement3.jpeg` | Ensemble brodé écru, en pied. *Livrée en 3248 × 4872 pour 2 Mo* — **réduite ici à 1200 × 1800 (230 Ko)**, exactement comme `atelier-tatouage.jpeg` avant elle : elle sert dans une vignette de 132 points et dans un rendu de 390, et deux mégaoctets en 4G se paient au premier chargement, debout dans la rue. | « Ensemble brodé écru ». |
| `vetement4.jpg` | Marinière rose et pantalon vichy, en pied. | « Marinière rose et pantalon vichy ». |
| `vetement5.jpeg` | Polaire rose à col zippé, plan serré. | « Polaire rose, col zippé ». **Remplace « Robe à carreaux »** (`mode-robe.jpg`, qui n'est donc plus demandé), laquelle proposait d'essayer une robe en montrant une devanture. |

**Les cinq tenues servent deux commerces** : la boutique du centre et la
friperie du vieux centre partagent la branche « mode », donc ce mur-là. C'est
exactement ce que le tableau des branches est là pour faire.

**Ce qui manque encore, et ce sont les deux derniers :** `cou-nu.jpg` pour le
collier, et une découpe de la bougie aux fleurs séchées. Leurs pièces restent
« bientôt essayables » et ne se choisissent pas — on ne sert jamais une image de
catalogue à la place d'un essai qui n'a pas eu lieu. Le jour où la photo arrive,
il suffit d'ajouter `reference` à la pièce et de retirer `bientot` dans
`lib/direct/fantomes.ts`.

### 👓 Le lunetier — cinq photos, un métier de plus

> « Rajouter un nouveau métier : lunetier. »

C'est le métier où l'essai vaut le plus cher après le tatoueur, et pour une
raison très concrète : **en boutique, on essaie flou.** Quelqu'un qui porte des
lunettes doit retirer les siennes pour en essayer d'autres, donc il ne voit pas
ce qu'il essaie, donc il demande à la personne qui l'accompagne — et il repart
sur l'avis de quelqu'un d'autre. Aucun autre commerce de cette liste n'a un
essai en magasin aussi mauvais.

| Fichier livré | Ce qu'il montre | Ce qu'il débloque |
|---|---|---|
| `lunetier.jpeg` | Un essai de réfraction chez l'opticien. | La carte du lunetier, le fond de son mur, et sa photo d'exemple. |
| `lunettes1.jpg` | Une monture carrée écaille à verres dégradés, détourée sur fond blanc. | « Carrée écaille, verres dégradés ». |
| `lunettes2.jpeg` | Une monture papillon fuchsia translucide, portée de face. | « Papillon fuchsia translucide ». |
| `lunettes3.jpeg` | Une monture œil-de-chat vert bouteille, portée de face. | « Œil-de-chat vert bouteille ». |
| `lunettes4.jpeg` | Une monture épaisse dégradée caramel, portée de face. | « Épaisse dégradée caramel ». |

**Sa consigne dit l'inverse de celle du coiffeur, et c'est le point.** Chez le
coiffeur, la liste `garder` exige que les lunettes ne bougent pas ; ici elles
sont la seule chose qui doit bouger, et la consigne demande explicitement de
**retirer** celles qui sont sur la photo — sans quoi le modèle en superpose deux
paires. C'est la démonstration que cette liste ne pouvait pas être écrite une
fois pour toutes dans la route.

**Ce qui manque pour lui, et c'est le même trou que pour le coiffeur :**
`portrait-avant.jpg` — une tête de face, sans visage reconnaissable de
préférence. Faute de portrait dans le dépôt, la « photo d'exemple » du lunetier
est celle de sa boutique, ce qui ne démontre rien : on voit un opticien au
travail, pas une monture posée sur un visage. Le vrai chemin — on se
photographie soi-même — fonctionne, et c'est écrit ici plutôt que masqué à
l'écran.

**La même réserve vaut pour les visages.** `coiffure1` et `coiffure2` montrent
des visages parfaitement reconnaissables, comme les deux coupes de face
précédentes, et pour la même raison assumée : une coupe ne se montre pas sans
tête. `ongles1` porte en plus un filigrane de studio (« DIME STUDIO ») en haut à
droite, et `coiffure1` un monogramme au centre — ils se voient dans la grille
des pièces. **C'est la première chose à refaire avant un argumentaire imprimé**,
au même titre que les deux exceptions datées plus haut.

**Une réserve à connaître sur les deux photos de coiffure.** Elles montrent des
visages parfaitement reconnaissables, alors que la règle du dépôt écrite plus
haut demande de l'éviter. C'est assumé et c'est différent : ce ne sont pas des
illustrations d'ambiance, ce sont des **références de coupe**, et une coupe ne se
montre pas sans tête. Elles jouent ici le rôle qu'elles jouent dans n'importe
quel salon — le book qu'on feuillette avant de s'asseoir.

**Pour le coiffeur, la photo d'exemple ne prouve rien aujourd'hui** : le dépôt n'a
aucun portrait utilisable, donc l'« avant » et la référence sont la même image.
Le vrai chemin — on se photographie soi-même — fonctionne. C'est écrit ici plutôt
que masqué à l'écran.

#### Une décision qui reste à prendre : le visage

Une coupe de cheveux ne s'essaie pas sans tête. La photo du client contient donc
son visage, et elle part chez le modèle le temps du rendu.

Ce n'est PAS une entorse à la règle ci-dessus : cette règle porte sur **les
photos d'illustration du dépôt**, celles qui montrent des inconnus à tout le
monde. Ici, c'est **sa propre photo**, prise par lui, jamais publiée tant qu'il
n'a pas appuyé sur « Je la prends » ou « Je passe ». L'écran le dit au moment du
rendu.
