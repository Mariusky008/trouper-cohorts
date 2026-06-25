# KUDOS — Cahier des Charges Complet
> Version 1.0 — Chef de projet : Claude  
> Statut : Référentiel technique & produit

---

## 1. VISION PRODUIT

### Concept
Kudos est une **identité de confiance vivante**, construite par les personnes qui te connaissent. Pas des étoiles, pas des pseudos — des badges réels, validés par de vraies personnes.

> "Au départ, ton profil est vide. Chaque Kudos reçu révèle une nouvelle facette de ta personnalité. Avec le temps, ton identité de confiance se construit et évolue avec toi."

### Proposition de valeur unique
- **LinkedIn** donne de la crédibilité professionnelle
- **Airbnb** donne des reviews de séjour
- **Kudos** donne une réputation humaine complète, validée, partageable

### Cas d'usage principaux
1. 🏠 **Colocation** — candidater avec un dossier de confiance prouvé
2. 💼 **Freelance/Pro** — rassurer un client avant une mission
3. 🤝 **Social** — être mieux compris par les gens qu'on rencontre
4. 🏘 **Voisinage/Communauté** — tisser des liens de confiance locaux

---

## 2. DÉCISION TECHNOLOGIQUE

### Contraintes produit qui guident le choix
1. Les profils doivent être **consultables sans compte** (propriétaire qui reçoit un lien)
2. Les **push notifications** sont critiques (Kudos reçu, profil consulté)
3. Les **animations fluides** font partie de l'expérience (onboarding, Kudos moment)
4. Le **partage de lien** est le vecteur de croissance principal
5. **Time-to-market** : MVP en moins de 6 mois, équipe réduite

### Options analysées

| Stack | Avantages | Inconvénients | Score |
|---|---|---|---|
| Swift + Kotlin natif | Meilleures perfs, best UX | 2 codebases, coûteux, lent | 5/10 |
| React Native (Expo) | 1 codebase JS, App Store, near-native | Pas de profils web publics | 7/10 |
| Flutter | Animations parfaites, 1 codebase | Pas de web natif pour profils publics | 7/10 |
| **Next.js PWA + Supabase** | **Web-first, liens partageables, 1 dev suffit** | **Push notifs limitées iOS < 16.4** | **9/10** |
| Next.js PWA + Capacitor | Tout le dessus + App Store | Complexité wrapper | 8/10 |

### ✅ Recommandation : **Next.js 14 PWA + Supabase**

**Pourquoi :**
- Le lien partageable (`kudos.app/chloe`) est la feature la plus importante → web first obligatoire
- PWA installable sur iOS et Android (icône home screen, fullscreen, offline)
- Web Push Notifications natif depuis iOS 16.4 (mai 2023) — couvre 85%+ des utilisateurs
- Un seul développeur peut livrer le MVP complet
- SEO naturel sur les profils publics (propriétaire qui googlee le nom)
- **Phase 2** : wrapper Capacitor/Expo pour App Store si nécessaire

### Stack technique retenu

```
Frontend    : Next.js 14 (App Router) + TypeScript
UI          : Tailwind CSS + Framer Motion (animations)
Backend     : Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
Auth        : Supabase Auth (OTP SMS via Twilio)
Notifs push : Web Push API (Vapid) via Supabase Edge Functions
Media       : Supabase Storage (photos profil, PDF générés)
PDF         : Puppeteer ou react-pdf (génération dossiers)
Analytics   : PostHog (open source, RGPD-compliant)
Deploy      : Vercel (frontend) + Supabase Cloud (backend)
Domaine     : kudos.app
```

---

## 3. ARCHITECTURE BASE DE DONNÉES (Supabase/PostgreSQL)

