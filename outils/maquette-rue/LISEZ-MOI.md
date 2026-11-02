# La rue de Dax — maquette cliquable (2 novembre)

La « ville vivante » proposée par le propriétaire et un ami : les figurines des commerçants et des habitants dans la
ville, les pancartes du jour, ce qui est réservé à la famille d'un commerce, « On raconte quoi à Dax ? », et le
compagnon qu'on envoie en mission (il ne rapporte que ce qui a vraiment été publié).

- **Publiée** comme artefact claude.ai : https://claude.ai/artifact/BML75RZ9pDekdGnVXDUJM3 (privée, partage depuis
  son menu). Pour la mettre à jour depuis une autre conversation : publier `index.html` avec cette adresse en `url`.
- **Tout est imaginaire** : Au Pain Doré, Le Grimoire, Les Douceurs, Jade, Marcel, leurs nouvelles. Pas de pièces, pas
  de diamants : la seule monnaie, ce sont les figurines (elles ne s'achètent pas).
- **Les images** : les trois décors et les personnages reçus du propriétaire (Archive.zip du 2 novembre). Les
  personnages ont été détourés de leur fond uni par `outils/detourer.py` (GrabCut d'OpenCV, un rectangle autour du
  personnage, et des zones « sûrement le personnage » pour des cheveux gris sur fond gris) :

      python -I outils/detourer.py <image> <sortie.png> x0 y0 x1 y1 [x0 y0 x1 y1 …]

- **Les gestes** : toucher la porte pour sortir ; toucher un commerce (sa vitrine, sa figurine, son ardoise) : ton
  compagnon y va, sa fiche s'ouvre ; toucher un habitant ; toucher ton compagnon (ou « Envoyer en mission ») : tu
  choisis ce qu'il cherche, il part, revient avec son compte rendu ; glisser (ou ‹ ›) pour changer de lieu.
