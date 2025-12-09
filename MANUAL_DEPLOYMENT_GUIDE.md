# Manual Backend Deployment Guide

## Problem

Your backend routes (`/auth/signup`, `/auth/login`, `/tasks`) exist in the code but are NOT deployed to AWS Lambda yet.

## Solution: Deploy Backend Code to Lambda

### Step 1: Create Deployment Package

```powershell
# Navigate to backend folder
cd backend

# Install dependencies (if not already done)
npm install

# Create deployment package
# This creates a zip with all code and dependencies
Compress-Archive -Path src\*,node_modules\*,package.json,package-lock.json -DestinationPath lambda-deployment.zip -Force
```

### Step 2: Upload to AWS Lambda

#### Option A: Using AWS Console (Easiest)

1. **Go to AWS Lambda Console:**
   - https://console.aws.amazon.com/lambda/

2. **Find your function:**
   - Look for: `taskbreaker-api`
   - Click on it

3. **Upload the code:**
   - Scroll to "Code source" section
   - Click "Upload from" → ".zip file"
   - Select `lambda-deployment.zip`
   - Click "Save"

4. **Wait for upload:**
   - Should take 30-60 seconds
   - You'll see "Successfully updated the function taskbreaker-api"

#### Option B: Using AWS CLI

```bash
cd backend

# Create zip
powershell Compress-Archive -Path src\*,node_modules\*,package.json -DestinationPath lambda-deployment.zip -Force

# Upload to Lambda
aws lambda update-function-code \
  --function-name taskbreaker-api \
  --zip-file fileb://lambda-deployment.zip
```

### Step 3: Configure API Gateway CORS

1. **Go to API Gateway Console:**
   - https://console.aws.amazon.com/apigateway/

2. **Find your HTTP API:**
   - Look for API ID: `uh2xru6s82`
   - Or name: `TaskBreakerHttpApi`

3. **Configure CORS:**
   - Click on the API
   - In left menu, click "CORS"
   - Click "Configure"
   - Set:
     - **Access-Control-Allow-Origin:** `*`
     - **Access-Control-Allow-Methods:** `GET, POST, PUT, DELETE, OPTIONS`
     - **Access-Control-Allow-Headers:** `*`
     - **Access-Control-Max-Age:** `300`
   - Click "Save"

### Step 4: Update Frontend Environment Variables

1. **Go to Amplify Console:**
   - https://console.aws.amazon.com/amplify/

2. **Update environment variables:**
   - Select your app → `main` branch
   - **App settings** → **Environment variables**
   - Update or add:
     ```
     NEXT_PUBLIC_API_URL=https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
     ```
   - Click "Save"

3. **Redeploy:**
   - Go to app overview
   - Click "Redeploy this version"

### Step 5: Test

After Amplify redeploys (5-10 minutes):

1. **Test health endpoint:**
   ```bash
   curl https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/health
   ```
   Should return:
   ```json
   {"status":"healthy","timestamp":"...","environment":"production"}
   ```

2. **Test signup endpoint:**
   ```bash
   curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
   ```

3. **Test in browser:**
   - Go to: `https://main.d55wh8rbod9xx.amplifyapp.com`
   - Try signing up
   - Should work!

## Verification Checklist

- [ ] Backend code zipped with dependencies
- [ ] Uploaded to Lambda function `taskbreaker-api`
- [ ] CORS configured in API Gateway
- [ ] Frontend environment variables updated in Amplify
- [ ] Frontend redeployed
- [ ] Health endpoint returns 200 OK
- [ ] Signup/login works in browser

## Troubleshooting

### If Lambda upload fails:
- **File too large:** The zip might be too big. Try:
  ```powershell
  # Remove dev dependencies first
  cd backend
  npm install --production
  # Then create zip
  ```

### If routes still don't work:
- Check Lambda logs in CloudWatch:
  - Go to Lambda console
  - Click on `taskbreaker-api`
  - Click "Monitor" → "View CloudWatch logs"
  - Look for errors

### If CORS still fails:
- Verify API Gateway CORS settings
- Check that the API ID matches: `uh2xru6s82`
- Make sure you saved the CORS configuration

## Alternative: Use SAM CLI (Recommended)

If you can install SAM CLI, it's much easier:

```bash
# Install SAM CLI
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Then deploy
cd backend
sam build
sam deploy
```

This automatically:
- ✅ Packages your code
- ✅ Uploads to Lambda
- ✅ Configures API Gateway
- ✅ Sets up CORS
- ✅ Updates all resources

---

**Follow these steps to deploy your backend code and make the routes available!**
