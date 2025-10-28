@echo off
REM SocialHub Server Deployment Script for Windows
REM This script helps deploy the Express backend

echo.
echo ================================
echo  SocialHub Server Deployment
echo ================================
echo.

cd server

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found in server directory!
    echo [INFO] Please create server\.env with the following variables:
    echo.
    echo PORT=3001
    echo MONGO_URI=your-mongodb-connection-string
    echo JWT_SECRET=your-super-secret-jwt-key
    echo NODE_ENV=production
    echo CORS_ORIGIN=*
    echo.
    pause
    exit /b 1
)

REM Show current configuration (without sensitive data)
echo [INFO] Current server configuration:
for /f "tokens=1,2 delims==" %%a in ('findstr "PORT=" .env') do echo PORT: %%b
for /f "tokens=1,2 delims==" %%a in ('findstr "NODE_ENV=" .env') do echo NODE_ENV: %%b
for /f "tokens=1,2 delims==" %%a in ('findstr "CORS_ORIGIN=" .env') do echo CORS_ORIGIN: %%b
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to continue with deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] Deployment cancelled.
    pause
    exit /b 0
)

REM Go back to root directory
cd ..

echo.
echo [INFO] Installing server dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Dependencies installed successfully!

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] PM2 detected. Managing process with PM2...
    
    REM Check if app is already running
    pm2 list | findstr "socialhub-server" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Restarting existing PM2 process...
        call pm2 restart socialhub-server
    ) else (
        echo [INFO] Starting new PM2 process...
        call pm2 start server\index.js --name "socialhub-server"
        call pm2 save
    )
    
    echo.
    echo [INFO] Showing PM2 status...
    call pm2 status socialhub-server
    
    echo.
    echo [INFO] To view logs, run: pm2 logs socialhub-server
) else (
    echo [WARNING] PM2 not found. Starting with node...
    echo [INFO] For production, it's recommended to use PM2:
    echo   npm install -g pm2
    echo   pm2 start server\index.js --name socialhub-server
    echo.
    echo [INFO] Starting server...
    node server\index.js
)

echo.
echo ================================
echo  Deployment Completed!
echo ================================
echo Backend API running at: http://localhost:3001
echo.
pause
