-- ✨ « MON VŒU » (11 novembre 2026, `lib/direct/voeu.ts`) — je dépose un vœu avec ma figurine ; chaque jour, des gens le
-- découvrent (la mission de midi : 3 vœux à encourager) et me répondent avec leur figurine ; quelqu'un peut m'aider.
--   · `clik_voeu` : un vœu (un seul en route ou en pause par personne : l'index unique partiel le garantit) ;
--   · `clik_voeu_vue` : un vœu montré à une personne (sa mission du jour), et ce qu'elle en a fait — une tête
--     (encourager), une aide (une phrase, ou sa voix), ou « passer » (gardé pour ne jamais le remontrer, JAMAIS rendu à
--     l'auteur) ; une seule ligne par vœu et par personne (« jamais deux fois ») ;
--   · `clik_voeu_serie` : la série (la flamme) — les jours d'affilée de mission faite.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle peut être rejouée. Tant qu'elle ne l'est pas, « Mon vœu »
-- ne s'affiche pas (Découvrir reste comme avant).

CREATE TABLE IF NOT EXISTS public.clik_voeu (
  id text PRIMARY KEY,
  habitant_id uuid NOT NULL,
  texte text NOT NULL,
  categorie text NOT NULL,
  statut text NOT NULL DEFAULT 'en_route',
  ville_slug text NOT NULL DEFAULT '',
  -- 18 ans ou plus (les 15-17 ans ne croisent que des vœux de 15-17 ans)
  adulte boolean NOT NULL DEFAULT true,
  -- il peut être exaucé de loin (Apprendre, Un conseil, Mon projet) : il voyage plus loin quand la ville l'a vu
  a_distance boolean NOT NULL DEFAULT false,
  cree_le timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz,
  pause_le timestamptz,
  jours_pause integer NOT NULL DEFAULT 0,
  fini_le timestamptz,
  -- qui l'a exaucé (son habitant_id), ou « seul » (lot 3)
  aide_par text,
  -- ses formulations d'avant : [{ le, texte }]
  historique jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- signalé par quelqu'un qui l'a reçu : il quitte la distribution le temps qu'on le regarde
  signale_le timestamptz
);
ALTER TABLE public.clik_voeu ADD COLUMN IF NOT EXISTS signale_le timestamptz;
ALTER TABLE public.clik_voeu DROP CONSTRAINT IF EXISTS clik_voeu_statut;
ALTER TABLE public.clik_voeu ADD CONSTRAINT clik_voeu_statut CHECK (statut IN ('en_route', 'pause', 'exauce', 'annule', 'remplace'));
ALTER TABLE public.clik_voeu DROP CONSTRAINT IF EXISTS clik_voeu_texte;
ALTER TABLE public.clik_voeu ADD CONSTRAINT clik_voeu_texte CHECK (char_length(texte) BETWEEN 1 AND 90);
CREATE UNIQUE INDEX IF NOT EXISTS clik_voeu_un_seul ON public.clik_voeu (habitant_id) WHERE statut IN ('en_route', 'pause');
CREATE INDEX IF NOT EXISTS clik_voeu_en_route ON public.clik_voeu (statut, ville_slug, adulte);

CREATE TABLE IF NOT EXISTS public.clik_voeu_vue (
  id bigserial PRIMARY KEY,
  voeu_id text NOT NULL REFERENCES public.clik_voeu (id) ON DELETE CASCADE,
  auteur_id uuid NOT NULL,
  destinataire_id uuid NOT NULL,
  -- le jour de la mission (heure de Paris)
  jour date NOT NULL,
  montre_le timestamptz NOT NULL DEFAULT now(),
  geste text,
  -- la tête choisie (`TETES_ENCOURAGER`)
  tete text,
  -- une aide : sa phrase, ou le chemin de son vocal (dans le seau des figurines)
  texte text,
  son text,
  geste_le timestamptz,
  -- l'auteur l'a vue (le badge des réponses non vues)
  vu_le timestamptz,
  -- signalée par l'auteur (elle ne s'affiche plus)
  signale_le timestamptz
);
ALTER TABLE public.clik_voeu_vue DROP CONSTRAINT IF EXISTS clik_voeu_vue_geste;
ALTER TABLE public.clik_voeu_vue ADD CONSTRAINT clik_voeu_vue_geste CHECK (geste IS NULL OR geste IN ('encourage', 'aide', 'passe', 'signale'));
CREATE UNIQUE INDEX IF NOT EXISTS clik_voeu_vue_une_fois ON public.clik_voeu_vue (voeu_id, destinataire_id);
CREATE INDEX IF NOT EXISTS clik_voeu_vue_mission ON public.clik_voeu_vue (destinataire_id, jour);
CREATE INDEX IF NOT EXISTS clik_voeu_vue_du_jour ON public.clik_voeu_vue (jour, voeu_id);
CREATE INDEX IF NOT EXISTS clik_voeu_vue_reponses ON public.clik_voeu_vue (auteur_id, geste_le DESC);

CREATE TABLE IF NOT EXISTS public.clik_voeu_serie (
  habitant_id uuid PRIMARY KEY,
  jours integer NOT NULL DEFAULT 0,
  dernier_jour date,
  record integer NOT NULL DEFAULT 0
);

-- (seul le serveur y écrit et les lit, avec sa clé de service)
ALTER TABLE public.clik_voeu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clik_voeu_vue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clik_voeu_serie ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
