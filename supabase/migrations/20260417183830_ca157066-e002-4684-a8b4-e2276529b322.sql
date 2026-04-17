-- Track follow-ups sent per application
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS follow_ups_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body text;

-- Email events log (opens, replies, sends)
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- sent, opened, replied, follow_up_sent, classified
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email events"
  ON public.email_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own email events"
  ON public.email_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_follow_up ON public.applications(user_id, status, last_activity_at) WHERE status = 'sent';