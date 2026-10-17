-- 📄 LA FACTURE D'ÉCHANGE, ESSAYÉE SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261021120000_echanges_factures.sql` : pas de facture sans les infos et l'accord
-- du fournisseur, une facture par bon validé et une seule, une série sans trou dans l'ordre des
-- remises, des montants qui tombent juste, une facture figée, et rien pour anon.
--
-- Sur une base d'essai où les quatre migrations de l'échange sont appliquées (voir
-- `essai-echanges-reseau.sql` pour la préparer), puis :
--   psql -d essai_echanges -f scripts/essai-echanges-factures.sql
\set ON_ERROR_STOP 1
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('f1f1f1f1-0000-4000-8000-000000000001','facture-lou'),
 ('f2f2f2f2-0000-4000-8000-000000000002','facture-bergine');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('f1f1f1f1-0000-4000-8000-000000000001','Une coupe',45,8,'Atelier de Lou'),
 ('f2f2f2f2-0000-4000-8000-000000000002','Un dîner pour deux',50,8,'Chez Bergine');
-- Lou prend trois dîners chez Bergine ; deux sont validés (le second avant le premier), un reste réservé.
INSERT INTO human_echanges_bons (id, code, preneur_id, fournisseur_id, titre, prix, statut, utilise_le) VALUES
 ('b0000000-0000-4000-8000-000000000001','CLK-FAC001','f1f1f1f1-0000-4000-8000-000000000001','f2f2f2f2-0000-4000-8000-000000000002','Un dîner pour deux',50,'utilise', now() - interval '1 day'),
 ('b0000000-0000-4000-8000-000000000002','CLK-FAC002','f1f1f1f1-0000-4000-8000-000000000001','f2f2f2f2-0000-4000-8000-000000000002','Un dîner pour deux',50,'utilise', now() - interval '3 days'),
 ('b0000000-0000-4000-8000-000000000003','CLK-FAC003','f1f1f1f1-0000-4000-8000-000000000001','f2f2f2f2-0000-4000-8000-000000000002','Un dîner pour deux',50,'reserve', NULL),
 ('b0000000-0000-4000-8000-000000000004','CLK-FAC004','f2f2f2f2-0000-4000-8000-000000000002','f1f1f1f1-0000-4000-8000-000000000001','Une coupe',45,'utilise', now());

CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT ok THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;
CREATE FUNCTION pg_temp.ligne(bon text, ttc int, ht numeric, tva numeric, taux numeric) RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object('bon', bon, 'ttc', ttc, 'ht', ht, 'tva', tva, 'taux', taux, 'contenu', jsonb_build_object('ligne', jsonb_build_object('designation', 'Un dîner pour deux')))
$$;
CREATE TEMP TABLE lots AS SELECT jsonb_build_array(
  pg_temp.ligne('b0000000-0000-4000-8000-000000000001', 50, 45.45, 4.55, 10),
  pg_temp.ligne('b0000000-0000-4000-8000-000000000002', 50, 45.45, 4.55, 10),
  pg_temp.ligne('b0000000-0000-4000-8000-000000000003', 50, 45.45, 4.55, 10),
  pg_temp.ligne('b0000000-0000-4000-8000-000000000004', 45, 37.50, 7.50, 20)
) AS l;

