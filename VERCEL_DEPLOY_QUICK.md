# Quick Vercel Deployment Guide

## 🚀 Deploy in 15 Minutes

### Prerequisites
- ✅ Supabase database setup complete (table created with INSERT policy)
- ✅ Dhan API credentials ready
- ✅ GitHub account
- ✅ Vercel account (free)

---

## Step 1: Push to GitHub (3 min)

```bash
cd nifty50-data-collector

# Initialize git (if not already done)
git init
git add .
git commit -m "Deploy Nifty 50 Data Collector"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/nifty50-data-collector.git
git branch -M main
git push -u origin main
```

⚠️ **Important:** Make sure `.env.local` is in `.gitignore` (it already is)

---

## Step 2: Deploy to Vercel (5 min)

### 2.1 Import Project
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub repository
4. Vercel auto-detects Next.js ✓

### 2.2 Add Environment Variables

Click **"Environment Variables"** and add these:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qwygedlfhehwgscxjuwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DHAN_ACCESS_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...
DHAN_CLIENT_ID=1100896497
CRON_SECRET=sadahfsdhvhfvhygfurehgkjfnkhb9uerytgewuirgijeawbfjkdsvyhgrye
NEXT_PUBLIC_CRON_SECRET=sadahfsdhvhfvhygfurehgkjfnkhb9uerytgewuirgijeawbfjkdsvyhgrye
```

**Note:** You can copy these from your `.env.local` file

⚠️ **Critical:** 
- `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET` must match exactly
- Don't include `SUPABASE_SERVICE_ROLE_KEY` (we're using anon key with RLS policies)

### 2.3 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Get your URL: `https://your-app.vercel.app`

---

## Step 3: Verify Deployment (2 min)

### 3.1 Check Dashboard
1. Visit your Vercel URL
2. Dashboard should load
3. Status cards show current time
4. No errors in browser console (F12)

### 3.2 Test Data Collection
1. Click **"🧪 Test Mode (1 min)"** button
2. Wait for completion
3. Check Supabase table for data

### 3.3 Check Vercel Logs
1. Go to Vercel dashboard → Your project
2. Click **"Logs"** tab
3. Look for any errors

---

## Step 4: Setup Automatic Collection (Optional)

### Option A: Vercel Cron (Requires Hobby Plan - $20/month)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/fetch-tick",
    "schedule": "*/3 14-15 * * 1-5"
  }]
}
```

This runs every 3 seconds during 14:55-15:05 IST, Mon-Fri.

### Option B: External Cron Service (Free)

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

Setup:
1. Create a cron job
2. URL: `https://your-app.vercel.app/api/fetch-tick`
3. Method: POST
4. Headers:
   ```
   x-cron-secret: your_cron_secret_here
   Content-Type: application/json
   ```
5. Schedule: Every 3 seconds during 14:55-15:05 IST, Mon-Fri

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key | `eyJhbGc...` |
| `DHAN_ACCESS_TOKEN` | ✅ Yes | Dhan API access token | `eyJ0eXA...` |
| `DHAN_CLIENT_ID` | ✅ Yes | Dhan client ID | `1100896497` |
| `CRON_SECRET` | ✅ Yes | Secret for API auth | Random string |
| `NEXT_PUBLIC_CRON_SECRET` | ✅ Yes | Must match CRON_SECRET | Same as above |

---

## Troubleshooting

### ❌ Build Failed

**Check:**
```bash
# Test build locally
npm run build
```

**Common fixes:**
- Run `npm install` to ensure all dependencies
- Check TypeScript errors
- Verify all imports are correct

### ❌ "Unauthorized" Error

**Fix:** 
- Verify `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET` match exactly
- No extra spaces or quotes

### ❌ "Database Error"

**Fix:**
- Check Supabase URL and anon key are correct
- Verify INSERT policy exists:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'nifty50_ticks';
  ```
- Run `fix-insert-policy.sql` if needed

### ❌ "Dhan API Error"

**Fix:**
- Verify credentials are correct
- Check token hasn't expired
- Test with curl:
  ```bash
  curl -X POST https://api.dhan.co/v2/marketfeed/quote \
    -H "access-token: YOUR_TOKEN" \
    -H "client-id: YOUR_CLIENT_ID" \
    -H "Content-Type: application/json" \
    -d '{"NSE_FNO":{"13":[{"secId":"13","type":"INDEX"}]}}'
  ```

### ❌ No Data Being Saved

**Check:**
1. Vercel logs for errors
2. Browser console (F12) for errors
3. Supabase table has INSERT policy
4. Test mode works locally

---

## Post-Deployment

### Update Environment Variables
1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Edit any variable
4. Redeploy: Deployments → Latest → Redeploy

### View Logs
1. Vercel dashboard → Your project
2. Logs tab
3. Filter by errors

### Monitor Usage
- **Vercel:** Dashboard shows function executions, bandwidth
- **Supabase:** Dashboard shows database size, API requests

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All environment variables added
- [ ] Deployment successful (green checkmark)
- [ ] Dashboard loads at Vercel URL
- [ ] Test mode collects data successfully
- [ ] Data appears in Supabase table
- [ ] No errors in Vercel logs
- [ ] No errors in browser console

---

## Next Steps

1. **Setup Cron Job** - For automatic data collection
2. **Monitor Daily** - Check data collection during market hours
3. **Backup Data** - Export Supabase data periodically
4. **Custom Domain** (Optional) - Add your own domain in Vercel

---

## Quick Commands

```bash
# Update deployment
git add .
git commit -m "Update"
git push

# View logs
vercel logs

# Redeploy
vercel --prod
```

---

## Support

- **Vercel Issues:** Check deployment logs
- **Supabase Issues:** Check database logs
- **Dhan API Issues:** Check API status
- **App Issues:** Check browser console (F12)

---

🎉 **You're live!** Your Nifty 50 Data Collector is now deployed and accessible worldwide!
