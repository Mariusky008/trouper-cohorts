-- Cleanup Migration: Remove fake users from squad members to free up space
-- and move the isolated user to the main squad.

DO $$
DECLARE
    main_squad_id UUID;
    fake_count INT;
BEGIN
    -- 1. Identify 'Escouade Alpha'
    SELECT id INTO main_squad_id FROM squads WHERE name = 'Escouade Alpha' LIMIT 1;

    -- 2. Remove fake users from squad_members
    -- Assuming fake users have 'fake_' in their username or email (joined via profiles)
    -- We delete from squad_members where the linked profile has a fake email/username
    
    DELETE FROM squad_members
    WHERE user_id IN (
        SELECT id FROM profiles 
        WHERE email LIKE 'fake_%' 
           OR username LIKE 'fake_%'
           OR email LIKE '%@troupers.dev'
    );
    
    GET DIAGNOSTICS fake_count = ROW_COUNT;
    RAISE NOTICE 'Removed % fake members from squads.', fake_count;

    -- 3. Move ALL remaining members (including Johnny from Escouade 2) to Escouade Alpha
    -- This ensures everyone real is together
    UPDATE squad_members
    SET squad_id = main_squad_id
    WHERE squad_id != main_squad_id;

    -- 4. Delete empty squads (Escouade 2 should be empty now)
    DELETE FROM squads 
    WHERE id != main_squad_id 
    AND id NOT IN (SELECT DISTINCT squad_id FROM squad_members);

END $$;
