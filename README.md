# Trouper — Sprint Local (Cohorts)

Produit: cohorte de 14 jours (24 pros / 24 départements) pour devenir ultra visible localement.

## Concept

Voir [CONCEPT.md](file:///Users/jeanphilippe/Desktop/trouper-cohorts/CONCEPT.md).

## Pages

- `/` : page d’accueil (présentation rapide)
- `/secret-cohorts` : landing “concept” (peut être protégée par `COHORTS_SECRET_KEY`)
- `/cohorts-demo` : démo UI (optionnelle)

## Variables d’environnement

- `NEXT_PUBLIC_SUPABASE_URL` (Project URL Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clé publique Supabase, jamais une `sb_secret_*`)
- `COHORTS_SECRET_KEY` (optionnel)
