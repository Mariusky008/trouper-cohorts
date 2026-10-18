
-- 1. Ensure storage.objects cascade deletion when a user is deleted
-- This prevents "Foreign Key Violation" errors if a user has uploaded files (avatars, proofs)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'objects_owner_fkey' AND table_name = 'objects' AND table_schema = 'storage') THEN
        ALTER TABLE storage.objects DROP CONSTRAINT objects_owner_fkey;
    END IF;
    
    ALTER TABLE storage.objects
    ADD CONSTRAINT objects_owner_fkey
    FOREIGN KEY (owner)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not alter storage.objects constraint: %', SQLERRM;
END $$;

-- 2. Ensure pre_registrations does not block deletion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_registrations_user_id_fkey' AND table_name = 'pre_registrations' AND table_schema = 'public') THEN
        ALTER TABLE public.pre_registrations DROP CONSTRAINT pre_registrations_user_id_fkey;
    END IF;

    ALTER TABLE public.pre_registrations
    ADD CONSTRAINT pre_registrations_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
END $$;
