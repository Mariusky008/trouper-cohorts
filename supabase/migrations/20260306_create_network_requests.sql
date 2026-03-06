-- Create table for Network Requests (Searches)
CREATE TABLE network_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('service', 'recruitment', 'venue', 'other')) DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE network_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can read requests
CREATE POLICY "Allow authenticated to read requests" ON network_requests
    FOR SELECT TO authenticated USING (true);

-- Users can insert their own requests
CREATE POLICY "Allow users to insert their own requests" ON network_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Allow users to update their own requests" ON network_requests
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own requests
CREATE POLICY "Allow users to delete their own requests" ON network_requests
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_network_requests_created_at ON network_requests(created_at DESC);
