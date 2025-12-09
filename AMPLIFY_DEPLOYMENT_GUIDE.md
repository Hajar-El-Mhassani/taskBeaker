# Deploy Frontend to AWS Amplify - Complete Guide

## Overview

This guide will help you deploy your TaskBreaker frontend to AWS Amplify Hosting, giving you a fully AWS-hosted application.

**What you'll get:**
- Frontend hosted on AWS CloudFront CDN
- Automatic HTTPS with SSL certificate
- Continuous deployment from Git
- Custom domain support (optional)
- Everything in AWS!

---

## Prerequisites

Before you start:

- ✅ Backend deployed to AWS (completed `sam deploy`)
- ✅ Backend outputs saved (API URL, Cognito IDs)
- ✅ Git repository (GitHub, GitLab, Bitbucket, or AWS CodeCommit)
- ✅ AWS account with Amplify access

---

## Step 1: Prepare Your Code for Amplify

### 1.1 Create Amplify Build Configuration

Create `amplify.yml` in the **root** of your project:

```bash
# From project root
touch amplify.yml
```

Add this content:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
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

### 1.2 Verify Your Project Structure

Your project should look like this:

```
taskbreaker/
├── amplify.yml          ← NEW FILE (you just created)
├── backend/
│   ├── src/
│   ├── template.yaml
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── jsconfig.json
├── .gitignore
└── README.md
```

### 1.3 Push to Git Repository

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Amplify deployment"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/taskbreaker.git

# Push to main branch
git push -u origin main
```

---

## Step 2: Deploy Backend First

**Important:** Deploy your backend before setting up Amplify!

```bash
cd backend
sam build
sam deploy --guided
```

**Save these outputs** (you'll need them for Amplify):

```
ApiUrl: https://abc123xyz.execute-api.us-east-1.amazonaws.com
UserPoolId: us-east-1_ABC123XYZ
UserPoolClientId: 1a2b3c4d5e6f7g8h9i0j
```

---

## Step 3: Create Amplify App

### Option A: Using AWS Console (Recommended)

#### 3.1 Open AWS Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**

#### 3.2 Connect Your Repository

1. **Choose your Git provider:**
   - GitHub
   - GitLab
   - Bitbucket
   - AWS CodeCommit

2. **Authorize AWS Amplify:**
   - Click "Connect to GitHub" (or your provider)
   - Sign in and authorize AWS Amplify
   - Grant access to your repository

3. **Select repository and branch:**
   - Repository: `yourusername/taskbreaker`
   - Branch: `main`
   - Click **"Next"**

#### 3.3 Configure Build Settings

Amplify should auto-detect your `amplify.yml` file.

**Verify the settings:**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
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

**App name:** `taskbreaker-frontend` (or your choice)

Click **"Next"**

#### 3.4 Add Environment Variables

**CRITICAL STEP:** Add these environment variables:

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `NEXT_PUBLIC_API_URL` | `https://abc123xyz.execute-api.us-east-1.amazonaws.com` | From `sam deploy` output |
| `NEXT_PUBLIC_USER_POOL_ID` | `us-east-1_ABC123XYZ` | From `sam deploy` output |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | `1a2b3c4d5e6f7g8h9i0j` | From `sam deploy` output |
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` | Your AWS region |

**How to add:**
1. Scroll down to "Environment variables"
2. Click "Add environment variable"
3. Add each variable one by one
4. Click **"Next"**

#### 3.5 Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**

Amplify will now:
- ✅ Clone your repository
- ✅ Install dependencies
- ✅ Build your Next.js app
- ✅ Deploy to CloudFront CDN
- ✅ Provide a live URL

**Deployment takes 5-10 minutes.**

---

### Option B: Using AWS CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
cd /path/to/taskbreaker
amplify init

# Add hosting
amplify add hosting

# Choose: Hosting with Amplify Console
# Choose: Continuous deployment

# Publish
amplify publish
```

---

## Step 4: Get Your Amplify URL

After deployment completes:

1. Go to AWS Amplify Console
2. Click on your app
3. You'll see your URL: `https://main.d1234567890.amplifyapp.com`

**Test your app:**
- Open the URL in your browser
- Try signing up
- Try logging in
- Create a task plan

---

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Add Domain in Amplify

1. In Amplify Console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain: `taskbreaker.com`
4. Click **"Configure domain"**

### 5.2 Configure DNS

Amplify will provide DNS records. Add them to your domain provider:

**Example for Route 53:**
```
Type: CNAME
Name: www
Value: d1234567890.cloudfront.net
```

**Example for other providers:**
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Add the CNAME records provided by Amplify
- Wait for DNS propagation (5-30 minutes)

### 5.3 SSL Certificate

Amplify automatically:
- ✅ Requests SSL certificate from AWS Certificate Manager
- ✅ Validates domain ownership
- ✅ Configures HTTPS

**Your app will be available at:**
- `https://taskbreaker.com`
- `https://www.taskbreaker.com`

---

## Step 6: Enable Automatic Deployments

Amplify automatically deploys when you push to your Git repository!

**Test it:**

```bash
# Make a change
echo "# Updated" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deploy"
git push

# Watch deployment in Amplify Console
```

