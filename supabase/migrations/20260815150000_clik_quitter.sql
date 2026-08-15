-- SE DÉSISTER — et rendre la place à quelqu'un.
--
-- Il manquait les deux moitiés d'une même chose : personne ne pouvait annuler,
-- et l'écran promettait pourtant « si quelqu'un se désiste, la place est pour
-- vous » à ceux qui attendaient. Une promesse qu'aucun chemin de code ne
-- pouvait tenir.
--
-- POURQUOI UNE FONCTION SQL. Se désister d'un collectif touche DEUX lignes qui
-- doivent bouger ensemble : la participation qu'on annule, et le compteur du
-- groupe. Fait en deux requêtes depuis l'application, deux désistements
-- simultanés décrémentent tous les deux depuis la même lecture, et le compteur
-- descend d'un au lieu de deux. La garde vit donc dans le `WHERE` de l'UPDATE,
-- comme pour `clik_rejoindre`.
--
-- ET ON PROMEUT LE PREMIER EN ATTENTE. C'est le sens du désistement : la place
-- libérée ne disparaît pas, elle passe au suivant. `FOR UPDATE SKIP LOCKED`
-- garantit que deux désistements simultanés ne promeuvent pas la même personne.
CREATE OR REPLACE FUNCTION public.clik_quitter(p_campagne uuid, p_habitant uuid)
RETURNS TABLE (statut text, participants integer, promu uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  v_etait text;
  v_type text;
  v_part integer;
  v_promu uuid := NULL;
BEGIN
  -- 1. La participation, si elle existe et compte encore.
  UPDATE public.clik_participation
     SET statut = 'annule', resolu_le = now()
   WHERE campagne_id = p_campagne
     AND habitant_id = p_habitant
     AND statut IN ('engage', 'liste_attente', 'confirme')
  RETURNING clik_participation.statut INTO v_etait;

  IF v_etait IS NULL THEN
    -- Rien à annuler : ce n'est pas une erreur, c'est déjà fait.
    SELECT c.participants INTO v_part FROM public.clik_campaign c WHERE c.id = p_campagne;
    RETURN QUERY SELECT 'rien'::text, COALESCE(v_part, 0), NULL::uuid;
    RETURN;
  END IF;

  SELECT c.type INTO v_type FROM public.clik_campaign c WHERE c.id = p_campagne;

  -- 2. Le compteur ne bouge QUE si la personne y comptait. Quelqu'un en liste
  --    d'attente n'a jamais été compté : le décrémenter ferait descendre le
  --    groupe en dessous de sa taille réelle.
  IF v_etait <> 'liste_attente' THEN
    UPDATE public.clik_campaign
       SET participants = GREATEST(0, participants - 1)
     WHERE id = p_campagne
    RETURNING participants INTO v_part;

    -- 3. La place libérée passe au premier en attente. C'est exactement ce que
    --    l'écran lui a promis en le mettant sur la liste.
    IF v_type = 'collectif' THEN
      SELECT p.habitant_id INTO v_promu
        FROM public.clik_participation p
       WHERE p.campagne_id = p_campagne
         AND p.statut = 'liste_attente'
       ORDER BY p.rejoint_le ASC
       LIMIT 1
         FOR UPDATE SKIP LOCKED;

      IF v_promu IS NOT NULL THEN
        UPDATE public.clik_participation
           SET statut = 'engage'
         WHERE campagne_id = p_campagne AND habitant_id = v_promu;
        UPDATE public.clik_campaign
           SET participants = participants + 1
         WHERE id = p_campagne
        RETURNING participants INTO v_part;
      END IF;
    END IF;
  ELSE
    SELECT c.participants INTO v_part FROM public.clik_campaign c WHERE c.id = p_campagne;
  END IF;

  -- 4. Le stock d'un cadeau REVIENT au pot. Un avantage rendu doit pouvoir être
  --    repris par quelqu'un d'autre, sinon se désister détruit une place.
  IF v_type = 'cadeau' THEN
    UPDATE public.clik_reward r
       SET statut = 'disponible'
      FROM public.clik_participation p
     WHERE p.campagne_id = p_campagne
       AND p.habitant_id = p_habitant
       AND r.id = p.reward_id;
    UPDATE public.clik_participation
       SET reward_id = NULL
     WHERE campagne_id = p_campagne AND habitant_id = p_habitant;
  END IF;

  RETURN QUERY SELECT 'annule'::text, COALESCE(v_part, 0), v_promu;
END;
$$;

COMMENT ON FUNCTION public.clik_quitter(uuid, uuid) IS
  'Annule une participation, rend la place au premier en attente et remet un cadeau au pot.';
