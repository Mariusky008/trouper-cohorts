-- 🏪 LA VITRINE DU COMMERCE — les fantômes libérés, et l'ardoise (prototype « Les trois fantômes », étape 1).
--
-- La vitrine montre les fantômes libérés à la fin des vidéos d'un commerce (`clik_cage`) :
-- « J'adore » sur le trottoir, « Un jour » à la porte, « Aujourd'hui » à table. Les
-- prénoms y sont visibles ; chacun peut cacher le sien — `human_habitants.prenom_vitrine`
-- (vrai par défaut : décision du 26 octobre, « visible, désactivable »).
--
-- L'ARDOISE, sous la vitrine : l'info du moment que le commerçant écrit à son comptoir
-- (« Plus que 6 magrets ce midi ! »). Une par commerce ; elle ne s'affiche que le jour
-- où elle a été écrite (heure de Paris).
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans
-- règle, pour qu'aucun navigateur ne puisse lire ni écrire. Se rejoue sans casser.
ALTER TABLE public.human_habitants ADD COLUMN IF NOT EXISTS prenom_vitrine boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.clik_ardoise (
  site_id uuid PRIMARY KEY,
  texte text NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 90),
  ecrite_le timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clik_ardoise ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_ardoise IS
  'L''info du moment qu''un commerçant écrit à son comptoir, sous la vitrine de son commerce dans l''application. Ne s''affiche que le jour où elle a été écrite.';
COMMENT ON COLUMN public.human_habitants.prenom_vitrine IS
  'Son prénom apparaît dans les vitrines des commerces où il a libéré son fantôme (vrai par défaut ; il peut le cacher).';
