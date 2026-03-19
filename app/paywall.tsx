import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

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
    savings: "66% savings",
    features: [
      "Unlimited AI meal scanning",
      "12-Month Muscle Forecast",
      "Priority Sync",
      "Advanced analytics",
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
  const colors = useColors();
  const { setSubscription } = useApp();

  const handleSubscribe = async (tier: TierInfo) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Open Stripe checkout link
    const url = STRIPE_LINKS[tier.id];
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn("Could not open Stripe link:", e);
    }
    // Set subscription tier locally
    await setSubscription(tier.id);
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IconSymbol name="bolt.fill" size={40} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>Unlock Your</Text>
          <Text style={[styles.titleHighlight, { color: colors.primary }]}>Full Potential</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Choose your plan to access AI-powered nutrition tracking
          </Text>
        </View>

        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: tier.highlighted ? colors.primary : colors.border,
                  borderWidth: tier.highlighted ? 2 : 1,
                },
              ]}
            >
              {tier.badge && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{tier.badge}</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <Text style={[styles.tierName, { color: colors.foreground }]}>{tier.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.tierPrice, { color: colors.foreground }]}>{tier.price}</Text>
                  <Text style={[styles.tierPeriod, { color: colors.muted }]}>{tier.period}</Text>
                </View>
                {tier.savings && (
                  <Text style={[styles.savings, { color: colors.success }]}>{tier.savings}</Text>
                )}
              </View>
              <View style={styles.featuresContainer}>
                {tier.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <IconSymbol name="checkmark" size={16} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.muted }]}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  {
                    backgroundColor: tier.highlighted ? colors.primary : "transparent",
                    borderColor: colors.primary,
                    borderWidth: tier.highlighted ? 0 : 1,
                  },
                ]}
                onPress={() => handleSubscribe(tier)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subscribeButtonText,
                    { color: tier.highlighted ? "#FFFFFF" : colors.primary },
                  ]}
                >
                  {tier.highlighted ? "UNLOCK" : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Continue with Free</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} activeOpacity={0.7}>
          <Text style={[styles.restoreText, { color: colors.muted }]}>Restore Purchases</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  titleHighlight: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  tiersContainer: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 20,
    padding: 20,
    position: "relative",
    overflow: "hidden",
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
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tierHeader: {
    marginBottom: 16,
  },
  tierName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: "900",
  },
  tierPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  savings: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
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
    fontSize: 14,
    lineHeight: 20,
  },
  subscribeButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeButtonText: {
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
  },
  restoreButton: {
    alignItems: "center",
    marginTop: 4,
    padding: 8,
  },
  restoreText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
