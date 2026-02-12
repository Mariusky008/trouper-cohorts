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
- **Dashboard (`/app/today`)** :
  - Affichage de la mission du jour.
  - Carte "Prochain Live" (Agenda).
  - Carte "Mon Binôme" (Buddy System).
  - **Coach IA Adaptatif** : L'IA (`/api/ai/coach`) adapte son ton selon le programme (Sales Coach pour Entrepreneurs vs Conseiller Carrière pour Emploi).
- **Programme (`/app/program`)** : Vue d'ensemble des missions (14 ou 15 jours selon le programme).
- **Équipage (`/app/crew`)** : Annuaire des membres de la cohorte.
- **Classement (`/app/leaderboard`)** : Gamification.

### Côté Admin (`/admin`)
- **Gestion des Inscriptions** :
    - Liste unifiée mais typée (Badge "Emploi" vs "Entrepreneur").
    - **Validation Intelligente** : Lors de la validation, l'utilisateur est automatiquement assigné à une cohorte correspondant à son type de programme et son département (ex: "Cohorte Emploi 75").
- **Gestion des Programmes** :
    - Éditeur de contenu jour par jour.
    - **Seed Button** : Bouton permettant de réinitialiser/mettre à jour le contenu pédagogique depuis le code (`src/app/actions/seed-program.ts`).
- **Buddy System** : Rotation quotidienne des binômes (automatisée via Cron).

---

## 4. Base de Données (Supabase)

### Tables Principales
- **`profiles`** : Extension de `auth.users`.
- **`cohorts`** : Les sessions. Colonne `program_type` ('entrepreneur' | 'job_seeker').
- **`cohort_members`** : Liaison User <-> Cohorte.
- **`mission_templates`** : Le contenu "modèle" des missions. Colonne `program_type`.
- **`missions`** : Les instances de missions pour une cohorte donnée (copiées depuis les templates).
- **`pre_registrations`** : Les leads avant validation. Colonne `program_type`.

### Scripts Importants (`supabase/migrations/`)
- `20240212_add_program_type.sql` : Ajout du support multi-programmes.
- `seed_job_seeker_missions.sql` : Contenu initial du programme Emploi.

---

## 5. Landing Pages
- **`/` (Home)** : Landing page générique / Entrepreneur.
- **`/emploi`** : Landing page spécifique "Job Seeker".
    - Design "Warm & Modern" (Crème/Orange).
    - Formulaire de pré-inscription typé (`programType="job_seeker"`).

---

## 6. Maintenance & Déploiement

### Mise à jour du Contenu Pédagogique
Le contenu du programme "Emploi" est défini dans le fichier `src/app/actions/seed-program.ts`.
Pour mettre à jour le contenu en production :
1. Modifier le JSON dans `seed-program.ts`.
2. Déployer.
3. Aller dans l'Admin > Programmes > "Initialiser le contenu".

### Assignation Automatique
L'algorithme de validation (`src/app/actions/admin-registration.ts`) suit cette logique :
1. Récupère le `program_type` et le `department_code` du pré-inscrit.
2. Cherche une cohorte existante avec le slug `session-{date}-{dept}-{program}`.
3. Si elle n'existe pas, elle est créée automatiquement avec le bon type.
4. L'utilisateur est assigné.

---
*Dernière mise à jour : Février 2026*
