# Documentation du Protocole Mercenaire (TROUPERS)

Ce document décrit le fonctionnement technique et les règles du système de pénalité et de rattrapage appelé **"Protocole Mercenaire"**.

## 1. Principe Général

Le but est de garantir que chaque membre de l'escouade reçoive le soutien promis (Likes/Commentaires), même si un soldat déserte (ne fait pas ses missions).

*   **Si un soldat fait ses missions :** Tout va bien, il gagne des points.
*   **Si un soldat NE fait PAS ses missions :** Il est puni le lendemain matin, et ses missions sont offertes aux autres (les Mercenaires) contre récompense.

## 2. Le Script Automatique (`cron/generate-bounties`)

Un script tourne automatiquement chaque nuit (idéalement à minuit ou 01h00 du matin).

### Ce qu'il vérifie :
1.  Il récupère tous les membres de toutes les escouades.
2.  Pour chaque membre, il regarde : *"A-t-il soutenu ses camarades aujourd'hui ?"* (vérification dans la table `daily_supports`).
3.  Il vérifie si le membre a posé un jour de repos officiel (**Demain je suis OFF**).

### Les Règles de Décision :

| Situation | Conséquence pour le Soldat | Conséquence pour l'Escouade |
| :--- | :--- | :--- |
| **Mission Faite** | ✅ Rien (Tout va bien) | ✅ Soutien reçu |
| **Mission NON Faite (Injustifié)** | ❌ **Strike (+1)** <br> ❌ **Discipline (-10 pts)** | 🚨 **Création d'une Bounty** (Mission Mercenaire) |
| **Mission NON Faite (Jour OFF)** | ⏸️ Rien (Pas de punition) | 🚨 **Création d'une Bounty** (Pour garantir le soutien) |

## 3. Les Sanctions (Discipline)

Le score de Discipline commence à **100 points**.

*   **-10 points** par mission manquée non justifiée.
*   **Zone Rouge (< 50 points) :** Le soldat voit une bannière d'alerte critique sur son tableau de bord.
    *   **Conséquence :** Ses missions normales sont suspendues.
    *   **Comment s'en sortir ?** Il doit attendre que ses camarades accomplissent les missions mercenaires pour lui (le sauvetage) ou attendre le lendemain minuit pour une réinitialisation partielle (si le score le permet).

## 4. Les Missions Mercenaires (Bounties) & Réinitialisation Minuit

Quand une mission est ratée, elle devient une "Bounty" publique pour l'escouade.

*   **Qui la voit ?** Tous les autres membres de l'escouade.
*   **Récompense :** +1 Crédit Boost + 50 XP Gloire.
*   **Action :** Le Mercenaire doit faire l'action (Liker/Commenter) à la place du déserteur.
*   **Résultat :** La victime reçoit quand même son like, et le Mercenaire est récompensé.

### Que se passe-t-il à Minuit ?
Chaque jour à minuit (heure du serveur), le cycle recommence :
1.  **Réinitialisation :** Les anciennes missions du jour précédent disparaissent.
2.  **Nouvelles Missions :** De nouvelles missions (tâches) sont générées pour tous les soldats valides.
3.  **Rotation :** Les tâches changent (ex: si hier c'était "Liker", demain ce sera peut-être "Commenter").
4.  **Restriction :** Si votre score est toujours en Zone Rouge (< 50 pts), vous resterez bloqué même après minuit tant que vous n'aurez pas racheté votre conduite (via des missions mercenaires futures).

## 5. Fonctionnement Technique (Base de Données)

*   **Table `bounties` :** Stocke les missions de rattrapage disponibles.
*   **Table `squad_members` :** Stocke le compteur de `defector_strikes` (nombre de défaillances).
*   **Table `profiles` :** Stocke le `discipline_score` (0 à 100).
*   **Fonction SQL `increment_strikes` :** Appliquée par le script pour réduire le score et ajouter un strike.

## 6. Comment Déclencher Manuellement (Test)

Vous pouvez déclencher le script manuellement via une requête web sécurisée (pour tester ou forcer une mise à jour) :

```bash
GET /api/cron/generate-bounties?key=[VOTRE_CLE_SECRETE]
```

---
*Dernière mise à jour : 02 Janvier 2026*
