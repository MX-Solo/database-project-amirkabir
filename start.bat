 @echo off
echo 🎬 Starting Movie Recommendation System...
echo ========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start containers
echo 🐳 Building and starting containers...
docker-compose up --build -d

REM Wait for MongoDB to be ready
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 30 /nobreak >nul

REM Check if data loading is needed
echo 🔍 Checking data status...
docker-compose exec app npm run init-data

echo.
echo 🎉 System is ready!
echo.
echo 📋 Access points:
echo    🌐 Web Interface: http://localhost:3000
echo    📊 API: http://localhost:3000/api
echo    🗄️  MongoDB: localhost:27017
echo.
echo 🔧 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop: docker-compose down
echo    Restart: docker-compose restart
echo    Run queries: docker-compose exec app npm run queries
echo.
echo 📚 Documentation: README.md
pause