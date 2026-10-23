# Les trois fantômes — le prototype (Chez Bergine)

À la fin de la vidéo d'un commerçant, l'habitant touche un des trois fantômes ; son fantôme, avec son look,
va se placer dans la scène du commerce :

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

Les autres habitants sont simulés (une arrivée toutes les 4 à 8 secondes).

Les images viennent du dépôt : les fantômes des habitants (`public/direct/ensemble`, réduits dans `a/g`), la
salle et le fantôme de Chez Bergine, l'affiche et la vidéo de l'interview (`a/interview.mp4` est un lien vers
`outils/tour-du-fantome/tour/interview.mp4`).

Pour l'essayer en local :

```sh
python3 -m http.server 8791 --directory outils/trois-fantomes
```
