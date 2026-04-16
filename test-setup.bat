@echo off
echo ========================================
echo Nifty 50 Data Collector - Test Setup
echo ========================================
echo.

cd nifty50-data-collector

echo [1/3] Installing dependencies...
call npm install
echo.

echo [2/3] Checking environment variables...
if not exist .env.local (
    echo WARNING: .env.local not found!
    echo Please copy .env.local.example to .env.local and add your credentials
    echo.
    pause
    exit /b 1
)
echo Environment file found!
echo.

echo [3/3] Starting development server...
echo.
echo ========================================
echo Test Mode Instructions:
echo ========================================
echo 1. Open http://localhost:3000 in your browser
echo 2. Click the purple "Test Mode (1 min)" button
echo 3. Wait 1 minute for data collection
echo 4. Check the "Recent Ticks" table below
echo ========================================
echo.

call npm run dev
