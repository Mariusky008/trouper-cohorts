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
