-- LES SALONS D'ENSEMBLE : QUI EN FAIT PARTIE, QUI PEUT Y ENTRER, ET COMMENT.
--
-- JUSQU'ICI, L'INVITATION ÉTAIT LE LIEN : qui connaissait l'identifiant d'une
-- conversation pouvait la lire et y écrire, et l'ouvrir suffisait à y entrer.
-- Un lien transféré ouvrait donc un salon privé à n'importe qui. Désormais :
--
--   · UN SALON PRIVÉ n'est lisible que par ses MEMBRES — messages, photos,
--     participants. On y entre par une invitation NOMINATIVE (seule la
--     personne invitée peut l'accepter) ou par un LIEN partageable : celui
--     qui ouvre le lien ne voit que le titre et qui l'invite, et DEMANDE à
--     entrer ; le créateur (ou un modérateur) accepte ou refuse.
--   · UN SALON PUBLIC se lit sans en faire partie ; on le REJOINT d'un geste
--     explicite pour y écrire. Le lire n'ajoute personne aux participants.
--   · Le choix privé / public se fait À LA CRÉATION. Un salon privé ne devient
--     jamais public après coup ; un salon public peut redevenir privé.
--
-- LES PHOTOS DES SALONS vont dans un seau PRIVÉ (`salons-prives`) : elles ne
-- s'ouvrent que par la route `/api/direct/conversations/photo`, qui vérifie
-- l'accès puis donne une adresse signée de deux minutes. Les photos déjà
-- envoyées dans le seau public avant cette migration y restent : on ne peut
-- pas retirer après coup une adresse publique déjà partagée.
--
-- MODÉRATION : signaler un message ou un salon, bloquer quelqu'un, masquer un
-- message ou exclure un participant (créateur et modérateurs).
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261005120000_conversations_partagees.sql`.

BEGIN;

-- Le statut vit maintenant dans une colonne : c'est elle que le serveur lit.
ALTER TABLE public.human_conversations ADD COLUMN IF NOT EXISTS prive boolean NOT NULL DEFAULT true;
ALTER TABLE public.human_conversations ADD COLUMN IF NOT EXISTS supprime_le timestamptz;
UPDATE public.human_conversations SET prive = COALESCE((base->>'prive')::boolean, true);
CREATE INDEX IF NOT EXISTS human_conversations_publics ON public.human_conversations (ville_slug, activite DESC) WHERE prive = false AND supprime_le IS NULL;

-- Un message masqué par un modérateur reste en base, mais ne se montre plus.
ALTER TABLE public.human_conversation_gestes ADD COLUMN IF NOT EXISTS masque_le timestamptz;

CREATE TABLE IF NOT EXISTS public.human_conversation_membres (
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'membre' CHECK (role IN ('createur', 'moderateur', 'membre')),
  -- Le prénom tel qu'il s'affichait en entrant.
  qui text NOT NULL DEFAULT '',
  -- « Mettre ce salon en sourdine » : ses nouveaux messages ne comptent plus dans le badge.
  sourdine boolean NOT NULL DEFAULT false,
  entre_le timestamptz NOT NULL DEFAULT now(),
  quitte_le timestamptz,
  -- Exclu par un modérateur : ne peut plus écrire ni revenir.
  exclu_le timestamptz,
  PRIMARY KEY (conversation, habitant)
);
CREATE INDEX IF NOT EXISTS human_conversation_membres_habitant ON public.human_conversation_membres (habitant);

CREATE TABLE IF NOT EXISTS public.human_conversation_invitations (
  -- Le jeton : c'est lui que porte le lien.
  id text PRIMARY KEY,
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  par uuid REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  par_qui text NOT NULL DEFAULT '',
  -- La personne invitée. NULL : un lien partageable, qui mène à une demande.
  pour uuid REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'attente' CHECK (statut IN ('attente', 'acceptee', 'refusee', 'revoquee')),
  cree_le timestamptz NOT NULL DEFAULT now(),
  expire_le timestamptz
);
CREATE INDEX IF NOT EXISTS human_conversation_invitations_pour ON public.human_conversation_invitations (pour, statut);

CREATE TABLE IF NOT EXISTS public.human_conversation_demandes (
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  qui text NOT NULL DEFAULT '',
  invitation text REFERENCES public.human_conversation_invitations(id) ON DELETE SET NULL,
  statut text NOT NULL DEFAULT 'attente' CHECK (statut IN ('attente', 'acceptee', 'refusee')),
  cree_le timestamptz NOT NULL DEFAULT now(),
  decide_le timestamptz,
  PRIMARY KEY (conversation, habitant)
);

CREATE TABLE IF NOT EXISTS public.human_conversation_signalements (
  id bigserial PRIMARY KEY,
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  -- Le message signalé ; NULL : le salon entier.
  geste bigint REFERENCES public.human_conversation_gestes(id) ON DELETE CASCADE,
  habitant uuid REFERENCES public.human_habitants(id) ON DELETE SET NULL,
  motif text NOT NULL DEFAULT '',
  cree_le timestamptz NOT NULL DEFAULT now(),
  traite_le timestamptz
);

CREATE TABLE IF NOT EXISTS public.human_habitant_blocages (
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  bloque uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  cree_le timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habitant, bloque)
);

-- REPRISE : sous l'ancienne règle, le créateur et ceux qui y avaient fait un
-- geste étaient de fait dans la conversation. Ils en restent membres.
INSERT INTO public.human_conversation_membres (conversation, habitant, role, qui)
SELECT c.id, c.createur, 'createur', COALESCE(c.base->>'parQui', '')
FROM public.human_conversations c
WHERE c.createur IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.human_conversation_membres (conversation, habitant, role, qui)
SELECT DISTINCT ON (g.conversation, g.habitant) g.conversation, g.habitant, 'membre', g.qui
FROM public.human_conversation_gestes g
WHERE g.habitant IS NOT NULL
ORDER BY g.conversation, g.habitant, g.id
ON CONFLICT DO NOTHING;

-- Lues et écrites par le serveur seulement (clé d'administration).
ALTER TABLE public.human_conversation_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_conversation_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_conversation_demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_conversation_signalements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_habitant_blocages ENABLE ROW LEVEL SECURITY;

-- LE SEAU PRIVÉ DES PHOTOS DE SALONS : aucune adresse publique.
INSERT INTO storage.buckets (id, name, public) VALUES ('salons-prives', 'salons-prives', false) ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
