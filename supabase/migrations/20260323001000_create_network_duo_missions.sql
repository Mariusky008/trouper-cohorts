CREATE TABLE IF NOT EXISTS public.network_duo_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duo_key TEXT NOT NULL,
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('continue_together', 'tested_not_ready', 'not_a_fit', 'offer_created', 'need_help')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT network_duo_missions_unique_member UNIQUE (duo_key, member_id)
);

CREATE INDEX IF NOT EXISTS idx_network_duo_missions_duo_key ON public.network_duo_missions(duo_key);
CREATE INDEX IF NOT EXISTS idx_network_duo_missions_member_id ON public.network_duo_missions(member_id);
CREATE INDEX IF NOT EXISTS idx_network_duo_missions_outcome ON public.network_duo_missions(outcome);

CREATE OR REPLACE FUNCTION public.set_network_duo_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_network_duo_missions_updated_at ON public.network_duo_missions;
CREATE TRIGGER trg_network_duo_missions_updated_at
BEFORE UPDATE ON public.network_duo_missions
FOR EACH ROW
EXECUTE FUNCTION public.set_network_duo_missions_updated_at();

ALTER TABLE public.network_duo_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Network duo missions read own" ON public.network_duo_missions;
CREATE POLICY "Network duo missions read own"
ON public.network_duo_missions
FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Network duo missions manage own" ON public.network_duo_missions;
CREATE POLICY "Network duo missions manage own"
ON public.network_duo_missions
FOR ALL
TO authenticated
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);

NOTIFY pgrst, 'reload schema';
