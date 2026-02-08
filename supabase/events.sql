-- Events Table

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  meeting_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.events enable row level security;

-- Admin: Full access
create policy "Events: admin full access" on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Participant: Read only for own cohort
create policy "Events: cohort members read" on public.events
  for select to authenticated
  using (
    exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = events.cohort_id
      and cm.user_id = auth.uid()
    )
  );
