# 📚 Documentation Fonctionnelle et Technique - Troupers

Ce document sert de référence complète pour comprendre le fonctionnement de l'application Troupers, ses fonctionnalités clés et son implémentation technique.

*Dernière mise à jour : 03 Janvier 2026*

---

## 1. Dashboard & Missions du Jour (Gamification)
**Fichier Principal :** `src/app/dashboard/page.tsx`

C'est le cœur de l'application où l'utilisateur progresse dans ses tâches quotidiennes.

### Fonctionnalités
*   **Système de Vagues (Waves) :** Les missions ne sont pas affichées en vrac. Elles sont présentées par paquets de 5 (Vague 1, Vague 2...).
    *   L'utilisateur doit finir la vague 1 pour débloquer la vague 2.
    *   Cela réduit la charge mentale et gamifie la progression.
*   **Rangs Dynamiques :** Une barre de progression en haut affiche le grade du jour selon l'avancement :
    *   0% : **Recrue**
    *   25% : **Soldat**
    *   50% : **Sergent**
    *   75% : **Vétéran**
    *   100% : **Légende** 🏆
*   **Rotation des Actions :** L'action demandée change cycliquement pour chaque membre (Like -> Commentaire -> Favori) basé sur l'historique `video_tracking`.

### Implémentation Technique
*   **State `tasks` :** Tableau d'objets généré dynamiquement.
*   **Pagination :** Utilisation de `slice()` pour n'afficher que les 5 tâches de la vague courante.
*   **Sécurité Cache :** L'état "Vu" des vidéos est stocké dans `sessionStorage` avec une **date d'expiration**. Si la date stockée n'est pas aujourd'hui, le cache est purgé au chargement pour éviter de valider des missions d'hier.

---

## 2. Protocole Mercenaire (Pénalités & Rattrapage)
**Doc détaillée :** `docs/PROTOCOLE_MERCENAIRE.md`
**Composant :** `src/components/dashboard/mercenary-board.tsx`

Système qui garantit que tout le monde reçoit du soutien, même si un membre déserte.

### Fonctionnalités
*   **Détection des Déserteurs :** Chaque nuit, un script vérifie qui n'a pas fait ses missions la veille.
*   **Punition :** Le déserteur perd des points de Discipline et prend un "Strike".
*   **Bounties (Primes) :** Les missions ratées deviennent des missions mercenaires publiques pour les autres membres.
*   **Récompense :** Accomplir une mission mercenaire rapporte +1 Crédit Boost.
*   **Anti-Triche :** Le bouton "J'ai fait le job" est désactivé tant que la vidéo n'a pas été ouverte.

### Implémentation Technique
*   **Cron Job :** `/api/cron/generate-bounties`. Vérifie les supports de la veille (`yesterday`) pour éviter les faux positifs liés au fuseau horaire.
*   **RPC PostgreSQL :** `increment_strikes` gère atomiquement la pénalité.

---

## 3. Boost Window (Fenêtres de Gain)
**Fichier Principal :** `src/app/dashboard/page.tsx`

Moments clés de la journée où l'engagement est maximisé.

### Fonctionnalités
*   **Fenêtre Active :** Si une fenêtre est ouverte (ex: 18h-20h), une bannière spéciale apparaît.
*   **Objectif :** Une "Cible Prioritaire" est désignée. L'utilisateur doit faire 3 actions (Like + Com + Fav) sur cette cible.
*   **Gain :** +1 Crédit Boost immédiat.

### Implémentation Technique
*   **Table `boost_windows` :** Définit les créneaux horaires (`starts_at`, `ends_at`) et la vidéo cible.
*   **Table `boost_participations` :** Empêche de participer deux fois à la même fenêtre.

---

## 4. Jours Off (Gestion des Congés)
**Page :** `src/app/dashboard/leaves/page.tsx`

Permet aux soldats de se reposer sans être pénalisés par le Protocole Mercenaire.

### Règles
*   Max 2 jours par semaine.
*   Doit être posé au moins 24h à l'avance (pour demain min).
*   **Conséquence :** Le script Mercenaire voit le jour OFF, ne met pas de Strike, mais génère quand même une Bounty pour que l'escouade ne perde pas de soutien.

