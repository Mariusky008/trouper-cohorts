# L'expérience restaurant depuis l'espace commerçant

Ce document est le mode d'emploi pour brancher la page de l'espace commerçant
(`/site-internet/pro/[slug]`) sur l'expérience restaurant en 3 étapes de sa page
ClikMe.

## Ce que le restaurateur donne

| Champ | Où ça sert sur sa page |
|---|---|
| **Nom du plat**, **prix** | Étape 2 : « Magret · Frites maison », « 19 € » |
| **Photos du plat** (1 à 4) | Étape 2 : la scène est fabriquée à partir de la **première** |
| **Son mot enregistré** (`voix`) et ce qu'il a dit (`voixTexte`) | Étape 2 : on entend **sa vraie voix** ; le texte s'affiche en deux tons |
| Une phrase écrite (`phrase`, facultatif) | Remplace `voixTexte` à l'écran s'il préfère l'écrire |
| La partie en rose (`phraseFort`, facultatif) | La fin de la phrase en rose ; sans elle, l'écran coupe la phrase au milieu |
| **Durée** (`jours`) | « 1 » = jusqu'à ce soir 23 h 59 (heure de Paris) ; passé ce délai, le plat disparaît de sa page |
| **Photo du cuisinier** | Étape 3 : le fantôme y est assis à table |

La salle de l'étape 1 est la même pour tous les restaurants : rien à donner.

## Ce que fait le serveur

1. Ses photos sont rangées chez nous (1 600 px au plus).
2. Le moteur d'images fabrique deux scènes d'après les maquettes :
   - la **scène du plat** : son assiette sur une table de bistro, son fantôme assis derrière, son nom brodé sur la casquette et le tablier (maquette 2) ;
   - la **scène du cuisinier** : sa photo, et le fantôme assis à table à droite, qu'on ne voit qu'à moitié (maquette 3).
3. Chaque scène prend **une à trois minutes**. Tant qu'elle n'est pas prête, sa page montre sa photo d'origine.
4. En cas d'échec, le moteur réessaie : 3 essais à 10 minutes d'écart, puis 1 par jour.

**Le moteur redessine la photo** : le plat peut légèrement changer (forme des
frites, sauce…). Le restaurateur doit donc **voir chaque scène** et pouvoir la
**refuser** : sa page reprend alors sa photo d'origine.

## L'API — `/api/site-internet/pro/experience`

Même jeton que le reste de l'espace (`slug` + `token`, comme `ProGallery`).

### Lire l'état

```js
const r = await fetch(`/api/site-internet/pro/experience?slug=${slug}&token=${token}`, { cache: "no-store" });
const { experience, montree } = await r.json();
```

- `montree.plat` / `montree.chef` : l'image que **sa page montre en ce moment** (la scène si elle est prête et pas refusée, sinon sa photo).
- `experience.plat` : `{ nom, prix, photo, photos, voix, voixTexte, voixSecondes, phrase, phraseFort, fin }` — `photo` est **sa** photo d'origine (la première de `photos`), `voix` l'adresse de son enregistrement, `fin` la date ISO de fin.
- `platEnLigne` : `false` une fois la fin passée (sa page ne montre plus le plat).
- `experience.chef` : `{ photo }`.
- `experience.scenePlat`, `experience.sceneChef` :
  - `etat` : `attente` → `en-cours` → `prete`, ou `echec` (avec `erreur`), ou `refusee` ;
  - `url` : la scène ;
  - `source` : la photo dont elle est faite.

Pour voir une scène arriver, relire toutes les 5 à 10 secondes tant que `etat` vaut `attente` ou `en-cours`.

### Poser le plat et/ou la photo du cuisinier

```js
await fetch("/api/site-internet/pro/experience", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    slug, token, action: "poser",
    plat: {
      nom: "Magret frites maison",
      prix: "19 €",
      photos: ["data:image/jpeg;base64,…", "data:image/jpeg;base64,…"], // 1 à 4 ; ou `photo` seule
      voix: "data:audio/webm;codecs=opus;base64,…",   // son mot, tel que le comptoir l'enregistre
      voixTexte: "Ce plat, c'est celui que je cuisine quand mes amis viennent manger.",
      voixSecondes: 6,
      jours: 1,                                         // ou `fin` : ISO ou millisecondes (le `finLe` du comptoir)
    },
    chef: { photo: "data:image/jpeg;base64,…" },
  }),
});
```

- On peut n'envoyer que `plat` ou que `chef`.
- `plat: null` ou `chef: null` les **retire**.
- Une **photo neuve** lance une scène neuve. Changer le nom, le prix ou la phrase garde la scène.
- Photos : `data:image/jpeg|png|webp|heic`, ou une adresse https. **La même photo renvoyée ne refait pas la scène** (elle est rangée sous son empreinte) : republier tout le plat pour corriger un prix ne coûte rien.
- Voix : `data:audio/webm|mp4|ogg|mpeg|aac|wav` (3 Mo au plus), exactement ce que rend `voix-micro.ts`. Elle est rangée telle quelle. Un téléphone qui ne sait pas lire le fichier (un iPhone devant le webm d'un Android) entend à la place `voixTexte`, dit par sa voix clonée (sa voix standard s'il ne l'a pas donnée), puis par la voix du téléphone en dernier recours.
- **Taille d'une requête : 4,5 Mo au plus** (limite de Vercel). Les photos réduites du comptoir (1 000 px) et un mot de dix secondes y tiennent largement ; au-delà, envoyer le plat et la photo du cuisinier en deux appels.

La réponse a la même forme que la lecture.

### Décider d'une scène

```js
body: JSON.stringify({ slug, token, action: "refuser", quoi: "plat" })   // ou "chef"
```

| `action` | Effet |
|---|---|
| `refuser` | Sa page reprend sa photo d'origine. La scène est gardée. |
| `reprendre` | La scène revient sur sa page. |
| `refaire` | Le moteur en fait une autre. Sa photo d'origine est montrée en attendant. |

Réponse `409` avec `erreur` quand l'action n'a pas de sens (par exemple, refuser une scène pas encore faite).

## Ce qu'on suggère d'afficher

Pour chaque scène :
- la photo d'origine et la scène côte à côte ;
- un texte clair : « Le moteur a recomposé votre photo : vérifiez que c'est bien votre plat. » ;
- trois boutons : **Garder la scène**, **Garder ma photo** (`refuser`), **En refaire une** (`refaire`) ;
- un lien « Voir ma page » vers `/site-internet/apercu/{slug}`, onglet Expérience.
