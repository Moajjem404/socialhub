@echo off
REM SocialHub Full-Stack Deployment Script for Windows
REM This script deploys both frontend and backend together

echo.
echo ========================================
echo  SocialHub Full-Stack Deployment
echo ========================================
echo.

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PM2 not installed. Installing PM2 globally...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install PM2. Please install manually: npm install -g pm2
        pause
        exit /b 1
    )
    echo [INFO] PM2 installed successfully!
)

echo [STEP] Checking environment files...
echo.

REM Check environment files
if not exist server\.env (
    echo [ERROR] server\.env not found!
    echo [INFO] Please create server\.env with required variables.
    pause
    exit /b 1
)

if not exist client\.env.local (
    echo [WARNING] client\.env.local not found. Creating default...
    echo # Leave empty for auto-detection> client\.env.local
    echo NEXT_PUBLIC_API_URL=>> client\.env.local
)

REM Show configurations
echo [INFO] Configuration Summary:
echo ========================================
for /f "tokens=1,2 delims==" %%a in ('findstr "PORT=" server\.env') do echo Server Port: %%b
for /f "tokens=1,2 delims==" %%a in ('findstr "CORS_ORIGIN=" server\.env') do echo CORS Origin: %%b
for /f "tokens=1,2 delims==" %%a in ('findstr "NEXT_PUBLIC_API_URL=" client\.env.local') do echo API URL: %%b (Auto-detect if empty)
echo ========================================
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to continue with full deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo [STEP] 1/4 Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [INFO] Backend dependencies installed!

echo.
echo [STEP] 2/4 Installing frontend dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [INFO] Frontend dependencies installed!

echo.
echo [STEP] 3/4 Building frontend for production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)
echo [INFO] Frontend build successful!

cd ..

echo.
echo [STEP] 4/4 Deploying with PM2...

REM Stop existing processes
pm2 delete socialhub-server 2>nul
pm2 delete socialhub-client 2>nul

REM Start backend
echo [INFO] Starting backend server...
call pm2 start server\index.js --name "socialhub-server"

REM Start frontend
echo [INFO] Starting frontend client...
cd client
call pm2 start npm --name "socialhub-client" -- start
cd ..

REM Save PM2 configuration
call pm2 save

REM Setup startup script
echo [INFO] Setting up PM2 startup script...
call pm2 startup

echo.
echo ========================================
echo  Deployment Completed Successfully!
echo ========================================
echo.
echo [INFO] Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo.
echo [INFO] PM2 Management Commands:
echo   pm2 list              - Show all processes
echo   pm2 logs              - View all logs
echo   pm2 restart all       - Restart both apps
echo   pm2 stop all          - Stop both apps
echo   pm2 monit             - Monitor processes
echo.
echo [INFO] Current PM2 status:
call pm2 status
echo.
pause
