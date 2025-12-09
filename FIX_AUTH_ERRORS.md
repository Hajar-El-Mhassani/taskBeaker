# Fix Authentication 500 Errors - AWS Bedrock Edition

## Problem
Your authentication endpoints are returning 500 errors because:
1. Missing `AdminConfirmSignUp` permission in Cognito IAM policy
2. Missing AWS Bedrock permissions for AI task generation

## Solution - Using AWS Bedrock (No API Keys Needed!)

The application has been updated to use **AWS Bedrock** instead of OpenAI. This means:
- ✅ No API keys to manage
- ✅ Native AWS integration
- ✅ Pay-as-you-go pricing
- ✅ Uses Claude 3 Sonnet model

### Step 1: Enable Bedrock Model Access

Before deploying, you need to enable access to Claude 3 Sonnet in AWS Bedrock:

1. Go to AWS Console → Bedrock → Model access
2. Click "Manage model access"
3. Find "Anthropic" and check "Claude 3 Sonnet"
4. Click "Request model access"
5. Wait for approval (usually instant for Claude models)

Or use AWS CLI:
```bash
aws bedrock list-foundation-models --region us-east-1
```

### Step 2: Rebuild and Redeploy

The `template.yaml` has been updated with:
- ✅ Added `BEDROCK_MODEL_ID` environment variable
- ✅ Added `bedrock:InvokeModel` IAM permission
- ✅ Added `cognito-idp:AdminConfirmSignUp` permission
- ✅ Removed OpenAI dependency

The `aiService.js` has been updated to:
- ✅ Use AWS Bedrock Runtime API
- ✅ Call Claude 3 Sonnet for task generation
- ✅ Include fallback logic if Bedrock is unavailable

Now rebuild and redeploy:

```bash
cd backend

# Build the SAM application
sam build

# Deploy (use your existing config)
sam deploy
```

### Step 3: Verify Deployment

After deployment completes:

1. Try signing up a new user
2. Try logging in with existing credentials
3. Create a task plan to test Bedrock integration

The 500 errors should be resolved!

## What Changed

### 1. template.yaml Updates:

**Added Bedrock environment variable:**
```yaml
BEDROCK_MODEL_ID: anthropic.claude-3-sonnet-20240229-v1:0
```

**Added Bedrock IAM permission:**
```yaml
- Effect: Allow
  Action:
    - bedrock:InvokeModel
  Resource: !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
```

**Added Cognito permission:**
```yaml
- cognito-idp:AdminConfirmSignUp
```

### 2. aiService.js Updates:

- Replaced OpenAI API calls with AWS Bedrock Runtime
- Uses Claude 3 Sonnet model for intelligent task breakdown
- Includes fallback plan generator if Bedrock is unavailable
- Properly formats prompts for Claude's API

## Troubleshooting

### If you still get 500 errors:

1. **Check CloudWatch Logs:**
   ```bash
   aws logs tail /aws/lambda/taskbreaker-api --follow
   ```

2. **Verify Bedrock Model Access:**
   ```bash
   aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic
   ```

3. **Check Lambda Environment Variables:**
   - Go to AWS Console → Lambda → taskbreaker-api
   - Check Configuration → Environment variables
   - Verify `BEDROCK_MODEL_ID` is present

4. **Verify IAM Permissions:**
   - The Lambda execution role needs `bedrock:InvokeModel` permission
   - Check the role in IAM console

### Common Issues:

- **"Model not found"**: Enable model access in Bedrock console (Step 1)
- **"Access denied"**: The Lambda execution role needs Bedrock permissions
- **"Region not supported"**: Bedrock is available in us-east-1, us-west-2, and other regions
- **Still getting 500s**: Check CloudWatch logs for the actual error message

### Bedrock Pricing

Claude 3 Sonnet pricing (as of 2024):
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

For typical task planning (100-500 tokens per request), this is very cost-effective!

## Benefits of Using Bedrock

1. **No API Key Management**: Everything stays within AWS
2. **Better Security**: No external API calls
3. **Lower Latency**: Regional AWS service
4. **Unified Billing**: Part of your AWS bill
5. **Enterprise Ready**: AWS compliance and security standards
