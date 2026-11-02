# Dax, la ville — maquette v3 (2 novembre)

Sa remarque sur la v2 (`../maquette-direct/`) : « les vitrines en direct, je croyais qu'elles étaient incrustées sur
les devantures… il manque la possibilité de visiter la ville, rentrer dans les magasins et parler avec des gens,
laisser un message à quelqu'un ou à un commerçant, voir les promos, inviter un ami à regarder quelque chose et lui
demander ce qu'il en pense… beaucoup plus immersif » ; « et une petite musique dans les rues ».
https://claude.ai/artifact/NoWMNw9NtR9cTG6VrzU21Q (privée ; depuis une autre conversation : `url`).

- **On marche** : la place et la rue mises bout à bout, qu'on fait défiler du doigt ; ta figurine se dandine.
- **Les vidéos du jour dans les vitrines** : posées en perspective sur les quatre coins de chaque vitrine (`LIEUX`,
  en % du décor ; `matrice`, une homographie en `matrix3d`), avec l'enseigne du commerce par-dessus celle du décor.
- **« Celui qui a essayé apparaît dans la vitrine »** : « Léa a essayé le magret · 😋 12 avis · Et toi ? ».
- **La vitrine en grand** (« Montrer à un ami », « Entrer »), puis **la boutique** : son intérieur (une vraie photo des
  démos), l'ardoise du jour (dont la ligne réservée à la famille), le commerçant qui parle avec sa voix, les gens
  présents et ce qu'ils ont essayé, le mur des mots ; **un mot au commerçant**, **inviter un ami**, **ton avis**, et
  **parler** avec quelqu'un.
- **Ta boîte** : ce qui t'attend (Léa te demande ton avis ; Jean-Marie t'a répondu ; Hugo vient avec toi) — la raison
  de revenir. Dans la maquette, les réponses sont simulées.
- **La musique de la rue**, composée et jouée par le navigateur (do – la mineur – fa – sol, 96 battements, guitare et
  piano électrique, un shaker), et ses bruits (la fontaine, le murmure de la place, des oiseaux) ; plus bas dans les
  boutiques et sous les voix ; 🎵 pour couper.

Tout est simulé (gens, réponses, promos), sauf les figurines, les voix et les vidéos des démos. Les décors ne montrent
pas nos commerces (une boulangerie, une pâtisserie) : de vraies devantures de restaurant, d'atelier et de librairie
rendraient la rue plus juste.

## v4 (2 novembre, le soir) — sa liste : « les figurines ne se déplacent pas, ne devraient pas sauter… »

- **Plus de saut** : les présents **se promènent** (chacun vers son prochain point, à son rythme, en se balançant), ta
  figurine **ne bouge que si tu touches le sol** ; **les absents restent là où on les croise d'habitude,
  translucides** (« pas là »), et on peut leur **laisser un mot**.
- **Un lieu à la fois**, plein écran (plus de raccord visible entre deux photos) : la flèche au sol mène à l'autre.
- **Les annonces** : de loin, une pastille (« ▶ Garbure & magret ») ; tu t'approches (ou tu la touches, ta figurine y
  va) : **l'écran fixé dans la vitrine s'allume** (un écran plus petit que la vitrine, cadre noir, reflet), et
  « Entrer chez … » paraît.
- **La boutique** : l'écran au mur (sa vidéo du jour), l'ardoise, le commerçant, **qui est là** (ils bougent) et **qui
  est passé** (translucide, son mot) ; **la question du jour** (le commerçant demande, on vote, il lit), réserver, ton
  avis, un mot, inviter un ami, le mur des mots.
