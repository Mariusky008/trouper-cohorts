-- Add support_type to daily_supports for analytics
ALTER TABLE daily_supports 
ADD COLUMN IF NOT EXISTS support_type TEXT DEFAULT 'like'; -- like, comment, favorite, share, watch

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_supports_type ON daily_supports(support_type);