```sql
-- UTILISATEURS
users
  id uuid PK
  phone varchar(20) UNIQUE
  name varchar(100)
  bio text
  avatar_url text
  city varchar(100)
  verified boolean
  created_at timestamp
  last_seen timestamp

-- BADGES CATALOGUE
badges_catalog
  id uuid PK
  emoji varchar(10)
  name varchar(50)
  category enum('vie','pro','humain','voisin')
  is_official boolean

-- KUDOS ENVOYÉS
kudos
  id uuid PK
  sender_id uuid FK → users
  receiver_id uuid FK → users
  badge_id uuid FK → badges_catalog
  custom_badge_name varchar(50)    -- si badge custom
  custom_badge_emoji varchar(10)
  message text                      -- témoignage personnel
  relation enum('coloc','collegue','ami','voisin','autre')
  duration enum('1m','6m','2a','2a+')
  created_at timestamp
  is_public boolean

-- CONTACTS (réseau validé)
contacts
  id uuid PK
  user_a uuid FK → users
  user_b uuid FK → users
  status enum('pending','accepted','rejected')
  created_at timestamp
  UNIQUE(user_a, user_b)

-- MESSAGES
messages
  id uuid PK
  contact_id uuid FK → contacts
  sender_id uuid FK → users
  text text
  created_at timestamp
  read_at timestamp

-- NOTIFICATIONS
notifications
  id uuid PK
  user_id uuid FK → users
  type enum('kudos_received','profile_viewed','contact_request','badge_unlocked','match')
  data jsonb                        -- payload flexible
  read boolean
  created_at timestamp

-- PROFILE VIEWS
profile_views
  id uuid PK
  profile_id uuid FK → users
  viewer_fingerprint text           -- anonyme si pas connecté
  source enum('direct','link','search','qr')
  duration_sec integer
  created_at timestamp

-- BADGES UTILISATEUR (agrégat)
user_badges
  id uuid PK
  user_id uuid FK → users
  badge_id uuid FK → badges_catalog
  custom_name varchar(50)
  custom_emoji varchar(10)
  count integer                     -- nb de validateurs
  first_kudos_at timestamp          -- pour "depuis X ans"
  last_kudos_at timestamp
  is_public boolean
```

---

## 4. PAGES & FONCTIONNALITÉS — INVENTAIRE COMPLET

### PAGE 1 : ONBOARDING

**URL** : `/` (si non connecté)

**Fonctionnalités :**
- [x] Animation de révélation : cercle `?` → badges pop séquentiels → photo → archétype
- [x] Message de transformation ("Au départ ton profil est vide...")
- [x] Compteur par badge ("20 personnes")
- [x] Cas d'usage : 🏠 Coloc / 💼 Confiance / 🤝 Compris
- [x] Input numéro de téléphone avec flag 🇫🇷
- [x] CTA "✨ Rejoindre Kudos"
- [x] Skip "Voir la démo sans s'inscrire"

**Flows :**
1. `Saisie téléphone` → OTP SMS → création compte → profil vide
2. `Skip` → démo mode (profil Chloé)

---

### PAGE 2 : PROFIL (`/profil` ou `/[username]`)

**Deux modes :**
- **Mon profil** : vue complète avec CTAs
- **Profil public** (`kudos.app/chloe`) : vue lecture seule, sans compte requis

**Composants :**

#### Hero photo
- Photo pleine largeur (155px)
- Bouton `···` → Export sheet
- Dégradé bas pour lisibilité

#### Reputation Card
- Avatar flottant (58px) avec badge ✓ vérifié
- Nom complet
- Archétype : `🌟 La Perle de coloc` (calculé dynamiquement)
- **22 évaluations** (nombre validateurs uniques)
- Top 5% Montpellier (percentile local)
- Phrase identité : *"La colocataire idéale : bienveillante, propre et toujours à l'écoute."*
- 4 barres de traits horizontales avec % et couleurs distinctes

#### CTAs (juste sous la rep card)
- `✨ Envoyer un Kudos à [prénom]` → Badge Picker
- `📤 Demander un avis sur moi` → Request Sheet

#### Section Badges
- Header : "Ses qualités · validées par la communauté"
- 4 badges principaux en pills : `emoji | nom | count · durée`
- Durée : "ce mois" (vert), "2 ans", "8 mois"...
- Bouton "Voir les 12 autres badges →"
- Expand : 12 badges supplémentaires en pills

#### Bottom nav (5 onglets)

---

### PAGE 3 : ACTIVITÉ / FEED (`/activite`)

**3 sous-onglets :**

