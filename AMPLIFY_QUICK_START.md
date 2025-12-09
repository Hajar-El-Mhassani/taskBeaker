# AWS Amplify Deployment - Quick Start

## 🚀 Deploy in 10 Minutes

### Step 1: Deploy Backend (5 min)

```bash
cd backend
sam build
sam deploy --guided
```

**Save these outputs:**
- ApiUrl
- UserPoolId  
- UserPoolClientId

---

### Step 2: Push to Git (2 min)

```bash
git add .
git commit -m "Ready for Amplify"
git push origin main
```

---

### Step 3: Deploy to Amplify (3 min)

1. **Go to:** https://console.aws.amazon.com/amplify/
2. **Click:** "New app" → "Host web app"
3. **Connect:** Your GitHub repository
4. **Select:** Repository and branch (main)
5. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=<your-api-url>
   NEXT_PUBLIC_USER_POOL_ID=<your-pool-id>
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-client-id>
   NEXT_PUBLIC_AWS_REGION=us-east-1
   ```
6. **Click:** "Save and deploy"

---

### Step 4: Test Your App

Wait 5-10 minutes for deployment, then:

1. Open your Amplify URL: `https://main.d123.amplifyapp.com`
2. Sign up for an account
3. Create a task plan
4. Done! 🎉

---

## Files Already Created for You

✅ `amplify.yml` - Build configuration (in project root)
✅ `jsconfig.json` - Import path resolution (in frontend/)
✅ `.gitignore` - Excludes .env files

---

## Environment Variables You Need

Get these from your `sam deploy` output:

| Variable | Example Value |
|----------|---------------|
| `NEXT_PUBLIC_API_URL` | `https://abc123.execute-api.us-east-1.amazonaws.com` |
| `NEXT_PUBLIC_USER_POOL_ID` | `us-east-1_ABC123XYZ` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | `1a2b3c4d5e6f7g8h9i0j` |
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` |

**How to get them:**
```bash
aws cloudformation describe-stacks \
  --stack-name taskbreaker-stack \
  --query 'Stacks[0].Outputs'
```

---

## Troubleshooting

### Build fails?
- Check environment variables are set
- Verify `amplify.yml` is in project root
- Check build logs in Amplify Console

### Can't connect to API?
- Verify `NEXT_PUBLIC_API_URL` is correct
- Test backend: `curl <your-api-url>/health`
- Check CORS is enabled on API Gateway

### Module not found errors?
- Ensure `jsconfig.json` exists in `frontend/`
- Restart dev server after adding it

---

## What Happens During Deployment

1. ✅ Amplify clones your Git repository
2. ✅ Runs `npm install` in frontend directory
3. ✅ Runs `npm run build` to build Next.js
4. ✅ Deploys to CloudFront CDN
5. ✅ Provides HTTPS URL automatically

---

## After Deployment

Your app is live at: `https://main.d123.amplifyapp.com`

**Automatic deployments enabled!**
- Push to Git → Amplify auto-deploys
- No manual steps needed

---

## Need More Details?

See `AMPLIFY_DEPLOYMENT_GUIDE.md` for:
- Custom domain setup
- Branch deployments
- Monitoring and logs
- Advanced configuration

---

**Ready to deploy? Follow the 4 steps above!** 🚀
