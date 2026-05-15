BEGIN;

CREATE TABLE IF NOT EXISTS public.human_review_commercants (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               text        NOT NULL,
  proprietaire      text,
  telephone         text,
  email             text,
  ville             text        NOT NULL DEFAULT 'Dax',
  secteur           text,

  -- Identifiants publics
  slug              text        NOT NULL,         -- URL : /avis/{slug}
  token_saisie      text        NOT NULL,         -- URL : /saisie/{token_saisie}

  -- Google
  place_id          text,
  lien_avis         text,                         -- https://search.google.com/local/writereview?placeid=...
  nb_avis_debut     integer     NOT NULL DEFAULT 0,
  nb_avis_actuel    integer     NOT NULL DEFAULT 0,
  note_actuelle     numeric(3,1),

  -- Abonnement
  abonnement        text        NOT NULL DEFAULT 'actif',
  mensualite        integer     NOT NULL DEFAULT 79,
  date_debut        date,

  metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT human_review_commercants_abonnement_check CHECK (
    abonnement IN ('actif', 'pause', 'résilié')
  ),
  CONSTRAINT human_review_commercants_slug_check CHECK (
    char_length(slug) BETWEEN 2 AND 80
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_review_commercants_slug
  ON public.human_review_commercants(slug);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_review_commercants_token_saisie
  ON public.human_review_commercants(token_saisie);

CREATE INDEX IF NOT EXISTS idx_human_review_commercants_abonnement
  ON public.human_review_commercants(abonnement, created_at DESC);

ALTER TABLE public.human_review_commercants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human review commercants admin read" ON public.human_review_commercants;
CREATE POLICY "human review commercants admin read"
  ON public.human_review_commercants
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human review commercants admin write" ON public.human_review_commercants;
CREATE POLICY "human review commercants admin write"
  ON public.human_review_commercants
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
