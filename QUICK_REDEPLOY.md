# Quick Redeploy Instructions

The template has been updated to fix the authentication issue. You need to redeploy:

## Redeploy Command

```bash
cd backend
sam build
sam deploy
```

## What Changed

Added `ALLOW_ADMIN_USER_PASSWORD_AUTH` to the Cognito User Pool Client, which is required for the Lambda function to use `adminInitiateAuth` for login.

## After Redeployment

Test signup with a new email:
```bash
curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com","password": "TestPass123!","name": "New User"}'
```

This should work after the redeploy!
