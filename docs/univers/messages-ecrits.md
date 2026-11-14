# Écrire, partager — les messages écrits, les liens, les photos et les vidéos (lots M1 à M3, cahier des charges, 14 novembre 2026)

**Statut : validé par le propriétaire, pas encore développé.**

## 1. Ce que le propriétaire a demandé

> « Est-ce que les utilisateurs peuvent s'envoyer des messages écrits au lieu du talkie-walkie, avec la possibilité de
> s'envoyer des fichiers comme des photos, des vidéos ou des liens ? »

La réponse faite, puis son « oui » (14 novembre) : **oui, dans cet ordre — l'écrit et les liens, puis les photos, puis
les vidéos**. Ce qu'on garde de ClikMe :

- **un message écrit est dit par la figurine** (dans sa bulle, avec la tête qui va avec), **jamais lu par une voix de
  synthèse** (la règle de la maison) ;
- **ce qu'on partage peut nourrir son univers**, toujours avec son « oui » (la règle de `docs/univers/etagere-accord.md`) ;
- **seulement entre proches** (ajoutés tous les deux), comme le talkie-walkie aujourd'hui.

## 2. Ce qui existe aujourd'hui

Dans une conversation (`proches.tsx`, `conversation-vivante.tsx`), on s'envoie :

- des **vocaux** de 20 secondes au plus, transcrits et découpés en répliques, chacune avec une tête
  (`talkie-serveur.ts`, `envoyerParole` ; un fichier par message : `fils/<paire>/m/<instant>-<qui>-<id>.json`, la voix
  dans `fils/<paire>/s/`) ;
- des **panneaux** et des **réactions** (lot R4a, `fils/<paire>/gestes.json`) ;
- des **mèmes** faits dans le studio (`fils/<paire>/memes.json`).

Pas de texte tapé, pas de photo, pas de vidéo, pas de lien.

## 3. Où on écrit : la barre du bas

Comme dans une messagerie qu'on connaît déjà :

- **un champ « Écrire… »** prend la place du gros bouton « Lui répondre » ; à sa droite, **le micro** quand le champ
  est vide, **la flèche d'envoi** dès qu'on tape ;
- à gauche, **« ＋ »** : 📷 Photo (lot M2), 🎬 Vidéo (lot M3), 🎭 Un mème, 🪧 Un panneau (les deux d'aujourd'hui y
  passent) ;
- le micro garde son geste d'aujourd'hui (enregistrer, « Ta figurine a compris ça », envoyer).

## 4. Lot M1 — l'écrit et les liens

### 4.1 Un message écrit

- **Jusqu'à 1 000 signes.** Les mots interdits sont refusés comme pour un vocal (« Ça, ta figurine ne le dit pas.
  Réessaie autrement 🙂 »).
- **La tête est choisie toute seule**, par les règles des vocaux (`proposerParRegles`) : pas d'étape de plus. Avant
  d'envoyer, trois petites têtes au-dessus du champ permettent d'en changer d'un toucher (la première est prise
  d'office).
- **Dans la scène, chez l'autre** : sa figurine prend la tête choisie et « dit » le message dans sa bulle, les mots qui
  apparaissent l'un après l'autre, la bouche qui bouge, **sans aucun son**. Un long message se lit en entier dans le
  fil ; la bulle en montre les 140 premiers signes.
- **Dans le fil** : une bulle de texte, l'heure, les réactions (appui long) et « Signaler », comme un vocal.
- **Les emojis** passent tels quels.

### 4.2 Un lien

- Un lien tapé ou collé (`http://` ou `https://`) devient **un aperçu**, comme sur WhatsApp : l'image, le titre, le
  site. Un toucher l'ouvre dans un nouvel onglet ; un site que ClikMe ne connaît pas passe d'abord par « Tu quittes
  ClikMe pour <site> ».
- **L'aperçu est préparé par le serveur, à l'envoi**, une fois :
  - il lit la page (5 secondes, 1 Mo au plus) et ses balises de partage (titre, image, site) ;
  - il refuse les adresses internes (localhost, réseaux privés, adresses IP nues) : le serveur ne doit jamais aller
    lire autre chose que le web public ;
  - il recopie l'image d'aperçu, réduite (600 pixels), dans le seau : le téléphone de l'autre ne va jamais chercher
    l'image chez le site, qui ne sait donc pas qui a reçu le lien.
- **Sans aperçu possible** : le lien tout simple, cliquable.
- **Les sites de musique et de vidéo connus** (YouTube, Spotify, Deezer, Apple Music) ont une carte un peu plus belle.
  Un lien de chanson ou de film peut devenir **une pochette ou une affiche dans son univers** : sous l'aperçu, chez
  celui qui l'a envoyé seulement, « 🎵 Le ranger dans mon univers ? » (son « oui » d'abord, toujours). Le rangement
  lui-même relève de la session de l'univers.

### 4.3 La notification, les non-lus, « Chez moi »

- **La notification** (`prevenirDUneParole`, les mêmes règles : trente par jour au plus, une à la fois par proche) :
  « ✍️ Léa t'a écrit » ; le corps : le début du message (60 signes). Pour un lien : « 🔗 Léa t'a envoyé un lien » et le
  titre.
