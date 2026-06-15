-- Avis catalogue : on autorise aussi les avis sur un ÉVÉNEMENT (pas seulement un commerçant).
-- La table devient polymorphe : exactement un de (place_id, event_id) est renseigné.
ALTER TABLE public.human_marketplace_place_comments
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.human_privilege_local_events(id) ON DELETE CASCADE;

ALTER TABLE public.human_marketplace_place_comments
  ALTER COLUMN place_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hmpc_event_status
  ON public.human_marketplace_place_comments(event_id, status, created_at DESC);
