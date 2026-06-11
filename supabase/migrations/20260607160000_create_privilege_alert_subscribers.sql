-- Catalogue Privilège — abonnés aux alertes WhatsApp d'un commerçant.
-- Le client clique "Être alerté", saisit son numéro + consentement → on stocke
-- une ligne 'pending'. Double opt-in : le statut passe 'confirmed' quand le client
-- répond OUI sur WhatsApp (géré séparément, étape 4). STOP → 'unsubscribed'.
-- RLS activé SANS policy = deny-all (accès via service-role uniquement, comme les
-- autres tables privilège). Les écritures se font côté serveur.

CREATE TABLE IF NOT EXISTS public.human_privilege_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  city text,
  city_slug text,
  phone text NOT NULL,                          -- format E.164 (+33…)
  status text NOT NULL DEFAULT 'pending',       -- pending | confirmed | unsubscribed
  consent_text text,
  consent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text DEFAULT 'catalogue',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT human_privilege_alert_status_check CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  CONSTRAINT human_privilege_alert_unique UNIQUE (place_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_priv_alert_subs_place ON public.human_privilege_alert_subscribers(place_id, status);
CREATE INDEX IF NOT EXISTS idx_priv_alert_subs_phone ON public.human_privilege_alert_subscribers(phone);

ALTER TABLE public.human_privilege_alert_subscribers ENABLE ROW LEVEL SECURITY;
