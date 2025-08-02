#!/bin/bash

# Askelio Backend - Set Environment Variables in Cloud Run
# Usage: ./set-env-vars.sh [PROJECT_ID] [REGION]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-"crested-guru-465410-h3"}
REGION=${2:-"europe-west1"}
SERVICE_NAME="askelio-backend"

echo -e "${BLUE}🔧 Setting Environment Variables for Askelio Backend${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project $PROJECT_ID

echo -e "${YELLOW}🔧 Setting basic environment variables...${NC}"

# Basic configuration
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="ENVIRONMENT=production,PORT=8080"

echo -e "${YELLOW}🗄️  Setting Supabase configuration...${NC}"

# Supabase configuration
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="SUPABASE_URL=https://nfmjqnojvjjapszgwcfd.supabase.co,SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzEyMjEsImV4cCI6MjA2OTA0NzIyMX0.e7BkuYECKj6uhtt34yjxIs02UyzdTbeysGK85p4gb0I"

# Service role key (sensitive)
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWpxbm9qdmpqYXBzemd3Y2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ3MTIyMSwiZXhwIjoyMDY5MDQ3MjIxfQ.NWDs7PzWFh2QHKuBOXX-jzLJCJH5nKrG8T62rIqYh88"

echo -e "${YELLOW}🌐 Setting CORS configuration...${NC}"

# CORS configuration
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="CORS_ORIGINS=https://askelio-pi.vercel.app,https://askelio-pi-git-main.vercel.app"

echo -e "${YELLOW}☁️  Setting Google Cloud configuration...${NC}"

# Google Cloud configuration
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}"

echo -e "${YELLOW}⚙️  Setting application configuration...${NC}"

# Application settings
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="LOG_LEVEL=INFO,SECURITY_HEADERS_ENABLED=true,HTTPS_ONLY=true,SECURE_COOKIES=true"

# Feature flags
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="ENABLE_USER_REGISTRATION=true,ENABLE_CREDIT_SYSTEM=true,ENABLE_MEMORY_SYSTEM=true"

# Rate limiting
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="RATE_LIMIT_REQUESTS_PER_MINUTE=120,RATE_LIMIT_BURST=20"

# File storage
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="MAX_FILE_SIZE_MB=10,ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,bmp,tiff"

echo ""
echo -e "${GREEN}✅ Environment variables set successfully!${NC}"
echo -e "${YELLOW}🤖 Setting OpenRouter API key...${NC}"

# OpenRouter API key
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --set-env-vars="OPENROUTER_API_KEY=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"

echo ""
echo -e "${YELLOW}⚠️  Manual steps required:${NC}"
echo ""
echo -e "${YELLOW}1. Add database password (get from Supabase dashboard):${NC}"
echo -e "${BLUE}   gcloud run services update ${SERVICE_NAME} --region=${REGION} --set-env-vars=\"DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.nfmjqnojvjjapszgwcfd.supabase.co:5432/postgres\"${NC}"
echo ""
echo -e "${YELLOW}2. Optional - Add Stripe keys for payments:${NC}"
echo -e "${BLUE}   gcloud run services update ${SERVICE_NAME} --region=${REGION} --set-env-vars=\"STRIPE_SECRET_KEY=sk_live_YOUR_KEY\"${NC}"
echo ""
echo -e "${GREEN}🎉 Your backend is ready for deployment!${NC}"
