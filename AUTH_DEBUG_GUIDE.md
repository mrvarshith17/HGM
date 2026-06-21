# Authentication Debug Guide

## How Auth Flow Works Now

### Signup Flow
1. User fills registration form (name, email, phone, password, user type)
2. POST to `/api/auth/register`
3. Register route tries `adminAuth.createUser()` → throws config error
4. Catches error and uses local auth fallback:
   - Hashes password with salt using `hashPassword(password)`
   - Generates random UUID
   - Stores in `local-auth-store` for auth verification
   - Stores in `adminDb` (localStorage) for user data
5. Returns user data with uid

### Login Flow
1. User enters email and password
2. POST to `/api/auth/login`
3. Login route calls `findLocalUser()`:
   - Checks `local-auth-store` first (file-based on server)
   - Falls back to `adminDb.where('email', '==', email)` query
4. Verifies password using `verifyPassword()`
5. Returns user data with uid

## Testing Signup

### Step 1: Open Signup Page
```
http://localhost:3000/auth/register
```

### Step 2: Fill Form
- Name: Test User
- Email: test@example.com
- Phone: 1234567890
- Password: TestPass123
- User Type: customer

### Step 3: Check Server Logs
Look for:
```
[Register] Starting registration request
[Register] Received: { email: 'test@example.com', name: 'Test User', phone: '1234567890', userType: 'customer' }
[Register] Creating Firebase user: test@example.com
[Register] Firebase Auth error: Firebase Auth is not configured
[Register] Storing local auth user in Firestore: { uid: '...', email: 'test@example.com' }
[LocalStorage] Set users/...: { uid: '...', email: 'test@example.com', ... }
[Register] Registration successful: ...
```

### Step 4: Check Data Storage
In browser console:
```javascript
// View all stored data
JSON.parse(localStorage.getItem('HGM_DATA_STORE'))

// View just users
JSON.parse(localStorage.getItem('HGM_DATA_STORE')).users
```

In server file system:
```bash
# View local auth store
cat .local-data/auth-users.json
```

## Testing Login

### Step 1: Open Login Page
```
http://localhost:3000/auth/login
```

### Step 2: Enter Credentials
- Email: test@example.com
- Password: TestPass123

### Step 3: Check Server Logs
Look for:
```
POST /api/auth/login
[LocalStorage] Query: email == test@example.com
[Login] User found and password verified
[Login] Returning user data: { uid: '...', email: 'test@example.com', name: 'Test User' }
```

### Step 4: Check Result
After successful login, you should be redirected to dashboard showing:
- Your name and email
- Welcome message
- Access to chat, profile, bookings

## Common Issues and Solutions

### Issue 1: "Email already exists"
**Cause**: User already registered  
**Solution**: 
1. Use different email for new signup
2. OR clear localStorage: `localStorage.removeItem('HGM_DATA_STORE')`
3. OR delete `.local-data/auth-users.json`

### Issue 2: "Invalid email or password"
**Cause**: User not found or password wrong  
**Solutions**:
1. Check email is spelled exactly as registered
2. Check password is correct (case-sensitive)
3. Make sure signup completed successfully

### Issue 3: Stuck on signup form
**Cause**: Network error or validation issue  
**Solutions**:
1. Check browser console for errors (F12 → Console)
2. Check server logs in terminal
3. Verify form validation passed
4. Try clear browser cache (Ctrl+Shift+Delete)

### Issue 4: Login page not working
**Cause**: Data not stored properly  
**Solutions**:
1. Verify user created in signup step
2. Check `.local-data/auth-users.json` exists
3. Check localStorage has data: `localStorage.getItem('HGM_DATA_STORE')`

## Inspecting Data Storage

### Option 1: Browser DevTools
```javascript
// Open DevTools → Application → LocalStorage
// Key: HGM_DATA_STORE
// Contains all user, chat, booking data

// Or in Console:
const data = JSON.parse(localStorage.getItem('HGM_DATA_STORE'))
console.log('Users:', data.users)
console.log('Auth Users:', data.authUsers)
console.log('Messages:', data.messages)
```

