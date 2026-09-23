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

### Ce qui est arrivé le 14 septembre, et ce qui a été écarté

Neuf fichiers envoyés pour trois commerces. **Six sont branchés, trois ne le
sont pas** — et les trois refus disent mieux la règle que la règle elle-même.

| Fichier | Ce qu'il montre | Où il sert |
|---|---|---|
| `boulange-comptoir.jpeg` | Le comptoir, viennoiseries et étiquettes à la craie. 1200 × 1200. | Boulangerie |
| `boulange-vitrine.jpg` | L'intérieur : comptoir, rayons à pain, mur de brique. 460 × 667. | Boulangerie |
| `salon-bacs.jpg` | Deux bacs à shampoing, l'étagère de produits, un fauteuil. 1086 × 1448. | Salon de coiffure |
| `bar-salle.jpg` | La salle et le comptoir, avant le service. 450 × 300. | Bar à vins |
| `bar-planche.jpg` | Une planche charcuterie-fromage. 667 × 667. | Bar à vins |
| `bar-cave.jpg` | Le casier à bouteilles, couchées, dans le noir. 1701 × 2560. | Bar à vins |

**`boulange-fournil.jpg` — écartée : un visage.** Un boulanger de face,
reconnaissable, devant son four. C'est exactement ce qui a fait retirer
`portant-boutique.jpg` du produit : on ne fait pas figurer quelqu'un de réel
dans la devanture d'un commerce inventé. Elle reste dans le dépôt et ne sert
nulle part.

**`salon-vitrine.jpg` — écartée : ce n'est pas un salon.** Une devanture de
Noël avec un piano et des sapins. Ni le métier, ni la saison — et une photo qui
ne montre pas le commerce qu'elle légende est pire qu'une photo absente.

**`salon-produits.jpg` — écartée : 291 × 173.** En vignette de cinquante-six
points elle passerait ; le problème est qu'**une vignette devient la grande
photo quand on appuie dessus**. Il en faut 780 de large pour un téléphone
récent, elle en a 291. C'est le format qui décide, pas le cadrage.

**Et une renommée.** Le fichier est arrivé sous le nom `Le mur de bouteilles,
étiquettes floues ou de dos.jpg` — ma propre description prise pour un nom.
Espaces, virgule et accent dans une URL : renommé `bar-cave.jpg`.

**Un point à surveiller.** `boulange-comptoir.jpeg` porte un **logo de marque**
(un réfrigérateur à jus, au fond). Le fond d'une boulangerie n'est pas une
enseigne, et la photo est de loin la meilleure des trois — les étiquettes à la
craie font tout son intérêt. Elle est branchée ; à remplacer le jour où une
équivalente sans logo arrive.

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

#### L'arrivage d'automne — dix-huit tenues de plus

**Pourquoi dix-huit d'un coup.** « Surprends-moi » pioche dans la collection
active ; à sept pièces, il retombait sur ce qu'on venait de voir dans la grille
une fois sur deux. Vingt à cinquante pièces actives, c'est le seuil à partir
duquel une proposition surprend vraiment — et c'est aussi ce qu'une petite
boutique a réellement en rayon.

**Toutes réduites à 1400 points de grand côté.** `mode-pull-mohair-marine.jpeg`
arrivait en 3000 × 4500 pour 2,3 Mo : elle sert dans une vignette de 118 points
et dans un rendu de 390, et deux mégaoctets en 4G se paient debout dans la rue.
Même traitement que `vetement3.jpeg` et `atelier-tatouage.jpeg` avant elles.

