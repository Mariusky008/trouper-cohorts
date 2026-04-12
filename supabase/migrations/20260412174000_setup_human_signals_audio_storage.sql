BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'human-signals-audio',
  'human-signals-audio',
  false,
  20971520,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "human signals audio authenticated insert" ON storage.objects;
CREATE POLICY "human signals audio authenticated insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'human-signals-audio');

DROP POLICY IF EXISTS "human signals audio authenticated update own" ON storage.objects;
CREATE POLICY "human signals audio authenticated update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'human-signals-audio' AND owner = auth.uid())
WITH CHECK (bucket_id = 'human-signals-audio' AND owner = auth.uid());

DROP POLICY IF EXISTS "human signals audio authenticated delete own" ON storage.objects;
CREATE POLICY "human signals audio authenticated delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'human-signals-audio' AND owner = auth.uid());

NOTIFY pgrst, 'reload schema';

COMMIT;
