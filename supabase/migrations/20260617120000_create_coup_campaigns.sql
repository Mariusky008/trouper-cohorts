-- Popey v3 — « Coup de feu » (fonctionnalité héro pro). Une campagne = un push WhatsApp temps réel
-- vers les fans opt-in d'un commerçant, ENVOYÉ PAR VAGUES de niveau décroissant (5 d'abord, puis 4,
-- 3, puis tous) : priorité réelle aux fidèles + maîtrise du coût (chaque message marketing est facturé).
-- Le message WhatsApp réutilise l'infra alertes (sendPrivilegeAlertBroadcast) ; son lien pointe vers la
-- fiche deep-link /o/<campaignId> (réservation 1 tap, places limitées, génération du code).
-- RLS activé SANS policy = deny-all (service-role uniquement, comme les autres tables privilège).

CREATE TABLE IF NOT EXISTS public.human_privilege_coup_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.human_marketplace_places(id) ON DELETE CASCADE,
  reason text,                               -- motif interne (« boutique calme », « fin de série »…)
  offer_text text NOT NULL,                  -- l'offre poussée ({{2}} du template + titre de la fiche)
  total_places int NOT NULL DEFAULT 0,       -- places limitées (0 = illimité)
  places_taken int NOT NULL DEFAULT 0,       -- réservations contre cette campagne
  duration_min int NOT NULL DEFAULT 120,     -- durée de validité (minutes)
  status text NOT NULL DEFAULT 'live',       -- live | done
  current_wave int NOT NULL DEFAULT -1,      -- dernière vague envoyée (-1 = aucune)
  waves jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{idx,label,fans,sent,sent_at}] (suivi des vagues)
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hpcc_status_check CHECK (status IN ('live', 'done'))
);
CREATE INDEX IF NOT EXISTS idx_hpcc_place ON public.human_privilege_coup_campaigns(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hpcc_status ON public.human_privilege_coup_campaigns(status, expires_at);

-- Lien réservation ↔ campagne (décompte des places + tracking du Coup de feu).
ALTER TABLE public.human_privilege_reservations
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.human_privilege_coup_campaigns(id) ON DELETE SET NULL;

ALTER TABLE public.human_privilege_coup_campaigns ENABLE ROW LEVEL SECURITY;
