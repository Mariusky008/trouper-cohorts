-- Compter les vues et les clics d'une publication.
--
-- `human_publications.vues` et `.clics` existaient depuis la première migration
-- mais rien ne les incrémentait : l'espace ville affichait un compteur qui
-- serait resté à zéro, et un commerçant n'avait aucune preuve que le fil lui
-- amène du monde. Un chiffre qu'on montre doit être un chiffre qu'on tient.
--
-- Même motif que `increment_catalogue_views`, pour la même raison : un écran de
-- fil affiche vingt cartes, on ne veut pas vingt allers-retours. SECURITY
-- DEFINER parce que l'appel vient du rendu d'une page publique, qui n'a aucune
-- autre écriture à faire.
--
-- L'incrément est DÉLIBÉRÉMENT approximatif : pas de déduplication par personne.
-- Compter « combien de fois cette annonce est passée sous les yeux » demanderait
-- d'identifier chaque lecteur — donc de poser une ligne pour quelqu'un qui ne
-- fait que lire, ce que Le Direct s'interdit. On préfère un chiffre honnêtement
-- nommé « affichages » à un chiffre exact payé en surveillance.

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_publication_views(ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.human_publications
     SET vues = COALESCE(vues, 0) + 1
   WHERE id = ANY(ids);
$$;

CREATE OR REPLACE FUNCTION public.increment_publication_click(pid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.human_publications
     SET clics = COALESCE(clics, 0) + 1
   WHERE id = pid;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
