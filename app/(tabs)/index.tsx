import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Polyline,
  Polygon,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WeekStrip, getWeekDates } from "@/components/week-strip";
import { useApp } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import { calculateStreak, getMealDates } from "@/lib/streak";
import { AICoachInsight } from "@/components/ai-coach-insight";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

// ─── Anabolic Score Ring geometry ───
const RING_SIZE = Math.min(SW * 0.58, 240);
const RING_STROKE = 16;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

// ─── Forecast mini-chart geometry ───
const CHART_W = SW - 72;
const CHART_H = 160;
const C_PL = 8;
const C_PR = 8;
const C_PT = 16;
const C_PB = 28;

// ─── Clean V1 palette ───
const RED = "#E53935";
const RED_DIM = "rgba(229, 57, 53, 0.15)";
const BG = "#0D0D0D";
const CARD_BG = "#141414";
const BORDER = "#1E1E1E";
const TEXT_PRIMARY = "#F0F0F0";
const TEXT_SECONDARY = "#888888";
const TEXT_DIM = "#555555";

function scoreColor(s: number) {
  if (s >= 80) return "#4CAF50";
  if (s >= 60) return "#FFC107";
  return RED;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Forecast computation (same formula as forecast tab)
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

  return { pts, isSurplus };
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    profile,
    meals: allMeals,
    getCaloriesByDate,
    getMacrosByDate,
    getMealsByDate,
    selectedDate,
    setSelectedDate,
    weightLog,
    onboardingData,
  } = useApp();
  const sub = useSubscription();

  const cal = useMemo(() => getCaloriesByDate(selectedDate), [getCaloriesByDate, selectedDate]);
  const mac = useMemo(() => getMacrosByDate(selectedDate), [getMacrosByDate, selectedDate]);
  const meals = useMemo(() => getMealsByDate(selectedDate), [getMealsByDate, selectedDate]);
  const last = meals.length > 0 ? meals[meals.length - 1] : null;

  // Compute average anabolic score for the day
  const avgAnabolicScore = useMemo(() => {
    if (meals.length === 0) return 0;
    const total = meals.reduce((sum, m) => sum + m.anabolicScore, 0);
    return Math.round(total / meals.length);
  }, [meals]);

  // Anabolic Score ring progress (0-100 mapped to ring)
  const scoreProg = Math.min(1, avgAnabolicScore / 100);
  const scoreDashOff = RING_C * (1 - scoreProg * 0.75); // max 270° sweep

  // Dates with meals for the week strip
  const datesWithMeals = useMemo(() => {
    const weekDates = getWeekDates();
    const set = new Set<string>();
    for (const day of weekDates) {
      const dayMeals = getMealsByDate(day.date);
      if (dayMeals.length > 0) set.add(day.date);
    }
    return set;
  }, [getMealsByDate]);

  // AI Coach data from the latest meal
  const coachData = useMemo(() => {
    if (!last) return null;
    return {
      anabolicScore: last.anabolicScore,
      totalProtein: last.protein,
      totalCalories: last.calories,
      totalCarbs: last.carbs,
      totalFat: last.fat,
      totalSugar: last.sugar,
      foods: [{ name: last.name, grams: 0, calories: last.calories, protein: last.protein, carbs: last.carbs, fat: last.fat, sugar: last.sugar, confidence: 1 }],
      mealName: last.name,
    };
  }, [last]);

  // 12-month forecast
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
    return { forecastData: result.pts, isSurplus: result.isSurplus };
  }, [currentWeight, profile.calorieGoal, profile.proteinGoal, profile.targetWeight, profile.unit, onboardingData?.trainingDays]);

  // Mini forecast chart points
  const { chartLine, chartFill, chartDots } = useMemo(() => {
    const weights = forecastData.map((d) => d.weight);
    const mn = Math.min(...weights) - 2;
    const mx = Math.max(...weights) + 2;
    const range = mx - mn || 1;
    const plotW = CHART_W - C_PL - C_PR;
    const plotH = CHART_H - C_PT - C_PB;

    const positions = forecastData.map((d, i) => ({
      x: C_PL + (i / 12) * plotW,
      y: C_PT + (1 - (d.weight - mn) / range) * plotH,
      weight: d.weight,
      month: d.month,
    }));

    const lineStr = positions.map((d) => `${d.x},${d.y}`).join(" ");
    const bottomY = CHART_H - C_PB;
    const fillStr =
      lineStr +
      ` ${positions[positions.length - 1].x},${bottomY} ${positions[0].x},${bottomY}`;

    return { chartLine: lineStr, chartFill: fillStr, chartDots: positions };
  }, [forecastData]);

  const doScan = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (router as any).push("/scan-meal");
  }, [router]);

  return (
    <ScreenContainer containerClassName="bg-transparent">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER — Low-Poly Bicep Logo ═══ */}
        <View style={s.hdr}>
          <TouchableOpacity
            onPress={() => (router as any).push("/profile")}
            style={s.hdrAvatar}
            activeOpacity={0.7}
          >
            {profile.profilePhotoUri ? (
              <Image source={{ uri: profile.profilePhotoUri }} style={s.hdrAvatarImg} />
            ) : (
              <View style={s.hdrAvatarFallback}>
                <Text style={s.hdrAvatarText}>
                  {(profile.name || "M").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.hdrCenter}>
            <Image
              source={require("@/assets/images/logo-cropped.png")}
              style={s.hdrLogo}
              contentFit="contain"
            />
            <Text style={s.hdrTitle}>MUSCLE AI</Text>
          </View>

          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={s.hdrGear}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={20} color={TEXT_DIM} />
          </TouchableOpacity>
        </View>

        {/* ═══ WEEKLY CALENDAR STRIP ═══ */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} datesWithMeals={datesWithMeals} />

        {/* ═══ LARGE RED ANABOLIC SCORE CIRCLE ═══ */}
        <View style={s.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={RED} />
                <Stop offset="0.5" stopColor="#FF5252" />
                <Stop offset="1" stopColor="#D32F2F" />
              </SvgGradient>
            </Defs>
            {/* Background track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#1A1A1A"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Red progress arc */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="url(#scoreGrad)"
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={RING_C}
              strokeDashoffset={scoreDashOff}
              strokeLinecap="round"
              rotation="-225"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

          {/* Center: Anabolic Score */}
          <View style={s.ringCenter}>
            <Text style={s.ringScore}>{avgAnabolicScore}</Text>
            <Text style={s.ringLabel}>ANABOLIC{"\n"}SCORE</Text>
          </View>
        </View>

        {/* Score subtitle */}
        <Text style={s.scoreSubtitle}>
          {meals.length === 0
            ? "Scan a meal to see your score"
            : avgAnabolicScore >= 80
              ? "Elite anabolic performance today"
              : avgAnabolicScore >= 60
                ? "Solid muscle-building nutrition"
                : "Room to optimize for hypertrophy"}
        </Text>

        {/* ═══ MACRO CARDS ═══ */}
        <View style={s.macRow}>
          {[
            { val: cal, label: "CALORIES", unit: "", color: RED },
            { val: mac.protein, label: "PROTEIN", unit: "g", color: TEXT_PRIMARY },
            { val: mac.carbs, label: "CARBS", unit: "g", color: TEXT_SECONDARY },
            { val: mac.fat, label: "FAT", unit: "g", color: TEXT_SECONDARY },
          ].map((m) => (
            <View key={m.label} style={s.macCard}>
              <Text style={[s.macVal, { color: m.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {m.val}
                <Text style={s.macUnit}>{m.unit}</Text>
              </Text>
              <Text style={s.macLbl}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ═══ SCAN BUTTON ═══ */}
        <TouchableOpacity style={s.scanBtn} onPress={doScan} activeOpacity={0.8}>
          <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
          <Text style={s.scanBtnText}>Scan Meal</Text>
        </TouchableOpacity>

        {/* ═══ AI COACH INSIGHTS ═══ */}
        {coachData ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>AI COACH</Text>
            <AICoachInsight {...coachData} />
          </View>
        ) : (
          <View style={s.coachEmpty}>
            <IconSymbol name="bolt.fill" size={24} color={TEXT_DIM} />
            <Text style={s.coachEmptyTitle}>AI Coach</Text>
            <Text style={s.coachEmptyText}>
              Scan your first meal to get personalized{"\n"}muscle-building insights
            </Text>
          </View>
        )}

        {/* ═══ 12-MONTH MUSCLE FORECAST ═══ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>12-MONTH FORECAST</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/forecast")}
              activeOpacity={0.7}
            >
              <Text style={s.sectionLink}>See Full →</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chartCard}>
            {/* Trend label */}
            <View style={s.chartTrend}>
              <Text style={s.chartTrendText}>
                {isSurplus ? "▲" : "▼"} {Math.abs(forecastData[12]?.weight - currentWeight).toFixed(1)} {profile.unit} projected
              </Text>
            </View>

            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <SvgGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={RED} stopOpacity="0.20" />
                  <Stop offset="1" stopColor={RED} stopOpacity="0" />
                </SvgGradient>
              </Defs>

              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((r) => {
                const y = C_PT + r * (CHART_H - C_PT - C_PB);
                return (
                  <Line
                    key={r}
                    x1={C_PL}
                    y1={y}
                    x2={CHART_W - C_PR}
                    y2={y}
                    stroke={BORDER}
                    strokeWidth={0.5}
                    strokeDasharray="4,6"
                  />
                );
              })}

              {/* Fill area */}
              <Polygon points={chartFill} fill="url(#chartFill)" />

              {/* Line */}
              <Polyline
                points={chartLine}
                fill="none"
                stroke={RED}
                strokeWidth={2}
                strokeLinejoin="round"
              />

              {/* Month labels */}
              {[0, 3, 6, 9, 12].map((m) => {
                const dot = chartDots[m];
                if (!dot) return null;
                return (
                  <SvgText
                    key={m}
                    x={dot.x}
                    y={CHART_H - 8}
                    fontSize={10}
                    fill={TEXT_DIM}
                    textAnchor="middle"
                  >
                    {m === 0 ? "Now" : `${m}mo`}
                  </SvgText>
                );
              })}

              {/* Start and end dots */}
              <Circle cx={chartDots[0]?.x} cy={chartDots[0]?.y} r={4} fill={RED} />
              <Circle cx={chartDots[12]?.x} cy={chartDots[12]?.y} r={4} fill={RED} />
            </Svg>

            {/* Weight labels */}
            <View style={s.chartWeights}>
              <Text style={s.chartWeightLabel}>{currentWeight} {profile.unit}</Text>
              <Text style={s.chartWeightLabel}>{forecastData[12]?.weight} {profile.unit}</Text>
            </View>
          </View>
        </View>

        {/* ═══ QUICK LINKS ═══ */}
        <View style={s.linkRow}>
          <TouchableOpacity
            style={s.linkCard}
            onPress={() => (router as any).push("/fast-food-pro")}
            activeOpacity={0.7}
          >
            <IconSymbol name="storefront.fill" size={18} color={TEXT_PRIMARY} />
            <Text style={s.linkTitle}>Fast Food Pro</Text>
            <Text style={s.linkSub}>Best protein picks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.linkCard}
            onPress={() => (router as any).push("/support")}
            activeOpacity={0.7}
          >
            <IconSymbol name="bubble.left.fill" size={18} color={TEXT_PRIMARY} />
            <Text style={s.linkTitle}>Support</Text>
            <Text style={s.linkSub}>AI help, 24/7</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ═══ FLOATING CAMERA FAB ═══ */}
      <TouchableOpacity style={s.fab} onPress={doScan} activeOpacity={0.8}>
        <View style={s.fabInner}>
          <IconSymbol name="camera.fill" size={26} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  /* Header */
  hdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  hdrCenter: {
    alignItems: "center",
    gap: 2,
  },
  hdrLogo: {
    width: 64,
    height: 44,
  },
  hdrTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3,
    color: TEXT_SECONDARY,
  },
  hdrAvatar: { padding: 2 },
  hdrAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#333",
  },
  hdrAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#222",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  hdrAvatarText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: TEXT_PRIMARY,
  },
  hdrGear: { padding: 8 },

  /* Anabolic Score Ring */
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringScore: {
    fontSize: 56,
    fontWeight: "700",
    color: RED,
    letterSpacing: -2,
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 2,
  },

  scoreSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 20,
  },

  /* Macro cards */
  macRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  macCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  macVal: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  macUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: TEXT_SECONDARY,
  },
  macLbl: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: TEXT_DIM,
  },

  /* Scan button */
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
  },
  scanBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Sections */
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: TEXT_SECONDARY,
    marginBottom: 10,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "600",
    color: RED,
    marginBottom: 10,
  },

  /* AI Coach empty state */
  coachEmpty: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  coachEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_SECONDARY,
    letterSpacing: 1,
  },
  coachEmptyText: {
    fontSize: 13,
    color: TEXT_DIM,
    textAlign: "center",
    lineHeight: 19,
  },

  /* Forecast chart */
  chartCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    alignItems: "center",
  },
  chartTrend: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  chartTrendText: {
    fontSize: 13,
    fontWeight: "600",
    color: RED,
  },
  chartWeights: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  chartWeightLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },

  /* Quick links */
  linkRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 6,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  linkSub: {
    fontSize: 12,
    color: TEXT_DIM,
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: RED,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
