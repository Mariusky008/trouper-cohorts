# Déploiement sur OVH (ou autre VPS)

Le fichier `vercel.json` ne fonctionne que sur Vercel. Sur OVH, vous devez configurer la tâche planifiée (Cron Job) vous-même pour que le Protocole Mercenaire fonctionne.

## 1. Variables d'Environnement
Assurez-vous d'avoir défini une variable `CRON_SECRET` dans votre fichier `.env` sur le serveur (ou dans l'interface de déploiement).
Exemple : `CRON_SECRET=mon_super_secret_123`

## 2. Créer la Tâche Automatique (Cron Job)

Il y a deux façons de faire :

### Option A : Via un service externe (Le plus simple)
Utilisez un service gratuit comme **cron-job.org** ou **easycron.com**.
1. Créez un compte.
2. Ajoutez une nouvelle tâche ("Create Cronjob").
3. URL à appeler : `https://votre-domaine.com/api/cron/generate-bounties?key=mon_super_secret_123`
   *(Remplacez `mon_super_secret_123` par la valeur de votre CRON_SECRET)*
4. Fréquence : Tous les jours à 23h59 (ou 00h01).

### Option B : Via le serveur (Si vous avez un VPS Linux)
Connectez-vous à votre serveur en SSH et éditez la crontab :

1. Ouvrez l'éditeur :
```bash
crontab -e
```

2. Ajoutez cette ligne à la fin du fichier (pour une exécution tous les jours à minuit) :
```bash
0 0 * * * curl "https://votre-domaine.com/api/cron/generate-bounties?key=mon_super_secret_123" > /dev/null 2>&1
```

C'est tout ! Le script s'exécutera automatiquement chaque nuit pour détecter les déserteurs et créer les missions.
