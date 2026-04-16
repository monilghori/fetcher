# Dhan API Data Availability

## Current Situation

The Dhan Market Feed API (`/v2/marketfeed/quote`) for Nifty 50 Index (IDX_I segment, security ID 13) returns **limited data**:

### Available Data
- ✅ **LTP (Last Traded Price)** - Always available
- ✅ **Last Price** - Always available

### Limited/Missing Data
- ⚠️ **Open, High, Low** - Often returns `null` (especially when market is closed)
- ⚠️ **Previous Close** - Often returns `null`
- ⚠️ **Volume** - Often returns `null` (indices don't have volume in traditional sense)
- ⚠️ **Open Interest (OI)** - Often returns `null` (not applicable for indices)

## Why Some Fields Show "-"

1. **Market Closed**: When the market is closed, Dhan API returns only LTP
2. **Index Data**: Nifty 50 is an index, not a stock. Indices don't have:
   - Volume (it's calculated from constituent stocks)
   - Open Interest (only applicable to F&O contracts)
3. **API Limitations**: The `/v2/marketfeed/quote` endpoint may not provide all fields for indices

## Change % Calculation

The app calculates change percentage using this priority:
1. **Previous Close** (if available) - Most accurate
2. **Open Price** (if prev close not available) - Fallback
3. **0%** (if neither available) - During market closed hours

## When Will Full Data Be Available?

Full data (Open, High, Low, Previous Close) should be available:
- ✅ During market hours (9:15 AM - 3:30 PM IST)
- ✅ During collection window (14:55 - 15:05 IST)
- ✅ On trading days (Monday to Friday, excluding holidays)

## Alternative Solutions

If you need more complete data, consider:

1. **Use Nifty 50 Futures** instead of Index:
   - Change segment from `IDX_I` to `NSE_FNO`
   - Use Nifty 50 futures security ID
   - Futures have complete OHLC, volume, and OI data

2. **Use Different API Endpoint**:
   - Check if Dhan has a dedicated index data endpoint
   - Contact Dhan support for index-specific API documentation

3. **Supplement with Other Data Sources**:
   - Use NSE official website for index data
   - Combine Dhan LTP with NSE OHLC data

## Current Implementation

The app is designed to:
- ✅ Collect whatever data is available from Dhan API
- ✅ Store `null` for missing fields (shows as "-" in UI)
- ✅ Calculate change % when reference price is available
- ✅ Show "0%" when calculation is not possible
- ✅ Work reliably during market hours when full data is available

## Testing

To see full data:
1. Run test mode during market hours (9:15 AM - 3:30 PM IST)
2. Check the collection window (14:55 - 15:05 IST)
3. Verify it's a trading day (Monday-Friday, not a holiday)

## Logs to Check

When running test mode, check browser console for:
```
📋 Available fields in response: [...]
📊 Extracted values:
  LTP: 24167.95
  Open: null
  High: null
  ...
```

This shows exactly what Dhan API is returning.
