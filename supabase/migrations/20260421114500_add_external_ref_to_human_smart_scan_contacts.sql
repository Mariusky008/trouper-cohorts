BEGIN;

ALTER TABLE public.human_smart_scan_contacts
  ADD COLUMN IF NOT EXISTS external_contact_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS human_smart_scan_contacts_owner_external_ref_unique
  ON public.human_smart_scan_contacts(owner_member_id, external_contact_ref)
  WHERE external_contact_ref IS NOT NULL;

COMMIT;
