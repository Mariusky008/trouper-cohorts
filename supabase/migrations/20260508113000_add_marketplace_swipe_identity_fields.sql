BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS owner_display_name text,
  ADD COLUMN IF NOT EXISTS owner_profile_photo_url text,
  ADD COLUMN IF NOT EXISTS offer_expires_at date;

COMMIT;
