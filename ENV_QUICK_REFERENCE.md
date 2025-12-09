# Environment Variables - Quick Reference

## TL;DR

### Backend: ❌ NO `.env` FILE NEEDED
All environment variables are in `template.yaml` and automatically set by AWS Lambda.

### Frontend: ✅ YES, YOU NEED `.env.local`
You must create this file with your AWS deployment values.

---

## Backend (No Action Required)

**File**: `backend/template.yaml`

```yaml
Environment:
  Variables:
    USERS_TABLE: !Ref UsersTable              # Auto-set by SAM
    TASKS_TABLE: !Ref TaskPlansTable          # Auto-set by SAM
    S3_BUCKET: !Ref TaskBreakerBucket         # Auto-set by SAM
    USER_POOL_ID: !Ref TaskBreakerUserPool    # Auto-set by SAM
    USER_POOL_CLIENT_ID: !Ref TaskBreakerUserPoolClient  # Auto-set by SAM
    AWS_REGION_CUSTOM: !Ref AWS::Region       # Auto-set by SAM
```

✅ **Just deploy**: `sam deploy --guided`

---

## Frontend (Action Required)

### Step 1: Deploy Backend First

```bash
cd backend
sam deploy --guided
```

### Step 2: Copy Outputs

Save these values from deployment output:
- `ApiUrl`
- `UserPoolId`
- `UserPoolClientId`

### Step 3: Create `.env.local`

```bash
cd frontend
cp .env.local.example .env.local
```

### Step 4: Edit `.env.local`

```env
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Step 5: Run Frontend

```bash
npm install
npm run dev
```

---

## File Structure

```
taskbreaker/
├── backend/
│   ├── template.yaml          ← All backend env vars here
│   └── (no .env needed!)
│
└── frontend/
    ├── .env.local.example     ← Template
    └── .env.local            ← YOU CREATE THIS (git-ignored)
```

---

## Common Questions

### Q: Do I need a `.env` file in the backend?
**A:** No! `template.yaml` handles everything.

### Q: Where do backend environment variables come from?
**A:** AWS SAM automatically creates and injects them from `template.yaml` during deployment.

### Q: Do I need to set AWS credentials in `.env`?
**A:** No! Use `aws configure` for AWS CLI credentials. Lambda uses IAM roles.

### Q: What if I want to test backend locally?
**A:** Use `sam local start-api` - it reads from `template.yaml` automatically.

### Q: Why does frontend need `.env.local`?
**A:** Next.js needs to know your API URL and Cognito IDs to connect to AWS services.

### Q: Can I commit `.env.local`?
**A:** No! It's in `.gitignore`. Only commit `.env.local.example`.

---

## Quick Test

### Backend
```bash
cd backend
sam build && sam deploy
# No .env needed!
```

### Frontend
```bash
cd frontend
# 1. Create .env.local with your AWS values
# 2. Then:
npm install
npm run dev
```

---

## Need More Help?

- **Quick Start**: See `QUICK_START.md`
- **Detailed Guide**: See `ENVIRONMENT_SETUP.md`
- **AWS Setup**: See `AWS_SETUP_GUIDE.md`
