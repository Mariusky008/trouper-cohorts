-- LES CONVERSATIONS D'ENSEMBLE, PARTAGÉES ENTRE LES HABITANTS.
--
-- « Une conversation ne réunit que les gens qui ont reçu le lien » — et même
-- eux ne voyaient rien : chaque téléphone gardait sa propre copie. Celui qui
-- ouvrait le lien tombait sur une conversation vide. Elles vivent maintenant
-- ici, pour la vraie ville (`/ville/<ville>`) ; la démonstration garde les
-- siennes dans le téléphone.
--
-- UNE CONVERSATION, C'EST SON POINT DE DÉPART ET LA SUITE DE SES GESTES. On
-- n'écrit jamais l'état entier — qui vient, quelle idée mène, combien de
-- réactions — mais chaque geste, dans l'ordre : un message, une idée proposée,
-- une voix, une réaction, « je viens ». Chaque téléphone rejoue la liste
-- (`lib/direct/conversations.ts`). Deux personnes qui écrivent dans la même
-- seconde ne s'écrasent donc jamais : les deux gestes sont là, l'un après
-- l'autre.
--
-- QUI : l'habitant tel que l'application le connaît déjà (`human_habitants`,
-- un jeton dans un cookie, sans inscription) et le prénom qu'il donne.
-- L'INVITATION EST LE LIEN : qui l'a peut lire et écrire. C'est la règle des
-- salons depuis le début (« sur invitation »).
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_conversations (
  id text PRIMARY KEY,
  ville_slug text NOT NULL,
  createur uuid REFERENCES public.human_habitants(id) ON DELETE SET NULL,
  -- Le point de départ : sujet, lieu, heure, photo, annonce, première idée.
  base jsonb NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now(),
  activite timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.human_conversation_gestes (
  id bigserial PRIMARY KEY,
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  habitant uuid REFERENCES public.human_habitants(id) ON DELETE SET NULL,
  -- Le prénom tel qu'il s'affichait au moment du geste.
  qui text NOT NULL,
  geste jsonb NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_conversation_gestes_conv ON public.human_conversation_gestes (conversation, id);
CREATE INDEX IF NOT EXISTS human_conversation_gestes_habitant ON public.human_conversation_gestes (habitant, conversation);
CREATE INDEX IF NOT EXISTS human_conversations_createur ON public.human_conversations (createur);

-- Lues et écrites par le serveur seulement (clé d'administration).
ALTER TABLE public.human_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_conversation_gestes ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

COMMIT;
