@echo off
setlocal enabledelayedexpansion

REM Sahaay Voice Assistant Setup Script for Windows
REM This script helps you set up the development environment quickly

echo ==============================================
echo     Sahaay Voice Assistant Setup Script
echo ==============================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or higher
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set MAJOR_VERSION=%%i
if %MAJOR_VERSION% LSS 18 (
    echo [ERROR] Node.js version is too old. Please install Node.js 18 or higher
    pause
    exit /b 1
)
echo [SUCCESS] Node.js version is compatible

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend" (
    echo [ERROR] Backend directory not found. Please run this script from the root directory
    pause
    exit /b 1
)
if not exist "frontend" (
    echo [ERROR] Frontend directory not found. Please run this script from the root directory
    pause
    exit /b 1
)

REM Setup backend
echo [INFO] Setting up backend...
cd backend

echo [INFO] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating backend .env file...
    copy .env.example .env >nul
    echo [WARNING] Please edit backend\.env with your API keys before running the application
) else (
    echo [SUCCESS] Backend .env file already exists
)

echo [INFO] Running backend tests...
call npm test
if errorlevel 1 (
    echo [WARNING] Some backend tests failed. This might be due to missing API keys.
) else (
    echo [SUCCESS] Backend tests passed
)

cd ..

REM Setup frontend
echo [INFO] Setting up frontend...
cd frontend

echo [INFO] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating frontend .env file...
    copy .env.example .env >nul
    echo [SUCCESS] Frontend .env file created with default values
) else (
    echo [SUCCESS] Frontend .env file already exists
)

echo [INFO] Running frontend tests...
call npm test
if errorlevel 1 (
    echo [WARNING] Some frontend tests failed
) else (
    echo [SUCCESS] Frontend tests passed
)

cd ..

REM Create root package.json if it doesn't exist
if not exist "package.json" (
    echo [INFO] Creating root package.json...
    (
        echo {
        echo   "name": "sahaay",
        echo   "version": "1.0.0",
        echo   "description": "Voice-first accessibility assistant",
        echo   "scripts": {
        echo     "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
        echo     "dev:backend": "cd backend && npm run dev",
        echo     "dev:frontend": "cd frontend && npm run dev",
        echo     "build": "npm run build:backend && npm run build:frontend",
        echo     "build:backend": "cd backend && npm run build",
        echo     "build:frontend": "cd frontend && npm run build",
        echo     "test": "npm run test:backend && npm run test:frontend",
        echo     "test:backend": "cd backend && npm test",
        echo     "test:frontend": "cd frontend && npm test",
        echo     "start": "npm run start:backend",
        echo     "start:backend": "cd backend && npm start",
        echo     "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install"
        echo   },
        echo   "devDependencies": {
        echo     "concurrently": "^8.2.2"
        echo   }
        echo }
    ) > package.json
    echo [SUCCESS] Root package.json created
    
    call npm install
)

REM Create start script
(
    echo @echo off
    echo echo Starting Sahaay Voice Assistant...
    echo echo Backend will be available at: http://localhost:3001
    echo echo Frontend will be available at: http://localhost:5173
    echo echo.
    echo echo Press Ctrl+C to stop both servers
    echo echo.
    echo npm run dev
) > start.bat
echo [SUCCESS] Start script created (start.bat)

REM Check API key configuration
echo [INFO] Checking API key configuration...
if exist "backend\.env" (
    findstr /C:"your_murf_api_key_here" backend\.env >nul
    if not errorlevel 1 (
        echo [WARNING] Murf API key not configured in backend\.env
    ) else (
        echo [SUCCESS] Murf API key appears to be configured
    )
    
    findstr /C:"your_openai_api_key_here" backend\.env >nul
    if not errorlevel 1 (
        echo [WARNING] OpenAI API key not configured in backend\.env
    ) else (
        echo [SUCCESS] OpenAI API key appears to be configured
    )
)

REM Show next steps
echo.
echo [SUCCESS] Setup completed successfully!
echo.
echo Next steps:
echo 1. Configure your API keys in backend\.env:
echo    - Get Murf API key from: https://murf.ai/
echo    - Get OpenAI API key from: https://platform.openai.com/
echo.
echo 2. Start the development servers:
echo    start.bat
echo    OR
echo    npm run dev
echo.
echo 3. Open your browser and navigate to:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3001/api/health
echo.
echo 4. Grant camera and microphone permissions when prompted
echo.
echo For troubleshooting, see TROUBLESHOOTING.md
echo For deployment instructions, see DEPLOYMENT.md
echo.

pause