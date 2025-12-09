# Deploy Frontend to AWS

## Option 1: AWS Amplify (Recommended)

Deploy your Next.js frontend to AWS Amplify for a fully cloud-hosted solution.

### Prerequisites
- Backend already deployed to AWS
- GitHub/GitLab/Bitbucket repository (or zip file)
- AWS account

### Step-by-Step Deployment

#### 1. Push Code to Git Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/taskbreaker.git
git push -u origin main
```

#### 2. Create Amplify App

**Via AWS Console:**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Authorize AWS Amplify to access your repository
5. Select your repository and branch (main)

#### 3. Configure Build Settings

Amplify will auto-detect Next.js. Verify the build settings:

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

#### 4. Add Environment Variables

In Amplify Console, go to "Environment variables" and add:

| Key | Value | Example |
|-----|-------|---------|
| `NEXT_PUBLIC_API_URL` | Your API Gateway URL | `https://abc123.execute-api.us-east-1.amazonaws.com` |
| `NEXT_PUBLIC_USER_POOL_ID` | Your Cognito User Pool ID | `us-east-1_ABC123XYZ` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Your Cognito Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `NEXT_PUBLIC_AWS_REGION` | Your AWS region | `us-east-1` |

**Get these values:**
```bash
aws cloudformation describe-stacks \
  --stack-name taskbreaker-stack \
  --query 'Stacks[0].Outputs'
```

#### 5. Deploy

Click "Save and deploy"

Amplify will:
- Clone your repository
- Install dependencies
- Build your Next.js app
- Deploy to CloudFront CDN
- Provide a URL like: `https://main.d1234567890.amplifyapp.com`

#### 6. Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain (e.g., `taskbreaker.com`)
4. Amplify will configure SSL certificate automatically
5. Update your DNS records as instructed

### Automatic Deployments

Every time you push to your Git repository, Amplify automatically:
- Pulls the latest code
- Runs tests
- Builds the app
- Deploys to production

### Cost Estimate

**AWS Amplify Pricing:**
- Build time: $0.01 per build minute
- Hosting: $0.15 per GB served
- Free tier: 1,000 build minutes/month, 15 GB served/month

**Typical monthly cost:** $0-5 for small apps

---

## Option 2: AWS S3 + CloudFront

Deploy as a static site with S3 and CloudFront CDN.

### Prerequisites
- Backend deployed to AWS
- AWS CLI configured

### Step-by-Step Deployment

#### 1. Build the Frontend

```bash
cd frontend
npm run build
```

#### 2. Create S3 Bucket

```bash
aws s3 mb s3://taskbreaker-frontend --region us-east-1
```

#### 3. Configure Bucket for Static Hosting

```bash
aws s3 website s3://taskbreaker-frontend \
  --index-document index.html \
  --error-document index.html
```

#### 4. Set Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::taskbreaker-frontend/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket taskbreaker-frontend \
  --policy file://bucket-policy.json
```

#### 5. Upload Build Files

```bash
aws s3 sync .next/static s3://taskbreaker-frontend/_next/static
aws s3 sync .next/server s3://taskbreaker-frontend/_next/server
aws s3 cp .next/BUILD_ID s3://taskbreaker-frontend/_next/
```

#### 6. Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name taskbreaker-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

#### 7. Get CloudFront URL

```bash
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].DomainName'
```

Your app will be available at: `https://d1234567890.cloudfront.net`

### Cost Estimate

**S3 + CloudFront Pricing:**
- S3 storage: $0.023 per GB/month
- CloudFront: $0.085 per GB transferred
- Free tier: 50 GB transfer/month

**Typical monthly cost:** $1-10

---

## Option 3: Vercel (Easiest, Non-AWS)

Deploy to Vercel (made by Next.js creators) - simplest option but not on AWS.

### Step-by-Step Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
cd frontend
vercel
```

Follow the prompts:
- Link to existing project? No
- Project name? taskbreaker-frontend
- Directory? ./
- Override settings? No

#### 3. Add Environment Variables

```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_USER_POOL_ID
vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID
vercel env add NEXT_PUBLIC_AWS_REGION
```

Or via Vercel Dashboard:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all 4 variables

#### 4. Deploy to Production

```bash
vercel --prod
```

Your app will be available at: `https://taskbreaker-frontend.vercel.app`

### Cost Estimate

**Vercel Pricing:**
- Hobby (Free): 100 GB bandwidth/month
- Pro ($20/month): 1 TB bandwidth/month

**Typical monthly cost:** $0 (free tier sufficient for most apps)

---

## Comparison

| Feature | AWS Amplify | S3 + CloudFront | Vercel |
|---------|-------------|-----------------|--------|
| **Hosting** | AWS | AWS | Vercel Cloud |
| **Setup Difficulty** | Easy | Medium | Easiest |
| **Auto Deploy** | ✅ Yes | ❌ Manual | ✅ Yes |
| **Custom Domain** | ✅ Free SSL | ✅ Free SSL | ✅ Free SSL |
| **Cost (small app)** | $0-5/month | $1-10/month | $0/month |
| **AWS Integration** | ✅ Native | ✅ Native | ⚠️ External |
| **CI/CD** | ✅ Built-in | ❌ Manual | ✅ Built-in |
| **Best For** | AWS-only stack | Full control | Fastest deploy |

---

## Recommendation

### For Your Use Case:

**If you want everything in AWS:** Use **AWS Amplify**
- Easiest AWS deployment
- Automatic deployments
- Native AWS integration
- Good free tier

**If you want simplest deployment:** Use **Vercel**
- Fastest to deploy
- Best Next.js support
- Free for small apps
- Backend still on AWS

**If you need full control:** Use **S3 + CloudFront**
- Most customizable
- Lowest cost at scale
- Requires more setup

---

## Quick Start: Deploy to AWS Amplify

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to AWS Amplify Console
# https://console.aws.amazon.com/amplify/

# 3. Click "New app" → "Host web app"

# 4. Connect GitHub repository

# 5. Add environment variables:
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
NEXT_PUBLIC_USER_POOL_ID=<your-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_AWS_REGION=us-east-1

# 6. Click "Save and deploy"

# Done! Your app is live on AWS.
```

---

## Architecture After Frontend Deployment

### Current (Local Frontend):
```
Browser → http://localhost:3000 → AWS API Gateway → Lambda
```

### After AWS Amplify Deployment:
```
Browser → CloudFront CDN → S3 (Amplify) → AWS API Gateway → Lambda
         (All in AWS!)
```

### After Vercel Deployment:
```
Browser → Vercel CDN → AWS API Gateway → Lambda
         (Hybrid: Frontend on Vercel, Backend on AWS)
```

---

## Need Help?

- **AWS Amplify Docs**: https://docs.aws.amazon.com/amplify/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs

Choose the option that best fits your needs!
