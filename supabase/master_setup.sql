-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  avatar_url text,
  main_platform text,
  objective text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for Squads
create table squads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table squads enable row level security;

create policy "Squads are viewable by everyone." on squads
  for select using (true);

-- Create a table for Squad Members
create table squad_members (
  id uuid default gen_random_uuid() primary key,
  squad_id uuid references squads(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(squad_id, user_id)
);

alter table squad_members enable row level security;

create policy "Squad members are viewable by everyone." on squad_members
  for select using (true);

create policy "Users can join a squad." on squad_members
  for insert with check (auth.uid() = user_id);

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert a default "Escouade Alpha"
insert into squads (name) values ('Escouade Alpha');
-- Add gamification columns to profiles
alter table profiles 
add column if not exists discipline_score integer default 100,
add column if not exists last_validation_date date;

-- Create a table for daily validations
create table daily_validations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  validation_date date default current_date not null,
  proof_url text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, validation_date)
);

alter table daily_validations enable row level security;

create policy "Users can view their own validations" on daily_validations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own validations" on daily_validations
  for insert with check (auth.uid() = user_id);

-- Function to handle missed days (CRON job simulation logic)
-- In a real scenario, this would be a scheduled edge function
-- For now, we will handle the logic on the client/server side check
-- Create a storage bucket for proofs
insert into storage.buckets (id, name, public) 
values ('proofs', 'proofs', true);

-- Policy to allow authenticated users to upload proofs
create policy "Users can upload proofs"
on storage.objects for insert
with check (
  bucket_id = 'proofs' AND
  auth.role() = 'authenticated'
);

-- Policy to allow everyone to view proofs (for squad verification later)
create policy "Anyone can view proofs"
on storage.objects for select
using ( bucket_id = 'proofs' );
-- Add current_video_url to profiles
alter table profiles 
add column if not exists current_video_url text;
