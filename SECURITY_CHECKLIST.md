# Checklist sécurité & robustesse (Supabase + Next.js)

## A) Secrets & variables d’environnement

- [ ] Les clés `sb_secret_*` ne sont jamais dans `.env.local` ni dans Vercel env vars exposées.
- [ ] Seules ces variables sont côté client:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable)
- [ ] Aucune variable sensible n’a le préfixe `NEXT_PUBLIC_`.
- [ ] Les logs (server/client) n’impriment jamais les env vars.

## B) Supabase — RLS obligatoire

- [ ] RLS activée sur toutes les tables (sauf cas explicitement justifié).
- [ ] Chaque table a des policies minimales “le moins de droits possible”.
- [ ] `pre_registrations`:
  - [ ] `insert` autorisé à `anon` et `authenticated`.
  - [ ] `select/update/delete` interdits à `anon`.
  - [ ] `select` autorisé uniquement à `admin` (si nécessaire).
- [ ] Aucune policy “for all using (true)” sur une table sensible.

## C) Anti-abus (pré-inscriptions)

- [ ] Contrainte DB: `unique(email)`.
- [ ] Validation DB via `with check` (champs non vides).
- [ ] (Option recommandé) Ajout d’un contrôle serveur si spam observé:
  - rate-limit par IP (ou fingerprint) dans une route server-side,
  - honeypot field (UI) si besoin.

## D) PII (email / téléphone)

- [ ] Les pages publiques/participant n’exposent jamais email/téléphone d’autres users.
- [ ] Le leaderboard n’affiche que des données non sensibles (ex: pseudo + département).
- [ ] Les exports admin sont derrière un vrai contrôle d’accès.

## E) Auth & sessions

- [ ] Routes `/app/*` protégées (auth requise).
- [ ] Routes `/admin/*` protégées (admin requis).
- [ ] Middleware minimal: refresh session + protections (pas de logique fragile).
- [ ] Les cookies auth ne sont pas copiés/loggés.

## F) Stockage (si upload)

- [ ] Bucket privé par défaut.
- [ ] Policies storage:
  - lecture limitée au propriétaire ou admin,
  - écriture limitée au propriétaire.
- [ ] Types de fichiers + taille max contrôlés.

## G) Observabilité & continuité

- [ ] Alerting erreurs (Sentry ou équivalent) dès qu’on a du trafic.
- [ ] Backups Supabase activés en production.
- [ ] Séparation environnements: dev/preview/prod (projets Supabase distincts recommandés).

## H) Vérifs rapides avant mise en prod

- [ ] `npm run build` OK.
- [ ] Test e2e manuel: pré-inscription, login, soumission preuve, leaderboard.
- [ ] Un user non connecté ne peut pas accéder à `/app`.
- [ ] Un user non admin ne peut pas accéder à `/admin`.
