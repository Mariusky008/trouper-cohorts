-- LES DEUX MÉCANIQUES DE CLIK, ET LES RÉACTIONS.
--
-- Nommage : `clik_*` en base, comme le SQL de la spécification. Le libellé
-- affiché (« Clic » ou « Clik ») reste un réglage d'interface — on ne fige pas
-- une décision éditoriale dans des noms de tables.
--
-- DEUX MÉCANIQUES, UNE SEULE TABLE DE CAMPAGNE. Elles partagent le commerce, la
-- fenêtre de validité, le statut et l'annonce d'origine ; seules quelques
-- colonnes leur sont propres. Deux tables auraient dupliqué la moitié des
-- colonnes et toutes les requêtes du fil.
--
--   'cadeau'    → un stock d'avantages qui S'ÉPUISE, révélé immédiatement.
--   'collectif' → un objectif qui SE REMPLIT, prix réduit pour tout le groupe.

-- ── Les campagnes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clik_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  publication_id uuid,
  ville_slug text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('cadeau', 'collectif')),
  titre text NOT NULL DEFAULT '',

  -- Collectif : l'objectif, le compteur, et les deux prix.
  objectif integer CHECK (objectif IS NULL OR objectif >= 2),
  participants integer NOT NULL DEFAULT 0 CHECK (participants >= 0),
  prix_initial numeric(10,2),
  prix_groupe numeric(10,2),
  -- Le §8.1 prévoit une file d'attente en cas de désistement.
  places_attente integer NOT NULL DEFAULT 3 CHECK (places_attente >= 0),
  -- Créneau global (14 h – 17 h) : le commerçant attribue les horaires ensuite.
  creneau_debut timestamptz,
  creneau_fin timestamptz,
  attribution_auto boolean NOT NULL DEFAULT true,

  ouvre_le timestamptz NOT NULL DEFAULT now(),
  echeance timestamptz NOT NULL,
  statut text NOT NULL DEFAULT 'active'
    CHECK (statut IN ('brouillon', 'active', 'debloquee', 'echouee', 'annulee', 'terminee')),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- UN OBJECTIF SANS PRIX RÉDUIT NE VEUT RIEN DIRE, et un prix réduit sans
  -- objectif non plus : la contrainte interdit la moitié de campagne, qui
  -- s'afficherait comme une offre incompréhensible.
  CONSTRAINT clik_campaign_collectif_complet CHECK (
    type <> 'collectif' OR (objectif IS NOT NULL AND prix_initial IS NOT NULL AND prix_groupe IS NOT NULL
                            AND prix_groupe < prix_initial)
  )
);

CREATE INDEX IF NOT EXISTS clik_campaign_fil_idx
  ON public.clik_campaign (ville_slug, echeance)
  WHERE statut IN ('active', 'debloquee');
CREATE INDEX IF NOT EXISTS clik_campaign_site_idx ON public.clik_campaign (site_id, statut);

-- ── Le stock d'avantages (campagnes « cadeau ») ─────────────────────────────
-- La séquence est FIGÉE À LA CRÉATION, mélangée, puis distribuée dans l'ordre.
-- Le serveur ne choisit rien au moment du clic : tout était décidé avant, ce qui
-- rend la distribution vérifiable et interdit tout favoritisme.
CREATE TABLE IF NOT EXISTS public.clik_reward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id uuid NOT NULL REFERENCES public.clik_campaign(id) ON DELETE CASCADE,
  position integer NOT NULL,
  libelle text NOT NULL,
  -- TOUT AVANTAGE EXIGE UN ACHAT. Sans cette colonne, le fleuriste distribue des
  -- roses à des gens qui n'achètent rien — et il arrête au bout de deux
  -- semaines. `NOT NULL` : la règle est tenue par la base, pas par l'écran.
  condition_achat text NOT NULL,
  valeur numeric(10,2),
  statut text NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'attribue')),
  attribue_a uuid,
  attribue_le timestamptz,
  UNIQUE (campagne_id, position)
);
CREATE INDEX IF NOT EXISTS clik_reward_pool_idx
  ON public.clik_reward (campagne_id, position)
  WHERE statut = 'disponible';

-- ── Les participations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clik_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id uuid NOT NULL REFERENCES public.clik_campaign(id) ON DELETE CASCADE,
  habitant_id uuid NOT NULL,
  statut text NOT NULL DEFAULT 'engage'
    CHECK (statut IN ('engage', 'liste_attente', 'confirme', 'annule', 'absent')),
  -- LE FILET DE SÉCURITÉ. Si le groupe n'atteint pas son objectif, la place
  -- reste valable au prix initial : rejoindre n'est jamais un pari perdant.
  -- Renseigné à la résolution de la campagne, jamais avant.
  prix_obtenu numeric(10,2),
  reward_id uuid REFERENCES public.clik_reward(id),
  creneau_attribue timestamptz,
  confirme_par_habitant boolean NOT NULL DEFAULT false,
  rejoint_le timestamptz NOT NULL DEFAULT now(),
  resolu_le timestamptz,
  source text NOT NULL DEFAULT 'direct'
    CHECK (source IN ('direct', 'decouverte', 'partage', 'invitation')),
  -- Une personne ne rejoint qu'une fois : sans ça, le compteur du groupe se
  -- gonfle tout seul et le seuil ne veut plus rien dire.
  UNIQUE (campagne_id, habitant_id)
);
CREATE INDEX IF NOT EXISTS clik_participation_habitant_idx
  ON public.clik_participation (habitant_id, rejoint_le DESC);

