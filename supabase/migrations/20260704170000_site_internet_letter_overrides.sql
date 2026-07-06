-- Corrections de texte par prospect (lettre « Site internet »).
-- Chaque texte de la lettre a une valeur par défaut calculée ; l'admin peut la
-- remplacer au cas par cas (bullets avant/après, phrase de synthèse, constats,
-- réputation…). Stocké en jsonb { clé: "texte personnalisé", ... }.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS letter_overrides jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
