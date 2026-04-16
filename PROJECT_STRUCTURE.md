# Project Structure

Complete overview of the Nifty 50 Data Collector codebase.

\`\`\`
nifty50-data-collector/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── fetch-tick/
│   │   │   └── route.ts         # POST - Fetch & store Nifty data
│   │   ├── status/
│   │   │   └── route.ts         # GET - Collection status & stats
│   │   └── ticks/
│   │       └── route.ts         # GET - Retrieve stored ticks
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Main dashboard page
│   └── globals.css              # Global styles with Tailwind
│
├── components/                   # React Components
│   ├── CountdownTimer.tsx       # Countdown to next window
│   ├── LTPChart.tsx             # Recharts line chart
│   ├── StatusBadge.tsx          # COLLECTING/WAITING badge
│   └── TickTable.tsx            # Recent ticks table
│
├── lib/                          # Utility Libraries
│   ├── dhan.ts                  # Dhan API client
│   ├── supabase.ts              # Supabase clients (browser/server)
│   ├── time.ts                  # IST time utilities
│   └── types.ts                 # TypeScript type definitions
│
├── .env.local                    # Environment variables (local)
├── .env.local.example           # Environment template
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore rules
├── DEPLOYMENT.md                # Detailed deployment guide
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies & scripts
├── postcss.config.js            # PostCSS configuration
├── PROJECT_STRUCTURE.md         # This file
├── QUICKSTART.md                # Quick start guide
├── README.md                    # Main documentation
├── supabase-setup.sql           # Database schema & setup
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vercel.json                  # Vercel deployment config
\`\`\`

## Key Files Explained

### API Routes

#### `/api/fetch-tick/route.ts`
- **Method:** POST
- **Purpose:** Fetch Nifty 50 data from Dhan API and store in Supabase
- **Auth:** Requires `x-cron-secret` header
- **Logic:**
  1. Verify secret header
  2. Check if within collection window
  3. Fetch from Dhan API
  4. Insert into Supabase
  5. Return success/error

#### `/api/status/route.ts`
- **Method:** GET
- **Purpose:** Get current collection status
- **Returns:**
  - `isWithinWindow`: boolean
  - `currentTime`: IST timestamp
  - `nextWindowStart`: Next collection window
  - `secondsUntilWindow`: Countdown seconds
  - `todayTickCount`: Ticks collected today

#### `/api/ticks/route.ts`
- **Method:** GET
- **Purpose:** Retrieve stored ticks
- **Query Params:**
  - `limit`: Number of records (default: 20)
  - `date`: Filter by date (YYYY-MM-DD)
- **Returns:** Array of tick objects

### Components

#### `CountdownTimer.tsx`
- Displays countdown to next collection window
- Updates every second
- Format: HH:MM:SS

#### `LTPChart.tsx`
- Line chart using Recharts
- Shows LTP over time
- Auto-scales Y-axis
- Dark theme styling

#### `StatusBadge.tsx`
- Visual indicator of collection status
- Green "COLLECTING" when active
- Gray "WAITING" when inactive
- Animated pulse effect when active

#### `TickTable.tsx`
- Displays recent ticks in table format
- Columns: Time, LTP, Change, Volume
- Color-coded changes (green/red)
- Responsive design

### Library Files

#### `lib/dhan.ts`
- Dhan API client functions
- `fetchNifty50Quote()`: Get full quote data
- `fetchNifty50LTP()`: Get LTP only (faster)
- Error handling for API failures

#### `lib/supabase.ts`
- Supabase client initialization
- `getSupabaseBrowserClient()`: For client-side reads
- `getSupabaseServerClient()`: For server-side writes (uses service role)

#### `lib/time.ts`
- IST timezone utilities
- `getISTTime()`: Get current IST time
- `isWithinCollectionWindow()`: Check if in 14:55-15:05 window
- `getNextWindowStart()`: Calculate next window
- `getSecondsUntilWindow()`: Countdown calculation

#### `lib/types.ts`
- TypeScript interfaces
- `DhanQuoteResponse`: Dhan API response
- `Nifty50Tick`: Database record
- `CollectionStatus`: Status API response

### Configuration Files

#### `next.config.js`
- Next.js configuration
- React strict mode enabled

#### `tailwind.config.js`
- Tailwind CSS configuration
- Content paths for purging
- Dark theme colors

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases (@/*)
- Strict mode enabled

#### `vercel.json`
- Vercel deployment configuration
- Function timeout: 10 seconds
- Region: Singapore (closest to India)

#### `package.json`
- Dependencies:
  - `next`: 14.2.3
  - `react`: 18.3.1
  - `@supabase/supabase-js`: 2.43.4
  - `recharts`: 2.12.7
  - `date-fns`: 3.6.0
  - `date-fns-tz`: 3.1.3
- Scripts:
  - `dev`: Development server
  - `build`: Production build
  - `start`: Production server
  - `lint`: ESLint check

## Data Flow

### Collection Flow (During Window)

\`\`\`
1. User opens dashboard
   ↓
2. Dashboard checks status via /api/status
   ↓
3. If within window, start auto-polling
   ↓
4. Every 3 seconds: POST /api/fetch-tick
   ↓
5. API route fetches from Dhan
   ↓
6. Data stored in Supabase
   ↓
7. Dashboard refreshes via /api/ticks
   ↓
8. Chart and table update
\`\`\`

### Manual Fetch Flow

\`\`\`
1. User clicks "Fetch Now"
   ↓
2. Check if within window
   ↓
3. POST /api/fetch-tick with secret header
   ↓
4. Fetch from Dhan API
   ↓
5. Store in Supabase
   ↓
6. Refresh dashboard data
\`\`\`

## Database Schema

### nifty50_ticks Table

| Column | Type | Description |
|--------|------|-------------|
| id | bigserial | Primary key |
| fetched_at | timestamptz | When data was fetched |
| market_timestamp | timestamptz | Market timestamp (if available) |
| ltp | numeric(10,2) | Last traded price |
| open_price | numeric(10,2) | Opening price |
| high_price | numeric(10,2) | High price |
| low_price | numeric(10,2) | Low price |
| close_price | numeric(10,2) | Closing price |
| volume | bigint | Trading volume |
| open_interest | bigint | Open interest |
| net_change | numeric(10,2) | Price change |
| percent_change | numeric(6,4) | Percentage change |
| data_source | text | Always 'dhan_api' |
| raw_response | jsonb | Full API response |
| created_at | timestamptz | Record creation time |

### Indexes

- `idx_nifty50_ticks_fetched_at`: Fast time-based queries
- `idx_nifty50_ticks_ltp`: Fast price queries
- `idx_nifty50_ticks_created_at`: Fast creation time queries

## Environment Variables

### Required for All Environments

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key | Supabase Settings > API |
| `DHAN_ACCESS_TOKEN` | Dhan API token | Dhan account > API |
| `DHAN_CLIENT_ID` | Dhan client ID | Dhan account > API |
| `CRON_SECRET` | API protection | Generate random string |
| `NEXT_PUBLIC_CRON_SECRET` | Client-side secret | Same as CRON_SECRET |

## Security Considerations

### API Route Protection

- All write operations require `x-cron-secret` header
- Service role key only used server-side
- RLS policies prevent unauthorized access

### Environment Variables

- Never commit `.env.local` to Git
- Use different secrets for dev/prod
- Rotate keys regularly

### Supabase RLS

- Service role bypasses RLS (for inserts)
- Public can only read (SELECT)
- No direct write access from client

## Performance Optimization

### Client-Side

- Auto-polling only during active window
- 5-second refresh for status/ticks
- Chart renders only when data changes

### Server-Side

- Efficient database queries with indexes
- Limit results to prevent large payloads
- 10-second function timeout

### Database

- Indexes on frequently queried columns
- JSONB for flexible raw data storage
- Automatic cleanup possible (future)

## Future Enhancements

### Planned Features

1. **Historical Analysis**
   - Daily/weekly/monthly summaries
   - Volatility calculations
   - Pattern detection

2. **Alerts**
   - Price threshold alerts
   - Email/SMS notifications
   - Webhook integrations

3. **Export**
   - CSV download
   - Excel export
   - API for external tools

4. **Multi-Index**
   - Bank Nifty support
   - Sensex support
   - Custom index lists

5. **Advanced Charts**
   - Candlestick charts
   - Technical indicators
   - Volume analysis

### Scalability

- Current: ~200 ticks/day
- With paid Vercel: ~3,600 ticks/day (10s intervals)
- Database can handle millions of records

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Check CRON_SECRET matches
   - Verify header is sent correctly

2. **No data collection**
   - Verify time is within window
   - Check Dhan API credentials
   - Review Vercel function logs

3. **Database errors**
   - Verify service role key
   - Check RLS policies
   - Ensure tables exist

4. **Time zone issues**
   - App uses IST (UTC+5:30)
   - Verify system time is correct

## Development Tips

### Local Development

\`\`\`bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
\`\`\`

### Testing

- Test during market hours for full functionality
- Use manual "Fetch Now" button for testing
- Check browser console for errors
- Monitor Supabase table for inserts

### Debugging

- Check Vercel function logs
- Use browser DevTools Network tab
- Review Supabase logs
- Test Dhan API with curl

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)

## License

MIT License - See LICENSE file for details
