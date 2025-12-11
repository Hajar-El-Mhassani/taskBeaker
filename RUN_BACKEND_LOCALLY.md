# How to Run Backend Locally

## Prerequisites
- Node.js installed
- AWS credentials configured
- AWS SAM CLI installed (optional, for Lambda simulation)

## Option A: Run as Express Server (Easiest)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the `backend` folder:

```env
# AWS Configuration
AWS_REGION=us-east-1
USER_POOL_ID=us-east-1_ULBpGRvTE
USER_POOL_CLIENT_ID=4u9p0fudtnogjb0d5akk7l3stc
USERS_TABLE_NAME=TaskBreaker-Users
TASK_PLANS_TABLE_NAME=TaskBreaker-TaskPlans
S3_BUCKET_NAME=taskbreaker-app-bucket-978489151322

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Local server
PORT=3001
```

### 3. Create Local Server File
Create `backend/server.js`:

```javascript
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
```

### 4. Update package.json
Add to `backend/package.json` scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

### 5. Run the Server
```bash
cd backend
npm start
```

Server will run at: `http://localhost:3001`

### 6. Update Frontend to Use Local Backend
In `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Then restart frontend:
```bash
cd frontend
npm run dev
```

## Option B: Run with SAM Local (Lambda Simulation)

### 1. Install AWS SAM CLI
Follow: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

### 2. Start Local API
```bash
cd backend
sam local start-api --port 3001
```

### 3. Update Frontend
Same as Option A step 6.

## 🔄 Switching Between Local and AWS

### Use AWS Backend (Production)
`frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://uh2xru6s82.execute-api.us-east-1.amazonaws.com
```

### Use Local Backend (Development)
`frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important**: Restart frontend after changing `.env.local`!

## 🧪 Testing

### Test Local Backend
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test signup
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test"}'
```

### Run Tests
```bash
cd backend
npm test
```

## 📝 Notes

- **Local backend still uses AWS services** (Cognito, DynamoDB, S3, Bedrock)
- You need AWS credentials configured
- Local backend is for development/testing only
- Production should always use AWS Lambda (already deployed)

## 🚀 Current Setup (No Changes Needed)

Your app is currently using:
- ✅ Backend: AWS Lambda (serverless, always running)
- ✅ Frontend: Amplify (or local dev server)
- ✅ Database: DynamoDB
- ✅ Storage: S3
- ✅ Auth: Cognito
- ✅ AI: Bedrock

**Everything is already working!** You only need to run backend locally if you're developing new features.

