-- Espace Pro — liste de contacts OPT-IN (commerce uniquement, déonto none).
-- Le commerçant constitue une audience CONSENTANTE de clients qu'il peut
-- recontacter : demande d'avis (1:1) et relance d'un créneau libéré. L'envoi
-- reste NATIF (depuis le numéro du salon, via wa.me) — cette table ne stocke que
-- les destinataires consentants, aucun envoi serveur. Un retrait = opt-out.
-- Réservé aux professions non réglementées (avis sollicitables) : l'API refuse
-- la création pour la santé/le droit, même avec un jeton valide.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_site_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  prenom text,
  phone_e164 text NOT NULL,           -- numéro normalisé (+33…)
  consent boolean NOT NULL DEFAULT true,
  source text,                        -- 'pro' (saisi par le commerçant)
  created_at timestamptz NOT NULL DEFAULT now(),
  last_contacted_at timestamptz,      -- dernier envoi WhatsApp ouvert pour ce contact
  opted_out_at timestamptz            -- retrait : le contact n'est plus listé
);

-- Un même numéro n'apparaît qu'une fois par établissement.
CREATE UNIQUE INDEX IF NOT EXISTS human_site_contacts_site_phone_idx
  ON public.human_site_contacts (site_id, phone_e164);

CREATE INDEX IF NOT EXISTS human_site_contacts_site_created_idx
  ON public.human_site_contacts (site_id, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
