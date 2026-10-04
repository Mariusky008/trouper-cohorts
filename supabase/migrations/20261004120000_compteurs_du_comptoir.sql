-- LES CHIFFRES DU COMPTOIR, JOUR PAR JOUR.
--
-- « Je ne vois aucune stat de ma journée ou des précédentes pour me motiver à
-- chaque jour poster quelque chose. » Le comptoir d'un vrai commerçant (son
-- lien pro) lui montrait jusqu'ici une phrase honnête — « ils apparaîtront ici
-- dès qu'ils seront mesurés » — parce que rien ne les mesurait par jour :
-- `site_views` est un total, depuis toujours, et ne dit pas si mardi, le jour
-- où il a publié, a fait plus que lundi.
--
-- UNE LIGNE PAR COMMERCE ET PAR JOUR (à l'heure de Paris), quatre compteurs :
--   · vues      — sa page a été ouverte ;
--   · ecoutes   — quelqu'un a écouté sa voix (le mot du plat) ;
--   · demandes  — quelqu'un a confirmé une demande à son double ;
--   · partages  — quelqu'un a partagé sa page.
--
-- MÊME RÈGLE QUE `direct_vues` : aucune personne n'est identifiée, aucune ligne
-- n'est posée pour quelqu'un qui ne fait que regarder. Ce sont des affichages
-- honnêtement nommés, pas des visiteurs uniques.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Tant qu'elle ne l'est
-- pas, rien ne casse : l'écriture échoue en silence et le comptoir garde sa
-- phrase « bientôt mesurés ».

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_compteurs_jour (
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  jour date NOT NULL,
  vues integer NOT NULL DEFAULT 0,
  ecoutes integer NOT NULL DEFAULT 0,
  demandes integer NOT NULL DEFAULT 0,
  partages integer NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, jour)
);

-- Lue et écrite par le serveur seulement (clé d'administration) : aucune
-- politique, donc aucun accès public direct.
ALTER TABLE public.human_compteurs_jour ENABLE ROW LEVEL SECURITY;

-- Un incrément, en une requête, sans lire avant d'écrire : deux visites dans la
-- même seconde comptent bien deux.
CREATE OR REPLACE FUNCTION public.compter_jour(sid uuid, quoi text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF quoi NOT IN ('vues', 'ecoutes', 'demandes', 'partages') THEN
    RETURN;
  END IF;
  INSERT INTO public.human_compteurs_jour (site_id, jour, vues, ecoutes, demandes, partages)
  VALUES (sid, j,
    CASE WHEN quoi = 'vues' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'ecoutes' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'demandes' THEN 1 ELSE 0 END,
    CASE WHEN quoi = 'partages' THEN 1 ELSE 0 END)
  ON CONFLICT (site_id, jour) DO UPDATE SET
    vues = human_compteurs_jour.vues + EXCLUDED.vues,
    ecoutes = human_compteurs_jour.ecoutes + EXCLUDED.ecoutes,
    demandes = human_compteurs_jour.demandes + EXCLUDED.demandes,
    partages = human_compteurs_jour.partages + EXCLUDED.partages;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