#### Onglet Notifs
| Notification | Déclencheur | Action |
|---|---|---|
| 👁 Profil consulté X min | Lien partagé visité | `openProfileViewedSheet()` |
| ❤️ Kudos reçu de Pierre | Pierre envoie badge | `openKudosMoment()` |
| 🤝 Kudo Match | 2 personnes se valident mutuellement | Toast / sheet |
| 🔥 Badge viral | Badge trending | Toast |
| 🔒 Débloquer badge mystère | Proche du seuil | Unlock sheet |
| 📤 Validation demandée | Quelqu'un demande | Validation sheet |

#### Onglet Kudos reçus
- Historique de tous les Kudos reçus avec sender, badge, date

#### Onglet Matchs
- Profils avec lesquels il y a validation mutuelle

#### Kudos Moment (overlay plein écran)
- Fond sombre dégradé
- Avatar sender + "Pierre pense que tu es"
- Badge animé (emoji 40px + nom)
- Message personnel cité
- `✨ Remercier Pierre` / `Plus tard`

#### Profile Viewed Sheet
- "Un propriétaire a consulté pendant 2 min · Montpellier"
- Barres : archétype 48s / badges 52s / PDF 22s
- Conseil actionnable : "Demande 2 Kudos supplémentaires"
- CTA : "📤 Demander plus de Kudos"

---

### PAGE 4 : CONTACTS & MESSAGES (`/contacts`)

#### Vue liste contacts
- Barre de recherche (filtre en temps réel)
- Par contact :
  - Avatar + indicateur online
  - Nom + last message + time
  - Dernier badge reçu
  - Badge count non lus

#### Vue chat
- Header : retour + avatar (cliquable → profil) + statut + boutons `Profil` et `✨ Kudos`
- Bulles messages (sent/received)
- Marqueur date
- Tick ✓✓ pour messages envoyés
- Input + bouton envoi (Enter ou clic)

#### Profil contact (sheet)
- Photo + nom + statut
- Top 4 badges en pills
- Stats : Kudos / Contacts / Percentile ville
- CTA : "✨ Envoyer un Kudos"

---

### PAGE 5 : RECHERCHE (`/recherche`)

**Composants :**
- Barre de recherche full-width
- Filtres : Tous / 🏠 Coloc / 💼 Pro / 🎓 Campus / 🏘 Voisinage
- Résultats :
  - Avatar + nom + ville + archétype + badges + match%
  - Bouton `➕ Ajouter` → Request contact
  - Click profil → Sheet détail complet

#### Sheet profil recherche
- Hero dégradé + avatar + nom + ville + archétype
- % match en grand
- "🎯 Pourquoi ce match ?" avec raisons listées
- Ses badges en pills
- CTA : `➕ Envoyer demande de contact` / `💬 Message`

---

### PAGE 6 : TRENDING (`/trending`)

**Composants :**
- Titre "🔥 Trending [ville]"
- Classement badges de la semaine :
  - Rang + emoji + nom + catégorie + nb envois
  - Barre de progression remplie
  - Stats (nb personnes, rang local)
  - Bouton `Envoyer` → Badge Picker
- Section "Tu es dans le top 5% de [ville]"

---

### SHEETS TRANSVERSAUX

#### Badge Picker
- Onglets catégories (Vie / Pro / Humain / Voisinage)
- Grille de 9 badges par catégorie
- Recherche en temps réel
- Emoji picker custom
- Champ nom custom (28 chars max)
- Sélection relation (Coloc / Collègue / Ami / Voisin / Autre)
- Sélection durée (< 1 mois / 1-6 mois / 6m-2 ans / + 2 ans)
- Textarea message personnel
- Validation : badge + relation + durée obligatoires
- Envoi → animation burst + toast + ajout feed

#### Badge Detail
- Nom + emoji + count + durée
- Liste témoignages (avatar, nom, relation, date, texte)
- Reply form (toggle, validation, post)
- Témoignages cachés (contacts uniquement)

#### Export / Partage profil
- Preview carte publique style Apple Wallet (fond sombre, photo, archétype, badges)
- `🔗 Copier mon lien public` (CTA principal)
- Options secondaires : 💬 WhatsApp / 📄 PDF / 📸 Story

