BEGIN;

CREATE OR REPLACE FUNCTION public.is_human_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_human_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.human_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  metier text,
  ville text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_members_status_check CHECK (status IN ('active', 'paused', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.human_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL UNIQUE REFERENCES public.human_members(id) ON DELETE CASCADE,
  access_mode text NOT NULL DEFAULT 'BINOME_ONLY',
  decided_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  note text,
  CONSTRAINT human_permissions_access_mode_check CHECK (
    access_mode IN ('BINOME_ONLY', 'SELECTED_MEMBERS', 'SPHERE_FULL')
  )
);

CREATE TABLE IF NOT EXISTS public.human_allowed_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  allowed_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  granted_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_allowed_members_unique UNIQUE (member_id, allowed_member_id),
  CONSTRAINT human_allowed_members_self_check CHECK (member_id <> allowed_member_id)
);

CREATE TABLE IF NOT EXISTS public.human_buddy_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_a_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  member_b_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  assigned_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_buddy_links_pair_unique UNIQUE (member_a_id, member_b_id),
  CONSTRAINT human_buddy_links_self_check CHECK (member_a_id <> member_b_id)
);

CREATE INDEX IF NOT EXISTS idx_human_permissions_member_id
  ON public.human_permissions(member_id);
CREATE INDEX IF NOT EXISTS idx_human_allowed_members_member_id
  ON public.human_allowed_members(member_id);
CREATE INDEX IF NOT EXISTS idx_human_allowed_members_allowed_member_id
  ON public.human_allowed_members(allowed_member_id);
CREATE INDEX IF NOT EXISTS idx_human_buddy_links_member_a_id
  ON public.human_buddy_links(member_a_id);
CREATE INDEX IF NOT EXISTS idx_human_buddy_links_member_b_id
  ON public.human_buddy_links(member_b_id);

ALTER TABLE public.human_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_allowed_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_buddy_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human members read own or admin" ON public.human_members;
CREATE POLICY "human members read own or admin"
  ON public.human_members
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "human members write admin only" ON public.human_members;
CREATE POLICY "human members write admin only"
  ON public.human_members
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human permissions read own or admin" ON public.human_permissions;
CREATE POLICY "human permissions read own or admin"
  ON public.human_permissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_permissions.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human permissions write admin only" ON public.human_permissions;
CREATE POLICY "human permissions write admin only"
  ON public.human_permissions
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human allowed read own or admin" ON public.human_allowed_members;
CREATE POLICY "human allowed read own or admin"
  ON public.human_allowed_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_allowed_members.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human allowed write admin only" ON public.human_allowed_members;
CREATE POLICY "human allowed write admin only"
  ON public.human_allowed_members
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human buddy read involved or admin" ON public.human_buddy_links;
CREATE POLICY "human buddy read involved or admin"
  ON public.human_buddy_links
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
        AND (hm.id = human_buddy_links.member_a_id OR hm.id = human_buddy_links.member_b_id)
    )
  );

DROP POLICY IF EXISTS "human buddy write admin only" ON public.human_buddy_links;
CREATE POLICY "human buddy write admin only"
  ON public.human_buddy_links
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
