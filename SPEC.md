# Cahier des charges — Popey Academy (ex-Trouper Cohorts)

## 0) Objectif

Plateforme de **Bootcamp intensif (14 jours)** pour entrepreneurs (Coachs, Immo, Artisans).
L'objectif est de créer une **alliance locale** (1 pro par métier par département) et de maximiser l'exécution via la pression sociale et la gamification.

## 1) Principes non négociables

- **Intensité & Exécution** : Le produit doit refléter l'urgence. Pas de "nice-to-have", que de l'action.
- **Simplicité d’usage** : Mobile-first pour les participants.
- **Robustesse** : RLS partout. Aucune fuite de données entre cohortes.
- **Identité Visuelle** : Marque forte "Popey Academy" (Force, Groupe, Action).

## 2) Glossaire

- **Cohorte** : Un "Commando" de 14 jours.
- **Équipage** : Les participants d'une cohorte (max 1 par département).
- **Mission** : Tâche quotidienne (Type: Solo, Duo, Trio, Workshop, Quiz, Coaching).
- **Preuve** : Validation de la mission (Lien, Image, Texte).
- **Binôme (Buddy)** : Partenaire de responsabilité assigné.
- **Live (Event)** : Événement synchrone (Zoom/Meet).

## 3) Rôles & Permissions

### Anonyme (anon)
- Peut voir la Landing Page (`/`).
- Peut se pré-inscrire (Lead).

### Participant (authenticated)
- Accès au Dashboard (`/app/today`).
- Voir le Programme complet (`/app/program`).
- Voir son Équipage (`/app/crew`).
- Voir le Leaderboard (`/app/leaderboard`).
- Gérer son Profil (`/app/settings`) avec upload Avatar.
- Soumettre des preuves.

### Admin (role 'admin' ou table 'admins')
- Dashboard KPI (`/admin/cohorts`).
- CRUD Cohortes & Missions.
- Gestion Participants (Assignation Départements, Binômes).
- Modération Preuves.
- Exports CSV.

## 4) Fonctionnalités Implémentées (V1.0)

### Parcours Acquisition
- **Landing Page** : Hero "Commando", Features "Alliance/Survie", Formulaire Pré-inscription.
- **Honeypot** : Protection anti-spam sur les formulaires.

### Parcours Participant (App)
- **Dashboard (/app/today)** :
  - Mission du jour avec description riche (Markdown/Sauts de ligne).
  - Statut de validation (Preuve).
  - Prochain Live (Compte à rebours).
  - Carte Binôme.
- **Programme (/app/program)** :
  - Timeline visuelle 14 jours.
  - Indicateurs : Durée, Intensité (Flamme/Éclair), Type (Icône).
  - Statut (Fait/En cours/À venir).
- **Équipage (/app/crew)** :
  - Annuaire trombinoscope (Avatar, Métier, Département, Réseaux).
  - Liens rapides (Insta/LinkedIn).
- **Profil (/app/settings)** :
  - Upload Avatar (Supabase Storage).
  - Bio, Réseaux sociaux.
- **Preuves (/app/proof)** : Historique des soumissions.

### Parcours Admin (Backoffice)
- **Dashboard Global** : KPI (Inscrits, Actifs, Live, Engagement).
- **Gestion Cohorte** :
  - Édition Dates/Titre.
  - Édition Programme (14 jours, Types, Description détaillée).
  - Gestion Participants (Tableau, Filtres).
  - Gestion Binômes (Drag & Drop ou Assignation).
- **Exports** : CSV des participants.

## 5) Architecture Technique

- **Framework** : Next.js 15 (App Router).
- **Langage** : TypeScript.
- **UI** : Tailwind CSS, Shadcn UI, Lucide Icons.
- **Base de données** : Supabase (PostgreSQL).
- **Auth** : Supabase Auth (Email/Password, Magic Link).
- **Storage** : Supabase Storage (Bucket 'avatars').
- **Déploiement** : Vercel.

## 6) Structure des Données (Supabase)

- `profiles` : Infos user (display_name, bio, avatar_url...).
- `cohorts` : Sessions (start_date, end_date, trade).
- `cohort_members` : Liaison User-Cohorte (department_code).
- `missions` : Contenu (title, description, type, duration, energy_level).
- `submissions` : Preuves (proof_url, note, status).
- `events` : Agenda (start_time, meeting_url).
- `buddy_groups` : Groupes de responsabilité (Duo/Trio).
- `pre_registrations` : Leads (email, trade, department).

## 7) Sécurité

- **RLS (Row Level Security)** : Activé sur toutes les tables.
  - Participants : `select` sur leur cohorte uniquement.
  - Admins : `all` sur tout (via fonction `is_admin()`).
- **Storage Policies** :
  - Public : `select`.
  - Authenticated : `insert` (upload), `update` (own files).

## 8) Prochaines Étapes (Roadmap)

- Paiement Stripe.
- Chat temps réel (Supabase Realtime).
- Notifications (Email/Push).
- IA Coach (Feedback auto sur preuves).
