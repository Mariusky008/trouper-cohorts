BEGIN;

CREATE TABLE IF NOT EXISTS public.human_review_prospects (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              text           NOT NULL,
  telephone        text           NOT NULL,
  proprietaire     text,
  ville            text           NOT NULL,
  secteur          text,
  adresse          text,
  place_id         text,
  note_google      numeric(3,1),
  nb_avis          integer,
  source           text           NOT NULL DEFAULT 'apify',
  statut           text           NOT NULL DEFAULT 'nouveau',
  date_contact     timestamptz,
  template_sid_used text,
  created_at       timestamptz    NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT human_review_prospects_source_check CHECK (
    source IN ('apify', 'manual')
  ),
  CONSTRAINT human_review_prospects_statut_check CHECK (
    statut IN ('nouveau', 'contacté', 'converti', 'refusé')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_review_prospects_telephone
  ON public.human_review_prospects(telephone);

CREATE INDEX IF NOT EXISTS idx_human_review_prospects_statut
  ON public.human_review_prospects(statut, created_at DESC);

ALTER TABLE public.human_review_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human review prospects admin read" ON public.human_review_prospects;
CREATE POLICY "human review prospects admin read"
  ON public.human_review_prospects
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human review prospects admin write" ON public.human_review_prospects;
CREATE POLICY "human review prospects admin write"
  ON public.human_review_prospects
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
