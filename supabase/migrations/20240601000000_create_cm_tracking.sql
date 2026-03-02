-- Create a table for CM tracking
create table if not exists public.cm_tracking (
    id uuid not null default gen_random_uuid(),
    sphere_id text not null,
    trade_name text not null,
    linkedin_contacted boolean default false,
    instagram_contacted boolean default false,
    first_name text default '',
    last_name text default '',
    profile_link text default '',
    status text default 'todo', -- 'todo', 'pending', 'followup', 'validated'
    updated_at timestamptz default now(),
    
    constraint cm_tracking_pkey primary key (id),
    constraint cm_tracking_unique_trade unique (sphere_id, trade_name)
);

-- Enable RLS (Row Level Security)
alter table public.cm_tracking enable row level security;

-- Create policies (Allow read/write for everyone for now, or restrict to admins/CM if auth is set up)
-- For simplicity in this CM dashboard context without strict auth on this specific page:
create policy "Allow all access to cm_tracking"
on public.cm_tracking
for all
using (true)
with check (true);
