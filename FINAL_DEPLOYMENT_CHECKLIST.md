# Final Deployment Checklist ✅

## Current Situation

✅ **Frontend Code**: Complete and deployed via Amplify
✅ **Backend Code**: Complete but NOT deployed yet
❌ **Backend Deployment**: Required to fix all issues

## Issues That Will Be Fixed After Backend Deployment

1. **Progress slider disappearing after 1 second** ❌ → ✅
2. **"Cannot connect to server" when updating profile** ❌ → ✅
3. **Subtask details not showing** ❌ → ✅ (for new tasks)

## Deployment Steps (Run in WSL/Ubuntu)

```bash
# Step 1: Navigate to backend
cd /mnt/c/Users/Bruger/Documents/TaskBreaker/backend

# Step 2: Build the backend
sam build

# Step 3: Deploy with force upload
sam deploy --force-upload

# Step 4: Wait for success message
# You should see: "Successfully created/updated stack - taskbreaker-backend in us-east-1"
```

## If You Get "No changes to deploy" Error

```bash
# Clear SAM cache
rm -rf .aws-sam

# Rebuild and deploy
sam build
sam deploy --force-upload
```

## After Deployment - Testing Checklist

### Test 1: Progress Slider
- [ ] Go to any task
- [ ] Move a progress slider to 50%
- [ ] Wait 2 seconds (should see "✓ Saved")
- [ ] Refresh the page
- [ ] Progress should still be at 50% ✅

### Test 2: Profile Update
- [ ] Go to Profile page
- [ ] Change your name to something new
- [ ] Click "Save Changes"
- [ ] Should see "Profile updated successfully!" ✅
- [ ] Refresh the page
- [ ] Name should still be the new name ✅

### Test 3: Subtask Details (New Tasks Only)
- [ ] Create a NEW task (e.g., "Learn Python")
- [ ] Open the task details page
- [ ] Each subtask should show "Show Details (X)" button
- [ ] Click to expand
- [ ] Should see 2-4 bullet points ✅

## What's Already Working

These features are already working because frontend is deployed:

✅ Orange/Blue theme
✅ Dashboard redesign
✅ Task creation with date picker
✅ Tasks dropdown in navbar
✅ User menu dropdown
✅ Profile page (without work days)
✅ Progress slider UI (just needs backend to save)

## What Needs Backend Deployment

These features need backend deployment to work:

❌ Progress slider persistence
❌ Profile updates
❌ Subtask details generation (for new tasks)

## Technical Details

**Backend Stack**: `taskbreaker-backend`
**Region**: `us-east-1`
**API URL**: `https://uh2xru6s82.execute-api.us-east-1.amazonaws.com`
**Lambda Function**: `taskbreaker-api`

**Modified Files**:
- `backend/src/services/aiService.js` - Generates details for subtasks
- `backend/src/routes/tasks.js` - Handles progress updates
- `backend/FORCE_DEPLOY.txt` - Updated to force deployment

**Frontend Files** (already deployed):
- `frontend/src/app/tasks/[taskId]/page.jsx` - Progress slider + details display
- `frontend/src/app/profile/page.jsx` - Profile updates

## Expected Deployment Time

- Build: ~30 seconds
- Deploy: ~2-3 minutes
- Total: ~3-4 minutes

## Success Indicators

After running `sam deploy --force-upload`, you should see:

```
CloudFormation stack changeset
---------------------------------
Operation                LogicalResourceId        ResourceType
---------------------------------
* Modify                 TaskBreakerFunction      AWS::Lambda::Function
---------------------------------

Changeset created successfully.

Deploy this changeset? [y/N]: y

...

Successfully created/updated stack - taskbreaker-backend in us-east-1
```

## If Deployment Fails

Common issues and solutions:

1. **"sam: command not found"**
   - Make sure you're in WSL/Ubuntu, not PowerShell
   - Install SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

2. **"No changes to deploy"**
   - Run: `rm -rf .aws-sam`
   - Then: `sam build && sam deploy --force-upload`

3. **"Access Denied"**
   - Check AWS credentials: `aws configure list`
   - Make sure you're using the correct AWS profile

## After Successful Deployment

1. Test all three features (checklist above)
2. If everything works, you're done! 🎉
3. If something doesn't work, check the Lambda logs:
   ```bash
   sam logs -n TaskBreakerFunction --stack-name taskbreaker-backend --tail
   ```

## Summary

**What you need to do**: Run 3 commands in WSL
**How long it takes**: 3-4 minutes
**What it fixes**: All 3 remaining issues
**Risk level**: Low (can always rollback if needed)

Ready to deploy? Open WSL and run the commands! 🚀
