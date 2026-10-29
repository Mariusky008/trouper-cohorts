# Passation — où on en est, et la suite (28 octobre 2026)

Pour la session qui reprend (un autre compte Claude). Ce fichier dit ce qui est fait, ce qui attend, et le plan du
prochain projet : **la démo « humaine » (le propriétaire + Mike) et son flyer**.

## 1. À lire avant de commencer

1. `CLAUDE.md` (racine) : les règles communes.
2. `outils/tour-du-fantome/LISEZ-MOI.md` et `outils/trois-fantomes/LISEZ-MOI.md` : les démos (tours), leur chaîne de
   scripts, leurs voix, la publication. **Obligatoire** avant de toucher une démo.
3. `docs/les-cages.md` : la famille de fantômes dans l'app (chantiers 1 à 6), les migrations, les essais.
4. `docs/flyer/LISEZ-MOI.md` : comment le flyer commerçant actuel est fabriqué (règles d'impression apprises).

## 2. La façon de travailler (celle de cette session)

- En français, réponses courtes, **en tutoyant le propriétaire** (demandé dans cette session ; les LISEZ-MOI des tours disent
  « vouvoyer » : c'était avant). Dire honnêtement ce qui est essayé et ce qui ne l'est pas.
- Une branche, des commits ; **rien sur `main` sans un « oui » explicite du propriétaire, à chaque lot**. Ici, on a
  poussé la branche en avance rapide sur `main` (`git push origin HEAD:main`) après le « oui » ; une PR marche aussi.
- Avant de pousser : `git fetch origin main` (la branche doit partir du dernier `main`), `npx tsc --noEmit -p .`,
  le lint de la CI (`.github/workflows/clikme-verifications.yml`, étapes « Lint »), les essais (plus bas) et un coup
  d'œil dans le navigateur. Après : suivre la CI (`gh api repos/Mariusky008/trouper-cohorts/commits/<sha>/check-runs`)
  et Vercel (`…/commits/<sha>/status`) jusqu'au vert.
- Règles produit : jamais de voix de synthèse (les voix de Mike sont des enregistrements ElevenLabs fournis par le
  propriétaire, la sienne aussi) ; jamais le mot « exemple » à l'écran (ni « ex. ») ; commerces des démos fictifs, ne
  jamais prêter des mots ou des prix inventés à un vrai commerçant ; pas d'alcool (loi Évin) ; tournures neutres
  (« qui tient la boulangerie », pas « boulanger/boulangère ») ; dans l'app, tout ce qui touche la famille seulement
  pour un commerce client (`est_client`).
- Shell : lancer `pkill` **seul dans sa commande** (`pkill -f "[n]ext dev --webpack -p 3821"`,
  `pkill -f "[f]aux-supabase.mjs"`) : dans une commande composée qui contient le motif, il tue le shell. Après le
  serveur de dev, supprimer `.next/dev` avant `tsc`.

### Les essais de l'app

```sh
node scripts/faux-supabase.mjs 54321 &        # pour un essai seul ; lancer-essais.sh lance le sien
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux \
  ECHANGES_SEUIL_VILLE=3 STRIPE_SECRET_KEY=sk_test_faux CLIKME_WHATSAPP="+33 6 39 98 00 00" \
  npx next dev --webpack -p 3821 &
PLAYWRIGHT_MODULE=/opt/node-tools/node_modules/playwright/index.js bash scripts/navigateur/lancer-essais.sh
```

13 essais, tous verts au 28 octobre (dont `famille-video.mjs`, 43 vérifications). Chaque essai veut un faux Supabase
neuf (il sème ses commerces) : `lancer-essais.sh` le relance entre chaque.

## 3. Ce qui est fait (tout est sur `main`, dernier commit `2a9a8cde`)

- **La famille de fantômes** (détails dans `docs/les-cages.md`) : sa page publique `clikme.fr/f/<lien>` (chantier 1) ;
  la famille partout, paliers bronze/argent/or (2) ; « Ma famille » au comptoir (3a) ; le bon plan par palier et
  « Je te gâte » (3b) ; son départ — lien en bio, carton QR, phrase de fin de vidéo (6).
- **Chantier 5 : la famille dans toutes les vidéos du comptoir** (film photo, interview, épisode) : le début
  « Rejoins ma famille » (3,4 s), la fin « la famille d'hier » (8,4 s). Le prénom et le petit mot n'y passent qu'avec
  l'accord de la personne (case jamais cochée d'avance sur la fiche de `/f`, révocable). `src/lib/direct/famille-video.ts`.
  **Pas essayé** : un montage complet joué de bout en bout (il faut photos, caméra, voix) — à regarder une fois sur
  un vrai téléphone.
- **Les boulangeries** : rangées « artisans », elles tombaient dans les séances (bien-être). Elles sont à table, avec
  leurs mots : « La fournée du jour ? », « Je te la mets de côté ? », « Publier la fournée du jour », « Qu'est-ce qui
  sort du four aujourd'hui ? » (`estBoulangerie`, `profilDuDouble` dans `double-metiers.ts`, `missionDe` dans
  `missions-commercant.ts`).
