#!/usr/bin/env bash
# COMPILER LA MAQUETTE SANS LES SECRETS DE PRODUCTION.
#
# POURQUOI CE FICHIER EXISTE, ET POURQUOI IL EST DANS LE DÉPÔT.
# `src/lib/stripe.ts` lève une exception à l'import si `STRIPE_SECRET_KEY`
# manque, et Next.js importe toutes les routes pour construire les pages
# statiques : sans clé, la compilation s'arrête sur
# /api/commando/checkout — alors même qu'aucune des pages du Direct n'a
# quoi que ce soit à voir avec le paiement.
#
# Les valeurs ci-dessous sont des ESPACES RÉSERVÉS, jamais des secrets : elles
# ne servent qu'à laisser les modules s'importer. Aucun appel réseau n'est fait
# pendant la compilation, et ces routes sont `force-dynamic`, donc rien n'est
# figé dans le build.
#
# ET IL EST VERSIONNÉ, PARCE QU'IL A DÉJÀ ÉTÉ PERDU UNE FOIS. Il vivait dans un
# dossier temporaire, que le conteneur a vidé : plus de script, plus de
# compilation, et une demi-heure à comprendre pourquoi. Ce qui sert à
# fabriquer le produit appartient au produit.
set -euo pipefail
cd "$(dirname "$0")/.."

export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_espace_reserve}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_espace_reserve}"
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://exemple.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-espace_reserve}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-espace_reserve}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://www.clikme.fr}"

# LA FEUILLE DE STYLE EN LIGNE D'ABORD. Un accent grave dans un commentaire CSS
# referme le littéral de gabarit et casse la page sans que la compilation s'en
# aperçoive — déjà payé six fois. Le vérificateur coûte deux secondes.
node scripts/verifier-styles-en-ligne.mjs

npm run build
