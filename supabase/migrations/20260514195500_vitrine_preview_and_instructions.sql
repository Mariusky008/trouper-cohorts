ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS revision_instructions text NOT NULL DEFAULT '';

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS preview_storage_prefix text NOT NULL DEFAULT '';

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS preview_token text NOT NULL DEFAULT '';

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS preview_url text NOT NULL DEFAULT '';

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS preview_generated_at timestamptz;

ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_status_check;

ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_status_check CHECK (
    status IN (
      'queued',
      'queued_preview',
      'generated',
      'uploaded',
      'preview_uploaded',
      'approved',
      'rejected',
      'sent',
      'error'
    )
  );

CREATE INDEX IF NOT EXISTS idx_human_vitrine_sites_status_updated
  ON public.human_vitrine_sites(status, updated_at DESC);
