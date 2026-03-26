/**
 * Muscle AI — Daily Scan Limit Reached Modal
 *
 * Shown when a free-plan user has exhausted their 5 daily AI scans.
 * Features a high-contrast CTA to upgrade to Elite for unlimited scans,
 * plus a secondary dismiss option.
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
import { FREE_DAILY_SCAN_LIMIT } from "@/lib/scan-counter";
import { Typography } from "@/constants/typography";

const { width: SW } = Dimensions.get("window");

interface ScanLimitModalProps {
  visible: boolean;
  scansUsed: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function ScanLimitModal({
  visible,
  scansUsed,
  onUpgrade,
  onDismiss,
}: ScanLimitModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

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

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onUpgrade();
  };

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
          <LinearGradient
            colors={["#0A0A0A", "#111111", "#0A0A0A"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Warning icon */}
          <View style={st.iconCircle}>
            <IconSymbol name="lock.fill" size={32} color="#FF4444" />
          </View>

          {/* Title */}
          <Text style={st.title}>Daily Limit Reached</Text>

          {/* Body */}
          <Text style={st.body}>
            You've used all {FREE_DAILY_SCAN_LIMIT} free scans for today.
            {"\n"}Your limit resets at midnight.
          </Text>

          {/* Scan counter visual */}
          <View style={st.counterRow}>
            {Array.from({ length: FREE_DAILY_SCAN_LIMIT }).map((_, i) => (
              <View
                key={i}
                style={[
                  st.counterDot,
                  i < scansUsed ? st.counterDotUsed : st.counterDotEmpty,
                ]}
              />
            ))}
          </View>
          <Text style={st.counterLabel}>
            {scansUsed}/{FREE_DAILY_SCAN_LIMIT} scans used today
          </Text>

          {/* High-contrast upgrade CTA */}
          <TouchableOpacity
            style={st.upgradeBtnWrap}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FFFFFF", "#E0E0E0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.upgradeGrad}
            >
              <IconSymbol name="bolt.fill" size={18} color="#000000" />
              <Text style={st.upgradeText}>Get Unlimited Scans with Elite</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary dismiss */}
          <TouchableOpacity
            style={st.dismissBtn}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={st.dismissText}>Come Back Tomorrow</Text>
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
    borderColor: "#333333",
    overflow: "hidden",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,68,68,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 24,
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
  counterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  counterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  counterDotUsed: {
    backgroundColor: "#FF4444",
  },
  counterDotEmpty: {
    backgroundColor: "#333333",
    borderWidth: 1,
    borderColor: "#555555",
  },
  counterLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 24,
  },
  upgradeBtnWrap: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 12,
  },
  upgradeGrad: {
    height: 56,
    borderRadius: 26,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  upgradeText: {
    fontFamily: Typography.fontFamilyBold,
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dismissBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  dismissText: {
    fontFamily: Typography.fontFamily,
    color: "#555555",
    fontSize: 14,
    fontWeight: "500",
  },
});
