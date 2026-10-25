-- 📒 LES PASSAGES NOTÉS AU COMPTOIR — le carnet (étape 2 des cages, `docs/les-cages.md`).
--
-- Dans son carnet, le commerçant voit qui a libéré son fantôme à la fin de ses
-- films (`clik_cage`). Quand la personne passe, il le note d'un geste :
-- « ✓ Passage aujourd'hui ». UNE LIGNE PAR PERSONNE ET PAR JOUR (le jour de
-- Paris) : noter deux fois le même jour ne compte qu'une fois, et il peut
-- l'enlever s'il s'est trompé.
--
-- C'est ce que comptera le ticket de Mike (« ce que Mike a fait pour vous ») :
-- les clients venus après une vidéo.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est
-- activée sans règle, pour qu'aucun navigateur ne puisse lire ni écrire.
CREATE TABLE IF NOT EXISTS public.clik_visite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  jour date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, habitant_id, jour)
);
CREATE INDEX IF NOT EXISTS clik_visite_site_idx ON public.clik_visite (site_id, jour DESC);
ALTER TABLE public.clik_visite ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_visite IS
  'Un passage d''un habitant chez un commerce, noté par le commerçant dans son carnet. Une ligne par personne, par commerce et par jour (heure de Paris).';
