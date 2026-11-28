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

L'avis du propriétaire sur le rapport (section 6) : les quatre lots 2 à 5 sont tous de priorité « très élevée » ; le lot 5
ne passe pas après les autres (la déconnexion et la suppression du compte manquent bel et bien) ; le lot 1 est « validé
sous réserve » tant qu'il n'est pas vérifié en production, sur les principaux parcours et appareils.

| Lot | Contenu | État |
| --- | --- | --- |
| 1 | La fin de l'inscription sans accroc (sections 4 et 5, PR #352) | validé sous réserve : à vérifier en production, sur trois appareils (section 9) |
| 5 | La confiance : se déconnecter, supprimer son compte (vraiment : ses données et ses images), la confidentialité (section 10) ; puis (lot 5b) « Lien copié ✓ », le champ e-mail, une seule question d'âge, l'inscription dans le design de l'appli, la 404 de l'appli | 5a en cours (section 10) ; 5b ensuite |
| 3 | Le fil et les salons vides : un problème d'activité, pas d'affichage (section 7) ; puis la place aux figurines, plus rien de coupé ni posé sur la scène, « Quoi de neuf ? » masqué quand il est vide, un squelette de chargement | maquette à faire valider |
| 4 | Le salon : aucune interaction cachée — la barre de réactions visible dès l'arrivée ; « Touche pour le son » / « Pause » sur ordinateur ; l'image du moment préparée pendant le grand moment (section 8 : 12 s d'attente côté serveur) | |
| 2 | La bienvenue, conçue autour de la vraie promesse de ClikMe (section 7) : deux bulles, le bouton dès la première seconde, « J'ai déjà une figurine » | le texte du propriétaire (« Ici, tes vidéos préférées deviennent des moments à partager ! … »), une démonstration animée pendant la deuxième bulle, trois cartes ; maquette : https://claude.ai/artifact/R67u7nGnvyLxxAi42EuXmB ; la voix à enregistrer par lui |

Trois décisions restaient au propriétaire (pas des bugs) : repousser l'humeur du jour après la première visite ; « Mes
proches seulement » par défaut sans poser « Qui peut venir voir ta pièce ? » ; une vraie étape « Inviter un proche » à la
fin de l'inscription. Il les a confiées (« fais ce que tu penses qui est le mieux ») : elles sont tranchées et faites au
lot 1 (section 5).

## 4. Le lot 1 : la fin de l'inscription sans accroc (validé sous réserve)

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

## 6. L'avis du propriétaire sur le rapport (28 novembre 2026)

« Un audit solide, mais encore incomplet. » Ce qu'il demande en plus :

- **La promesse, avant l'interface** : un nouvel utilisateur comprend-il vite pourquoi ClikMe est différent, et ce qu'il
  peut y faire (les salons vidéo, les rencontres autour des passions, les groupes, les discussions attachées aux vidéos,
  les réactions et les échanges entre figurines) ? « Une application peut être techniquement parfaite et perdre ses
  utilisateurs si ceux-ci ne comprennent pas pourquoi ils devraient revenir. »
- **Les salons vides** : un problème central, pas une correction visuelle — éviter de donner l'impression que ClikMe est
  vide quand peu de monde est connecté (section 7).
- **La performance**, mesurée plusieurs fois et décomposée : serveur, images, réseau, lecteur vidéo (section 8).
- **Une note étayée par une grille** (section 7).
- **Une deuxième phase** : les parcours social, vidéo et confiance, et les cas d'erreur ; puis **un audit de la
  fidélisation**, en cinq questions (section 9). Y intégrer les vidéos du jour, les discussions et les groupes, sans
  tester ce qui n'est pas encore développé.
- **L'ordre** : terminer les corrections de fiabilité et d'ergonomie, puis l'audit de la découverte et de la fidélisation.

## 7. La promesse, les salons vides, et la grille de notation

**La promesse, telle que le premier audit l'a vue** : la bienvenue (43 s au moins) parle de l'univers commun, des
endroits secrets et de l'étagère — le produit d'avant. Rien, dans les trente premières secondes, ne dit « on regarde des
vidéos ensemble, nos figurines réagissent, on se retrouve autour de ses passions ». Le premier écran après l'inscription
est Ma maison, pas les salons. Verdict provisoire : **la promesse d'aujourd'hui ne se découvre pas en moins de 30 s**. Le
lot 2 la met au premier plan ; la vérification se fera avec la question 1 de la section 9.

**Les salons vides, ce qu'on sait déjà** :

- dans un salon, la salle est « toujours remplie » depuis le 27 novembre (#347) : ceux qui ont vu la vidéo avant moi
  s'assoient, avec leurs vraies réactions à leur seconde (sept jours, rien d'inventé) ;
- mais **sur sa carte du fil, le même salon se dit vide** (« Sois le premier », ou les traces des dernières 24 h, #276).
  Le fil annonce un désert, la salle est pleine : c'est le fil qui ment par omission ;
- **trois sortes de salons, à distinguer partout** : 🔴 **en direct** (du monde maintenant : on le rejoint en cours) ;
  📅 **programmé** (le rendez-vous d'un groupe à une heure, « Mes groupes » : « ce soir, 21 h ») ; 🛋️ **permanent** (le
  salon d'une passion, toujours ouvert, avec ceux qui y sont passés) ;
- **l'ordre** : en direct d'abord, puis les rendez-vous qui approchent, puis les salons permanents les plus vivants (le
  plus de réactions récentes) ; jamais les mots « vide » ni « personne » ; des chiffres vrais (« 12 réactions
  aujourd'hui »), les figurines de ceux qui y sont passés, ses proches d'abord ;
- la limite honnête : le design ne crée pas l'activité, et la règle « rien d'inventé » tient. Il montre toute l'activité
  qui existe vraiment (passée, à venir, celle de ses proches), au lieu de seulement « maintenant ».

Le lot 3 commence par une maquette de ces cartes, à faire valider.

**La grille de notation** (la note sur 10 de chaque critère, appuyée sur des faits observés ; la note globale est la
moyenne pondérée des critères testés, et dit quelle part du poids a été testée) :

| Critère | Poids | Premier audit | Ce qui fonde la note |
| --- | --- | --- | --- |
| 1. Comprendre la promesse en moins de 30 s | 15 | 3 | la bienvenue sur le produit d'avant ; 43 s avant le bouton |
| 2. L'inscription et la figurine | 10 | 6 | la figurine en 41 s, bluffante ; trois feuilles en cascade à la fin (lot 1) |
| 3. La première impression : un lieu vivant | 15 | 4 | dix salons « vides » sur douze ; la scène écrasée ; « Quoi de neuf ? » vide |
| 4. Le cœur : regarder et réagir ensemble | 15 | 7 | le grand moment au niveau de TikTok ; « Réagis » sous le bas de l'écran ; l'image du moment lente |
| 5. Le social : proches, messages, visites | 10 | non testé | il faut deux comptes (section 9) |
| 6. Une raison de revenir le lendemain | 10 | non testé | section 9, question 4 |
| 7. Retrouver personnes, vidéos, discussions | 5 | non testé | section 9, question 5 |
| 8. La vitesse | 5 | 6 | 1,4 s réveillé, 10,2 s endormi (section 8) |
| 9. La fiabilité : erreurs, hors ligne, cas limites | 5 | 6 | console propre ; pas d'écran hors ligne ; une 404 |
| 10. La confiance : compte, données, sécurité | 10 | 2 | ni déconnexion ni suppression du compte ; deux questions d'âge |

Appliquée au premier audit : **4,7 / 10, sur 75 % du poids** (les critères 5 à 7 n'ont pas pu être testés). Le « 6/10 »
du rapport était donc généreux. La même grille servira à chaque audit, pour suivre la note dans le temps.

## 8. La performance, mesurée et décomposée (28 novembre 2026, 12 h)

En production, iPhone 14 émulé, le compte « Testeur ». Le cache du navigateur est coupé, sauf pour « en revenant ».
Script : `e30-perf.mjs` (outils de l'audit, hors du dépôt). **Une réserve** : cette session sort sur Internet depuis les
États-Unis (le CDN qui répond est celui de Cleveland, `cle1`) ; un aller-retour y coûte 113 ms en médiane (5 mesures).
Depuis la France, chaque requête serait plus rapide d'environ 70 à 90 ms. Les fonctions tournent bien à Dublin (`dub1`),
à côté de la base (#336).

| Situation | Mesures | Médiane | D'où vient l'attente |
| --- | --- | --- | --- |
| Le fil, serveur endormi | 10,2 s (1 mesure, le premier tour) | — | **le serveur** : les 13 appels de la page démarrent à froid, 1 à 3,5 s d'attente chacun ; la page elle-même est servie en 24 ms |
| Le fil, serveur réveillé | 1,37 · 1,40 · 1,40 · 1,50 s | 1,4 s | **le serveur** : `fil-decouvrir` répond en 0,9 à 2,6 s (le plus lent, et le plus variable) ; les images sont déjà en mémoire (moins de 50 ms) |
| Le fil, en revenant | 0,65 · 0,75 · 0,80 s | 0,75 s | — |
| Entrer dans un salon | 3,8 · 3,4 · 4,9 · 3,1 s | 3,6 s | **le téléphone** : les données arrivent en moins de 0,8 s, les images en quelques ms ; le reste se passe dans la page (à suivre avec `?chrono=1`) |
| L'image du moment | 13,9 · 8,8 · 8,3 s | 8,8 s | **le serveur** : sa fabrication (`POST /api/direct/moment`) prend 11,9 s à froid, 6,9 s réveillé, étape après étape (la figurine, l'image 1080 × 1920, trois dépôts) ; puis **l'image** : un PNG de 2,2 Mo (1,1 à 1,5 s) |
| La pastille « Envoie ta réaction » | 3,3 s, à chaque fois | — | voulu : elle arrive à la fin du grand moment (#339) |
| Le lecteur YouTube | non mesuré | — | les vidéos (googlevideo.com) sont bloquées dans cette session |

**Ce qu'il faudrait faire, par ordre d'effet** :

1. **Le réveil** (10,2 s → environ 1,5 s) : garder les fonctions de l'accueil éveillées (un appel toutes les cinq minutes),
   et ne lancer au premier écran que ce qu'il montre (le fil d'abord ; l'activité, les groupes, la pièce, la télé du jour
   ensuite).
2. **L'image du moment** (8,8 s → moins de 2 s) : la fabriquer dès le « 😂 », pendant le grand moment (le lot 4), faire les
   dépôts en même temps, et l'envoyer en JPEG (environ dix fois plus léger que le PNG).
3. **L'entrée au salon** (3,6 s) : trouver ce qui attend dans la page.
4. **`fil-decouvrir`** (0,9 à 2,6 s réveillé) : voir ce qui le rend lent et variable.

Une seule mesure à froid : on ne peut pas endormir le serveur à la demande. Elle sera refaite au début de chaque audit.

## 9. La suite : la phase 2, puis l'audit de la fidélisation

**L'ordre** : fusionner le lot 1 → le vérifier en production → la phase 2 (des bugs plus graves que les finitions peuvent
en sortir) → les corrections (lot 5, lot 3, lot 4, lot 2, et ce que la phase 2 aura trouvé) → l'audit de la fidélisation.

**Le lot 1 en production, sur trois appareils** : deux nouveaux comptes de test, créés par la vraie inscription, sur un
iPhone SE (petit écran) et un Android (Pixel 7) ; plus le compte « Testeur » sur l'iPhone 14. Ces comptes servent ensuite
à la phase 2.

**Les règles de la phase 2** (des comptes de test, en production, au milieu de vrais utilisateurs) : « Ma figurine peut
réapparaître dans les salons » coupé sur chacun ; rien d'écrit dans les cercles publics (🌍 Tous, les groupes ouverts) —
les messages, les commentaires et les réponses se testent entre comptes de test (👯 Mes proches) ; dans les salons,
seulement entrer, réagir et sortir. Les comptes de test seront supprimés avec la suppression du compte, une fois le lot 5
fait : ce sera son premier essai.

**Les parcours de la phase 2** (le parcours idéal, puis ses cas d'erreur) :

- **Social** : deux comptes deviennent proches (le lien, WhatsApp, le carnet) ; un message envoyé, reçu, relu ; la visite
  de la maison de l'autre ; « Qui peut venir voir ta pièce ? » et « Qui peut entrer » (vérifier ce que voit un inconnu) ;
  rejoindre un salon à deux ; le quitter, et ce qui reste accessible.
- **Vidéo** : une vidéo regardée jusqu'au bout, dans la mesure du possible depuis cette session (googlevideo.com est
  bloqué : à autoriser, ou à faire sur un vrai téléphone) ; les réactions ; un commentaire publié entre proches ; les
  réponses, et leur persistance ; reprendre la discussion après avoir quitté le salon (Activité, la cloche 🛎️) ; le
  rattrapage d'une séance ratée.
- **Confiance** : la déconnexion, la suppression du compte, le blocage et le signalement (le signalement existe dans les
  discussions des vidéos) ; ce qu'on voit sans être connecté (les liens publics des moments, les maisons) ; sans réseau.
- **Les cas d'erreur** : le réseau coupé au milieu d'une action, un réseau lent (3G simulée), le micro ou l'appareil photo
  refusés, un selfie refusé, le double toucher, le retour arrière, la session expirée, les textes très longs ou vides.

**L'audit de la fidélisation, en cinq questions** (chacune avec sa méthode et sa mesure) :

1. **La valeur en moins de 30 s ?** Les 30 premières secondes filmées, image par image ; ce qui est dit et montré,
   comparé aux cinq piliers (salons vidéo, passions, groupes, discussions des vidéos, réactions des figurines). Un vrai
   test demande de vraies personnes : un protocole court, pour cinq personnes de l'entourage du propriétaire (« à quoi
   sert cette appli ? », « qu'est-ce que tu ferais ensuite ? »).
2. **Trouver un salon intéressant, et des personnes avec qui partager une vidéo ?** Le temps et le nombre de touchers,
   de l'arrivée jusqu'à un salon de sa passion, puis jusqu'à quelqu'un à qui envoyer une vidéo.
3. **Aucun salon actif ?** Le même parcours à une heure creuse (entre 4 h et 6 h), en production ; et en local, avec zéro
   activité.
4. **Une bonne raison de revenir le lendemain ?** Les comptes de test, le lendemain : ce qui les rappelle (les
   notifications, l'humeur et les mots des figurines, la télé du jour, le rendez-vous d'un groupe, une réponse dans une
   discussion), et ce qui a changé.
5. **Retrouver les personnes, les vidéos et les discussions de la veille ?** Le nombre de touchers pour chacune
   (« 📼 Revoir », Activité, les proches, les groupes).

**Ce qui entre dans cet audit, et ce qui n'y entre pas** : il porte sur ce qui existe dans l'appli. Les vidéos du jour
(la sélection des salons, « Ma télé du jour », « Ma vidéo du jour » des groupes), les discussions attachées aux vidéos et
« Mes groupes » y entrent. Les « familles ClikMe » aussi : le propriétaire, le 28 novembre 2026, « Les familles c'est
mes groupes ».

## 10. Le lot 5 : se déconnecter, supprimer son compte, la confidentialité

Le propriétaire, le 28 novembre 2026, sur les choix proposés : « Oui, ces choix me vont, commence le lot 5 ».

- **« Mon compte »**, dans la page Moi (`mon-compte.tsx`, `page-moi.tsx`) : « 🛡️ Confidentialité », « 🚪 Se
  déconnecter », « 🗑️ Supprimer mon compte ».
- **Se déconnecter** (`POST /api/direct/mon-compte { action: "deconnecter" }`) : ce téléphone oublie sa figurine (le
  cookie, et tout ce qu'il retenait de ClikMe, `clikme-…`), puis l'accueil.
  - Figurine sauvegardée (une adresse prouvée) : « Pour revenir, touche « J'ai déjà une figurine » : on t'enverra un
    code à h…@… ».
  - Pas sauvegardée : « Ta figurine n'est pas sauvegardée. Sans adresse e-mail, tu ne pourras plus la retrouver… » ;
    « 🔒 Sauvegarder d'abord » (dans la même feuille), ou « Me déconnecter quand même ».
- **Supprimer mon compte** (`POST /api/direct/mon-compte { action: "supprimer", confirme: true }`,
  `supprimer-compte-serveur.ts`) : ce qui part, « C'est définitif », la case « Je comprends que c'est définitif » (le
  bouton reste grisé sans elle), puis « Ton compte est supprimé. Merci d'être passé par ClikMe. » et l'accueil. Définitif
  et immédiat, en deux temps :
  1. **tout de suite** : il quitte les listes de ses proches (dans les deux sens), qui gardent sept jours « Léa a supprimé
     son compte : votre conversation n'existe plus. » en haut de leurs conversations ; leurs conversations (les messages
     des deux) ; son lien de proche ; son dossier (selfie, figurine, maison, humeur…) ; sa maison privée ; ses lignes dans
     la base, puis son compte (le reste part en cascade) ;
  2. **le balayage** des espaces partagés, juste après la réponse, puis chaque nuit à 3 h 20 UTC jusqu'au bout
     (`/api/cron/comptes-supprimes`) : tout fichier dont le nom le désigne (son identifiant, sa clé de profil, sa marque
     courte) — ses mots et écrits sous les vidéos, ses passages dans les salons (« toujours rempli » ne le rassoit plus),
     ses places dans les groupes, ses figurines posées « Autour »… — et ses moments partagés (la fiche lue). Les dossiers
     des autres habitants ne sont pas parcourus. Un témoin sans donnée personnelle (`comptes-supprimes/<id>.json`) garde
     où le balayage en est, et part à la fin.
  - L'ancien « Tout supprimer » du Direct (`DELETE /api/direct/donnees`) fait désormais la même suppression complète (il
    n'effaçait que la ligne du compte).
- **La confidentialité** (`/collection/confidentialite`) : la seule politique en ligne (`/legal/privacy`) était celle de
  Popey Academy (février 2026), sans un mot des selfies, des figurines ni des mineurs. La page ClikMe dit, sans jargon,
  ce qui est gardé, pourquoi, qui le voit (dont les services : Vercel, Supabase, OpenAI et Google Gemini, ElevenLabs,
  Resend, YouTube), combien de temps, les plus jeunes, les droits et comment tout effacer. **Texte légal : relu et validé
  par le propriétaire avant la fusion** (le responsable et l'adresse de contact viennent des mentions légales).
- **Les essais** :
  - `essai-mon-compte-route.mjs` : sans la case, rien ; « Se déconnecter » (le cookie part, le compte reste) ; la
    suppression (son dossier, son lien, leur conversation, ses lignes ; Hugo ne l'a plus, dans aucun sens, et voit
    l'avis ; ses fichiers et ceux de Zoé restent) ; le balayage (ses mots, écrits, passage au salon, place de groupe,
    figurine posée, moments — tout ce qui est à Zoé reste ; le témoin part).
  - `navigateur/mon-compte.mjs` : « Mon compte » dans Moi ; Léa (pas sauvegardée) prévenue, « Sauvegarder d'abord »,
    « Annuler » ; Hugo (sauvegardée) se déconnecte (cookie et `clikme-…` partis, l'accueil, son compte gardé) ; Zoé
    supprime son compte (le bouton grisé sans la case ; « Ton compte est supprimé » ; plus de compte ni de figurine ;
    l'accueil) ; la page « Confidentialité ».
- **Restent pour le lot 5b** (une PR à part) : « Lien copié ✓ » partout, le champ e-mail coupé, une seule question
  d'âge, l'inscription dans le design de l'appli, la page 404 de l'appli, un écran hors ligne.

## 11. Le lot 1, vérifié en production (28 novembre 2026, 12 h 45)

Deux vraies inscriptions, avec deux nouveaux comptes de test (« Testeuse » sur un iPhone SE de 320 × 568, « Testine »
sur un Pixel 7 de 412 × 839 ; « Ma figurine peut réapparaître dans les salons » coupé sur les deux). Script :
`e32-lot1.mjs` (outils de l'audit, hors du dépôt).

| Ce qui est vérifié | iPhone SE | Pixel 7 |
| --- | --- | --- |
| Plus de « Il manque » une fois tout rempli | ✅ | ✅ |
| La figurine sculptée | ✅ 39 s | ✅ 38 s |
| « 🏠 Choisis ta pièce » visible sans défiler | ❌ coupé (555 pt sur 568) → corrigé ici | ✅ |
| Le jour de l'inscription retenu | ✅ | ✅ |
| Pas de feuille de l'humeur sous « Choisis ta pièce » | ✅ | ✅ |
| « Je m'installe ici » visible sans défiler | ✅ | ✅ |
| « Tes proches » seule, ses trois boutons à l'écran, le lien WhatsApp, « ✓ Lien copié » | ✅ | ✅ |
| Pas d'humeur d'elle-même le jour de l'inscription | ✅ | ✅ |
| Rien ne déborde, aucune erreur | ✅ | ✅ |

**Le bouton coupé sur le petit écran** : le bouton « collé » ne collait jamais, parce que la page
(`overflow-x: hidden`) était devenue son propre conteneur de défilement. `overflow-x: clip` coupe sans défiler
(`nouvelle-figurine.tsx`) ; vérifié en production en l'injectant dans la page : le bouton reste entre 504 et 556 pt.
Le lot 1 sera « fait » quand ce correctif sera en ligne et revérifié sur l'iPhone SE.