- Migrations collées par le propriétaire (dit le 28 octobre) : jusqu'à `20261104090000_clik_accord_video.sql`.

## 4. Ce qui attend

- **Chantier 4, WhatsApp « sonnette »** — *à faire plus tard, à la demande du propriétaire.* Le principe décidé : la
  page `/f` reste le centre ; WhatsApp sert seulement à prévenir (« 🔔 Bon plan chez … : ouvre ta page », avec le lien),
  d'abord aux fantômes d'or, plafonné (deux messages par semaine et par personne) ; à un message libre, une phrase
  automatique qui renvoie vers la page ; pas de robot qui converse. Le bouton WhatsApp de `/f` envoie déjà au numéro
  ClikMe « Bonjour Mike, c'est Camille, fantôme n°4 de … Je veux les bons plans ! (f…code) » (`messagePourMike`) : le
  code permet de relier le numéro à la personne. Il existe déjà une intégration Meta Cloud API pour Popey
  (`src/app/api/popey-human/whatsapp/webhook/route.ts`, `src/lib/popey-human/whatsapp-meta-config.ts`,
  variables `WHATSAPP_META_*`) : ne pas la casser (router par `metadata.phone_number_id`). Questions à poser au
  propriétaire avant de coder (les noms des variables, jamais leur valeur) : (1) le numéro ClikMe est-il dans la
  même app Meta que Popey, et son « Phone number ID » ; (2) l'adresse du webhook donnée à Meta ; (3) le modèle de
  message validé pour le bon plan (nom, langue, texte) — sans lui, on n'écrit en premier qu'à qui nous a écrit dans
  les 24 h ; (4) `CLIKME_WHATSAPP` posé sur Vercel.
  **Le bouton « 💬 Mes bons plans sur WhatsApp » de `/f/<lien>`** est en trop avec ce principe (remarque du
  propriétaire) : le transformer en petit lien « 🔔 Me prévenir des bons plans sur WhatsApp », après la surprise, et ne
  le montrer qu'une fois la sonnette en place. Fait dans « Le parcours ClikMe » (`outils/parcours/`), pas encore dans
  l'app. Dans le parcours, l'étape « Mike fait connaissance » (trois questions de Mike) est à refaire pour la sonnette.
- **L'interview des boulangeries** : ses répliques sont les voix enregistrées du restaurant (« Bonjour chef », « Alors
  chef, c'est quoi, le plat du jour ? », `SCRIPTS.table` dans `src/lib/direct/interview-fantome.ts`). Il faut cinq
  enregistrements (bonjour, deux questions sur la fournée, celle pour rire, au revoir) pour un script « boulangerie ».
- **« ex. » à l'écran** (la règle « jamais exemple ») : `public/commercants/index.html` (« Votre activité (ex.
  coiffeur) ») et les `EXEMPLES` de `src/app/autour-de-moi/assistante/episode-comptoir.tsx` (« Ex. : la tarte aux
  pommes »).
- En suspens dans le prototype (voir `outils/tour-du-fantome/LISEZ-MOI.md`, fin) : fondre le petit mot, le conseil et
  la fourchette verte ; les écussons comme pins des commerces.

## 5. Le prochain projet : la démo « humaine » et le flyer

