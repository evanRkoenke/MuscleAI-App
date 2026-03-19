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
import Svg, {
  Polyline,
  Line,
  Text as SvgText,
  Circle as SvgCircle,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";

const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - 56;
const CHART_H = 200;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;

// Brand palette
const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const DEEP_BLUE = "#003A80";
const SURFACE = "#111820";
const BORDER = "#1A2533";
const TEXT_PRIMARY = "#ECEDEE";
const TEXT_SECONDARY = "#7A8A99";
const TEXT_TERTIARY = "#5A6A7A";

const STRIPE_ELITE = "https://buy.stripe.com/28E00c3VTa1FffJc6WbEA05";

export default function ForecastScreen() {
  const { subscription, profile } = useApp();
  const isElite = subscription === "elite";

  // Generate 13 data points (month 0–12)
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
      });
    }
    return pts;
  }, [profile.currentWeight, profile.targetWeight]);

  // Chart geometry
  const { chartPoints, dots, minW, maxW } = useMemo(() => {
    const weights = forecastData.map((d) => d.weight);
    const mn = Math.min(...weights) - 2;
    const mx = Math.max(...weights) + 2;
    const range = mx - mn || 1;
    const plotW = CHART_W - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;

    const positions = forecastData.map((d, i) => ({
      x: PAD_L + (i / 12) * plotW,
      y: PAD_T + (1 - (d.weight - mn) / range) * plotH,
      weight: d.weight,
      month: d.month,
    }));

    return {
      chartPoints: positions.map((d) => `${d.x},${d.y}`).join(" "),
      dots: positions,
      minW: mn,
      maxW: mx,
    };
  }, [forecastData]);

  // Target date ~12 months from now
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  const handleUnlock = async () => {
    try {
      await Linking.openURL(STRIPE_ELITE);
    } catch {
      // silent
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={ELECTRIC_BLUE} />
            <Text style={styles.headerTitle}>ANABOLIC FORECAST</Text>
          </View>
        </View>

        {/* ─── WEIGHT + DATE ─── */}
        <View style={styles.weightRow}>
          <Text style={styles.weightValue}>
            {profile.currentWeight}
            <Text style={styles.weightUnit}> {profile.unit}</Text>
          </Text>
          <Text style={styles.dateLabel}>{targetDate}</Text>
        </View>

        {/* ─── CHART ─── */}
        <View style={styles.chartCard}>
          <View style={isElite ? undefined : styles.blurred}>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <SvgGrad id="fLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={DEEP_BLUE} />
                  <Stop offset="0.4" stopColor={ELECTRIC_BLUE} />
                  <Stop offset="1" stopColor={CYAN_GLOW} />
                </SvgGrad>
              </Defs>

              {/* Horizontal grid lines (subtle dashed) */}
              {[0.25, 0.5, 0.75].map((r) => {
                const y = PAD_T + r * (CHART_H - PAD_T - PAD_B);
                return (
                  <Line
                    key={r}
                    x1={PAD_L}
                    y1={y}
                    x2={CHART_W - PAD_R}
                    y2={y}
                    stroke={BORDER}
                    strokeWidth={0.5}
                    strokeDasharray="4,6"
                  />
                );
              })}

              {/* X-axis labels: 1M, 7, 10, 12 MONTHS */}
              {[
                { m: 1, label: "1M" },
                { m: 7, label: "7" },
                { m: 10, label: "10" },
                { m: 12, label: "12 MONTHS" },
              ].map(({ m, label }) => {
                const x = PAD_L + (m / 12) * (CHART_W - PAD_L - PAD_R);
                return (
                  <SvgText
                    key={m}
                    x={x}
                    y={CHART_H - 4}
                    fill={TEXT_SECONDARY}
                    fontSize={10}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}

              {/* Forecast line */}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke="url(#fLineGrad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data point dots */}
              {dots
                .filter((_, i) => i % 3 === 0 || i === 12)
                .map((d, i) => (
                  <SvgCircle
                    key={i}
                    cx={d.x}
                    cy={d.y}
                    r={4.5}
                    fill={ELECTRIC_BLUE}
                    stroke="#0A0E14"
                    strokeWidth={2}
                  />
                ))}
            </Svg>
          </View>

          {/* Lock overlay for non-Elite */}
          {!isElite && (
            <View style={styles.lockOverlay}>
              <View style={styles.lockCircle}>
                <IconSymbol name="lock.fill" size={28} color={ELECTRIC_BLUE} />
              </View>
              <Text style={styles.lockLabel}>Premium Feature</Text>
            </View>
          )}
        </View>

        {/* ─── PRIORITY SYNC CARD ─── */}
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <IconSymbol name="lock.fill" size={18} color={TEXT_TERTIARY} />
            <View style={styles.syncInfo}>
              <Text style={styles.syncTitle}>Priority Sync</Text>
              <Text style={styles.syncSub}>
                {isElite
                  ? "Real-time sync with your daily nutrition data."
                  : "Locked content updates"}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={TEXT_TERTIARY} />
          </View>
        </View>

        {/* ─── PREMIUM UPSELL BOX ─── */}
        {!isElite && (
          <View style={styles.upsellCard}>
            <LinearGradient
              colors={["rgba(0,122,255,0.06)", "rgba(255,59,48,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.upsellBadge}>PREMIUM MEMBERS ONLY</Text>
            <Text style={styles.upsellDesc}>
              Unlock this 12-Month Forecast and{"\n"}multiply your gains.
            </Text>

            {/* Price block */}
            <View style={styles.priceBlock}>
              <Text style={styles.priceMain}>ELITE ANNUAL $79.99</Text>
              <Text style={styles.priceSavings}>66% SAVINGS</Text>
            </View>

            {/* UNLOCK button — gradient blue → red */}
            <TouchableOpacity
              style={styles.unlockBtn}
              onPress={handleUnlock}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[ELECTRIC_BLUE, "#FF3B30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unlockGrad}
              >
                <Text style={styles.unlockText}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── MILESTONES (Elite only) ─── */}
        {isElite && (
          <View style={styles.milestones}>
            <Text style={styles.msTitle}>Projected Milestones</Text>
            {[
              { month: 1, label: "First visible progress" },
              { month: 3, label: "Noticeable body composition change" },
              { month: 6, label: "Halfway to target" },
              { month: 12, label: "Target weight achieved" },
            ].map((ms) => (
              <View key={ms.month} style={styles.msRow}>
                <View style={styles.msDot} />
                <View style={styles.msInfo}>
                  <Text style={styles.msMonth}>Month {ms.month}</Text>
                  <Text style={styles.msLabel}>{ms.label}</Text>
                </View>
                <Text style={styles.msWeight}>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    color: TEXT_PRIMARY,
  },

  /* Weight row */
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: "900",
    color: TEXT_PRIMARY,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },

  /* Chart */
  chartCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  blurred: {
    opacity: 0.2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  lockCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,122,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },

  /* Priority Sync */
  syncCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 14,
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syncInfo: {
    flex: 1,
    gap: 2,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  syncSub: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },

  /* Upsell */
  upsellCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: ELECTRIC_BLUE,
    backgroundColor: SURFACE,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  upsellBadge: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    color: TEXT_PRIMARY,
  },
  upsellDesc: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    color: TEXT_SECONDARY,
  },
  priceBlock: {
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  priceMain: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    color: TEXT_PRIMARY,
  },
  priceSavings: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00E676",
  },
  unlockBtn: {
    width: "100%",
    marginTop: 6,
  },
  unlockGrad: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },

  /* Milestones */
  milestones: {
    marginTop: 4,
  },
  msTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  msRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  msDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ELECTRIC_BLUE,
  },
  msInfo: {
    flex: 1,
  },
  msMonth: {
    fontSize: 14,
    fontWeight: "700",
    color: ELECTRIC_BLUE,
  },
  msLabel: {
    fontSize: 13,
    marginTop: 2,
    color: TEXT_SECONDARY,
  },
  msWeight: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
});
