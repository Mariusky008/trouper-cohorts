-- « IL M'EN RESTE 8 » — LA FAÇON « PORTION ».
--
-- LE BESOIN, dit par un restaurateur : il est 14 h, il reste huit lasagnes, et
-- dans deux heures elles partent à la poubelle. Il ne veut pas monter une
-- opération : il veut dire « il m'en reste huit » et que les gens autour le
-- sachent tout de suite.
--
-- POURQUOI UN NOUVEAU TYPE, alors qu'il y en a déjà quatre. Parce qu'aucun des
-- quatre ne fait les deux choses à la fois :
--
--   • « à prendre » n'a ni prix ni stock ;
--   • « le cadeau » a un STOCK, mais c'est un cadeau EN PLUS d'un achat — sa
--     condition d'achat est même NOT NULL. Ici, la portion EST ce qu'on achète ;
--   • « l'express » a un PRIX RÉDUIT, mais aucun stock : il ne sait pas
--     s'arrêter à la huitième personne ;
--   • « le collectif » attend un groupe, alors qu'il faut vider maintenant.
--
-- La portion, c'est un prix ET un stock qui descend. Le stock réutilise
-- `clik_reward` — une ligne par part — et donc `clik_prendre_avantage`, déjà
-- sérialisée par un `FOR UPDATE SKIP LOCKED` : deux habitants qui appuient à la
-- même seconde prennent deux parts différentes, jamais la même. C'est
-- exactement le problème que cette table a été écrite pour résoudre.
--
-- LE PRIX RÉDUIT EST FACULTATIF, et c'est délibéré. « Il me reste 8 parts de
-- tarte, venez avant 19 h » est une annonce utile telle quelle. Obliger à
-- baisser le prix apprendrait aux habitants à attendre la fin de journée, ce
-- qui est exactement ce qu'un commerçant ne veut pas.

ALTER TABLE public.clik_campaign DROP CONSTRAINT IF EXISTS clik_campaign_type_check;
ALTER TABLE public.clik_campaign
  ADD CONSTRAINT clik_campaign_type_check
  CHECK (type IN ('simple', 'cadeau', 'collectif', 'express', 'portion'));

-- Une portion à prix réduit doit avoir les DEUX prix, et le réduit doit être
-- plus bas. La contrainte vit en base et pas dans l'écran : deux écrans
-- écrivent des campagnes, et l'un des deux finirait par oublier le contrôle —
-- on afficherait alors « 16 € → 19 € », qui n'est pas une offre mais une faute.
ALTER TABLE public.clik_campaign DROP CONSTRAINT IF EXISTS clik_campaign_portion_coherente;
ALTER TABLE public.clik_campaign
  ADD CONSTRAINT clik_campaign_portion_coherente CHECK (
    type <> 'portion'
    OR prix_groupe IS NULL
    OR (prix_initial IS NOT NULL AND prix_groupe < prix_initial)
  );

COMMENT ON COLUMN public.clik_campaign.type IS
  'simple | cadeau | express | collectif | portion. « portion » = un stock de parts qui reste, avec ou sans prix réduit ; le stock vit dans clik_reward.';

-- LA CONDITION D'ACHAT N'A PAS DE SENS SUR UNE PORTION.
--
-- `clik_reward.condition_achat` est NOT NULL parce qu'un cadeau sans condition
-- d'achat se distribue à des gens qui n'achètent rien — la règle reste juste
-- pour le cadeau. Mais une portion N'EST PAS un cadeau : on l'achète. La
-- colonne reçoit donc une chaîne vide, et les écrans ne doivent pas
-- l'afficher. On ne relâche pas le NOT NULL : il protège toujours le cadeau.
COMMENT ON COLUMN public.clik_reward.condition_achat IS
  'Ce qu''il faut acheter pour obtenir l''avantage. Vide sur une campagne « portion » : la portion est elle-même ce qu''on achète.';
