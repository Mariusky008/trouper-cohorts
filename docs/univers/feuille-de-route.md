# Chantier « Univers » — la feuille de route

*Écrite le 11 novembre 2026, après la lecture des deux textes du propriétaire (`vision.md`, dans ce dossier) et ses
réponses du même jour. État : **proposée, en attente de son accord**. Aucun développement n'a commencé.*

*Pour une session qui reprend : lire `vision.md`, puis ce fichier en entier, puis `docs/reprise.md`.*

## 1. En bref

**Ce qu'on construit.** Chaque personne a deux choses qui la représentent partout dans ClikMe :

- **sa figurine** : elle, en figurine de collection, grosse tête et petit corps, assise dans son fauteuil ;
- **son univers** : un monde en plein écran, imaginé à partir d'une vraie conversation, où chaque chose a une raison
  d'être là.

Les autres peuvent y entrer : un proche qui lui parle vient s'asseoir chez elle. La promesse : *ne plus seulement
communiquer avec quelqu'un, mais entrer dans son monde.*

**Ce qui rend le projet possible.** On ne garde pas deux images : on garde **deux fiches maîtresses** (le personnage,
l'univers), avec leurs descriptions, leurs images de référence et leurs versions. Les scènes de tous les jours se
**composent** à partir de ces références, sans rien regénérer : la figurine ne change jamais de visage, cela ne coûte
rien et il n'y a pas d'attente. On ne **génère** une image que pour les grands moments.

**L'ordre.**

| Lot | Ce qu'il livre | Taille |
|---|---|---|
| 0 | Les essais qui décident : le style, la constance, la composition, la 3D, les vrais coûts | moyen |
| 1 | Le socle : les deux fiches maîtresses, leurs versions, le format d'une scène | moyen |
| 2 | Étape 1 de l'inscription : la nouvelle figurine | gros |
| 3 | Étape 2 : la conversation | gros |
| 4 | L'univers : sa création, sa découverte, ses retouches, « Mon univers » | gros |
| 5 | Le premier usage : le message dans l'univers, le proche qui entre | moyen |
| 6 | Les visites et les souvenirs | moyen |
| 7 | L'appli d'aujourd'hui rhabillée : les mèmes dans l'univers, le menu | gros |
| R | Le rituel du jour : l'humeur du jour, ce que les figurines en disent, ce qu'elles se sont dit (précision du 11 novembre) | moyen |
| Plus tard | Réalise mon vœu, la figurine dans un lieu réel, les univers des commerçants, les appels | |

Les lots 0 à 4 font l'inscription complète. Leur durée dépend surtout des essais de rendu et des retours du
propriétaire sur son iPhone, pas de l'écriture du code.

**Le coût.** Environ **0,20 €** par nouvel inscrit, **0,40 € au plus** avec les retouches gratuites. Ensuite, l'usage
quotidien ne coûte rien en IA (section 9).

## 2. Les décisions prises (11 novembre 2026)

| Sujet | Décision | Qui |
|---|---|---|
| L'ordre de l'inscription | La figurine, puis la conversation, puis l'univers, **avant** le premier message : le message reçu montre la figurine dans son univers | le propriétaire |
| Le ressort et le socle | **Abandonnés.** La figurine est assise dans un fauteuil. Les anciennes consignes restent dans le code, éteintes, pour pouvoir y revenir | le propriétaire |
| Le style de la figurine | Celui de sa photo de référence (section 3) : une figurine de collection réaliste | le propriétaire |
| Le style des univers | Un monde miniature photographié de près, dans la continuité de la figurine. La direction exacte se choisit sur essais (lot 0) | le propriétaire |
| La conversation | Une vraie discussion libre de quelques minutes, pas un questionnaire | le propriétaire |
| La voix de la conversation | **À l'écrit, et la personne peut dicter.** Pas de voix de synthèse (section 6.2) | laissé à l'ingénieur |
| La 3D | La solution mixte (section 4.3), et un essai de vraie 3D sur 5 selfies en parallèle | le propriétaire |
| Les amis venus de WhatsApp | Leur première réponse se joue dans l'univers de celui qui les invite ; ils créent le leur ensuite | le propriétaire |
| La première fonction | Le proche qui entre dans mon univers (talkie-walkie, puis visites) | le propriétaire |
| L'appli d'aujourd'hui | La nouvelle vision l'englobe : rien n'est jeté, tout change de visage (section 8) | proposé par l'ingénieur |

Une décision d'avant change : les appels étaient « pas avant longtemps, peut-être jamais » (`docs/reprise.md`). La vision
les prévoit. Ils restent pour plus tard, mais le socle les rend possibles (section 10).

## 3. La référence de style

`references/figurine-cible-2026-11-11.jpg` : l'image envoyée par le propriétaire. Ce qu'on en retient :

- la tête fait presque la moitié de la hauteur ; le corps est petit, les bras et les jambes courts ;
- la figurine est **assise**, jambes croisées, avec de vrais vêtements (gilet en maille, jean, baskets) ;
- le rendu est celui d'une **figurine de collection photographiée de près** : de vrais cheveux, le grain de la peau,
  une faible profondeur de champ ;
- l'expression est franche et drôle (moue, sourcil froncé, doigt sur la joue).

Ce qu'on ne reprend pas : la main qui la tient. Elle sera assise dans un fauteuil.

**Cette image sert de cible, pas de matière.** Elle vient d'ailleurs : on ne la montre pas dans l'appli et on ne la
donne pas au moteur d'image comme modèle. Le lot 0 fabrique **nos** images de référence, validées par le propriétaire :
ce sont elles que le moteur recevra.

**Ce que ce style change par rapport à aujourd'hui.** La consigne actuelle (`consigneFigurineClient`,
`src/lib/direct/figurine-pro.ts`) demande un personnage de film d'animation, « pas photoréaliste », coupé à la taille,
sur un ressort. Tout cela est à réécrire. Deux risques à mesurer au lot 0 :

