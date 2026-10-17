-- 🔁 LE RÉSEAU DES COMMERÇANTS, ESSAYÉ SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261019120000_echanges_reseau.sql` (et l'équipe de `20261020120000_echanges_equipe.sql`) :
-- 50 € d'avance par personne de l'équipe,
-- « complet » par mois, le cadeau du voisin (un lot payé d'un coup, son plafond, un code en double
-- qui fait échouer tout le lot), l'expiration à 30 jours, les règles de la table, et ce que anon ne
-- peut pas faire.
--
-- Sur une base d'essai vide (ici `essai_echanges`) :
--   createdb essai_echanges
--   psql -d essai_echanges -c "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;"   (si absents)
--   psql -d essai_echanges -c "CREATE TABLE public.human_vitrine_sites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text)"
--   psql -d essai_echanges -f supabase/migrations/20261017120000_echanges_commercants.sql
--   psql -d essai_echanges -f supabase/migrations/20261019120000_echanges_reseau.sql
--   psql -d essai_echanges -f supabase/migrations/20261020120000_echanges_equipe.sql
--   psql -d essai_echanges -f scripts/essai-echanges-reseau.sql
-- Chaque vérification affiche « ok … » ; la première qui échoue arrête tout (« ÉCHEC : … »).
\set ON_ERROR_STOP 1
-- Trois commerces : A coiffure (équipe de 2 : le responsable et Léa, qui a ouvert son lien),
-- B restaurant (cadeau : dessert 7 €, 6 par mois), C fleuriste.
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','atelier-lou'),
 ('bbbbbbbb-0000-0000-0000-000000000002','chez-bergine'),
 ('cccccccc-0000-0000-0000-000000000003','fleurs-dax');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','Une coupe',45,4,'Atelier de Lou'),
 ('bbbbbbbb-0000-0000-0000-000000000002','Un dîner pour deux',50,2,'Chez Bergine'),
 ('cccccccc-0000-0000-0000-000000000003','Un bouquet',35,4,'Fleurs de Dax');
INSERT INTO human_echanges_membres (site_id, prenom, jeton, active_le) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','Léa','jeton-reseau-lea-0000000000000001',now());
UPDATE human_echanges_offres SET cadeau_titre='Un dessert du jour', cadeau_prix=7, cadeau_par_mois=6 WHERE site_id='bbbbbbbb-0000-0000-0000-000000000002';

CREATE TEMP TABLE r (n int, j jsonb);
CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT ok THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;

-- 1. A (équipe 2 → 100 € d'avance) prend deux dîners (2 × 50), le troisième manque.
INSERT INTO r SELECT 1, echanges_prendre('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','CLK-AAAAA1',50,NULL);
INSERT INTO r SELECT 2, echanges_prendre('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','CLK-AAAAA2',50,NULL);
INSERT INTO r SELECT 3, echanges_prendre('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','CLK-AAAAA3',50,NULL);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=1)='true' AND (SELECT j->>'ok' FROM r WHERE n=2)='true', 'équipe de 2 : 100 € d''avance, deux dîners à 50 €');
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=3)='solde' AND (SELECT (j->>'manque')::int FROM r WHERE n=3)=35, 'le bouquet suivant : « il te manque 35 € »');
SELECT pg_temp.verifie((SELECT pour FROM human_echanges_bons WHERE code='CLK-AAAAA1')='moi' AND (SELECT expire_le > now() + interval '29 days' FROM human_echanges_bons WHERE code='CLK-AAAAA1'), 'bon « pour moi », valable 30 jours');

-- 2. Le restaurant (1 personne, 50 €) : son plafond « 2 par mois » est atteint.
INSERT INTO r SELECT 4, echanges_prendre('cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002','CLK-AAAAA4',50,NULL);
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=4)='complet', '3e dîner du mois : complet');

-- 3. C prend la coupe de A, A valide : A gagne 45 € et peut offrir.
INSERT INTO r SELECT 5, echanges_prendre('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','CLK-AAAAA5',50,NULL);
UPDATE human_echanges_bons SET statut='utilise', utilise_le=now() WHERE code='CLK-AAAAA5';

-- 4. A offre 10 desserts (70 €) : il n'a que 45 € → manque 25 ; 5 desserts (35 €) passent.
INSERT INTO r SELECT 6, echanges_offrir('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002',10,'pour toute coloration', ARRAY['CLK-K00001','CLK-K00002','CLK-K00003','CLK-K00004','CLK-K00005','CLK-K00006','CLK-K00007','CLK-K00008','CLK-K00009','CLK-K00010'],50);
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=6)='solde' AND (SELECT (j->>'manque')::int FROM r WHERE n=6)=25, '10 desserts : « il te manque 25 € »');
INSERT INTO r SELECT 7, echanges_offrir('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002',5,'pour toute coloration', ARRAY['CLK-K00001','CLK-K00002','CLK-K00003','CLK-K00004','CLK-K00005'],50);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=7)='true', '5 desserts offerts');
SELECT pg_temp.verifie((SELECT count(*) FROM human_echanges_bons WHERE pour='client' AND preneur_id='aaaaaaaa-0000-0000-0000-000000000001' AND statut='reserve' AND cadeau_id IS NOT NULL)=5, '5 bons « client » réservés au nom de A');
SELECT pg_temp.verifie((SELECT occasion FROM human_echanges_cadeaux LIMIT 1)='pour toute coloration' AND (SELECT titre FROM human_echanges_cadeaux LIMIT 1)='Un dessert du jour', 'le lot garde l''occasion et le cadeau');

-- 5. Plafond des cadeaux (6 par mois) : 2 de plus → complet, il en reste 1. Les dîners ne comptent pas.
INSERT INTO human_echanges_membres (site_id, prenom, jeton, active_le)
SELECT 'cccccccc-0000-0000-0000-000000000003', 'm' || i, 'jeton-reseau-fleurs-' || lpad(i::text, 12, '0'), now() FROM generate_series(1, 4) i;
INSERT INTO r SELECT 8, echanges_offrir('cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002',2,'', ARRAY['CLK-K00011','CLK-K00012'],50);
SELECT pg_temp.verifie((SELECT j->>'raison' FROM r WHERE n=8)='complet' AND (SELECT (j->>'restant')::int FROM r WHERE n=8)=1, 'cadeaux : 6 par mois, il en reste 1');
INSERT INTO r SELECT 9, echanges_offrir('cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002',1,'', ARRAY['CLK-K00011'],50);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=9)='true', 'le dernier cadeau du mois passe');

-- 6. Un code déjà pris fait échouer tout le lot, sans laisser de lot vide.
UPDATE human_echanges_offres SET cadeau_par_mois=60 WHERE site_id='bbbbbbbb-0000-0000-0000-000000000002';
DO $$ BEGIN
  PERFORM echanges_offrir('cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002',2,'', ARRAY['CLK-K00020','CLK-K00001'],50);
  RAISE EXCEPTION 'ÉCHEC : le code en double aurait dû être refusé';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'ok  code en double : tout le lot refusé';
END $$;
SELECT pg_temp.verifie((SELECT count(*) FROM human_echanges_cadeaux)=2 AND NOT EXISTS (SELECT 1 FROM human_echanges_bons WHERE code='CLK-K00020'), 'aucun lot ni bon laissé par l''échec');

-- 7. L'expiration : un bon réservé périmé passe « expire » et libère le montant.
UPDATE human_echanges_bons SET expire_le = now() - interval '1 minute' WHERE code='CLK-AAAAA2';
INSERT INTO r SELECT 11, to_jsonb(echanges_expirer());
SELECT pg_temp.verifie((SELECT j::int FROM r WHERE n=11)=1 AND (SELECT statut FROM human_echanges_bons WHERE code='CLK-AAAAA2')='expire', 'bon de 30 jours passés : expiré');
-- A : 100 + 45 − (50 + 35) = 60 → il peut reprendre un bouquet (35).
INSERT INTO r SELECT 10, echanges_prendre('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','CLK-AAAAA6',50,NULL);
SELECT pg_temp.verifie((SELECT j->>'ok' FROM r WHERE n=10)='true', 'le montant expiré revient : le bouquet passe');

-- 8. Les règles de la table.
DO $$ BEGIN
  INSERT INTO human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, pour) VALUES ('CLK-ZZZZZ1','aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','x',5,'client');
  RAISE EXCEPTION 'ÉCHEC : bon client sans lot accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  un bon « client » sans lot est refusé';
END $$;
DO $$ BEGIN
  UPDATE human_echanges_bons SET venus = 0 WHERE code='CLK-K00001';
  RAISE EXCEPTION 'ÉCHEC : venus = 0 accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  « venu à 0 » refusé';
END $$;
DO $$ BEGIN
  UPDATE human_echanges_offres SET cadeau_titre = 'Un café' WHERE site_id='aaaaaaaa-0000-0000-0000-000000000001';
  RAISE EXCEPTION 'ÉCHEC : cadeau sans prix accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  un cadeau sans prix ni plafond est refusé';
END $$;

-- 9. anon et authenticated ne peuvent rien exécuter.
SET ROLE anon;
DO $$ BEGIN
  PERFORM echanges_offrir('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002',1,'',ARRAY['CLK-ZZZZZ2'],50);
  RAISE EXCEPTION 'ÉCHEC : anon a pu offrir';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas offrir';
END $$;
DO $$ BEGIN
  PERFORM echanges_expirer();
  RAISE EXCEPTION 'ÉCHEC : anon a pu expirer';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas expirer';
END $$;
RESET ROLE;
SELECT 'TOUT EST BON' AS fin;
