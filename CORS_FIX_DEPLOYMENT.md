# CORS Fix - Deployment Required

## What Was Fixed

The CORS configuration has been updated in both:
1. **backend/template.yaml** - API Gateway CORS settings
2. **backend/src/app.js** - Express CORS middleware

### Changes Made:
- Explicitly allowed your Amplify frontend domain: `https://main.d55wh8rbod9xx.amplifyapp.com`
- Added localhost for local development
- Specified exact allowed methods including PATCH
- Added proper headers configuration
- Added ExposeHeaders for better client-side access

## Deploy the Backend

Run these commands from the `backend` directory:

```powershell
cd backend

# Build the SAM application
sam build

# Deploy with confirmation
sam deploy --guided

# Or deploy without prompts (if you've deployed before)
sam deploy
```

## Verify the Fix

After deployment:

1. Check the API Gateway CORS settings in AWS Console
2. Test the frontend at https://main.d55wh8rbod9xx.amplifyapp.com
3. Open browser DevTools and verify:
   - OPTIONS preflight requests succeed (200 status)
   - Response headers include `Access-Control-Allow-Origin`
   - No more CORS errors in console

## If Issues Persist

If you still see CORS errors after deployment:

1. **Clear browser cache** - Old preflight responses may be cached
2. **Check API Gateway stage** - Ensure the deployment reached the correct stage
3. **Verify environment** - Make sure the frontend is using the correct API URL

## Alternative: Wildcard CORS (Less Secure)

If you need to allow all origins temporarily for testing:

In `backend/template.yaml`, change:
```yaml
AllowOrigins:
  - '*'
```

And in `backend/src/app.js`:
```javascript
app.use(cors());
```

But this is NOT recommended for production.
