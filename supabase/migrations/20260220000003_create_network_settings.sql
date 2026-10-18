-- Create table for network settings
CREATE TABLE public.network_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications BOOLEAN DEFAULT true NOT NULL,
    visibility TEXT DEFAULT 'public' NOT NULL, -- 'public', 'network_only', 'private'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'network_only', 'private'))
);

-- Enable RLS
ALTER TABLE public.network_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own settings" ON public.network_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.network_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.network_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
