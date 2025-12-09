# TaskBreaker Quick Start Guide

## 🚀 Deploy to AWS in 5 Minutes

### Prerequisites Check
```bash
# Check AWS CLI
aws --version

# Check SAM CLI
sam --version

# Check Node.js (should be 18.x)
node --version
```

### 1. Configure AWS
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region (e.g., us-east-1)
# Enter output format: json
```

### 2. Deploy Backend
```bash
cd backend
npm install
sam build
sam deploy --guided
```

**During guided deployment, accept defaults or customize:**
- Stack Name: `taskbreaker-stack`
- AWS Region: `us-east-1` (or your preferred region)
- Confirm changes: `Y`
- Allow IAM role creation: `Y`
- Save configuration: `Y`

**⚠️ IMPORTANT: Save the outputs!**
```
ApiUrl: https://xxxxx.execute-api.us-east-1.amazonaws.com
UserPoolId: us-east-1_xxxxx
UserPoolClientId: xxxxxxxxxxxxx
```

### 3. Configure Frontend
```bash
cd ../frontend
npm install
cp .env.local.example .env.local
```

**Edit `.env.local`** with your deployment outputs:
```env
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

💡 **Need help?** See `ENVIRONMENT_SETUP.md` for detailed configuration guide.

### 4. Run Frontend
```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 📋 Common Commands

### Backend

```bash
# Build and deploy
cd backend
sam build && sam deploy

# View logs
sam logs -n TaskBreakerFunction --tail

# Delete stack
sam delete --stack-name taskbreaker-stack
```

### Frontend

```bash
# Development
cd frontend
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

### AWS CLI

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name taskbreaker-stack \
  --query 'Stacks[0].Outputs'

# List DynamoDB tables
aws dynamodb list-tables

# View Cognito User Pool
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_xxxxx

# List S3 buckets
aws s3 ls
```

---

## 🔧 Troubleshooting

### Backend Issues

**502 Bad Gateway**
```bash
# Check Lambda logs
sam logs -n TaskBreakerFunction --tail

# Test locally
sam local start-api
```

**DynamoDB Access Denied**
```bash
# Verify tables exist
aws dynamodb list-tables

# Check table details
aws dynamodb describe-table --table-name TaskBreaker-Users
```

### Frontend Issues

**API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is deployed: `curl $API_URL/health`
- Verify CORS is configured

**Authentication Failed**
- Verify Cognito IDs in `.env.local`
- Check User Pool allows password auth
- Clear browser cache and try again

---

## 📊 Verify Deployment

### Test Backend API
```bash
# Replace with your API URL
API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com"

# Test signup
curl -X POST $API_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Frontend
1. Open http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. Create a task plan
5. View dashboard

---

## 💰 Cost Estimate

**Free Tier (First 12 months):**
- Cognito: 50,000 MAUs free
- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free
- DynamoDB: 25 GB + 25 RCU/WCU free
- S3: 5 GB storage free

**After Free Tier:** ~$5-20/month for moderate usage

---

## 🧹 Cleanup

```bash
# Empty S3 bucket first
aws s3 rm s3://taskbreaker-app-bucket-xxxxx --recursive

# Delete stack
cd backend
sam delete --stack-name taskbreaker-stack
```

---

## 📚 Next Steps

1. ✅ Deploy backend to AWS
2. ✅ Configure and run frontend
3. ✅ Test the application
4. 🔄 Deploy frontend to Vercel/Amplify
5. 🔄 Set up custom domain
6. 🔄 Add monitoring and alerts
7. 🔄 Integrate real AI (AWS Bedrock)

---

## 🆘 Need Help?

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **Full AWS Guide**: `AWS_SETUP_GUIDE.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Main README**: `README.md`

---

## 🎯 Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────┐
│   Lambda    │─────▶│ Cognito  │
│  (Express)  │      └──────────┘
└──────┬──────┘
       │
       ├─────────────▶┌──────────┐
       │              │ DynamoDB │
       │              └──────────┘
       │
       └─────────────▶┌──────────┐
                      │    S3    │
                      └──────────┘
```

---

**Happy Building! 🚀**
