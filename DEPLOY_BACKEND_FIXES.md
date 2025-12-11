# Deploy Backend Fixes - Step by Step

## What's Wrong?

Your backend code is **100% correct** but it's **NOT DEPLOYED** to AWS Lambda yet. That's why:
- Progress slider resets (old backend doesn't save progress)
- Subtask details don't show (old AI doesn't generate them)
- Profile updates fail (old backend has bugs)

## What You Need to Do:

### Step 1: Open Terminal in Backend Folder

```bash
cd backend
```

### Step 2: Build the Backend

```bash
sam build
```

This will:
- Package all your Node.js code
- Include all dependencies
- Prepare for deployment

### Step 3: Deploy to AWS

```bash
sam deploy
```

This will:
- Upload code to AWS Lambda
- Update API Gateway
- Apply all fixes

### Step 4: Wait for Deployment

You'll see output like:
```
Deploying with following values
===============================
Stack name                   : taskbreaker-backend
Region                       : us-east-1
...
Successfully created/updated stack - taskbreaker-backend
```

### Step 5: Test Everything

1. **Test Progress Slider**:
   - Go to any task
   - Drag progress slider
   - Release it
   - Refresh page
   - Progress should be saved!

2. **Test Subtask Details**:
   - Create a NEW task (old tasks won't have details)
   - Each subtask should show bullet points
   - Click "Show Details" to see them

3. **Test Profile Update**:
   - Go to Profile
   - Change your name
   - Click "Save Changes"
   - Should work now!

## Why This Happens:

When you edit code files, the changes are only on your computer. AWS Lambda is still running the OLD code. You must deploy to update AWS.

## Quick Commands (Copy & Paste):

```bash
cd backend
sam build && sam deploy
```

That's it! Wait 2-3 minutes for deployment to complete.

## If You Get Errors:

### Error: "AWS credentials not found"
Run: `aws configure`
Enter your AWS credentials

### Error: "Stack does not exist"
The stack name might be different. Check `backend/samconfig.toml`

### Error: "No changes to deploy"
This means backend is already up to date (unlikely given your issues)

## After Deployment:

All three issues should be fixed:
- ✅ Progress slider saves and persists
- ✅ Subtasks show detailed bullet points
- ✅ Profile updates work correctly

## Need Help?

If deployment fails, share the error message and I'll help you fix it!
