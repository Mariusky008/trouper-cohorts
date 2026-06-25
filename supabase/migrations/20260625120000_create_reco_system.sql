-- Collectif Popey — colonnes d'onboarding pro sur human_marketplace_places
-- Utilisé par /rejoindre/[commerce] : activation en 30 secondes depuis la lettre QR

BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS commerce_slug  text,
  ADD COLUMN IF NOT EXISTS prenom         text,
  ADD COLUMN IF NOT EXISTS genre          text,
  ADD COLUMN IF NOT EXISTS reco_status    text NOT NULL DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS deadline_at    timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS pro_whatsapp   text;

ALTER TABLE public.human_marketplace_places
  ADD CONSTRAINT reco_status_check CHECK (
    reco_status IN ('prospect','claimed','expired')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_commerce_slug
  ON public.human_marketplace_places(commerce_slug)
  WHERE commerce_slug IS NOT NULL;

COMMIT;
