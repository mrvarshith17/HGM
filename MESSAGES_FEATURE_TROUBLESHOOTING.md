# Chat/Messages Feature - Troubleshooting Guide

## Issue: Clicking "Messages" redirects to login page

This was caused by a mismatch in how user IDs are stored in localStorage.

## Fix Applied ✅

Updated the authentication and chat pages to:

1. **Store userId consistently** - Now stored in localStorage when user logs in
2. **Fallback extraction** - Chat pages check multiple storage keys:
   - First: `userId` (direct key)
   - Second: Extract from `userData` JSON
   - Third: Use `authToken` as fallback
3. **Proper cleanup** - Logout now removes `userId` and `salonId`

## Files Modified

### `hooks/useAuth.ts`
- Added `localStorage.setItem('userId', result.uid)` in all auth methods (register, login, Google)
- Added cleanup of `userId` and `salonId` in logout
- Ensures consistent storage across all auth flows

### `app/dashboard/owner/chat/page.tsx`
- Improved authentication check to extract salonId from userData
- Fallback logic if stored salonId is not found
- Redirects to login only as last resort

### `app/dashboard/user/chat/page.tsx`
- Already had improved authentication check
- Extracts userId from userData if not found in direct storage

## How to Test

### Step 1: Clear Storage (Fresh Start)
```javascript
// Open browser DevTools (F12) → Console tab, then run:
localStorage.clear()
```

### Step 2: Register/Login
- Go to http://localhost:3000/auth/register (or login if you have an account)
- Complete registration as either customer or salon owner
- Should redirect to appropriate page (/search for customers, /dashboard/salon for owners)

### Step 3: Verify Storage
```javascript
// In DevTools Console, check what's stored:
localStorage.getItem('userId')        // Should show user ID
localStorage.getItem('userData')      // Should show JSON object with uid
localStorage.getItem('authToken')     // Should match userId
```

### Step 4: Test Messages Link
- Look for "💬 Messages" in the top navigation (should only show if logged in)
- Click on "💬 Messages"
- Should load chat page with list of conversations (not redirect to login)

## Expected Behavior

### For Customers
```
Navigation should show:
- Salons
- ✨ Hairstyles
- My Bookings
- 💬 Messages  ← Click this

Click Messages → /dashboard/user/chat (loads chat with salons)
```

### For Salon Owners
```
Navigation should show:
- Dashboard
- My Bookings
- 👥 Staff
- 💬 Messages  ← Click this
- Create Salon

Click Messages → /dashboard/owner/chat (loads chat with customers)
```

## If Still Getting Redirected to Login

### Check 1: Verify You're Logged In
```javascript
// DevTools Console:
const user = localStorage.getItem('userData')
console.log(user ? "Logged in" : "Not logged in")
```

### Check 2: Verify userId is Stored
```javascript
// DevTools Console:
console.log("userId:", localStorage.getItem('userId'))
console.log("authToken:", localStorage.getItem('authToken'))
console.log("userData:", localStorage.getItem('userData'))
// All three should have values
```

### Check 3: Check Browser Console for Errors
- Open DevTools (F12) → Console tab
- Look for red error messages
- Common errors:
  - "Failed to parse userData" → Storage corruption, clear and re-login
  - Network errors → Backend not responding

### Check 4: Verify Backend is Running
```bash
# In a terminal:
npm run dev

# You should see output like:
# ▲ Next.js 16.2.6
# - Local: http://localhost:3000
```

## Quick Fix Checklist

- [ ] Stop dev server: `Ctrl+C`
- [ ] Clear browser cache: `Ctrl+Shift+Delete`
- [ ] Start dev server: `npm run dev`
- [ ] Open in fresh browser tab: `http://localhost:3000`
- [ ] Clear localStorage: `localStorage.clear()` in DevTools
- [ ] Register/login fresh
- [ ] Test Messages link

## What Was Fixed

### Before (Broken)
```
1. User logs in
2. userData stored (with uid)
3. userId NOT stored separately
4. User clicks Messages
5. Chat page checks for 'userId' key
6. Not found → redirects to login ❌
```

### After (Fixed)
```
1. User logs in
2. userData stored (with uid)
3. userId ALSO stored in localStorage
4. User clicks Messages
5. Chat page checks for 'userId' key
6. Found! → loads chat page ✅

If userId not found:
7. Falls back to extract from userData
8. Or falls back to authToken
9. Always finds a valid ID
```

## Manual Testing Script

```javascript
// Run this in DevTools Console to test:

// Test 1: Check localStorage structure
console.log("=== Local Storage ===")
console.log("authToken:", localStorage.getItem('authToken'))
console.log("userId:", localStorage.getItem('userId'))
console.log("userData:", JSON.parse(localStorage.getItem('userData') || '{}'))

// Test 2: Verify IDs match
const userData = JSON.parse(localStorage.getItem('userData') || '{}')
const userId = localStorage.getItem('userId')
const authToken = localStorage.getItem('authToken')
console.log("=== ID Consistency ===")
console.log("userData.uid === userId:", userData.uid === userId)
console.log("userData.uid === authToken:", userData.uid === authToken)
console.log("All IDs match:", userData.uid === userId && userId === authToken)

// Test 3: Check user type
console.log("=== User Type ===")
console.log("userType:", localStorage.getItem('userType'))
console.log("Is customer:", localStorage.getItem('userType') === 'customer')
console.log("Is salon owner:", localStorage.getItem('userType') === 'salon_owner')
```

## Browser DevTools Console Tips

### Open DevTools
- Windows/Linux: `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

### View localStorage
```javascript
// See all keys
Object.keys(localStorage)

// See all values
Object.entries(localStorage).map(([k,v]) => ({key: k, value: v}))

// See specific value
localStorage.getItem('userId')

// Set a test value
localStorage.setItem('test', 'hello')

// Remove a value
localStorage.removeItem('test')

// Clear all
localStorage.clear()
```

## Support

If issues persist:

1. **Check Network Tab** (DevTools → Network)
   - Verify API calls are succeeding (status 200)
   - Check for CORS errors

2. **Check Console for Errors** (DevTools → Console)
   - Copy any red error messages
   - Look for "Failed to fetch" messages

3. **Verify Backend Status**
   - Check terminal where you ran `npm run dev`
   - Look for build errors or crashes

4. **Try Incognito Mode**
   - Open in private/incognito window
   - Fresh start without cache issues

---

**Status**: ✅ Fixed  
**Test**: After logging in, check DevTools Console and verify `localStorage.getItem('userId')` returns a value.