- **Les non-lus** comptent les messages écrits comme les vocaux.
- **La ligne de « Chez moi »** : « Léa : « On se voit samedi ? » », « Toi : 🔗 Le titre du lien ».

### 4.4 Les figurines lisent l'écrit aussi

L'aparté (lot R4b), le mot de la fin (lot R2) et l'étagère (lots E) lisent aujourd'hui le texte transcrit des vocaux
(`texteDuMessage`). **Ils liront aussi le texte écrit**, avec les mêmes conditions (« Ma figurine parle pour moi »,
rien de signalé, rien de sensible). D'un lien, ils ne lisent que le titre ; d'une photo, que sa légende. **Jamais
l'image elle-même.**

### 4.5 Les données

- **Un fichier par message**, dans le même dossier que les vocaux, pour qu'un seul fil les range tous dans l'ordre :
  `fils/<paire>/m/<instant>-<qui>-<id>.json` = `{ id, de, le, genre: "ecrit", texte, tete, lien?: { url, titre,
  site, image } }`. Un vocal d'aujourd'hui n'a pas de `genre` : il reste un vocal.
- L'image d'aperçu : `fils/<paire>/a/<id>.webp`.
- **Les limites par personne et par jour** : 300 messages écrits (les vocaux gardent leurs 100).

### 4.6 Les routes

`POST /api/direct/proches` (avec ses vérifications d'aujourd'hui : la session, les deux proches) :

- `action: "ecrire"` + `cle`, `texte`, `tete` → le message, et la notification après la réponse (`after()`) ;
- l'aperçu du lien se prépare après la réponse ; le fil le montre dès qu'il est prêt (la relecture toutes les 4 s).

## 5. Lot M2 — les photos

### 5.1 Envoyer une photo

- **« ＋ » → 📷 Photo** : la pellicule du téléphone, ou l'appareil photo. Une photo à la fois, avec une légende si on
  veut (200 signes).
- **Dans le téléphone, avant l'envoi** : la photo est réduite (1 600 pixels au plus, en WebP) et **toutes ses
  métadonnées sont retirées, la position GPS d'abord**. Elle part ensuite au seau par une adresse signée, comme les
  vidéos des mèmes.
- **Dans le fil** : la vignette, un toucher pour la voir en grand (et la faire glisser pour fermer).
- **Dans la scène** : la figurine de celui qui l'envoie la montre, dans un petit cadre qu'elle tient à deux mains.

### 5.2 La modération

L'appli est ouverte dès 15 ans. Une photo ne part pas sans deux contrôles :

1. **automatique, avant de la livrer** : le service de modération d'OpenAI (il lit les images, il est gratuit) ; une
   photo refusée ne part pas, avec un message simple : « Cette photo ne peut pas partir. » ;
