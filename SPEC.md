# Cahier des charges — Trouper Cohorts

## 0) Objectif

Construire une plateforme très simple pour l’utilisateur, mais robuste techniquement, qui permet d’exécuter un sprint de 14 jours en cohorte et de convertir (DM/RDV/ventes).

## 1) Principes non négociables

- Simplicité d’usage > fonctionnalités.
- Aucune clé secrète côté client. Tout ce qui est `NEXT_PUBLIC_*` est considéré public.
- RLS partout dans Supabase. Pas de tables “écrites par tout le monde” hors pré-inscription.
- Le produit doit rester utilisable même si certaines features “nice-to-have” sont absentes.
- Traçabilité: on doit pouvoir diagnostiquer un problème (logs, erreurs, état DB cohérent).

## 2) Glossaire

- Cohorte: un sprint de 14 jours pour un métier donné (ex: coachs sportifs).
- Slot département: 1 place par département dans une cohorte.
- Mission: tâche du jour (1/jour) avec une preuve attendue.
- Preuve (submission): lien/capture/compte rendu validant la mission.

## 3) Rôles & permissions

### Anonyme (anon)

- Peut uniquement créer une pré-inscription.

### Participant (authenticated)

- Peut lire les infos de sa cohorte.
- Peut voir la mission du jour.
- Peut créer/modifier ses preuves.
- Peut voir un leaderboard agrégé (sans données sensibles).

### Coach / Admin

- Peut créer/éditer une cohorte.
- Peut gérer les participants et l’attribution des départements.
- Peut créer/éditer les missions.
- Peut modérer/valider des preuves si besoin.
- Peut exporter (CSV) les inscriptions/participants.

## 4) Périmètre produit — MVP

### Parcours acquisition

- Landing concept privée: `/secret-cohorts` (protégée optionnellement par `COHORTS_SECRET_KEY`).
- Formulaire pré-inscription: insert dans `pre_registrations`.

### Parcours participant (app)

- Auth simple (OTP/magic link recommandé).
- Page “Aujourd’hui”: mission du jour + CTA “soumettre une preuve”.
- Page “Preuves”: historique jour par jour (statuts, liens).
- Page “Classement”: score simple basé sur régularité (streak) + complétion.
- Paramètres/profil: département, métier, plateforme, objectif, liens.

### Parcours coach/admin (backoffice)

- Créer une cohorte (métier, dates, règles).
- Voir les pré-inscriptions, convertir en participants.
- Attribuer un département (1 place par département).
- Éditer les missions 1..14.
- Voir la complétion et relancer (email).
- Export CSV (pré-inscriptions + participants + preuves).

## 5) Hors périmètre (pour rester simple)

- Paiement in-app (Stripe) dans le MVP.
- Chat temps réel.
- Multi-cohortes simultanées pour un même utilisateur.
- IA “auto-missions”.
- Gestion d’équipes complexes / permissions fines (au-delà admin/participant).

## 6) UX / IA de navigation (pages)

- `/` : home simple → CTA vers concept.
- `/secret-cohorts` : landing + pré-inscription.
- `/app` (protégé):
  - `/app/today`
  - `/app/proof`
  - `/app/leaderboard`
  - `/app/settings`
- `/admin` (protégé admin):
  - `/admin/cohorts`
  - `/admin/cohorts/[id]/missions`
  - `/admin/cohorts/[id]/participants`
  - `/admin/pre-registrations`
  - `/admin/exports`

## 7) Données (Supabase) — schéma cible MVP

### Tables

- `pre_registrations`
  - Rôle: capture leads (anon write).
- `profiles`
  - Rôle: profil participant (1 row par user).
- `cohorts`
  - Rôle: définition d’une cohorte (métier, dates).
- `cohort_slots`
  - Rôle: mapping cohorte × département → user_id (unicité département).
- `missions`
  - Rôle: 14 missions par cohorte (day_index 1..14).
- `submissions`
  - Rôle: preuve d’un user pour une mission (1 max par mission/user).
- `cohort_members`
  - Rôle: appartenance à une cohorte (si différent de `cohort_slots`).

### Invariants

- 1 cohorte = 14 missions.
- 1 département = 1 participant par cohorte.
- 1 participant = 1 preuve maximum par mission (MVP: update, pas versioning).
- Leaderboard ne doit pas exposer emails/téléphones.

## 8) Sécurité (résumé)

- Le client utilise uniquement la publishable key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Les opérations admin doivent se faire côté serveur (route handlers) ou via RLS/policies d’admin.
- RLS activée sur chaque table, policies minimales.
- Anti-abus pré-inscription: `unique(email)` + (optionnel) rate-limit server-side si on observe du spam.

## 9) Observabilité & ops

- Erreurs front: au minimum logs console en dev, idéalement un outil type Sentry ensuite.
- Côté Supabase: audit logs + monitoring quotas.
- Backups activés quand la cohorte est payante / en prod.
- Environnements séparés (dev/preview/prod) dès que possible.

## 10) Critères d’acceptation (Definition of Done)

- Pré-inscription: l’insert marche en anon et la ligne apparaît en DB.
- Auth: un user peut se connecter et accéder à `/app`.
- Aujourd’hui: mission du jour affichée, preuve soumise puis visible dans “Preuves”.
- Leaderboard: affiché sans fuite de PII (email/tel).
- Admin: créer cohorte + missions + participants + export.
- Sécurité: aucune clé `sb_secret_*` n’est exposée; RLS empêche lectures/écritures non autorisées.
