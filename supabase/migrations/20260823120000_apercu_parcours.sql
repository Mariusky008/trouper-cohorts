-- MESURER LE PARCOURS SUR /autour-de-moi, ET RIEN D'AUTRE.
--
-- POURQUOI CETTE TABLE EXISTE. Cent personnes ont ouvert la maquette habitant
-- et ne sont pas revenues. On en a conclu qu'il manquait quelque chose au
-- produit — sauf qu'on ne sait pas ce qu'elles y ont fait. La page ne mesurait
-- rien : ni une carte vue, ni un balayage, ni le pli ouvert. On arbitrait à
-- l'aveugle entre quatorze hypothèses avec le meilleur échantillon qu'on ait
-- jamais eu.
--
-- LA SEULE QUESTION QU'ELLE DOIT TRANCHER : OÙ EST-CE QU'ILS S'ARRÊTENT. Si
-- huit sur dix ferment après deux cartes, le problème est dans les dix
-- premières secondes. Si huit sur dix vont au bout, il est ailleurs. Ce ne sont
-- pas les mêmes travaux, et une visite suffit à le savoir — la rétention, elle,
-- ne se mesure pas sur une maquette dont les données ne changent jamais.
--
-- CE QU'ON NE STOCKE PAS, ET C'EST DÉLIBÉRÉ :
--   · aucune adresse IP, aucun agent utilisateur, aucune empreinte ;
--   · aucun cookie — la session est un jeton aléatoire qui meurt avec l'onglet,
--     posé dans `sessionStorage`, jamais relié à quoi que ce soit ;
--   · aucun contenu écrit par la personne : on compte qu'une demande est
--     partie, jamais ce qu'elle disait.
-- Ce qu'on garde permet de compter des parcours, jamais de reconnaître
-- quelqu'un. C'est la même règle que `direct_vues` : un chiffre honnêtement
-- nommé plutôt qu'un chiffre exact payé en surveillance.
--
-- `largeur` est un SEUIL, pas une taille d'écran : trois valeurs possibles, de
-- quoi séparer téléphone et ordinateur sans rien approcher d'une empreinte.

BEGIN;

CREATE TABLE IF NOT EXISTS public.apercu_parcours (
  id bigserial PRIMARY KEY,
  cree_le timestamptz NOT NULL DEFAULT now(),
  -- Jeton aléatoire de session, régénéré à chaque onglet. Sert uniquement à
  -- recoudre les étapes d'un même parcours ; ne survit pas à la fermeture.
  session text NOT NULL,
  evenement text NOT NULL,
  -- Un entier quand l'événement en porte un (le rang de la carte, le nombre de
  -- balayages). Jamais du texte saisi par la personne.
  valeur integer,
  -- Le métier regardé, ou l'état de l'écran. Vocabulaire fermé, écrit par le
  -- code, jamais par l'utilisateur.
  contexte text,
  largeur text CHECK (largeur IN ('petit', 'moyen', 'grand'))
);

-- On lit ces chiffres par événement et par jour, jamais par personne.
CREATE INDEX IF NOT EXISTS apercu_parcours_evenement_idx
  ON public.apercu_parcours (evenement, cree_le DESC);
CREATE INDEX IF NOT EXISTS apercu_parcours_session_idx
  ON public.apercu_parcours (session);

-- ÉCRITURE PAR LA CLÉ DE SERVICE UNIQUEMENT. La page est publique et anonyme,
-- donc la route API écrit avec le client admin ; personne d'autre n'a besoin de
-- toucher cette table, et surtout pas en lecture depuis le navigateur.
ALTER TABLE public.apercu_parcours ENABLE ROW LEVEL SECURITY;

COMMIT;
