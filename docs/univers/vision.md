# ClikMe — la vision : chacun son personnage, chacun son univers

*Les deux textes du propriétaire, reçus le 11 novembre 2026, recopiés tels quels (il y écrit « ClickMe »). Ce sont eux
qui font foi. Ce qu'on en a décidé ensemble, et le plan pour y arriver : `feuille-de-route.md`, dans ce dossier.*

---

# Texte 1 — Vision du projet et ambition technologique

## 1. Ce que nous voulons construire

ClickMe n'est pas une application classique de messagerie avec des avatars personnalisés.

Notre ambition est de créer une nouvelle manière de représenter les individus et de leur permettre d'interagir
socialement.

Aujourd'hui, les réseaux sociaux permettent de partager des photos, des vidéos, des messages et des profils. Mais ils
ne permettent pas véritablement de représenter l'univers personnel de chacun ni de faire entrer une autre personne dans
cet univers lorsqu'on communique avec elle.

ClickMe veut transformer la communication numérique en une expérience immersive, personnalisée et vivante.

Chaque utilisateur possède deux éléments fondamentaux :

- Sa figurine personnelle : une représentation caricaturale, amusante et reconnaissable de lui-même, avec une grosse
  tête et un petit corps.
- Son univers personnel : un monde visuel unique, créé à partir d'une conversation avec une intelligence artificielle
  qui apprend à connaître ses goûts, ses passions, ses aspirations et sa façon de voir les choses.

Ces deux éléments constituent son identité numérique dans ClickMe.

## 2. L'innovation conceptuelle

L'innovation ne réside pas uniquement dans la création d'un personnage 3D ou d'un décor généré par IA.

Elle réside dans leur utilisation commune et persistante dans toutes les interactions sociales.

La figurine représente la personne. Son univers représente son monde personnel.

Lorsqu'un utilisateur communique avec quelqu'un, les deux figurines peuvent se retrouver dans un même environnement.

Par exemple :

- Lorsqu'il appelle quelqu'un, la figurine de son interlocuteur peut entrer dans son univers et interagir avec la
  sienne.
- Lorsqu'il échange des messages, les figurines peuvent réagir aux conversations par des expressions, des gestes et des
  animations.
- Lorsqu'une personne visite l'univers d'un autre utilisateur, elle peut y laisser un souvenir symbolique de son
  passage, avec l'accord du propriétaire.
- Lorsqu'un utilisateur publie un vœu, sa figurine peut le mettre en scène dans son propre univers.
- Lorsqu'il dépose sa figurine dans un lieu réel, celle-ci devient le prolongement visuel de son identité.

L'utilisateur ne communique donc plus uniquement par l'intermédiaire d'un écran de discussion : il peut faire vivre son
personnage dans son propre monde et accueillir les personnages des autres.

## 3. L'innovation technologique

Pour rendre cette expérience possible, il faut construire un système d'identité numérique persistante reposant sur deux
références maîtresses :

**A. Un personnage maître.** Un personnage 3D ou une représentation générative suffisamment stable pour conserver son
apparence dans toutes les situations, animations, expressions et interactions.

**B. Un univers maître.** Une représentation structurée et persistante de l'univers de chaque utilisateur, avec ses
décors, ses objets, ses couleurs, son atmosphère et ses éléments symboliques.

L'intelligence artificielle doit pouvoir utiliser ces deux références ensemble pour générer de nouvelles scènes sans
perdre la cohérence visuelle initiale.

Il faut donc penser dès le départ à une architecture capable de :

- Conserver l'identité des personnages.
- Conserver les caractéristiques des univers.
- Générer des scènes contextualisées.
- Faire cohabiter plusieurs personnages dans un même environnement.
- Adapter les animations aux messages et aux appels.
- Faire évoluer les univers sans les dénaturer.

Il ne faut pas repartir de zéro à chaque génération.

## 4. Pourquoi les deux étapes de l'inscription sont fondamentales

La création de la figurine et la création de l'univers ne sont pas deux fonctionnalités indépendantes.

