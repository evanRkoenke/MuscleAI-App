/**
 * Cloud Sync Upsell Modal
 *
 * Shown to free users when they try to sync data or log in on a second device.
 * Encourages upgrading to a paid plan for cross-device cloud sync.
 */

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/constants/typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface CloudSyncUpsellProps {
  visible: boolean;
  onClose: () => void;
}

export function CloudSyncUpsell({ visible, onClose }: CloudSyncUpsellProps) {
  const colors = useColors();
  const router = useRouter();

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose();
    router.push("/paywall");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={18} color={colors.muted} />
          </TouchableOpacity>

          {/* Cloud icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            <IconSymbol name="icloud.fill" size={40} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Sync to Cloud
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your data is currently stored on this device only. Upgrade to sync
            your meals, forecasts, and progress across all your devices.
          </Text>

          {/* Features list */}
          <View style={styles.featureList}>
            {[
              "Meal logs synced across devices",
              "Anabolic Forecasts backed up",
              "Profile & settings preserved",
              "Weight history never lost",
            ].map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={18}
                  color={colors.success}
                />
                <Text style={[styles.featureText, { color: colors.foreground }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.foreground }]}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Unlock Cloud Sync
            </Text>
          </TouchableOpacity>

          {/* Secondary text */}
          <Text style={[styles.secondaryText, { color: colors.muted }]}>
            Starting at $9.99/month with Essential
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.fontFamilyBold,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  featureList: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    fontWeight: "500",
    flex: 1,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily,
    fontWeight: "600",
  },
  secondaryText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
});
