create table if not exists public.human_marketplace_cobrand_offers (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  city_slug text not null,
  primary_member_id uuid not null references public.human_members(id) on delete restrict,
  secondary_member_id uuid not null references public.human_members(id) on delete restrict,
  primary_place_id uuid references public.human_marketplace_places(id) on delete set null,
  secondary_place_id uuid references public.human_marketplace_places(id) on delete set null,
  pack_title text not null,
  pack_subtitle text,
  primary_offer_label text not null,
  primary_offer_value_eur numeric(10,2) not null default 0,
  secondary_offer_label text not null,
  secondary_offer_value_eur numeric(10,2) not null default 0,
  commission_note text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint human_marketplace_cobrand_members_distinct check (primary_member_id <> secondary_member_id)
);

create index if not exists idx_hm_cobrand_city_slug on public.human_marketplace_cobrand_offers(city_slug);
create index if not exists idx_hm_cobrand_status on public.human_marketplace_cobrand_offers(status);
create index if not exists idx_hm_cobrand_primary_member on public.human_marketplace_cobrand_offers(primary_member_id);
create index if not exists idx_hm_cobrand_secondary_member on public.human_marketplace_cobrand_offers(secondary_member_id);

alter table public.human_marketplace_cobrand_offers enable row level security;

drop policy if exists "hm_cobrand_service_role_all" on public.human_marketplace_cobrand_offers;
create policy "hm_cobrand_service_role_all"
on public.human_marketplace_cobrand_offers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
