CREATE TABLE IF NOT EXISTS public.network_match_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.network_matches(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    call_happened BOOLEAN NOT NULL,
    mission_result TEXT NOT NULL,
    opportunity_type TEXT,
    opportunity_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT network_match_reviews_unique_pair UNIQUE (match_id, reviewer_id, reviewed_id),
    CONSTRAINT network_match_reviews_users_diff CHECK (reviewer_id <> reviewed_id),
    CONSTRAINT network_match_reviews_mission_result_check CHECK (mission_result IN ('completed', 'super_completed', 'not_completed', 'missed_call'))
);

CREATE INDEX IF NOT EXISTS idx_network_match_reviews_match_id ON public.network_match_reviews(match_id);
CREATE INDEX IF NOT EXISTS idx_network_match_reviews_reviewer_id ON public.network_match_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_network_match_reviews_reviewed_id ON public.network_match_reviews(reviewed_id);

CREATE TABLE IF NOT EXISTS public.network_match_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.network_matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    final_status TEXT NOT NULL,
    validation_source TEXT NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT network_match_outcomes_unique_user UNIQUE (match_id, user_id),
    CONSTRAINT network_match_outcomes_status_check CHECK (final_status IN ('mission_completed', 'mission_super_completed', 'mission_refused', 'call_absent')),
    CONSTRAINT network_match_outcomes_source_check CHECK (validation_source IN ('self', 'peer_auto', 'peer_confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_network_match_outcomes_user_id ON public.network_match_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_network_match_outcomes_match_id ON public.network_match_outcomes(match_id);

CREATE TABLE IF NOT EXISTS public.user_mission_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_calls INTEGER NOT NULL DEFAULT 0,
    missions_realisees INTEGER NOT NULL DEFAULT 0,
    missions_super_realisees INTEGER NOT NULL DEFAULT 0,
    missions_refusees INTEGER NOT NULL DEFAULT 0,
    appels_absence INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.network_match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_match_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own given or received mission reviews" ON public.network_match_reviews;
CREATE POLICY "Users can read own given or received mission reviews"
ON public.network_match_reviews
FOR SELECT
USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own mission reviews" ON public.network_match_reviews;
CREATE POLICY "Users can insert own mission reviews"
ON public.network_match_reviews
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own mission reviews" ON public.network_match_reviews;
CREATE POLICY "Users can update own mission reviews"
ON public.network_match_reviews
FOR UPDATE
USING (auth.uid() = reviewer_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can read own mission outcomes" ON public.network_match_outcomes;
CREATE POLICY "Users can read own mission outcomes"
ON public.network_match_outcomes
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage mission outcomes" ON public.network_match_outcomes;
CREATE POLICY "Admins manage mission outcomes"
ON public.network_match_outcomes
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Mission stats are readable" ON public.user_mission_stats;
CREATE POLICY "Mission stats are readable"
ON public.user_mission_stats
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage mission stats" ON public.user_mission_stats;
CREATE POLICY "Admins manage mission stats"
ON public.user_mission_stats
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.refresh_user_mission_stats(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_calls INTEGER;
  v_missions_realisees INTEGER;
  v_missions_super_realisees INTEGER;
  v_missions_refusees INTEGER;
  v_appels_absence INTEGER;
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE final_status IN ('mission_completed', 'mission_super_completed'))::INTEGER,
    COUNT(*) FILTER (WHERE final_status = 'mission_super_completed')::INTEGER,
    COUNT(*) FILTER (WHERE final_status = 'mission_refused')::INTEGER,
    COUNT(*) FILTER (WHERE final_status = 'call_absent')::INTEGER
  INTO
    v_total_calls,
    v_missions_realisees,
    v_missions_super_realisees,
    v_missions_refusees,
    v_appels_absence
  FROM public.network_match_outcomes
  WHERE user_id = target_user_id;

  INSERT INTO public.user_mission_stats (
    user_id,
    total_calls,
    missions_realisees,
    missions_super_realisees,
    missions_refusees,
    appels_absence,
    updated_at
  )
  VALUES (
    target_user_id,
    COALESCE(v_total_calls, 0),
    COALESCE(v_missions_realisees, 0),
    COALESCE(v_missions_super_realisees, 0),
    COALESCE(v_missions_refusees, 0),
    COALESCE(v_appels_absence, 0),
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id) DO UPDATE
    SET total_calls = EXCLUDED.total_calls,
        missions_realisees = EXCLUDED.missions_realisees,
        missions_super_realisees = EXCLUDED.missions_super_realisees,
        missions_refusees = EXCLUDED.missions_refusees,
        appels_absence = EXCLUDED.appels_absence,
        updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_network_match_outcomes_stats_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_user_mission_stats(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_user_mission_stats(NEW.user_id);

  IF TG_OP = 'UPDATE' AND OLD.user_id <> NEW.user_id THEN
    PERFORM public.refresh_user_mission_stats(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_user_mission_stats_on_outcomes ON public.network_match_outcomes;
CREATE TRIGGER trg_refresh_user_mission_stats_on_outcomes
AFTER INSERT OR UPDATE OR DELETE ON public.network_match_outcomes
FOR EACH ROW
EXECUTE PROCEDURE public.handle_network_match_outcomes_stats_refresh();

NOTIFY pgrst, 'reload schema';
