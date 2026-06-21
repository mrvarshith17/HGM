# Authentication & Database Fixes

## Issues Fixed

### 1. Signup Error: "Cannot read properties of null (reading 'createUser')"
**Root Cause:** `adminAuth` was null when Firebase credentials were missing  
**Solution:** Created a mock `adminAuth` object with full authentication API implementation

### 2. Login Error: "limit is not a function"
**Root Cause:** Mock `adminDb` didn't support method chaining for Firestore queries  
**Solution:** Implemented proper query builder with chainable `.where()` and `.limit()` methods

## What's Fixed

### adminAuth Mock API
```typescript
adminAuth.createUser({
  email: string,
  password: string,
  displayName: string
})
// Returns: { uid, email, displayName }

adminAuth.getUser(uid: string)
// Returns: { uid, email, displayName }

adminAuth.getUserByEmail(email: string)
// Returns: { uid, email, displayName }

adminAuth.updateUser(uid: string, updates: any)
// Updates user data

adminAuth.deleteUser(uid: string)
// Deletes a user
```

### adminDb Mock API
Full Firestore-compatible API with support for:

```typescript
// Create/Update documents
adminDb.collection('users').doc('userId').set(data)
adminDb.collection('users').doc('userId').update(data)

// Query with method chaining
adminDb.collection('users')
  .where('email', '==', email)
  .limit(1)
  .get()

// Query operators supported:
- '==' : equal to
- '<'  : less than
- '>'  : greater than
- '<=' : less than or equal
- '>=' : greater than or equal
- '!=' : not equal
- 'in' : value in array
- 'array-contains' : array contains value

// Get all documents
adminDb.collection('users').get()

// Add new document
adminDb.collection('users').add(data)
```

## How It Works

### Without Firebase Credentials
1. **adminAuth** - Uses `local-auth-store` for user management
2. **adminDb** - Uses `local-data-store` for data persistence
3. All data stored in browser localStorage

### With Firebase Credentials
1. **adminAuth** - Uses actual Firebase Admin Auth
2. **adminDb** - Uses actual Firestore
3. Seamless upgrade without code changes

## Testing

### Test Login Flow
1. Navigate to `/auth/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Expected: Successful login (creates local user)

### Test Signup Flow
1. Navigate to `/auth/register`
2. Fill form with:
   - Name: `Test User`
   - Email: `newuser@example.com`
   - Phone: `1234567890`
   - Password: `password123`
   - User Type: `customer`
3. Expected: Successful registration (stores user in localStorage)

### Test Query Operations
The login endpoint tests these operations:
```typescript
// Finds user by email (uses .where().limit().get())
const snapshot = await adminDb
  .collection('users')
  .where('email', '==', email)
  .limit(1)
  .get()
```

## Data Storage

### User Data Structure (localStorage)
```json
{
  "uid": "user_id_here",
  "email": "user@example.com",
  "name": "User Name",
  "phone": "1234567890",
  "userType": "customer|salon_owner",
  "authProvider": "local|firebase",
  "passwordHash": "hashed_password",
  "passwordSalt": "salt",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Debugging

### Check if using localStorage fallback
```javascript
// In browser console
const isLocal = localStorage.getItem('HGM_DATA_STORE') !== null
console.log('Using localStorage:', isLocal)
```

### View all stored users
```javascript
// In browser console
const store = localStorage.getItem('HGM_DATA_STORE')
const data = JSON.parse(store || '{}')
console.log('Users:', data.users)
```

### Clear all data
```javascript
// In browser console
localStorage.removeItem('HGM_DATA_STORE')
console.log('All data cleared')
```

## Migration to Firebase

When you add Firebase credentials:

1. Set environment variables:
   ```
   GCP_SERVICE_ACCOUNT={"type": "service_account", ...}
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```

2. The code automatically detects and switches to Firebase
3. No code changes needed - fully backward compatible
4. Existing localStorage data remains available as fallback

## Known Limitations

### localStorage Fallback
- Maximum ~5-10MB storage per domain
- Data persists until browser cache is cleared
- No cross-device synchronization
- No automatic backups

### Best For
- Development and testing
- Small-scale applications
- Single-user/browser scenarios
- Demos and prototypes

### When to Switch to Firebase/Neon/Supabase
- Multiple users/devices
- Production deployments
- Data backup needs
- Scale beyond 5-10MB
- Shared data across browsers

## Support

For issues with:
- **Auth errors**: Check browser console for specific error codes
- **Data not persisting**: Clear browser cache and localStorage
- **Firebase upgrade**: See `LOCALSTORAGE_MIGRATION.md` for upgrade guide
