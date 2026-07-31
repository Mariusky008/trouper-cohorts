# Popey — concept, produit et état réel

> **Document de référence pour la rédaction d'un business plan et d'un plan de financement.**
>
> Il décrit ce que fait le produit, ce qui est réellement construit à ce jour, et ce
> qui ne l'est pas encore. La section « État de maturité » est la plus importante
> pour un plan de financement : **ne considérez comme acquis que ce qui y est marqué
> comme fonctionnel.** Tout le reste est une intention, pas un actif.
>
> Dernière mise à jour : juillet 2026 · Site : popey.academy

---

## 1. En une phrase

Popey transforme la fiche Google d'un commerçant local en un vrai site web, créé
sous ses yeux en une minute, offert — avec une assistante qui répond à ses clients
et publie ses annonces à sa place.

---

## 2. Le problème

Un commerçant de proximité — coiffeur, restaurateur, praticien bien-être, artisan —
a presque toujours une fiche Google. Il n'a presque jamais de site.

Trois conséquences concrètes :

1. **Il est vu mais pas identifiable.** Sa fiche donne un numéro et des horaires.
   Elle ne dit pas ce qu'il fait, comment il travaille, ni pourquoi venir chez lui.
2. **Ses visiteurs repartent anonymes.** Il ne sait pas qui a regardé ses photos,
   lu ses avis, hésité. Il n'a aucun moyen de les recontacter.
3. **Il répond au téléphone pendant qu'il travaille.** Les mêmes questions,
   dix fois par jour, au pire moment.

Les solutions existantes échouent sur le même point : elles demandent au commerçant
de **fournir le contenu**. Or il n'a ni le temps, ni le goût, ni l'habitude d'écrire.
Un éditeur de site, même gratuit, reste une page blanche.

---

## 3. Le concept

**On ne demande rien au commerçant. On lui montre le résultat d'abord.**

Ses avis Google, ses photos, ses horaires et son adresse sont déjà publics. On les
assemble en un site complet, personnalisé pour son métier, **avant même de lui
parler**. Il découvre son propre site en scannant un QR code. S'il le veut, il le
garde. Gratuitement.

Trois principes structurent tout le produit :

**a) La preuve avant la promesse.** On ne vend pas une fonctionnalité, on la montre
en train de fonctionner sur ses vraies données.

**b) L'honnêteté comme argument commercial.** Aucun chiffre inventé, aucun résultat
promis. Le produit vend un **mécanisme** (« votre annonce s'affiche »), jamais un
**résultat** (« vous remplirez vos créneaux »). C'est un choix stratégique, pas une
précaution : la cible a été échaudée par des vendeurs de site.

**c) Le gratuit doit être complet.** Le site offert n'est pas une version bridée.
Il est entier et utile seul. Les options payantes n'en débloquent pas des morceaux :
elles élargissent la diffusion.

---

## 4. Le parcours complet

### Étape 1 — Détection (automatisée)

Un scan Google Maps via Apify récupère les commerces d'une ville : nom, activité,
adresse, note, nombre d'avis, photos, présence ou absence de site web. Le système
qualifie les fiches et écarte celles qui ont déjà un site correct.

### Étape 2 — Génération de la maquette (automatisée)

Pour chaque prospect retenu, un site complet est généré à partir de ses données
réelles : photos Google, avis, horaires, adresse, téléphone. Les textes de
présentation viennent d'un catalogue par métier — **70 métiers** couverts, chacun
avec son vocabulaire, ses prestations types et ses questions fréquentes.

### Étape 3 — Contact physique (manuel)

Une lettre A4 est déposée en main propre. Elle est personnalisée : le nom du
commerce, sa note Google, son métier, et un constat propre à son secteur. Elle
porte un QR code unique.

Le canal est délibérément physique : c'est ce qui distingue Popey d'un démarchage
de plus, et ce qui rend crédible l'idée que quelqu'un a travaillé sur son cas.

### Étape 4 — Découverte (le moment de bascule)

Le commerçant scanne. Il arrive sur **son** site. Une assistante vocale — Léa — lui
présente en cinquante secondes ce qu'il a sous les yeux :

- le site se **construit devant lui**, bloc par bloc ;
- l'assistante apparaît et se pose à son emplacement ;
- il voit ce qu'elle fait quand il est occupé ;
- il teste l'**Action Flash** : dire une phrase, obtenir une annonce publiée ;
- on lui propose de le garder, gratuitement.

Un bandeau « côté pro » lui rappelle en permanence qu'il est en découverte.

### Étape 5 — Conversion

Un formulaire : prénom, numéro. Rien d'autre. Le lead déclenche une alerte
multi-canal (e-mail, SMS, WhatsApp) et le commerçant est rappelé pour vérifier ses
informations.

