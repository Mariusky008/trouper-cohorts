BEGIN;

ALTER TABLE public.human_scout_invites
  ADD COLUMN IF NOT EXISTS short_code text;

DO $$
DECLARE
  rec record;
  candidate text;
BEGIN
  FOR rec IN
    SELECT id
    FROM public.human_scout_invites
    WHERE short_code IS NULL
  LOOP
    LOOP
      candidate := upper(substr(md5(gen_random_uuid()::text), 1, 4) || '-' || substr(md5(gen_random_uuid()::text), 1, 4));
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.human_scout_invites
        WHERE short_code = candidate
      );
    END LOOP;

    UPDATE public.human_scout_invites
    SET short_code = candidate
    WHERE id = rec.id;
  END LOOP;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS human_scout_invites_short_code_key
  ON public.human_scout_invites(short_code);

ALTER TABLE public.human_scout_invites
  ALTER COLUMN short_code SET NOT NULL;

COMMIT;
