-- Create table for storing opportunities (exchanges of value)
CREATE TABLE public.network_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    giver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'clients', 'live', 'intro', 'network', 'recommendation', 'service', 'synergy', 'social'
    points INTEGER NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'validated', 'rejected'
    validated_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'validated', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.network_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view opportunities they are involved in" ON public.network_opportunities
    FOR SELECT USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create opportunities as giver" ON public.network_opportunities
    FOR INSERT WITH CHECK (auth.uid() = giver_id);

CREATE POLICY "Receiver can update status (validate/reject)" ON public.network_opportunities
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Create table for daily matches
CREATE TABLE public.network_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'met', 'missed'
    
    CONSTRAINT unique_daily_match UNIQUE (date, user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.network_matches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their matches" ON public.network_matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their match status" ON public.network_matches
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create table for trust scores
CREATE TABLE public.trust_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    score NUMERIC(3, 1) DEFAULT 5.0 NOT NULL,
    opportunities_given INTEGER DEFAULT 0 NOT NULL,
    opportunities_received INTEGER DEFAULT 0 NOT NULL,
    debt_level INTEGER DEFAULT 0 NOT NULL, -- Number of unreturned opportunities > 30 days
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Trust scores are public (read-only)" ON public.trust_scores
    FOR SELECT USING (true);

-- Create table for availability
CREATE TABLE public.network_availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slots TEXT[] NOT NULL, -- Array of slots e.g., ['09-11', '14-16']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_daily_availability UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.network_availabilities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own availability" ON public.network_availabilities
    FOR ALL USING (auth.uid() = user_id);
