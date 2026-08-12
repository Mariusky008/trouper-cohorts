-- LE PLAT DU JOUR DEVIENT UNE FAMILLE À PART.
--
-- Il était possible de le publier comme une « offre », mais les deux ne se
-- comportent pas pareil et c'est exactement pour ça qu'il faut les séparer :
--
--   · un plat du jour MEURT À LA FIN DU SERVICE (14 h 30, 22 h 30), pas au bout
--     de trois jours. Un menu de midi encore affiché à 15 h fait paraître
--     l'application morte — c'est le reproche fait à toutes les applications de
--     ville, et il est mérité ;
--   · il remonte en tête du fil entre 10 h et 14 h, et lui seul ;
--   · il n'est ouvert qu'aux métiers de la restauration. Une banque publiant un
--     « plat du jour » n'a aucun sens, et une seule publication absurde suffit à
--     ce qu'on cesse d'ouvrir l'application.
--
-- La contrainte est remplacée plutôt qu'élargie « au cas où » : la liste des
-- familles est courte et fermée à dessein. Chaque famille ajoutée doit avoir sa
-- règle d'expiration et sa place dans le tri, sinon elle devient du bruit.

ALTER TABLE public.human_publications
  DROP CONSTRAINT IF EXISTS human_publications_famille_check;

ALTER TABLE public.human_publications
  ADD CONSTRAINT human_publications_famille_check
  CHECK (famille IN ('place', 'offre', 'evenement', 'ville', 'menu'));

COMMENT ON COLUMN public.human_publications.famille IS
  'place | offre | evenement | ville | menu. « menu » = plat du jour : expire à la fin du service, réservé à la restauration.';

-- Le fil du midi lit les menus vivants d'une ville. L'index du fil général
-- (ville_slug, publie_le) les trouve, mais il balaie aussi tout le reste ; à
-- 11 h 45 c'est la requête la plus sollicitée de la journée.
CREATE INDEX IF NOT EXISTS human_publications_menu_idx
  ON public.human_publications (ville_slug, expire_le)
  WHERE retire_le IS NULL AND famille = 'menu';
