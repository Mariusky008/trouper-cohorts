-- « Suivre ce commerce » : le VISITEUR du site s'abonne lui-même, au lieu que le
-- commerçant saisisse ses clients à la main. Même table opt-in (une seule
-- audience, un seul retrait), avec source = 'site'.
--
-- On conserve la PREUVE du consentement : la phrase exacte acceptée et l'horodatage.
-- Sans ça, un opt-in ne se démontre pas. `topics` = ce que la personne accepte de
-- recevoir (places libres, offres, événements…), pour ne pas tout envoyer à tout
-- le monde. Vide = tout.

BEGIN;

ALTER TABLE public.human_site_contacts
  ADD COLUMN IF NOT EXISTS topics text[],
  ADD COLUMN IF NOT EXISTS consent_text text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;

-- Les inscriptions venues du site public, les plus récentes d'abord.
CREATE INDEX IF NOT EXISTS human_site_contacts_site_source_idx
  ON public.human_site_contacts (site_id, source, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
