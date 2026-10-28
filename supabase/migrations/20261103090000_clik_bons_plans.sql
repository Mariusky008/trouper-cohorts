-- 🔔 LES BONS PLANS DE LA FAMILLE, ET 🎁 « JE TE GÂTE » — ce que les paliers apportent pour de vrai.
--
-- `clik_bon_plan` : « Il me reste des tables », écrit au comptoir. Ses fantômes d'or le voient tout
-- de suite, l'argent un peu après, le bronze ensuite (les délais sont dans `lib/direct/famille.ts`,
-- `OUVERTURE_BON_PLAN`). Le serveur ne donne le texte qu'à l'heure de chacun. Un seul en cours :
-- en écrire un autre remplace l'ancien ; « C'est complet » le retire (`retire_le`).
--
-- `clik_gate` : ce qu'il peut offrir à sa famille ce mois-ci (« 10 × un café »). Les 🎁 offerts sur
-- les petits mots (`clik_mot.cadeau_le`) s'y comptent, et s'arrêtent quand il n'en reste plus. Une
-- ligne par commerce et par mois (« 2026-11 », heure de Paris). Jamais d'alcool (loi Évin) : la
-- route le refuse.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans règle.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS `20261101090000_clik_famille.sql`.
-- Elle peut être rejouée. Tant qu'elle ne l'est pas, le comptoir dit « pas encore activé ».

CREATE TABLE IF NOT EXISTS public.clik_bon_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  texte text NOT NULL,
  publie_le timestamptz NOT NULL DEFAULT now(),
  fin_le timestamptz NOT NULL,
  retire_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clik_bon_plan_site_idx ON public.clik_bon_plan (site_id, publie_le DESC);
ALTER TABLE public.clik_bon_plan ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clik_gate (
  site_id uuid NOT NULL,
  mois text NOT NULL,
  quoi text NOT NULL,
  combien integer NOT NULL CHECK (combien >= 0 AND combien <= 500),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, mois)
);
ALTER TABLE public.clik_gate ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_bon_plan IS
  'Le bon plan du moment d''un commerce, pour sa famille : l''or le voit d''abord, puis l''argent, puis le bronze (OUVERTURE_BON_PLAN).';
COMMENT ON TABLE public.clik_gate IS
  '« Je te gâte » : ce qu''un commerce peut offrir à sa famille ce mois-ci (quoi × combien) ; les cadeaux des petits mots s''y comptent.';

NOTIFY pgrst, 'reload schema';
