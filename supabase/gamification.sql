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
