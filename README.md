# Nifty 50 Data Collector

A production-ready Next.js 14 application that collects live Nifty 50 index data from the Dhan API and stores it in Supabase. Optimized for Vercel's free tier deployment.

## Features

- ✅ Live Nifty 50 data collection from Dhan HQ Market Feed API
- ✅ Automatic data collection during market window (14:55-15:05 IST, Mon-Fri)
- ✅ Client-side polling every 3 seconds during active window
- ✅ Real-time dashboard with live charts and tick data
- ✅ Supabase PostgreSQL storage
- ✅ TypeScript + Next.js 14 App Router
- ✅ Tailwind CSS dark theme
- ✅ Mobile responsive
- ✅ Deploy-ready for Vercel free tier

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Data Source:** Dhan HQ Market Feed API
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (free tier)

## Architecture

Since Vercel's free tier doesn't support cron jobs, this app uses:

1. **Client-side polling** - When the dashboard is open during market hours (14:55-15:05 IST), it automatically polls every 3 seconds
2. **Manual trigger** - "Fetch Now" button for on-demand data collection
3. **API routes** - Secure endpoints for data fetching and storage

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
cd nifty50-data-collector
npm install
\`\`\`

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-setup.sql` in the Supabase SQL Editor
3. Get your credentials from Project Settings > API

### 3. Dhan API Setup

1. Sign up at [dhan.co](https://dhan.co)
2. Generate API credentials from your Dhan account
3. Get your `access-token` and `client-id`

### 4. Environment Variables

Create `.env.local` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DHAN_ACCESS_TOKEN=your_dhan_access_token
DHAN_CLIENT_ID=your_dhan_client_id
CRON_SECRET=your_random_secret_string_here
NEXT_PUBLIC_CRON_SECRET=your_random_secret_string_here
\`\`\`

**Important:** Use the same value for both `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET`

### 5. Run Locally

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
\`\`\`

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add all environment variables from `.env.local`
4. Deploy!

### 3. Configure Supabase RLS (Row Level Security)

Since we're using the service role key for inserts, ensure your RLS policies allow it:

\`\`\`sql
-- Allow service role to insert
ALTER TABLE nifty50_ticks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON nifty50_ticks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read access (for dashboard)
CREATE POLICY "Allow public read access" ON nifty50_ticks
  FOR SELECT
  USING (true);
\`\`\`

## How It Works

### Data Collection Window

- **Active:** Monday-Friday, 14:55-15:05 IST (10 minutes)
- **Frequency:** Every 3 seconds during active window (via client polling)
- **Outside window:** No data collection, shows countdown to next window

### API Endpoints

- `GET /api/status` - Current collection status and stats
- `GET /api/ticks?limit=20` - Fetch recent ticks
- `POST /api/fetch-tick` - Trigger data collection (requires secret header)

### Dashboard Features

1. **Live Status Badge** - Shows COLLECTING (green) or WAITING (gray)
2. **Current Time** - Live IST time
3. **Latest LTP** - Last traded price with change indicator
4. **Today's Tick Count** - Total ticks collected today
5. **Countdown Timer** - Time until next collection window
6. **LTP Chart** - Visual representation of today's data
7. **Ticks Table** - Last 20 ticks with details
8. **Auto-polling** - Automatic data collection when window is active

## Database Schema

### nifty50_ticks

Stores individual tick data:

- `id` - Primary key
- `fetched_at` - When data was fetched
- `ltp` - Last traded price
- `open_price`, `high_price`, `low_price`, `close_price` - OHLC data
- `volume` - Trading volume
- `open_interest` - Open interest (if available)
- `net_change`, `percent_change` - Price changes
- `raw_response` - Full API response (JSONB)

### nifty50_sessions

Stores daily session summaries (for future analytics).

## Dhan API Details

### Endpoint Used

\`\`\`
POST https://api.dhan.co/v2/marketfeed/quote
\`\`\`

### Request Format

\`\`\`json
{
  "NSE_FNO": {
    "13": [{
      "secId": "13",
      "type": "INDEX"
    }]
  }
}
\`\`\`

**Note:** Nifty 50 security ID on Dhan is `13`

## Troubleshooting

### No data being collected

1. Check if current time is within 14:55-15:05 IST (Mon-Fri)
2. Verify Dhan API credentials are correct
3. Check browser console for errors
4. Ensure `NEXT_PUBLIC_CRON_SECRET` matches `CRON_SECRET`

### Database errors

1. Verify Supabase credentials
2. Check RLS policies allow service role access
3. Ensure tables are created (run `supabase-setup.sql`)

### Deployment issues

1. Verify all environment variables are set in Vercel
2. Check Vercel function logs for errors
3. Ensure Supabase allows connections from Vercel IPs

## Free Tier Limits

- **Vercel:** 100GB bandwidth, 100 hours serverless function execution
- **Supabase:** 500MB database, 2GB bandwidth, 50,000 monthly active users
- **Collection:** ~200 ticks per day (10 min window × 20 ticks/min)
- **Monthly storage:** ~6,000 records (well within free tier)

## Future Enhancements

- [ ] Historical data analysis
- [ ] Email/SMS alerts for price thresholds
- [ ] Export data to CSV
- [ ] Multiple index support (Bank Nifty, etc.)
- [ ] Advanced charting with indicators
- [ ] Session summaries and statistics

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
