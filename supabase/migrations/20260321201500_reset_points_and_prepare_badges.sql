UPDATE public.profiles
SET points = 0
WHERE points IS DISTINCT FROM 0;

NOTIFY pgrst, 'reload schema';
