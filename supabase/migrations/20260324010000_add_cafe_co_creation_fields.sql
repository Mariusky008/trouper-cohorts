alter table public.network_flash_questions
add column if not exists post_type text not null default 'question',
add column if not exists idea_title text,
add column if not exists target_client text,
add column if not exists looking_for text,
add column if not exists expected_outcome text,
add column if not exists status text not null default 'open';

alter table public.network_flash_questions
drop constraint if exists network_flash_questions_post_type_check;

alter table public.network_flash_questions
add constraint network_flash_questions_post_type_check
check (post_type in ('question', 'co_creation'));

alter table public.network_flash_questions
drop constraint if exists network_flash_questions_status_check;

alter table public.network_flash_questions
add constraint network_flash_questions_status_check
check (status in ('open', 'duo_formed', 'test_running', 'validated'));

create index if not exists idx_network_flash_questions_city_post_type_created
on public.network_flash_questions (city, post_type, created_at desc);

notify pgrst, 'reload schema';
