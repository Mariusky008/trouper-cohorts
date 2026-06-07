-- Catalogue Privilège — tracking d'engagement.
-- La table human_marketplace_events avait une contrainte CHECK qui n'autorisait
-- que ('seeded','status_changed','offer_submitted','join_requested','sell_requested').
-- Les events du catalogue swipe (priv_open, priv_view, priv_favorite, priv_reserve,
-- priv_card_open, priv_mystery_reveal) étaient donc TOUS rejetés → stats à 0.
-- On élargit la contrainte pour accepter tout event_type commençant par 'priv'.

ALTER TABLE public.human_marketplace_events
  DROP CONSTRAINT IF EXISTS human_marketplace_events_type_check;

ALTER TABLE public.human_marketplace_events
  ADD CONSTRAINT human_marketplace_events_type_check CHECK (
    event_type IN ('seeded', 'status_changed', 'offer_submitted', 'join_requested', 'sell_requested')
    OR event_type LIKE 'priv%'
  );
