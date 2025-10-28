@echo off
REM SocialHub Client Deployment Script for Windows
REM This script helps deploy the Next.js frontend

echo.
echo ================================
echo  SocialHub Client Deployment
echo ================================
echo.

cd client

REM Check if .env.production exists
if not exist .env.production (
    echo [WARNING] .env.production not found. Creating from .env.local...
    if exist .env.local (
        copy .env.local .env.production >nul
        echo [INFO] Created .env.production from .env.local
    ) else (
        echo [ERROR] .env.local not found. Please create .env.production manually.
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Current API URL configuration:
findstr "NEXT_PUBLIC_API_URL" .env.production 2>nul || echo [WARNING] NEXT_PUBLIC_API_URL not set (auto-detection enabled)
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to continue with deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Building Next.js application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Please check the errors above.
    pause
    exit /b 1
)

echo.
echo [INFO] Build successful!

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] PM2 detected. Managing process with PM2...
    
    REM Check if app is already running
    pm2 list | findstr "socialhub-client" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Restarting existing PM2 process...
        call pm2 restart socialhub-client
    ) else (
        echo [INFO] Starting new PM2 process...
        call pm2 start npm --name "socialhub-client" -- start
        call pm2 save
    )
    
    echo.
    echo [INFO] Showing PM2 status...
    call pm2 status socialhub-client
    
    echo.
    echo [INFO] To view logs, run: pm2 logs socialhub-client
) else (
    echo [WARNING] PM2 not found. Starting with npm start...
    echo [INFO] For production, it's recommended to use PM2:
    echo   npm install -g pm2
    echo   pm2 start npm --name socialhub-client -- start
    echo.
    echo [INFO] Starting application...
    call npm start
)

echo.
echo ================================
echo  Deployment Completed!
echo ================================
echo Frontend running at: http://localhost:3000
echo.
pause
