@echo off
echo ========================================
echo  Harit Swaraj - Production Build Script
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/4] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo.
echo [4/4] Opening Android Studio...
call npx cap open android

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Android Studio will open
echo 2. Go to Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo For website deployment, run: deploy_website.bat
echo.
pause
