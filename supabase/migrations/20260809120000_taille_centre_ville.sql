-- LA TAILLE DU CENTRE-VILLE, ET CONTRE QUI ELLE SE COMPARE.
--
-- Le constat qui fonde cet écran : les gens vont en zone commerciale parce
-- qu'ils croient qu'on y trouve tout, et que le centre-ville n'a plus rien. À
-- Dax, le centre-ville compte 400 commerces contre 110 en zone commerciale, et
-- plus que le plus grand centre commercial de la région (~150). C'est vrai,
-- personne ne le sait, et personne n'a jamais eu d'endroit où l'écrire.
--
-- POURQUOI EN BASE ET PAS EN DUR : le chiffre est une AFFIRMATION PUBLIQUE. Il
-- sera lu par un maire, un directeur général des services, peut-être un
-- journaliste. Il change à chaque ville, il se périme, et il doit pouvoir être
-- corrigé sans redéploiement. Écrit dans le code, il aurait fini faux quelque
-- part sans que personne ne s'en aperçoive.
--
-- ET AVEC SA SOURCE : « 400 » sans provenance est une publicité ; « 400, source
-- Ville de Dax » est un fait opposable. C'est toute la différence entre un
-- argument qui tient en réunion et un qui s'effondre à la première question.

ALTER TABLE public.human_villes_config
  ADD COLUMN IF NOT EXISTS commerces_total integer,
  ADD COLUMN IF NOT EXISTS commerces_source text NOT NULL DEFAULT '',
  -- [{ "nom": "la zone commerciale de Dax", "commerces": 110, "source": "…" }]
  -- Un tableau plutôt que deux colonnes : une ville se compare parfois à sa
  -- zone commerciale, parfois au plus grand centre commercial de sa région,
  -- parfois aux deux. Figer ce nombre à deux aurait obligé à migrer pour la
  -- troisième.
  ADD COLUMN IF NOT EXISTS comparaisons jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.human_villes_config.commerces_total IS
  'Nombre de commerces du centre-ville (fait sur la ville, PAS le nombre de fiches Clikme). NULL = on ne sait pas, l''écran se tait.';
COMMENT ON COLUMN public.human_villes_config.commerces_source IS
  'Qui affirme ce chiffre. Affiché à l''écran : sans source, le nombre n''est qu''un slogan.';

-- ── Dax ──────────────────────────────────────────────────────────────────────
-- 400 est le chiffre de la Ville elle-même : son adjoint au commerce l'a opposé
-- publiquement au classement plaçant Dax parmi les villes les plus touchées par
-- la vacance commerciale (« les villes de cette strate ont environ 200
-- commerces, Dax en a 400 »). On ne lui demande donc pas de croire un chiffre :
-- on lui rend le sien, avec de quoi le prouver.
INSERT INTO public.human_villes_config (ville_slug, ville, commerces_total, commerces_source, comparaisons)
VALUES (
  'dax', 'Dax', 400, 'Ville de Dax',
  '[{"nom":"la zone commerciale de Dax","commerces":110},
    {"nom":"Rives d''Arcins, le plus grand centre commercial de la région","commerces":150}]'::jsonb
)
ON CONFLICT (ville_slug) DO UPDATE SET
  commerces_total = COALESCE(public.human_villes_config.commerces_total, EXCLUDED.commerces_total),
  commerces_source = CASE
    WHEN public.human_villes_config.commerces_source = '' THEN EXCLUDED.commerces_source
    ELSE public.human_villes_config.commerces_source
  END,
  comparaisons = CASE
    WHEN public.human_villes_config.comparaisons = '[]'::jsonb THEN EXCLUDED.comparaisons
    ELSE public.human_villes_config.comparaisons
  END;
