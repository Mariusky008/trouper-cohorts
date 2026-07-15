-- Espace Pro — bouton « relance créneaux » (commerce uniquement, déonto none).
-- Le commerçant signale une place qui se libère et prévient ses clients fidèles
-- via WhatsApp (compose natif, sélection/diffusion côté WhatsApp — jamais un
-- envoi de masse serveur depuis un numéro perso, qui ferait bannir). On
-- journalise chaque relance pour l'historique ET pour appliquer un PLAFOND
-- QUOTIDIEN côté serveur (anti-spam / anti-ban).

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_relances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  slot text,        -- créneau libéré, tel que saisi (ex. « aujourd'hui 15 h »)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_site_relances_site_created_idx
  ON public.human_site_relances (site_id, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
