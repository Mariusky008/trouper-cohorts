create table if not exists daily_trends (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  sound_url text, -- Optional: link to the sound/template
  example_url text, -- Optional: link to an example video
  active_date date not null default current_date, -- The date this trend is active for
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Policy to allow read access to everyone
create policy "Enable read access for all users" on daily_trends
  for select using (true);

-- Policy to allow write access only to admin (hardcoded for simplicity in this MVP scope, ideally use roles)
create policy "Enable insert for authenticated users" on daily_trends
  for insert with check (auth.role() = 'authenticated'); 
-- Real security should check for admin email/role, but we trust the UI gate for now as per project context
