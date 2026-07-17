-- Passage « démo → client » : publier le site (retire l'habillage démo) + noter
-- le domaine perso du commerçant. Le site est déjà fonctionnel ; « published »
-- bascule juste l'affichage en mode réel.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_domain text;

CREATE INDEX IF NOT EXISTS human_vitrine_sites_custom_domain_idx
  ON public.human_vitrine_sites (custom_domain) WHERE custom_domain IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