Le propriétaire va démarcher des entrepreneurs : leur envoyer une démo et déposer un flyer. Le but : montrer le
potentiel de l'outil et **le résultat visé à la fin du mois**, avec le propriétaire en personnage : « le nouveau type de
community manager de 2027 », qui ne fait pas grossir une communauté pour rien, mais la fait vivre, grandir, et
surtout venir chez le commerçant. Base : la démo courte `tour-court2/` (`clikme.fr/tours/court`).

### 5.1 La vidéo dans le téléphone — FAIT (28 octobre)

« La vidéo annonce du commerçant n'est pas à 100 % dans le téléphone : plus grande que lui, on ne voit pas les scènes
en entier. » Cause : les photos du film sont presque carrées (560 × 619) et l'écran du téléphone très haut ; en
`object-fit:cover`, on n'en voyait qu'à peu près la moitié, et le zoom (×1,16) en rognait encore. Corrigé dans
`outils/tour-court2.html` et `outils/tour-entrepreneurs2.html` : chaque photo se voit en entier (`contain`) sur un fond
flouté d'elle-même, et le zoom la fait grandir jusqu'à sa taille sans jamais la couper (son fond bouge derrière).
Les deux pages refaites et vérifiées à l'image (`?rendu`, `__rendre(t)`), sans erreur.

**À REFAIRE (demande du propriétaire, après coup)** : dans la démo de 45 s, le film du téléphone ne prend plus
tout l'écran (photos entières sur fond flouté), et le propriétaire préfère **la vidéo de l'interview**, « qui a du
punch et prend tout le téléphone » : `outils/tour-du-fantome/tour/interview.mp4` (celle du tour du restaurant, Chez
Bergine). Remplacer les quatre photos de `#ecran .ph` (`outils/tour-court2.html`) par cette vidéo en plein écran
(`object-fit:cover`, muette, la voix de Mike reste le son), calée sur la ligne de temps : en mode `?rendu`
(`__rendre(t)`), poser `video.currentTime` à l'instant voulu et attendre `seeked` avant de dessiner, pour que
`rendre-video.mjs` l'exporte. Même chose à voir pour `tour-entrepreneurs2` (ses vidéos à elle). Vérifier les droits
de l'image avant tout autre usage que les tours.

### 5.2 Le propriétaire qui parle, façon photo d'identité

Une photo du propriétaire, statique, « collée en haut comme la photo d'un CV », avec seulement une bouche qui bouge
sur sa voix, tout au long de la présentation ; Mike l'accompagne.

- **Technique proposée** (dans le moteur GSAP de `tour-court2`, nouveau dossier `tour-humain/` tiré de lui) : la carte
  « CV » fixée en haut (photo, prénom, « Community manager · nouvelle génération »), la bouche incrustée sur la photo.
  Deux façons — **le propriétaire veut voir les deux avant de choisir** : faire d'abord un essai de quelques secondes
  de chacune, sur sa photo et une de ses répliques enregistrées :
  1. **Une vraie bouche filmée** (l'effet voulu) : quelqu'un dit le texte face caméra, on ne garde que sa bouche
     (masque, cadrage fixe) et on la cale sur la photo ; la voix du propriétaire reste le son. Il faut la vidéo de la bouche
     (1080p, face caméra, lumière égale, sans bouger), et l'accord écrit de la personne filmée (droit à l'image).
  2. **Une bouche dessinée** qui s'ouvre au rythme de sa voix (l'instant de chaque mot existe déjà :
     `outils/alignement.py`) : rien à filmer, plus « cartoon ».
- **Ce que le propriétaire fournit** : sa photo (de face, fond neutre), ses voix en mp3 (enregistrées, pas de synthèse), les nouvelles
  répliques de Mike (ElevenLabs), et la vidéo de la bouche (façon 1).
- **L'arc proposé** (un mois chez un commerce fictif). **Avant de coder : montrer au propriétaire toutes les
  répliques écrites (textes au mot près) et ce qu'on voit à chacune, et attendre son accord**, puis les enregistrements :

