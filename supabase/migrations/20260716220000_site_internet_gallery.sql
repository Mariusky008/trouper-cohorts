-- Galerie gérée par le pro : ses propres photos (réalisations), en plus / à la
-- place des photos Google. Stockées compressées côté navigateur (data URI) dans
-- gallery_photos (v1 sans bucket) ; on pourra migrer vers un stockage dédié plus
-- tard. Si gallery_photos est non vide, la maquette l'utilise ; sinon Google.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS gallery_photos jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
