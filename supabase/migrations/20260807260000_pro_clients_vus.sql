-- « J'ai un nouveau client qui me suit » : encore faut-il le lui dire.
--
-- Quelqu'un laissait ses coordonnées sur le site d'un commerçant pour être
-- prévenu de ses offres — et personne n'en savait rien. Ni le commerçant, qui
-- ne voyait aucune alerte, ni le client, qui n'avait aucune confirmation. Le
-- seul geste d'engagement d'un visiteur tombait dans le silence.
--
-- Même mécanique que `pro_reviews_seen` : on retient le nombre de clients que
-- le commerçant a DÉJÀ vus. La différence avec le total fait la pastille, et
-- elle s'éteint quand il ouvre l'onglet — pas avant, et pas toute seule.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS pro_clients_seen integer NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
