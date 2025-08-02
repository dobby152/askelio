#!/bin/bash

# Askelio Backend - Quick Deployment Script
# This script does everything in one go!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Askelio Backend - Quick Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Configuration
PROJECT_ID="crested-guru-465410-h3"
REGION="europe-west1"
SERVICE_NAME="askelio-backend"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "${BLUE}  Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}  Region: ${REGION}${NC}"
echo -e "${BLUE}  Service: ${SERVICE_NAME}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You are not authenticated with gcloud. Please run 'gcloud auth login'${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Step 1: Setting up Google Cloud resources...${NC}"
./setup-cloud-run.sh $PROJECT_ID $REGION

echo ""
echo -e "${YELLOW}⚙️  Step 2: Setting environment variables...${NC}"
./set-env-vars.sh $PROJECT_ID $REGION

echo ""
echo -e "${YELLOW}🏗️  Step 3: Building and deploying...${NC}"
./deploy.sh $PROJECT_ID $REGION

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Your backend is now running at:${NC}"
echo -e "${GREEN}🌐 https://askelio-backend-742213261617.europe-west1.run.app${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${BLUE}1. Get database password from Supabase dashboard${NC}"
echo -e "${BLUE}2. Update Vercel environment variables (see VERCEL_ENV_VARS.md)${NC}"
echo -e "${BLUE}3. Test your application!${NC}"
echo ""
echo -e "${GREEN}✅ Quick deployment finished!${NC}"
