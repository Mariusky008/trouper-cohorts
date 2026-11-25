-- LES MESURES DES MESSAGES, JOUR PAR JOUR, SANS EN PERDRE.
--
-- Jusqu'ici, chaque ajout (un écrit, un lien, un aperçu, un effacé…) relisait le fichier du jour
-- (`stats/messages/<jour>.json`), ajoutait, puis le réécrivait. Deux ajouts en même temps : l'un se perdait (l'aperçu
-- d'un lien se prépare en arrière-plan, pendant qu'on efface un autre message, par exemple). Ici, une ligne par jour
-- (heure de Paris) et par compteur, ajoutée en une requête, sans lire avant d'écrire.
--
-- Écrite et lue par le serveur seulement (clé d'administration) : aucune politique, aucun accès public.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Tant qu'elle ne l'est pas, rien ne casse : le serveur garde
-- l'ancien fichier du jour (`noterStatsMessages`, `src/lib/direct/talkie-serveur.ts`), et la page des mesures
-- additionne les deux.

BEGIN;

CREATE TABLE IF NOT EXISTS public.clik_stats_messages (
  jour date NOT NULL,
  cle text NOT NULL CHECK (cle ~ '^[a-zA-Z]{1,40}$'),
  n bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (jour, cle)
);

ALTER TABLE public.clik_stats_messages ENABLE ROW LEVEL SECURITY;

-- `plus` : {"effaces": 1, "apercus": 1} — chaque compteur, de plus (des entiers positifs, au plus un million).
CREATE OR REPLACE FUNCTION public.compter_stats_messages(plus jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j date := (now() AT TIME ZONE 'Europe/Paris')::date;
  k text;
  v jsonb;
BEGIN
  IF jsonb_typeof(plus) <> 'object' THEN
    RETURN;
  END IF;
  FOR k, v IN SELECT * FROM jsonb_each(plus) LOOP
    IF k ~ '^[a-zA-Z]{1,40}$' AND jsonb_typeof(v) = 'number' AND (v::text)::numeric > 0 AND (v::text)::numeric <= 1000000 THEN
      INSERT INTO public.clik_stats_messages (jour, cle, n)
      VALUES (j, k, round((v::text)::numeric)::bigint)
      ON CONFLICT (jour, cle) DO UPDATE SET n = public.clik_stats_messages.n + EXCLUDED.n;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.compter_stats_messages(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compter_stats_messages(jsonb) TO service_role;

COMMIT;
