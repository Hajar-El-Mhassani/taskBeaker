# Fix Amplify 404 Error - Enable SSR

## Problem
Getting 404 error after successful deployment because Next.js SSR is not enabled in Amplify.

## Solution: Enable SSR in Amplify Console

### Step 1: Go to Amplify Console
1. Open: https://console.aws.amazon.com/amplify/
2. Click on your app: `taskBeaker`
3. Click on your branch: `main`

### Step 2: Enable SSR
1. Click **App settings** (left sidebar)
2. Click **Build settings**
3. Scroll down to **Advanced settings**
4. Find **Server-Side Rendering (SSR) deployment**
5. Toggle **Enable SSR app logs** to ON
6. Click **Save**

### Step 3: Redeploy
1. Go back to your app overview
2. Click **Redeploy this version** button
3. Wait 5-10 minutes for deployment

### Step 4: Verify Environment Variables
Make sure these are set in **App settings → Environment variables**:

```
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
NEXT_PUBLIC_USER_POOL_ID=<your-cognito-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-cognito-client-id>
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Alternative: Check Build Logs
If SSR option is not visible:

1. Go to your latest build
2. Click **View build logs**
3. Look for errors in the deployment phase
4. Common issues:
   - Missing environment variables
   - Incorrect artifact paths
   - Build failures

### What Changed
Updated `amplify.yml` with modern monorepo structure:
- `appRoot: frontend` - Specifies frontend directory
- `baseDirectory: .` - Relative to appRoot
- Includes all necessary Next.js SSR files:
  - `.next/**/*` - Build output
  - `node_modules/**/*` - Runtime dependencies
  - `package.json` & `package-lock.json` - Package manifests
  - `next.config.js` - Next.js configuration
  - `public/**/*` - Static assets

## After Fix
Your app should be accessible at: `https://main.d3m285o2qhey9q.amplifyapp.com`

## Still Getting 404?
If you still see 404 after enabling SSR:

1. Check if the build actually succeeded (green checkmark)
2. Look at the deployment logs for errors
3. Verify the artifacts were uploaded correctly
4. Try a manual redeploy

## Need Help?
Share the build logs from Amplify Console if the issue persists.
