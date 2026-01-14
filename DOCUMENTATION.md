# 📚 Documentation Fonctionnelle et Technique - Troupers

Ce document sert de référence complète pour comprendre le fonctionnement de l'application Troupers, ses fonctionnalités clés et son implémentation technique.

*Dernière mise à jour : 14 Janvier 2026*

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
**État :** *Masqué temporairement en V3.7 pour simplification*

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
**État :** *Masqué temporairement en V3.7 pour simplification*

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

### B. Variété des Actions & Algorithme Humain (V2.4)
Le moteur Troupers optimise la sécurité en séparant la distribution des missions et la durée d'exécution.

#### 1. Répartition des Missions (Qui fait quoi ?)
*   **40% Watch Only (Nouveau) :** Environ 4 membres sur 10 recevront l'ordre de ne PAS liker. C'est essentiel pour le réalisme.
*   **60% Engagement Actif :**
    *   Like + Favori (Majorité)
    *   Like + Commentaire (10-12%)
    *   Like + Partage (5-8%)

#### 2. Durée de Visionnage Variable (Combien de temps ?)
Pour la mission "Watch Only", la durée n'est pas fixe.
*   Chaque membre reçoit une consigne de durée personnalisée entre **60% et 95%** de la vidéo.
*   *Exemple :* Sur une vidéo de 20s, un membre devra regarder 12s (60%), un autre 19s (95%).
*   Cela évite le pattern robotique "Tout le monde quitte à la seconde 15".

**Amélioration "Ghost Viewing" :**
L'ordre "Watch Only" est calculé sur le couple **(Mission + Utilisateur)**.
Cela signifie que pour une même vidéo, certains membres devront liker, et d'autres devront juste regarder, créant un mélange organique parfait.

### C. Stabilisation Technique
*   **Correction API Bounties :** Résolution des erreurs 500 liées à des colonnes manquantes (`type`) et ajout d'une gestion d'erreur robuste.
*   **Simulatio Admin :** Le bouton "(Admin) Simuler Alerte" est désormais fiable, avec un fallback local si le Cron ne renvoie rien, permettant de tester l'interface à tout moment.
*   **Affichage :** Augmentation du nombre de missions visibles simultanément de 2 à 4 pour une meilleure ergonomie.

---

## 12. Moteur Troupers V3 (Planificateur de Vagues)

Introduction d'un système de planification stratégique pour maximiser l'impact algorithmique.

### A. Le Concept de Vague
Au lieu de diluer les actions sur 50 vidéos, le moteur concentre la puissance de l'escouade sur **8 à 12 vidéos cibles par jour**.
*   **Vague Cœur (Core) :** 5 à 7 vidéos reçoivent un soutien massif (90% engagement, 10% ghost) pour percer.
*   **Vague Bruit (Noise) :** 5 à 7 vidéos reçoivent un soutien faible (20% like, 80% abandon) pour crédibiliser l'activité du groupe.

### B. Notification Préalable
Les membres sélectionnés ("Élus du jour") reçoivent une alerte **72h à l'avance** (au lieu de 48h) sur leur Dashboard :
*   **Message :** "Vague imminente détectée".
*   **Instruction :** "Publie ta vidéo impérativement 30 à 45 min avant le début de la vague".
*   **But :** Laisser suffisamment de temps pour produire et planifier le contenu.

### C. Architecture Technique
*   **Table `daily_waves` :** Stocke le planning (Qui passe ? Quand ? Quel type ?).
*   **Moteur de Priorité :** Remplace l'aléatoire complet par une file d'attente intelligente (Queue Priority) pour garantir que tout le monde passe à son tour.
*   **Fallback V2 :** Si aucune vague n'est planifiée, le système revient automatiquement au mode aléatoire V2 pour ne jamais bloquer l'application.

### D. Verrouillage Tactique (V3.1)
Pour garantir la synchronisation parfaite lors d'une vague :
*   Les missions liées à une vague sont visibles sur le Dashboard mais **VERROUILLÉES (🔒)** le matin.
*   Elles ne se débloquent qu'à l'heure de publication prévue (45 min avant le début de la vague).
*   **Avantage :** Empêche les soldats de chercher une vidéo qui n'existe pas encore.
*   **Alternative :** Les membres voulant agir le matin peuvent toujours réaliser les missions "Mercenaires" ou "Bruit" non verrouillées.

---

## 13. Mise à jour V3.4 - Expérience de Combat & Stabilité (Janvier 2026)

Mise à jour majeure de l'interface et du moteur de mission pour fluidifier l'expérience utilisateur.

### A. Flux de Mission Automatique (Auto Flow)
Suppression de la pagination manuelle "Suivant / Précédent" qui était source de confusion et de bugs.
*   **Logique :** Le Dashboard affiche désormais *toujours* la **première mission non terminée**.
*   **Action :** Dès que l'utilisateur clique sur "J'AI TERMINÉ", la mission est validée, un toast de succès apparaît, et l'écran bascule **instantanément** sur la mission suivante.
*   **Avantage :** Réduit les clics inutiles et empêche les erreurs d'indexation (missions vides).

