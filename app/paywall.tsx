import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import {
  PLANS,
  IAP_PRODUCTS,
  ALL_PRODUCT_IDS,
  isNativeIAPAvailable,
  purchaseViaStripe,
  productIdToTier,
  type PlanInfo,
} from "@/lib/iap-service";
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const DARK_BG = "#0A0E14";

/**
 * Paywall Screen — Clinical Luxury Design
 *
 * On iOS/Android: triggers native StoreKit 2 / Google Play purchase sheet via expo-iap.
 * On Web: falls back to Stripe Payment Links.
 *
 * The useIAP hook from expo-iap is conditionally imported only on native
 * platforms. On web, the hook is replaced with a no-op stub.
 */

// ─── Conditional IAP hook (native only) ───
let useIAPHook: any = null;
let requestPurchaseFn: any = null;
if (Platform.OS !== "web") {
  try {
    const expoIap = require("expo-iap");
    useIAPHook = expoIap.useIAP;
    requestPurchaseFn = expoIap.requestPurchase;
  } catch {
    // expo-iap not available (e.g., Expo Go)
    useIAPHook = null;
    requestPurchaseFn = null;
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const { setSubscription } = useApp();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [iapReady, setIapReady] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Initialize native IAP if available
  useEffect(() => {
    if (useIAPHook) {
      setIapReady(true);
    }
  }, []);

  // ─── Purchase handler ───
  const handleSubscribe = async (plan: PlanInfo) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPurchaseError(null);
    setSubscribing(plan.id);

    try {
      if (isNativeIAPAvailable() && iapReady && requestPurchaseFn) {
        // ─── Native IAP path (iOS StoreKit 2 / Google Play Billing) ───
        try {
          await requestPurchaseFn({ sku: plan.productId });
          // On success, the purchase listener (configured in a production build)
          // would call finishTransaction and validate the receipt.
          // For now, we apply the subscription locally.
          const tier = plan.id as "essential" | "pro" | "elite";
          await setSubscription(tier);

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          Alert.alert(
            "Welcome to " + tier.charAt(0).toUpperCase() + tier.slice(1) + "!",
            tier === "elite"
              ? "Your 12-Month Muscle Forecast and Priority Sync are now unlocked!"
              : "Your subscription is now active. Enjoy Muscle AI!",
            [{ text: "Let's Go", onPress: () => router.replace("/(tabs)") }]
          );
        } catch (iapError: any) {
          // User cancelled or IAP not configured — fall through to Stripe
          if (
            iapError?.code === "E_USER_CANCELLED" ||
            iapError?.message?.includes("cancel")
          ) {
            setSubscribing(null);
            return;
          }

          // IAP not configured in this build (Expo Go) — fall back to Stripe
          console.warn("[IAP] Native purchase failed, falling back to Stripe:", iapError);
          await handleStripeFallback(plan);
        }
      } else {
        // ─── Web / Stripe fallback path ───
        await handleStripeFallback(plan);
      }
    } catch (error: any) {
      console.error("[Paywall] Subscribe error:", error);
      setPurchaseError(
        "Something went wrong. Please try again or contact Muscle Support."
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSubscribing(null);
    }
  };

  // ─── Stripe fallback ───
  const handleStripeFallback = async (plan: PlanInfo) => {
    await purchaseViaStripe(plan.productId);

    // Set subscription locally (in production, confirmed via webhook/receipt validation)
    const tier = plan.id as "essential" | "pro" | "elite";
    await setSubscription(tier);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      "Welcome to " + tier.charAt(0).toUpperCase() + tier.slice(1) + "!",
      tier === "elite"
        ? "Your 12-Month Muscle Forecast and Priority Sync are now unlocked!"
        : "Your subscription is now active. Enjoy Muscle AI!",
      [{ text: "Let's Go", onPress: () => router.replace("/(tabs)") }]
    );
  };

  // ─── Restore purchases ───
  const handleRestore = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isNativeIAPAvailable() && iapReady) {
      Alert.alert(
        "Restore Purchases",
        "To restore purchases on a native build:\n1. Build with EAS\n2. Sign in with the Apple ID used for purchase\n3. Tap Restore again\n\nYour subscription will be automatically detected.",
        [
          { text: "Contact Support", onPress: () => (router as any).push("/support") },
          { text: "OK", style: "cancel" },
        ]
      );
    } else {
      Alert.alert(
        "Restore Purchases",
        "Sign in with the same account to restore your subscription. If you're having issues, contact Muscle Support.",
        [
          { text: "Contact Support", onPress: () => (router as any).push("/support") },
          { text: "OK", style: "cancel" },
        ]
      );
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Unlock Your</Text>
          <Text style={styles.titleHighlight}>Full Potential</Text>
          <Text style={styles.subtitle}>
            Choose your plan to access AI-powered nutrition tracking
          </Text>
          {isNativeIAPAvailable() && (
            <View style={styles.nativeBadge}>
              <IconSymbol name="checkmark" size={10} color="#00E676" />
              <Text style={styles.nativeBadgeText}>
                Secure In-App Purchase via {Platform.OS === "ios" ? "Apple" : "Google Play"}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Error Banner ─── */}
        {purchaseError && (
          <View style={styles.errorBanner}>
            <IconSymbol name="xmark.circle.fill" size={16} color="#FF3D3D" />
            <Text style={styles.errorText}>{purchaseError}</Text>
            <TouchableOpacity onPress={() => setPurchaseError(null)}>
              <IconSymbol name="xmark" size={14} color="#7A8A99" />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Tier Cards ─── */}
        <View style={styles.tiersContainer}>
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.tierCard,
                plan.highlighted && styles.tierCardHighlighted,
              ]}
            >
              {plan.highlighted && (
                <LinearGradient
                  colors={["rgba(0,122,255,0.08)", "rgba(0,212,255,0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {plan.highlighted && (
                <LinearGradient
                  colors={[ELECTRIC_BLUE, CYAN_GLOW]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>BEST VALUE</Text>
                </LinearGradient>
              )}
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.tierPrice}>{plan.price}</Text>
                  <Text style={styles.tierPeriod}>{plan.period}</Text>
                </View>
                {plan.savings && (
                  <Text style={styles.savings}>{plan.savings}</Text>
                )}
              </View>
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <IconSymbol
                      name="checkmark"
                      size={14}
                      color={plan.highlighted ? CYAN_GLOW : ELECTRIC_BLUE}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  !plan.highlighted && styles.subscribeButtonOutline,
                ]}
                onPress={() => handleSubscribe(plan)}
                activeOpacity={0.8}
                disabled={subscribing !== null}
              >
                {plan.highlighted ? (
                  <LinearGradient
                    colors={[ELECTRIC_BLUE, "#FF3B30"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscribeGradient}
                  >
                    {subscribing === plan.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.subscribeTextWhite}>UNLOCK</Text>
                        {isNativeIAPAvailable() && (
                          <IconSymbol name="faceid" size={18} color="#FFFFFF" />
                        )}
                      </>
                    )}
                  </LinearGradient>
                ) : subscribing === plan.id ? (
                  <ActivityIndicator color={ELECTRIC_BLUE} />
                ) : (
                  <Text style={styles.subscribeTextBlue}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ─── Skip ─── */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Continue with Free</Text>
        </TouchableOpacity>

        {/* ─── Restore ─── */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* ─── Legal ─── */}
        <Text style={styles.legalText}>
          Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google"} account.
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  headerLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ECEDEE",
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
    color: ELECTRIC_BLUE,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    color: "#7A8A99",
  },
  nativeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0,230,118,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.2)",
  },
  nativeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00E676",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,61,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,61,61,0.2)",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#FF6B6B",
  },
  tiersContainer: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
  },
  tierCardHighlighted: {
    borderWidth: 2,
    borderColor: ELECTRIC_BLUE,
    padding: 24,
    shadowColor: ELECTRIC_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  tierHeader: {
    marginBottom: 16,
  },
  tierName: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.5,
    color: "#ECEDEE",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  tierPrice: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ECEDEE",
  },
  tierPeriod: {
    fontSize: 16,
    marginLeft: 4,
    color: "#5A6A7A",
  },
  savings: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    color: "#00E676",
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#ECEDEE",
  },
  subscribeButton: {
    borderRadius: 26,
    overflow: "hidden",
  },
  subscribeButtonOutline: {
    height: 50,
    borderWidth: 1,
    borderColor: ELECTRIC_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  subscribeTextWhite: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },
  subscribeTextBlue: {
    color: ELECTRIC_BLUE,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  skipButton: {
    alignItems: "center",
    marginTop: 20,
    padding: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#5A6A7A",
  },
  restoreButton: {
    alignItems: "center",
    marginTop: 4,
    padding: 8,
  },
  restoreText: {
    fontSize: 13,
    textDecorationLine: "underline",
    color: "#5A6A7A",
  },
  legalText: {
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    color: "#3A4A5A",
  },
});
