-- Mini-agenda maison (prise de rendez-vous réelle). Le pro définit ses fenêtres
-- de disponibilité par jour de semaine + une durée de créneau ; le client réserve
-- un vrai créneau qui se bloque (pas de double-réservation). Tout est stocké en
-- HEURE LOCALE (« YYYY-MM-DDTHH:MM », Europe/Paris) pour éviter les pièges de
-- fuseau : la génération de créneaux et la réservation utilisent la même échelle.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS booking_slot_minutes int NOT NULL DEFAULT 30;

-- Fenêtres de disponibilité : une ligne par jour ouvré (plage unique en v1).
CREATE TABLE IF NOT EXISTS public.human_site_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  weekday int NOT NULL,        -- 0 = dimanche … 6 = samedi
  start_min int NOT NULL,      -- minutes depuis minuit (ex. 540 = 09:00)
  end_min int NOT NULL,        -- ex. 1080 = 18:00
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS human_site_availability_site_wd_idx
  ON public.human_site_availability (site_id, weekday);

-- Rendez-vous réels.
CREATE TABLE IF NOT EXISTS public.human_site_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  slot_local text NOT NULL,    -- « YYYY-MM-DDTHH:MM » heure locale (Europe/Paris)
  prenom text,
  tel text,
  consent boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'confirmed',   -- confirmed | cancelled
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Un seul RDV actif par créneau (anti double-réservation) ; un créneau annulé
-- peut être re-réservé.
CREATE UNIQUE INDEX IF NOT EXISTS human_site_bookings_active_slot_idx
  ON public.human_site_bookings (site_id, slot_local) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS human_site_bookings_site_idx
  ON public.human_site_bookings (site_id, slot_local);

NOTIFY pgrst, 'reload schema';

COMMIT;
