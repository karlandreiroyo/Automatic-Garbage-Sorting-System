-- Run this ONCE in Supabase Dashboard > SQL Editor to fix:
--   "Could not find the table 'public.remember_me_tokens' in the schema cache"
-- Then redeploy your Railway backend. Remember me (username + password) will then work on Railway.

CREATE TABLE IF NOT EXISTS remember_me_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE remember_me_tokens ENABLE ROW LEVEL SECURITY;

-- Drop first so you can re-run this script without errors
DROP POLICY IF EXISTS "Allow service role full access to remember_me_tokens" ON remember_me_tokens;
CREATE POLICY "Allow service role full access to remember_me_tokens"
  ON remember_me_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
