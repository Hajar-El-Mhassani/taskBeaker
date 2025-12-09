# TaskBreaker Design Document

## Overview

TaskBreaker is a full-stack AI-powered task planning application built with a serverless architecture on AWS. The system uses Next.js 14 for the frontend, Express.js wrapped in AWS Lambda for the backend, and integrates AWS services (Cognito, DynamoDB, S3, API Gateway) for authentication, data storage, and file management. The AI service generates intelligent task breakdowns and schedules based on user preferences.

The architecture follows a clean separation between frontend and backend, with RESTful API communication secured by JWT tokens from AWS Cognito. The backend uses a modular service-oriented design with dedicated services for Cognito authentication, DynamoDB operations, S3 file storage, and AI task generation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │Dashboard │  │  Tasks   │  │ Profile  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
│                    AuthContext                                │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │ HTTPS/JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS API Gateway                           │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Lambda (Express.js App)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes: /auth, /tasks                                │  │
│  │  Middleware: authMiddleware (JWT validation)          │  │
│  └──────────────────────────────────────────────────────┘  │
│         │              │              │              │       │
│    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐  │
│    │Cognito │    │DynamoDB│    │   S3   │    │   AI   │  │
│    │Service │    │Service │    │Service │    │Service │  │
│    └────────┘    └────────┘    └────────┘    └────────┘  │
└─────────┬──────────────┬──────────────┬──────────────────────┘
          │              │              │
          ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Cognito    │  │  DynamoDB    │  │      S3      │
│  User Pool   │  │   Tables     │  │    Bucket    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS for styling
- Context API for state management

**Backend:**
- Node.js 18
- Express.js (wrapped in Lambda handler)
- AWS Lambda (nodejs18.x runtime)
- AWS SAM for infrastructure as code

**AWS Services:**
- API Gateway (HTTP API)
- Cognito (User authentication)
- DynamoDB (NoSQL database)
- S3 (File storage)
- Lambda (Serverless compute)

**Authentication:**
- AWS Cognito User Pools
- JWT tokens (access, ID, refresh)
- JWKS validation

## Components and Interfaces

### Backend Components

#### 1. Lambda Handler (`src/lambda.js`)
Entry point for AWS Lambda that wraps the Express application.

```javascript
exports.handler = serverless(app);
```

#### 2. Express Application (`src/app.js`)
Main Express server configuration with middleware and route registration.

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', authMiddleware, taskRoutes);

module.exports = app;
```

#### 3. Authentication Routes (`src/routes/auth.js`)
Handles user signup, login, and profile retrieval.

**Endpoints:**
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /auth/me` - Get current user profile (protected)

#### 4. Task Routes (`src/routes/tasks.js`)
Manages task plan operations.

**Endpoints:**
- `POST /tasks/generate` - Create new task plan with AI generation
- `GET /tasks` - List all user task plans
- `GET /tasks/:taskId` - Get specific task plan
- `PATCH /tasks/:taskId/subtasks/:subId` - Update subtask status
- `DELETE /tasks/:taskId` - Delete task plan

#### 5. Auth Middleware (`src/middleware/authMiddleware.js`)
Validates JWT tokens and attaches user information to requests.

```javascript
async function authMiddleware(req, res, next) {
  const token = extractToken(req);
  const decoded = await verifyToken(token);
  req.user = { userId: decoded.sub };
  next();
}
```

#### 6. Cognito Service (`src/services/cognitoService.js`)
Handles AWS Cognito operations.

**Interface:**
```javascript
{
  signUp(email, password): Promise<{ userId, email }>
  login(email, password): Promise<{ accessToken, idToken, refreshToken }>
  verifyToken(token): Promise<{ sub, email }>
}
```

#### 7. DynamoDB Service (`src/services/dynamoService.js`)
Manages database operations for Users and TaskPlans tables.

**Interface:**
```javascript
{
  // Users
  createUser(userId, email, name): Promise<User>
  getUser(userId): Promise<User>
  updateUser(userId, updates): Promise<User>
  
  // TaskPlans
  createTaskPlan(userId, taskPlan): Promise<TaskPlan>
  getTaskPlans(userId): Promise<TaskPlan[]>
  getTaskPlan(userId, taskId): Promise<TaskPlan>
  updateSubtask(userId, taskId, subId, updates): Promise<void>
  deleteTaskPlan(userId, taskId): Promise<void>
}
```

#### 8. S3 Service (`src/services/s3Service.js`)
Handles file uploads to S3.