#### Dossier de Confiance PDF
- 3 templates : Colocation / Freelance-Pro / Complet
- Preview visuelle de chaque template
- Contenu : photo, badges avec barres, validateurs, QR code
- Bouton download + partage WhatsApp

#### QR Code
- QR généré en temps réel
- Lien copiable
- Partage : Story / WhatsApp / Sauver

#### Kudos Wrapped
- Carte annuelle partageable (gradient bleu sombre)
- Stats : Kudos reçus / Validateurs / Percentile
- Archétype + top badges
- Partage : Instagram / WhatsApp / Copier lien / Download PNG (Canvas API)

#### Demander un avis
- Sélection badge cible
- Méthode : SMS / WhatsApp / Lien / Email
- Input contact adaptatif
- Envoi → toast + feed item

---

## 5. RÈGLES MÉTIER ANTI-GAMING

1. **Un Kudos = déclaration obligatoire** de relation (type + durée)
2. **Réseau fermé** : on ne peut voir que les profils de gens qu'on a invité ou qui nous ont invité
3. **Témoignages cachés** partiellement pour les non-contacts
4. **Badge mystère** : nécessite 3 validations minimum pour se débloquer
5. **Durée = preuve** : un badge "depuis 2 ans" crée une crédibilité impossible à fabriquer rapidement
6. **Modération admin** : signalement de badge + avis négatifs envoyés à l'admin

---

## 6. PLAN DE SPRINTS

### Vue d'ensemble

| Sprint | Durée | Thème | Livrables |
|---|---|---|---|
| S0 | 1 sem | Setup | Projet initialisé, CI/CD, DB |
| S1 | 2 sem | Auth & Onboarding | Inscription SMS, animation onboarding |
| S2 | 3 sem | Profil | Reputation card, badges, partage lien |
| S3 | 2 sem | Envoyer Kudos | Badge picker complet, témoignage, feed |
| S4 | 2 sem | Activité & Notifs | Feed, Kudos moment, profil consulté |
| S5 | 3 sem | Contacts & Chat | Contacts, messagerie temps réel |
| S6 | 2 sem | Recherche | Search, filtres, match, demande contact |
| S7 | 2 sem | Dossier & Export | PDF, Wrapped, QR, partage |
| S8 | 1 sem | Trending | Classement local, gamification |
| S9 | 2 sem | PWA & Push | Install prompt, web push notifs, offline |
| S10 | 2 sem | Beta & Launch | QA, invite 50 bêtas, fix bugs, launch |

**Total : 22 semaines (~5,5 mois)**

---

### SPRINT 0 — Setup & Infrastructure (1 semaine)

**Objectif :** Environnement de développement 100% opérationnel

- [ ] Créer repo GitHub `kudos-app`
- [ ] Init Next.js 14 + TypeScript + Tailwind
- [ ] Setup Supabase project (prod + staging)
- [ ] Créer toutes les tables SQL (cf. schéma §3)
- [ ] Setup Row Level Security (RLS) Supabase
- [ ] Setup Vercel avec env vars
- [ ] Config domaine `kudos.app` + SSL
- [ ] Setup Twilio (SMS OTP)
- [ ] Setup PostHog analytics
- [ ] Pipeline CI/CD : push → build → deploy auto

**Critère de succès :** `kudos.app` accessible, DB créée, auth SMS fonctionnel en staging

---

### SPRINT 1 — Auth & Onboarding (2 semaines)

**Objectif :** L'utilisateur peut s'inscrire et comprendre le produit

**Semaine 1 : Auth SMS**
- [ ] Page onboarding (route `/`)
- [ ] Animation révélation (cercle ? → badges → photo → archétype)
- [ ] Input téléphone + validation
- [ ] Envoi OTP via Twilio
- [ ] Page vérification code OTP
- [ ] Création user en DB à la validation
- [ ] Session persistante (cookie Supabase)
- [ ] Redirect vers profil si déjà connecté

