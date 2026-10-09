-- 🔔 LES NOTIFICATIONS DES SALONS D'ENSEMBLE — « Emma vient de voter ».
--
-- Un abonnement push par téléphone d'habitant (l'identité est le cookie de
-- l'appareil, voir `lib/direct/habitant.ts`), et la trace de ce qui est parti :
-- c'est elle qui empêche de sonner deux fois pour la même chose, ou plus de six
-- fois par heure pour un même salon. Voir `lib/direct/push-salons.ts`.
--
-- Tant que cette migration n'est pas appliquée, rien ne casse : l'émetteur lit
-- une erreur, n'envoie rien, et le salon marche comme avant.

CREATE TABLE IF NOT EXISTS public.human_push_abonnements (
  -- L'adresse du service push du navigateur : une par téléphone et par navigateur.
  endpoint text PRIMARY KEY,
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  abonnement jsonb NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS human_push_abonnements_habitant ON public.human_push_abonnements (habitant);

CREATE TABLE IF NOT EXISTS public.human_push_envois (
  id bigserial PRIMARY KEY,
  conversation text NOT NULL REFERENCES public.human_conversations(id) ON DELETE CASCADE,
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  -- duel · vote · choix · reponse
  sorte text NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS human_push_envois_recents ON public.human_push_envois (conversation, habitant, cree_le DESC);

-- Personne ne les lit depuis un navigateur : seul le serveur (clé de service) y touche.
ALTER TABLE public.human_push_abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_push_envois ENABLE ROW LEVEL SECURITY;
