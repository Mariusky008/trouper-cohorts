CREATE OR REPLACE FUNCTION complete_mission(
  target_user_id UUID,
  mission_type TEXT DEFAULT 'like'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_wave_points INTEGER;
  current_career_points INTEGER;
  old_rank INTEGER;
  new_rank INTEGER;
  is_ready BOOLEAN;
  rank_promoted BOOLEAN := FALSE;
BEGIN
  -- 1. Insert Support (Log the action)
  INSERT INTO daily_supports (supporter_id, target_user_id, support_type)
  VALUES (auth.uid(), target_user_id, mission_type);

  -- 2. Get current rank first (to detect promotion)
  SELECT rank_level INTO old_rank FROM profiles WHERE id = auth.uid();

  -- 3. Update Points (Wave + Career) & Recalculate Rank
  UPDATE profiles
  SET 
    wave_points = COALESCE(wave_points, 0) + 1,
    career_points = COALESCE(career_points, 0) + 1,
    -- Recalculate Rank: 1 + (career_points / 60) capped at 11
    rank_level = LEAST(11, 1 + ((COALESCE(career_points, 0) + 1) / 60))
  WHERE id = auth.uid()
  RETURNING wave_points, wave_ready, career_points, rank_level 
  INTO current_wave_points, is_ready, current_career_points, new_rank;

  -- 4. Check Wave Threshold (60)
  -- If we just crossed 60, mark as ready
  IF current_wave_points >= 60 AND (is_ready IS NULL OR is_ready = FALSE) THEN
    UPDATE profiles
    SET wave_ready = TRUE
    WHERE id = auth.uid();
    is_ready := TRUE;
  END IF;

  -- 5. Check Promotion
  IF new_rank > COALESCE(old_rank, 1) THEN
    rank_promoted := TRUE;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'new_points', current_wave_points,
    'wave_ready', is_ready,
    'career_points', current_career_points,
    'rank_level', new_rank,
    'promoted', rank_promoted
  );
END;
$$;