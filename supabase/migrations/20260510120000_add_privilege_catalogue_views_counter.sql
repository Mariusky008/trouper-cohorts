BEGIN;

ALTER TABLE public.human_marketplace_landing_events
  ADD COLUMN IF NOT EXISTS visitor_id uuid;

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_events_source_type_created_at
  ON public.human_marketplace_landing_events(source, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_events_visitor
  ON public.human_marketplace_landing_events(visitor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.human_admin_privilege_catalogue_current_month_stats()
RETURNS TABLE(total_views bigint, unique_visitors bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', timezone('Europe/Paris', now())) AS start_at,
      date_trunc('month', timezone('Europe/Paris', now())) + interval '1 month' AS end_at
  )
  SELECT
    COUNT(*)::bigint AS total_views,
    COUNT(DISTINCT visitor_id)::bigint AS unique_visitors
  FROM public.human_marketplace_landing_events, bounds
  WHERE source = 'privilege_catalogue'
    AND event_type = 'landing_view'
    AND created_at >= bounds.start_at
    AND created_at < bounds.end_at;
$$;

REVOKE ALL ON FUNCTION public.human_admin_privilege_catalogue_current_month_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.human_admin_privilege_catalogue_current_month_stats() TO service_role;

COMMIT;
