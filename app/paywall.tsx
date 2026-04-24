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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import {
  PLANS,
  ALL_PRODUCT_IDS,
  productIdToTier,
  isNativeIAPAvailable,
  validateReceiptOnServer,
  type PlanInfo,
} from "@/lib/iap-service";
import * as Haptics from "expo-haptics";

/**
 * Paywall Screen — Native In-App Purchases
 *
 * Monthly Essential ($9.99/mo) and Elite Annual ($59.99/yr).
 * Both plans give identical full access. Uses native App Store / Google Play purchases.
 * Falls back to displaying plan info when native IAP is unavailable (web / Expo Go).
 */

// Safely import expo-iap — only available in development/production builds
let useIAP: any = null;
try {
  if (Platform.OS !== "web") {
    const expoIap = require("expo-iap");
    useIAP = expoIap.useIAP;
  }
} catch {
  // expo-iap not available (Expo Go or web)
}

function useNativeIAP() {
  // If useIAP is not available, return a stub
  if (!useIAP) {
    return {
      connected: false,
      products: [],
      fetchProducts: () => {},
      requestPurchase: async () => {},
      finishTransaction: async () => {},
      availablePurchases: [],
      getAvailablePurchases: async () => {},
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useIAP();
}

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { setSubscription, markPaywallSeen, isAuthenticated } = useApp();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);

  const iapAvailable = isNativeIAPAvailable() && useIAP != null;

  // Use native IAP hook (returns stub if unavailable)
  const {
    connected,
    products: storeProducts,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    availablePurchases,
    getAvailablePurchases,
  } = useNativeIAP();

  // Fetch products when store connects
  useEffect(() => {
    if (connected && !productsFetched && iapAvailable) {
      fetchProducts({ skus: ALL_PRODUCT_IDS, type: "subs" });
      setProductsFetched(true);
    }
  }, [connected, productsFetched, iapAvailable]);

  // Get display price from store products (or fall back to hardcoded)
  const getDisplayPrice = useCallback(
    (plan: PlanInfo): string => {
      if (storeProducts && storeProducts.length > 0) {
        const storeProduct = storeProducts.find(
          (p: any) => p.id === plan.productId || p.productId === plan.productId
        );
        if (storeProduct?.displayPrice) return storeProduct.displayPrice;
        if (storeProduct?.localizedPrice) return storeProduct.localizedPrice;
      }
      return plan.price;
    },
    [storeProducts]
  );

  // ─── Purchase handler (native IAP) ───
  const handleSubscribe = async (plan: PlanInfo) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPurchaseError(null);
    setSubscribing(plan.id);

    try {
      if (!iapAvailable) {
        // Native IAP not available (web or Expo Go) — show info
        Alert.alert(
          "In-App Purchase",
          "Native purchases are only available in the App Store / Google Play version of Muscle AI. Please download from the App Store to subscribe.",
          [{ text: "OK" }]
        );
        return;
      }

      if (!connected) {
        setPurchaseError("Store not connected. Please try again in a moment.");
        return;
      }

      // Request native purchase — this shows the Apple/Google payment sheet
      await requestPurchase({
        request: {
          apple: { sku: plan.productId },
          google: { skus: [plan.productId] },
        },
      });

      // If we get here, the purchase was initiated. The onPurchaseSuccess callback
      // in useIAP handles the rest. But since we're using the hook inline,
      // we handle it after requestPurchase resolves.
      // Note: expo-iap may resolve the promise after the purchase completes.

      // Validate on server
      const platform = Platform.OS === "ios" ? "ios" as const : "android" as const;
      await validateReceiptOnServer({
        productId: plan.productId,
        platform,
      });

      // Set subscription locally
      const tier = productIdToTier(plan.productId);
      await setSubscription(tier as any);
      await markPaywallSeen();

      // Finish the transaction
      try {
        // Find the latest purchase for this product
        if (availablePurchases && availablePurchases.length > 0) {
          const purchase = availablePurchases.find(
            (p: any) => p.productId === plan.productId
          );
          if (purchase) {
            await finishTransaction({ purchase, isConsumable: false });
          }
        }
      } catch (finishError) {
        console.warn("[Paywall] finishTransaction warning:", finishError);
        // Non-fatal — the transaction will be finished on next app launch
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to app — user is already authenticated at this point
      await markPaywallSeen();
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[Paywall] Subscribe error:", error);

      // User cancelled — not an error
      if (
        error?.code === "E_USER_CANCELLED" ||
        error?.message?.includes("cancelled") ||
        error?.message?.includes("canceled")
      ) {
        // User cancelled — just reset state
        return;
      }

      setPurchaseError(
        "Something went wrong with the purchase. Please try again."
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
      if (iapAvailable && getAvailablePurchases) {
        // Use native restore
        await getAvailablePurchases();

        // Check if any purchases were found
        if (availablePurchases && availablePurchases.length > 0) {
          // Find the best subscription
          const purchase = availablePurchases[0];
          const tier = productIdToTier(purchase.productId);

          if (tier !== "none") {
            await setSubscription(tier as any);
            await markPaywallSeen();

            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            Alert.alert(
              "Subscription Restored",
              `Your ${tier === "annual" ? "Elite Annual" : "Monthly Essential"} plan has been restored. Welcome back!`,
              [{ text: "Continue", onPress: () => router.replace("/(tabs)") }]
            );
            return;
          }
        }
      }

      // Also try server-side restore
      const { vanillaTrpc } = await import("@/lib/trpc");
      const platform =
        Platform.OS === "ios" ? ("ios" as const) : ("android" as const);
      const result = await vanillaTrpc.iap.restorePurchases.mutate({
        platform,
      });

      const tierMap: Record<string, string> = {
        free: "none",
        essential: "monthly",
        pro: "monthly",
        elite: "annual",
        none: "none",
        monthly: "monthly",
        annual: "annual",
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
        {/* ─── Header Row: Back + Skip ─── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={async () => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                await markPaywallSeen();
                router.replace("/(tabs)");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.title}>Unlock Your</Text>
          <Text style={styles.titleHighlight}>Full Potential</Text>
          <Text style={styles.subtitle}>
            Choose your plan to access AI-powered nutrition tracking
          </Text>
          <View style={styles.secureBadge}>
            <IconSymbol name="checkmark" size={12} color="#39FF14" />
            <Text style={styles.secureBadgeText}>
              {Platform.OS === "ios"
                ? "Secure In-App Purchase via Apple"
                : Platform.OS === "android"
                  ? "Secure In-App Purchase via Google Play"
                  : "Secure Purchase"}
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
                  colors={["rgba(57, 255, 20, 0.08)", "rgba(57, 255, 20, 0.03)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {plan.savings && (
                <LinearGradient
                  colors={["#39FF14", "#2BCC10"]}
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
                  <Text style={styles.planPrice}>
                    {getDisplayPrice(plan)}
                  </Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <IconSymbol
                      name="checkmark"
                      size={14}
                      color={plan.highlighted ? "#39FF14" : "#39FF14"}
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
                    colors={["#39FF14", "#2BCC10"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscribeGradient}
                  >
                    {subscribing === plan.id ? (
                      <ActivityIndicator color="#0A0A0A" />
                    ) : (
                      <Text style={styles.subscribeTextWhite}>
                        {plan.id === "annual"
                          ? "UNLOCK MUSCLEAI ELITE"
                          : "GET INSTANT ACCESS"}
                      </Text>
                    )}
                  </LinearGradient>
                ) : subscribing === plan.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.subscribeTextWhite}>
                    GET INSTANT ACCESS
                  </Text>
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator size="small" color="#888888" />
              <Text style={styles.restoreText}>Restoring...</Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <IconSymbol name="arrow.clockwise" size={14} color="#888888" />
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Legal ─── */}
        <Text style={styles.legalText}>
          {Platform.OS === "ios"
            ? "Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription in your device's Settings."
            : Platform.OS === "android"
              ? "Payment will be charged to your Google Play account at confirmation of purchase. Subscriptions auto-renew unless cancelled. You can manage or cancel your subscription in Google Play Store settings."
              : "Subscriptions are available through the App Store and Google Play Store versions of Muscle AI."}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#888888",
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
    color: "#39FF14",
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
    backgroundColor: "rgba(57, 255, 20, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  secureBadgeText: {
    fontSize: 13,
    color: "#39FF14",
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
    borderColor: "#1E1E1E",
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#141414",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardHighlighted: {
    borderColor: "rgba(57, 255, 20, 0.3)",
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
    color: "#0A0A0A",
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
    borderColor: "rgba(57, 255, 20, 0.15)",
    backgroundColor: "rgba(57, 255, 20, 0.05)",
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
    color: "#0A0A0A",
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
