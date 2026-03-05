-- Create table for CM tasks
CREATE TABLE cm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional useful fields for CM
    platform TEXT CHECK (platform IN ('linkedin', 'instagram', 'tiktok', 'newsletter', 'website', 'design', 'video', 'research', 'strategy', 'admin', 'other')),
    link_url TEXT, -- Link to the draft or published post
    feedback TEXT -- Your feedback for the CM
);

-- RLS Policies (Allow all authenticated users for now)
ALTER TABLE cm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read cm_tasks" ON cm_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to insert cm_tasks" ON cm_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update cm_tasks" ON cm_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to delete cm_tasks" ON cm_tasks FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_cm_tasks_status ON cm_tasks(status);
CREATE INDEX idx_cm_tasks_due_date ON cm_tasks(due_date);
