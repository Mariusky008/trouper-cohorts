# 🔎 L'audit UX du 28 novembre 2026, et ses corrections

Demandé par le propriétaire le 28 novembre 2026 : « agis comme un auditeur UX/UI senior, un Product Manager exigeant et un
testeur QA […] teste réellement et intégralement mon application comme le ferait un véritable utilisateur, en
commençant par la création de compte ». Puis, sur le rapport : « Oui, continue l'audit » (attaquer les priorités).

## 1. Comment il a été fait

- **En production** (www.clikme.fr), avec un compte de test à part, « Testeur » (Bordeaux), dans un navigateur sans
  écran séparé de la session du propriétaire : un iPhone 14 émulé, puis un ordinateur (1366 × 860).
- Le selfie : une illustration de visage fictive (jamais le visage d'une vraie personne).
- Ce qui n'a pas pu être vu : la lecture des vidéos (le lecteur YouTube et ses serveurs vidéo étaient bloqués dans la
  session), la carte d'Autour (ses tuiles aussi), le code reçu par e-mail (pas de boîte), tout ce qui demande un second
  compte (proches, messages, visites). Rien n'a été écrit dans les salons et les groupes publics.
- Le compte « Testeur » existe toujours ; son réglage « Ma figurine peut réapparaître dans les salons » est coupé.

## 2. Le rapport, en bref (note : 6/10)

**Ce qui porte la note** : la figurine sculptée en 41 s (bluffante) ; le grand moment dans un salon (au niveau de
TikTok) ; la vitesse une fois le serveur réveillé (environ 1 s pour le fil et pour entrer dans un salon) ; une console
sans erreur.

**Ce qui la retient** :

- la bienvenue de Pablito : 43 s au minimum avant le bouton, sur l'univers commun et l'étagère, plus sur le produit
  d'aujourd'hui (Découvrir, salons, réactions) ; aucune entrée « J'ai déjà une figurine » ;
- la fin de l'inscription : trois feuilles en cascade, dont l'humeur ouverte sous le choix de la pièce (un toucher sur
  « Joie » partait dans une pièce invisible) ; « tes proches t'écrivent un mot » sans un seul proche ; des boutons sous le
  bas de l'écran ;
- le fil : la scène du salon écrasée (« Ta place » coupée), la consigne posée dessus, « Quoi de neuf ? » vide qui mange le
  premier écran, dix salons vides sur douze ; un premier chargement de 7,4 s (serveur endormi) ;
- le salon : la barre « Réagis » sous le bas de l'écran d'un iPhone 14 ; l'image du moment en 7,8 s ;
- la confiance : ni « Se déconnecter » ni « Supprimer mon compte » ; « Lien copié » muet ; le champ e-mail coupé ; deux
  questions d'âge ; une page d'inscription dans un autre design ; une page 404 des commerçants ; pas d'écran hors ligne.

## 3. Les cinq priorités, et leurs lots

| Lot | Contenu | État |
| --- | --- | --- |
| 1 | La fin de l'inscription sans accroc (sections 4 et 5, PR #352) | ✅ fait |
| 2 | La bienvenue en deux bulles, sur le produit d'aujourd'hui ; le bouton visible dès la première seconde ; « J'ai déjà une figurine » | validé par le propriétaire (« ok ») : à faire après le lot 1 |
| 3 | Les cartes du fil : la place aux figurines, plus rien de coupé ni posé sur la scène ; « Quoi de neuf ? » masqué quand il est vide ; un squelette de chargement ; les salons avec du monde d'abord | |
| 4 | Le salon : la barre de réactions visible dès l'arrivée ; le chevauchement « Touche pour le son » / « Pause » sur ordinateur ; l'image du moment préparée pendant le grand moment | |
| 5 | La confiance : se déconnecter, supprimer son compte, « Lien copié ✓ », le champ e-mail, une seule question d'âge, l'inscription dans le design de l'appli, la confidentialité, la 404 de l'appli | |

Trois décisions restaient au propriétaire (pas des bugs) : repousser l'humeur du jour après la première visite ; « Mes
proches seulement » par défaut sans poser « Qui peut venir voir ta pièce ? » ; une vraie étape « Inviter un proche » à la
fin de l'inscription. Il les a confiées (« fais ce que tu penses qui est le mieux ») : elles sont tranchées et faites au
lot 1 (section 5).

## 4. Le lot 1 : la fin de l'inscription sans accroc (fait)

- **L'humeur attend que la maison soit installée** : tant que la maison n'est pas lue, que sa première pièce est à
  choisir, ou que « Qui peut venir voir ta pièce ? » est posée, la feuille « Comment tu te sens aujourd'hui ? » ne s'ouvre
  pas (`useMaisonQuiSInstalle`, `maison-catalogue.tsx` ; `ma-collection.tsx`). Si quelque chose passe devant pendant
  qu'elle est ouverte, elle se cache et revient après (`rituel.tsx`). Elle attend aussi 1,2 s que la page soit posée
  (`REPIT_MS`), et vérifie de nouveau chaque fois que la voie se libère ; elle ne revient ni après « Pas maintenant », ni
  une fois l'humeur dite. L'ordre est donc : la pièce, la porte, puis l'humeur — une feuille à la fois.
