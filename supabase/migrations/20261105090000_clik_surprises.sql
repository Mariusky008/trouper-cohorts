-- 🎁 LA SURPRISE DU CHEF — une quatrième cage, dorée, sur la page de la famille d'un commerce.
--
-- Le commerçant prévoit ses surprises du jour (« 4 places de 11 h à 11 h 30 à −25 % », « 4 cafés offerts »…),
-- chacune avec son stock. Un fantôme de la famille ouvre la cage dorée : une surprise lui est tirée au hasard
-- parmi celles qui restent (clik_surprise_tirage, une par personne et par jour, qu'on ne retire pas en rouvrant).
-- « Je prends ça » la lui donne et la retire du stock (pris + 1). Plus de stock : la cage se referme. Pas de
-- priorité de palier : le premier qui ouvre tire. Jamais d'alcool (le serveur refuse, loi Évin).
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans règle.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle peut être rejouée. Tant qu'elle ne l'est pas, la cage
-- dorée ne paraît pas et le comptoir dit « Les surprises ne sont pas encore activées ».

CREATE TABLE IF NOT EXISTS public.clik_surprise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  jour date NOT NULL,
  libelle text NOT NULL,
  stock integer NOT NULL CHECK (stock BETWEEN 1 AND 50),
  pris integer NOT NULL DEFAULT 0 CHECK (pris >= 0),
  retire_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clik_surprise_jour ON public.clik_surprise (site_id, jour);
ALTER TABLE public.clik_surprise ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clik_surprise_tirage (
  site_id uuid NOT NULL,
  jour date NOT NULL,
  habitant_id uuid NOT NULL,
  surprise_id uuid NOT NULL,
  pris_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, jour, habitant_id)
);
-- « Non merci » : il laisse sa surprise (elle reste pour les autres), sans autre tirage ce jour-là.
ALTER TABLE public.clik_surprise_tirage ADD COLUMN IF NOT EXISTS laisse_le timestamptz;
-- Le bon : son code (quatre signes, unique ce jour-là chez ce commerce), et « Servie » au comptoir (une venue).
ALTER TABLE public.clik_surprise_tirage ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.clik_surprise_tirage ADD COLUMN IF NOT EXISTS servie_le timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS clik_surprise_tirage_code ON public.clik_surprise_tirage (site_id, jour, code) WHERE code IS NOT NULL;
ALTER TABLE public.clik_surprise_tirage ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_surprise IS 'La surprise du chef : ce que le commerçant prévoit aujourd''hui, son stock et combien sont parties.';
COMMENT ON TABLE public.clik_surprise_tirage IS 'La surprise tirée pour une personne, ce jour-là (une par personne et par jour) ; pris_le : elle l''a prise.';

NOTIFY pgrst, 'reload schema';
