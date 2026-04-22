alter table public.human_members
  add column if not exists trio_name text,
  add column if not exists trio_metier text,
  add column if not exists eclaireur_reward_mode text,
  add column if not exists eclaireur_reward_percent numeric(6,2),
  add column if not exists eclaireur_reward_fixed_eur numeric(10,2);

