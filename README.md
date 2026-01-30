# Annotate Mobile

A React Native mobile application built with Expo, WatermelonDB, and Expo Router for cross-platform annotation and research management.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Known Issues & Fixes](#known-issues--fixes)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Android SDK** with NDK 27.0.12077973 or higher
- **Git**

## Installation

1. Clone the repository:
```bash
git clone https://github.com/annotate-io/annotate-mobile.git
cd annotate-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Install Android NDK (if not already installed):
```bash
# Using Android Studio SDK Manager
# Tools → SDK Manager → SDK Tools → NDK (Side by side) → Install version 27.0.12077973

# Or via command line:
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "ndk;27.0.12077973"
```

## Development Setup

### Android Development

1. **Configure Android SDK location** (if needed):
   - Create or update `android/local.properties`:
   ```properties
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```

2. **Set NDK version** in `android/app/build.gradle`:
   ```gradle
   android {
       ndkVersion "27.0.12077973"
       // ... rest of config
   }
   ```

3. **Start Metro bundler**:
   ```bash
   npm start
   ```

4. **Run on Android device/emulator**:
   ```bash
   npm run android
   ```

### iOS Development (macOS only)

1. **Install CocoaPods dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Run on iOS simulator/device**:
   ```bash
   npm run ios
   ```

### Web Development

```bash
npm run web
```

## Known Issues & Fixes

### 1. Android Build: NDK Version Compatibility

**Problem**: React Native 0.81.5 requires C++20 features (`std::format`) that NDK 26.3 doesn't support, causing compilation errors.

**Error Message**:
```
error: no member named 'format' in namespace 'std'
```

**Solution**:
- Install NDK 27.0.12077973 or higher
- Update `android/app/build.gradle`:
  ```gradle
  android {
      ndkVersion "27.0.12077973"
  }
  ```

**How to Avoid**:
- Always check React Native version requirements for NDK
- Use the latest stable NDK version compatible with your React Native version
- Reference: [React Native NDK Requirements](https://reactnative.dev/docs/environment-setup)

### 2. Expo Router: "Cannot assign to read-only property 'NONE'" Error

**Problem**: Compatibility issue between expo-router and React Native 0.81.5/Hermes, causing non-fatal errors during initialization.

**Error Message**:
```
TypeError: Cannot assign to read-only property 'NONE'
    at Event (expo-router/entry.bundle...)
```

**Solution**:
- Error suppression patches added in `app/_layout.tsx`
- Patches `console.error`, `console.warn`, and `ErrorUtils` global handler
- Error boundary component catches React component errors

**How to Avoid**:
- Keep expo-router updated to latest version
- Monitor expo-router GitHub issues for compatibility updates
- The error is non-fatal and doesn't affect app functionality

**Current Status**: Error is suppressed but may appear briefly during initial load. App functionality is unaffected.

### 3. WatermelonDB: Immutable Relation Assignment

**Problem**: Attempting to use `.set()` on an `immutableRelation` field causes read-only property errors.

**Error Message**:
```
Cannot assign to read-only property
```

**Solution**:
- Set foreign key directly instead of using `.set()`:
  ```typescript
  // ❌ Wrong
  note.task.set(this);
  
  // ✅ Correct
  note.taskId = this.id;
  ```

**How to Avoid**:
- Always set foreign keys directly for `immutableRelation` fields
- Use `.set()` only for mutable relations
- Reference: [WatermelonDB Relations Documentation](https://watermelondb.dev/docs/Relations)

### 4. Android SDK Location Not Found

**Problem**: Gradle can't find Android SDK location.

**Error Message**:
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable
```

**Solution**:
- Create `android/local.properties`:
  ```properties
  sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
  ```

**How to Avoid**:
- Set `ANDROID_HOME` environment variable in your shell profile
- Ensure `local.properties` is in `.gitignore` (it's machine-specific)

### 5. Call Stack Not Symbolicated

**Problem**: Error stack traces show memory addresses instead of readable file names.

**Solution**:
- Enable Hermes source maps in `android/app/build.gradle`:
  ```gradle
  react {
      hermesFlags = ["-O", "-output-source-map"]
  }
  ```

**How to Avoid**:
- Always enable source maps in debug builds
- Keep Hermes enabled for better performance and debugging

## Troubleshooting

### Build Issues

**Clean build cache**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Reset Metro bundler cache**:
```bash
npm start -- --reset-cache
```

**Reinstall dependencies**:
```bash
rm -rf node_modules
npm install
```

### Database Issues

**WatermelonDB not working**:
- Ensure you're using a development build (not Expo Go)
- Run `npx expo prebuild` before `npx expo run:android`
- Check that native modules are properly linked

**Database initialization timeout**:
- Check device/emulator logs for native errors
- Verify SQLite adapter is properly configured
- Ensure JSI is disabled on Android if experiencing crashes

### Platform-Specific Issues

**Android**:
- Verify NDK version matches `build.gradle` configuration
- Check `local.properties` has correct SDK path
- Ensure Android SDK and build tools are up to date

**iOS**:
- Run `pod install` in `ios/` directory after dependency changes
- Clean Xcode build folder: `Product → Clean Build Folder`
- Verify CocoaPods version: `pod --version`

## Project Structure

```
annotate-mobile/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with error handling
│   └── index.tsx          # Main dashboard screen
├── src/
│   └── db/                # WatermelonDB configuration
│       ├── index.ts       # TypeScript resolution file
│       ├── index.native.ts # Native (iOS/Android) adapter
│       ├── index.web.ts   # Web adapter
│       ├── models.ts      # Database models (Task, Note)
│       └── schema.ts      # Database schema
├── android/               # Android native code
│   ├── app/
│   │   └── build.gradle   # App build configuration
│   └── local.properties   # SDK location (gitignored)
├── ios/                   # iOS native code
├── assets/                # Images and static assets
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Key Technologies

- **Expo SDK 54**: Cross-platform development framework
- **React Native 0.81.5**: Mobile app framework
- **Expo Router 6.0.22**: File-based routing
- **WatermelonDB 0.28.0**: Offline-first database
- **TypeScript**: Type-safe development
- **Hermes**: JavaScript engine (Android)

## Development Workflow

1. **Start development server**:
   ```bash
   npm start
   ```

2. **Make changes** to your code

3. **Test on device/emulator**:
   ```bash
   npm run android  # or npm run ios
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

## Contributing

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly

3. Commit with descriptive messages:
   ```bash
   git commit -m "Add: feature description"
   ```

4. Push and create a Pull Request:
   ```bash
   git push -u origin feature/your-feature-name
   ```

## Important Notes

- **Never commit `android/local.properties`** - it's machine-specific
- **Always test on both Android and iOS** before merging
- **Keep dependencies updated** but test thoroughly
- **Document breaking changes** in commit messages
- **Use development builds** for native modules (not Expo Go)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [WatermelonDB Documentation](https://watermelondb.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## License

[Add your license here]

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Last Updated**: January 2025
**Maintained by**: annotate-io team
