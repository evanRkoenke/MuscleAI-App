// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Muscle AI | Calorie Tracker",
  appSlug: "muscle-ai",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663415661115/jEYsPpDSGDCRyFOc.png",
  // Deep link scheme for OAuth callbacks and universal links
  scheme: "muscleai",
  // Bundle identifiers — must match your Apple Developer and Google Play accounts
  iosBundleId: "com.evankoenke.muscleaiorcalorietracker",
  androidPackage: "com.evankoenke.muscleaiorcalorietracker",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  backgroundColor: "#000000",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "18396eeb-c055-4675-932a-b23ba5ca5dd7",
    },
  },
  owner: "evankoenke",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    usesAppleSignIn: true,
    appleTeamId: "RS439TZ92G",
    backgroundColor: "#000000",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIUserInterfaceStyle: "Dark",
      NSCameraUsageDescription: "Muscle AI needs camera access to scan and analyze your meals.",
      NSPhotoLibraryUsageDescription: "Muscle AI needs photo library access to select meal photos for analysis.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS", "CAMERA"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-system-ui",
    "expo-router",
    "expo-apple-authentication",
    "expo-iap",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: "com.googleusercontent.apps.1065961245057-gr4tn43ag02jigrjv5vmlohff8iaii6v",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000000",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
