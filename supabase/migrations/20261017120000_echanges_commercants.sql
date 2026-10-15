-- L'ÉCHANGE ENTRE COMMERÇANTS — une caisse commune, en vrai.
--
-- « Je prendrais le modèle économique du système 2 et l'interface du
-- système 1. » Chaque commerçant met UN produit à la disposition des autres,
-- à son vrai prix ; il prend ce qu'il veut chez eux avec son solde, sans
-- chercher d'échange réciproque. Les règles, telles qu'elles ont été
-- choisies avec Jean-Philippe :
--
--   1. UN CRÉDIT N'EST GAGNÉ QUE QUAND LE PRODUIT EST VRAIMENT FOURNI : au
--      moment où le commerçant qui fournit valide le code du bon. « Je prends »
--      ne fait que réserver (le montant est bloqué chez celui qui prend).
--   2. UN PLAFOND SELON LA CAPACITÉ : chacun dit combien il peut en offrir par
--      mois (`par_mois`). Personne ne peut lui en prendre plus dans le mois,
--      et son découvert de départ vaut un mois de capacité, plafonné (300 €,
--      passé par la route : `p_decouvert_max`).
--   3. CE QU'ON PREND, ON LE REND, EN PRODUITS. Les euros ne viennent qu'en
--      dernier recours (12 mois, ou départ du réseau) : c'est écrit à l'écran,
--      « à valider » — RIEN ICI NE PRÉLÈVE NI NE FACTURE D'EUROS.
--
-- LE SOLDE N'EST STOCKÉ NULLE PART : il se recalcule depuis les bons.
--   gagné = somme des bons qu'il a FOURNIS et qui ont été validés ;
--   pris  = somme des bons qu'il a PRIS, réservés ou validés ;
--   peut dépenser = découvert + gagné − pris.
-- Rien à désynchroniser, et l'historique complet reste lisible.
--
-- LES BONS NE DISPARAISSENT PAS AVEC UN SITE (ON DELETE RESTRICT) : ce qui a
-- été pris doit rester traçable, même si le commerce quitte ClikMe.
--
-- LUES ET ÉCRITES PAR LE SERVEUR SEULEMENT (clé d'administration) : sécurité
-- au niveau des lignes activée, aucune politique ; la fonction n'est
-- exécutable que par le rôle de service.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle se suffit à
-- elle-même et peut être rejouée. Tant qu'elle ne l'est pas, rien ne casse :
-- la carte « Échanger » reste cachée chez les vrais commerçants.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_echanges_offres (
  site_id uuid PRIMARY KEY REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  titre text NOT NULL CHECK (char_length(titre) BETWEEN 2 AND 80),
  prix integer NOT NULL CHECK (prix BETWEEN 5 AND 2000),
  par_mois integer NOT NULL CHECK (par_mois BETWEEN 1 AND 30),
  du_jour boolean NOT NULL DEFAULT false,
  photo text,
  -- Ce que les autres voient de lui, figé quand il publie (sa fiche peut être
  -- lente à relire ; la liste des offres doit s'afficher d'un coup).
  commerce text NOT NULL,
  metier text NOT NULL DEFAULT '',
  branche text NOT NULL DEFAULT '',
  ville text NOT NULL DEFAULT '',
  ville_slug text NOT NULL DEFAULT '',
  actif boolean NOT NULL DEFAULT true,
  regles_acceptees_le timestamptz NOT NULL DEFAULT now(),
  cree_le timestamptz NOT NULL DEFAULT now(),
  maj_le timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_echanges_offres_actives ON public.human_echanges_offres (actif, ville_slug);

CREATE TABLE IF NOT EXISTS public.human_echanges_bons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  preneur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  fournisseur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  -- Ce qui a été pris, figé au moment de la prise : si le fournisseur change
  -- son offre ensuite, le bon garde ce qui était promis.
  titre text NOT NULL,
  prix integer NOT NULL CHECK (prix > 0),
  photo text,
  du_jour boolean NOT NULL DEFAULT false,
  statut text NOT NULL DEFAULT 'reserve' CHECK (statut IN ('reserve', 'utilise', 'annule')),
  annule_par text CHECK (annule_par IN ('preneur', 'fournisseur')),
  cree_le timestamptz NOT NULL DEFAULT now(),
  utilise_le timestamptz,
  annule_le timestamptz,
  CHECK (preneur_id <> fournisseur_id)
);

CREATE INDEX IF NOT EXISTS human_echanges_bons_preneur ON public.human_echanges_bons (preneur_id, statut);
CREATE INDEX IF NOT EXISTS human_echanges_bons_fournisseur ON public.human_echanges_bons (fournisseur_id, statut, cree_le);

ALTER TABLE public.human_echanges_offres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_echanges_bons ENABLE ROW LEVEL SECURITY;

-- PRENDRE UNE OFFRE, D'UN SEUL TENANT. Deux vérifications qui ne doivent pas
-- se faire doubler par une prise simultanée :
--   · celui qui prend a-t-il encore de quoi dépenser ?
--   · celui qui fournit a-t-il encore de la place ce mois-ci ?
-- Deux verrous (un par commerce, toujours dans le même ordre pour que deux
-- prises croisées ne s'attendent pas l'une l'autre) les rendent sûres.
CREATE OR REPLACE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_decouvert_max integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o_preneur public.human_echanges_offres%ROWTYPE;
  o_fourn public.human_echanges_offres%ROWTYPE;
  v_gagne integer;
  v_pris integer;
  v_peut integer;
  v_ce_mois integer;
  v_debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  b public.human_echanges_bons%ROWTYPE;
BEGIN
  IF p_preneur = p_fournisseur THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'soi');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || least(p_preneur::text, p_fournisseur::text)));
  PERFORM pg_advisory_xact_lock(hashtext('echanges:' || greatest(p_preneur::text, p_fournisseur::text)));

  SELECT * INTO o_preneur FROM public.human_echanges_offres WHERE site_id = p_preneur;
  IF NOT FOUND OR NOT o_preneur.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'sans_offre');
  END IF;

  SELECT * INTO o_fourn FROM public.human_echanges_offres WHERE site_id = p_fournisseur;
  IF NOT FOUND OR NOT o_fourn.actif THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'offre_retiree');
  END IF;

  SELECT coalesce(sum(prix), 0) INTO v_gagne
    FROM public.human_echanges_bons WHERE fournisseur_id = p_preneur AND statut = 'utilise';
  SELECT coalesce(sum(prix), 0) INTO v_pris
    FROM public.human_echanges_bons WHERE preneur_id = p_preneur AND statut IN ('reserve', 'utilise');
  v_peut := least(p_decouvert_max, o_preneur.par_mois * o_preneur.prix) + v_gagne - v_pris;
  IF v_peut < o_fourn.prix THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', o_fourn.prix - greatest(v_peut, 0));
  END IF;

  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND statut <> 'annule' AND cree_le >= v_debut_mois;
  IF v_ce_mois >= o_fourn.par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet');
  END IF;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour)
  VALUES (p_code, p_preneur, p_fournisseur, o_fourn.titre, o_fourn.prix, o_fourn.photo, o_fourn.du_jour)
  RETURNING * INTO b;

  RETURN jsonb_build_object('ok', true, 'bon', to_jsonb(b));
END;
$$;

REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
