-- Buddy System Tables

create table if not exists public.buddy_groups (
  id uuid default gen_random_uuid() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.buddy_group_members (
  group_id uuid references public.buddy_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- Enable RLS
alter table public.buddy_groups enable row level security;
alter table public.buddy_group_members enable row level security;

-- Admin policies
create policy "Buddy groups: admin full access" on public.buddy_groups
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Buddy members: admin full access" on public.buddy_group_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Participant policies (Read only for own cohort)
create policy "Buddy groups: cohort members read" on public.buddy_groups
  for select to authenticated
  using (
    exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = buddy_groups.cohort_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Buddy members: cohort members read" on public.buddy_group_members
  for select to authenticated
  using (
    exists (
      select 1 from public.buddy_groups bg
      join public.cohort_members cm on cm.cohort_id = bg.cohort_id
      where bg.id = buddy_group_members.group_id
      and cm.user_id = auth.uid()
    )
  );
