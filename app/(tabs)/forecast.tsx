import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, {
  Polyline,
  Polygon,
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
import { useSubscription } from "@/hooks/use-subscription";

const SW = Dimensions.get("window").width;
const CHART_W = SW - 56;
const CHART_H = 210;
const PL = 10;
const PR = 10;
const PT = 20;
const PB = 32;

// ─── Premium Dark + Anabolic Green ───
const GREEN = "#39FF14";
const GREEN_DIM = "#2BCC10";
const GREEN_SUBTLE = "rgba(57, 255, 20, 0.08)";
const GREEN_BORDER = "rgba(57, 255, 20, 0.15)";
const GREEN_GLOW = "rgba(57, 255, 20, 0.25)";
const BG = "#0A0A0A";
const SURF = "#141414";
const BDR = "#1E1E1E";
const T1 = "#F0F0F0";
const T2 = "#7A7A7A";
const T3 = "#444444";

/**
 * Dynamic forecast formula:
 * - TDEE is estimated from current weight (bodyweight x activity multiplier)
 * - Daily surplus/deficit = calorieGoal - TDEE
 * - Weekly weight change = surplus/deficit x 7 / 3500 (3500 cal ~ 1 lb)
 * - Protein factor: high protein preserves muscle in deficit, enhances lean gain in surplus
 * - Monthly change = weekly change x 4.33, with diminishing returns over time
 */
function computeForecast(
  currentWeight: number,
  calorieGoal: number,
  proteinGoal: number,
  targetWeight: number,
  unit: "lbs" | "kg",
  trainingDays: number = 4
) {
  const weightInLbs = unit === "kg" ? currentWeight * 2.205 : currentWeight;
  const activityMultiplier = 13 + trainingDays * 0.5;
  const tdee = weightInLbs * activityMultiplier;
  const dailySurplus = calorieGoal - tdee;
  const weeklyChangeLbs = (dailySurplus * 7) / 3500;

  const proteinRatio = proteinGoal / weightInLbs;
  const proteinModifier = Math.min(Math.max(proteinRatio, 0.5), 1.5);

  let adjustedWeeklyChange: number;
  if (dailySurplus > 0) {
    adjustedWeeklyChange = weeklyChangeLbs * (0.85 + 0.15 * proteinModifier);
  } else {
    adjustedWeeklyChange = weeklyChangeLbs * (1.15 - 0.15 * proteinModifier);
  }

  const monthlyChangeLbs = adjustedWeeklyChange * 4.33;
  const conversionFactor = unit === "kg" ? 1 / 2.205 : 1;

  const isSurplus = dailySurplus > 0;
  const pts = [];
  for (let m = 0; m <= 12; m++) {
    const diminishing = m === 0 ? 0 : Math.log(1 + m) / Math.log(13);
    const rawChange = monthlyChangeLbs * m * conversionFactor;
    const blendedChange = rawChange * (0.4 + 0.6 * (diminishing / (m / 12 || 1)));
    const projected = Math.round((currentWeight + blendedChange) * 10) / 10;
    pts.push({ month: m, weight: projected });
  }

  return { pts, isSurplus, dailySurplus, monthlyChangeLbs: monthlyChangeLbs * conversionFactor };
}

export default function ForecastScreen() {
  const { subscription, profile, weightLog, onboardingData } = useApp();
  const sub = useSubscription();
  const router = useRouter();
  const canSeeForecast = sub.canAccessForecast;
  const canUsePrioritySync = sub.canAccessPrioritySync;

  const currentWeight = weightLog.length > 0
    ? weightLog[weightLog.length - 1].weight
    : profile.currentWeight;

  const { forecastData, isSurplus } = useMemo(() => {
    const result = computeForecast(
      currentWeight,
      profile.calorieGoal,
      profile.proteinGoal,
      profile.targetWeight,
      profile.unit,
      onboardingData?.trainingDays ?? 4
    );
    return {
      forecastData: result.pts,
      isSurplus: result.isSurplus,
    };
  }, [currentWeight, profile.calorieGoal, profile.proteinGoal, profile.targetWeight, profile.unit, onboardingData?.trainingDays]);

  const { chartPoints, fillPoints, dots } = useMemo(() => {
    const weights = forecastData.map((d) => d.weight);
    const mn = Math.min(...weights) - 2;
    const mx = Math.max(...weights) + 2;
    const range = mx - mn || 1;
    const plotW = CHART_W - PL - PR;
    const plotH = CHART_H - PT - PB;

    const positions = forecastData.map((d, i) => ({
      x: PL + (i / 12) * plotW,
      y: PT + (1 - (d.weight - mn) / range) * plotH,
      weight: d.weight,
      month: d.month,
    }));

    const lineStr = positions.map((d) => `${d.x},${d.y}`).join(" ");
    const bottomY = CHART_H - PB;
    const fillStr =
      lineStr +
      ` ${positions[positions.length - 1].x},${bottomY} ${positions[0].x},${bottomY}`;

    return {
      chartPoints: lineStr,
      fillPoints: fillStr,
      dots: positions,
    };
  }, [forecastData]);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  const handleUnlock = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    (router as any).push("/paywall?from=forecast");
  };

  return (
    <ScreenContainer containerClassName="bg-transparent">
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[BG, "#050505", BG]} style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.hdr}>
          <View style={st.hdrLeft}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={GREEN} />
            <Text style={st.hdrTitle}>ANABOLIC FORECAST</Text>
          </View>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={st.hdrGear}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={18} color={T3} />
          </TouchableOpacity>
        </View>

        {/* Weight + Date */}
        <View style={st.wRow}>
          <Text style={st.wVal}>
            {currentWeight}
            <Text style={st.wUnit}> {profile.unit}</Text>
          </Text>
          <Text style={st.wDate}>{targetDate}</Text>
        </View>

        {/* Trend indicator */}
        <View style={st.trendPill}>
          <Text style={st.trendText}>
            {isSurplus ? "\u25B2 Trending Up" : "\u25BC Trending Down"}
            {" \u00B7 "}{Math.abs(forecastData[12]?.weight - currentWeight).toFixed(1)} {profile.unit} projected in 12mo
          </Text>
        </View>

        {/* Chart */}
        <View style={st.chartCard}>
          <View style={canSeeForecast ? undefined : st.blurred}>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <SvgGrad id="fillG" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={GREEN} stopOpacity="0.2" />
                  <Stop offset="1" stopColor={GREEN} stopOpacity="0" />
                </SvgGrad>
              </Defs>

              {/* Horizontal grid lines */}
              {[0.25, 0.5, 0.75].map((r) => {
                const y = PT + r * (CHART_H - PT - PB);
                return (
                  <Line
                    key={r}
                    x1={PL}
                    y1={y}
                    x2={CHART_W - PR}
                    y2={y}
                    stroke={BDR}
                    strokeWidth={0.5}
                    strokeDasharray="4,6"
                  />
                );
              })}

              {/* X-axis labels */}
              {[
                { m: 1, label: "1M" },
                { m: 7, label: "7" },
                { m: 10, label: "10" },
                { m: 12, label: "12 MONTHS" },
              ].map(({ m, label }) => {
                const x = PL + (m / 12) * (CHART_W - PL - PR);
                return (
                  <SvgText
                    key={m}
                    x={x}
                    y={CHART_H - 6}
                    fill={T2}
                    fontSize={10}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}

              {/* Gradient fill under the line */}
              <Polygon points={fillPoints} fill="url(#fillG)" />

              {/* Forecast line — Anabolic Green */}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke={GREEN}
                strokeWidth={2.5}
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
                    r={4}
                    fill={GREEN}
                    stroke={BG}
                    strokeWidth={2}
                  />
                ))}
            </Svg>
          </View>

          {/* Lock overlay for non-Elite */}
          {!canSeeForecast && (
            <View style={st.lockOverlay}>
              <View style={st.lockCircle}>
                <IconSymbol name="lock.fill" size={28} color={GREEN} />
              </View>
              <Text style={st.lockLbl}>Premium Feature</Text>
            </View>
          )}
        </View>

        {/* Priority Sync Card */}
        <View style={[st.syncCard, canUsePrioritySync && st.syncCardActive]}>
          <View style={st.syncRow}>
            <View style={[st.syncIcon, canUsePrioritySync && st.syncIconActive]}>
              {canUsePrioritySync ? (
                <IconSymbol name="checkmark.circle.fill" size={18} color={GREEN} />
              ) : (
                <IconSymbol name="lock.fill" size={16} color={T3} />
              )}
            </View>
            <View style={st.syncInfo}>
              <Text style={st.syncTitle}>Priority Sync</Text>
              {canUsePrioritySync ? (
                <View style={st.syncActiveRow}>
                  <View style={st.syncDot} />
                  <Text style={st.syncActiveSub}>Live — syncing with your daily nutrition data</Text>
                </View>
              ) : (
                <Text style={st.syncSub}>Upgrade to Elite to unlock real-time sync</Text>
              )}
            </View>
            {!canUsePrioritySync && <IconSymbol name="chevron.right" size={14} color={T3} />}
          </View>
        </View>

        {/* Premium Upsell */}
        {!canSeeForecast && (
          <View style={st.upsellCard}>
            <Text style={st.upsellBadge}>PREMIUM MEMBERS ONLY</Text>
            <Text style={st.upsellDesc}>
              Unlock this 12-Month Forecast and{"\n"}multiply your gains.
            </Text>

            <View style={st.priceBlock}>
              <Text style={st.priceMain}>ELITE ANNUAL $79.99</Text>
              <Text style={st.priceSave}>66% SAVINGS</Text>
            </View>

            <TouchableOpacity
              style={st.unlockBtn}
              onPress={handleUnlock}
              activeOpacity={0.8}
            >
              <View style={st.unlockGlow} />
              <LinearGradient
                colors={[GREEN, GREEN_DIM]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.unlockGrad}
              >
                <Text style={st.unlockTxt}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Milestones (Elite only) */}
        {canSeeForecast && (
          <View style={st.milestones}>
            <Text style={st.msTitle}>Projected Milestones</Text>
            <Text style={st.msSub}>
              Based on {profile.calorieGoal} cal/day &amp; {profile.proteinGoal}g protein
              {isSurplus ? " (surplus)" : " (deficit)"}
            </Text>
            {[
              { month: 1, label: isSurplus ? "First visible gains" : "Initial fat loss" },
              { month: 3, label: isSurplus ? "Noticeable muscle growth" : "Noticeable body composition change" },
              { month: 6, label: isSurplus ? "Significant strength increase" : "Halfway to target" },
              { month: 12, label: isSurplus ? "Major physique transformation" : "Target weight achieved" },
            ].map((ms) => (
              <View key={ms.month} style={st.msRow}>
                <View style={st.msDot} />
                <View style={st.msInfo}>
                  <Text style={st.msMonth}>Month {ms.month}</Text>
                  <Text style={st.msLabel}>{ms.label}</Text>
                </View>
                <Text style={st.msWeight}>
                  {forecastData[ms.month]?.weight} {profile.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  hdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
  },
  hdrLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  hdrTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.5,
    color: T1,
  },
  hdrGear: { padding: 8 },

  wRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  wVal: { fontSize: 38, fontWeight: "800", color: T1 },
  wUnit: { fontSize: 18, fontWeight: "600", color: T2 },
  wDate: { fontSize: 14, fontWeight: "500", color: T2 },

  trendPill: {
    alignSelf: "flex-start",
    backgroundColor: GREEN_SUBTLE,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  trendText: { fontSize: 13, fontWeight: "600", color: GREEN },

  chartCard: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    marginBottom: 14,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  blurred: { opacity: 0.15 },
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
    backgroundColor: GREEN_SUBTLE,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    justifyContent: "center",
    alignItems: "center",
  },
  lockLbl: { fontSize: 16, fontWeight: "600", color: T1 },

  syncCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    marginBottom: 14,
  },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  syncIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(58,74,92,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  syncInfo: { flex: 1, gap: 2 },
  syncTitle: { fontSize: 16, fontWeight: "600", color: T1 },
  syncSub: { fontSize: 13, color: T2 },
  syncCardActive: {
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_SUBTLE,
  },
  syncIconActive: {
    backgroundColor: "rgba(57, 255, 20, 0.15)",
  },
  syncActiveRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  syncActiveSub: {
    fontSize: 13,
    color: GREEN,
  },

  upsellCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    backgroundColor: SURF,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  upsellBadge: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: GREEN,
  },
  upsellDesc: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 22,
    color: T2,
  },
  priceBlock: { alignItems: "center", gap: 4, marginTop: 4 },
  priceMain: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
    color: T1,
  },
  priceSave: { fontSize: 13, fontWeight: "600", color: GREEN },
  unlockBtn: {
    width: "100%",
    marginTop: 6,
    position: "relative",
  },
  unlockGlow: {
    position: "absolute",
    top: -4,
    left: "10%",
    right: "10%",
    height: 60,
    borderRadius: 30,
    backgroundColor: GREEN,
    opacity: 0.15,
  },
  unlockGrad: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  unlockTxt: {
    color: BG,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  milestones: { marginTop: 4 },
  msTitle: { fontSize: 18, fontWeight: "700", color: T1, marginBottom: 4 },
  msSub: { fontSize: 13, color: T2, marginBottom: 16 },
  msRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    gap: 12,
  },
  msDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
  },
  msInfo: { flex: 1 },
  msMonth: { fontSize: 14, fontWeight: "600", color: GREEN },
  msLabel: { fontSize: 13, marginTop: 2, color: T2 },
  msWeight: { fontSize: 16, fontWeight: "700", color: T1 },
});
