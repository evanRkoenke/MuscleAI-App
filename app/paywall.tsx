import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";

const STRIPE_LINKS = {
  elite: "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05",
  pro: "https://buy.stripe.com/8x214gdwt3Dh6Jd1sibEA04",
  essential: "https://buy.stripe.com/14A5kwbol0r55F92wmbEA06",
};

interface TierInfo {
  id: "elite" | "pro" | "essential";
  name: string;
  price: string;
  period: string;
  badge?: string;
  savings?: string;
  features: string[];
  highlighted: boolean;
}

const tiers: TierInfo[] = [
  {
    id: "elite",
    name: "ELITE ANNUAL",
    price: "$79.99",
    period: "/year",
    badge: "BEST VALUE",
    savings: "66% savings vs monthly",
    features: [
      "Unlimited AI meal scanning",
      "12-Month Muscle Forecast",
      "Priority Sync",
      "Advanced analytics & insights",
      "Gains Cards for social sharing",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    name: "PRO",
    price: "$19.99",
    period: "/month",
    features: [
      "Unlimited AI meal scanning",
      "Advanced macro tracking",
      "Gains Cards for social sharing",
      "Priority support",
    ],
    highlighted: false,
  },
  {
    id: "essential",
    name: "ESSENTIAL",
    price: "$9.99",
    period: "/month",
    features: [
      "10 AI scans per day",
      "Basic macro tracking",
      "Weight logging",
    ],
    highlighted: false,
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { setSubscription } = useApp();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (tier: TierInfo) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSubscribing(tier.id);
    try {
      const url = STRIPE_LINKS[tier.id];
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(
          "Unable to Open Checkout",
          "Could not open the payment page. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
        return;
      }
      await Linking.openURL(url);
      // Set subscription locally after opening checkout
      // In production, this would be confirmed via Stripe webhook
      await setSubscription(tier.id);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Payment Error",
        "Something went wrong while processing your subscription. Please try again or contact support.",
        [
          { text: "Try Again", onPress: () => handleSubscribe(tier) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSubscribing(null);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // In production: verify with App Store / Google Play receipts
    Alert.alert(
      "Restore Purchases",
      "If you have an existing subscription, it will be restored automatically when you sign in with the same account. If you're having issues, please contact support.",
      [
        { text: "Contact Support", onPress: () => (router as any).push("/support") },
        { text: "OK", style: "cancel" },
      ]
    );
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconGlow}>
            <IconSymbol name="bolt.fill" size={36} color={ELECTRIC_BLUE} />
          </View>
          <Text style={styles.title}>Unlock Your</Text>
          <Text style={styles.titleHighlight}>Full Potential</Text>
          <Text style={styles.subtitle}>
            Choose your plan to access AI-powered nutrition tracking
          </Text>
        </View>

        {/* Tier Cards */}
        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                tier.highlighted && styles.tierCardHighlighted,
              ]}
            >
              {tier.highlighted && (
                <LinearGradient
                  colors={["rgba(0,122,255,0.08)", "rgba(0,212,255,0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {tier.badge && (
                <LinearGradient
                  colors={[ELECTRIC_BLUE, CYAN_GLOW]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>{tier.badge}</Text>
                </LinearGradient>
              )}
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                  <Text style={styles.tierPeriod}>{tier.period}</Text>
                </View>
                {tier.savings && (
                  <Text style={styles.savings}>{tier.savings}</Text>
                )}
              </View>
              <View style={styles.featuresContainer}>
                {tier.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <IconSymbol name="checkmark" size={14} color={ELECTRIC_BLUE} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  !tier.highlighted && styles.subscribeButtonOutline,
                ]}
                onPress={() => handleSubscribe(tier)}
                activeOpacity={0.8}
                disabled={subscribing !== null}
              >
                {tier.highlighted ? (
                  <LinearGradient
                    colors={[ELECTRIC_BLUE, "#FF3B30"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscribeGradient}
                  >
                    {subscribing === tier.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.subscribeTextWhite}>UNLOCK</Text>
                    )}
                  </LinearGradient>
                ) : subscribing === tier.id ? (
                  <ActivityIndicator color={ELECTRIC_BLUE} />
                ) : (
                  <Text style={styles.subscribeTextBlue}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Continue with Free</Text>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
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
  iconGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,122,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
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
    // Elite card gets extra visual weight
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
    justifyContent: "center",
    alignItems: "center",
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
});
