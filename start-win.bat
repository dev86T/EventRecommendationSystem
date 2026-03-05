@echo off
echo ========================================
echo Event Recommendation System - Startup Script
echo ========================================

echo.
echo Waiting for services to start...
timeout /t 1- /nobreak > nul

echo.
echo Opening browser...
start http://localhost:3000/

echo.
echo ========================================
echo Application is starting...
echo Backend API: http://localhost:5000
echo Swagger: http://localhost:5000/swagger
echo Frontend: http://localhost:3000
pause
