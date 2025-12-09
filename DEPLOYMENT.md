# TaskBreaker Deployment Guide

Complete guide for deploying the TaskBreaker application to AWS and hosting the frontend.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed
- Node.js 18.x installed
- npm or yarn

## Backend Deployment (AWS SAM)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Build the SAM Application

```bash
sam build
```

### Step 3: Deploy with Guided Setup

For first-time deployment:

```bash
sam deploy --guided
```

You'll be prompted for:
- **Stack Name**: `taskbreaker-stack` (or your preferred name)
- **AWS Region**: `us-east-1` (or your preferred region)
- **Confirm changes before deploy**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Disable rollback**: N
- **Save arguments to configuration file**: Y
- **SAM configuration file**: `samconfig.toml`
- **SAM configuration environment**: `default`

### Step 4: Note the Outputs

After deployment completes, SAM will output:
- **ApiUrl**: Your API Gateway endpoint (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)
- **UserPoolId**: Cognito User Pool ID (e.g., `us-east-1_ABC123`)
- **UserPoolClientId**: Cognito Client ID (e.g., `1234567890abcdef`)

**Save these values** - you'll need them for frontend configuration.

### Step 5: Subsequent Deployments

After initial setup:

```bash
sam build && sam deploy
```

## Frontend Deployment

### Step 1: Configure Environment Variables

Create `.env.local` in the frontend directory:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` with your backend values:

```env
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application.

### Option A: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add Environment Variables (from `.env.local`)
7. Click "Deploy"

### Option B: Deploy to AWS Amplify

1. Push your code to GitHub
2. Go to AWS Amplify Console
3. Click "New app" → "Host web app"
4. Connect your GitHub repository
5. Configure build settings:
   - **App root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
6. Add Environment Variables
7. Click "Save and deploy"

### Option C: Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Add Environment Variables
7. Click "Deploy"

### Option D: Static Export (Any Host)

```bash
cd frontend
npm run build
```

Deploy the `.next` directory to any static hosting service.

## Post-Deployment Configuration

### 1. Update CORS Settings

If you encounter CORS errors, update the backend `src/app.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true,
}));
```

Redeploy backend:

```bash
cd backend
sam build && sam deploy
```

### 2. Configure Cognito (Optional)

For production, you may want to:
- Enable email verification
- Configure custom email templates
- Set up MFA (Multi-Factor Authentication)
- Configure password policies

Go to AWS Console → Cognito → User Pools → taskbreaker-users

### 3. Set Up Custom Domain (Optional)

#### Backend (API Gateway):
1. Go to API Gateway Console
2. Select your API
3. Click "Custom domain names"
4. Create custom domain (e.g., `api.taskbreaker.com`)
5. Configure DNS (Route 53 or your DNS provider)

#### Frontend:
- **Vercel**: Project Settings → Domains
- **Amplify**: App Settings → Domain management
- **Netlify**: Site Settings → Domain management

## Monitoring and Logs

### Backend Logs

View Lambda logs in CloudWatch:

```bash
aws logs tail /aws/lambda/taskbreaker-api --follow
```

Or via AWS Console:
1. Go to CloudWatch
2. Log groups → `/aws/lambda/taskbreaker-api`

### Frontend Logs

- **Vercel**: Deployments → View Function Logs
- **Amplify**: App → Monitoring
- **Netlify**: Deploys → Function logs

## Troubleshooting

### Backend Issues

**Lambda timeout:**
- Increase timeout in `template.yaml` (default: 30s)
- Redeploy: `sam build && sam deploy`

**DynamoDB throttling:**
- Check CloudWatch metrics
- Consider switching to provisioned capacity

**Cognito errors:**
- Verify User Pool configuration
- Check password policy settings
- Ensure auth flows are enabled

### Frontend Issues

**API connection failed:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration
- Ensure backend is deployed

**Authentication errors:**
- Verify Cognito User Pool IDs
- Check that tokens are being stored
- Ensure auth middleware is working

**Build errors:**
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules`: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18.x)

## Updating the Application

### Backend Updates

```bash
cd backend
# Make your changes
sam build
sam deploy
```

### Frontend Updates

```bash
cd frontend
# Make your changes
git push
# Vercel/Amplify/Netlify will auto-deploy
```

## Cost Optimization

### AWS Free Tier Limits

- **Lambda**: 1M requests/month
- **DynamoDB**: 25GB storage + 25 RCU/WCU
- **S3**: 5GB storage + 20K GET requests
- **Cognito**: 50,000 MAUs
- **API Gateway**: 1M requests/month (first 12 months)

### Cost Reduction Tips

1. **Use DynamoDB On-Demand**: Pay only for what you use
2. **Enable S3 Lifecycle Policies**: Archive old files
3. **Set Lambda Memory Appropriately**: Don't over-provision
4. **Use CloudWatch Alarms**: Monitor costs
5. **Delete Unused Resources**: Clean up test stacks

## Security Best Practices

1. **Enable CloudTrail**: Audit API calls
2. **Use IAM Roles**: Least privilege principle
3. **Enable S3 Encryption**: Encrypt data at rest
4. **Use HTTPS Only**: Enforce SSL/TLS
5. **Regular Updates**: Keep dependencies updated
6. **Enable WAF**: Protect against common attacks
7. **Backup Data**: Enable DynamoDB point-in-time recovery

## Backup and Recovery

### DynamoDB Backup

Enable point-in-time recovery in `template.yaml`:

```yaml
PointInTimeRecoverySpecification:
  PointInTimeRecoveryEnabled: true
```

### Manual Backup

```bash
aws dynamodb create-backup \
  --table-name TaskBreaker-Users \
  --backup-name users-backup-$(date +%Y%m%d)
```

## Scaling Considerations

### Backend Scaling

- **Lambda**: Automatically scales (configure reserved concurrency if needed)
- **DynamoDB**: Use on-demand or auto-scaling
- **API Gateway**: Automatically scales (configure throttling limits)

### Frontend Scaling

- **Vercel/Netlify**: Automatic CDN distribution
- **Amplify**: Automatic scaling with CloudFront

## Support and Maintenance

### Regular Tasks

- Monitor CloudWatch metrics weekly
- Review CloudWatch Logs for errors
- Update dependencies monthly
- Review AWS costs monthly
- Test backup/recovery quarterly

### Getting Help

- AWS Support (if you have a support plan)
- AWS Forums
- Stack Overflow
- GitHub Issues (for this project)

## Cleanup (Deleting Everything)

To completely remove the application:

### Delete Backend

```bash
cd backend
sam delete
```

### Delete Frontend

- **Vercel**: Project Settings → Delete Project
- **Amplify**: App Settings → Delete app
- **Netlify**: Site Settings → Delete site

### Manual Cleanup

If SAM delete fails, manually delete:
1. CloudFormation stack
2. S3 bucket (empty it first)
3. DynamoDB tables
4. Cognito User Pool
5. CloudWatch Log groups

---

**Congratulations!** Your TaskBreaker application is now deployed and ready to use! 🎉
