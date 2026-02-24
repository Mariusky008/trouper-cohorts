-- Add streak tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Update increment_points function to handle streaks
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak INTEGER;
  last_activity DATE;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get current streak info
  SELECT streak_days, last_activity_date INTO current_streak, last_activity
  FROM public.profiles
  WHERE id = user_id;

  -- Handle Streak Logic
  IF last_activity = today - INTERVAL '1 day' THEN
    -- Consecutive day: Increment streak
    current_streak := current_streak + 1;
  ELSIF last_activity < today - INTERVAL '1 day' OR last_activity IS NULL THEN
    -- Missed a day or first time: Reset streak to 1
    current_streak := 1;
  ELSE
    -- Already active today: Keep streak as is
    -- (current_streak stays same)
  END IF;

  -- Update profile with new points and streak info
  UPDATE public.profiles
  SET 
    points = points + amount,
    streak_days = current_streak,
    last_activity_date = today
  WHERE id = user_id;
END;
$$;