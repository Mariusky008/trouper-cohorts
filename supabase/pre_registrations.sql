-- Table pour les pré-inscriptions (Landing Page)
create table if not exists public.pre_registrations (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  trade text, -- Métier souhaité
  department_code text, -- Département souhaité
  status text not null default 'pending', -- pending, invited, converted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.pre_registrations enable row level security;

-- Admin peut tout faire
create policy "PreRegistrations: admin full access" on public.pre_registrations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Anonyme peut insérer (via formulaire public)
create policy "PreRegistrations: public insert" on public.pre_registrations
  for insert to anon
  with check (true);
