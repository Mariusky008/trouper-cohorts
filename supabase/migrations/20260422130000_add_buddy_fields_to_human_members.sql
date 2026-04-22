alter table public.human_members
  add column if not exists buddy_name text,
  add column if not exists buddy_metier text;

