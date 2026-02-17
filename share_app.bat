@echo off
echo ========================================================
echo   Harit Swaraj - Share with Team (Universal Link)
echo ========================================================
echo.
echo This script will:
echo 1. Build your React Frontend for production
echo 2. Start the Backend server (integrated mode)
echo 3. Generate a secure public link via Ngrok
echo.
echo NOTE: This takes 1-2 minutes the first time.
echo.

echo [1/3] Building Frontend... (Please wait)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please check errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting Backend Server...
cd backend
start "HaritSwaraj Backend (Do not close)" /min python -m uvicorn share:app --host 0.0.0.0 --port 8000
cd ..

echo.
echo [3/3] Starting Public Tunnel...
echo.
echo ========================================================
echo   YOUR APP IS LIVE! 
echo   Share the https://... url from the window below.
echo ========================================================
echo.
".\ngrok.exe" http 8000
pause
