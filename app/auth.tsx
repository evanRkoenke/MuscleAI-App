import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";


const PRIMARY_WHITE = "#FFFFFF";

type AuthMode = "login" | "signup" | "forgot";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const colors = useColors();
  const { setAuthenticated, updateProfile } = useApp();

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleAuth = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      // In production, this connects to Supabase Auth
      // For now, simulates auth with local persistence via AsyncStorage
      await new Promise((resolve) => setTimeout(resolve, 800));
      await updateProfile({
        email: email.trim(),
        name: name.trim() || email.split("@")[0],
      });
      await setAuthenticated(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/paywall");
    } catch (e) {
      setError("Authentication failed. Please check your credentials and try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // In production: await supabase.auth.resetPasswordForEmail(email)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage(
        "Password reset link sent! Check your inbox at " + email.trim() + " and follow the instructions."
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      setError("Unable to send reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearMessages();
    setLoading(true);
    try {
      // In production: Supabase OAuth with Google/Apple
      await new Promise((resolve) => setTimeout(resolve, 800));
      const displayName = provider === "google" ? "Google User" : "Apple User";
      await updateProfile({
        email: `user@${provider}.com`,
        name: displayName,
      });
      await setAuthenticated(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/paywall");
    } catch (e) {
      setError(`${provider} sign-in failed. Please try again or use email.`);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
  };

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
            <Text style={styles.formTitle}>
              {isForgot ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            {isForgot && (
              <Text style={styles.forgotDesc}>
                Enter your email and we'll send you a secure link to reset your password.
              </Text>
            )}

            {/* Name field (signup only) */}
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <IconSymbol name="person.fill" size={20} color="#666666" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#666666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <IconSymbol name="paperplane.fill" size={20} color="#666666" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType={isForgot ? "done" : "next"}
              />
            </View>

            {/* Password (not in forgot mode) */}
            {!isForgot && (
              <View style={styles.inputContainer}>
                <IconSymbol name="lock.fill" size={20} color="#666666" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                />
              </View>
            )}

            {/* Error message */}
            {error ? (
              <View style={styles.errorBox}>
                <IconSymbol name="xmark.circle.fill" size={18} color="#FF3D3D" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success message */}
            {successMessage ? (
              <View style={styles.successBox}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#C0C0C0" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Forgot Password link (login mode only) */}
            {isLogin && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => switchMode("forgot")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.authButton}
              onPress={isForgot ? handleForgotPassword : handleAuth}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={["#444444", "#2A2A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.authButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to login from forgot */}
            {isForgot && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => switchMode("login")}
                activeOpacity={0.7}
              >
                <IconSymbol name="chevron.left.forwardslash.chevron.right" size={16} color={"#FFFFFF"} />
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}

            {/* Social auth (not in forgot mode) */}
            {!isForgot && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialAuth("google")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialAuth("apple")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.socialIcon}>{"\uF8FF"}</Text>
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </TouchableOpacity>

                {/* Toggle login/signup */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => switchMode(isLogin ? "signup" : "login")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Text style={styles.toggleHighlight}>
                      {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
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
    gap: 14,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    color: "#F0F0F0",
  },
  forgotDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "#888888",
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    color: "#F0F0F0",
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
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,230,118,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.2)",
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: "#C0C0C0",
    lineHeight: 20,
  },
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotLinkText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
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
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#FFFFFF",
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
    backgroundColor: "#222222",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666666",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    gap: 10,
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
  toggleButton: {
    alignItems: "center",
    marginTop: 8,
  },
  toggleText: {
    fontSize: 15,
    color: "#888888",
  },
  toggleHighlight: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
});
