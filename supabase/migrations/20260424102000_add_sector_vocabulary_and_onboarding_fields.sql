BEGIN;

CREATE TABLE IF NOT EXISTS public.sector_vocabulary (
  sector_id text PRIMARY KEY,
  label text NOT NULL,
  pipeline_steps text[] NOT NULL DEFAULT ARRAY['Etape 1', 'Etape 2', 'Etape 3', 'Etape 4'],
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  message_templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT sector_vocabulary_pipeline_steps_check CHECK (cardinality(pipeline_steps) = 4)
);

CREATE INDEX IF NOT EXISTS idx_sector_vocabulary_active
  ON public.sector_vocabulary(is_active, label);

ALTER TABLE public.sector_vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sector vocabulary select authenticated" ON public.sector_vocabulary;
CREATE POLICY "sector vocabulary select authenticated"
  ON public.sector_vocabulary
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.human_members
  ADD COLUMN IF NOT EXISTS sector_id text,
  ADD COLUMN IF NOT EXISTS metier_label text,
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS offre_decouverte text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS contact_link text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'human_members_sector_id_fkey'
  ) THEN
    ALTER TABLE public.human_members
      ADD CONSTRAINT human_members_sector_id_fkey
      FOREIGN KEY (sector_id) REFERENCES public.sector_vocabulary(sector_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_members_public_slug_unique
  ON public.human_members (lower(public_slug))
  WHERE public_slug IS NOT NULL;

INSERT INTO public.sector_vocabulary (
  sector_id,
  label,
  pipeline_steps,
  terms,
  message_templates
) VALUES
  (
    'coach_sport',
    'Coach sportif',
    ARRAY['1re séance', 'Programme', 'Suivi', 'Fidélisation'],
    '{"opportunity_label":"Prospect intéressé","commission_label":"Commission séance","free_offer":"Séance découverte offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis coach sportif à {ville}...","alliance":"Bonjour {prenom}, je pense que nos activités peuvent se compléter localement."}'::jsonb
  ),
  (
    'coach_biz',
    'Coach business',
    ARRAY['Call découverte', 'Proposition', 'Mission', 'Renouvellement'],
    '{"opportunity_label":"Prospect business","commission_label":"Commission mission","free_offer":"Session découverte offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis coach business à {ville}...","alliance":"Bonjour {prenom}, je te contacte pour un partenariat local utile à nos clients."}'::jsonb
  ),
  (
    'hypno',
    'Hypnothérapeute',
    ARRAY['Séance découverte', 'Suivi', 'Clôture', 'Recommandation'],
    '{"opportunity_label":"Personne à accompagner","commission_label":"Commission séance","free_offer":"1 séance découverte offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis hypnothérapeute à {ville}...","alliance":"Bonjour {prenom}, je me permets de te contacter car nos activités peuvent se compléter."}'::jsonb
  ),
  (
    'nutrition',
    'Nutritionniste',
    ARRAY['Consultation', 'Bilan', 'Suivi', 'Renouvellement'],
    '{"opportunity_label":"Prospect nutrition","commission_label":"Commission suivi","free_offer":"Bilan découverte offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis nutritionniste à {ville}...","alliance":"Bonjour {prenom}, j''aimerais te proposer un test de recommandation croisée."}'::jsonb
  ),
  (
    'dietetique',
    'Diététicien',
    ARRAY['Bilan alimentaire', 'Programme', 'Suivi', 'Bilan final'],
    '{"opportunity_label":"Prospect alimentation","commission_label":"Commission programme","free_offer":"Bilan alimentaire offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis diététicien à {ville}...","alliance":"Bonjour {prenom}, je pense que nous pouvons nous recommander des profils pertinents."}'::jsonb
  ),
  (
    'immo',
    'Agent immobilier',
    ARRAY['1er RDV', 'Mandat', 'Offre', 'Signature'],
    '{"opportunity_label":"Lead acquéreur/vendeur","commission_label":"Commission transaction","free_offer":"Estimation offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis agent immobilier à {ville}...","alliance":"Bonjour {prenom}, je souhaite créer un partenariat local gagnant-gagnant."}'::jsonb
  ),
  (
    'courtier_immo',
    'Courtier immobilier',
    ARRAY['Dossier', 'Négociation', 'Accord banque', 'Signature'],
    '{"opportunity_label":"Dossier financement","commission_label":"Commission courtage","free_offer":"Étude de financement offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis courtier immobilier à {ville}...","alliance":"Bonjour {prenom}, je te contacte pour fluidifier les mises en relation entre nos métiers."}'::jsonb
  ),
  (
    'avocat',
    'Avocat indépendant',
    ARRAY['Consultation', 'Dossier', 'Procédure', 'Clôture'],
    '{"opportunity_label":"Nouveau dossier","commission_label":"Honoraires dossier","free_offer":"Consultation découverte offerte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis avocat à {ville}...","alliance":"Bonjour {prenom}, je pense que nos clientèles ont des besoins croisés."}'::jsonb
  ),
  (
    'notaire',
    'Notaire',
    ARRAY['RDV conseil', 'Dossier', 'Acte', 'Signature'],
    '{"opportunity_label":"Dossier notarial","commission_label":"Honoraires acte","free_offer":"RDV conseil offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis notaire à {ville}...","alliance":"Bonjour {prenom}, je te propose un partenariat local simple et transparent."}'::jsonb
  ),
  (
    'developpeur',
    'Développeur freelance',
    ARRAY['Spec', 'Devis', 'Développement', 'Livraison'],
    '{"opportunity_label":"Projet digital","commission_label":"Commission projet","free_offer":"Audit tech offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis développeur freelance à {ville}...","alliance":"Bonjour {prenom}, je pense qu''on peut se recommander des projets complémentaires."}'::jsonb
  ),
  (
    'consultant_marketing',
    'Consultant marketing',
    ARRAY['Audit', 'Stratégie', 'Mise en place', 'Suivi'],
    '{"opportunity_label":"Prospect marketing","commission_label":"Commission mission","free_offer":"Audit marketing offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis consultant marketing à {ville}...","alliance":"Bonjour {prenom}, je veux structurer un partenariat local avec suivi Popey."}'::jsonb
  ),
  (
    'estheticienne',
    'Esthéticienne',
    ARRAY['Soin découverte', 'Forfait', 'Suivi', 'Fidélisation'],
    '{"opportunity_label":"Cliente potentielle","commission_label":"Commission forfait","free_offer":"Soin découverte offert"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis esthéticienne à {ville}...","alliance":"Bonjour {prenom}, je te contacte pour un partenariat local orienté recommandations."}'::jsonb
  ),
  (
    'other_custom',
    'Autre métier (champ libre)',
    ARRAY['Découverte', 'Proposition', 'Prestation', 'Suivi'],
    '{"opportunity_label":"Prospect","commission_label":"Commission","free_offer":"Offre découverte"}'::jsonb,
    '{"eclaireur":"Bonjour {prenom}, je suis {metier} à {ville}...","alliance":"Bonjour {prenom}, je pense que nos activités peuvent se compléter."}'::jsonb
  )
ON CONFLICT (sector_id) DO UPDATE SET
  label = EXCLUDED.label,
  pipeline_steps = EXCLUDED.pipeline_steps,
  terms = EXCLUDED.terms,
  message_templates = EXCLUDED.message_templates,
  is_active = true,
  updated_at = timezone('utc', now());

COMMIT;
