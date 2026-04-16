# Fix Vercel Cache Issue (25 Ticks Limit)

## Problem
Vercel is returning only 25 ticks instead of all ticks for a date because of cached build files.

## Solution

### Option 1: Use the Script (Easiest)
```bash
cd nifty50-data-collector
./clear-vercel-cache.bat
```

This will:
1. Delete local `.next` folder
2. Commit changes
3. Push to trigger Vercel rebuild

### Option 2: Manual Steps

1. **Delete local .next folder:**
   ```bash
   cd nifty50-data-collector
   Remove-Item -Recurse -Force .next
   ```

2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix: Remove limit for date-filtered queries"
   git push
   ```

3. **Wait for Vercel to rebuild** (automatic)

### Option 3: Force Redeploy in Vercel Dashboard

1. Go to your Vercel dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click the three dots (...) on the latest deployment
5. Click "Redeploy"
6. Check "Use existing Build Cache" is **UNCHECKED**
7. Click "Redeploy"

## What Was Fixed

The `/api/ticks` route now:
- **With date parameter**: Fetches ALL ticks for that day (no limit)
- **Without date parameter**: Uses limit parameter (default 1000)

## Verify the Fix

After redeployment, test the API:
```
https://your-app.vercel.app/api/ticks?date=2026-04-16
```

You should see `"count": 90` (or however many ticks you collected) instead of `"count": 25`.

## Why This Happened

Vercel caches the `.next` build folder between deployments for faster builds. Sometimes old cached code can cause issues when you make changes to API routes. Clearing the cache forces a fresh build.
