# Deploy TaskBreaker with AWS Bedrock

This guide walks you through deploying TaskBreaker with AWS Bedrock integration for AI-powered task planning.

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed
- Node.js 18.x or later
- An AWS account with Bedrock access

## Step 1: Enable AWS Bedrock Model Access

Before deploying, enable access to Claude 3 Sonnet in your AWS account:

### Option A: Using AWS Console

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Find "Anthropic" section
5. Check the box for "Claude 3 Sonnet"
6. Click "Request model access"
7. Wait for approval (usually instant for Claude models)

### Option B: Using AWS CLI

```bash
# List available models
aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic

# The model ID we're using:
# anthropic.claude-3-sonnet-20240229-v1:0
```

## Step 2: Build the Application

```bash
cd backend

# Install dependencies
npm install

# Build with SAM
sam build
```

## Step 3: Deploy to AWS

### First-time Deployment (Guided)

```bash
sam deploy --guided
```

You'll be prompted for:
- **Stack Name**: `taskbreaker` (or your preferred name)
- **AWS Region**: `us-east-1` (or your preferred region with Bedrock support)
- **Confirm changes**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Disable rollback**: N
- **Save arguments to configuration file**: Y

### Subsequent Deployments

```bash
sam deploy
```

## Step 4: Get Your API Endpoint

After deployment, SAM will output your API URL:

```
Outputs:
  ApiUrl: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

Copy this URL - you'll need it for the frontend configuration.

## Step 5: Configure Frontend

Update your frontend environment variables:

```bash
cd ../frontend

# Edit .env.local
echo "NEXT_PUBLIC_API_URL=https://your-api-url-here.execute-api.us-east-1.amazonaws.com" > .env.local
```

## Step 6: Test the Deployment

### Test Authentication

```bash
# Sign up a new user
curl -X POST https://your-api-url/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

### Test Task Generation (with Bedrock)

```bash
# First, get an auth token from signup/login response
TOKEN="your-id-token-here"

# Create a task plan
curl -X POST https://your-api-url/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "taskName": "Build a mobile app",
    "timeMode": "days",
    "amount": 5
  }'
```

## What's Deployed

### AWS Resources Created:

1. **Lambda Function** (`taskbreaker-api`)
   - Runs your Express.js API
   - Has permissions for Cognito, DynamoDB, S3, and Bedrock

2. **API Gateway** (HTTP API)
   - Public endpoint for your API
   - CORS configured for frontend access

3. **Cognito User Pool**
   - User authentication and management
   - Email-based login

4. **DynamoDB Tables**
   - `TaskBreaker-Users`: User profiles
   - `TaskBreaker-TaskPlans`: Task plans and subtasks

5. **S3 Bucket**
   - Avatar storage
   - Public read access for avatars

### Environment Variables Set:

- `USERS_TABLE`: DynamoDB users table name
- `TASKS_TABLE`: DynamoDB tasks table name
- `S3_BUCKET`: S3 bucket name
- `USER_POOL_ID`: Cognito user pool ID
- `USER_POOL_CLIENT_ID`: Cognito client ID
- `AWS_REGION_CUSTOM`: Deployment region
- `BEDROCK_MODEL_ID`: Claude 3 Sonnet model ID

### IAM Permissions Granted:

- DynamoDB: Read/Write on both tables
- S3: Full access to the bucket
- Cognito: User management operations
- **Bedrock: InvokeModel for Claude 3 Sonnet**

## Monitoring and Debugging

### View Lambda Logs

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/taskbreaker-api --follow

# View recent logs
aws logs tail /aws/lambda/taskbreaker-api --since 1h
```

### Check Bedrock Usage

```bash
# View CloudWatch metrics for Bedrock
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-3-sonnet-20240229-v1:0 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

### Common Issues

#### 1. "Model not found" or "Access denied" for Bedrock

**Solution**: Enable model access in Bedrock console (Step 1)

```bash
# Verify model access
aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic
```

#### 2. Authentication 500 errors

**Solution**: Check CloudWatch logs for specific error

```bash
aws logs tail /aws/lambda/taskbreaker-api --follow
```

#### 3. CORS errors from frontend

**Solution**: Verify API Gateway CORS configuration in template.yaml

#### 4. Bedrock throttling errors

**Solution**: Bedrock has default quotas. Request a quota increase if needed:
- Go to Service Quotas console
- Search for "Bedrock"
- Request increase for "Invocations per minute"

## Cost Estimation

### Bedrock Costs (Claude 3 Sonnet)

- **Input tokens**: ~$3 per million tokens
- **Output tokens**: ~$15 per million tokens

Typical task generation:
- Input: ~200 tokens (prompt)
- Output: ~500 tokens (task plan)
- Cost per request: ~$0.01

### Other AWS Costs

- **Lambda**: Free tier covers 1M requests/month
- **API Gateway**: Free tier covers 1M requests/month
- **DynamoDB**: Free tier covers 25GB storage + 25 RCU/WCU
- **S3**: Free tier covers 5GB storage
- **Cognito**: Free tier covers 50,000 MAU

**Estimated monthly cost for moderate usage**: $5-20

## Updating the Deployment

When you make code changes:

```bash
cd backend

# Rebuild
sam build

# Deploy updates
sam deploy

# No need to answer prompts - uses saved config
```

## Cleanup

To delete all resources:

```bash
cd backend

# Delete the CloudFormation stack
sam delete

# Or use AWS CLI
aws cloudformation delete-stack --stack-name taskbreaker
```

## Next Steps

1. Deploy the frontend to AWS Amplify (see `FRONTEND_AWS_DEPLOYMENT.md`)
2. Set up custom domain for API Gateway
3. Configure CloudWatch alarms for monitoring
4. Set up CI/CD pipeline for automated deployments

## Support

- Check CloudWatch Logs for errors
- Review AWS Bedrock documentation: https://docs.aws.amazon.com/bedrock/
- Review SAM documentation: https://docs.aws.amazon.com/serverless-application-model/
