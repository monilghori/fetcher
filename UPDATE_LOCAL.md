# Update Local Environment

Your local environment is showing 17 ticks while Vercel shows 90 ticks for the same date. This means your local code is outdated.

## Steps to Fix

### 1. Stop Your Local Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running.

### 2. Verify You Have Latest Code

Check if these files have the latest changes:

**app/page.tsx** - Should have:
```typescript
const res = await fetch(`/api/ticks?date=${date}`);
// NOT: const res = await fetch(`/api/ticks?limit=1000&date=${date}`);
```

**app/api/daily-summary/route.ts** - Should have:
```typescript
import { formatInTimeZone } from 'date-fns-tz';
const date = formatInTimeZone(utcDate, IST_TIMEZONE, 'yyyy-MM-dd');
// NOT: const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
```

**app/api/ticks/route.ts** - Should have:
```typescript
// Only apply limit if not filtering by date
if (!date) {
  query = query.limit(limit);
}
```

### 3. Clear Next.js Cache (Important!)

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run dev

# Or if using bash
rm -rf .next
npm run dev
```

### 4. Hard Refresh Browser

After dev server starts:
- Press `Ctrl+Shift+R` (Windows/Linux)
- Or `Cmd+Shift+R` (Mac)
- Or open DevTools (F12) and right-click refresh button → "Empty Cache and Hard Reload"

### 5. Verify in Browser Console

Open browser console (F12) and expand a day. You should see:
```
📂 Expanding date: 2026-04-16
📡 Fetching ticks for date: 2026-04-16
✅ Received 90 ticks for 2026-04-16
💾 Stored 90 ticks in state
```

If you see `✅ Received 17 ticks`, the old code is still cached.

## Quick Fix Command

```bash
# Stop dev server (Ctrl+C), then run:
rm -rf .next && npm run dev
```

## Still Not Working?

Check the Network tab in DevTools (F12):
1. Expand a day
2. Look for request to `/api/ticks?date=2026-04-16`
3. Check the response - it should show `"count": 90`
4. If it shows `"count": 17`, the API is still using old code

If API returns 17, restart the dev server with cache clear.
