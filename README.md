# HGM - Hyderabad Grooming Marketplace

A full-stack salon discovery and appointment booking platform with **AI-powered hairstyle previews** and **Live Machine Learning Sentiment Analytics** for salon owners.

## 📂 Project Structure
```
.
├── ai-microservice/             # Machine Learning API (Python/FastAPI)
│   ├── main.py                  # FastAPI server for Sentiment Analysis
│   ├── salon_svm_model.pkl      # Trained Support Vector Machine (SVM) model
│   └── tfidf_vectorizer_svm.pkl # NLP Text Vectorizer
│
├── app/                         # Next.js App Router (Frontend & APIs)
│   ├── api/                     # Backend proxy & API routes 
│   │   ├── auth/                # Login, register, Google auth
│   │   ├── bookings/            # Appointment endpoints
│   │   ├── salon-sentiment/     # AI sentiment data aggregator
│   │   └── salons/              # Salon listings & reviews
│   ├── auth/                    # Auth UI pages
│   ├── dashboard/               # Salon Owner & User Dashboards
│   ├── hairstyle/               # AI Hairstyle preview pages
│   ├── profile/                 # User profiles
│   ├── salon/[id]/              # Salon detail pages
│   ├── search/                  # Salon discovery and filters
│   ├── layout.tsx               # Root application layout
│   └── page.tsx                 # Landing page
│
├── components/                  # React Components
│   ├── SentimentDashboard.tsx   # Live ML Analytics Dashboard (Recharts)
│   ├── hairstyle-preview.tsx    # Replicate AI preview widget
│   ├── navigation.tsx           # Global navbar
│   └── ui/                      # shadcn/ui components
│
├── hooks/                       # Custom React Hooks
│   └── useAuth.ts               # Authentication state manager
│
├── lib/                         # Core Utilities & Services
│   ├── firebase-admin.ts        # Firebase Admin SDK initialization
│   ├── db-salon-service.ts      # Database controllers
│   ├── rating-utils.ts          # Review calculation logic
│   └── utils.ts                 # Formatting helpers
│
├── routes/                      # Express Backend Routes (Alternative/Legacy)
├── server.js                    # Express server entry point
├── firebase-key.json            # Firebase service account (DO NOT COMMIT)
├── .env.local                   # Environment variables
└── package.json                 # Node.js dependencies
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and `pnpm`
- Python 3.9+ (For the AI Microservice)
- Firebase project with Firestore enabled
- Replicate API key (for hairstyle previews)
- Google Maps API key (for location autocomplete)

### 1. Environment Variables
Update `.env.local` with your credentials:

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

# API Keys
REPLICATE_API_TOKEN=your_replicate_api_key
GCP_API_KEY=your_google_maps_api_key

# Backend Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

### 2. Firebase Setup
Ensure your `firebase-key.json` is securely placed in the root directory and **added to `.gitignore`**. 

### 3. Install Dependencies

**Node Modules (Frontend/Backend):**
pnpm install

**Python Packages (AI Microservice):**
cd ai-microservice
pip install fastapi uvicorn scikit-learn nltk pandas

### 4. Run the Application (3 Terminals Required)

**Terminal 1: Start the Python AI Microservice**
cd ai-microservice
uvicorn main:app --reload --port 8000

**Terminal 2: Start the Next.js Application**
pnpm dev
*(Runs on http://localhost:3000)*

**Terminal 3: Start the Node.js Server (if using Express)**
node server.js
*(Runs on http://localhost:5000)*

---

## 🚢 Deployment Guide

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged into Firebase: `firebase login`
- Python microservice ready for deployment
- Environment variables configured

### Deployment Steps

#### Step 1: Update Firebase Project Reference
Update `firebase.json` with your Firebase project ID:
```json
{
  "projects": {
    "default": "salon-marketplace-b122a"
  }
}
```

#### Step 2: Build Next.js Application
```bash
pnpm build
```
This generates optimized production build in `.next/` directory.

#### Step 3: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```
**What it does:**
- Uploads your Next.js app to Firebase Hosting
- Generates SSL certificates automatically
- Available at: `https://salon-marketplace-b122a.web.app`

#### Step 4: Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```
**Important:** Current rules expire on **July 21, 2026**. Update permanent rules before expiration.

#### Step 5: Deploy Firestore Indexes (if needed)
```bash
firebase deploy --only firestore:indexes
```

#### Step 6: Deploy Python Microservice to Cloud Run
Deploy the AI sentiment analysis microservice:

