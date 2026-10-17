-- L'ÉQUIPE DU COMMERÇANT — un compte par personne, plus de « on est 5 » déclaré.
--
-- « Si la personne dit à l'étape 2 "on est 5", les 5 utilisent le même compte :
-- ça fait un peu fictif, et il peut mentir. Il faudrait que chacun ait son
-- compte […] le commerçant de départ recevra toutes les transactions et ce
-- qu'il doit. »
--
-- CE QUI CHANGE :
--   1. LE RESPONSABLE (celui du lien pro) INVITE SON ÉQUIPE : un prénom, et un
--      lien personnel (`jeton`) qu'il envoie par SON WhatsApp. La personne est
--      comptée dès qu'elle a ouvert son lien (`active_le`), plus du tout dès
--      qu'il la retire (`retire_le`). Quatre personnes au plus, cinq avec lui.
--   2. L'AVANCE DU COMMERCE : 50 € × (1 + son équipe active), au lieu de la
--      colonne `equipe` déclarée à la main (elle n'est plus lue).
--   3. CHAQUE MEMBRE A SES 50 € PAR MOIS, rien qu'à lui : ce qu'il prend dans
--      le mois ne dépasse jamais 50 €. Le responsable, lui, dépense le compte
--      du commerce (ce qu'il a gagné compris).
--   4. LA DETTE RESTE CELLE DU COMMERCE : c'est la boutique qui rend, en ses
--      produits. Chaque bon dit qui l'a pris (`membre_id`, vide = le
--      responsable) et qui l'a validé au comptoir (`valide_par`).
--
-- COMPATIBLE AVEC LE CODE DÉJÀ EN LIGNE : `echanges_prendre` à quatre
-- arguments n'est pas retirée ; la nouvelle a un cinquième argument
-- (`p_membre`), et PostgREST choisit l'une ou l'autre d'après les noms reçus.
-- On peut donc appliquer cette migration AVANT de mettre le nouveau code en
-- ligne, sans rien casser.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261019120000_echanges_reseau.sql`. Elle peut être rejouée.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_echanges_membres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  prenom text NOT NULL CHECK (char_length(prenom) BETWEEN 1 AND 40),
  -- Son accès personnel : le lien qu'il reçoit (`/e/<jeton>`). Secret.
  jeton text NOT NULL UNIQUE CHECK (char_length(jeton) >= 24),
  cree_le timestamptz NOT NULL DEFAULT now(),
  -- Ouvert une première fois : il compte dans l'équipe.
  active_le timestamptz,
  -- Retiré par le responsable : son lien ne marche plus, ce qu'il a pris reste dû.
  retire_le timestamptz
);
CREATE INDEX IF NOT EXISTS human_echanges_membres_site ON public.human_echanges_membres (site_id);
ALTER TABLE public.human_echanges_membres ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS membre_id uuid REFERENCES public.human_echanges_membres(id) ON DELETE RESTRICT;
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS valide_par uuid REFERENCES public.human_echanges_membres(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS human_echanges_bons_membre ON public.human_echanges_bons (membre_id, cree_le);

/* L'ÉQUIPE QUI COMPTE : le responsable, et ceux qui ont ouvert leur lien sans avoir été retirés (cinq au plus). */
CREATE OR REPLACE FUNCTION public.echanges_equipe(p_site uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT least(5, 1 + count(*)::integer)
    FROM public.human_echanges_membres
   WHERE site_id = p_site AND active_le IS NOT NULL AND retire_le IS NULL;
$$;

/* ── PRENDRE POUR SOI, PAR LE RESPONSABLE OU UN MEMBRE ─────────────────────
   Comme avant, d'un seul tenant et sous deux verrous ; l'avance du commerce
   vient de son équipe active ; un membre ne dépasse pas ses 50 € du mois. */
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer, p_membre uuid)
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
  v_debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  b public.human_echanges_bons%ROWTYPE;
BEGIN
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

  -- SES 50 € DU MOIS, À LUI.
  IF p_membre IS NOT NULL THEN
    SELECT coalesce(sum(prix), 0) INTO v_lui
      FROM public.human_echanges_bons
     WHERE membre_id = p_membre AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
    IF v_lui + o_fourn.prix > greatest(p_par_personne, 0) THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'plafond_perso', 'reste', greatest(greatest(p_par_personne, 0) - v_lui, 0));
    END IF;
  END IF;

  -- LE COMPTE DU COMMERCE.
  SELECT coalesce(sum(prix), 0) INTO v_gagne
    FROM public.human_echanges_bons WHERE fournisseur_id = p_preneur AND statut = 'utilise';
  SELECT coalesce(sum(prix), 0) INTO v_pris
    FROM public.human_echanges_bons WHERE preneur_id = p_preneur AND statut IN ('reserve', 'utilise');
  v_peut := public.echanges_equipe(p_preneur) * greatest(p_par_personne, 0) + v_gagne - v_pris;
  IF v_peut < o_fourn.prix THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', o_fourn.prix - greatest(v_peut, 0));
  END IF;

  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND pour = 'moi' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
  IF v_ce_mois >= o_fourn.par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet');
  END IF;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, pour, expire_le, membre_id)
  VALUES (p_code, p_preneur, p_fournisseur, o_fourn.titre, o_fourn.prix, o_fourn.photo, o_fourn.du_jour, 'moi', now() + interval '30 days', p_membre)
  RETURNING * INTO b;

  RETURN jsonb_build_object('ok', true, 'bon', to_jsonb(b));
END;
$$;

/* ── OFFRIR À SES CLIENTS : la même fonction, l'avance vient de l'équipe active ── */
CREATE OR REPLACE FUNCTION public.echanges_offrir(
  p_donneur uuid,
  p_fournisseur uuid,
  p_quantite integer,
  p_occasion text,
  p_codes text[],
  p_par_personne integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o_donneur public.human_echanges_offres%ROWTYPE;
  o_fourn public.human_echanges_offres%ROWTYPE;
  v_gagne integer;
  v_pris integer;
  v_peut integer;
  v_total integer;
  v_ce_mois integer;
  v_debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  c public.human_echanges_cadeaux%ROWTYPE;
BEGIN
  IF p_donneur = p_fournisseur THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'soi');
  END IF;
  IF p_quantite IS NULL OR p_quantite < 1 OR p_quantite > 60 OR coalesce(array_length(p_codes, 1), 0) < p_quantite THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'quantite');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || least(p_donneur::text, p_fournisseur::text)));
  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || greatest(p_donneur::text, p_fournisseur::text)));
  PERFORM public.echanges_expirer();

  SELECT * INTO o_donneur FROM public.human_echanges_offres WHERE site_id = p_donneur;
  IF NOT FOUND OR NOT o_donneur.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'sans_offre');
  END IF;

  SELECT * INTO o_fourn FROM public.human_echanges_offres WHERE site_id = p_fournisseur;
  IF NOT FOUND OR NOT o_fourn.actif OR o_fourn.cadeau_titre IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'offre_retiree');
  END IF;

  v_total := p_quantite * o_fourn.cadeau_prix;
  SELECT coalesce(sum(prix), 0) INTO v_gagne
    FROM public.human_echanges_bons WHERE fournisseur_id = p_donneur AND statut = 'utilise';
  SELECT coalesce(sum(prix), 0) INTO v_pris
    FROM public.human_echanges_bons WHERE preneur_id = p_donneur AND statut IN ('reserve', 'utilise');
  v_peut := public.echanges_equipe(p_donneur) * greatest(p_par_personne, 0) + v_gagne - v_pris;
  IF v_peut < v_total THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', v_total - greatest(v_peut, 0));
  END IF;

  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND pour = 'client' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
  IF v_ce_mois + p_quantite > o_fourn.cadeau_par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet', 'restant', greatest(o_fourn.cadeau_par_mois - v_ce_mois, 0));
  END IF;

  INSERT INTO public.human_echanges_cadeaux (donneur_id, fournisseur_id, titre, prix, photo, occasion, quantite)
  VALUES (p_donneur, p_fournisseur, o_fourn.cadeau_titre, o_fourn.cadeau_prix, o_fourn.photo, left(coalesce(p_occasion, ''), 80), p_quantite)
  RETURNING * INTO c;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, pour, cadeau_id, expire_le)
  SELECT p_codes[i], p_donneur, p_fournisseur, c.titre, c.prix, c.photo, false, 'client', c.id, now() + interval '30 days'
    FROM generate_series(1, p_quantite) AS i;

  RETURN jsonb_build_object('ok', true, 'cadeau', to_jsonb(c));
END;
$$;

REVOKE ALL ON FUNCTION public.echanges_equipe(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_equipe(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_equipe(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
