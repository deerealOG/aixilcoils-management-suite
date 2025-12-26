# Distribution Guide

This guide explains how to build, distribute, and install the AIXILCOILS Management Suite across all platforms.

## Quick Start

### Windows Build Script

```batch
scripts\build-distribution.bat
```

### Linux/macOS Build Script

```bash
chmod +x scripts/build-distribution.sh
./scripts/build-distribution.sh
```

---

## Platform-Specific Instructions

### 1. Web Application

#### Build

```bash
cd client
npm install
npm run build
```

#### Deploy

The built files are in `client/dist/`. Deploy to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **Nginx/Apache**: Copy contents to web root
- **AWS S3**: `aws s3 sync dist/ s3://your-bucket`

---

### 2. Windows Desktop App

#### Requirements

- Node.js 18+
- Visual Studio Build Tools (for native modules)

#### Build

```bash
cd desktop
npm install
npm run build:win
```

#### Output Files

- `dist/AIXILCOILS AMS Setup 1.0.0.exe` - NSIS Installer
- `dist/AIXILCOILS AMS 1.0.0.exe` - Portable version

#### Distribution Options

1. **Direct Download**: Host on your website
2. **Internal CDN**: Use SharePoint, Google Drive, etc.
3. **Windows Package Manager**: Submit to Windows Store

#### Installation

Employees can run the `.exe` installer or use the portable version directly.

---

### 3. macOS Desktop App

#### Requirements

- macOS 10.15+
- Xcode Command Line Tools

#### Build

```bash
cd desktop
npm install
npm run build:mac
```

#### Output Files

- `dist/AIXILCOILS AMS-1.0.0.dmg` - Disk image
- `dist/AIXILCOILS AMS-1.0.0-mac.zip` - Zipped app

#### Code Signing (Required for Distribution)

```bash
# Sign the app (requires Apple Developer certificate)
codesign --deep --force --sign "Developer ID Application: YOUR_TEAM_ID" "AIXILCOILS AMS.app"

# Notarize the app
xcrun notarytool submit "AIXILCOILS AMS.dmg" --apple-id YOUR_APPLE_ID --team-id YOUR_TEAM_ID --password YOUR_APP_PASSWORD
```

#### Installation

Users open the .dmg and drag the app to Applications.

---

### 4. Linux Desktop App

#### Build

```bash
cd desktop
npm install
npm run build:linux
```

#### Output Files

- `dist/AIXILCOILS AMS-1.0.0.AppImage` - Universal package
- `dist/aixilcoils-ams_1.0.0_amd64.deb` - Debian/Ubuntu
- `dist/aixilcoils-ams-1.0.0.x86_64.rpm` - Fedora/RHEL

#### Installation

```bash
# AppImage (universal)
chmod +x AIXILCOILS-AMS-1.0.0.AppImage
./AIXILCOILS-AMS-1.0.0.AppImage

# Debian/Ubuntu
sudo dpkg -i aixilcoils-ams_1.0.0_amd64.deb
sudo apt-get install -f  # Fix dependencies

# Fedora/RHEL
sudo rpm -i aixilcoils-ams-1.0.0.x86_64.rpm
```

---

### 5. Android Mobile App

#### Requirements

- Android Studio
- JDK 17
- Android SDK

#### Build APK

```bash
cd client
npm install
npm run build
npm run mobile:add:android
npm run mobile:sync

# Open in Android Studio
npm run mobile:open:android
```

Then in Android Studio:

1. Build > Generate Signed Bundle / APK
2. Choose APK
3. Create or select keystore
4. Build for Release

#### Output

- `client/android/app/build/outputs/apk/release/app-release.apk`

#### Distribution Options

1. **Direct APK Download**: Host on your website
2. **Google Play Store**: Submit via Play Console
3. **MDM**: Distribute via mobile device management

---

### 6. iOS Mobile App

#### Requirements

- macOS with Xcode 14+
- Apple Developer Account ($99/year)
- iOS device for testing

#### Build

```bash
cd client
npm install
npm run build
npm run mobile:add:ios
npm run mobile:sync

# Open in Xcode
npm run mobile:open:ios
```

Then in Xcode:

1. Select your team in Signing & Capabilities
2. Product > Archive
3. Distribute via App Store Connect or Ad Hoc

#### Distribution Options

1. **TestFlight**: For beta testing
2. **App Store**: Public distribution
3. **Enterprise**: In-house distribution (requires Enterprise account)
4. **Ad Hoc**: Direct install with provisioning profiles

---

## Automated CI/CD Builds

The project includes GitHub Actions workflows for automated builds:

### Trigger a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will:

1. Build web app
2. Build Windows, macOS, and Linux desktop apps
3. Build Android APK
4. Create a GitHub Release with all artifacts

### Manual Workflow Trigger

Go to GitHub Actions > Build Desktop Apps > Run workflow

---

## Download Page Setup

1. Host `distribution/download-page.html` on your website
2. Update the download URLs to point to your hosted files:
   - `/downloads/AIXILCOILS-AMS-Setup-1.0.0.exe`
   - `/downloads/AIXILCOILS-AMS-1.0.0.dmg`
   - `/downloads/AIXILCOILS-AMS-1.0.0.AppImage`
   - `/downloads/AIXILCOILS-AMS-1.0.0.apk`
3. Update App Store and Play Store links when published
4. Generate QR codes for mobile downloads

---

## Version Updates

When releasing a new version:

1. Update version in:

   - `client/package.json`
   - `desktop/package.json`
   - `server/package.json`
   - `client/capacitor.config.json`

2. Update version in download page HTML

3. Create a git tag and push:
   ```bash
   git tag v1.x.x
   git push origin v1.x.x
   ```

---

## Employee Onboarding Flow

After distribution:

1. **Admin/HR** invites employee via AMS dashboard
2. Employee receives **welcome email** with:
   - Login credentials
   - Download links for all platforms
3. Employee downloads app for their platform
4. Employee logs in and completes **onboarding wizard**
5. Employee has full access to AMS

---

## Security Considerations

### Code Signing

- **Windows**: Use a code signing certificate (EV recommended)
- **macOS**: Notarize with Apple Developer ID
- **Android**: Sign APK with your release keystore

### APK Distribution

If distributing APK directly (not via Play Store):

- Inform employees to enable "Install from unknown sources"
- Consider using an MDM solution for enterprise distribution

### Auto-Updates

Desktop apps include auto-update functionality:

- Configure update server URL in environment variables
- Use electron-builder's publish configuration

---

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed
- Check Node.js version (18+ required)
- Clear node_modules and reinstall

### App Not Installing

- **Windows**: Run as administrator
- **macOS**: Allow in System Preferences > Security
- **Android**: Enable unknown sources

### Mobile Build Issues

- Ensure Android Studio / Xcode are up to date
- Run `npx cap sync` after any web build changes

---

Need help? Contact the development team.
