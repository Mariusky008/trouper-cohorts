-- Demandes reçues sur un site EN LIGNE, via l'assistante.
-- Jusqu'ici elles tombaient dans `human_site_demo_bookings` — la table des
-- réservations de démonstration — et n'étaient notifiées qu'à nous : le
-- commerçant ne les voyait jamais. Ce sont pourtant de vrais clients.
--
-- À distinguer de `human_site_bookings` : là, un créneau est réellement réservé
-- dans l'agenda du pro. Ici, personne n'a réservé quoi que ce soit — le client
-- demande à être recontacté, et `souhait` note le moment qui l'arrangerait.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  prenom text NOT NULL,
  tel text NOT NULL,
  kind text NOT NULL DEFAULT 'rdv',        -- rdv | rappel | devis | acompte
  souhait text,                            -- moment souhaité, tel que le client l'a dit
  pour_qui text,
  premiere text,
  consent boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'new',      -- new | done
  created_at timestamptz NOT NULL DEFAULT now(),
  handled_at timestamptz
);

-- Les demandes à traiter d'abord, les plus récentes en tête.
CREATE INDEX IF NOT EXISTS human_site_requests_site_status_idx
  ON public.human_site_requests (site_id, status, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