### Option 2: Server Files
```bash
# View auth users (server-side file storage)
ls .local-data/
cat .local-data/auth-users.json

# Format prettily:
cat .local-data/auth-users.json | jq .
```

### Option 3: Database Query Simulation
```bash
# In Node REPL:
node
> const fs = require('fs')
> const auth = JSON.parse(fs.readFileSync('./.local-data/auth-users.json', 'utf8'))
> auth.find(u => u.email === 'test@example.com')
```

## Network Request Inspection

### Step 1: Open DevTools (F12)
### Step 2: Go to Network tab
### Step 3: Try Signup/Login
### Step 4: Look for requests:

**Signup Request**:
- URL: `/api/auth/register`
- Method: POST
- Body: `{ email, password, name, phone, userType }`
- Response: `{ uid, email, name, phone, userType }`

**Login Request**:
- URL: `/api/auth/login`
- Method: POST
- Body: `{ email, password }`
- Response: `{ uid, email, name, phone, userType, profilePicture }`

**Check Response Tab**:
- Should see user data returned
- No error field (unless login failed)

## Debugging Password Verification

### Step 1: Capture stored password hash
```javascript
const data = JSON.parse(localStorage.getItem('HGM_DATA_STORE'))
const user = Object.values(data.users)[0]
console.log('Stored hash:', user.passwordHash)
console.log('Stored salt:', user.passwordSalt)
```

### Step 2: Check password hashing
In `/lib/password.ts`:
- `hashPassword(password)` - returns `{ hash, salt }`
- `verifyPassword(password, hash, salt)` - returns `true/false`

### Step 3: Manual verification test
```javascript
// In login route, add logs:
console.log('Password:', password)
console.log('Stored hash:', localUser.passwordHash)
console.log('Stored salt:', localUser.passwordSalt)
console.log('Verify result:', verifyPassword(password, localUser.passwordHash, localUser.passwordSalt))
```

## Reset Everything

To start fresh:
```bash
# Clear browser data
# DevTools → Application → Clear all

# OR in Console:
localStorage.clear()

# OR on server:
rm -rf .local-data/

# Then restart dev server
npm run dev
```

## Expected Files After First Signup

After creating first user, you should have:
1. `.local-data/auth-users.json` - File with auth records
2. localStorage with `HGM_DATA_STORE` key
3. User record in both locations

## Monitoring Active Sessions

In browser console:
```javascript
// Check current session
localStorage.getItem('user-session')

// Check all data
const data = JSON.parse(localStorage.getItem('HGM_DATA_STORE'))
Object.keys(data)

// Count users
Object.keys(data.users).length
```

## Server-Side Logging

The auth routes log everything. Look for:
- `[Register]` - Signup logs
- `[Login]` - Login logs
- `[LocalStorage]` - Data operation logs
- `[Firebase Admin]` - Fallback logs

Enable more details by checking:
```bash
# In terminal running npm run dev
# Watch for above prefixes
```

## Performance Checks

### Check password hashing time:
```javascript
console.time('hash')
const result = hashPassword('TestPassword123')
console.timeEnd('hash')
// Should be < 100ms
```

### Check query time:
```javascript
console.time('query')
const snapshot = await adminDb
  .collection('users')
  .where('email', '==', 'test@example.com')
  .get()
console.timeEnd('query')
// Should be instant (localStorage is in-memory)
```

## Troubleshooting Summary

| Error | Check | Solution |
|-------|-------|----------|
| Email exists | Signup form | Use new email or clear data |
| Invalid password | Login form | Verify password spelling |
| User not found | Both | Signup first, then login |
| 500 error | Server logs | Check `[Register]` or `[Login]` logs |
| Stuck form | Network | Check DevTools Network tab |
| Lost session | Browser | Check localStorage not cleared |
| Data missing | Both | Check `.local-data/auth-users.json` |
