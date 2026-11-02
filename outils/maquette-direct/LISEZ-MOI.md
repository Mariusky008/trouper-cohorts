# Dax en direct — maquette v2 de la ville vivante (2 novembre)

Après la première maquette (`../maquette-rue/`, « ça fait jeu des années 90, plat, sans âme »), le principe change :
la vie vient du vrai qui bouge et qui change, pas du décor. https://claude.ai/artifact/Fg4homovg9e4oEEcA33rsr
(privée, partage depuis son menu ; depuis une autre conversation : publier `index.html` avec cette adresse en `url`).

- **Les vitrines jouent leur vidéo du jour** (celles des démos : Chez Bergine, L'Atelier de Nina, Le Cocon d'Élise ;
  12 s, MP4 pour l'iPhone, WebM pour les Chromium sans H.264). On en touche une : elle s'ouvre en plein écran, comme
  un live.
- **Les vraies figurines** (Jean-Marie, Nina, Élise, Léa, et la tienne — « Toi ») sur leurs ressorts, qui **parlent
  avec leurs voix enregistrées** (celles des démos) : la bouche suit la voix, minutée à l'avance (`BOUCHES`, une case
  = 1/25 s, mesurée par ffmpeg).
- **Ce qui se passe tout seul** : le fil en haut, les réactions qui s'envolent, « Léa vient d'en prendre une », le
  stock qui baisse (jamais jusqu'à zéro : la dernière est pour toi), le compteur des fantômes du jour.
- **La ville change** : selon l'heure (matin, midi, soir, nuit : la lumière, qui est dans la rue, quelles vitrines
  passent en premier, fermées la nuit) et la saison (Noël : les figurines dans leur édition de Noël, la neige).
- **Tout est simulé et le dit** : réactions, stocks, passages. Dans le vrai produit, uniquement du réel.

Les figurines ont été détourées de leur fond rose par `../maquette-rue/outils/detourer-paire.py` (le même masque pour
la bouche fermée et la bouche ouverte, et le fond retiré entre les spires du ressort).