### B. Interface de Tir (Wave Module UX)
Refonte complète de la carte "Vague Imminente" pour la rendre interactive et pédagogique.
*   **Module de Tir :** Un champ de saisie dédié ("Colle ton lien TikTok") remplace l'ancien champ générique du profil.
*   **Verrouillage Temporel :** Le champ est désactivé le matin ("Attends 17h45"). Il s'active automatiquement et devient lumineux (Violet/Vert) quand la fenêtre de tir s'ouvre.
*   **Feedback Immédiat :** Validation visuelle "PRÊT AU COMBAT" avec icône verte dès la soumission.
*   **Clarté :** Explication visible du "Pourquoi" ("Toute l'escouade va converger vers toi pendant 2h").

### C. Hiérarchie Visuelle & Nettoyage
Réorganisation de la page d'accueil pour suivre la logique opérationnelle :
1.  **Vague Imminente (Priorité Absolue) :** En haut.
2.  **Missions du Jour (Devoir) :** Au centre.
3.  **Protocole Mercenaire (Bonus) :** Tout en bas.
*   **Suppression :** Le champ "Ma Vidéo du Jour" redondant a été retiré de la barre latérale pour éviter les erreurs de saisie. Seul le "Profil TikTok" (identité) reste permanent.

### D. Corrections Techniques (Admin & Data)
*   **Admin Planning :** Contournement des restrictions RLS (Row Level Security) via une API Route dédiée (`/api/admin/get-planning`) utilisant le `Service Role`, permettant à l'administrateur de voir les profils de tous les soldats sans erreur.
*   **Robustesse :** Correction des crashs React liés à l'hydratation des dates (SSR vs Client) en utilisant des imports dynamiques et une gestion sécurisée des objets `Date`.
*   **SQL Fix :** Ajout automatique des tables manquantes (`buddy_pairs`, `boost_windows`) via migration pour éliminer les erreurs 406 dans la console.

