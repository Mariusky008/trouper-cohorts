-- Function to get the count of opportunities received by a user in the current month
-- This function uses SECURITY DEFINER to bypass RLS policies, allowing public read access to the count
-- while keeping the details of the opportunities private.

CREATE OR REPLACE FUNCTION public.get_monthly_collabs_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges (bypassing RLS)
SET search_path = public -- Secure search path
AS $$
DECLARE
  start_of_month TIMESTAMP WITH TIME ZONE;
  count_result INTEGER;
BEGIN
  -- Calculate start of current month
  start_of_month := date_trunc('month', now());
  
  SELECT COUNT(*)
  INTO count_result
  FROM public.network_opportunities
  WHERE receiver_id = target_user_id
  AND created_at >= start_of_month;
  
  RETURN count_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_monthly_collabs_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_collabs_count(UUID) TO service_role;
