BEGIN;

CREATE TABLE IF NOT EXISTS public.human_permissions_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_mode text,
  next_mode text,
  note text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_permissions_audit_log_action_check CHECK (
    action IN (
      'permission_created',
      'permission_updated',
      'permission_deleted',
      'allowed_member_granted',
      'allowed_member_revoked',
      'buddy_assigned',
      'buddy_removed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_human_permissions_audit_log_member_id
  ON public.human_permissions_audit_log(member_id);
CREATE INDEX IF NOT EXISTS idx_human_permissions_audit_log_created_at
  ON public.human_permissions_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_human_permissions_audit_log_action
  ON public.human_permissions_audit_log(action);

ALTER TABLE public.human_permissions_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human permissions audit read admin only" ON public.human_permissions_audit_log;
CREATE POLICY "human permissions audit read admin only"
  ON public.human_permissions_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human permissions audit insert admin only" ON public.human_permissions_audit_log;
CREATE POLICY "human permissions audit insert admin only"
  ON public.human_permissions_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human permissions audit delete admin only" ON public.human_permissions_audit_log;
CREATE POLICY "human permissions audit delete admin only"
  ON public.human_permissions_audit_log
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

CREATE OR REPLACE FUNCTION public.log_human_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.human_permissions_audit_log (
      member_id, actor_user_id, action, next_mode, note, meta
    )
    VALUES (
      NEW.member_id,
      auth.uid(),
      'permission_created',
      NEW.access_mode,
      NEW.note,
      jsonb_build_object('table', TG_TABLE_NAME)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.human_permissions_audit_log (
      member_id, actor_user_id, action, previous_mode, next_mode, note, meta
    )
    VALUES (
      NEW.member_id,
      auth.uid(),
      'permission_updated',
      OLD.access_mode,
      NEW.access_mode,
      NEW.note,
      jsonb_build_object('table', TG_TABLE_NAME)
    );
    RETURN NEW;
  END IF;

  INSERT INTO public.human_permissions_audit_log (
    member_id, actor_user_id, action, previous_mode, note, meta
  )
  VALUES (
    OLD.member_id,
    auth.uid(),
    'permission_deleted',
    OLD.access_mode,
    OLD.note,
    jsonb_build_object('table', TG_TABLE_NAME)
  );
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_human_allowed_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.human_permissions_audit_log (
      member_id, actor_user_id, action, meta
    )
    VALUES (
      NEW.member_id,
      auth.uid(),
      'allowed_member_granted',
      jsonb_build_object(
        'allowed_member_id', NEW.allowed_member_id,
        'table', TG_TABLE_NAME
      )
    );
    RETURN NEW;
  END IF;

  INSERT INTO public.human_permissions_audit_log (
    member_id, actor_user_id, action, meta
  )
  VALUES (
    OLD.member_id,
    auth.uid(),
    'allowed_member_revoked',
    jsonb_build_object(
      'allowed_member_id', OLD.allowed_member_id,
      'table', TG_TABLE_NAME
    )
  );
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_human_buddy_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.human_permissions_audit_log (
      member_id, actor_user_id, action, meta
    )
    VALUES (
      NEW.member_a_id,
      auth.uid(),
      'buddy_assigned',
      jsonb_build_object(
        'member_a_id', NEW.member_a_id,
        'member_b_id', NEW.member_b_id,
        'table', TG_TABLE_NAME
      )
    );
    RETURN NEW;
  END IF;

  INSERT INTO public.human_permissions_audit_log (
    member_id, actor_user_id, action, meta
  )
  VALUES (
    OLD.member_a_id,
    auth.uid(),
    'buddy_removed',
    jsonb_build_object(
      'member_a_id', OLD.member_a_id,
      'member_b_id', OLD.member_b_id,
      'table', TG_TABLE_NAME
    )
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_human_permissions_audit ON public.human_permissions;
CREATE TRIGGER trg_human_permissions_audit
AFTER INSERT OR UPDATE OR DELETE ON public.human_permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_human_permission_change();

DROP TRIGGER IF EXISTS trg_human_allowed_members_audit ON public.human_allowed_members;
CREATE TRIGGER trg_human_allowed_members_audit
AFTER INSERT OR DELETE ON public.human_allowed_members
FOR EACH ROW
EXECUTE FUNCTION public.log_human_allowed_member_change();

DROP TRIGGER IF EXISTS trg_human_buddy_links_audit ON public.human_buddy_links;
CREATE TRIGGER trg_human_buddy_links_audit
AFTER INSERT OR DELETE ON public.human_buddy_links
FOR EACH ROW
EXECUTE FUNCTION public.log_human_buddy_change();

COMMIT;
