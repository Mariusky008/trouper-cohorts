create table if not exists public.human_affiliate_commission_decisions (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null unique references public.human_marketplace_landing_activations(id) on delete cascade,
  decision_status text not null default 'pending' check (decision_status in ('pending', 'approved', 'rejected')),
  commission_amount_eur numeric(10,2),
  currency text not null default 'EUR',
  apporteur_type text not null default 'unknown' check (apporteur_type in ('scout_public', 'member_pro', 'unknown')),
  apporteur_scout_id uuid references public.human_scouts(id) on delete set null,
  apporteur_member_id uuid references public.human_members(id) on delete set null,
  apporteur_name text,
  apporteur_phone text,
  pro_member_id uuid references public.human_members(id) on delete set null,
  pro_name text,
  commission_rule_label text,
  note text,
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_affiliate_commission_decisions_status
  on public.human_affiliate_commission_decisions(decision_status, decided_at desc nulls last);

create index if not exists idx_affiliate_commission_decisions_apporteur_scout
  on public.human_affiliate_commission_decisions(apporteur_scout_id);

create index if not exists idx_affiliate_commission_decisions_apporteur_member
  on public.human_affiliate_commission_decisions(apporteur_member_id);

create index if not exists idx_affiliate_commission_decisions_pro_member
  on public.human_affiliate_commission_decisions(pro_member_id);

create or replace function public.set_affiliate_commission_decisions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_affiliate_commission_decisions_updated_at on public.human_affiliate_commission_decisions;
create trigger trg_affiliate_commission_decisions_updated_at
before update on public.human_affiliate_commission_decisions
for each row
execute function public.set_affiliate_commission_decisions_updated_at();
