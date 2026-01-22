@echo off
setlocal

:: Configuration
set DIST_DIR=..\client\dist
set BUILD_CMD=npm run build

:: Check for S3 Bucket argument
if "%~1"=="" (
    echo Usage: %0 ^<S3_BUCKET_NAME^> [CLOUDFRONT_DIST_ID]
    echo Example: %0 my-app-bucket E1234567890
    exit /b 1
)

set BUCKET_NAME=%~1
set CF_DIST_ID=%~2

echo ==========================================
echo AIXILCOILS Frontend Deployment
echo Bucket: %BUCKET_NAME%
if not "%CF_DIST_ID%"=="" echo CloudFront: %CF_DIST_ID%
echo ==========================================

:: Navigate to client directory
pushd ..\client

:: Install dependencies
echo.
echo [1/4] Installing dependencies...
call npm ci
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies.
    popd
    exit /b %ERRORLEVEL%
)

:: Build the project
echo.
echo [2/4] Building project...
call %BUILD_CMD%
if %ERRORLEVEL% NEQ 0 (
    echo Build failed.
    popd
    exit /b %ERRORLEVEL%
)

:: Sync to S3
echo.
echo [3/4] Syncing to S3...
aws s3 sync dist s3://%BUCKET_NAME% --delete
if %ERRORLEVEL% NEQ 0 (
    echo S3 sync failed. Make sure AWS CLI is configured.
    popd
    exit /b %ERRORLEVEL%
)

:: Invalidate CloudFront (if ID provided)
if not "%CF_DIST_ID%"=="" (
    echo.
    echo [4/4] Invalidating CloudFront cache...
    aws cloudfront create-invalidation --distribution-id %CF_DIST_ID% --paths "/*"
) else (
    echo.
    echo [4/4] Skipping CloudFront invalidation (No Distribution ID provided).
)

echo.
echo Deployment Complete!
echo Website URL: http://%BUCKET_NAME%.s3-website-%AWS_REGION%.amazonaws.com (if enabled)
popd
endlocal
