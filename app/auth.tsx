import { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const colors = useColors();
  const { setAuthenticated, updateProfile } = useApp();

  const handleAuth = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      // Simulate auth — in production this would use Supabase/Manus OAuth
      await new Promise((resolve) => setTimeout(resolve, 800));
      await updateProfile({ email, name: name || email.split("@")[0] });
      await setAuthenticated(true);
      router.replace("/paywall");
    } catch (e) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await updateProfile({ email: `user@${provider}.com`, name: `${provider} User` });
      await setAuthenticated(true);
      router.replace("/paywall");
    } catch (e) {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>MUSCLE AI</Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>
              Hypertrophy-Optimized Nutrition
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            {!isLogin && (
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <IconSymbol name="person.fill" size={20} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <IconSymbol name="paperplane.fill" size={20} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <IconSymbol name="lock.fill" size={20} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : null}

            {isLogin && (
              <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={handleAuth}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => handleSocialAuth("google")}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialIcon, { color: colors.foreground }]}>G</Text>
              <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => handleSocialAuth("apple")}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialIcon, { color: colors.foreground }]}></Text>
              <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, { color: colors.muted }]}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {isLogin ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  authButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: "700",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 8,
  },
  toggleText: {
    fontSize: 15,
  },
});
