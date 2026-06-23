#!/bin/bash
# ============================================================
# 🍯 Cash Honey — Mobile Build Script
# Generates Android APK + iOS project for Play Store & App Store
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}🍯 ========================================${NC}"
echo -e "${YELLOW}   Cash Honey — Mobile App Builder${NC}"
echo -e "${YELLOW} ========================================${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}[1/8]${NC} Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

if ! command -v java &> /dev/null; then
  echo -e "${YELLOW}⚠️  Java not found. Android builds need JDK 17+${NC}"
  echo "   Install: brew install openjdk@17 (macOS) or sudo apt install openjdk-17-jdk (Linux)"
  SKIP_ANDROID=true
else
  echo -e "${GREEN}✅ Java found${NC}"
  SKIP_ANDROID=false
fi

# Step 2: Build the web app
echo ""
echo -e "${BLUE}[2/8]${NC} Building web app..."
cd "$(dirname "$0")"

# The dist folder should already exist from the watch build
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}dist/ not found, building...${NC}"
  npx vite build
fi
echo -e "${GREEN}✅ Web app built${NC}"

# Step 3: Generate icons
echo ""
echo -e "${BLUE}[3/8]${NC} Generating app icons..."
node scripts/generate-icons.mjs
echo -e "${GREEN}✅ Icons ready${NC}"

# Step 4: Initialize Capacitor (if not already)
echo ""
echo -e "${BLUE}[4/8]${NC} Setting up Capacitor..."

if [ ! -d "node_modules/@capacitor/cli" ]; then
  echo -e "${YELLOW}Installing Capacitor packages...${NC}"
  npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app @capacitor/splash-screen @capacitor/status-bar
fi
echo -e "${GREEN}✅ Capacitor ready${NC}"

# Step 5: Add Android platform
if [ "$SKIP_ANDROID" = false ] && [ ! -d "android" ]; then
  echo ""
  echo -e "${BLUE}[5/8]${NC} Adding Android platform..."
  npx cap add android
  echo -e "${GREEN}✅ Android platform added${NC}"
else
  echo ""
  echo -e "${BLUE}[5/8]${NC} Android platform already exists, syncing..."
fi

# Step 6: Add iOS platform (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]] && [ ! -d "ios" ]; then
  echo ""
  echo -e "${BLUE}[6/8]${NC} Adding iOS platform..."
  npx cap add ios
  echo -e "${GREEN}✅ iOS platform added${NC}"
elif [[ "$OSTYPE" != "darwin"* ]]; then
  echo ""
  echo -e "${BLUE}[6/8]${NC} ⏭️  Skipping iOS (requires macOS with Xcode)"
else
  echo ""
  echo -e "${BLUE}[6/8]${NC} iOS platform already exists, syncing..."
fi

# Step 7: Copy web assets to native projects
echo ""
echo -e "${BLUE}[7/8]${NC} Syncing web assets to native projects..."
npx cap sync
echo -e "${GREEN}✅ Assets synced${NC}"

# Step 8: Build native apps
echo ""
echo -e "${BLUE}[8/8]${NC} Building native apps..."

if [ "$SKIP_ANDROID" = false ]; then
  echo -e "${BLUE}📱 Building Android APK...${NC}"
  cd android
  ./gradlew assembleDebug
  cd ..
  APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
  if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" ./CashHoney-debug.apk
    echo -e "${GREEN}✅ Android APK built: CashHoney-debug.apk${NC}"
  fi
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "${BLUE}📱 Building iOS...${NC}"
  echo -e "${YELLOW}   Opening Xcode — select your device/simulator and press Play!${NC}"
  npx cap open ios
fi

echo ""
echo -e "${YELLOW}🍯 ========================================${NC}"
echo -e "${GREEN}   Build complete!${NC}"
echo -e "${YELLOW} ========================================${NC}"
echo ""
echo -e "📱 ${BLUE}Android:${NC} CashHoney-debug.apk"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "📱 ${BLUE}iOS:${NC}     Opened in Xcode"
else
  echo -e "📱 ${BLUE}iOS:${NC}     Run this on macOS with Xcode installed"
fi
echo ""
echo -e "${YELLOW}For Play Store:${NC}"
echo "  1. Create a Google Play Developer account ($25 one-time)"
echo "  2. Build release: cd android && ./gradlew assembleRelease"
echo "  3. Sign with your keystore (see PUBLISH-GUIDE.md)"
echo "  4. Upload to https://play.google.com/console"
echo ""
echo -e "${YELLOW}For App Store:${NC}"
echo "  1. Apple Developer account ($99/year)"
echo "  2. Open ios/App/App.xcworkspace in Xcode"
echo "  3. Product > Archive > Upload to App Store Connect"
echo "  4. Submit for review at https://appstoreconnect.apple.com"
echo ""
