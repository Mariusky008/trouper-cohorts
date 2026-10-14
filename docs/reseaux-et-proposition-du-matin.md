# 📣 Ses réseaux sociaux + ☀️ la proposition du matin

> « Une photo, et vous êtes partout. »

Deux choses sont arrivées au comptoir du commerçant (`/p/<jeton>`) :

1. **Mes réseaux** : il connecte une fois son Instagram, sa page Facebook et sa fiche Google. Ensuite, chaque
   annonce publiée au comptoir part dans Le Direct, sur sa page **et** sur ses réseaux. Il n'ouvre plus
   aucune de ces applications. Il n'y a pas de réponses automatiques aux commentaires : c'est voulu.
2. **La proposition du matin** : chaque matin, son fantôme choisit une pièce de sa vitrine et la lui
   propose, prête à publier. Il touche « ✨ Oui, publie-la » et elle part partout.

---

## 1. Brancher l'intermédiaire (PostPeer)

Instagram, Facebook et TikTok ne laissent publier à la place de quelqu'un qu'une application qu'ils ont
auditée. PostPeer a déjà ces autorisations. Nous lui disons simplement « publie ça sur ces comptes ».

**À faire une fois :**

1. Créer le compte sur postpeer.dev et récupérer la **clé d'API**.
2. Sur Vercel → Settings → Environment Variables (Production) :
   - `POSTPEER_API_KEY` = la clé ;
   - facultatif : `RESEAUX_PLATEFORMES` = `instagram,facebook,googlebusiness` (valeur par défaut).
     PostPeer propose aussi LinkedIn (à ajouter : `…,linkedin`) et YouTube, inutile ici : YouTube
     n'accepte que des vidéos. **TikTok n'est pas chez PostPeer** (voir plus bas).
   - facultatif : `POSTPEER_BASE_URL` (par défaut `https://api.postpeer.dev/v1`).
3. **Redéployer** (Deployments → ⋯ → Redeploy). Une variable ajoutée sur Vercel n'atteint le site
   qu'au déploiement suivant : sans ça, la carte « Mes réseaux » reste cachée.

**Tant que la clé n'est pas posée**, rien ne change chez un vrai commerçant : la carte « Mes réseaux »
n'apparaît pas. Le comptoir de démonstration (`/autour-de-moi/assistante?metier=mode`) la montre
toujours, étiquetée « Exemple ».

### Tester avec un vrai commerçant

1. Ouvrir son comptoir (`/autour-de-moi/assistante?site=…&k=…`). La carte **📣 Mes réseaux** est dans la
   liste de l'accueil, sous « Mon planning ».
2. **Connecter** Instagram : un onglet s'ouvre sur la page de connexion. Se connecter avec le compte
   du commerce et accepter. PostPeer affiche alors sa propre page de fin (on ne peut pas lui faire
   ramener le commerçant chez nous).
3. Revenir à l'onglet du comptoir : il relit ses comptes tout seul (sinon, « C'est fait ✓ »).
   Instagram passe à « Connecté », et l'envoi s'allume.
4. Publier une annonce, par exemple avec « ✨ Oui, publie-la » sur la proposition du jour.
5. Rouvrir « Mes réseaux » une minute après : « ✓ Partie sur Instagram », ou le message exact du refus.
   Le tableau de bord PostPeer (Posts, Logs) montre la même chose de son côté.

Chaque publication consomme des crédits PostPeer. Le compte gratuit en donne 20 par mois.

### Ce qui n'a pas pu être vérifié

La documentation de PostPeer n'est pas joignable depuis l'atelier. Les chemins et les champs viennent
de ses extraits publics. Ils annoncent que le lien de connexion revient sous la forme `{ url }` et que
le paramètre de retour (`redirectUri`) n'existe pas : il est envoyé quand même, sans effet.

| Usage | Appel |
|---|---|
| Authentification | en-tête `x-access-key` |
| Profil du commerçant | `POST /profiles` |
| Lien de connexion | `GET /connect/{plateforme}?profileId=…&redirectUri=…` |
| Comptes connectés | `GET /connect/integrations?profileId=…` |
| Publication | `POST /posts` avec `{ content, platforms: [{ platform, accountId }], publishNow, mediaItems: [{ type: "image", url }] }` |

Chaque réponse est lue de façon défensive, et chaque refus remonte **avec le message de PostPeer** dans
l'écran « Mes réseaux » du commerçant (« ✗ Facebook : … »). Si quelque chose cloche au premier essai réel,
c'est là qu'on le voit, et ça se corrige dans `src/lib/reseaux/intermediaire.ts`.

**Premier essai conseillé** : sur ton propre commerce de test, connecte un Instagram professionnel, publie
une annonce depuis le comptoir, puis rouvre « Mes réseaux » pour lire le résultat.

### Ce qui part, et comment

