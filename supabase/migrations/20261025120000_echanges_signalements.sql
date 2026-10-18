-- « SIGNALER » UN BON NON HONORÉ — et la pause automatique après deux signalements.
--
-- Le cas le plus probable d'un incident de confiance dans l'échange : un
-- commerçant prend un bon, se présente, et l'autre ne le sert pas. Le plafond
-- de 50 € limite déjà la casse ; il fallait encore que ça se voie, et que ça
-- s'arrête vite :
--   1. CELUI QUI A PRIS LE BON LE SIGNALE, en un geste, avec la raison :
--      refusé, pas ce qui était annoncé, fermé ou injoignable, autre. Un bon
--      ne se signale qu'une fois, par celui qui l'a pris, dans les 60 jours.
--   2. UN BON ENCORE RÉSERVÉ EST ANNULÉ AU PASSAGE : ses crédits lui reviennent
--      tout de suite, sans attendre les 30 jours d'expiration.
--   3. DEUX COMMERCES DIFFÉRENTS SIGNALENT LE MÊME (sur 90 jours) : ses offres
--      passent en pause, automatiquement. Il ne peut pas les remettre en ligne
--      lui-même (un déclencheur l'en empêche) : c'est ClikMe qui lève la pause,
--      après en avoir parlé avec lui (`echanges_lever_pause`, page
--      /admin/humain/signalements).
--   4. LEVER LA PAUSE remet ses offres comme elles étaient, et le compte repart
--      de zéro : seuls les signalements faits APRÈS la levée comptent pour la
--      pause suivante.
--
-- QUI A SIGNALÉ n'est montré qu'à ClikMe ; le commerçant en pause voit les
-- raisons et les dates.
--
-- LUES ET ÉCRITES PAR LE SERVEUR SEULEMENT (clé d'administration), comme tout
-- l'échange. APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261024120000_echanges_moitie_simple.sql`. Elle peut être rejouée. Tant
-- qu'elle ne l'est pas, rien ne casse : le bouton « Signaler » répond que ce
-- n'est pas encore ouvert.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_echanges_signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bon_id uuid NOT NULL UNIQUE REFERENCES public.human_echanges_bons(id) ON DELETE RESTRICT,
  -- Celui qui a pris le bon (son commerce), et celui qui devait le servir.
  signale_par uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  fournisseur_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE RESTRICT,
  motif text NOT NULL CHECK (motif IN ('refuse', 'different', 'ferme', 'autre')),
  detail text CHECK (detail IS NULL OR char_length(detail) <= 500),
  -- Ce que ClikMe en a conclu, quand il a levé la pause.
  statut text NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'fonde', 'rejete')),
  cree_le timestamptz NOT NULL DEFAULT now(),
  traite_le timestamptz
);

CREATE INDEX IF NOT EXISTS human_echanges_signalements_fournisseur ON public.human_echanges_signalements (fournisseur_id, statut, cree_le);

CREATE TABLE IF NOT EXISTS public.human_echanges_pauses (
  site_id uuid PRIMARY KEY REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  depuis timestamptz NOT NULL DEFAULT now(),
  -- Son offre était-elle en ligne au moment de la pause ? La levée la remet comme elle était.
  offre_active_avant boolean NOT NULL DEFAULT true,
  levee_le timestamptz
);

ALTER TABLE public.human_echanges_signalements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_echanges_pauses ENABLE ROW LEVEL SECURITY;

/* ── EN PAUSE, SES OFFRES NE SE REMETTENT PAS EN LIGNE ──────────────────────
   Il peut encore modifier son offre (le texte, la photo) ; elle reste hors
   ligne tant que la pause n'est pas levée. Sa première offre dit s'il est là :
   toutes les autres suivent (voir `echanges_prendre`). */
CREATE OR REPLACE FUNCTION public.echanges_pause_garde()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.actif AND EXISTS (SELECT 1 FROM public.human_echanges_pauses WHERE site_id = NEW.site_id AND levee_le IS NULL) THEN
    NEW.actif := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS human_echanges_offres_pause_garde ON public.human_echanges_offres;
CREATE TRIGGER human_echanges_offres_pause_garde
  BEFORE INSERT OR UPDATE ON public.human_echanges_offres
  FOR EACH ROW EXECUTE FUNCTION public.echanges_pause_garde();

