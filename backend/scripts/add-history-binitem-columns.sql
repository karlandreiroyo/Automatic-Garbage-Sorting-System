-- Add columns to history_binitem so drained waste_items can be moved here when collector drains a bin.
-- Run this in Supabase SQL Editor if columns don't exist.

ALTER TABLE public.history_binitem
  ADD COLUMN IF NOT EXISTS bin_id int8 REFERENCES public.bins(id),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS processing_time numeric,
  ADD COLUMN IF NOT EXISTS drained_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS collector_id int8 REFERENCES public.users(id);

COMMENT ON COLUMN public.history_binitem.bin_id IS 'Bin that was drained';
COMMENT ON COLUMN public.history_binitem.category IS 'Waste category (Biodegradable, Non Biodegradable, Recyclable, Unsorted)';
COMMENT ON COLUMN public.history_binitem.drained_at IS 'When this bin was drained (collector action)';
COMMENT ON COLUMN public.history_binitem.collector_id IS 'Collector who drained the bin';
