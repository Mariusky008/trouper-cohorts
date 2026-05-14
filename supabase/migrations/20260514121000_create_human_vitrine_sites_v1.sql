BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vitrines',
  'vitrines',
  true,
  15728640,
  ARRAY[
    'text/html',
    'text/plain',
    'text/css',
    'application/javascript',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'font/woff2',
    'font/woff'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.human_vitrine_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  business_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  source_website text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'generated',
  public_url text NOT NULL DEFAULT '',
  storage_prefix text NOT NULL DEFAULT '',
  error_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  approved_at timestamptz,
  rejected_at timestamptz,
  sent_at timestamptz,
  CONSTRAINT human_vitrine_sites_slug_check CHECK (char_length(slug) BETWEEN 2 AND 80),
  CONSTRAINT human_vitrine_sites_status_check CHECK (
    status IN ('generated', 'uploaded', 'approved', 'rejected', 'sent', 'error')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_vitrine_sites_slug
  ON public.human_vitrine_sites(slug);

CREATE INDEX IF NOT EXISTS idx_human_vitrine_sites_status_created
  ON public.human_vitrine_sites(status, created_at DESC);

ALTER TABLE public.human_vitrine_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human vitrines admin read" ON public.human_vitrine_sites;
CREATE POLICY "human vitrines admin read"
  ON public.human_vitrine_sites
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human vitrines admin write" ON public.human_vitrine_sites;
CREATE POLICY "human vitrines admin write"
  ON public.human_vitrine_sites
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
