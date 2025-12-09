# TaskBreaker Backend

AWS Serverless backend for TaskBreaker AI-powered task planning application.

## Technology Stack

- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Deployment**: AWS SAM (Serverless Application Model)
- **Services**: 
  - AWS Lambda
  - AWS API Gateway
  - AWS Cognito (Authentication)
  - AWS DynamoDB (Database)
  - AWS S3 (File Storage)

## Project Structure

```
backend/
├── src/
│   ├── lambda.js              # Lambda handler entry point
│   ├── app.js                 # Express application
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   └── tasks.js          # Task management routes
│   ├── middleware/
│   │   └── authMiddleware.js # JWT validation middleware
│   ├── services/
│   │   ├── cognitoService.js # Cognito authentication
│   │   ├── dynamoService.js  # DynamoDB operations
│   │   ├── s3Service.js      # S3 file operations
│   │   └── aiService.js      # AI task generation
│   └── utils/
│       └── response.js        # Response helpers
├── template.yaml              # SAM infrastructure template
└── package.json
```

## Prerequisites

- Node.js 18.x
- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed
- An AWS account with permissions for Lambda, API Gateway, Cognito, DynamoDB, and S3

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the SAM application:
```bash
sam build
```

## Deployment

### First-time Deployment

Deploy with guided prompts:
```bash
sam deploy --guided
```

You'll be prompted for:
- Stack name (e.g., `taskbreaker-stack`)
- AWS Region (e.g., `us-east-1`)
- Confirm changes before deploy: Y
- Allow SAM CLI IAM role creation: Y
- Disable rollback: N
- Save arguments to configuration file: Y

### Subsequent Deployments

After the first deployment, simply run:
```bash
sam build && sam deploy
```

## Environment Variables

The Lambda function uses these environment variables (automatically configured by SAM):

- `USERS_TABLE` - DynamoDB Users table name
- `TASKS_TABLE` - DynamoDB TaskPlans table name
- `S3_BUCKET` - S3 bucket name for file storage
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID
- `AWS_REGION_CUSTOM` - AWS region

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /auth/me` - Get current user profile (protected)
- `PATCH /auth/profile` - Update user profile (protected)
- `POST /auth/avatar` - Upload user avatar (protected)

### Tasks
- `POST /tasks/generate` - Create new task plan with AI (protected)
- `GET /tasks` - List all user task plans (protected)
- `GET /tasks/:taskId` - Get specific task plan (protected)
- `PATCH /tasks/:taskId/subtasks/:subId` - Update subtask status (protected)
- `DELETE /tasks/:taskId` - Delete task plan (protected)

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Local Development

For local testing, you can use SAM local:
```bash
sam local start-api
```

This starts a local API Gateway endpoint at `http://localhost:3000`.

## Deployment Outputs

After deployment, SAM will output:
- **ApiUrl**: The API Gateway endpoint URL
- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID

Copy these values to configure the frontend application.

## Troubleshooting

### Lambda Timeout
If requests are timing out, increase the `Timeout` value in `template.yaml`.

### DynamoDB Throttling
If experiencing throttling, consider switching from PAY_PER_REQUEST to PROVISIONED billing mode with appropriate capacity.

### CORS Issues
Ensure the API Gateway CORS configuration matches your frontend domain.

### Cognito Authentication Errors
Verify that the User Pool Client has the correct auth flows enabled:
- ALLOW_USER_PASSWORD_AUTH
- ALLOW_REFRESH_TOKEN_AUTH

## Security Considerations

- All API endpoints except `/auth/signup` and `/auth/login` require JWT authentication
- Passwords are managed by AWS Cognito with enforced complexity requirements
- S3 bucket has public read access for avatars (write access is restricted)
- DynamoDB tables use IAM roles for access control
- JWT tokens expire after 1 hour (access/ID tokens) and 30 days (refresh tokens)

## AWS Permissions Required

The deployment requires permissions for:
- CloudFormation (stack management)
- Lambda (function creation/updates)
- API Gateway (API creation)
- Cognito (User Pool management)
- DynamoDB (table creation)
- S3 (bucket creation)
- IAM (role creation for Lambda)

## Cost Estimation

With AWS Free Tier:
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage + 25 read/write capacity units free
- S3: 5GB storage + 20,000 GET requests free
- Cognito: 50,000 MAUs free
- API Gateway: 1M requests/month free (first 12 months)

Beyond free tier, costs are pay-per-use based on actual consumption.
