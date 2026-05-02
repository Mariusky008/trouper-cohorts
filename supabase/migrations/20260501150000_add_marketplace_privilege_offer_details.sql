ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS offer_photo_url text,
  ADD COLUMN IF NOT EXISTS offer_website_url text,
  ADD COLUMN IF NOT EXISTS offer_description text,
  ADD COLUMN IF NOT EXISTS direct_contact text,
  ADD COLUMN IF NOT EXISTS partner_offer_value_eur numeric(10,2);
