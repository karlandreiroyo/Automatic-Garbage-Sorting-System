-- Persist collector bin fill levels so they survive refresh, logout, tab close, and backend restart.
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS public.agss_bin_state (
  id int PRIMARY KEY DEFAULT 1,
  bins jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agss_bin_state IS 'Single-row store for AGSS collector bin fill levels (Biodegradable, Non-Bio, Recyclable, Unsorted)';

-- Ensure one row exists
INSERT INTO public.agss_bin_state (id, bins, updated_at)
VALUES (1, '[]', now())
ON CONFLICT (id) DO NOTHING;
