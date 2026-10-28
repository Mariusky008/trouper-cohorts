-- 🎬 SON ACCORD POUR LES VIDÉOS — son prénom et son petit mot dans les vidéos d'un commerce.
--
-- La fin de chaque vidéo du commerçant montre « la famille d'hier » : les fantômes, et quelques-uns
-- qui s'avancent avec leur petit mot. La vidéo part sur Instagram et Facebook : c'est bien plus public
-- que la page. Le FANTÔME s'y voit toujours (sans rien qui dise qui c'est) ; le PRÉNOM, le NUMÉRO et le
-- PETIT MOT seulement pour qui a coché « Mon prénom et mon petit mot peuvent apparaître dans ses
-- vidéos » (une case jamais cochée d'avance), sur la page de la famille. Il peut changer d'avis à tout
-- moment, sur la même page. Une ligne par personne et par commerce.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans règle.
-- APPLIQUER À LA MAIN DANS L'ÉDITEUR SQL DE SUPABASE. Elle peut être rejouée. Tant qu'elle ne l'est
-- pas, personne n'a donné son accord : les vidéos montrent les fantômes, sans prénom.

CREATE TABLE IF NOT EXISTS public.clik_accord (
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  video boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, habitant_id)
);
ALTER TABLE public.clik_accord ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_accord IS
  'Son accord, par commerce : son prénom, son numéro et son petit mot peuvent apparaître dans les vidéos de ce commerce (video). Jamais coché d''avance.';

NOTIFY pgrst, 'reload schema';