-- ── Le bon à présenter ──────────────────────────────────────────────────────
-- CE N'EST PAS UNE RÉSERVATION. Tant qu'aucun plan de salle n'existe chez le
-- commerçant, Clikme garantit LE TARIF, pas la table. Le vocabulaire de cette
-- table le dit, pour qu'aucun écran ne promette l'inverse par inadvertance.
CREATE TABLE IF NOT EXISTS public.clik_bon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id uuid NOT NULL REFERENCES public.clik_participation(id) ON DELETE CASCADE,
  site_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  statut text NOT NULL DEFAULT 'valide' CHECK (statut IN ('valide', 'utilise', 'expire')),
  expire_le timestamptz NOT NULL,
  utilise_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clik_bon_site_idx ON public.clik_bon (site_id, statut);

-- ── Les réactions ───────────────────────────────────────────────────────────
-- AUCUN TEXTE LIBRE, JAMAIS. Quatre réactions fixes : pas de modération, pas de
-- risque de dérapage sur un commerce, et rien qu'une collectivité refuserait
-- d'héberger. C'est la règle « ni commentaires ni likes publics », tenue par le
-- schéma plutôt que par une consigne.
--
-- « jysuis » n'est pas une réaction comme les autres : c'est une PREUVE DE
-- VISITE, le seul chiffre qui démontre la valeur de Clikme à un commerçant.
CREATE TABLE IF NOT EXISTS public.clik_reaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  publication_id uuid,
  habitant_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('jenveux', 'jepassevoir', 'prefere', 'jysuis')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- `NULLS NOT DISTINCT` : sans lui, une réaction portée sur le commerce (donc
  -- sans publication) pourrait être enregistrée autant de fois qu'on appuie —
  -- PostgreSQL considère par défaut deux NULL comme différents.
  UNIQUE NULLS NOT DISTINCT (habitant_id, site_id, publication_id, type)
);
CREATE INDEX IF NOT EXISTS clik_reaction_site_idx ON public.clik_reaction (site_id, type);

