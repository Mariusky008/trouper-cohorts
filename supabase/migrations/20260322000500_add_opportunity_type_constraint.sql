ALTER TABLE public.network_match_reviews
DROP CONSTRAINT IF EXISTS network_match_reviews_opportunity_type_check;

UPDATE public.network_match_reviews
SET opportunity_type = CASE
  WHEN opportunity_type IN ('clients', 'client') THEN 'potential_client'
  WHEN opportunity_type IN ('contact', 'good') THEN 'good_contact'
  WHEN opportunity_type IN ('intro', 'introduction') THEN 'useful_intro'
  WHEN opportunity_type IN ('future', 'rdv') THEN 'future_exchange'
  WHEN opportunity_type IN ('opportunity', 'business_opportunity') THEN 'real_business_opportunity'
  WHEN opportunity_type IN ('collaboration', 'partnership') THEN 'collaboration_started'
  WHEN opportunity_type IN ('none', 'good_contact', 'future_exchange', 'useful_intro', 'potential_client', 'real_business_opportunity', 'collaboration_started') THEN opportunity_type
  ELSE NULL
END
WHERE opportunity_type IS NOT NULL;

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
