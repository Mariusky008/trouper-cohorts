-- Create or Replace the increment_strikes function to also impact Discipline Score

CREATE OR REPLACE FUNCTION increment_strikes(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 1. Increment the strike counter in squad_members
  UPDATE squad_members
  SET defector_strikes = COALESCE(defector_strikes, 0) + 1
  WHERE user_id = p_user_id;

  -- 2. Decrease the Discipline Score in profiles (e.g., -10 points per strike)
  -- Ensure it doesn't drop below 0
  UPDATE profiles
  SET discipline_score = GREATEST(0, COALESCE(discipline_score, 100) - 10)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