| Fichier | Ce qu'il montre | La pièce |
|---|---|---|
| `mode-pull-mohair-vert.jpeg` | Pull mohair vert d'eau, col rond, en buste. | « Pull mohair vert d'eau » · **en vitrine** |
| `mode-pull-mohair-marine.jpeg` | Pull mohair bleu marine sur chemise blanche. | « Pull mohair bleu marine » |
| `mode-pull-chevron-canard.jpeg` | Pull bleu canard, chevron rose et or. | « Pull chevron bleu canard » · **en vitrine** |
| `mode-pull-chevron-noir.jpeg` | Pull noir, chevron bleu roi et or. | « Pull chevron noir et or » |
| `mode-pull-ecru-rose.webp` | Pull écru, large bande rose et galon doré. | « Pull écru, bande rose » |
| `mode-gilet-orchidee.jpg` | Gilet fin rose orchidée, col V, fond studio. | « Gilet fin rose orchidée » |
| `mode-ensemble-maille-beige.jpg` | Ensemble maille beige : col roulé, jupe, gilet long. | « Ensemble maille beige » · **en vitrine** |
| `mode-robe-lavalliere.jpeg` | Robe midi imprimée rouge et rose, col lavallière. | « Robe midi, col lavallière » · **en vitrine** |
| `mode-robe-pois-dores.jpg` | Robe prune à grands pois dorés, ceinturée. | « Robe à pois dorés » |
| `mode-robe-volants-corail.jpg` | Robe à bretelles, volants étagés imprimés corail. | « Robe à volants corail » |
| `mode-robe-fleurs-noire.jpg` | Robe noire à grandes fleurs multicolores. | « Robe noire à fleurs » |
| `mode-doudoune-kaki.jpg` | Doudoune kaki brillante, capuche fourrée bordeaux. | « Doudoune kaki, capuche » · **en vitrine, et pièce du jour** |
| `mode-manteau-leopard.jpg` | Manteau mi-long en fausse fourrure léopard. | « Manteau léopard » · **en vitrine** |
| `mode-veste-dentelle.jpg` | Veste longue en dentelle fleurie noir et blanc. | « Veste longue en dentelle » |
| `mode-chemise-volants-rose.jpeg` | Chemise rose pâle, jabot de volants. | « Chemise rose à volants » |
| `mode-top-crochet-noir.jpg` | Top noir sans manches en crochet ajouré. | « Top en crochet noir » |
| `mode-jean-papillons.jpg` | Jean large clair imprimé de papillons noirs. | « Jean large à papillons » |
| `mode-pantalon-zebre.jpg` | Pantalon fluide zébré, gilet blanc sans manches. | « Pantalon fluide imprimé » |

#### Ce que le mur d'une PIÈCE demanderait

**Le mur se cadre maintenant sur la pièce qu'on vient d'essayer** — « la même
pièce, sur d'autres personnes », qui est la seule comparaison qui aide à
décider. Dans la démonstration il n'affiche **qu'une cliente par pièce**, et
c'est une limite de photos, pas de modèle.

**En production, chaque vignette est le rendu de cette cliente-là** : son propre
essayage, calculé sur sa propre photo. La démonstration ne peut pas en
fabriquer, et le dépôt n'a qu'UNE image par pièce — en mettre deux clientes
dessus afficherait deux fois la même photo côte à côte, c'est-à-dire un mur de
figurants.

**Pour qu'une pièce montre un vrai mur comme la maquette** (neuf femmes, le même
pantalon), il faudrait **six à neuf photos d'une même pièce portée par des
personnes différentes**, de morphologies et de tailles différentes, en pied ou
en buste. Une seule pièce suffit à le démontrer : c'est elle qui deviendrait la
pièce du jour.

**Six en vitrine, dix-neuf en réserve.** Le client ne voit que celles marquées
« en vitrine » ; les autres n'existent que pour « Surprends-moi ». C'est le
champ `vitrine` de `Piece` dans `lib/direct/fantomes.ts`, et c'est délibéré :
ClikMe doit réduire le choix, pas recréer un catalogue local.

**Les vingt-cinq tenues servent deux commerces** : la boutique du centre et la
friperie du vieux centre partagent la branche « mode », donc ce mur-là. C'est
exactement ce que le tableau des branches est là pour faire.

#### Le rayon homme — dix pièces

**Il a ouvert.** Ses pièces sont restées « bientôt essayables » tant que le
dépôt n'avait aucune photo de vêtement d'homme : la seule réponse honnête, parce
que les deux autres étaient de lui prêter les robes de la boutique d'à côté ou
de pointer des fichiers absents. Les dix photos sont arrivées.

**Dix, contre vingt-cinq chez la boutique de femme.** « Surprends-moi » y marche
— six en vitrine, quatre en réserve, donc il sort vraiment quelque chose qu'on
n'a pas vu — mais il fait le tour plus vite. L'écran du commerçant le dit :
« à partir de vingt pièces, les propositions deviennent vraiment variées. »