**Semaine 2 : Onboarding profil**
- [ ] Page "Complète ton profil" post-inscription
- [ ] Upload photo (Supabase Storage)
- [ ] Saisie nom + ville
- [ ] Choix de 3 premiers badges (je me décris)
- [ ] CTA "Inviter mes premiers contacts"
- [ ] Animation intro profil vide

**Critère de succès :** Inscription OTP fonctionnelle, profil créé en DB, photo uploadée

---

### SPRINT 2 — Profil (3 semaines)

**Objectif :** Le profil est la carte d'identité émotionnelle complète

**Semaine 1 : Structure profil**
- [ ] Page `/profil` (profil personnel)
- [ ] Page `/[username]` (profil public, sans auth)
- [ ] Hero photo pleine largeur
- [ ] Reputation Card : avatar flottant, nom, archétype calculé
- [ ] Compteur évaluations dynamique (count distincts validators)
- [ ] Phrase identité générée (template par archétype)

**Semaine 2 : Badges & traits**
- [ ] 4 barres de traits calculées depuis les Kudos reçus
- [ ] Section badges : 4 principaux + expand
- [ ] Pills avec count + durée ("depuis X mois/ans")
- [ ] Calcul archétype dynamique (5 types selon distribution badges)
- [ ] Badge mystère : logique de déverrouillage

**Semaine 3 : Partage & export**
- [ ] Sheet export : preview carte Apple Wallet
- [ ] Copie lien `kudos.app/username`
- [ ] Page profil public optimisée SEO (meta OG, title, description)
- [ ] Sheet badge detail avec témoignages
- [ ] Système reply sur témoignage
- [ ] Sheet QR Code

**Critère de succès :** Profil complet rendu, lien public partageable, archétype calculé dynamiquement

---

### SPRINT 3 — Envoyer un Kudos (2 semaines)

**Objectif :** L'envoi de Kudos est fluide, engageant et anti-gaming

**Semaine 1 : Badge Picker**
- [ ] Sheet Badge Picker
- [ ] 4 catégories, 9 badges chacune (36 total)
- [ ] Recherche en temps réel dans les badges
- [ ] Badge custom (emoji picker + nom)
- [ ] Sélection relation obligatoire (5 types)
- [ ] Sélection durée obligatoire (4 options)
- [ ] Validation : les 3 champs obligatoires

**Semaine 2 : Témoignage & Envoi**
- [ ] Textarea message personnel (optionnel)
- [ ] Preview du badge avant envoi
- [ ] Confirmation → insertion en DB (table `kudos`)
- [ ] Mise à jour `user_badges` (count, last_kudos_at)
- [ ] Animation burst + toast de confirmation
- [ ] Ajout dans feed du sender
- [ ] Push notification au receiver (si activé)
- [ ] Recalcul archétype receiver

**Critère de succès :** Kudos envoyé en DB, receiver notifié, archétype recalculé

---

### SPRINT 4 — Activité & Notifications (2 semaines)

**Objectif :** L'utilisateur ressent que sa réputation vit et circule

**Semaine 1 : Feed**
- [ ] Page `/activite` avec 3 onglets (Notifs / Kudos reçus / Matchs)
- [ ] Récupération notifs depuis table `notifications`
- [ ] Item "Profil consulté" (depuis `profile_views`)
- [ ] Item "Kudos reçu"
- [ ] Item "Kudo Match" (validation mutuelle détectée)
- [ ] Item "Badge débloqué"
- [ ] Item "Demande de validation"
- [ ] Mark as read au clic

**Semaine 2 : Kudos Moment**
- [ ] Overlay Kudos Moment (plein écran dans phone frame)
- [ ] Animation badge reveal
- [ ] Message personnel affiché
- [ ] Bouton "Remercier" → envoie message auto dans le chat
- [ ] Tracking visites profil (table `profile_views`)
- [ ] Sheet "Profil consulté" avec détail temps par section
- [ ] Conseil actionnable selon la section la plus consultée

**Critère de succès :** Feed temps réel via Supabase Realtime, Kudos Moment déclenché au bon moment

---

### SPRINT 5 — Contacts & Messagerie (3 semaines)

**Objectif :** Le réseau de confiance est navigable et vivant

