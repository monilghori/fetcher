# Quick Start Guide

Get your Nifty 50 Data Collector running in 15 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Dhan trading account with API access
- Vercel account (for deployment)

## 1. Install (2 minutes)

\`\`\`bash
cd nifty50-data-collector
npm install
\`\`\`

## 2. Setup Supabase (3 minutes)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the SQL from `supabase-setup.sql`
4. Get credentials from Settings > API:
   - Project URL
   - anon key
   - service_role key

## 3. Get Dhan API Keys (2 minutes)

1. Login to [dhan.co](https://dhan.co)
2. Go to API section
3. Copy your access token and client ID

## 4. Configure Environment (2 minutes)

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DHAN_ACCESS_TOKEN=your_dhan_token
DHAN_CLIENT_ID=your_dhan_client_id
CRON_SECRET=random_secret_123
NEXT_PUBLIC_CRON_SECRET=random_secret_123
\`\`\`

## 5. Run Locally (1 minute)

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 6. Deploy to Vercel (5 minutes)

\`\`\`bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
\`\`\`

Then:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Add all environment variables
4. Deploy!

## Testing

### During Market Hours (14:55-15:05 IST, Mon-Fri)

- Dashboard shows "COLLECTING" status
- Auto-polling starts (every 3 seconds)
- Click "Fetch Now" to manually trigger
- Watch data appear in real-time

### Outside Market Hours

- Dashboard shows "WAITING" status
- Countdown to next window
- View historical data

## What You Get

- ✅ Live Nifty 50 data collection
- ✅ Real-time dashboard with charts
- ✅ Automatic polling during market hours
- ✅ Historical data storage
- ✅ Mobile responsive UI
- ✅ Free tier deployment

## Next Steps

- Read `README.md` for detailed features
- Check `DEPLOYMENT.md` for troubleshooting
- Monitor Vercel logs during collection window
- Set up alerts (future enhancement)

## Need Help?

- Check Vercel function logs
- Verify environment variables
- Test Dhan API credentials
- Review Supabase RLS policies

Happy collecting! 📈
