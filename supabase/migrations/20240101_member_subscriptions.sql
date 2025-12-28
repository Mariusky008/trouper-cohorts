-- Create a table to track user subscriptions to other members
create table public.member_subscriptions (
  id uuid default gen_random_uuid() primary key,
  subscriber_id uuid references auth.users(id) not null,
  target_user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(subscriber_id, target_user_id)
);

-- RLS Policies
alter table public.member_subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.member_subscriptions for select
  using (auth.uid() = subscriber_id);

create policy "Users can subscribe to others"
  on public.member_subscriptions for insert
  with check (auth.uid() = subscriber_id);

-- Add column to track if a user is fully onboarded (subscribed to everyone)
alter table public.profiles 
add column if not exists is_fully_onboarded boolean default false;