Amplify will:
1. Detect the push
2. Start a new build
3. Run tests (if configured)
4. Deploy automatically
5. Notify you when complete

---

## Step 7: Configure Build Settings (Advanced)

### 7.1 Add Build Notifications

1. In Amplify Console, go to **"Notifications"**
2. Click **"Add notification"**
3. Choose: Email or SNS topic
4. Get notified on build success/failure

### 7.2 Add Branch Deployments

Deploy multiple branches (dev, staging, prod):

1. In Amplify Console, go to **"App settings"** → **"General"**
2. Click **"Connect branch"**
3. Select branch: `develop`
4. Each branch gets its own URL:
   - `main`: `https://main.d123.amplifyapp.com`
   - `develop`: `https://develop.d123.amplifyapp.com`

### 7.3 Add Password Protection

Protect your app with basic auth:

1. Go to **"Access control"**
2. Click **"Manage access"**
3. Enable access control
4. Set username and password
5. Save

---

## Troubleshooting

### Issue: Build Fails

**Check build logs:**
1. Go to Amplify Console
2. Click on failed build
3. Expand "Build" phase
4. Look for error messages

**Common fixes:**
```bash
# Clear cache and rebuild
# In Amplify Console: Redeploy → Clear cache

# Check Node version
# Add to amplify.yml:
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 18
        - nvm use 18
        - cd frontend
        - npm ci
```

### Issue: Environment Variables Not Working

**Verify variables:**
1. Go to **"Environment variables"**
2. Check all 4 variables are set
3. Ensure names start with `NEXT_PUBLIC_`
4. Redeploy after adding variables

### Issue: API Calls Failing

**Check CORS:**
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Ensure API Gateway has CORS enabled
3. Check backend is deployed and accessible

**Test API:**
```bash
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/health
```

### Issue: "Module not found" Errors

**Ensure `jsconfig.json` exists:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Slow Build Times

**Optimize build:**
1. Enable caching (already in `amplify.yml`)
2. Use `npm ci` instead of `npm install`
3. Remove unused dependencies

---

## Architecture After Deployment

```
┌─────────────────────────────────────────────────────┐
│                    User's Browser                    │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│              CloudFront CDN (Amplify)                │
│         https://main.d123.amplifyapp.com             │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  S3 Bucket (Amplify)                 │
│              (Next.js Static Files)                  │
└─────────────────────────────────────────────────────┘

                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway (SAM)                   │
│    https://abc123.execute-api.us-east-1.amazonaws.com│
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Lambda Function (SAM)                   │
│                  (Backend API)                       │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Cognito │    │DynamoDB │    │   S3    │
   └─────────┘    └─────────┘    └─────────┘

   ALL IN AWS! ✅
```

---

## Cost Estimate

**AWS Amplify Pricing:**

| Resource | Free Tier | Cost After Free Tier |
|----------|-----------|---------------------|
| Build minutes | 1,000 min/month | $0.01/min |
| Hosting (data transfer) | 15 GB/month | $0.15/GB |
| Storage | 5 GB | $0.023/GB |

**Typical monthly cost for small app:** $0-5

**Example usage:**
- 10 builds/month × 5 min = 50 build minutes = **$0.50**
- 10 GB data transfer = **$0** (within free tier)
- **Total: ~$0.50/month**

---

## Monitoring and Logs

### View Build Logs

1. Go to Amplify Console
2. Click on your app
3. Click on a build
4. View logs for each phase

### View Access Logs

1. Go to **"Monitoring"**
2. View:
   - Requests
   - Data transfer
   - Errors
   - Performance metrics

### Set Up Alarms

1. Go to **"Monitoring"** → **"Alarms"**
2. Create alarm for:
   - Build failures
   - High error rate
   - High data transfer

---

## Quick Reference Commands

```bash
# Get Amplify app info
aws amplify list-apps

# Get app details
aws amplify get-app --app-id d1234567890

# Trigger manual deployment
aws amplify start-job \
  --app-id d1234567890 \
  --branch-name main \
  --job-type RELEASE

# View environment variables
aws amplify get-branch \
  --app-id d1234567890 \
  --branch-name main \
  --query 'branch.environmentVariables'
```

---

## Next Steps

After deployment:

1. ✅ Test your live app
2. ✅ Set up custom domain (optional)
3. ✅ Configure branch deployments (optional)
4. ✅ Set up monitoring and alarms
5. ✅ Share your app URL!

---

## Support Resources

- **AWS Amplify Docs**: https://docs.aws.amazon.com/amplify/
- **Next.js on Amplify**: https://docs.amplify.aws/guides/hosting/nextjs
- **Amplify Console**: https://console.aws.amazon.com/amplify/

---

## Summary Checklist

- [ ] Backend deployed with SAM
- [ ] Backend outputs saved
- [ ] Code pushed to Git repository
- [ ] `amplify.yml` created in project root
- [ ] Amplify app created
- [ ] Repository connected
- [ ] Environment variables added (all 4)
- [ ] First deployment successful
- [ ] App tested and working
- [ ] Custom domain configured (optional)
- [ ] Automatic deployments working

**Congratulations! Your app is now fully hosted on AWS!** 🎉
