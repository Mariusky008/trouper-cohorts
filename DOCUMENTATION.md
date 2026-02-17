# Popey Academy - Documentation Technique

## 1. Vue d'ensemble
Popey Academy est une plateforme de **cohortes d'apprentissage gamifiées**.
Initialement conçue pour les entrepreneurs (Sprint de 14 jours), elle supporte désormais **plusieurs types de programmes**, notamment un parcours pour les chercheurs d'emploi.

**Stack Technique :**
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données & Auth** : Supabase
- **UI** : Tailwind CSS + shadcn/ui + Framer Motion
- **Icônes** : Lucide React

---

## 2. Architecture Multi-Programmes

Le système a évolué pour supporter deux types de programmes distincts :
1.  **Entrepreneur (`entrepreneur`)** : Le format historique. 14 jours consécutifs.
2.  **Emploi / Job Seeker (`job_seeker`)** : Nouveau format. 3 semaines (15 jours de contenu + week-ends off).

### Impact Technique
- **Base de Données** : Ajout d'une colonne `program_type` (text) dans les tables clés :
    - `cohorts` : Pour typer une cohorte entière.
    - `pre_registrations` : Pour savoir ce que le prospect a demandé.
    - `mission_templates` : Pour stocker le contenu pédagogique différencié.
- **Admin** : Ségrégation des inscrits et des cohortes par type de programme.
- **Frontend** : Adaptation des vues (Landing pages dédiées, Dashboard adapté).

---

## 3. Fonctionnalités Clés

### Côté Participant (`/app`)
- **Cockpit Dashboard (`/app/today`)** :
  - **Interface en Accordéons** : Les missions quotidiennes sont présentées sous forme de blocs dépliables (Intellectuel, Créatif, Social, Événement) pour une meilleure lisibilité.
  - **Validation Granulaire** : Chaque étape de mission possède son propre système de validation avec preuve intégrée (Texte, Lien, ou Photo). Fini le bouton de validation global en bas de page.
  - **Preuves** : Les preuves sont stockées directement dans la table `mission_steps` (colonne `proof_content`) pour un suivi précis par l'IA et les coachs.
  - Affichage de la mission du jour.
  - Carte "Prochain Live" (Agenda).
  - Carte "Mon Binôme" (Buddy System).
  - **Coach IA Adaptatif** : L'IA (`/api/ai/coach`) adapte son ton selon le programme.
- **Programme (`/app/program`)** : Vue d'ensemble des missions.
- **Équipage (`/app/crew`)** : Annuaire des membres de la cohorte.
- **Classement (`/app/leaderboard`)** : Gamification.

### Côté Admin (`/admin`)
- **Gestion des Inscriptions** :
    - Liste unifiée mais typée (Badge "Emploi" vs "Entrepreneur").
    - **Validation Intelligente** : Assignation automatique à une cohorte typée (ex: "Cohorte Emploi 75").
- **Gestion des Programmes** :
    - Éditeur de contenu jour par jour.
    - **Seed Button** : Bouton permettant de réinitialiser le contenu pédagogique.
- **Buddy System** : Rotation quotidienne des binômes.

---

## 4. Base de Données (Supabase)

### Tables Principales
- **`profiles`** : Extension de `auth.users`.
- **`cohorts`** : Les sessions. Colonne `program_type`.
- **`cohort_members`** : Liaison User <-> Cohorte.
- **`mission_templates`** : Le contenu "modèle". Colonne `program_type`.
- **`mission_step_templates`** : Les étapes modèles. Colonne `proof_type` ('text', 'link', 'image', 'none') ajoutée en Février 2026.
- **`missions`** : Les instances de missions.
- **`mission_steps`** : Les étapes instanciées. Colonnes `proof_type`, `proof_content`, `status` ajoutées pour la validation granulaire.
- **`pre_registrations`** : Les leads avant validation.

### Scripts Importants (`supabase/migrations/`)
- `20240212_add_program_type.sql` : Ajout du support multi-programmes.
- `20240218_add_proof_type_to_steps.sql` : Ajout du support des preuves granulaires.
- `seed_mission_templates.sql` : Contenu initial du programme Entrepreneur (J1 mis à jour avec preuves).

---

## 5. Landing Pages
- **`/` (Home)** : Landing page générique / Entrepreneur.
- **`/emploi`** : Landing page spécifique "Job Seeker".
- **`/france-travail`** : Page institutionnelle B2B pour présenter le dispositif pilote à France Travail.
    - Ton formel, focus sur la remobilisation et l'innovation sociale.

---

## 6. Maintenance & Déploiement

### Mise à jour du Contenu Pédagogique
Le contenu du programme "Emploi" est défini dans `src/app/actions/seed-program.ts`.
Pour mettre à jour le contenu en production :
1. Modifier le JSON dans `seed-program.ts`.
2. Déployer.
3. Aller dans l'Admin > Programmes > "Initialiser le contenu".

### Assignation Automatique
L'algorithme de validation (`src/app/actions/admin-registration.ts`) suit cette logique :
1. Récupère le `program_type` et le `department_code` du pré-inscrit.
2. Cherche une cohorte existante avec le slug `session-{date}-{dept}-{program}`.
3. Si elle n'existe pas, elle est créée automatiquement.
4. L'utilisateur est assigné.

---
*Dernière mise à jour : 18 Février 2026*
