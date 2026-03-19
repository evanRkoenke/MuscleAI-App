import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

export default function GainsCardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, weightLog, getTodayCalories, getTodayMacros, subscription } = useApp();

  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();

  const stats = useMemo(() => {
    const startWeight = weightLog.length > 0 ? weightLog[0].weight : profile.currentWeight;
    const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : profile.currentWeight;
    const change = currentWeight - startWeight;
    const daysTracked = weightLog.length;
    const avgAnabolic = 0; // Would calculate from meals
    return { startWeight, currentWeight, change, daysTracked, avgAnabolic };
  }, [weightLog, profile.currentWeight]);

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Share.share({
        message: `Check out my progress on Muscle AI!\n\nCurrent Weight: ${stats.currentWeight} ${profile.unit}\nToday's Protein: ${todayMacros.protein}g\nCalories Tracked: ${todayCalories}\n\nDownload Muscle AI to optimize your nutrition! 💪\n\n@muscleai.app`,
        title: "My Muscle AI Gains Card",
      });
    } catch (e) {
      console.warn("Share failed:", e);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="xmark" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Gains Card</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.cardContainer}>
        {/* The Gains Card */}
        <View style={[styles.gainsCard, { backgroundColor: "#0A0E14" }]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLogo, { color: colors.primary }]}>MUSCLE AI</Text>
            <Text style={styles.cardBadge}>
              {subscription === "elite" ? "ELITE" : subscription === "pro" ? "PRO" : "MEMBER"}
            </Text>
          </View>

          {/* Weight Section */}
          <View style={styles.cardWeightSection}>
            <Text style={styles.cardWeightLabel}>CURRENT WEIGHT</Text>
            <Text style={styles.cardWeightValue}>
              {stats.currentWeight}
              <Text style={styles.cardWeightUnit}> {profile.unit}</Text>
            </Text>
            {stats.change !== 0 && (
              <Text
                style={[
                  styles.cardWeightChange,
                  { color: stats.change > 0 ? "#00E676" : "#FF3D3D" },
                ]}
              >
                {stats.change > 0 ? "+" : ""}
                {stats.change.toFixed(1)} {profile.unit} since start
              </Text>
            )}
          </View>

          {/* Stats Grid */}
          <View style={styles.cardStatsGrid}>
            <View style={styles.cardStatItem}>
              <Text style={styles.cardStatValue}>{todayMacros.protein}g</Text>
              <Text style={styles.cardStatLabel}>PROTEIN</Text>
            </View>
            <View style={styles.cardStatItem}>
              <Text style={styles.cardStatValue}>{todayCalories}</Text>
              <Text style={styles.cardStatLabel}>CALORIES</Text>
            </View>
            <View style={styles.cardStatItem}>
              <Text style={styles.cardStatValue}>{stats.daysTracked}</Text>
              <Text style={styles.cardStatLabel}>DAYS</Text>
            </View>
          </View>

          {/* Macro Bars */}
          <View style={styles.cardMacroBars}>
            <MacroBar label="Protein" value={todayMacros.protein} goal={profile.proteinGoal} color={colors.primary} />
            <MacroBar label="Carbs" value={todayMacros.carbs} goal={profile.carbsGoal} color="#8B5CF6" />
            <MacroBar label="Fat" value={todayMacros.fat} goal={profile.fatGoal} color="#F59E0B" />
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>@muscleai.app</Text>
            <Text style={styles.cardFooterDate}>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Share Buttons */}
      <View style={styles.shareSection}>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.primary }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <IconSymbol name="square.and.arrow.up" size={22} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share to Stories</Text>
        </TouchableOpacity>

        <View style={styles.shareRow}>
          <TouchableOpacity
            style={[styles.shareSmallButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={[styles.shareSmallText, { color: colors.foreground }]}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareSmallButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={[styles.shareSmallText, { color: colors.foreground }]}>TikTok</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareSmallButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={[styles.shareSmallText, { color: colors.foreground }]}>Copy</Text>
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
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValue}>
          {value}/{goal}g
        </Text>
      </View>
      <View style={[styles.macroBarTrack, { backgroundColor: color + "20" }]}>
        <View style={[styles.macroBarFill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  gainsCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#00B4FF30",
    gap: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLogo: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00E5FF",
    letterSpacing: 1,
    backgroundColor: "#00E5FF15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardWeightSection: {
    alignItems: "center",
    gap: 4,
  },
  cardWeightLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7A8A99",
    letterSpacing: 2,
  },
  cardWeightValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ECEDEE",
  },
  cardWeightUnit: {
    fontSize: 20,
    fontWeight: "500",
    color: "#7A8A99",
  },
  cardWeightChange: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardStatItem: {
    alignItems: "center",
    gap: 4,
  },
  cardStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ECEDEE",
  },
  cardStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#7A8A99",
    letterSpacing: 1.5,
  },
  cardMacroBars: {
    gap: 10,
  },
  macroBarContainer: {
    gap: 4,
  },
  macroBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A8A99",
  },
  macroBarValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ECEDEE",
  },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00B4FF",
  },
  cardFooterDate: {
    fontSize: 12,
    color: "#7A8A99",
  },
  shareSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 26,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  shareRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareSmallButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shareSmallText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
