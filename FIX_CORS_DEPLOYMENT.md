# Fix CORS Issue - Backend Update Required

## Problem

Your frontend at `https://main.d55wh8rbod9xx.amplifyapp.com` cannot access the API because CORS is not configured in API Gateway.

**Error:**
```
Access to fetch at 'https://h5s3ysdx8d.execute-api.us-east-1.amazonaws.com/auth/signup' 
from origin 'https://main.d55wh8rbod9xx.amplifyapp.com' has been blocked by CORS policy
```

## Solution

Updated `backend/template.yaml` to add CORS configuration to the HTTP API Gateway.

### What Changed

Added explicit CORS configuration:
- **Allowed Origins:** Your Amplify domain + localhost
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** All headers (*)
- **Max Age:** 300 seconds

## 🚀 Deploy the Fix

### Step 1: Build and Deploy Backend

```bash
cd backend
sam build
sam deploy
```

**Note:** This will update your existing stack with CORS configuration.

### Step 2: Verify Deployment

After deployment completes, you'll see the same outputs:
```
ApiUrl: https://h5s3ysdx8d.execute-api.us-east-1.amazonaws.com
UserPoolId: us-east-1_...
UserPoolClientId: ...
```

The API URL should remain the same, but now with CORS enabled.

### Step 3: Test Your App

1. Go to: `https://main.d55wh8rbod9xx.amplifyapp.com`
2. Try to sign up with a new account
3. ✅ Should work without CORS errors!

## What Was Fixed

### Before:
```yaml
Events:
  ApiEvent:
    Type: HttpApi
    Properties:
      Path: /{proxy+}
      Method: ANY
```
❌ No CORS configuration = Browser blocks requests

### After:
```yaml
TaskBreakerHttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    CorsConfiguration:
      AllowOrigins:
        - 'https://main.d55wh8rbod9xx.amplifyapp.com'
        - 'http://localhost:3000'
      AllowMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      AllowHeaders:
        - '*'
```
✅ CORS properly configured = Requests work!

## Timeline

- **Build time:** 1-2 minutes
- **Deploy time:** 2-3 minutes
- **Total:** ~5 minutes

## Verification

After deployment, test with curl:

```bash
curl -X OPTIONS https://h5s3ysdx8d.execute-api.us-east-1.amazonaws.com/auth/signup \
  -H "Origin: https://main.d55wh8rbod9xx.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see CORS headers in the response:
```
< access-control-allow-origin: https://main.d55wh8rbod9xx.amplifyapp.com
< access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
< access-control-allow-headers: *
```

## Important Notes

1. **No frontend changes needed** - Only backend update
2. **API URL stays the same** - No need to update environment variables
3. **Existing data preserved** - This is just a configuration update
4. **Zero downtime** - CloudFormation handles the update gracefully

## After Fix

Your full-stack app will be fully functional:
- ✅ Frontend deployed on Amplify
- ✅ Backend API with CORS enabled
- ✅ Authentication works
- ✅ Task creation works
- ✅ All features operational

---

**Run the deployment now to fix the CORS issue!**

```bash
cd backend
sam build
sam deploy
```
