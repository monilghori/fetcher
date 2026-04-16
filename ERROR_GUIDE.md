# Error Handling Guide

This guide explains all error messages you might encounter and how to fix them.

## Common Error Messages

### 1. Authentication Errors

#### "Authentication failed. Check CRON_SECRET configuration."
**Cause:** The CRON_SECRET in your request doesn't match the server configuration.

**Fix:**
1. Check `.env.local` file has `CRON_SECRET=your_secret_here`
2. If using the UI, check `NEXT_PUBLIC_CRON_SECRET` matches `CRON_SECRET`
3. Restart the dev server after changing environment variables

```bash
# .env.local should have:
CRON_SECRET=my_secure_secret_123
NEXT_PUBLIC_CRON_SECRET=my_secure_secret_123
```

#### "Dhan API authentication failed (401)"
**Cause:** Invalid or missing Dhan API credentials.

**Fix:**
1. Verify your Dhan API credentials are correct
2. Check `.env.local` has valid values:
   ```
   DHAN_ACCESS_TOKEN=your_actual_token
   DHAN_CLIENT_ID=your_actual_client_id
   ```
3. Make sure you're not using placeholder values like `your_dhan_access_token_here`
4. Get fresh credentials from Dhan HQ dashboard if needed

#### "Dhan API access forbidden (403)"
**Cause:** Credentials are invalid or expired.

**Fix:**
1. Log into your Dhan HQ account
2. Generate new API credentials
3. Update `.env.local` with new credentials
4. Restart the server

---

### 2. Database Errors

#### "Database error. Check Supabase connection."
**Cause:** Cannot connect to or write to Supabase database.

**Fix:**
1. Verify Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
2. Check Supabase project is active (not paused)
3. Verify the `nifty50_ticks` table exists
4. Run the setup SQL from `supabase-setup.sql`
5. Check Row Level Security (RLS) policies allow inserts

#### "Failed to save data to database"
**Cause:** Database insert failed due to permissions or schema issues.

**Fix:**
1. Check table schema matches the insert structure
2. Verify service role key has insert permissions
3. Check Supabase logs for detailed error
4. Ensure table columns accept the data types being inserted

---

### 3. Network Errors

#### "Unable to reach server. Is the app running?"
**Cause:** Frontend cannot connect to the Next.js backend.

**Fix:**
1. Make sure dev server is running: `npm run dev`
2. Check the server is on `http://localhost:3000`
3. Look for errors in the terminal where you ran `npm run dev`
4. Try restarting the dev server

#### "Network error. Please check your connection."
**Cause:** Internet connection issue or API endpoint unreachable.

**Fix:**
1. Check your internet connection
2. Try accessing https://api.dhan.co in browser
3. Check if firewall is blocking requests
4. Verify no proxy issues

#### "Request timeout. Server may be slow."
**Cause:** API request took too long to respond.

**Fix:**
1. Check your internet speed
2. Dhan API might be experiencing high load
3. Try again after a few seconds
4. Check Dhan API status page

---

### 4. Data Validation Errors

#### "Dhan API returned invalid data"
**Cause:** API response doesn't have expected structure.

**Fix:**
1. Check Dhan API is working properly
2. Verify security ID (13 for Nifty 50) is correct
3. Check API documentation for changes
4. Look at raw response in console logs

#### "Invalid Date Format"
**Cause:** Date parameter is not in YYYY-MM-DD format.

**Fix:**
Use correct format: `2024-04-16` not `16-04-2024` or `04/16/2024`

---

### 5. Rate Limiting

#### "Dhan API rate limit exceeded (429)"
**Cause:** Too many requests to Dhan API in short time.

**Fix:**
1. Wait 1-2 minutes before trying again
2. Reduce polling frequency if using auto-polling
3. Check if multiple instances are running
4. Review Dhan API rate limits in their documentation

---

### 6. Test Mode Errors

#### "Test stopped due to errors. Collected X ticks."
**Cause:** 3 consecutive failures during test collection.

**Fix:**
1. Check the specific error message shown
2. Verify all credentials are correct
3. Check internet connection is stable
4. Ensure Dhan API and Supabase are accessible
5. Try running test again after fixing the issue

#### "Test cancelled. Collected X ticks."
**Cause:** You clicked the Cancel button (this is normal, not an error).

**Action:** No fix needed. This is expected behavior.

---

## Error Message Colors

The UI uses different colors to indicate severity:

- 🔴 **Red** - Critical errors requiring immediate attention
- 🟡 **Yellow** - Warnings or partial failures
- 🟢 **Green** - Success messages
- 🟠 **Orange** - System-level issues

---

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# View your .env.local file
cat .env.local

# Make sure all required variables are set:
# - DHAN_ACCESS_TOKEN
# - DHAN_CLIENT_ID
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - CRON_SECRET
# - NEXT_PUBLIC_CRON_SECRET
```

### Step 2: Check Server Logs
Look at the terminal where `npm run dev` is running for detailed error messages.

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### Step 4: Test Individual Components

**Test Dhan API:**
```bash
curl -X POST https://api.dhan.co/v2/marketfeed/quote \
  -H "Content-Type: application/json" \
  -H "access-token: YOUR_TOKEN" \
  -H "client-id: YOUR_CLIENT_ID" \
  -d '{"NSE_FNO":{"13":[{"secId":"13","type":"INDEX"}]}}'
```

**Test Supabase:**
1. Go to Supabase dashboard
2. Open SQL Editor
3. Run: `SELECT * FROM nifty50_ticks LIMIT 1;`

### Step 5: Restart Everything
```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Start fresh
npm run dev
```

---

## Getting Help

If errors persist:

1. **Check logs:** Look at both browser console and server terminal
2. **Copy error message:** Include the full error text
3. **Check configuration:** Verify all environment variables
4. **Test APIs separately:** Use curl or Postman to test Dhan API
5. **Review documentation:** Check `TROUBLESHOOTING.md` for more details

---

## Error Recovery

The application includes automatic error recovery:

- **Consecutive error limit:** Stops after 3 consecutive failures
- **Auto-retry:** Continues after single failures
- **Graceful degradation:** Shows partial data if some requests fail
- **Clear error messages:** Tells you exactly what went wrong and how to fix it