```bash
cd ai-microservice

# Build Docker image
gcloud builds submit --tag gcr.io/salon-marketplace-b122a/hgm-ai-service

# Deploy to Cloud Run
gcloud run deploy hgm-ai-service \
  --image gcr.io/salon-marketplace-b122a/hgm-ai-service \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "PORT=8000"
```

#### Step 7: Update Environment Variables
Update `.env.production` with deployed URLs:
```env
# Firebase
FIREBASE_PROJECT_ID=salon-marketplace-b122a
GCP_SERVICE_ACCOUNT=<path-to-firebase-key.json>

# Deployed Services
NEXT_PUBLIC_AI_API_URL=https://hgm-ai-service-xxxxx.a.run.app
NEXT_PUBLIC_API_URL=https://salon-marketplace-b122a.web.app/api

# External APIs
REPLICATE_API_TOKEN=<your-replicate-key>
GCP_API_KEY=<your-google-maps-key>
```

#### Step 8: Deploy All at Once (Recommended)
```bash
firebase deploy
```
This deploys hosting, Firestore rules, and indexes in one command.

### Post-Deployment Verification
- ✅ Check deployment status: `firebase deploy:info`
- ✅ View logs: `firebase functions:log`
- ✅ Test frontend: Visit `https://salon-marketplace-b122a.web.app`
- ✅ Test AI service: `curl https://hgm-ai-service.run.app/health`

### Monitoring & Maintenance
- **Firebase Console**: https://console.firebase.google.com/project/salon-marketplace-b122a
- **Cloud Run Dashboard**: https://console.cloud.google.com/run
- **Firestore Backup**: Enable automatic daily backups in Firebase Console

---

## ✨ Features

### For Customers
- **Salon Discovery**: Search and filter salons by location, services, and ratings.
- **Detailed Profiles**: View salon information, services, reviews, and photos.
- **Appointment Booking**: Book appointments with preferred date/time and notes.
- **User Dashboard**: Track upcoming and past appointments.
- **AI Hairstyle Preview**: Preview hairstyles before visiting using Generative AI (Replicate).

### For Salon Owners
- **Salon Management**: Create and manage salon profiles.
- **Booking Dashboard**: View and manage customer appointments in real-time.
- **🤖 AI Sentiment Dashboard**: Live visual analytics (via Recharts) categorizing customer reviews into Positive/Negative sentiments using a custom-trained Support Vector Machine (SVM) model.

---

## 💾 Database Schema

### `users`
- `uid` (PK), `email`, `name`, `phone`, `userType` ('customer' | 'salon_owner')

### `salons`
- `salonId` (PK), `ownerId` (FK), `name`, `address`, `services`, `rating`

### `bookings`
- `bookingId` (PK), `userId` (FK), `salonId` (FK), `appointmentDate`, `appointmentTime`, `status`

### `reviews` (AI Integrated)
- `reviewId` (PK), `userId`, `salonId`, `rating`, `comment`
- **`sentiment`** (string: 'Positive' | 'Negative') - *[AI Generated Label]*

---

## 🛠 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** & TypeScript
- **Tailwind CSS** & shadcn/ui
- **Recharts** (Live data visualization)

### Backend & AI
- Node.js + Express
- Firebase Admin SDK & Firestore
- **Python, FastAPI, Uvicorn** (Machine Learning Microservice)
- **Scikit-Learn (LinearSVC) & NLTK** (Sentiment Analysis Engine)
- Replicate API (Image Generation)

---

## 🔒 Security Considerations
1. **Firebase Keys**: `firebase-key.json` and `.env.local` are explicitly ignored in `.gitignore` to prevent credential leaks.
2. **Firestore Rules**: 
   - ⚠️ **Current rules expire on July 21, 2026** (temporary public access for development)
   - **Before production**: Replace with proper auth-based rules ensuring users can only modify their own data
   - **Recommended production rules**:
     ```
     match /users/{userId} {
       allow read, write: if request.auth.uid == userId;
     }
     match /salons/{salonId} {
       allow read: if true;
       allow write: if request.auth.uid == resource.data.ownerId;
     }
     ```
3. **API Validation**: Backend routes sanitize and validate incoming requests.
4. **Environment Variables**: Keep all secrets in `.env.local` (never commit to repo).
5. **Service Account**: Rotate `firebase-key.json` credentials regularly for production deployments.

---

## 📄 License
MIT License - See LICENSE file for details.
