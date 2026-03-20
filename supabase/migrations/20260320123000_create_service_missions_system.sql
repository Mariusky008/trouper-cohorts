CREATE TABLE IF NOT EXISTS public.service_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_match_id UUID REFERENCES public.network_matches(id) ON DELETE SET NULL,
    mission_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_gain TEXT,
    priority_score NUMERIC(5,2) DEFAULT 0 NOT NULL,
    action_channel TEXT DEFAULT 'manual' NOT NULL,
    external_link TEXT,
    suggested_message TEXT,
    status TEXT DEFAULT 'new' NOT NULL,
    snoozed_until TIMESTAMPTZ,
    rejection_count INTEGER DEFAULT 0 NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    CONSTRAINT service_missions_not_self CHECK (helper_id <> beneficiary_id),
    CONSTRAINT service_missions_status_check CHECK (status IN ('new', 'interested', 'in_progress', 'done_pending_confirmation', 'confirmed', 'rejected', 'snoozed', 'archived')),
    CONSTRAINT service_missions_channel_check CHECK (action_channel IN ('whatsapp', 'social_link', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_service_missions_helper_status ON public.service_missions(helper_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_missions_beneficiary_status ON public.service_missions(beneficiary_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_missions_snoozed_until ON public.service_missions(snoozed_until);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_service_mission
  ON public.service_missions(helper_id, beneficiary_id, mission_type)
  WHERE status IN ('new', 'interested', 'in_progress', 'done_pending_confirmation', 'snoozed');

CREATE TABLE IF NOT EXISTS public.service_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id UUID NOT NULL REFERENCES public.service_missions(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    direction TEXT NOT NULL,
    status TEXT DEFAULT 'pending_confirmation' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT service_ledger_direction_check CHECK (direction IN ('rendered', 'received')),
    CONSTRAINT service_ledger_status_check CHECK (status IN ('pending_confirmation', 'confirmed', 'disputed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_service_ledger_direction ON public.service_ledger(mission_id, direction);
CREATE INDEX IF NOT EXISTS idx_service_ledger_from_status ON public.service_ledger(from_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_ledger_to_status ON public.service_ledger(to_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_service_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    services_rendered INTEGER DEFAULT 0 NOT NULL,
    services_received INTEGER DEFAULT 0 NOT NULL,
    service_balance INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.service_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_service_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view related service missions" ON public.service_missions;
CREATE POLICY "Users can view related service missions" ON public.service_missions
    FOR SELECT USING (auth.uid() = helper_id OR auth.uid() = beneficiary_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Helpers can create service missions" ON public.service_missions;
CREATE POLICY "Helpers can create service missions" ON public.service_missions
    FOR INSERT WITH CHECK (auth.uid() = helper_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Related users can update service missions" ON public.service_missions;
CREATE POLICY "Related users can update service missions" ON public.service_missions
    FOR UPDATE USING (auth.uid() = helper_id OR auth.uid() = beneficiary_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Helpers can delete own service missions" ON public.service_missions;
CREATE POLICY "Helpers can delete own service missions" ON public.service_missions
    FOR DELETE USING (auth.uid() = helper_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view related service ledger" ON public.service_ledger;
CREATE POLICY "Users can view related service ledger" ON public.service_ledger
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Related users can write service ledger" ON public.service_ledger;
CREATE POLICY "Related users can write service ledger" ON public.service_ledger
    FOR INSERT WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Related users can update service ledger" ON public.service_ledger;
CREATE POLICY "Related users can update service ledger" ON public.service_ledger
    FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own service stats" ON public.user_service_stats;
CREATE POLICY "Users can view own service stats" ON public.user_service_stats
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage service stats" ON public.user_service_stats;
CREATE POLICY "Admins can manage service stats" ON public.user_service_stats
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.refresh_user_service_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rendered INTEGER := 0;
  v_received INTEGER := 0;
BEGIN
  SELECT COUNT(*)
  INTO v_rendered
  FROM public.service_missions
  WHERE helper_id = p_user_id
    AND status = 'confirmed';

  SELECT COUNT(*)
  INTO v_received
  FROM public.service_missions
  WHERE beneficiary_id = p_user_id
    AND status = 'confirmed';

  INSERT INTO public.user_service_stats (user_id, services_rendered, services_received, service_balance, updated_at)
  VALUES (p_user_id, v_rendered, v_received, v_rendered - v_received, timezone('utc'::text, now()))
  ON CONFLICT (user_id)
  DO UPDATE SET
    services_rendered = EXCLUDED.services_rendered,
    services_received = EXCLUDED.services_received,
    service_balance = EXCLUDED.service_balance,
    updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_service_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND COALESCE(OLD.status, '') <> 'confirmed' THEN
    INSERT INTO public.service_ledger (mission_id, from_user_id, to_user_id, direction, status, created_at, updated_at)
    VALUES (NEW.id, NEW.helper_id, NEW.beneficiary_id, 'rendered', 'confirmed', timezone('utc'::text, now()), timezone('utc'::text, now()))
    ON CONFLICT (mission_id, direction)
    DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

    INSERT INTO public.service_ledger (mission_id, from_user_id, to_user_id, direction, status, created_at, updated_at)
    VALUES (NEW.id, NEW.beneficiary_id, NEW.helper_id, 'received', 'confirmed', timezone('utc'::text, now()), timezone('utc'::text, now()))
    ON CONFLICT (mission_id, direction)
    DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_user_service_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_user_service_stats(NEW.helper_id);
    PERFORM public.refresh_user_service_stats(NEW.beneficiary_id);
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_user_service_stats(OLD.helper_id);
    PERFORM public.refresh_user_service_stats(OLD.beneficiary_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_service_ledger_on_confirm ON public.service_missions;
CREATE TRIGGER trg_sync_service_ledger_on_confirm
AFTER INSERT OR UPDATE ON public.service_missions
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_service_ledger();

DROP TRIGGER IF EXISTS trg_refresh_user_service_stats_on_missions ON public.service_missions;
CREATE TRIGGER trg_refresh_user_service_stats_on_missions
AFTER INSERT OR UPDATE OR DELETE ON public.service_missions
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_user_service_stats();

NOTIFY pgrst, 'reload schema';
