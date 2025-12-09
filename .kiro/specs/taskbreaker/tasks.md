# TaskBreaker Implementation Plan

## Overview

This implementation plan breaks down the TaskBreaker full-stack application into discrete, actionable coding tasks. Each task builds incrementally on previous work, starting with infrastructure and core services, then building out API endpoints, and finally implementing the frontend application.

## Implementation Tasks

- [x] 1. Set up AWS SAM infrastructure and project structure


  - Create backend directory with package.json for Node.js 18
  - Create template.yaml defining Cognito User Pool, User Pool Client, DynamoDB tables (Users, TaskPlans), S3 bucket, Lambda function with nodejs18.x runtime, and API Gateway
  - Configure environment variables: USERS_TABLE, TASKS_TABLE, S3_BUCKET, USER_POOL_ID, USER_POOL_CLIENT_ID
  - Create frontend directory with Next.js 14 project structure
  - Configure TailwindCSS and PostCSS in frontend
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Implement backend core services and utilities


  - [x] 2.1 Create response utility helpers

    - Write functions for consistent JSON responses (success, error)


    - _Requirements: All API endpoints_
  

  - [ ] 2.2 Implement Cognito service
    - Write signUp function to create new Cognito users


    - Write login function using initiateAuth with USER_PASSWORD_AUTH flow
    - Write verifyToken function using Cognito JWKS for JWT validation

    - _Requirements: 1.1, 1.5, 2.1, 2.5_
  
  - [x] 2.3 Write property test for Cognito service


    - **Property 1: Valid signup creates user account**
    - **Validates: Requirements 1.1**
  
  - [x] 2.4 Write property test for token validation


    - **Property 7: Protected endpoints validate tokens**
    - **Validates: Requirements 2.5, 10.2**
  


  - [ ] 2.5 Implement DynamoDB service for Users table
    - Write createUser function with default preferences initialization
    - Write getUser function to retrieve user by userId
    - Write updateUser function for profile and preference updates
    - _Requirements: 1.3, 1.4, 9.1, 14.2_
  
  - [x] 2.6 Write property test for user creation

    - **Property 2: Signup creates database record**
    - **Property 3: New users have default preferences**
    - **Validates: Requirements 1.3, 1.4**
  



  - [ ] 2.7 Implement DynamoDB service for TaskPlans table
    - Write createTaskPlan function with userId and taskId keys
    - Write getTaskPlans function filtering by userId with sort by createdAt
    - Write getTaskPlan function for single task retrieval


    - Write updateSubtask function to modify subtask done status and updatedAt
    - Write deleteTaskPlan function with userId verification
    - _Requirements: 3.4, 4.1, 4.2, 5.1, 5.2, 6.2_



  
  - [ ] 2.8 Write property test for task plan queries
    - **Property 18: Task queries filter by user**
    - **Property 19: Task plans sorted by creation date**
    - **Validates: Requirements 4.1, 4.2**
  




  - [ ] 2.9 Implement S3 service
    - Write uploadAvatar function saving to avatars/{userId} path
    - Write uploadExport function saving to exports/{taskId}.json path
    - Return S3 URLs after successful uploads
    - _Requirements: 8.2, 8.3_
  
  - [x] 2.10 Write property test for S3 uploads

    - **Property 33: Avatar stored with correct path**
    - **Property 34: Avatar upload returns URL**
    - **Validates: Requirements 8.2, 8.3**
  
  - [ ] 2.11 Implement AI service with placeholder logic
    - Write generatePlan function accepting taskName, timeMode, amount, userPreferences


    - Generate 3-10 subtasks with id, name, duration (format: "45m" or "2h"), priority ("High"/"Medium"/"Low"), done: false
    - Create schedule object distributing subtasks across time period respecting maxHoursPerDay
    - Calculate totalEstimatedTime as sum of subtask durations
    - Return mock data with realistic structure
    - _Requirements: 3.2, 3.3, 12.1, 12.2, 12.3, 12.4, 12.5_
  

  - [ ] 2.12 Write property tests for AI service
    - **Property 40: AI generates valid subtask count**
    - **Property 41: Subtask durations have valid format**
    - **Property 42: Subtask priorities are valid enum values**
    - **Property 43: Schedule respects time constraints**
    - **Property 44: Total time matches subtask sum**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

