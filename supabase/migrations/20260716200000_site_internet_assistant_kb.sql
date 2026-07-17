-- Fiche de connaissances de l'assistante : ce que le pro veut que son accueil
-- intelligent sache (spécialités, ce qu'il ne fait pas, FAQ). Injecté dans le
-- prompt de l'accueil-chat → l'assistante répond avec LES MOTS DU PRO, sans rien
-- inventer (elle ne sort jamais de ce qui est renseigné ici).

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS assistant_kb jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
