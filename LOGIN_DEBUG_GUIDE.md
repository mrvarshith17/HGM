# Login Redirect Issue - Debugging Guide

## Problem
After login succeeds, user is redirected back to login page instead of dashboard.

## Root Cause Analysis

The login flow should work like this:
```
1. User submits login form
2. POST /api/auth/login → Validates credentials
3. Creates session via POST /api/sessions
4. Redirects to /dashboard/user or /dashboard/owner
5. useAuth checks session via GET /api/auth/me
6. User is authenticated, page loads
```

But instead:
```
1. User submits login form
2. Credentials validated ✓
3. Session created ✓
4. Redirect happens ✓
5. GET /api/auth/me fails ✗
6. No session found → Redirect to /auth/login
```

## What to Check

### 1. Check Server Logs During Login

Start dev server and watch the logs:
```bash
npm run dev
```

Look for these log messages:

**During Login:**
```
[Sessions API] Creating session for userId: local_1234567890_abc123def
[Sessions API] Session saved successfully
[Sessions API] Cookies set, returning session
```

**When Accessing Dashboard:**
```
[Auth Me] userId: local_1234567890_abc123def, sessionToken: true, cookieSession: true
[Auth Me] Session found: true
```

### 2. Check If Cookies Are Set

Open DevTools (F12) → Application → Cookies

Look for:
- `userId` (should be something like `local_1234567890_abc123def`)
- `sessionToken` (should start with `session_`)
- `sessionData` (base64 encoded)

### 3. Check Session File Storage

The sessions are stored in `.local-data/sessions.json`

```bash
cat .local-data/sessions.json
```

You should see an entry like:
```json
{
  "userId": "local_1234567890_abc123def",
  "email": "test@example.com",
  "name": "Test User",
  "phone": "1234567890",
  "userType": "customer",
  "sessionToken": "session_1234567890_abc123def",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-31T00:00:00.000Z"
}
```

### 4. Check Network Tab

Open DevTools → Network tab

After clicking login, you should see:
1. `POST /api/auth/login` → 200 with user data
2. `POST /api/sessions` → 200 with session data
3. (Browser navigates to /dashboard/user)
4. `GET /api/auth/me` → 200 with session data

If any of these fail, that's where the issue is.

### 5. Test Session Endpoint Directly

Open DevTools → Console

After login (while cookies are set):
```javascript
fetch('/api/auth/me').then(r => r.json()).then(console.log)
```

Expected output:
```javascript
{
  userId: "local_1234567890_abc123def",
  email: "test@example.com",
  name: "Test User",
  phone: "1234567890",
  userType: "customer",
  sessionToken: "session_1234567890_abc123def",
  createdAt: "2024-01-01T00:00:00.000Z",
  expiresAt: "2024-01-31T00:00:00.000Z"
}
```

If you get `{error: "Not authenticated"}`, cookies weren't sent.

## Common Issues and Solutions

### Issue 1: No cookies in DevTools
**Cause:** Cookies not being set by POST /api/sessions
**Solution:** Check `/api/sessions` logs - look for "Cookies set" message
**Fix:** Ensure session is created before redirect (100ms delay added)

### Issue 2: Cookies present but /api/auth/me returns 401
**Cause:** Session file not created or corrupted
**Solution:** Check `.local-data/sessions.json` exists and has correct data
**Fix:** Verify `saveLocalSession()` in `/lib/local-session-store.ts` succeeds

### Issue 3: Session file shows wrong userId
**Cause:** userId mismatch between login response and session creation
**Solution:** Check login API returns correct uid
**Fix:** Compare uids in network tab POST /api/auth/login response

## Step-by-Step Debug Process

1. **Enable logging** (already done with recent changes)

2. **Test signup first**
   ```
   Go to /auth/register
   Sign up with: test@example.com, password: Test123
   Should redirect to /dashboard/user
   ```

3. **Check if signup session works**
   If signup works but login doesn't, issue is in login API

4. **Review console logs**
   Check server console for all [Sessions API] and [Auth Me] messages

5. **Check network timing**
   Ensure POST /api/sessions completes before redirect

6. **Verify session persistence**
   ```bash
   cat .local-data/sessions.json | jq
   ```

7. **Clear and retry**
   ```bash
   # Clear all data
   rm -rf .local-data/
   npm run dev
   # Try login again
   ```

## Testing Checklist

- [ ] Signup works and redirects correctly
- [ ] Session file created in `.local-data/sessions.json`
- [ ] Cookies visible in DevTools
- [ ] POST /api/sessions returns 200
- [ ] GET /api/auth/me returns 200
- [ ] Manual fetch test returns user data
- [ ] Login works on first attempt
- [ ] Login works after page refresh
- [ ] Logout clears cookies
- [ ] Cannot access /dashboard/user without login

## Performance Metrics

Monitor these values:
- POST /api/auth/login response time: should be <100ms
- POST /api/sessions response time: should be <50ms
- GET /api/auth/me response time: should be <50ms

If any endpoint is slow, it might cause redirect before cookies are set.

## Advanced Debugging

### Monitor All API Calls

Add this to useAuth hook temporarily:
```typescript
const login = useCallback(async (email: string, password: string) => {
  console.log("[useAuth] login() called with email:", email)
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    console.log("[useAuth] login() response status:", response.status)
    
    // ... rest of login logic
  } catch (error) {
    console.error("[useAuth] login() error:", error)
    throw error
  }
}, [router])
```

### Check Session in Browser Storage

```javascript
// Check all localStorage
localStorage.getItem('HGM_DATA_STORE')

// Check if user data is there
JSON.parse(localStorage.getItem('HGM_DATA_STORE')).users

// Check sessions file was written
fetch('/api/sessions?userId=local_...').then(r => r.json()).then(console.log)
```

## Files Involved

- `/hooks/useAuth.ts` - Main auth logic
- `/lib/db-session-service.ts` - Session API calls
- `/lib/local-session-store.ts` - Session file storage
- `/app/api/auth/login/route.ts` - Login endpoint
- `/app/api/auth/me/route.ts` - Session verification
- `/app/api/sessions/route.ts` - Session creation
- `.local-data/sessions.json` - Session persistence

## Next Steps

1. Run with debug logging enabled
2. Perform login and check console output
3. Review all log messages
4. Check what step is failing
5. Adjust session creation or cookie handling accordingly

If the issue persists after following this guide, check the network requests and server logs to identify exactly where the flow breaks.
