# TaskBreaker AWS Configuration Guide

This guide will help you deploy the TaskBreaker application to your AWS account.

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** - An active AWS account with appropriate permissions
2. **AWS CLI** - Installed and configured ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
3. **AWS SAM CLI** - Installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
4. **Node.js 18.x** - Installed on your machine
5. **IAM Permissions** - Your AWS user needs permissions for:
   - CloudFormation
   - Lambda
   - API Gateway
   - DynamoDB
   - S3
   - Cognito
   - IAM (for creating roles)

## Step 1: Configure AWS CLI

If you haven't configured AWS CLI yet:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: e.g., `us-east-1`
- **Default output format**: `json`

Verify your configuration:
```bash
aws sts get-caller-identity
```

## Step 2: Prepare Backend for Deployment

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

## Step 3: Build the SAM Application

Build the application:
```bash
sam build
```

This command:
- Packages your Lambda function code
- Resolves dependencies
- Prepares the application for deployment

## Step 4: Deploy to AWS

### First-Time Deployment (Guided)

For your first deployment, use the guided mode:

```bash
sam deploy --guided
```

You'll be prompted for:

1. **Stack Name**: `taskbreaker-stack` (or your preferred name)
2. **AWS Region**: e.g., `us-east-1`
3. **Confirm changes before deploy**: `Y`
4. **Allow SAM CLI IAM role creation**: `Y`
5. **Disable rollback**: `N`
6. **Save arguments to configuration file**: `Y`
7. **SAM configuration file**: `samconfig.toml` (default)
8. **SAM configuration environment**: `default` (default)

The deployment will:
- Create a CloudFormation stack
- Provision all AWS resources (Cognito, DynamoDB, S3, Lambda, API Gateway)
- Display progress and outputs

### Subsequent Deployments

After the first deployment, you can simply run:

```bash
sam build && sam deploy
```

## Step 5: Capture Deployment Outputs

After successful deployment, SAM will display outputs. **Save these values**:

```
CloudFormation outputs from deployed stack
---------------------------------------------------------------------------
Outputs
---------------------------------------------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL
Value               https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com

Key                 UserPoolId
Description         Cognito User Pool ID
Value               us-east-1_xxxxxxxxx

Key                 UserPoolClientId
Description         Cognito User Pool Client ID
Value               xxxxxxxxxxxxxxxxxxxxxxxxxx

Key                 BucketName
Description         S3 Bucket Name
Value               taskbreaker-app-bucket-xxxxx
---------------------------------------------------------------------------
```

You can also retrieve these later:

```bash
aws cloudformation describe-stacks --stack-name taskbreaker-stack --query 'Stacks[0].Outputs'
```

## Step 6: Configure Frontend

Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Create environment configuration:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your deployment outputs:

```env
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Step 7: Test the Application

### Test Backend API

Test the health endpoint:
```bash
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/health
```

### Run Frontend Locally

Start the development server:
```bash
npm run dev
```

Open http://localhost:3000 and test:
1. Sign up for a new account
2. Log in
3. Create a task plan
4. View dashboard
5. Update profile

## Step 8: Deploy Frontend (Optional)

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Configure environment variables from Step 6
5. Deploy

### Option B: AWS Amplify

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```
4. Add environment variables
5. Deploy

### Option C: S3 + CloudFront

Build for static export:
```bash
npm run build
```

Upload to S3 and configure CloudFront distribution.

## AWS Resource Overview

Your deployment creates:

### Cognito User Pool
- **Purpose**: User authentication and JWT token management
- **Configuration**: Email-based signup, password policies
- **Cost**: Free tier: 50,000 MAUs

### DynamoDB Tables

1. **TaskBreaker-Users**
   - Primary Key: `userId`
   - Stores user profiles and preferences
   - Billing: On-demand (pay per request)

2. **TaskBreaker-TaskPlans**
   - Primary Key: `userId` (partition), `taskId` (sort)
   - Stores task plans and subtasks
   - Billing: On-demand (pay per request)

### S3 Bucket
- **Purpose**: Store user avatars and exports
- **Name**: `taskbreaker-app-bucket-{unique-id}`
- **CORS**: Configured for frontend access
- **Cost**: Pay for storage and requests

### Lambda Function
- **Name**: `taskbreaker-api`
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Cost**: Free tier: 1M requests/month

### API Gateway
- **Type**: HTTP API
- **Routes**: `/{proxy+}` → Lambda
- **Cost**: Free tier: 1M requests/month

## Monitoring and Logs

### View Lambda Logs

