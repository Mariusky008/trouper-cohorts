# Reprise — où on en est, et ce qu'il reste à faire (7 novembre 2026, après le lot B d'« Autour de moi », l'effacement de « Rencontres » et l'âge de 15 ans)

Pour la session qui reprend si celle-ci s'arrête. **Mettre ce fichier à jour à chaque étape terminée** (et le dire au
propriétaire). L'ancienne passation (`docs/passation.md`, 28 octobre) parle d'un autre chantier (la démo humaine).

## 1. Lire d'abord

1. `CLAUDE.md` (racine) : les règles communes.
2. `docs/figurines.md`, section 9.0 (de « duovicies » à « quintricies ») : tout ce qui a été fait sur « Ma figurine »,
   les mèmes, « Découvrir », le mème du jour, l'appli et la notification de 11 h 30, « Autour de moi », « Rencontres »
   effacé, la figurine réservée aux 15 ans et plus.
3. Ce fichier, en entier.

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
  4. une photo du lieu en haut de sa page (la maquette en montrait une) ;
  5. prévenir « on a répondu à ton mème », la réponse du commerçant depuis son comptoir, la page admin de modération ;
  6. les lieux publics nommés (les Arènes, les Halles…), avec des positions vérifiées.

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

- **La page personnalité « double numérique »** (la figurine répond aux questions des visiteurs) : le propriétaire a dit
  « on verra plus tard ». Avis donné : commencer par des questions toutes faites, puis une boîte à questions validées
  par l'utilisateur. La voix est réservée aux réponses qu'il valide (à confirmer avec lui).
- **Le duel `/duel`** : le format ne lui plaît pas, à retravailler.
- **Le lot 4** : les commerçants qui jouent le jeu, les tendances.
- La charte (`Charte graphique Clikme`, une maquette de design system) écrit « Clikme » ; l'appli `/collection` écrit
  « ClikMe ». À harmoniser un jour, sur sa décision.
