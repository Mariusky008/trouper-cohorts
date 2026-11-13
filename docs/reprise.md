# Reprise — où on en est, et ce qu'il reste à faire (12 novembre 2026 : lots 0 à 2 « Univers » faits, la figurine validée ; la conversation (lot 3) et la création de l'univers (lot 4a) sont à l'adresse d'essai du propriétaire)

Pour la session qui reprend si celle-ci s'arrête. **Mettre ce fichier à jour à chaque étape terminée** (et le dire au
propriétaire). L'ancienne passation (`docs/passation.md`, 28 octobre) parle d'un autre chantier (la démo humaine).

## 0. Le chantier qui s'ouvre : « Univers » (11 novembre 2026)

Le propriétaire a donné une nouvelle ambition à ClikMe : **chacun a sa figurine et son univers personnel, et les
autres peuvent y entrer**. Ses deux textes sont dans `docs/univers/vision.md`. Le plan est dans
`docs/univers/feuille-de-route.md` : **le lire en entier avant de toucher au code**.

- **Où on en est** : la feuille de route est écrite. Le propriétaire a dit « oui pour tout, on commence le lot R
  maintenant » : **le lot R1 (l'humeur du jour, et le mot des figurines sur cette humeur) est construit**, sur l'appli
  d'aujourd'hui (`docs/figurines.md`, 9.0 quinvicies ☀️), **puis le lot R2 (le mot de la fin)** (9.0 sexvicies 🌙).
  **Le lot 0 (les essais de style) a commencé** : le propriétaire a donné quatre selfies de volontaires d'accord et du
  crédit OpenAI. L'étape 1 est construite : la page `/admin/humain/univers-essais` (la figurine du nouveau style en
  trois variantes, sa constance, les avis ; voir la feuille de route, lot 0). Les selfies ne sont pas dans le dépôt :
  il les dépose lui-même sur la page. **L'étape 2 aussi** : les univers (trois fiches, trois directions, la variété,
  la retouche), la scène composée (une ou deux figurines posées dans le décor, le mouvement), la vedette générée, et
  une note pour la vraie 3D.
- **Ce qui est décidé** (le détail : section 2 de la feuille de route) :
  - plus de ressort ni de socle : la figurine est assise dans un fauteuil, dans le style de sa photo de référence
    (`docs/univers/references/`) ; les anciennes consignes restent dans le code, éteintes ;
  - l'ordre de l'inscription : la figurine, la conversation, l'univers, puis le premier message ;
  - la conversation est libre, **à l'écrit, et on peut dicter** : pas de voix de synthèse ;
  - la solution mixte (on compose les scènes à partir d'images de référence, on génère rarement), et un essai de vraie
    3D en parallèle ;
  - la première fonction : le proche qui entre dans mon univers ;
  - l'appli d'aujourd'hui est gardée et rhabillée.
- **Une précision du propriétaire, le même jour : le rituel du jour** (le lot R de la feuille de route) : l'humeur du
  jour choisie parmi ses visages, ce que les figurines de ses proches en disent (écrit par l'IA, signalé comme tel), et
  le mot de la fin que deux figurines se laissent après une journée de conversation. **Accepté** (« oui pour tout »),
  avec nos propositions : le mot de la fin s'écrit la nuit et se découvre le matin ; trois figurines au plus
  réagissent ; celui dont la figurine parle voit tout, efface, et peut la faire taire ; toujours « écrit par la
  figurine de … · IA ».
  - **R1, construit** : `app/collection/rituel.tsx`, `lib/direct/rituel.ts`, `rituel-serveur.ts`,
    `app/api/direct/rituel`, l'essai `scripts/navigateur/rituel.mjs`. Les autres essais navigateur passent la feuille
    du matin d'office (`lancer()` dans `scripts/navigateur/commun.mjs`).
  - **R2, construit** : le mot de la fin. Le matin (à la première ouverture, ou par l'envoi de 8 h 40,
    `/api/cron/rituel-matin` et `rituel-matin-ete`, dans `vercel.json`), pour chaque paire de proches qui se sont
    parlé hier : une réplique par figurine, tirée de leurs messages d'hier, et rien quand le sujet est sensible.
    « 🌙 Cette nuit, vos figurines se sont parlé » : fermé, puis leurs deux répliques, « Lui répondre », « Effacer ».
  - **À regarder avec le propriétaire** : les vrais mots écrits par le modèle (le ton, la longueur), sur ses propres
    proches ; l'heure de l'envoi du matin (8 h 40) ; et si l'envoi doit passer en plusieurs fois quand il y aura
    beaucoup d'abonnés (aujourd'hui : 50 secondes, puis il s'arrête).
- **Le premier verdict** (feuille de route, lot 0) : la figurine recopiait la photo (il veut la tête re-sculptée,
  en caricature de collection) ; les univers doivent ressembler à un film d'animation riche et magique ; la scène de
  deux figurines doit être mise en scène par le moteur, pas composée dans le téléphone. **La deuxième série est sur la
  page.** À chaque série qui change les boutons, augmenter `VERSION_PAGE_ESSAIS` (`lib/direct/univers-essais.ts`) :
  une page restée ouverte d'avant affiche alors « Recharger la page » au lieu d'envoyer des choix disparus (le 12
  novembre, « Diorama miniature » refusé sur l'iPhone du propriétaire).
- **Le verdict (12 novembre 2026) : le lot 0 est fermé** (le tableau : feuille de route, lot 0). La figurine :
  « Sculptée, détourée » (la tête re-sculptée, réglage fidèle) ; la constance : validée ; les univers : « Film,
  chaleureux » ; la scène générée par le moteur : validée ; la vraie 3D : reportée.
- **Le lot 1 (le socle) est construit** (12 novembre 2026 ; le propriétaire : « oui, lot 1 puis lot 2 », et le
  fauteuil « de départ, puis aux couleurs de son univers ») : `perso.ts`, `monde.ts`, `scene.ts` (les formats),
  `fiches-serveur.ts` (rangement `<habitant>/perso/` et `<habitant>/monde/`, versions, retour, validation ; la
  version 0 se lit dans `clik_ma_figurine`), `signature-serveur.ts` ; la fabrication d'aujourd'hui garde ses traits
  et la signature de ses images ; `GET /api/direct/perso`, `/api/admin/direct/fiches`. Détail : `docs/figurines.md`,
  9.0 duodetricies.
- **Le lot 2 (la nouvelle figurine) est construit à l'adresse d'essai** `/univers/figurine`, réservée au propriétaire
  (une session d'administrateur) : selfie, atelier, découverte dans son fauteuil, retouches avec ses mots, « C'est
  moi ! » (sa fiche, puis bouche ouverte et debout). Les consignes validées vivent dans `perso-consignes.ts` ;
  l'appel au moteur dans `moteur-images-serveur.ts`. Détail : `docs/figurines.md`, 9.0 undetricies.
- **Son verdict sur la figurine (12 novembre)** : « c'est bon, la figurine est ok ».
- **Le lot 3 (la conversation avec Pablito) est construit à l'adresse d'essai** `/univers/conversation` : la
  transition, la conversation écrite (et la dictée), l'esquisse, les trois colonnes, la proposition, les corrections,
  « C'est mon univers ! » (la fiche de son univers), les garde-fous (le sujet sensible non gardé, le message d'aide et
  les numéros). Ses trois décisions déléguées : feuille de route, lot 3. Détail : `docs/figurines.md`, 9.0 tricies.
- **Le lot 4a (la création de son univers) est construit à l'adresse d'essai** `/univers/monde` : le décor d'après sa
  fiche, les places, l'image vedette, la découverte (la brume, sa figurine chez elle), les clés, les retouches,
  revenir en arrière. Détail : `docs/figurines.md`, 9.0 untricies.
- **Le lot 4b est construit à l'adresse d'essai** : son fauteuil aux couleurs de son univers (pendant la création),
  et **« Mon univers », l'accueil, à `/univers`** (le menu de demain ; sinon l'étape où il en est : c'est l'adresse
  unique du parcours). Détail : `docs/figurines.md`, 9.0 duotricies 🪑.
- **Le lot 5a (le proche qui entre chez moi) est construit** : la conversation du talkie-walkie se joue dans mon
  univers quand il est créé (la règle « chez qui ? » tranchée : chacun chez soi). Détail : `docs/figurines.md`, 9.0
  tretricies 🚪. **5b et 5c aussi** : la vidéo WhatsApp se passe chez moi, le lien d'invitation ouvre mon univers et
  l'invité y répond (9.0 quattuortricies 🎬🔗). Le lot 5 est construit.
- **Sa figurine à l'échelle de la pièce** (relevée sur l'image vedette) et **ses visages du nouveau style** (faits sur
  sa figurine assise, à la demande) : `docs/figurines.md`, 9.0 duotricies 🪑 et 9.0 quinquatricies 🎭.
- **Le lot 6 (les visites et les souvenirs) est construit** : `docs/figurines.md`, 9.0 sexatricies 🚪.
- **Le lot 7, première partie** : les mèmes dans l'univers, « Découvrir » montre les univers à visiter (9.0
  septatricies 🎬🏡). **La saison** : son décor du mois et sa tenue du mois (« les deux », 9.0 quadragies 🍂).
  **La bascule « Univers pour tous »** (le feu vert du 12 novembre) : construite derrière un seul interrupteur
  (`UNIVERS_POUR_TOUS`, 9.0 unquadragies 🔀), **allumé le 13 novembre** — les portes, le pont vers l'appli, le menu de
  demain, les figurines refaites, Pablito au nouveau style (à adopter depuis `/admin/humain/univers-essais`). Le frein :
  `CLIKME_UNIVERS_POUR_TOUS=0` chez l'hébergeur. Les essais d'avant tournent freinés ; ceux de la bascule, allumés.
  **Remettre l'appli à zéro** (les comptes de l'appli étaient fictifs) : `/admin/humain/remise-a-zero` (9.0
  duoquadragies 🧹) — les commerçants restent intacts.
  **« Chez moi »** (le 13 novembre, ses retours sur « Mon univers » et « Proches ») : une seule page, mon univers en
  haut, mes conversations comme WhatsApp, le reste derrière « ＋ » ; menu à quatre (9.0 tresquadragies 🏡).
  **Les visites refaites** (le 13 novembre, « une vraie expérience de découverte ») : en visite, les figurines à
  l'échelle, « 🚪 Toc toc » et « 🎁 Offrir » tout de suite ; chez moi, le paquet et la porte à ouvrir, en arrivant
  (9.0 quaterquadragies 🎁🚪).
  **La nouvelle interface** (la maquette validée le 13 novembre : « Chez moi » au centre, une nouvelle façon de se parler) :
  lot 1 fait — le menu à trois, « ＋ Nouveau », « Moi » reprend « Créer » (9.0 quinquadragies 📐) ; lot 2 fait — Chez moi
  rangé par personne, les demandes des inconnus (9.0 sexquadragies 👋) ; lot 3 fait — la conversation range visites et
  cadeaux, 🎭 et 🎁 à côté de « Lui répondre » (9.0 septquadragies 💬) ; lot 4 fait — le mème envoyé à un proche, dans
  la conversation (9.0 octoquadragies 🎭). La nouvelle interface est complète ; la suite : ses retours sur son iPhone.
