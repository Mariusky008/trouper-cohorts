ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_response_delay_hours INTEGER;

UPDATE public.profiles
SET whatsapp_response_delay_hours = 6
WHERE whatsapp_response_delay_hours IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN whatsapp_response_delay_hours SET NOT NULL;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_whatsapp_response_delay_hours_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_whatsapp_response_delay_hours_check
CHECK (whatsapp_response_delay_hours IN (1, 3, 6, 12));

NOTIFY pgrst, 'reload schema';
