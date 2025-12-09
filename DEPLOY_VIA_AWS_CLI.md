# Deploy Backend via AWS CLI

## The Fix is Ready - Just Need to Deploy

Your code IS correct:
- ✅ `backend/src/lambda.js` uses `serverless-http` 
- ✅ `backend/src/app.js` has Express with all routes
- ✅ `backend/package.json` has `serverless-http` dependency
- ✅ Dependencies installed (`npm install` completed)

**You just need to get this code to AWS Lambda!**

## Method 1: Deploy via AWS CLI (Recommended)

### Step 1: Create Deployment Package

```powershell
cd backend

# Create zip with all necessary files
Compress-Archive -Path src,node_modules,package.json -DestinationPath lambda-code.zip -Force
```

### Step 2: Upload to Lambda

```powershell
aws lambda update-function-code `
  --function-name taskbreaker-api `
  --zip-file fileb://lambda-code.zip `
  --region us-east-1
```

### Step 3: Wait for Update

```powershell
aws lambda wait function-updated `
  --function-name taskbreaker-api `
  --region us-east-1
```

### Step 4: Test

```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/health" `
  -Method GET `
  -UseBasicParsing
```

Should return: `{"status":"healthy",...}`

## Method 2: Deploy via Lambda Console (Alternative)

If you see "Code" tab in Lambda console:

1. Go to: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/taskbreaker-api
2. Click "Code" tab
3. Look for "Upload from" dropdown (top right of code editor)
4. If you don't see it, look for "Actions" dropdown
5. Select ".zip file"
6. Choose `lambda-code.zip`
7. Click "Save"

## Method 3: Use SAM CLI

If you have SAM CLI installed:

```bash
cd backend
sam build
sam deploy
```

## Method 4: Manual Upload via S3

If zip is too large for direct upload:

```powershell
# Upload to S3
aws s3 cp lambda-code.zip s3://YOUR-BUCKET-NAME/lambda-code.zip

# Update Lambda from S3
aws lambda update-function-code `
  --function-name taskbreaker-api `
  --s3-bucket YOUR-BUCKET-NAME `
  --s3-key lambda-code.zip `
  --region us-east-1
```

## After Deployment

### 1. Configure CORS in API Gateway

```powershell
# Get your API ID
aws apigatewayv2 get-apis --query "Items[?Name=='TaskBreakerHttpApi'].ApiId" --output text

# Update CORS (replace API_ID with actual ID)
aws apigatewayv2 update-api `
  --api-id uh2xru6s82 `
  --cors-configuration AllowOrigins='*',AllowMethods='GET,POST,PUT,DELETE,OPTIONS',AllowHeaders='*'
```

### 2. Update Amplify Environment Variables

1. Go to: https://console.aws.amazon.com/amplify/
2. Select your app → `main` branch
3. **App settings** → **Environment variables**
4. Update:
   ```
   NEXT_PUBLIC_API_URL=https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
   ```
5. Click "Save"
6. **Redeploy** the app

## Verify Deployment

### Test Health Endpoint:
```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/health" -UseBasicParsing
```

### Test Signup Endpoint:
```powershell
Invoke-WebRequest -Uri "https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"Test1234","name":"Test"}' `
  -UseBasicParsing
```

Should NOT return "Route not found"!

## Troubleshooting

### If AWS CLI not found:
Install AWS CLI: https://aws.amazon.com/cli/

### If credentials not configured:
```powershell
aws configure
```
Enter your AWS Access Key ID and Secret Access Key

### If function not found:
Check function name:
```powershell
aws lambda list-functions --query "Functions[?contains(FunctionName,'taskbreaker')].FunctionName"
```

### Check Lambda Logs:
```powershell
aws logs tail /aws/lambda/taskbreaker-api --follow
```

## What This Fixes

After deployment:
- ✅ `/auth/signup` works
- ✅ `/auth/login` works  
- ✅ `/tasks/*` works
- ✅ All Express routes work
- ✅ CORS works (after API Gateway config)
- ✅ Your app is fully functional

---

**Choose Method 1 (AWS CLI) - it's the fastest and most reliable!**
