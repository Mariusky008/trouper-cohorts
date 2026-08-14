-- CE QU'IL RESTE, ET OÙ VOIR LA CARTE.
--
-- La carte du fil affichait « 🍽 2 tables · service jusqu'à 13 h 45 » et un
-- lien « Voir l'ardoise » que PERSONNE ne saisissait nulle part : c'était du
-- décor de maquette. Deux colonnes, et le restaurateur les remplit lui-même.
--
-- `reste` est une phrase courte, pas un nombre : « 2 tables », « 3 parts »,
-- « 1 créneau ». Un entier obligerait à choisir une unité pour tous les métiers
-- — et « 2 » tout seul ne veut rien dire sous une annonce.
--
-- L'HEURE DE FIN N'EST PAS ICI, et c'est délibéré : elle existe déjà dans
-- `expire_le`. La demander une seconde fois créerait deux vérités sur le même
-- sujet, et c'est toujours la mauvaise qui finit affichée.
--
-- `ardoise` est l'adresse de la carte du jour. Contrainte à http(s) au moment de
-- l'écriture ; ici on ne borne que la longueur, une contrainte de format en SQL
-- refuserait une ligne au lieu de nettoyer un champ.
alter table public.human_publications
  add column if not exists reste text,
  add column if not exists ardoise text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'human_publications_reste_court'
  ) then
    alter table public.human_publications
      add constraint human_publications_reste_court check (reste is null or char_length(reste) <= 40);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'human_publications_ardoise_courte'
  ) then
    alter table public.human_publications
      add constraint human_publications_ardoise_courte check (ardoise is null or char_length(ardoise) <= 500);
  end if;
end $$;

comment on column public.human_publications.reste is
  'Ce qu''il reste, en clair : « 2 tables », « 3 parts ». Saisi par le commerçant.';
comment on column public.human_publications.ardoise is
  'Adresse de la carte du jour, affichée « Voir l''ardoise ». http(s) uniquement.';
