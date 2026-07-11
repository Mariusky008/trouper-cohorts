-- Réservations de démo depuis l'« accueil intelligent » de la maquette.
-- Quand un visiteur teste l'assistant et laisse ses coordonnées pour un créneau,
-- on journalise la demande ici (organisationnel uniquement : prénom, téléphone,
-- créneau — AUCUNE donnée de santé). Écrit via le service-role côté serveur
-- (src/app/api/site-internet/apercu/book-demo/route.ts), en best-effort.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_demo_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  business_name text,
  prenom text NOT NULL,
  tel text NOT NULL,
  slot text NOT NULL,
  pour_qui text,
  premiere text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_site_demo_bookings_slug_created_idx
  ON public.human_site_demo_bookings (slug, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