-- ── Rejoindre un collectif, sans jamais dépasser l'objectif ─────────────────
--
-- LE PROBLÈME DU DERNIER CLIK. Deux personnes appuient au même instant alors que
-- le groupe est à 3/4. Sans garde, les deux lisent « 3 », les deux écrivent
-- « 4 », et le groupe se retrouve à 5 sur un objectif de 4 — le commerçant
-- découvre une personne de plus que ce qu'il a accepté.
--
-- La garde est dans le `WHERE` de l'UPDATE, pas dans une lecture préalable :
-- PostgreSQL sérialise les écritures sur une même ligne, donc la seconde
-- transaction relit la valeur déjà incrémentée et sa condition échoue.
CREATE OR REPLACE FUNCTION public.clik_rejoindre(p_campagne uuid, p_habitant uuid)
RETURNS TABLE (statut text, participants integer, objectif integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_ok boolean := false;
  v_part integer;
  v_obj integer;
  v_attente integer;
  v_existe text;
BEGIN
  -- Déjà dedans : on renvoie son état, sans rien incrémenter.
  SELECT p.statut INTO v_existe
    FROM public.clik_participation p
   WHERE p.campagne_id = p_campagne AND p.habitant_id = p_habitant;
  IF FOUND THEN
    SELECT c.participants, c.objectif INTO v_part, v_obj
      FROM public.clik_campaign c WHERE c.id = p_campagne;
    RETURN QUERY SELECT v_existe, v_part, v_obj;
    RETURN;
  END IF;

  UPDATE public.clik_campaign c
     SET participants = c.participants + 1,
         statut = CASE WHEN c.participants + 1 >= c.objectif THEN 'debloquee' ELSE c.statut END
   WHERE c.id = p_campagne
     AND c.type = 'collectif'
     AND c.statut = 'active'
     AND c.echeance > now()
     AND c.participants < c.objectif
  RETURNING c.participants, c.objectif INTO v_part, v_obj;
  v_ok := FOUND;

  IF v_ok THEN
    INSERT INTO public.clik_participation (campagne_id, habitant_id, statut)
    VALUES (p_campagne, p_habitant, 'engage');
    RETURN QUERY SELECT 'engage'::text, v_part, v_obj;
    RETURN;
  END IF;

  -- Groupe complet MAIS CAMPAGNE ENCORE OUVERTE : liste d'attente, dans la
  -- limite prévue — un désistement rouvre la place.
  --
  -- La condition sur le statut n'est pas décorative : sans elle, une campagne
  -- déjà résolue ou expirée acceptait encore des inscriptions en attente. La
  -- personne voyait « votre place est en attente » sur une opération terminée
  -- depuis la veille, et attendait quelque chose qui n'arriverait jamais.
  SELECT c.participants, c.objectif, c.places_attente INTO v_part, v_obj, v_attente
    FROM public.clik_campaign c
   WHERE c.id = p_campagne AND c.statut IN ('active', 'debloquee') AND c.echeance > now();
  IF FOUND AND v_obj IS NOT NULL AND (
       SELECT count(*) FROM public.clik_participation p
        WHERE p.campagne_id = p_campagne AND p.statut = 'liste_attente') < v_attente THEN
    INSERT INTO public.clik_participation (campagne_id, habitant_id, statut)
    VALUES (p_campagne, p_habitant, 'liste_attente');
    RETURN QUERY SELECT 'liste_attente'::text, v_part, v_obj;
    RETURN;
  END IF;

  -- Ni engagé, ni en attente : soit le groupe et sa file sont pleins, soit
  -- l'opération est terminée. L'écran doit dire lequel des deux.
  SELECT c.participants, c.objectif INTO v_part, v_obj
    FROM public.clik_campaign c WHERE c.id = p_campagne;
  RETURN QUERY SELECT
    CASE WHEN EXISTS (SELECT 1 FROM public.clik_campaign c
                       WHERE c.id = p_campagne AND c.statut IN ('active', 'debloquee') AND c.echeance > now())
         THEN 'complet' ELSE 'terminee' END,
    v_part, v_obj;
END;
$$;

-- ── Prendre le prochain avantage du stock ───────────────────────────────────
--
-- `FOR UPDATE SKIP LOCKED` : deux personnes qui cliquent en même temps prennent
-- deux avantages DIFFÉRENTS. Sans `SKIP LOCKED`, la seconde attendrait la
-- première puis relirait la même ligne ; sans `FOR UPDATE`, les deux
-- obtiendraient le même dernier lot.
CREATE OR REPLACE FUNCTION public.clik_prendre_avantage(p_campagne uuid, p_habitant uuid)
RETURNS TABLE (reward_id uuid, libelle text, condition_achat text, restants integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.clik_reward r
     SET statut = 'attribue', attribue_a = p_habitant, attribue_le = now()
   WHERE r.id = (
     SELECT r2.id FROM public.clik_reward r2
      WHERE r2.campagne_id = p_campagne AND r2.statut = 'disponible'
      ORDER BY r2.position
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
  RETURNING r.id INTO v_id;

  IF v_id IS NULL THEN
    RETURN; -- stock épuisé : l'annonce reste visible, le bouton disparaît
  END IF;

  INSERT INTO public.clik_participation (campagne_id, habitant_id, statut, reward_id, resolu_le)
  VALUES (p_campagne, p_habitant, 'confirme', v_id, now())
  ON CONFLICT (campagne_id, habitant_id) DO UPDATE
    SET reward_id = EXCLUDED.reward_id, statut = 'confirme', resolu_le = now();

  RETURN QUERY
    SELECT r.id, r.libelle, r.condition_achat,
           (SELECT count(*)::integer FROM public.clik_reward x
             WHERE x.campagne_id = p_campagne AND x.statut = 'disponible')
      FROM public.clik_reward r WHERE r.id = v_id;
END;
$$;

-- ── Résoudre un collectif à l'échéance ──────────────────────────────────────
-- Le filet de sécurité, appliqué en base : personne ne perd sa place, seul le
-- prix change. Un échec ne doit jamais produire une participation annulée.
CREATE OR REPLACE FUNCTION public.clik_resoudre(p_campagne uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  c public.clik_campaign;
  v_prix numeric(10,2);
  v_statut text;
BEGIN
  SELECT * INTO c FROM public.clik_campaign WHERE id = p_campagne FOR UPDATE;
  IF NOT FOUND OR c.type <> 'collectif' OR c.statut IN ('terminee', 'annulee') THEN
    RETURN COALESCE(c.statut, 'introuvable');
  END IF;

  IF c.participants >= c.objectif THEN
    v_prix := c.prix_groupe; v_statut := 'debloquee';
  ELSE
    v_prix := c.prix_initial; v_statut := 'echouee';
  END IF;

  UPDATE public.clik_participation
     SET prix_obtenu = v_prix, statut = 'confirme', resolu_le = now()
   WHERE campagne_id = p_campagne AND statut = 'engage';

  UPDATE public.clik_campaign SET statut = v_statut WHERE id = p_campagne;
  RETURN v_statut;
END;
$$;

COMMENT ON TABLE public.clik_bon IS
  'Bon d''avantage, PAS une réservation : Clikme garantit le tarif, pas la table.';
COMMENT ON TABLE public.clik_reaction IS
  'Réactions fixes, sans texte libre — aucune modération. « jysuis » = preuve de visite.';
