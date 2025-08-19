@echo off
echo ========================================
echo    ChaloSawari Vehicle Pricing Seeding
echo ========================================
echo.

echo Step 1: Checking MongoDB connection...
npm run check-mongo
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ MongoDB connection failed!
    echo.
    echo 🔧 Please try these steps:
    echo 1. Start MongoDB: net start MongoDB
    echo 2. Check if MongoDB is running
    echo 3. Verify your .env file has MONGODB_URI
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ✅ MongoDB connection successful!
echo.
echo Step 2: Running seeding script...
npm run seed
echo.

if %ERRORLEVEL% EQU 0 (
    echo 🎉 Seeding completed successfully!
    echo.
    echo 👨‍💼 Admin can now:
    echo - View all pricing in AdminPriceManagement page
    echo - Edit existing pricing
    echo - Add new pricing for additional models
    echo - Delete pricing (soft delete)
    echo - Bulk update pricing
) else (
    echo ❌ Seeding failed!
    echo Check the error messages above.
)

echo.
echo Press any key to exit...
pause >nul
