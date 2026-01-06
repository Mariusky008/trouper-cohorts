# 📚 Documentation Fonctionnelle et Technique - Troupers

Ce document sert de référence complète pour comprendre le fonctionnement de l'application Troupers, ses fonctionnalités clés et son implémentation technique.

*Dernière mise à jour : 03 Janvier 2026*

---

## 1. Dashboard & Missions du Jour (Focus Mode)
**Fichier Principal :** `src/app/dashboard/page.tsx`

C'est le cœur de l'application où l'utilisateur progresse dans ses tâches quotidiennes.

### Fonctionnalités
*   **Flux Mission par Mission (Focus Mode) :** Contrairement à une liste classique (to-do list), les missions s'affichent **une par une**.
    *   L'utilisateur doit "Lancer la mission" (ouvre TikTok), effectuer l'action, puis confirmer "J'ai terminé".
    *   Cela garantit une attention maximale sur chaque action et permet d'afficher les consignes tactiques détaillées.
*   **Rangs Dynamiques :** Une barre de progression en haut affiche le grade du jour selon l'avancement :
    *   0% : **Recrue**
    *   25% : **Soldat**
    *   50% : **Sergent**
    *   75% : **Vétéran**
    *   100% : **Légende** 🏆
*   **Guidage Tactique (MissionPlan) :** Chaque écran de mission affiche un plan d'action précis (Source de trafic, Délai, Scénario).

### Implémentation Technique
*   **Échantillonnage Tactique :** Le système sélectionne aléatoirement (mais de façon déterministe par jour) entre **8 et 12 membres** de l'escouade à soutenir.
*   **State `currentTaskIndex` :** Gère la navigation séquentielle.
*   **Auto-Resume :** Si l'utilisateur quitte et revient, il est redirigé vers la première mission non terminée.
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

### A. Distribution Intelligente (Probabilités)
Au lieu de simples likes, les missions quotidiennes sont réparties statistiquement pour chaque utilisateur :
*   **30% Watch Only** (Regarder sans interagir, très important pour la rétention).
*   **30% Like** (Classique).
*   **20% Commentaire** (Modèles contextuels fournis).
*   **10% Favoris** (Signal fort).
*   **10% Scroll Fast / Micro-Abandon** (Simuler un désintérêt pour rendre le profil humain).

### B. Search & Find Protocol (SEO)
Pour éviter le trafic "Direct Link" (suspect), 50% des missions demandent à l'utilisateur de passer par la recherche :
1.  **Instruction :** "Tape [Pseudo] dans la recherche".
2.  **Action :** Trouve la vidéo manuellement.
3.  **Impact :** Booste le référencement interne du créateur.

### C. Sandwich Protocol (Comportement Humain)
Chaque mission est enveloppée dans une session de surf naturelle :
1.  **Warm-up (Préchauffage) :** "Ouvre TikTok et scrolle ton flux 'Pour toi' normalement pendant 30s à 1min. Like une vidéo qui te plaît vraiment (hors mission)."
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
*   **Règle d'or :** Ne jamais forcer le follow massif. L'obligation de "S'abonner à tous" a été **supprimée**.
*   **Probabilité :** Seulement **10%** de chance de voir une instruction "S'abonner (Optionnel)" dans une mission.
*   **Limite :** Max 2 à 5 follows par jour par personne.
*   **Logique :** Le follow doit rester un signal rare et fort pour être valorisé par l'algo.

---

## 10. Améliorations UX (Mise à jour V2.2)

### A. Affichage des Cibles (Handle vs Username)
Pour éviter la confusion lors de la recherche manuelle (SEO Protocol), l'affichage de la cible a été standardisé :
*   Le système extrait automatiquement le **@pseudo** TikTok à partir du lien de profil ou du lien vidéo fourni par le membre.
*   Si le membre a mis son lien de profil `tiktok.com/@david`, la mission affichera `Cible : @david` (prêt à copier-coller) au lieu de son prénom d'inscription `David`.
*   **Sidebar Config :** Le champ "Mon Profil Principal" a été renommé "Mon Profil TikTok" avec un placeholder explicite pour encourager la saisie du lien correct.

