# Login Redirect Loop - FIXED

## Problem
After entering credentials and clicking Sign In, users were immediately redirected back to the login page instead of being taken to the dashboard.

## Root Cause
The `useAuth()` hook was checking for an active session immediately after `router.push()` was called to redirect to the dashboard. Since the session wasn't fully available yet (due to async operations), the hook would think there was no session and redirect back to login, creating an infinite loop.

Timeline:
```
1. User clicks Sign In
2. API validates credentials and returns user data
3. login() function creates session via /api/sessions
4. login() calls router.push('/dashboard/user')
5. Component mounts in /dashboard/user
6. useAuth() runs useEffect and calls getCurrentUser()
7. getCurrentUser() tries to read session but it's not yet available
8. useAuth() gets null user
9. OLD CODE: Immediately redirects back to /auth/login
10. Infinite loop!
```

## Solution Implemented

### 1. Fixed useAuth.ts
Removed the automatic redirect logic that was triggering the loop. The hook now:
- Checks if there's an active session
- Sets the user if found
- Does NOT attempt to redirect back to login if no user is found
- This decision is left to page-level AuthGuard components

**Before:**
```typescript
if (!session) {
  const isProtectedRoute = pathname.startsWith('/dashboard')
  if (isProtectedRoute) {
    router.push('/auth/login')  // TRIGGERED REDIRECT LOOP!
  }
}
```

**After:**
```typescript
if (session) {
  setUser(session)
}
// No automatic redirect logic
```

### 2. Created AuthGuard Component
New component that wraps protected routes:
- Waits for `useAuth` to finish loading (`loading === false`)
- Only redirects to login if loading is done AND no user found
- Shows a loading spinner while checking auth
- Prevents redirect loops by waiting for full initialization

```typescript
if (loading) {
  return <LoadingSpinner />  // Wait for auth check to complete
}

if (!user) {
  router.push('/auth/login')  // Only redirect when loading is done
}

return children
```

### 3. Added AuthGuard to Protected Routes
Wrapped `/dashboard/user` and other protected pages with AuthGuard to ensure auth check happens safely after the page loads.

## New Login Flow

```
1. User enters email/password and clicks Sign In
   ↓
2. POST /api/auth/login validates credentials
   ↓
3. Returns user data (uid, email, name, phone, userType)
   ↓
4. useAuth.login() receives user data
   ↓
5. createSession() POSTs to /api/sessions
   ↓
6. /api/sessions creates session and sets cookies
   ↓
7. setUser() updates local state
   ↓
8. router.push('/dashboard/user')
   ↓
9. Page component mounts
   ↓
10. AuthGuard component runs
    ├─ Shows loading spinner
    ├─ Calls getCurrentUser() via useAuth
    ├─ Session is now available (cookies are set)
    ├─ getCurrentUser() finds session
    ├─ useAuth sets user state
    └─ Loading done, user found → render page
    ↓
11. Dashboard page shows!
```

## How to Test

### Test Login Flow
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/auth/login
3. Enter test credentials:
   - Email: test@example.com (from signup)
   - Password: TestPass123 (from signup)
4. Click Sign In
5. **Expected**: Should be redirected to /dashboard/user
6. **Expected**: Dashboard loads and shows bookings

### Verify No Redirect Loop
- Watch the browser console for messages like:
  - NO MESSAGE "[useAuth] No session found on protected route"
  - NO MESSAGE about redirects
  - Just normal loading and component render

### Check Session
Open browser DevTools and run:
```javascript
// Check if session is in cookies
document.cookie

// Check if user data is in localStorage
JSON.parse(localStorage.getItem('HGM_DATA_STORE'))

// Call the session endpoint
fetch('/api/auth/me').then(r => r.json()).then(console.log)
```

Expected response:
```json
{
  "userId": "local_1234567...",
  "email": "test@example.com",
  "name": "Test User",
  "phone": "1234567890",
  "userType": "customer",
  "sessionToken": "session_1234567...",
  "createdAt": "2024-01-01T12:00:00Z",
  "expiresAt": "2024-01-31T12:00:00Z"
}
```

## Files Changed

### Modified Files
- `hooks/useAuth.ts` - Removed redirect logic, fixed infinite loop
- `app/dashboard/user/page.tsx` - Added AuthGuard wrapper

### New Files
- `components/auth-guard.tsx` - Auth protection component

## What's Different Now

| Before | After |
|--------|-------|
| useAuth checks session and redirects | AuthGuard handles redirect on protected pages |
| Redirect logic triggered during navigation | Redirect only happens after page fully loads |
| Infinite loop if session not ready | Clean separation: navigation → load → auth check |
| All pages had same auth behavior | Each page controls its own auth requirements |

## Detailed Auth Guard Logic

```typescript
// Loading state: Show spinner
if (loading) {
  return <LoadingSpinner />
}

// Loading done but no user: Redirect to login
if (!user) {
  router.push('/auth/login')
  return null
}

// Loading done AND user found: Render page
return children
```

The key: Only check and redirect AFTER the first auth check is complete (`loading === false`).

## Common Scenarios

### Scenario 1: User logs in successfully
- ✅ Session created and available
- ✅ Cookies set properly
- ✅ AuthGuard finds user
- ✅ Dashboard renders
- ✅ NO redirect

### Scenario 2: Session expires
- User navigates to protected page
- AuthGuard calls getCurrentUser()
- getCurrentUser() returns null (session expired)
- AuthGuard redirects to login
- User sees login page

### Scenario 3: New user (no session)
- User tries to access /dashboard/user directly
- AuthGuard calls getCurrentUser()
- getCurrentUser() returns null (no session)
- AuthGuard redirects to login
- User sees login page

## Performance
- No extra API calls (uses existing session endpoints)
- Loading check is instant (uses cached user state)
- No spinning redirects or loading flicker

## Next Steps

1. Test login with valid credentials
2. Verify dashboard loads without redirect
3. Test logout and verify redirect to login
4. Test accessing protected routes without login
5. Apply AuthGuard to other protected routes as needed

## Troubleshooting

**Still redirected to login after signing in:**
- Check browser console for errors
- Check if /api/auth/me returns 401
- Verify cookies are being set (DevTools → Application → Cookies)
- Check if session file exists (.local-data/sessions.json)

**Stuck on loading spinner:**
- Check if useAuth hook is calling getCurrentUser()
- Check if /api/auth/me endpoint is responding
- Check browser console for errors

**Session expires immediately:**
- Check if session.expiresAt is being set correctly
- Verify cookie maxAge is set (30 days)
- Check if session is being saved properly

