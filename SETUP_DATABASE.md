# Database Setup Guide

## Error: "Could not find the table 'public.nifty50_ticks' in the schema cache"

This means the database table hasn't been created yet. Follow these steps to set it up:

---

## Quick Setup (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Select your project (or create a new one)

### Step 2: Run the Setup SQL

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** button
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Table Creation

You should see a success message showing:
```
table_name       | column_count
-----------------+-------------
nifty50_ticks    | 15
nifty50_sessions | 10
```

### Step 4: Test the Table

Run this query to verify:
```sql
SELECT * FROM nifty50_ticks LIMIT 1;
```

You should see column headers (even if no data yet).

---

## Alternative: Copy-Paste SQL

If you prefer, here's the minimal SQL to create just the main table:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nifty50_ticks_fetched_at ON nifty50_ticks (fetched_at);

-- Enable Row Level Security
ALTER TABLE nifty50_ticks ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on ticks" ON nifty50_ticks
  FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on ticks" ON nifty50_ticks
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Step 5: Get Your Supabase Credentials

After creating the table, get your credentials:

1. In Supabase dashboard, click **"Settings"** (gear icon)
2. Click **"API"** in the left menu
3. Copy these values to your `.env.local`:

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key (under "Project API keys")
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (under "Project API keys" - click "Reveal")
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important:** Keep the Service Role Key secret! Never commit it to git.

---

## Step 6: Restart Your App

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

---

## Troubleshooting

### "Permission denied for table nifty50_ticks"

**Fix:** Make sure you ran the RLS policies from the SQL file.

### "relation 'nifty50_ticks' already exists"

**Fix:** This is fine! The table exists. Just verify with:
```sql
SELECT COUNT(*) FROM nifty50_ticks;
```

### "Could not find the table" still appears

**Fix:**
1. Check you're using the correct Supabase project
2. Verify the URL in `.env.local` matches your project
3. Try refreshing the schema cache:
   - Go to Supabase Dashboard
   - Settings → API
   - Click "Reload schema cache"

### Table exists but can't insert data

**Fix:** Check the service role key:
1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Verify it's the service role key, not the anon key
3. Check RLS policies allow inserts

---

## Verify Everything Works

After setup, test the app:

1. Start the app: `npm run dev`
2. Open http://localhost:3000
3. Click **"🧪 Test Mode (1 min)"** button
4. Wait for data collection
5. Check the "Recent Ticks" table shows data

---

## What the Tables Do

### `nifty50_ticks`
Stores every data point collected:
- LTP (Last Traded Price)
- OHLC (Open, High, Low, Close)
- Volume and Open Interest
- Timestamp
- Raw API response

### `nifty50_sessions` (optional)
Stores daily summaries:
- Date
- Total ticks collected
- Min/Max LTP
- First/Last LTP

---

## Need Help?

If you're still having issues:

1. Check the Supabase logs:
   - Dashboard → Logs → Postgres Logs
2. Verify table exists:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nifty50_ticks';
   ```
