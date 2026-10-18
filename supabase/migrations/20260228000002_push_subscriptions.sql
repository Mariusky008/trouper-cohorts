-- Create table for push subscriptions
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, user_agent) -- Prevent duplicate subs for same device
);

-- RLS Policies
alter table push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Optional: Index for faster lookups
create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