| Fichier | Ce qu'il montre | La pièce |
|---|---|---|
| `homme-veste-ciree-kaki.jpg` | Veste cirée kaki, col velours côtelé bordeaux. | « Veste cirée kaki » · **en vitrine, et pièce du jour** |
| `homme-chemise-denim.jpg` | Chemise en denim et pantalon large crème, en pied. | « Chemise en denim » · **en vitrine** |
| `homme-polo-marine-chino.jpg` | Polo marine à manches longues et chino beige. | « Polo marine et chino beige » · **en vitrine** |
| `homme-chemise-lin-bleu.jpg` | Chemise en lin bleu ciel, fond studio. | « Chemise en lin bleu ciel » · **en vitrine** |
| `homme-pull-col-roule.jpeg` | Pull col roulé écru, maille côtelée. | « Pull col roulé écru » · **en vitrine** |
| `homme-mariniere-jean.jpeg` | Marinière rayée bleu roi et jean large brut, en pied. | « Marinière et jean large » · **en vitrine** |
| `homme-veste-jean.jpg` | Veste en jean brut, coupe trucker, portée ouverte. | « Veste en jean brut » |
| `homme-blouson-aviateur.jpg` | Blouson aviateur cuir brun, col en peau lainée. | « Blouson aviateur, col mouton » |
| `homme-carreaux-chino-brique.jpg` | Chemise à carreaux et chino rouge brique, en pied. | « Chemise à carreaux et chino brique » |
| `homme-costume-vert-lin.jpeg` | Costume en lin vert forêt, chemise bleue et cravate. | « Costume vert en lin » |

**Deux pièces portent une tenue complète, et elles sont nommées comme telles.**
La maquette dessinait « Polo marine » et « Pantalon beige » séparément ; la photo
les montre ensemble, et les séparer aurait demandé de promettre un pantalon
qu'aucune image ne montre seul — l'essai serait de toute façon revenu avec la
tenue entière. On nomme ce qu'on pose : c'est la seule règle qui tienne devant
un modèle d'image.

**Sa photo de commerce est celle de sa veste, faute de devanture.** Elle
partageait `friperie-rayon.jpg` avec la friperie : deux magasins de vêtements de
la même ville, à cinquante mètres l'un de l'autre, avec la même image — on croit
à un défaut d'affichage avant de croire à deux commerces. C'est la même logique
que la carte de la fleuriste, qui montre son bouquet plutôt que son étal. **À
remplacer par une vraie devanture quand il y en aura une.**

> ⚠️ **`homme-veste-ciree-kaki.jpg` porte une marque lisible** sur le tee-shirt
> porté dessous et sur la poche basse. Même statut que le filigrane de studio de
> `ongles1` et le monogramme de `coiffure1` : **c'est la première chose à refaire
> avant un argumentaire imprimé**, au même titre que les deux exceptions datées
> plus haut. C'est aussi la faute exacte qui a fait retirer `portant-boutique.jpg`
> du produit.


### ⚠️ La référence est une AUTRE personne — le risque qui reste

Deux fois de suite, le rendu a renvoyé un autre visage : d'abord « ce n'est pas
exactement ma tête ni les mêmes lunettes », puis « il m'a changé le visage et il
m'a mis des lunettes » sur une photo qui n'en montrait aucune. Les deux causes
étaient dans la consigne et sont corrigées (voir `lib/direct/consigne-essai.ts`,
qui les raconte en détail). **Un risque structurel demeure, et il est dans les
photos, pas dans le code.**

`coiffure-homme-face.jpg` montre un jeune homme blond en entier : visage, yeux,
teint, épaules. On demande au modèle de n'en prendre que les cheveux, et la
consigne le dit maintenant en toutes lettres — mais plus la référence ressemble
à un portrait, plus elle tire le résultat vers ce portrait-là. C'est
particulièrement vrai quand le client ne lui ressemble pas du tout : un homme de
cinquante ans aux cheveux gris à qui l'on propose la coupe d'un mannequin de
vingt ans.

