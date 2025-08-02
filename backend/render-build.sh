#!/bin/bash

# Render.com Build Script for Askelio Backend
set -e

echo "🔧 Starting Askelio Backend build..."

# Update pip to latest version
echo "📦 Updating pip..."
pip install --upgrade pip

# Install system dependencies for OCR
echo "🔧 Installing system dependencies..."
# Tesseract OCR will be installed by Render.com automatically

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Verify critical imports
echo "🔍 Verifying critical imports..."
python -c "import fastapi; print('✅ FastAPI imported successfully')"
python -c "import sqlalchemy; print('✅ SQLAlchemy imported successfully')"
python -c "import psycopg2; print('✅ PostgreSQL driver imported successfully')"

# Run any database migrations if needed
echo "🗄️  Checking database migrations..."
# python run_migrations.py  # Uncomment if you have migrations

echo "✅ Build completed successfully!"
