-- Le catalogue de la ville : ce qu'il rapporte VRAIMENT au commerçant.
--
-- Deux chiffres, et deux seulement, parce qu'ils sont mesurables sans mentir :
--   catalogue_views  = nombre de fois où son annonce a été AFFICHÉE dans le
--                      catalogue de sa ville (page /ville + fenêtres des autres
--                      sites). C'est une exposition, pas une lecture — l'Espace
--                      Pro doit l'écrire ainsi.
--   catalogue_clicks = nombre de personnes arrivées sur SON site depuis le
--                      catalogue. C'est le chiffre qui compte.
--
-- Le rapport entre les deux se lit tout seul : 400 affichages / 12 visites dit
-- quelque chose de vrai, « 400 vues » tout court ne dirait rien.
--
-- La liste de diffusion WhatsApp : `wa_intro_at` marque le moment où le
-- commerçant s'est PRÉSENTÉ en 1:1 à ce contact. C'est la condition pour que la
-- personne enregistre son numéro — et donc pour qu'elle reçoive un jour une
-- diffusion. C'est aussi le garde-fou anti-bannissement : envoyer en masse à des
-- gens qui n'ont jamais eu d'échange avec vous est le meilleur moyen d'être
-- signalé, puis bloqué par WhatsApp.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS catalogue_views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS catalogue_clicks integer NOT NULL DEFAULT 0;

ALTER TABLE public.human_site_contacts
  ADD COLUMN IF NOT EXISTS wa_intro_at timestamptz;

-- Incrément groupé : une page catalogue affiche N annonces, on ne veut pas N
-- allers-retours. SECURITY DEFINER car appelée avec la clé de service depuis le
-- rendu de la page publique, qui n'a aucune autre écriture à faire.
CREATE OR REPLACE FUNCTION public.increment_catalogue_views(ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.human_vitrine_sites
     SET catalogue_views = COALESCE(catalogue_views, 0) + 1
   WHERE id = ANY(ids);
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
