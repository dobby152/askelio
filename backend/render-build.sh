#!/bin/bash

# Render.com Build Script for Askelio Backend
set -e

echo "🔧 Starting Askelio Backend build..."

# Update pip to latest version
echo "📦 Updating pip..."
pip install --upgrade pip

# Install system dependencies for OCR
echo "🔧 Installing system dependencies..."
# Tesseract OCR and other dependencies will be installed by Render.com automatically

# Install Python dependencies with increased timeout
echo "📚 Installing Python dependencies..."
pip install --timeout=1000 -r requirements.txt

# Verify critical imports
echo "🔍 Verifying critical imports..."
python -c "import fastapi; print('✅ FastAPI imported successfully')"
python -c "import sqlalchemy; print('✅ SQLAlchemy imported successfully')"
python -c "import psycopg2; print('✅ PostgreSQL driver imported successfully')"
python -c "import pydantic; print('✅ Pydantic imported successfully')"
python -c "import email_validator; print('✅ Email validator imported successfully')"

# Verify OCR libraries
echo "🔍 Verifying OCR libraries..."
python -c "import PIL; print('✅ Pillow imported successfully')" || echo "⚠️ Pillow import failed"
python -c "import cv2; print('✅ OpenCV imported successfully')" || echo "⚠️ OpenCV import failed"
python -c "import easyocr; print('✅ EasyOCR imported successfully')" || echo "⚠️ EasyOCR import failed"
python -c "import paddleocr; print('✅ PaddleOCR imported successfully')" || echo "⚠️ PaddleOCR import failed"

# Test port configuration
echo "🔍 Testing port configuration..."
python test_port.py || echo "⚠️ Port test failed, but continuing..."

# Run any database migrations if needed
echo "🗄️  Checking database migrations..."
# python run_migrations.py  # Uncomment if you have migrations

echo "✅ Build completed successfully!"
