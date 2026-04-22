BEGIN;

ALTER TABLE public.human_smart_scan_contacts
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS import_batch_id text,
  ADD COLUMN IF NOT EXISTS import_index integer,
  ADD COLUMN IF NOT EXISTS last_imported_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_external_ref_unique
  ON public.human_smart_scan_contacts(owner_member_id, external_contact_ref);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_import_index
  ON public.human_smart_scan_contacts(owner_member_id, import_index);

COMMIT;
