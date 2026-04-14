-- Create sort_events table for tracking waste sorting events
CREATE TABLE IF NOT EXISTS public.sort_events (
    id SERIAL PRIMARY KEY,
    waste_type TEXT NOT NULL CHECK (waste_type IN ('Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted')),
    source TEXT NOT NULL DEFAULT 'manual_button' CHECK (source IN ('ml_detection', 'manual_button')),
    confidence REAL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE public.sort_events ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sort_events_triggered_at ON public.sort_events(triggered_at);
CREATE INDEX IF NOT EXISTS idx_sort_events_waste_type ON public.sort_events(waste_type);
CREATE INDEX IF NOT EXISTS idx_sort_events_source ON public.sort_events(source);