---

## 5. Binôme (Buddy System)
**Widget :** Sidebar Dashboard

Chaque utilisateur se voit attribuer un binôme pour se motiver mutuellement.

*   Affichage du partenaire dans la barre latérale.
*   Score Duo partagé.

---

## 6. Structure de la Base de Données (Supabase)

Voici les tables clés utilisées par l'application :

*   **`profiles`** : Infos utilisateur, score discipline, crédits boost, URL vidéo courante.
*   **`squads`** & **`squad_members`** : Gestion des équipes.
*   **`daily_supports`** : Historique court terme (qui a aidé qui aujourd'hui ?).
*   **`video_tracking`** : Historique long terme (compteur d'actions par vidéo).
*   **`bounties`** : Missions mercenaires générées par le système.
*   **`user_off_days`** : Calendrier des congés posés.
*   **`boost_windows`** : Créneaux horaires pour les événements Boost.
*   **`daily_trends`** : Tendances globales affichées.

---

## 7. Commandes Utiles (Développement)

*   **Lancer le projet :** `npm run dev`
*   **Déployer migrations :** Les fichiers SQL sont dans `supabase/migrations/`.
*   **Simuler Cron Mercenaire :** `GET /api/cron/generate-bounties?key=XXX`

---

## 8. Algorithme V2 (Simulateur Organique)
**Composant :** `src/components/dashboard/MissionPlan.tsx`

Refonte majeure de la logique d'engagement pour rendre l'activité indétectable par TikTok et booster le SEO.

### A. Distribution Intelligente (Boost Window ++)
Au lieu de simples likes, les missions quotidiennes sont réparties statistiquement :
*   **30% Commentaires Qualifiés** (Modèles contextuels fournis, copier-coller interdit).
*   **20% Réponses (Reply Loop)** (Répondre aux commentaires pour créer des threads).
*   **10% Partage Silencieux** (Copier le lien / MP).
*   **40% Classique** (Like / Favoris alternés).

### B. Search & Find Protocol (SEO)
Pour éviter le trafic "Direct Link" (suspect), 50% des missions demandent à l'utilisateur de passer par la recherche :
1.  **Instruction :** "Tape [Pseudo] dans la recherche".
2.  **Action :** Trouve la vidéo manuellement.
3.  **Impact :** Booste le référencement interne du créateur.

### C. Sandwich Protocol (Comportement Humain)
Chaque mission est enveloppée dans une session de surf naturelle :
1.  **Warm-up :** "Scrolle 2-3 vidéos aléatoires avant de commencer".
2.  **Mission :** Action Troupers.
3.  **Cool-down :** "Ne quitte pas l'app, scrolle encore un peu".

### D. Sécurité & Finesse
*   **Micro-Abandon (15%) :** Certaines missions demandent explicitement de quitter la vidéo à 70% sans liker, pour rendre la courbe de rétention réaliste.
*   **Décalage Temporel :** Un délai ("Attends 5 min") est imposé aléatoirement pour éviter les pics simultanés.
*   **Anti-Double Dip :** Avertissement rouge : "Si tu as déjà vu/liké cette vidéo organiquement, NE FAIS RIEN (valide juste la mission)".

---

## 9. Charge de Travail & Échantillonnage Tactique
**Architecture :** `src/app/dashboard/page.tsx`

Pour garantir la durabilité du système et le réalisme des actions.

### A. Limitation Quotidienne
*   Chaque membre ne reçoit que **8 à 12 missions maximum par jour** (au lieu de 50+).
*   Sélection aléatoire (Shuffle) des membres de l'escouade à soutenir, renouvelée chaque jour.
*   **But :** Éviter l'épuisement des membres et le comportement "ferme à clics".

### B. Stratégie d'Abonnement (Follow)
*   **Règle d'or :** Ne jamais forcer le follow massif.
*   **Probabilité :** Seulement **10%** de chance de voir une instruction "S'abonner (Optionnel)".
*   **Limite :** Max 2 à 5 follows par jour par personne.
*   **Logique :** Le follow doit rester un signal rare et fort pour être valorisé par l'algo.

