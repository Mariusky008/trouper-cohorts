ALTER TABLE public.commando_applications
ADD COLUMN IF NOT EXISTS qualification_status TEXT NOT NULL DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.commando_applications
DROP CONSTRAINT IF EXISTS commando_applications_qualification_status_check;

ALTER TABLE public.commando_applications
ADD CONSTRAINT commando_applications_qualification_status_check
CHECK (qualification_status IN ('pending_review', 'call_scheduled', 'qualified', 'rejected'));

CREATE INDEX IF NOT EXISTS commando_applications_email_idx ON public.commando_applications (email);
CREATE INDEX IF NOT EXISTS commando_applications_phone_idx ON public.commando_applications (phone);
