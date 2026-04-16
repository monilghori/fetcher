-- Nifty 50 Data Collector - Supabase Setup
-- Run this SQL in your Supabase SQL Editor

-- Create nifty50_ticks table
CREATE TABLE IF NOT EXISTS nifty50_ticks (
  id BIGSERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  market_timestamp TIMESTAMPTZ,
  ltp NUMERIC(10, 2) NOT NULL,
  open_price NUMERIC(10, 2),
  high_price NUMERIC(10, 2),
  low_price NUMERIC(10, 2),
  close_price NUMERIC(10, 2),
  volume BIGINT,
  open_interest BIGINT,
  net_change NUMERIC(10, 2),
  percent_change NUMERIC(6, 4),
  data_source TEXT DEFAULT 'dhan_api',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nifty50_ticks_fetched_at ON nifty50_ticks (fetched_at);
CREATE INDEX IF NOT EXISTS idx_nifty50_ticks_ltp ON nifty50_ticks (ltp);
CREATE INDEX IF NOT EXISTS idx_nifty50_ticks_created_at ON nifty50_ticks (created_at);

-- Create nifty50_sessions table for daily summaries
CREATE TABLE IF NOT EXISTS nifty50_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_date DATE NOT NULL UNIQUE,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  tick_count INTEGER DEFAULT 0,
  min_ltp NUMERIC(10, 2),
  max_ltp NUMERIC(10, 2),
  first_ltp NUMERIC(10, 2),
  last_ltp NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on session_date
CREATE INDEX IF NOT EXISTS idx_nifty50_sessions_date ON nifty50_sessions (session_date);

-- Enable Row Level Security
ALTER TABLE nifty50_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nifty50_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Allow public (anon key) to insert data
CREATE POLICY "Allow public insert on ticks" ON nifty50_ticks
  FOR INSERT
  WITH CHECK (true);

-- Allow public read access to nifty50_ticks (for dashboard)
CREATE POLICY "Allow public read access on ticks" ON nifty50_ticks
  FOR SELECT
  USING (true);

-- Allow service role full access to nifty50_ticks (if using service role key)
CREATE POLICY "Allow service role full access on ticks" ON nifty50_ticks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow service role full access to nifty50_sessions
CREATE POLICY "Allow service role full access on sessions" ON nifty50_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read access to nifty50_sessions
CREATE POLICY "Allow public read access on sessions" ON nifty50_sessions
  FOR SELECT
  USING (true);

-- Create a function to update session summaries (optional, for future use)
CREATE OR REPLACE FUNCTION update_session_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nifty50_sessions (
    session_date,
    window_start,
    window_end,
    tick_count,
    min_ltp,
    max_ltp,
    first_ltp,
    last_ltp,
    updated_at
  )
  VALUES (
    DATE(NEW.fetched_at),
    (SELECT MIN(fetched_at) FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at)),
    (SELECT MAX(fetched_at) FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at)),
    (SELECT COUNT(*) FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at)),
    (SELECT MIN(ltp) FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at)),
    (SELECT MAX(ltp) FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at)),
    (SELECT ltp FROM nifty50_ticks WHERE DATE(fetched_at) = DATE(NEW.fetched_at) ORDER BY fetched_at ASC LIMIT 1),
    NEW.ltp,
    NOW()
  )
  ON CONFLICT (session_date) DO UPDATE SET
    window_end = EXCLUDED.window_end,
    tick_count = EXCLUDED.tick_count,
    min_ltp = EXCLUDED.min_ltp,
    max_ltp = EXCLUDED.max_ltp,
    last_ltp = EXCLUDED.last_ltp,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update session summaries (optional)
-- Uncomment if you want automatic session summary updates
-- CREATE TRIGGER trigger_update_session_summary
--   AFTER INSERT ON nifty50_ticks
--   FOR EACH ROW
--   EXECUTE FUNCTION update_session_summary();

-- Verify tables were created
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('nifty50_ticks', 'nifty50_sessions');

-- Show sample query to verify setup
-- SELECT * FROM nifty50_ticks ORDER BY fetched_at DESC LIMIT 5;
