-- 👻 LA FAMILLE D'UN COMMERCE — la foule du jour, le record, et les amis amenés.
--
-- « Rejoins ma famille de fantômes ! » : sur la page publique d'un commerce
-- (`/f/<lien>`), ouvrir une cage, c'est entrer dans sa foule DU JOUR. Une ligne
-- par personne, par commerce et par jour :
--   · la foule d'aujourd'hui, celle d'hier, et le record (le plus grand jour) ;
--   · ses jours de cage (« ouvre la cage 7 jours » : l'écusson d'argent) ;
--   · amene_par : qui l'a invité (son lien `?de=`), posé le premier jour seulement
--     (« amène 3 amis » : l'écusson d'or).
-- `clik_cage` garde une cage par personne et par film, et l'écrase quand elle en
-- change : elle ne peut pas dire combien étaient là mardi dernier.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est
-- activée sans règle, pour qu'aucun navigateur ne puisse lire ni écrire.
CREATE TABLE IF NOT EXISTS public.clik_presence (
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  jour date NOT NULL,
  amene_par uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, habitant_id, jour)
);
CREATE INDEX IF NOT EXISTS clik_presence_jour_idx ON public.clik_presence (site_id, jour);
CREATE INDEX IF NOT EXISTS clik_presence_amene_idx ON public.clik_presence (site_id, amene_par) WHERE amene_par IS NOT NULL;
ALTER TABLE public.clik_presence ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_presence IS
  'La famille d''un commerce : un habitant qui a ouvert une cage ce jour-là (la foule du jour, le record, ses jours de cage), et qui l''a amené (amene_par, son premier jour).';