**Semaine 1 : Contacts**
- [ ] Page `/contacts`
- [ ] Liste contacts (depuis table `contacts` status=accepted)
- [ ] Barre recherche filtrante
- [ ] Statut online (Supabase Presence)
- [ ] Last message + badge reçu + unread count
- [ ] Demande de contact (status=pending)
- [ ] Accept / Reject demande

**Semaine 2 : Messagerie temps réel**
- [ ] Vue chat (Supabase Realtime subscriptions)
- [ ] Envoi message → insert en DB → broadcast
- [ ] Réception message instantanée
- [ ] Marqueur de lecture (read_at)
- [ ] Date separator automatique
- [ ] "✓✓" read receipts

**Semaine 3 : Profil contact & Kudos depuis chat**
- [ ] Bouton "Profil" dans header chat → sheet profil contact
- [ ] Bouton "✨ Kudos" dans chat → Badge Picker → Kudos envoyé
- [ ] Message automatique dans le chat après Kudos ("Pierre t'a envoyé ❤️ Bienveillante")
- [ ] Notification in-app + push pour nouveau message

**Critère de succès :** Messagerie temps réel fonctionnelle, Kudos envoyable depuis le chat

---

### SPRINT 6 — Recherche & Découverte (2 semaines)

**Objectif :** Trouver les bons profils en quelques secondes

**Semaine 1 : Recherche**
- [ ] Page `/recherche`
- [ ] Barre de recherche avec debounce (300ms)
- [ ] Query Supabase full-text sur nom, ville, archétype, badges
- [ ] Filtres par catégorie (Coloc / Pro / Campus / Voisinage)
- [ ] Affichage résultats : avatar, nom, ville, archétype, badges, match%
- [ ] Algorithme match% (badges en commun, ville, catégorie)

**Semaine 2 : Profil & Contact**
- [ ] Sheet détail profil depuis recherche
- [ ] "Pourquoi ce match ?" avec raisons calculées
- [ ] Bouton "➕ Envoyer demande de contact"
- [ ] État button : "Demande envoyée ✓"
- [ ] Bouton "💬 Message" (si déjà contact)
- [ ] Privacité : réseau semi-fermé (visibilité selon paramètres)

**Critère de succès :** Recherche retourne des résultats pertinents, demande contact fonctionnelle

---

### SPRINT 7 — Dossier & Export (2 semaines)

**Objectif :** Kudos devient un outil concret dans la vraie vie

**Semaine 1 : Dossier PDF**
- [ ] 3 templates PDF (Colocation / Freelance / Complet)
- [ ] Génération PDF côté serveur (Puppeteer ou react-pdf)
- [ ] Contenu : photo, badges + barres, validateurs anonymisés, QR vérification
- [ ] Stockage PDF généré en Supabase Storage
- [ ] Download depuis l'app
- [ ] URL unique de vérification `kudos.app/verify/[token]`

**Semaine 2 : Wrapped & Partage social**
- [ ] Carte Kudos Wrapped (stat annuelle)
- [ ] Génération image PNG via Canvas API
- [ ] Partage natif via `navigator.share()`
- [ ] Fallback : download PNG
- [ ] Copie lien profil public
- [ ] Story Instagram (PNG taille 9:16)

**Critère de succès :** PDF généré et téléchargeable, lien de vérification fonctionnel

---

### SPRINT 8 — Trending & Gamification (1 semaine)

**Objectif :** Créer un sentiment d'appartenance locale et de progression

- [ ] Page `/trending`
- [ ] Classement badges de la semaine par ville (query SQL agrégée)
- [ ] Percentile de l'utilisateur dans sa ville
- [ ] "Tu es Top 5% à Montpellier" en temps réel
- [ ] Badge mystère : logique complète de déverrouillage
- [ ] Notification "Nouveau badge débloqué" avec animation
- [ ] Archétype qui évolue (recalcul à chaque nouveau Kudos)
- [ ] Message "Ton archétype a changé !" si seuil franchi

**Critère de succès :** Trending mis à jour quotidiennement, percentile affiché correctement

---

### SPRINT 9 — PWA & Push Notifications (2 semaines)

