create table if not exists public.network_flash_questions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    city text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.network_flash_answers (
    id uuid default gen_random_uuid() primary key,
    question_id uuid references public.network_flash_questions(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.network_flash_questions enable row level security;
alter table public.network_flash_answers enable row level security;

-- Drop existing policies if any to allow re-running
drop policy if exists "Anyone can view flash questions" on public.network_flash_questions;
drop policy if exists "Users can insert their own flash questions" on public.network_flash_questions;
drop policy if exists "Anyone can view flash answers" on public.network_flash_answers;
drop policy if exists "Users can insert their own flash answers" on public.network_flash_answers;

-- Policies for questions
create policy "Anyone can view flash questions"
  on public.network_flash_questions for select
  using (true);

create policy "Users can insert their own flash questions"
  on public.network_flash_questions for insert
  with check (auth.uid() = user_id);

-- Policies for answers
create policy "Anyone can view flash answers"
  on public.network_flash_answers for select
  using (true);

create policy "Users can insert their own flash answers"
  on public.network_flash_answers for insert
  with check (auth.uid() = user_id);
