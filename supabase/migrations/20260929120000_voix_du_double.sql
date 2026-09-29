-- 🎙️ LA VOIX DU DOUBLE — celle du commerçant, donnée depuis son Espace Pro.
--
-- « Avec chaque commerçant, comment vais-je faire pour que ça puisse être
-- automatisé sans que j'aie à intervenir ? On ne peut pas le faire directement
-- depuis leur admin ? »
--
-- LE COMMERÇANT DONNE SA VOIX LUI-MÊME : il coche son accord, répond à trois
-- questions à voix haute, et ClikMe crée sa voix chez ElevenLabs. On garde ici
-- l'identifiant de cette voix — jamais les enregistrements — et la preuve de
-- son accord.
--
-- L'ACCORD EST DATÉ ET SON TEXTE EST GARDÉ MOT POUR MOT. Une voix est une
-- donnée personnelle ; on doit pouvoir montrer ce qu'il a accepté et quand. Sans
-- date d'accord, la voix n'est jamais utilisée, même si l'identifiant existe.
--
-- LE PLAFOND SE COMPTE EN SIGNES PAR MOIS : c'est l'unité que facture
-- ElevenLabs. Au-delà, le double reprend la voix standard jusqu'au mois suivant.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS double_voix_id text,
  ADD COLUMN IF NOT EXISTS double_voix_prenom text,
  ADD COLUMN IF NOT EXISTS double_voix_accord_at timestamptz,
  ADD COLUMN IF NOT EXISTS double_voix_accord_texte text,
  ADD COLUMN IF NOT EXISTS double_voix_recit text,
  ADD COLUMN IF NOT EXISTS double_voix_cree_at timestamptz,
  ADD COLUMN IF NOT EXISTS double_voix_mois text,
  ADD COLUMN IF NOT EXISTS double_voix_signes integer NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
