@echo off
echo ========================================
echo Nifty 50 Data Collector - Deploy Script
echo ========================================
echo.

cd nifty50-data-collector

echo [1/5] Checking git status...
git status
echo.

echo [2/5] Adding all changes...
git add .
echo.

echo [3/5] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update deployment

git commit -m "%commit_msg%"
echo.

echo [4/5] Pushing to GitHub...
git push
echo.

echo [5/5] Deployment complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Vercel will auto-deploy from GitHub
echo 2. Check deployment status at vercel.com
echo 3. Visit your app URL to verify
echo ========================================
echo.

pause
