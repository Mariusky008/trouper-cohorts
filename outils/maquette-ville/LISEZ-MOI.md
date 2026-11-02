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
