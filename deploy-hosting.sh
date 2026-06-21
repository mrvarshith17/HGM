#!/bin/bash

# ============================================================================
# HGM Deployment Script - Firebase Hosting & Firestore
# ============================================================================
# This script deploys the Next.js frontend and Firestore configuration
# Run this from the project root directory

set -e  # Exit on error

echo "🚀 Starting HGM Deployment to Firebase Hosting..."
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Step 1: Build Next.js
echo "📦 Step 1: Building Next.js application..."
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed"
    exit 1
fi
echo "✅ Next.js build successful"
echo ""

# Step 2: Verify firebase project
echo "🔍 Step 2: Verifying Firebase project..."
FIREBASE_PROJECT=$(grep '"default"' firebase.json | grep -oP ':\s*"\K[^"]+')
echo "Project ID: $FIREBASE_PROJECT"

# Step 3: Deploy to Firebase Hosting
echo "🌐 Step 3: Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "❌ Firebase Hosting deployment failed"
    exit 1
fi
echo "✅ Firebase Hosting deployment successful"
echo ""

# Step 4: Deploy Firestore Rules
echo "🔐 Step 4: Deploying Firestore Rules..."
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo "❌ Firestore rules deployment failed"
    exit 1
fi
echo "✅ Firestore rules deployment successful"
echo ""

# Step 5: Deploy Firestore Indexes (if any)
echo "📑 Step 5: Deploying Firestore Indexes..."
firebase deploy --only firestore:indexes
if [ $? -ne 0 ]; then
    echo "⚠️  Firestore indexes deployment had issues (may be normal)"
fi
echo "✅ Firestore indexes deployment checked"
echo ""

# Success message
echo "✅ ============================================================================"
echo "✅ Deployment Complete!"
echo "✅ ============================================================================"
echo ""
echo "🌍 Your app is live at: https://$FIREBASE_PROJECT.web.app"
echo ""
echo "📊 Dashboard: https://console.firebase.google.com/project/$FIREBASE_PROJECT"
echo ""
echo "⚠️  IMPORTANT: Firestore rules expire on July 21, 2026"
echo "    Update permanent rules before expiration!"
echo ""
