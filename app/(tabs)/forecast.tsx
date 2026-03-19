import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 200;
const CHART_PADDING = 40;

const STRIPE_ELITE = "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05";

export default function ForecastScreen() {
  const colors = useColors();
  const router = useRouter();
  const { subscription, profile, weightLog } = useApp();
  const isElite = subscription === "elite";

  // Generate forecast data
  const forecastData = useMemo(() => {
    const startWeight = profile.currentWeight;
    const targetWeight = profile.targetWeight;
    const diff = targetWeight - startWeight;
    const points = [];
    for (let month = 0; month <= 12; month++) {
      // Logarithmic progression curve
      const progress = Math.log(1 + month) / Math.log(13);
      const weight = startWeight + diff * progress;
      points.push({
        month,
        weight: Math.round(weight * 10) / 10,
        label: month === 0 ? "Now" : `${month}M`,
      });
    }
    return points;
  }, [profile.currentWeight, profile.targetWeight]);

  const chartPoints = useMemo(() => {
    const weights = forecastData.map((d) => d.weight);
    const minW = Math.min(...weights) - 5;
    const maxW = Math.max(...weights) + 5;
    const range = maxW - minW || 1;

    return forecastData
      .map((d, i) => {
        const x = CHART_PADDING + (i / 12) * (CHART_WIDTH - CHART_PADDING * 2);
        const y = CHART_HEIGHT - CHART_PADDING - ((d.weight - minW) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [forecastData]);

  const handleUnlock = async () => {
    try {
      await Linking.openURL(STRIPE_ELITE);
    } catch (e) {
      console.warn("Could not open Stripe link:", e);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              ANABOLIC FORECAST
            </Text>
          </View>
          {!isElite && <IconSymbol name="lock.fill" size={20} color={colors.warning} />}
        </View>

        {/* Current Stats */}
        <View style={[styles.statsRow]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {profile.currentWeight}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Current ({profile.unit})</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profile.targetWeight}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Target ({profile.unit})</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={isElite ? undefined : styles.blurredContent}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Grid */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <Line
                  key={ratio}
                  x1={CHART_PADDING}
                  y1={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={CHART_PADDING + ratio * (CHART_HEIGHT - CHART_PADDING * 2)}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}
              {/* X-axis labels */}
              {[0, 3, 6, 9, 12].map((month) => (
                <SvgText
                  key={month}
                  x={CHART_PADDING + (month / 12) * (CHART_WIDTH - CHART_PADDING * 2)}
                  y={CHART_HEIGHT - 10}
                  fill={colors.muted}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {month === 0 ? "Now" : `${month}M`}
                </SvgText>
              ))}
              {/* Forecast line */}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          {!isElite && (
            <View style={styles.lockOverlay}>
              <IconSymbol name="lock.fill" size={32} color={colors.primary} />
              <Text style={[styles.lockText, { color: colors.foreground }]}>
                Premium Feature
              </Text>
            </View>
          )}
        </View>

        {/* Priority Sync Card */}
        <View style={[styles.syncCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.syncHeader}>
            <IconSymbol name="lock.fill" size={20} color={colors.muted} />
            <Text style={[styles.syncTitle, { color: colors.foreground }]}>Priority Sync</Text>
          </View>
          <Text style={[styles.syncDescription, { color: colors.muted }]}>
            {isElite
              ? "Your forecast syncs with your daily nutrition data for real-time predictions."
              : "Locked content updates — upgrade to Elite for real-time sync."}
          </Text>
        </View>

        {/* Upsell Card (non-Elite) */}
        {!isElite && (
          <View style={[styles.upsellCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.upsellBadge, { color: colors.warning }]}>
              PREMIUM MEMBERS ONLY
            </Text>
            <Text style={[styles.upsellTitle, { color: colors.foreground }]}>
              Unlock this 12-Month Forecast and multiply your gains.
            </Text>
            <View style={styles.upsellPricing}>
              <Text style={[styles.upsellPrice, { color: colors.foreground }]}>
                ELITE ANNUAL $79.99
              </Text>
              <Text style={[styles.upsellSavings, { color: colors.success }]}>66% SAVINGS</Text>
            </View>
            <TouchableOpacity
              style={[styles.unlockButton, { backgroundColor: colors.primary }]}
              onPress={handleUnlock}
              activeOpacity={0.8}
            >
              <Text style={styles.unlockButtonText}>UNLOCK</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Milestones (Elite only) */}
        {isElite && (
          <View style={styles.milestones}>
            <Text style={[styles.milestonesTitle, { color: colors.foreground }]}>
              Projected Milestones
            </Text>
            {[
              { month: 1, label: "First visible progress" },
              { month: 3, label: "Noticeable body composition change" },
              { month: 6, label: "Halfway to target" },
              { month: 12, label: "Target weight achieved" },
            ].map((milestone) => (
              <View
                key={milestone.month}
                style={[styles.milestoneRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.milestoneDot, { backgroundColor: colors.primary }]} />
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneMonth, { color: colors.primary }]}>
                    Month {milestone.month}
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: colors.muted }]}>
                    {milestone.label}
                  </Text>
                </View>
                <Text style={[styles.milestoneWeight, { color: colors.foreground }]}>
                  {forecastData[milestone.month]?.weight} {profile.unit}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  chartCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  blurredContent: {
    opacity: 0.3,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  lockText: {
    fontSize: 16,
    fontWeight: "700",
  },
  syncCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  syncHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  syncDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  upsellCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    alignItems: "center",
    gap: 12,
  },
  upsellBadge: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  upsellTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  upsellPricing: {
    alignItems: "center",
    gap: 4,
  },
  upsellPrice: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  upsellSavings: {
    fontSize: 13,
    fontWeight: "700",
  },
  unlockButton: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  unlockButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  milestones: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneMonth: {
    fontSize: 14,
    fontWeight: "700",
  },
  milestoneLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  milestoneWeight: {
    fontSize: 16,
    fontWeight: "700",
  },
});
