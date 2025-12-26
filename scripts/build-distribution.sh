#!/bin/bash

# =====================================================
# AIXILCOILS Management Suite - Distribution Build Script
# =====================================================
# This script builds all platforms for distribution
# Run from the project root directory
# =====================================================

set -e

echo "=============================================="
echo "  AIXILCOILS Management Suite Build Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -p "require('./client/package.json').version")
echo -e "${BLUE}Building version: ${VERSION}${NC}"
echo ""

# Create dist directory
DIST_DIR="./distribution"
mkdir -p "$DIST_DIR"

# =====================================================
# Build Web Application
# =====================================================
echo -e "${YELLOW}[1/4] Building Web Application...${NC}"
cd client
npm install --legacy-peer-deps
npm run build
cp -r dist ../distribution/web
cd ..
echo -e "${GREEN}✓ Web build complete${NC}"
echo ""

# =====================================================
# Build Desktop Applications (Electron)
# =====================================================
echo -e "${YELLOW}[2/4] Building Desktop Applications...${NC}"
cd desktop
npm install

# Build for current platform
echo "Building for current platform..."
npm run pack

# Copy built files to distribution
if [ -d "dist" ]; then
    mkdir -p ../distribution/desktop
    cp -r dist/* ../distribution/desktop/ 2>/dev/null || true
fi
cd ..
echo -e "${GREEN}✓ Desktop build complete${NC}"
echo ""

# =====================================================
# Prepare Mobile (Capacitor) Projects
# =====================================================
echo -e "${YELLOW}[3/4] Preparing Mobile Projects...${NC}"
cd client

# Sync mobile platforms
if [ -d "android" ]; then
    echo "Syncing Android project..."
    npx cap sync android
    echo "To build Android APK, open 'client/android' in Android Studio"
fi

if [ -d "ios" ]; then
    echo "Syncing iOS project..."
    npx cap sync ios
    echo "To build iOS IPA, open 'client/ios/App' in Xcode"
fi

cd ..
echo -e "${GREEN}✓ Mobile preparation complete${NC}"
echo ""

# =====================================================
# Create Distribution Summary
# =====================================================
echo -e "${YELLOW}[4/4] Creating distribution summary...${NC}"

cat > "$DIST_DIR/README.md" << EOF
# AIXILCOILS Management Suite - Distribution v${VERSION}

## Available Builds

### Web Application
Location: \`./web/\`
Deploy the contents of this folder to your web server.

### Desktop Applications
Location: \`./desktop/\`

Files included (varies by build platform):
- **Windows**: \`.exe\` installer and portable version
- **macOS**: \`.dmg\` disk image
- **Linux**: \`.AppImage\`, \`.deb\`, and \`.rpm\` packages

### Mobile Applications
Mobile projects require platform-specific build tools:

#### Android
1. Open \`client/android\` folder in Android Studio
2. Build > Generate Signed Bundle / APK
3. APK will be in \`app/build/outputs/apk/\`

#### iOS
1. Open \`client/ios/App/App.xcworkspace\` in Xcode
2. Product > Archive
3. Distribute via App Store Connect or export IPA

## Installation Instructions

### Web Deployment
Deploy the \`web/\` folder contents to:
- Vercel, Netlify, or similar static hosting
- Nginx, Apache, or any web server
- Cloud services (AWS S3, Azure Blob, GCP Cloud Storage)

### Windows Installation
Run the \`.exe\` installer or use the portable version directly.

### macOS Installation
1. Open the \`.dmg\` file
2. Drag the app to Applications folder
3. On first launch, right-click and select "Open"

### Linux Installation
- **AppImage**: Make executable and run directly
- **DEB (Ubuntu/Debian)**: \`sudo dpkg -i filename.deb\`
- **RPM (Fedora/RHEL)**: \`sudo rpm -i filename.rpm\`

### Android Installation
- Allow installation from unknown sources in settings
- Open the APK file to install

### iOS Installation
- Distribute via TestFlight or App Store
- Enterprise distribution requires MDM or ad-hoc provisioning

## Server Deployment
The backend server requires:
- Node.js 18+
- PostgreSQL 14+
- Redis (optional)

See the main README.md for server deployment instructions.

---
Built on: $(date)
Version: ${VERSION}
EOF

echo -e "${GREEN}✓ Distribution summary created${NC}"
echo ""

# =====================================================
# Final Summary
# =====================================================
echo "=============================================="
echo -e "${GREEN}  Build Complete!${NC}"
echo "=============================================="
echo ""
echo "Distribution files are in: ${DIST_DIR}/"
echo ""
echo "Contents:"
ls -la "$DIST_DIR"
echo ""
echo "Next steps:"
echo "  1. Test the builds on target platforms"
echo "  2. For mobile, complete builds in Android Studio/Xcode"
echo "  3. Upload to your distribution server or app stores"
echo ""
echo "=============================================="
