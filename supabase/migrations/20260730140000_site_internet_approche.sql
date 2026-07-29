-- Texte « Mon approche » du site, écrit ou validé par le commerçant.
--
-- Jusqu'ici ce paragraphe venait d'un gabarit par métier (metier-content.ts) et
-- partait en ligne à la première personne, signé du nom du commerce, sans que le
-- commerçant l'ait jamais lu. On propose toujours le gabarit — mais comme une
-- SUGGESTION : tant qu'il n'a pas été validé, la section ne s'affiche pas sur le
-- site publié. Mieux vaut une section en moins que des mots qu'il n'a pas choisis.
--
-- `approche` = { titre, corps, validated_at }. NULL = jamais validé.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS approche jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
