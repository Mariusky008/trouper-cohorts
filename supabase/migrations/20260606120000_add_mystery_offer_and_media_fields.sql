-- Catalogue Privilège — refonte juin 2026
-- Champs additionnels sur les commerces du catalogue swipe :
--  • is_mystery_offer / mystery_deal_label : offres "plaisir" (resto, spa…)
--    révélées en carte mystère tous les 4 swipes.
--  • offer_video_url : vidéo verticale 15s du commerçant (différenciateur clé).
--  • coup_de_coeur_text : note manuscrite du membre mise en avant sur la carte.
-- Tout est additif (ADD COLUMN IF NOT EXISTS) → sans risque sur l'existant.

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS is_mystery_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mystery_deal_label text,
  ADD COLUMN IF NOT EXISTS offer_video_url text,
  ADD COLUMN IF NOT EXISTS coup_de_coeur_text text;

-- Index partiel pour récupérer rapidement les offres mystère actives.
CREATE INDEX IF NOT EXISTS idx_marketplace_places_mystery
  ON public.human_marketplace_places (is_mystery_offer)
  WHERE is_mystery_offer = true;
