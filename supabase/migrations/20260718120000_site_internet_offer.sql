-- « Offre du moment » : bandeau affiché sur le site du pro, piloté par l'assistante
-- (ex. « Remplir les tables ce soir »). Objet JSON { text, until, clicks, created_at }.
-- `until` = date d'expiration (ISO) ; `clicks` = clics sur le lien de réservation
-- traçable (résultats RÉELS, jamais inventés). Null = aucune offre active.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS current_offer jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
