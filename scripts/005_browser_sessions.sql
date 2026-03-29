-- Browser automation sessions — VERDANT fills, human approves, then submits
CREATE TABLE IF NOT EXISTS browser_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending_review',
  -- pending_review: filled, screenshot taken, waiting for human
  -- approved: human approved, ready to submit
  -- rejected: human rejected
  -- submitted: form submitted successfully
  -- failed: something went wrong
  url TEXT NOT NULL,
  purpose TEXT,                    -- e.g. "DACON registration", "G-Cloud application"
  instructions TEXT,               -- what VERDANT was told to do
  form_data JSONB,                 -- key/value pairs VERDANT filled in
  screenshot_base64 TEXT,          -- screenshot of filled form before submit
  result_screenshot_base64 TEXT,   -- screenshot after submission
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ
);

ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON browser_sessions FOR ALL USING (true);
