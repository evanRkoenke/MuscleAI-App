import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Muscle AI | Calorie Tracker",
  slug: "muscle-ai-or-calorie-tracker", // Fixed to match your dashboard
  version: "1.0.0",
  owner: "evankoenkes-organization",
  extra: {
    eas: { 
      projectId: "aace2de1-ac67-4116-9acf-5820c84bb35c" 
    }
  },
  ios: {
    bundleIdentifier: "com.evankoenke.muscleaiorcalorietracker",
    appleTeamId: "RS439TZ92G",
    supportsTablet: true,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "Muscle AI needs camera access to scan and analyze your meals.",
      NSPhotoLibraryUsageDescription: "Muscle AI needs access to your photos to track your progress."
    }
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    "expo-iap" // This is for your paywall
  ]
};

export default config;
