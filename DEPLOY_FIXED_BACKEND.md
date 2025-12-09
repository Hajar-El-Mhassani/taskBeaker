# 🔧 Deploy Fixed Backend - Routes Now Work!

## What Was Fixed

**Problem:** Lambda handler was using `aws-serverless-express` which doesn't work properly with HTTP API v2 format.

**Solution:** Switched to `serverless-http` which properly handles HTTP API v2 events and routes.

### Changes Made:

1. ✅ Updated `backend/src/lambda.js` to use `serverless-http`
2. ✅ Updated `backend/package.json` dependencies
3. ✅ Installed new dependencies (`npm install` completed)

## 🚀 Deploy to AWS

### Option 1: Using AWS Console (Easiest - No SAM CLI needed)

#### Step 1: Create Deployment Package

```powershell
cd backend

# Install dependencies (already done)
npm install

# Create zip file with all code and dependencies
Compress-Archive -Path src\*,node_modules\*,package.json,package-lock.json -DestinationPath ..\lambda-deployment.zip -Force
```

#### Step 2: Upload to Lambda

1. Go to: https://console.aws.amazon.com/lambda/
2. Find function: `taskbreaker-api`
3. Click "Upload from" → ".zip file"
4. Select `lambda-deployment.zip` from your project root
5. Click "Save"
6. Wait for upload to complete (~30 seconds)

#### Step 3: Test the API

```powershell
# Test signup endpoint
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"Test1234","name":"Test User"}' `
  -UseBasicParsing
```

You should get a response (not "Route not found")!

### Option 2: Using AWS SAM CLI (If Installed)

```bash
cd backend
sam build
sam deploy
```

## ✅ After Deployment

### 1. Update Frontend Environment Variables

Your API URL is: `https://uh2xru6s82.execute-api.us-east-1.amazonaws.com`

**In Amplify Console:**
1. Go to: https://console.aws.amazon.com/amplify/
2. Select your app → `main` branch
3. **App settings** → **Environment variables**
4. Update `NEXT_PUBLIC_API_URL`:
   ```
   https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
   ```
5. Click "Save"
6. **Redeploy** the app

### 2. Configure CORS in API Gateway

1. Go to: https://console.aws.amazon.com/apigateway/
2. Find HTTP API with ID: `uh2xru6s82`
3. Click "CORS" in left menu
4. Click "Configure"
5. Set:
   - **Access-Control-Allow-Origin:** `*`
   - **Access-Control-Allow-Methods:** `GET,POST,PUT,DELETE,OPTIONS`
   - **Access-Control-Allow-Headers:** `*`
   - **Access-Control-Max-Age:** `300`
6. Click "Save"

## 🧪 Test Your Routes

After deployment, test each route:

### Test Signup:
```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"user@example.com","password":"Password123","name":"Test User"}' `
  -UseBasicParsing
```

### Test Health:
```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/health" `
  -Method GET `
  -UseBasicParsing
```

### Test Login:
```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"user@example.com","password":"Password123"}' `
  -UseBasicParsing
```

## 📋 Complete Checklist

- [ ] Run `npm install` in backend folder (✅ Done)
- [ ] Create deployment zip file
- [ ] Upload to Lambda function `taskbreaker-api`
- [ ] Configure CORS in API Gateway
- [ ] Update `NEXT_PUBLIC_API_URL` in Amplify Console
- [ ] Redeploy frontend in Amplify
- [ ] Test signup/login on your Amplify URL

## 🎯 Expected Result

After completing all steps:

1. ✅ Backend routes work (`/auth/signup`, `/auth/login`, `/tasks`, etc.)
2. ✅ CORS allows requests from your Amplify domain
3. ✅ Frontend can communicate with backend
4. ✅ Signup and login work in your app
5. ✅ Full application is functional

## ⚠️ Important Notes

1. **Zip file size:** The deployment package will be ~20-30MB due to node_modules
2. **Upload time:** May take 30-60 seconds to upload to Lambda
3. **Lambda timeout:** Already set to 30 seconds in template
4. **Memory:** Already set to 512MB in template

## 🆘 Troubleshooting

### If zip creation fails:
```powershell
# Try from project root
cd ..
Compress-Archive -Path backend\src,backend\node_modules,backend\package.json,backend\package-lock.json -DestinationPath lambda-deployment.zip -Force
```

### If upload fails (file too large):
Use S3 upload method:
1. Upload zip to S3 bucket
2. In Lambda console, choose "Upload from" → "Amazon S3 location"
3. Provide S3 URL

### If routes still don't work:
Check Lambda logs in CloudWatch:
1. Go to Lambda console
2. Click on `taskbreaker-api`
3. Go to "Monitor" tab
4. Click "View CloudWatch logs"
5. Check recent log streams for errors

---

**This fix resolves the "Route not found" issue. Your backend routes will work after deployment!**
