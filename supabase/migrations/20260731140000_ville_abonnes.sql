-- L'abonnement ville : « recevez ce qui se passe chez les commerçants de {ville} ».
--
-- C'est ce qui transforme le catalogue en habitude. Sans envoi, la page ne vit
-- que si quelqu'un pense à la rouvrir — c'est-à-dire jamais.
--
-- CHOIX : e-mail, pas SMS. Le SMS coûte à chaque envoi (~0,06 € pièce) : à trois
-- cents abonnés et un envoi par jour, la facture arrive avant le premier euro de
-- revenu. Et un catalogue se PARCOURT — ça existe en e-mail, pas en 160 signes.
--
-- CONSENTEMENT : double opt-in. L'inscription seule ne suffit pas ; on n'envoie
-- rien tant que la personne n'a pas cliqué le lien de confirmation. On conserve
-- la phrase exacte acceptée et son horodatage : sans ça, un consentement ne se
-- démontre pas. Chaque envoi porte son lien de retrait, valable sans connexion.
--
-- RYTHME : un envoi par jour AU MAXIMUM, et seulement s'il y a du neuf depuis le
-- dernier. `last_sent_at` sert aux deux : ne pas dépasser un envoi quotidien, et
-- ne reprendre que les annonces publiées depuis.

BEGIN;

CREATE TABLE IF NOT EXISTS public.human_ville_abonnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ville text NOT NULL,                    -- nom exact tel que stocké sur les sites
  ville_slug text NOT NULL,               -- clé de regroupement, insensible aux accents
  email text NOT NULL,
  -- Jetons publics : confirmation et retrait se font sans compte ni connexion.
  confirm_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  unsub_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  confirmed_at timestamptz,               -- NULL = pas encore confirmé → aucun envoi
  unsubscribed_at timestamptz,            -- retrait : on ne supprime pas, on marque
  consent_text text,                      -- la phrase EXACTE acceptée
  consent_at timestamptz,
  last_sent_at timestamptz,               -- dernier digest envoyé (rythme + fenêtre)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Une adresse ne s'abonne qu'une fois par ville.
CREATE UNIQUE INDEX IF NOT EXISTS human_ville_abonnes_ville_email_idx
  ON public.human_ville_abonnes (ville_slug, lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS human_ville_abonnes_confirm_idx
  ON public.human_ville_abonnes (confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS human_ville_abonnes_unsub_idx
  ON public.human_ville_abonnes (unsub_token);

-- Le cron balaie par ville : seuls les confirmés et non désinscrits comptent.
CREATE INDEX IF NOT EXISTS human_ville_abonnes_envoi_idx
  ON public.human_ville_abonnes (ville_slug, confirmed_at, unsubscribed_at);

NOTIFY pgrst, 'reload schema';

COMMIT;
