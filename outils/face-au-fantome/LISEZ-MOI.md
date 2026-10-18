# Face au fantôme — la maquette de l'interview

« Est-ce que je pourrais voir à quoi ça ressemblerait pour valider le format
avant de tout changer ? » Ce dossier fabrique **l'épisode maquette de
Jean-Marie (Chez Bergine)** : 42 secondes en 9:16, avec l'accroche, le plan
signature (son nom derrière lui), les cartes de questions, les sous-titres mot à
mot, le ralenti, le défi en trois mots, la carte de fin et la signature sonore.

Rien ici ne fait partie de l'application : c'est un outil pour juger le format.

## Ce qui est réel, ce qui est maquette

- **Réel** : sa voix et ses mots (`public/direct/voix/bergine-magret.mp3`,
  seulement coupés), ses photos du magret, la carte de Chez Bergine, la voix du
  fantôme reporter : il pose ses questions à voix haute, avec les répliques
  enregistrées sur ElevenLabs (`voix-fantome/`, voir plus bas).
- **Maquette** : Jean-Marie est en photos animées, pas filmé ; la musique est composée par le navigateur
  (aucun droit) ; les sous-titres sont calés sur les pauses de sa voix
  (`mots.json`), pas sur une transcription ; Chez Bergine est inventé.

## Fabriquer la vidéo

Depuis la racine du dépôt :

```sh
node outils/face-au-fantome/preparer.cjs           # les images et les sons → a/
node outils/face-au-fantome/rendu.mjs apercu 3.6 12.9 34.9   # quelques images clés
FFMPEG=/chemin/ffmpeg node outils/face-au-fantome/rendu.mjs tout   # → face-au-fantome.mp4
```

Il faut Chromium et Playwright (présents dans l'environnement cloud) et un
`ffmpeg` avec libx264. Sans ffmpeg installé : `pip download imageio-ffmpeg
--no-deps`, puis décompresser la roue — elle contient un ffmpeg statique.

## Les fichiers

- `episode.html` — le moteur : `dessiner(t)` dessine l'image de l'instant t
  (tout est fonction du temps), `mixer()` fabrique le son (voix coupées, musique
  à 100 battements par minute, bruitages, baisse de la musique sous la voix).
- `mots.json` — l'instant de chaque mot de son enregistrement.
- `lui.webp` — Jean-Marie détouré depuis sa photo d'accueil, le haut du crâne
  reconstitué (la photo le coupe au front).
- `polices/` — Anton, Playfair Display et Poppins (Google Fonts, licence SIL
  Open Font License 1.1), en local : le rendu ne dépend pas du réseau.

## La voix du fantôme (`voix-fantome/`)

« J'aime pas du tout la voix du fantôme interviewer, on dirait qu'il est malade
et très métallique. » Les questions de tous les métiers ont donc été
enregistrées sur ElevenLabs, un fichier par métier, puis coupées ici en
**97 répliques** (une phrase = un fichier mp3, 96 kb/s, petits fondus).
`index.json` donne pour chacune son texte, sa durée et l'endroit exact où elle a
été prise dans l'enregistrement d'origine (`pris_dans`, `de`, `a`, en secondes).

- `commun-*` : ce que le fantôme dit dans tous les métiers (« C'est parti, on
  tourne ! », où poser le téléphone, « Dernière question ! », « Le défi ! »,
  les questions surprises, « Merci ! Je m'occupe du montage. »).
- `restaurant-*`, `mode-*`, `coiffure-*`, `ongles-*`, `lunettes-*`, `fleurs-*`,
  `atelier-*`, `librairie-*`, `bar-*` : la question du produit, le geste, la
  question suivante, le défi en trois mots, trois « ceci ou cela », l'au revoir.

Les coupes ont été faites aux silences : le bloc commun, plus long, a été aligné
phrase par phrase sur la durée attendue de chaque phrase. Elles ont été
vérifiées par la mesure (aucune coupe ne tombe dans un mot), **pas à l'oreille,
une par une**.

## L'épisode 13 : Lou, boutique de vêtements (`lou/`)

Le même moteur, un autre épisode : 39 secondes sur un manteau long camel. Le
fantôme pose ses questions avec sa voix (« Alors, c'est quoi, ta pièce du
jour ? », « Montre-moi comment tu la portes ! », « Dernière question ! », « Ta
boutique en trois mots ? », « À bientôt, en boutique ! »). Chaque photo montre
ce que Lou dit au moment où elle le dit : « laine et cachemire » sur la matière
de tout près, « jusqu'aux chevilles » sur les chevilles, « ouvert » puis
« ceinturé », « avec des boots » sur les boots, le ralenti sur la ceinture
nouée (« comme ça »).

**Les photos, la voix de Lou et la musique ne sont pas dans le dépôt** (droits) :
`lou/preparer.cjs` les prend dans un dossier qu'on lui donne et dit les noms
attendus. Six photos viennent de Pexels ; la veste à sequins (Amazon) et la pile
de pulls (un blog) **ne sont pas libres de droits** : maquette interne
seulement. Le dépôt garde ce qui permet de refaire le montage : le moteur
(`lou/episode.html`), l'instant de chaque mot (`lou/mots.json`, posé à la main
sur les pauses et les syllabes mesurées), les recadrages, et le masque du
détourage (`lou/masque.png`).

```sh
node outils/face-au-fantome/lou/preparer.cjs /chemin/du/dossier/recu
DOSSIER=lou node outils/face-au-fantome/rendu.mjs apercu 3.6 22.4
DOSSIER=lou FFMPEG=/chemin/ffmpeg node outils/face-au-fantome/rendu.mjs tout
```
