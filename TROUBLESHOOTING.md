# Troubleshooting Guide

Common issues and their solutions for the Nifty 50 Data Collector.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Environment Variable Issues](#environment-variable-issues)
3. [API Connection Issues](#api-connection-issues)
4. [Database Issues](#database-issues)
5. [Deployment Issues](#deployment-issues)
6. [Data Collection Issues](#data-collection-issues)
7. [UI/Display Issues](#uidisplay-issues)
8. [Performance Issues](#performance-issues)

---

## Installation Issues

### Error: "npm install" fails

**Symptoms:**
\`\`\`
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
\`\`\`

**Solutions:**
\`\`\`bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Error: Node version mismatch

**Symptoms:**
\`\`\`
error: The engine "node" is incompatible with this module
\`\`\`

**Solution:**
\`\`\`bash
# Check your Node version
node --version

# Should be 18.x or higher
# Install Node 18+ from nodejs.org
\`\`\`

---

## Environment Variable Issues

### Error: "Supabase credentials not configured"

**Symptoms:**
- Dashboard shows connection errors
- API routes return 500 errors

**Solution:**
1. Check `.env.local` exists
2. Verify all variables are set:
\`\`\`bash
cat .env.local | grep SUPABASE
\`\`\`
3. Restart dev server after changes:
\`\`\`bash
# Stop server (Ctrl+C)
npm run dev
\`\`\`

### Error: "Unauthorized" when fetching ticks

**Symptoms:**
\`\`\`json
{ "error": "Unauthorized" }
\`\`\`

**Solution:**
Check that `CRON_SECRET` matches `NEXT_PUBLIC_CRON_SECRET`:
\`\`\`bash
# In .env.local
CRON_SECRET=my_secret_123
NEXT_PUBLIC_CRON_SECRET=my_secret_123  # Must match!
\`\`\`

### Error: Environment variables not working in Vercel

**Symptoms:**
- Works locally but fails in production
- "undefined" errors in Vercel logs

**Solution:**
1. Go to Vercel dashboard > Settings > Environment Variables
2. Verify all 7 variables are set
3. Check for typos or extra spaces
4. Redeploy after adding variables:
\`\`\`bash
git commit --allow-empty -m "Trigger redeploy"
git push
\`\`\`

---

## API Connection Issues

### Error: "Dhan API error (401)"

**Symptoms:**
\`\`\`json
{
  "error": "Failed to fetch tick",
  "message": "Dhan API error (401): Unauthorized"
}
\`\`\`

**Solutions:**

1. **Check credentials:**
\`\`\`bash
# Verify in .env.local
echo $DHAN_ACCESS_TOKEN
echo $DHAN_CLIENT_ID
\`\`\`

2. **Test Dhan API directly:**
\`\`\`bash
curl -X POST https://api.dhan.co/v2/marketfeed/quote \\
  -H "Content-Type: application/json" \\
  -H "access-token: YOUR_TOKEN" \\
  -H "client-id: YOUR_CLIENT_ID" \\
  -d '{"NSE_FNO":{"13":[{"secId":"13","type":"INDEX"}]}}'
\`\`\`

3. **Regenerate credentials:**
   - Log in to Dhan account
   - Go to API section
   - Generate new credentials
   - Update `.env.local`

### Error: "Dhan API error (429)"

**Symptoms:**
\`\`\`json
{
  "error": "Failed to fetch tick",
  "message": "Dhan API error (429): Too Many Requests"
}
\`\`\`

**Solution:**
Rate limit exceeded. Wait 1 minute and try again. Consider:
- Reducing polling frequency
- Checking if multiple instances are running
- Contacting Dhan support for rate limit increase

### Error: "Dhan API timeout"

**Symptoms:**
- Requests take > 10 seconds
- Timeout errors in logs

**Solutions:**
1. Check your internet connection
2. Verify Dhan API status
3. Try during off-peak hours
4. Increase Vercel function timeout (paid plans only)

---

## Database Issues

### Error: "Database error" when inserting

**Symptoms:**
\`\`\`json
{
  "error": "Database error",
  "details": "permission denied for table nifty50_ticks"
}
\`\`\`

**Solutions:**

1. **Check service role key:**
\`\`\`bash
# Verify in .env.local
echo $SUPABASE_SERVICE_ROLE_KEY
\`\`\`

2. **Verify RLS policies:**
\`\`\`sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'nifty50_ticks';
\`\`\`

Should show policy allowing service role access.

3. **Re-run setup SQL:**
   - Go to Supabase SQL Editor
   - Run `supabase-setup.sql` again

### Error: "Table does not exist"

**Symptoms:**
\`\`\`
relation "nifty50_ticks" does not exist
\`\`\`

**Solution:**
Run the setup SQL:
1. Go to Supabase > SQL Editor
2. Copy contents of `supabase-setup.sql`
3. Paste and run
4. Verify tables exist:
\`\`\`sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
\`\`\`

### Error: "Connection pool exhausted"

**Symptoms:**
- Intermittent database errors
- "remaining connection slots reserved" errors

**Solutions:**
1. Check for connection leaks in code
2. Reduce concurrent requests
3. Upgrade Supabase plan for more connections
4. Add connection pooling (Supabase Pro)

---

## Deployment Issues

### Error: Build fails on Vercel

**Symptoms:**
\`\`\`
Error: Build failed
\`\`\`

**Solutions:**

1. **Check build locally:**
\`\`\`bash
npm run build
\`\`\`

2. **Fix TypeScript errors:**
\`\`\`bash
npm run lint
\`\`\`

3. **Check Vercel logs:**
   - Go to Vercel dashboard
   - Click on failed deployment
   - Review build logs

4. **Common fixes:**
\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
\`\`\`

### Error: "Module not found" in production

**Symptoms:**
- Works locally but fails in Vercel
- "Cannot find module" errors

**Solution:**
Check import paths:
\`\`\`typescript
// ❌ Wrong
import { something } from '../../../lib/utils';

// ✅ Correct
import { something } from '@/lib/utils';
\`\`\`

### Error: Environment variables not loaded

**Symptoms:**
- "undefined" in Vercel function logs
- API calls fail with missing credentials

**Solution:**
1. Add all variables in Vercel dashboard
2. Ensure `NEXT_PUBLIC_` prefix for client-side vars
3. Redeploy after adding variables

---

## Data Collection Issues

### Issue: No data being collected

**Symptoms:**
- Dashboard shows 0 ticks
- Database table is empty

**Diagnostic Steps:**

1. **Check time window:**
\`\`\`javascript
// In browser console
const ist = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
console.log('IST Time:', ist);
// Should be between 14:55 and 15:05 on weekday
\`\`\`

2. **Check status API:**
\`\`\`bash
curl https://your-app.vercel.app/api/status
\`\`\`

3. **Test fetch manually:**
   - Click "Fetch Now" button
   - Check browser console for errors

4. **Check Vercel logs:**
   - Go to Vercel > Logs
   - Filter by `/api/fetch-tick`
   - Look for error messages

### Issue: Data collection stops mid-window

**Symptoms:**
- Starts collecting then stops
- Gaps in data

**Solutions:**

1. **Check browser tab:**
   - Tab must stay open for client-side polling
   - Don't minimize or switch tabs for long

2. **Check internet connection:**
   - Verify stable connection
   - Check for network interruptions

3. **Check Vercel function limits:**
   - Free tier: 100 hours/month
   - Monitor usage in Vercel dashboard

### Issue: Duplicate data entries

**Symptoms:**
- Same timestamp appears multiple times
- Inflated tick count

**Solution:**
Check for multiple instances:
1. Close all browser tabs
2. Open only one dashboard tab
3. Add unique constraint (optional):
\`\`\`sql
ALTER TABLE nifty50_ticks 
ADD CONSTRAINT unique_fetched_at UNIQUE (fetched_at);
\`\`\`

---

## UI/Display Issues

### Issue: Dashboard shows wrong time

**Symptoms:**
- Time doesn't match IST
- Countdown is incorrect

**Solution:**
Check timezone library:
\`\`\`bash
# Verify date-fns-tz is installed
npm list date-fns-tz

# Reinstall if missing
npm install date-fns-tz
\`\`\`

### Issue: Chart not rendering

**Symptoms:**
- Empty chart area
- "No data to display" message

**Solutions:**

1. **Check data:**
\`\`\`bash
curl https://your-app.vercel.app/api/ticks?limit=5
\`\`\`

2. **Check browser console:**
   - Look for Recharts errors
   - Verify data format

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Table not updating

**Symptoms:**
- New data in database but table doesn't update
- Stale data displayed

**Solutions:**

1. **Check auto-refresh:**
   - Should refresh every 5 seconds
   - Check browser console for errors

2. **Manual refresh:**
   - Reload page
   - Check if data appears

3. **Check API response:**
\`\`\`javascript
// In browser console
fetch('/api/ticks?limit=5')
  .then(r => r.json())
  .then(console.log);
\`\`\`

---

## Performance Issues

### Issue: Slow page load

**Symptoms:**
- Dashboard takes > 5 seconds to load
- Laggy interactions

**Solutions:**

1. **Check network:**
   - Open DevTools > Network tab
   - Look for slow requests

2. **Optimize queries:**
\`\`\`typescript
// Limit data fetched
fetch('/api/ticks?limit=20')  // Instead of 100
\`\`\`

3. **Check Vercel region:**
   - Ensure deployed to region close to India
   - Singapore (sin1) is optimal

### Issue: High database usage

**Symptoms:**
- Approaching 500MB limit
- Slow queries

**Solutions:**

1. **Check database size:**
\`\`\`sql
SELECT pg_size_pretty(pg_database_size('postgres'));
\`\`\`

2. **Clean old data:**
\`\`\`sql
-- Delete data older than 30 days
DELETE FROM nifty50_ticks 
WHERE fetched_at < NOW() - INTERVAL '30 days';
\`\`\`

3. **Archive old data:**
   - Export to CSV
   - Delete from database
   - Store in cloud storage

### Issue: High Vercel bandwidth usage

**Symptoms:**
- Approaching 100GB limit
- Bandwidth warnings

**Solutions:**

1. **Reduce polling frequency:**
\`\`\`typescript
// Change from 3s to 5s
const pollInterval = setInterval(async () => {
  await handleFetchNow();
}, 5000);  // 5 seconds instead of 3
\`\`\`

2. **Limit API responses:**
\`\`\`typescript
// Fetch fewer records
fetch('/api/ticks?limit=10')
\`\`\`

3. **Enable caching:**
\`\`\`typescript
// In API route
export const revalidate = 5;  // Cache for 5 seconds
\`\`\`

---

## Getting More Help

### Check Logs

**Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by function or time

**Supabase:**
1. Go to Supabase dashboard
2. Select your project
3. Click "Logs" in sidebar
4. Review database logs

**Browser:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### Debug Mode

Enable verbose logging:
\`\`\`typescript
// In lib/dhan.ts
console.log('Fetching from Dhan API...');
console.log('Response:', response);
\`\`\`

### Contact Support

If issues persist:

1. **Vercel Support:**
   - [vercel.com/support](https://vercel.com/support)
   - Include deployment URL and error logs

2. **Supabase Support:**
   - [supabase.com/support](https://supabase.com/support)
   - Include project ID and error messages

3. **Dhan Support:**
   - Contact through Dhan app
   - Include API error codes

### Community Help

- GitHub Issues: Open an issue with:
  - Error message
  - Steps to reproduce
  - Environment (local/production)
  - Logs (remove sensitive data)

---

## Prevention Tips

### Best Practices

1. **Always test locally first**
2. **Keep dependencies updated**
3. **Monitor usage regularly**
4. **Set up alerts for errors**
5. **Backup database regularly**
6. **Document any custom changes**
7. **Use version control (Git)**
8. **Test after every deployment**

### Monitoring Checklist

Daily:
- [ ] Check data collection during window
- [ ] Review Vercel function logs
- [ ] Verify database inserts

Weekly:
- [ ] Check database size
- [ ] Review bandwidth usage
- [ ] Test all features

Monthly:
- [ ] Update dependencies
- [ ] Review error patterns
- [ ] Clean old data
- [ ] Verify API credentials

---

## Quick Reference

### Restart Everything

\`\`\`bash
# Local
# Stop dev server (Ctrl+C)
rm -rf .next
npm run dev

# Production
git commit --allow-empty -m "Restart"
git push
\`\`\`

### Reset Database

\`\`\`sql
-- ⚠️ WARNING: Deletes all data!
TRUNCATE TABLE nifty50_ticks;
TRUNCATE TABLE nifty50_sessions;
\`\`\`

### Check Everything

\`\`\`bash
# Environment
cat .env.local

# Dependencies
npm list

# Build
npm run build

# Lint
npm run lint

# Test APIs
curl http://localhost:3000/api/status
curl http://localhost:3000/api/ticks
\`\`\`

---

Still stuck? Open a GitHub issue with detailed information!