- **« Les figurines de tes proches t'écrivent un mot… »** : seulement avec au moins un proche (`attente`,
  `rituel-serveur.ts`). Sans proche : « Quand tu auras des proches sur ClikMe, leurs figurines te laisseront un mot ».
- **Le bouton grisé dit ce qui manque** : sous « Créer ma figurine », « Il manque : ton selfie, ton prénom, ta ville,
  « C'est bien moi », « J'ai 15 ans ou plus ». » (`nouvelle-figurine.tsx`).
- **« 🏠 Choisis ta pièce » se voit sans défiler** : après « C'est moi ! », il reste en bas de l'écran (collé), et la
  figurine est moins haute (58 % de l'écran au plus).
- **Les essais** :
  - `navigateur/choisis-ta-piece.mjs` (Zoé, l'interrupteur allumé, sa figurine prête, l'humeur pas encore dite sur ce
    téléphone) : le bouton visible sans défiler ; pendant « Choisis ta pièce », pas de feuille de l'humeur ; « Qui peut
    venir », seule ; puis l'humeur ; « Joie » arrive à l'humeur ; jamais « t'écrivent un mot » sans proche. Sur l'ancien
    code, il échoue là où était le bug (la feuille de l'humeur ouverte sous le choix de la pièce).
  - `navigateur/nouvelle-figurine.mjs` : « Il manque : … », puis plus rien quand tout est rempli.

## 5. Le lot 1, suite : les trois décisions de l'inscription (confiées par le propriétaire)

- **Pas d'humeur du jour le jour de l'inscription.** Ce téléphone retient le jour de sa première figurine validée
  (`CLE_INSCRIT_LE` = `clikme-inscrit-le`, posé à « C'est moi ! », `nouvelle-figurine.tsx` ; le premier jour gardé :
  refaire sa figurine ne le change pas). Ce jour-là, la feuille « Comment tu te sens aujourd'hui ? » ne s'ouvre pas
  d'elle-même (`rituel.tsx`) ; la carte « Ton humeur » de « Quoi de neuf ? » l'ouvre toujours. Elle viendra le
  lendemain, au bon moment : quand il y a une raison de revenir.
- **« Qui peut venir voir ta pièce ? » quitte l'inscription.** D'office, ses proches seulement. La question vient quand
  sa pièce reçoit sa première chose (de 0 à 1), précédée de « Ta pièce commence à se remplir. », et seulement s'il n'a
  jamais répondu (`porteChoisie` dans `MaMaisonVue`, `porteDeLaMaison`, `ma-maison-serveur.ts` ; `QuestionPorte
  apresAjout`, `maison-catalogue.tsx`). À l'inscription, la pièce est vide : on ne demande pas qui peut venir voir rien.
- **Une vraie dernière étape « Tes proches ».** Le chemin de la bienvenue l'annonçait (« Ton selfie › Ta figurine › Ta
  pièce › Tes proches »), elle n'était jamais venue. Juste après « Je m'installe ici » : « Étape 4 sur 4 · 💬 Dernière
  étape : tes proches », son lien de proche (celui du carnet), « 📲 Inviter sur WhatsApp », « 🔗 Copier mon lien » (qui
  dit « ✓ Lien copié »), « Plus tard » (qui devient « C'est bon » une fois le lien parti) — `DerniereEtapeProches`,
  `ajouter-chez-moi.tsx` ; `PHRASES_TES_PROCHES`, `ma-maison.ts`. Pendant cette étape, l'humeur attend aussi
  (`useMaisonQuiSInstalle`).
- **L'ordre, désormais** : la figurine, « 🏠 Choisis ta pièce », « Je m'installe ici », « Tes proches » — et c'est tout
  pour le premier jour.
- **Les essais** :
  - `navigateur/choisis-ta-piece.mjs` : Léa et Marc, « Tes proches » après le premier choix, sans « Qui peut venir » ;
    Zoé, « Tes proches » seule (l'humeur attend derrière) ; le jour de l'inscription, pas d'humeur après « Plus tard » ;
    un autre jour, l'humeur s'ouvre, sa maison installée, et « Joie » arrive bien à l'humeur.
  - `navigateur/ma-maison-catalogue.mjs` : « Étape 4 sur 4 », le lien WhatsApp (avec `proche=`), « ✓ Lien copié » (le
    lien bien dans le presse-papiers), « C'est bon » ; puis sa première chose (un livre) : « Ta pièce commence à se
    remplir. » « Qui peut venir voir ta pièce ? » ; la deuxième : plus de question.
  - `navigateur/nouvelle-figurine.mjs` : « C'est moi ! » retient le jour de l'inscription sur ce téléphone.
