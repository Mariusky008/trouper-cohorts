-- « SIGNALER » UN BON NON HONORÉ, ESSAYÉ SUR UN VRAI POSTGRES — jamais sur la base de production.
--
-- Les règles de `20261025120000_echanges_signalements.sql` : seul celui qui a pris le bon le signale,
-- une fois, dans les 60 jours ; un bon encore réservé est annulé au passage (ses crédits reviennent) ;
-- deux commerces DIFFÉRENTS → ses offres passent en pause, et il ne peut pas les remettre en ligne
-- lui-même ; lever la pause remet son offre comme elle était et remet le compte à zéro ; anon
-- n'exécute rien.
--
-- Sur une base d'essai où les migrations de l'échange sont appliquées (voir
-- `scripts/essais-sql-echanges.sh`), puis :
--   psql -d essai_echanges -f scripts/essai-echanges-signalements.sql
\set ON_ERROR_STOP 1
-- F fournisseur (un dîner à 20 €, 8 par mois), G second fournisseur ; P, Q, R trois commerces qui prennent.
INSERT INTO human_vitrine_sites (id, slug) VALUES
 ('f1000000-0000-4000-8000-0000000000f1','signal-f'),
 ('f2000000-0000-4000-8000-0000000000f2','signal-g'),
 ('a1000000-0000-4000-8000-0000000000a1','signal-p'),
 ('a2000000-0000-4000-8000-0000000000a2','signal-q'),
 ('a3000000-0000-4000-8000-0000000000a3','signal-r');
INSERT INTO human_echanges_offres (site_id, titre, prix, par_mois, commerce) VALUES
 ('f1000000-0000-4000-8000-0000000000f1','Un dîner',20,8,'Chez F'),
 ('f2000000-0000-4000-8000-0000000000f2','Un bouquet',10,8,'Fleurs G'),
 ('a1000000-0000-4000-8000-0000000000a1','Une coupe',30,4,'Salon P'),
 ('a2000000-0000-4000-8000-0000000000a2','Un pain',5,8,'Fournil Q'),
 ('a3000000-0000-4000-8000-0000000000a3','Un livre',15,4,'Librairie R');

