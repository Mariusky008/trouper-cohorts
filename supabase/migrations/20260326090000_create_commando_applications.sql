create table if not exists public.commando_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  city text not null,
  activity text not null,
  objective text not null,
  availability text not null,
  source text not null default 'homepage',
  status text not null default 'pending',
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.commando_applications
drop constraint if exists commando_applications_status_check;

alter table public.commando_applications
add constraint commando_applications_status_check
check (status in ('pending', 'payment_started', 'paid', 'cancelled'));

create index if not exists idx_commando_applications_created_at
on public.commando_applications (created_at desc);

alter table public.commando_applications enable row level security;

drop policy if exists "Commando applications admin read" on public.commando_applications;
create policy "Commando applications admin read" on public.commando_applications
for select to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';
