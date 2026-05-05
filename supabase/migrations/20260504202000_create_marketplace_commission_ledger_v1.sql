begin;

create table if not exists public.human_marketplace_pro_commission_rules (
  id uuid primary key default gen_random_uuid(),
  pro_member_id uuid not null unique references public.human_members(id) on delete cascade,
  popey_fee_eur numeric(10,2) not null default 0 check (popey_fee_eur >= 0),
  updated_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.human_marketplace_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references public.human_marketplace_landing_activations(id) on delete cascade,
  row_kind text not null check (row_kind in ('apporteur','popey')),
  period_month date not null,
  ticket_code text not null,
  city text,
  payer_member_id uuid references public.human_members(id) on delete set null,
  receiver_member_id uuid references public.human_members(id) on delete set null,
  receiver_scout_id uuid references public.human_scouts(id) on delete set null,
  receiver_name text,
  amount_eur numeric(10,2) not null check (amount_eur >= 0),
  currency text not null default 'EUR',
  decision_status text not null default 'approved' check (decision_status in ('approved','rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending','requested','paid','cancelled')),
  payment_requested_at timestamptz,
  payment_requested_by_member_id uuid references public.human_members(id) on delete set null,
  paid_at timestamptz,
  paid_by_user_id uuid references auth.users(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_marketplace_commission_ledger_activation_row_kind
  on public.human_marketplace_commission_ledger(activation_id, row_kind);

create index if not exists idx_marketplace_commission_ledger_period
  on public.human_marketplace_commission_ledger(period_month, payment_status);

create index if not exists idx_marketplace_commission_ledger_payer
  on public.human_marketplace_commission_ledger(payer_member_id, period_month);

create index if not exists idx_marketplace_commission_ledger_receiver_member
  on public.human_marketplace_commission_ledger(receiver_member_id, period_month);

create table if not exists public.human_marketplace_commission_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.human_members(id) on delete cascade,
  period_month date not null,
  request_kind text not null check (request_kind in ('apporteur_payout','pro_settlement')),
  requested_amount_eur numeric(10,2) not null check (requested_amount_eur > 0),
  status text not null default 'pending' check (status in ('pending','processed','rejected')),
  note text,
  processed_note text,
  processed_at timestamptz,
  processed_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_marketplace_commission_requests_period_status
  on public.human_marketplace_commission_requests(period_month, status, request_kind);

create unique index if not exists idx_marketplace_commission_requests_member_month_kind_pending
  on public.human_marketplace_commission_requests(member_id, period_month, request_kind)
  where status = 'pending';

create or replace function public.set_marketplace_commission_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_marketplace_commission_rules_updated_at on public.human_marketplace_pro_commission_rules;
create trigger trg_marketplace_commission_rules_updated_at
before update on public.human_marketplace_pro_commission_rules
for each row execute function public.set_marketplace_commission_updated_at();

drop trigger if exists trg_marketplace_commission_ledger_updated_at on public.human_marketplace_commission_ledger;
create trigger trg_marketplace_commission_ledger_updated_at
before update on public.human_marketplace_commission_ledger
for each row execute function public.set_marketplace_commission_updated_at();

commit;
