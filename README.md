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
2. **Firestore Rules**: Database is secured to ensure users can only modify their own bookings and salon owners can only manage their own salons.
3. **API Validation**: Backend routes sanitize and validate incoming requests.

---

## 📄 License
MIT License - See LICENSE file for details.
