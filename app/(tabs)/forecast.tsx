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
import { Typography } from "@/constants/typography";


const SW = Dimensions.get("window").width;
const CHART_W = SW - 56;
const CHART_H = 210;
const PL = 10;
const PR = 10;
const PT = 20;
const PB = 32;

// Brand palette
const ACCENT = "#FFFFFF";
const SILVER = "#C0C0C0";
const BG = "#000000";
const SURF = "#0A0A0A";
const SURF2 = "#111111";
const BDR = "#222222";
const T1 = "#F0F0F0";
const T2 = "#888888";
const T3 = "#444444";

export default function ForecastScreen() {
  const { subscription, profile } = useApp();
  const router = useRouter();
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
    // Fill polygon: line points + bottom-right + bottom-left
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

  // Target date ~12 months from now
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  const handleUnlock = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    (router as any).push("/paywall");
  };

  return (
    <ScreenContainer containerClassName="bg-transparent">
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[BG, "#000000", BG]} style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={st.hdr}>
          <View style={st.hdrLeft}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={ACCENT} />
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

        {/* ═══ WEIGHT + DATE ═══ */}
        <View style={st.wRow}>
          <Text style={st.wVal}>
            {profile.currentWeight}
            <Text style={st.wUnit}> {profile.unit}</Text>
          </Text>
          <Text style={st.wDate}>{targetDate}</Text>
        </View>

        {/* ═══ CHART ═══ */}
        <View style={st.chartCard}>
          <View style={isElite ? undefined : st.blurred}>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <SvgGrad id="fillG" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={ACCENT} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
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

              {/* X-axis labels: 1M, 7, 10, 12 MONTHS */}
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

              {/* Forecast line — WHITE to match reference */}
              <Polyline
                points={chartPoints}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data point dots — white with dark stroke */}
              {dots
                .filter((_, i) => i % 3 === 0 || i === 12)
                .map((d, i) => (
                  <SvgCircle
                    key={i}
                    cx={d.x}
                    cy={d.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke={BG}
                    strokeWidth={2}
                  />
                ))}
            </Svg>
          </View>

          {/* Lock overlay for non-Elite */}
          {!isElite && (
            <View style={st.lockOverlay}>
              <View style={st.lockCircle}>
                <IconSymbol name="lock.fill" size={28} color={ACCENT} />
              </View>
              <Text style={st.lockLbl}>Premium Feature</Text>
            </View>
          )}
        </View>

        {/* ═══ PRIORITY SYNC CARD ═══ */}
        <View style={st.syncCard}>
          <View style={st.syncRow}>
            <View style={st.syncIcon}>
              <IconSymbol name="lock.fill" size={16} color={T3} />
            </View>
            <View style={st.syncInfo}>
              <Text style={st.syncTitle}>Priority Sync</Text>
              <Text style={st.syncSub}>
                {isElite
                  ? "Real-time sync with your daily nutrition data."
                  : "Locked content updates"}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={14} color={T3} />
          </View>
        </View>

        {/* ═══ PREMIUM UPSELL BOX ═══ */}
        {!isElite && (
          <View style={st.upsellCard}>
            <LinearGradient
              colors={["rgba(0,122,255,0.06)", "rgba(255,59,48,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <Text style={st.upsellBadge}>PREMIUM MEMBERS ONLY</Text>
            <Text style={st.upsellDesc}>
              Unlock this 12-Month Forecast and{"\n"}multiply your gains.
            </Text>

            {/* Price block */}
            <View style={st.priceBlock}>
              <Text style={st.priceMain}>ELITE ANNUAL $79.99</Text>
              <Text style={st.priceSave}>66% SAVINGS</Text>
            </View>

            {/* UNLOCK button — gradient blue → red */}
            <TouchableOpacity
              style={st.unlockBtn}
              onPress={handleUnlock}
              activeOpacity={0.8}
            >
              <View style={st.unlockGlow} />
              <LinearGradient
                colors={[ACCENT, "#FF3B30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.unlockGrad}
              >
                <Text style={st.unlockTxt}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ MILESTONES (Elite only) ═══ */}
        {isElite && (
          <View style={st.milestones}>
            <Text style={st.msTitle}>Projected Milestones</Text>
            {[
              { month: 1, label: "First visible progress" },
              { month: 3, label: "Noticeable body composition change" },
              { month: 6, label: "Halfway to target" },
              { month: 12, label: "Target weight achieved" },
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

  /* Header */
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

  /* Weight row */
  wRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  wVal: { fontSize: 38, fontWeight: "700", color: T1 },
  wUnit: { fontSize: 18, fontWeight: "600", color: T2 },
  wDate: { fontSize: 14, fontWeight: "400", color: T2 },

  /* Chart */
  chartCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF2,
    marginBottom: 14,
    alignItems: "center",
    overflow: "hidden",
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
    backgroundColor: "rgba(0,122,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockLbl: { fontSize: 16, fontWeight: "600", color: T1 },

  /* Priority Sync */
  syncCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF2,
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

  /* Upsell */
  upsellCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: SURF2,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  upsellBadge: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 2.5,
    color: T1,
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
    fontWeight: "700",
    letterSpacing: 1,
    color: T1,
  },
  priceSave: { fontSize: 13, fontWeight: "600", color: "#C0C0C0" },
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
    backgroundColor: ACCENT,
    opacity: 0.2,
  },
  unlockGrad: {
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  unlockTxt: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 4,
  },

  /* Milestones */
  milestones: { marginTop: 4 },
  msTitle: { fontSize: 18, fontWeight: "600", color: T1, marginBottom: 16 },
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
    backgroundColor: ACCENT,
  },
  msInfo: { flex: 1 },
  msMonth: { fontSize: 14, fontWeight: "400", color: ACCENT },
  msLabel: { fontSize: 13, marginTop: 2, color: T2 },
  msWeight: { fontSize: 16, fontWeight: "600", color: T1 },
});
