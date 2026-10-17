-- LA FACTURE D'ÉCHANGE — une par bon validé.
--
-- « On peut générer une facture d'échange pour chaque bon validé, ensuite ce
-- sera à eux de la déclarer ou pas. »
--
-- UN BON VALIDÉ EST UNE VENTE : celui qui a fourni son produit (le
-- fournisseur) l'a vendu, à son prix public, au commerce qui l'a pris (le
-- preneur), et il a été payé par échange — en produits, dans le réseau. La
-- facture va donc du fournisseur au preneur.
--
-- CE QUI EST ICI :
--   1. SES INFOS DE FACTURATION (`human_echanges_facturation`), données une
--      seule fois, la première fois qu'un bon est validé chez lui : nom
--      légal, forme, adresse, SIRET, TVA (ou franchise), et son accord pour
--      que ClikMe prépare ses factures d'échange en son nom (`mandat_le`).
--   2. LES FACTURES (`human_echanges_factures`) : une par bon, figées dès
--      qu'elles existent (ni modifiées ni effacées — un déclencheur l'interdit),
--      avec tout ce qu'elles disent recopié dans `contenu`, tel qu'au jour où
--      elles ont été faites.
--   3. LEUR NUMÉRO (`echanges_facturer`) : une série à part pour chaque
--      fournisseur, chronologique et sans trou, ECH-2026-0001, ECH-2026-0002…
--      Un verrou par fournisseur : deux validations en même temps ne prennent
--      jamais le même numéro.
--
-- C'EST LE SERVEUR QUI ÉCRIT LE CONTENU (montants, nom, adresse : voir la
-- route des échanges) ; la fonction vérifie qu'il s'agit bien d'un bon validé
-- chez ce fournisseur, à ce prix, et qu'il n'a pas encore de facture.
--
-- COMPATIBLE AVEC LE CODE DÉJÀ EN LIGNE : rien d'existant ne change. On peut
-- l'appliquer avant de mettre le nouveau code en ligne.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261020120000_echanges_equipe.sql`. Elle peut être rejouée.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_echanges_facturation (
  site_id uuid PRIMARY KEY REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  nom_legal text NOT NULL CHECK (char_length(nom_legal) BETWEEN 2 AND 120),
  -- « EI », « SARL », « SAS »… et, pour une société, son capital.
  forme text NOT NULL CHECK (char_length(forme) BETWEEN 2 AND 40),
  capital text CHECK (capital IS NULL OR char_length(capital) <= 40),
  -- « RCS Dax », « RM 40 »…
  immatriculation text CHECK (immatriculation IS NULL OR char_length(immatriculation) <= 60),
  adresse text NOT NULL CHECK (char_length(adresse) BETWEEN 5 AND 200),
  siret text NOT NULL CHECK (siret ~ '^[0-9]{14}$'),
  tva_intra text CHECK (tva_intra IS NULL OR tva_intra ~ '^FR[0-9A-Z]{2}[0-9]{9}$'),
  -- Franchise en base : pas de TVA (« TVA non applicable, art. 293 B du CGI »).
  franchise boolean NOT NULL DEFAULT false,
  taux numeric(4, 2) CHECK (taux IS NULL OR taux IN (20, 10, 5.5, 2.1)),
  nature text NOT NULL DEFAULT 'biens' CHECK (nature IN ('biens', 'services', 'mixte')),
  -- Son accord : ClikMe prépare en son nom les factures de ses bons validés.
  mandat_le timestamptz NOT NULL,
  maj_le timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT human_echanges_facturation_tva_check CHECK (
    (franchise IS TRUE AND taux IS NULL) OR (franchise IS FALSE AND taux IS NOT NULL)
  )
);
ALTER TABLE public.human_echanges_facturation ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.human_echanges_factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bon_id uuid NOT NULL UNIQUE REFERENCES public.human_echanges_bons(id) ON DELETE RESTRICT,
  fournisseur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  preneur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  annee integer NOT NULL CHECK (annee BETWEEN 2026 AND 2200),
  rang integer NOT NULL CHECK (rang > 0),
  numero text NOT NULL,
  -- Le lien de la facture (`/facture/<jeton>`), qu'on peut donner à son comptable. Secret.
  jeton text NOT NULL UNIQUE CHECK (char_length(jeton) >= 32),
  emise_le timestamptz NOT NULL DEFAULT now(),
  -- Le jour où le produit a été remis : celui de la validation du bon.
  livree_le timestamptz NOT NULL,
  ttc integer NOT NULL CHECK (ttc > 0),
  ht numeric(10, 2) NOT NULL CHECK (ht > 0),
  tva numeric(10, 2) NOT NULL CHECK (tva >= 0),
  taux numeric(4, 2),
  -- Tout ce que dit la facture, recopié le jour où elle est faite : vendeur, acheteur, ligne.
  contenu jsonb NOT NULL,
  CONSTRAINT human_echanges_factures_montants CHECK (ht + tva = ttc),
  CONSTRAINT human_echanges_factures_rang UNIQUE (fournisseur_id, annee, rang),
  CONSTRAINT human_echanges_factures_numero UNIQUE (fournisseur_id, numero)
);
CREATE INDEX IF NOT EXISTS human_echanges_factures_preneur ON public.human_echanges_factures (preneur_id, emise_le);
ALTER TABLE public.human_echanges_factures ENABLE ROW LEVEL SECURITY;

