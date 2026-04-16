# Setup Checklist ✓

Use this checklist to ensure everything is configured correctly.

## 1. Supabase Setup

### Create Database Table
- [ ] Logged into Supabase dashboard
- [ ] Opened SQL Editor
- [ ] Ran the SQL from `supabase-setup.sql`
- [ ] Verified table creation (should see `nifty50_ticks` table)
- [ ] Tested with: `SELECT * FROM nifty50_ticks LIMIT 1;`

### Get Credentials
- [ ] Copied Project URL from Settings → API
- [ ] Copied Anon Key from Settings → API
- [ ] Copied Service Role Key from Settings → API (click "Reveal")

---

## 2. Dhan API Setup

### Get API Credentials
- [ ] Logged into Dhan HQ (https://dhanhq.co)
- [ ] Generated API credentials
- [ ] Copied Access Token
- [ ] Copied Client ID

---

## 3. Environment Configuration

### Create .env.local file
- [ ] Copied `.env.local.example` to `.env.local`
- [ ] Updated all placeholder values

### Required Variables
```env
# Supabase (3 variables)
- [ ] NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
- [ ] SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Dhan API (2 variables)
- [ ] DHAN_ACCESS_TOKEN=your_actual_token
- [ ] DHAN_CLIENT_ID=your_actual_client_id

# Security (2 variables)
- [ ] CRON_SECRET=your_secure_random_string
- [ ] NEXT_PUBLIC_CRON_SECRET=same_as_above
```

---

## 4. Installation

### Install Dependencies
```bash
- [ ] cd nifty50-data-collector
- [ ] npm install
```

---

## 5. Testing

### Start the App
```bash
- [ ] npm run dev
- [ ] App opens at http://localhost:3000
- [ ] No errors in terminal
```

### Test Data Collection
- [ ] Dashboard loads without errors
- [ ] Status cards show current time
- [ ] Click "🧪 Test Mode (1 min)" button
- [ ] Wait for 1 minute
- [ ] See "✓ Test completed! Collected X ticks" message
- [ ] "Recent Ticks" table shows collected data
- [ ] Chart displays data points

---

## 6. Verify Everything Works

### Check Database
- [ ] Go to Supabase dashboard
- [ ] Table Editor → nifty50_ticks
- [ ] See rows with data
- [ ] `data_source` column shows 'test_mode'

### Check UI
- [ ] Current Time updates every 5 seconds
- [ ] Latest LTP shows a number
- [ ] Today's Ticks shows count > 0
- [ ] Chart displays line graph
- [ ] Table shows tick data with timestamps

---

## Common Issues

### ❌ "Could not find the table 'nifty50_ticks'"
**Fix:** Run the SQL setup in Supabase (Step 1)

### ❌ "Dhan API authentication failed (401)"
**Fix:** Check DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID (Step 2)

### ❌ "Database error. Check Supabase configuration"
**Fix:** Verify SUPABASE_SERVICE_ROLE_KEY is correct (Step 3)

### ❌ "Authentication failed. Check CRON_SECRET"
**Fix:** Ensure CRON_SECRET and NEXT_PUBLIC_CRON_SECRET match (Step 3)

### ❌ Page shows "Loading..." forever
**Fix:** Check browser console (F12) for errors

---

## Success Criteria

You're all set when:

✅ Dashboard loads without errors  
✅ Test mode collects data successfully  
✅ Data appears in Supabase table  
✅ Chart and table display data  
✅ No error messages in UI or console  

---

## Next Steps

Once everything works:

1. **Production Setup:** Configure Vercel deployment (see `DEPLOYMENT.md`)
2. **Cron Job:** Set up automated data collection
3. **Monitoring:** Check logs regularly
4. **Backup:** Export data periodically

---

## Need Help?

📖 **Documentation:**
- `SETUP_DATABASE.md` - Database setup details
- `ERROR_GUIDE.md` - Error messages and fixes
- `TEST_MODE.md` - Testing instructions
- `TROUBLESHOOTING.md` - Common problems

🐛 **Still stuck?**
1. Check terminal logs for errors
2. Check browser console (F12)
3. Verify all environment variables
4. Try restarting the dev server