| # | Qui | Ce qui est dit (proposition) | À l'écran |
|---|---|---|---|
| 1 | Propriétaire | « Bonjour ! Moi, c'est [son prénom]. Je suis le community manager de 2027 : je ne fais pas grossir votre communauté pour rien. Je la fais vivre, grandir… et surtout venir chez vous. » | sa carte CV arrive en haut ; des « j'aime » qui ne servent à rien s'éteignent, des gens qui poussent une porte s'allument |
| 2 | Mike | (existe : `v2-1`) « Merci ! Je suis Mike, votre futur fantôme préféré. » | la cage, Mike jaillit — « Mon assistant », dit la carte |
| 3 | Propriétaire | « Le premier jour, je passe chez vous. Quelques photos, et Mike en fait une belle vidéo, publiée partout. » | « Jour 1 » ; puis `v2-2`, `v2-3` (la vidéo, les réseaux) |
| 4 | Mike | (existe : `v2-4`, `v2-5`, `v2-6`) les trois cages, « mon vrai travail commence », il écrit à chacun, Camille pousse la porte | « Semaine 1 » |
| 5 | Propriétaire | « Et pour leur donner une raison de venir aujourd'hui, vous préparez vos surprises du midi. » | « Semaine 2 » ; ses surprises (5.3) |
| 6 | Mike | « Une cage dorée, une surprise au hasard. Quand quelqu'un dit "je prends ça", je la retire. Plus rien ? La cage se referme. » | la 4ᵉ cage, « Surprise du chef », le stock qui baisse |
| 7 | Propriétaire + Mike | (adapter `v2-7-famille`, `v2-8-ecusson`) la famille grandit, les fidèles passent bronze, argent, or (5.4), prévenus en premier | « Semaine 3 » |
| 8 | Propriétaire | « À la fin du mois, on fait le compte ensemble : combien de clients sont venus grâce à moi. » | « Fin du mois » ; le ticket (objectif, chiffres fictifs — écrit « objectif », jamais « exemple ») |
| 9 | Propriétaire | « Et vous ne payez que si je vous amène des clients. Sinon, c'est gratuit. » | la promesse, en grand (5.5) |
| 10 | Propriétaire | « On commence ? » | son contact, « Revoir » |

### 5.3 La « surprise du chef » : une quatrième cage, dorée

Le commerçant prévoit ses surprises du jour, par exemple pour un restaurant le midi : 4 places de 11 h à 11 h 30 avec
l'équipe à −25 %, 4 restes à emporter après 14 h, 4 cafés offerts, 2 cafés gourmands. Après les trois cages, une
dernière cage dorée « Surprise du chef » en tire une au hasard ; « Je prends ça » en retire une du stock ; plus de
stock : la cage se referme.

- **Dans la démo** : une scène (5.2, n° 5 et 6), chiffres fictifs. À faire. Elle existe déjà dans « Le parcours ClikMe »
  (`outils/parcours/`, étape « La cage dorée ») : la reprendre.
