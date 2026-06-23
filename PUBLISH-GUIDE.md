# 🍯 Cash Honey — Play Store & App Store Publishing Guide

## Quick Start (One Command)

```bash
# On your local machine (macOS/Linux):
git clone <your-repo>
cd cash-honey-app
./build-mobile.sh
```

This will:
1. ✅ Generate all app icons (Android + iOS)
2. ✅ Set up Capacitor (native wrapper)
3. ✅ Create Android project with Gradle
4. ✅ Create iOS project with Xcode
5. ✅ Build a debug APK for testing
6. ✅ Open Xcode for iOS (macOS only)

---

## 📱 Google Play Store (Android)

### Prerequisites
- **Google Play Developer Account** — $25 one-time fee at https://play.google.com/console
- **Java JDK 17+** — `brew install openjdk@17` (macOS) or `sudo apt install openjdk-17-jdk` (Linux)

### Step 1: Build Release APK
```bash
cd android

# Create a signing key (one-time)
keytool -genkey -v -keystore cashhoney-release.keystore \
  -alias cashhoney -keyalg RSA -keysize 2048 -validity 10000

# Build release
./gradlew assembleRelease
```

### Step 2: Upload to Play Console
1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name:** Cash Honey — AI Finance Advisor
   - **Package:** com.cashhoney.app
   - **Category:** Finance
   - **Price:** Free
4. Upload `android/app/build/outputs/apk/release/app-release.apk`
5. Add screenshots, description, feature graphic
6. Submit for review (usually 1-3 days)

### Required Assets
| Asset | Size |
|-------|------|
| Feature graphic | 1024 x 500 |
| Phone screenshots | Min 2, 16:9 or 9:16 |
| Hi-res icon | 512 x 512 |
| Privacy policy URL | https://your-privacy-page.com |

---

## 🍎 App Store (iOS)

### Prerequisites
- **Mac with Xcode 15+** (required — no way around this)
- **Apple Developer Account** — $99/year at https://developer.apple.com
- **Physical iPhone** or Simulator for testing

### Step 1: Open in Xcode
```bash
npx cap open ios
# Or manually open: ios/App/App.xcworkspace
```

### Step 2: Configure in Xcode
1. Select **App** target in the left panel
2. Under **Signing & Capabilities**:
   - Select your Team (Apple Developer account)
   - Change Bundle Identifier to: `com.yourname.cashhoney`
3. Under **General**:
   - Set Display Name: "Cash Honey"
   - Set Version: 1.0.0
   - Set Build: 1

### Step 3: Build & Archive
1. Select "Any iOS Device" as target
2. **Product → Archive**
3. Wait for archive to complete
4. Click **"Distribute App"**
5. Select **"App Store Connect"**
6. Follow the wizard → Upload

### Step 4: Submit for Review
1. Go to https://appstoreconnect.apple.com
2. Select your app → **"Prepare for Submission"**
3. Add screenshots (6.7" and 5.5" required), description, keywords
4. Set pricing and availability
5. Submit for review (usually 1-3 days)

### Required Assets
| Asset | Size |
|-------|------|
| App icon | 1024 x 1024 |
| 6.7" iPhone screenshots | 1290 x 2796 |
| 5.5" iPhone screenshots | 1242 x 2208 |
| App Store icon | 1024 x 1024 |

---

## 🔧 Troubleshooting

### "Gradle not found"
```bash
cd android && ./gradlew --version
# If missing: export JAVA_HOME=$(/usr/libexec/java_home)
```

### "Capacitor sync failed"
```bash
npx cap copy
npx cap sync
```

### "iOS build fails in Xcode"
- Make sure you're opening `.xcworkspace` NOT `.xcodeproj`
- Clean build folder: **Shift+Cmd+K**
- Make sure signing team is selected

---

## 📋 Checklist

- [ ] Play Developer Account created ($25)
- [ ] Apple Developer Account created ($99/year)  
- [ ] Java JDK 17+ installed
- [ ] `./build-mobile.sh` runs successfully
- [ ] Debug APK installs on Android phone
- [ ] App runs in iOS Simulator
- [ ] App icon looks good at all sizes
- [ ] Screenshots taken for store listings
- [ ] Privacy policy page created
- [ ] Store descriptions written
- [ ] Submitted for review!