/* ── SIGNALER UN BON ──────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.echanges_signaler(p_preneur uuid, p_bon uuid, p_motif text, p_detail text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.human_echanges_bons%ROWTYPE;
  s public.human_echanges_signalements%ROWTYPE;
  v_annule boolean := false;
  v_levee timestamptz;
  v_combien integer;
  v_pause boolean := false;
  v_active boolean;
BEGIN
  IF p_motif IS NULL OR p_motif NOT IN ('refuse', 'different', 'ferme', 'autre') THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'motif');
  END IF;

  SELECT * INTO b FROM public.human_echanges_bons WHERE id = p_bon;
  IF NOT FOUND OR b.preneur_id <> p_preneur THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'bon');
  END IF;
  -- UN SEUL VERROU, CELUI DU COMMERCE SIGNALÉ : deux signalements simultanés comptent juste.
  PERFORM pg_advisory_xact_lock(hashtext('echanges-signaler:' || b.fournisseur_id::text));

  IF EXISTS (SELECT 1 FROM public.human_echanges_signalements WHERE bon_id = p_bon) THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'deja');
  END IF;
  IF b.statut = 'annule' THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'annule');
  END IF;
  IF b.cree_le < now() - interval '60 days' THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'trop_tard');
  END IF;

  INSERT INTO public.human_echanges_signalements (bon_id, signale_par, fournisseur_id, motif, detail)
  VALUES (p_bon, p_preneur, b.fournisseur_id, p_motif, nullif(left(btrim(coalesce(p_detail, '')), 500), ''))
  RETURNING * INTO s;

  -- ENCORE RÉSERVÉ : il ne l'aura pas, ses crédits lui reviennent tout de suite.
  IF b.statut = 'reserve' THEN
    UPDATE public.human_echanges_bons SET statut = 'annule', annule_par = 'preneur', annule_le = now() WHERE id = p_bon AND statut = 'reserve';
    v_annule := FOUND;
  END IF;

  -- COMBIEN DE COMMERCES DIFFÉRENTS L'ONT SIGNALÉ depuis la dernière levée de pause (90 jours au plus).
  SELECT levee_le INTO v_levee FROM public.human_echanges_pauses WHERE site_id = b.fournisseur_id;
  SELECT count(DISTINCT signale_par) INTO v_combien
    FROM public.human_echanges_signalements
   WHERE fournisseur_id = b.fournisseur_id
     AND statut <> 'rejete'
     AND cree_le >= now() - interval '90 days'
     AND cree_le > coalesce(v_levee, '-infinity'::timestamptz);

  IF v_combien >= 2 AND NOT EXISTS (SELECT 1 FROM public.human_echanges_pauses WHERE site_id = b.fournisseur_id AND levee_le IS NULL) THEN
    SELECT actif INTO v_active FROM public.human_echanges_offres WHERE site_id = b.fournisseur_id;
    INSERT INTO public.human_echanges_pauses (site_id, depuis, offre_active_avant, levee_le)
    VALUES (b.fournisseur_id, now(), coalesce(v_active, true), NULL)
    ON CONFLICT (site_id) DO UPDATE SET depuis = now(), offre_active_avant = excluded.offre_active_avant, levee_le = NULL;
    UPDATE public.human_echanges_offres SET actif = false, maj_le = now() WHERE site_id = b.fournisseur_id;
    v_pause := true;
  END IF;

  RETURN jsonb_build_object('ok', true, 'signalement', to_jsonb(s), 'annule', v_annule, 'pause', v_pause, 'signalements', v_combien);
END;
$$;

/* ── LEVER LA PAUSE (ClikMe) ────────────────────────────────────────────────
   `p_decision` dit ce qu'on conclut des signalements encore ouverts : fondés
   (c'est réglé avec lui) ou rejetés (ils ne tenaient pas). Dans les deux cas
   la pause est levée, son offre revient comme elle était, et le compte repart
   de zéro. */
CREATE OR REPLACE FUNCTION public.echanges_lever_pause(p_site uuid, p_decision text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pz public.human_echanges_pauses%ROWTYPE;
  v_traites integer;
BEGIN
  IF p_decision IS NULL OR p_decision NOT IN ('fonde', 'rejete') THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'decision');
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('echanges-signaler:' || p_site::text));
  UPDATE public.human_echanges_signalements SET statut = p_decision, traite_le = now() WHERE fournisseur_id = p_site AND statut = 'ouvert';
  GET DIAGNOSTICS v_traites = ROW_COUNT;
  SELECT * INTO pz FROM public.human_echanges_pauses WHERE site_id = p_site AND levee_le IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'levee', false, 'traites', v_traites);
  END IF;
  UPDATE public.human_echanges_pauses SET levee_le = now() WHERE site_id = p_site;
  -- APRÈS la levée : le déclencheur ne le retient plus.
  UPDATE public.human_echanges_offres SET actif = pz.offre_active_avant, maj_le = now() WHERE site_id = p_site;
  RETURN jsonb_build_object('ok', true, 'levee', true, 'traites', v_traites);
END;
$$;

REVOKE ALL ON FUNCTION public.echanges_signaler(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.echanges_lever_pause(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.echanges_pause_garde() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.echanges_signaler(uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.echanges_lever_pause(uuid, text) TO service_role;

COMMIT;
