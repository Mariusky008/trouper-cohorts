# Ensemble « alcôves » — les images à préparer

Référence : les 6 maquettes (853 × 1844, soit un écran 390 × 844 à ×2,19).
Tout ce qui est texte, bouton, nombre, icône, compteur, pastille, flèche,
panneau, contour ambre, coche, halo, étincelles, vapeur, ombre de contact et
place libre « Ta place ? » est construit en code. Les images ne contiennent
donc **ni texte, ni interface, ni menu du bas**.

Format commun : PNG, sRGB, à **3×** (1170 px pour la largeur d'un écran de
390 points). Même lumière chaude de fin de journée, même style 3D doux que
les maquettes, fantômes **sans oreilles**.

---

## 0. D'abord : le module de validation

Ne pas produire les 48 images tout de suite. On valide d'abord, intégré
dans l'application :

1. la scène **`scene-canape-vert`** sans fantômes (et son calque `-devant`
   si possible), voir § 2 ;
2. **Le Flâneur** (`look-flaneur-…`) dans ses quatre poses : assis tasse en
   main, assis yeux fermés, assis main levée, debout bras ouverts — voir § 3 ;
3. la place libre « Ta place ? » est construite en code : aucune image.

Une fois ce module intégré et validé, on décline les trois autres décors et
les onze autres fantômes, au même gabarit.

---

## 1. Écran d'accueil (maquette « image 1 »)

| Fichier | Taille | Contenu |
| --- | --- | --- |
| `accueil-decor.png` | 1170 × 2532, opaque | La salle de l'image 1 **sans le fantôme ni son tabouret**, sans texte ni logo, sans bouton. La table, la lampe, les livres, le vase et la tasse restent : c'est du décor. |
| `accueil-fantome-tabouret.png` | 1200 × 1500, transparent | Le fantôme debout sur le tabouret, verre levé, exactement dans la pose de l'image 1. Pieds du tabouret en bas de l'image ; pas d'ombre au sol (je la pose en code). |

Remarque : `public/direct/fantomes/client-verre.png` est proche (même
casquette noire, même verre), mais sa chaise et son cadrage diffèrent ; il
dépanne en attendant.

---

## 2. Les alcôves (maquette « image 4 ») — des scènes complètes, SANS fantômes

C'est l'image qui manque le plus : aujourd'hui l'alcôve est composée en code
(un couloir, une banquette et une table posées dessus), ce qui ne peut pas
atteindre le niveau de l'image 4. Il faut **une vraie pièce par salon**,
exactement comme l'image 4, mais **vide de fantômes** : je les assois en
code, chacun avec son look.

Pour chaque scène :

| Fichier | Taille | Contenu |
| --- | --- | --- |
| `scene-<nom>.png` | 1170 × 2532, opaque | La pièce entière, sans fantôme, sans texte, sans bouton, sans menu. |
| `scene-<nom>-devant.png` *(si possible)* | 1170 × 2532, transparent | Uniquement ce qui passe **devant** les fantômes : la table et ses objets, l'accoudoir ou le dossier au premier plan. Transparent partout ailleurs, parfaitement superposable. Si tu ne peux pas le produire, je le découpe moi-même dans la scène. |

Ce que chaque scène doit contenir (même lumière dorée de fin de journée,
même style 3D doux que les maquettes) :

- un **canapé** (et/ou des fauteuils) avec **au moins 4 places vides** bien
  lisibles, coussins compris ;
- une **table** au premier plan avec quelques objets (lampe, tasses, livres,
  bol, plante) et une **zone plate et libre** au centre du plateau, environ
  330 × 210 px : j'y pose la photo réellement partagée ;
- une ou plusieurs **fenêtres avec une vue** : la ville et l'Adour au
  coucher du soleil, une montagne enneigée vue d'un chalet, la mer, une
  place de village… ;
- lampes, bois, plantes, bibliothèque : un lieu chaleureux et détaillé.

Zones à respecter (en pixels, image 1170 × 2532 ; pas au pixel près, je
repère moi-même les places de chaque scène) :

| Zone | Hauteur | Ce qu'il y a |
| --- | --- | --- |
| Haut | 0 → 600 | Le haut de la pièce (fenêtres, plafond, étagères) : l'en-tête se pose dessus, rien d'essentiel. |
| Canapé | 650 → 1250 | Le dossier et l'assise vides ; les têtes des fantômes arriveront vers 750, l'assise vers 1150. |
| Table | 1100 → 1700 | Le plateau vu de trois quarts, sa zone libre au centre. |
| Bas | 1700 → 2532 | L'avant de la table et le sol, plus sombres : le titre, le dernier message et le bouton s'y posent. |

Quatre scènes suffisent pour démarrer, chacune dans un lieu différent :

1. `scene-canape-vert` — le salon de l'image 4 (canapé vert, vue sur Dax et l'Adour) ;
2. `scene-chalet` — chalet, canapé et fauteuils, vue sur la montagne ;
3. `scene-terrasse` — terrasse couverte avec guirlandes, vue sur la ville ;
4. `scene-bibliotheque` — salon-bibliothèque, fauteuils de cuir, fenêtre sur une place.

