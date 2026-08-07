-- Retrait du filet : `human_ville_abonnes_avant_direct` disparaît.
--
-- La table avait été conservée à la fusion parce que la recopie portait sur de
-- vrais abonnés et qu'une perte aurait été définitive. La fusion a été
-- constatée ; le filet n'a plus de raison d'être, et une table qu'aucun code ne
-- lit finit toujours par égarer quelqu'un — on la retrouve six mois plus tard,
-- on se demande laquelle fait foi, et on répond à la mauvaise.
--
-- `IF EXISTS` : la migration doit passer aussi sur une base où la fusion n'avait
-- rien trouvé à archiver.

BEGIN;

DROP TABLE IF EXISTS public.human_ville_abonnes_avant_direct;

COMMIT;
