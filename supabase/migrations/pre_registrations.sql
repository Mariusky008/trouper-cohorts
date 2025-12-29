create table pre_registrations (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  channel_url text not null,
  email text not null,
  phone text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'registered')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table pre_registrations enable row level security;

-- Allow public insert (for the reservation form)
create policy "Allow public insert"
  on pre_registrations for insert
  with check (true);

-- Allow admins (authenticated users) to view all
create policy "Allow authenticated view"
  on pre_registrations for select
  using (auth.role() = 'authenticated');

-- Allow admins to update status
create policy "Allow authenticated update"
  on pre_registrations for update
  using (auth.role() = 'authenticated');