**Interface:**
```javascript
{
  uploadAvatar(userId, fileBuffer, mimeType): Promise<{ url }>
  uploadExport(taskId, jsonBuffer): Promise<{ url }>
}
```

#### 9. AI Service (`src/services/aiService.js`)
Generates task breakdowns and schedules (placeholder implementation).

**Interface:**
```javascript
{
  generatePlan(taskName, timeMode, amount, userPreferences): Promise<{
    subtasks: Subtask[],
    schedule: Schedule,
    totalEstimatedTime: string,
    notes: string
  }>
}
```

### Frontend Components

#### 1. App Layout (`src/app/layout.js`)
Root layout with AuthContext provider and global styles.

#### 2. Auth Pages
- `src/app/login/page.jsx` - Login form
- `src/app/signup/page.jsx` - Registration form

#### 3. Dashboard (`src/app/dashboard/page.jsx`)
Shows today's subtasks and active task plans overview.

#### 4. Tasks Pages
- `src/app/tasks/page.jsx` - List all task plans with create form
- `src/app/tasks/[taskId]/page.jsx` - Task plan details with subtasks

#### 5. Profile Page (`src/app/profile/page.jsx`)
User profile editing and avatar upload.

#### 6. Shared Components
- `Navbar.jsx` - Navigation bar with auth state
- `TaskCard.jsx` - Reusable task plan card
- `ProtectedRoute.jsx` - Route guard for authenticated pages
- `ProfileForm.jsx` - Profile editing form

#### 7. Context (`context/AuthContext.jsx`)
Global authentication state management.

**Interface:**
```javascript
{
  user: User | null,
  tokens: { accessToken, idToken, refreshToken } | null,
  login(email, password): Promise<void>,
  logout(): void,
  signup(email, password): Promise<void>,
  loading: boolean
}
```

#### 8. API Library (`lib/api.js`)
HTTP client wrapper with automatic token injection.

```javascript
{
  get(url): Promise<Response>,
  post(url, data): Promise<Response>,
  patch(url, data): Promise<Response>,
  delete(url): Promise<Response>
}
```

## Data Models

### Users Table

**Primary Key:** `userId` (String)

```javascript
{
  userId: string,           // Cognito sub
  email: string,
  name: string,
  avatarUrl: string | null,
  preferences: {
    maxHoursPerDay: number, // Default: 8
    workDays: string[]      // Default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  createdAt: string,        // ISO 8601
  updatedAt: string         // ISO 8601
}
```

### TaskPlans Table

**Primary Key:** `userId` (String)  
**Sort Key:** `taskId` (String)

```javascript
{
  userId: string,
  taskId: string,           // UUID
  taskName: string,
  timeMode: "days" | "hours",
  amount: number,
  subtasks: [
    {
      id: string,
      name: string,
      duration: string,     // e.g., "45m", "2h"
      priority: "High" | "Medium" | "Low",
      done: boolean
    }
  ],
  schedule: {
    day1: string[],         // Array of subtask IDs
    day2: string[],
    // ... dynamic keys based on timeMode and amount
  },
  totalEstimatedTime: string,
  notes: string,
  createdAt: string,
  updatedAt: string
}
```

### S3 File Structure

