-- `published` VOULAIT DIRE DEUX CHOSES. IL A PRODUIT TROIS BUGS.
--
-- Le mot se lit « le site est en ligne ». Il signifiait en réalité « ce
-- commerçant est devenu client ». Le site public, lui, répond à son adresse dans
-- les deux cas. Trois pannes en sont sorties, à trois endroits sans rapport :
--
--   · la mise en ligne restait bloquée (`letter_status = 'client'` violait une
--     contrainte, et l'UPDATE entier était annulé) ;
--   · la maquette de démonstration s'affichait à de vrais clients ;
--   · l'espace pro annonçait « votre annonce ne sera visible nulle part » à un
--     commerçant qui venait de la voir apparaître dans le fil de sa ville.
--
-- Tant qu'une colonne porte deux sens, un quatrième bug arrive. On sépare.
--
--   `est_client`      → l'axe COMMERCIAL. Recopie exacte de `published`.
--   `visible_public`  → l'axe VISIBILITÉ. Ce qui décide qu'une page publique est
--                       servie. Vrai par défaut, parce que c'est déjà le
--                       comportement réel : toute maquette répond à son adresse.
--
-- CE QUI NE CHANGE PAS : l'admission au collectif de la ville (voisins, fil,
-- sitemap) reste adossée à `est_client`. La basculer sur la visibilité ferait
-- entrer d'un coup tous les prospects dans le fil — c'est une décision
-- éditoriale, pas une conséquence de migration.

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS est_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS est_client_depuis timestamptz,
  ADD COLUMN IF NOT EXISTS visible_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.human_vitrine_sites.est_client IS
  'Axe COMMERCIAL : ce commerçant a accepté. Ne dit RIEN de la visibilité du site.';
COMMENT ON COLUMN public.human_vitrine_sites.est_client_depuis IS
  'Date de conversion. Reprend published_at.';
COMMENT ON COLUMN public.human_vitrine_sites.visible_public IS
  'Axe VISIBILITÉ : la page publique et le domaine perso sont servis. Vrai par défaut.';
COMMENT ON COLUMN public.human_vitrine_sites.published IS
  'OBSOLÈTE — remplacée par est_client. Maintenue en miroir par un déclencheur, le temps que rien d''externe ne la lise plus.';

-- Reprise de l'existant.
UPDATE public.human_vitrine_sites
   SET est_client = COALESCE(published, false),
       est_client_depuis = published_at
 WHERE est_client IS DISTINCT FROM COALESCE(published, false)
    OR est_client_depuis IS DISTINCT FROM published_at;

-- LES DEUX COLONNES RESTENT JUMELLES, DANS LES DEUX SENS.
--
-- Pourquoi un miroir plutôt qu'une suppression sèche : `published` peut être lue
-- ailleurs que dans ce dépôt — un export, un tableau de bord, une requête
-- enregistrée dans Supabase. Une colonne supprimée d'un coup casse ces
-- lectures-là en silence, et on ne l'apprend que des semaines plus tard.
--
-- Le déclencheur regarde QUELLE colonne a bougé plutôt que d'écraser dans un
-- sens fixe : sans ça, une écriture sur la nouvelle colonne serait défaite par
-- l'ancienne valeur, et la migration n'aurait aucun effet visible.
CREATE OR REPLACE FUNCTION public.human_vitrine_sites_miroir_client()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.est_client IS DISTINCT FROM COALESCE(NEW.published, false) THEN
      -- À l'insertion, la valeur explicitement fournie l'emporte ; à défaut,
      -- `published` reste la source pour le code non encore migré.
      IF NEW.est_client THEN NEW.published := true; ELSE NEW.est_client := COALESCE(NEW.published, false); END IF;
    END IF;
    IF NEW.est_client_depuis IS NULL THEN NEW.est_client_depuis := NEW.published_at; END IF;
    RETURN NEW;
  END IF;

  IF NEW.est_client IS DISTINCT FROM OLD.est_client THEN
    NEW.published := NEW.est_client;
  ELSIF NEW.published IS DISTINCT FROM OLD.published THEN
    NEW.est_client := COALESCE(NEW.published, false);
  END IF;

  IF NEW.est_client_depuis IS DISTINCT FROM OLD.est_client_depuis THEN
    NEW.published_at := NEW.est_client_depuis;
  ELSIF NEW.published_at IS DISTINCT FROM OLD.published_at THEN
    NEW.est_client_depuis := NEW.published_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS human_vitrine_sites_miroir_client ON public.human_vitrine_sites;
CREATE TRIGGER human_vitrine_sites_miroir_client
  BEFORE INSERT OR UPDATE ON public.human_vitrine_sites
  FOR EACH ROW EXECUTE FUNCTION public.human_vitrine_sites_miroir_client();

-- Le fil de la ville et la liste des voisins lisent `est_client` : l'index qui
-- servait `published` ne les couvre plus.
CREATE INDEX IF NOT EXISTS human_vitrine_sites_client_ville_idx
  ON public.human_vitrine_sites (city, est_client)
  WHERE channel = 'letter';
