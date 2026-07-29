-- Le Collectif — diffusion croisée des annonces entre commerces d'une même ville.
--
-- La promesse faite au commerçant : « votre annonce s'affiche aussi sur les sites
-- des commerces partenaires de votre ville ». Jusqu'ici c'était une intention ;
-- cette colonne rend l'appariement réel.
--
-- Ce qui circule : le nom du commerce, son métier, son annonce du moment, le lien
-- vers son site. RIEN d'autre — aucune donnée de client, jamais.
--
-- Règles d'appariement (appliquées côté serveur, cf. lib/site-internet/collectif.ts) :
--   • même ville ;
--   • sites publiés uniquement ;
--   • métiers DIFFÉRENTS (jamais un concurrent direct) ;
--   • professions réglementées exclues (santé encadrée, droit) ;
--   • seulement les commerces qui participent (collectif_actif) ;
--   • seulement les annonces réellement en cours.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS collectif_actif boolean NOT NULL DEFAULT true;

-- Recherche des partenaires : ville + publié, filtré ensuite en mémoire sur le
-- métier (la comparaison des métiers demande la table de correspondance côté app).
CREATE INDEX IF NOT EXISTS human_vitrine_sites_collectif_idx
  ON public.human_vitrine_sites (city, published, collectif_actif)
  WHERE channel = 'letter';

NOTIFY pgrst, 'reload schema';

COMMIT;
