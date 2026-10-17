-- « 3 OFFRES MAX ET LIMITE PAR OFFRE » — un commerçant propose jusqu'à trois
-- produits ou services, et choisit pour chacun comment on peut le lui payer.
--
-- « Il y a des choses que je peux échanger et d'autres que je peux seulement
-- vendre, ou les deux. »
--
-- CE QUI CHANGE :
--   1. CHAQUE OFFRE DIT COMMENT ON LA PAIE (`paiement`) : 'les_deux' (avec ses
--      crédits ou à moitié prix — comme avant, et par défaut), 'credits' (en
--      échange seulement) ou 'moitie' (à moitié prix seulement).
--   2. DEUX OFFRES DE PLUS, AU PLUS (`human_echanges_offres_autres`, rang 2 et
--      3). La première reste dans `human_echanges_offres` : c'est elle qui dit
--      qui il est, sa ville, et si tout est en pause (`actif`). Une offre de
--      plus se retire (`actif` = false), elle ne s'efface pas : les bons déjà
--      pris dessus la gardent.
--   3. CHAQUE OFFRE A SA LIMITE (« combien par mois ») : un bon dit sur quelle
--      offre il a été pris (`offre_id`, vide pour la première), et seuls les
--      bons de cette offre comptent dans sa limite.
--   CE QUI NE CHANGE PAS : son compte (50 € d'avance par personne de l'équipe),
--   les 50 € du mois d'un membre, et une seule fois à moitié prix par mois chez
--   un même commerçant, toutes ses offres confondues.
--
-- COMPATIBLE AVEC LE CODE DÉJÀ EN LIGNE : `echanges_prendre` à six arguments
-- reste, et passe par la nouvelle (sept arguments, `p_offre`) en prenant la
-- première offre. On peut donc appliquer cette migration AVANT de mettre le
-- nouveau code en ligne, sans rien casser.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261022130000_echanges_moitie_prix.sql`. Elle peut être rejouée.

BEGIN;

ALTER TABLE public.human_echanges_offres ADD COLUMN IF NOT EXISTS paiement text NOT NULL DEFAULT 'les_deux';
ALTER TABLE public.human_echanges_offres DROP CONSTRAINT IF EXISTS human_echanges_offres_paiement_check;
ALTER TABLE public.human_echanges_offres ADD CONSTRAINT human_echanges_offres_paiement_check CHECK (paiement IN ('les_deux', 'credits', 'moitie'));

CREATE TABLE IF NOT EXISTS public.human_echanges_offres_autres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_echanges_offres(site_id) ON DELETE CASCADE,
  rang smallint NOT NULL CHECK (rang IN (2, 3)),
  titre text NOT NULL CHECK (char_length(titre) BETWEEN 2 AND 80),
  prix integer NOT NULL CHECK (prix BETWEEN 5 AND 2000),
  par_mois integer NOT NULL CHECK (par_mois BETWEEN 1 AND 30),
  photo text,
  paiement text NOT NULL DEFAULT 'les_deux' CHECK (paiement IN ('les_deux', 'credits', 'moitie')),
  actif boolean NOT NULL DEFAULT true,
  cree_le timestamptz NOT NULL DEFAULT now(),
  maj_le timestamptz NOT NULL DEFAULT now()
);

-- TROIS OFFRES AU PLUS : la première, et une seule offre active par rang (2 ou 3).
CREATE UNIQUE INDEX IF NOT EXISTS human_echanges_offres_autres_rang ON public.human_echanges_offres_autres (site_id, rang) WHERE actif;
ALTER TABLE public.human_echanges_offres_autres ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS offre_id uuid REFERENCES public.human_echanges_offres_autres(id) ON DELETE SET NULL;

/* ── PRENDRE UNE DE SES OFFRES ─────────────────────────────────────────────
   Comme avant (deux verrous, d'un seul tenant), mais sur l'offre choisie :
   son prix, sa façon de payer, sa limite du mois. `p_offre` vide : la
   première. */
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer, p_membre uuid, p_mode text, p_offre uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o_preneur public.human_echanges_offres%ROWTYPE;
  o_fourn public.human_echanges_offres%ROWTYPE;
  a public.human_echanges_offres_autres%ROWTYPE;
  m public.human_echanges_membres%ROWTYPE;
  v_titre text;
  v_prix integer;
  v_photo text;
  v_du_jour boolean;
  v_par_mois integer;
  v_paiement text;
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

  -- SA PREMIÈRE OFFRE DIT S'IL EST LÀ : en pause, toutes ses offres le sont.
  SELECT * INTO o_fourn FROM public.human_echanges_offres WHERE site_id = p_fournisseur;
  IF NOT FOUND OR NOT o_fourn.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'offre_retiree');
  END IF;

  IF p_offre IS NULL THEN
    v_titre := o_fourn.titre; v_prix := o_fourn.prix; v_photo := o_fourn.photo; v_du_jour := o_fourn.du_jour;
    v_par_mois := o_fourn.par_mois; v_paiement := o_fourn.paiement;
  ELSE
    SELECT * INTO a FROM public.human_echanges_offres_autres WHERE id = p_offre;
    IF NOT FOUND OR a.site_id <> p_fournisseur OR NOT a.actif THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'offre_retiree');
    END IF;
    v_titre := a.titre; v_prix := a.prix; v_photo := a.photo; v_du_jour := false;
    v_par_mois := a.par_mois; v_paiement := a.paiement;
  END IF;

  -- COMMENT IL ACCEPTE QU'ON LA LUI PAIE.
  IF v_paiement <> 'les_deux' AND v_paiement <> p_mode THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'paiement', 'paiement', v_paiement);
  END IF;

  IF p_mode = 'credits' THEN
    -- SES 50 € DU MOIS, À LUI (ce qu'il a pris avec des crédits).
    IF p_membre IS NOT NULL THEN
      SELECT coalesce(sum(prix), 0) INTO v_lui
        FROM public.human_echanges_bons
       WHERE membre_id = p_membre AND mode = 'credits' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
      IF v_lui + v_prix > greatest(p_par_personne, 0) THEN
        RETURN jsonb_build_object('ok', false, 'raison', 'plafond_perso', 'reste', greatest(greatest(p_par_personne, 0) - v_lui, 0));
      END IF;
    END IF;

    -- LE COMPTE DU COMMERCE : ce qu'il a gagné (à moitié prix, la moitié en crédits), moins ce qu'il a pris avec ses crédits.
    SELECT coalesce(sum(credits), 0) INTO v_gagne
      FROM public.human_echanges_bons WHERE fournisseur_id = p_preneur AND statut = 'utilise';
    SELECT coalesce(sum(prix), 0) INTO v_pris
      FROM public.human_echanges_bons WHERE preneur_id = p_preneur AND mode = 'credits' AND statut IN ('reserve', 'utilise');
    v_peut := public.echanges_equipe(p_preneur) * greatest(p_par_personne, 0) + v_gagne - v_pris;
    IF v_peut < v_prix THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', v_prix - greatest(v_peut, 0));
    END IF;
  ELSE
    -- UNE SEULE FOIS À MOITIÉ PRIX PAR MOIS CHEZ CE COMMERÇANT, toutes ses offres confondues.
    SELECT count(*) INTO v_deja
      FROM public.human_echanges_bons
     WHERE preneur_id = p_preneur AND fournisseur_id = p_fournisseur AND mode = 'moitie'
       AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
    IF v_deja > 0 THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'moitie_deja');
    END IF;
  END IF;

  -- LA LIMITE DE CETTE OFFRE : seuls ses bons à elle comptent.
  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND pour = 'moi' AND offre_id IS NOT DISTINCT FROM p_offre
     AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
  IF v_ce_mois >= v_par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet');
  END IF;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, pour, expire_le, membre_id, mode, offre_id)
  VALUES (p_code, p_preneur, p_fournisseur, v_titre, v_prix, v_photo, v_du_jour, 'moi', now() + interval '30 days', p_membre, p_mode, p_offre)
  RETURNING * INTO b;

  RETURN jsonb_build_object('ok', true, 'bon', to_jsonb(b));
END;
$$;

/* L'ANCIENNE, À SIX ARGUMENTS (et par elle, celles à quatre et cinq) : la
   première offre, par la nouvelle. */
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer, p_membre uuid, p_mode text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.echanges_prendre(p_preneur, p_fournisseur, p_code, p_par_personne, p_membre, p_mode, NULL::uuid);
$$;

REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
