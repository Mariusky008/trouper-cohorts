-- Popey v3 — Plateforme de fidélité gamifiée. Modèle de données du « cœur » produit :
-- identité client légère (par numéro), relation client↔commerçant (niveau = nb visites
-- validées), visites/codes (la visite validée par le pro est le SEUL événement qui fait
-- monter le niveau), paliers de fidélité éditables, réservations (pour le funnel pro).
-- RLS activé SANS policy = deny-all (accès service-role uniquement, comme les autres tables privilège).

-- Identité client légère : un membre = un numéro (pas de mot de passe).
CREATE TABLE IF NOT EXISTS public.human_privilege_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE,           -- E.164 (+33…) = identité
  first_name text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Relation client↔commerçant. level = nombre de visites VALIDÉES par le pro.
CREATE TABLE IF NOT EXISTS public.human_privilege_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_phone text NOT NULL,
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 0,
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hpr_unique UNIQUE (member_phone, place_id)
);
CREATE INDEX IF NOT EXISTS idx_hpr_member ON public.human_privilege_relationships(member_phone);
CREATE INDEX IF NOT EXISTS idx_hpr_place ON public.human_privilege_relationships(place_id);

-- Visite = code à 4 chiffres. 'pending' tant que le pro n'a pas validé ; 'validated' → +1 niveau.
-- Le code est unique parmi les 'pending' non expirés d'un même commerçant (le pro est scopé).
CREATE TABLE IF NOT EXISTS public.human_privilege_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_phone text NOT NULL,
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  offer_id uuid,
  code text NOT NULL,                        -- 4 chiffres
  status text NOT NULL DEFAULT 'pending',    -- pending | validated | expired
  amount_eur numeric,                        -- montant encaissé (facultatif, pour le ROI)
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  validated_at timestamptz,
  validated_by text,                         -- token/identité du pro qui valide
  CONSTRAINT hpv_status_check CHECK (status IN ('pending', 'validated', 'expired'))
);
CREATE INDEX IF NOT EXISTS idx_hpv_place_code ON public.human_privilege_visits(place_id, code, status);
CREATE INDEX IF NOT EXISTS idx_hpv_member ON public.human_privilege_visits(member_phone);
CREATE INDEX IF NOT EXISTS idx_hpv_place_status ON public.human_privilege_visits(place_id, status, validated_at DESC);

-- Paliers de fidélité (échelle de 5), éditables par le commerçant. Seedés avec les défauts du brief.
CREATE TABLE IF NOT EXISTS public.human_privilege_loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  idx int NOT NULL,                          -- 1..5
  threshold_visits int NOT NULL,
  reward_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hplt_unique UNIQUE (place_id, idx)
);
CREATE INDEX IF NOT EXISTS idx_hplt_place ON public.human_privilege_loyalty_tiers(place_id);

-- Réservations (alimente le funnel « Réservations » du dashboard pro).
CREATE TABLE IF NOT EXISTS public.human_privilege_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_phone text NOT NULL,
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  offer_id uuid,
  ref_id text,                               -- parrain (contexte / partage viral)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hprez_place ON public.human_privilege_reservations(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hprez_member ON public.human_privilege_reservations(member_phone);

ALTER TABLE public.human_privilege_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_privilege_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_privilege_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_privilege_loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_privilege_reservations ENABLE ROW LEVEL SECURITY;
