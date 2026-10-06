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

## 1. Écran d'accueil (maquette « image 1 »)

| Fichier | Taille | Contenu |
| --- | --- | --- |
| `accueil-decor.png` | 1170 × 2532, opaque | La salle de l'image 1 **sans le fantôme ni son tabouret**, sans texte ni logo, sans bouton. La table, la lampe, les livres, le vase et la tasse restent : c'est du décor. |
| `accueil-fantome-tabouret.png` | 1200 × 1500, transparent | Le fantôme debout sur le tabouret, verre levé, exactement dans la pose de l'image 1. Pieds du tabouret en bas de l'image ; pas d'ombre au sol (je la pose en code). |

Remarque : `public/direct/fantomes/client-verre.png` est proche (même
casquette noire, même verre), mais sa chaise et son cadrage diffèrent ; il
dépanne en attendant.

---

## 2. Les alcôves (maquette « image 4 ») — décor en DEUX calques

Chaque salon s'affiche sur une alcôve plein écran. Pour que les fantômes
soient vraiment **assis** (bas du corps caché par la table, comme sur
l'image 4), chaque alcôve est livrée en deux calques **de même taille et
parfaitement superposables** :

| Fichier | Taille | Contenu |
| --- | --- | --- |
| `alcove-<nom>-fond.png` | 1170 × 2532, opaque | Tout ce qui est **derrière** les fantômes : murs, fenêtre, bibliothèque, canapé ou banquette **vide**, coussins. |
| `alcove-<nom>-devant.png` | 1170 × 2532, transparent | Tout ce qui est **devant** les fantômes : la table et ses objets de décor (lampe, livres, tasse, bol…), le dossier de chaise au premier plan. Transparent partout ailleurs. |

Règles :

- **Aucun fantôme, aucune tasse tenue, aucun texte.**
- **Pas de contenu partagé dans le décor** : la carte postale de l'image 4
  est une vraie photo partagée, je la pose en code. Il faut laisser sur la
  table une **zone plate et libre** d'environ 330 × 230 px (à 3×), vue sous
  le même angle que la table.
- Le canapé doit offrir **au moins 4 places d'assise lisibles** (3 fantômes
  et une place libre « Ta place ? »), à la hauteur des fantômes de l'image 4.
- Le bas de l'image (sous la table, environ le tiers inférieur) reste sombre
  et peu chargé : le titre, le dernier message et le bouton s'y posent.

Variantes demandées (même lieu, mêmes matériaux, même lumière) :

1. `alcove-canape-vert` — canapé vert, table ronde, fenêtre sur Dax (image 4) ;
2. `alcove-banquette-cuir` — banquette de cuir arrondie, table ronde ;
3. `alcove-terrasse` — terrasse avec guirlandes lumineuses ;
4. `alcove-adour` — table près des fenêtres, vue sur l'Adour.

Quatre suffisent pour démarrer. Les vignettes des listes (images 5 et 6) et
de la confirmation (image 3) sont tirées de ces décors en code : aucune
image à part.

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

### Les looks

Cinq looks sont visibles dans les maquettes. Leurs noms décrivent un style,
rien d'autre : ils ne changent aucun droit ni aucun comportement.

| # | id | Nom | Accessoires |
| --- | --- | --- | --- |
| 1 | `flaneur` | Le Flâneur | casquette marine, écharpe moutarde (look par défaut) |
| 2 | `cosy` | Le Cosy | bonnet rouille à pompon, écharpe verte |
| 3 | `artiste` | L'Artiste | béret rouge, lunettes rondes |
| 4 | `boheme` | La Bohème | couronne de marguerites |
| 5 | `baroudeur` | Le Baroudeur | casquette en jean, foulard à motifs |
| 6–12 | à définir | à définir | sept autres combinaisons distinctes : couleurs et accessoires différents, aucun doublon |

**À ta charge :** les noms et accessoires des looks 6 à 12, et la phrase sous
le nom (« Curieux, toujours partant. »), qui décrit un style et non un
caractère.

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
