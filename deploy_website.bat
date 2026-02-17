@echo off
echo ========================================
echo  Harit Swaraj - Website Deployment
echo ========================================
echo.

echo Choose deployment platform:
echo 1. Vercel (Recommended)
echo 2. Netlify
echo 3. Firebase
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto netlify
if "%choice%"=="3" goto firebase
echo Invalid choice
pause
exit /b 1

:vercel
echo.
echo [Vercel Deployment]
echo.
echo Installing Vercel CLI...
call npm install -g vercel
echo.
echo Building production bundle...
call npm run build
echo.
echo Deploying to Vercel...
call vercel --prod
echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo Your website is now live!
echo Check the URL provided above.
echo.
pause
exit /b 0

:netlify
echo.
echo [Netlify Deployment]
echo.
echo Installing Netlify CLI...
call npm install -g netlify-cli
echo.
echo Building production bundle...
call npm run build
echo.
echo Deploying to Netlify...
call netlify deploy --prod --dir=build
echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
pause
exit /b 0

:firebase
echo.
echo [Firebase Deployment]
echo.
echo Installing Firebase CLI...
call npm install -g firebase-tools
echo.
echo Logging in to Firebase...
call firebase login
echo.
echo Initializing Firebase...
call firebase init hosting
echo.
echo Building production bundle...
call npm run build
echo.
echo Deploying to Firebase...
call firebase deploy --only hosting
echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
pause
exit /b 0