```
taskbreaker-app-bucket/
├── avatars/
│   ├── {userId}.png
│   ├── {userId}.jpg
│   └── ...
└── exports/
    ├── {taskId}.json
    └── ...
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Authentication and User Management Properties

**Property 1: Valid signup creates user account**  
*For any* valid email and password combination, submitting signup credentials should result in a new Cognito user account being created.  
**Validates: Requirements 1.1**

**Property 2: Signup creates database record**  
*For any* successful signup, a corresponding user record should exist in the DynamoDB Users table with the correct userId.  
**Validates: Requirements 1.3**

**Property 3: New users have default preferences**  
*For any* newly created user record, the preferences should be initialized with maxHoursPerDay set to 8 and workDays containing Monday through Friday.  
**Validates: Requirements 1.4**

**Property 4: Signup returns all tokens**  
*For any* successful signup, the response should contain non-empty accessToken, idToken, and refreshToken fields.  
**Validates: Requirements 1.5**

**Property 5: Valid login returns tokens**  
*For any* valid email and password combination for an existing user, authentication should succeed and return accessToken, idToken, and refreshToken.  
**Validates: Requirements 2.1, 2.3**

**Property 6: Tokens persist in frontend state**  
*For any* successful login, the tokens should be stored in the AuthContext and available for subsequent API requests.  
**Validates: Requirements 2.4**

**Property 7: Protected endpoints validate tokens**  
*For any* request to a protected endpoint with a valid JWT token, the Backend API should validate the token using Cognito JWKS and grant access.  
**Validates: Requirements 2.5, 10.2**

**Property 8: Token extraction works for all protected requests**  
*For any* request to a protected endpoint, the Backend API should extract the JWT token from the Authorization header.  
**Validates: Requirements 10.1**

**Property 9: Valid tokens provide userId**  
*For any* authenticated request with a valid token, the userId should be extracted from the token and attached to the request context.  
**Validates: Requirements 10.4**

**Property 10: Users only access their own data**  
*For any* data access operation, the Backend API should filter results by the authenticated user's userId, ensuring data isolation.  
**Validates: Requirements 10.5**

**Property 11: Profile retrieval returns complete data**  
*For any* user profile request with valid authentication, the response should include email, name, avatarUrl, and preferences fields.  
**Validates: Requirements 14.2, 14.3**

**Property 12: Profile updates persist to database**  
*For any* user profile update (name, preferences), the changes should be persisted to the DynamoDB Users table and reflected in subsequent queries.  
**Validates: Requirements 9.1**

### Task Management Properties

**Property 13: Task creation validates input**  
*For any* task creation request, the Backend API should validate that taskName is non-empty, timeMode is either "days" or "hours", and amount is a positive number.  
**Validates: Requirements 3.1**

**Property 14: Generated subtasks have required fields**  
*For any* AI-generated task plan, each subtask should have non-empty id, name, duration, priority, and done fields.  
**Validates: Requirements 3.2**

**Property 15: Task plans include schedules**  
*For any* generated task plan, a schedule object should be created that allocates subtasks across the specified time period.  
**Validates: Requirements 3.3**

**Property 16: Task plans persist with correct keys**  
*For any* created task plan, it should be stored in DynamoDB TaskPlans table with the correct userId and taskId as keys, and be retrievable using those keys.  
**Validates: Requirements 3.4**

**Property 17: Task creation returns complete plan**  
*For any* successful task creation, the API response should include the complete task plan with subtasks, schedule, and metadata matching what was stored in the database.  
**Validates: Requirements 3.5**

**Property 18: Task queries filter by user**  
*For any* request to list task plans, all returned plans should belong to the authenticated user (matching userId).  
**Validates: Requirements 4.1**

**Property 19: Task plans sorted by creation date**  
*For any* set of task plans returned for a user, they should be ordered chronologically by createdAt timestamp (newest or oldest first consistently).  
**Validates: Requirements 4.2**

**Property 20: Task list displays required fields**  
*For any* task plan displayed in the list view, the rendered output should include taskName, timeMode, and createdAt fields.  
**Validates: Requirements 4.3**

**Property 21: Subtask completion persists**  
*For any* subtask marked as done, the done status should be updated in the DynamoDB TaskPlans table and persist across subsequent queries.  
**Validates: Requirements 5.1**

**Property 22: Updates include timestamps**  
*For any* subtask status update, the TaskPlans record should have its updatedAt timestamp modified to reflect the current time.  
**Validates: Requirements 5.2**

**Property 23: UI reflects subtask completion**  
*For any* subtask marked as done, the Frontend Application should display the subtask with a visual indicator of completion (e.g., checked checkbox, strikethrough).  
**Validates: Requirements 5.3**

**Property 24: Completed and incomplete subtasks visually distinct**  
*For any* task plan view, completed subtasks should have different visual styling than incomplete subtasks.  
**Validates: Requirements 5.4**

**Property 25: Users can only delete their own plans**  
*For any* delete request, the Backend API should verify the task plan's userId matches the authenticated user's userId before allowing deletion.  
**Validates: Requirements 6.1**

**Property 26: Deletion removes from database**  
*For any* successful task plan deletion, subsequent queries for that taskId should return not found, confirming removal from DynamoDB.  
**Validates: Requirements 6.2**

**Property 27: Deletion removes from UI**  
*For any* successful task plan deletion, the plan should be removed from the displayed list in the Frontend Application.  
**Validates: Requirements 6.4**

### Dashboard Properties

**Property 28: Dashboard retrieves all user plans**  
*For any* dashboard access, the Backend API should retrieve all task plans belonging to the authenticated user.  
**Validates: Requirements 7.1**

**Property 29: Dashboard filters today's subtasks**  
*For any* dashboard view, only subtasks scheduled for the current day should be displayed in the today's tasks section.  
**Validates: Requirements 7.2**

**Property 30: Today's subtasks ordered by priority**  
*For any* set of today's subtasks, they should be displayed in priority order (High before Medium before Low).  
**Validates: Requirements 7.3**

**Property 31: Dashboard shows progress indicators**  
*For any* task plan summary on the dashboard, a progress indicator should be displayed showing the ratio of completed subtasks to total subtasks.  
**Validates: Requirements 7.4**

### File Upload Properties

**Property 32: Avatar upload validates file type**  
*For any* file upload attempt, the Frontend Application should validate that the file type is an accepted image format (png, jpg, jpeg, gif) before sending to the backend.  
**Validates: Requirements 8.1**

**Property 33: Avatar stored with correct path**  
*For any* successful avatar upload, the file should be stored in S3 with the path format `avatars/{userId}.{extension}`.  
**Validates: Requirements 8.2**

**Property 34: Avatar upload returns URL**  
*For any* successful S3 avatar upload, the response should include a valid URL that can be used to access the uploaded image.  
**Validates: Requirements 8.3**

**Property 35: Avatar URL updates user record**  
*For any* successful avatar upload, the user's record in DynamoDB should be updated with the new avatarUrl value.  
**Validates: Requirements 8.4**

**Property 36: New avatar displays in UI**  
*For any* successful avatar upload, the Frontend Application should display the new avatar image in the profile page and navbar.  
**Validates: Requirements 8.5**

### Preferences Properties

**Property 37: MaxHoursPerDay validates positive numbers**  
*For any* attempt to update maxHoursPerDay preference, the system should reject non-positive numbers and accept only positive integers or decimals.  
**Validates: Requirements 9.2**

**Property 38: Work days stored as array**  
*For any* work days preference update, the selected days should be stored as an array of day name strings in the user preferences object.  
**Validates: Requirements 9.3**

**Property 39: AI respects user preferences**  
*For any* task plan generation after preferences are updated, the AI Service should use the new maxHoursPerDay and workDays values when creating schedules.  
**Validates: Requirements 9.4**

### AI Service Properties

**Property 40: AI generates valid subtask count**  
*For any* task plan generation request, the AI Service should generate between 3 and 10 subtasks (inclusive).  
**Validates: Requirements 12.1**

**Property 41: Subtask durations have valid format**  
*For any* generated subtask, the duration field should match the pattern of a number followed by 'm' (minutes) or 'h' (hours), e.g., "45m" or "2h".  
**Validates: Requirements 12.2**

**Property 42: Subtask priorities are valid enum values**  
*For any* generated subtask, the priority field should be exactly one of "High", "Medium", or "Low".  
**Validates: Requirements 12.3**

**Property 43: Schedule respects time constraints**  
*For any* generated schedule, the total allocated time should not exceed the user's specified amount (in days or hours) and should respect maxHoursPerDay preference.  
**Validates: Requirements 12.4**

**Property 44: Total time matches subtask sum**  
*For any* generated task plan, the totalEstimatedTime should equal the sum of all subtask durations.  
**Validates: Requirements 12.5**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**: Return 401 with message "Invalid email or password"
2. **Duplicate Email**: Return 409 with message "Email already exists"
3. **Invalid Token**: Return 401 with message "Invalid or expired token"
4. **Missing Token**: Return 401 with message "Authorization token required"

### Validation Errors

1. **Invalid Input**: Return 400 with descriptive message about which field is invalid
2. **Missing Required Fields**: Return 400 with message listing missing fields
3. **Invalid File Type**: Return 400 with message "Only image files are allowed"

### Authorization Errors

1. **Unauthorized Access**: Return 403 with message "You don't have permission to access this resource"
2. **Resource Not Found**: Return 404 with message "Resource not found"

### Service Errors

1. **DynamoDB Errors**: Return 500 with message "Database error occurred"
2. **S3 Upload Errors**: Return 500 with message "File upload failed"
3. **AI Service Errors**: Return 500 with message "Task generation failed"
4. **Cognito Errors**: Map Cognito error codes to appropriate HTTP status codes

### Error Response Format

All errors should follow this consistent format:

```javascript
{
  error: {
    message: string,
    code: string,
    details?: any
  }
}
```

## Testing Strategy

### Unit Testing

The TaskBreaker system will use **Jest** as the testing framework for both backend and frontend unit tests.

**Backend Unit Tests:**
- Service layer functions (cognitoService, dynamoService, s3Service, aiService)
- Middleware functions (authMiddleware)
- Utility functions (response helpers)
- Route handlers (auth routes, task routes)

**Frontend Unit Tests:**
- React components (Navbar, TaskCard, ProfileForm)
- Context providers (AuthContext)
- API client functions (lib/api.js, lib/auth.js)
- Form validation logic

**Example Unit Tests:**
- Test that authMiddleware rejects requests without Authorization header
- Test that cognitoService.signUp handles Cognito errors appropriately
- Test that TaskCard component renders task information correctly
- Test that API client adds Authorization header to requests

### Property-Based Testing

The TaskBreaker system will use **fast-check** for property-based testing in JavaScript/TypeScript.

**Configuration:**
- Each property-based test should run a minimum of 100 iterations
- Tests should use appropriate generators for domain-specific data types
- Each test must be tagged with a comment referencing the design document property

**Tag Format:**
```javascript
// Feature: taskbreaker, Property 1: Valid signup creates user account
```

**Property Test Coverage:**

1. **Authentication Properties (1-12)**: Test user signup, login, token validation, and profile management across various valid inputs
2. **Task Management Properties (13-27)**: Test task creation, retrieval, updates, and deletion with generated task data
3. **Dashboard Properties (28-31)**: Test dashboard data filtering and sorting with various date and priority combinations
4. **File Upload Properties (32-36)**: Test avatar upload with various file types and sizes
5. **Preferences Properties (37-39)**: Test preference validation and AI integration with generated preference values
6. **AI Service Properties (40-44)**: Test AI generation constraints with various task inputs

**Generator Examples:**

```javascript
// Generate valid email addresses
const emailArbitrary = fc.emailAddress();

