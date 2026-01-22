#!/bin/bash

# Configuration
DIST_DIR="../client/dist"
BUILD_CMD="npm run build"

# Check for S3 Bucket argument
if [ -z "$1" ]; then
    echo "Usage: $0 <S3_BUCKET_NAME> [CLOUDFRONT_DIST_ID]"
    echo "Example: $0 my-app-bucket E1234567890"
    exit 1
fi

BUCKET_NAME=$1
CF_DIST_ID=$2

echo "=========================================="
echo "AIXILCOILS Frontend Deployment"
echo "Bucket: $BUCKET_NAME"
if [ ! -z "$CF_DIST_ID" ]; then
    echo "CloudFront: $CF_DIST_ID"
fi
echo "=========================================="

# Navigate to client directory
cd "$(dirname "$0")/../client" || exit

# Install dependencies
echo ""
echo "[1/4] Installing dependencies..."
npm ci
if [ $? -ne 0 ]; then
    echo "Error installing dependencies."
    exit 1
fi

# Build the project
echo ""
echo "[2/4] Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed."
    exit 1
fi

# Sync to S3
echo ""
echo "[3/4] Syncing to S3..."
aws s3 sync dist s3://"$BUCKET_NAME" --delete
if [ $? -ne 0 ]; then
    echo "S3 sync failed. Make sure AWS CLI is configured."
    exit 1
fi

# Invalidate CloudFront (if ID provided)
if [ ! -z "$CF_DIST_ID" ]; then
    echo ""
    echo "[4/4] Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"
else
    echo ""
    echo "[4/4] Skipping CloudFront invalidation (No Distribution ID provided)."
fi

echo ""
echo "Deployment Complete!"