- **Dans l'app : FAIT (28 octobre)**, voir `docs/les-cages.md` (« La surprise du chef ») et l'essai
  `famille-surprise.mjs`. **Le propriétaire doit coller `supabase/migrations/20261105090000_clik_surprises.sql`** dans
  Supabase ; sans elle, la cage dorée ne paraît pas (déjà collée avant « Non merci » ? la recoller : elle ajoute
  `laisse_le` et se rejoue sans rien casser). « Non merci » : la surprise reste pour les autres, pas d'autre tirage ce
  jour-là (sinon on refuserait jusqu'à la meilleure).
- **Prochaine étape proposée par le propriétaire : « Je l'offre à quelqu'un »** — un troisième bouton. Idée : la
  surprise est réservée pour l'ami (jusqu'au soir, puis elle revient au stock), un lien à partager (avec le code
  d'invitation `?de=`) ; l'ami ouvre une cage, entre dans la famille et la reçoit ; elle compte comme un ami amené
  pour le palier de qui l'offre. À faire valider (durée de la réservation, une par personne) avant de coder. Reste à faire : la cage dorée à la fin des vidéos du jour (chantier 5),
  et une démonstration au comptoir de démo (aujourd'hui, seulement chez un vrai commerçant). Ce qui a été fait : une table `clik_surprise` (commerce, jour, libellé, stock, pris) et sa
  migration ; le tirage et la prise côté serveur, en une seule écriture (deux personnes au même instant ne prennent
  pas la même dernière) ; la saisie au comptoir (à côté du bon plan) ; la cage sur `/f/<lien>` et à la fin des vidéos
  du jour. Jamais d'alcool (même filtre que le bon plan). Une surprise est gratuite à obtenir (aucun achat pour
  ouvrir la cage) : à garder ainsi, et faire relire la règle du jeu (jeu promotionnel) avant de l'ouvrir pour de vrai.
- **Décidé** : **une surprise par personne, tant qu'il en reste**. Le stock est le total prévu par le commerçant (s'il
  en a prévu 15 et que 15 sont prises, il n'y en a plus : la cage dorée se referme).
- **Recommandé (et retenu par défaut) : pas de priorité de palier** pour la cage dorée — le premier qui l'ouvre tire.
  Les surprises font venir des gens aujourd'hui, nouveaux compris ; l'or a déjà son avantage avec les bons plans
  (l'or tout de suite, l'argent 20 minutes après, le bronze 40 minutes après).

### 5.4 Les paliers : des fantômes bronze, argent, or (plus des écussons)

Demande : à la place des écussons, « des fantômes sur des pièces, ou des fantômes en bronze, argent et or ».
**Décidé : le fantôme debout sur sa pièce** (bronze, argent, or), parce que son look (ses vêtements) est son
identité dans la famille ; un fantôme teint en métal la perdrait.
**Fait dans l'app (28 octobre)** : la pièce, frappée de son numéro, sous ses pieds dans la vitrine (`.vf-palier`),
sur la page de la famille (`.fm-patch`, qui tombe et se pose quand on monte de palier) et à la fin des vidéos
(`dessinerUn`). **Reste** : les mots à l'écran disent encore « écusson » (« Prochain : l'écusson or 🥇 »…, et les
essais les vérifient) ; la démo courte (F1, F2 : « son écusson cousu ») ; le prototype `outils/trois-fantomes`.
Endroits d'origine, pour mémoire :
changer : la pastille de la vitrine (`src/app/autour-de-moi/vitrine-fantomes.tsx`, `.vf-palier`), la page de la famille
(`src/app/f/[slug]/famille.tsx`, `.fm-patch`), le comptoir (`famille-comptoir.tsx`, `carnet-comptoir.tsx`), la fin des
vidéos (`COULEUR_GRADE` et `dessinerUn` dans `src/lib/direct/famille-video.ts`), les démos (`tour-court2` F1/F2 :
« son écusson cousu »), le prototype `outils/trois-fantomes`.

### 5.5 « Vous ne payez que si je vous amène des clients »

À dire dans la démo et sur le flyer. À décider d'abord avec le propriétaire, pour que la promesse se vérifie :

- **Qu'est-ce qu'un client amené ? Décidé** : un fantôme venu pour de vrai, noté au comptoir (« Passage
  aujourd'hui » du carnet, ou bon scanné) — le parcours « venus » existe déjà dans « Ma famille ».
- **Combien ?** À fixer avec le propriétaire : un prix par client venu, ou un forfait seulement à partir de N clients
  dans le mois.
- **Où l'écrire** : la fin de la démo, le flyer, `/inscription`, les conditions. Les tours actuels disent
  « Commission : 0 € » : à mettre d'accord avec la nouvelle promesse.

### 5.6 Le flyer

**Un nouveau style** (le propriétaire : le concept a énormément évolué, l'ancien flyer de `docs/flyer/` ne convient
plus). On n'en garde que ses règles d'impression, apprises à l'essai (`docs/flyer/LISEZ-MOI.md` : aucune ombre portée,
captures entières, flèches qui ne se croisent pas). Ce qu'il dit : sa carte CV et Mike, le parcours d'un mois (la
vidéo, les cages, la famille, la surprise du chef, les fidèles bronze/argent/or), le résultat visé à la fin du mois,
« Vous ne payez que si je vous amène des clients », le QR de la démo, son contact. Jamais « exemple ». Proposer deux
pistes de maquette avant d'en finir une.

### 5.7 L'ordre proposé

1. ~~5.1 la vidéo dans le téléphone~~ : fait.
2. Écrire toutes les répliques de la démo (5.2), avec ce qu'on voit à chacune, et les **montrer au propriétaire
   avant de coder**. Ses réponses déjà données : paliers sur une pièce (5.4), client amené = venue notée au comptoir
   (5.5), une surprise par personne tant qu'il en reste (5.3). Restent : le prix (5.5), la priorité de l'or (5.3).