// Generate valid task names
const taskNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

// Generate time modes
const timeModeArbitrary = fc.constantFrom('days', 'hours');

// Generate priorities
const priorityArbitrary = fc.constantFrom('High', 'Medium', 'Low');

// Generate work days
const workDaysArbitrary = fc.subarray(
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  { minLength: 1, maxLength: 7 }
);
```

**Property Test Implementation:**

Each correctness property must be implemented as a single property-based test. Tests should:
1. Generate random valid inputs using fast-check arbitraries
2. Execute the system operation
3. Assert that the property holds for the generated inputs
4. Handle edge cases through the generator configuration

**Integration with Development:**

- Property tests should be placed close to implementation to catch errors early
- Failed property tests should report the minimal failing example for debugging
- Property tests complement unit tests by verifying general correctness across input space

### Integration Testing

**API Integration Tests:**
- Test complete request/response cycles through API Gateway to Lambda
- Test authentication flow from signup through protected endpoint access
- Test task creation flow from frontend submission to database storage
- Test file upload flow from frontend to S3 and database update

**End-to-End Testing:**

While full E2E testing with deployment is outside the scope of automated testing, the following flows should be manually verified:
- Complete user journey from signup to task creation to dashboard view
- Avatar upload and profile update flow
- Task completion and progress tracking

## Security Considerations

### Authentication Security

1. **Password Requirements**: Enforce minimum password length and complexity through Cognito User Pool policies
2. **Token Expiration**: Configure appropriate token expiration times (access token: 1 hour, refresh token: 30 days)
3. **HTTPS Only**: All API communication must use HTTPS in production
4. **Token Storage**: Store tokens securely in browser (httpOnly cookies or secure localStorage)

### Authorization Security

1. **User Isolation**: All database queries must filter by authenticated userId
2. **Resource Ownership**: Verify resource ownership before allowing modifications or deletions
3. **Input Validation**: Validate all user inputs on both frontend and backend
4. **SQL Injection Prevention**: Use DynamoDB SDK parameterized queries (built-in protection)

### File Upload Security

1. **File Type Validation**: Validate file MIME types on both frontend and backend
2. **File Size Limits**: Enforce maximum file size (e.g., 5MB for avatars)
3. **Filename Sanitization**: Use userId-based filenames to prevent path traversal
4. **S3 Bucket Policies**: Configure S3 bucket to prevent public write access

### API Security

1. **Rate Limiting**: Implement rate limiting on API Gateway to prevent abuse
2. **CORS Configuration**: Configure CORS to allow only the frontend domain
3. **Error Messages**: Avoid leaking sensitive information in error messages
4. **Logging**: Log authentication failures and suspicious activities

## Deployment Architecture

### AWS SAM Template Structure

The `template.yaml` file defines the complete infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # Cognito User Pool
  TaskBreakerUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: taskbreaker-users
      AutoVerifiedAttributes:
        - email
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true

  # Cognito User Pool Client
  TaskBreakerUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: taskbreaker-client
      UserPoolId: !Ref TaskBreakerUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_PASSWORD_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH

  # DynamoDB Tables
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: TaskBreaker-Users
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST

  TaskPlansTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: TaskBreaker-TaskPlans
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: taskId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: taskId
          KeyType: RANGE
      BillingMode: PAY_PER_REQUEST

  # S3 Bucket
  TaskBreakerBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: taskbreaker-app-bucket
      CorsConfiguration:
        CorsRules:
          - AllowedOrigins:
              - '*'
            AllowedMethods:
              - GET
              - PUT
              - POST
            AllowedHeaders:
              - '*'

  # Lambda Function
  TaskBreakerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: taskbreaker-api
      CodeUri: backend/
      Handler: src/lambda.handler
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          USERS_TABLE: !Ref UsersTable
          TASKS_TABLE: !Ref TaskPlansTable
          S3_BUCKET: !Ref TaskBreakerBucket
          USER_POOL_ID: !Ref TaskBreakerUserPool
          USER_POOL_CLIENT_ID: !Ref TaskBreakerUserPoolClient
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable
        - DynamoDBCrudPolicy:
            TableName: !Ref TaskPlansTable
        - S3CrudPolicy:
            BucketName: !Ref TaskBreakerBucket
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com'
  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref TaskBreakerUserPool
  UserPoolClientId:
    Description: Cognito User Pool Client ID
    Value: !Ref TaskBreakerUserPoolClient
```

