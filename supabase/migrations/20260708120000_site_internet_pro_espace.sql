-- Espace Pro privé : l'« Assistant Avis Google ».
-- Le commerçant ouvre un lien privé (token) et, en un geste, invite un client à
-- laisser un avis Google via WhatsApp (aucun CRM, aucune API — un simple wa.me).
-- On journalise chaque demande pour afficher « vos demandes du jour ».

BEGIN;

-- Jeton d'accès privé au /pro (long, imprévisible). Généré à la demande.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS pro_token text;

CREATE UNIQUE INDEX IF NOT EXISTS human_vitrine_sites_pro_token_uq
  ON public.human_vitrine_sites (pro_token)
  WHERE pro_token IS NOT NULL;

-- Journal des demandes d'avis (une ligne par « Ouvrir WhatsApp »).
CREATE TABLE IF NOT EXISTS public.human_site_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  client_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_site_review_requests_site_created_idx
  ON public.human_site_review_requests (site_id, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