3. Un essai court des deux bouches (5.2), pour qu'il choisisse ; puis les enregistrements (le propriétaire, Mike, la bouche).
4. La démo `tour-humain/` (5.2 + 5.3 en scène + 5.4), sa vidéo MP4 (`rendre-video.mjs`) pour l'envoyer.
5. Le flyer (5.6).
6. ~~Dans l'app : les paliers sur une pièce (5.4), la surprise du chef (5.3)~~ : faits (restent les mots « écusson », la
   démo courte, le prototype, et la cage dorée à la fin des vidéos).
7. Plus tard : WhatsApp (4), l'interview des boulangeries (4).

## 5 bis. Le retour d'un premier testeur sur « Le parcours ClikMe » (29 octobre) — décidé

Le propriétaire l'a fait tester à un ami ; l'analyse et nos réponses convergent. Dans l'ordre :

1. **La surprise devient un vrai bon** (le trou signalé : une capture d'écran suffit, rien ne dit qu'elle a été
   servie). Un code court et un écran qui bouge (une capture ne passe pas), valable aujourd'hui seulement (le service
   du jour), et un toucher **« Servie »** au comptoir. Ce toucher compte comme **un client amené** : c'est la preuve
   de « vous ne payez que si je vous amène des clients » (5.5). Réutiliser ce qui existe pour les bons scannés au
   comptoir (`src/app/bon`, l'échange) avant d'inventer.
2. **Moins de pertes entre la vidéo et la page** : tout de suite, la vidéo du jour aussi en story Instagram avec un
   sticker lien (un seul toucher) — à dire dans « Son départ » (chantier 6). Puis tester, avec un premier commerçant,
   le commentaire qui envoie le lien en message privé (« Commente FANTÔME », façon ManyChat : le message ne converse
   pas, il donne le lien) ; il faut brancher le compte Instagram de chaque commerçant.
3. **Sous les trois cages** de `/f/<lien>` et du parcours : « Les trois te font entrer dans la famille » (les garder :
   c'est la signature, et elles disent qui viendra quand). Si l'hésitation reste, essayer une seule action puis
   « Tu viens quand ? ».
4. **Une idée par moment dans la vidéo** : la promesse au début (« Rejoins ma famille… »), l'action à la fin (le
   lien) — alléger ce qui se répète (`famille-video.ts`).
5. **« Je l'offre à un ami »** (5.3) plutôt qu'un bonus contre un partage en story : on ne vérifie pas un partage, et
   récompenser un partage touche aux règles de Meta sur les promotions.
6. **Une « carte à partager » (la fierté qui fait grandir la famille)** : une image 9:16 dessinée par la page (le
   moteur de `famille-video.ts`) — son fantôme sur sa pièce, son prénom, son numéro, « Je fais partie de la famille
   de Chez Bergine », son lien en grand. « Partager » ouvre le menu du téléphone (Instagram → Story ; sinon,
   télécharger). Un lien écrit sur une image ne se touche pas et Instagram ne laisse pas préremplir le sticker lien :
   au moment du partage, copier **son lien d'invitation** (`clikme.fr/f/<lien>?de=…`) et lui dire « colle-le dans un
   sticker lien » — chaque ami venu par sa story compte pour son palier (3 amis → or). La même carte sert pour la
   montée de palier et pour **le mot du jour** (qui existe déjà : il manque de **prévenir son auteur**, « Ton mot est
   le mot du jour chez Bergine ! », par Ma Maison ou une notification web, et sa carte « Mon mot a été choisi »).
   Précaution : ce sont des « petits mots » sur ClikMe, jamais des « avis », jamais vers Google (le commerçant peut
   leur offrir un cadeau : un avis récompensé doit le dire, et Google l'interdit).

## 6. Le premier message à donner à la nouvelle session

> Lis `docs/passation.md`, puis `CLAUDE.md`, `outils/tour-du-fantome/LISEZ-MOI.md`, `outils/trois-fantomes/LISEZ-MOI.md`
> et `docs/les-cages.md`. Reprends au point 5.7, étape 1. Réponds-moi en français, en me tutoyant, et ne pousse rien
> sur `main` sans mon « oui ».
