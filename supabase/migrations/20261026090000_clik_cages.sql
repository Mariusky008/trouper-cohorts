-- 🔓 LES TROIS CAGES À LA FIN D'UN FILM DE COMMERÇANT — et le carnet qui va avec.
--
-- « À la fin de votre vidéo, chacun libère son fantôme de sa cage. » Trois
-- cages : « J'adore la vidéo » (adore), « Je viendrai un jour » (un-jour),
-- « Je réserve / Je passe aujourd'hui » (aujourdhui). Elles remplacent les
-- trois avis (`clik_avis_film`, gardée pour l'historique).
--
-- DEUX TABLES, PARCE QUE CE SONT DEUX CHOSES.
--   · clik_cage : le geste, UN PAR PERSONNE ET PAR FILM (changer de cage
--     remplace la ligne). Avec le prénom et le fantôme qu'elle avait à ce
--     moment-là : c'est ce que le commerçant lira dans son carnet.
--   · clik_contact : ce que la personne accepte de CE commerce, une ligne par
--     personne et par commerce, quel que soit le film. Son numéro WhatsApp et
--     quand elle a dit oui ; quand elle a dit stop. Le stop vaut pour le
--     commerce entier, pas pour une vidéo.
--
-- Le numéro est au format international sans « + » (celui d'un lien wa.me).
-- C'est le commerçant qui écrira, depuis son WhatsApp : ClikMe n'envoie rien.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est
-- activée sans règle, pour qu'aucun navigateur ne puisse lire ni écrire.
CREATE TABLE IF NOT EXISTS public.clik_cage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  film text NOT NULL CHECK (char_length(film) BETWEEN 1 AND 500),
  cage text NOT NULL CHECK (cage IN ('adore', 'un-jour', 'aujourdhui')),
  prenom text NOT NULL DEFAULT '' CHECK (char_length(prenom) <= 24),
  look text NOT NULL DEFAULT '' CHECK (char_length(look) <= 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habitant_id, site_id, film)
);
CREATE INDEX IF NOT EXISTS clik_cage_site_idx ON public.clik_cage (site_id, updated_at DESC);
ALTER TABLE public.clik_cage ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clik_contact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  whatsapp text CHECK (whatsapp IS NULL OR whatsapp ~ '^[1-9][0-9]{7,14}$'),
  accord_le timestamptz,
  stop_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habitant_id, site_id)
);
CREATE INDEX IF NOT EXISTS clik_contact_site_idx ON public.clik_contact (site_id);
ALTER TABLE public.clik_contact ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_cage IS
  'La cage qu''un habitant libère à la fin d''un film de commerçant : adore (J''adore la vidéo), un-jour (Je viendrai un jour), aujourdhui (Je réserve / Je passe aujourd''hui). Une par personne et par film.';
COMMENT ON TABLE public.clik_contact IS
  'Ce qu''un habitant accepte d''un commerce : son numéro WhatsApp (format international sans +) et quand il a dit oui ; quand il a dit stop. Une ligne par personne et par commerce.';
