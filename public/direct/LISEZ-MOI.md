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
| `portant-boutique.jpg` | Une chemise sortie en cabine d'essayage           |
| `friperie-rayon.jpg`   | Des rayons de friperie, cintres serrés            |
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

## LA RÈGLE QUI VAUT POUR TOUTES

Aucune enseigne lisible, aucun logo, aucun visage reconnaissable. Les commerces
de la maquette sont des voisins anonymes — « un salon du centre », « une
boutique de la rue piétonne ». Une devanture identifiable ferait passer un vrai
commerçant pour un client de ClikMe sans qu'il ait rien signé, et ça vaut aussi
pour l'image des gens.

TROIS EXCEPTIONS ASSUMÉES, ET ELLES SONT DATÉES. `portant-boutique.jpg` porte
une enseigne lisible et des passants reconnaissables, `avis-cabine.jpg` un
visage de face, `avis-verre.jpg` une marque sur trois verres. Le propriétaire du
produit les a validées explicitement : la page est en `noindex`, elle se partage
par lien à une trentaine de testeurs, et elle n'a aucun but commercial.

**Ce sont donc les trois premières à remplacer le jour où la page sort de ce
cercle** — mise en ligne publique, capture dans un dossier investisseur,
argumentaire commerçant. Rien d'autre dans `public/direct/` ne pose ce
problème.

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
