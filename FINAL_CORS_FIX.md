# 🔥 FINAL CORS FIX - Complete Solution

## Problem Summary

Your API URL changed from `h5s3ysdx8d` to `uh2xru6s82` after redeployment, and CORS is not configured on the new API Gateway.

## ✅ Solution: Update Backend with Universal CORS

I've updated `backend/template.yaml` to allow **all origins** (`*`) for CORS. This is simpler and works with any domain.

### Changed in template.yaml:
```yaml
CorsConfiguration:
  AllowOrigins:
    - '*'  # ← Now allows ANY origin (including your Amplify domain)
```

## 🚀 Step 1: Deploy Backend with CORS

### Option A: Using AWS SAM CLI (Recommended)

If you have SAM CLI installed:

```bash
cd backend
sam build
sam deploy
```

### Option B: Using AWS Console (If SAM not installed)

1. **Zip your backend code:**
   ```bash
   cd backend
   # On Windows PowerShell:
   Compress-Archive -Path src\*,package.json,package-lock.json -DestinationPath lambda-function.zip -Force
   ```

2. **Go to AWS Lambda Console:**
   - https://console.aws.amazon.com/lambda/
   - Find function: `taskbreaker-api`
   - Click "Upload from" → ".zip file"
   - Upload `lambda-function.zip`
   - Click "Save"

3. **Update API Gateway CORS:**
   - Go to: https://console.aws.amazon.com/apigateway/
   - Find your HTTP API: `TaskBreakerHttpApi`
   - Click "CORS"
   - Set:
     - **Access-Control-Allow-Origin:** `*`
     - **Access-Control-Allow-Methods:** `GET,POST,PUT,DELETE,OPTIONS`
     - **Access-Control-Allow-Headers:** `*`
   - Click "Save"

### Option C: Install SAM CLI First

**On Windows:**
```powershell
# Using Chocolatey
choco install aws-sam-cli

# Or download installer from:
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
```

Then run:
```bash
cd backend
sam build
sam deploy
```

## 🔄 Step 2: Update Frontend Environment Variables

Your new API URL is: `https://uh2xru6s82.execute-api.us-east-1.amazonaws.com`

### Update in Amplify Console:

1. **Go to:** https://console.aws.amazon.com/amplify/
2. **Select your app** → Click on `main` branch
3. **App settings** → **Environment variables**
4. **Update** `NEXT_PUBLIC_API_URL` to:
   ```
   https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
   ```
5. **Click "Save"**
6. **Redeploy:**
   - Go to app overview
   - Click "Redeploy this version"

### Also Update Local .env.local:

```bash
# Edit frontend/.env.local
NEXT_PUBLIC_API_URL=https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
```

## 📋 Complete Checklist

- [ ] Update `backend/template.yaml` with CORS config (✅ Already done)
- [ ] Deploy backend to AWS (Option A, B, or C above)
- [ ] Update `NEXT_PUBLIC_API_URL` in Amplify Console
- [ ] Redeploy frontend in Amplify
- [ ] Update local `frontend/.env.local` (optional, for local dev)
- [ ] Test signup/login on your Amplify URL

## 🎯 After Completing Steps

1. Wait 5-10 minutes for Amplify redeploy
2. Go to: `https://main.d55wh8rbod9xx.amplifyapp.com`
3. Try signing up
4. ✅ **Should work!** No CORS errors

## 🔍 Verify CORS is Working

Test with curl:

```bash
curl -X OPTIONS https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup \
  -H "Origin: https://main.d55wh8rbod9xx.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see:
```
< access-control-allow-origin: *
< access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
< access-control-allow-headers: *
```

## ⚠️ Important Notes

1. **API URL Changed:** Your new API is `uh2xru6s82` (not `h5s3ysdx8d`)
2. **Must Update Frontend:** Amplify needs the new API URL in environment variables
3. **Must Redeploy:** Frontend needs to rebuild with new environment variables
4. **CORS on Backend:** Must be configured in API Gateway (not just Express)

## 🆘 If Still Not Working

### Check 1: Is CORS configured in API Gateway?
```bash
aws apigatewayv2 get-apis --query "Items[?Name=='TaskBreakerHttpApi'].ApiId" --output text
# Then check CORS for that API ID
```

### Check 2: Is frontend using correct API URL?
- Open browser dev tools
- Go to Network tab
- Try signup
- Check the request URL - should be `uh2xru6s82`

### Check 3: Did Amplify redeploy with new env vars?
- Go to Amplify Console
- Check latest build
- Look for "Environment variables" in build logs
- Should show new API URL

---

## 🎉 Summary

**Problem:** CORS not configured + API URL mismatch
**Solution:** 
1. Deploy backend with CORS (`AllowOrigins: '*'`)
2. Update frontend env vars with new API URL
3. Redeploy frontend

**Follow the steps above and your app will work!**
