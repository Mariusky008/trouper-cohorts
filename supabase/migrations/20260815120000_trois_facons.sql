-- TROIS FAÇONS DE PROFITER D'UNE MÊME ANNONCE.
--
-- CE QUI CHANGE, ET POURQUOI. La première version supposait qu'une annonce
-- portait UN mécanisme : soit un stock de cadeaux, soit un groupe à réunir.
-- Le prototype dit autre chose, et c'est plus juste : une même annonce propose
-- PLUSIEURS façons d'en profiter, à des prix dégressifs, et c'est l'habitant
-- qui choisit ce qu'il est prêt à faire pour payer moins.
--
--   19 € · LE CADEAU          → prix normal, plus un avantage surprise
--   17 € · L'EXPRESS          → prix réduit si l'on vient tout de suite
--   16 € · TABLE À PARTAGER   → prix le plus bas si l'on vient à plusieurs
--
-- ET UN QUATRIÈME CAS, QUI N'EST PAS UN PRIX : « À PRENDRE ».
-- Un créneau qui vient de se libérer n'a ni réduction ni cadeau — il a juste
-- besoin de quelqu'un. C'est le cas le plus fréquent chez un coiffeur ou un
-- tatoueur, et c'était le grand absent : une annonce de ce genre n'offrait
-- AUCUNE action, on pouvait seulement la regarder. Elle s'affiche seule, sans
-- échelle de prix, sous « Une seule chose à faire ».
--
-- C'est le cœur de la proposition : le commerce ne brade pas, il RÉMUNÈRE un
-- comportement. Venir vite remplit un creux ; venir à plusieurs remplit une
-- table. Le cadeau, lui, ne coûte rien au commerçant sur son prix.
--
-- CE QUE CETTE MIGRATION NE FAIT PAS : elle ne crée aucune table. Les trois
-- façons sont trois lignes de `clik_campaign` qui partagent la même
-- `publication_id`, ce que le schéma permettait déjà. Il manquait le type
-- « express » et un ordre d'affichage.

-- ── Le type « express » ─────────────────────────────────────────────────────
ALTER TABLE public.clik_campaign DROP CONSTRAINT IF EXISTS clik_campaign_type_check;
ALTER TABLE public.clik_campaign
  ADD CONSTRAINT clik_campaign_type_check
  CHECK (type IN ('simple', 'cadeau', 'collectif', 'express'));

-- ── L'ordre d'affichage ─────────────────────────────────────────────────────
-- Les trois façons se lisent de la plus chère à la moins chère, parce que
-- c'est l'ordre de l'effort demandé : ne rien faire, venir vite, venir à
-- plusieurs. Trié par prix, l'ordre s'inverserait le jour où un commerçant
-- fixe un cadeau moins cher que son express, et la colonne des prix ne
-- descendrait plus — or c'est cette descente qui rend la carte lisible.
ALTER TABLE public.clik_campaign
  ADD COLUMN IF NOT EXISTS ordre integer NOT NULL DEFAULT 0;

-- ── L'express doit vraiment être moins cher ────────────────────────────────
-- Même exigence que pour le collectif : une façon « à prix réduit » qui ne
-- réduit rien est une annonce mensongère, et la base est le seul endroit où
-- l'interdiction tient quel que soit l'écran qui écrit.
ALTER TABLE public.clik_campaign DROP CONSTRAINT IF EXISTS clik_campaign_express_complet;
ALTER TABLE public.clik_campaign
  ADD CONSTRAINT clik_campaign_express_complet CHECK (
    type <> 'express' OR (prix_initial IS NOT NULL AND prix_groupe IS NOT NULL
                          AND prix_groupe < prix_initial)
  );

-- ── Lire les façons d'une annonce ──────────────────────────────────────────
-- L'index existant porte sur (ville_slug, echeance). Le fil lit maintenant
-- aussi par publication : sans cet index, chaque carte du fil déclencherait un
-- parcours complet de la table.
CREATE INDEX IF NOT EXISTS clik_campaign_publication_idx
  ON public.clik_campaign (publication_id, ordre)
  WHERE statut IN ('active', 'debloquee');

COMMENT ON COLUMN public.clik_campaign.ordre IS
  'Ordre d''affichage des façons d''une même annonce : 0 = cadeau, 1 = express, 2 = partage. « simple » est toujours seul.';