Elles constituent le socle technologique et identitaire de toute l'expérience ClickMe.

La première étape donne un visage à l'utilisateur.

La deuxième donne une identité et un environnement à ce personnage.

Une fois ces deux éléments créés, toutes les autres fonctionnalités de l'application pourront s'appuyer dessus.

## 5. L'objectif final

Nous ne cherchons pas simplement à créer de jolis avatars ou de belles images générées par intelligence artificielle.

Nous voulons construire un environnement social dans lequel :

- Chacun possède son propre personnage.
- Chacun possède son propre univers.
- Les personnages peuvent se rencontrer.
- Les utilisateurs peuvent entrer dans les univers des autres.
- Les interactions laissent éventuellement des traces et des souvenirs.
- Les univers peuvent évoluer avec les expériences et les rencontres de leurs propriétaires.

La promesse de ClickMe : ne plus seulement communiquer avec quelqu'un, mais pouvoir entrer dans son monde.

C'est cette vision qui doit guider les choix techniques, graphiques et fonctionnels dès la conception du parcours
d'inscription.

## Une recommandation très importante pour ton ingénieur

Je lui demanderais de distinguer deux niveaux de développement :

| À construire maintenant | À anticiper dès maintenant |
|---|---|
| Création de la figurine | Animations de la figurine |
| Conversation avec l'IA | Réutilisation de l'identité |
| Création de l'univers | Visites d'autres univers |
| Sauvegarde des deux identités | Interactions entre figurines |
| Cohérence visuelle | Souvenirs et traces des rencontres |

Cela évite une erreur coûteuse : développer aujourd'hui un générateur d'images qui sera incapable demain de faire
interagir deux personnages de façon cohérente.

Mon conseil : ton ingénieur doit concevoir dès le départ le socle d'un monde social persistant, même si les premières
fonctionnalités livrées sont simplement la création de la figurine et de l'univers.

C'est cette différence qui sépare une jolie expérience IA d'un véritable concept de réseau social.

---

# Texte 2 — Parcours d'inscription : création de la figurine et de l'univers personnel

## 1. Objectif général

Concevoir une expérience d'inscription immersive et différenciante dans ClickMe, organisée en deux grandes étapes
successives :

**Étape 1 : création de ma figurine.** L'utilisateur crée son double numérique personnalisé à partir d'une
photographie.

**Étape 2 : création de mon univers.** L'utilisateur échange avec une intelligence artificielle au cours d'une véritable
conversation naturelle. L'IA apprend à connaître ses goûts, ses passions, ses aspirations et les choses qui comptent
pour lui, afin de concevoir un univers visuel personnel et singulier.

À la fin du parcours, l'utilisateur possède :

- Sa figurine personnalisée.
- Son univers personnel en plein écran.
- Une identité visuelle cohérente qui pourra être réutilisée dans toutes les fonctionnalités de ClickMe.

L'expérience doit provoquer une émotion : l'utilisateur doit avoir le sentiment de découvrir quelque chose qui lui
ressemble réellement et dont il est fier.

## Étape 1 — Création de ma figurine

### 2. Le principe graphique

La figurine doit être un personnage 3D caricatural, attachant, amusant et immédiatement reconnaissable.

Style recherché :

- Tête volontairement disproportionnée par rapport au corps.
- Petit corps, jambes et bras courts.
- Visage fidèle à la photographie de l'utilisateur.
- Expressions faciales naturelles et expressives.
- Cheveux, barbe, lunettes et caractéristiques physiques conservés.
- Vêtements personnalisables.
- Rendu 3D de grande qualité, avec une finition de figurine de collection.

La référence esthétique est celle d'une figurine de type bobblehead, avec une dimension ludique et sympathique.

Il ne faut pas produire un avatar classique, un personnage de jeu vidéo réaliste ou un simple portrait avec un corps
miniature.

La grosse tête et le petit corps doivent devenir une signature visuelle forte de ClickMe.

### 3. Parcours utilisateur