CREATE TEMP TABLE s (n int, j jsonb);
CREATE FUNCTION pg_temp.verifie(ok boolean, quoi text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'ÉCHEC : %', quoi; END IF; RAISE NOTICE 'ok  %', quoi; END $$;
CREATE FUNCTION pg_temp.prendre(preneur text, fourn text, code text) RETURNS uuid LANGUAGE sql AS $$
  SELECT (echanges_prendre(preneur::uuid, fourn::uuid, code, 50, NULL, 'credits', NULL)->'bon'->>'id')::uuid;
$$;
CREATE FUNCTION pg_temp.signaler(n int, preneur text, code text, motif text) RETURNS void LANGUAGE sql AS $$
  INSERT INTO s SELECT n, echanges_signaler(preneur::uuid, (SELECT id FROM human_echanges_bons WHERE human_echanges_bons.code = signaler.code), motif, 'essai');
$$;
CREATE FUNCTION pg_temp.ok(n int) RETURNS boolean LANGUAGE sql AS $$ SELECT (j->>'ok')::boolean FROM s WHERE s.n = $1 $$;
CREATE FUNCTION pg_temp.raison(n int) RETURNS text LANGUAGE sql AS $$ SELECT j->>'raison' FROM s WHERE s.n = $1 $$;
CREATE FUNCTION pg_temp.champ(n int, c text) RETURNS text LANGUAGE sql AS $$ SELECT j->>c FROM s WHERE s.n = $1 $$;
CREATE FUNCTION pg_temp.actif(site text) RETURNS boolean LANGUAGE sql AS $$ SELECT actif FROM human_echanges_offres WHERE site_id = site::uuid $$;

-- 1. P prend un dîner chez F, F ne le sert pas : P le signale. Le bon réservé est annulé, pas encore de pause.
SELECT pg_temp.prendre('a1000000-0000-4000-8000-0000000000a1','f1000000-0000-4000-8000-0000000000f1','CLK-SIG001');
SELECT pg_temp.signaler(1,'a1000000-0000-4000-8000-0000000000a1','CLK-SIG001','refuse');
SELECT pg_temp.verifie(pg_temp.ok(1) AND pg_temp.champ(1,'annule') = 'true' AND pg_temp.champ(1,'pause') = 'false' AND pg_temp.champ(1,'signalements') = '1'
  AND (SELECT statut = 'annule' AND annule_par = 'preneur' FROM human_echanges_bons WHERE code = 'CLK-SIG001'),
  'un bon réservé signalé : annulé tout de suite (ses crédits reviennent), 1 signalement, pas de pause');

-- 2. Les refus : le même bon deux fois, le bon d'un autre, une raison inconnue.
SELECT pg_temp.signaler(2,'a1000000-0000-4000-8000-0000000000a1','CLK-SIG001','refuse');
SELECT pg_temp.signaler(3,'a2000000-0000-4000-8000-0000000000a2','CLK-SIG001','refuse');
SELECT pg_temp.prendre('a1000000-0000-4000-8000-0000000000a1','f1000000-0000-4000-8000-0000000000f1','CLK-SIG002');
SELECT pg_temp.signaler(4,'a1000000-0000-4000-8000-0000000000a1','CLK-SIG002','pas-content');
SELECT pg_temp.verifie(pg_temp.raison(2) = 'deja' AND pg_temp.raison(3) = 'bon' AND pg_temp.raison(4) = 'motif',
  'refusés : le même bon une 2e fois (« deja »), le bon d''un autre (« bon »), une raison inconnue (« motif »)');

-- 3. Un bon servi mais pas comme annoncé : signalé, rien n'est annulé ; le même commerce ne compte qu'une fois.
UPDATE human_echanges_bons SET statut = 'utilise', utilise_le = now() WHERE code = 'CLK-SIG002';
SELECT pg_temp.signaler(5,'a1000000-0000-4000-8000-0000000000a1','CLK-SIG002','different');
SELECT pg_temp.verifie(pg_temp.ok(5) AND pg_temp.champ(5,'annule') = 'false' AND pg_temp.champ(5,'signalements') = '1' AND pg_temp.champ(5,'pause') = 'false'
  AND (SELECT statut = 'utilise' FROM human_echanges_bons WHERE code = 'CLK-SIG002'),
  'un bon servi « pas comme annoncé » : signalé, rien d''annulé ; P compte toujours pour un seul commerce');

-- 4. Q signale à son tour : deux commerces différents → les offres de F passent en pause.
SELECT pg_temp.prendre('a2000000-0000-4000-8000-0000000000a2','f1000000-0000-4000-8000-0000000000f1','CLK-SIG003');
SELECT pg_temp.signaler(6,'a2000000-0000-4000-8000-0000000000a2','CLK-SIG003','ferme');
SELECT pg_temp.verifie(pg_temp.ok(6) AND pg_temp.champ(6,'pause') = 'true' AND pg_temp.champ(6,'signalements') = '2'
  AND pg_temp.actif('f1000000-0000-4000-8000-0000000000f1') = false
  AND (SELECT levee_le IS NULL AND offre_active_avant FROM human_echanges_pauses WHERE site_id = 'f1000000-0000-4000-8000-0000000000f1'),
  'deux commerces différents : les offres de F passent en pause, automatiquement');

-- 5. En pause, F ne peut pas remettre son offre en ligne ; personne ne peut lui prendre.
UPDATE human_echanges_offres SET actif = true, titre = 'Un dîner du soir' WHERE site_id = 'f1000000-0000-4000-8000-0000000000f1';
SELECT pg_temp.verifie(pg_temp.actif('f1000000-0000-4000-8000-0000000000f1') = false
  AND (SELECT titre = 'Un dîner du soir' FROM human_echanges_offres WHERE site_id = 'f1000000-0000-4000-8000-0000000000f1'),
  'en pause : il peut modifier son offre, elle reste hors ligne');
SELECT pg_temp.verifie((echanges_prendre('a3000000-0000-4000-8000-0000000000a3'::uuid,'f1000000-0000-4000-8000-0000000000f1'::uuid,'CLK-SIG004',50,NULL,'credits',NULL)->>'raison') = 'offre_retiree',
  'en pause : R ne peut rien lui prendre (« offre_retiree »)');

-- 6. ClikMe lève la pause (signalements non fondés) : son offre revient, les signalements sont traités.
INSERT INTO s SELECT 100, echanges_lever_pause('f1000000-0000-4000-8000-0000000000f1'::uuid,'rejete');
SELECT pg_temp.verifie(pg_temp.champ(100,'levee') = 'true' AND pg_temp.champ(100,'traites') = '3'
  AND pg_temp.actif('f1000000-0000-4000-8000-0000000000f1') = true
  AND (SELECT count(*) = 3 FROM human_echanges_signalements WHERE fournisseur_id = 'f1000000-0000-4000-8000-0000000000f1' AND statut = 'rejete' AND traite_le IS NOT NULL),
  'pause levée : son offre revient en ligne, les trois signalements sont « rejetés »');
SELECT pg_temp.verifie((echanges_lever_pause('f1000000-0000-4000-8000-0000000000f1'::uuid,'peut-etre')->>'raison') = 'decision', 'lever avec une décision inconnue : refusé');

-- 7. Le compte repart de zéro : un nouveau signalement après la levée ne remet pas en pause.
SELECT pg_temp.prendre('a3000000-0000-4000-8000-0000000000a3','f1000000-0000-4000-8000-0000000000f1','CLK-SIG005');
SELECT pg_temp.signaler(7,'a3000000-0000-4000-8000-0000000000a3','CLK-SIG005','refuse');
SELECT pg_temp.verifie(pg_temp.ok(7) AND pg_temp.champ(7,'signalements') = '1' AND pg_temp.champ(7,'pause') = 'false' AND pg_temp.actif('f1000000-0000-4000-8000-0000000000f1'),
  'après la levée, le compte repart de zéro : 1 signalement, pas de pause');

-- 8. G avait mis son offre en pause lui-même avant d'être signalé : la levée la laisse hors ligne.
SELECT pg_temp.prendre('a1000000-0000-4000-8000-0000000000a1','f2000000-0000-4000-8000-0000000000f2','CLK-SIG006');
SELECT pg_temp.prendre('a2000000-0000-4000-8000-0000000000a2','f2000000-0000-4000-8000-0000000000f2','CLK-SIG007');
UPDATE human_echanges_offres SET actif = false WHERE site_id = 'f2000000-0000-4000-8000-0000000000f2';
SELECT pg_temp.signaler(8,'a1000000-0000-4000-8000-0000000000a1','CLK-SIG006','ferme');
SELECT pg_temp.signaler(9,'a2000000-0000-4000-8000-0000000000a2','CLK-SIG007','ferme');
SELECT pg_temp.verifie(pg_temp.champ(9,'pause') = 'true' AND (SELECT NOT offre_active_avant FROM human_echanges_pauses WHERE site_id = 'f2000000-0000-4000-8000-0000000000f2'),
  'G, déjà hors ligne de lui-même, signalé deux fois : en pause, et on le note');
SELECT echanges_lever_pause('f2000000-0000-4000-8000-0000000000f2'::uuid,'fonde');
SELECT pg_temp.verifie(pg_temp.actif('f2000000-0000-4000-8000-0000000000f2') = false
  AND (SELECT count(*) = 2 FROM human_echanges_signalements WHERE fournisseur_id = 'f2000000-0000-4000-8000-0000000000f2' AND statut = 'fonde'),
  'levée « fondée » : son offre reste comme il l''avait laissée (hors ligne)');

-- 9. Trop tard : un bon de plus de 60 jours ne se signale plus.
SELECT pg_temp.prendre('a3000000-0000-4000-8000-0000000000a3','f1000000-0000-4000-8000-0000000000f1','CLK-SIG008');
UPDATE human_echanges_bons SET cree_le = now() - interval '70 days' WHERE code = 'CLK-SIG008';
SELECT pg_temp.signaler(10,'a3000000-0000-4000-8000-0000000000a3','CLK-SIG008','refuse');
SELECT pg_temp.verifie(pg_temp.raison(10) = 'trop_tard', 'un bon de plus de 60 jours : « trop_tard »');

-- 10. Ni anon ni un utilisateur connecté n'exécutent les fonctions.
SELECT pg_temp.verifie(NOT has_function_privilege('anon', 'echanges_signaler(uuid,uuid,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'echanges_lever_pause(uuid,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'echanges_signaler(uuid,uuid,text,text)', 'EXECUTE'),
  'anon et authenticated n''exécutent rien ; le serveur, oui');

SELECT 'TOUT EST BON' AS fin;
