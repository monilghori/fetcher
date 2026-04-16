# Settings Guide - Dhan API Credentials

## Overview
You can now manage Dhan API credentials directly from the web interface without editing environment variables or redeploying.

## How to Use

### 1. Access Settings
- Click the **⚙️ Settings** button in the top-right corner of the dashboard
- The settings modal will open

### 2. Enter Credentials
Fill in the following fields:
- **Dhan Access Token**: Your Dhan API access token
- **Dhan Client ID**: Your Dhan client identifier  
- **Admin Secret**: Your CRON_SECRET (for authentication)

### 3. Save
- Click "Save Credentials"
- Credentials are stored securely in Supabase
- The app will use these credentials immediately for all API calls

## Getting Dhan API Credentials

1. Log in to your Dhan account at https://dhan.co
2. Navigate to Settings → API Management
3. Generate or copy your:
   - Access Token
   - Client ID
4. Paste them into the Settings modal

## Database Setup

Before using the settings feature, run this SQL in your Supabase SQL Editor:

```sql
-- Run the contents of add-settings-table.sql
```

Or simply execute:
```bash
# Copy the SQL from add-settings-table.sql and run it in Supabase
```

## Security

- Credentials are stored in Supabase with Row Level Security (RLS) enabled
- The API masks credentials when displaying current settings
- Admin secret (CRON_SECRET) is required to update credentials
- Credentials are never exposed in the frontend

## Fallback Behavior

If no credentials are found in the database, the app will fallback to environment variables:
- `DHAN_ACCESS_TOKEN`
- `DHAN_CLIENT_ID`

This ensures backward compatibility with existing deployments.

## Troubleshooting

### "Invalid admin credentials" error
- Make sure you're entering the correct CRON_SECRET
- This is the same value as your `CRON_SECRET` environment variable

### "Failed to fetch settings" error
- Make sure you've run the `add-settings-table.sql` script in Supabase
- Check that RLS policies are properly configured

### Credentials not working
- Verify your Dhan API credentials are correct
- Check that your Dhan API subscription is active
- Ensure you're using the correct Access Token and Client ID pair

## Benefits

✅ No need to redeploy when credentials change  
✅ Easy credential rotation  
✅ No need to access Vercel dashboard  
✅ Immediate updates without downtime  
✅ Secure storage in Supabase  
