BEGIN;

CREATE TABLE IF NOT EXISTS public.human_smart_scan_radar_run_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.human_smart_scan_radar_runs(id) ON DELETE CASCADE,
  prospect_id text NOT NULL,
  full_name text NOT NULL,
  normalized_name text,
  metier text,
  city text,
  distance_km integer,
  phone_e164 text,
  synergy_reason text,
  message_draft text,
  selected boolean NOT NULL DEFAULT false,
  whatsapp_opened_at timestamptz,
  sent_declared_at timestamptz,
  is_duplicate boolean NOT NULL DEFAULT false,
  duplicate_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_smart_scan_radar_run_contacts_run_prospect
  ON public.human_smart_scan_radar_run_contacts(run_id, prospect_id);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_radar_run_contacts_owner_created
  ON public.human_smart_scan_radar_run_contacts(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_radar_run_contacts_run_created
  ON public.human_smart_scan_radar_run_contacts(run_id, created_at DESC);

ALTER TABLE public.human_smart_scan_radar_run_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radar run contacts select own or admin" ON public.human_smart_scan_radar_run_contacts;
CREATE POLICY "radar run contacts select own or admin"
  ON public.human_smart_scan_radar_run_contacts
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_run_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar run contacts insert own or admin" ON public.human_smart_scan_radar_run_contacts;
CREATE POLICY "radar run contacts insert own or admin"
  ON public.human_smart_scan_radar_run_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_run_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar run contacts update own or admin" ON public.human_smart_scan_radar_run_contacts;
CREATE POLICY "radar run contacts update own or admin"
  ON public.human_smart_scan_radar_run_contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_run_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_run_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