- un rendu plus réaliste flatte moins : une caricature réaliste peut vexer là où un dessin animé amuse ;
- le moteur d'image peut refuser plus souvent un rendu réaliste d'une vraie personne, surtout jeune.

## 4. L'architecture : deux fiches maîtresses

### 4.1 Six principes

1. **Une fiche, pas une image.** Le personnage et l'univers sont d'abord des descriptions structurées. Les images en
   découlent et se refont ; la fiche reste.
2. **Le décor et les acteurs sont séparés.** L'image d'un univers ne contient pas de figurine. Les figurines s'y posent
   en direct. Sinon, on ne pourrait ni les animer, ni en accueillir une seconde.
3. **Composer d'abord, générer rarement.** Un message, une visite, une animation : on assemble les images de
   référence. Un vœu, un lieu réel, l'affiche à partager : on génère, et on garde le résultat.
4. **Tout est versionné et signé.** Chaque image garde sa date, le moteur et la consigne qui l'ont faite. Une version
   validée n'est jamais regénérée sans demande. Les moteurs changent : c'est ce qui permet de refaire à l'identique, ou
   de savoir pourquoi ce n'est plus identique.
5. **Privé par défaut.** La conversation ne sort jamais. Chaque élément de l'univers dit d'où il vient : « il l'a
   dit », ou « interprétation ». Tout s'efface.
6. **La fiche ne dépend pas du rendu.** Images composées aujourd'hui, vraie 3D demain si l'essai est concluant : la
   fiche et le format des scènes ne changent pas.

### 4.2 Le personnage maître

**Ce que la fiche contient** (une ébauche, à préciser au lot 1) :

```json
{
  "version": 3,
  "validee_le": "2026-11-20T10:12:00Z",
  "style": "collection-1",
  "traits": { "cheveux": "…", "barbe": "…", "visage": "…", "yeux": "…", "signes": "…", "accentuer": "…" },
  "tenue": { "description": "…", "couleurs": ["#1d1d1f", "#3b5b8c"], "accessoires": ["collier doré"] },
  "fauteuil": { "description": "…", "couleurs": ["#c9a27e"] },
  "references": {
    "assise":       { "chemin": "…/assise.webp",   "moteur": "…", "consigne": "…", "le": "…" },
    "assise_parle": { "chemin": "…/assise-p.webp", "…": "…" },
    "debout":       { "chemin": "…/debout.webp",   "…": "…" }
  },
  "visages": { "joie": { "n": "…", "p": "…" } },
  "photo": { "gardee": true, "accord_le": "…" },
  "historique": [{ "version": 2, "le": "…", "raison": "autre coiffure" }]
}
```

- **Les traits** existent déjà : le modèle qui voit décrit la personne (`decrireTraits`, type `Traits`). Aujourd'hui ils
  servent une fois puis sont perdus. On les garde.
