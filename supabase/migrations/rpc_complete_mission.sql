CREATE OR REPLACE FUNCTION complete_mission(
  target_user_id UUID,
  mission_type TEXT DEFAULT 'like'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points INTEGER;
  is_ready BOOLEAN;
BEGIN
  -- 1. Insert Support (Log the action)
  INSERT INTO daily_supports (supporter_id, target_user_id, support_type)
  VALUES (auth.uid(), target_user_id, mission_type);

  -- 2. Update Points for Supporter (Only if not already ready, to cap it? Or keep going?)
  -- Let's keep going to show over-achievement, but trigger ready at 60.
  UPDATE profiles
  SET wave_points = COALESCE(wave_points, 0) + 1
  WHERE id = auth.uid()
  RETURNING wave_points, wave_ready INTO current_points, is_ready;

  -- 3. Check Threshold (60)
  -- If we just crossed 60, mark as ready
  IF current_points >= 60 AND (is_ready IS NULL OR is_ready = FALSE) THEN
    UPDATE profiles
    SET wave_ready = TRUE
    WHERE id = auth.uid();
    is_ready := TRUE;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'new_points', current_points,
    'wave_ready', is_ready
  );
END;
$$;