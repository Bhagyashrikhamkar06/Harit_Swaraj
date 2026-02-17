@echo off
echo Starting Backend Server...
cd backend
start /min "HaritSwaraj Backend" python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
cd ..
echo Starting Public Access Tunnel (ngrok)...
start /min "HaritSwaraj Public Link" ".\ngrok.exe" http 8000
echo.
echo ========================================================
echo  REMOTE ACCESS IS ON!
echo  Your senior can now use the app from anywhere.
echo  
echo  1. Backend running on port 8000
2. Public Link active via ngrok
echo.
echo  DO NOT CLOSE THIS WINDOW.
echo ========================================================
pause
