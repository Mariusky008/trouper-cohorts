-- LA VILLE, PARTAGÉE ENTRE LES HABITANTS.
--
-- « Sur /ville/dax, une publication "Public dans ma ville" n'est vue que par
-- son auteur. » Elles vivent maintenant ici : les essais partagés, les
-- découvertes, la vie locale (question, bon plan, événement…).
--
-- QUI VOIT QUOI — c'est le serveur qui trie, jamais l'écran :
--   · « Public dans ma ville » : tous les habitants de la ville ;
--   · « Mes amis » : l'auteur et ses amis — les habitants avec qui il partage
--     une conversation d'Ensemble (`human_conversations`). Il n'y a pas encore
--     de liste d'amis : la conversation en tient lieu.
--
-- CE QUI S'EFFACE : la vie locale, au bout de quelques heures (la règle de
-- l'application, `resteMinutes`, plafonnée à douze heures). Les essais et
-- découvertes restent jusqu'à ce que leur auteur les retire.
--
-- LA MODÉRATION : chacun peut signaler une publication. Au troisième
-- signalement, elle est masquée en attendant la décision de l'administrateur
-- (/admin/humain/ville), qui la garde ou la retire.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_ville_publications (
  id text PRIMARY KEY,
  ville_slug text NOT NULL,
  habitant uuid REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  -- Le prénom tel qu'il s'affichait à la publication.
  qui text NOT NULL,
  visibilite text NOT NULL CHECK (visibilite IN ('amis', 'public')),
  -- Le texte, la nature, le genre, la photo, le commerce, la référence d'essai…
  donnees jsonb NOT NULL,
  persistant boolean NOT NULL DEFAULT false,
  cree_le timestamptz NOT NULL DEFAULT now(),
  retire_le timestamptz,
  masque boolean NOT NULL DEFAULT false,
  signalements integer NOT NULL DEFAULT 0,
  -- La décision de l'administrateur : « garde » ou « retire ».
  verdict text
);

CREATE TABLE IF NOT EXISTS public.human_ville_gestes (
  id bigserial PRIMARY KEY,
  publication text NOT NULL REFERENCES public.human_ville_publications(id) ON DELETE CASCADE,
  habitant uuid REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  qui text NOT NULL,
  -- { type: "coeur" } · { type: "reponse", texte } · { type: "interesse" }
  geste jsonb NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.human_ville_signalements (
  publication text NOT NULL REFERENCES public.human_ville_publications(id) ON DELETE CASCADE,
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  motif text,
  cree_le timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication, habitant)
);

CREATE INDEX IF NOT EXISTS human_ville_publications_ville ON public.human_ville_publications (ville_slug, cree_le DESC);
CREATE INDEX IF NOT EXISTS human_ville_publications_habitant ON public.human_ville_publications (habitant);
CREATE INDEX IF NOT EXISTS human_ville_gestes_publication ON public.human_ville_gestes (publication, id);

ALTER TABLE public.human_ville_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_ville_gestes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_ville_signalements ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

COMMIT;
