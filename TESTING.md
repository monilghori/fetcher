# Testing Guide

Complete guide to test your Nifty 50 Data Collector before and after deployment.

## Pre-Deployment Testing (Local)

### 1. Environment Setup Test

\`\`\`bash
# Verify all environment variables are set
cat .env.local
\`\`\`

Check that all 7 variables are present:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ DHAN_ACCESS_TOKEN
- ✅ DHAN_CLIENT_ID
- ✅ CRON_SECRET
- ✅ NEXT_PUBLIC_CRON_SECRET

### 2. Supabase Connection Test

\`\`\`bash
# Start dev server
npm run dev
\`\`\`

Open browser console and check for Supabase errors.

### 3. Dhan API Test

Test Dhan API directly with curl:

\`\`\`bash
curl -X POST https://api.dhan.co/v2/marketfeed/quote \\
  -H "Content-Type: application/json" \\
  -H "access-token: YOUR_DHAN_ACCESS_TOKEN" \\
  -H "client-id: YOUR_DHAN_CLIENT_ID" \\
  -d '{"NSE_FNO":{"13":[{"secId":"13","type":"INDEX"}]}}'
\`\`\`

Expected response:
\`\`\`json
{
  "data": {
    "last_price": 23456.78,
    "open": 23400.00,
    "high": 23500.00,
    "low": 23350.00,
    ...
  }
}
\`\`\`

### 4. API Routes Test

#### Test Status Endpoint

\`\`\`bash
curl http://localhost:3000/api/status
\`\`\`

Expected response:
\`\`\`json
{
  "isWithinWindow": false,
  "currentTime": "2024-04-16 10:30:45",
  "nextWindowStart": "2024-04-16 14:55:00",
  "secondsUntilWindow": 15915,
  "todayTickCount": 0
}
\`\`\`

#### Test Ticks Endpoint

\`\`\`bash
curl http://localhost:3000/api/ticks?limit=5
\`\`\`

Expected response:
\`\`\`json
{
  "ticks": [],
  "count": 0,
  "currentTime": "2024-04-16 10:30:45"
}
\`\`\`

#### Test Fetch Tick Endpoint (During Window Only)

\`\`\`bash
curl -X POST http://localhost:3000/api/fetch-tick \\
  -H "Content-Type: application/json" \\
  -H "x-cron-secret: YOUR_CRON_SECRET"
\`\`\`

Outside window response:
\`\`\`json
{
  "status": "outside_window",
  "message": "Not within collection window (14:55-15:05 IST, Mon-Fri)",
  "currentTime": "2024-04-16 10:30:45"
}
\`\`\`

During window response:
\`\`\`json
{
  "status": "success",
  "tick": {
    "id": 1,
    "ltp": 23456.78,
    "fetched_at": "2024-04-16T14:55:30.000Z",
    ...
  },
  "fetchedAt": "2024-04-16 14:55:30"
}
\`\`\`

### 5. Dashboard Test

Open [http://localhost:3000](http://localhost:3000)

Check:
- ✅ Page loads without errors
- ✅ Current time displays correctly
- ✅ Status badge shows correct state
- ✅ Countdown timer works (if outside window)
- ✅ Chart renders (even if empty)
- ✅ Table shows "No ticks collected yet"

### 6. Time Zone Test

Verify IST time is correct:

\`\`\`javascript
// In browser console
const ist = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
console.log('IST Time:', ist);
\`\`\`

### 7. Database Test

Check Supabase:

1. Go to Supabase > Table Editor
2. Select `nifty50_ticks` table
3. Verify table exists and has correct columns

## During Market Hours Testing

### 8. Live Collection Test (14:55-15:05 IST, Mon-Fri)

#### Automatic Polling Test

1. Open dashboard at 14:54 IST
2. Wait for 14:55
3. Verify:
   - ✅ Status changes to "COLLECTING"
   - ✅ Auto-polling message appears
   - ✅ Data starts appearing in table
   - ✅ Chart updates with new points

#### Manual Fetch Test

1. Click "Fetch Now" button
2. Verify:
   - ✅ Button is enabled
   - ✅ No error message appears
   - ✅ New tick appears in table
   - ✅ Chart updates

#### Database Verification

1. Go to Supabase > Table Editor
2. Refresh `nifty50_ticks` table
3. Verify:
   - ✅ New records are being inserted
   - ✅ LTP values are realistic (e.g., 23000-24000)
   - ✅ Timestamps are correct
   - ✅ raw_response contains full data

### 9. Performance Test

Monitor during collection:

\`\`\`javascript
// In browser console
console.time('fetch');
fetch('/api/fetch-tick', {
  method: 'POST',
  headers: { 'x-cron-secret': 'YOUR_SECRET' }
}).then(() => console.timeEnd('fetch'));
\`\`\`

Expected: < 2 seconds

## Post-Deployment Testing (Vercel)

### 10. Deployment Verification

After deploying to Vercel:

\`\`\`bash
# Replace with your Vercel URL
export APP_URL="https://your-app.vercel.app"

# Test status
curl $APP_URL/api/status

# Test ticks
curl $APP_URL/api/ticks?limit=5
\`\`\`

### 11. Environment Variables Check

In Vercel dashboard:
1. Go to Settings > Environment Variables
2. Verify all 7 variables are set
3. Check for typos or missing values

### 12. Function Logs Check

In Vercel dashboard:
1. Go to Logs tab
2. Filter by function: `/api/fetch-tick`
3. Look for errors during collection window

### 13. Production Dashboard Test

Open your Vercel URL:

Check:
- ✅ HTTPS is working
- ✅ Page loads quickly (< 3 seconds)
- ✅ No console errors
- ✅ Status updates every 5 seconds
- ✅ Responsive on mobile

### 14. Cross-Browser Test

Test on:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari (if available)
- ✅ Mobile browsers

### 15. Load Test (Optional)

Simulate multiple users:

\`\`\`bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install ab

# Test with 10 concurrent users, 100 requests
ab -n 100 -c 10 $APP_URL/api/status
\`\`\`

Expected: All requests succeed

## Error Scenarios Testing

### 16. Invalid Credentials Test

Temporarily change one env var to invalid value:

\`\`\`bash
# In Vercel, change DHAN_ACCESS_TOKEN to "invalid"
# Then test fetch-tick endpoint
\`\`\`

Expected: Error message, no crash

### 17. Database Connection Test

Temporarily change Supabase URL to invalid:

Expected: Graceful error handling

### 18. Rate Limit Test

Make rapid requests to Dhan API:

\`\`\`bash
for i in {1..10}; do
  curl -X POST $APP_URL/api/fetch-tick \\
    -H "x-cron-secret: YOUR_SECRET"
  sleep 0.1
done
\`\`\`

Expected: Some may fail with 429, but app doesn't crash

## Monitoring & Alerts

### 19. Set Up Monitoring

#### Vercel Analytics

1. Enable in Vercel dashboard
2. Monitor:
   - Function execution time
   - Error rate
   - Bandwidth usage

#### Supabase Monitoring

1. Go to Supabase > Database
2. Monitor:
   - Database size
   - Query performance
   - Connection count

### 20. Create Test Alerts

Set up alerts for:
- Function errors > 5 in 5 minutes
- Database size > 400MB (80% of free tier)
- Bandwidth > 80GB (80% of free tier)

## Regression Testing

### 21. After Code Changes

Before deploying updates:

\`\`\`bash
# Run local tests
npm run build
npm run lint

# Test all API endpoints
curl http://localhost:3000/api/status
curl http://localhost:3000/api/ticks
curl -X POST http://localhost:3000/api/fetch-tick \\
  -H "x-cron-secret: YOUR_SECRET"

# Visual regression test
# Open dashboard and verify UI looks correct
\`\`\`

### 22. After Dependency Updates

\`\`\`bash
# Update dependencies
npm update

# Rebuild
npm run build

# Test thoroughly before deploying
\`\`\`

## Data Integrity Testing

### 23. Verify Data Accuracy

Compare with official Nifty 50 data:

1. During collection window, note LTP from dashboard
2. Check NSE website: [nseindia.com](https://www.nseindia.com)
3. Verify values match (within 1-2 points)

### 24. Check Data Consistency

\`\`\`sql
-- Run in Supabase SQL Editor

-- Check for duplicate timestamps
SELECT fetched_at, COUNT(*)
FROM nifty50_ticks
GROUP BY fetched_at
HAVING COUNT(*) > 1;

-- Check for null LTPs
SELECT COUNT(*)
FROM nifty50_ticks
WHERE ltp IS NULL;

-- Check for unrealistic values
SELECT *
FROM nifty50_ticks
WHERE ltp < 20000 OR ltp > 30000;
\`\`\`

Expected: No results (all data is clean)

## Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Page load | < 2s | < 3s |
| API response | < 1s | < 2s |
| Dhan API call | < 1s | < 2s |
| Database insert | < 500ms | < 1s |
| Chart render | < 500ms | < 1s |

### Measure Performance

\`\`\`javascript
// In browser console
performance.mark('start');
fetch('/api/ticks?limit=50')
  .then(() => {
    performance.mark('end');
    performance.measure('fetch-ticks', 'start', 'end');
    console.log(performance.getEntriesByName('fetch-ticks')[0].duration);
  });
\`\`\`

## Troubleshooting Common Issues

### Issue: "Unauthorized" on fetch-tick

**Test:**
\`\`\`bash
echo $CRON_SECRET
echo $NEXT_PUBLIC_CRON_SECRET
\`\`\`

**Fix:** Ensure both match exactly

### Issue: No data in database

**Test:**
\`\`\`sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'nifty50_ticks';
\`\`\`

**Fix:** Verify service role policy exists

### Issue: Wrong time zone

**Test:**
\`\`\`javascript
console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
\`\`\`

**Fix:** Verify date-fns-tz is installed

## Test Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Supabase connection works
- [ ] Dhan API responds correctly
- [ ] All API routes return expected responses
- [ ] Dashboard loads without errors
- [ ] Time zone calculations correct
- [ ] Database tables exist

### During Market Hours
- [ ] Auto-polling starts at 14:55 IST
- [ ] Data is collected every 3 seconds
- [ ] Manual fetch works
- [ ] Chart updates in real-time
- [ ] Table shows new ticks
- [ ] Database receives inserts

### Post-Deployment
- [ ] Vercel deployment successful
- [ ] All environment variables in Vercel
- [ ] Production dashboard accessible
- [ ] API endpoints work on production
- [ ] No errors in Vercel logs
- [ ] Data collection works in production
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Ongoing
- [ ] Monitor Vercel function logs daily
- [ ] Check database size weekly
- [ ] Verify data accuracy weekly
- [ ] Review error rates monthly
- [ ] Test after any code changes

## Success Criteria

Your app is working correctly if:

1. ✅ Dashboard loads in < 3 seconds
2. ✅ Status updates every 5 seconds
3. ✅ Auto-polling starts during window
4. ✅ Data is collected every 3 seconds
5. ✅ All ticks are stored in database
6. ✅ No errors in Vercel logs
7. ✅ LTP values match NSE data
8. ✅ Chart renders smoothly
9. ✅ Mobile experience is good
10. ✅ No data loss or corruption

## Getting Help

If tests fail:

1. Check Vercel function logs
2. Review Supabase logs
3. Test Dhan API directly
4. Verify environment variables
5. Check browser console
6. Review this testing guide
7. Open GitHub issue with details

Happy testing! 🧪
