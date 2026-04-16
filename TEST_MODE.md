# Test Mode Guide

## Quick Test

The application now includes a **Test Mode** button that allows you to test data collection at any time, regardless of the market hours or collection window.

### How to Use Test Mode

1. **Start the application**:
   ```bash
   cd nifty50-data-collector
   npm run dev
   ```

2. **Open the dashboard** in your browser:
   ```
   http://localhost:3000
   ```

3. **Click the "🧪 Test Mode (1 min)" button**:
   - Located next to the "Fetch Now" button
   - Purple colored button
   - Works anytime (doesn't require 14:55-15:05 IST window)

4. **What happens**:
   - Collects Nifty 50 data every 3 seconds for 1 minute
   - Approximately 20 data points will be collected
   - Progress shown with spinner and tick counter
   - Success message displays when complete
   - **Red "Cancel" button appears** - click to stop early

5. **Cancel anytime**:
   - Click the red "✕ Cancel" button to stop collection
   - Already collected data is saved
   - Shows how many ticks were collected before cancellation

6. **View collected data**:
   - Scroll down to the "Recent Ticks" table
   - All test data is marked with `data_source: 'test_mode'`
   - Data is stored in your Supabase database
   - Chart updates automatically with new data

### What Gets Collected

Each tick includes:
- **LTP** (Last Traded Price)
- **Open, High, Low, Close** prices
- **Volume** and **Open Interest**
- **Net Change** and **Percent Change**
- **Timestamp** (IST)
- **Raw API response** from Dhan

### Troubleshooting

If test mode fails:

1. **Check environment variables** in `.env.local`:
   ```
   DHAN_ACCESS_TOKEN=your_token
   DHAN_CLIENT_ID=your_client_id
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

2. **Verify Dhan API credentials** are valid

3. **Check Supabase connection** and table exists

4. **Look at browser console** for error messages

5. **Check terminal logs** for API errors

### Normal vs Test Mode

| Feature | Normal Mode | Test Mode |
|---------|-------------|-----------|
| Time Window | 14:55-15:05 IST only | Anytime |
| Days | Mon-Fri only | Any day |
| Duration | 10 minutes | 1 minute |
| Trigger | Automatic + Manual | Manual only |
| Data Source Tag | `dhan_api` | `test_mode` |
| Use Case | Production | Testing/Demo |

### API Endpoint

Test mode uses: `POST /api/test-collect`

You can also test via curl:
```bash
curl -X POST http://localhost:3000/api/test-collect \
  -H "Content-Type: application/json" \
  -d '{"duration": 60}'
```

Response:
```json
{
  "status": "completed",
  "duration": 60,
  "ticksCollected": 20,
  "totalAttempts": 20,
  "results": [...],
  "errors": [],
  "message": "Test collection completed. Collected 20 ticks in 60 seconds."
}
```

### Custom Duration

To test with different duration, modify the API call:
```javascript
// 30 seconds
fetch('/api/test-collect', {
  method: 'POST',
  body: JSON.stringify({ duration: 30 })
})

// 2 minutes
fetch('/api/test-collect', {
  method: 'POST',
  body: JSON.stringify({ duration: 120 })
})
```