- **Les images de référence** sont détourées (fond transparent), toujours au même cadre : assise dans son fauteuil
  (bouche fermée, bouche ouverte), et debout pour entrer en scène. Le moteur sait déjà rendre un fond transparent
  (c'est ce que font les réactions).
- **Les visages et les attitudes** gardent le mécanisme actuel : fabriqués à la demande, une seule fois, à partir de la
  référence (`figurine-expressions-serveur.ts`), avec l'atelier de Pablito pour patienter.
- **Le fauteuil fait partie de son identité.** Proposition : un fauteuil « de départ » à la création, puis refait aux
  couleurs de son univers une fois celui-ci créé (« ton fauteuil a pris les couleurs de ton monde »). La figurine
  l'emporte quand elle rend visite : deux fauteuils face à face, c'est une conversation.

**Où c'est rangé.** Dans le seau privé `figurines-clients`, comme le reste, sans nouvelle table au départ :

```
<habitant>/perso/fiche.json
<habitant>/perso/v<n>/assise.webp, assise-p.webp, debout.webp, expr/<visage>-n.webp …
```

**Les figurines d'aujourd'hui.** Elles reçoivent une fiche « version 0 » (leurs images actuelles) pour que l'appli
continue de marcher. Chacune est refaite dans le nouveau style à la prochaine visite de son propriétaire, à partir de
sa photo s'il l'a laissée. Pablito, le guide, est refait aussi.

**Garder le ressort en mémoire.** Les consignes du ressort et du socle restent dans le code derrière un réglage de
style. Revenir en arrière, c'est changer ce réglage et refaire les images, pas réécrire.

### 4.3 L'univers maître

**Ce que la fiche contient** (une ébauche) :

```json
{
  "version": 2,
  "validee_le": "…",
  "proposition": "Un atelier ouvert sur la mer, où l'on bricole au calme et où la porte reste ouverte aux amis.",
  "ambiance": { "lumiere": "fin d'après-midi dorée", "palette": ["#e8b06a", "#2f5d73", "#f3ead9"] },
  "elements": [
    { "id": "etabli", "quoi": "un établi de menuisier couvert d'outils",
      "pourquoi": "je bricole tous les dimanches", "source": "dit", "zone": [0.08, 0.42, 0.34, 0.2], "valide": true },
    { "id": "phare", "quoi": "un petit phare au loin",
      "pourquoi": "tu parles souvent de garder le cap", "source": "interpretation", "zone": [0.7, 0.2, 0.12, 0.18] }
  ],
  "regles": ["la mer reste au fond", "pas de ville"],
  "inconnus": ["son métier"],
  "scene": {
    "sol": 0.78,
    "places": [{ "id": "hote", "x": 0.36, "y": 0.8, "echelle": 1 }, { "id": "invite", "x": 0.66, "y": 0.82, "echelle": 0.96 }],
    "lumiere": { "vient_de": "gauche", "couleur": "#ffd9a0" }
  },
  "references": { "decor": { "chemin": "…/decor.webp", "…": "…" }, "vedette": { "chemin": "…/vedette.webp" } },
  "visibilite": "proches",
  "souvenirs": []
}
```

- **Le décor** est une image 9:16 **sans figurine**, composée pour laisser une scène dégagée en bas : un sol, de la
  place pour deux fauteuils.
- **Les places** disent où une figurine peut s'asseoir, à quelle taille, et d'où vient la lumière. Un modèle qui voit
  les relève sur le décor une fois fait. C'est ce qui permet de poser une figurine « dans » le monde, avec son ombre,
  et d'en accueillir une seconde.
- **Chaque élément a sa raison.** `source: "dit"` porte une phrase que la personne a vraiment écrite, et le code le
  vérifie : la citation doit se retrouver dans la conversation. `source: "interpretation"` est montré comme tel. C'est
  la traduction concrète de « ne jamais inventer ».
- **L'image vedette** est la seule où la figurine est « dans » l'image : elle sert à la découverte et au partage.
- **Les souvenirs** laissés par les visiteurs sont des objets posés par-dessus le décor : on ne regénère rien, et
  l'univers n'est pas dénaturé.

**Où c'est rangé.**

```
<habitant>/monde/fiche.json
<habitant>/monde/v<n>/decor.webp, vedette.webp
<habitant>/monde/conversation.json        (privé : les échanges)
```

Le dossier s'appelle `monde`, pas `univers` : dans le code d'aujourd'hui, « univers » désigne déjà autre chose (le
métier ou la passion qui habille la figurine, `<habitant>/univers.json`). À l'écran, on dit toujours « ton univers ».

**Le faire évoluer sans le dénaturer.** Une retouche (« davantage de nature ») modifie d'abord la fiche, puis demande
au moteur de retoucher **l'image précédente** en gardant le reste. Les éléments validés sont verrouillés. Chaque
retouche est une nouvelle version ; on peut revenir à la précédente.

### 4.4 La scène

Tout ce qui se joue dans ClikMe se décrit de la même façon :

```json
{
  "decor": { "de": "<clé de profil>", "version": 2 },
  "acteurs": [
    { "de": "<clé de profil>", "version": 3, "place": "hote",   "pose": "assise", "visage": "joie" },
    { "de": "<clé de profil>", "version": 1, "place": "invite", "pose": "assise", "visage": null }
  ],
  "moment": "soir"
}
```

Un message, une visite, un mème, un vœu, plus tard un appel : c'est toujours un décor, des acteurs, et ce qu'ils font.
Le téléphone dessine la scène en direct. Le moteur vidéo qui existe (`src/lib/direct/meme.ts`, `fabriquerMeme`) en
fait une vidéo à envoyer. C'est cette pièce qui prépare les « interactions entre figurines » sans les construire tout
de suite.

### 4.5 Composer, ou générer

