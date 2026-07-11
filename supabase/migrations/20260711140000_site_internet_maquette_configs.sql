-- Configurations de maquette (SPEC §9) : quand un praticien répond aux 3
-- questions du configurateur, on enregistre sa situation déclarée + la brique
-- mise en avant. C'est de l'or commercial : Marius sait exactement sur quoi
-- ouvrir quand il rappelle. Écrit via le service-role (best-effort).

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_maquette_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  business_name text,
  agenda text,   -- plein | remplir
  secret text,   -- oui | non
  pain text,     -- interruption | noshow | sav | mauvais
  brique text,   -- accueil | sas | hub | visib
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_site_maquette_configs_slug_created_idx
  ON public.human_site_maquette_configs (slug, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
