-- Galerie photos (carrousel) pour les offres du catalogue Privilège.
-- offer_photo_url reste la photo de couverture ; offer_gallery_urls = photos additionnelles (ordonnées).
alter table human_marketplace_places
  add column if not exists offer_gallery_urls text[] default '{}'::text[];
