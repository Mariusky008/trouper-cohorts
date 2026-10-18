-- LE MESSAGE DU MOIS — combien de ses amis sont venus par son lien.
--
-- Chaque mois, le comptoir lui prépare un message pour sa liste de diffusion
-- WhatsApp (ses amis d'ici, pas ses clients). Le lien du message est le sien
-- (`/b/<sa-page>?via=diffusion`) : chaque ouverture de sa page par ce lien compte
-- ici, dans `diffusion`, et le comptoir lui dit « 37 amis sont venus par ton
-- message ce mois-ci ». Comme les autres compteurs : aucune personne identifiée,
-- des ouvertures comptées par jour.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261016120000_compteurs_en_clients.sql`. Elle peut être rejouée. Tant qu'elle
-- ne l'est pas, rien ne casse : les ouvertures ne sont pas comptées, et le
-- comptoir n'affiche pas de chiffre.

BEGIN;

ALTER TABLE public.human_compteurs_jour ADD COLUMN IF NOT EXISTS diffusion integer NOT NULL DEFAULT 0;

-- Le même incrément, en une requête, pour les onze compteurs.
CREATE OR REPLACE FUNCTION public.compter_jour(sid uuid, quoi text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF quoi NOT IN ('vues', 'ecoutes', 'demandes', 'partages', 'essais', 'cotes', 'confirmees', 'avis', 'amis', 'voisins', 'diffusion') THEN
    RETURN;
  END IF;
  INSERT INTO public.human_compteurs_jour (site_id, jour, vues, ecoutes, demandes, partages, essais, cotes, confirmees, avis, amis, voisins, diffusion)
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
    CASE WHEN quoi = 'diffusion' THEN 1 ELSE 0 END)
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
    diffusion = human_compteurs_jour.diffusion + EXCLUDED.diffusion;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compter_jour(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compter_jour(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
