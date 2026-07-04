-- V2 "Site internet" : moteur de routing à 7 modules.
-- On ajoute `type_diagnostic` (le module recto choisi par le diagnostic) à
-- human_vitrine_sites. Les mesures détaillées et les tokens de verdict restent
-- dans `diagnostic` (jsonb) et `constats` (jsonb) déjà présents.
--
-- Valeurs : SANS_SITE, MOBILE_CASSE, FUITE_APPEL, NON_SECURISE, DECLASSE_GOOGLE,
-- VETUSTE, SANS_RESA, EXCLU (aucun défaut réel → ne pas envoyer la lettre refonte).

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS type_diagnostic text;

ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_type_diagnostic_check;
ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_type_diagnostic_check CHECK (
    type_diagnostic IS NULL OR type_diagnostic IN (
      'SANS_SITE',
      'MOBILE_CASSE',
      'FUITE_APPEL',
      'NON_SECURISE',
      'DECLASSE_GOOGLE',
      'VETUSTE',
      'SANS_RESA',
      'EXCLU'
    )
  );

-- 'excluded' rejoint le cycle de vie lettre (commerçant sans défaut réel).
ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_letter_status_check;
ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_letter_status_check CHECK (
    letter_status IN (
      'draft',
      'validated',
      'printed',
      'delivered',
      'contacted',
      'skipped',
      'excluded'
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
