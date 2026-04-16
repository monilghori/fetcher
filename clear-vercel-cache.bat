@echo off
echo ========================================
echo Clear Vercel Cache and Redeploy
echo ========================================
echo.

echo Step 1: Deleting local .next folder...
if exist .next (
    rmdir /s /q .next
    echo ✓ Local .next folder deleted
) else (
    echo ℹ No local .next folder found
)
echo.

echo Step 2: Committing changes...
git add .
git commit -m "Clear cache and update API routes"
echo.

echo Step 3: Pushing to trigger Vercel rebuild...
git push
echo.

echo ========================================
echo Done!
echo ========================================
echo.
echo Vercel will automatically rebuild with fresh cache.
echo Check your Vercel dashboard for deployment status.
echo.
pause
