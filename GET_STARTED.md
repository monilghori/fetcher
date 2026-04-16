# Get Started in 3 Steps

The fastest way to get your Nifty 50 Data Collector running.

## 📋 What You'll Need (5 minutes to gather)

- [ ] Node.js 18+ installed ([download](https://nodejs.org))
- [ ] Supabase account ([sign up free](https://supabase.com))
- [ ] Dhan trading account with API access ([sign up](https://dhan.co))
- [ ] GitHub account ([sign up](https://github.com))
- [ ] Vercel account ([sign up free](https://vercel.com))

---

## Step 1: Setup (10 minutes)

### A. Install Dependencies

\`\`\`bash
cd nifty50-data-collector
npm install
\`\`\`

### B. Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait 2 minutes for project creation
3. Go to SQL Editor → New Query
4. Copy & paste contents of \`supabase-setup.sql\`
5. Click "Run"

### C. Get Your Credentials

**Supabase** (Settings → API):
- Project URL
- anon public key
- service_role key

**Dhan** (Account → API):
- Access Token
- Client ID

### D. Configure Environment

Create \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DHAN_ACCESS_TOKEN=your_token
DHAN_CLIENT_ID=your_client_id
CRON_SECRET=random_secret_12345
NEXT_PUBLIC_CRON_SECRET=random_secret_12345
\`\`\`

---

## Step 2: Test Locally (5 minutes)

### Run Development Server

\`\`\`bash
npm run dev
\`\`\`

### Open Dashboard

Go to [http://localhost:3000](http://localhost:3000)

### Verify

- ✅ Page loads without errors
- ✅ Current IST time displays
- ✅ Status badge shows (COLLECTING or WAITING)
- ✅ Chart and table render

### Test During Market Hours (14:55-15:05 IST)

If it's market hours:
1. Click "Fetch Now" button
2. Watch data appear in table
3. See chart update
4. Check Supabase table for new records

---

## Step 3: Deploy (10 minutes)

### A. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/nifty50-data-collector.git
git push -u origin main
\`\`\`

### B. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Add environment variables (all 7 from .env.local)
5. Click "Deploy"
6. Wait 2-3 minutes

### C. Verify Deployment

Visit your Vercel URL (e.g., `https://nifty50-data-collector.vercel.app`)

Check:
- ✅ Dashboard loads
- ✅ Status updates
- ✅ During market hours, data collects automatically

---

## 🎉 You're Done!

Your Nifty 50 Data Collector is now live!

### What Happens Next?

**During Market Hours (14:55-15:05 IST, Mon-Fri):**
- Dashboard automatically polls every 3 seconds
- Data is collected and stored in Supabase
- Charts and tables update in real-time

**Outside Market Hours:**
- Dashboard shows countdown to next window
- View historical data from previous sessions
- No data collection (saves resources)

---

## 📚 Learn More

- **README.md** - Full feature documentation
- **DEPLOYMENT.md** - Detailed deployment guide
- **TESTING.md** - How to test everything
- **TROUBLESHOOTING.md** - Fix common issues
- **PROJECT_STRUCTURE.md** - Understand the code

---

## 🔧 Quick Commands

\`\`\`bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality

# Testing
curl http://localhost:3000/api/status
curl http://localhost:3000/api/ticks?limit=5

# Deployment
git add .
git commit -m "Update"
git push             # Auto-deploys to Vercel
\`\`\`

---

## 💡 Pro Tips

1. **Keep dashboard open during market hours** for automatic data collection
2. **Monitor Vercel logs** to catch any issues early
3. **Check Supabase database size** weekly (free tier: 500MB)
4. **Set up alerts** for errors or usage limits
5. **Backup your data** regularly (export to CSV)

---

## 🆘 Need Help?

### Quick Fixes

**"Unauthorized" error:**
- Check CRON_SECRET matches in both variables

**No data collecting:**
- Verify time is 14:55-15:05 IST on weekday
- Check Dhan API credentials

**Dashboard not loading:**
- Check Vercel deployment logs
- Verify all environment variables set

### Get Support

- **Troubleshooting Guide:** See TROUBLESHOOTING.md
- **GitHub Issues:** Open an issue with details
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Supabase Support:** [supabase.com/support](https://supabase.com/support)

---

## 📊 What You're Collecting

Every 3 seconds during market hours:
- Last Traded Price (LTP)
- Open, High, Low, Close
- Volume
- Open Interest
- Price changes (absolute & percentage)
- Full API response (for debugging)

**Daily:** ~200 ticks (10 min × 20 ticks/min)
**Monthly:** ~6,000 records
**Storage:** ~10MB/month (well within free tier)

---

## 🚀 Next Steps

### Immediate
1. Test during next market window
2. Verify data accuracy
3. Monitor for errors

### This Week
1. Set up monitoring alerts
2. Review collected data
3. Plan any customizations

### Future Enhancements
- Historical data analysis
- Price alerts
- Export to CSV
- Multiple indices (Bank Nifty, etc.)
- Advanced charting

---

## ✅ Success Checklist

- [ ] Local development working
- [ ] Supabase database set up
- [ ] Dhan API credentials working
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Data collection tested during market hours
- [ ] Dashboard accessible from anywhere
- [ ] No errors in logs

---

**Congratulations!** You now have a production-ready Nifty 50 data collector running on free tier infrastructure! 🎊

Start collecting data during the next market window (14:55-15:05 IST) and watch your database grow!
