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

**La rencontre de deux figurines** fait exception (verdict du lot 0, 12 novembre 2026) : posées côte à côte dans le
téléphone, elles avaient l'air collées. Sa scène est **générée une fois** par le moteur (le décor, les deux figurines,
ce qu'elles font), gardée, puis animée légèrement (les bulles, la voix, la lumière).

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

**Où on en est (11 novembre 2026).** Le propriétaire a donné quatre selfies de volontaires d'accord et du crédit
OpenAI. **Étape 1 construite** : la page d'essais `/admin/humain/univers-essais` (lien « Univers : les essais du lot 0 »
dans l'admin), réservée à l'administrateur :

- **les personnes** : un repère, un selfie (réduit dans le téléphone), et la case « cette personne est d'accord »
  sans laquelle rien ne part. Le selfie reste dans le seau privé (`essais-univers/`), jamais dans le dépôt de code ;
  « Effacer cette personne » emporte son selfie et toutes ses images. Ses traits sont décrits comme aujourd'hui ;
- **sa figurine, en trois variantes** (`univers-essais.ts`) : « Collection, détourée » (la cible : une figurine de
  collection réaliste, assise dans un petit fauteuil, jambes croisées, ses propres vêtements en vrai tissu, de vrais
  cheveux, la tête à 45 % de la hauteur, lèvres fermées, fond transparent), « Collection, en photo » (la même,
  photographiée sur une table, pour juger l'objet) et « Plus douce » (une finition de figurine d'artiste, pour voir si
  le réalisme flatte assez). Une consigne neuve, en anglais ; les anciennes ne changent pas ;
- **la constance**, sur une figurine qu'il a aimée : bouche ouverte, joie, fou rire, colère, debout (sans fauteuil) ;
- **pour chaque image** : le moteur, la qualité, la durée, les jetons, la consigne mot pour mot, **👍 / 👎 et une
  note** — ce qui fera le verdict écrit ;
- les images se font **après la réponse** (la page se met à jour toute seule, le téléphone peut se mettre en veille) ;
  150 images par jour au plus. Le moteur : celui des figurines (`OPENAI_API_KEY`), qualité `ESSAIS_QUALITE` (« high »).

**Étape 2, construite** (sur la même page, section « Les univers ») :

- **trois fiches d'essai** inventées, très différentes (« L'atelier sur la mer », « La serre aux disques », « Le toit
  aux étoiles »), et « Ma fiche » (il écrit la sienne) ;
- **trois directions de style** : « Diorama miniature » (un monde fait main, photographié de près : la continuité de
  la figurine), « Pièce miniature » (une pièce de maison de poupée haut de gamme), « Monde peint » (3D peinte, plus
  conte). Le décor : une image 9:16 **sans figurine**, la caméra à hauteur de figurine, une scène dégagée en bas pour
  deux fauteuils, la lumière de gauche ; dessiné d'après la consigne seule ;
