-- Fix: Add INSERT policy for public/anon key
-- Run this in Supabase SQL Editor if you're getting permission errors

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public insert on ticks" ON nifty50_ticks;

-- Create policy to allow inserts with anon key
CREATE POLICY "Allow public insert on ticks" ON nifty50_ticks
  FOR INSERT
  WITH CHECK (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'nifty50_ticks';

-- Test insert (should succeed)
INSERT INTO nifty50_ticks (
  fetched_at,
  ltp,
  data_source,
  raw_response
) VALUES (
  NOW(),
  99999.99,
  'policy_test',
  '{"test": true}'::jsonb
);

-- Check if test row was inserted
SELECT * FROM nifty50_ticks WHERE data_source = 'policy_test' ORDER BY id DESC LIMIT 1;

-- Clean up test row
DELETE FROM nifty50_ticks WHERE data_source = 'policy_test';

-- Success message
SELECT 'INSERT policy added successfully! You can now insert data with anon key.' as status;
