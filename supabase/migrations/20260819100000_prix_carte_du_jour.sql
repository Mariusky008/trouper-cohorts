-- LE PRIX DE LA CARTE DU JOUR.
--
-- POURQUOI CE CHAMP-LÀ ET PAS UN AUTRE. Une carte du jour ne demande rien au
-- restaurateur — c'est tout son intérêt, il photographie son ardoise et il a
-- fini. Le prix est la SEULE exception qui mérite d'être demandée : c'est un
-- nombre, il se tape en trois secondes, et c'est la première question que se
-- pose quelqu'un qui compare six menus à midi. Sans lui, comparer les cartes
-- de la ville revient à lire six ardoises pour découvrir le prix à la fin de
-- chacune.
--
-- POURQUOI UN NOMBRE ET PAS UN TEXTE. Parce que toute la valeur est dans la
-- comparaison : « les menus à moins de 18 € » n'est possible que si c'est un
-- nombre. Un texte permettrait « à partir de 15 € » ou « 15 € / 19 € », mais
-- rendrait la colonne incomparable — et une colonne prix qu'on ne peut pas
-- comparer ne sert qu'à décorer. Le restaurateur qui a deux formules écrit les
-- deux sur son ardoise ; ici il donne celle qui l'annonce.
--
-- FACULTATIF, ET ÇA COMPTE. Un menu sans prix affiché reste publié et reste
-- lisible. Rendre le prix obligatoire ferait exactement ce qu'on cherche à
-- éviter : un formulaire de plus entre le restaurateur et sa photo.

ALTER TABLE public.human_publications
  ADD COLUMN IF NOT EXISTS prix numeric(10, 2);

COMMENT ON COLUMN public.human_publications.prix IS
  'Le prix annoncé, en euros, tel que le commerçant l''a saisi. NULL = il n''en annonce pas.';

-- Un prix négatif n'existe pas, et un menu du jour à quatre chiffres non plus :
-- la borne haute attrape la faute de frappe (1800 pour 18,00) avant qu'elle ne
-- s'affiche en tête du fil d'une ville.
ALTER TABLE public.human_publications DROP CONSTRAINT IF EXISTS human_publications_prix_plausible;
ALTER TABLE public.human_publications
  ADD CONSTRAINT human_publications_prix_plausible CHECK (prix IS NULL OR (prix >= 0 AND prix < 1000));
