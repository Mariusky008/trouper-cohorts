-- Popey v3 — Agenda : lien « site web » optionnel sur un événement local (affiché dans l'app cliente).
BEGIN;
ALTER TABLE public.human_privilege_local_events
  ADD COLUMN IF NOT EXISTS website_url text;
COMMIT;
