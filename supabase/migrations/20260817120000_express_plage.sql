-- L'EXPRESS AVEC UNE PLAGE HORAIRE.
--
-- LE DÉFAUT. L'express se réglait en DURÉE : « moins cher à qui vient dans
-- l'heure », et le commerçant choisissait « 1 h 30 ». Chez un coiffeur, ça se
-- comprend : une place vient de se libérer, il publie, et le compte à rebours
-- part de là.
--
-- Chez un restaurateur, ça ne veut rien dire. Il prépare son service le matin
-- et veut remplir le creux de 11 h 30 à 11 h 45 — un moment précis dans SA
-- journée, pas une durée à partir du moment où il appuie sur « publier ». Avec
-- une durée, il devait calculer de tête « il est 9 h 40, le creux est à 11 h 30,
-- donc 110 minutes » — et son annonce devenait moins chère TOUT DE SUITE,
-- c'est-à-dire au mauvais moment.
--
-- CE QUE CETTE COLONNE AJOUTE : le début de la plage. `echeance` portait déjà
-- la fin. Rien d'autre ne change — un express sans `debut` reste ce qu'il a
-- toujours été, « à qui vient d'ici là ».
--
-- POURQUOI PAS DEUX HEURES DANS UN TEXTE. Parce qu'il faut pouvoir comparer :
-- le fil décide de montrer ou non une façon en comparant des instants, et une
-- heure écrite « 11h30 » ne se compare pas à une horloge sans être relue,
-- interprétée, et fatalement mal interprétée un jour de changement d'heure.

ALTER TABLE public.clik_campaign
  ADD COLUMN IF NOT EXISTS debut timestamptz;

COMMENT ON COLUMN public.clik_campaign.debut IS
  'Début de la plage où la façon s''applique. NULL = elle s''applique dès sa publication. Sa fin reste `echeance`.';

-- Une plage à l'envers n'existe pas. La contrainte vit ici plutôt que dans
-- l'écran : deux écrans écrivent des campagnes, et l'un des deux finirait par
-- oublier le contrôle.
ALTER TABLE public.clik_campaign DROP CONSTRAINT IF EXISTS clik_campaign_plage_ordonnee;
ALTER TABLE public.clik_campaign
  ADD CONSTRAINT clik_campaign_plage_ordonnee CHECK (debut IS NULL OR echeance IS NULL OR debut < echeance);