**Ce qui réglerait le problème à la source :** des références de coiffure
**recadrées sur les cheveux** — le haut du crâne, la frange, les tempes, les
côtés — coupées au niveau des yeux. On garde la forme de la coupe autour du
visage, qui est ce qu'on essaie, et on retire le visage, qui est ce qui fuit.
La même règle vaut pour les tenues (`vetement1`…`vetement5`, les dix-huit de
l'arrivage d'automne et les dix du rayon homme) : un vêtement à plat ou sur
mannequin sans tête fuit moins qu'une photo de mode en pied. **Vingt-sept des
vingt-huit nouvelles montrent un visage reconnaissable** — ce sont des photos de
catalogue fournies telles quelles. C'est la même réserve que pour `coiffure1` et
`coiffure2`, et elle est à lever avant tout argumentaire imprimé. **C'est aussi,
et c'est plus embêtant, ce qui tire le rendu vers le mannequin** quand le client
ne lui ressemble pas : un recadrage sur le vêtement, coupé au niveau des
épaules, réglerait les deux problèmes d'un coup.

**Le levier disponible en attendant :** `ESSAI_FOURNISSEUR=openai` renverse
l'ordre des deux fournisseurs. `gpt-image-1` accepte `input_fidelity: high`, un
réglage que Gemini n'a pas, et qui existe précisément pour garder le visage. Il
coûte quelques secondes de plus par essai. Aucune comparaison n'a pu être faite
ici — **il n'y a aucune clé d'image dans l'environnement de développement**,
donc aucun rendu réel n'y a jamais été vu.

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

---

## Les cinq dessins de l'écran « ClikMe cherche »

Fournis par le commanditaire, détourés ici sur fond transparent depuis des
packshots studio (`scripts` : diffusion depuis les bords de l'image, puis
fermeture morphologique pour les baskets — blanches sur fond blanc, elles se
vidaient par les lacets).

| Fichier | Ce que c'est |
| --- | --- |
| `clikme-fantome-loupe.png` | Le fantôme **tenant sa loupe** — un seul dessin |
| `look-veste.png` | Veste marron sur col roulé écru |
| `look-tshirt.png` | T-shirt gris |
| `look-jean.png` | Jean brut, coupe droite |
| `look-baskets.png` | Baskets blanches |

**Le fantôme et sa loupe ne font qu'un, et c'est la raison d'être du fichier.**
Je l'avais fabriqué : le personnage d'un côté, une loupe tracée en SVG de
l'autre, posée à côté de lui. Deux objets qui ne se touchent jamais vraiment —
on voyait un pictogramme flotter près d'un personnage, et le manche passait
tantôt devant, tantôt derrière. Ici la main tient le manche, le verre porte son
reflet, la lueur du tube éclaire le fantôme. Aucun assemblage ne rattrape ça.

**Les quatre vêtements sont des accessoires de scène, pas le stock.** Ils ne
viennent d'aucune collection, et c'est volontaire : l'écran dure quatre secondes
et ne promet rien — la pièce qui sort à la fin, elle, est tirée du magasin.
Montrer quatre vraies pièces ici ferait croire que la machine hésite entre
celles-là, ce qui serait faux.

**Ils sont détourés, pas assombris.** J'affichais avant les photos du catalogue,
c'est-à-dire des mannequins en pied dans un décor de studio : quatre scènes
entières autour d'un fantôme, là où il fallait quatre objets. Assombries pour
compenser, elles devenaient des taches grises. Sur la maquette on RECONNAÎT la
veste marron, le jean bleu, les baskets blanches : c'est leur fond qui est noir,
pas eux.

## 👤 L'après du panneau de gauche — un fichier qui se fabrique, pas qui se trouve

| Fichier | Ce qu'il montre |
|---------|------------------|
| `accueil/mode-homme-apres.jpg` | **ABSENT AUJOURD'HUI, ET IL DOIT LE RESTER TANT QU'IL N'EST PAS FABRIQUÉ.** Le même homme que `coiffure-homme-face.jpg`, même cadrage, habillé autrement. |

**Pourquoi il n'y en a pas, et pourquoi on n'en cherche pas.** L'écran
d'accroche du relooking montre deux panneaux : un rayon homme, un rayon femme.
Celui de droite porte un vrai avant-après — la même personne, avant et après.
Il n'existe aucun couple équivalent pour un homme dans ce dossier, et coller
deux inconnus côte à côte donnerait exactement ce qu'on reproche partout
ailleurs : un avant-après de deux personnes différentes, qui ne prouve rien.
C'est un refus, pas un manque de temps.

**Il se fabrique avec le moteur du produit.**

```
GEMINI_API_KEY=…  npx next dev --webpack -p 3821
node scripts/fabriquer-apres-homme.mjs
```

