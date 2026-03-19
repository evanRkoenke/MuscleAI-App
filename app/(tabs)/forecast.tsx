import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
} from "react-native";
import Svg, { Polyline, Line, Text as SvgText, Circle, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";

const SCREEN_W = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_W - 56;
const CHART_HEIGHT = 200;
const CHART_PAD_L = 44;
const CHART_PAD_R = 16;
const CHART_PAD_T = 20;
const CHART_PAD_B = 32;

const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const STRIPE_ELITE = "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05";

export default function ForecastScreen() {
  const colors = useColors();
  const { subscription, profile } = useApp();
  const isElite = subscription === "elite";

  const forecastData = useMemo(() => {
    const start = profile.currentWeight;
    const target = profile.targetWeight;
    const diff = target - start;
    const pts = [];
    for (let m = 0; m <= 12; m++) {
      const p = Math.log(1 + m) / Math.log(13);
      pts.push({
        month: m,
        weight: Math.round((start + diff * p) * 10) / 10,
        label: m === 0 ? "Now" : `${m}M`,
      });
    }
    return pts;
  }, [profile.currentWeight, profile.targetWeight]);

  const { chartPoints, dotPositions, minW, maxW } = useMemo(() => {
    const weights = forecastData.map((d) => d.weight);
    const mn = Math.min(...weights) - 3;
    const mx = Math.max(...weights) + 3;
    const range = mx - mn || 1;
    const plotW = CHART_WIDTH - CHART_PAD_L - CHART_PAD_R;
    const plotH = CHART_HEIGHT - CHART_PAD_T - CHART_PAD_B;

    const dots = forecastData.map((d, i) => {
      const x = CHART_PAD_L + (i / 12) * plotW;
      const y = CHART_PAD_T + (1 - (d.weight - mn) / range) * plotH;
      return { x, y, weight: d.weight, month: d.month };
    });

    return {
      chartPoints: dots.map((d) => `${d.x},${d.y}`).join(" "),
      dotPositions: dots,
      minW: mn,
      maxW: mx,
    };
  }, [forecastData]);

  const handleUnlock = async () => {
    try {
      await Linking.openURL(STRIPE_ELITE);
    } catch {
      // handled silently
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={22} color={ELECTRIC_BLUE} />
            <Text style={styles.headerTitle}>ANABOLIC FORECAST</Text>
          </View>
          {!isElite && <IconSymbol name="lock.fill" size={18} color="#FFB300" />}
        </View>

        {/* Weight Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.currentWeight}</Text>
            <Text style={styles.statUnit}>{profile.unit}</Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: ELECTRIC_BLUE }]}>{profile.targetWeight}</Text>
            <Text style={[styles.statUnit, { color: ELECTRIC_BLUE }]}>{profile.unit}</Text>
            <Text style={styles.statLabel}>Target</Text>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <View style={isElite ? undefined : styles.blurredContent}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <SvgGrad id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={ELECTRIC_BLUE} />
                  <Stop offset="1" stopColor={CYAN_GLOW} />
                </SvgGrad>
              </Defs>
              {/* Horizontal grid lines */}
              {[0.25, 0.5, 0.75].map((r) => {
                const y = CHART_PAD_T + r * (CHART_HEIGHT - CHART_PAD_T - CHART_PAD_B);
                return (
                  <Line
                    key={r}
                    x1={CHART_PAD_L}
                    y1={y}
                    x2={CHART_WIDTH - CHART_PAD_R}
                    y2={y}
                    stroke="#1A2533"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                );
              })}
              {/* X-axis labels */}
              {[0, 3, 6, 9, 12].map((m) => {
                const x = CHART_PAD_L + (m / 12) * (CHART_WIDTH - CHART_PAD_L - CHART_PAD_R);
                return (
                  <SvgText
                    key={m}
                    x={x}
                    y={CHART_HEIGHT - 6}
                    fill="#7A8A99"
                    fontSize={10}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {m === 0 ? "1M" : m === 12 ? "12 MONTHS" : `${m}M`}
                  </SvgText>
                );
              })}
              {/* Forecast line with gradient */}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data dots */}
              {dotPositions.filter((_, i) => i % 3 === 0 || i === 12).map((d, i) => (
                <Circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={4}
                  fill={ELECTRIC_BLUE}
                  stroke="#0A0E14"
                  strokeWidth={2}
                />
              ))}
            </Svg>
          </View>

          {!isElite && (
            <View style={styles.lockOverlay}>
              <View style={styles.lockIconBg}>
                <IconSymbol name="lock.fill" size={28} color={ELECTRIC_BLUE} />
              </View>
              <Text style={styles.lockText}>Premium Feature</Text>
            </View>
          )}
        </View>

        {/* Priority Sync */}
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <IconSymbol name="lock.fill" size={18} color="#5A6A7A" />
            <Text style={styles.syncTitle}>Priority Sync</Text>
            <IconSymbol name="chevron.right" size={16} color="#3A4A5C" />
          </View>
          <Text style={styles.syncDesc}>
            {isElite
              ? "Your forecast syncs with daily nutrition data for real-time predictions."
              : "Locked content updates — upgrade to Elite for real-time sync."}
          </Text>
        </View>

        {/* Premium Upsell */}
        {!isElite && (
          <View style={styles.upsellCard}>
            <LinearGradient
              colors={["rgba(0,122,255,0.08)", "rgba(255,59,48,0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.upsellBadge}>PREMIUM MEMBERS ONLY</Text>
            <Text style={styles.upsellDesc}>
              Unlock this 12-Month Forecast and multiply your gains.
            </Text>
            <View style={styles.upsellPriceRow}>
              <Text style={styles.upsellPrice}>ELITE ANNUAL $79.99</Text>
              <Text style={styles.upsellSavings}>66% SAVINGS</Text>
            </View>
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={handleUnlock}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[ELECTRIC_BLUE, "#FF3B30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unlockGradient}
              >
                <Text style={styles.unlockText}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Milestones (Elite) */}
        {isElite && (
          <View style={styles.milestones}>
            <Text style={styles.milestonesTitle}>Projected Milestones</Text>
            {[
              { month: 1, label: "First visible progress" },
              { month: 3, label: "Noticeable body composition change" },
              { month: 6, label: "Halfway to target" },
              { month: 12, label: "Target weight achieved" },
            ].map((ms) => (
              <View key={ms.month} style={styles.milestoneRow}>
                <View style={styles.milestoneDot} />
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneMonth}>Month {ms.month}</Text>
                  <Text style={styles.milestoneLabel}>{ms.label}</Text>
                </View>
                <Text style={styles.milestoneWeight}>
                  {forecastData[ms.month]?.weight} {profile.unit}
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#ECEDEE",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111820",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A2533",
    padding: 18,
    marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 40, backgroundColor: "#1A2533" },
  statValue: { fontSize: 32, fontWeight: "900", color: "#ECEDEE" },
  statUnit: { fontSize: 14, fontWeight: "600", color: "#7A8A99", marginTop: 2 },
  statLabel: { fontSize: 12, fontWeight: "500", color: "#5A6A7A", marginTop: 4 },
  chartCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    marginBottom: 16,
    alignItems: "center",
    overflow: "hidden",
  },
  blurredContent: { opacity: 0.25 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  lockIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,122,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockText: { fontSize: 16, fontWeight: "700", color: "#ECEDEE" },
  syncCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    marginBottom: 16,
  },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  syncTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#ECEDEE" },
  syncDesc: { fontSize: 14, lineHeight: 20, color: "#7A8A99" },
  upsellCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: ELECTRIC_BLUE,
    backgroundColor: "#111820",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  upsellBadge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#FFB300",
  },
  upsellDesc: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    color: "#ECEDEE",
  },
  upsellPriceRow: { alignItems: "center", gap: 4 },
  upsellPrice: { fontSize: 22, fontWeight: "900", letterSpacing: 1, color: "#ECEDEE" },
  upsellSavings: { fontSize: 13, fontWeight: "700", color: "#00E676" },
  unlockButton: { width: "100%", marginTop: 4 },
  unlockGradient: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 3 },
  milestones: { marginTop: 4 },
  milestonesTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", marginBottom: 16 },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2533",
    gap: 12,
  },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ELECTRIC_BLUE },
  milestoneInfo: { flex: 1 },
  milestoneMonth: { fontSize: 14, fontWeight: "700", color: ELECTRIC_BLUE },
  milestoneLabel: { fontSize: 13, marginTop: 2, color: "#7A8A99" },
  milestoneWeight: { fontSize: 16, fontWeight: "700", color: "#ECEDEE" },
});
