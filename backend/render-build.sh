#!/bin/bash

# Render.com Build Script for Askelio Backend
set -e

echo "🔧 Starting Askelio Backend build..."

# Update pip to latest version
echo "📦 Updating pip..."
pip install --upgrade pip

# Install system dependencies if needed
echo "🔧 Installing system dependencies..."
# Note: Render.com handles most system dependencies automatically

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Run any database migrations if needed
echo "🗄️  Checking database migrations..."
# python run_migrations.py  # Uncomment if you have migrations

echo "✅ Build completed successfully!"
