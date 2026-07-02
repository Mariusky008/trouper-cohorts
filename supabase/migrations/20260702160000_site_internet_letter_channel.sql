-- Canal "Site internet" : prospection par lettre remise en main propre
-- proposant une refonte/création de site. On étend human_vitrine_sites plutôt
-- que de créer une table dédiée (cf. CAHIER_DES_CHARGES_SITE_INTERNET.md, D3).
--
-- Le cycle de vie du canal lettre est porté par `letter_status` (indépendant de
-- `status`, réservé aux vitrines auto) pour ne pas casser l'onglet Vitrines.

BEGIN;

-- Discrimine les lignes du canal lettre ('letter') des vitrines auto ('vitrine').
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'vitrine';

ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_channel_check;
ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_channel_check CHECK (
    channel IN ('vitrine', 'letter')
  );

-- Infos commerce utilisées par la lettre (recto/verso + mockup).
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS activite text NOT NULL DEFAULT '';
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS contact_prenom text NOT NULL DEFAULT '';
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';

-- Variante de la lettre : 'A' = pas de site, 'B' = refonte. NULL tant que le
-- diagnostic n'a pas tranché (ou pour les lignes du canal vitrine).
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS variant text;
ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_variant_check;
ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_variant_check CHECK (
    variant IS NULL OR variant IN ('A', 'B')
  );

-- Données du diagnostic Google Places.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS google_rating numeric;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS google_reviews integer;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS google_place_id text;

-- Année estimée du site existant (indice d'âge, variante B).
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS site_annee integer;

-- Diagnostic brut (note, secondes, viewport, horaires…) + constats validés
-- ([{statut,label,titre,texte}]) + phrase de synthèse + prix affiché au verso.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS diagnostic jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS constats jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS synthese text NOT NULL DEFAULT '';
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS prix integer NOT NULL DEFAULT 690;

-- Cycle de vie propre au canal lettre.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS letter_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_letter_status_check;
ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_letter_status_check CHECK (
    letter_status IN (
      'draft',
      'validated',
      'printed',
      'delivered',
      'contacted',
      'skipped'
    )
  );

-- Jalons du canal lettre + tracking du QR de contact.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS letter_printed_at timestamptz;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS letter_delivered_at timestamptz;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS contact_scanned_at timestamptz;
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS contact_lead_at timestamptz;

-- Liste de l'onglet : filtre par canal + statut lettre, plus récents d'abord.
CREATE INDEX IF NOT EXISTS idx_human_vitrine_sites_channel_letter
  ON public.human_vitrine_sites(channel, letter_status, created_at DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
