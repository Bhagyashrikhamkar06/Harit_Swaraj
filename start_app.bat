@echo off
title Harit Swaraj Launcher
echo ===================================================
echo   🌱 HARIT SWARAJ - Application Launcher
echo ===================================================
echo.

echo [1/2] Starting Backend Server (Python/FastAPI)...
start "Harit Swaraj Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 >nul

echo [2/2] Starting Frontend (React)...
start "Harit Swaraj Frontend" cmd /k "npm start"

echo.
echo ===================================================
echo   ✅ App is running!
echo   👉 Frontend: http://localhost:3000
echo   👉 Backend:  http://localhost:8000/docs
echo ===================================================
echo.
echo Don't close the pop-up windows! They are your servers.
echo You can minimize them.
pause
