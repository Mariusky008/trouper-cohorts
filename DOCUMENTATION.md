# Popey Academy - Documentation Technique

## 1. Vue d'ensemble
Popey Academy est une plateforme de **cohortes d'apprentissage gamifiées** pour les professionnels locaux.
L'objectif est de réunir des pros (1 par métier par ville) pour un sprint de 14 jours de missions concrètes.

**Stack Technique :**
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données & Auth** : Supabase
- **UI** : Tailwind CSS + shadcn/ui
- **Icônes** : Lucide React

---

## 2. Fonctionnalités Clés

### Côté Participant (`/app`)
- **Dashboard (`/app/today`)** :
  - Affichage de la mission du jour.
  - Carte "Prochain Live" (Agenda).
  - Carte "Mon Binôme" (Buddy System).
  - Formulaire de soumission de preuve (URL ou Image).
- **Programme (`/app/program`)** : Vue d'ensemble des 14 jours de missions.
- **Équipage (`/app/crew`)** : Annuaire des membres de la cohorte (Profils enrichis).
- **Classement (`/app/leaderboard`)** : Gamification (points par mission).
- **Profil (`/app/settings`)** :
  - Édition du profil (Bio, Instagram, LinkedIn).
  - Bouton "Réserver un Coaching" (Calendly).

### Côté Admin (`/admin`)
- **Gestion des Cohortes** : Création, Dates, Statut.
- **Gestion des Missions** : Édition du contenu jour par jour.
- **Gestion des Participants** : Vue liste, accès aux profils.
- **Buddy System (Groupes)** : Création de paires/groupes, assignation manuelle.
- **Agenda (Événements)** : Création des Lives (Date, Lien Visio).

---

## 3. Base de Données (Supabase)

L'architecture repose sur plusieurs tables clés.
**IMPORTANT :** Si vous déployez sur une nouvelle instance Supabase, vous devez exécuter les scripts SQL suivants dans l'ordre.

### Scripts d'initialisation
Les fichiers se trouvent dans le dossier `supabase/`.

1.  **`mvp.sql`** : Structure de base (Cohortes, Membres, Missions, Soumissions).
2.  **`social_profiles.sql`** : Extension des profils (Bio, Réseaux sociaux).
3.  **`buddy_system.sql`** : Tables pour les groupes (Binômes).
4.  **`events.sql`** : Tables pour l'agenda (Événements).

### Schéma Simplifié

- **`profiles`** : Extension de `auth.users` (display_name, bio, instagram, avatar...).
- **`cohorts`** : Les sessions de 14 jours (titre, dates).
- **`cohort_members`** : Liaison User <-> Cohorte (rôle, département).
- **`missions`** : Contenu pédagogique (jour 1 à 14).
- **`submissions`** : Preuves envoyées par les users.
- **`buddy_groups`** : Groupes de travail.
- **`events`** : Calendrier des lives.

---

## 4. Déploiement & Lancement

### Lancer en local
```bash
npm install
npm run dev
```
Accès : `http://localhost:3000`

### Déploiement (Vercel)
1.  Connecter le repo GitHub à Vercel.
2.  Configurer les variables d'environnement :
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3.  Déployer.

---

## 5. Maintenance & Admin

Pour accéder au Backoffice, un utilisateur doit avoir le rôle d'admin (vérifié par la fonction SQL `is_admin`).
Actuellement, cela se configure souvent directement en base ou via une table `admins` (selon l'implémentation choisie dans `mvp.sql`).

L'URL du backoffice est : `/admin/cohorts`

---

*Généré par Trae AI - Février 2026*
