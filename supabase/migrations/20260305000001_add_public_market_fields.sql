-- Add public market fields to opportunities table
ALTER TABLE network_opportunities 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
ADD COLUMN IF NOT EXISTS price integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_title text,
ADD COLUMN IF NOT EXISTS private_details text,
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'available', 'sold', 'disputed'));

-- Update existing rows to have default values
UPDATE network_opportunities SET visibility = 'private' WHERE visibility IS NULL;
