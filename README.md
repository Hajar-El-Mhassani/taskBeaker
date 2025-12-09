# TaskBreaker

AI-powered task planning application that helps you break down complex tasks into manageable subtasks with intelligent scheduling.

## Overview

TaskBreaker uses AI to automatically decompose your tasks into actionable subtasks and creates an optimized schedule based on your preferences. Whether you're planning a project, organizing your week, or tackling a complex goal, TaskBreaker helps you stay organized and productive.

## Features

- 🤖 **AI-Powered Task Breakdown**: Automatically generate subtasks from high-level goals
- 📅 **Intelligent Scheduling**: Create schedules that respect your time constraints and preferences
- ✅ **Progress Tracking**: Mark subtasks as complete and track your progress
- 👤 **User Profiles**: Customize your experience with personal preferences
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔒 **Secure Authentication**: AWS Cognito-powered user authentication
- ☁️ **Serverless Architecture**: Scalable and cost-effective AWS infrastructure

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI**: React 18 + TailwindCSS
- **State Management**: React Context API
- **Hosting**: Vercel / AWS Amplify / Static hosting

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js on AWS Lambda
- **API**: AWS API Gateway (HTTP API)
- **Authentication**: AWS Cognito
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Infrastructure**: AWS SAM (Serverless Application Model)

## Project Structure

```
taskbreaker/
├── backend/                 # Serverless backend API
│   ├── src/
│   │   ├── lambda.js       # Lambda handler
│   │   ├── app.js          # Express app
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── template.yaml       # SAM infrastructure
│   └── package.json
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   └── lib/           # Utilities
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- AWS CLI configured with credentials
- AWS SAM CLI installed
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Build and deploy with SAM:
```bash
sam build
sam deploy --guided
```

4. Note the deployment outputs (API URL, User Pool ID, etc.)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your backend deployment outputs:
```env
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
NEXT_PUBLIC_USER_POOL_ID=<your-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-user-pool-client-id>
NEXT_PUBLIC_AWS_REGION=<your-aws-region>
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Your First Task Plan

1. **Sign Up**: Create an account with your email and password
2. **Set Preferences**: Configure your work hours and available days
3. **Create Task**: Enter a task name and time constraint (e.g., "Launch website" in 5 days)
4. **Review Plan**: AI generates subtasks and a schedule
5. **Track Progress**: Mark subtasks as complete as you work

### Managing Tasks

- **Dashboard**: View today's subtasks and active plans
- **Task List**: See all your task plans
- **Task Details**: View subtasks, schedule, and progress
- **Edit**: Mark subtasks complete or delete plans
- **Profile**: Update preferences to improve future schedules

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /auth/me` - Get current user
- `PATCH /auth/profile` - Update profile
- `POST /auth/avatar` - Upload avatar

### Tasks
- `POST /tasks/generate` - Create task plan
- `GET /tasks` - List task plans
- `GET /tasks/:taskId` - Get task details
- `PATCH /tasks/:taskId/subtasks/:subId` - Update subtask
- `DELETE /tasks/:taskId` - Delete task plan

## Technology Stack

### Frontend Technologies
- Next.js 14
- React 18
- TailwindCSS
- Context API

### Backend Technologies
- Node.js 18
- Express.js
- AWS Lambda
- AWS API Gateway
- AWS Cognito
- AWS DynamoDB
- AWS S3
- AWS SAM

### Testing
- Jest
- fast-check (Property-based testing)
- React Testing Library

## Development

### Running Tests

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test
```

### Local Development

Backend (SAM Local):
```bash
cd backend
sam local start-api
```

Frontend:
```bash
cd frontend
npm run dev
```

## Deployment

### Backend Deployment

```bash
cd backend
sam build
sam deploy
```

### Frontend Deployment

**Vercel:**
```bash
cd frontend
vercel
```

**AWS Amplify:**
Connect your GitHub repository and configure build settings.

**Static Export:**
```bash
cd frontend
npm run build
# Deploy the 'out' directory
```

## Configuration

### Backend Environment Variables
Automatically configured by SAM:
- `USERS_TABLE` - DynamoDB Users table
- `TASKS_TABLE` - DynamoDB TaskPlans table
- `S3_BUCKET` - S3 bucket for files
- `USER_POOL_ID` - Cognito User Pool
- `USER_POOL_CLIENT_ID` - Cognito Client

### Frontend Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_USER_POOL_ID` - Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID` - Cognito Client ID
- `NEXT_PUBLIC_AWS_REGION` - AWS Region

## Security

- JWT-based authentication via AWS Cognito
- Password complexity requirements enforced
- Protected API endpoints with token validation
- User data isolation in DynamoDB
- Secure file uploads to S3
- HTTPS required in production

## Cost Estimation

With AWS Free Tier, the application can handle significant traffic at no cost:
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage free
- S3: 5GB storage free
- Cognito: 50,000 MAUs free
- API Gateway: 1M requests/month free (first 12 months)

Beyond free tier, costs scale with usage (pay-per-request model).

## Troubleshooting

### Backend Issues
- Check CloudWatch logs for Lambda errors
- Verify IAM permissions for DynamoDB and S3
- Ensure Cognito User Pool configuration is correct

### Frontend Issues
- Verify environment variables are set correctly
- Check browser console for API errors
- Ensure backend API is accessible

### Authentication Issues
- Verify Cognito User Pool IDs match
- Check that auth flows are enabled
- Ensure tokens are being stored correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the documentation in `/backend/README.md` and `/frontend/README.md`
- Review CloudWatch logs for backend errors
- Check browser console for frontend errors

## Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced AI models (actual Bedrock integration)
- [ ] Mobile native apps (iOS/Android)
- [ ] Task templates and sharing
- [ ] Analytics and productivity insights
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Export to various formats

## Acknowledgments

- AWS for serverless infrastructure
- Next.js team for the amazing framework
- TailwindCSS for beautiful styling
- Open source community

---

Built with ❤️ using AWS Serverless and Next.js
