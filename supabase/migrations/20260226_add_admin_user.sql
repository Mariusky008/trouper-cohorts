-- Add user to admins table
INSERT INTO public.admins (user_id)
VALUES ('c703e474-15c7-4400-b207-da7e4d79dce7')
ON CONFLICT (user_id) DO NOTHING;
