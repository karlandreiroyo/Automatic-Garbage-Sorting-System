-- Add assigned_at to bins for clean start on new assignment
-- Run in Supabase Dashboard > SQL Editor
--
-- When a bin is assigned to a collector, we only count waste_items
-- created after assigned_at. New assignments start at 0% fill level.

ALTER TABLE public.bins
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.bins.assigned_at IS 'When this bin was assigned to the current collector. Only waste_items after this time count toward fill level.';
