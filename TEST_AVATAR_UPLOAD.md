# Avatar Upload Troubleshooting

## Error: "Failed to upload avatar: Failed to upload avatar"

This error means the backend is receiving the request but failing to upload to S3.

## Possible Causes:

### 1. S3 Bucket Permissions
The Lambda function might not have permission to write to S3.

**Check**: `backend/template.yaml` - Lambda IAM permissions

### 2. S3 Bucket Policy
The bucket might not allow public-read ACL.

### 3. Token Issue
The `idToken` might not be working correctly.

## Quick Fix Steps:

### Step 1: Check Browser Console
Open browser console (F12) and look for the exact error when uploading.

### Step 2: Check CloudWatch Logs
1. Go to [AWS CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Click "Log groups"
3. Find `/aws/lambda/taskbreaker-backend-TaskBreakerFunction-*`
4. Look for recent errors

### Step 3: Test with cURL
```bash
# First, login to get tokens
curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"YourPassword123!"}'

# Copy the idToken from response

# Test avatar upload
curl -X POST https://uh2xru6s82.execute-api.us-east-1.amazonaws.com/auth/avatar \
  -H "Authorization: Bearer YOUR_ID_TOKEN_HERE" \
  -F "avatar=@path/to/image.jpg"
```

## Most Likely Issue: S3 Bucket ACL

AWS recently changed S3 defaults. The bucket might not allow `public-read` ACL.

### Fix S3 Bucket Settings:

1. Go to [S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Find bucket: `taskbreaker-app-bucket-978489151322`
3. Click "Permissions" tab
4. Scroll to "Block public access"
5. Click "Edit"
6. **Uncheck** "Block all public access"
7. Save changes
8. Scroll to "Object Ownership"
9. Click "Edit"
10. Select "ACLs enabled"
11. Select "Bucket owner preferred"
12. Save changes

### Alternative: Remove ACL from Code

If you don't want public ACLs, update the S3 service:

**File**: `backend/src/services/s3Service.js`

Change:
```javascript
const params = {
  Bucket: S3_BUCKET,
  Key: key,
  Body: fileBuffer,
  ContentType: mimeType,
  ACL: 'public-read',  // ← Remove this line
};
```

To:
```javascript
const params = {
  Bucket: S3_BUCKET,
  Key: key,
  Body: fileBuffer,
  ContentType: mimeType,
  // ACL removed - bucket will use default permissions
};
```

Then make bucket public via bucket policy instead:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::taskbreaker-app-bucket-978489151322/avatars/*"
    }
  ]
}
```

## Quick Test

After fixing S3 permissions, try uploading a small image (< 1MB) in your profile page.

## If Still Not Working

Check these:

1. **Lambda has S3 permissions** in `template.yaml`:
```yaml
Policies:
  - S3CrudPolicy:
      BucketName: !Ref S3Bucket
```

2. **Correct bucket name** in environment variables

3. **File size** < 5MB

4. **File type** is image (PNG, JPG, GIF, WebP)

## Need More Help?

Share the error from:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab → Click failed request → Response)
3. CloudWatch logs

This will show the exact error!
