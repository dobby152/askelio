@echo off
echo 🚀 ASKELIO - KOMPLETNÍ SPUŠTĚNÍ
echo ================================

echo 📦 Kontroluji Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker není nainstalován nebo nespuštěn!
    echo 📥 Stáhněte Docker Desktop z: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker je dostupný

echo 🗄️ Spouštím databázi a Redis...
docker run -d --name askelio-postgres -e POSTGRES_DB=askelio -e POSTGRES_USER=askelio -e POSTGRES_PASSWORD=askelio_dev_password -p 5432:5432 postgres:15
docker run -d --name askelio-redis -p 6379:6379 redis:7

echo ⏳ Čekám na spuštění databáze...
timeout /t 10 /nobreak >nul

echo 🌐 Spouštím frontend (Next.js)...
start "Askelio Frontend" cmd /k "cd frontend && npm run dev"

echo 🔧 Spouštím backend (FastAPI)...
start "Askelio Backend" cmd /k "start-backend.bat"

echo ✅ Všechny služby spuštěny!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs

pause
