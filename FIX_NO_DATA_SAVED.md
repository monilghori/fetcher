# Fix: No Data Being Saved to Supabase

## Problem
Test mode runs successfully but no records appear in the Supabase `nifty50_ticks` table.

## Root Cause
The RLS (Row Level Security) policies don't allow INSERT operations with the anon key. Only SELECT (read) is allowed.

---

## Solution: Add INSERT Policy

### Option 1: Quick Fix (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add INSERT policy for anon key
CREATE POLICY "Allow public insert on ticks" ON nifty50_ticks
  FOR INSERT
  WITH CHECK (true);
```

### Option 2: Run the Fix Script

1. Open Supabase Dashboard → SQL Editor
2. Copy all contents from `fix-insert-policy.sql`
3. Paste and click "Run"
4. You should see: "INSERT policy added successfully!"

---

## Verify the Fix

### Step 1: Check Policies
Run this in Supabase SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'nifty50_ticks';
```

You should see at least these policies:
- `Allow public insert on ticks` - cmd: INSERT
- `Allow public read access on ticks` - cmd: SELECT

### Step 2: Test Insert
Run this test in Supabase SQL Editor:

```sql
-- Test insert
INSERT INTO nifty50_ticks (
  fetched_at,
  ltp,
  data_source
) VALUES (
  NOW(),
  12345.67,
  'manual_test'
);

-- Check if it worked
SELECT * FROM nifty50_ticks WHERE data_source = 'manual_test';

-- Clean up
DELETE FROM nifty50_ticks WHERE data_source = 'manual_test';
```

If you see the test row, the policy is working!

### Step 3: Test from App

1. Restart your dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "🧪 Test Mode (1 min)"

4. Wait for completion

5. Check Supabase:
   - Go to Table Editor → nifty50_ticks
   - You should see rows with `data_source = 'test_mode'`

---

## Alternative: Use Service Role Key (Not Recommended for Production)

If you prefer to use the service role key instead:

1. Get your service role key:
   - Supabase Dashboard → Settings → API
   - Under "Project API keys" → Service Role Key
   - Click "Reveal" and copy

2. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Update the code to use `getSupabaseServerClient()` instead of `getSupabaseBrowserClient()`

⚠️ **Warning:** Service role key bypasses ALL security rules. Only use in server-side code, never expose to client.

---

## Debugging Steps

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors during test mode
4. Common errors:
   - "new row violates row-level security policy" → RLS policy issue
   - "permission denied" → Need INSERT policy
   - "relation does not exist" → Table not created

### Check Network Tab
1. Open DevTools (F12) → Network tab
2. Click Test Mode button
3. Look for `/api/fetch-tick` requests
4. Check response:
   - Status 200 = Success
   - Status 500 = Server error (check terminal logs)
   - Status 401 = Auth error

### Check Server Logs
Look at the terminal where `npm run dev` is running:
- "Supabase insert error" → Check the error details
- "Database Error" → RLS policy or connection issue

---

## Common Errors and Fixes

### Error: "new row violates row-level security policy"
**Fix:** Run the INSERT policy SQL above

### Error: "permission denied for table nifty50_ticks"
**Fix:** 
1. Check RLS is enabled: `ALTER TABLE nifty50_ticks ENABLE ROW LEVEL SECURITY;`
2. Add INSERT policy (see above)

### Error: "null value in column 'ltp' violates not-null constraint"
**Fix:** Dhan API returned invalid data. Check:
- DHAN_ACCESS_TOKEN is valid
- DHAN_CLIENT_ID is correct
- API is not rate limited

### No error but still no data
**Fix:**
1. Check browser console for silent errors
2. Verify Supabase URL and anon key are correct
3. Check table name is exactly `nifty50_ticks` (case-sensitive)
4. Try the diagnostic endpoint: http://localhost:3000/api/diagnose

---

## Test Checklist

After applying the fix:

- [ ] INSERT policy exists in Supabase
- [ ] Manual INSERT test works in SQL Editor
- [ ] Test Mode button completes without errors
- [ ] "✓ Test completed! Collected X ticks" message appears
- [ ] Data visible in Supabase Table Editor
- [ ] `data_source` column shows 'test_mode'
- [ ] Chart displays data points
- [ ] Recent Ticks table shows data

---

## Still Not Working?

Run the diagnostic endpoint:
```
http://localhost:3000/api/diagnose
```

This will check:
- Environment variables
- Supabase connection
- Table existence
- Insert permissions
- Dhan API connection

Share the diagnostic output for further help!
