import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { startOAuthLogin } from "@/constants/oauth";
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setError("");
    setLoading(true);
    try {
      await startOAuthLogin();
      // On native, the OAuth callback will handle the redirect.
      // On web, the page redirects to the OAuth portal.
      // We keep loading state until the redirect completes.
    } catch (e) {
      setError("Sign-in failed. Please check your connection and try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setLoading(false);
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Allow users to continue without signing in (local-only mode)
    router.replace("/(tabs)");
  }, [router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MUSCLE AI</Text>
          <Text style={styles.tagline}>Hypertrophy-Optimized Nutrition</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome</Text>
          <Text style={styles.formSubtitle}>
            Sign in to sync your meals, macros, and progress across all your devices.
          </Text>

          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#FF3D3D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={[ELECTRIC_BLUE, "#0055CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.authButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cloud sync benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <IconSymbol name="checkmark.circle.fill" size={18} color="#00E676" />
              <Text style={styles.benefitText}>Sync meals across all devices</Text>
            </View>
            <View style={styles.benefitRow}>
              <IconSymbol name="checkmark.circle.fill" size={18} color="#00E676" />
              <Text style={styles.benefitText}>Never lose your nutrition data</Text>
            </View>
            <View style={styles.benefitRow}>
              <IconSymbol name="checkmark.circle.fill" size={18} color="#00E676" />
              <Text style={styles.benefitText}>Daily protein shortfall alerts</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Skip / Continue without account */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Continue without an account</Text>
            <Text style={styles.skipSubtext}>Data stays on this device only</Text>
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
  logo: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
    color: ELECTRIC_BLUE,
    fontStyle: "italic",
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
    color: "#7A8A99",
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#ECEDEE",
  },
  formSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    color: "#7A8A99",
    marginBottom: 4,
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
  authButton: {
    marginTop: 4,
    borderRadius: 27,
    overflow: "hidden",
  },
  authButtonGradient: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  benefitsContainer: {
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: "#ECEDEE",
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1A2533",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5A6A7A",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    gap: 4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ECEDEE",
  },
  skipSubtext: {
    fontSize: 12,
    color: "#5A6A7A",
  },
});