2. **« Signaler »** (aujourd'hui pour les vocaux, `signalerParole`) vaut aussi pour une photo : elle disparaît chez
   celui qui signale et attend la modération, à côté des mèmes (`/admin/humain/figurines-clients`).

**Sans service de modération joignable, la photo ne part pas** (« Réessaie dans un instant »). On n'envoie jamais une
photo qu'on n'a pas pu contrôler.

### 5.3 Ce qu'une photo devient ensuite

- **Elle reste dans la conversation.** L'autre ne peut ni la mettre ailleurs ni la montrer à quelqu'un d'autre depuis
  ClikMe.
- **Celui qui l'a envoyée peut la mettre dans un cadre de son univers** : « 🖼️ La mettre dans mon univers ? », sous
  la photo, chez lui seulement. Le rangement relève de la session de l'univers.

### 5.4 Les données et les limites

- La photo : `fils/<paire>/p/<id>.webp` ; le message : `{ id, de, le, genre: "photo", media: { chemin, l, h }, legende? }`.
- **30 photos par personne et par jour**, 5 Mo au plus avant réduction.
- **Le coût** : quelques centaines de kilo-octets par photo dans le seau ; à suivre sur la facture de l'hébergeur.

## 6. Lot M3 — les vidéos

- **« ＋ » → 🎬 Vidéo** : **30 secondes au plus**, 25 Mo au plus. Une vidéo plus longue est refusée avant l'envoi,
  avec sa durée (« 45 s : 30 secondes au plus »).
- **La vignette est faite dans le téléphone** (une image de la vidéo). La vidéo part au seau par une adresse signée.
- **La modération** : trois images tirées de la vidéo (au début, au milieu, à la fin) passent au service de
  modération, comme une photo ; puis « Signaler ». Le son n'est pas contrôlé, c'est une limite à connaître.
- **Dans le fil** : la vignette et sa durée ; un toucher la lit en grand, avec le son.
- **Les données et les limites** : `fils/<paire>/v/<id>.<ext>` ; 10 vidéos par personne et par jour. Une vidéo de 30
  secondes pèse de 5 à 15 Mo : **c'est le poste qui coûte**, à suivre sur la facture.
- **Plus tard, pas dans ce lot** : réencoder les vidéos trop lourdes.

## 7. La confidentialité, dite en clair

- Les messages, photos et vidéos sont rangés dans un espace privé, lisible par eux deux seulement (des adresses
  signées, qui expirent). **Ce n'est pas un chiffrement de bout en bout** comme celui de WhatsApp : ClikMe peut les
  lire (pour la modération, et pour les figurines si « Ma figurine parle pour moi » est allumé). La page de
  confidentialité doit le dire.
- **Effacer un message** (le sien, dans les 24 heures) l'efface pour les deux, avec sa photo ou sa vidéo.
- Un proche retiré, un compte effacé : la conversation, ses photos et ses vidéos sont effacées.

## 8. Ce qu'on mesure

Dans la page admin des mèmes, une rubrique « ✍️ Les messages » :

| Mesure | Ce qu'elle dit |
|---|---|
| Messages écrits, vocaux, photos, vidéos, par jour | Ce que les gens préfèrent |
| Part des conversations où l'on écrit | Si l'écrit remplace la voix, ou s'y ajoute |
| Liens avec aperçu, sans aperçu | Si les aperçus marchent |
| Photos refusées par la modération | Si le filtre est trop dur, ou utile |
| Signalements | La santé des conversations |
| Ce que pèsent les photos et les vidéos | Le coût |

**À regarder de près** : si les vocaux s'effondrent quand l'écrit arrive. La voix et la figurine qui parle font
ClikMe ; si elles disparaissent, il faudra remettre la voix en avant.

## 9. Les essais

- **`scripts/verifier-messages.mjs`** (sans téléphone) : le texte (longueur, mots interdits, emojis) ; la tête
  choisie ; les liens reconnus et refusés (adresses internes, protocoles autres que http et https) ; les limites du
  jour ; les phrases de l'écran (sans accord de genre, sans le mot interdit).
- **`scripts/essai-messages-route.mjs`** : écrire sans être proches (403) ; écrire, relire le fil (écrit et vocal dans
  l'ordre) ; l'aperçu d'un lien (une fausse page servie en local) ; une photo acceptée, une photo refusée par la fausse
  modération ; signaler une photo ; effacer dans les 24 heures.
- **`scripts/navigateur/messages.mjs`**, ajouté à `lancer-essais.sh` : Léa écrit, la figurine le dit chez Marc (la
  bulle, sans son) ; un lien et son aperçu ; une photo, sa vignette, le plein écran, la figurine qui la montre ; une
  vidéo de 31 secondes refusée ; rien ne déborde.
- **Le faux service** (`scripts/faux-supabase.mjs`) répond pour la modération (une image marquée « refus » est
  refusée).

## 10. Les phrases à valider

| Où | Phrase |
|---|---|
| Le champ | « Écrire… » |
| Mot interdit | « Ça, ta figurine ne le dit pas. Réessaie autrement 🙂 » (celle d'aujourd'hui) |
| Notification, écrit | « ✍️ Léa t'a écrit » |
| Notification, lien | « 🔗 Léa t'a envoyé un lien » |
| Notification, photo | « 📷 Léa t'a envoyé une photo » |
| Notification, vidéo | « 🎬 Léa t'a envoyé une vidéo » |
| Lien inconnu | « Tu quittes ClikMe pour <site> » |
| Photo refusée | « Cette photo ne peut pas partir. » |
| Vidéo trop longue | « 45 s : 30 secondes au plus » |
| Ranger un lien | « 🎵 Le ranger dans mon univers ? » |
| Ranger une photo | « 🖼️ La mettre dans mon univers ? » |

## 11. Les choix faits par défaut

Le propriétaire peut revenir sur chacun.

| Point | Choix | L'autre choix |
|---|---|---|
| La barre du bas | Un champ « Écrire… », le micro quand il est vide | Garder le gros bouton « Lui répondre » et ajouter « Écrire » à côté |
| La tête d'un message écrit | Choisie toute seule, changeable d'un toucher | Une étape « Ta figurine a compris ça » comme pour la voix |
| Le modèle pour la tête | Les règles, sans modèle (aucun coût) | Le petit modèle de texte, comme pour les vocaux |
| Effacer un message | Le sien, dans les 24 heures, pour les deux | Jamais, ou sans limite |
| Une photo reçue | Ne sort pas de la conversation | Le destinataire peut la ranger chez lui, avec l'accord de celui qui l'a prise |
| Garder les photos et les vidéos | Aussi longtemps que la conversation | Les effacer après un an |

## 12. Les lots

Trois lots, une PR chacun, dans cet ordre. Chacun derrière un frein (`CLIKME_ECRIT`, `CLIKME_PHOTOS`,
`CLIKME_VIDEOS` à `0` chez l'hébergeur : la fonction disparaît, ce qui a été envoyé reste lisible).

- **M1 — l'écrit et les liens** : 3, 4, 7, 8 (sauf photos et vidéos), les essais.
- **M2 — les photos** : 5.
- **M3 — les vidéos** : 6.

Ils touchent `talkie.ts`, `talkie-serveur.ts`, la route des proches, `proches.tsx` et `conversation-vivante.tsx` :
une seule session à la fois sur ces fichiers.