| | Composer (dans le téléphone) | Générer (le moteur d'image) |
|---|---|---|
| Quand | Un message, une visite, un mème, une animation | La figurine, l'univers, une retouche, un vœu, un lieu réel |
| La figurine reste-t-elle la même ? | Toujours : ce sont ses images | Presque : le moteur la redessine d'après ses références |
| Coût | Rien | 1 à 4 centimes l'image |
| Attente | Aucune | 30 à 60 secondes |

**La vie de la scène** vient de la composition : la respiration, le hochement de tête, la bouche qui suit la voix, le
changement de visage, la lumière qui suit l'heure du téléphone. Aucune de ces animations ne passe par le moteur.

## 5. L'inscription, écran par écran

1. **« Créons ta figurine ! »** Un selfie, les deux cases d'aujourd'hui (« C'est bien moi », « J'ai 15 ans ou plus »).
2. **La fabrication.** L'atelier de Pablito, une minute environ.
3. **La découverte.** Sa figurine, assise dans son fauteuil, dans une mise en scène soignée. Premier moment fort.
4. **Les retouches.** La coiffure, la barbe, les vêtements, les accessoires, l'expression : en le disant avec ses mots
   (« les cheveux plus courts »). « Elle ne me ressemble pas » la refait. Puis « C'est moi ! » : le personnage maître
   est enregistré.
5. **La transition.** Le texte du propriétaire : « Ta figurine est prête ! Maintenant, j'aimerais découvrir ce qui fait
   ton univers… », et la précision : une interprétation artistique, pas un diagnostic.
6. **La conversation.** Cinq à huit minutes, sans durée imposée, reprenable (section 6).
7. **La proposition.** Ce qu'elle a compris, ce qu'elle imagine. Il corrige ou complète.
8. **La création.** L'atelier, puis la découverte en plein écran : la brume se lève, sa figurine est chez elle.
   Deuxième moment fort.
9. **« Les clés de ton univers ».** Il touche un objet et voit pourquoi il est là, avec ses propres mots.
10. **Les retouches**, en langage naturel, plafonnées (section 9).
11. **Le premier geste.** « Envoie ton premier message » : sa figurine, dans son univers, part en vidéo.

**Le raccourci des invités.** Quelqu'un qui arrive par un message WhatsApp fait son selfie, obtient sa figurine, et
répond tout de suite **dans l'univers de celui qui l'a invité**. On lui propose ensuite de créer le sien.

**Le risque de ce parcours** est l'abandon pendant la conversation : c'est long avant le premier usage. Trois
parades : on peut la quitter et la reprendre ; au bout de quelques échanges, elle propose « j'ai de quoi faire une
première esquisse » ; on mesure chaque étape (section 12) pour savoir où les gens s'arrêtent.

## 6. La conversation

### 6.1 Comment elle se passe

- **Qui parle.** Pablito, le guide que les gens connaissent, plutôt qu'une IA sans visage. Ses phrases fixes
  (l'accueil, la transition) peuvent être enregistrées par le propriétaire, comme le reste de sa voix. Ce que l'IA
  écrit s'affiche dans ses bulles, sans voix.
- **Le ton.** Quelqu'un qui fait connaissance : une question ouverte, puis il rebondit sur ce qui semble compter,
  approfondit, change de sujet. Des réponses courtes. Jamais deux fois la même question. Il n'insiste pas.
- **« Je préfère ne pas en parler »**, à chaque échange.
- **Pendant qu'on parle, l'univers s'esquisse** sans rien générer : les couleurs de l'écran changent, des vignettes
  apparaissent (« l'atelier », « la mer »). On voit que ce qu'on dit compte.
- **En coulisse**, à chaque échange, un second passage range ce qui a été compris en trois colonnes : ce qu'il a dit
  (avec sa phrase), ce qu'on interprète, ce qu'on ne sait pas. C'est cette fiche qui devient la proposition, puis
  l'univers.
- **Reprendre.** La conversation est gardée, en privé. On la retrouve où on l'avait laissée.

### 6.2 La voix : à l'écrit, et on peut dicter

Le propriétaire a laissé ce choix à l'ingénieur. La conversation se fait **à l'écrit** ; la personne peut **dicter**
ses réponses (un bouton micro : sa voix devient du texte, qu'elle relit avant d'envoyer). La transcription existe
déjà : c'est celle du talkie-walkie.

Pourquoi pas une conversation à l'oral, comme un appel avec l'IA :

- **La règle de la maison** : jamais de voix de synthèse (`CLAUDE.md`). L'identité de ClikMe, ce sont de vraies voix.
  Une IA qui parle dès l'inscription dirait le contraire.
- **Où on s'inscrit** : souvent dans un lieu public, parfois à 15 ans. Écrire est discret ; parler tout haut de ses
  rêves à son téléphone ne l'est pas.
- **La justesse** : à l'écrit, on garde ses mots exacts. Ce sont eux qui s'affichent dans « les clés de ton univers ».
- **Le coût** : quelques centimes à l'écrit, 30 centimes à 1 € à l'oral.
- **La fiabilité** : une conversation orale en direct, dans le navigateur d'un iPhone, coupe et se chevauche encore
  trop souvent.

Si le propriétaire veut un jour l'essayer à l'oral, cela demandera une seconde exception à la règle, décidée par lui,
et une voix qui ne soit celle de personne d'autre sans son accord écrit.

### 6.3 Les garde-fous

- **Jamais de diagnostic.** La proposition parle d'un lieu, pas d'une personnalité (« je t'imagine dans un monde… »,
  jamais « tu es quelqu'un de… »).
- **Jamais d'invention.** Rien n'entre dans la fiche comme « dit » sans la phrase qui le prouve.
- **Les sujets sensibles** (la santé, la religion, la politique, l'orientation, les origines) : la conversation ne les
  creuse pas, et rien n'en est gardé ni mis en image, même si la personne en parle.
- **De 15 à 17 ans** : pas de questions sur la vie amoureuse ; les relations se disent en amitié et en famille.
- **Quelqu'un qui va mal** : la conversation s'arrête de jouer, répond avec égards, et donne le 3114 (le numéro
  national de prévention du suicide) ou le 119 pour un mineur en danger. À écrire avec soin et à faire relire.
- **Tout se voit et s'efface** dans « Ce que ta figurine sait de toi », qui existe déjà. Effacer une chose qui a servi
  à l'univers propose d'enlever l'élément.
- **La politique de confidentialité** dit que la conversation et la photo passent par les moteurs d'OpenAI et de
  Google, et pour quoi faire.

### 6.4 Le modèle

L'appli écrit aujourd'hui avec un petit modèle d'OpenAI (`gpt-5.4-mini`). Pour cette conversation, la qualité d'écoute
compte plus que le prix. Au lot 3, on fait jouer les mêmes conversations à deux modèles et le propriétaire choisit à
la lecture. Un modèle d'un autre fournisseur demanderait une nouvelle clé : sa décision.

## 7. Les lots

Deux règles pour tous les lots :

- **Rien ne casse l'appli en ligne.** Le nouveau parcours vit à une adresse d'essai, réservée au propriétaire, jusqu'à
  son feu vert. Les gens de Dax gardent l'appli d'aujourd'hui pendant ce temps.
- **Une PR par étape**, avec ses essais et la documentation (`docs/figurines.md`, `docs/reprise.md`), comme d'habitude.

### Lot 0 — Les essais qui décident

Avant tout écran, on vérifie ce que les moteurs savent vraiment faire. Les sessions de travail n'ont pas accès aux
moteurs d'image : les essais tournent donc dans l'appli en ligne, depuis une **page d'essais dans l'admin**, que le
propriétaire regarde sur son iPhone.

| Essai | Ce qu'on fait | Ce qu'on décide |
|---|---|---|
| Le style de la figurine | 5 selfies → la figurine assise, réaliste, détourée | La consigne ; si le réalisme flatte assez ; si le moteur refuse |
| La constance | D'une figurine validée : bouche ouverte, 3 visages, debout | Si c'est toujours la même personne, la même tenue |
| Le style des univers | Une même fiche d'essai → 3 directions de style | La direction retenue, et la « charte » des univers |
| La variété | La direction retenue × 3 fiches très différentes | Que deux univers ne se ressemblent pas |
| La composition | La figurine posée dans le décor, puis deux figurines | Si elle a l'air « dans » le monde ou collée dessus |
| La retouche | « Davantage de nature » sur un décor | Si le reste tient |
| Le mouvement | La respiration, le hochement de tête, la parole, sur iPhone | Ce qu'on anime, et comment |
| La vraie 3D | 5 figurines → des outils qui font un modèle 3D | La 3D maintenant, plus tard, ou pas |
| Les coûts | Le prix et le temps de chaque image, relevés | Le budget de la section 9, confirmé ou corrigé |

**Ce qu'il faut du propriétaire** : son selfie et ceux de quatre volontaires qui sont d'accord, du crédit sur le
compte OpenAI, et ses avis. Pour l'essai 3D : des comptes d'essai sur deux ou trois outils, qu'il crée lui-même (aucune
clé ne passe par la conversation).

**Ce que le lot livre** : la page d'essais, les consignes validées, nos images de référence, et un verdict écrit pour
chaque essai.

**On a réussi si** le propriétaire dit « oui, c'est ça » devant une figurine, un univers, et les deux ensemble.

### Lot 1 — Le socle

Invisible pour les utilisateurs. Les deux fiches, leur rangement, leurs versions, la signature de chaque image, le
format d'une scène, les routes pour les lire et les écrire. Chaque figurine d'aujourd'hui reçoit sa fiche « version
0 ».

**Ce que ça prépare** : tout le reste. C'est la réponse à « ne pas enregistrer deux PNG ».

**On a réussi si** on peut refaire une image à l'identique à partir de la fiche, et si l'appli d'aujourd'hui marche
exactement comme avant.

### Lot 2 — Étape 1 : la nouvelle figurine

Les écrans 1 à 4 de la section 5 : le selfie, la fabrication, la découverte, les retouches en mots, la validation. Le
personnage maître est enregistré. Les anciennes figurines sont refaites à la prochaine visite. Pablito passe au
nouveau style.

**Ce que ça prépare** : la pose debout et le fond transparent, pour les scènes.

**On a réussi si** huit personnes sur dix se reconnaissent du premier coup, et si la figurine reste la même d'un visage
à l'autre.

### Lot 3 — Étape 2 : la conversation

Les écrans 5 à 7 : la transition, la conversation écrite avec la dictée, l'esquisse en direct, la proposition en trois
colonnes, les corrections, la reprise. Les garde-fous de la section 6.3. Le choix du modèle.

**Ce que ça prépare** : la fiche de l'univers, et de quoi nourrir plus tard « Surprends-moi » à la place de la carte
de personnage.

**On a réussi si** le propriétaire et ses testeurs disent « on dirait qu'il m'a écouté », et si rien d'inventé ne
passe dans la fiche.

### Lot 4 — L'univers

Les écrans 8 à 10 : la création du décor, les places relevées, la découverte en plein écran avec la figurine posée,
« les clés de ton univers », les retouches plafonnées, l'image vedette à partager, le fauteuil aux couleurs de
l'univers. « Mon univers » devient l'écran d'accueil.

**Ce que ça prépare** : la place de l'invité, déjà dans la fiche ; la couche des souvenirs.

**On a réussi si** les gens partagent leur univers sans qu'on le leur demande.

### Lot 5 — Le premier usage : le proche qui entre

- **Le message qui sort** (WhatsApp, lien) : la vidéo montre sa figurine dans **son** univers. C'est le moteur vidéo
  d'aujourd'hui, avec le décor à la place du fond rose.
- **Le message reçu dans l'appli** : son auteur vient le dire **chez moi**. Sa figurine entre, s'assoit en face de la
  mienne, parle avec sa voix. C'est le talkie-walkie d'aujourd'hui, joué dans l'univers.
- **L'invité de WhatsApp** répond dans l'univers de celui qui l'invite.
- **Le lien d'invitation** ouvre l'univers de celui qui invite, sa figurine dit bonjour.

La règle « chez qui ? », proposée et à confirmer au début du lot : dans l'appli, chacun voit la conversation chez soi,
l'autre lui rend visite ; hors de l'appli, la vidéo se passe chez celui qui l'envoie ; en visite, chez celui qu'on
visite.

**On a réussi si** les messages envoyés augmentent, et si les invités de WhatsApp créent leur univers.

### Lot 6 — Les visites et les souvenirs

Entrer dans l'univers d'un proche. « Frapper à la porte » : le propriétaire est prévenu. Laisser un souvenir (un objet
choisi dans une liste, un petit mot), qui n'apparaît que si le propriétaire l'accepte. Trois réglages, comme dans
« Autour » : tout le monde, mes proches, moi seul. Signaler, retirer.

**On a réussi si** les gens reviennent voir qui est passé.

### Lot 7 — L'appli d'aujourd'hui rhabillée

Voir la section 8. Les mèmes se jouent dans l'univers. « Découvrir » montre les figurines chez elles. Le menu change.
La carte de personnage laisse la place à la conversation. La figurine du mois devient la saison de l'univers.

### Lot R — Le rituel du jour (précision du propriétaire, 11 novembre 2026)

Le propriétaire : « avant toute conversation ou en début de journée, chaque utilisateur donne son état d'esprit du jour
en choisissant rapidement un de ses visages ; les autres figurines disent un mot sur cette humeur, elles-mêmes, sans
que leurs propriétaires aient à le faire ; et après chaque conversation entre deux personnes, chaque figurine laisse un
petit mot final à l'autre, qui clôt la journée d'après ce qui a été dit. L'idée : éveiller la curiosité et relancer la
conversation. »

**Proposé, à confirmer par le propriétaire (section 13).** Il peut se construire **tout de suite, sur l'appli
d'aujourd'hui** (l'onglet « Proches »), en parallèle du lot 0, puis passer dans l'univers au lot 5. Tout ce dont il a
besoin existe déjà : les visages de la figurine (sept humeurs, six attitudes, faits une fois à la demande), les proches,
les paroles transcrites du talkie-walkie, les notifications, la carte de personnage (qui donne à chaque figurine sa
façon de parler), la petite scène des deux figurines face à face.

**1. L'humeur du jour.**
- À la première ouverture du jour : « Comment tu te sens aujourd'hui ? » et la rangée de ses visages. Un toucher.
  « Passer » est possible ; la question revient, discrète, au-dessus de son premier message du jour. Elle ne bloque
  jamais rien, et ne revient pas avant chaque conversation (ce serait pénible).
- Ce visage devient son humeur du jour : sa figurine le porte toute la journée, chez ses proches et dans ses messages.
  Plus tard, l'ambiance de son univers peut suivre (la lumière, le ciel), sans rien générer.
- Visible par ses proches seulement. Il la change quand il veut ; elle s'efface à minuit.
- Un visage qui n'est pas encore fait part à l'atelier de Pablito (une fois, environ 2 centimes).

**2. Ce que les figurines disent de son humeur.**
- Les figurines de trois de ses proches au plus (ceux à qui il parle le plus) lui laissent chacune un mot, écrit par
  l'IA dans le style de chaque figurine. Le mot porte sur l'humeur, et rien d'autre.
- Il les trouve en haut de sa page, et en haut de la conversation avec chaque proche. Une notification au plus par
  jour : « 3 figurines ont réagi à ton humeur 👀 ».

**3. Le mot de la fin.**
- Chaque soir, pour chaque paire de proches qui se sont parlé dans la journée, leurs deux figurines échangent deux
  courtes répliques, une chacune, tirées de ce que les deux personnes se sont dit, et qui finissent sur une relance.
- Elles se découvrent **le lendemain matin**, avec l'humeur du jour : « Cette nuit, vos figurines se sont parlé ». La
  petite scène des deux figurines face à face, leurs mots écrits dans des bulles, et « Lui répondre ».
- Pourquoi le soir plutôt qu'après chaque échange : les messages arrivent à toute heure, une conversation n'a pas de
  fin nette ; une fois par jour, c'est rare donc attendu ; et cela fait un rituel du matin qui ramène dans l'appli.
  C'est aussi la leçon de « Rencontres » : quand les figurines parlent trop, cela ennuie.

**Les garde-fous.**
- **Toujours dit** : « écrit par la figurine de Hugo (IA) ». Jamais présenté comme les mots de Hugo. La loi européenne
  sur l'IA demande de signaler clairement un texte écrit par une IA.
- **Celui dont la figurine parle voit ce qu'elle a dit en son nom**, peut effacer un mot, et peut couper « Ma figurine
  parle pour moi » dans « Moi ».
- **Le ton** : bienveillant, taquin sans moquerie. Sur une humeur triste ou en colère, jamais de blague : un mot doux.
  Jamais de conseil, jamais de santé.
- **Rien d'autre que ce qu'il faut** : un mot sur l'humeur ne connaît que l'humeur et la façon de parler de la
  figurine. Le mot de la fin ne se sert que de ce que les deux se sont dit ce jour-là, jamais de leurs conversations
  avec d'autres ni de la conversation de l'univers.
- **Pas de mot de la fin** quand la conversation touche un sujet sensible, ou quand quelqu'un va mal.
- **De 15 à 17 ans** : aucune taquinerie amoureuse.
- **Entre proches seulement** (qui se sont ajoutés tous les deux). Les mots interdits et rien d'alcoolisé, comme
  partout. Pas de voix : des mots écrits.

**Le coût** : quelques dixièmes de centime par personne active et par jour (de courts textes) ; les visages, une fois.

**On a réussi si** les gens choisissent leur humeur le matin, ouvrent ce que les figurines ont dit, et répondent
ensuite à leur proche.

### Plus tard (préparé, pas construit)

- **Réalise mon vœu** : la figurine met en scène un souhait, dans son univers. Une image générée, gardée.
- **La figurine dans un lieu réel** : la suite d'« Autour ». Elle apparaît dans la photo du lieu.
- **Les univers des commerçants** : leur boutique devient leur univers, fait à partir de leur vitrine. On le visite, on
  y laisse un souvenir.
- **Le rituel du jour dans l'univers** : la figurine du proche vient dire son mot sur mon humeur chez moi, dans son
  fauteuil.
- **Les appels** : les vraies voix des deux personnes, leurs figurines dans le même univers, la bouche qui suit le
  volume de la voix.
- **La vraie 3D**, si l'essai du lot 0 est concluant.

## 8. L'appli d'aujourd'hui dans la nouvelle vision

| Aujourd'hui | Demain |
|---|---|
| 👯 Proches, le talkie-walkie | « Messages et appels » : le proche entre dans mon univers (lot 5) |
| 📍 Autour | « Déposer sa figurine dans un lieu » : c'en est déjà le début |
| ✏️ Créer, les mèmes | La façon de s'exprimer, jouée dans son univers et non plus sur fond rose |
| 🔥 Découvrir | Les figurines dans leurs univers ; un toucher, et on va visiter |
| 🙂 Moi, 📥 Mes mèmes | « Mon univers », l'accueil ; les mèmes y sont rangés comme des souvenirs |
| 🃏 La carte de personnage | Remplacée par la conversation |
| 🗓️ La figurine du mois | La saison de l'univers |
| 🏪 Les commerçants, Dax | Gardés : c'est le modèle économique. La boutique devient un univers |

Le menu deviendrait : **Découvrir · Autour · Créer · Proches · Mon univers**.

## 9. Le budget

L'estimation part du relevé du propriétaire (9 novembre : environ 50 centimes pour 3 ou 4 créations de 4 images en
haute qualité). Une image « haute » coûte donc environ 3 à 4 centimes, une image « moyenne » environ 1 centime. **À
confirmer au lot 0, sur la facture.**

| Poste | Images | Coût |
|---|---|---|
| La figurine assise (un essai, une refaite en moyenne) | 2 hautes | ≈ 0,07 € |
| Ses références (debout, bouche ouverte) et son fauteuil | 3 moyennes | ≈ 0,03 € |
| La conversation à l'écrit, la proposition, les clés | du texte | 0,01 à 0,05 € |
| Le décor de l'univers | 1 haute | ≈ 0,04 € |
| L'image vedette | 1 haute | ≈ 0,04 € |
| **Par nouvel inscrit, sans retouche** | | **≈ 0,20 €** |
| Les retouches gratuites (3 de l'univers, 2 de la figurine) | 5 hautes | ≈ 0,18 € |
| **Au plus, retouches comprises** | | **≈ 0,40 €** |

- **Les plafonds** : 3 retouches gratuites de l'univers et 2 de la figurine à l'inscription ; ensuite, une par jour.
- **À l'usage** : les messages, les visites et les mèmes se composent, donc ne coûtent rien en IA. Un vœu ou un lieu
  réel : 4 à 8 centimes.
- **Pour 1 000 inscrits** : 200 à 400 €.
- **Le rituel du jour** (lot R) : quelques dixièmes de centime par personne active et par jour.
- **Le lot 0** : quelques euros d'images d'essai.

## 10. Ce qu'on prépare sans le construire

Le tableau du propriétaire, et ce qui y répond dans le socle :

| À anticiper | Ce qui le rend possible dès le lot 1 |
|---|---|
| Les animations de la figurine | Des images de référence détourées, au même cadre ; un registre de poses et de visages |
| La réutilisation de l'identité | La fiche, ses versions, la signature de chaque image |
| Les visites d'autres univers | La place de l'invité dans chaque décor ; le réglage « qui peut entrer » |
| Les interactions entre figurines | Le format d'une scène : un décor, plusieurs acteurs |
| Les souvenirs et les traces | La couche des souvenirs, posée sur le décor sans le regénérer |

## 11. Les risques

| Risque | Parade |
|---|---|
| Le style réaliste ne garde pas la personne d'une image à l'autre | Le lot 0 le mesure avant tout écran. Repli : un rendu un peu moins réaliste |
| La figurine a l'air collée sur le décor | L'ombre, la lumière et l'échelle relevées sur le décor ; l'essai de composition |
| On abandonne pendant la conversation | Reprendre plus tard, l'esquisse au bout de quelques échanges, la mesure de chaque étape |
| Le moteur refuse des visages réalistes, surtout jeunes | Mesuré au lot 0. Repli : un autre moteur, ou un rendu plus stylisé |
| Le moteur change et le style dérive | Les versions validées sont gardées ; chaque image est signée |
| Les coûts s'envolent avec les retouches | Les plafonds ; composer plutôt que générer |
| Une confidence sensible finit dans une image | Les garde-fous de la section 6.3 ; rien de sensible n'est gardé |
| Un univers ou un souvenir déplacé | Rien d'alcoolisé, pas de marque, pas de personne célèbre, pas de texte dans l'image ; le souvenir attend l'accord ; le signalement |
| L'appli s'alourdit | Le lot 7 retire autant qu'il ajoute ; « Mon univers » remplace deux onglets |

## 12. Ce qu'on mesure

- À l'inscription : combien arrivent au bout de chaque étape (la figurine, la conversation, l'univers), et en combien
  de temps.
- Combien demandent une retouche, et combien de fois.
- Combien partagent leur univers ; combien envoient un premier message.
- Les visites par jour ; les retours le lendemain et à une semaine.
- Le coût réel par inscrit.

## 13. Ce qui reste à trancher

Rien ne bloque le lot 0. À décider en chemin :

1. La direction de style des univers, sur les essais du lot 0.
2. La vraie 3D, sur l'essai du lot 0.
3. Le fauteuil : de départ puis aux couleurs de l'univers (proposé), ou le même pour tous.
4. La règle « chez qui ? » du lot 5.
5. Le modèle de la conversation, sur lecture, au lot 3.
6. Ce que voit un inconnu de mon univers, par défaut : proposé, « mes proches seulement ».
7. **Le rituel du jour (lot R)** :
   - le construire maintenant sur l'appli d'aujourd'hui, en parallèle du lot 0 (proposé), ou attendre l'univers ;
   - le mot de la fin le soir, découvert le lendemain matin (proposé), ou juste après chaque échange ;
   - qui réagit à mon humeur : les figurines de trois proches au plus (proposé), ou de tous ;
   - celui dont la figurine parle voit ses mots, peut les effacer et peut tout couper (proposé).

## 14. Les mots

- **La fiche** : la description structurée du personnage ou de l'univers. C'est elle qui fait foi, pas l'image.
- **Le décor** : l'image de l'univers, sans figurine.
- **Une place** : l'endroit du décor où une figurine s'assoit.
- **Une scène** : un décor, des figurines, ce qu'elles font.
- **Composer** : assembler des images déjà faites, dans le téléphone.
- **Générer** : demander une nouvelle image au moteur.
- **L'image vedette** : l'image de l'univers avec sa figurine, pour la découverte et le partage.