- [ ] 3. Implement authentication middleware and routes
  - [x] 3.1 Create authentication middleware


    - Write authMiddleware to extract JWT from Authorization header
    - Validate token using cognitoService.verifyToken
    - Extract userId from token and attach to req.user
    - Return 401 for missing or invalid tokens
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 3.2 Write property test for auth middleware


    - **Property 8: Token extraction works for all protected requests**
    - **Property 9: Valid tokens provide userId**
    - **Validates: Requirements 10.1, 10.4**
  
  - [x] 3.3 Implement POST /auth/signup route


    - Validate email and password from request body
    - Call cognitoService.signUp
    - Create user record in DynamoDB with default preferences
    - Return tokens (accessToken, idToken, refreshToken)
    - Handle duplicate email errors (409) and validation errors (400)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.4 Write property test for signup flow


    - **Property 4: Signup returns all tokens**
    - **Validates: Requirements 1.5**
  
  - [x] 3.5 Implement POST /auth/login route

    - Validate email and password from request body
    - Call cognitoService.login
    - Return tokens (accessToken, idToken, refreshToken)
    - Handle invalid credentials (401)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.6 Write property test for login flow

    - **Property 5: Valid login returns tokens**
    - **Validates: Requirements 2.1, 2.3**
  
  - [x] 3.7 Implement GET /auth/me route (protected)

    - Use authMiddleware
    - Retrieve user from DynamoDB using req.user.userId
    - Return user data (email, name, avatarUrl, preferences)
    - Handle user not found (404)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  

  - [x] 3.8 Write property test for profile retrieval

    - **Property 11: Profile retrieval returns complete data**
    - **Validates: Requirements 14.2, 14.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement task management routes
  - [x] 5.1 Implement POST /tasks/generate route (protected)


    - Use authMiddleware
    - Validate taskName, timeMode, amount from request body
    - Retrieve user preferences from DynamoDB
    - Call aiService.generatePlan with task details and preferences
    - Generate unique taskId (UUID)
    - Store task plan in DynamoDB with userId and taskId
    - Return complete task plan
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.4_
  
  - [x] 5.2 Write property tests for task creation

    - **Property 13: Task creation validates input**
    - **Property 14: Generated subtasks have required fields**
    - **Property 15: Task plans include schedules**
    - **Property 16: Task plans persist with correct keys**
    - **Property 17: Task creation returns complete plan**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [x] 5.3 Implement GET /tasks route (protected)

    - Use authMiddleware
    - Query TaskPlans table filtering by req.user.userId
    - Sort results by createdAt
    - Return array of task plans
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.4 Implement GET /tasks/:taskId route (protected)

    - Use authMiddleware
    - Retrieve specific task plan from DynamoDB
    - Verify task belongs to req.user.userId
    - Return task plan with subtasks and schedule
    - Handle not found (404) and unauthorized (403)
    - _Requirements: 4.4, 10.5_
  
  - [x] 5.5 Write property test for data isolation

    - **Property 10: Users only access their own data**
    - **Validates: Requirements 10.5**
  
  - [x] 5.6 Implement PATCH /tasks/:taskId/subtasks/:subId route (protected)

    - Use authMiddleware
    - Verify task belongs to req.user.userId
    - Update subtask done status in DynamoDB
    - Update updatedAt timestamp
    - Return updated task plan
    - _Requirements: 5.1, 5.2, 6.1_
  
  - [x] 5.7 Write property tests for subtask updates

    - **Property 21: Subtask completion persists**
    - **Property 22: Updates include timestamps**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x] 5.8 Implement DELETE /tasks/:taskId route (protected)

    - Use authMiddleware
    - Verify task belongs to req.user.userId

    - Delete task plan from DynamoDB
    - Return success confirmation
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 5.9 Write property tests for task deletion

    - **Property 25: Users can only delete their own plans**
    - **Property 26: Deletion removes from database**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 6. Implement profile management routes
  - [x] 6.1 Implement PATCH /auth/profile route (protected)

    - Use authMiddleware
    - Accept name and preferences updates from request body
    - Validate maxHoursPerDay is positive number
    - Validate workDays is array of valid day names
    - Update user record in DynamoDB
    - Return updated user data
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 6.2 Write property tests for profile updates

    - **Property 12: Profile updates persist to database**
    - **Property 37: MaxHoursPerDay validates positive numbers**
    - **Property 38: Work days stored as array**
    - **Property 39: AI respects user preferences**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [x] 6.3 Implement POST /auth/avatar route (protected)

    - Use authMiddleware
    - Accept multipart form data with image file
    - Validate file type is image (png, jpg, jpeg, gif)
    - Validate file size (max 5MB)

    - Upload to S3 using s3Service.uploadAvatar
    - Update user avatarUrl in DynamoDB
    - Return avatar URL
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 6.4 Write property tests for avatar upload

    - **Property 32: Avatar upload validates file type**
    - **Property 35: Avatar URL updates user record**
    - **Validates: Requirements 8.1, 8.4**

