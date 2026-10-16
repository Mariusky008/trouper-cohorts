-- SON INTERVIEW, EN VIDÉO.
--
-- Le seau des annonces (`annonces`) s'arrête à dix mégaoctets : « au-delà, ce
-- n'est plus une annonce de quinze secondes ». Une interview montée par le
-- téléphone pèse de dix à quarante mégaoctets : elle a son seau.
--
-- LA ROUTE LE CRÉE TOUTE SEULE au premier envoi (`api/site-internet/pro/
-- interview`) : cette migration dit la même chose, pour mémoire, et peut être
-- appliquée sans rien casser.
--
-- Lecture publique : Le Direct la lit, et Instagram vient la chercher pour en
-- faire un Reel. Écriture par adresse signée seulement (la route vérifie son
-- jeton pro) : aucune politique d'écriture publique.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interviews',
  'interviews',
  true,
  52428800, -- 50 Mo
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'interviews_lecture_publique'
  ) THEN
    CREATE POLICY interviews_lecture_publique ON storage.objects
      FOR SELECT USING (bucket_id = 'interviews');
  END IF;
END
$$;

COMMIT;
