# 🚀 HGM Deployment Guide

This guide explains the complete deployment process for the HGM Salon Marketplace. It's split into **automated steps (already done)** and **manual steps (you must do)**.

---

## ✅ What Has Been Automated (Already Done)

The following preparation work has been completed:

1. ✅ **Next.js Build** - Production build created in `.next/` directory
2. ✅ **Dockerfile Created** - Docker configuration ready for Python microservice
3. ✅ **requirements.txt** - Python dependencies specified
4. ✅ **Deployment Scripts** - Bash and PowerShell scripts ready
5. ✅ **Firebase Configuration** - firebase.json updated with correct project ID
6. ✅ **Firestore Rules** - Security rules prepared with temporary public access

---

## 🔴 What YOU Must Do Manually

The following steps **require your personal Google account access** and cannot be automated:

### Phase 1: Account Setup & Authentication (⏱️ ~10 minutes)

#### 1a. Install Required Tools

**Option 1: Windows (Recommended for you)**
```powershell
# Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install-sdk#windows
# Run the installer and follow prompts

# Verify installation
gcloud --version
firebase --version
```

**Option 2: Any OS**
```bash
# Install Google Cloud SDK (macOS/Linux/Windows)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install Firebase CLI (global)
npm install -g firebase-tools
```

#### 1b. Authenticate with Firebase

```bash
firebase login
# Browser will open asking you to sign in with your Google account
# Authorize Firebase CLI to access your account
```

#### 1c. Authenticate with Google Cloud

```bash
gcloud auth login
# Browser will open asking you to sign in with your Google account
# Authorize gcloud CLI to access your account

# Set the default project
gcloud config set project salon-marketplace-b122a
```

---

### Phase 2: Verify Firestore Database (⏱️ ~5 minutes)

**CRITICAL:** The app requires a Firestore database instance in the project.

1. Go to: https://console.firebase.google.com
2. Select project: **salon-marketplace-b122a**
3. Go to: **Firestore Database** (left sidebar)
4. Check if database exists:
   - ✅ If you see "Production", "Development", or "Testing" database → **Continue**
   - ❌ If you see "Create database" button → **Click it and create** (use "Production" mode)

---

### Phase 3: Enable Billing (⏱️ ~5 minutes)

Google Cloud Run requires billing to be enabled (though you get free tier usage):

1. Go to: https://console.cloud.google.com/billing
2. Create a billing account or link existing one
3. Enable billing for project **salon-marketplace-b122a**

> ℹ️ **Free tier includes:**
> - 100+ Cloud Run invocations per day
> - 360,000 Firestore document reads/day
> - 60GB Firestore storage

---

### Phase 4: Deploy Frontend to Firebase Hosting (⏱️ ~5 minutes)

**For Windows (PowerShell):**
```powershell
cd c:\Users\pundr\Downloads\build-with-manuals
.\deploy-hosting.ps1
```

**For Mac/Linux (Bash):**
```bash
cd ~/path/to/build-with-manuals
bash deploy-hosting.sh
```

**What it does:**
- ✅ Uploads Next.js build to Firebase Hosting
- ✅ Deploys Firestore security rules
- ✅ Configures automatic HTTPS SSL
- ✅ Sets up rewrites for Next.js routing

**Result:**
- 🌍 App available at: `https://salon-marketplace-b122a.web.app`
- ⏱️ Takes ~2-5 minutes

---

### Phase 5: Deploy Python Microservice to Cloud Run (⏱️ ~10 minutes)

**For Windows (PowerShell):**
```powershell
cd c:\Users\pundr\Downloads\build-with-manuals
.\deploy-microservice.ps1
```

**For Mac/Linux (Bash):**
```bash
cd ~/path/to/build-with-manuals
bash deploy-microservice.sh
```

**What it does:**
- ✅ Builds Docker image from Python code
- ✅ Uploads image to Google Container Registry (GCR)
- ✅ Deploys service to Cloud Run
- ✅ Enables public access (no authentication required)

**Result:**
- 📊 Service URL will be printed (e.g., `https://hgm-ai-service-abc123.run.app`)
- Copy this URL for environment variables
- ⏱️ Takes ~5-10 minutes

---

### Phase 6: Update Environment Variables (⏱️ ~2 minutes)

Create `.env.production` file in project root:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=salon-marketplace-b122a
GCP_SERVICE_ACCOUNT=./firebase-key.json

# Deployed URLs
NEXT_PUBLIC_API_URL=https://salon-marketplace-b122a.web.app/api
NEXT_PUBLIC_AI_API_URL=https://hgm-ai-service-XXXXX.run.app

# API Keys (from Phase 5 deployment)
REPLICATE_API_TOKEN=your_replicate_api_key
GCP_API_KEY=your_google_maps_api_key