1. L'utilisateur arrive sur un écran de présentation : « Créons ta figurine ! »
2. Il prend une photo ou importe une photographie depuis son téléphone.
3. L'IA analyse les caractéristiques visuelles du visage.
4. Le système génère une première figurine 3D personnalisée.
5. L'utilisateur découvre sa figurine dans une mise en scène valorisante.
6. Il peut demander des modifications :
   - Coiffure.
   - Barbe.
   - Vêtements.
   - Accessoires.
   - Expression du visage.
7. Il valide définitivement son personnage.

Prévoir une possibilité de régénération si le résultat ne lui ressemble pas suffisamment.

### 4. Exigence technique importante

La figurine validée devient le personnage maître de l'utilisateur.

Il faut conserver une référence stable permettant de retrouver exactement le même personnage dans les générations
futures.

Il faut notamment préserver :

- Les proportions de la tête et du corps.
- Les traits du visage.
- La coiffure.
- La barbe.
- Les couleurs.
- Les vêtements de référence.

La figurine doit pouvoir être générée dans différentes poses, expressions et situations sans perdre son identité.

Prévoir idéalement un modèle 3D ou un système de génération cohérente de personnages, avec une référence visuelle
persistante.

## Étape 2 — Création de mon univers personnel

### 5. Le principe fondamental

Une fois sa figurine créée, l'utilisateur est invité à découvrir son univers personnel.

L'univers ne doit pas être un décor prédéfini choisi dans une liste de thèmes.

Il doit être imaginé à partir d'une véritable conversation entre l'utilisateur et une IA.

L'objectif est de transformer les informations confiées par l'utilisateur en un environnement visuel qui lui ressemble.

L'IA ne doit pas simplement poser des questions : elle doit faire connaissance avec la personne.

Elle doit adopter un comportement naturel, chaleureux et curieux, comme une personne qui découvre quelqu'un.

### 6. Démarrage de la conversation

Après la validation de sa figurine, afficher une transition :

« Ta figurine est prête ! Maintenant, j'aimerais découvrir ce qui fait ton univers. On va discuter un peu, et je vais
essayer de donner vie à ton monde. »

Préciser que l'IA va proposer une interprétation artistique de ce que l'utilisateur lui raconte, et non effectuer un
diagnostic psychologique.

La conversation doit être fluide et naturelle.

Elle peut être réalisée par écrit ou par la voix si cette possibilité est disponible.

Durée cible : environ 5 à 8 minutes, sans durée obligatoire.

### 7. Fonctionnement de l'IA conversationnelle

L'IA doit utiliser une conversation adaptative.

Elle ne doit pas dérouler un questionnaire rigide.

Elle commence par des questions ouvertes, puis rebondit sur les réponses pour approfondir les sujets qui semblent
importants.

Exemples de thèmes à explorer :

**A. Les passions**

- Qu'est-ce que tu aimes vraiment faire dans la vie ?
- Quelles sont les activités qui te font perdre la notion du temps ?
- Qu'est-ce qui te passionne depuis longtemps ?

**B. La personnalité et le quotidien**

- À quoi ressemble une journée idéale pour toi ?
- Tu préfères l'action, le calme, les rencontres ou les moments seul ?
- Qu'est-ce qui te met de bonne humeur ?

**C. Les relations humaines**

- Quelle importance accordes-tu aux personnes qui t'entourent ?
- Qu'est-ce que tu apprécies le plus chez les autres ?
- Qu'est-ce qui rend une rencontre importante à tes yeux ?

**D. Les aspirations**

- Y a-t-il quelque chose que tu aimerais particulièrement accomplir ?
- Qu'aimerais-tu découvrir ou vivre dans les prochaines années ?
- De quoi rêves-tu actuellement ?

**E. L'imaginaire et la créativité**

- Si tu pouvais construire un endroit où tu te sentirais parfaitement bien, à quoi ressemblerait-il ?
- Quelles ambiances, couleurs ou paysages t'attirent ?
- Qu'est-ce qui te donne envie de créer ?

