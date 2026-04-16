# Polling Interval Configuration Guide

## Quick Start

To change the polling interval, edit **one file**: `lib/config.ts`

```typescript
export const CONFIG = {
  POLLING_INTERVAL_MS: 3000,  // ← Change this value
  // ...
}
```

## Common Intervals

| Interval | Value | Ticks/Minute | Use Case |
|----------|-------|--------------|----------|
| 1 second | `1000` | ~60 | High-frequency trading, maximum data points |
| 2 seconds | `2000` | ~30 | Balanced approach |
| 3 seconds | `3000` | ~20 | **Default** - Conservative, lower API usage |
| 5 seconds | `5000` | ~12 | Low frequency, minimal API calls |
| 10 seconds | `10000` | ~6 | Very low frequency |

## What Changes Automatically

When you update `POLLING_INTERVAL_MS`, it affects:

1. **Auto-polling during collection window** (14:55-15:05 IST)
   - Dashboard will fetch data at your specified interval
   - Status message updates to show current interval

2. **Test mode collection**
   - Test mode uses the same interval
   - Confirmation dialog shows expected tick count
   - Example: 1-minute test with 2s interval = ~30 ticks

3. **API routes**
   - Backend test-collect endpoint uses the same interval

## Example: Change to 1 Second

```typescript
// lib/config.ts
export const CONFIG = {
  POLLING_INTERVAL_MS: 1000,  // 1 second
  TEST_MODE_DURATION_MS: 60000,
  // ...
}
```

Result:
- Auto-polling: Every 1 second during window
- Test mode: ~60 ticks in 1 minute
- UI displays: "Auto-polling active (1 second)"

## Example: Change to 5 Seconds

```typescript
// lib/config.ts
export const CONFIG = {
  POLLING_INTERVAL_MS: 5000,  // 5 seconds
  TEST_MODE_DURATION_MS: 60000,
  // ...
}
```

Result:
- Auto-polling: Every 5 seconds during window
- Test mode: ~12 ticks in 1 minute
- UI displays: "Auto-polling active (5 seconds)"

## Considerations

### Lower Intervals (1-2 seconds)
**Pros:**
- More data points
- Better granularity for analysis
- Catch rapid price movements

**Cons:**
- Higher API usage (may hit rate limits)
- More database writes
- Increased bandwidth usage

### Higher Intervals (5-10 seconds)
**Pros:**
- Lower API usage
- Reduced database load
- More sustainable for long-term collection

**Cons:**
- Fewer data points
- May miss rapid price changes
- Less granular analysis

## Test Mode Duration

You can also change test mode duration:

```typescript
export const CONFIG = {
  POLLING_INTERVAL_MS: 3000,
  TEST_MODE_DURATION_MS: 120000,  // 2 minutes instead of 1
  // ...
}
```

## After Changing

1. Save `lib/config.ts`
2. Restart your development server: `npm run dev`
3. Or rebuild for production: `npm run build`

The changes take effect immediately - no other files need modification!

## Advanced: Dynamic Intervals

If you want different intervals for different scenarios, you can extend the config:

```typescript
export const CONFIG = {
  // Default interval
  POLLING_INTERVAL_MS: 3000,
  
  // Optional: Different intervals for different modes
  INTERVALS: {
    NORMAL: 3000,      // Regular collection
    AGGRESSIVE: 1000,  // High-frequency mode
    CONSERVATIVE: 5000 // Low-frequency mode
  },
  
  // ...
}
```

Then update the code to use `CONFIG.INTERVALS.AGGRESSIVE` when needed.
