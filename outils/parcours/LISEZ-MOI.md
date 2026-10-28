# Le parcours ClikMe — la page de démonstration

`parcours.html` : le parcours de bout en bout, de la vidéo à la porte (Camille d'un côté, Chez Bergine de l'autre, et
combien de personnes il reste à chaque étape, avec des hypothèses réglables). Commerce, chiffres et surprises inventés.

Publiée comme artefact claude.ai par le compte qui l'a faite : https://claude.ai/artifact/NWz5Qu2oo1tgavFRPazjBW .
Un autre compte ne peut pas la modifier (le partage « en modification » ne donne que la lecture) : il la publie sur
un nouveau lien depuis ce dossier, avec ses images (`hote.webp`, `m2.jpg`, `m4.jpg`, `si-interieur.webp`, `g/`).

Pour la regarder en local : un serveur de fichiers dans ce dossier, et l'encodage UTF-8 (la publication l'ajoute ;
`python3 -m http.server` ne le dit pas, et la page casse sur les accents).

L'étape « La cage dorée » (après « Elle entre dans la famille ») : la surprise du chef — la cage dorée se balance ;
on la touche, la porte s'ouvre et la surprise sort (« Un café gourmand ») ; « Je prends ça », et côté commerce le
stock baisse (2/2 → 1/2) et le nom de Camille s'affiche. Ses surprises : `SURPRISES` dans la page.

L'ordre de l'étape « Elle entre dans la famille » : la page (toucher une cage) → l'écusson (« Voir la famille ») → la
foule, où « 🎁 Une surprise t'attend » mène à la cage dorée. Le bouton WhatsApp n'est plus en grand : un petit lien
« 🔔 Me prévenir des bons plans sur WhatsApp » vient après la surprise prise, et mène à « Mike fait connaissance ».
À revoir avec le chantier 4 : cette étape montre encore Mike qui pose trois questions, alors que WhatsApp ne doit plus
servir qu'à prévenir (pas de robot qui converse).
