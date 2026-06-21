# ============================================================================
# HGM Deployment Script - Firebase Hosting & Firestore (Windows)
# ============================================================================
# This script deploys the Next.js frontend and Firestore configuration
# Run this from the project root directory in PowerShell

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting HGM Deployment to Firebase Hosting..." -ForegroundColor Green
Write-Host ""

# Check if firebase CLI is installed
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if ($null -eq $firebase) {
    Write-Host "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Step 1: Build Next.js
Write-Host "📦 Step 1: Building Next.js application..." -ForegroundColor Cyan
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Next.js build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Next.js build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Verify firebase project
Write-Host "🔍 Step 2: Verifying Firebase project..." -ForegroundColor Cyan
$firebaseJson = Get-Content firebase.json | ConvertFrom-Json
$FIREBASE_PROJECT = $firebaseJson.projects.default
Write-Host "Project ID: $FIREBASE_PROJECT" -ForegroundColor Yellow

# Step 3: Deploy to Firebase Hosting
Write-Host "🌐 Step 3: Deploying to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase Hosting deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firebase Hosting deployment successful" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy Firestore Rules
Write-Host "🔐 Step 4: Deploying Firestore Rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firestore rules deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firestore rules deployment successful" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy Firestore Indexes (if any)
Write-Host "📑 Step 5: Deploying Firestore Indexes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Firestore indexes deployment had issues (may be normal)" -ForegroundColor Yellow
}
Write-Host "✅ Firestore indexes deployment checked" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "✅ ============================================================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "✅ ============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Your app is live at: https://$FIREBASE_PROJECT.web.app" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Dashboard: https://console.firebase.google.com/project/$FIREBASE_PROJECT" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Firestore rules expire on July 21, 2026" -ForegroundColor Red
Write-Host "    Update permanent rules before expiration!" -ForegroundColor Red
Write-Host ""