### Étape 6 — Mise en ligne (manuelle aujourd'hui)

Un opérateur publie le site depuis l'administration. Le commerçant reçoit alors un
SMS avec l'adresse de son site et celle de son espace de gestion. Un domaine
personnalisé peut être branché.

**À la publication, tout l'habillage de démonstration disparaît** : plus de visite
guidée, plus de bandeau « côté pro », plus d'exemples. Le site devient un vrai site,
adressé à ses clients.

### Étape 7 — Usage quotidien

Le commerçant accède à son **Espace Pro** par un lien privé à jeton, sans mot de
passe. Conçu comme une télécommande : pas de rubriques administratives, six grosses
actions qui répondent à « qu'est-ce que je veux faire maintenant ? ».

---

## 5. Le produit — le site du commerçant

| Bloc | Contenu | Source |
|---|---|---|
| Couverture | Photos, nom, métier, ville, note Google, badge « ouvert / fermé » calculé en temps réel | Google |
| Assistante | Bulle permanente, répond aux questions, prend les demandes | Produit |
| Suivre ce commerce | Le visiteur s'abonne pour être prévenu des disponibilités et offres | Produit |
| Mon approche | Paragraphe de présentation | **Écrit ou validé par le commerçant** |
| Pour quoi venir me voir | Motifs cliquables qui pré-qualifient la demande | Métier, éditable |
| Catalogue | Prestations et tarifs | **Saisis par le commerçant** |
| Avis | Avis Google réels, avec lien vers la fiche | Google |
| Horaires & accès | Horaires, adresse, itinéraire | Google |
| Avant de venir | Questions fréquentes | Métier, éditable |
| Réservation | Page de créneaux si l'agenda est configuré | Produit |

**Règle tenue partout :** aucun tarif, aucune prestation, aucun texte à la première
personne n'est publié sans que le commerçant l'ait saisi ou validé. Un site en ligne
dont le propriétaire n'a rien relu affiche **moins** de sections, jamais du contenu
inventé à sa place.

---

## 6. Le produit — l'Espace Pro

### Accueil
Statut de mise en ligne (en ligne / en attente, avec l'adresse réelle), six grandes
actions, trois chiffres du jour, et ce qui reste à traiter.

### Demandes reçues
Les personnes qui ont laissé leurs coordonnées via l'assistante. Rappel en un geste,
WhatsApp, marquage « traité ». Le commerçant reçoit un SMS à chaque nouvelle demande.

### Action Flash — l'annonce en quatre temps
Le module central. Le commerçant dit une phrase (« il me reste 4 places jeudi »),
l'IA en fait une annonce prête à publier, en **trois tons au choix** (direct,
chaleureux, court). Il relit, corrige, publie. L'annonce s'affiche en tête de son
site.

Garde-fous : l'IA n'invente aucun prix, date ni chiffre — si une information manque,
elle laisse un crochet à compléter. Plafond de **3 campagnes par jour** pour éviter
la sur-sollicitation.

### Agenda
Plages de disponibilité par jour (jusqu'à 4 par jour), génération des créneaux
réservables, liste des rendez-vous reçus.

### Clients & avis
Liste opt-in de clients consentants. Demande d'avis Google en un clic (message
pré-rempli, envoi natif depuis le numéro du commerçant). Les abonnés venus du site
sont distingués, avec leurs centres d'intérêt.

### Mon site
Édition sur une seule page : Mon approche · Motifs · Prestations · FAQ · Galerie ·
Réponses de l'assistante. Assistance IA pour transformer une phrase en contenu
structuré.

### Affiche
Une affiche imprimable avec QR code, à poser en caisse.

---

## 7. Le cadre déontologique — un actif, pas une contrainte

Le produit **refuse** certaines fonctionnalités selon la profession, y compris quand
l'utilisateur les demande. Trois profils, appliqués côté serveur (pas seulement dans
l'interface) :

| Profil | Métiers | Avis | Sollicitation | Liste de contacts |
|---|---|---|---|---|
| **A** | Commerce, beauté, restauration, bien-être non réglementé, artisanat | Affichés | Autorisée | Autorisée |
| **B** | Santé praticité | Affichés, sobrement | Interdite | Interdite |
| **C** | Santé encadrée, droit | Jamais | Interdite | Interdite |

Un praticien de santé ne peut pas constituer de liste de clients ni relancer sur un
créneau libéré, même avec un jeton valide : l'API le refuse. Les sites concernés
n'affichent aucun avis, et un encart d'urgence apparaît sur les métiers du psychisme.

**Consentement.** Toute inscription passe par une case décochée et une phrase qui
nomme le commerce et l'usage du numéro. Cette phrase exacte est archivée avec son
horodatage. Chaque contact dispose d'un lien de désinscription permanent, et un
numéro désinscrit ne peut pas être réinscrit silencieusement.

