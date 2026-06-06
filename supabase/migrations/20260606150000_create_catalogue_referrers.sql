-- Catalogue Privilège — « Tableau des scores » des membres qui partagent.
-- Stocke, par référent (ref du lien partagé), les infos déclaratives/planning :
--  • declared_contacts : nb de contacts WhatsApp visés (déclaré au point mensuel).
--  • propulsion_day     : jour du mois où le membre doit propulser le catalogue (vagues).
-- Les CLICS / l'intérêt sont calculés à la volée depuis human_marketplace_events
-- (events priv_* groupés par payload->>'ref'). Pas de duplication de données.

create table if not exists public.human_catalogue_referrers (
  ref text primary key,
  ref_name text,
  declared_contacts integer,
  propulsion_day integer,
  updated_at timestamptz not null default timezone('utc', now())
);
