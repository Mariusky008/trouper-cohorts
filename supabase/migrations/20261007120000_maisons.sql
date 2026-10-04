-- MA MAISON, VISITABLE.
--
-- « Toucher l'avatar d'un habitant ouvre sa vraie maison : ses commerces
-- adoptés et ce qu'il a choisi de partager. » « Inviter un ami chez moi »
-- partage un lien vers elle.
--
-- CE QUI EST ICI, ET RIEN D'AUTRE : son prénom, sa courte présentation, les
-- commerces qu'il a adoptés, et les essais QU'IL A PARTAGÉS. Ses essais
-- privés, ses réservations et ses conversations ne quittent jamais son
-- téléphone — ils ne peuvent donc pas fuir d'ici.
--
-- QUI VOIT QUOI :
--   · par le lien qu'il envoie (son jeton) : toute sa maison partagée ;
--   · en touchant son avatar dans La ville : ses commerces et sa
--     présentation ; ses essais partagés seulement si l'on est son ami
--     (une conversation d'Ensemble en commun).
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_maisons (
  habitant uuid PRIMARY KEY REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  ville_slug text NOT NULL,
  -- Le lien d'invitation : tiré au hasard, on ne le devine pas.
  jeton text NOT NULL UNIQUE,
  prenom text NOT NULL DEFAULT '',
  presentation text NOT NULL DEFAULT '',
  -- Les identifiants des commerces adoptés (ceux de la ville).
  adoptes jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Les essais partagés : [{ cle, titre, lieu, photo, carte }].
  essais jsonb NOT NULL DEFAULT '[]'::jsonb,
  maj_le timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.human_maisons ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

COMMIT;
