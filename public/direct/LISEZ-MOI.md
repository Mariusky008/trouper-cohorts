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
| `table-salon-bougie.jpg` | **Fabriqué ici**, en posant `bougie-seule.png` sur la table avec une ombre de contact. Un objet posé sur une surface se compose bien : il a une base et rien à épouser. |
| `vinyles-a-donner.jpeg` | La carte « je donne 20 vinyles » sur le mur de Margot. |
| `billets-concert.jpg` | La carte « je cherche 2 places ». |
| `poignet-nu.jpg` | Une carte du mur de la bijoutière. Ce n'est pas un poignet nu — c'est un buste, bras croisés — donc il ne sert pas à l'essai. |

### Ce qui manque encore, et ce n'est pas une préférence

`bracelet-seul.png` et `collier-seul.png` sont deux **découpes de produit
impeccables**, et elles ne suffisent pas. Essai fait, résultat sans appel :
poser une découpe sur un poignet donne un bijou **qui flotte**. Il ne suit ni la
courbe du bras, ni sa lumière, ni son ombre, et ça se voit en un dixième de
seconde. Le montrer prouverait le contraire de ce qu'on veut prouver.

Ces deux pièces sont donc marquées **« Bientôt essayable »** à l'écran — visibles,
lisibles, non sélectionnables. Pour les débloquer, il faut pour **chacune** :

| Fichier | Ce qu'il montre |
|---|---|
| `poignet-riviere.jpg` | Le même poignet que `poignet-avant.jpg`, portant le bracelet rivière. |
| `cou-collier.jpg` | Un décolleté portant le collier — même règle : pas de visage, et un `cou-nu.jpg` au même cadrage. |
| `table-salon-fleurs.jpg` | La table de `table-salon.jpeg`, avec la bougie aux fleurs séchées. |

**La règle tient en une phrase : deux photos qui ne se correspondent pas ne
prouvent rien, sinon qu'on sait afficher deux images l'une après l'autre.**

### Un arbitrage à confirmer

`vinyles-a-donner.jpeg` montre des pochettes de disques avec des **visages
imprimés reconnaissables** (Louis Armstrong, Joan Baez) et des marques de labels.
Ce sont des objets photographiés, pas des personnes présentes — et c'est
exactement la photo que quelqu'un prendrait pour donner ses vinyles. Elle est
donc gardée, dans le même esprit que les deux exceptions datées plus haut, **et
elle attend la même validation explicite qu'elles.**

