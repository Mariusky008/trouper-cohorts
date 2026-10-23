# Les trois fantômes — le prototype (Chez Bergine)

À la fin de la vidéo d'un commerçant, trois petites cages dorées se balancent sous la vidéo, chacune avec un
fantôme à son look. L'habitant en touche une : la porte s'ouvre, son fantôme en sort et s'envole se placer dans
la scène du commerce (la cage reste vide, cochée) :

| Le fantôme | Ce qu'il dit | Où il se place |
|---|---|---|
| 💗 J'adore | « J'ai aimé ta vidéo » | sur le trottoir, devant la vitrine, il applaudit |
| 📌 Je viendrai, c'est sûr | « Promis, je passe un jour » | à la porte, son prénom s'écrit dans le carnet |
| 🍽️ J'y vais aujourd'hui | « Garde-moi une place » | il entre et s'assoit à table |

`index.html` joue les deux côtés à la fois, pour juger si c'est addictif en cliquant soi-même :
- **l'habitant** : le choix de son fantôme, la fin de la vidéo de Jean-Marie, le vol jusqu'à sa place, ses amis
  déjà là, le bon de promesse (3 promesses au plus), Ma Maison, le bon montré au comptoir, le pin du commerce,
  sa tournée de Dax, sa place d'habitué après 3 promesses tenues ;
- **le comptoir** : jamais « 0 » (un matin vide montre la semaine), la vitrine en direct, « Merci » à tous,
  l'appel aux seules personnes du carnet (une fois par jour), le carnet, les tables, la semaine, le Direct de
  demain, ce qui reste privé ;
- **« Le lendemain matin »** : la vitrine se vide, et les premiers arrivés ont le premier rang.

## Dans la vitrine, tout se touche

- **Chaque fantôme** : on le touche, une bulle dit son prénom, son geste et quand (« 💗 a adoré · il y a 24 min »,
  « 🍽️ vient à 12 h 30 · à 2 ») et **son petit mot** (« La meilleure garbure de Dax »). Les mots se choisissent
  dans une liste par geste, ils ne s'écrivent pas : la vitrine ne dit que du gentil, sans modération. Jean-Marie
  les lit dans son fil, au comptoir.
- **👋 Coucou** : le fantôme touché se retourne et salue ; un ami répond toujours (« On se retrouve chez Bergine
  ce midi ? »), un inconnu souvent. Le comptoir compte les coucous échangés devant sa vitrine.
- **Son propre fantôme** : il saute et dit son mot ; « Changer son mot » ouvre la liste. La première fois, sa
  bulle s'ouvre seule et apprend que tout se touche.
- **Toc-toc** : toucher la porte la fait trembler, le fantôme de Jean-Marie sort et dit ce que Jean-Marie a écrit
  au comptoir (« Plus que 6 magrets ce midi ! ») : l'info du moment, qui donne envie d'y aller maintenant. Il voit
  combien ont frappé.
- **Le fantôme doré** : chaque matin, Jean-Marie le cache ailleurs dans sa vitrine (sur le store, en salle,
  dans la foule, derrière le carnet, à la fenêtre de la porte). Les cinq premiers qui le trouvent gagnent un petit
  cadeau (ici, en exemple, le dessert offert), rangé dans Ma Maison, avec le badge « Chasseur d'or ». Un indice
  se demande sous le titre. Sur Instagram, la vidéo dit qu'un fantôme doré s'y cache : une raison de plus de
  toucher le lien. Il en reste toujours un pour celui qui cherche (les autres trouveurs sont simulés).

## Pour que la vidéo se partage

- **Partager ma vitrine** : l'habitant envoie la vidéo de Jean-Marie, qui finit sur **sa** vitrine (son fantôme
  devant, « Léa et 49 Dacquois sont devant Chez Bergine. Et toi ? »), à un ami ou en story. Ceux qui la
  reçoivent touchent une cage et leur fantôme vient à côté du sien (étiquette 💌). L'habitant voit combien il
  en a fait venir ; le comptoir voit « Venus grâce à un partage ».
- **Garde-moi une place, avec qui ?** : choisir un ami envoie une invitation qui sert à quelque chose (une
  place gardée à une heure) ; s'il accepte, son fantôme s'assoit à la même table.
- **Sur Instagram (ou Facebook)**, quand le commerçant publie la vidéo sur ses propres réseaux, il n'y a pas de
  cage à toucher : la vidéo publiée finit donc sur la vitrine en direct, pleine de fantômes, avec un sticker
  lien « Choisis ta cage » (en publication : « lien en bio »). Répondre « 👻 » renvoie automatiquement un message
  avec le lien. Le lien ouvre une page web, `clikme.fr/bergine`, sans appli ni compte : les trois cages, puis
  la vitrine. Le bouton « Il voit la vidéo sur Instagram » joue ce chemin.

Les autres habitants, les amis et les réponses automatiques sont simulés (une arrivée toutes les 4 à 8
secondes) ; Instagram, le message automatique et la page web aussi : rien n'est envoyé.

Les images viennent du dépôt : les fantômes des habitants (`public/direct/ensemble`, réduits dans `a/g`), la
salle et le fantôme de Chez Bergine, l'affiche et la vidéo de l'interview (`a/interview.mp4` est un lien vers
`outils/tour-du-fantome/tour/interview.mp4`).

Pour l'essayer en local :

```sh
python3 -m http.server 8791 --directory outils/trois-fantomes
```
