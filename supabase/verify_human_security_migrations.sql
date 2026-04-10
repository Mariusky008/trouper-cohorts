-- Post-migration verification checklist:
-- - 20260410162000_add_human_permissions_audit_log.sql
-- - 20260410170000_harden_human_update_policies.sql

-- 1) Table + indexes + RLS
select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'human_permissions_audit_log';

select
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'human_permissions_audit_log'
order by indexname;

-- 2) Policies on audit log
select
  policyname,
  permissive,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'human_permissions_audit_log'
order by policyname;

-- 3) Audit triggers present
select
  tgname as trigger_name,
  tgrelid::regclass as table_name
from pg_trigger
where tgname in (
  'trg_human_permissions_audit',
  'trg_human_allowed_members_audit',
  'trg_human_buddy_links_audit'
)
  and not tgisinternal
order by tgname;

-- 4) Hardened update policies present
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and (
    (tablename = 'human_leads' and policyname = 'human leads update admin only')
    or (tablename = 'human_signals' and policyname = 'human signals update admin only')
    or (tablename = 'human_cash_events' and policyname = 'human cash update admin only')
  )
order by tablename, policyname;

-- 5) Quick smoke test (to run as admin-authenticated context):
-- - Execute one admin action in /admin/humain/permissions
-- - Then confirm latest event appears:
select
  created_at,
  action,
  member_id,
  actor_user_id,
  previous_mode,
  next_mode,
  note
from public.human_permissions_audit_log
order by created_at desc
limit 20;
