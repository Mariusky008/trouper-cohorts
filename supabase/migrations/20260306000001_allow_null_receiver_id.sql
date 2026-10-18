-- Allow receiver_id to be NULL in network_opportunities table
-- This is required for public market opportunities where the receiver is not yet known

ALTER TABLE network_opportunities
ALTER COLUMN receiver_id DROP NOT NULL;

-- Add comment explaining why
COMMENT ON COLUMN network_opportunities.receiver_id IS 'Can be NULL for public market opportunities until purchased/claimed';