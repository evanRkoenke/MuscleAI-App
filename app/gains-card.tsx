import { useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";

const { width: SW } = Dimensions.get("window");

export default function GainsCardScreen() {
  const router = useRouter();
  const { profile, weightLog, getTodayCalories, getTodayMacros, subscription, saveGainsCard } = useApp();
  const sub = useSubscription();

  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();

  const stats = useMemo(() => {
    const startWeight = weightLog.length > 0 ? weightLog[0].weight : profile.currentWeight;
    const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : profile.currentWeight;
    const change = currentWeight - startWeight;
    const daysTracked = weightLog.length;
    const streak = daysTracked; // simplified
    return { startWeight, currentWeight, change, daysTracked, streak };
  }, [weightLog, profile.currentWeight]);

  const shareText = useMemo(() => {
    return `🏋️ My Muscle AI Stats\n\n` +
      `⚖️ ${stats.currentWeight} ${profile.unit}\n` +
      `🥩 ${todayMacros.protein}g protein today\n` +
      `🔥 ${todayCalories} calories tracked\n` +
      `📅 ${stats.daysTracked} days tracked\n\n` +
      `Track your gains with @muscleai.app`;
  }, [stats, todayMacros, todayCalories, profile.unit]);

  const handleSaveAndShare = async (platform: "instagram" | "tiktok" | "general" | "copy") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const card = {
        id: `gc_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        weight: stats.currentWeight,
        protein: todayMacros.protein,
        calories: todayCalories,
        daysTracked: stats.daysTracked,
        anabolicScore: 0,
        subscription,
      };
      await saveGainsCard(card);

      if (platform === "copy") {
        // Copy to clipboard
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Copied!", "Your stats have been copied to clipboard.", [{ text: "OK" }]);
        return;
      }

      await Share.share({
        message: shareText,
        title: "My Muscle AI Gains Card",
      });
    } catch (e) {
      Alert.alert(
        "Share Failed",
        "Unable to share your Gains Card right now. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={st.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="xmark" size={24} color="#F5F5F5" />
        </TouchableOpacity>
        <Text style={st.topBarTitle}>Gains Card</Text>
        <View style={st.backButton} />
      </View>

      <View style={st.cardContainer}>
        {/* The Gains Card — Instagram Stories 9:16 aspect ratio card */}
        <View style={st.gainsCard}>
          <LinearGradient
            colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0.01)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Card Header */}
          <View style={st.cardHeader}>
            <Text style={st.cardLogo}>MUSCLE AI</Text>
            <View style={st.cardBadgeContainer}>
              <Text style={st.cardBadge}>
                {sub.label.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Weight Section */}
          <View style={st.cardWeightSection}>
            <Text style={st.cardWeightLabel}>CURRENT WEIGHT</Text>
            <Text style={st.cardWeightValue}>
              {stats.currentWeight}
              <Text style={st.cardWeightUnit}> {profile.unit}</Text>
            </Text>
            {stats.change !== 0 && (
              <Text
                style={[
                  st.cardWeightChange,
                  { color: stats.change > 0 ? "#C0C0C0" : "#FF3D3D" },
                ]}
              >
                {stats.change > 0 ? "+" : ""}
                {stats.change.toFixed(1)} {profile.unit} since start
              </Text>
            )}
          </View>

          {/* Stats Grid */}
          <View style={st.cardStatsGrid}>
            <View style={st.cardStatItem}>
              <Text style={[st.cardStatValue, { color: "#E0E0E0" }]}>{todayMacros.protein}g</Text>
              <Text style={st.cardStatLabel}>PROTEIN</Text>
            </View>
            <View style={st.cardStatItem}>
              <Text style={st.cardStatValue}>{todayCalories}</Text>
              <Text style={st.cardStatLabel}>CALORIES</Text>
            </View>
            <View style={st.cardStatItem}>
              <Text style={st.cardStatValue}>{stats.daysTracked}</Text>
              <Text style={st.cardStatLabel}>DAYS</Text>
            </View>
          </View>

          {/* Macro Bars */}
          <View style={st.cardMacroBars}>
            <MacroBar label="Protein" value={todayMacros.protein} goal={profile.proteinGoal} color="#E0E0E0" />
            <MacroBar label="Carbs" value={todayMacros.carbs} goal={profile.carbsGoal} color="#B0B0B0" />
            <MacroBar label="Fat" value={todayMacros.fat} goal={profile.fatGoal} color="#FF4444" />
          </View>

          {/* Card Footer */}
          <View style={st.cardFooter}>
            <Text style={st.cardFooterText}>@muscleai.app</Text>
            <Text style={st.cardFooterDate}>{dateStr}</Text>
          </View>
        </View>
      </View>

      {/* Share Buttons */}
      <View style={st.shareSection}>
        {/* Primary: Instagram Stories */}
        <TouchableOpacity
          style={st.shareButton}
          onPress={() => handleSaveAndShare("instagram")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#444444", "#333333"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.shareGradient}
          >
            <IconSymbol name="camera.on.rectangle" size={22} color="#FFFFFF" />
            <Text style={st.shareButtonText}>Share to Instagram Stories</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary share row */}
        <View style={st.shareRow}>
          <TouchableOpacity
            style={st.shareSmallButton}
            onPress={() => handleSaveAndShare("tiktok")}
            activeOpacity={0.7}
          >
            <Text style={st.shareSmallText}>TikTok</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.shareSmallButton}
            onPress={() => handleSaveAndShare("general")}
            activeOpacity={0.7}
          >
            <Text style={st.shareSmallText}>More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.shareSmallButton}
            onPress={() => handleSaveAndShare("copy")}
            activeOpacity={0.7}
          >
            <Text style={st.shareSmallText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  return (
    <View style={st.macroBarContainer}>
      <View style={st.macroBarHeader}>
        <Text style={st.macroBarLabel}>{label}</Text>
        <Text style={st.macroBarValue}>{value}/{goal}g</Text>
      </View>
      <View style={[st.macroBarTrack, { backgroundColor: color + "18" }]}>
        <View style={[st.macroBarFill, { backgroundColor: color, width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  topBarTitle: { fontFamily: Typography.fontFamily, fontSize: 18, fontWeight: "600", color: "#F5F5F5" },
  cardContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  gainsCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#121212",
    gap: 20,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLogo: { fontFamily: Typography.fontFamilyBold, fontSize: 20, fontWeight: "900", letterSpacing: 3, color: "#FFFFFF" },
  cardBadgeContainer: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardBadge: { fontFamily: Typography.fontFamily, fontSize: 11, fontWeight: "400", color: "#888888", letterSpacing: 1 },
  cardWeightSection: { alignItems: "center", gap: 4 },
  cardWeightLabel: { fontFamily: Typography.fontFamily, fontSize: 11, fontWeight: "400", color: "#666666", letterSpacing: 2 },
  cardWeightValue: { fontFamily: Typography.fontFamilyBold, fontSize: 48, fontWeight: "700", color: "#F5F5F5" },
  cardWeightUnit: { fontSize: 20, fontWeight: "600", color: "#666666" },
  cardWeightChange: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: "400" },
  cardStatsGrid: { flexDirection: "row", justifyContent: "space-around" },
  cardStatItem: { alignItems: "center", gap: 4 },
  cardStatValue: { fontFamily: Typography.fontFamilyBold, fontSize: 22, fontWeight: "700", color: "#F5F5F5" },
  cardStatLabel: { fontFamily: Typography.fontFamily, fontSize: 9, fontWeight: "400", color: "#666666", letterSpacing: 1.5 },
  cardMacroBars: { gap: 10 },
  macroBarContainer: { gap: 4 },
  macroBarHeader: { flexDirection: "row", justifyContent: "space-between" },
  macroBarLabel: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: "400", color: "#666666" },
  macroBarValue: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: "400", color: "#F5F5F5" },
  macroBarTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  macroBarFill: { height: "100%", borderRadius: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardFooterText: { fontFamily: Typography.fontFamily, fontSize: 12, fontWeight: "400", color: "#FFFFFF" },
  cardFooterDate: { fontFamily: Typography.fontFamily, fontSize: 12, color: "#666666" },
  shareSection: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  shareButton: { borderRadius: 27, overflow: "hidden" },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 27,
  },
  shareButtonText: { fontFamily: Typography.fontFamily, color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  shareRow: { flexDirection: "row", gap: 10 },
  shareSmallButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  shareSmallText: { fontFamily: Typography.fontFamily, fontSize: 14, fontWeight: "600", color: "#F5F5F5" },
});
