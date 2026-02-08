# Concept “Trouper — Sprint Local (Cohorts)”

## Idée

- Une cohorte de 14 jours où 24 pros du même métier (ex: coachs) se réunissent pour rayonner localement.
- Modèle “1 place par département” pour éviter la concurrence directe et permettre une vraie entraide.
- Objectif principal: trouver des clients (pas juste faire des vues).

## Pourquoi ça marche

- La valeur n’est pas “une checklist”. La valeur est dans ce qu’on ne peut pas faire seul:
  - collabs orchestrées,
  - passages en live,
  - débats,
  - ateliers,
  - retours humains sur ce qui bloque la conversion,
  - effet de groupe + annonces synchronisées.

## Storytelling public

- Chaque participant annonce:
  - “Je participe à un défi de 14 jours pour me faire connaître dans mon département.”
  - “C’est dur : missions quotidiennes, collabs, lives, preuves. Je relève le défi.”
- Ça crée un arc narratif qui retient l’audience + crédibilise la régularité.

## Mécanique quotidienne

- Tous les jours: 1 mission claire + 1 preuve (post/link/screenshot/compte rendu).
- À partir du Jour 5 : rotation de lives duo/trio (collabs planifiées).
- Parfois: invités externes (experts) pour mixer les audiences et créer des pics d’attention.

## Ateliers “conférence” (45 minutes)

- 2 ateliers pendant les 14 jours (ex: Jour 7 + Jour 14).
- L’atelier se fait directement sur TikTok/Instagram (zéro friction pour l’audience).
- Contenu: exercices/initiation adaptés au métier (coach: séance guidée; nutrition: plan simple; graphiste: exercice live…).

## Système de conversion (clients)

- On utilise la plateforme (TikTok/IG) pour l’audience, et le DM mot-clé pour capter:
  - CTA: “DM ATELIER” (ou “PLAN”) → on envoie rappel + ressource + prise de RDV.
  - Après live/atelier: follow-up DM structuré → RDV / offre.
- KPI: DM qualifiés, RDV, ventes (pas impressions).

## Pack “199€” (valeur perçue claire)

- 24 places / 24 départements (cohorte par métier) + invités complémentaires selon les cohortes.
- 3 lives collab minimum (duo/trio) planifiés (thèmes + structure + horaires).
- 2 ateliers 45 min (J7 + J14) sur TikTok/Instagram.
- 1 débat trio (format reach) + plan clips.
- 2 retours humains (audit bio/offre + audit DM/CTA).
- Système DM mot-clé : capture leads + relance post-live → RDV.

## Garantie (conditionnelle)

- “1 client, ou on continue”: si exécution complète + preuves, accès gratuit à la cohorte suivante jusqu’à 1 client.
- Basée sur preuves (annonces, lives, DM, posts, suivi).

## Structure produit (pages / UI déjà présentes)

- `/secret-cohorts`: landing privée du concept (protégée par `COHORTS_SECRET_KEY` possible).
- `/cohorts-demo`: démo UI (optionnelle) avec pages type leaderboard/proof/today/admin (si on la garde).
- `/`: home simple qui renvoie vers le concept.

## Principes de scope (pour éviter bugs)

- Cohorte principale = même métier (cohérence + collabs faciles).
- “Multi-thématiques” = invités (nutrition/ostéo/vente/tournage) sans casser le focus.
- Séparer les environnements (Supabase/domaine/analytics/email) entre Troupers et Trouper.
