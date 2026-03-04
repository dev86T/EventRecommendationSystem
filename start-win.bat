@echo off
echo ========================================
echo Event Recommendation System - Startup Script
echo ========================================
echo.

echo [1/4] Starting PostgreSQL...
docker-compose up -d
timeout /t 5 /nobreak > nul

echo.
echo [2/4] Starting Backend API...
start cmd /k "cd backend\EventRecommendationSystem.API && dotnet run"
timeout /t 10 /nobreak > nul

echo.
echo [3/4] Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo [4/4] Done!
echo.
echo ========================================
echo Application is starting...
echo Backend API: http://localhost:5000
echo Swagger: http://localhost:5000/swagger
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to open browser...
pause > nul

start http://localhost:3000

exit