Le script passe par `/api/direct/essayer`, c'est-à-dire la route que les clients
utilisent : même consigne, mêmes garde-fous de fidélité au visage, mêmes
fournisseurs. Ce qui s'affiche alors n'est pas un montage, c'est **une vraie
sortie de ClikMe sur une vraie photo** — un argument plus fort que la photo de
stock du panneau d'en face. Sans clé d'image, il s'arrête et le dit ; il ne
fabrique jamais un à-peu-près.

**L'écran le prend tout seul, dans les deux sens.** Poser le fichier suffit à
couper le panneau de gauche en deux comme son voisin ; le retirer suffit à
remettre le portrait entier. Il n'y a rien à rebrancher, et pas de troisième
état possible : c'est l'image qui répond ou ne répond pas. Voir `apresHomme`
dans `components/direct/relooking-contenu.tsx`.

**Regardez-le avant de le garder.** Un rendu qui a changé le visage est à
jeter : ce panneau doit prouver « même vous, juste une nouvelle version », et un
inconnu prouve le contraire.

---

# Les secondes photos — le rideau « avant / servi »

## Pourquoi ce dossier en a besoin

L'écran 2 du parcours restaurant est un rideau qu'on tire entre **le plat tel
qu'il est en cuisine** et **la portion telle qu'elle arrive devant le client**.
C'est le seul écran du parcours qu'un concurrent ne peut pas copier en une
après-midi, parce qu'il ne tient pas au dessin mais à une donnée que personne
d'autre n'a : deux photos du même plat, prises par le même commerçant, le même
jour.

Le champ existe déjà (`photoApres` dans `TempsGout`, `avant-gout.ts`) et le
composant sait l'afficher (`gout-contenu.tsx`). **Ce qui manque, ce sont les
images.** Comptées le jour où cette section a été écrite : 30 `photo:` et
**0** `photoApres:`. L'écran le plus différentiant du parcours tourne
aujourd'hui sur zéro donnée.

## La règle avant la liste

**Une seconde photo absente n'est pas un trou.** Sans elle, l'écran 2 n'existe
pas et le parcours passe à trois écrans — exactement comme la bande de
miniatures disparaît quand il n'y a qu'une photo, et comme la phrase des
tailles disparaît quand le commerçant ne les a pas rentrées. On ne comble pas
avec un zoom sur la première image : agrandir la même photo ne montre rien de
plus et la présente comme une révélation. C'est la seule chose que ce parcours
n'a pas le droit de faire.

## Ce qu'une seconde photo doit être

**C'EST LE MÊME PLAT QUI COMPTE, PAS LE MÊME ANGLE.** Cette règle a été écrite
trop stricte la première fois, et la première paire livrée l'a corrigée : deux
photos recadrées dans le même rectangle tiennent très bien côte à côte même
prises de points de vue différents — une plongée sur le gratin et une vue à
hauteur d'œil sur l'assiette se lisent sans effort comme deux états de la même
chose. Ce qui casse le rideau n'est pas l'angle, c'est le CONTENU.

- **Le même plat, la même recette.** Non négociable, et c'est la seule règle
  vraiment bloquante. La première paire livrée montrait une lasagne à la louche
  d'un côté et une lasagne montée en couches de l'autre : deux recettes, donc
  quelqu'un qui réserve après avoir vu l'une reçoit l'autre. La seconde paire —
  la même lasagne au jambon des deux côtés — a résolu le problème d'un coup.
- **Ni fond de studio, ni noir seamless** du côté « servi ». L'étiquette affirme
  que c'est l'assiette qui arrive sur la table ; une photo de catalogue dit
  exactement le contraire, et la bande de fond qui apparaît quand on tire le
  rideau à fond se lit comme un défaut d'affichage.
- **Même lumière, même jour.** Un « avant » de mardi et un « servi » de la
  semaine dernière est un montage.
- **L'assiette telle qu'elle sort**, pas le dressage du site. Si la photo est
  plus belle que la réalité, le premier client qui vient le voit — et c'est
  pire que pas de photo du tout.
- **Format portrait ou carré, 1000 px de large au minimum.** Les cartes
  s'affichent en plein cadre vertical.
- **Moins de 300 Ko, et on recompresse sans le demander.** La photo « au plat »
  livrée avec la première paire pesait 1,1 Mo — quatorze fois les autres
  assiettes de ce dossier — sur le PREMIER écran d'un parcours qu'on ouvre au
  téléphone, dans la rue. Réencodée en qualité 86, elle est tombée à 233 Ko en
  gardant ses 1000 × 1000 et sans différence visible à l'œil. Les pixels d'un
  commerçant valent mieux qu'une image de banque ; son forfait mobile aussi.
