BEGIN;

CREATE TABLE IF NOT EXISTS public.human_review_avis_negatifs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_final_id   uuid        NOT NULL REFERENCES public.human_review_clients_finaux(id) ON DELETE CASCADE,
  commercant_id     uuid        NOT NULL REFERENCES public.human_review_commercants(id) ON DELETE CASCADE,

  message           text        NOT NULL,
  traite            boolean     NOT NULL DEFAULT false,
  traite_at         timestamptz,

  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_human_review_avis_negatifs_commercant
  ON public.human_review_avis_negatifs(commercant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_review_avis_negatifs_non_traites
  ON public.human_review_avis_negatifs(traite, created_at DESC)
  WHERE traite = false;

ALTER TABLE public.human_review_avis_negatifs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human review avis negatifs admin read" ON public.human_review_avis_negatifs;
CREATE POLICY "human review avis negatifs admin read"
  ON public.human_review_avis_negatifs
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human review avis negatifs admin write" ON public.human_review_avis_negatifs;
CREATE POLICY "human review avis negatifs admin write"
  ON public.human_review_avis_negatifs
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
