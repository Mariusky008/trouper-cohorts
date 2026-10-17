-- 👥 L'ÉQUIPE DU COMMERÇANT, ESSAYÉE SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261020120000_echanges_equipe.sql` : l'équipe ne compte que ceux qui ont ouvert
-- leur lien et n'ont pas été retirés (5 au plus), 50 € par mois à chaque membre, la dette au
-- commerce, et l'ancienne `echanges_prendre` à quatre arguments toujours là pour le code en ligne.
--
-- Sur une base d'essai où les trois migrations de l'échange sont appliquées (voir
-- `essai-echanges-reseau.sql` pour la préparer), puis :
--   psql -d essai_echanges -f scripts/essai-echanges-equipe.sql
\set ON_ERROR_STOP 1
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('a1a1a1a1-0000-4000-8000-000000000001','equipe-lou'),
 ('b2b2b2b2-0000-4000-8000-000000000002','equipe-bergine');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('a1a1a1a1-0000-4000-8000-000000000001','Une coupe',45,8,'Atelier de Lou'),
 ('b2b2b2b2-0000-4000-8000-000000000002','Un dîner pour deux',50,8,'Chez Bergine');
INSERT INTO human_echanges_membres (id, site_id, prenom, jeton) VALUES
 ('11111111-0000-4000-8000-000000000001','a1a1a1a1-0000-4000-8000-000000000001','Léa','jeton-lea-000000000000000000000001'),
 ('22222222-0000-4000-8000-000000000002','a1a1a1a1-0000-4000-8000-000000000001','Hugo','jeton-hugo-00000000000000000000002'),
 ('33333333-0000-4000-8000-000000000003','b2b2b2b2-0000-4000-8000-000000000002','Sam','jeton-sam-000000000000000000000003');

CREATE TEMP TABLE r (n int, j jsonb);
CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT ok THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;

SELECT pg_temp.verifie(echanges_equipe('a1a1a1a1-0000-4000-8000-000000000001') = 1, 'invités mais pas encore venus : l''équipe ne compte que le responsable');
UPDATE human_echanges_membres SET active_le = now() WHERE prenom IN ('Léa', 'Hugo');
SELECT pg_temp.verifie(echanges_equipe('a1a1a1a1-0000-4000-8000-000000000001') = 3, 'Léa et Hugo ont ouvert leur lien : équipe de 3');

-- Léa prend un dîner (50 €) : ses 50 € du mois sont pris.
INSERT INTO r SELECT 1, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0001',50,'11111111-0000-4000-8000-000000000001');
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=1)='true' AND (SELECT membre_id FROM human_echanges_bons WHERE code='CLK-EQ0001')='11111111-0000-4000-8000-000000000001', 'Léa prend un dîner : le bon dit que c''est elle');
INSERT INTO r SELECT 2, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0002',50,'11111111-0000-4000-8000-000000000001');
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=2)='plafond_perso' AND (SELECT (j->>'reste')::int FROM r WHERE n=2)=0, 'un deuxième dîner pour Léa : ses 50 € du mois sont pris');
-- Hugo, lui, a encore ses 50 €.
INSERT INTO r SELECT 3, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0003',50,'22222222-0000-4000-8000-000000000002');
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=3)='true', 'Hugo prend aussi un dîner : chacun ses 50 €');
-- Le responsable : le commerce a 150 € d'avance, 100 € pris → un dîner de plus passe, pas deux.
INSERT INTO r SELECT 4, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0004',50,NULL);
INSERT INTO r SELECT 5, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0005',50,NULL);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=4)='true' AND (SELECT j->>'raison' FROM r WHERE n=5)='solde', 'le responsable : 150 € pour toute l''équipe, la dette est celle du commerce');
-- Sam est de l'équipe de Bergine : il ne peut pas prendre au nom de Lou.
INSERT INTO r SELECT 6, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0006',50,'33333333-0000-4000-8000-000000000003');
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=6)='membre', 'un membre d''un autre commerce : refusé');
-- Hugo est retiré : il ne compte plus, et ne peut plus prendre.
UPDATE human_echanges_membres SET retire_le = now() WHERE prenom = 'Hugo';
SELECT pg_temp.verifie(echanges_equipe('a1a1a1a1-0000-4000-8000-000000000001') = 2, 'Hugo retiré : équipe de 2');
INSERT INTO r SELECT 7, echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0007',50,'22222222-0000-4000-8000-000000000002');
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=7)='membre', 'Hugo retiré : il ne peut plus prendre');
SELECT pg_temp.verifie((SELECT statut FROM human_echanges_bons WHERE code='CLK-EQ0003')='reserve', '… et ce qu''il avait pris reste dû par le commerce');
-- Cinq au plus.
INSERT INTO human_echanges_membres (site_id, prenom, jeton, active_le)
SELECT 'b2b2b2b2-0000-4000-8000-000000000002', 'm' || i, 'jeton-plein-' || lpad(i::text, 20, '0'), now() FROM generate_series(1, 6) i;
SELECT pg_temp.verifie(echanges_equipe('b2b2b2b2-0000-4000-8000-000000000002') = 5, 'six membres actifs : l''équipe compte 5 au plus');
-- Le code déjà en ligne appelle encore la fonction à quatre arguments : elle répond.
INSERT INTO r SELECT 8, echanges_prendre('b2b2b2b2-0000-4000-8000-000000000002','a1a1a1a1-0000-4000-8000-000000000001','CLK-EQ0008',50);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=8)='true', 'l''ancienne echanges_prendre (4 arguments) marche toujours');
-- Qui a validé au comptoir.
UPDATE human_echanges_bons SET statut='utilise', utilise_le=now(), valide_par='11111111-0000-4000-8000-000000000001' WHERE code='CLK-EQ0008';
SELECT pg_temp.verifie((SELECT valide_par FROM human_echanges_bons WHERE code='CLK-EQ0008')='11111111-0000-4000-8000-000000000001', 'le bon garde qui l''a validé au comptoir');
DO $$ BEGIN
  INSERT INTO human_echanges_membres (site_id, prenom, jeton) VALUES ('a1a1a1a1-0000-4000-8000-000000000001', 'Court', 'trop-court');
  RAISE EXCEPTION 'ÉCHEC : un jeton trop court accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  un jeton de moins de 24 signes est refusé';
END $$;
SET ROLE anon;
DO $$ BEGIN
  PERFORM echanges_prendre('a1a1a1a1-0000-4000-8000-000000000001','b2b2b2b2-0000-4000-8000-000000000002','CLK-EQ0009',50,NULL::uuid);
  RAISE EXCEPTION 'ÉCHEC : anon a pu prendre';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas prendre';
END $$;
RESET ROLE;
SELECT 'TOUT EST BON' AS fin;