- **le style** (une fiche, en trois directions) et **la variété** (une direction, sur les trois fiches) ;
- **la retouche** d'un décor (« davantage de nature » d'office, ou ce qu'il écrit) : le même décor, une chose change ;
- **la scène, composée dans le téléphone** (rien n'est généré) : le décor, une ou deux figurines détourées posées sur
  la scène avec leur ombre, leur taille, face à face ; **le mouvement** : la respiration, le hochement, la parole (sa
  « bouche ouverte » alterne, si la constance l'a faite) ;
- **la vedette** : la même chose faite par le moteur (il pose la figurine dans le décor), pour comparer composer et
  générer ;
- **la vraie 3D** : une note sur la page (des outils externes, ses comptes d'essai, aucune clé chez nous).

**Le premier verdict du propriétaire (11 novembre 2026, sur ses volontaires Marius et Claire).**

- **La figurine** : « quasi à l'identique de la photo, avec juste un plus petit corps » — le moteur recopiait le
  visage (la consigne demandait de le garder « exactement », en réglage fidèle). Il voulait **la tête retravaillée**,
  comme la figurine qu'il a montrée : une caricature sculptée, les cheveux en volume, une vraie expression, un doigt
  sur la joue. Le moteur a rendu en 37 à 42 secondes, 2 900 jetons environ par image (`gpt-image-2.6-sunburst`, haute
  qualité). Deux images de Claire ne s'affichaient pas : des adresses signées ratées (corrigé : par petits groupes, un
  second essai, et « recharger »).
- **Les univers** : « je n'imaginais pas vraiment les univers comme ceux-là ». Ce qu'il imagine : un décor de **film
  d'animation**, riche, plein d'objets personnels, éclairé comme au cinéma, avec une touche de magie (une
  bibliothèque-tour, une constellation de lumière, des échelles, un tableau des Pyrénées, un mouton…).
- **Le face-à-face composé dans le téléphone** (deux figurines détourées posées sur le décor) : « ne fonctionne pas du
  tout » — il faut une **mise en scène travaillée et naturelle** : les deux figurines qui interagissent dans le lieu
  (l'une debout qui raconte, l'autre dans son fauteuil qui rit), avec leurs bulles par-dessus. Dans le style grosse
  tête et petit corps.

**La deuxième série** (même page) : la tête **re-sculptée, jamais recopiée** (caricature d'environ 25 %, finition de
résine peinte, une expression et une pose qui ont du caractère), en trois variantes (détourée « fidèle », détourée
« libre », en situation sur un socle en bois) ; des univers de **film d'animation** (« magique », « chaleureux »,
« grandiose ») ; et **la scène mise en scène par le moteur** (le décor, une ou deux figurines, la situation qu'il
écrit ; deux bulles posées par-dessus pour juger le rendu). La scène composée dans le téléphone est retirée.

**Ce que ça change dans le plan (à confirmer sur la deuxième série)** : la section 4.5 disait « composer d'abord,
générer rarement ». Pour la rencontre de deux figurines, la composition ne suffit pas : **la scène d'une rencontre est
générée une fois** (une image, 4 à 6 centimes avec trois images en entrée), puis l'appli l'anime légèrement (les
bulles, la voix, la lumière). Le décor seul et la figurine seule restent des références, faites une fois.

**Le verdict du propriétaire (12 novembre 2026, sur la deuxième série) : le lot 0 est fermé.**

| Essai | Verdict | Ce que ça devient |
|---|---|---|
| Le style de la figurine | **« Sculptée, détourée »** : la tête re-sculptée en caricature de collection (environ 25 %), résine peinte, assise dans son fauteuil, fond transparent, le moteur en réglage « fidèle » (`input_fidelity: high`) | La consigne du lot 2 : `consigneFigurineCollection("sculptee", traits)` (`univers-essais.ts`) |
| La constance | **Validée** : la même figurine bouche ouverte, en trois visages, debout | Ses références (assise, assise bouche ouverte, debout) et ses visages : `consigneConstance` |
| Le style des univers | **« Film, chaleureux »** : un décor de film d'animation, sans magie, un lieu habité, doré, plein de charme, un espace accueillant devant | La charte des univers du lot 4 |
| La scène | **Validée** : le moteur met en scène une ou deux figurines dans le décor, d'après une situation ; les bulles par-dessus | La rencontre de deux figurines est **générée une fois**, puis animée légèrement (section 4.5) |
| La variété, la retouche | Pas d'avis à part | Revues au lot 4, sur de vrais univers |
| La vraie 3D | Pas essayée | Reportée (« plus tard ») |
| Les coûts | 37 à 42 secondes par image, environ 2 900 jetons en haute qualité, 3 à 4 centimes l'image d'après sa facture | Le budget de la section 9 tient |

Les deux séries d'images restent sur la page d'essais : ce sont nos images de référence. La page reste ouverte pour
essayer une consigne avant de la mettre dans l'appli.

### Lot 1 — Le socle

Invisible pour les utilisateurs. Les deux fiches, leur rangement, leurs versions, la signature de chaque image, le
format d'une scène, les routes pour les lire et les écrire. Chaque figurine d'aujourd'hui reçoit sa fiche « version
0 ».

**Ce que ça prépare** : tout le reste. C'est la réponse à « ne pas enregistrer deux PNG ».

**On a réussi si** on peut refaire une image à l'identique à partir de la fiche, et si l'appli d'aujourd'hui marche
exactement comme avant.

**Construit (12 novembre 2026)** — le détail : `docs/figurines.md`, 9.0 duodetricies.

- `perso.ts`, `monde.ts`, `scene.ts` : les trois formats, vérifiés à la lecture (ce qui ne tient pas est écarté,
  jamais deviné) ; `fiches-serveur.ts` : le rangement, les versions, le retour à une version, la validation ;
  `signature-serveur.ts` : la signature d'une image.
- La version 0 se lit (rien n'est écrit pour les figurines d'aujourd'hui) ; depuis ce lot, leur fabrication garde
  leurs traits et la signature de leurs deux images.
- « Refaire à l'identique » : la consigne de chaque image se recalcule à partir de la fiche ; si c'est mot pour mot
  celle de sa signature, elle est refaisable (le moteur, lui, ne rend jamais deux fois les mêmes pixels : c'est la
  consigne, les réglages et les entrées qui sont garantis).
- Routes : `GET /api/direct/perso` ; côté admin, `GET /api/admin/direct/fiches?h=…` et le retour à une version.
- Essais : `scripts/verifier-fiches.mjs` (dans la CI, sans téléphone), `scripts/essai-fiches-route.mjs`.

### Lot 2 — Étape 1 : la nouvelle figurine

Les écrans 1 à 4 de la section 5 : le selfie, la fabrication, la découverte, les retouches en mots, la validation. Le
personnage maître est enregistré. Les anciennes figurines sont refaites à la prochaine visite. Pablito passe au
nouveau style.

**Ce que ça prépare** : la pose debout et le fond transparent, pour les scènes.

**On a réussi si** huit personnes sur dix se reconnaissent du premier coup, et si la figurine reste la même d'un visage
à l'autre.

**Construit, à l'adresse d'essai (12 novembre 2026)** — `/univers/figurine`, réservée au propriétaire ; le détail :
`docs/figurines.md`, 9.0 undetricies. Le selfie et ses deux cases, l'atelier, la découverte dans son fauteuil, les
retouches avec ses mots (une proposition chacune, faite sur la précédente), « Elle ne me ressemble pas », « C'est
moi ! » (une version validée de sa fiche, puis sa bouche ouverte et debout). Douze propositions par jour au plus.
**Son verdict (12 novembre 2026)** : « c'est bon, la figurine est ok » — sur sa propre figurine (la tête re-sculptée,
reconnaissable, la main sur la joue, dans son fauteuil). **Reste** : le feu vert pour tout le monde (les figurines
d'aujourd'hui refaites à la prochaine visite, Pablito au nouveau style), une fois le parcours complet (lots 3 et 4) à
l'adresse d'essai ; les visages du nouveau style.

### Lot 3 — Étape 2 : la conversation

Les écrans 5 à 7 : la transition, la conversation écrite avec la dictée, l'esquisse en direct, la proposition en trois
colonnes, les corrections, la reprise. Les garde-fous de la section 6.3. Le choix du modèle.

**Ce que ça prépare** : la fiche de l'univers, et de quoi nourrir plus tard « Surprends-moi » à la place de la carte
de personnage.

**On a réussi si** le propriétaire et ses testeurs disent « on dirait qu'il m'a écouté », et si rien d'inventé ne
passe dans la fiche.

**Ses décisions (12 novembre 2026, « fais ce que tu penses être le mieux »)** : le message pour quelqu'un qui va mal
est écrit avec les numéros officiels (le 3114, le 119, le 15 ou le 112), sans conseil ni analyse ; le modèle est le
plus capable de ceux du compte OpenAI (`gpt-5.4`, réglable par `OPENAI_UNIVERS_MODEL`), le petit (`gpt-5.4-mini`) en
secours, sans nouvelle clé ; Pablito écrit, sans voix — ses phrases fixes sont prêtes à être enregistrées un jour
(`PHRASES_FIXES`, `conversation-univers.ts`).

**Construit, à l'adresse d'essai (12 novembre 2026)** — `/univers/conversation`, réservée au propriétaire, après « C'est
moi ! » (« Découvrir ton univers ») ; le détail : `docs/figurines.md`, 9.0 tricies. La transition ; la conversation
écrite, la dictée ; l'esquisse (les couleurs de l'écran, les vignettes) ; les trois colonnes rangées à chaque échange
(une chose « dite » porte sa phrase, vérifiée mot pour mot) ; « Voir ce que j'imagine » ; la proposition (retirer,
corriger avec ses mots) ; « C'est mon univers ! » : la fiche de son univers, version 1. Les garde-fous : un sujet
sensible n'est pas gardé ; quelqu'un qui va mal reçoit le message d'aide et les numéros, la conversation s'arrête de
jouer ; tout s'efface. **Reste** : son avis, à la lecture d'une vraie conversation.

