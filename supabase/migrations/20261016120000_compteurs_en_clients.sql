-- LES CHIFFRES EN CLIENTS — ce que ClikMe a amené au commerçant cette semaine.
--
-- « Un commerçant ne paie pas des fonctions, il paie des clients. » Aux quatre
-- compteurs du comptoir (vues, écoutes, demandes, partages) s'ajoutent ceux qui
-- se disent en personnes :
--   · essais     — quelqu'un a vu une de ses pièces portée sur sa propre photo ;
--   · cotes      — une mise de côté lui a été demandée (le message est parti) ;
--   · confirmees — il l'a confirmée d'un appui ;
--   · avis       — un client a demandé à ses amis « Ça me va ? » sur une de ses pièces ;
--   · amis       — un ami de client est venu sur sa page par ce lien ;
--   · voisins    — un client est venu par la rue d'un commerçant voisin.
--
-- MÊME RÈGLE QUE LES QUATRE PREMIERS : aucune personne n'est identifiée ; ce
-- sont des gestes comptés par jour, pas des visiteurs uniques.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, après
-- `20261004120000_compteurs_du_comptoir.sql`. Tant qu'elle ne l'est pas, rien
-- ne casse : ces gestes ne sont pas comptés, et l'espace pro le dit.

BEGIN;

ALTER TABLE public.human_compteurs_jour
  ADD COLUMN IF NOT EXISTS essais integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cotes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmees integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avis integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amis integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS voisins integer NOT NULL DEFAULT 0;

-- Le même incrément, en une requête, pour les dix compteurs.
CREATE OR REPLACE FUNCTION public.compter_jour(sid uuid, quoi text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j date := (now() AT TIME ZONE 'Europe/Paris')::date;
BEGIN
  IF quoi NOT IN ('vues', 'ecoutes', 'demandes', 'partages', 'essais', 'cotes', 'confirmees', 'avis', 'amis', 'voisins') THEN
    RETURN;
  END IF;
  INSERT INTO public.human_compteurs_jour (site_id, jour, vues, ecoutes, demandes, partages, essais, cotes, confirmees, avis, amis, voisins)
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
    CASE WHEN quoi = 'voisins' THEN 1 ELSE 0 END)
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
    voisins = human_compteurs_jour.voisins + EXCLUDED.voisins;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
