BEGIN;

ALTER TABLE public.human_marketplace_offers
  ADD COLUMN IF NOT EXISTS requester_ip text,
  ADD COLUMN IF NOT EXISTS requester_user_agent text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_human_marketplace_offers_requester_ip_submitted_at
  ON public.human_marketplace_offers(requester_ip, submitted_at DESC)
  WHERE requester_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_marketplace_offers_status_processed_at
  ON public.human_marketplace_offers(status, processed_at DESC);

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by_offer_id uuid REFERENCES public.human_marketplace_offers(id) ON DELETE SET NULL;

COMMIT;
