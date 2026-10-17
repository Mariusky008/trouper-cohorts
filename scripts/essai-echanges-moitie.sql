-- « JAMAIS PLEIN TARIF », ESSAYÉ SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261022130000_echanges_moitie_prix.sql` : à moitié prix, l'acheteur paie la moitié
-- en euros et ses crédits ne bougent pas (ni ceux de son commerce, ni les 50 € d'un membre) ; le
-- vendeur gagne l'autre moitié en crédits (arrondie à l'euro au-dessus) quand il valide ; une seule
-- fois par mois chez un même commerçant ; « combien par mois » compte tous les bons ; les anciennes
-- `echanges_prendre` (quatre et cinq arguments) passent par la nouvelle ; anon n'exécute rien.
--
-- Sur une base d'essai où les cinq migrations de l'échange sont appliquées (voir
-- `essai-echanges-reseau.sql` pour la préparer), puis :
--   psql -d essai_echanges -f scripts/essai-echanges-moitie.sql
\set ON_ERROR_STOP 1
-- A coiffure (équipe de 2 : le responsable et Léa → 100 € d'avance), B restaurant, C fleuriste, D boulangerie.
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('a0000000-0000-4000-8000-0000000000aa','moitie-lou'),
 ('b0000000-0000-4000-8000-0000000000bb','moitie-bergine'),
 ('c0000000-0000-4000-8000-0000000000cc','moitie-fleurs'),
 ('d0000000-0000-4000-8000-0000000000dd','moitie-fournil');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('a0000000-0000-4000-8000-0000000000aa','Une coupe',45,4,'Atelier de Lou'),
 ('b0000000-0000-4000-8000-0000000000bb','Un dîner pour deux',50,4,'Chez Bergine'),
 ('c0000000-0000-4000-8000-0000000000cc','Un bouquet',35,4,'Fleurs de Dax'),
 ('d0000000-0000-4000-8000-0000000000dd','Une baguette',6,8,'Le Fournil');
INSERT INTO human_echanges_membres (id, site_id, prenom, jeton, active_le) VALUES
 ('e0000000-0000-4000-8000-0000000000ee','a0000000-0000-4000-8000-0000000000aa','Léa','jeton-moitie-lea-00000000000000001',now());

CREATE TEMP TABLE r (n int, j jsonb);
CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;
CREATE FUNCTION pg_temp.prendre(n int, preneur text, fourn text, code text, membre text, mode text) RETURNS void LANGUAGE sql AS $$
  INSERT INTO r SELECT n, echanges_prendre(preneur::uuid, fourn::uuid, code, 50, membre::uuid, mode);
$$;
CREATE FUNCTION pg_temp.ok(n int) RETURNS boolean LANGUAGE sql AS $$ SELECT (j->>'ok')::boolean FROM r WHERE r.n = $1 $$;
CREATE FUNCTION pg_temp.raison(n int) RETURNS text LANGUAGE sql AS $$ SELECT j->>'raison' FROM r WHERE r.n = $1 $$;

-- 1. A prend deux dîners avec ses crédits (100 €) : son avance est épuisée.
SELECT pg_temp.prendre(1,'a0000000-0000-4000-8000-0000000000aa','b0000000-0000-4000-8000-0000000000bb','CLK-MOI001',NULL,'credits');
SELECT pg_temp.prendre(2,'a0000000-0000-4000-8000-0000000000aa','b0000000-0000-4000-8000-0000000000bb','CLK-MOI002',NULL,'credits');
SELECT pg_temp.prendre(3,'a0000000-0000-4000-8000-0000000000aa','c0000000-0000-4000-8000-0000000000cc','CLK-MOI003',NULL,'credits');
SELECT pg_temp.verifie(pg_temp.ok(1) AND pg_temp.ok(2) AND pg_temp.raison(3) = 'solde', 'deux dîners avec ses crédits, le bouquet ne passe plus : « solde »');

-- 2. À moitié prix, ses crédits ne comptent pas : le bouquet passe.
SELECT pg_temp.prendre(4,'a0000000-0000-4000-8000-0000000000aa','c0000000-0000-4000-8000-0000000000cc','CLK-MOI004',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.ok(4) AND (SELECT mode = 'moitie' AND a_regler = 17.50 AND credits = 18 FROM human_echanges_bons WHERE code = 'CLK-MOI004'),
  'le bouquet (35 €) à moitié prix : 17,50 € à régler, 18 € de crédits pour le fleuriste');
-- 3. Une seule fois par mois chez le même commerçant ; ailleurs, oui.
SELECT pg_temp.prendre(5,'a0000000-0000-4000-8000-0000000000aa','c0000000-0000-4000-8000-0000000000cc','CLK-MOI005',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.raison(5) = 'moitie_deja', 'un second bouquet à moitié prix ce mois-ci : « moitie_deja »');
SELECT pg_temp.prendre(6,'a0000000-0000-4000-8000-0000000000aa','b0000000-0000-4000-8000-0000000000bb','CLK-MOI006',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.ok(6) AND (SELECT a_regler = 25 AND credits = 25 FROM human_echanges_bons WHERE code = 'CLK-MOI006'), 'un dîner à moitié prix chez un autre : 25 € et 25 €');
-- Un bon annulé ne bloque pas : le droit revient.
UPDATE human_echanges_bons SET statut = 'annule', annule_par = 'preneur', annule_le = now() WHERE code = 'CLK-MOI004';
SELECT pg_temp.prendre(7,'a0000000-0000-4000-8000-0000000000aa','c0000000-0000-4000-8000-0000000000cc','CLK-MOI007',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.ok(7), 'le bouquet à moitié prix annulé : il peut le reprendre');

-- 4. Le vendeur valide : il gagne la moitié en crédits (le dîner à moitié prix : 25), le prix entier pour un dîner payé en crédits.
UPDATE human_echanges_bons SET statut = 'utilise', utilise_le = now() WHERE code IN ('CLK-MOI001', 'CLK-MOI006');
SELECT pg_temp.verifie((SELECT sum(credits) FROM human_echanges_bons WHERE fournisseur_id = 'b0000000-0000-4000-8000-0000000000bb' AND statut = 'utilise') = 75,
  'Bergine a validé un dîner en crédits et un à moitié prix : 50 + 25 = 75 € de crédits');
-- B : 50 € d'avance + 75 gagnés = 125 → une coupe (45) et deux bouquets (70) passent (115), une baguette (6) aussi, pas une seconde coupe.
SELECT pg_temp.prendre(8,'b0000000-0000-4000-8000-0000000000bb','a0000000-0000-4000-8000-0000000000aa','CLK-MOI008',NULL,'credits');
SELECT pg_temp.prendre(9,'b0000000-0000-4000-8000-0000000000bb','c0000000-0000-4000-8000-0000000000cc','CLK-MOI009',NULL,'credits');
SELECT pg_temp.prendre(10,'b0000000-0000-4000-8000-0000000000bb','c0000000-0000-4000-8000-0000000000cc','CLK-MOI010',NULL,'credits');
SELECT pg_temp.prendre(11,'b0000000-0000-4000-8000-0000000000bb','d0000000-0000-4000-8000-0000000000dd','CLK-MOI011',NULL,'credits');
SELECT pg_temp.prendre(12,'b0000000-0000-4000-8000-0000000000bb','a0000000-0000-4000-8000-0000000000aa','CLK-MOI012',NULL,'credits');
SELECT pg_temp.verifie(pg_temp.ok(8) AND pg_temp.ok(9) AND pg_temp.ok(10) AND pg_temp.ok(11) AND pg_temp.raison(12) = 'solde' AND (SELECT (j->>'manque')::int FROM r WHERE n = 12) = 41,
  'les crédits gagnés à moitié prix se dépensent : 125 € pour Bergine, 4 € restent, il en manque 41 pour une coupe');

-- 5. Un membre : ses 50 € ne comptent que les crédits.
SELECT pg_temp.prendre(13,'a0000000-0000-4000-8000-0000000000aa','d0000000-0000-4000-8000-0000000000dd','CLK-MOI013','e0000000-0000-4000-8000-0000000000ee','moitie');
SELECT pg_temp.verifie(pg_temp.ok(13) AND (SELECT membre_id IS NOT NULL FROM human_echanges_bons WHERE code = 'CLK-MOI013'), 'Léa prend une baguette à moitié prix : le bon dit que c''est elle');
-- Le commerce de Léa : 100 € d'avance, 100 pris en crédits, rien gagné → 0 ; elle ne peut rien prendre en crédits…
SELECT pg_temp.prendre(14,'a0000000-0000-4000-8000-0000000000aa','d0000000-0000-4000-8000-0000000000dd','CLK-MOI014','e0000000-0000-4000-8000-0000000000ee','credits');
SELECT pg_temp.verifie(pg_temp.raison(14) = 'solde', 'Léa avec des crédits : le compte de la boutique est vide (« solde »), pas ses 50 € (« plafond_perso »)');

-- 6. « Combien par mois » compte tous les bons : Bergine (4 par mois) a déjà A×2, A moitié ; C en prend un ; D à moitié prix : complet.
SELECT pg_temp.prendre(15,'c0000000-0000-4000-8000-0000000000cc','b0000000-0000-4000-8000-0000000000bb','CLK-MOI015',NULL,'credits');
SELECT pg_temp.prendre(16,'d0000000-0000-4000-8000-0000000000dd','b0000000-0000-4000-8000-0000000000bb','CLK-MOI016',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.ok(15) AND pg_temp.raison(16) = 'complet', 'le 5e dîner du mois, même à moitié prix : « complet »');

-- 7. Un mode inconnu ; les anciennes fonctions passent par la nouvelle (avec ses crédits).
SELECT pg_temp.prendre(17,'d0000000-0000-4000-8000-0000000000dd','c0000000-0000-4000-8000-0000000000cc','CLK-MOI017',NULL,'gratuit');
SELECT pg_temp.verifie(pg_temp.raison(17) = 'mode', 'un mode inconnu : « mode »');
INSERT INTO r SELECT 18, echanges_prendre('d0000000-0000-4000-8000-0000000000dd'::uuid,'c0000000-0000-4000-8000-0000000000cc'::uuid,'CLK-MOI018',50,NULL::uuid);
INSERT INTO r SELECT 19, echanges_prendre('d0000000-0000-4000-8000-0000000000dd'::uuid,'a0000000-0000-4000-8000-0000000000aa'::uuid,'CLK-MOI019',50);
SELECT pg_temp.verifie(pg_temp.ok(18) AND (SELECT mode FROM human_echanges_bons WHERE code = 'CLK-MOI018') = 'credits', 'l''ancienne à cinq arguments : un bon avec ses crédits');
SELECT pg_temp.verifie(pg_temp.raison(19) = 'solde', 'l''ancienne à quatre arguments compte comme la nouvelle : 50 € d''avance, 35 pris, la coupe (45 €) ne passe pas');

-- 8. Un bon à moitié prix périmé ne compte plus (ni le droit du mois, ni « combien par mois »).
UPDATE human_echanges_bons SET expire_le = now() - interval '1 day' WHERE code = 'CLK-MOI007';
SELECT pg_temp.prendre(20,'a0000000-0000-4000-8000-0000000000aa','c0000000-0000-4000-8000-0000000000cc','CLK-MOI020',NULL,'moitie');
SELECT pg_temp.verifie(pg_temp.ok(20) AND (SELECT statut FROM human_echanges_bons WHERE code = 'CLK-MOI007') = 'expire', 'le bouquet à moitié prix a expiré : il peut en reprendre un');

-- 9. anon et authenticated n'exécutent rien.
SET ROLE anon;
DO $$ BEGIN
  PERFORM echanges_prendre('a0000000-0000-4000-8000-0000000000aa'::uuid,'d0000000-0000-4000-8000-0000000000dd'::uuid,'CLK-MOI099',50,NULL::uuid,'moitie');
  RAISE EXCEPTION 'ÉCHEC : anon a pu prendre';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  anon ne peut pas prendre à moitié prix';
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
  PERFORM echanges_prendre('a0000000-0000-4000-8000-0000000000aa'::uuid,'d0000000-0000-4000-8000-0000000000dd'::uuid,'CLK-MOI098',50,NULL::uuid);
  RAISE EXCEPTION 'ÉCHEC : authenticated a pu prendre';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok  authenticated non plus, même par l''ancienne';
END $$;
RESET ROLE;
SELECT 'TOUT EST BON' AS fin;
