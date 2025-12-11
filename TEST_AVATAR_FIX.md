# Test Avatar Upload Fix

## Problem
Avatar upload failing because frontend is using `accessToken` instead of `idToken`.

## Solution Applied
Updated `frontend/src/lib/api.js` to use `idToken` for all API requests.

## To Apply the Fix

### If Running Locally:
```bash
cd frontend

# Stop the dev server (Ctrl+C)

# Restart it
npm run dev
```

### If Deployed to Amplify:
```bash
git add frontend/src/lib/api.js
git commit -m "Fix: Use idToken for API authentication"
git push
```

## After Restarting

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Log out** of the application
3. **Log back in** (this gets fresh tokens with the new code)
4. **Try avatar upload** - should work now!

## How to Verify Fix is Applied

Open browser console (F12) and check the Network tab when uploading:
- Look for the `/auth/avatar` request
- Check the Authorization header
- It should start with: `Bearer eyJ...` (the idToken)
- The token should have `"token_use":"id"` when decoded

## If Still Not Working

The frontend code hasn't been rebuilt yet. Make sure you:
- Actually stopped the dev server (not just minimized the terminal)
- Restarted with `npm run dev`
- Refreshed the browser page (F5)
- Logged out and back in

## Alternative: Use idToken Manually

If you want to test the backend directly:

```bash
# 1. Login to get tokens
curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# 2. Copy the "idToken" from the response (NOT accessToken!)

# 3. Test avatar upload with a real image file
curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/avatar \
  -H "Authorization: Bearer YOUR_ID_TOKEN_HERE" \
  -F "avatar=@path/to/image.jpg"
```

This should return success if the backend is working correctly.
