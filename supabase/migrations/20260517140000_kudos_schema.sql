-- ============================================================
-- KUDOS — Schéma complet
-- ============================================================

-- 1. UTILISATEURS KUDOS
create table if not exists kudos_users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(20) unique not null,
  name varchar(100),
  username varchar(50) unique,
  bio text,
  avatar_url text,
  city varchar(100),
  archetype varchar(100),
  verified boolean default false,
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- 2. CATALOGUE DES BADGES
create table if not exists kudos_badges_catalog (
  id uuid primary key default gen_random_uuid(),
  emoji varchar(10) not null,
  name varchar(50) not null,
  category varchar(20) check (category in ('vie','pro','humain','voisin')) default 'humain',
  is_official boolean default true,
  created_at timestamptz default now()
);

-- 3. KUDOS ENVOYÉS
create table if not exists kudos_kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references kudos_users(id) on delete cascade,
  receiver_id uuid references kudos_users(id) on delete cascade,
  badge_id uuid references kudos_badges_catalog(id),
  custom_badge_name varchar(50),
  custom_badge_emoji varchar(10),
  message text,
  relation varchar(20) check (relation in ('coloc','collegue','ami','voisin','autre')) default 'autre',
  duration varchar(10) check (duration in ('1m','6m','2a','2a+')) default '6m',
  is_public boolean default true,
  created_at timestamptz default now()
);

-- 4. CONTACTS (réseau validé)
create table if not exists kudos_contacts (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references kudos_users(id) on delete cascade,
  user_b uuid references kudos_users(id) on delete cascade,
  status varchar(20) check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now(),
  unique(user_a, user_b)
);

-- 5. MESSAGES
create table if not exists kudos_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references kudos_contacts(id) on delete cascade,
  sender_id uuid references kudos_users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- 6. NOTIFICATIONS
create table if not exists kudos_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references kudos_users(id) on delete cascade,
  type varchar(50) check (type in ('kudos_received','profile_viewed','contact_request','badge_unlocked','match')),
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

-- 7. VUES DE PROFIL
create table if not exists kudos_profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references kudos_users(id) on delete cascade,
  viewer_id uuid references kudos_users(id),
  viewer_fingerprint text,
  source varchar(20) check (source in ('direct','link','search','qr')) default 'direct',
  duration_sec integer default 0,
  created_at timestamptz default now()
);

-- 8. BADGES UTILISATEUR (agrégat calculé)
create table if not exists kudos_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references kudos_users(id) on delete cascade,
  badge_id uuid references kudos_badges_catalog(id),
  custom_name varchar(50),
  custom_emoji varchar(10),
  count integer default 1,
  first_kudos_at timestamptz default now(),
  last_kudos_at timestamptz default now(),
  is_public boolean default true,
  unique(user_id, badge_id)
);

-- ============================================================
-- INDEX PERFORMANCE
-- ============================================================
create index if not exists idx_kudos_receiver on kudos_kudos(receiver_id, created_at desc);
create index if not exists idx_kudos_sender on kudos_kudos(sender_id, created_at desc);
create index if not exists idx_user_badges_user on kudos_user_badges(user_id, count desc);
create index if not exists idx_notifications_user on kudos_notifications(user_id, read, created_at desc);
create index if not exists idx_profile_views_profile on kudos_profile_views(profile_id, created_at desc);
create index if not exists idx_kudos_users_username on kudos_users(username);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table kudos_users enable row level security;
alter table kudos_kudos enable row level security;
alter table kudos_contacts enable row level security;
alter table kudos_messages enable row level security;
alter table kudos_notifications enable row level security;
alter table kudos_profile_views enable row level security;
alter table kudos_user_badges enable row level security;
alter table kudos_badges_catalog enable row level security;

-- Profils publics lisibles par tous
create policy "kudos_users_public_read" on kudos_users
  for select using (true);

-- Badges catalogue lisibles par tous
create policy "kudos_catalog_public_read" on kudos_badges_catalog
  for select using (true);

-- Badges utilisateurs publics lisibles par tous
create policy "kudos_user_badges_public_read" on kudos_user_badges
  for select using (is_public = true);

-- Kudos publics lisibles par tous
create policy "kudos_kudos_public_read" on kudos_kudos
  for select using (is_public = true);

-- Vues profil : service role only (via Edge Function)
create policy "kudos_profile_views_service" on kudos_profile_views
  for all using (false);

-- Notifications : utilisateur connecté lit les siennes
create policy "kudos_notifs_own" on kudos_notifications
  for select using (auth.uid()::text = user_id::text);

-- Messages : membres du contact seulement
create policy "kudos_messages_members" on kudos_messages
  for select using (
    exists (
      select 1 from kudos_contacts c
      where c.id = contact_id
        and (c.user_a::text = auth.uid()::text or c.user_b::text = auth.uid()::text)
    )
  );

-- ============================================================
-- CATALOGUE BADGES — SEED INITIAL
-- ============================================================
insert into kudos_badges_catalog (emoji, name, category) values
  -- VIE QUOTIDIENNE
  ('✨', 'Propre', 'vie'),
  ('🤝', 'Fiable', 'vie'),
  ('😄', 'Bonne humeur', 'vie'),
  ('🔇', 'Discret', 'vie'),
  ('🏡', 'Bon voisin', 'voisin'),
  ('🐾', 'Respectueux animaux', 'voisin'),
  -- HUMAIN
  ('❤️', 'Bienveillant', 'humain'),
  ('👂', 'À l''écoute', 'humain'),
  ('💡', 'De bons conseils', 'humain'),
  ('🫂', 'Soutien moral', 'humain'),
  ('🎉', 'Festif', 'humain'),
  ('🧘', 'Calme', 'humain'),
  -- PRO
  ('⚡', 'Ponctuel', 'pro'),
  ('🎯', 'Organisé', 'pro'),
  ('🤫', 'Discret pro', 'pro'),
  ('📦', 'Livraison soignée', 'pro'),
  ('💬', 'Bonne communication', 'pro'),
  ('🔑', 'De confiance', 'pro')
on conflict do nothing;

-- ============================================================
-- FONCTION : mettre à jour kudos_user_badges après un kudos
-- ============================================================
create or replace function kudos_update_user_badge()
returns trigger as $$
begin
  insert into kudos_user_badges (user_id, badge_id, count, first_kudos_at, last_kudos_at)
  values (NEW.receiver_id, NEW.badge_id, 1, NEW.created_at, NEW.created_at)
  on conflict (user_id, badge_id) do update
    set count = kudos_user_badges.count + 1,
        last_kudos_at = NEW.created_at;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger kudos_after_kudos_insert
  after insert on kudos_kudos
  for each row
  when (NEW.badge_id is not null)
  execute function kudos_update_user_badge();

-- ============================================================
-- FONCTION : créer une notification après un kudos
-- ============================================================
create or replace function kudos_notify_on_kudos()
returns trigger as $$
begin
  insert into kudos_notifications (user_id, type, data)
  values (
    NEW.receiver_id,
    'kudos_received',
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'badge_id', NEW.badge_id,
      'message', NEW.message,
      'kudos_id', NEW.id
    )
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger kudos_notify_trigger
  after insert on kudos_kudos
  for each row
  execute function kudos_notify_on_kudos();
