-- ✍️ CE QU'ELLE DIT À PARTIR D'UN TEXTE — un message de sa figurine peut venir d'un texte, lu par une voix choisie
-- (ElevenLabs : la seule voix fabriquée de ClikMe, décidée par le propriétaire le 4 novembre 2026). Le texte s'affiche
-- en bulle chez celui qui reçoit ; `voix` dit laquelle (« douce », « petillante », « chaleureuse », « posee »).
-- Vides : sa propre voix, enregistrée. APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261106090000_clik_ma_figurine.sql`. Elle peut être rejouée. Tant qu'elle ne l'est pas, les messages partent quand
-- même, sans leur texte.

ALTER TABLE public.clik_figurine_message ADD COLUMN IF NOT EXISTS texte text;
ALTER TABLE public.clik_figurine_message ADD COLUMN IF NOT EXISTS voix text;
ALTER TABLE public.clik_figurine_message DROP CONSTRAINT IF EXISTS clik_figurine_message_texte;
ALTER TABLE public.clik_figurine_message ADD CONSTRAINT clik_figurine_message_texte CHECK (texte IS NULL OR char_length(texte) <= 140);

NOTIFY pgrst, 'reload schema';
