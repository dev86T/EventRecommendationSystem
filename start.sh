#!/bin/bash

echo "========================================"
echo "Event Recommendation System - Startup Script"
echo "========================================"
echo ""

echo "[1/4] Starting PostgreSQL..."
docker-compose up -d
sleep 5

echo ""
echo "[2/4] Starting Backend API..."
cd backend/EventRecommendationSystem.API
gnome-terminal -- bash -c "dotnet run; exec bash" 2>/dev/null || \
xterm -e "dotnet run; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && dotnet run"' 2>/dev/null &
cd ../..
sleep 10

echo ""
echo "[3/4] Starting Frontend..."
cd frontend
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -e "npm run dev; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev"' 2>/dev/null &
cd ..

echo ""
echo "[4/4] Done!"
echo ""
echo "========================================"
echo "Application is starting..."
echo "Backend API: http://localhost:5000"
echo "Swagger: http://localhost:5000/swagger"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Enter to open browser..."
read

# Try to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v gnome-open > /dev/null; then
    gnome-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
fi
