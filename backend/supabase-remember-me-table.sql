-- Run this in Supabase Dashboard > SQL Editor to create the remember_me_tokens table.
-- Used by the backend /api/remember-me routes (Railway) to store "Remember me" login per browser.

CREATE TABLE IF NOT EXISTS remember_me_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: allow backend service role to manage this table (RLS may block otherwise)
ALTER TABLE remember_me_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to remember_me_tokens"
  ON remember_me_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