C'est un différenciant défendable face à des acteurs qui vendent la même chose à
tout le monde sans distinction.

---

## 8. Modèle économique

### Ce qui est offert
Le site complet, l'assistante, l'Action Flash sur le site, l'Espace Pro, la
réservation, l'hébergement. Sans limite de durée, sans engagement.

### Ce qui est payant — **29 €/mois, sans engagement**
La diffusion **au-delà du site** :
- prévenir ses clients par WhatsApp ;
- publications Facebook et Instagram préparées ;
- lien de réservation traçable dans les annonces.

### La logique
Le gratuit crée l'usage et la dépendance douce (son site, ses clients, ses annonces
sont chez nous). Le payant ne débloque rien qui existait déjà : il élargit la portée,
au moment où le commerçant constate qu'une annonce publiée seulement sur son site
touche peu de monde.

### ⚠️ Points à trancher dans le business plan
- **Aucun flux de paiement n'existe à ce jour.** Le parcours enregistre une
  *demande d'activation Pro* et prévient le vendeur. La souscription, la
  facturation et la gestion d'abonnement restent à construire.
- **Aucune des options Pro n'est implémentée.** Ni envoi WhatsApp de masse, ni
  publication sur les réseaux. Le prix de 29 € est un prix affiché, jamais encaissé.
- **Le taux de conversion gratuit → payant est inconnu.** Aucune donnée réelle.

---

## 9. Le catalogue de la ville (« Le Collectif »)

**Intention produit :** les annonces du jour de tous les commerçants d'une ville
sont rassemblées sur **une seule page** (`/ville/{ville}`), triée de la plus fraîche
à la plus ancienne. Chaque site de commerçant en montre une **fenêtre** — un aperçu
de trois annonces et un lien vers la page complète. Inclus et gratuit.

Le choix du catalogue plutôt que d'une diffusion croisée « votre annonce sur cinq
sites partenaires » est structurant : la diffusion croisée suppose cinq commerces
appariés et actifs avant de produire le moindre effet, alors que le catalogue existe
dès le deuxième commerçant.

**État réel :** implémenté, côté serveur (`src/lib/site-internet/collectif.ts`).

- `cityOffers()` alimente la page ville : toutes les annonces en cours, triées par
  fraîcheur, sans plafond arbitraire.
- `partnerOffers()` alimente la fenêtre sur le site d'un commerçant : mêmes règles,
  plus une **règle de complémentarité** (jamais deux commerces du même métier), et
  limitée à quatre.
- **Déontologie** appliquée dans les deux cas : les professions réglementées (santé
  encadrée, droit) n'entrent jamais dans le catalogue.
- **Retrait possible** : `collectif_actif = false` retire le commerce du catalogue
  *et* la fenêtre de son site (qui ne partage pas ne reçoit pas).
- Ce qui circule : nom, métier, texte de l'annonce, lien vers le site. Aucune donnée
  de client, jamais.

La page a deux étages : les annonces du moment (triées par fraîcheur) puis les
fiches des commerces qui n'ont rien annoncé. Sans le second, la page restait vide
tant que personne n'avait publié — et une page vide ne ramène personne.

**L'abonnement ville** (construit) : un habitant laisse son e-mail sur la page de sa
ville et reçoit les annonces. Double opt-in — rien ne part avant le clic de
confirmation — et deux règles écrites dans le code, pas dans la promesse :
**un e-mail par jour au maximum**, et **jamais d'e-mail vide** (s'il n'y a rien de
publié depuis le dernier envoi, le digest ne part pas). Lien de désinscription dans
chaque message, valable sans connexion. Cron quotidien à 9 h UTC.

E-mail et non SMS, pour une raison de coût autant que de confort : un SMS coûte
~0,06 € pièce, soit ~600 €/mois à 300 abonnés quotidiens, avant le moindre revenu.

**Ce qui reste à valider :** la demande côté habitants. Le mécanisme existe ; rien
ne prouve encore que des gens s'inscrivent, ni qu'ils ouvrent.

---

## 10. Socle technique

**Application :** Next.js 16 (App Router), TypeScript, déploiement Vercel.
**Données :** Supabase (PostgreSQL). Une table centrale décrit chaque site ; des
tables satellites gèrent contacts, disponibilités, rendez-vous, demandes, campagnes.

**Fournisseurs externes — les vrais postes de coût variable :**

