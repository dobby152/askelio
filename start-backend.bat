@echo off
echo 🚀 Spouštím Askelio Backend...

cd backend

echo 📦 Instaluji základní závislosti...
pip install fastapi uvicorn python-multipart

echo 🔧 Vytvářím adresáře...
if not exist uploads mkdir uploads
if not exist logs mkdir logs

echo 🌟 Spouštím FastAPI server (Demo Mode)...
python main_simple.py

pause
