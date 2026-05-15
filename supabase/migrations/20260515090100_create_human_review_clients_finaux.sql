BEGIN;

CREATE TABLE IF NOT EXISTS public.human_review_clients_finaux (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commercant_id     uuid        NOT NULL REFERENCES public.human_review_commercants(id) ON DELETE CASCADE,

  prenom            text        NOT NULL,
  telephone         text        NOT NULL,         -- format E.164 : +33XXXXXXXXX
  date_prestation   date        NOT NULL,

  -- Pipeline de suivi
  statut            text        NOT NULL DEFAULT 'en_attente',
  -- en_attente → envoyé → cliqué → avis_laissé
  --                                → insatisfait → (traité par le commerçant)
  --             → relancé

  -- Tracking WhatsApp
  date_envoi_j1     timestamptz,
  date_envoi_j6     timestamptz,

  -- Token unique pour identifier le client dans les URLs publiques
  lien_unique       text        NOT NULL,

  -- Résultat
  satisfaction      text,                         -- 'positif' | 'negatif'
  avis_prive        text,                         -- texte si insatisfait

  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT human_review_clients_finaux_statut_check CHECK (
    statut IN ('en_attente', 'envoyé', 'cliqué', 'avis_laissé', 'insatisfait', 'relancé', 'terminé')
  ),
  CONSTRAINT human_review_clients_finaux_satisfaction_check CHECK (
    satisfaction IN ('positif', 'negatif') OR satisfaction IS NULL
  ),
  CONSTRAINT human_review_clients_finaux_telephone_check CHECK (
    telephone ~ '^\+33[0-9]{9}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_review_clients_finaux_lien_unique
  ON public.human_review_clients_finaux(lien_unique);

-- Évite les doublons : même client chez même commerçant à la même date
CREATE UNIQUE INDEX IF NOT EXISTS uq_human_review_clients_finaux_no_duplicate
  ON public.human_review_clients_finaux(commercant_id, telephone, date_prestation);

CREATE INDEX IF NOT EXISTS idx_human_review_clients_finaux_commercant_statut
  ON public.human_review_clients_finaux(commercant_id, statut, date_prestation DESC);

CREATE INDEX IF NOT EXISTS idx_human_review_clients_finaux_envoi_j1
  ON public.human_review_clients_finaux(statut, date_prestation)
  WHERE date_envoi_j1 IS NULL;

CREATE INDEX IF NOT EXISTS idx_human_review_clients_finaux_relance_j6
  ON public.human_review_clients_finaux(statut, date_envoi_j1)
  WHERE date_envoi_j6 IS NULL;

ALTER TABLE public.human_review_clients_finaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human review clients finaux admin read" ON public.human_review_clients_finaux;
CREATE POLICY "human review clients finaux admin read"
  ON public.human_review_clients_finaux
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human review clients finaux admin write" ON public.human_review_clients_finaux;
CREATE POLICY "human review clients finaux admin write"
  ON public.human_review_clients_finaux
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
