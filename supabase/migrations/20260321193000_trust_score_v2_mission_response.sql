ALTER TABLE public.trust_scores
ADD COLUMN IF NOT EXISTS mission_quality_score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS response_speed_score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS response_hours_avg NUMERIC(6,1),
ADD COLUMN IF NOT EXISTS trust_version TEXT NOT NULL DEFAULT 'v2';

CREATE OR REPLACE FUNCTION public.recalculate_trust_score_v2(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_score NUMERIC := 5.0;
  v_review_count INTEGER := 0;
  v_response_count INTEGER := 0;
  v_mission_avg NUMERIC := 5.0;
  v_response_hours NUMERIC := NULL;
  v_response_base NUMERIC := 5.0;
  v_conf_reviews NUMERIC := 0.0;
  v_conf_response NUMERIC := 0.0;
  v_mission_component NUMERIC := 5.0;
  v_response_component NUMERIC := 5.0;
  v_final_score NUMERIC := 5.0;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.trust_scores (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT score
  INTO v_existing_score
  FROM public.trust_scores
  WHERE user_id = target_user_id;

  SELECT
    COUNT(*)::INTEGER,
    AVG(
      CASE
        WHEN r.mission_result = 'super_completed' THEN 5.0
        WHEN r.mission_result = 'completed' THEN 4.2
        WHEN r.mission_result = 'not_completed' THEN 2.2
        WHEN r.mission_result = 'missed_call' THEN 1.0
        ELSE 3.5
      END
    )::NUMERIC
  INTO v_review_count, v_mission_avg
  FROM public.network_match_reviews r
  WHERE r.reviewed_id = target_user_id;

  IF v_review_count = 0 OR v_mission_avg IS NULL THEN
    v_mission_avg := COALESCE(v_existing_score, 5.0);
  END IF;

  v_conf_reviews := LEAST(1.0, v_review_count::NUMERIC / 8.0);
  v_mission_component := (5.0 * (1.0 - v_conf_reviews)) + (v_mission_avg * v_conf_reviews);

  SELECT
    COUNT(*)::INTEGER,
    AVG(GREATEST(0, EXTRACT(EPOCH FROM (r.created_at - m.created_at)) / 3600.0))::NUMERIC
  INTO v_response_count, v_response_hours
  FROM public.network_match_reviews r
  JOIN public.network_matches m ON m.id = r.match_id
  WHERE r.reviewer_id = target_user_id;

  IF v_response_count = 0 OR v_response_hours IS NULL THEN
    v_response_base := COALESCE(v_existing_score, 5.0);
  ELSE
    v_response_base := CASE
      WHEN v_response_hours <= 24 THEN 5.0
      WHEN v_response_hours <= 48 THEN 4.4
      WHEN v_response_hours <= 72 THEN 3.8
      ELSE 3.0
    END;
  END IF;

  v_conf_response := LEAST(1.0, v_response_count::NUMERIC / 8.0);
  v_response_component := (5.0 * (1.0 - v_conf_response)) + (v_response_base * v_conf_response);

  v_final_score := ROUND((0.75 * v_mission_component + 0.25 * v_response_component)::NUMERIC, 1);
  v_final_score := GREATEST(1.0, LEAST(5.0, v_final_score));

  UPDATE public.trust_scores
  SET
    score = v_final_score,
    mission_quality_score = ROUND(v_mission_component::NUMERIC, 1),
    response_speed_score = ROUND(v_response_component::NUMERIC, 1),
    response_hours_avg = CASE WHEN v_response_hours IS NULL THEN NULL ELSE ROUND(v_response_hours::NUMERIC, 1) END,
    trust_version = 'v2',
    last_updated = timezone('utc'::text, now())
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_all_trust_scores_v2()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id AS user_id FROM public.profiles
  LOOP
    PERFORM public.recalculate_trust_score_v2(rec.user_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_trust_recalculation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recalculate_trust_score_v2(NEW.reviewed_id);
    PERFORM public.recalculate_trust_score_v2(NEW.reviewer_id);
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.recalculate_trust_score_v2(OLD.reviewed_id);
    PERFORM public.recalculate_trust_score_v2(OLD.reviewer_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_trust_on_review_change ON public.network_match_reviews;
CREATE TRIGGER trg_recalculate_trust_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.network_match_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_trust_recalculation();

CREATE OR REPLACE FUNCTION public.handle_opportunity_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'validated' AND (OLD.status IS DISTINCT FROM 'validated') THEN
    PERFORM public.ensure_trust_score(NEW.giver_id);
    PERFORM public.ensure_trust_score(NEW.receiver_id);

    UPDATE public.trust_scores
    SET opportunities_given = opportunities_given + 1,
        last_updated = timezone('utc'::text, now())
    WHERE user_id = NEW.giver_id;

    UPDATE public.trust_scores
    SET opportunities_received = opportunities_received + 1,
        last_updated = timezone('utc'::text, now())
    WHERE user_id = NEW.receiver_id;

    PERFORM public.recalculate_trust_score_v2(NEW.giver_id);
    PERFORM public.recalculate_trust_score_v2(NEW.receiver_id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT reviewed_id AS user_id FROM public.network_match_reviews
    UNION
    SELECT DISTINCT reviewer_id AS user_id FROM public.network_match_reviews
  LOOP
    PERFORM public.recalculate_trust_score_v2(rec.user_id);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
