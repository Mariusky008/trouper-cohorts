alter table public.human_marketplace_cobrand_offers
  alter column primary_member_id drop not null,
  alter column secondary_member_id drop not null;

alter table public.human_marketplace_cobrand_offers
  add column if not exists primary_member_name text,
  add column if not exists primary_member_metier text,
  add column if not exists secondary_member_name text,
  add column if not exists secondary_member_metier text;
