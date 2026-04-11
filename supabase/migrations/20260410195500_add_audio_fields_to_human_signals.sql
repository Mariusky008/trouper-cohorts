BEGIN;

ALTER TABLE public.human_signals
ADD COLUMN IF NOT EXISTS audio_url text;

ALTER TABLE public.human_signals
ADD COLUMN IF NOT EXISTS audio_duration_seconds integer;

COMMIT;
