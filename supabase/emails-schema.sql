-- Emails table for iCloud inbox sync
CREATE TABLE IF NOT EXISTS emails (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid           BIGINT,
  message_id    TEXT UNIQUE,
  from_email    TEXT NOT NULL,
  from_name     TEXT,
  to_email      TEXT,
  subject       TEXT,
  body_text     TEXT,
  body_html     TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read       BOOLEAN DEFAULT FALSE,
  is_replied    BOOLEAN DEFAULT FALSE,
  thread_id     TEXT,
  folder        TEXT DEFAULT 'INBOX',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for fast sorting and lookup
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread   ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_read     ON emails(is_read);

-- RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Viewers and above can read emails
CREATE POLICY "Authenticated users can view emails"
  ON emails FOR SELECT
  TO authenticated
  USING (true);

-- Only admin+ can insert/update (sync does this via service role)
CREATE POLICY "Service role can insert emails"
  ON emails FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update emails"
  ON emails FOR UPDATE
  TO service_role
  USING (true);

-- Managers and above can mark as read
CREATE POLICY "Managers can update read status"
  ON emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin','admin','manager')
    )
  );
