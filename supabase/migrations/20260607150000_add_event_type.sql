-- Catalogue Privilège — type d'événement (concert, spectacle, marché, expo,
-- sport, atelier…) → pilote le theming de la carte (couleur, icône, kicker).
-- Optionnel : si NULL, la carte utilise le thème "événement" par défaut.

ALTER TABLE public.human_privilege_local_events
  ADD COLUMN IF NOT EXISTS event_type text;
