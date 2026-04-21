# Error Messages & Validation Guide

## Overview
The application now has comprehensive error handling with user-friendly messages for all common scenarios.

## Settings Modal - Credential Validation

### What Happens When You Save Credentials

1. **Validation First**: Credentials are tested against Dhan API before saving
2. **Real-time Feedback**: You see exactly what's wrong if validation fails
3. **Safe Storage**: Only valid credentials are saved to the database

### Error Messages You Might See

#### 🔒 Access Token Expired
```
Access Token Expired: Your token has expired or been revoked. 
Please generate a new token from your Dhan account.
```

**What to do:**
1. Log in to your Dhan account
2. Go to Settings → API Management
3. Generate a new access token
4. Copy and paste the new token in Settings

#### ❌ Invalid Access Token
```
Invalid Access Token: The token you entered is not valid. 
Please check and try again.
```

**What to do:**
- Double-check you copied the entire token
- Make sure there are no extra spaces
- Verify you're using the correct token from Dhan

#### ❌ Invalid Client ID
```
Invalid Client ID: The client ID appears to be incorrect. 
Please verify it from your Dhan account.
```

**What to do:**
- Verify the client ID from your Dhan account
- Make sure you copied it correctly
- Check for any typos

#### ⏱️ Rate Limit
```
Rate Limit: Too many validation attempts. 
Please wait a moment and try again.
```

**What to do:**
- Wait 30-60 seconds
- Try again
- Don't spam the validate button

#### 🌐 Network Error
```
Network Error: Unable to connect to Dhan API. 
Please check your internet connection.
```

**What to do:**
- Check your internet connection
- Try refreshing the page
- Check if Dhan API is down (rare)

#### ✓ Success
```
Credentials validated and saved successfully!
```

**What this means:**
- Your credentials are valid
- They've been saved to the database
- Data collection will now work

## Dashboard - Data Fetching Errors

### During Manual Fetch or Auto-Polling

#### 🔒 Access Token Expired
```
Access Token Expired: Please update your Dhan credentials in Settings
```

**What to do:**
1. Click the Settings (⚙️) button
2. Generate a new token from Dhan
3. Enter and save the new credentials

#### ❌ Authentication Failed
```
Authentication Failed: Invalid credentials. Check Settings
```

**What to do:**
1. Open Settings
2. Verify your credentials are correct
3. Re-enter if necessary

#### ⏱️ Rate Limit
```
Rate Limit: Too many requests. Please wait a moment
```

**What to do:**
- Wait 30-60 seconds
- Auto-polling will resume automatically
- Don't click "Fetch Now" repeatedly

#### 🌐 Network Error
```
Network Error: Unable to connect to Dhan API
```

**What to do:**
- Check your internet connection
- Wait a moment and try again
- Check Vercel status if deployed

## Test Mode Errors

### During 1-Minute Test Collection

#### Consecutive Failures
```
Stopped after 3 consecutive failures.
```

**What this means:**
- 3 API calls failed in a row
- Usually indicates invalid credentials or API issues

**What to do:**
1. Check Settings for valid credentials
2. Wait a moment for rate limits to reset
3. Try test mode again

#### Token Expired During Test
```
Access Token Expired: Your token has expired or been revoked.
```

**What to do:**
1. Test will stop automatically
2. Update credentials in Settings
3. Run test mode again

## API Response Codes

### What Each Code Means

| Code | Meaning | User Message |
|------|---------|--------------|
| 200 | Success | Data fetched successfully |
| 400 | Bad Request | Invalid request format (rare) |
| 401 | Unauthorized | Invalid access token |
| 403 | Forbidden | Token expired or revoked |
| 429 | Rate Limit | Too many requests |
| 500+ | Server Error | Dhan API is down |

## Validation Flow

```
User enters credentials
        ↓
Click "Validate & Save"
        ↓
Test credentials with Dhan API
        ↓
    Valid? ──No──→ Show specific error message
        ↓ Yes
Save to database
        ↓
Show success message
        ↓
Close modal after 2 seconds
```

## Best Practices

### For Users

1. **Always validate before saving**: The app does this automatically
2. **Keep tokens fresh**: Regenerate if you see expiration errors
3. **Don't spam buttons**: Respect rate limits
4. **Check Settings first**: Most errors are credential-related

### For Developers

1. **Specific error messages**: Tell users exactly what's wrong
2. **Actionable guidance**: Tell users how to fix it
3. **Visual feedback**: Use icons and colors
4. **Auto-dismiss**: Clear errors after 8 seconds
5. **Log everything**: Console logs for debugging

## Error Message Format

All error messages follow this pattern:

```
[Icon] [Error Type]: [Specific Issue]
[Optional: What to do about it]
```

Examples:
- ✓ Success messages (green)
- ❌ Error messages (red)
- ⏱️ Rate limit messages (yellow)
- 🌐 Network messages (blue)
- 🔒 Security messages (orange)

## Testing Error Scenarios

### Test Invalid Token
1. Enter random text as access token
2. Click "Validate & Save"
3. Should see: "Invalid Access Token"

### Test Invalid Client ID
1. Enter valid token but wrong client ID
2. Click "Validate & Save"
3. Should see: "Invalid Client ID"

### Test Rate Limit
1. Click "Validate & Save" 5 times quickly
2. Should see: "Rate Limit"

### Test Network Error
1. Disconnect internet
2. Click "Validate & Save"
3. Should see: "Network Error"

## Troubleshooting

### Error: "Credentials validation failed"
**Check:**
- Are you connected to the internet?
- Is Dhan API accessible?
- Are your credentials correct?

### Error: "Failed to save credentials"
**Check:**
- Is Supabase configured correctly?
- Are environment variables set?
- Check browser console for details

### Error: "Database error"
**Check:**
- Supabase connection
- app_settings table exists
- Proper permissions

## API Endpoints

### Validation Endpoint
```
POST /api/validate-credentials
Body: { accessToken, clientId }
Response: { valid, message, errorCode }
```

### Settings Endpoint
```
POST /api/settings
Body: { accessToken, clientId }
Response: { success, message }
```

### Fetch Tick Endpoint
```
POST /api/fetch-tick
Headers: { x-cron-secret }
Response: { success, data } or { error, message }
```

## Error Codes Reference

| Error Code | Meaning | Action |
|------------|---------|--------|
| INVALID_TOKEN | Token is wrong | Re-enter token |
| TOKEN_EXPIRED | Token expired | Generate new token |
| INVALID_CLIENT_ID | Client ID wrong | Verify client ID |
| RATE_LIMIT | Too many requests | Wait and retry |
| NETWORK_ERROR | Connection failed | Check internet |
| API_ERROR | Dhan API down | Wait and retry |
| SERVER_ERROR | Internal error | Check logs |

## User Experience

### Good Error Message
```
🔒 Access Token Expired: Your token has expired or been revoked. 
Please generate a new token from your Dhan account and update it in Settings.
```

### Bad Error Message (What We Avoid)
```
Error 403
```

## Future Enhancements

Potential improvements:
- [ ] Auto-refresh tokens
- [ ] Token expiry warnings
- [ ] Retry logic with exponential backoff
- [ ] Offline mode detection
- [ ] Error analytics
- [ ] Help links in error messages
