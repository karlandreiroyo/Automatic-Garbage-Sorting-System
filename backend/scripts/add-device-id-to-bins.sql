-- Add device_id column to bins table for hardware linkage
-- Run in Supabase Dashboard > SQL Editor
-- 
-- This links each bin to a physical device (Arduino, Raspberry Pi, sensor unit).
-- When hardware sends data with device_id, the backend can attribute it to the correct bin.

ALTER TABLE public.bins
ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT NULL;

-- Optional: add comment for documentation
COMMENT ON COLUMN public.bins.device_id IS 'Hardware device identifier. When Pi/Arduino sends device_id matching this value, detections are attributed to this bin.';
