import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import {
  PLANS,
  purchaseViaStripe,
  type PlanInfo,
} from "@/lib/iap-service";
import * as Haptics from "expo-haptics";

/**
 * Paywall Screen — Two-Plan Model (No Trial)
 *
 * Monthly Essential ($9.99/mo) and Elite Annual ($59.99/yr).
 * Both plans give identical full access. Immediate charge — no free trial.
 * Users must complete payment before accessing the dashboard.
 */

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  // Always show back arrow — user can always go back to previous page
  const { setSubscription, markPaywallSeen, isAuthenticated } = useApp();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // ─── Purchase handler ───
  const handleSubscribe = async (plan: PlanInfo) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPurchaseError(null);
    setSubscribing(plan.id);

    try {
      // Open Stripe checkout in browser — user is charged immediately
      await purchaseViaStripe(plan.productId);

      // After Stripe checkout completes, set subscription locally
      // In production, this would be confirmed via Stripe webhook
      await setSubscription(plan.id as any);
      await markPaywallSeen();

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // After subscribing, redirect to auth to complete login (for cloud sync)
      // If already authenticated (returning user upgrading), go to tabs
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth?returnFromPaywall=true" as any);
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

  // ─── Restore purchases ───
  const handleRestore = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRestoring(true);
    setPurchaseError(null);

    try {
      const { vanillaTrpc } = await import("@/lib/trpc");
      const platform = Platform.OS === "ios" ? "ios" as const : "android" as const;
      const result = await vanillaTrpc.iap.restorePurchases.mutate({ platform });

      // Map server tier names to new model
      const tierMap: Record<string, string> = {
        free: "none", essential: "monthly", pro: "monthly", elite: "annual",
        none: "none", monthly: "monthly", annual: "annual",
      };
      const mappedTier = tierMap[result.tier] || "none";
      if (result.success && mappedTier !== "none") {
        await setSubscription(mappedTier as any);
        await markPaywallSeen();
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Subscription Restored",
          `Your ${mappedTier === "annual" ? "Elite Annual" : "Monthly Essential"} plan has been restored. Welcome back!`,
          [{ text: "Continue", onPress: () => router.replace("/(tabs)") }]
        );
      } else {
        Alert.alert(
          "No Active Subscription Found",
          "We couldn't find an active subscription linked to your account. If you purchased previously, make sure you're signed in with the same account.\n\nNeed help? Contact Muscle Support.",
          [{ text: "OK", style: "cancel" }]
        );
      }
    } catch (error: any) {
      console.error("[Paywall] Restore error:", error);
      Alert.alert(
        "Restore Failed",
        "Please make sure you're signed in with the account you used to purchase. If the issue persists, contact Muscle Support.",
        [{ text: "OK", style: "cancel" }]
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Back Arrow (always visible) ─── */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.title}>Unlock Your</Text>
          <Text style={styles.titleHighlight}>Full Potential</Text>
          <Text style={styles.subtitle}>
            Choose your plan to access AI-powered nutrition tracking
          </Text>
          <View style={styles.secureBadge}>
            <IconSymbol name="checkmark" size={12} color="#4ADE80" />
            <Text style={styles.secureBadgeText}>
              Secure In-App Purchase via Apple
            </Text>
          </View>
        </View>

        {/* ─── Error Banner ─── */}
        {purchaseError && (
          <View style={styles.errorBanner}>
            <IconSymbol name="xmark.circle.fill" size={16} color="#FF3D3D" />
            <Text style={styles.errorText}>{purchaseError}</Text>
            <TouchableOpacity onPress={() => setPurchaseError(null)}>
              <IconSymbol name="xmark" size={14} color="#888888" />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Plan Cards ─── */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlighted && styles.planCardHighlighted,
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
              {plan.savings && (
                <LinearGradient
                  colors={["#444444", "#333333"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.savingsBadge}
                >
                  <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                </LinearGradient>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <IconSymbol
                      name="checkmark"
                      size={14}
                      color={plan.highlighted ? "#C0C0C0" : "#FFFFFF"}
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
                    colors={["#444444", "#2A2A2A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscribeGradient}
                  >
                    {subscribing === plan.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.subscribeTextWhite}>
                        {plan.id === "annual" ? "UNLOCK MUSCLEAI ELITE" : "GET INSTANT ACCESS"}
                      </Text>
                    )}
                  </LinearGradient>
                ) : subscribing === plan.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.subscribeTextWhite}>GET INSTANT ACCESS</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ─── Restore ─── */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={restoring}
        >
          {restoring ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#888888" />
              <Text style={styles.restoreText}>Restoring...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="arrow.clockwise" size={14} color="#888888" />
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Legal ─── */}
        <Text style={styles.legalText}>
          Payment will be charged to your Apple ID account at confirmation of purchase.
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
          You can manage or cancel your subscription in your device's Settings.
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
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F0F0F0",
    letterSpacing: 0.5,
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  secureBadgeText: {
    fontSize: 13,
    color: "#4ADE80",
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,61,61,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#FF3D3D",
    lineHeight: 18,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#111111",
  },
  planCardHighlighted: {
    borderColor: "#555555",
    borderWidth: 1.5,
  },
  savingsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888888",
    letterSpacing: 2,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  planPeriod: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "500",
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: "#E0E0E0",
    fontWeight: "500",
    lineHeight: 22,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeButtonOutline: {
    borderWidth: 1,
    borderColor: "#444444",
    backgroundColor: "#1A1A1A",
  },
  subscribeGradient: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  subscribeTextWhite: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  restoreText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  legalText: {
    fontSize: 11,
    color: "#555555",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 4,
  },
});
