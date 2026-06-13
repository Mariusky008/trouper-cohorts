-- Catalogue Privilège — leads « like de soutien » qualifiés.
-- Quand un visiteur envoie un like de soutien à un commerçant (profil Tinder),
-- un opt-in léger lui propose de laisser prénom + numéro pour être recontacté.
-- Le consentement explicite est stocké (RGPD). On garde aussi le ref du lien
-- partagé (qui a diffusé le catalogue) pour l'attribution.
-- RLS activé SANS policy = deny-all : accès via service-role uniquement (comme
-- les autres tables privilège). Les écritures se font côté serveur.

CREATE TABLE IF NOT EXISTS public.human_privilege_support_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.human_privilege_tinder_profiles(id) ON DELETE CASCADE,
  pro_name text,                                -- dénormalisé (lisible même si le profil change)
  city text,
  city_slug text,
  first_name text,
  phone text NOT NULL,                          -- format E.164 (+33…)
  ref text,                                     -- ref_id du lien partagé (qui a partagé)
  ref_name text,
  consent_text text,
  consent_at timestamptz,
  source text DEFAULT 'catalogue',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT human_privilege_support_leads_unique UNIQUE (profile_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_priv_support_leads_profile ON public.human_privilege_support_leads(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_priv_support_leads_city ON public.human_privilege_support_leads(city_slug, created_at DESC);

ALTER TABLE public.human_privilege_support_leads ENABLE ROW LEVEL SECURITY;
