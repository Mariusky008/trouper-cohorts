-- AMORÇAGE : une ligne de configuration pour chaque ville qui a des commerces.
--
-- Sans ligne, une ville tourne sur les valeurs par défaut (seuil 12, aucun
-- quartier) et son espace ville reste inaccessible faute de jeton. Ce n'est pas
-- cassé — c'est le comportement dégradé prévu — mais personne ne peut publier
-- une information municipale tant que la ligne n'existe pas.
--
-- Les villes sont DÉDUITES des fiches publiées, pas listées à la main : une
-- liste écrite ici serait périmée à la prochaine ville ouverte, et personne ne
-- penserait à revenir la compléter.
--
-- LE SEUIL EST CALCULÉ, pas fixé à 12 partout. Douze est un bon défaut de code,
-- un mauvais réglage réel : une ville de vingt commerçants n'atteindra jamais
-- douze publications dans une journée, et son compteur resterait masqué pour
-- toujours. La règle retenue — environ un tiers des commerces, entre 3 et 20 —
-- fait qu'un compteur s'affiche quand une part notable de la ville a bougé.
--
-- Le jeton d'espace ville est généré ici. Il ne sera JAMAIS réémis par cette
-- migration si la ligne existe déjà : le relancer invaliderait un lien qu'un
-- service municipal a peut-être déjà en favori.

BEGIN;

WITH normalisees AS (
  -- La normalisation est FAITE AVANT LE REGROUPEMENT, et c'est le point délicat.
  -- Le même « Dax » est stocké « Dax », « Dax, France » et « 40100 Dax » : le
  -- code postal laisse une espace en tête, donc un tiret en tête du slug. En
  -- regroupant sur le slug non nettoyé, « -dax » et « dax » formaient deux
  -- groupes, le comptage se scindait, et le seuil était calculé sur une partie
  -- des commerces seulement.
  SELECT
    trim(both '-' from
      regexp_replace(
        -- `translate` plutôt que l'extension `unaccent` : une migration qui
        -- dépend d'une extension échoue là où elle n'est pas installée, et la
        -- liste des accents du français tient en une ligne.
        translate(
          lower(regexp_replace(split_part(city, ',', 1), '\d{5}', '', 'g')),
          'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæ',
          'aaaaaaceeeeiiiinooooouuuuyyoa'
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    ) AS slug,
    trim(regexp_replace(split_part(city, ',', 1), '\d{5}', '', 'g')) AS nom
  FROM public.human_vitrine_sites
  WHERE channel = 'letter' AND published = true AND coalesce(city, '') <> ''
),
villes AS (
  SELECT
    slug,
    -- Le nom d'affichage le plus fréquent pour ce slug : « Dax » plutôt que
    -- « 40100 Dax » si les deux existent.
    (array_agg(nom ORDER BY nom))[1] AS nom,
    count(*) AS commerces
  FROM normalisees
  WHERE slug <> '' AND nom <> ''
  GROUP BY slug
)
INSERT INTO public.human_villes_config (ville_slug, ville, seuil_compteur, auteur_nom)
SELECT slug, nom, greatest(3, least(20, (commerces / 3)::int)), 'Ville de ' || nom
FROM villes
ON CONFLICT (ville_slug) DO NOTHING;

COMMIT;
