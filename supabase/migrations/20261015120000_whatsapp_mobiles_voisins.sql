-- LE WHATSAPP D'UNE BOUTIQUE SUISSE, BELGE OU LUXEMBOURGEOISE.
--
-- La colonne n'acceptait que les mobiles français (+33 6/7). Lili Ross, à
-- Vevey, ne pouvait donc pas recevoir ses réservations : son espace refusait
-- son numéro, et sa page parlait d'un « commerce inventé ».
--
-- Même règle que `MOBILE` dans src/lib/site-internet/pro-phone.ts :
--   France 06/07 · Suisse 075–079 · Belgique 045–049 · Luxembourg 621…691
ALTER TABLE public.human_vitrine_sites
  DROP CONSTRAINT IF EXISTS human_vitrine_sites_whatsapp_phone_check;

ALTER TABLE public.human_vitrine_sites
  ADD CONSTRAINT human_vitrine_sites_whatsapp_phone_check CHECK (
    whatsapp_phone_e164 IS NULL
    OR whatsapp_phone_e164 ~ '^\+(33[67][0-9]{8}|417[5-9][0-9]{7}|324[5-9][0-9]{7}|3526[2-9]1[0-9]{6})$'
  );
