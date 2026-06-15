-- Catalogue Privilège — avis publics des utilisateurs sur un commerçant/artisan.
-- Modération : un avis arrive 'pending' et ne s'affiche QUE une fois 'approved' par l'admin.
-- Le numéro (author_phone) sert à responsabiliser + récupérer un lead ; il n'est JAMAIS exposé
-- publiquement (l'API publique ne renvoie que author_name + rating + comment).
-- RLS activé SANS policy = deny-all (accès service-role uniquement, comme les autres tables privilège).
CREATE TABLE IF NOT EXISTS public.human_marketplace_place_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  city text,
  city_slug text,
  author_name text NOT NULL,
  author_phone text,                         -- E.164, privé (jamais renvoyé à l'API publique)
  rating int,                                -- 1..5
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending',    -- pending | approved | rejected
  source text DEFAULT 'catalogue',
  ref_id text,                               -- qui a partagé le catalogue (contexte / leaderboard)
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT hmpc_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT hmpc_rating_check CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
);

CREATE INDEX IF NOT EXISTS idx_hmpc_place_status ON public.human_marketplace_place_comments(place_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hmpc_status ON public.human_marketplace_place_comments(status, created_at DESC);

ALTER TABLE public.human_marketplace_place_comments ENABLE ROW LEVEL SECURITY;
