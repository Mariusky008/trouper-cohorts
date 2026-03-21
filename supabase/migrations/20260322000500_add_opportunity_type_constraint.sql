ALTER TABLE public.network_match_reviews
DROP CONSTRAINT IF EXISTS network_match_reviews_opportunity_type_check;

ALTER TABLE public.network_match_reviews
ADD CONSTRAINT network_match_reviews_opportunity_type_check
CHECK (
  opportunity_type IS NULL
  OR opportunity_type IN (
    'none',
    'good_contact',
    'future_exchange',
    'useful_intro',
    'potential_client',
    'real_business_opportunity',
    'collaboration_started'
  )
);

NOTIFY pgrst, 'reload schema';
