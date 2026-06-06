-- Catalogue Privilège — refonte juin 2026 (suite)
-- Champs catalogue complémentaires sur les commerces :
--  • promo_code        : code promo unique par commerçant (POPEY-XXX-%),
--                        affiché sur l'offre du catalogue + la carte digitale.
--  • offer_address     : adresse affichée dans "+ infos".
--  • total_spots       : nombre de places total de l'offre (→ "X places restantes").
-- Additif (ADD COLUMN IF NOT EXISTS) → sans risque sur l'existant.

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS offer_address text,
  ADD COLUMN IF NOT EXISTS total_spots integer;
