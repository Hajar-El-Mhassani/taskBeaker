# Authentication Persistence Fix

## Issue
When refreshing the tasks page, users were seeing "No task plans yet" even though they had tasks, because the authentication tokens were being lost.

## Root Cause
The app was using `sessionStorage` to store authentication tokens. `sessionStorage` has limitations:
- Clears when the browser tab is closed
- Can be cleared on page refresh in some browsers
- Not persistent across browser sessions

## Solution
Changed from `sessionStorage` to `localStorage` for token storage.

### Differences:
- **sessionStorage**: Temporary, cleared when tab closes
- **localStorage**: Persistent, survives page refreshes and browser restarts

## Files Modified

`frontend/src/context/AuthContext.jsx`
- Changed all `sessionStorage` calls to `localStorage`
- Updated in 4 locations:
  1. `loadUser()` - Loading tokens on app start
  2. `signup()` - Storing tokens after signup
  3. `login()` - Storing tokens after login
  4. `logout()` - Clearing tokens on logout

## Testing

After this fix:
1. Log in to the app
2. Navigate to tasks page
3. Refresh the page (F5)
4. ✅ Tasks should still be visible
5. Close browser completely
6. Reopen and go to the app
7. ✅ Should still be logged in

## Security Note

`localStorage` persists data indefinitely until explicitly cleared. This is standard for web apps, but users should:
- Use the logout button when done
- Not use the app on shared/public computers
- Clear browser data if using a public computer

## Deploy

```bash
cd frontend
git add .
git commit -m "Fix auth persistence by using localStorage"
git push
```

Amplify will auto-deploy the changes.