### B. Affichage des Scores (Escouade)
Le classement de l'escouade (`/dashboard/group`) a été affiné pour refléter la réalité :
*   **Nouveaux membres :** Au lieu d'afficher "0 pts" (démotivant) ou "60 pts" (faux), un score progressif est calculé basé sur l'ancienneté (simulé pour la démo : 10 pts + 5 pts/jour).
*   **Statuts Réalistes :** Le statut "En feu 🔥" n'est plus attribué par défaut.
    *   Score < 20 : "En danger 🚨"
    *   Score < 50 : "Attention ⚠️"
    *   Score > 50 : "En feu 🔥"

### C. Humanisation des Consignes (MissionPlan)
Les instructions des missions ont été réécrites pour être moins "robotiques" et plus flexibles :
*   **Timing :** "Attends 2 min" -> "Attends entre 30s et 2 min".
*   **Visionnage :** "Regarde 70%" -> "Regarde entre 60% et 80%".
*   **Interaction :** "Reviens 3s en arrière" -> "Reviens légèrement en arrière si un passage t'a marqué".
*   **Wording :** "Camouflage Anti-Bot" remplacé par "Navigation Naturelle".
*   **Suppression des % visibles :** Les pourcentages précis (ex: "Engagement 85%") sont masqués pour l'utilisateur final afin de réduire la charge mentale.

---

## 11. Mise à jour V2.3 (Janvier 2026) - Mercenaire & Design Tactique

### A. Refonte de la Fiche Mission (Tactical Card)
Le composant `MissionPlan` a été entièrement redessiné pour être plus immersif et réduire la lassitude des utilisateurs.
*   **Design :** Adoption d'un style "Carte Tactique" structurée par étapes claires (0 à 4).
*   **Thèmes Dynamiques :** Pour briser la monotonie, chaque mission adopte aléatoirement (basé sur son ID) un thème visuel différent :
    *   🛡️ **Tactique (Indigo) :** "Mission Optimisée" (Standard)
    *   👻 **Furtif (Émeraude/Gris) :** "Opération Furtive" (Low Profile)
    *   🚀 **Viral (Rose/Rouge) :** "Impulsion Virale" (High Energy)
*   **Copywriting Sécurisé :** Intégration stricte des consignes de sécurité (Ghost Viewing, Rewind, SEO Boost).

### B. Variété des Actions & Algorithme Humain
Les missions mercenaires ne se limitent plus au "Like". Le système génère désormais une variété d'ordres :
*   **70% :** Like + Favori (Engagement standard)
*   **20% :** Like + Commentaire (Engagement fort)
*   **10% :** Like + Partage (Viralité)

**Amélioration "Ghost Viewing" (20%) :**
L'ordre de "NE RIEN FAIRE" (Abandon) n'est plus lié uniquement à la mission, mais au couple **(Mission + Utilisateur)**.
*   *Avant :* La Mission #5 demandait à TOUT LE MONDE d'abandonner (Pattern détectable).
*   *Maintenant :* Sur la Mission #5, l'utilisateur A devra abandonner, mais l'utilisateur B devra liker.
*   **Résultat :** Le comportement devient 100% organique et imprévisible pour l'algorithme TikTok.

### C. Stabilisation Technique
*   **Correction API Bounties :** Résolution des erreurs 500 liées à des colonnes manquantes (`type`) et ajout d'une gestion d'erreur robuste.
*   **Simulation Admin :** Le bouton "(Admin) Simuler Alerte" est désormais fiable, avec un fallback local si le Cron ne renvoie rien, permettant de tester l'interface à tout moment.
*   **Affichage :** Augmentation du nombre de missions visibles simultanément de 2 à 4 pour une meilleure ergonomie.
