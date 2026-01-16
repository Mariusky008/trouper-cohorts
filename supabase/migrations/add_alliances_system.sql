-- 1. Update Profiles for Career Progression
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS career_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_level INTEGER DEFAULT 1; -- 1 to 11

-- 2. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE alliance_type AS ENUM ('duo', 'trio', 'round_table', 'raid', 'docu', 'summit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alliance_status AS ENUM ('open', 'in_progress', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('leader', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('pending', 'accepted', 'rejected', 'confirmed_appearance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Alliances Table
CREATE TABLE IF NOT EXISTS alliances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type alliance_type NOT NULL,
    status alliance_status DEFAULT 'open',
    video_url TEXT, -- Final result
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Alliance Members (Applications & Participants)
CREATE TABLE IF NOT EXISTS alliance_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    status member_status DEFAULT 'pending',
    application_message TEXT, -- The "Pitch"
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alliance_id, user_id)
);

-- 5. Create Alliance Chat (Ephemeral)
CREATE TABLE IF NOT EXISTS alliance_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alliances_status ON alliances(status);
CREATE INDEX IF NOT EXISTS idx_alliance_members_user ON alliance_members(user_id);
CREATE INDEX IF NOT EXISTS idx_alliance_messages_alliance ON alliance_messages(alliance_id);

-- 7. Enable RLS
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_messages ENABLE ROW LEVEL SECURITY;

-- 8. Policies (Simple Version for MVP)
-- Alliances: Readable by everyone (Feed), Writable by Creator
CREATE POLICY "Alliances are viewable by everyone" ON alliances FOR SELECT USING (true);
CREATE POLICY "Creators can insert alliances" ON alliances FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their alliances" ON alliances FOR UPDATE USING (auth.uid() = creator_id);

-- Members: Readable by everyone, Insertable by self (apply) or creator (invite)
CREATE POLICY "Members viewable by everyone" ON alliance_members FOR SELECT USING (true);
CREATE POLICY "Users can apply" ON alliance_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaders can manage members" ON alliance_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM alliances WHERE id = alliance_id AND creator_id = auth.uid())
    OR auth.uid() = user_id -- Users can update their own status (e.g. accept invite)
);

-- Messages: Readable/Writable only by alliance members
CREATE POLICY "Alliance members can view messages" ON alliance_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM alliance_members WHERE alliance_id = alliance_messages.alliance_id AND user_id = auth.uid() AND status IN ('accepted', 'confirmed_appearance'))
    OR EXISTS (SELECT 1 FROM alliances WHERE id = alliance_messages.alliance_id AND creator_id = auth.uid())
);

CREATE POLICY "Alliance members can send messages" ON alliance_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM alliance_members WHERE alliance_id = alliance_messages.alliance_id AND user_id = auth.uid() AND status IN ('accepted', 'confirmed_appearance'))
    OR EXISTS (SELECT 1 FROM alliances WHERE id = alliance_messages.alliance_id AND creator_id = auth.uid())
);