Les vignettes des listes et de la confirmation sont tirées de ces scènes en
code : aucune image à part.

---

## 3. Les douze fantômes

Douze looks distincts, reconnaissables à leurs accessoires et à leurs
couleurs. Chaque look existe en **quatre poses**, toutes au **même cadrage** :
même taille de corps, même point d'appui. C'est ce qui permet de changer de
look ou de pose sans que rien ne saute à l'écran.

| Pose | Fichier | Toile | Usage |
| --- | --- | --- | --- |
| Assis, tasse en main, tourné de trois quarts vers la droite | `look-<id>-assis.png` | 900 × 900, transparent, bas du corps à y = 840, centre à x = 450 | Alcôves, places des salons (je le retourne pour les places de droite). |
| Le même, **yeux fermés** | `look-<id>-assis-cligne.png` | identique, pixel pour pixel sauf les yeux | Le clignement occasionnel. |
| Le même, **une main levée qui salue** (la tasse dans l'autre main) | `look-<id>-assis-salue.png` | identique | Le salut à l'arrivée d'un membre. |
| Debout, bras ouverts, de face (pose de l'image 2) | `look-<id>-debout.png` | 1200 × 1200, transparent, base à y = 1100, centre à x = 600 | Sélecteur, « Ton fantôme est prêt », vignettes rondes, avatars près des messages. |

Optionnel, pour le bouton central du menu : `look-<id>-tabouret.png`
(1200 × 1500), assis sur le tabouret de bois comme dans le menu de l'image 2.
Sans cette pose, je compose un tabouret générique et la pose debout.

Total : **48 images** (+ 12 optionnelles).

### Les looks (validés)

Leurs noms décrivent un style, rien d'autre : ils ne changent aucun droit ni
aucun comportement. Un seul look par personne, gardé avec son habitant (et
non avec son prénom), le même dans Ensemble, les conversations et Ma maison.

| # | id | Nom | Accessoires |
| --- | --- | --- | --- |
| 1 | `flaneur` | Le Flâneur | casquette marine, écharpe moutarde (look par défaut) |
| 2 | `cosy` | Le Cosy | bonnet terracotta, écharpe vert sauge |
| 3 | `artiste` | L'Artiste | béret bordeaux, lunettes rondes |
| 4 | `jardinier` | Le Jardinier | couronne de fleurs, foulard crème |
| 5 | `voyageur` | Le Voyageur | casquette en jean, bandana bleu |
| 6 | `lecteur` | Le Lecteur | lunettes rondes dorées, cardigan beige |
| 7 | `melomane` | Le Mélomane | casque audio autour du cou, bonnet noir |
| 8 | `curieux` | Le Curieux | casquette jaune moutarde, petite sacoche |
| 9 | `reveur` | Le Rêveur | bonnet lavande, écharpe bleu nuit |
| 10 | `local` | Le Local | béret basque rouge, foulard écru |
| 11 | `rebelle` | Le Rebelle | bonnet noir, bandana rouge |
| 12 | `soleil` | Le Soleil | bob orange, lunettes rondes teintées |

**En attendant les images**, l'application ne propose que les looks qui ont
déjà un fantôme ressemblant (repli dans `public/direct/ensemble/`, une seule
pose) : Le Flâneur, Le Cosy, L'Artiste, Le Lecteur, Le Rêveur et Le Local.
Les six autres apparaîtront dans le sélecteur dès que leurs images seront
déposées (`src/lib/direct/look.ts`) ; aucune image n'est réutilisée pour
deux looks.

### Ce qui existe déjà et ne suffit pas

Les neuf fantômes assis actuels (`public/direct/ensemble/fantome-*.webp` :
béret noir, béret rouge, bonnet, casquette bleue, casquette noire et
lunettes, écharpe verte, écharpe violette, lunettes rouges, sans
accessoire) n'existent que dans **une seule pose**, sans tasse, sans
variante yeux fermés ou salut, sans pose debout. Leurs looks ne
correspondent pas non plus à ceux des maquettes. Je ne peux pas en tirer les
douze looks sans les déformer ; ils servent seulement de repli pendant la
construction.

---

## Ce qui ne demande aucune image

Construit en code d'après les maquettes :

- titres, filtres, compteur « 1 / 3 », flèches, « Glisse pour découvrir… » ;
- le panneau qui remonte (poignée, croix, coins arrondis, bord ambre) ;
- la rangée de vignettes, le contour ambre et la coche, « 4 / 12 » ;
- le halo et les étincelles derrière le grand aperçu ;
- les cartes des listes, les pastilles « 2 », « Déjà rejoint », les icônes
  (cadenas, globe, épingle, horloge, recherche) ;
- la place libre « Ta place ? », la vapeur de tasse, les ombres de contact ;
- l'installation (apparition, léger mouvement vers le coussin, « Toi », « Tu
  as pris ta place ») ;
- le vrai menu du bas de l'application, conservé tel quel.
