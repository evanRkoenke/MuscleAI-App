import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { startOAuthLogin } from "@/constants/oauth";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ELECTRIC_BLUE = "#007AFF";

export default function AuthScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setAuthenticated } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLoading(true);
    setError("");
    try {
      await startOAuthLogin();
    } catch (e) {
      console.error("Auth error:", e);
      setError("Sign in failed. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setAuthenticated(true);
    (router as any).replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.appName}>MUSCLE AI</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            Hypertrophy-Optimized Nutrition
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descContainer}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>
            Sign in to sync your data
          </Text>
          <Text style={[styles.descBody, { color: colors.muted }]}>
            Track your nutrition with AI-powered scanning.{"\n"}Sign in to sync across all your devices.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <IconSymbol name="xmark.circle.fill" size={18} color="#FF3D3D" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.signInButton}
        >
          <LinearGradient
            colors={[ELECTRIC_BLUE, "#0055CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signInGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          style={[styles.skipButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>Continue Without Account</Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Without an account, your data stays on this device only.{"\n"}Sign in anytime later from Settings.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  brand: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,122,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: "900",
    color: ELECTRIC_BLUE,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 1,
  },
  descContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  descTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  descBody: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    width: "100%",
    gap: 8,
  },
  errorText: {
    color: "#FF3D3D",
    fontSize: 14,
    flex: 1,
  },
  signInButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  signInGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  skipButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
