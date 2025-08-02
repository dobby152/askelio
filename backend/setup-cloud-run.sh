#!/bin/bash

# Askelio Backend - Google Cloud Run Setup Script
# This script sets up the necessary Google Cloud resources for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"europe-west1"}
SERVICE_NAME="askelio-backend"
SERVICE_ACCOUNT_NAME="askelio-backend"

echo -e "${BLUE}🚀 Setting up Google Cloud Run for Askelio Backend${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create Artifact Registry repository
echo -e "${YELLOW}📦 Creating Artifact Registry repository...${NC}"
gcloud artifacts repositories create askelio \
    --repository-format=docker \
    --location=$REGION \
    --description="Askelio Docker images repository" || true

# Configure Docker authentication for Artifact Registry
echo -e "${YELLOW}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev || true

# Create service account
echo -e "${YELLOW}👤 Creating service account...${NC}"
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="Askelio Backend Service Account" \
    --description="Service account for Askelio backend on Cloud Run" || true

# Grant necessary permissions
echo -e "${YELLOW}🔐 Granting permissions to service account...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/vision.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create Cloud Storage bucket for documents (optional)
echo -e "${YELLOW}🪣 Creating Cloud Storage bucket...${NC}"
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://askelio-documents-${PROJECT_ID} || true

# Set bucket permissions
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com:objectAdmin gs://askelio-documents-${PROJECT_ID} || true

echo ""
echo -e "${GREEN}✅ Google Cloud setup completed!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "${BLUE}1. Set up your environment variables in Cloud Run:${NC}"
echo -e "${BLUE}   - Copy values from .env.production.template${NC}"
echo -e "${BLUE}   - Use Google Secret Manager for sensitive values${NC}"
echo -e "${BLUE}2. Run the deployment script:${NC}"
echo -e "${BLUE}   ./deploy.sh ${PROJECT_ID} ${REGION}${NC}"
echo ""
echo -e "${YELLOW}🔑 Service Account: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com${NC}"
echo -e "${YELLOW}🪣 Storage Bucket: gs://askelio-documents-${PROJECT_ID}${NC}"
