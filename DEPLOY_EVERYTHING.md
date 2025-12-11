# Deploy Everything - Simple Steps

## Step 1: Push Frontend Changes to GitHub

```bash
git add .
git commit -m "Fix progress slider, remove work days, improve errors"
git push origin main
```

**Result**: Amplify will auto-rebuild frontend in 2-3 minutes

## Step 2: Force Deploy Backend

```bash
cd backend
rm -rf .aws-sam
sam build
sam deploy --force-upload
```

**Result**: Backend will deploy with all fixes

## That's It!

After both deploy:
- ✅ Progress slider will persist
- ✅ Profile updates will work
- ✅ Work days field removed
- ✅ Better error messages

## Check Deployment Status:

**Frontend (Amplify)**:
- Go to: https://console.aws.amazon.com/amplify
- Check build status
- Should complete in 2-3 minutes

**Backend (Lambda)**:
- Go to: https://console.aws.amazon.com/lambda
- Find: taskbreaker-backend-*
- Check "Last modified" timestamp
- Should be within last few minutes

## Test After Deployment:

1. **Progress Slider**: Go to task → drag slider → should stay
2. **Profile Update**: Change name → should save
3. **Work Days**: Should be gone from profile page

Done! 🎉
