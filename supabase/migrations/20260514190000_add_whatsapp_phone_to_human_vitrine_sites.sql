ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS whatsapp_phone_e164 text;

ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_whatsapp_phone_check;

ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_whatsapp_phone_check CHECK (
    whatsapp_phone_e164 IS NULL
    OR whatsapp_phone_e164 ~ '^\+33[67][0-9]{8}$'
  );

ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_status_check;

ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_status_check CHECK (
    status IN ('queued', 'generated', 'uploaded', 'approved', 'rejected', 'sent', 'error')
  );

CREATE INDEX IF NOT EXISTS idx_human_vitrine_sites_whatsapp_phone
  ON public.human_vitrine_sites(whatsapp_phone_e164);
