import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";
import {
  signInWithApple,
  signInWithGoogle,
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
} from "@/lib/native-auth";
import { startOAuthLogin } from "@/constants/oauth";

/**
 * Auth Screen — Sign in with Google or Apple
 *
 * Uses native sign-in on iOS/Android:
 * - Apple: Native iOS "Sign in with Apple" sheet (expo-apple-authentication)
 * - Google: Native Google Sign-In popup (@react-native-google-signin/google-signin)
 *
 * Falls back to Manus OAuth on web.
 *
 * After successful sign-in, the identity token is sent to our server
 * for verification, session creation, and user sync.
 */
export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams<{ returnFromPaywall?: string }>();
  const { subscription, resetOnboarding, setAuthenticated, markPaywallSeen } = useApp();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const handleNativeAuth = async (provider: "Google" | "Apple") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearError();
    setLoading(true);
    setLoadingProvider(provider);

    try {
      let result;

      if (provider === "Apple") {
        result = await signInWithApple();
      } else {
        result = await signInWithGoogle();
      }

      if (result.success) {
        // Authentication succeeded — mark as authenticated and navigate to tabs
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setAuthenticated(true);
        markPaywallSeen();
        router.replace("/(tabs)");
      } else if (result.error === "Sign-in was cancelled") {
        // User cancelled — just reset the loading state
        setLoading(false);
        setLoadingProvider(null);
      } else {
        // Sign-in failed with an error
        setError(result.error || `${provider} sign-in failed. Please try again.`);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setLoading(false);
        setLoadingProvider(null);
      }
    } catch (e: any) {
      setError(`${provider} sign-in failed. Please try again.`);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleWebAuth = async (provider: string) => {
    // Web fallback: use Manus OAuth portal
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearError();
    setLoading(true);
    setLoadingProvider(provider);

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setLoadingProvider(null);
      setError(
        `${provider} sign-in is taking too long. Please check your internet connection and try again.`
      );
    }, 15000);

    try {
      await startOAuthLogin();
    } catch (e) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setError(`${provider} sign-in failed. Please try again.`);
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleAuth = () => {
    if (Platform.OS === "web" || !isGoogleSignInAvailable()) {
      handleWebAuth("Google");
    } else {
      handleNativeAuth("Google");
    }
  };

  const handleAppleAuth = () => {
    if (Platform.OS === "web" || !isAppleSignInAvailable()) {
      handleWebAuth("Apple");
    } else {
      handleNativeAuth("Apple");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo-cropped.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.logo}>MUSCLE AI</Text>
          <Text style={styles.tagline}>Hypertrophy-Optimized Nutrition</Text>
        </View>

        <View style={styles.form}>
          {/* Title */}
          <Text style={styles.formTitle}>Sign In</Text>

          {/* Subtitle */}
          <Text style={styles.subtitleText}>
            Sign in to access your dashboard{"\n"}
            and start tracking your nutrition.
          </Text>

          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#FF3D3D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.socialButton, loadingProvider === "Google" && styles.socialButtonActive]}
            onPress={handleGoogleAuth}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loadingProvider === "Google" ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continue with Apple — only show on iOS */}
          {(Platform.OS === "ios" || Platform.OS === "web") && (
            <TouchableOpacity
              style={[styles.socialButton, loadingProvider === "Apple" && styles.socialButtonActive]}
              onPress={handleAppleAuth}
              activeOpacity={0.7}
              disabled={loading}
            >
              {loadingProvider === "Apple" ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.socialIcon}>{"\uF8FF"}</Text>
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Retake Quiz link */}
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={async () => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              await resetOnboarding();
              router.replace("/onboarding");
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.left" size={14} color="#666666" />
            <Text style={styles.retakeText}>Retake Onboarding Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImage: {
    width: 100,
    height: 68,
    marginBottom: 16,
  },
  logo: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
    color: "#888888",
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    color: "#F0F0F0",
  },
  subtitleText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "#888888",
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,61,61,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,61,61,0.2)",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#FF3D3D",
    lineHeight: 20,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    gap: 10,
  },
  socialButtonActive: {
    borderColor: "#333333",
    backgroundColor: "#1A1A1A",
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F0F0F0",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0F0",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
  },
});
