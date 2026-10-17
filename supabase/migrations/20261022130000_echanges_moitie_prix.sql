-- « JAMAIS PLEIN TARIF » — entre commerçants ClikMe, on paie avec ses crédits
-- (0 €), ou, s'il préfère ou n'en a plus assez, à moitié prix.
--
-- « J'aimais bien l'idée de pouvoir avoir un produit ou un service contre un
-- autre sans avoir besoin de sortir d'argent… n'y aurait-il pas une solution
-- pour faire comprendre les deux comme 100 % sans argent et 50 % discount ? »
--
-- CE QUI CHANGE :
--   1. CHAQUE BON DIT COMMENT IL EST PAYÉ (`mode`) : 'credits' (comme avant)
--      ou 'moitie'.
--   2. À MOITIÉ PRIX, L'ACHETEUR paie la moitié en euros, sur place,
--      directement au commerçant (`a_regler`). Ses crédits ne bougent pas : un
--      bon à moitié prix ne compte pas dans ce qu'il a pris, ni dans les 50 €
--      du mois d'un membre de son équipe.
--   3. LE VENDEUR NE PERD RIEN : quand il valide un bon à moitié prix, il
--      encaisse la moitié en euros ET gagne l'autre moitié en crédits
--      (`credits`, arrondie à l'euro au-dessus). Ce sont les seuls crédits qui
--      naissent sans être pris à quelqu'un — d'où les garde-fous :
--   4. UNE SEULE FOIS À MOITIÉ PRIX PAR MOIS CHEZ UN MÊME COMMERÇANT (deux
--      complices ne peuvent pas fabriquer des crédits à la chaîne), et chaque
--      bon à moitié prix compte dans « combien par mois » du vendeur, comme
--      un autre.
--
-- COMPATIBLE AVEC LE CODE DÉJÀ EN LIGNE : les bons d'avant sont 'credits' ;
-- `echanges_prendre` à cinq arguments reste, et passe par la nouvelle (six
-- arguments, `p_mode`). PostgREST choisit l'une ou l'autre d'après les noms
-- reçus. On peut donc appliquer cette migration AVANT de mettre le nouveau code
-- en ligne, sans rien casser.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261021120000_echanges_factures.sql`. Elle peut être rejouée.

BEGIN;

ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'credits';
ALTER TABLE public.human_echanges_bons DROP CONSTRAINT IF EXISTS human_echanges_bons_mode_check;
ALTER TABLE public.human_echanges_bons ADD CONSTRAINT human_echanges_bons_mode_check CHECK (mode IN ('credits', 'moitie'));
-- Ce que le vendeur gagne en crédits quand il valide le bon.
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS credits integer
  GENERATED ALWAYS AS (CASE WHEN mode = 'moitie' THEN ceil(prix / 2.0)::integer ELSE prix END) STORED;
-- Ce que l'acheteur paie en euros, sur place (0 avec ses crédits).
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS a_regler numeric(10, 2)
  GENERATED ALWAYS AS (CASE WHEN mode = 'moitie' THEN round(prix / 2.0, 2) ELSE 0 END) STORED;
CREATE INDEX IF NOT EXISTS human_echanges_bons_moitie ON public.human_echanges_bons (preneur_id, fournisseur_id, cree_le) WHERE mode = 'moitie';

/* ── PRENDRE, AVEC SES CRÉDITS OU À MOITIÉ PRIX ────────────────────────────
   D'un seul tenant et sous deux verrous, comme avant. Avec ses crédits : les
   50 € du mois d'un membre, puis le compte du commerce. À moitié prix : ni
   l'un ni l'autre (il paie en euros), mais une seule fois par mois chez ce
   commerçant. Dans les deux cas : « combien par mois » du vendeur. */
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer, p_membre uuid, p_mode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o_preneur public.human_echanges_offres%ROWTYPE;
  o_fourn public.human_echanges_offres%ROWTYPE;
  m public.human_echanges_membres%ROWTYPE;
  v_gagne integer;
  v_pris integer;
  v_peut integer;
  v_ce_mois integer;
  v_lui integer;
  v_deja integer;
  v_debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  b public.human_echanges_bons%ROWTYPE;
BEGIN
  IF p_mode IS NULL OR p_mode NOT IN ('credits', 'moitie') THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'mode');
  END IF;
  IF p_preneur = p_fournisseur THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'soi');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || least(p_preneur::text, p_fournisseur::text)));
  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || greatest(p_preneur::text, p_fournisseur::text)));
  PERFORM public.echanges_expirer();

  IF p_membre IS NOT NULL THEN
    SELECT * INTO m FROM public.human_echanges_membres WHERE id = p_membre;
    IF NOT FOUND OR m.site_id <> p_preneur OR m.retire_le IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'membre');
    END IF;
  END IF;

  SELECT * INTO o_preneur FROM public.human_echanges_offres WHERE site_id = p_preneur;
  IF NOT FOUND OR NOT o_preneur.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'sans_offre');
  END IF;

  SELECT * INTO o_fourn FROM public.human_echanges_offres WHERE site_id = p_fournisseur;
  IF NOT FOUND OR NOT o_fourn.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'offre_retiree');
  END IF;

  IF p_mode = 'credits' THEN
    -- SES 50 € DU MOIS, À LUI (ce qu'il a pris avec des crédits).
    IF p_membre IS NOT NULL THEN
      SELECT coalesce(sum(prix), 0) INTO v_lui
        FROM public.human_echanges_bons
       WHERE membre_id = p_membre AND mode = 'credits' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
      IF v_lui + o_fourn.prix > greatest(p_par_personne, 0) THEN
        RETURN jsonb_build_object('ok', false, 'raison', 'plafond_perso', 'reste', greatest(greatest(p_par_personne, 0) - v_lui, 0));
      END IF;
    END IF;

    -- LE COMPTE DU COMMERCE : ce qu'il a gagné (à moitié prix, la moitié en crédits), moins ce qu'il a pris avec ses crédits.
    SELECT coalesce(sum(credits), 0) INTO v_gagne
      FROM public.human_echanges_bons WHERE fournisseur_id = p_preneur AND statut = 'utilise';
    SELECT coalesce(sum(prix), 0) INTO v_pris
      FROM public.human_echanges_bons WHERE preneur_id = p_preneur AND mode = 'credits' AND statut IN ('reserve', 'utilise');
    v_peut := public.echanges_equipe(p_preneur) * greatest(p_par_personne, 0) + v_gagne - v_pris;
    IF v_peut < o_fourn.prix THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', o_fourn.prix - greatest(v_peut, 0));
    END IF;
  ELSE
    -- UNE SEULE FOIS À MOITIÉ PRIX PAR MOIS CHEZ CE COMMERÇANT.
    SELECT count(*) INTO v_deja
      FROM public.human_echanges_bons
     WHERE preneur_id = p_preneur AND fournisseur_id = p_fournisseur AND mode = 'moitie'
       AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
    IF v_deja > 0 THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'moitie_deja');
    END IF;
  END IF;

  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND pour = 'moi' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
  IF v_ce_mois >= o_fourn.par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet');
  END IF;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, pour, expire_le, membre_id, mode)
  VALUES (p_code, p_preneur, p_fournisseur, o_fourn.titre, o_fourn.prix, o_fourn.photo, o_fourn.du_jour, 'moi', now() + interval '30 days', p_membre, p_mode)
  RETURNING * INTO b;

  RETURN jsonb_build_object('ok', true, 'bon', to_jsonb(b));
END;
$$;

/* LES ANCIENNES, À QUATRE ET CINQ ARGUMENTS : avec ses crédits, par la
   nouvelle — le même compte pour tout le monde, même pour le code d'avant. */
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.echanges_prendre(p_preneur, p_fournisseur, p_code, p_par_personne, NULL::uuid, 'credits');
$$;

CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer, p_membre uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.echanges_prendre(p_preneur, p_fournisseur, p_code, p_par_personne, p_membre, 'credits');
$$;

REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