- **Ni filigrane, ni enseigne lisible, ni visage de face** — même règle que
  toutes les images de ce dossier.

## Les cinq restaurants

| Fichier attendu | Commerce | Le plat | La première photo | Ce que montre la seconde |
|---|---|---|---|---|
| ✅ `plat-lasagnes-servi.jpeg` | Le Bocal de Margot | Lasagnes maison, 11 € | `plat-lasagnes.jpg` — le gratin au plat | **FAITE**, et c'était bien le meilleur cas du lot : la part montée sur l'assiette montre ses couches de jambon de profil, et le rideau dit littéralement « je vous montre l'intérieur ». **Noter l'extension : `.jpeg`, pas `.jpg`** — c'est celle du fichier livré, et le code la suit. |
| `plat-garbure-servi.jpg` | Chez Bergine | Garbure landaise, magret grillé, 19 € | `plat-garbure.jpg` — la marmite | **L'assiette creuse servie** : le bouillon versé, le chou et le confit dedans, le magret posé dessus. |
| `plat-axoa-servi.jpg` | L'Ardoise Landaise | Axoa de veau, 16 € | `plat-axoa.jpg` — la cocotte | **La portion dans l'assiette**, avec les pommes de terre à côté. |
| `plat-basquaise-servi.jpg` | La Grande Tablée | Le menu du soir, 17 € | `plat-basquaise.jpg` — la poêle | **L'assiette de poulet basquaise avec son riz.** On ne photographie que le plat, pas les trois services : le menu entier ne se superpose à rien. |
| `plat-parmentier-servi.jpg` | Maison Lartigue (traiteur) | Parmentier de canard, part individuelle, 12 € | `plat-parmentier.jpg` — le plat entamé | **La barquette individuelle, ouverte.** Chez un traiteur, la portion réellement servie est la boîte — pas une assiette de restaurant qu'il ne sert jamais. |

## Les deux qui ne sont pas des restaurants

Ils ont le même parcours parce qu'ils fabriquent quelque chose, et le rideau y
est encore plus fort : l'intérieur d'un pain ou d'une viande coupée est
exactement ce qu'on ne voit jamais avant d'acheter.

| Fichier attendu | Commerce | Le produit | La première photo | Ce que montre la seconde |
|---|---|---|---|---|
| `tourte-tranchee.jpg` | Le Pétrin d'Amanieu | La tourte de seigle au levain, 4,20 € | `boulange-fournil.jpg` | **La tourte coupée en deux, la mie ouverte, les alvéoles visibles.** Vingt heures de pousse ne se voient que là. C'est probablement le plus beau « intérieur » de toute la liste. |
| `cote-boeuf-coupee.jpg` | Une boucherie du centre | La côte de bœuf maturée, 34 €/kg | `etal-boucher.jpg` | **La côte coupée, posée sur le papier du boucher**, le gras et la maturation visibles sur la tranche. Attention au mot : ce n'est pas « servi », rien n'est servi chez un boucher. Et 34 €/kg n'est pas un prix par personne — voir `auPoids` dans `programme.ts`, où la même erreur a déjà été corrigée une fois. |

## Si une seule doit exister

C'était `plat-lasagnes-servi`, et elle existe. Le gratin entier et la part
montée : c'est le rideau qui explique le principe en une seconde, sans texte.
Les six autres se comprennent parce qu'on a compris celui-là — et la paire des
lasagnes sert maintenant de référence pour les juger.

## Ce que la première livraison a appris

**Deux paires ont été nécessaires, et l'écart entre les deux est instructif.**
La première mettait face à face une lasagne à la louche et une lasagne montée
en couches — deux belles photos, deux recettes différentes. Le rideau
fonctionnait mécaniquement et mentait sur le fond : quelqu'un qui réserve
d'après le côté droit reçoit le côté gauche.

**Ce n'était pas une question de qualité photo, mais de vérité.** C'est la
raison pour laquelle la règle bloquante de cette section n'est ni le cadrage,
ni la lumière, ni la définition : c'est que ce soit **le même plat**. Tout le
reste se rattrape au recadrage.