**Objectif :** L'app s'installe et notifie comme une app native

**Semaine 1 : PWA**
- [ ] `manifest.json` complet (icônes, nom, couleurs, orientation)
- [ ] Service Worker (cache offline)
- [ ] Install prompt "Ajouter à l'écran d'accueil"
- [ ] Splash screen
- [ ] Mode fullscreen sans UI navigateur
- [ ] Offline page friendly

**Semaine 2 : Web Push**
- [ ] Setup VAPID keys
- [ ] Page permissions push (demande élégante, pas au démarrage)
- [ ] Supabase Edge Function pour envoyer push
- [ ] Notifications déclenchées par :
  - Kudos reçu
  - Profil consulté
  - Nouveau message
  - Badge débloqué
  - Kudo Match
- [ ] Deep links (notif → bonne page)

**Critère de succès :** App installable, push notifications reçues sur iOS et Android

---

### SPRINT 10 — Beta & Launch (2 semaines)

**Objectif :** 50 bêta-testeurs, bugs fixés, prêt pour le public

**Semaine 1 : Beta privée**
- [ ] Invitations 50 utilisateurs (téléphones pré-autorisés)
- [ ] Monitoring Supabase (requêtes lentes, erreurs)
- [ ] Monitoring PostHog (funnel onboarding, drop-off)
- [ ] Fix bugs critiques remontés
- [ ] Modération : système de signalement
- [ ] RGPD : politique vie privée, suppression compte, export données

**Semaine 2 : Launch**
- [ ] Optimisation performance (Lighthouse > 90)
- [ ] SEO profils publics (meta OG, structured data)
- [ ] Emails transactionnels (welcome, weekly recap)
- [ ] Plan de croissance : mécanisme d'invitation
- [ ] Analytics dashboard (PostHog)
- [ ] Launch Product Hunt

**Critère de succès :** 50 utilisateurs actifs, aucun bug critique, NPS > 40

---

## 7. MÉTRIQUES DE SUCCÈS (KPIs)

### Activation
- % utilisateurs qui reçoivent leur 1er Kudos dans les 48h
- % utilisateurs qui invitent au moins 1 contact

### Engagement
- Kudos envoyés / utilisateur / semaine
- Sessions / utilisateur / semaine
- Taux d'ouverture push notifications

### Rétention
- J7, J30, J90 retention
- % profils avec badges "depuis 6+ mois" (profondeur temporelle)

### Viralité
- K-factor (invitations par utilisateur)
- Visites profils publics / lien partagé
- Dossiers PDF téléchargés

### Business
- Taux conversion dossier PDF → logement obtenu (via feedback)

---

## 8. DÉCISIONS DE DESIGN FIGÉES

Ces choix sont **définitifs** et doivent être respectés à la lettre :

1. **Pas de pseudos** — uniquement vrais noms + téléphone vérifié
2. **Déclaration de contexte obligatoire** avant tout Kudos (relation + durée)
3. **Réseau semi-fermé** — visibilité limitée au réseau validé
4. **Pas de notes numériques** — uniquement des badges qualitatifs
5. **Badges = preuves** — chaque badge a un compteur + une durée visible
6. **Archétype calculé, pas choisi** — l'utilisateur ne se définit pas lui-même
7. **Lien public sans compte** — toujours consultable par un tiers
8. **Kudos Moment** — la réception doit être un moment émotionnel fort

---

## 9. PRIORITÉS (MoSCoW)

### Must Have (MVP)
- Auth SMS OTP
- Profil avec archétype calculé
- Envoyer un Kudos (avec déclaration contexte)
- Lien profil public partageable
- Feed de notifications
- Kudos Moment (réception plein écran)
- Contacts basiques

### Should Have (V1.1)
- Messagerie temps réel
- Dossier PDF
- Push notifications
- Recherche
- PWA installable

### Could Have (V1.2)
- Kudos Wrapped
- Trending local
- Badge mystère
- Stats profil consulté

### Won't Have (hors scope MVP)
- Paiement / Premium
- API publique
- App Store native
- Vidéo témoignages

---

*Document généré le 17/05/2026 — à mettre à jour à chaque fin de sprint*
