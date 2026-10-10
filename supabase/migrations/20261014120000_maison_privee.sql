-- 🏠 MA MAISON, PRIVÉE — « Plus Ma Maison me ressemble, plus ClikMe sait ce
-- que ma ville peut m'apporter. »
--
-- Elle remplace la maison visitable (`20261007120000_maisons.sql`) : celle-là
-- montrait aux autres les commerces adoptés ; celle-ci n'est montrée à
-- PERSONNE. Ni aux autres habitants, ni aux commerçants.
--
-- QUI EST LE PROPRIÉTAIRE. L'habitant de `human_habitants`, reconnu par le
-- cookie de son appareil (`lib/direct/habitant.ts`). Le cookie est posé par le
-- serveur : Safari ne l'efface pas avec les données du site au bout de sept
-- jours, contrairement à ce que le téléphone garde lui-même. Pour un autre
-- téléphone, ou un cookie perdu, l'adresse e-mail et un code à six chiffres
-- (`human_habitant_codes`) rendent la même maison — jamais l'adresse seule.
--
-- QUI LIT. Personne depuis un navigateur : la sécurité au niveau des lignes est
-- activée SANS AUCUNE RÈGLE, seul le serveur (clé de service) y touche, et
-- chaque route ne sert que la maison de l'habitant du cookie. Aucune route
-- côté commerçant ne lit ces tables.
--
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Tant qu'elle ne l'est
-- pas, rien ne casse : la Maison vit dans le téléphone et le dit.

BEGIN;

-- LA MÉMOIRE : ce que l'habitant a dit (ses choix), ce que ClikMe a remarqué
-- (les signaux), ses corrections (« ce n'est pas moi »), ses pièces en pause
-- ou vidées. Un seul document par habitant : il pèse quelques kilo-octets, et
-- le téléphone le fusionne avec sa copie (voir `lib/direct/maison.ts`).
CREATE TABLE IF NOT EXISTS public.human_maisons_privees (
  habitant uuid PRIMARY KEY REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  memoire jsonb NOT NULL DEFAULT '{}'::jsonb,
  maj_le timestamptz NOT NULL DEFAULT now()
);

-- CE QU'IL Y DÉPOSE : un vêtement, sa photo pour les essais, son salon, un
-- livre. La photo est dans le seau privé ci-dessous ; `photo` est son chemin,
-- jamais une adresse publique.
CREATE TABLE IF NOT EXISTS public.human_maison_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habitant uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  piece text NOT NULL CHECK (piece IN ('dressing', 'miroir', 'cuisine', 'sorties', 'interieur', 'librairie', 'bienetre')),
  sorte text NOT NULL DEFAULT '',
  donnees jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo text,
  cree_le timestamptz NOT NULL DEFAULT now(),
  maj_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS human_maison_elements_habitant ON public.human_maison_elements (habitant, piece);

-- LE CODE À SIX CHIFFRES. On n'en garde que l'empreinte ; il vit dix minutes
-- et supporte cinq essais.
CREATE TABLE IF NOT EXISTS public.human_habitant_codes (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  ville_slug text NOT NULL DEFAULT '',
  empreinte text NOT NULL,
  essais smallint NOT NULL DEFAULT 0,
  expire_le timestamptz NOT NULL,
  utilise_le timestamptz,
  cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS human_habitant_codes_email ON public.human_habitant_codes (lower(email), cree_le DESC);

-- L'ADRESSE PROUVÉE PAR UN CODE — à ne pas confondre avec `confirmed_at`, qui
-- est l'accord pour recevoir le résumé du jour. Retrouver sa maison n'abonne
-- à rien.
ALTER TABLE public.human_habitants ADD COLUMN IF NOT EXISTS email_verifie_le timestamptz;

ALTER TABLE public.human_maisons_privees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_maison_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_habitant_codes ENABLE ROW LEVEL SECURITY;

-- LE SEAU PRIVÉ DES PHOTOS DE LA MAISON : aucune adresse publique.
INSERT INTO storage.buckets (id, name, public) VALUES ('maison-privee', 'maison-privee', false) ON CONFLICT (id) DO NOTHING;

-- L'ANCIENNE TABLE `human_maisons` N'EST PLUS LUE NI ÉCRITE. Elle n'est pas
-- supprimée ici : effacer des données ne se fait pas en passant. Elle pourra
-- l'être d'un `DROP TABLE public.human_maisons;` le jour où on le décide.

NOTIFY pgrst, 'reload schema';

COMMIT;
