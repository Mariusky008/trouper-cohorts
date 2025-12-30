-- Also repair the new account by re-running the consolidation logic one last time
-- This will ensure even the new user is moved to Alpha if they were in a different squad.

DO $$
DECLARE
    target_squad_id UUID;
BEGIN
    SELECT id INTO target_squad_id FROM squads WHERE name = 'Escouade Alpha' LIMIT 1;
    
    IF target_squad_id IS NOT NULL THEN
        -- Move everyone to Alpha
        UPDATE squad_members
        SET squad_id = target_squad_id
        WHERE squad_id != target_squad_id;
        
        -- Delete empty squads
        DELETE FROM squads 
        WHERE id != target_squad_id 
        AND id NOT IN (SELECT DISTINCT squad_id FROM squad_members);
    END IF;
END $$;
