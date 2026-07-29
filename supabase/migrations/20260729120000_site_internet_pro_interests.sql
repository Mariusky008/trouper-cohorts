-- Demandes d'activation Pro depuis l'Action Flash de la maquette.
-- Le commerçant coche des options (WhatsApp, réseaux, lien de réservation) puis
-- clique « Demander l'activation Pro » : rien n'est activé ni facturé, on
-- journalise l'INTENTION pour rappeler et présenter les conditions. Écrit via le
-- service-role côté serveur (src/app/api/site-internet/apercu/pro-interest/route.ts),
-- en best-effort. `annonce` = le texte que le pro venait de rédiger.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_pro_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  business_name text,
  city text,
  phone text,
  options text,
  annonce text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_site_pro_interests_slug_created_idx
  ON public.human_site_pro_interests (slug, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
