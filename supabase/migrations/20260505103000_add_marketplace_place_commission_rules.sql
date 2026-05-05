begin;

create table if not exists public.human_marketplace_place_commission_rules (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null unique references public.human_marketplace_places(id) on delete cascade,
  popey_fee_eur numeric(10,2) not null default 0 check (popey_fee_eur >= 0),
  updated_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_marketplace_place_commission_rules_fee
  on public.human_marketplace_place_commission_rules(popey_fee_eur, updated_at desc);

drop trigger if exists trg_marketplace_place_commission_rules_updated_at on public.human_marketplace_place_commission_rules;
create trigger trg_marketplace_place_commission_rules_updated_at
before update on public.human_marketplace_place_commission_rules
for each row execute function public.set_marketplace_commission_updated_at();

commit;
