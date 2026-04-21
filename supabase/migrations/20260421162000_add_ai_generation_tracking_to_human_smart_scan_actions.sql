BEGIN;

ALTER TABLE public.human_smart_scan_actions
  ADD COLUMN IF NOT EXISTS ai_prompt_version text,
  ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_generation_source text;

ALTER TABLE public.human_smart_scan_actions
  DROP CONSTRAINT IF EXISTS human_smart_scan_actions_ai_generation_source_check;

ALTER TABLE public.human_smart_scan_actions
  ADD CONSTRAINT human_smart_scan_actions_ai_generation_source_check
  CHECK (
    ai_generation_source IS NULL
    OR ai_generation_source IN ('ai', 'fallback')
  );

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner_ai_generated
  ON public.human_smart_scan_actions(owner_member_id, ai_generated_at DESC);

COMMIT;