### Lot 4 — L'univers

Les écrans 8 à 10 : la création du décor, les places relevées, la découverte en plein écran avec la figurine posée,
« les clés de ton univers », les retouches plafonnées, l'image vedette à partager, le fauteuil aux couleurs de
l'univers. « Mon univers » devient l'écran d'accueil.

**Ce que ça prépare** : la place de l'invité, déjà dans la fiche ; la couche des souvenirs.

**On a réussi si** les gens partagent leur univers sans qu'on le leur demande.

**Construit, à l'adresse d'essai (12 novembre 2026) — la première moitié (4a)** : `/univers/monde`, réservée au
propriétaire ; le détail : `docs/figurines.md`, 9.0 untricies. La création (le décor d'après sa fiche, « Film,
chaleureux » ; les places relevées par un modèle qui voit ; l'image vedette), la découverte en plein écran (la brume,
sa figurine assise à sa place), « Les clés de ton univers », l'image vedette à partager, les retouches avec ses mots
(trois offertes, puis une par jour), revenir à la version d'avant.

**Construit, à l'adresse d'essai (12 novembre 2026) — la seconde moitié (4b)** ; le détail : `docs/figurines.md`, 9.0
duotricies 🪑. Son fauteuil prend les couleurs de son univers pendant la création (une nouvelle version de sa
figurine, refaisable ; « 🪑 Ton fauteuil a pris les couleurs de ton monde ») ; **« Mon univers » est l'accueil, à
`/univers`** : son univers et le menu de demain (Découvrir · Autour · Créer · Proches · Mon univers), ou l'étape où il
en est. **Reste** : son avis sur le parcours complet, et le feu vert pour tout le monde.

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

