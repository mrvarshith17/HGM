# Deploy Firestore Rules with Firebase CLI

This guide shows how to deploy Firestore security rules using the Firebase CLI - the professional approach for version control and automation.

## Prerequisites

- Node.js installed (comes with npm)
- Firebase account with project `hgm-app-40d28`
- Admin or editor access to the Firebase project

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

## Step 2: Authenticate with Google

```bash
firebase login
```

This opens your browser to authenticate. Sign in with your Google account that has access to the Firebase project.

## Step 3: Initialize Firebase Project (If Not Already Done)

Navigate to your project directory:
```bash
cd c:\Users\pundr\Downloads\build-with-manuals
```

Initialize Firebase:
```bash
firebase init firestore
```

When prompted:
- **Project**: Select `hgm-app-40d28` from the list
- **Firestore file path**: Press Enter to use `firestore.rules` (already created)
- **Indexes file path**: Press Enter to use `firestore.indexes.json` (already created)

This creates/updates:
- ✓ `firebase.json` - Configuration file
- ✓ `firestore.rules` - Security rules (already created)
- ✓ `firestore.indexes.json` - Index configuration (already created)

## Step 4: Deploy the Rules

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released new rules to cloud.firestore

Deploy complete!
```

## Verification

Check that rules were deployed:

```bash
firebase firestore:indexes
firebase rules:list --rules-file firestore.rules
```

Or go to Firebase Console → Firestore Database → Rules tab to see the deployed rules.

## Troubleshooting

### Error: "Cannot find project"
```bash
firebase projects:list
firebase init firestore
```

Then select your project from the list.

### Error: "Permission denied"
- You need to be logged in: `firebase login`
- Your account needs access to the project

### Rules won't deploy
1. Check syntax: `firebase emulators:start --only firestore`
2. Verify `firestore.rules` file exists
3. Try: `firebase deploy --only firestore:rules --force`

## File Structure

After setup, your project has:

```
build-with-manuals/
├── firebase.json           ← Configuration
├── firestore.rules         ← Security rules (this file)
├── firestore.indexes.json  ← Database indexes
└── [rest of project files]
```

## Updating Rules in the Future

1. Edit `firestore.rules` file
2. Run: `firebase deploy --only firestore:rules`
3. Done! No need to use web console

## What These Rules Do

| Collection | Read | Write | Purpose |
|-----------|------|-------|---------|
| `chatRooms` | Authenticated users | Authenticated users | Chat room data |
| `messages` | Authenticated users | Authenticated users | Chat messages |
| `bookings` | Authenticated users | Authenticated users | Salon bookings |
| `reviews` | Authenticated users | Authenticated users | Booking reviews |
| `users` | Authenticated users | Authenticated users | User profiles |
| `salons` | Everyone | Authenticated users | Salon listings (public read) |
| `staff` | Authenticated users | Authenticated users | Staff profiles |

## Quick Deploy Script

Create `deploy-rules.sh` (macOS/Linux) or `deploy-rules.bat` (Windows):

**Windows (deploy-rules.bat):**
```batch
@echo off
cd /d "%~dp0"
echo Deploying Firestore rules...
firebase deploy --only firestore:rules
if %errorlevel% equ 0 (
    echo ✓ Rules deployed successfully!
) else (
    echo ✗ Deployment failed
)
pause
```

**macOS/Linux (deploy-rules.sh):**
```bash
#!/bin/bash
cd "$(dirname "$0")"
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules
```

Make executable:
```bash
chmod +x deploy-rules.sh
```

Then deploy with:
```bash
./deploy-rules.sh
```

## Next Steps

1. ✅ Run: `firebase login`
2. ✅ Run: `firebase init firestore` 
3. ✅ Run: `firebase deploy --only firestore:rules`
4. ✅ Restart your Next.js app: `npm run dev`
5. ✅ Test chat functionality

Done! Your Firestore rules are now professionally managed with version control. 🚀
