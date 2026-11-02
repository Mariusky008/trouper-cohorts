-- 🗣️ SA PROPRE FIGURINE — à 10 figurines gagnées, tous commerces confondus, un client reçoit la sienne : elle parle
-- avec sa voix, il l'envoie à ses proches, et elle cite ses commerces préférés (`docs/figurines.md`, 9.7).
--
-- clik_ma_figurine : une ligne par client qui a atteint 10. Sa photo (« C'est bien moi », cochée), puis ses deux
-- images faites par ClikMe (bouche fermée, bouche ouverte), posées depuis l'admin (`/admin/humain/figurines-clients`).
-- clik_figurine_message : chaque message envoyé (sa voix, les commerces qu'elle cite) ; son lien est `/figurine/<id>`.
-- Un message signalé ne s'affiche plus tant que l'admin ne l'a pas remis.
--
-- Photos, images et voix vont dans un seau PRIVÉ (`figurines-clients`) : servies par des adresses signées, jamais
-- publiques. Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans règle.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle peut être rejouée. Tant qu'elle ne l'est pas, « Ma
-- collection » montre le compteur jusqu'à 10 et dit que la suite arrive bientôt.

CREATE TABLE IF NOT EXISTS public.clik_ma_figurine (
  habitant_id uuid PRIMARY KEY,
  prenom text NOT NULL DEFAULT '',
  photo text,
  accord_le timestamptz,
  demande_le timestamptz NOT NULL DEFAULT now(),
  refus text,
  neutre text,
  parle text,
  prete_le timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clik_ma_figurine ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clik_figurine_message (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]{12}$'),
  habitant_id uuid NOT NULL,
  son text NOT NULL,
  duree real,
  commerces jsonb NOT NULL DEFAULT '[]'::jsonb,
  ecoutes integer NOT NULL DEFAULT 0,
  signale_le timestamptz,
  retire_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clik_figurine_message_qui ON public.clik_figurine_message (habitant_id, created_at DESC);
ALTER TABLE public.clik_figurine_message ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public) VALUES ('figurines-clients', 'figurines-clients', false) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.clik_ma_figurine IS 'Sa propre figurine (à 10 figurines tous commerces) : sa photo, son accord, puis ses deux images faites par ClikMe.';
COMMENT ON TABLE public.clik_figurine_message IS 'Un message de sa figurine : sa voix et les commerces qu''elle cite ; lien /figurine/<id>. Signalé : masqué.';

NOTIFY pgrst, 'reload schema';