Ces exemples ne constituent pas une liste obligatoire.

L'IA doit sélectionner ses questions en fonction des réponses précédentes, éviter les répétitions et ne pas insister
sur des sujets que l'utilisateur ne souhaite pas aborder.

Elle doit savoir écouter, rebondir, approfondir et parfois changer de sujet naturellement.

### 8. Compréhension et synthèse

À la fin de la conversation, l'IA doit synthétiser ce qu'elle a compris.

Elle distingue :

- Les informations explicitement données par l'utilisateur.
- Les interprétations artistiques qu'elle souhaite proposer.
- Les éléments qu'elle ne connaît pas.

Elle présente une courte description de l'univers qu'elle imagine.

Exemple :

« J'ai l'impression que ton univers pourrait être un endroit où la créativité rencontre l'aventure, avec des moments de
calme, des défis à relever et une grande place accordée aux rencontres. Je t'imagine dans un monde vivant, chaleureux,
avec des espaces qui évoluent au fil de tes découvertes. »

Ce résumé doit être présenté comme une proposition, jamais comme une vérité sur la personnalité de l'utilisateur.

L'utilisateur peut corriger ou compléter cette interprétation avant la génération.

### 9. Génération de l'univers personnel

À partir des éléments validés, l'IA déclenche la génération de l'univers.

L'univers doit être :

- Unique.
- Visuellement riche.
- Cohérent.
- Immersif.
- Personnel.
- Esthétiquement remarquable.

Le rendu doit être une création 3D de grande qualité, dans la continuité stylistique de la figurine.

L'univers doit occuper tout l'écran, en format vertical 9:16, car l'utilisation principale de ClickMe se fait sur
téléphone.

IMPORTANT : ne pas enfermer le personnage dans une ampoule ou un bocal permanent.

L'utilisateur doit avoir le sentiment d'entrer dans un véritable monde.

La composition doit permettre :

- Une figurine identifiable au premier plan.
- Un environnement riche en profondeur.
- Des éléments symboliques liés à ses passions.
- Des lieux, objets, architectures et paysages qui racontent quelque chose de lui.
- Une atmosphère et une palette de couleurs cohérentes.

Les éléments visuels ne doivent pas être simplement décoratifs : ils doivent avoir une justification liée à ce que
l'utilisateur a raconté.

Par exemple :

- Une passion pour le sport peut devenir un espace sportif intégré à l'univers.
- La créativité peut se matérialiser par un atelier, des inventions ou des constructions.
- L'amour et les relations peuvent être évoqués par des lieux de rencontre ou des symboles subtils.
- Le goût pour la technologie peut apparaître dans des objets ou des environnements futuristes.
- L'amour du calme peut se traduire par une lumière particulière, un paysage paisible ou un espace de contemplation.

Ne pas systématiquement utiliser ces mêmes symboles pour tous les utilisateurs.

Chaque univers doit avoir sa propre identité.

### 10. Personnalisation après génération

Après la découverte de son univers, l'utilisateur doit pouvoir demander des modifications en langage naturel.

Exemples :

- « Je voudrais davantage de nature. »
- « Je veux quelque chose de plus vivant. »
- « J'aimerais un endroit consacré à ma passion. »
- « Je voudrais une ambiance plus futuriste. »
- « Cet univers ne me ressemble pas suffisamment. »

L'IA doit pouvoir modifier l'univers sans perdre les éléments qui ont déjà été validés.

Il faut donc conserver une description structurée et persistante de l'univers, et pas seulement une image finale.

## 3. Architecture de l'identité personnelle

### 11. Créer deux références maîtresses

À la fin de l'inscription, le système doit enregistrer deux éléments fondamentaux.

**A. Le personnage maître.** Il contient :

- La photographie de référence, si conservée avec le consentement de l'utilisateur.
- Les caractéristiques visuelles validées.
- Le modèle ou les références de génération du personnage.
- Les vêtements et accessoires de référence.
- Les expressions et poses disponibles.

