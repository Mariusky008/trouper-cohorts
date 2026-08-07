-- L'ESPACE VILLE : un jeton privé par ville.
--
-- La collectivité publie des informations (travaux, marché déplacé, animation)
-- qui apparaissent dans le fil sous la famille `ville`. Elle n'a pas de fiche
-- dans `human_vitrine_sites` — elle ne vend rien — donc pas de `pro_token`.
--
-- Même motif que le commerçant : un lien privé qu'on ouvre sur son téléphone,
-- sans compte ni mot de passe. Un service municipal qui doit créer un compte
-- pour signaler que le marché est déplacé ne le signalera pas.
--
-- Le jeton vit sur `human_villes_config` plutôt que dans une table dédiée : la
-- configuration d'une ville et le droit d'y publier sont le même sujet.

BEGIN;

ALTER TABLE public.human_villes_config
  ADD COLUMN IF NOT EXISTS admin_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  -- Le nom affiché comme auteur dans le fil. « Ville de Dax », « Mairie de
  -- Saint-Paul-lès-Dax », « Communauté d'agglomération » — ça ne se devine pas.
  ADD COLUMN IF NOT EXISTS auteur_nom text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS human_villes_config_admin_token_idx
  ON public.human_villes_config (admin_token);

NOTIFY pgrst, 'reload schema';

COMMIT;
