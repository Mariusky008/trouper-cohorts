-- UNE VIDÉO DANS UNE ANNONCE.
--
-- POURQUOI PAS COMME LES PHOTOS. Les photos sont stockées en `data:` dans une
-- colonne JSON : quelques dizaines de kilo-octets, ça passe. Une vidéo de
-- quinze secondes pèse plusieurs mégaoctets — la mettre au même endroit ferait
-- grossir CHAQUE lecture de fiche, y compris pour qui ne regardera jamais la
-- vidéo. Le fil de la ville lit des dizaines de publications d'un coup : il
-- ramènerait des dizaines de mégaoctets pour afficher des vignettes.
--
-- Donc un vrai stockage d'objets, et en base une simple adresse.
--
-- LA PREMIÈRE IMAGE DE LA VIDÉO DEVIENT LA PHOTO DE L'ANNONCE. C'est la
-- décision qui évite de toucher au reste : le résumé par e-mail, les cartes du
-- fil et les aperçus de lien savent déjà afficher `photo`. Ils continuent, sans
-- rien connaître de la vidéo. Celle-ci ne remplace jamais l'image — elle s'y
-- ajoute là où elle peut se lire.

BEGIN;

ALTER TABLE public.human_publications
  ADD COLUMN IF NOT EXISTS video text;

-- Le seau. `public` en lecture : ces vidéos illustrent des annonces publiques,
-- une URL signée à durée de vie limitée casserait les aperçus et les partages.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'annonces',
  'annonces',
  true,
  10485760, -- 10 Mo : au-delà, ce n'est plus une annonce de quinze secondes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lecture ouverte, écriture réservée au serveur.
--
-- L'envoi passe par une route qui vérifie le jeton pro du commerçant : c'est
-- elle qui écrit, avec la clé de service. Aucune politique d'écriture publique,
-- donc — un seau où n'importe qui dépose dix mégaoctets est un seau qui sert à
-- héberger autre chose que des annonces.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'annonces_lecture_publique'
  ) THEN
    CREATE POLICY annonces_lecture_publique ON storage.objects
      FOR SELECT USING (bucket_id = 'annonces');
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
