-- Create user_mission_steps table for individual progress tracking
create table if not exists user_mission_steps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  step_id uuid references mission_steps(id) on delete cascade not null,
  status text default 'validated' check (status in ('validated', 'pending')),
  proof_content text, -- URL or text response
  validated_at timestamptz default now(),
  created_at timestamptz default now(),
  
  unique(user_id, step_id)
);

-- Add RLS policies
alter table user_mission_steps enable row level security;

create policy "Users can view their own step progress"
  on user_mission_steps for select
  using (auth.uid() = user_id);

create policy "Users can insert their own step progress"
  on user_mission_steps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own step progress"
  on user_mission_steps for update
  using (auth.uid() = user_id);

-- Optional: Allow admins to view all progress (if you have an admin role system)
-- create policy "Admins can view all progress" ...
