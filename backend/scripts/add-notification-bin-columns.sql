-- Add collector_id and bin_category to notification_bin for per-collector collection history
-- Run this in Supabase SQL Editor if columns don't exist

ALTER TABLE public.notification_bin
  ADD COLUMN IF NOT EXISTS collector_id int8 REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS bin_category text;

COMMENT ON COLUMN public.notification_bin.collector_id IS 'Collector who performed the drain/action';
COMMENT ON COLUMN public.notification_bin.bin_category IS 'Category of bin (Biodegradable, Non Biodegradable, Recyclable, Unsorted)';
