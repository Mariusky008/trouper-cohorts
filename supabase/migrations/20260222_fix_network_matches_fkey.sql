-- Rediriger les clés étrangères vers public.profiles pour permettre les jointures PostgREST
ALTER TABLE public.network_matches
  DROP CONSTRAINT IF EXISTS network_matches_user1_id_fkey,
  DROP CONSTRAINT IF EXISTS network_matches_user2_id_fkey;

ALTER TABLE public.network_matches
  ADD CONSTRAINT network_matches_user1_id_fkey 
  FOREIGN KEY (user1_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.network_matches
  ADD CONSTRAINT network_matches_user2_id_fkey 
  FOREIGN KEY (user2_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