- [ ] 7. Create Express app and Lambda handler



  - [x] 7.1 Create Express application in src/app.js


    - Configure express.json() middleware
    - Configure CORS middleware
    - Register /auth routes
    - Register /tasks routes (with authMiddleware)
    - Add error handling middleware
    - Export app
    - _Requirements: All API requirements_
  
  - [x] 7.2 Create Lambda handler in src/lambda.js


    - Import Express app
    - Wrap with serverless-http or aws-serverless-express
    - Export handler function

    - _Requirements: 11.4, 11.5_
  
  - [x] 7.3 Write integration tests for API routes

    - Test complete request/response cycles for auth endpoints
    - Test protected endpoints with valid and invalid tokens
    - Test error responses for various failure scenarios

- [x] 8. Checkpoint - Ensure all backend tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Set up frontend project structure and configuration
  - [x] 9.1 Initialize Next.js 14 project with App Router

    - Create src/app directory structure

    - Configure next.config.js with API URL environment variable
    - Set up TailwindCSS with tailwind.config.js and postcss.config.js
    - Create globals.css with Tailwind directives and base styles
    - _Requirements: 13.1_
  
  - [x] 9.2 Create root layout

    - Implement src/app/layout.js with HTML structure
    - Add AuthContext provider wrapper
    - Import globals.css
    - Configure metadata (title, description)
    - _Requirements: All frontend requirements_

- [ ] 10. Implement authentication context and API utilities
  - [x] 10.1 Create API client library


    - Implement lib/api.js with get, post, patch, delete functions
    - Auto-inject Authorization header from stored tokens
    - Handle response parsing and error throwing
    - _Requirements: All API communication_
  
  - [x] 10.2 Create auth utility functions

    - Implement lib/auth.js with signup and login functions
    - Call backend /auth/signup and /auth/login endpoints
    - Return tokens and user data
    - _Requirements: 1.1, 1.5, 2.1_
  


  - [x] 10.3 Implement AuthContext






    - Create context/AuthContext.jsx with user and tokens state
    - Implement login function calling lib/auth.login and storing tokens
    - Implement signup function calling lib/auth.signup and storing tokens
    - Implement logout function clearing tokens and user state
    - Fetch user profile on mount if tokens exist (call /auth/me)
    - Provide loading state during initialization
    - _Requirements: 2.4, 14.5_
  
  - [x] 10.4 Write property test for token persistence

    - **Property 6: Tokens persist in frontend state**
    - **Validates: Requirements 2.4**

- [x] 11. Implement authentication pages

  - [x] 11.1 Create login page

    - Implement src/app/login/page.jsx with email and password form
    - Call AuthContext.login on form submission
    - Display error messages for failed login
    - Redirect to /dashboard on successful login
    - Style with TailwindCSS


    - _Requirements: 2.1, 2.2_
  

  - [x] 11.2 Create signup page



    - Implement src/app/signup/page.jsx with email and password form
    - Call AuthContext.signup on form submission
    - Display error messages for failed signup
    - Redirect to /dashboard on successful signup
    - Style with TailwindCSS
    - _Requirements: 1.1, 1.2_
  

  - [ ] 11.3 Write unit tests for auth pages
    - Test form validation
    - Test error display
    - Test successful authentication flow

- [ ] 12. Implement shared components
  - [x] 12.1 Create Navbar component

    - Implement components/Navbar.jsx with navigation links
    - Show user avatar and name when authenticated
    - Show login/signup links when not authenticated
    - Include logout button for authenticated users
    - Make responsive for mobile devices
    - _Requirements: 13.2_
  
  - [x] 12.2 Create TaskCard component

    - Implement components/TaskCard.jsx accepting task plan as prop
    - Display taskName, timeMode, amount, createdAt
    - Show progress indicator (completed/total subtasks)
    - Add click handler to navigate to task detail page
    - Style with TailwindCSS card design
    - _Requirements: 4.3, 7.4_
  
  - [x] 12.3 Write property test for TaskCard rendering

    - **Property 20: Task list displays required fields**
    - **Property 31: Dashboard shows progress indicators**
    - **Validates: Requirements 4.3, 7.4**
  
  - [x] 12.4 Create ProtectedRoute component

    - Implement components/ProtectedRoute.jsx checking AuthContext.user
    - Redirect to /login if not authenticated
    - Show loading state while checking authentication
    - Render children if authenticated
    - _Requirements: All protected pages_
  

  - [x] 12.5 Create ProfileForm component

    - Implement components/ProfileForm.jsx with name, maxHoursPerDay, workDays inputs
    - Include file input for avatar upload
    - Call PATCH /auth/profile on form submission
    - Call POST /auth/avatar for avatar upload
    - Display success confirmation after updates
    - _Requirements: 8.1, 9.1, 9.2, 9.3, 9.5_
  
  - [x] 12.6 Write property tests for profile form

    - **Property 32: Avatar upload validates file type**
    - **Property 36: New avatar displays in UI**
    - **Validates: Requirements 8.1, 8.5**

