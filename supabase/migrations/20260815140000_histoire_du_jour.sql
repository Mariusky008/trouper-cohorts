-- LA PETITE HISTOIRE DU JOUR.
--
-- Ce n'est ni un avis, ni un commentaire, ni une offre : c'est ce qui se passe
-- chez ce commerce aujourd'hui, dit par lui. « 6 h 12. Le premier croissant est
-- sorti du four. Et oui… on en a goûté un. »
--
-- UNE SEULE PAR JOUR ET PAR COMMERCE, et c'est la contrainte qui porte tout le
-- sens : « la petite histoire du jour » au pluriel n'est plus une histoire,
-- c'est un mur d'affichage. `unique (site_id, jour)` rend le second envoi
-- impossible autrement qu'en remplaçant le premier — ce que l'écran propose.
--
-- LE JOUR EST UNE DATE, PAS UN HORODATAGE. Une histoire publiée à 23 h 50 et
-- une autre à 0 h 10 sont deux jours différents, et c'est bien ce qu'on veut :
-- la journée du commerce, pas une fenêtre de 24 heures glissante.
--
-- PAS DE TEXTE ÉCRIT PAR LES CLIENTS. La proposition d'origine en contenait
-- (« Je suis venu pour un café, j'ai finalement déjeuné » — Marc). C'est un
-- champ libre publié sur la page d'un commerce : même charge de modération,
-- même risque de dérapage, et la règle « ni commentaires ni likes publics »
-- reste tenue par le schéma. Seul le commerce écrit ; les habitants réagissent
-- avec les quatre réactions, qui ne sont pas du texte.
create table if not exists public.human_histoire (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.human_vitrine_sites(id) on delete cascade,
  ville_slug text not null,
  -- La journée du commerce, à l'heure de Paris : le serveur peut être ailleurs.
  jour date not null default ((now() at time zone 'Europe/Paris')::date),
  texte text not null,
  -- Le pictogramme du métier, figé à l'écriture : il suit le commerce, et le
  -- recalculer à la lecture ferait changer une histoire d'hier si le commerce
  -- change d'activité.
  emoji text,
  publie_le timestamptz not null default now(),
  retire_le timestamptz,
  constraint human_histoire_texte_utile check (char_length(btrim(texte)) between 3 and 220),
  constraint human_histoire_une_par_jour unique (site_id, jour)
);

-- Le fil d'une ville lit « les histoires du jour » : c'est l'accès qui compte.
create index if not exists human_histoire_ville_jour_idx
  on public.human_histoire (ville_slug, jour desc);

comment on table public.human_histoire is
  'La petite histoire du jour d''un commerce. Une par jour, écrite par lui, jamais par ses clients.';
comment on column public.human_histoire.jour is
  'La journée du commerce (Europe/Paris). Porte la contrainte « une seule par jour ».';
