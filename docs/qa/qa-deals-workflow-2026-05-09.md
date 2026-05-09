# QA — Workflow “deals / tickets commission” (5 étapes)

Date : 09/05/2026  
Environnement : Production (`https://www.popey.academy`)  

## Objectif
Valider de bout en bout le workflow : admin → validation d’un deal/ticket → visibilité côté pro → visibilité côté éclaireur → notifications.

## Étape 1 — Connexion admin + accès fonctionnalités
Action :
- Accès à `/admin/humain`
- Vérification présence navigation admin (Marketplace / Affiliation / Commissions / Chat WhatsApp) + bouton “Déconnexion”

Résultat : OK (admin connecté, accès complet).

Capture :
- `qa-01-admin-home.png`

Temps de réponse observé :
- Chargement initial (écran “Chargement de votre espace…”) puis UI : ~2 s

## Étape 2 — Localiser un deal en attente + valider
Action :
- Accès à `/admin/humain/affiliation?period=all`
- Sélection d’un ticket en attente de validation commission
- Saisie d’une note “QA: validation deal”
- Clic “✅ Valider commission”

Résultat : OK (redirection avec `marketStatus=success` et message : “Commission validée (ticket mis à jour)”).

Ticket validé (admin) :
- Code ticket affiché : `POPEY-123DC2`
- Activation ID (URL `marketFocus`) : `123dc211-d1e2-4da5-91b4-ac4593770314`
- Pro ciblé (UI) : Pierre (Bayonne-Anglet-Biarritz)

Captures :
- `qa-02-affiliation-tickets-before.png`
- `qa-03-affiliation-tickets-after.png`

Temps de réponse observé :
- Validation commission + retour “success” : ~2–3 s

## Étape 3 — Vérifier côté Pro (dashboard / statut “validé”)
Action prévue (cible produit) :
- Ouvrir webapp pro, se connecter avec le pro associé au deal validé
- Vérifier le deal apparaît en “Validé” + notifications liées à la validation

Exécution possible via l’API “preview pro dashboard” :
- Endpoint : `/api/popey-human/eclaireur-preview/public-pro-dashboard`
- Tentative de mapping par `ref_name=Pierre` : aucune donnée renvoyée (le pro “Pierre” n’est pas retrouvable par ce mode de lookup).

Contrôle de référence effectué (pro existant dans la preview) :
- `ref_name=Boost Pro&city=grand-dax` → pipeline + notifications présents (baseline).

Captures :
- `qa-04b-pro-dashboard-boostpro-before.png`

Blocage / anomalie :
- Le pro du ticket `POPEY-123DC2` ne peut pas être retrouvé via le mode `ref_name` sur le dashboard preview (à corriger : fournir `member_id` dans les liens pro, ou normaliser `partner_name`).

## Étape 4 — Vérifier côté Éclaireur (deal visible + actions)
Action prévue (cible produit) :
- Ouvrir webapp éclaireur, se connecter, vérifier le deal validé est visible et que les actions fonctionnent

Exécution réalisée :
- Token éclaireur dispo en session : `5f1134603fdc47e5b5cfa8165d7de89d`
- Endpoint vérifié : `/api/popey-human/eclaireur-preview/public-apporteur-dashboard?token=...`

Résultat : OK pour l’accès (dashboard renvoie `success:true`), mais aucun deal/commission dans la timeline pour ce token (données non liées au ticket testé).

## Étape 5 — Notifications (pro + éclaireur)
Action prévue (cible produit) :
- Vérifier push/email/in-app côté pro et éclaireur après validation

Constats :
- Le workflow “preview pro dashboard” expose un champ `notifications`, mais on ne peut pas valider la notification associée au ticket `POPEY-123DC2` faute de mapping pro.
- Pour l’éclaireur, les notifications de décision commission (`commission_decision_approved/rejected`) dépendent d’un ticket attribué à un `scout_id/token` : pas le cas du ticket testé (source “apporteur déclaré”).

## Conclusion
Étapes 1–2 : OK (validation admin opérationnelle).  
Étapes 3–5 : partiellement testables dans l’environnement actuel, à cause de la traçabilité/mapping insuffisants côté pro/éclaireur pour le ticket validé.

## Recommandations QA
1) Ajouter un lien “Ouvrir dashboard pro” par ticket (avec `member_id` quand dispo) pour rendre la QA pro systématique.  
2) Pour les tickets “apporteur déclaré”, prévoir un rattachement apporteur (phone + token ou id) si on veut valider le flux éclaireur.  
3) Ajouter un panneau “Journal notifications” dans l’admin (ou lien direct) pour vérifier les envois (in-app/email/push) par activation_id.

