#!/bin/bash

# ============================================================================
# HGM Deployment Script - Python Microservice to Google Cloud Run
# ============================================================================
# This script deploys the AI sentiment analysis microservice to Cloud Run
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Google Cloud project set up
#   - Billing enabled on Google Cloud
# Run this from the project root directory

set -e  # Exit on error

echo "🚀 Starting HGM Python Microservice Deployment to Cloud Run..."
echo ""

# Configuration
PROJECT_ID="salon-marketplace-b122a"
SERVICE_NAME="hgm-ai-service"
REGION="asia-south1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
MICROSERVICE_DIR="ai-microservice"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image: $IMAGE_NAME"
echo ""

# Step 1: Verify authentication
echo "🔐 Step 1: Verifying Google Cloud authentication..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ Not authenticated with Google Cloud. Run: gcloud auth login"
    exit 1
fi
echo "✅ Authenticated as: $CURRENT_PROJECT"
echo ""

# Step 2: Set project
echo "🎯 Step 2: Setting Google Cloud project..."
gcloud config set project $PROJECT_ID
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Step 3: Build Docker image
echo "🐳 Step 3: Building Docker image..."
cd $MICROSERVICE_DIR
gcloud builds submit --tag $IMAGE_NAME
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi
echo "✅ Docker image built: $IMAGE_NAME"
cd ..
echo ""

# Step 4: Deploy to Cloud Run
echo "☁️  Step 4: Deploying to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "PORT=8000" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 10

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    exit 1
fi
echo "✅ Cloud Run deployment successful"
echo ""

# Step 5: Get the service URL
echo "🔗 Step 5: Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo "✅ Service URL: $SERVICE_URL"
echo ""

# Success message
echo "✅ ============================================================================"
echo "✅ Microservice Deployment Complete!"
echo "✅ ============================================================================"
echo ""
echo "📊 Service Details:"
echo "  Name: $SERVICE_NAME"
echo "  URL: $SERVICE_URL"
echo "  Region: $REGION"
echo ""
echo "🔗 Update your .env.production with:"
echo "  NEXT_PUBLIC_AI_API_URL=$SERVICE_URL"
echo ""
echo "💡 Monitor logs with:"
echo "  gcloud run logs read $SERVICE_NAME --region $REGION --limit 50"
echo ""
echo "📈 View metrics at:"
echo "  https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo ""
