@echo off
REM =====================================================
REM AIXILCOILS Management Suite - Windows Distribution Build
REM =====================================================
REM This script builds all platforms for distribution on Windows
REM Run from the project root directory
REM =====================================================

echo ==============================================
echo   AIXILCOILS Management Suite Build Script
echo ==============================================
echo.

REM Create dist directory
if not exist "distribution" mkdir distribution
if not exist "distribution\web" mkdir distribution\web
if not exist "distribution\desktop" mkdir distribution\desktop

REM =====================================================
REM Build Web Application
REM =====================================================
echo [1/4] Building Web Application...
cd client
call npm install --legacy-peer-deps
call npm run build
xcopy /E /I /Y dist ..\distribution\web
cd ..
echo Web build complete!
echo.

REM =====================================================
REM Build Desktop Application (Windows)
REM =====================================================
echo [2/4] Building Desktop Application for Windows...
cd desktop
call npm install
call npm run build:win
xcopy /E /I /Y dist\*.exe ..\distribution\desktop
xcopy /E /I /Y dist\*.msi ..\distribution\desktop 2>nul
cd ..
echo Desktop build complete!
echo.

REM =====================================================
REM Prepare Mobile Projects
REM =====================================================
echo [3/4] Preparing Mobile Projects...
cd client

REM Add Android if not exists
if not exist "android" (
    echo Adding Android platform...
    call npx cap add android
)

REM Sync Android
if exist "android" (
    echo Syncing Android project...
    call npx cap sync android
    echo.
    echo To build Android APK:
    echo   1. Open 'client\android' in Android Studio
    echo   2. Build ^> Generate Signed Bundle / APK
)

cd ..
echo Mobile preparation complete!
echo.

REM =====================================================
REM Create Distribution Summary
REM =====================================================
echo [4/4] Creating distribution summary...

(
echo # AIXILCOILS Management Suite - Distribution
echo.
echo ## Available Builds
echo.
echo ### Web Application
echo Location: `./web/`
echo Deploy the contents of this folder to your web server.
echo.
echo ### Desktop Application
echo Location: `./desktop/`
echo Contains Windows installer ^(.exe^) and/or MSI package.
echo.
echo ### Mobile Applications
echo.
echo #### Android
echo 1. Open `client\android` in Android Studio
echo 2. Build ^> Generate Signed Bundle / APK
echo 3. APK will be in `app\build\outputs\apk\`
echo.
echo ---
echo Built on: %date% %time%
) > distribution\README.md

echo Distribution summary created!
echo.

REM =====================================================
REM Final Summary
REM =====================================================
echo ==============================================
echo   Build Complete!
echo ==============================================
echo.
echo Distribution files are in: distribution\
echo.
echo Contents:
dir /B distribution
echo.
echo Next steps:
echo   1. Test the builds on target platforms
echo   2. For mobile, complete builds in Android Studio
echo   3. Upload to your distribution server or app stores
echo.
echo ==============================================

pause
