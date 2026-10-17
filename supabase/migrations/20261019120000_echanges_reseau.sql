-- LE RÉSEAU DES COMMERÇANTS — sans euros, 50 € par mois et par personne, et
-- « le cadeau du voisin ».
--
-- Ce qui change par rapport à `20261017120000_echanges_commercants.sql`, tel
-- que décidé avec le fondateur :
--
--   1. PLUS JAMAIS D'EUROS. « Il faut oublier cette histoire d'euros. » Ce
--      qu'on prend se rend en produits, et seulement en produits. La seule
--      sanction : tant qu'il doit au-delà de son découvert, il ne peut plus
--      prendre ; il doit d'abord servir.
--   2. LE DÉCOUVERT : 50 € PAR PERSONNE DE L'ÉQUIPE (le patron et ses
--      associés, 5 au plus), au lieu d'« un mois de capacité, plafonné à
--      300 € ». Il ne s'accumule pas : jamais plus de 50 € par personne
--      d'avance. Le montant par personne est passé par la route
--      (`p_par_personne`, voir `PAR_PERSONNE` dans `lib/echanges/echanges.ts`).
--   3. UN BON RÉSERVÉ EXPIRE AU BOUT DE 30 JOURS (`expire_le`) : il passe
--      « expire », le montant revient à celui qui l'avait pris, et il ne se
--      valide plus.
--   4. LE CADEAU DU VOISIN. Un commerçant offre à SES clients un petit
--      cadeau chez un autre commerçant (« pour toute coloration, ton dessert
--      offert chez Bergine »), payé avec son solde. Chaque commerçant dit ce
--      qu'il accepte d'être offert (`cadeau_titre`, `cadeau_prix`) et combien
--      de fois par mois (`cadeau_par_mois`). Un lot de cadeaux est une ligne
--      de `human_echanges_cadeaux` et autant de bons `pour = 'client'` :
--      celui qui offre est le « preneur » de ces bons, celui qui sert le
--      « fournisseur » — le solde se calcule exactement comme avant.
--      `donne_le` : le bon a été remis à un client. `venus` : combien de
--      personnes sont venues avec ce bon (« venu à 3 »), tapé au scan.
--
-- Ce qui ne change pas : aucun solde stocké (il se recalcule depuis les
-- bons), tables sous sécurité des lignes sans politique, fonctions
-- exécutables par le seul rôle de service.
--
-- Ce qui n'est PAS ici : le seuil d'ouverture d'une ville (12 commerçants),
-- tenu par la route (`ECHANGES_SEUIL_VILLE`).
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261017120000_echanges_commercants.sql`. Elle peut être rejouée. Tant
-- qu'elle ne l'est pas, rien ne casse : l'écran de l'échange dit « bientôt
-- disponible » (la route ne trouve pas `echanges_expirer`).

BEGIN;

/* ── 1. L'OFFRE : l'équipe, et le cadeau qu'il accepte d'être offert ─────── */
ALTER TABLE public.human_echanges_offres ADD COLUMN IF NOT EXISTS equipe integer NOT NULL DEFAULT 1;
ALTER TABLE public.human_echanges_offres ADD COLUMN IF NOT EXISTS cadeau_titre text;
ALTER TABLE public.human_echanges_offres ADD COLUMN IF NOT EXISTS cadeau_prix integer;
ALTER TABLE public.human_echanges_offres ADD COLUMN IF NOT EXISTS cadeau_par_mois integer;

ALTER TABLE public.human_echanges_offres DROP CONSTRAINT IF EXISTS human_echanges_offres_equipe_check;
ALTER TABLE public.human_echanges_offres ADD CONSTRAINT human_echanges_offres_equipe_check CHECK (equipe BETWEEN 1 AND 5);
ALTER TABLE public.human_echanges_offres DROP CONSTRAINT IF EXISTS human_echanges_offres_cadeau_check;
-- TOUT OU RIEN. Les `IS NOT NULL` ne sont pas décoratifs : sans eux, un
-- cadeau sans prix rendrait la condition NULL — et un CHECK laisse passer NULL.
ALTER TABLE public.human_echanges_offres ADD CONSTRAINT human_echanges_offres_cadeau_check CHECK (
  (cadeau_titre IS NULL AND cadeau_prix IS NULL AND cadeau_par_mois IS NULL)
  OR (
    cadeau_titre IS NOT NULL AND cadeau_prix IS NOT NULL AND cadeau_par_mois IS NOT NULL
    AND char_length(cadeau_titre) BETWEEN 2 AND 60 AND cadeau_prix BETWEEN 2 AND 60 AND cadeau_par_mois BETWEEN 1 AND 60
  )
);

/* ── 2. LES LOTS DE CADEAUX ───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.human_echanges_cadeaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donneur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  fournisseur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  -- Ce qui est offert, figé au moment de l'offre (comme un bon).
  titre text NOT NULL,
  prix integer NOT NULL CHECK (prix > 0),
  photo text,
  -- « pour toute coloration » : l'argument de celui qui offre, dit à ses clients.
  occasion text NOT NULL DEFAULT '' CHECK (char_length(occasion) <= 80),
  quantite integer NOT NULL CHECK (quantite BETWEEN 1 AND 60),
  cree_le timestamptz NOT NULL DEFAULT now(),
  CHECK (donneur_id <> fournisseur_id)
);
CREATE INDEX IF NOT EXISTS human_echanges_cadeaux_donneur ON public.human_echanges_cadeaux (donneur_id, cree_le);
ALTER TABLE public.human_echanges_cadeaux ENABLE ROW LEVEL SECURITY;

/* ── 3. LES BONS : pour qui, quel lot, remis, venus, expiration ──────────── */
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS pour text NOT NULL DEFAULT 'moi';
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS cadeau_id uuid REFERENCES public.human_echanges_cadeaux(id) ON DELETE RESTRICT;
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS donne_le timestamptz;
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS venus smallint;
ALTER TABLE public.human_echanges_bons ADD COLUMN IF NOT EXISTS expire_le timestamptz;

ALTER TABLE public.human_echanges_bons DROP CONSTRAINT IF EXISTS human_echanges_bons_statut_check;
ALTER TABLE public.human_echanges_bons ADD CONSTRAINT human_echanges_bons_statut_check CHECK (statut IN ('reserve', 'utilise', 'annule', 'expire'));
ALTER TABLE public.human_echanges_bons DROP CONSTRAINT IF EXISTS human_echanges_bons_pour_check;
ALTER TABLE public.human_echanges_bons ADD CONSTRAINT human_echanges_bons_pour_check CHECK (
  (pour = 'moi' AND cadeau_id IS NULL) OR (pour = 'client' AND cadeau_id IS NOT NULL)
);
ALTER TABLE public.human_echanges_bons DROP CONSTRAINT IF EXISTS human_echanges_bons_venus_check;
ALTER TABLE public.human_echanges_bons ADD CONSTRAINT human_echanges_bons_venus_check CHECK (venus IS NULL OR venus BETWEEN 1 AND 20);

-- Les bons d'avant cette règle ont, eux aussi, trente jours depuis leur prise.
UPDATE public.human_echanges_bons SET expire_le = cree_le + interval '30 days' WHERE expire_le IS NULL;
ALTER TABLE public.human_echanges_bons ALTER COLUMN expire_le SET DEFAULT (now() + interval '30 days');
ALTER TABLE public.human_echanges_bons ALTER COLUMN expire_le SET NOT NULL;

CREATE INDEX IF NOT EXISTS human_echanges_bons_cadeau ON public.human_echanges_bons (cadeau_id);
CREATE INDEX IF NOT EXISTS human_echanges_bons_a_expirer ON public.human_echanges_bons (statut, expire_le);

/* ── 4. L'EXPIRATION ──────────────────────────────────────────────────────
   Appelée par la route avant chaque lecture, et par les deux fonctions
   ci-dessous avant de compter un solde : un bon périmé ne bloque jamais un
   montant. */
CREATE OR REPLACE FUNCTION public.echanges_expirer()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH x AS (
    UPDATE public.human_echanges_bons SET statut = 'expire'
     WHERE statut = 'reserve' AND expire_le < now()
    RETURNING 1
  )
  SELECT count(*)::integer FROM x;
$$;

/* ── 5. PRENDRE POUR SOI ──────────────────────────────────────────────────
   Les mêmes vérifications qu'avant, d'un seul tenant et sous deux verrous
   pris dans le même ordre ; seul le découvert change (50 € × l'équipe), et
   seuls les bons `pour = 'moi'` comptent dans « combien par mois ». La
   signature change (`p_par_personne`) : l'ancienne fonction est retirée. */
DROP FUNCTION IF EXISTS public.echanges_prendre(uuid, uuid, text, integer);
CREATE FUNCTION public.echanges_prendre(p_preneur uuid, p_fournisseur uuid, p_code text, p_par_personne integer)
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
  PERFORM public.echanges_expirer();

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
  v_peut := o_preneur.equipe * greatest(p_par_personne, 0) + v_gagne - v_pris;
  IF v_peut < o_fourn.prix THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'solde', 'manque', o_fourn.prix - greatest(v_peut, 0));
  END IF;

  SELECT count(*) INTO v_ce_mois
    FROM public.human_echanges_bons
   WHERE fournisseur_id = p_fournisseur AND pour = 'moi' AND statut IN ('reserve', 'utilise') AND cree_le >= v_debut_mois;
  IF v_ce_mois >= o_fourn.par_mois THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'complet');
  END IF;

  INSERT INTO public.human_echanges_bons (code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, pour, expire_le)
  VALUES (p_code, p_preneur, p_fournisseur, o_fourn.titre, o_fourn.prix, o_fourn.photo, o_fourn.du_jour, 'moi', now() + interval '30 days')
  RETURNING * INTO b;

  RETURN jsonb_build_object('ok', true, 'bon', to_jsonb(b));
END;
$$;

/* ── 6. OFFRIR À SES CLIENTS ──────────────────────────────────────────────
   Un lot de `p_quantite` cadeaux chez `p_fournisseur`, payé d'un coup avec
   le solde de `p_donneur` (les bons sont réservés à son nom). Les bons non
   utilisés expirent au bout de 30 jours et le montant lui revient. Les codes
   sont tirés par la route (un par bon) ; un code déjà pris fait échouer tout
   le lot, et la route en tire d'autres. */
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
  v_peut := o_donneur.equipe * greatest(p_par_personne, 0) + v_gagne - v_pris;
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

REVOKE ALL ON FUNCTION public.echanges_expirer() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_expirer() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_expirer() TO service_role;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_prendre(uuid, uuid, text, integer) TO service_role;
REVOKE ALL ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_offrir(uuid, uuid, integer, text, text[], integer) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