SELECT pg_temp.verifie(echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', (SELECT l FROM lots)) = 0, 'sans ses infos de facturation : aucune facture en son nom');

INSERT INTO human_echanges_facturation (site_id, nom_legal, forme, adresse, siret, tva_intra, franchise, taux, nature, mandat_le)
VALUES ('f2f2f2f2-0000-4000-8000-000000000002', 'Bergine SARL', 'SARL', '18 rue Neuve, 40100 Dax', '12345678200010', 'FR11123456782', false, 10, 'services', now());

SELECT pg_temp.verifie(echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', (SELECT l FROM lots)) = 2, 'ses infos données : deux factures (le bon réservé et le bon d''un autre fournisseur sont laissés)');
SELECT pg_temp.verifie(
  (SELECT numero FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000002') = 'ECH-' || extract(year FROM now() AT TIME ZONE 'Europe/Paris')::int || '-0001'
  AND (SELECT numero FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000001') = 'ECH-' || extract(year FROM now() AT TIME ZONE 'Europe/Paris')::int || '-0002',
  'la série suit l''ordre des remises : le dîner remis il y a 3 jours a le n° 0001');
SELECT pg_temp.verifie((SELECT livree_le::date FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000002') = (now() - interval '3 days')::date, 'la date de livraison est celle de la validation du bon');
SELECT pg_temp.verifie(echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', (SELECT l FROM lots)) = 0, 'relancée : pas de deuxième facture pour le même bon');
SELECT pg_temp.verifie((SELECT count(*) FROM human_echanges_factures WHERE char_length(jeton) = 64) = 2, 'chaque facture a son lien secret (64 signes)');

-- Le bon réservé est validé : il prend le numéro suivant.
UPDATE human_echanges_bons SET statut = 'utilise', utilise_le = now() WHERE id = 'b0000000-0000-4000-8000-000000000003';
SELECT pg_temp.verifie(echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', (SELECT l FROM lots)) = 1
  AND (SELECT rang FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000003') = 3, 'le bon validé ensuite : n° 0003, sans trou');

-- Un montant qui ne correspond pas au prix du bon : refusé.
INSERT INTO human_echanges_bons (id, code, preneur_id, fournisseur_id, titre, prix, statut, utilise_le) VALUES
 ('b0000000-0000-4000-8000-000000000005','CLK-FAC005','f1f1f1f1-0000-4000-8000-000000000001','f2f2f2f2-0000-4000-8000-000000000002','Un dîner pour deux',50,'utilise', now());
SELECT pg_temp.verifie(echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', jsonb_build_array(pg_temp.ligne('b0000000-0000-4000-8000-000000000005', 40, 36.36, 3.64, 10))) = 0, 'un montant différent du prix du bon : pas de facture');
DO $$ BEGIN
  PERFORM echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', jsonb_build_array(pg_temp.ligne('b0000000-0000-4000-8000-000000000005', 50, 45, 4.55, 10)));
  RAISE EXCEPTION 'ÉCHEC : HT + TVA ≠ TTC accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  HT + TVA qui ne fait pas le TTC : refusé';
END $$;

-- Figée.
DO $$ BEGIN
  UPDATE human_echanges_factures SET ttc = 1 WHERE bon_id = 'b0000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'ÉCHEC : une facture modifiée';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'ÉCHEC%' THEN RAISE; END IF;
  RAISE NOTICE 'ok  une facture émise ne se modifie pas';
END $$;
DO $$ BEGIN
  DELETE FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'ÉCHEC : une facture effacée';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'ÉCHEC%' THEN RAISE; END IF;
  RAISE NOTICE 'ok  une facture émise ne s''efface pas';
END $$;

-- Les infos : un SIRET de 14 chiffres, une TVA ou une franchise, pas les deux à moitié.
DO $$ BEGIN
  INSERT INTO human_echanges_facturation (site_id, nom_legal, forme, adresse, siret, franchise, taux, mandat_le)
  VALUES ('f1f1f1f1-0000-4000-8000-000000000001', 'Lou Martin', 'EI', '4 rue des Carmes, 40100 Dax', '123', true, NULL, now());
  RAISE EXCEPTION 'ÉCHEC : un SIRET de 3 chiffres accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  un SIRET qui n''a pas 14 chiffres : refusé';
END $$;
DO $$ BEGIN
  INSERT INTO human_echanges_facturation (site_id, nom_legal, forme, adresse, siret, franchise, taux, mandat_le)
  VALUES ('f1f1f1f1-0000-4000-8000-000000000001', 'Lou Martin', 'EI', '4 rue des Carmes, 40100 Dax', '98765432400019', true, 20, now());
  RAISE EXCEPTION 'ÉCHEC : franchise avec un taux accepté';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  franchise ET taux de TVA : refusé';
END $$;
INSERT INTO human_echanges_facturation (site_id, nom_legal, forme, adresse, siret, franchise, taux, nature, mandat_le)
VALUES ('f1f1f1f1-0000-4000-8000-000000000001', 'Lou Martin', 'EI', '4 rue des Carmes, 40100 Dax', '98765432400019', true, NULL, 'services', now());
SELECT pg_temp.verifie(echanges_facturer('f1f1f1f1-0000-4000-8000-000000000001', jsonb_build_array(pg_temp.ligne('b0000000-0000-4000-8000-000000000004', 45, 45, 0, NULL))) = 1
  AND (SELECT numero FROM human_echanges_factures WHERE bon_id = 'b0000000-0000-4000-8000-000000000004') LIKE 'ECH-%-0001',
  'Lou, en franchise : sa propre série commence à 0001, sans TVA');

-- Comme Supabase : anon a le droit de lire les tables de public ; c'est la RLS (sans règle) qui ne lui montre rien.
GRANT SELECT ON human_echanges_factures, human_echanges_facturation TO anon;
SET ROLE anon;
DO $$ BEGIN
  PERFORM echanges_facturer('f2f2f2f2-0000-4000-8000-000000000002', '[]'::jsonb);
  RAISE EXCEPTION 'ÉCHEC : anon a pu facturer';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas facturer';
END $$;
SELECT pg_temp.verifie((SELECT count(*) FROM human_echanges_factures) = 0 AND (SELECT count(*) FROM human_echanges_facturation) = 0, 'anon ne voit aucune facture ni aucun SIRET');
RESET ROLE;
SELECT 'TOUT EST BON' AS fin;
