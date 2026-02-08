# Roadmap — issues GitHub (prêtes à copier-coller)

Ces tickets sont volontairement “MVP-first”. L’idée: livrer vite un produit utilisable, puis durcir.

---

## Epic 0 — Fondations (robustesse)

### Issue: Finaliser le schéma Supabase MVP (cohorts/missions/submissions)

**Objectif**
- Avoir les tables et relations MVP prêtes, avec contraintes et indexes utiles.

**À faire**
- Créer `cohorts`, `missions`, `cohort_slots`, `submissions`, `cohort_members` (si nécessaire).
- Ajouter contraintes d’unicité (département/cohorte, mission/jour/cohorte, submission/user/mission).
- Ajouter indexes sur clés de jointure et filtres fréquents.

**DoD**
- Schéma appliqué en DB + vérifié dans Supabase Table Editor.

### Issue: Écrire les policies RLS MVP (participant + admin)

**Objectif**
- Sécuriser toutes les tables avec policies minimales.

**À faire**
- Définir le modèle admin (champ `role` dans `profiles` ou table `admins`).
- Policies:
  - participants: lecture cohorte + missions + leurs submissions; écriture limitée à leurs submissions.
  - admin: lecture/écriture sur cohortes/missions/exports.
- Vérifier que `pre_registrations` n’est pas lisible en anon.

**DoD**
- Tests manuels: anon ne lit rien; participant ne voit pas PII; admin voit tout.

### Issue: Seed cohorte de test (14 jours)

**Objectif**
- Avoir une cohorte “demo” et 14 missions pour développer sans friction.

**À faire**
- Script SQL seed (ou seed via UI admin si déjà fait).

**DoD**
- Un participant peut voir “mission du jour” sur un dataset cohérent.

---

## Epic 1 — Auth & App participant

### Issue: Mettre en place l’auth Supabase (OTP/magic link)

**Objectif**
- Connexion simple pour accéder à `/app`.

**À faire**
- Pages `/login` (ou flow intégré) + protection `/app/*`.
- Gestion session côté serveur (Next + @supabase/ssr).

**DoD**
- User peut se connecter, refresh, logout.

### Issue: Page `/app/today` (mission du jour + statut)

**Objectif**
- L’utilisateur comprend quoi faire aujourd’hui en 10 secondes.

**À faire**
- Afficher mission du jour de sa cohorte.
- CTA “soumettre une preuve”.
- Gestion statut (non soumis/soumis/validé).

**DoD**
- Soumission crée/maj une ligne `submissions`.

### Issue: Page `/app/proof` (historique des preuves)

**Objectif**
- Donner une vue claire des 14 jours.

**À faire**
- Liste jours 1..14 + statut + proof_url.
- Filtres simples (tout / en retard / validés).

**DoD**
- Les données viennent uniquement de tables autorisées par RLS.

### Issue: Page `/app/leaderboard` (score simple)

**Objectif**
- Motiver sans complexité.

**À faire**
- Règle scoring: streak + complétion (documentée).
- UI leaderboard (top 24).

**DoD**
- Aucun email/tel exposé.

### Issue: Page `/app/settings` (profil)

**Objectif**
- Capturer les infos utiles (département, plateforme, objectif).

**À faire**
- Form profil + update `profiles`.

**DoD**
- Le participant ne peut modifier que son profil.

---

## Epic 2 — Admin/Coach

### Issue: Backoffice `/admin/cohorts` (CRUD cohorte)

**Objectif**
- Créer et paramétrer une cohorte.

**À faire**
- Liste cohortes + création + édition (dates, métier, statut).

**DoD**
- Accessible uniquement admin.

### Issue: Backoffice missions (édition 14 jours)

**Objectif**
- Gérer les 14 missions rapidement.

**À faire**
- UI d’édition en grille (jour 1..14).
- Template mission + duplication.

**DoD**
- Missions persistées en DB + visibles côté participant.

### Issue: Backoffice participants (slots département)

**Objectif**
- Assigner 1 user ↔ 1 département.

**À faire**
- UI “carte de France” simplifiée ou table département.
- Validation: pas de doublon.

**DoD**
- Un participant voit son département et sa cohorte.

### Issue: Pré-inscriptions → participants (workflow)

**Objectif**
- Convertir une pré-inscription en compte/participant.

**À faire**
- Vue des `pre_registrations` côté admin.
- Action “envoyer lien d’accès” (email) ou “inviter”.

**DoD**
- Conversion traçable (statut, date).

### Issue: Export CSV admin

**Objectif**
- Pouvoir sortir les données pour ops.

**À faire**
- Export pré-inscriptions.
- Export participants + progression.

**DoD**
- Export accessible uniquement admin.

---

## Epic 3 — Durcissement & anti-abus

### Issue: Anti-spam pré-inscription (option)

**Objectif**
- Réduire abus sur formulaire public.

**À faire**
- Ajouter honeypot côté UI.
- Rate-limit server-side (route handler) si spam observé.

**DoD**
- Spam basique stoppé sans friction utilisateur.

### Issue: Observabilité (erreurs)

**Objectif**
- Diagnostiquer rapidement les bugs en prod.

**À faire**
- Brancher un outil d’erreurs (Sentry ou équivalent).
- Capturer erreurs sur soumission preuve + auth + admin.

**DoD**
- Une erreur volontaire apparaît dans le dashboard d’erreurs.

### Issue: Buckets storage (si upload preuve)

**Objectif**
- Permettre upload de captures proprement.

**À faire**
- Bucket + policies (owner/admin).
- Limites taille/type.

**DoD**
- Upload et lecture conformes aux policies.
