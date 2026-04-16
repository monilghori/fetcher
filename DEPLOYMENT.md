# Deployment Guide - Nifty 50 Data Collector

Complete step-by-step guide to deploy your app to Vercel (free tier).

## Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- Supabase account (sign up at supabase.com)
- Dhan trading account with API access

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter:
   - Project name: `nifty50-collector`
   - Database password: (generate strong password)
   - Region: Choose closest to India (e.g., Mumbai/Singapore)
4. Click "Create new project" and wait 2-3 minutes

### 1.2 Run Database Setup

1. In your Supabase project, go to "SQL Editor"
2. Click "New Query"
3. Copy entire contents of `supabase-setup.sql`
4. Paste and click "Run"
5. Verify success: You should see "Success. No rows returned"

### 1.3 Get API Credentials

1. Go to Project Settings > API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

⚠️ **Important:** Keep service_role key secret!

## Step 2: Dhan API Setup (5 minutes)

### 2.1 Get Dhan Credentials

1. Log in to [dhan.co](https://dhan.co)
2. Go to API section in your account
3. Generate API credentials if not already done
4. Copy:
   - **Access Token**
   - **Client ID**

### 2.2 Test API Access (Optional)

You can test your Dhan credentials using curl:

\`\`\`bash
curl -X POST https://api.dhan.co/v2/marketfeed/quote \\
  -H "Content-Type: application/json" \\
  -H "access-token: YOUR_ACCESS_TOKEN" \\
  -H "client-id: YOUR_CLIENT_ID" \\
  -d '{"NSE_FNO":{"13":[{"secId":"13","type":"INDEX"}]}}'
\`\`\`

## Step 3: Local Testing (10 minutes)

### 3.1 Install Dependencies

\`\`\`bash
cd nifty50-data-collector
npm install
\`\`\`

### 3.2 Configure Environment

1. Copy `.env.local.example` to `.env.local`
2. Fill in all values:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DHAN_ACCESS_TOKEN=your_token
DHAN_CLIENT_ID=your_client_id
CRON_SECRET=my_super_secret_random_string_12345
NEXT_PUBLIC_CRON_SECRET=my_super_secret_random_string_12345
\`\`\`

⚠️ **Important:** `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET` must be identical!

### 3.3 Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 3.4 Test Data Collection

1. If it's between 14:55-15:05 IST on a weekday:
   - Dashboard should show "COLLECTING" status
   - Auto-polling should start
   - Click "Fetch Now" to manually trigger

2. If outside the window:
   - Dashboard shows "WAITING" status
   - Countdown timer to next window
   - "Fetch Now" button is disabled

## Step 4: GitHub Setup (5 minutes)

### 4.1 Initialize Git Repository

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Nifty 50 Data Collector"
\`\`\`

### 4.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `nifty50-data-collector`
4. Keep it private (recommended for API keys safety)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 4.3 Push to GitHub

\`\`\`bash
git remote add origin https://github.com/YOUR_USERNAME/nifty50-data-collector.git
git branch -M main
git push -u origin main
\`\`\`

## Step 5: Vercel Deployment (10 minutes)

### 5.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 5.2 Configure Environment Variables

Before deploying, add all environment variables:

1. In the import screen, expand "Environment Variables"
2. Add each variable:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | From Step 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | From Step 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | From Step 1.3 |
| `DHAN_ACCESS_TOKEN` | Your Dhan token | From Step 2.1 |
| `DHAN_CLIENT_ID` | Your Dhan client ID | From Step 2.1 |
| `CRON_SECRET` | Random string | Same as local |
| `NEXT_PUBLIC_CRON_SECRET` | Same random string | Must match above |

⚠️ **Critical:** Double-check all values are correct!

### 5.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://nifty50-data-collector.vercel.app`

### 5.4 Verify Deployment

1. Visit your Vercel URL
2. Check dashboard loads correctly
3. Verify status shows current IST time
4. If within collection window, test "Fetch Now" button

## Step 6: Post-Deployment Checks

### 6.1 Test API Endpoints

\`\`\`bash
# Check status
curl https://your-app.vercel.app/api/status

# Check ticks
curl https://your-app.vercel.app/api/ticks?limit=5
\`\`\`

### 6.2 Monitor Logs

1. In Vercel dashboard, go to your project
2. Click "Logs" tab
3. Watch for any errors during collection window

### 6.3 Check Database

1. In Supabase, go to "Table Editor"
2. Select `nifty50_ticks` table
3. Verify data is being inserted during collection window

## Step 7: Usage

### During Market Hours (14:55-15:05 IST, Mon-Fri)

1. Open your Vercel URL
2. Dashboard automatically starts polling every 3 seconds
3. Data is collected and stored in Supabase
4. Charts and tables update in real-time

### Outside Market Hours

1. Dashboard shows "WAITING" status
2. Countdown timer to next collection window
3. View historical data from previous sessions

## Troubleshooting

### Issue: "Unauthorized" error when fetching

**Solution:** Check that `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET` match exactly in Vercel environment variables.

### Issue: No data in database

**Solution:**
1. Check Vercel function logs for errors
2. Verify Dhan API credentials are correct
3. Ensure RLS policies are set up correctly in Supabase
4. Test Dhan API directly with curl

### Issue: "Database error" messages

**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check RLS policies allow service role access
3. Ensure tables exist (re-run `supabase-setup.sql`)

### Issue: Time zone issues

**Solution:** App uses IST (Asia/Kolkata) timezone. Verify your system time is correct.

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs for specific error
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript has no errors: `npm run build` locally

## Monitoring & Maintenance

### Daily Checks

- Verify data collection during 14:55-15:05 IST window
- Check Supabase storage usage (free tier: 500MB)
- Monitor Vercel function execution time

### Weekly Checks

- Review error logs in Vercel
- Check database growth rate
- Verify API credentials haven't expired

### Monthly Checks

- Review Vercel bandwidth usage (free tier: 100GB)
- Check Supabase database size
- Clean up old data if needed

## Scaling Considerations

### Current Capacity (Free Tier)

- **Collection:** ~200 ticks/day (10 min × 20 ticks/min)
- **Monthly records:** ~6,000 (200 × 30 days)
- **Storage:** ~10MB/month (well within 500MB limit)

### If You Need More

1. **Upgrade Vercel to Hobby ($20/month):**
   - Enables cron jobs (every 10 seconds possible)
   - More function execution time
   - Better performance

2. **Upgrade Supabase to Pro ($25/month):**
   - 8GB database
   - 50GB bandwidth
   - Better performance

## Security Best Practices

1. ✅ Never commit `.env.local` to Git
2. ✅ Keep service role key secret
3. ✅ Use strong random string for `CRON_SECRET`
4. ✅ Keep GitHub repo private
5. ✅ Regularly rotate API keys
6. ✅ Monitor Vercel logs for suspicious activity

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Dhan API Docs:** Check your Dhan account

## Success Checklist

- [ ] Supabase project created and tables set up
- [ ] Dhan API credentials obtained
- [ ] Local testing successful
- [ ] GitHub repository created
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Data collection working during market hours
- [ ] Dashboard accessible and updating
- [ ] No errors in Vercel logs

Congratulations! Your Nifty 50 Data Collector is now live! 🎉
