-- Create table for tracking analytics events (button clicks, etc.)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    page TEXT
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all events
-- Assuming there is an is_admin() function or similar check, 
-- otherwise we can use a service role client in the admin page.
-- For now, let's allow read for all authenticated users but we will filter in the UI/API if needed, 
-- OR strictly restrict to admin if we have a robust admin check.
-- Given previous files used `public.is_admin()`, let's try that.

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (public.is_admin());

-- Allow users to view their own events (optional, maybe not needed)
CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);
