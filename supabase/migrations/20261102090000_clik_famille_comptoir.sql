-- 👻 LA FAMILLE, AU COMPTOIR — combien ont ouvert sa page, et le mot du jour.
--
-- Deux ajouts, pour l'écran « Ma famille » du comptoir (`lib/direct/famille.ts`) :
--
--   · `human_compteurs_jour.famille` : chaque ouverture de sa page publique
--     (`/f/<lien>`, sauf quand c'est lui, depuis son comptoir) compte ici. C'est la
--     première marche de son parcours : page ouverte → cage ouverte → venue. Comme
--     les autres compteurs : des ouvertures comptées par jour, personne d'identifié.
--   · `clik_mot.epingle_le` : le petit mot qu'il épingle comme « mot du jour ». Il
--     s'affiche en haut de sa page publique, avec le prénom et le numéro de son
--     auteur. Un par jour : en épingler un autre le remplace.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261025130000_compteurs_diffusion.sql` ET `20261031090000_clik_mots.sql`. Elle peut
-- être rejouée. Tant qu'elle ne l'est pas, rien ne casse : les ouvertures ne sont pas
-- comptées (le parcours le dit), et « Épingler » répond que ce n'est pas encore activé.

BEGIN;

ALTER TABLE public.human_compteurs_jour ADD COLUMN IF NOT EXISTS famille integer NOT NULL DEFAULT 0;

-- Le même incrément, en une requête, pour les douze compteurs.
CREATE OR REPLACE FUNCTION public.compter_jour(sid uuid, quoi text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF quoi NOT IN ('vues', 'ecoutes', 'demandes', 'partages', 'essais', 'cotes', 'confirmees', 'avis', 'amis', 'voisins', 'diffusion', 'famille') THEN
    RETURN;
  END IF;
  INSERT INTO public.human_compteurs_jour (site_id, jour, vues, ecoutes, demandes, partages, essais, cotes, confirmees, avis, amis, voisins, diffusion, famille)
  VALUES (sid, j,
    CASE WHEN quoi = 'vues' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'ecoutes' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'demandes' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'partages' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'essais' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'cotes' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'confirmees' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'avis' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'amis' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'voisins' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'diffusion' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'famille' THEN 1 ELSE 0 END)
  ON CONFLICT (site_id, jour) DO UPDATE SET
    vues = human_compteurs_jour.vues + EXCLUDED.vues,
    ecoutes = human_compteurs_jour.ecoutes + EXCLUDED.ecoutes,
    demandes = human_compteurs_jour.demandes + EXCLUDED.demandes,
    partages = human_compteurs_jour.partages + EXCLUDED.partages,
    essais = human_compteurs_jour.essais + EXCLUDED.essais,
    cotes = human_compteurs_jour.cotes + EXCLUDED.cotes,
    confirmees = human_compteurs_jour.confirmees + EXCLUDED.confirmees,
    avis = human_compteurs_jour.avis + EXCLUDED.avis,
    amis = human_compteurs_jour.amis + EXCLUDED.amis,
    voisins = human_compteurs_jour.voisins + EXCLUDED.voisins,
    diffusion = human_compteurs_jour.diffusion + EXCLUDED.diffusion,
    famille = human_compteurs_jour.famille + EXCLUDED.famille;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compter_jour(uuid, text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.clik_mot ADD COLUMN IF NOT EXISTS epingle_le timestamptz;
CREATE INDEX IF NOT EXISTS clik_mot_epingle_idx ON public.clik_mot (site_id, epingle_le) WHERE epingle_le IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
