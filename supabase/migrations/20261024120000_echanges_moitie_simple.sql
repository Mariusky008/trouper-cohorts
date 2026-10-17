-- « À MOITIÉ PRIX, C'EST TOUT » — une vente en euros, sans aucun crédit.
--
-- « Quand un commerçant met son annonce à moitié prix, les gens intéressés
-- peuvent l'acheter à moitié prix, et il n'y a pas de crédits en question
-- d'une part ou de l'autre. Le commerçant veut juste se débarrasser de son
-- stock et fait une moitié de prix aux autres commerçants, c'est tout. »
--
-- CE QUI CHANGE (après `20261022130000_echanges_moitie_prix.sql` et
-- `20261023120000_echanges_offres.sql`) :
--   1. LE VENDEUR NE GAGNE PLUS DE CRÉDITS à moitié prix : il encaisse la
--      moitié en euros, sur place, et c'est tout (`credits` = 0). Avant, il
--      gagnait l'autre moitié en crédits que personne n'avait payés.
--   2. PLUS DE « UNE FOIS PAR MOIS CHEZ UN MÊME COMMERÇANT » : cette règle
--      n'existait que pour empêcher de fabriquer ces crédits. C'est la limite
--      de l'offre (« combien par mois ») qui dit combien il en vend.
--   3. LA FACTURE D'UN BON À MOITIÉ PRIX est du montant payé (la moitié), en
--      euros : `human_echanges_factures.ttc` passe en centimes près
--      (22,50 €), et `echanges_facturer` attend ce montant-là.
--   CE QUI NE CHANGE PAS : l'acheteur ne touche pas à ses crédits ni aux 50 €
--   du mois d'un membre ; « comment on la paie » choisi par offre ; pas de
--   moitié prix chez une librairie.
--
-- COMPATIBLE AVEC LE CODE DÉJÀ EN LIGNE. APPLIQUER À LA MAIN DANS L'ÉDITEUR
-- SQL DE SUPABASE, APRÈS `20261023120000_echanges_offres.sql`. Elle peut être
-- rejouée.

BEGIN;

-- 1. Ce que le vendeur gagne en crédits : rien à moitié prix.
ALTER TABLE public.human_echanges_bons DROP COLUMN IF EXISTS credits;
ALTER TABLE public.human_echanges_bons ADD COLUMN credits integer
  GENERATED ALWAYS AS (CASE WHEN mode = 'moitie' THEN 0 ELSE prix END) STORED;

-- 3. Une facture peut être de 22,50 € (la moitié de 45 €).
ALTER TABLE public.human_echanges_factures ALTER COLUMN ttc TYPE numeric(10, 2);

/* ── PRENDRE UNE DE SES OFFRES ─────────────────────────────────────────────
   Comme dans `20261023120000_echanges_offres.sql`, sans la règle « une fois
   par mois à moitié prix », et le compte du commerce ne compte que ce qui a
   été payé en crédits, d'un côté comme de l'autre. */
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

  -- AVEC SES CRÉDITS SEULEMENT : ses 50 € du mois, puis le compte du commerce.
  -- À moitié prix, il paie en euros, sur place : ni l'un ni l'autre ne bouge.
  IF p_mode = 'credits' THEN
    IF p_membre IS NOT NULL THEN
      SELECT coalesce(sum(prix), 0) INTO v_lui
        FROM public.human_echanges_bons
       WHERE membre_id = p_membre AND mode = 'credits' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
      IF v_lui + v_prix > greatest(p_par_personne, 0) THEN
        RETURN jsonb_build_object('ok', false, 'raison', 'plafond_perso', 'reste', greatest(greatest(p_par_personne, 0) - v_lui, 0));
      END IF;
    END IF;

    -- CE QU'IL A GAGNÉ EN CRÉDITS (une vente à moitié prix n'en rapporte aucun), moins ce qu'il a pris en crédits.
    SELECT coalesce(sum(prix), 0) INTO v_gagne
      FROM public.human_echanges_bons WHERE fournisseur_id = p_preneur AND mode = 'credits' AND statut = 'utilise';
    SELECT coalesce(sum(prix), 0) INTO v_pris
      FROM public.human_echanges_bons WHERE preneur_id = p_preneur AND mode = 'credits' AND statut IN ('reserve', 'utilise');
    v_peut := public.echanges_equipe(p_preneur) * greatest(p_par_personne, 0) + v_gagne - v_pris;
    IF v_peut < v_prix THEN
      RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', v_prix - greatest(v_peut, 0));
    END IF;
  END IF;

  -- LA LIMITE DE CETTE OFFRE : seuls ses bons à elle comptent, payés d'une façon ou de l'autre.
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

/* ── LES FACTURES : celle d'un bon à moitié prix est du montant payé ───────
   Comme dans `20261021120000_echanges_factures.sql` ; le montant attendu est
   le prix du bon, ou sa moitié s'il a été payé à moitié prix. */
CREATE OR REPLACE FUNCTION public.echanges_facturer(p_fournisseur uuid, p_lignes jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l jsonb;
  b public.human_echanges_bons%ROWTYPE;
  v_ttc numeric(10, 2);
  v_annee integer;
  v_rang integer;
  v_n integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('echanges_facturer'), hashtext(p_fournisseur::text));
  IF NOT EXISTS (SELECT 1 FROM public.human_echanges_facturation WHERE site_id = p_fournisseur) THEN
    RETURN 0;
  END IF;
  v_annee := extract(year FROM (now() AT TIME ZONE 'Europe/Paris'))::integer;

  FOR l IN
    SELECT x FROM jsonb_array_elements(coalesce(p_lignes, '[]'::jsonb)) AS x
     ORDER BY (SELECT utilise_le FROM public.human_echanges_bons WHERE id = (x->>'bon')::uuid), x->>'bon'
  LOOP
    SELECT * INTO b FROM public.human_echanges_bons WHERE id = (l->>'bon')::uuid;
    CONTINUE WHEN b.id IS NULL OR b.fournisseur_id <> p_fournisseur OR b.statut <> 'utilise';
    v_ttc := CASE WHEN b.mode = 'moitie' THEN b.a_regler ELSE b.prix END;
    CONTINUE WHEN (l->>'ttc')::numeric IS DISTINCT FROM v_ttc;
    CONTINUE WHEN EXISTS (SELECT 1 FROM public.human_echanges_factures WHERE bon_id = b.id);

    SELECT coalesce(max(rang), 0) + 1 INTO v_rang
      FROM public.human_echanges_factures WHERE fournisseur_id = p_fournisseur AND annee = v_annee;
    INSERT INTO public.human_echanges_factures
      (bon_id, fournisseur_id, preneur_id, annee, rang, numero, jeton, livree_le, ttc, ht, tva, taux, contenu)
    VALUES (
      b.id, p_fournisseur, b.preneur_id, v_annee, v_rang,
      'ECH-' || v_annee || '-' || lpad(v_rang::text, greatest(4, length(v_rang::text)), '0'),
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      coalesce(b.utilise_le, now()),
      v_ttc, (l->>'ht')::numeric, (l->>'tva')::numeric, nullif(l->>'taux', '')::numeric,
      coalesce(l->'contenu', '{}'::jsonb)
    );
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer, uuid, text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_facturer(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_facturer(uuid, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_facturer(uuid, jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
