# ============================================================================
# HGM Deployment Script - Python Microservice to Google Cloud Run (Windows)
# ============================================================================
# This script deploys the AI sentiment analysis microservice to Cloud Run
# Prerequisites:
#   - Google Cloud SDK installed (gcloud CLI)
#   - Authenticated with: gcloud auth login
#   - Google Cloud project set up
#   - Billing enabled on Google Cloud
# Run this from the project root directory in PowerShell

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting HGM Python Microservice Deployment to Cloud Run..." -ForegroundColor Green
Write-Host ""

# Configuration
$PROJECT_ID = "salon-marketplace-b122a"
$SERVICE_NAME = "hgm-ai-service"
$REGION = "asia-south1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
$MICROSERVICE_DIR = "ai-microservice"

# Check if gcloud is installed
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if ($null -eq $gcloud) {
    Write-Host "❌ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  Project ID: $PROJECT_ID"
Write-Host "  Service Name: $SERVICE_NAME"
Write-Host "  Region: $REGION"
Write-Host "  Image: $IMAGE_NAME"
Write-Host ""

# Step 1: Verify authentication
Write-Host "🔐 Step 1: Verifying Google Cloud authentication..." -ForegroundColor Cyan
$CURRENT_PROJECT = gcloud config get-value project 2>$null
if ([string]::IsNullOrEmpty($CURRENT_PROJECT)) {
    Write-Host "❌ Not authenticated with Google Cloud. Run: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated as: $CURRENT_PROJECT" -ForegroundColor Green
Write-Host ""

# Step 2: Set project
Write-Host "🎯 Step 2: Setting Google Cloud project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID
Write-Host "✅ Project set to: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Step 3: Build Docker image
Write-Host "🐳 Step 3: Building Docker image..." -ForegroundColor Cyan
Push-Location $MICROSERVICE_DIR
gcloud builds submit --tag $IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Docker image built: $IMAGE_NAME" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 4: Deploy to Cloud Run
Write-Host "☁️  Step 4: Deploying to Google Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "PORT=8000" `
  --memory 512Mi `
  --cpu 1 `
  --timeout 3600 `
  --max-instances 10

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cloud Run deployment successful" -ForegroundColor Green
Write-Host ""

# Step 5: Get the service URL
Write-Host "🔗 Step 5: Retrieving service URL..." -ForegroundColor Cyan
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --format 'value(status.url)'

Write-Host "✅ Service URL: $SERVICE_URL" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "✅ ============================================================================" -ForegroundColor Green
Write-Host "✅ Microservice Deployment Complete!" -ForegroundColor Green
Write-Host "✅ ============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Details:" -ForegroundColor Cyan
Write-Host "  Name: $SERVICE_NAME"
Write-Host "  URL: $SERVICE_URL"
Write-Host "  Region: $REGION"
Write-Host ""
Write-Host "🔗 Update your .env.production with:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_AI_API_URL=$SERVICE_URL"
Write-Host ""
Write-Host "💡 Monitor logs with:" -ForegroundColor Yellow
Write-Host "  gcloud run logs read $SERVICE_NAME --region $REGION --limit 50"
Write-Host ""
Write-Host "📈 View metrics at:" -ForegroundColor Yellow
Write-Host "  https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
Write-Host ""
