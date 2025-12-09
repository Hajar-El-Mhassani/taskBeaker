# Environment Configuration Guide

This guide explains how to set up environment variables for the TaskBreaker application.

## Overview

The TaskBreaker application uses environment variables to configure:
- AWS service connections (Cognito, DynamoDB, S3)
- API endpoints
- Regional settings

## Backend Environment Variables

### ✅ You DON'T Need `.env` for Backend!

The backend **does not require a `.env` file** because all environment variables are defined in `template.yaml` and automatically injected by AWS Lambda.

**In `template.yaml`:**
```yaml
Environment:
  Variables:
    USERS_TABLE: !Ref UsersTable
    TASKS_TABLE: !Ref TaskPlansTable
    S3_BUCKET: !Ref TaskBreakerBucket
    USER_POOL_ID: !Ref TaskBreakerUserPool
    USER_POOL_CLIENT_ID: !Ref TaskBreakerUserPoolClient
    AWS_REGION_CUSTOM: !Ref AWS::Region
```

These are automatically set when you deploy with `sam deploy`.

### When You Might Need Backend `.env`

**Only for local testing with SAM Local:**

If you want to test the backend locally (not required for deployment):

```bash
sam local start-api
```

SAM Local will automatically use values from `template.yaml` - no `.env` needed!

### Testing

For Jest tests, AWS SDK is mocked, so no real environment variables are needed. The `.env.test` file is optional and only for reference.

## Frontend Environment Variables

### Required Variables

The frontend requires these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API Gateway URL | `https://xxxxx.execute-api.us-east-1.amazonaws.com` |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_xxxxxxxxx` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_AWS_REGION` | AWS Region | `us-east-1` |

### Setup Steps

#### 1. After Backend Deployment

After deploying the backend with SAM, you'll get outputs like:

```
CloudFormation outputs from deployed stack
---------------------------------------------------------------------------
Outputs
---------------------------------------------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com

Key                 UserPoolId
Description         Cognito User Pool ID
Value               us-east-1_ABC123XYZ

Key                 UserPoolClientId
Description         Cognito User Pool Client ID
Value               1a2b3c4d5e6f7g8h9i0j
---------------------------------------------------------------------------
```

#### 2. Create Frontend Environment File

```bash
cd frontend
cp .env.local.example .env.local
```

#### 3. Update `.env.local` with Your Values

```env
NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_ABC123XYZ
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
NEXT_PUBLIC_AWS_REGION=us-east-1
```

#### 4. Verify Configuration

```bash
npm run dev
```

Open http://localhost:3000 and test signup/login.

## Environment Files Reference

### Backend Files

```
backend/
└── template.yaml        # All environment variables defined here!
```

**No `.env` files needed!** Everything is in `template.yaml`.

### Frontend Files

```
frontend/
├── .env.local.example   # Template with placeholder values
└── .env.local          # Actual values (git-ignored, YOU NEED THIS)
```

## Getting AWS Values

### Method 1: From SAM Deployment Output

When you run `sam deploy`, the outputs are displayed:

```bash
sam deploy --guided
# ... deployment process ...
# Outputs are shown at the end
```

### Method 2: From AWS Console

1. **API Gateway URL**:
   - Go to AWS Console → API Gateway
   - Select your API
   - Copy the Invoke URL

2. **Cognito User Pool ID**:
   - Go to AWS Console → Cognito
   - Select your User Pool
   - Copy the Pool ID (format: `us-east-1_xxxxxxxxx`)

3. **Cognito User Pool Client ID**:
   - In Cognito User Pool
   - Go to "App clients"
   - Copy the Client ID

### Method 3: Using AWS CLI

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name taskbreaker-stack \
  --query 'Stacks[0].Outputs' \
  --output table

# Get User Pool ID
aws cognito-idp list-user-pools --max-results 10

# Get User Pool Client ID
aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_xxxxxxxxx
```

## Local Development Scenarios

### Scenario 1: Frontend + Deployed Backend

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

```bash
cd frontend
npm run dev
```

### Scenario 2: Frontend + Local Backend (SAM)

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

```bash
# Terminal 1: Start backend
cd backend
sam local start-api --port 3001

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Scenario 3: Testing Only

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

Tests use mocked AWS services, so no real AWS credentials needed.

## Production Deployment

### Backend

No environment file needed. AWS SAM handles everything via `template.yaml`.

### Frontend

#### Option A: Vercel

1. Go to Vercel dashboard
2. Import your repository
3. Add environment variables in Vercel settings:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
   - `NEXT_PUBLIC_AWS_REGION`

#### Option B: AWS Amplify

1. Go to AWS Amplify console
2. Connect your repository
3. Add environment variables in Amplify settings

#### Option C: Docker

Create a `.env.production` file:

```env
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

Build and run:

```bash
docker build -t taskbreaker-frontend .
docker run -p 3000:3000 --env-file .env.production taskbreaker-frontend
```

## Security Best Practices

### ✅ DO

- Keep `.env.local` and `.env` files in `.gitignore`
- Use different values for development and production
- Rotate Cognito client secrets regularly
- Use AWS Secrets Manager for sensitive data in production
- Limit IAM permissions to minimum required

### ❌ DON'T

- Commit `.env` files to version control
- Share environment files via email or chat
- Use production credentials in development
- Hardcode sensitive values in source code
- Use the same Cognito pool for dev and prod

## Troubleshooting

### Issue: "API URL not defined"

**Solution**: Ensure `NEXT_PUBLIC_API_URL` is set in `.env.local`

```bash
# Check if variable is set
cd frontend
cat .env.local | grep NEXT_PUBLIC_API_URL
```

### Issue: "Cognito authentication failed"

**Solution**: Verify Cognito IDs are correct

```bash
# Test Cognito connection
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_xxxxxxxxx
```

### Issue: "CORS error when calling API"

**Solution**: 
1. Verify API URL is correct (should start with `https://`)
2. Check API Gateway CORS configuration
3. Ensure backend is deployed

### Issue: "Environment variables not loading"

**Solution**:
1. Restart Next.js dev server after changing `.env.local`
2. Ensure variable names start with `NEXT_PUBLIC_`
3. Check for typos in variable names

### Issue: "Cannot connect to local backend"

**Solution**:
```bash
# Ensure SAM local is running
cd backend
sam local start-api --port 3001

# Update frontend to use local URL
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Environment Variable Checklist

Before deploying, verify:

- [ ] Backend deployed to AWS
- [ ] SAM outputs captured
- [ ] Frontend `.env.local` created
- [ ] All 4 frontend variables set
- [ ] API URL starts with `https://`
- [ ] Cognito IDs match deployed resources
- [ ] Frontend can reach backend API
- [ ] Signup/login works
- [ ] `.env` files in `.gitignore`

## Quick Reference

### Get All Values at Once

```bash
# After SAM deployment
aws cloudformation describe-stacks \
  --stack-name taskbreaker-stack \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

### Test Configuration

```bash
# Test backend
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/health

# Test frontend
cd frontend
npm run dev
# Open http://localhost:3000
```

## Additional Resources

- [AWS SAM Environment Variables](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-invoke.html#serverless-sam-cli-using-invoke-environment-file)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

---

**Need Help?** Check `QUICK_START.md` or `AWS_SETUP_GUIDE.md` for deployment instructions.