```bash
sam logs -n TaskBreakerFunction --stack-name taskbreaker-stack --tail
```

Or in AWS Console:
1. Go to CloudWatch
2. Navigate to Log Groups
3. Find `/aws/lambda/taskbreaker-api`

### View API Gateway Logs

Enable logging in API Gateway console:
1. Go to API Gateway
2. Select your API
3. Go to Stages → Logging
4. Enable CloudWatch Logs

### Monitor DynamoDB

```bash
aws dynamodb describe-table --table-name TaskBreaker-Users
aws dynamodb describe-table --table-name TaskBreaker-TaskPlans
```

## Cost Estimation

With AWS Free Tier:
- **Cognito**: Free for up to 50,000 MAUs
- **Lambda**: Free for 1M requests/month
- **API Gateway**: Free for 1M requests/month
- **DynamoDB**: Free for 25 GB storage + 25 RCU/WCU
- **S3**: Free for 5 GB storage + 20,000 GET requests

**Estimated monthly cost** (after free tier): $5-20 depending on usage

## Troubleshooting

### Deployment Fails

**Issue**: CloudFormation stack creation fails

**Solutions**:
- Check IAM permissions
- Verify region supports all services
- Check for resource name conflicts
- Review CloudFormation events:
  ```bash
  aws cloudformation describe-stack-events --stack-name taskbreaker-stack
  ```

### API Returns 502 Bad Gateway

**Issue**: Lambda function errors

**Solutions**:
- Check Lambda logs in CloudWatch
- Verify environment variables are set
- Test Lambda function directly:
  ```bash
  sam local invoke TaskBreakerFunction
  ```

### Cognito Authentication Fails

**Issue**: Cannot sign up or log in

**Solutions**:
- Verify User Pool Client ID is correct
- Check User Pool allows USER_PASSWORD_AUTH flow
- Verify email verification settings
- Check Cognito logs in CloudWatch

### DynamoDB Access Denied

**Issue**: Lambda cannot access DynamoDB

**Solutions**:
- Verify Lambda execution role has DynamoDB permissions
- Check table names in environment variables
- Verify tables exist:
  ```bash
  aws dynamodb list-tables
  ```

### S3 Upload Fails

**Issue**: Cannot upload avatars

**Solutions**:
- Verify S3 bucket exists
- Check Lambda has S3 permissions
- Verify CORS configuration on bucket
- Check bucket name in environment variables

### CORS Errors

**Issue**: Frontend cannot call API

**Solutions**:
- Verify API Gateway CORS configuration
- Check frontend API URL is correct
- Ensure HTTPS is used in production
- Add allowed origins in API Gateway

## Updating the Application

### Update Backend Code

1. Make code changes
2. Build and deploy:
   ```bash
   cd backend
   sam build && sam deploy
   ```

### Update Infrastructure

1. Modify `template.yaml`
2. Deploy changes:
   ```bash
   sam build && sam deploy
   ```

### Update Frontend

1. Make code changes
2. Redeploy based on your hosting choice (Vercel/Amplify/etc.)

## Cleanup

To delete all AWS resources:

```bash
sam delete --stack-name taskbreaker-stack
```

This will:
- Delete the CloudFormation stack
- Remove all resources (Lambda, API Gateway, DynamoDB, Cognito)
- **Note**: S3 bucket must be emptied manually first

Empty S3 bucket:
```bash
aws s3 rm s3://your-bucket-name --recursive
```

Then delete the stack:
```bash
sam delete --stack-name taskbreaker-stack
```

## Security Best Practices

1. **Enable MFA** on your AWS account
2. **Use IAM roles** instead of access keys when possible
3. **Enable CloudTrail** for audit logging
4. **Set up billing alerts** to monitor costs
5. **Use AWS Secrets Manager** for sensitive data (future enhancement)
6. **Enable S3 bucket encryption**
7. **Configure API Gateway throttling** to prevent abuse
8. **Review IAM policies** regularly

## Next Steps

1. **Set up CI/CD**: Automate deployments with GitHub Actions or AWS CodePipeline
2. **Add monitoring**: Set up CloudWatch alarms for errors and performance
3. **Enable backups**: Configure DynamoDB point-in-time recovery
4. **Add custom domain**: Configure Route 53 and API Gateway custom domain
5. **Implement caching**: Add CloudFront for API caching
6. **Add real AI**: Replace placeholder AI service with AWS Bedrock integration

## Support

For issues:
- Check CloudWatch Logs
- Review CloudFormation events
- Consult AWS documentation
- Check the project README files

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
