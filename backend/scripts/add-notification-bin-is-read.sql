-- Add is_read to notification_bin for the Notifications UI (mark as read)
-- Run this in Supabase SQL Editor. Same DB is used locally and on Railway.

ALTER TABLE public.notification_bin
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

COMMENT ON COLUMN public.notification_bin.is_read IS 'Whether this notification has been read by the collector in the Notifications page';