/* UNE FACTURE ÉMISE NE CHANGE PLUS : ni modifiée, ni effacée. */
CREATE OR REPLACE FUNCTION public.human_echanges_factures_figee()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Une facture émise ne se modifie pas et ne s''efface pas.';
END;
$$;
DROP TRIGGER IF EXISTS human_echanges_factures_figee ON public.human_echanges_factures;
CREATE TRIGGER human_echanges_factures_figee
  BEFORE UPDATE OR DELETE ON public.human_echanges_factures
  FOR EACH ROW EXECUTE FUNCTION public.human_echanges_factures_figee();

/* FAIRE LES FACTURES D'UN FOURNISSEUR. `p_lignes` : [{ bon, ttc, ht, tva, taux, contenu }],
   écrites par le serveur. Renvoie le nombre de factures faites. */
CREATE OR REPLACE FUNCTION public.echanges_facturer(p_fournisseur uuid, p_lignes jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l jsonb;
  b public.human_echanges_bons%ROWTYPE;
  v_annee integer;
  v_rang integer;
  v_n integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('echanges_facturer'), hashtext(p_fournisseur::text));
  -- Sans ses infos ni son accord, pas de facture en son nom.
  IF NOT EXISTS (SELECT 1 FROM public.human_echanges_facturation WHERE site_id = p_fournisseur) THEN
    RETURN 0;
  END IF;
  v_annee := extract(year FROM (now() AT TIME ZONE 'Europe/Paris'))::integer;

  -- DANS L'ORDRE OÙ LES PRODUITS ONT ÉTÉ REMIS : la série suit la chronologie.
  FOR l IN
    SELECT x FROM jsonb_array_elements(coalesce(p_lignes, '[]'::jsonb)) AS x
     ORDER BY (SELECT utilise_le FROM public.human_echanges_bons WHERE id = (x->>'bon')::uuid), x->>'bon'
  LOOP
    SELECT * INTO b FROM public.human_echanges_bons WHERE id = (l->>'bon')::uuid;
    CONTINUE WHEN b.id IS NULL OR b.fournisseur_id <> p_fournisseur OR b.statut <> 'utilise';
    CONTINUE WHEN (l->>'ttc')::integer IS DISTINCT FROM b.prix;
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
      b.prix, (l->>'ht')::numeric, (l->>'tva')::numeric, nullif(l->>'taux', '')::numeric,
      coalesce(l->'contenu', '{}'::jsonb)
    );
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.echanges_facturer(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_facturer(uuid, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_facturer(uuid, jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.human_echanges_factures_figee() FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
