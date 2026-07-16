-- Désinscription (STOP) de la liste opt-in : chaque contact reçoit un jeton
-- opaque. Le pro peut glisser un lien « pour ne plus être recontacté » dans ses
-- messages ; le client l'ouvre → opted_out_at renseigné → il disparaît de la
-- liste et ne peut plus être rajouté silencieusement. Conformité + honnêteté.

BEGIN;

ALTER TABLE public.human_site_contacts
  ADD COLUMN IF NOT EXISTS unsub_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS human_site_contacts_unsub_idx
  ON public.human_site_contacts (unsub_token);

NOTIFY pgrst, 'reload schema';

COMMIT;
