-- Le rythme des alertes, tenu séparément de celui du résumé.
--
-- `last_sent_at` porte le résumé quotidien. Y écrire aussi les alertes ferait
-- que recevoir une alerte à 15 h supprimerait le résumé du lendemain matin — et
-- inversement, le résumé de 11 h interdirait toute alerte jusqu'au surlendemain.
-- Deux canaux, deux compteurs : c'est la seule façon que chacun tienne sa propre
-- promesse.

BEGIN;

ALTER TABLE public.human_habitants
  ADD COLUMN IF NOT EXISTS last_alerte_at timestamptz;

NOTIFY pgrst, 'reload schema';

COMMIT;
