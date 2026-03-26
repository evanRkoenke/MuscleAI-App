/**
 * Muscle AI — Welcome Modal
 *
 * A sleek, premium celebration modal that appears immediately after
 * a successful subscription purchase. Shows tier-specific messaging
 * and a smooth entrance animation.
 */

import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";
import {
  type SubscriptionTier,
  WELCOME_MESSAGES,
  getTierLabel,
  getTierColor,
} from "@/lib/subscription-features";

const { width: SW } = Dimensions.get("window");

interface WelcomeModalProps {
  visible: boolean;
  tier: Exclude<SubscriptionTier, "free">;
  onDismiss: () => void;
}

export function WelcomeModal({ visible, tier, onDismiss }: WelcomeModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const message = WELCOME_MESSAGES[tier];
  const tierColor = getTierColor(tier);

  useEffect(() => {
    if (visible) {
      // Trigger success haptic
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[st.backdrop, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            st.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Subtle gradient background */}
          <LinearGradient
            colors={["#0A0A0A", "#111111", "#0A0A0A"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Accent border glow */}
          <View style={[st.glowBorder, { borderColor: tierColor + "40" }]} />

          {/* Crown / tier icon */}
          <View style={[st.iconCircle, { backgroundColor: tierColor + "18" }]}>
            <IconSymbol
              name="crown.fill"
              size={32}
              color={tierColor}
            />
          </View>

          {/* Tier badge */}
          <View style={[st.tierBadge, { backgroundColor: tierColor + "15", borderColor: tierColor + "30" }]}>
            <Text style={[st.tierBadgeText, { color: tierColor }]}>
              {getTierLabel(tier).toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={st.title}>{message.title}</Text>

          {/* Body */}
          <Text style={st.body}>{message.body}</Text>

          {/* Feature highlights for Elite */}
          {tier === "elite" && (
            <View style={st.features}>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>12-Month Muscle Forecast</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Priority Sync — Active</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Unlimited AI Scans</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Gains Cards Pro Templates</Text>
              </View>
            </View>
          )}

          {tier === "pro" && (
            <View style={st.features}>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Unlimited AI Scans</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Advanced Analytics</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Priority Support</Text>
              </View>
            </View>
          )}

          {tier === "essential" && (
            <View style={st.features}>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>50 AI Scans / Month</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Basic Analytics</Text>
              </View>
              <View style={st.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4ADE80" />
                <Text style={st.featureText}>Full Meal Logging</Text>
              </View>
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            style={st.ctaBtn}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#444444", "#333333"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.ctaGrad}
            >
              <Text style={st.ctaText}>LET'S GO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: SW - 48,
    maxWidth: 380,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: "#222222",
    overflow: "hidden",
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  tierBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 26,
    fontWeight: "700",
    color: "#F0F0F0",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: "400",
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  features: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: "500",
    color: "#D0D0D0",
  },
  ctaBtn: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
  },
  ctaGrad: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    fontFamily: Typography.fontFamily,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 3,
  },
});