**Construit (12 novembre 2026) — 5a** ; le détail : `docs/figurines.md`, 9.0 tretricies 🚪. La conversation du
talkie-walkie se joue chez moi quand mon univers est créé : mon décor, ma figurine à ma place, le proche qui entre et
s'assoit à la place de l'invité, qui parle avec sa voix.

**Construit (12 novembre 2026) — 5b et 5c** ; le détail : `docs/figurines.md`, 9.0 quattuortricies 🎬🔗. La vidéo
qui part sur WhatsApp se passe chez moi (mon décor à la place du fond rose) ; le lien d'invitation ouvre mon univers
(« 👋 Bienvenue chez moi ! », l'aperçu du lien : mon image vedette) ; l'invité y répond, et nos deux figurines sont
chez moi. **Reste** : son avis, puis le feu vert pour tout le monde.

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

**Accepté par le propriétaire le 11 novembre 2026 (« oui pour tout, on commence le lot R maintenant »). Le lot R1
(l'humeur du jour, et ce que les figurines en disent) est construit (`docs/figurines.md`, 9.0 quinvicies ☀️), le lot
R2 (le mot de la fin) aussi (9.0 sexvicies 🌙).** Il se construit **tout de suite, sur l'appli
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
  jour : « 3 figurines ont réagi à ton humeur 👀 » (construit sans elle : il est dans l'appli quand elles écrivent ;
  la notification du matin dit le mot de la fin).

**3. Le mot de la fin.**
- Pour chaque paire de proches qui se sont parlé dans la journée, leurs deux figurines échangent deux courtes
  répliques, une chacune, tirées de ce que les deux personnes se sont dit, et qui finissent sur une relance. (Construit
  ainsi : elles s'écrivent le matin, à la première ouverture de l'un des deux ou par l'envoi de 8 h 40.)
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

**4. Ma figurine me répond — lot R3** (le propriétaire, le 12 novembre 2026 : « quand je donne ma mood le matin, est-ce
qu'on pourrait avoir quelque chose : notre figurine qui nous dirait quelque chose ? » ; puis « oui, tout est bien,
vas-y »). Aujourd'hui, ce sont les figurines de ses proches qui lui écrivent, et plus tard : lui, sur le moment, n'a rien
(et quelqu'un sans proches n'a rien du tout).
- **Tout de suite**, SA figurine prend le visage choisi et lui dit une phrase, écrite, sans voix ; **la phrase finit sur
  un geste utile** : la joie et l'euphorie, « 📲 Envoyer ma tête du jour » (le studio, ce visage, « Ma tête du jour ») ;
  le fou rire, « 💬 Raconter à un proche » ; l'amour, « 😍 Le mème « Je t'aime » » ; la grimace, « 🎭 Un mème avec
  cette tête » ; la tristesse, la colère, « oh non » : un mot doux, sans blague ni conseil, et « ✨ Faire un vœu » (ou
  « 💬 Écrire à un proche » s'il en a un en route), en discret.
- **Elle se souvient de la veille** : une remontée, une descente, une série de bonne humeur, deux jours difficiles, un
  changement (pas deux jours de suite).
- **Au troisième jour difficile d'affilée** : un mot doux à part, et en petit « Si ça ne va vraiment pas, le 3114 répond
  jour et nuit » (qui reste tant que les jours difficiles durent).
- **Le dimanche, « Ta semaine en visages »** : ses sept têtes, une phrase (soleil, montagnes russes, ou pas facile), à
  partager en image.
- **Les phrases** : une dizaine par humeur, écrites d'avance et validées par le propriétaire (instantané, sans coût,
  sans risque) ; l'IA pourra les personnaliser plus tard, dans le style de sa carte de personnage.

**Construit (12 novembre 2026)** — `docs/figurines.md`, 9.0 sexatricies ☀️. **Reste** : que sa figurine garde son
humeur toute la journée dans son univers et dans les conversations (affalée, ou en train de danser) : avec le lot R4.

**5. La conversation vivante — lot R4** (le propriétaire, le 12 novembre 2026 : « qu'est-ce qui va être différenciant,
mis à part nos figurines qui parlent et qui bougent ? Il faut qu'il y ait une utilité et du dynamisme dans cette
scène » ; puis « oui » au premier lot proposé). **Prévu, pas construit** ; il touche la scène de la conversation
(`proches.tsx`), qu'une seule session doit reprendre à la fois.
- **R4a, sans IA — les figurines vivantes** : quand l'autre enregistre, sa figurine se penche, main levée, « … » ;
  pendant les silences, elles s'étirent, regardent leur téléphone (20 s), puis selon l'humeur du jour se lèvent et
  dansent (sur la musique de l'univers), s'affalent ou croisent les bras (1 min), puis s'endorment, zZz (3 min) ; un
  message arrive : elles sursautent. **Les réactions avec le corps** (un appui long sur un message : applaudir, mort de
  rire, cœur, check, se taper le front, waouh), dans les deux scènes. **Les panneaux** (un toucher, sa figurine brandit
  une pancarte, vue des deux) : « MDR » · « J'arrive ! » · « Rappelle-moi » · « Bravo ! » · « Pas dispo 😴 » · « Je
  pense à toi » · « Merci ! » · « Ce soir ? » (liste validée). Son humeur du jour se voit dans la scène toute la journée.
- **R4b — l'aparté des deux figurines** : après un vrai échange (chacun a parlé, au moins quatre messages en un quart
  d'heure) et deux minutes de silence, elles se tournent l'une vers l'autre, une bulle chacune, « écrit par vos
  figurines · IA ». **Visibles des deux, sans demande d'accord** (le propriétaire : « pas besoin d'accord, mais visibles
  des deux ») ; jamais de commentaire privé sur l'autre ; « Ma figurine parle pour moi » (dans « Moi ») les fait taire,
  et chacun peut en effacer un. Une fois par heure et par paire au plus, trois par jour. Les garde-fous du mot de la fin
  (cet échange seulement, rien sur un sujet sensible, ni amour, ni corps, ni santé, ni argent ; taquin sans moquerie ;
  aucun accord au masculin ou au féminin). Un appel au petit modèle par aparté.
- **Plus tard** : le résumé au retour (« Pendant ton absence, Léa t'a laissé 4 vocaux : … »), et le lieu qui garde la
  mémoire (un moment marquant devient un objet de l'univers, lot 6).

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

1. ~~La direction de style des univers~~ — tranché le 12 novembre 2026 : « Film, chaleureux » (lot 0).
2. La vraie 3D : pas essayée au lot 0, reportée.
3. ~~Le fauteuil~~ — tranché le 12 novembre 2026 : un fauteuil de départ à la création, refait aux couleurs de son
   univers une fois celui-ci créé (`FAUTEUIL_DE_DEPART`, `perso.ts`).
4. ~~La règle « chez qui ? » du lot 5~~ — tranchée le 12 novembre 2026, « oui » aux trois : dans l'appli, chacun voit
   la conversation chez soi, l'autre lui rend visite ; sur WhatsApp, elle se passe chez celui qui envoie ; en visite,
   chez celui qu'on visite.
5. ~~Le modèle de la conversation~~ — décidé le 12 novembre 2026 (délégué) : le plus capable du compte, le petit en
   secours (`OPENAI_UNIVERS_MODEL`).
6. Ce que voit un inconnu de mon univers, par défaut — le propriétaire, le 12 novembre 2026 : « pourquoi seulement
   mes proches ? Ça pourrait être sympa de voir les univers des autres, ça ne risque rien ». Proposé en réponse, à
   confirmer au lot 6 : **son univers visible de tous** (le décor, sa figurine chez elle) ; **ses clés** (ses propres
   phrases, tirées de sa conversation avec Pablito) et **les souvenirs déposés** réservés à ses proches ; de 15 à 17
   ans, « mes proches » par défaut ; chacun peut choisir « mes proches » ou « moi seul ».
7. ~~**Le rituel du jour (lot R)**~~ — tranché le 11 novembre 2026, « oui pour tout » : construit maintenant sur
   l'appli d'aujourd'hui ; le mot de la fin la nuit, découvert le matin ; trois figurines au plus réagissent ; celui
   dont la figurine parle voit ses mots, les efface, peut tout couper.

## 14. Les mots

- **La fiche** : la description structurée du personnage ou de l'univers. C'est elle qui fait foi, pas l'image.
- **Le décor** : l'image de l'univers, sans figurine.
- **Une place** : l'endroit du décor où une figurine s'assoit.
- **Une scène** : un décor, des figurines, ce qu'elles font.
- **Composer** : assembler des images déjà faites, dans le téléphone.
- **Générer** : demander une nouvelle image au moteur.
- **L'image vedette** : l'image de l'univers avec sa figurine, pour la découverte et le partage.
