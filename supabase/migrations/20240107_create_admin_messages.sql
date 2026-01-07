-- Create table for admin messages
create table if not exists admin_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  content text not null,
  status text default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table admin_messages enable row level security;

-- Policies
create policy "Users can insert their own messages"
  on admin_messages for insert
  with check (auth.uid() = user_id);

create policy "Admins can read all messages"
  on admin_messages for select
  using (
    -- Assuming admin check is based on specific email or role
    -- For now, allow users to see their own messages, strict admin check can be added later
    auth.uid() = user_id OR auth.jwt() ->> 'email' = 'mariustalk@yahoo.fr'
  );