| Fournisseur | Usage | Modèle de coût |
|---|---|---|
| **Apify** | Scan Google Maps : fiches, photos, avis | À l'usage, par prospect scanné |
| **Anthropic (Claude)** | Rédaction d'annonces, contenus de site, routage de l'assistante, chat | À l'usage, par appel |
| **OpenAI / ElevenLabs** | Voix de la visite guidée | À l'usage, par démonstration |
| **Twilio** | SMS et WhatsApp (alertes commerçant, notifications) | Au message |
| **Resend** | E-mails de notification | Au message |
| **Supabase + Vercel** | Hébergement, base de données | Abonnement + usage |

**À noter pour le plan de financement :** ces coûts sont majoritairement liés à
l'**acquisition** (scan, génération, démonstration vocale), pas à l'usage courant.
Un site gratuit qui tourne coûte peu ; c'est le prospect qu'on démarche qui coûte,
qu'il convertisse ou non.

**Coût non technique le plus lourd : le temps humain.** Impression et dépôt des
lettres, appel de qualification, vérification des informations, publication
manuelle. C'est le facteur limitant du modèle actuel, et le premier candidat à
l'automatisation ou à l'embauche.

---

## 11. État de maturité

### ✅ Fonctionnel et éprouvé
- Détection et qualification des prospects via Google Maps
- Génération automatique de la maquette (70 métiers, 3 profils déontologiques)
- Lettre personnalisée avec QR code
- Site de démonstration complet avec visite guidée vocale
- Bascule démonstration → site en ligne (retrait de tout l'habillage)
- Espace Pro complet : accueil, annonces, agenda, clients, demandes, édition du site
- Rédaction d'annonces par IA, en trois tons
- Inscription des visiteurs avec consentement conforme et désinscription
- Notifications SMS au commerçant (demande reçue, mise en ligne)
- Réservation en ligne avec agenda réel
- Garde-fous déontologiques appliqués côté serveur

### 🔧 Fonctionnel mais manuel
- Publication du site (action opérateur)
- Dépôt des lettres, appel de qualification, vérification des informations
- Aucun parcours d'inscription autonome : **100 % de l'acquisition est sortante**

### ❌ Non construit
- **Facturation et abonnement** (le 29 € n'est encaissable par aucun mécanisme)
- **Publication automatique sur Facebook / Instagram** : impossible sans compte Meta
  connecté. L'Espace Pro fabrique le visuel 1080×1080 et les légendes, et ouvre la
  feuille de partage du téléphone — la publication reste un geste du commerçant.
- **Envoi WhatsApp de masse depuis nos serveurs** : volontairement non construit.
  L'envoi part du numéro du commerçant (liste de diffusion native), avec un
  parcours de constitution de liste et des garde-fous anti-bannissement.
- Statistiques d'usage détaillées pour le commerçant
- Application mobile

### 📊 Données commerciales réelles
**Aucune à ce jour.** Pas de commerçant payant, pas d'historique de conversion, pas
de taux de rétention. Tout chiffre de conversion dans un business plan sera une
hypothèse à assumer comme telle.

---

## 12. Ce qu'un business plan devra trancher

1. **Le coût d'acquisition réel.** Combien coûte un client, tout compris — scan,
   impression, déplacement, appel, publication ? Le modèle repose sur une lettre
   déposée en main propre : c'est son avantage concurrentiel **et** son plafond de
   croissance.

2. **Le point de bascule du gratuit.** À partir de combien de sites gratuits les
   coûts fixes deviennent-ils insoutenables sans revenus ? Cette date est le vrai
   besoin de financement.

3. **Ce qu'on finance en priorité.** Trois candidats qui ne se valent pas :
   - la **facturation** (débloquer le revenu, mais sur des options non construites) ;
   - les **options Pro** (rendre le 29 € légitime) ;
   - l'**acquisition d'abonnés au catalogue** (le pari différenciant : le mécanisme
     d'envoi existe, il reste à faire venir les habitants).

4. **Le modèle de déploiement géographique.** Le catalogue de ville n'a de sens que
   par densité locale. Vaut-il mieux 500 commerçants dans une ville, ou 500 répartis
   en France ? Le produit est prêt pour les deux ; le modèle économique n'implique
   pas la même chose.

5. **La dépendance à Google.** Toute la proposition de valeur part de données
   Google Maps récupérées par scraping. C'est un risque d'exécution à nommer.

---

## 13. Résumé pour un lecteur pressé

- **Ce qui existe et fonctionne :** une chaîne complète qui va du scan d'une ville
  au site en ligne géré par le commerçant. C'est solide, testable aujourd'hui, et
  ça respecte des contraintes déontologiques que peu de concurrents s'imposent.
- **Ce qui n'existe pas :** de quoi encaisser de l'argent, et les fonctionnalités
  qui justifieraient de le faire.
- **Le vrai sujet du financement :** tenir la gratuité assez longtemps pour
  construire l'usage, tout en développant ce qui la rendra rentable.
