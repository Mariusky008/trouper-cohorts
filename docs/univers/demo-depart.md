# 👋 La démo de départ : « Bienvenue chez Pablito » (20 novembre 2026)

Le concept de ClikMe a changé (la messagerie visuelle du salon du duo, « Ma maison », la nouvelle page Découvrir) :
l'accueil des nouveaux inscrits, « Entre chez Pablito » (`src/lib/direct/bienvenue.ts`, ses 7 moments sur l'ancien
univers), est à refaire. Ce document décrit la nouvelle démo, telle que la maquette la joue. Rien n'est codé.

**La maquette cliquable** (une page privée du propriétaire) : `https://claude.ai/artifact/8eVaDbarjbPgFyNRKH7Apv` ; sa
source : `docs/univers/maquettes/demo-depart.html`. **Elle est faite sur les vrais écrans de l'appli** (le propriétaire,
le 20 novembre : une première version avec les anciens fantômes « très loin de ce que la messagerie propose ») : le
salon du duo (l'en-tête, la pièce, les deux figurines découpées — le corps, la tête sur son ressort —, Moustache, les
puces, les onglets, les gestes, la saisie : les mesures de la maquette de la messagerie,
`https://claude.ai/artifact/NaRVjbvPi2PGJmG3poai7n`, et de `src/app/salon/salon.tsx`), « Ma maison » (l'en-tête, les
onglets de la pièce, « Aujourd'hui, si tu veux », « Pendant ton absence », « Ajouter chez moi », « Comme la voient tes
proches ») et Découvrir (ma télé du jour en grand écran, l'accueil et les salons ouverts). **Ses images** (la pièce du
duo, les figurines découpées, les avatars) viennent de la maquette de la messagerie : elles sont publiées avec la page
(dossier `demo/`), pas rangées dans le dépôt ; les décors des salons ouverts viennent de `public/direct/ensemble`. En
attendant la figurine de Pablito, celle de Camille tient sa place. Rien ne part (ni message, ni WhatsApp).

## Le principe

Une minute, juste après « C'est moi ! » et « Choisis ta pièce ». **On fait tout soi-même** avec sa toute nouvelle
figurine (pas de film à regarder). Et elle finit par **inviter un premier proche** : sans proche, l'appli est vide —
c'est le vrai but de la démo (ce qu'on mesurera : la part de ceux qui invitent).

## Les sept moments

| # | Ce qu'on vit (ce qu'on touche) | Ce que dit Pablito (🎙️, à enregistrer) |
|---|---|---|
| 1 | **Entrer** : le salon de Pablito (son chat Moustache sur l'accoudoir) ; ma figurine arrive et s'assoit en face de la sienne, il fait coucou ; « 👋 Lui faire coucou » | « Salut ! Ici, on ne s'écrit pas des messages : on se retrouve. » (`demo-depart-1`) |
| 2 | **La messagerie** : « … » puis sa bulle « T'as vu ce qui s'est passé hier ?! » ; je choisis une réponse (« Non, raconte ! » / « Grave 😂 » / « Quoi ?? »), ma figurine la dit tout de suite, la sienne réagit aux mots ; il m'envoie un 🤜, je renvoie un geste (🤜 Check, 😘 Bisou, 👏 Bravo) | « Tu vois ? Ce qu'on se dit, nos figurines le vivent. » (`demo-depart-2`) |
| 3 | **La mémoire** : « On se fait un ciné samedi ? 🍿 » ; je réponds ; ma figurine demande « 🎟️ Je le range ? » ; « 📌 Oui, range-le » : le ticket vole sur l'étagère (📚 1), « 📅 Ciné · samedi » s'allume en haut de la scène (« Non merci » : rien n'est rangé) | « Ici, rien ne se perd : tout ce que vous vous promettez se range. » (`demo-depart-3`) |
| 4 | **Ma maison** : ma pièce (celle que je viens de choisir) ; le ticket se pose sur mon étagère, « ✨ gardé avec Pablito » ; le toucher l'ouvre (le souvenir, et son 📅 dans notre salon) | « Et ça, c'est chez toi. Ce que tu gardes s'y installe, et tes proches peuvent venir voir. » (`demo-depart-4`) |
| 5 | **Jamais seul devant une vidéo** : ma télé du jour, **une vidéo en portrait** (un Short), en haut ; Pablito, Sam et Léa assis à côté de moi (« a vu hier soir », « ce matin », « ce midi ») réagissent **à la seconde** où ils ont réagi (😮, 😂, « PIXEL 😭😂 ») ; « Réagis : 😂 ❤️ 😮 » (ou un toucher sur la pièce : je ris) ; au même moment que Pablito : « 🫶 En même temps que Pablito ! » ; sinon « 😂 noté à 0:04 : ils le verront à cette seconde » | « Ta télé du jour. Tes proches la regardent avec toi… même s'ils l'ont vue hier. » (`demo-depart-5`) |
| 6 | **Les salons ouverts** : quatre cartes (⚽ le salon du foot · 12 ici, 🎬 séries et films · 8, 🎌 manga et anime · 5, 🗞️ les potins de ta ville · 6) ; un toucher : « Tu y entres quand tu veux, depuis 🧭 Découvrir » | « Et pour parler foot, séries ou mangas avec d'autres, les salons sont ouverts. » (`demo-depart-6`) |
| 7 | **Ton premier proche** : une place libre sur le canapé (« ＋ »), « Il manque quelqu'un sur ce canapé… » ; « 👯 Inviter mon premier proche » (le message WhatsApp déjà écrit, le lien `/parler/…` qui existe) ou « Plus tard » | « Ici, tout est mieux à deux. Invite quelqu'un que tu aimes. » (`demo-depart-7`) |

Puis : « C'est parti ! » — les trois onglets (💬 Messages, 🏠 Ma maison, 🧭 Découvrir), et l'arrivée sur 💬 Messages.
« Passer › » est toujours là ; 📝 montre les sept phrases.

**Les voix** : sept phrases, environ 40 secondes, enregistrées par le propriétaire (jamais de voix de synthèse) ; le
reste se lit à l'écran.

**La vidéo de communication** (30 s) : les moments 2, 3 et 5, avec la phrase « Regarde tes vidéos avec ceux que tu
aimes, même quand ils sont loin. »

## Ce qui reste à décider (le propriétaire)

1. Le déroulé et les phrases (ce qu'il change, après avoir joué la maquette).
2. Où la démo se place : juste après « Choisis ta pièce » (proposé), ou à la première ouverture de l'appli.
3. Ce que devient l'ancienne bienvenue « Entre chez Pablito » (`BIENVENUE_CHEZ_PABLITO`) : remplacée par celle-ci.

## Pour la coder (plus tard)

Une page à part, sur le moteur du salon (`src/app/salon/moteur.ts` : les bulles, les gestes, les figurines posées), la
pièce de Pablito et la pièce choisie par le nouveau venu, sa vraie figurine (ses calques), le vrai « Je le range ? »
(`etagere`), une vidéo de la sélection du jour en portrait, et l'invitation WhatsApp existante (`/parler/<id>`). Ses
essais : une route (rien n'est écrit chez les autres) et un essai navigateur au format téléphone.
