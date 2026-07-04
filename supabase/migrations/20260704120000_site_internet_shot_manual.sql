-- Capture d'écran manuelle du site actuel (option A honnête).
-- La capture automatique (mShots) était trompeuse : placeholder asynchrone,
-- rendu bureau only, souvent inexact. On l'abandonne pour l'affichage lettre.
-- À la place : le recto montre un schéma neutre honnête par défaut, et l'admin
-- peut coller SA propre capture (prise sur mobile, fidèle) qui prend le dessus.
-- Stockée en data URI (image compressée côté client), quelques dizaines de Ko.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS site_shot_manual text;

NOTIFY pgrst, 'reload schema';

COMMIT;
