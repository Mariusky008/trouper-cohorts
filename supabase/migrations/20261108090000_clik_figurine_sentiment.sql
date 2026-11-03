-- 🎭 CE QUE RESSENT SA FIGURINE — un message de sa figurine peut porter un sentiment (joie, colère, tristesse,
-- euphorie) : chez celui qui le reçoit, la figurine le joue (`lib/direct/ma-figurine.ts`, `SENTIMENTS`).
-- Vide : elle parle, simplement. APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS
-- `20261106090000_clik_ma_figurine.sql`. Elle peut être rejouée. Tant qu'elle ne l'est pas, les messages partent
-- quand même, sans sentiment.

ALTER TABLE public.clik_figurine_message ADD COLUMN IF NOT EXISTS sentiment text;
ALTER TABLE public.clik_figurine_message DROP CONSTRAINT IF EXISTS clik_figurine_message_sentiment;
ALTER TABLE public.clik_figurine_message ADD CONSTRAINT clik_figurine_message_sentiment CHECK (sentiment IS NULL OR sentiment IN ('joie', 'colere', 'tristesse', 'euphorie'));

NOTIFY pgrst, 'reload schema';