- **La suite** : son avis sur le parcours complet (figurine, conversation, univers, accueil) ; puis le feu vert pour
  tout le monde (les figurines
  d'aujourd'hui refaites, Pablito au nouveau style, les visages du nouveau style) ; puis le lot 5 (le proche qui entre). Les sessions de travail n'ont pas de clé de moteur d'image (l'accès à OpenAI y est bloqué) : les essais
  tournent dans l'appli en ligne, il les regarde sur son iPhone.
- **Un piège de vocabulaire** : dans le code d'aujourd'hui, « univers » désigne le métier ou la passion qui habille la
  figurine (`<habitant>/univers.json`, `universValide`). Le nouvel univers se range dans `<habitant>/monde/`.

## 0 ter. Le rituel du jour, la suite : R3 et R4 (12 novembre 2026)

Deux lots validés par le propriétaire (feuille de route « Univers », lot R, points 4 et 5) :

- **R3, ma figurine me répond** : son humeur du matin choisie, SA figurine lui dit une phrase (écrite d'avance,
  validée) et un geste utile la suit ; la veille, le 3114 au troisième jour difficile, « Ta semaine en visages » le
  dimanche. **Fusionné** (#141 ; `docs/figurines.md`, 9.0 octatricies ☀️).
- **R4, la conversation vivante** : les figurines vivantes (silences, « il prépare un message », réactions avec le
  corps), les panneaux, et l'aparté des deux figurines (IA, visible des deux, sans demande d'accord). **Construit, en
  PR** (`docs/figurines.md`, 9.0 novatricies 🎭) ; il touche `proches.tsx`, que la session « Univers » modifie aussi :
  une seule session à la fois.

## 0 bis. « Mon vœu » (11 novembre 2026)

« Réalise mon vœu » remplacera la question du jour : je dépose un vœu avec ma figurine, les autres l'encouragent avec
leur tête (la mission du jour : trois vœux), quelqu'un peut m'aider. Tout est dans `docs/figurines.md`, 9.0 septvicies ✨ « Mon vœu »
(les décisions du propriétaire, ce que fait le lot 1, la suite).

- **Où on en est** : le lot 1 est fusionné (#126), la migration appliquée par le propriétaire ; ses retouches du 12
  novembre (son vœu en grand, la mission vide, les vœux d'ailleurs, l'aide → proches) sont fusionnées (#129), le lot 2
  aussi (#130 : répondre avec sa tête, les retours, les notifications de 11 h 30 et 19 h). Le lot 3 est en PR
  (« Exaucé » et sa fête, le mème de la victoire, « Mes vœux » dans « Moi », le badge sur la carte, l'idée de Pablito,
  le retour d'un vœu reformulé, la question du jour retirée). Pas de nouvelle migration.
- **À faire par le propriétaire** : enregistrer une bulle du tuto pour « Mon vœu » s'il en veut une.
- **La suite** : les trois lots prévus sont faits ; ce qui viendra, ce sont les retours du propriétaire après ses essais.
- **Pas sans son accord** : ouvrir l'inscription à toutes les villes (il a dit « je lance partout » ; la distribution
  des vœux le permet déjà, l'inscription non).

## 1. Lire d'abord

1. `CLAUDE.md` (racine) : les règles communes.
2. `docs/figurines.md`, section 9.0 (de « duovicies » à « septvicies ✨ », « Mon vœu ») : tout ce qui a été fait sur « Ma figurine »,
   les mèmes, « Découvrir », le mème du jour, l'appli et la notification de 11 h 30, « Autour de moi », « Rencontres »
   effacé, la figurine réservée aux 15 ans et plus.
3. Ce fichier, en entier.
4. Pour le chantier « Univers » : `docs/univers/vision.md`, puis `docs/univers/feuille-de-route.md`.

## 2. La façon de travailler (celle de cette session)

- Répondre **en français, en vouvoyant le propriétaire** (il essaie sur iPhone et sur Mac). L'interface de l'appli
  **tutoie** l'utilisateur.
- **Une branche, une PR par lot**, vers `main` : branche `claude/artisan-website-outreach-ilipbf`.
  - Avant chaque commit : `rm -rf src/app/zz-* public/zz-* .next/dev/types`.
  - Commits en français, terminés par les deux lignes d'attribution que la session donne.
  - Pas d'identifiant de modèle dans les commits, les PR ou le code.
- **La CI** (`.github/workflows/clikme-verifications.yml`) a 4 vérifications : Human Suite, Types et lint, Essais SQL,
  Route et navigateur. Elle prend environ 15 min.
  - On l'attend avec un `sleep 1260` **en arrière-plan**, puis on lit `get_check_runs` de la PR.
  - On fusionne en `merge`, avec `expectedHeadSha` (le SHA complet, `git rev-parse HEAD`).
  - Puis on réaligne la branche :
    `git fetch -q origin main && git checkout -q -B claude/artisan-website-outreach-ilipbf origin/main && git push -q -f -u origin claude/artisan-website-outreach-ilipbf`.
- **Les essais en local** :
  - le faux Supabase : `node scripts/faux-supabase.mjs` ;
  - l'app : `npx next dev --webpack -p 3821`, avec les variables de la CI (`env:` du job « Route et navigateur ») ;
  - les clés VAPID d'essai se fabriquent à chaque fois :
    `node -e "const k=require('web-push').generateVAPIDKeys();console.log(k)"` ;
  - un essai : `node scripts/navigateur/<essai>.mjs` (faux Supabase neuf pour chaque essai) ;
  - tous les essais : `bash scripts/navigateur/lancer-essais.sh`.
- **Pièges connus** :
  - `pkill -f "next dev"` doit être **seul dans sa commande**. Dans une commande composée qui contient le motif, il tue
    le shell (sortie 144).
  - Le Chromium des essais répond toujours « denied » à `Notification.permission` : les essais font semblant (voir
    `appli-notif.mjs`).
  - Pablito ouvre une fenêtre la première fois sur chaque onglet : `fermerPablito(page, "#o-…")` avant de toucher.
  - Le site défile en douceur (`scroll-behavior: smooth`) et le menu du bas est fixe : centrer un bouton avant de le
    toucher (`toucher()` dans `appli-notif.mjs`).
  - Playwright n'est pas dans `node_modules` sur le poste : `PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.js`.
  - La carte d'« Autour » a besoin de WebGL : Chromium est lancé avec `--enable-unsafe-swiftshader` (voir
    `scripts/navigateur/autour.mjs`), et l'essai sert lui-même le style de la carte (le réseau ne sort pas).
  - Avant d'écrire un nouveau fichier, **vérifier que le nom est libre** : deux fichiers ont déjà été écrasés par
    erreur.
- **Règles produit** :
  - Jamais de voix de synthèse (une seule exception, celle de CLAUDE.md).
  - Jamais le mot « exemple » à l'écran.
  - Rien d'alcoolisé (loi Évin).
  - Ne jamais prêter des mots ou des prix inventés à un vrai commerçant.
  - Tournures neutres pour celui qui parle (pas d'accord de genre deviné d'un prénom).
  - Ne jamais créer de vraies fiches par l'API de production dans un essai.
  - Ne jamais demander de clé, de jeton ou de mot de passe dans la conversation.

## 3. Ce qui est fait (fusionné sur `main`)

| PR | Quoi |
|---|---|
| #87 | Les mèmes des clients dans « Découvrir », sur leur accord |
| #88 | « 🎲 Surprends-moi ! » (un mème écrit d'après sa carte de personnage) |
| #89 | Le premier mème pendant la fabrication, et la mesure du parcours |
| #90 | Le concours de regard (`/duel`) — **le propriétaire le juge raté : à retravailler plus tard** |
| #91 | L'expression amour 😍 |
| #92 | ⚡ Mes réactions (stickers et gags avec sa tête) |
| #93 | Lot 2 : le mème du jour au centre, 😂 ❤️ 🔥, les proches d'abord, la carte sobre des commerçants |
| #94 | Lot 3 : l'appli sur l'écran d'accueil (jeton d'installation iPhone) et la notification du mème du jour à 11 h 30 |
| #95 | Ce fichier ; l'essai de 11 h 30 qui passe à toute heure ; « Autour de moi », lot A (le serveur) |
| #96 | « Autour de moi », lots B et C : l'écran (la carte, le lieu, le swipe, le dépôt, le profil), ses essais, la doc |
| #97 | Ce fichier : #96 fusionnée, et la décision d'effacer « Rencontres » |
| #98 | « Rencontres » effacé (la figurine du mois en 10 jours sur ClikMe) ; la figurine réservée aux 15 ans et plus |
| #99 | « Autour » : répondre avec sa tête ; le profil (ajouter en proche, lui répondre ; « Mes proches » suit la liste de l'auteur) ; la photo du lieu |
| #100 | La modération des mèmes signalés (vus comme les gens les ont vus ; retirés de la carte aussi) |
| #101 | « Hugo t'a répondu ! » : la notification des réponses, et son interrupteur dans « Moi » |
| #102 | « Autour » : les lieux publics nommés, placés par l'admin sur la vraie carte (`/admin/humain/lieux-publics`) |
| #103 | « Créer » refait, « le studio et ses tiroirs » (l'avis d'un ami) : sa figurine toujours en vue, Visage / Animer / La refaire, deux onglets, son mème dans une feuille, le cadenas doré — `docs/figurines.md`, 9.0 decitricies |
| #104 | 🔐 La faille des routes admin fermée : seule une session vérifiée par Supabase compte ; deux routes admin sans garde gardées ; leurs redirections restent dans l'admin (`scripts/essai-admin-garde-route.mjs`) |
| #105 | Le retour du 8 novembre, lot A : « Créer » sans premiers pas ni mème du jour ; 🗑️ effacer un mème ; la bonne tête sur les vignettes ; de vraies fenêtres à la place de celles du navigateur — `docs/figurines.md`, 9.0 undecitricies |
| #105 | Le retour du 8 novembre, lot B : « Autour » — chercher « la gare » (la carte y va, on y dépose), le lieu refait (à la une, le mur, « Juste à côté », « Continuer »), le dépôt clair (le mème choisi en grand, « Ton mème apparaîtra ici ») — `docs/figurines.md`, 9.0 duodecitricies |
| #106 | Le retour du 8 novembre, lot C : « Découvrir » en swipe plein écran (une page par mème, le mème du jour d'abord, « Tu as tout vu ») — `docs/figurines.md`, 9.0 tredecitricies |
| #107 | Le retour du 8 novembre, lot D : « ✨ Trois façons de le dire » — sous sa phrase, six intentions facultatives (sans phrase, elles en proposent une) ; trois vignettes 😂 BD, 🎭 cinéma, 🌀 affiche, chacune avec SON visage de la figurine et son cadrage, choisies par un petit modèle de texte (les règles d'abord) ; un toucher : le mème part dans ce graphisme — `docs/figurines.md`, 9.0 quattuordecitricies |
| #108 | Les attitudes de la figurine (l'étape 2 des « Trois façons de le dire ») : 🤦 la tête dans les mains, 🤭 le rire en douce, 🙅 les bras croisés, 🙌 la victoire, 🤫 le chut, 🫶 le cœur — fabriquées à la demande comme ses visages ; une rangée « Son attitude » dans le tiroir « Visage » ; proposées par les trois façons de le dire — `docs/figurines.md`, 9.0 quindecitricies |
| #109 | Au comptoir, « En épisode » : 🎞️ « J’ai déjà mes vidéos » à côté de « Placer mon téléphone » — il dépose une à dix vidéos déjà tournées, les range dans l’ordre de sa fabrication ; le téléphone les regarde en accéléré (×4, ce qui bouge), garde les meilleurs moments, ne découpe que ceux que les films prendront, puis monte l’épisode comme après une session (le Reel aussi). Ses vidéos ne quittent pas son téléphone — `src/lib/direct/episode-videos.ts`, essai `scripts/navigateur/episode-videos.mjs`, règles vérifiées par `scripts/verifier-episode.mjs` (désormais dans la CI) |
| #110 | 🎙️ Le talkie-walkie des figurines, étapes 1 à 4 (le propriétaire et son ami : « laisser un message à quelqu'un, et la mascotte agit comme traducteur visuel ») : l'onglet « Proches » remplace « Moi » dans le menu (« Moi » passe sous son prénom, en haut) ; « 🎙️ Lui parler » (20 s, naturellement) ; « Ta figurine a compris ça » (ses phrases écrites, trois têtes proposées par réplique, il décide) ; chez l'autre, sa figurine le dit avec la tête de chaque réplique au bon moment ; la conversation en petite pièce de théâtre ; « Là maintenant » (il peut le couper dans « Moi ») ; son lien de proche ; la mesure chaque semaine — `docs/figurines.md`, 9.0 sedecitricies, essai `scripts/navigateur/talkie.mjs` |
| #111 | 📲 Le talkie-walkie, étape 5 : un message par WhatsApp, à quelqu'un qui n'a pas ClikMe — « Lui parler par WhatsApp » dans « Proches », son message devient un lien (`/t/<id>`, trois par jour, effacé au bout de 30 jours) ; chez l'autre, sa figurine lui parle sans rien installer ; pour répondre, un selfie et deux cases, sa figurine se fabrique pendant qu'il dit sa réponse ; ils deviennent proches, « Karim t'a répondu avec sa figurine ! », « Nouveau, grâce à toi » — `docs/figurines.md`, 9.0 septendecitricies, essai `scripts/navigateur/talkie-whatsapp.mjs` |
| #112 | Le retour du 9 novembre : le tiroir « Visage » passe par-dessus le menu du bas et s'arrête au bas de l'écran (« Son attitude » se touche enfin) ; à l'ordinateur, les têtes et attitudes vont à la ligne au lieu de défiler de côté ; le logo reste dans l'appli (« Créer ») au lieu de ramener à clikme.fr, et « Retour » revient à l'onglet d'avant (chaque onglet touché, et la conversation ouverte, prend une page d'historique) ; l'écran de fabrication de la figurine allégé (« En attendant ton premier mème » retiré) ; sa photo choisie, la page descend seule à l'étape suivante ; les fabrications ratées sont notées (`fabrication/erreurs.json`) et montrées dans `/admin/humain/figurines-clients#erreurs` — essais `attitudes.mjs`, `talkie.mjs`, `ma-figurine.mjs` |
| #113 | 🧭 Le tuto (le patron : « le logo devrait ouvrir un tuto des pages ; les Pablito par page peuvent disparaître et libérer de la place » ; « la première fois, juste une bienvenue ») : la bienvenue, une seule fois, trois bulles, la dernière éclaire le logo ; le logo ouvre la visite (six pages, « Vue », un point rose jusqu'à la première fois) ; Pablito montre chaque page sur la vraie page, l'écran assombri sauf ce dont il parle ; ses voix enregistrées (`tuto-*.mp3`) ; plus aucune fenêtre de Pablito dans les pages ; et le moteur d'image qui répond 429 : il attend et rejoue s'il y a trop de demandes, et dit « en pause de notre côté » s'il n'a plus de crédit — `docs/figurines.md`, 9.0 duodevicies, essai `scripts/navigateur/tuto.mjs` |
| #114 | 🎙️ La dernière voix du tuto : « Je te fais visiter ? Touche une page : je te la montre sur place. » (`tuto-visite-1`, en haut de la visite) — toutes les bulles du tuto ont maintenant la voix du patron |
| #115 | 🎨 Le moteur d'image qui refuse faute de crédit : « You have no credits remaining » à chaque figurine, alors que le compte du patron avait 8 € ; un refus de crédit fait désormais passer au modèle suivant (`moteurRefuse`, `lib/direct/moteur-image.ts`), gpt-image-2.6 entre dans la liste, et chaque fabrication ratée dit dans l'admin à quelle organisation et quel projet OpenAI elle a été facturée. LA CAUSE, trouvée grâce à ça : la clé posée sur Vercel venait d'un autre compte OpenAI (l'organisation `votre-legende`), à court de crédit ; une clé du bon compte a tout réparé — si « plus de crédit » revient, lire d'abord l'organisation entre crochets dans l'admin |
| #116 | 💶 Le prix d'une figurine (le patron : « 3 ou 4 créations, 50 centimes ») : sa joie n'est plus fabriquée d'office (2 images par figurine au lieu de 4), et seule l'image qui crée (sa figurine à partir de sa photo, sa figurine du mois) reste en qualité « high » ; sa bouche ouverte, ses visages, ses attitudes et ses réactions passent en « medium », environ quatre fois moins cher (`qualiteFigurine`, `qualiteSuite`, `FIGURINE_QUALITE_SUITE=high` pour revenir en arrière) — `docs/figurines.md`, 9.0 undevicies ; et 🛠️ l'atelier de Pablito (le patron : « une pop-up vraiment marrante, pour les faire patienter avec le sourire ») : un visage ou une attitude pas encore faits, touchés, ouvrent une fenêtre où Pablito fabrique sa tête — ses grimaces, ses outils qui tournent, ce qu'il fait phrase après phrase, une barre, on peut le chatouiller ; « une fois faite, elle est à toi pour toujours » ; puis « Tadaaa », sa nouvelle tête et des confettis (`app/collection/atelier.tsx`) — `docs/figurines.md`, 9.0 vicies |
| #117 | 🪜 « Créer » en trois étapes (l'ami du patron : trop de boutons, on ne voit pas à quoi la page sert ; puis ses trois derniers ajustements) : deux onglets « 💬 Faire un mème » / « ⚡ Répondre vite » ; ① ce qu'elle dit, avec un seul « 🎲 Pas d'idée ? » (une feuille : Surprends-moi, le mème du jour, les phrases prêtes) ; ② comment elle le dit (le ton, « En BD · En film · En affiche », et « Ou je choisis son visage moi-même », un lien à part qui ouvre la feuille des visages et attitudes) ; ③ sa voix et « Elle danse en parlant » ; le but sur le bouton, « 🎬 Créer mon mème », sans écoute obligée ; au téléphone, la figurine se fait vignette sous la barre en défilant ; « Répondre vite » montre tout de suite qu'un toucher a marché (un bandeau) ; « Refaire ma figurine » passe dans « Moi » ; une bulle du tuto à enregistrer (`tuto-creer-4b`) — `docs/figurines.md`, 9.0 unvicies |
| #118 | 🎬 Le message par WhatsApp, en vidéo (le patron : « ça ne donne pas envie de cliquer ; aucun moyen que ça s'ouvre directement dans WhatsApp ? ») : au téléphone, sa figurine qui dit son message devient une vidéo (sa voix, la tête de chaque réplique, ses mots), fabriquée sous ses yeux dès que le lien est prêt, et le partage du téléphone l'envoie — elle se joue dans WhatsApp, le lien dans sa légende sert à répondre ; sinon le lien, avec d'autres mots (« Karim ! 🎙️ Ma figurine a un message pour toi, écoute 👇 ») et une vraie carte d'aperçu (1200 × 630, JPEG : sa figurine, « Zoé t'a laissé un message », ▶) au lieu de la carte grise — `docs/figurines.md`, 9.0 duovicies |
| #119 | 🎬 La vidéo du message WhatsApp, retouchée après l'essai sur iPhone (« les textes sortent de leur espace et cachent le visage », « la vidéo est sous un voile blanc ») : sa propre mise en page — un bandeau droit « 🎙️ Message de Zoé · pour Karim » qui tient dans le cadre, sa figurine entière, l'emoji à côté du visage, ses mots sur son corps au-dessus de la légende de WhatsApp — et une première image nette (plus de flash ni de zoom : c'est la vignette) — `docs/figurines.md`, 9.0 duovicies ; et 🪜 « Créer » écran par écran (une étape à la fois, la barre 1 · 2 · 3, « Suivant », « ‹ Retour ») — 9.0 tervicies |
| #120 | 📄 « ClikMe, l'appli en bref » (`docs/clikme-l-appli.md`) : un document sans jargon, pour qui découvre l'appli (le patron, pour un ami) ; et « Ta figurine du mois » quitte le bas de « Créer » (« elle encombre ») : elle se suit dans « Moi » — `docs/figurines.md`, 9.0 tervicies |
| #121 | ✏️ « Créer » sur un seul écran (la maquette du patron) : sa figurine en direct et sa bulle, la rangée de ses visages, ce qu'elle dit — sa phrase écrite ou SA voix, jamais une voix de synthèse —, « Créer mon mème », « Réagir en un toucher » ; sur son mème prêt, « Sa version » (vidéo, BD, film, affiche) le refait à la même place, avec une animation ; avec sa voix, « Elle danse en parlant » — `docs/figurines.md`, 9.0 quattervicies |
| #122 | 🎙️ La dernière bulle du tuto de « Créer » a sa voix (« Touche « Créer mon mème »… », enregistrée par le patron : `tuto-creer-4c`) |
| #126 | ✨ « Mon vœu », lot 1 : déposer son vœu (huit tuiles, « Surprise » écrit par l'IA d'après sa carte), la mission du jour en tête de « Découvrir » (trois vœux à encourager avec ses têtes, « Je peux aider », passer, signaler), « Mission accomplie » et la série, sa page « Mon vœu » et « Faire évoluer » ; « As-tu 18 ans ou plus ? » (les 15-17 ans entre eux) ; l'appli s'ouvre sur « Découvrir » — `docs/figurines.md`, 9.0 septvicies ✨ « Mon vœu », essai `scripts/navigateur/voeu.mjs`, migration à appliquer à la main |
| #129 | ✨ « Mon vœu », après le premier essai du patron : son vœu en grand en haut de la page ; la mission vide dit vrai et propose « 📲 Inviter mes amis » ; les vœux « sur place » d'ailleurs, pour encourager seulement ; « ✋ Marius peut t'aider » → « Lui répondre avec ma figurine » (ils deviennent proches, leur conversation s'ouvre dans « Proches ») ou « Pas pour moi » ; « Je peux aider » après sa tête — `docs/figurines.md`, 9.0 septvicies ✨ |
| #130 | ✨ « Mon vœu », lot 2 : « Réponds avec ta tête » (Merci !, Mort de rire, Grave, Trop bien) et ses retours (« ↩️ Léa t'a répondu ») ; la notification de 11 h 30 parle de la mission ; celle de 19 h des réponses du jour (nouvelle tâche planifiée `voeu-soir`) ; leur lien ouvre les réponses en grand ; « Parler à Marius » ouvre le micro — `docs/figurines.md`, 9.0 septvicies ✨ |
| (cette PR) | ✨ « Mon vœu », lot 3 : « 🎉 Il est exaucé ! » (grâce à qui, la fête de la maquette 5, « Merci ! » qui ouvre la conversation, le mème de la victoire écrit, les compteurs) ; chez celui qui a aidé, « VŒU EXAUCÉ ! » et la notification de 19 h ; « 🌟 A exaucé un vœu » sur sa carte de personnage (qu'il peut éteindre) ; « Mes vœux » dans « Moi » à la place de la question du jour ; l'étape « ✨ Faire un vœu » ; l'idée de Pablito après 5 jours sans aide ; un vœu reformulé revient chez ceux qui l'avaient passé il y a plus de 30 jours — `docs/figurines.md`, 9.0 septvicies ✨ |

Après #94, l'essai `appli-notif.mjs` a échoué sur `main` : la CI tournait entre 11 h et midi (heure de Paris), et
l'appel « sans forcer » de l'essai avait vraiment fait l'envoi. Ce n'est pas un défaut de l'appli. L'essai le fait
maintenant en dernier, et vérifie qu'il ne part jamais deux fois le même jour (#95).

## 4. Le chantier en cours : « Autour de moi » (les mèmes laissés dans la ville)

### 4.1 Ce que le propriétaire a validé (7 novembre 2026, « ok c'est bon »)

La maquette est privée et appartient au propriétaire : https://claude.ai/artifact/U97aYSUZi9sBJrZdR5awvA (7 écrans
iPhone). Elle remplace l'onglet **« Rencontres »**, jugé trop compliqué et ennuyeux : c'est lui qui l'a demandé (« à la
place du duo ou des jeux de la page Rencontres »).

Le parcours : **carte → lieu → swipe des mèmes → J'aime ou réponse avec sa figurine → dépôt de son mème.**

1. **La carte « Autour de moi »** : un fond de carte sombre.
   - Les épingles sont des visages de figurines (fond rose), avec le nombre de mèmes sur chacune.
   - Plusieurs créations au même endroit se regroupent (« +9 »).
   - On y trouve la recherche d'un lieu, « Ma position » et « ＋ Déposer mon mème » (rose).
   - En bas, une feuille « Les derniers mèmes autour de toi » (vignettes).
   - **« Ailleurs »** (la rue, une soirée, chez un ami) : une **zone floue en pointillés** « quelque part par ici »,
     jamais une épingle ni une adresse.
   - Le point « Toi » n'est vu que par soi.
2. **La page d'un lieu** :
   - en haut, une photo, le nom, « 📍 quartier · distance » et « 12 mèmes déposés ici · ❤️ · conversations » ;
   - au centre, **un éventail de mèmes** et « ▶ Découvrir les 12 mèmes » ;
   - « La conversation du moment », puis « Déposer mon mème ici » (rose, collé en bas) ;
   - **pas d'étoiles, pas d'avis, pas d'horaires** : ce ne doit pas ressembler à Google Maps.
3. **Le swipe** (le cœur de l'expérience) : une grande carte de mème à la fois, et la suivante en dessous.
   - **Glisser à droite = J'aime** (tampon « J'AIME »), **à gauche = passer** (« SUIVANT »).
   - Les boutons : ✕ Passer, ❤ J'aime (rose, le plus gros), « Répondre avec ma figurine » (sa tête et une flèche
     jaune), Partager.
   - Discrètement : le prénom et l'avatar (vers le profil), « il y a 2 h », le petit mot, ❤️ n, 💬 n (vers la réponse),
     et « ↳ Réponse à Thomas » si c'en est une.
   - Une barre de progression « 3 / 12 » ; le menu ⋯ sert à signaler.
   - **Le swipe porte sur les mèmes, pas sur les lieux.**
4. **Répondre avec sa figurine** :
   - la conversation en vignettes (Thomas → Julie → « Ta réponse ») ;
   - un grand aperçu de son mème, le choix de sa tête (rire, louche, clin d'œil, raconte) ;
   - sa phrase, « 🎲 Surprends-moi », puis « Publier ma réponse ».
   - Les deux mèmes sont **liés** : on voit le mème d'origine et ses réponses.
5. **Déposer mon mème** (un seul écran) :
   - 1 · Où ? (le lieu tout près, un autre lieu, « ✨ Ailleurs ») ;
   - 2 · Quel mème ? (« ＋ Nouveau » ou un des siens) ;
   - 3 · Un petit mot, si on veut ;
   - 4 · Qui le voit ? (Tout le monde / Mes proches / Moi seul) ;
   - puis « Publier ». Écran suivant : « C'est publié ! », « Voir mon mème », « Partager hors de ClikMe ».
6. **Le profil d'un créateur** :
   - sa figurine en grand, sur le rose ;
   - « Dax · n mèmes · n lieux », « 👯 Ajouter en proche », « Lui répondre » ;
   - ses lieux et ses mèmes publics ; **jamais sa position**.

**Le style, impératif** (le propriétaire a fourni une image de référence) :
- Les mèmes sont **fond fuchsia** (`#FF2E9A`, en dégradé radial), avec **la vraie figurine à ressort en grand**.
- Le texte est en capitales épaisses (Poppins 900), blanc cerné de noir, **un mot en jaune `#FFE14D`**, légèrement
  incliné. C'est le style du vrai moteur de mème (`src/lib/direct/meme.ts`).
- L'interface est sombre et premium (`#0E0A10`), avec du rose fuchsia pour l'action et des boutons en pilule.
- Pas de mascottes, rien d'enfantin, pas de pastel, rien qui ressemble à une application de tourisme.

**Les règles** (une note de la maquette) :
- Jamais la position de quelqu'un en direct : la carte montre des lieux, pas des gens.
- « Ailleurs » n'apparaît que comme une zone floue du quartier.
- Le lieu d'un mème n'est pas une preuve de passage : on ne l'écrit nulle part comme tel.
- Pas de note, pas d'étoiles.
- Qui le voit : tout le monde, mes proches, moi seul.
- Signaler en deux touchers ; les mots interdits sont refusés ; rien d'alcoolisé.
- Trois mèmes par personne, par lieu et par jour, au plus.
- Le commerçant répond avec sa figurine ; il ne supprime rien.

### 4.2 Les décisions (confirmées par le propriétaire le 7 novembre 2026)

1. **Le fond de carte : MapLibre et OpenFreeMap, oui.** Le détail : MapLibre GL JS (npm `maplibre-gl`) avec les tuiles **OpenFreeMap**
   (`https://tiles.openfreemap.org/styles/liberty`) : gratuit, sans clé, sans compte, sans limite affichée.
   - L'attribution est obligatoire (MapLibre l'affiche).
   - Le service est fourni « tel quel » : on peut l'héberger soi-même plus tard.
   - Un style sombre n'est pas confirmé : il faudrait repeindre les couches aux couleurs ClikMe, en JS.
   - Les autres choix ont une clé et un coût : Google Maps (la clé Places existe déjà côté serveur), Mapbox.
2. **Le nom : « Autour » dans le menu du bas, « Autour de moi » en titre de l'écran, oui.** « Autour de moi » est déjà
   le nom de l'appli des fantômes (`/autour-de-moi`) : l'onglet a une autre adresse (`#autour`).
3. **Les mèmes réels sont des vidéos** (la figurine qui parle). La maquette montrait des images : dans l'appli, la
   carte du swipe joue la vidéo (muette, en boucle, comme « Découvrir »).

**Les lieux de la première version** : la session ne peut pas joindre OpenStreetMap, donc pas de lieux publics aux
coordonnées devinées. On a :
- les **commerces clients** qui ont leurs coordonnées en base ;
- les **zones « Ailleurs »**, avec le petit nom libre de celui qui dépose (« Les Arènes », « Soirée chez Max ») ; une
  adresse est refusée.

Les lieux publics nommés viendront plus tard, avec des positions vérifiées (par le propriétaire, ou une page admin).

### 4.3 Le plan de réalisation

**Où on en est** :
- **Lot A (le serveur) : fusionné** (#95). Complété avec le lot B : on peut répondre dans une zone « Ailleurs » qui a
  déjà des mèmes, par son identifiant (`scripts/essai-autour-route.mjs`, 29 vérifications).
- **Lots B et C (l'écran, ses essais, la doc) : fusionnés** (#96, le 7 novembre, CI verte). Le détail :
  `docs/figurines.md`, section 9.0 untricies.
  - `src/app/collection/autour.tsx` (la carte, le lieu, le swipe, le dépôt, « C'est publié ! », le profil) et
    `autour-carte.tsx` (MapLibre) ; branchés dans `ma-collection.tsx` (« Autour » dans le menu, `#autour`).
  - « Rencontres » n'est plus dans le menu mais reste à son adresse `#rencontre` (le lien d'un ami, sa figurine du
    mois). **Le propriétaire a décidé de l'EFFACER (7 novembre)** : voir la section 5 bis.
  - L'essai : `scripts/navigateur/autour.mjs` (35 vérifications), dans `lancer-essais.sh`. Les essais qui vérifiaient
    « Rencontres » dans le menu (`ma-figurine.mjs`, `famille-page.mjs`, `personnage-rencontre.mjs` — devenu
    `personnage.mjs` depuis, voir la section 5 bis) ont été ajustés.
- **La suite d'« Autour »** (le propriétaire, le 7 novembre : « dans l'ordre prévu ») :
  1. **fait** — la réponse « avec sa tête » : « ＋ Nouveau mème » ouvre le studio pour ce lieu, et le mème prêt revient
     au dépôt, déjà choisi (`docs/figurines.md`, section 9.0 quatertricies) ;
  2. **plus tard** (le propriétaire, le 7 novembre) — les regroupements sur la carte (« +9 »), quand il y aura beaucoup
     de lieux ;
  3. **fait** — « 👯 Ajouter en proche » et « ↩️ Lui répondre » depuis le profil ; « Mes proches » suit désormais la
     liste de l'AUTEUR (s'ajouter ne donne rien à voir) : `docs/figurines.md`, section 9.0 quintricies ;
  4. **fait** — la photo du lieu en haut de sa page (sa couverture ClikMe, sa devanture, sa salle ou Google) :
     `docs/figurines.md`, section 9.0 sextricies ;
  5. **la modération : faite** (9.0 septtricies) ; **« Hugo t'a répondu ! » : fait** (9.0 octotricies : la notification,
     son interrupteur à part dans « Moi », allumé d'office) ; **à faire** : la réponse du commerçant depuis son comptoir ;
  6. **fait** — les lieux publics nommés (9.0 novotricies) : **le propriétaire doit les placer lui-même** sur
     `/admin/humain/lieux-publics` (noms suggérés pour Dax, aucune position écrite d'avance).

Ce que le lot A fournit :
- `src/lib/direct/autour.ts` : les types (`Lieu`, `MemeAutour`, `ProfilAutour`), la zone floue (`zoneDe`, une maille
  d'environ 500 m), la distance, `emojiDuCommerce`, `nomLieuPropre` (pas d'adresse).
- `src/lib/direct/autour-serveur.ts` :
  - `commercesDe`, `deposer`, `retirer` ;
  - `carteDe` : les lieux avec ce qu'il peut voir, et les derniers mèmes ;
  - `memesDuLieu` : pour le swipe ;
  - `profilDe` : par une clé publique, `cleProfil`.
  - Rangement : `autour/<ville>/<lieu>/<mème>.<qui>.<habitant>.json` (qui le voit est dans le nom),
    `<h>/autour/<mème>.json`, `<h>/autour-jour/<jour>.json`, `profils/<clé>.json`.
- La route `src/app/api/direct/autour/route.ts` :
  - `GET ?ville=` (la carte), `GET ?lieu=&ville=`, `GET ?profil=` ;
  - `POST deposer` (`meme`, `lieu` ou `ici:{lat,lng}`, `qui`, `mot`, `nomLieu`, `reponseA`), `POST retirer`.
- Dans `ma-figurine-serveur.ts` : `cartesDeMemes` (le fil sans exiger « Découvrir ») et `memeDeposable`.
- J'aime = la réaction `coeur` de la route `ma-figurine` (`action: "reagir"`) ; signaler = `action: "signaler"`.

**Le plan d'origine, gardé pour mémoire :**

**Ce qui existe déjà et qu'on réutilise :**
- les mèmes vidéo des clients et leur fiche (`<h>/m-<id>.json`, `apercuMeme`, `memesPublics` dans
  `src/lib/direct/ma-figurine-serveur.ts`) ;
- les réactions (`src/lib/direct/reactions-memes-serveur.ts` : J'aime = la réaction `coeur`) ;
- les proches (`prochesDe`) ;
- le signalement (`signalerMessage`) et les mots interdits (`mots-interdits.ts`) ;
- le studio (`src/app/collection/ma-figurine.tsx`, et `versLeStudio` pour l'ouvrir sur un mode) ;
- les commerces et leurs coordonnées (`human_vitrine_sites.latitude/longitude`, remplies par le cron
  `direct-geocoder`, `est_client`, `city`).

**Lot A — le serveur** (nouveaux fichiers : vérifier que les noms sont libres) :
- `src/lib/direct/autour.ts` (partagé) :
  - les types ;
  - les **lieux publics** de chaque ville, une liste écrite à la main (Dax : les Arènes, les Halles, la Fontaine
    Chaude, les berges de l'Adour… **coordonnées à vérifier**) ;
  - la distance ;
  - la **zone floue** : coordonnées arrondies à environ 500 m.
- `src/lib/direct/autour-serveur.ts`, rangé dans le seau, **pas de table** :
  - les lieux d'une ville : les commerces clients qui ont des coordonnées, plus les lieux publics, avec leur nombre de
    mèmes ;
  - `autour/<ville>/<lieu>/<memeId>.json` = `{ id, h, le, qui: "tous"|"proches"|"moi", mot, reponseA? }`, et le sien
    `<h>/autour/<memeId>.json` ;
  - au plus 3 par personne, par lieu et par jour ;
  - les mèmes d'un lieu, filtrés par visibilité ; les réponses liées ;
  - le profil public (ses dépôts « tous » seulement).
- La route `src/app/api/direct/autour/route.ts` :
  - `GET ?ville`, `GET ?lieu=`, `GET ?profil=` ;
  - `POST deposer`, `POST retirer` ; le signalement réutilise l'existant.
- Le **profil** ne doit pas exposer l'identifiant interne de l'habitant : une clé publique dérivée (empreinte).

**Lot B — l'écran** (dans `/collection`) :
- l'onglet « Autour » à la place de « Rencontres », dans `MENU` de `src/app/collection/ma-collection.tsx` ; les anciens
  liens `#rencontre` y mènent ;
- la carte (MapLibre, chargée à la demande), avec une **liste de repli** si la carte ne se charge pas ;
- la page du lieu, le swipe, le dépôt, la réponse (le studio en mode « réponse à », comme le mode mème du jour) et le
  profil.
- Le swipe est déjà écrit dans la maquette (`Swipe.dc.html` : glisser au pointeur, seuil de 100 px, tampons,
  rotation). On peut en reprendre la logique.

**Lot C — les essais et la doc** :
- `scripts/navigateur/autour.mjs`, ajouté à `lancer-essais.sh` ;
- les fichiers nouveaux dans la liste du lint de la CI ;
- `docs/figurines.md`, une section 9.0 de plus ;
- puis PR, CI, fusion.

Plus tard : prévenir « on a répondu à ton mème », la réponse du commerçant depuis son comptoir, une page admin de
modération des dépôts.

## 5 bis. « Rencontres » effacé (décidé par le propriétaire le 7 novembre 2026) — fait, fusionné (#98)

Sa réponse à « l'effacer, ou lui garder une entrée ailleurs ? » : **effacer**. Le détail : `docs/figurines.md`,
section 9.0 duotricies. En bref :
- **Parti** : l'onglet, l'épisode du jour (personnages, commerçants, amis, membres de la ville), les impressions entre
  inconnus, les cartes souvenirs, la figurine relookée d'un épisode, « Fais-en un mème » d'un épisode, le petit mot du
  jour ; `rencontre.tsx`, `api/direct/rencontre/`, `rencontre.ts`, `rencontre-serveur.ts`, `scenarios.ts`, `reseau.ts` ;
  les voix de Pablito sur « Rencontres » et les bulles 5 à 7 de son accueil.
- **Ses anciennes adresses** (`#rencontre`, le lien d'un ami `?ami=`) ouvrent « Créer ».
- **Sa figurine du mois** se mérite en **10 jours sur ClikMe dans le mois** (sa présence, `joursDePresence`,
  `etapes-serveur.ts`), et s'affiche dans **« Moi »**, sous sa carte (`#mois` y mène). Choix par défaut, accepté par le
  propriétaire.
- **Ses premiers pas** : les quatre étapes des Rencontres partent ; celles déjà franchies comptent encore (`anciennes`).
- **« Moi »** garde sa carte, la question du jour et « Ce que ta figurine sait de toi » ; ce qu'il dit de lui passe par
  `ce-qu-il-a-dit-serveur.ts` (toujours rangé dans `<habitant>/rencontres.json`, pour ne rien perdre).
- **Les essais** : `scripts/navigateur/personnage.mjs` remplace `personnage-rencontre.mjs` ; `ma-figurine.mjs`,
  `famille-page.mjs`, `autour.mjs` ajustés ; la liste du lint de la CI mise à jour.
- Les données déjà rangées dans le seau (rencontres, cartes souvenirs) ne sont pas effacées.

## 5 ter. L'âge : la figurine réservée aux 15 ans et plus (décidé par le propriétaire le 7 novembre 2026) — fait, fusionné (#98)

Rien ne demandait l'âge, alors qu'« Autour » montre des visages rattachés à des lieux de la ville. Sa décision : **15 ans
pour tout** (création, « Autour », « Découvrir »), en sachant que des jeunes de 15 ans poseront leur visage sur la carte
de la ville. Le détail : `docs/figurines.md`, section 9.0 tertricies. En bref :
- un seul nombre, `AGE_MINIMUM` (`lib/direct/ma-figurine.ts`) ;
- à la création, la case « J'ai 15 ans ou plus. » (jamais cochée d'avance ; la route refuse sans elle), notée dans
  `<habitant>/majeur.json` ;
- ceux qui avaient déjà leur figurine : la question leur est posée une fois, au premier geste qui montre un de leurs
  mèmes dans la ville (déposer dans « Autour », montrer dans « Découvrir », poster sa réponse au mème du jour) — le
  serveur répond 403 `age: true`, l'écran demande (`app/collection/age.ts`), puis le geste repart.

Le propriétaire a demandé **l'âge seulement** (« pas le reste ») : la mention « fabriquée par IA » sur les mèmes et
l'effacement de sa photo d'origine après la fabrication ne sont pas faits ; ne pas les lancer sans lui.

## 5. Les autres sujets en attente

- **✅ La faille des routes admin est fermée (8 novembre, sur l'accord du propriétaire)** :
  `getServerUserIdWithProxyFallback` (`src/lib/supabase/server.ts`), qui sert à toutes les gardes admin, ne croit plus
  que deux sources vérifiées : l'en-tête que pose le middleware après `getUser()`, et `getUser()` lui-même. Les replis
  sur `getSession()` et sur le `sub` du cookie (sans signature vérifiée) sont partis : un cookie fabriqué portant
  l'identifiant d'un administrateur ouvrait `/api/admin/*` et la page `/admin`. Deux routes n'avaient **aucune** garde
  (`/api/admin/rejoindre/prospect`, `/api/admin/humain/site-internet/prospect` : n'importe qui pouvait supprimer une
  fiche de commerce, en faire un client, libérer un emplacement) ; elles sont gardées, et leur redirection reste dans
  l'admin (`cheminAdmin`, `lib/admin-guard.ts`). Le prix : pendant une panne de Supabase, l'admin dit « connexion
  requise ». L'essai : `scripts/essai-admin-garde-route.mjs`.
- **Le talkie-walkie, la suite** (`docs/figurines.md`, 9.0 sedecitricies et septendecitricies) : l'étape 5 (WhatsApp)
  est faite. **À décider avec le propriétaire** : effacer pour de bon, au bout de 30 jours, les comptes nés d'un lien
  et jamais sauvegardés (`<habitant>/provisoire.json` les marque ; rien ne les efface encore, et l'écran ne promet
  rien). Restent : le « mode express » (toucher une tête pendant qu'il parle), en option ; « Écrire » (une voix le dit)
  dans la conversation ; l'interrupteur des notifications de paroles dans « Moi ». Les appels : pas avant longtemps,
  peut-être jamais. À regarder en ligne : la transcription (`whisper-1`) sur de vraies voix, les têtes proposées, et
  l'aperçu du lien dans WhatsApp (l'image de sa figurine).
- **Le retour du 9 novembre, la suite** : au téléphone, « Ta figurine n'a pas pu être faite — Le moteur d'image a répondu
  429 », à chaque essai. 429, c'est le moteur (OpenAI) qui refuse : soit le compte n'a plus de crédit
  (`insufficient_quota` : seul le patron peut recharger, sur platform.openai.com), soit trop d'images dans la minute.
  La raison exacte est notée dans `/admin/humain/figurines-clients#erreurs` (depuis #112) ; depuis le tuto, le serveur
  attend et rejoue quand c'est « trop de demandes », et dit « en pause de notre côté » quand il n'y a plus de crédit.
  Le relevé disait « You have no credits remaining » (`insufficient_quota`) ; le patron a refait la clé (organisation
  « Personal », 3,47 $ de crédit) et l'a mise sur Vercel le 9 novembre vers 11 h 15 : à vérifier au prochain essai.
- **Le point 5 d'« Autour », fin** : la réponse du commerçant depuis son comptoir (pas commencée).
- **Les attitudes de la figurine : faites** (`docs/figurines.md`, 9.0 quindecitricies). À regarder sur de vraies
  figurines, une fois en ligne : que le moteur garde bien la personne quand ses bras bougent, et qu'elle reste entière
  dans l'image (la victoire, les poings levés). Si une attitude rate trop souvent, on retouche sa consigne
  (`figurine-expressions-serveur.ts`).
- **La page personnalité « double numérique »** (la figurine répond aux questions des visiteurs) : le propriétaire a dit
  « on verra plus tard ». Avis donné : commencer par des questions toutes faites, puis une boîte à questions validées
  par l'utilisateur. La voix est réservée aux réponses qu'il valide (à confirmer avec lui).
- **Le duel `/duel`** : le format ne lui plaît pas, à retravailler.
- **Le lot 4** : les commerçants qui jouent le jeu, les tendances.
- La charte (`Charte graphique Clikme`, une maquette de design system) écrit « Clikme » ; l'appli `/collection` écrit
  « ClikMe ». À harmoniser un jour, sur sa décision.
