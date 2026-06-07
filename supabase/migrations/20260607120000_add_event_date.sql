-- Catalogue Privilège — date/heure précise des événements locaux.
-- Permet d'afficher un COMPTE À REBOURS live ("J-3 · 3j 4h 12min") sur la carte
-- événement du catalogue swipe. Optionnel : si NULL, la carte affiche juste le
-- libellé texte (day_label) sans compte à rebours.

ALTER TABLE public.human_privilege_local_events
  ADD COLUMN IF NOT EXISTS event_date timestamptz;