- **La foule** : « 238 à Dax maintenant · tu vois tes amis et ta famille » ; dans la boutique, « 3 que tu connais · +6
  autres ». Jamais les 800 : une douzaine au plus par lieu (amis, familles, ceux qui t'ont parlé, quelques inconnus).
- **Spectateur → fantôme → figurine** : « Entrer en spectateur » (personne ne te voit, tu regardes), « Libérer mon
  fantôme » (tu te promènes), et à 10 figurines, ta figurine.

## v5 (2 novembre, la nuit) — « quand je me déplace, il faut que la perspective fonctionne… la ville bouge avec nous »

- **Trois rues photographiées à Dax** (ses photos) : `i/dax-place.jpg` (la place de la fontaine), `i/dax-hotel.jpg`
  (la rue de l'hôtel), `i/dax-pietonne.jpg` (la rue piétonne). Noms provisoires : il nous dira les vrais.
  Les enseignes réelles des trois façades qui accueillent nos commerces imaginaires sont **effacées** de la photo
  (`outils/effacer.py`, les zones dans `outils/zones/`) et **repeintes en perspective** (`enseigne` dans `LIEUX`, un
  SVG posé sur quatre coins) : Chez Bergine, La Page d'Alice, L'Atelier de Nina. Les autres commerces restent du décor,
  sans écran ni annonce (jamais d'offre inventée pour un vrai commerce).
- **La caméra avance avec toi** : la marche se fait au sol (`versSol` / `versImage`, la perspective du pavé), la rue
  grossit quand tu t'approches d'une vitrine (zoom = taille au départ / taille ici, jusqu'à 2,2), ta figurine garde sa
  taille ; devant une boutique, la caméra cadre ta figurine et la vitrine. Les étiquettes (noms, bulles, pastilles,
  sorties) gardent leur taille (`--inv`). « Entrer » : la caméra fonce dans la vitrine, puis l'intérieur s'ouvre.
- **Les écrans** sont posés dans une vraie vitre de chaque façade (`ecran`, quatre coins), le montant de la fenêtre
  passe devant (`meneau`) ; dans les boutiques, **la télé est accrochée à un vrai mur** de la photo (`int.tele`) : le
  cadre noir de Chez Bergine, la bibliothèque de la librairie (`i/int-librairie.jpg`, la salle du tour de la librairie),
  le mur de pierre de l'atelier.
- **Repères au bord de l'écran** (« ◀ Chez Bergine ») quand une boutique est hors champ ; le spectateur **glisse** pour
  regarder.
- **La mini-carte** en bas à droite (où tu es, qui tu connais dans chaque rue), **la grande carte** (toucher une rue ou
  une boutique pour y aller) et **la recherche** (un commerce, un métier, une rue). Le plan est dessiné pour la maquette :
  le vrai viendrait d'OpenStreetMap (pas joignable depuis la machine de travail).
- **Le commerçant t'accueille par ton prénom** : « 👋 Bienvenue Camille ! », puis sa vraie voix (les enregistrements
  commencent par « Camille ! »). Jamais de voix de synthèse.
- **Téléphone et ordinateur** : la scène couvre l'écran quelle que soit sa forme (les photos sont en paysage : sur
  téléphone, la rue défile ; sur ordinateur, elle tient presque entière).

Limite honnête : les photos font 1672 × 941 ; au zoom ×2 sur téléphone, elles s'adoucissent.

### v5.1 — « aucune figurine, les télés n'affichent rien, c'est trop près, l'intérieur est immense »

- La cause des figurines et des vidéos absentes : une publication avait créé un second lien sans les dossiers `f/`,
  `s/`, `v/` (https://claude.ai/artifact/HhswCHMkevwbiF5G1TKZFJ). Il est complété ; le lien de référence reste
  https://claude.ai/artifact/NoWMNw9NtR9cTG6VrzU21Q. Vérifié dans la vraie visionneuse : figurines chargées, vidéo de
  la vitrine et télé de la boutique qui tournent.
- **Caméra plus douce** : elle avance avec toi mais au plus ×1,45 (la moitié du rapetissement de ta figurine), et devant
  une boutique elle cadre ta figurine, la vitrine et la rue autour.
- **L'intérieur à taille raisonnable** : la pièce occupe le haut de l'écran (60 % sur téléphone, 74 % sur ordinateur),
  jamais plus de 1,5 fois la photo ; le reste en fond flou. « ▶ L'annonce du jour » sous la télé.
- **Plus de vie** : des passants fantômes (ceux qui n'ont pas encore leur figurine) au fond de chaque rue ; **le
  commerçant sort sur le pas de sa porte** quand tu arrives et t'appelle par ton prénom (sa vraie voix, la première fois).

## v6 (3 novembre) — « le son grésille… on est perdu dehors… l'intérieur n'a aucune logique ni atmosphère »

- **Le son** : la musique est refaite (piano électrique doux, basse ronde, filtrée à 2 400 Hz), sans le souffle de la
  fontaine ni le « shaker » (du bruit blanc dans les aigus : c'était le grésillement), le murmure de la ville bouclé
  sans couture, et un limiteur en sortie. Vérifié hors ligne (12 s rendues) : aucun échantillon saturé, aucun clic.
- **Dehors** : la barre « Dans cette rue » (les boutiques de la rue et les rues d'à côté : on touche, on y va), le zoom
  à la molette ou en pinçant, glisser pour regarder autour (la caméra revient quand on marche), une aide au départ.
- **Dedans, en deux temps** :
  1. **L'accueil** : le commerçant derrière son comptoir (sa plaque, sa clochette), « 👋 Bienvenue Camille ! » puis
     sa vraie voix la première fois ; « Léa et Hugo sont déjà à table » ; « M'installer à une table » (« au coin
     lecture » chez Alice, « à l'établi » chez Nina), l'annonce du jour, ressortir.
  2. **Ta table** : chaque fonction est un objet posé dessus — la tablette (la vidéo du jour), la carte du jour (et sa
     ligne réservée à la famille), la question du jour, la cloche (le commerçant vient à ta table et te parle), le carnet
     (un mot pour lui), l'assiette vide (inviter un ami : sa figurine vient s'asseoir), le mur des mots au mur. Les
     amis sont à la table d'à côté, avec ce qu'ils ont essayé (la voix de Léa).
  Le fond est la photo de la salle, floutée comme une photo prise avec un grand objectif : elle donne l'ambiance
  sans montrer sa faible définition. La table et le comptoir sont dessinés (bois en dégradés et grain).
- Les photos HD que refait son designer remplaceront les décors des rues ; pour les intérieurs, il faudrait au même
  style « l'accueil » et « ta table » de chaque commerce (consigne dans la conversation du 3 novembre).

## v7 (3 novembre) — « après l'accueil, des canapés ou des fauteuils en fonction du monde assis, et là tout commence »

- **Corrigé** : « L'annonce du jour » s'ouvrait derrière la boutique (même plan) ; les figurines de la table ne se
  dessinaient pas chez lui (hauteurs en % d'un parent sans largeur : elles sont maintenant en vh) ; l'écran entier
  remontait quand un champ prenait le focus (l'application ne défile plus jamais) ; ← ressort directement dans la rue
  (« À bientôt Camille ! »). Deux conflits de noms avec les anciens styles (« carte », « salle ») : vérifiés tous.
- **Le coin salon** (après l'accueil) : un canapé à trois places et deux fauteuils autour d'une table basse, sur un
  tapis, aux couleurs du commerce (bordeaux chez Bergine, vert velours chez Alice, moutarde chez Nina) ; l'écran au
  mur passe la vidéo du jour. Ceux qui sont déjà assis (les amis, et des fantômes qu'on ne connaît pas) ; les places
  libres respirent : on touche, on s'assoit.
- **Puis tout commence** : ceux qui te connaissent te parlent (bulle au-dessus de leur tête et fil de discussion), tu
  réponds en un geste (« Salut ! », « C'est bon ici ? », « Vous me conseillez quoi ? »…) ou tu écris ; des boutons
  discrets : la vidéo, goûter / feuilleter / essayer (qui l'a essayé, sa voix, réserver), inviter (ton ami vient
  s'asseoir à côté de toi), appeler le commerçant (il vient au salon, sa voix, réserver), le mur des mots.
- Vérifié dans la vraie visionneuse : figurines assises dessinées, vidéo de l'écran qui tourne, annonce devant.
