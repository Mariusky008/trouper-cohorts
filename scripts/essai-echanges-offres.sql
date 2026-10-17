-- « 3 OFFRES MAX ET LIMITE PAR OFFRE », ESSAYÉ SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261023120000_echanges_offres.sql` : chaque offre dit comment on la paie (les deux,
-- crédits seulement, moitié prix seulement) ; deux offres de plus au plus (rang 2 et 3) ; chaque offre
-- a sa limite du mois, et seuls ses bons y comptent ; une seule fois à moitié prix par mois chez un
-- même commerçant, toutes ses offres confondues ; en pause, toutes ses offres le sont ; l'ancienne
-- `echanges_prendre` (six arguments) prend la première offre ; anon n'exécute rien.
--
-- Sur une base d'essai où les six migrations de l'échange sont appliquées (voir
-- `essai-echanges-reseau.sql` pour la préparer), puis :
--   psql -d essai_echanges -f scripts/essai-echanges-offres.sql
\set ON_ERROR_STOP 1
-- A coiffure (équipe de 3 → 150 € d'avance), B restaurant (trois offres), C fleuriste.
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('a1000000-0000-4000-8000-0000000000aa','offres-lou'),
 ('b1000000-0000-4000-8000-0000000000bb','offres-bergine'),
 ('c1000000-0000-4000-8000-0000000000cc','offres-fleurs');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('a1000000-0000-4000-8000-0000000000aa','Une coupe',45,4,'Atelier de Lou'),
 ('b1000000-0000-4000-8000-0000000000bb','Un dîner pour deux',50,4,'Chez Bergine'),
 ('c1000000-0000-4000-8000-0000000000cc','Un bouquet',35,4,'Fleurs de Dax');
INSERT INTO human_echanges_membres (site_id, prenom, jeton, active_le) VALUES
 ('a1000000-0000-4000-8000-0000000000aa','Léa','jeton-offres-lea-0000000000000001',now()),
 ('a1000000-0000-4000-8000-0000000000aa','Sami','jeton-offres-sami-000000000000001',now());

CREATE TEMP TABLE r (n int, j jsonb);
CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;
CREATE FUNCTION pg_temp.prendre(n int, preneur text, fourn text, code text, mode text, offre text) RETURNS void LANGUAGE sql AS $$
  INSERT INTO r SELECT n, echanges_prendre(preneur::uuid, fourn::uuid, code, 50, NULL::uuid, mode, offre::uuid);
$$;
CREATE FUNCTION pg_temp.ok(n int) RETURNS boolean LANGUAGE sql AS $$ SELECT (j->>'ok')::boolean FROM r WHERE r.n = $1 $$;
CREATE FUNCTION pg_temp.raison(n int) RETURNS text LANGUAGE sql AS $$ SELECT j->>'raison' FROM r WHERE r.n = $1 $$;

-- 0. Par défaut, une offre se paie des deux façons ; une façon inconnue est refusée.
SELECT pg_temp.verifie((SELECT paiement FROM human_echanges_offres WHERE site_id = 'a1000000-0000-4000-8000-0000000000aa') = 'les_deux', 'une offre d''avant : « les_deux »');
DO $$ BEGIN
  UPDATE human_echanges_offres SET paiement = 'gratuit' WHERE site_id = 'a1000000-0000-4000-8000-0000000000aa';
  RAISE EXCEPTION 'ÉCHEC : une façon de payer inconnue est passée';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  une façon de payer inconnue est refusée';
END $$;

-- Bergine : son dîner en échange seulement ; un dessert à moitié prix seulement (1 par mois) ; un menu midi des deux façons (2 par mois).
UPDATE human_echanges_offres SET paiement = 'credits' WHERE site_id = 'b1000000-0000-4000-8000-0000000000bb';
INSERT INTO human_echanges_offres_autres (id, site_id, rang, titre, prix, par_mois, paiement) VALUES
 ('d1000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-0000000000bb',2,'Un dessert',8,1,'moitie'),
 ('d1000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-0000000000bb',3,'Un menu midi',15,2,'les_deux');

-- 1. Trois offres au plus : pas de 4e, pas deux au même rang.
DO $$ BEGIN
  INSERT INTO human_echanges_offres_autres (site_id, rang, titre, prix, par_mois) VALUES ('b1000000-0000-4000-8000-0000000000bb',4,'Un café',5,8);
  RAISE EXCEPTION 'ÉCHEC : une 4e offre est passée';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok  une 4e offre est refusée';
END $$;
DO $$ BEGIN
  INSERT INTO human_echanges_offres_autres (site_id, rang, titre, prix, par_mois) VALUES ('b1000000-0000-4000-8000-0000000000bb',2,'Un café',5,8);
  RAISE EXCEPTION 'ÉCHEC : deux offres au rang 2';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'ok  deux offres actives au même rang : refusé';
END $$;

-- 2. Le dîner, en échange seulement.
SELECT pg_temp.prendre(1,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF001','moitie',NULL);
SELECT pg_temp.prendre(2,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF002','credits',NULL);
SELECT pg_temp.verifie(pg_temp.raison(1) = 'paiement' AND (SELECT j->>'paiement' FROM r WHERE n = 1) = 'credits' AND pg_temp.ok(2)
  AND (SELECT offre_id IS NULL AND titre = 'Un dîner pour deux' FROM human_echanges_bons WHERE code = 'CLK-OFF002'),
  'le dîner (crédits seulement) : à moitié prix « paiement », avec ses crédits ok, sur la première offre');

-- 3. Le dessert, à moitié prix seulement : son titre, son prix, son offre.
SELECT pg_temp.prendre(3,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF003','credits','d1000000-0000-4000-8000-000000000002');
SELECT pg_temp.prendre(4,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF004','moitie','d1000000-0000-4000-8000-000000000002');
SELECT pg_temp.verifie(pg_temp.raison(3) = 'paiement' AND pg_temp.ok(4)
  AND (SELECT titre = 'Un dessert' AND prix = 8 AND a_regler = 4 AND credits = 4 AND offre_id = 'd1000000-0000-4000-8000-000000000002' AND NOT du_jour FROM human_echanges_bons WHERE code = 'CLK-OFF004'),
  'le dessert (moitié prix seulement) : avec ses crédits « paiement » ; à moitié prix, 4 € à régler, 4 € de crédits, le bon dit son offre');

-- 4. Sa limite à lui : 1 par mois. Le fleuriste arrive trop tard pour le dessert, pas pour le dîner.
SELECT pg_temp.prendre(5,'c1000000-0000-4000-8000-0000000000cc','b1000000-0000-4000-8000-0000000000bb','CLK-OFF005','moitie','d1000000-0000-4000-8000-000000000002');
SELECT pg_temp.prendre(6,'c1000000-0000-4000-8000-0000000000cc','b1000000-0000-4000-8000-0000000000bb','CLK-OFF006','credits',NULL);
SELECT pg_temp.verifie(pg_temp.raison(5) = 'complet' AND pg_temp.ok(6), 'le dessert est complet (1 par mois), le dîner ne l''est pas : chaque offre sa limite');

-- 5. Une seule fois à moitié prix chez Bergine, toutes ses offres confondues ; avec ses crédits, le menu passe.
SELECT pg_temp.prendre(7,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF007','moitie','d1000000-0000-4000-8000-000000000003');
SELECT pg_temp.prendre(8,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF008','credits','d1000000-0000-4000-8000-000000000003');
SELECT pg_temp.verifie(pg_temp.raison(7) = 'moitie_deja' AND pg_temp.ok(8), 'le menu à moitié prix après le dessert : « moitie_deja » ; avec ses crédits, ok');

-- 6. Le menu : 2 par mois. Le 3e (A, qui a encore de quoi) est complet ; le dîner (4 par mois) n'en a que 2.
SELECT pg_temp.prendre(9,'c1000000-0000-4000-8000-0000000000cc','b1000000-0000-4000-8000-0000000000bb','CLK-OFF009','moitie','d1000000-0000-4000-8000-000000000003');
SELECT pg_temp.prendre(10,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF010','credits','d1000000-0000-4000-8000-000000000003');
SELECT pg_temp.verifie(pg_temp.ok(9) AND pg_temp.raison(10) = 'complet'
  AND (SELECT count(*) FROM human_echanges_bons WHERE fournisseur_id = 'b1000000-0000-4000-8000-0000000000bb' AND offre_id IS NULL) = 2,
  'le menu : 2 pris, le 3e « complet » ; le dîner n''en compte que 2 sur 4');

-- 7. Le compte d'A : 150 € d'avance ; pris en crédits : dîner 50 + menu 15 = 65 (le dessert à moitié prix n'y est pas).
SELECT pg_temp.verifie((SELECT sum(prix) FROM human_echanges_bons WHERE preneur_id = 'a1000000-0000-4000-8000-0000000000aa' AND mode = 'credits') = 65, 'A a pris 65 € en crédits');

-- 8. L'offre d'un autre, une offre retirée, une offre inconnue : « offre_retiree ».
SELECT pg_temp.prendre(11,'a1000000-0000-4000-8000-0000000000aa','c1000000-0000-4000-8000-0000000000cc','CLK-OFF011','credits','d1000000-0000-4000-8000-000000000003');
UPDATE human_echanges_offres_autres SET actif = false WHERE id = 'd1000000-0000-4000-8000-000000000002';
SELECT pg_temp.prendre(12,'c1000000-0000-4000-8000-0000000000cc','b1000000-0000-4000-8000-0000000000bb','CLK-OFF012','moitie','d1000000-0000-4000-8000-000000000002');
SELECT pg_temp.prendre(13,'c1000000-0000-4000-8000-0000000000cc','b1000000-0000-4000-8000-0000000000bb','CLK-OFF013','credits','d1000000-0000-4000-8000-0000000000ff');
SELECT pg_temp.verifie(pg_temp.raison(11) = 'offre_retiree' AND pg_temp.raison(12) = 'offre_retiree' AND pg_temp.raison(13) = 'offre_retiree',
  'l''offre de Bergine demandée chez le fleuriste, son dessert retiré, une offre inconnue : « offre_retiree »');
-- Le bon déjà pris sur le dessert retiré reste là ; une nouvelle offre peut prendre son rang.
INSERT INTO human_echanges_offres_autres (site_id, rang, titre, prix, par_mois) VALUES ('b1000000-0000-4000-8000-0000000000bb',2,'Un café gourmand',9,4);
SELECT pg_temp.verifie((SELECT statut = 'reserve' FROM human_echanges_bons WHERE code = 'CLK-OFF004') AND (SELECT count(*) FROM human_echanges_offres_autres WHERE site_id = 'b1000000-0000-4000-8000-0000000000bb' AND actif) = 2,
  'le bon du dessert retiré reste réservé ; le café gourmand prend le rang 2');

-- 9. Bergine en pause : toutes ses offres le sont.
UPDATE human_echanges_offres SET actif = false WHERE site_id = 'b1000000-0000-4000-8000-0000000000bb';
SELECT pg_temp.prendre(14,'a1000000-0000-4000-8000-0000000000aa','b1000000-0000-4000-8000-0000000000bb','CLK-OFF014','credits','d1000000-0000-4000-8000-000000000003');
SELECT pg_temp.verifie(pg_temp.raison(14) = 'offre_retiree', 'en pause, son menu aussi : « offre_retiree »');
UPDATE human_echanges_offres SET actif = true WHERE site_id = 'b1000000-0000-4000-8000-0000000000bb';

-- 10. L'ancienne, à six arguments : la première offre, et sa façon de payer.
INSERT INTO r SELECT 15, echanges_prendre('a1000000-0000-4000-8000-0000000000aa'::uuid,'b1000000-0000-4000-8000-0000000000bb'::uuid,'CLK-OFF015',50,NULL::uuid,'moitie');
INSERT INTO r SELECT 16, echanges_prendre('c1000000-0000-4000-8000-0000000000cc'::uuid,'a1000000-0000-4000-8000-0000000000aa'::uuid,'CLK-OFF016',50,NULL::uuid,'moitie');
SELECT pg_temp.verifie(pg_temp.raison(15) = 'paiement' AND pg_temp.ok(16) AND (SELECT offre_id IS NULL AND titre = 'Une coupe' FROM human_echanges_bons WHERE code = 'CLK-OFF016'),
  'l''ancienne à six arguments : le dîner de Bergine refuse la moitié prix ; la coupe de Lou, oui');

-- 11. anon n'exécute rien.
SET ROLE anon;
DO $$ BEGIN
  PERFORM echanges_prendre('a1000000-0000-4000-8000-0000000000aa'::uuid,'c1000000-0000-4000-8000-0000000000cc'::uuid,'CLK-OFF099',50,NULL::uuid,'credits',NULL::uuid);
  RAISE EXCEPTION 'ÉCHEC : anon a pu prendre';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas prendre une offre';
END $$;
RESET ROLE;
SELECT 'TOUT EST BON' AS fin;
