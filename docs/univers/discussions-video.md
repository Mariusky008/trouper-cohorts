# 💬 Les discussions attachées aux vidéos, et Activité

Demandé par le propriétaire le 26 novembre 2026 (son cahier des charges « Activité, notifications et discussions
communautaires ») : qu'une discussion continue après le salon, qu'on la retrouve sans revenir au salon, sans devenir une
messagerie bruyante.

- Conception (A0) validée le 26 novembre 2026 (« ok c'est bon pour moi ») : https://claude.ai/artifact/1rmoTMDdvYyFdrfTxxZxaM
  (l'avis, l'architecture, le parcours, les données, la visibilité, la matrice des notifications, les niveaux de suivi,
  les maquettes Activité et Discussion vidéo, les lots).

## Ce qui est décidé

- **Une discussion = une vidéo × un cercle.** La vidéo est identifiée par son identifiant YouTube (11 signes ;
  `videoYouTube` ramène youtu.be, /watch, /shorts, /embed, /live au même). Trois cercles, chacun avec sa couleur :
  - 👯 **Mes proches** : les réactions à la seconde, les mots, les vocaux, les réponses (`reactions-video`, existait) ;
    seulement les proches des deux côtés qui l'ont vue ; jamais filtré entre proches ;
  - 👥 **Mon groupe** : ce que le groupe en dit (lot A6) ; les membres actuels ;
  - 🌍 **Tous ceux qui l'ont vue** : les mots de fin de vidéo (`mots-video`, existait) et les mots écrits (lot A2) ;
    adultes et 15-17 ans séparés ; prénom et figurine seulement.
- **Rien ne devient public tout seul** : ce qu'on dit dans un salon reste au salon (48 h). On passe en 🌍 par un geste,
  et le bouton dit « Publier ».
- **Une cloche 🛎️ en haut**, pas un cinquième onglet : elle ouvre Activité, qui reprend « Pendant ton absence ». Le menu
  reste Découvrir · Mes groupes · Messages · Ma maison.
- **Le suivi** : 🔔 Prévenir, 🤫 Sans bruit, 🔕 Ne plus suivre. Niveaux de départ : proches et groupes gardés 🔔 ; ce que
  j'ai publié en 🌍 : 🤫, mais une réponse directe me prévient ; une vidéo juste regardée : pas suivie. Toujours
  réversible (le ⋯ de la discussion).
- **Une seule règle de bruit**, celle des groupes (#303) : rien de 22 h à 9 h ; une notification par discussion toutes
  les deux heures au plus ; la suivante remplace la précédente.
- **Les quatre autres choix de la page** (le propriétaire a validé la page sans y répondre un par un ; on suit les
  recommandations) : le mot écrit public, 90 signes, à côté des mots vocaux ; une discussion 🌍 vit 30 jours après sa
  dernière intervention ; « 🌍 Le laisser sous la vidéo » sous sa bulle dans un salon ouvert (et toujours à la fin de
  la vidéo) ; les 15-17 ans ont leur discussion 🌍 à eux, comme leurs mots.
- Pas de migration : des fichiers JSON dans le stockage, un fichier par personne et par chose.

## Les lots

| Lot | Contenu | État |
| --- | --- | --- |
| A0 | La conception et les maquettes | ✅ validée le 26 novembre 2026 |
| A1 | L'écran Discussion vidéo, en lecture ; la fiche vidéo ; les entrées | ✅ fait |
| A2 | Écrire : le mot écrit 🌍, répondre, « Lu par… », « 🌍 Le laisser sous la vidéo » | ✅ fait |
| A3 | Suivre : les trois niveaux, les niveaux de départ, le ⋯ | à faire |
| A4 | Activité et la cloche 🛎️ ; « Pendant ton absence » y passe | à faire |
| A5 | Les notifications sur le téléphone (la matrice, la règle de bruit, les interrupteurs) | à faire |
| A6 | Les groupes : le cercle 👥, vidéo par vidéo | à faire |
| A7 | Le soin : « Ne plus voir », l'admin des mots écrits, vidéo indisponible, les cinq cas sur un iPhone | à faire |

## A1, dans le code

- **L'écran** : `/univers/discussion?video=<id>[&cercle=proches|tous]` (`app/univers/discussion/page.tsx`,
  `app/collection/discussion-video.tsx`). La vidéo en haut (sa vignette, son titre, sa chaîne), « ▶ Revoir la vidéo »
  (dans mon salon si elle est encore à ma télé, `lienRevoir` ; sinon « ▶ La voir sur YouTube »). Deux cercles en onglets,
  chacun avec le nombre de ce qui y est dit (jamais un chiffre inventé). 👯 s'ouvre d'office si mes proches ont dit quelque
  chose. Ce que mes proches ont dit plus loin que là où j'en suis reste caché tant que je ne l'ai pas vue (« 🔒 … : regarde
  la vidéo d'abord »). Les vocaux et les mots s'écoutent sur place. Sans âge dit : 🌍 le demande d'abord. Pour écrire : à
  la fin de la vidéo (A2 ajoutera l'écriture ici).
- **Qui peut l'ouvrir** (`videoDeLaDiscussion`) : la vidéo est à ma télé (aujourd'hui ou hier, mes chaînes), dans mon
  historique (📼 Revoir, soixante vidéos), dans une séance où je suis ou la sélection d'un salon ouvert de ma tranche ;
  ou elle a sa fiche et j'y ai déjà réagi ou laissé un mot. Sinon 404.
- **La fiche vidéo** : `videos/<id>.json` = { id, titre, chaine, duree } (`fiche-video-serveur.ts`), notée quand on ouvre
  sa discussion et quand on y laisse un mot. Elle dit son titre quand la vidéo a quitté la télé ou le salon.
- **Les entrées** : « 💬 Toute la discussion » au bas de « 💬 Ce qui s'est dit » dans ma télé du jour ; « 💬 La
  discussion » sous chaque vidéo de la rangée 📼 Revoir (Découvrir), et 💬 au bout de chaque ligne de la feuille 📼 Revoir
  (Ma maison).
- **La route** : `GET /api/direct/discussion-video?video=<id>` → `{ discussion }` = { video, vue, aMaTele, proches,
  miennes, tous } (`tous` : `null` tant que je n'ai pas dit si j'ai 18 ans). Rien n'est rangé de nouveau pour la lire :
  elle relit `decouvrir/reactions/<vidéo>/` (`reactionsDesProches`) et `decouvrir/mots/<tranche>/<vidéo>/`
  (`suiteDeLaVideo`, qui accepte maintenant une vidéo déjà vérifiée). L'ouvrir vide la boîte « à revoir » de cette vidéo.
- **Les essais** : `scripts/essai-discussion-video-route.mjs` (sans compte, une vidéo inconnue ; la fiche notée ; 👯 Sam,
  🌍 Inès ; Inès sans les mots de Sam ; Jade 15-17 ans à part ; Noé sans âge ; une vidéo de l'historique ; une vidéo
  partie de la télé mais où l'on a réagi ; jamais un compte) et `scripts/navigateur/discussion-video.mjs` (sur un iPhone :
  « ▶ Revoir la vidéo », « 👯 Mes proches · 1 », « Sam · à 0:08 », « 🌍 Tous · 1 », le mot d'Inès ; une vidéo jamais
  croisée ; rien ne déborde).

## A2, dans le code

- **✍️ Écrire sous la vidéo** (🌍, dans l'écran de la discussion) : le champ dit qui lira (« 🌍 Lu par tous ceux qui la
  regardent », ou les 15-17 ans) ; 90 signes ; la modération des salons ouverts (`refusDuMessage` : liens, numéros,
  réseaux, questions personnelles, mots interdits, alcool) ; un toutes les trois secondes, trente par personne et par
  vidéo ; quelqu'un d'exclu des salons ne publie pas. **La première fois, l'accord** : « Tous ceux qui regardent cette
  vidéo verront ta figurine et ce mot. Tu pourras l'effacer quand tu veux. » (retenu sur le téléphone,
  `clikme-accord-ecrit-v1` ; le serveur exige `accord: true` à chaque fois). Le bouton dit « Publier ».
- **↩ Répondre** à un mot écrit ou à un mot dit (`mot:<q>`) : la réponse se place juste après (`filDeTous`). Une réponse
  dont le mot a été effacé reste, seule.
- **Effacer** le sien (partout, tout de suite) ; **Signaler** celui d'un autre : il ne passe plus chez moi, caché pour
  tous à trois personnes différentes, copié pour l'administrateur avec les signalements des salons (`motif: "ecrit"`,
  `salon: "ecrit:<vidéo>"`). Gardé 30 jours.
