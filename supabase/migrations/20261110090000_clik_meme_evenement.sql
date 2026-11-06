-- 🎭 LA MESURE DU MÈME (6 novembre 2026, le patron : « mesurer pour savoir si ça marche vraiment ») — un événement par
-- geste : un mème créé (`cree`), une réponse en duo (`reponse`), une page de mème ouverte (`vu`, sans les robots des
-- aperçus de lien), « Crée ou réponds » touché (`clic`), un partage (`partage`), une figurine créée par quelqu'un arrivé
-- par un mème (`nouveau`). `message_id` : le mème concerné (pour `reponse` et `nouveau` : celui d'origine).
-- La page `/admin/humain/memes` en tire le coefficient qui compte : les nouveaux créateurs par mème envoyé.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle peut être rejouée. Tant qu'elle ne l'est pas, rien ne se
-- compte (les mèmes partent quand même) et la page le dit.

CREATE TABLE IF NOT EXISTS public.clik_meme_evenement (
  id bigserial PRIMARY KEY,
  message_id text NOT NULL,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clik_meme_evenement DROP CONSTRAINT IF EXISTS clik_meme_evenement_type;
ALTER TABLE public.clik_meme_evenement ADD CONSTRAINT clik_meme_evenement_type CHECK (type IN ('cree', 'reponse', 'vu', 'clic', 'partage', 'nouveau'));
CREATE INDEX IF NOT EXISTS clik_meme_evenement_quand ON public.clik_meme_evenement (created_at DESC);
CREATE INDEX IF NOT EXISTS clik_meme_evenement_message ON public.clik_meme_evenement (message_id);
-- (seul le serveur y écrit et la lit, avec sa clé de service)
ALTER TABLE public.clik_meme_evenement ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
