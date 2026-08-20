-- SE DÉSISTER — la fonction n'a jamais pu s'exécuter.
--
-- LE DÉFAUT, tel qu'il se voyait : « Error: column reference "statut" is
-- ambiguous », en toutes lettres, sur l'écran d'un habitant qui essayait de
-- rendre sa place. Personne ne pouvait se désister depuis la mise en ligne de
-- `clik_quitter` — et l'écran de la liste d'attente promettait pourtant « si
-- quelqu'un se désiste, la place est pour vous ».
--
-- POURQUOI. `RETURNS TABLE (statut text, participants integer, promu uuid)`
-- déclare trois paramètres de SORTIE, et un paramètre de sortie est une
-- VARIABLE visible dans tout le corps de la fonction. Dès qu'une requête
-- mentionne `statut` ou `participants` sans dire de quelle table il s'agit,
-- PostgreSQL ne peut plus trancher entre la colonne et la variable — et son
-- réglage par défaut (`plpgsql.variable_conflict = error`) refuse la requête
-- plutôt que de deviner. À juste titre : deviner ici donnerait un compteur faux.
--
-- Le piège est d'autant plus vicieux qu'il ne se voit pas à la relecture : les
-- lignes fautives ressemblent exactement à du SQL correct, et la fonction se
-- crée sans le moindre avertissement. Elle n'échoue qu'à l'exécution.
--
-- CE QU'ON CHANGE : chaque colonne est désormais qualifiée par sa table.
--
-- ET UN SECOND DÉFAUT, que le premier cachait. `RETURNING` rend les valeurs
-- APRÈS mise à jour : `v_etait` valait donc toujours 'annule', jamais l'état
-- précédent. Le test « cette personne comptait-elle dans le groupe ? » était
-- toujours vrai, et se désister d'une LISTE D'ATTENTE décrémentait le compteur
-- — alors que quelqu'un en attente n'y a jamais été compté. Un groupe de six
-- serait tombé à cinq sans que personne ne quitte sa place, et le prix de
-- groupe se serait re-verrouillé pour tout le monde.
--
-- On lit donc l'état AVANT, avec `FOR UPDATE` : le verrou tient la ligne
-- jusqu'au COMMIT, et deux désistements simultanés se sérialisent. Le second
-- retrouve la ligne déjà annulée, ne la reconnaît plus, et rend « rien » — ce
-- qui est exactement ce qu'on veut, et ce que la garde dans le WHERE assurait.
--
-- Note pour la suite : `#variable_conflict use_column` aurait réglé le même
-- problème en une ligne, mais en le rendant invisible. Qualifier laisse la
-- prochaine personne voir ce qui se passe.
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
  -- 1. CE QU'ELLE ÉTAIT, avant d'y toucher — c'est ce qui décide si le
  --    compteur du groupe doit bouger. `FOR UPDATE` verrouille la ligne : un
  --    désistement simultané attendra ici, puis ne la reconnaîtra plus.
  SELECT p.statut INTO v_etait
    FROM public.clik_participation p
   WHERE p.campagne_id = p_campagne
     AND p.habitant_id = p_habitant
     AND p.statut IN ('engage', 'liste_attente', 'confirme')
     FOR UPDATE;

  IF v_etait IS NOT NULL THEN
    UPDATE public.clik_participation
       SET statut = 'annule', resolu_le = now()
     WHERE clik_participation.campagne_id = p_campagne
       AND clik_participation.habitant_id = p_habitant
       AND clik_participation.statut IN ('engage', 'liste_attente', 'confirme');
  END IF;

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
       SET participants = GREATEST(0, public.clik_campaign.participants - 1)
     WHERE clik_campaign.id = p_campagne
    RETURNING clik_campaign.participants INTO v_part;

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
         WHERE clik_participation.campagne_id = p_campagne
           AND clik_participation.habitant_id = v_promu;
        UPDATE public.clik_campaign
           SET participants = public.clik_campaign.participants + 1
         WHERE clik_campaign.id = p_campagne
        RETURNING clik_campaign.participants INTO v_part;
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
     WHERE clik_participation.campagne_id = p_campagne
       AND clik_participation.habitant_id = p_habitant;
  END IF;

  RETURN QUERY SELECT 'annule'::text, COALESCE(v_part, 0), v_promu;
END;
$$;

COMMENT ON FUNCTION public.clik_quitter(uuid, uuid) IS
  'Annule une participation, rend la place au premier en attente et remet un cadeau au pot.';