# Node Environment
NODE_ENV=production
```

Replace `https://hgm-ai-service-XXXXX.run.app` with the actual URL from Phase 5.

---

### Phase 7: Test Deployed Application (⏱️ ~5 minutes)

1. **Test Frontend:**
   ```
   Visit: https://salon-marketplace-b122a.web.app
   - Should load landing page
   - Click "Register" → Create test account
   - Should work without errors
   ```

2. **Test Backend API:**
   ```bash
   # Test registration API
   curl -X POST https://salon-marketplace-b122a.web.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@deployed.com",
       "password": "Test123!",
       "name": "Test User",
       "phone": "1234567890",
       "userType": "customer"
     }'
   ```

3. **Test AI Microservice:**
   ```bash
   # Get Cloud Run URL from Phase 5 deployment
   curl -X POST https://hgm-ai-service-XXXXX.run.app/sentiment \
     -H "Content-Type: application/json" \
     -d '{
       "text": "This salon was amazing! Great service."
     }'
   # Should return: {"sentiment": "Positive"}
   ```

---

## 📊 Post-Deployment Monitoring

### View Logs

**Firebase Hosting:**
```bash
firebase hosting:log --lines 100
```

**Cloud Run:**
```bash
gcloud run logs read hgm-ai-service --region asia-south1 --limit 50
```

**Firestore:**
- Go to: https://console.firebase.google.com/project/salon-marketplace-b122a/firestore
- View real-time read/write activity

### Monitor Costs

- Google Cloud Billing: https://console.cloud.google.com/billing
- Estimated monthly cost: $0-5 (with free tier)

### Check Deployments

**Firebase:**
```bash
firebase deploy:info
firebase hosting:list
```

**Cloud Run:**
```bash
gcloud run services list --region asia-south1
gcloud run services describe hgm-ai-service --region asia-south1
```

---

## ⚠️ Critical Reminders

### 1. Firestore Rules Expiration ⏰

**Current rules expire on: July 21, 2026**

Before expiration, update permanent rules:

```bash
# Edit firestore.rules with proper auth-based security
firebase deploy --only firestore:rules
```

### 2. Keep Firebase Credentials Secure 🔐

- ✅ `firebase-key.json` is in `.gitignore` (never committed)
- ✅ Use environment variables for deployment secrets
- ✅ Rotate credentials regularly
- ❌ Never share `firebase-key.json` publicly

### 3. Monitor Firestore Usage 📈

Free tier includes:
- 50,000 reads/day
- 20,000 writes/day

Check usage at: https://console.firebase.google.com/project/salon-marketplace-b122a/usage/firestore

### 4. Enable Automatic Backups 💾

1. Go to Firebase Console
2. Firestore Database → Backups
3. Enable scheduled daily backups

---

## 🔧 Troubleshooting

### Issue: "Firebase project not found"
```bash
firebase projects:list
# If salon-marketplace-b122a not shown, update firebase.json
```

### Issue: "Cloud Run deployment times out"
```bash
# Check Docker build logs
gcloud builds list
gcloud builds log BUILD_ID
```

### Issue: "Firestore NOT_FOUND errors"
```bash
# Verify database exists
gcloud firestore databases list --project salon-marketplace-b122a
# If empty, create database in Firebase Console
```

### Issue: "CORS errors when calling AI service"
- AI service is already configured with `allow_origins=["*"]`
- Check that `NEXT_PUBLIC_AI_API_URL` is set correctly

---

## 📞 Support Commands

Get help from Cloud SDKs:

```bash
# Firebase help
firebase help
firebase deploy --help

# Google Cloud help
gcloud help
gcloud run deploy --help
gcloud builds submit --help
```

---

## ✅ Deployment Checklist

- [ ] Firebase CLI installed and authenticated
- [ ] Google Cloud SDK installed and authenticated
- [ ] Firestore database created (Production mode)
- [ ] Billing enabled on Google Cloud
- [ ] Run `deploy-hosting.ps1` (Windows) or `deploy-hosting.sh` (Mac/Linux)
- [ ] Run `deploy-microservice.ps1` (Windows) or `deploy-microservice.sh` (Mac/Linux)
- [ ] Update `.env.production` with URLs from Phase 5
- [ ] Test frontend at `https://salon-marketplace-b122a.web.app`
- [ ] Test backend API with registration request
- [ ] Test AI microservice with sentiment analysis
- [ ] Configure automatic Firestore backups
- [ ] Set calendar reminder for July 21, 2026 (Firestore rules expiration)

---

## 🎉 You're Done!

Your HGM Salon Marketplace is now **live and accessible worldwide** at:

🌍 **https://salon-marketplace-b122a.web.app**

---

**Created:** June 21, 2026  
**Project:** HGM - Hyderabad Grooming Marketplace  
**Tech Stack:** Next.js 16 + Firebase + Cloud Run + Firestore
