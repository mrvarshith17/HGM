# Firestore Setup Instructions

## Quick Setup (2 Steps)

### Step 1: Run the Setup Script
```bash
cd c:\Users\pundr\Downloads\build-with-manuals
node firestore-setup.js
```

This will:
- ✅ Create all required Firestore collections
- ✅ Verify the connection works
- ✅ Display the Security Rules you need to copy

### Step 2: Update Firestore Security Rules
1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select project: **hgm-app-40d28**
3. Navigate to: **Firestore Database** → **Rules** (top menu)
4. Clear the existing rules
5. Copy the rules from `firestore-rules.txt` in this directory
6. Paste them into the Rules editor
7. Click **Publish**

---

## Detailed Instructions

### Opening Firebase Console
1. Visit: https://console.firebase.google.com/
2. Sign in with your Google account
3. Select the "hgm-app-40d28" project
4. Click **Firestore Database** on the left sidebar

### If You Don't See Firestore Database
1. Click **+ Create Database** button
2. Choose **Start in production mode**
3. Select region (closest to your location)
4. Click **Enable**

### Updating Security Rules
1. Click the **Rules** tab at the top of Firestore console
2. Select all text (Ctrl+A) and delete
3. Paste the rules from `firestore-rules.txt`
4. Review the rules
5. Click **Publish** button (top right)
6. Wait for confirmation message

---

## What Each Rule Does

| Collection | Read | Write | Purpose |
|-----------|------|-------|---------|
| `chatRooms` | Auth ✓ | Auth ✓ | Chat room data |
| `messages` | Auth ✓ | Auth ✓ | Chat messages |
| `bookings` | Auth ✓ | Auth ✓ | Salon bookings |
| `reviews` | Auth ✓ | Auth ✓ | Booking reviews |
| `users` | Auth ✓ | Auth ✓ | User profiles |
| `salons` | Public ✓ | Auth ✓ | Salon listings |
| `staff` | Auth ✓ | Auth ✓ | Staff profiles |

---

## Testing After Setup

### Test 1: Run Diagnostics
```bash
node test-firebase-connection.js
```

Should show:
```
✓ Test read successful
✓ Test write successful
✓ Test cleanup successful
```

### Test 2: Test Chat in Browser
1. Start your Next.js app: `npm run dev`
2. Go to http://localhost:3000
3. Log in as a user
4. Make a booking
5. Click **"Start Chat"** button
6. You should see the chat room created

---

## Troubleshooting

### Error: "Database connection failed"
**Cause**: Firestore not ready or rules not updated
**Fix**: 
1. Verify Firestore Database exists in Firebase Console
2. Check Security Rules are published (see "Updating Security Rules" above)
3. Run `node firestore-setup.js` again

### Error: "Permission denied"
**Cause**: Security Rules are blocking access
**Fix**: 
1. Go to Firebase Console → Firestore → Rules
2. Make sure rules start with `allow read, write: if request.auth.uid != null;`
3. Click **Publish**

### Collections Don't Appear in Firestore
**This is normal** - collections appear automatically when the first document is added. After running `firestore-setup.js`, you should see them in the console.

### Still Getting Errors?
1. Share the output from `node test-firebase-connection.js`
2. Share any errors from the browser console (F12 → Console tab)
3. Check the Next.js terminal for server-side errors

---

## File Locations

- **Setup Script**: `firestore-setup.js` - Creates collections
- **Security Rules**: `firestore-rules.txt` - Copy these to Firebase Console
- **Test Tool**: `test-firebase-connection.js` - Verify connection works
- **Diagnostics**: `CHAT_AUTH_FIX.md` - Full documentation

---

## Next Steps

After setup:
1. ✅ Run `node firestore-setup.js`
2. ✅ Update Firestore Security Rules
3. ✅ Test with `node test-firebase-connection.js`
4. ✅ Restart your Next.js app
5. ✅ Try chat functionality again
