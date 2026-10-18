# Face au fantôme — la maquette de l'interview

« Est-ce que je pourrais voir à quoi ça ressemblerait pour valider le format
avant de tout changer ? » Ce dossier fabrique **l'épisode maquette de
Jean-Marie (Chez Bergine)** : 40 secondes en 9:16, avec l'accroche, le plan
signature (son nom derrière lui), les cartes de questions, les sous-titres mot à
mot, le ralenti, le défi en trois mots, la carte de fin et la signature sonore.

Rien ici ne fait partie de l'application : c'est un outil pour juger le format.

## Ce qui est réel, ce qui est maquette

- **Réel** : sa voix et ses mots (`public/direct/voix/bergine-magret.mp3`,
  seulement coupés), ses photos du magret, la carte de Chez Bergine, la voix du
  fantôme reporter (« Dernière question ! », « À demain, et bon appétit ! »).
- **Maquette** : Jean-Marie est en photos animées, pas filmé ; les questions 1
  et 2 sont écrites (pas dites) ; la musique est composée par le navigateur
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

## Pour un autre commerce (la boutique de vêtements)

Il faut ses images (photos ou vidéos), **sa voix** et une musique. Dans cet
environnement, les banques libres de droits sont bloquées par la politique
réseau ; il faut autoriser leurs domaines (par exemple `mixkit.co` et
`assets.mixkit.co`) et, pour la voix, `api.elevenlabs.io` avec la clé dans la
variable `ELEVENLABS_API_KEY`.
