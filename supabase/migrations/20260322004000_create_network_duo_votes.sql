CREATE TABLE IF NOT EXISTS public.network_duo_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duo_key TEXT NOT NULL,
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('validate', 'later', 'reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT network_duo_votes_unique_member UNIQUE (duo_key, member_id)
);

CREATE INDEX IF NOT EXISTS idx_network_duo_votes_duo_key ON public.network_duo_votes(duo_key);
CREATE INDEX IF NOT EXISTS idx_network_duo_votes_member_id ON public.network_duo_votes(member_id);
CREATE INDEX IF NOT EXISTS idx_network_duo_votes_other_member_id ON public.network_duo_votes(other_member_id);

CREATE OR REPLACE FUNCTION public.set_network_duo_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_network_duo_votes_updated_at ON public.network_duo_votes;
CREATE TRIGGER trg_network_duo_votes_updated_at
BEFORE UPDATE ON public.network_duo_votes
FOR EACH ROW
EXECUTE FUNCTION public.set_network_duo_votes_updated_at();

ALTER TABLE public.network_duo_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Network duo votes read own" ON public.network_duo_votes;
CREATE POLICY "Network duo votes read own"
ON public.network_duo_votes
FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Network duo votes manage own" ON public.network_duo_votes;
CREATE POLICY "Network duo votes manage own"
ON public.network_duo_votes
FOR ALL
TO authenticated
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);

NOTIFY pgrst, 'reload schema';