- **🌍 Le laisser sous la vidéo** (salon ouvert, pas une séance entre proches) : après avoir écrit au salon pendant une
  vidéo, un bouton reste dix secondes au-dessus du champ ; l'accord la première fois ; puis « ✓ Ton mot est sous la
  vidéo. » et « 💬 Voir la discussion ». Le mot dit d'où il vient (« vu dans ⚽ Le salon du foot ») seulement si l'on y est
  assis.
- **La suite de la vidéo** (la feuille de fin) a « 💬 Toute la discussion › », qui ouvre 🌍 (avec la séance, s'il y en a
  une).
- **Rangement** : `decouvrir/ecrits/<tranche>/<vidéo>/<ms>-<q>-<x>.json` = { id, h, q, prenom, texte, le, repond?, de? } ;
  `decouvrir/ecrits-signales/<tranche>/<vidéo>/<id>/<q>.json`.
- **La route** : `POST /api/direct/discussion-video` `{ action: "publier", id, texte, repond?, accord, salon?, seance? }`
  → `{ ecrit }` (400 `refus`, 403 `age`, 429) ; `{ action: "effacer", id, ecrit }` ; `{ action: "signaler", id, ecrit }`
  → `{ cache }`. `GET` rend aussi `ecrits`.
- **Les essais** : la suite de `essai-discussion-video-route.mjs` (l'accord, un lien, 90 signes, trois secondes ; Inès
  répond à Léa ; Léa répond au mot dit d'Inès ; depuis un salon ; Jade à part ; signaler, trois fois, l'administrateur ;
  effacer) et de `navigateur/discussion-video.mjs` (l'accord, « Publier », répondre à Inès, le fil, un lien refusé,
  effacer).
