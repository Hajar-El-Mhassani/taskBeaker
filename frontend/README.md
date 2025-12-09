# TaskBreaker Frontend

Next.js 14 frontend application for TaskBreaker AI-powered task planning.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Runtime**: Node.js 18.x

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout with AuthProvider
│   │   ├── globals.css        # Global styles and Tailwind
│   │   ├── login/
│   │   │   └── page.jsx       # Login page
│   │   ├── signup/
│   │   │   └── page.jsx       # Signup page
│   │   ├── dashboard/
│   │   │   └── page.jsx       # Dashboard page
│   │   ├── tasks/
│   │   │   ├── page.jsx       # Tasks list page
│   │   │   └── [taskId]/
│   │   │       └── page.jsx   # Task detail page
│   │   └── profile/
│   │       └── page.jsx       # Profile page
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation component
│   │   ├── TaskCard.jsx       # Task card component
│   │   ├── ProtectedRoute.jsx # Route guard
│   │   └── ProfileForm.jsx    # Profile form component
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication context
│   └── lib/
│       ├── api.js             # API client wrapper
│       └── auth.js            # Auth utility functions
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Prerequisites

- Node.js 18.x
- npm or yarn
- Backend API deployed and running

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.local.example .env.local
```

3. Edit `.env.local` with your backend API details:
```env
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

Get these values from your backend SAM deployment outputs.

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The application will hot-reload when you make changes to the code.

## Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Features

### Authentication
- User signup with email and password
- User login with JWT token management
- Automatic token refresh
- Protected routes requiring authentication

### Dashboard
- View today's scheduled subtasks
- See active task plans
- Quick access to task details
- Progress indicators for each plan

### Task Management
- Create new task plans with AI generation
- Specify time constraints (days or hours)
- View all task plans
- Mark subtasks as complete
- Delete task plans
- View detailed schedules

### Profile Management
- Update user name
- Upload profile avatar
- Configure preferences:
  - Maximum hours per day
  - Work days selection
- View current settings

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_API_URL` - Backend API Gateway URL
- `NEXT_PUBLIC_USER_POOL_ID` - AWS Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID` - AWS Cognito User Pool Client ID
- `NEXT_PUBLIC_AWS_REGION` - AWS region (e.g., us-east-1)

## Styling

The application uses TailwindCSS for styling with a custom configuration:

- Primary color palette (blue shades)
- Responsive design for mobile and desktop
- Custom component classes (buttons, inputs, cards)
- Dark mode support (optional)

## API Integration

The frontend communicates with the backend API using:

- `lib/api.js` - HTTP client with automatic token injection
- `lib/auth.js` - Authentication helper functions
- `context/AuthContext.jsx` - Global authentication state

All API requests automatically include the JWT token in the Authorization header.

## Routing

The application uses Next.js 14 App Router:

- `/` - Landing/redirect page
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Dashboard (protected)
- `/tasks` - Task list (protected)
- `/tasks/[taskId]` - Task detail (protected)
- `/profile` - User profile (protected)

Protected routes automatically redirect to `/login` if the user is not authenticated.

## Deployment Options

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### AWS Amplify
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t taskbreaker-frontend .
docker run -p 3000:3000 taskbreaker-frontend
```

### Static Export
```bash
npm run build
# Deploy the 'out' directory to any static hosting
```

## Troubleshooting

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is deployed and accessible

### Authentication Errors
- Verify Cognito User Pool IDs are correct
- Check that User Pool Client allows password auth
- Ensure tokens are being stored correctly

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18.x)

### Styling Issues
- Ensure Tailwind is processing correctly
- Check `tailwind.config.js` content paths
- Verify `globals.css` imports Tailwind directives

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Automatic code splitting by Next.js
- Image optimization with Next.js Image component
- API response caching
- Lazy loading of components
- Optimized bundle size with tree shaking

## Security

- JWT tokens stored in memory (not localStorage for XSS protection)
- HTTPS required in production
- Input validation on all forms
- XSS protection via React
- CSRF protection via SameSite cookies (if using cookies)