### E. Navigation Tactique (Smart Traffic V2)
Amélioration de la sécurité contre la détection de "trafic invalide" par TikTok.
*   **Missions Mercenaires :** Suppression totale du lien direct "Voir la vidéo". Remplacement par un protocole "Search & Find" obligatoire :
    *   Affichage du pseudo `@cible`.
    *   Bouton "COPIER" + Bouton "OUVRIR APP" (neutre, ouvre l'accueil).
*   **Missions du Jour (Bouton Intelligent) :** Le bouton "LANCER LA MISSION" adapte son comportement selon la consigne algorithmique :
    *   Si **Search** : Copie le pseudo et ouvre l'accueil TikTok.
    *   Si **Profile** : Ouvre la page de profil du membre.
    *   Si **Direct** : Ouvre la vidéo directement (seulement 20% des cas).

---

## 14. Mise à jour V3.5 - Communication & Planification (Janvier 2026)

Amélioration de la visibilité pour les soldats et mise en place d'un canal de communication direct avec le QG.

### A. Widget "Ordres de Présence" (Planning)
Nouveau module dans la barre latérale du Dashboard pour donner une visibilité à 72h.
*   **Design Hiérarchique :**
    *   **Carte Prioritaire :** Le prochain créneau (Aujourd'hui ou Demain) est affiché en grand avec un code couleur d'intensité (Bleu/Ambre/Rouge).
    *   **Liste Compacte :** Les jours suivants sont listés en dessous.
    *   **Agrégation :** Tous les créneaux d'une même journée sont fusionnés en une seule plage horaire (ex: "18:00 - 20:30") pour simplifier la lecture.
*   **Statut Repos :** Si aucune mission n'est prévue aujourd'hui, un statut "✅ REPOS ACCORDÉ" (Vert) s'affiche clairement.

### B. Système de Messagerie QG (Dual-Channel)
Remplacement du système de "Signalement" (délation) par un canal d'assistance directe.
*   **Dashboard :** Le bouton "SURVEILLANCE" devient **"SIGNALER UN PROBLÈME"**. Il ouvre un formulaire intégré (Dialog) au lieu de sortir vers une boite mail externe.
*   **Architecture Robuste (Fallback) :**
    *   Tente d'abord d'écrire dans la table dédiée `admin_messages`.
    *   Si échec (table inexistante), bascule automatiquement sur la table `reports` en mode "Self-Report" (target = reporter).
    *   Garantit que le message arrive toujours à destination.

### C. Console Admin & Inbox QG
Refonte de l'interface d'administration pour gérer ces communications.
*   **API Bypass RLS :** Création d'une route API sécurisée (`/api/admin/get-messages`) utilisant la clé `SERVICE_ROLE` pour contourner les restrictions de lecture (Row Level Security) de Supabase. Cela permet à l'admin de voir tous les messages, même ceux masqués par des règles de confidentialité strictes.
*   **Inbox Centralisée :** Un nouvel onglet "Inbox QG" fusionne les messages venant des deux canaux (`admin_messages` et `reports`).
*   **Récupération Hybride :** Pour éviter les erreurs 400 (Jointures interdites sur `auth.users`), l'admin récupère d'abord les IDs bruts, puis "hydrate" les données avec les pseudos publics via une requête parallèle sur `profiles`.

### D. UX Sécurité
*   **Verrouillage Mission :** Si une mission est verrouillée temporellement, l'interface affiche désormais un grand Cadenas 🔒 et masque totalement le bouton d'action pour empêcher les réalisations prématurées (Ghost Missions).
*   **Bilan Opérationnel :** L'ancienne page "Surveillance" a été pacifiée. Elle n'affiche plus de bouton "Signaler" mais sert uniquement de "Bilan de Transparence" (Qui a fait ses missions hier ?).

---

## 15. Mise à jour V3.7 - Simplification Tactique & Gamification (Janvier 2026)

Mise à jour majeure visant à simplifier l'expérience utilisateur (UX) en retirant les éléments superflus et en gamifiant l'exécution des ordres.

### A. Nettoyage de l'Interface (Focus Mission)
Pour réduire la charge cognitive et se concentrer sur l'essentiel (la mission active), plusieurs fonctionnalités "distrayantes" ont été désactivées temporairement :
*   **Masquage du Widget Binôme :** Le système de buddy est mis en pause pour éviter la confusion.
*   **Masquage du Protocole Mercenaire :** Les missions de rattrapage (Bounties) sont cachées pour focaliser l'attention sur les missions du jour (Waves).
*   **Suppression des "Posts TikTok" :** L'onglet d'analytique personnelle a été retiré du menu.

### B. Nouveau Système de Briefing (Tactical Avatar)
Remplacement des blocs de texte statiques par une expérience interactive immersive :
*   **Avatar Animé :** Un cercle lumineux (Bot/Shield/Star) change d'expression selon l'étape du briefing.
*   **Dialogue Typewriter :** Les instructions s'affichent lettre par lettre (effet machine à écrire) pour forcer la lecture et créer un sentiment d'urgence.
*   **Flux en 3 Étapes :**
    1.  **Cible Identifiée :** Présentation du soldat à soutenir.
    2.  **Protocole :** Instructions de sécurité (Recherche vs Profil).
    3.  **Plan d'Action :** Ordres précis numérotés (1. Regarde, 2. Like...).
*   **Mémoire Tactique :** Une fois le briefing terminé, le soldat passe en mode "Action", mais peut toujours consulter le **"Dossier Tactique (Rappel)"** (ancien MissionPlan) s'il a oublié les détails.

---

## 16. Mise à jour V3.8 - Automatisation & Fiabilité du Planning (Janvier 2026)

Correction des incohérences de planification et mise en place d'une automatisation robuste.

### A. Automatisation des Vagues (Vercel Cron)
Le planning ne dépend plus d'une action manuelle de l'administrateur.
*   **Fichier `vercel.json` :** Configuration de tâches planifiées (Cron Jobs).
*   **Schedule :**
    *   **03h00 :** Génération des Bounties (Mercenaires).
    *   **04h00 :** Planification des Vagues Stratégiques (J+1, J+2, J+3).
*   **Avantage :** Le système tourne en autonomie totale, garantissant que le planning est toujours prêt au réveil des soldats.

### B. Algorithme de Planification (Day-Zero Fix)
Correction du moteur de planification (`/api/cron/schedule-waves`) pour combler les trous immédiats.
*   **Avant :** Le script planifiait à partir de J+1 (Demain). Si un soldat rejoignait l'escouade aujourd'hui, il n'avait aucune mission prévue.
*   **Après :** Le script vérifie désormais J+0 (Aujourd'hui). S'il n'y a pas de vagues prévues pour aujourd'hui, il les génère immédiatement.

### C. UX Planning & Transparence
Amélioration du widget "Planning des missions à venir" (`WaveSchedule`) pour éviter les faux positifs ("Repos Accordé").
*   **Statut "Opérations Courantes" :** Si aucune vague spéciale n'est prévue pour la journée, le widget indique désormais clairement "Opérations Courantes - Toute la journée" au lieu de "Repos", confirmant que des missions standard sont disponibles.
*   **Indicateur "Mon Tour" :** Ajout d'une section dédiée en bas du widget qui affiche explicitement la date et l'heure de la prochaine vague où l'utilisateur est la cible ("Mon Passage").
    *   Si planifié : Affiche Date + Heure.
    *   Si non planifié : Affiche "Aucune vague programmée pour toi cette semaine".

---

## 17. Mise à jour V3.9 - Scaling de Puissance (Janvier 2026)

Ajustement stratégique pour maximiser l'impact sur l'algorithme TikTok.

### Augmentation de la Taille d'Escouade
*   **Limite précédente :** 30 membres.
*   **Nouvelle limite :** **70 membres**.
*   **Objectif :** Atteindre le seuil critique de viralité (Push Tier 1) en concentrant plus de 50 interactions simultanées sur une vidéo.
*   **Implémentation :** Mise à jour de la fonction SQL `join_squad` pour accepter jusqu'à 70 recrues avant de créer une nouvelle division.
