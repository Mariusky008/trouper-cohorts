-- Suivi « avis vus » par le pro (alerte nouvel avis). On mémorise le nombre
-- d'avis et la note que le pro a déjà consultés ; à sa prochaine visite, si le
-- compteur réel Google a augmenté (ou si la note a baissé), on l'alerte pour
-- qu'il réagisse vite (répondre, surtout à un avis négatif). Honnête : on ne
-- compare que des chiffres réels Google.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS pro_reviews_seen integer,
  ADD COLUMN IF NOT EXISTS pro_rating_seen numeric;

NOTIFY pgrst, 'reload schema';

COMMIT;
