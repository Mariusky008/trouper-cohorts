begin;

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role text not null default 'participant';
alter table public.profiles add column if not exists trade text;
alter table public.profiles add column if not exists department_code text;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Profiles: read own row" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "Profiles: insert own row" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "Profiles: update own row" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

create policy "Profiles: admin read" on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy "Profiles: admin update" on public.profiles
  for update to authenticated
  using (public.is_admin());

create table if not exists public.cohorts (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  trade text not null,
  title text not null,
  start_date date,
  end_date date,
  status text not null default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cohorts enable row level security;

create policy "Cohorts: admin full access" on public.cohorts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.cohort_members (
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  member_role text not null default 'participant',
  department_code text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (cohort_id, user_id),
  unique (cohort_id, department_code)
);

alter table public.cohort_members enable row level security;

create policy "Cohorts: members read" on public.cohorts
  for select to authenticated
  using (
    exists (
      select 1
      from public.cohort_members m
      where m.cohort_id = id and m.user_id = auth.uid()
    )
  );

create policy "Cohort members: admin full access" on public.cohort_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Cohort members: participant read own membership" on public.cohort_members
  for select to authenticated
  using (user_id = auth.uid());

create policy "Cohort members: participant join" on public.cohort_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and member_role = 'participant'
    and department_code is null
  );

create table if not exists public.missions (
  id uuid default gen_random_uuid() primary key,
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  day_index int not null,
  title text not null,
  description text,
  proof_type text not null default 'url',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cohort_id, day_index)
);

alter table public.missions enable row level security;

create policy "Missions: admin full access" on public.missions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Missions: members read" on public.missions
  for select to authenticated
  using (
    exists (
      select 1
      from public.cohort_members m
      where m.cohort_id = cohort_id and m.user_id = auth.uid()
    )
  );

create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  mission_id uuid references public.missions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  proof_url text,
  note text,
  status text not null default 'submitted',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (mission_id, user_id)
);

alter table public.submissions enable row level security;

create policy "Submissions: admin full access" on public.submissions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Submissions: participant read own" on public.submissions
  for select to authenticated
  using (user_id = auth.uid());

create policy "Submissions: participant insert own" on public.submissions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.missions ms
      join public.cohort_members m on m.cohort_id = ms.cohort_id
      where ms.id = mission_id and m.user_id = auth.uid()
    )
  );

create policy "Submissions: participant update own" on public.submissions
  for update to authenticated
  using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_submissions_updated_at on public.submissions;

create trigger set_submissions_updated_at
before update on public.submissions
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
