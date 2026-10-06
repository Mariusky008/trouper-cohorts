-- LE FANTÔME PERSONNEL D'UN HABITANT : l'identifiant de son look, choisi dans
-- une liste prédéfinie (voir src/lib/direct/look.ts). Rattaché à l'habitant —
-- jamais à son prénom, que deux personnes peuvent partager.
--
-- L'identité repose sur le cookie de l'appareil : le look suit l'habitant sur
-- cet appareil ; il n'y a pas de récupération automatique sur un autre.
alter table public.human_habitants add column if not exists look text;