### Environment Variables

**Backend Lambda:**
- `USERS_TABLE`: DynamoDB Users table name
- `TASKS_TABLE`: DynamoDB TaskPlans table name
- `S3_BUCKET`: S3 bucket name for file storage
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `AWS_REGION`: AWS region (automatically provided by Lambda)

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API Gateway URL
- `NEXT_PUBLIC_USER_POOL_ID`: Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `NEXT_PUBLIC_AWS_REGION`: AWS region

### Deployment Process

**Backend Deployment:**
```bash
cd backend
npm install
sam build
sam deploy --guided
```

**Frontend Deployment:**
```bash
cd frontend
npm install
npm run build
npm run dev  # Development
# or
npm start    # Production
```

### Development Workflow

1. **Local Development**: Run frontend locally with `npm run dev`, pointing to deployed backend API
2. **Backend Changes**: Deploy backend changes with `sam build && sam deploy`
3. **Frontend Changes**: Hot reload automatically updates during development
4. **Testing**: Run `npm test` in both backend and frontend directories

## Performance Considerations

### Backend Optimization

1. **DynamoDB Query Optimization**: Use appropriate indexes and query patterns to minimize read capacity
2. **Lambda Cold Starts**: Keep Lambda function warm with provisioned concurrency if needed
3. **Payload Size**: Minimize response payload sizes by returning only necessary data
4. **Connection Pooling**: Reuse AWS SDK clients across Lambda invocations

### Frontend Optimization

1. **Code Splitting**: Use Next.js automatic code splitting for optimal bundle sizes
2. **Image Optimization**: Use Next.js Image component for automatic image optimization
3. **Caching**: Implement appropriate caching strategies for API responses
4. **Lazy Loading**: Lazy load components and routes that aren't immediately needed

### Scalability

1. **DynamoDB Auto-Scaling**: Use on-demand billing mode for automatic scaling
2. **Lambda Concurrency**: Configure appropriate concurrency limits
3. **S3 Performance**: Use appropriate S3 storage classes and lifecycle policies
4. **API Gateway Throttling**: Configure throttling limits to protect backend resources

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket support for real-time task updates
2. **Collaboration**: Add ability to share task plans with other users
3. **Advanced AI**: Integrate actual Bedrock AI models for more intelligent task breakdown
4. **Analytics**: Add task completion analytics and productivity insights
5. **Mobile App**: Develop native mobile applications for iOS and Android
6. **Notifications**: Implement email/push notifications for task reminders
7. **Export/Import**: Add ability to export task plans to various formats (PDF, CSV)
8. **Templates**: Allow users to create and reuse task plan templates