- **Le texte** : ses mots (ceux de l'annonce), puis `📍 Nom · Ville`, le lien de sa page ClikMe et deux
  mots-dièse factuels (sa ville, son métier). Rien d'inventé.
- **La photo** est recadrée au format qu'Instagram accepte (entre 4:5 et 1,91:1, 1080 px, JPEG) et rangée
  dans notre stockage. PostPeer la récupère par son adresse.
- **« Il en reste ! » ne part pas** : elle dure deux heures, elle resterait des mois en haut de son fil.
- Les annonces **programmées** partent sur ses réseaux le jour venu, comme dans Le Direct.
- L'envoi se fait **après** la réponse : la fête de publication n'attend pas Instagram. Elle affiche
  « 📣 En route vers Instagram et Facebook », et le résultat réel s'affiche dans « Mes réseaux ».

### Limites des réseaux

- **Instagram** : il faut un compte **professionnel** (gratuit). La limite est de 100 publications par
  24 h.
- **Facebook** : c'est sa **page** qui publie, pas son profil perso.
- **Google (sa fiche Google Business)** : identifiant `googlebusiness`. PostPeer crée un compte par
  fiche. Si le compte Google du commerçant gère plusieurs fiches, l'annonce part sur toutes. Le post
  reçoit **ses mots seuls**, sans « 📍 nom · ville », sans lien et sans mots-dièse : il est déjà sur sa
  fiche, et Google n'aime pas les liens dans le texte. Il apparaît dans la recherche et sur Maps.
- **TikTok** : absent de PostPeer. Il existe chez d'autres intermédiaires (Ayrshare, selon ses propres
  pages). Le jour où il compte, le changement se fait dans `src/lib/reseaux/intermediaire.ts`
  seulement : le comptoir, la route et les données ne dépendent pas de PostPeer.

---

## 2. La proposition du matin

**Au comptoir** (rien à brancher) : quand rien n'est en ligne, la carte « ☀️ Ta proposition du jour »
apparaît en haut de l'accueil :

- **une pièce de sa vitrine** (photo, nom, prix), avec la raison du jour quand le calendrier en donne une :
  la fête des mères dans 10 jours, Halloween, le Black Friday, Noël, la rentrée…
- **« ✨ Oui, publie-la »** la publie tout de suite : Le Direct, sa page, ses réseaux.
- **« Voir avant »** ouvre le récapitulatif, pour changer le prix ou ajouter sa voix.
- **« Une autre »** en propose une autre ; celle-ci ne revient pas de la journée.
- **« Pas aujourd'hui »** range la carte jusqu'à demain.

Ensuite :

- **Restaurant et bar** : on ne devine pas son plat du jour. La carte n'apparaît que les jours où une date
  donne une raison (« Halloween dans 6 jours ! Ton plat du jour ? Une photo, et je m'occupe du reste. »).
- **Vitrine vide** : la carte lui demande d'y mettre quelques photos.
- **Rotation** : la pièce proposée est celle qu'on ne lui a pas proposée, ni qu'il n'a publiée, depuis le
  plus longtemps.
- **Calendrier** : il suit son pays. En France, la fête des mères tombe le dernier dimanche de mai (sauf
  Pentecôte) ; en Suisse et en Belgique, le deuxième dimanche de mai.

### Le message WhatsApp du matin (facultatif)

Il part chaque jour à 6 h 10 UTC (8 h 10 en été à Paris), et **seulement** aux commerçants qui ont coché
« 📲 Me l'envoyer chaque matin sur WhatsApp » sur leur carte. Cette case n'apparaît qu'une fois le
modèle posé.

**À faire une fois :**

1. Dans Twilio → Content Template Builder, créer un modèle WhatsApp (catégorie *Utility*), par exemple :

   > Bonjour {{1}} ☀️ Ta proposition du jour est prête : {{2}}. Un « oui » et elle part partout : {{3}}

   avec :
   - `{{1}}` = nom du commerce ;
   - `{{2}}` = la proposition en une ligne ;
   - `{{3}}` = lien de son comptoir.
2. Le faire approuver par WhatsApp.
3. Sur Vercel : `TWILIO_PROPOSITION_CONTENT_SID` = le SID du modèle (`HX…`). `TWILIO_ACCOUNT_SID`,
   `TWILIO_AUTH_TOKEN` et `TWILIO_WHATSAPP_FROM` sont déjà utilisés ailleurs.

Le numéro utilisé est celui de son espace pro (`whatsapp_phone_e164`), sinon celui qu'il nous a laissé.

---

## Où est le code

| Quoi | Fichier |
|---|---|
| Données partagées, légende | `src/lib/reseaux/reseaux-donnees.ts` |
| Appels à PostPeer, recadrage, envoi | `src/lib/reseaux/intermediaire.ts` |
| Route du comptoir | `src/app/api/site-internet/pro/reseaux/route.ts` |
| Écran « Mes réseaux » | `src/app/autour-de-moi/assistante/reseaux-comptoir.tsx` |
| Page de retour après connexion | `src/app/reseaux/connecte/page.tsx` |
| Branchement à la publication | `api/site-internet/pro/offer/route.ts` (`set`) et `lib/direct/planning-activation.ts` |
| Proposition : calendrier, choix | `src/lib/direct/proposition-matin.ts` |
| Proposition : route | `src/app/api/site-internet/pro/proposition/route.ts` |
| Proposition : carte | `src/app/autour-de-moi/assistante/proposition-comptoir.tsx` |
| Proposition : WhatsApp | `src/app/api/cron/proposition-matin/route.ts` |

Tout est rangé dans `diagnostic.reseaux` et `diagnostic.proposition_matin` : aucune migration.
