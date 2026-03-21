CREATE TABLE IF NOT EXISTS public.network_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  original_price NUMERIC NOT NULL CHECK (original_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_network_offers_user_id ON public.network_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_network_offers_active ON public.network_offers(is_active);

CREATE OR REPLACE FUNCTION public.set_network_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_network_offers_updated_at ON public.network_offers;
CREATE TRIGGER trg_network_offers_updated_at
BEFORE UPDATE ON public.network_offers
FOR EACH ROW
EXECUTE FUNCTION public.set_network_offers_updated_at();

ALTER TABLE public.network_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Network offers read for authenticated users" ON public.network_offers;
CREATE POLICY "Network offers read for authenticated users"
ON public.network_offers
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Network offers manage own" ON public.network_offers;
CREATE POLICY "Network offers manage own"
ON public.network_offers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
