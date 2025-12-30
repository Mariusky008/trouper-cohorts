-- Function to handle user joining a squad automatically
-- Logic: Join the first available squad (< 30 members). If none, create a new one.
-- Security: SECURITY DEFINER allows this to run with system privileges (bypassing RLS), ensuring it always works.

CREATE OR REPLACE FUNCTION join_squad(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_squad_id UUID;
    target_squad_name TEXT;
    squad_number INT;
    member_count INT;
    existing_squad_id UUID;
BEGIN
    -- 1. Check if user is already in a squad
    SELECT squad_id INTO existing_squad_id FROM squad_members WHERE user_id = p_user_id LIMIT 1;
    
    IF existing_squad_id IS NOT NULL THEN
        SELECT name INTO target_squad_name FROM squads WHERE id = existing_squad_id;
        RETURN jsonb_build_object(
            'success', true, 
            'squad_id', existing_squad_id, 
            'squad_name', target_squad_name,
            'message', 'Already in a squad'
        );
    END IF;

    -- 2. Find the first squad with < 30 members
    -- We order by created_at ASC to fill oldest squads first (Alpha, then Beta...)
    SELECT s.id, s.name
    INTO target_squad_id, target_squad_name
    FROM squads s
    LEFT JOIN squad_members sm ON s.id = sm.squad_id
    GROUP BY s.id, s.name, s.created_at
    HAVING COUNT(sm.id) < 30
    ORDER BY s.created_at ASC
    LIMIT 1;

    -- 3. If no suitable squad found, create a new one
    IF target_squad_id IS NULL THEN
        -- Determine new name
        SELECT COUNT(*) INTO squad_number FROM squads;
        -- Example naming: Escouade Alpha (1), Escouade Beta (2)... 
        -- Or simple: Escouade 2, Escouade 3... if Greek is too complex to manage in SQL array without a helper.
        -- Let's stick to "Escouade #" for robustness beyond Alpha.
        -- Or if we want to keep the style:
        -- We can just fallback to "Escouade " + Number for now.
        
        target_squad_name := 'Escouade ' || (squad_number + 1);
        
        -- Special case: If 0 squads exist (should not happen due to migration), name it Alpha?
        -- But migration ensures Alpha exists.
        
        INSERT INTO squads (name) VALUES (target_squad_name) RETURNING id INTO target_squad_id;
    END IF;

    -- 4. Add user to the squad
    INSERT INTO squad_members (squad_id, user_id) VALUES (target_squad_id, p_user_id);

    RETURN jsonb_build_object(
        'success', true, 
        'squad_id', target_squad_id, 
        'squad_name', target_squad_name,
        'message', 'Joined squad successfully'
    );
END;
$$;