- [ ] 13. Implement dashboard page
  - [x] 13.1 Create dashboard page


    - Implement src/app/dashboard/page.jsx wrapped in ProtectedRoute
    - Fetch all task plans from GET /tasks
    - Filter subtasks scheduled for current day
    - Sort today's subtasks by priority (High, Medium, Low)
    - Display today's subtasks section with completion checkboxes
    - Display active task plans section using TaskCard components
    - Style with TailwindCSS responsive grid layout
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 13.2 Write property tests for dashboard

    - **Property 28: Dashboard retrieves all user plans**
    - **Property 29: Dashboard filters today's subtasks**
    - **Property 30: Today's subtasks ordered by priority**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 14. Implement task management pages
  - [x] 14.1 Create tasks list page

    - Implement src/app/tasks/page.jsx wrapped in ProtectedRoute
    - Fetch all task plans from GET /tasks
    - Display list of TaskCard components
    - Add "Create New Task" form with taskName, timeMode, amount inputs
    - Call POST /tasks/generate on form submission
    - Refresh task list after creation
    - Style with TailwindCSS
    - _Requirements: 3.1, 4.1, 4.2, 4.3_
  
  - [x] 14.2 Create task detail page

    - Implement src/app/tasks/[taskId]/page.jsx wrapped in ProtectedRoute
    - Fetch specific task plan from GET /tasks/:taskId
    - Display task name, time mode, amount, total estimated time
    - Display subtasks list with checkboxes for done status
    - Call PATCH /tasks/:taskId/subtasks/:subId when checkbox toggled
    - Display schedule showing which subtasks are assigned to which days
    - Add delete button calling DELETE /tasks/:taskId
    - Redirect to /tasks after deletion
    - Style with TailwindCSS
    - _Requirements: 4.4, 5.1, 5.3, 5.4, 6.1, 6.4_
  
  - [x] 14.3 Write property tests for task UI updates

    - **Property 23: UI reflects subtask completion**
    - **Property 24: Completed and incomplete subtasks visually distinct**
    - **Property 27: Deletion removes from UI**
    - **Validates: Requirements 5.3, 5.4, 6.4**

- [x] 15. Implement profile page



  - [ ] 15.1 Create profile page
    - Implement src/app/profile/page.jsx wrapped in ProtectedRoute
    - Fetch current user data from AuthContext
    - Render ProfileForm component with current values
    - Display current avatar with upload button
    - Show success message after profile updates
    - Style with TailwindCSS
    - _Requirements: 8.1, 8.5, 9.1, 9.2, 9.3, 9.5, 14.5_

- [x] 16. Add error handling and loading states

  - [x] 16.1 Add loading spinners to async operations

    - Add loading state to dashboard while fetching tasks
    - Add loading state to task detail page
    - Add loading state to profile page
    - Add loading state to form submissions
    - _Requirements: All frontend pages_
  
  - [x] 16.2 Add error boundaries and error displays

    - Create error boundary component for React errors
    - Display user-friendly error messages for API failures
    - Add retry mechanisms for failed requests
    - _Requirements: All frontend pages_

- [x] 17. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create deployment documentation
  - [x] 18.1 Create backend README

    - Document npm install, sam build, sam deploy --guided commands
    - List required AWS permissions
    - Document environment variables
    - Add troubleshooting section
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  



  - [x] 18.2 Create frontend README

    - Document npm install, npm run dev commands
    - Document environment variable configuration
    - Add build and production deployment instructions
    - _Requirements: All frontend requirements_
  

  - [x] 18.3 Create root README

    - Provide project overview
    - Link to backend and frontend READMEs
    - Document complete setup process
    - Include architecture diagram
    - List all technologies used