**B. L'univers maître.** Il contient :

- L'image principale de l'univers.
- La description textuelle de l'univers.
- Les éléments visuels qui le composent.
- Les couleurs et l'atmosphère.
- Les lieux et décors récurrents.
- Les symboles personnels validés.
- Les règles de cohérence visuelle.

Ces deux références doivent être réutilisées dans toutes les fonctionnalités de ClickMe.

## 4. Anticiper les trois grandes fonctionnalités de ClickMe

Il est indispensable de concevoir le personnage et son univers en pensant dès le départ à leur utilisation future.

**1. Réalise mon vœu.** La figurine peut exprimer un souhait et évoluer dans une scène adaptée à ce souhait, tout en
conservant son identité et son univers.

**2. Messages et appels.** Lorsque deux utilisateurs communiquent, leurs deux figurines peuvent se retrouver dans
l'univers de l'un des deux. Elles peuvent interagir, se déplacer, rire, discuter et réagir aux messages ou aux appels.
La figurine invitée conserve son identité visuelle même lorsqu'elle entre dans l'univers de quelqu'un d'autre.

**3. Déposer sa figurine dans un lieu.** La figurine peut être mise en scène dans un lieu réel, avec un rendu cohérent
avec son apparence et son identité. L'univers personnel reste la référence esthétique du personnage.

## 5. Exigences UX et techniques

- Parcours pensé prioritairement pour smartphone.
- Format vertical 9:16 pour les créations principales.
- Interface immersive, fluide et simple.
- Transitions soignées entre la création de la figurine et celle de l'univers.
- Temps d'attente de génération accompagné d'animations agréables.
- Possibilité de sauvegarder et reprendre la conversation.
- Possibilité de modifier ultérieurement son personnage et son univers.
- Gestion des coûts de génération IA et optimisation des temps de réponse.
- Conservation des versions validées pour éviter de régénérer inutilement.
- Séparation entre données privées de la conversation et informations publiques du profil.
- Aucun élément personnel ne doit être partagé automatiquement avec d'autres utilisateurs.

L'IA ne doit jamais inventer des souvenirs, des relations, des expériences ou des traits de personnalité qui n'ont pas
été confiés par l'utilisateur.

## 6. Résultat attendu

À la fin de son inscription, l'utilisateur doit avoir vécu deux moments forts :

**Premier moment :** il découvre sa figurine personnalisée, amusante, expressive et reconnaissable.

**Deuxième moment :** il découvre un monde qu'il n'a pas choisi dans un catalogue, mais qui a été imaginé à partir de ce
qu'il a raconté à l'IA.

Le résultat doit lui donner envie de :

- Montrer sa figurine.
- Partager son univers.
- Faire découvrir son monde à ses proches.
- Inviter d'autres personnes à venir le visiter.
- Utiliser régulièrement sa figurine dans les fonctionnalités de ClickMe.

La promesse de ClickMe : chacun possède son personnage et son propre univers, et peut faire entrer les autres dans son
monde.

L'enjeu n'est pas de générer deux belles images isolées. L'enjeu est de construire une identité numérique personnelle,
persistante, expressive et réutilisable dans toute l'application.

## Mon conseil avant de lancer le développement

Je recommande de faire réaliser ces deux étapes comme deux modules indépendants, mais reliés par une même identité
visuelle.

| Module | Résultat technique attendu |
|---|---|
| Création de figurine | Personnage maître réutilisable |
| Conversation IA | Données structurées sur les goûts et aspirations |
| Génération de l'univers | Univers maître réutilisable |
| Cohérence | Figurine et univers reconnaissables dans les générations suivantes |

Attention à un point technique majeur : ne demande pas à ton ingénieur de simplement enregistrer deux images PNG. Il
faut aussi conserver les caractéristiques structurées du personnage et de l'univers, les références de génération et
les éléments visuels validés. Sinon, lorsque deux figurines se retrouveront dans un univers, l'IA risque de recréer des
personnages différents à chaque interaction.
