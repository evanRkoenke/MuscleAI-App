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
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WeekStrip, getWeekDates } from "@/components/week-strip";
import { useApp } from "@/lib/app-context";
import { useSubscription } from "@/hooks/use-subscription";
import { calculateStreak, getMealDates } from "@/lib/streak";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

// ─── Anabolic Score Ring geometry ───
const SCORE_RING_SIZE = Math.min(SW * 0.58, 240);
const SCORE_STROKE = 14;
const SCORE_R = (SCORE_RING_SIZE - SCORE_STROKE) / 2;
const SCORE_C = 2 * Math.PI * SCORE_R;

// ─── Calorie Ring geometry (smaller, below score) ───
const CAL_RING_SIZE = Math.min(SW * 0.32, 140);
const CAL_STROKE = 10;
const CAL_R = (CAL_RING_SIZE - CAL_STROKE) / 2;
const CAL_C = 2 * Math.PI * CAL_R;

// ─── Premium Dark + Anabolic Green Palette ───
const GREEN = "#39FF14";
const GREEN_DIM = "#2BCC10";
const GREEN_GLOW = "rgba(57, 255, 20, 0.25)";
const GREEN_SUBTLE = "rgba(57, 255, 20, 0.08)";
const GREEN_BORDER = "rgba(57, 255, 20, 0.15)";
const BG = "#0A0A0A";
const SURF = "#141414";
const SURF2 = "#1A1A1A";
const BDR = "#1E1E1E";
const T1 = "#F0F0F0";
const T2 = "#7A7A7A";
const T3 = "#444444";

// Macro colors — vibrant for contrast on dark
const PROT_COLOR = "#39FF14";
const CARB_COLOR = "#00D4FF";
const FAT_COLOR = "#FF6B35";
const SUGAR_COLOR = "#FFB800";

function scoreColor(s: number) {
  return s >= 80 ? GREEN : s >= 60 ? "#FFB800" : "#FF3B3B";
}

function scoreLabel(s: number) {
  return s >= 80 ? "ELITE" : s >= 60 ? "GOOD" : "LOW";
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
  } = useApp();
  const sub = useSubscription();

  const cal = useMemo(() => getCaloriesByDate(selectedDate), [getCaloriesByDate, selectedDate]);
  const mac = useMemo(() => getMacrosByDate(selectedDate), [getMacrosByDate, selectedDate]);
  const rem = Math.max(0, profile.calorieGoal - cal);
  const calProg = Math.min(1, cal / profile.calorieGoal);
  const calDashOff = CAL_C * (1 - calProg * 0.75);

  const meals = useMemo(() => getMealsByDate(selectedDate), [getMealsByDate, selectedDate]);
  const last = meals.length > 0 ? meals[meals.length - 1] : null;

  // Compute daily Anabolic Score (average of all meal scores, or 0)
  const anabolicScore = useMemo(() => {
    if (meals.length === 0) return 0;
    const total = meals.reduce((sum, m) => sum + (m.anabolicScore || 0), 0);
    return Math.round(total / meals.length);
  }, [meals]);
  const scoreProg = anabolicScore / 100;
  const scoreDashOff = SCORE_C * (1 - scoreProg);

  // Dates with meals for week strip dots
  const datesWithMeals = useMemo(() => {
    const weekDates = getWeekDates();
    const set = new Set<string>();
    for (const day of weekDates) {
      const dayMeals = getMealsByDate(day.date);
      if (dayMeals.length > 0) set.add(day.date);
    }
    return set;
  }, [getMealsByDate]);

  const doScan = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (router as any).push("/scan-meal");
  }, [router]);

  return (
    <ScreenContainer containerClassName="bg-transparent">
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[BG, "#050505", BG]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={s.hdr}>
          <TouchableOpacity
            onPress={() => (router as any).push("/profile")}
            style={s.hdrAvatar}
            activeOpacity={0.7}
          >
            {profile.profilePhotoUri ? (
              <Image source={{ uri: profile.profilePhotoUri }} style={s.hdrAvatarImg} />
            ) : (
              <LinearGradient
                colors={[GREEN_DIM, "#1A8A0A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.hdrAvatarFallback}
              >
                <Text style={s.hdrAvatarText}>
                  {(profile.name || "M").charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          <View style={s.hdrTitleRow}>
            <Text style={s.hdrTitle}>MUSCLE AI</Text>
            <Image
              source={require("@/assets/images/logo-cropped.png")}
              style={s.hdrLogo}
              contentFit="contain"
            />
          </View>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={s.hdrGear}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={20} color={T3} />
          </TouchableOpacity>
        </View>

        {/* ═══ WEEKLY CALENDAR STRIP ═══ */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} datesWithMeals={datesWithMeals} />

        {/* ═══ ANABOLIC SCORE RING — Hero Element ═══ */}
        <View style={s.scoreWrap}>
          {/* Multi-layer green glow */}
          <View style={s.scoreGlow1} />
          <View style={s.scoreGlow2} />
          <View style={s.scoreGlow3} />

          <Svg width={SCORE_RING_SIZE} height={SCORE_RING_SIZE}>
            <Defs>
              <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={GREEN} />
                <Stop offset="0.5" stopColor="#2BCC10" />
                <Stop offset="1" stopColor="#1A8A0A" />
              </SvgGradient>
            </Defs>
            {/* Track */}
            <Circle
              cx={SCORE_RING_SIZE / 2}
              cy={SCORE_RING_SIZE / 2}
              r={SCORE_R}
              stroke="#1A1A1A"
              strokeWidth={SCORE_STROKE}
              fill="transparent"
            />
            {/* Progress arc */}
            <Circle
              cx={SCORE_RING_SIZE / 2}
              cy={SCORE_RING_SIZE / 2}
              r={SCORE_R}
              stroke="url(#scoreGrad)"
              strokeWidth={SCORE_STROKE}
              fill="transparent"
              strokeDasharray={SCORE_C}
              strokeDashoffset={scoreDashOff}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SCORE_RING_SIZE / 2}, ${SCORE_RING_SIZE / 2}`}
            />
          </Svg>

          {/* Center content */}
          <View style={s.scoreCenter}>
            <Text style={[s.scoreNum, { color: scoreColor(anabolicScore) }]}>
              {anabolicScore}
            </Text>
            <Text style={s.scoreLabel}>ANABOLIC SCORE</Text>
            <View style={[s.scoreBadge, { backgroundColor: scoreColor(anabolicScore) + "20", borderColor: scoreColor(anabolicScore) + "40" }]}>
              <Text style={[s.scoreBadgeText, { color: scoreColor(anabolicScore) }]}>
                {scoreLabel(anabolicScore)}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ MACRO CARDS — Premium rounded with shadows ═══ */}
        <View style={s.macRow}>
          {[
            { val: mac.protein, unit: "g", label: "PROTEIN", color: PROT_COLOR, icon: "flame.fill" as const },
            { val: mac.carbs, unit: "g", label: "CARBS", color: CARB_COLOR, icon: "bolt.fill" as const },
            { val: mac.fat, unit: "g", label: "FAT", color: FAT_COLOR, icon: "leaf.fill" as const },
            { val: mac.sugar, unit: "g", label: "SUGAR", color: SUGAR_COLOR, icon: "exclamationmark.triangle" as const },
          ].map((m) => {
            const str = String(m.val);
            const fs = str.length > 4 ? 18 : str.length > 3 ? 22 : 26;
            const us = str.length > 4 ? 10 : str.length > 3 ? 12 : 13;
            return (
              <View key={m.label} style={s.macCard}>
                <View style={[s.macIconDot, { backgroundColor: m.color + "18" }]}>
                  <IconSymbol name={m.icon} size={12} color={m.color} />
                </View>
                <Text style={[s.macVal, { fontSize: fs }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {m.val}
                  <Text style={[s.macUnit, { fontSize: us }]}>{m.unit}</Text>
                </Text>
                <Text style={[s.macLbl, { color: m.color }]}>{m.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ═══ CALORIE TRACKER CARD ═══ */}
        <View style={s.calCard}>
          <View style={s.calCardInner}>
            <View style={s.calRingWrap}>
              <Svg width={CAL_RING_SIZE} height={CAL_RING_SIZE}>
                <Defs>
                  <SvgGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={GREEN} />
                    <Stop offset="1" stopColor={GREEN_DIM} />
                  </SvgGradient>
                </Defs>
                <Circle
                  cx={CAL_RING_SIZE / 2}
                  cy={CAL_RING_SIZE / 2}
                  r={CAL_R}
                  stroke="#1A1A1A"
                  strokeWidth={CAL_STROKE}
                  fill="transparent"
                />
                <Circle
                  cx={CAL_RING_SIZE / 2}
                  cy={CAL_RING_SIZE / 2}
                  r={CAL_R}
                  stroke="url(#calGrad)"
                  strokeWidth={CAL_STROKE}
                  fill="transparent"
                  strokeDasharray={CAL_C}
                  strokeDashoffset={calDashOff}
                  strokeLinecap="round"
                  rotation="-225"
                  origin={`${CAL_RING_SIZE / 2}, ${CAL_RING_SIZE / 2}`}
                />
              </Svg>
              <View style={s.calRingCenter}>
                <Text style={s.calRingNum}>{rem.toLocaleString()}</Text>
                <Text style={s.calRingLabel}>remaining</Text>
              </View>
            </View>
            <View style={s.calStats}>
              <View style={s.calStatRow}>
                <View style={[s.calDot, { backgroundColor: GREEN }]} />
                <Text style={s.calStatLabel}>Eaten</Text>
                <Text style={s.calStatVal}>{cal.toLocaleString()}</Text>
              </View>
              <View style={s.calDivider} />
              <View style={s.calStatRow}>
                <View style={[s.calDot, { backgroundColor: T3 }]} />
                <Text style={s.calStatLabel}>Goal</Text>
                <Text style={s.calStatVal}>{profile.calorieGoal.toLocaleString()}</Text>
              </View>
              <View style={s.calDivider} />
              <View style={s.calStatRow}>
                <View style={[s.calDot, { backgroundColor: "#FFB800" }]} />
                <Text style={s.calStatLabel}>Remaining</Text>
                <Text style={[s.calStatVal, { color: GREEN }]}>{rem.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={s.qRow}>
          <TouchableOpacity style={s.qBtn} onPress={doScan} activeOpacity={0.7}>
            <LinearGradient
              colors={[GREEN, GREEN_DIM]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.qBtnGrad}
            >
              <IconSymbol name="camera.fill" size={16} color={BG} />
              <Text style={s.qTxtPrimary}>Scan Meal</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.qBtnSecondary}
            onPress={() => router.push("/(tabs)/meals")}
            activeOpacity={0.7}
          >
            <IconSymbol name="fork.knife" size={15} color={GREEN} />
            <Text style={s.qTxt}>Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.qBtnSecondary}
            onPress={() => router.push("/(tabs)/forecast")}
            activeOpacity={0.7}
          >
            <IconSymbol name="chart.line.uptrend.xyaxis" size={15} color={GREEN} />
            <Text style={s.qTxt}>Forecast</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ STREAK TRACKER ═══ */}
        {(() => {
          const streakInfo = calculateStreak(getMealDates(allMeals));
          if (streakInfo.currentStreak === 0 && streakInfo.longestStreak === 0) return null;
          return (
            <View style={s.streakCard}>
              <View style={s.streakTop}>
                <View style={s.streakCountWrap}>
                  <Text style={s.streakFire}>🔥</Text>
                  <Text style={s.streakCount}>{streakInfo.currentStreak}</Text>
                  <Text style={s.streakLabel}>DAY STREAK</Text>
                </View>
                {streakInfo.longestStreak > streakInfo.currentStreak && (
                  <Text style={s.streakBest}>Best: {streakInfo.longestStreak} days</Text>
                )}
              </View>
              <View style={s.badgeRow}>
                {streakInfo.badges.map((badge) => (
                  <View
                    key={badge.days}
                    style={[s.badge, badge.earned && s.badgeEarned]}
                  >
                    <Text style={s.badgeIcon}>{badge.icon}</Text>
                    <Text style={[s.badgeDays, badge.earned && s.badgeDaysEarned]}>{badge.days}d</Text>
                    <Text style={[s.badgeLabel2, badge.earned && s.badgeLabelEarned]}>{badge.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* ═══ PROTEIN PRIORITY ═══ */}
        <View style={s.ppCard}>
          <View style={s.ppHdrRow}>
            <Text style={s.ppHdr}>PROTEIN PRIORITY</Text>
            {last && (
              <View style={[s.ppScorePill, { backgroundColor: scoreColor(last.anabolicScore) + "20", borderColor: scoreColor(last.anabolicScore) + "40" }]}>
                <Text style={[s.ppScoreText, { color: scoreColor(last.anabolicScore) }]}>{last.anabolicScore}</Text>
              </View>
            )}
          </View>
          {last ? (
            <View style={s.ppBody}>
              <View style={s.ppLeft}>
                <Text style={s.ppName} numberOfLines={1}>{last.name}</Text>
                <Text style={s.ppDetail}>{last.calories} cal · {last.protein}g protein</Text>
              </View>
            </View>
          ) : (
            <View style={s.ppEmpty}>
              <IconSymbol name="camera.fill" size={28} color={T3} />
              <Text style={s.ppEmptyTxt}>Scan your first meal to see your Anabolic Score</Text>
            </View>
          )}
        </View>

        {/* ═══ FAST FOOD PRO ═══ */}
        <TouchableOpacity
          style={s.supCard}
          onPress={() => (router as any).push("/fast-food-pro")}
          activeOpacity={0.7}
        >
          <View style={s.supIconWrap}>
            <IconSymbol name="storefront.fill" size={20} color={GREEN} />
          </View>
          <View style={s.supInfo}>
            <Text style={s.supTitle}>Fast Food Pro</Text>
            <Text style={s.supSub}>Highest protein at every chain</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={T3} />
        </TouchableOpacity>

        {/* ═══ MUSCLE SUPPORT ═══ */}
        <TouchableOpacity
          style={s.supCard}
          onPress={() => (router as any).push("/support")}
          activeOpacity={0.7}
        >
          <View style={s.supIconWrap}>
            <IconSymbol name="bubble.left.fill" size={20} color={GREEN} />
          </View>
          <View style={s.supInfo}>
            <Text style={s.supTitle}>Muscle Support</Text>
            <Text style={s.supSub}>AI-powered help, 24/7</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={T3} />
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ═══ FLOATING CAMERA FAB ═══ */}
      <TouchableOpacity style={s.fab} onPress={doScan} activeOpacity={0.8}>
        <View style={s.fabGlow} />
        <LinearGradient
          colors={[GREEN, GREEN_DIM]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.fabInner}
        >
          <IconSymbol name="camera.fill" size={26} color={BG} />
        </LinearGradient>
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
  hdrTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hdrLogo: {
    width: 40,
    height: 27,
  },
  hdrTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: T1,
  },
  hdrAvatar: { padding: 2 },
  hdrAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: GREEN,
  },
  hdrAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  hdrAvatarText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  hdrGear: { padding: 8 },

  /* Anabolic Score Ring */
  scoreWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
    width: SCORE_RING_SIZE + 60,
    height: SCORE_RING_SIZE + 60,
  },
  scoreGlow1: {
    position: "absolute",
    width: SCORE_RING_SIZE + 50,
    height: SCORE_RING_SIZE + 50,
    borderRadius: (SCORE_RING_SIZE + 50) / 2,
    backgroundColor: GREEN_GLOW,
  },
  scoreGlow2: {
    position: "absolute",
    width: SCORE_RING_SIZE + 30,
    height: SCORE_RING_SIZE + 30,
    borderRadius: (SCORE_RING_SIZE + 30) / 2,
    backgroundColor: "transparent",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 0,
  },
  scoreGlow3: {
    position: "absolute",
    width: SCORE_RING_SIZE + 10,
    height: SCORE_RING_SIZE + 10,
    borderRadius: (SCORE_RING_SIZE + 10) / 2,
    backgroundColor: "transparent",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 0,
  },
  scoreCenter: {
    position: "absolute",
    alignItems: "center",
  },
  scoreNum: {
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: T2,
    letterSpacing: 2,
    marginTop: 2,
  },
  scoreBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  /* Macro Cards */
  macRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  macCard: {
    flex: 1,
    backgroundColor: SURF,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BDR,
    gap: 4,
    // Shadow for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  macIconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  macVal: {
    fontSize: 26,
    fontWeight: "700",
    color: T1,
  },
  macUnit: {
    fontSize: 13,
    fontWeight: "400",
    color: T2,
  },
  macLbl: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
  },

  /* Calorie Tracker Card */
  calCard: {
    backgroundColor: SURF,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BDR,
    padding: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  calRingWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: CAL_RING_SIZE,
    height: CAL_RING_SIZE,
  },
  calRingCenter: {
    position: "absolute",
    alignItems: "center",
  },
  calRingNum: {
    fontSize: 24,
    fontWeight: "700",
    color: T1,
    letterSpacing: -1,
  },
  calRingLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: T2,
    marginTop: 1,
  },
  calStats: {
    flex: 1,
    gap: 10,
  },
  calStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calStatLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: T2,
  },
  calStatVal: {
    fontSize: 16,
    fontWeight: "700",
    color: T1,
  },
  calDivider: {
    height: 1,
    backgroundColor: BDR,
  },

  /* Quick Actions */
  qRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  qBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: "hidden",
  },
  qBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  qTxtPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: BG,
  },
  qBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_SUBTLE,
  },
  qTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: T1,
  },

  /* Protein Priority */
  ppCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  ppHdrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  ppHdr: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2.5,
    color: GREEN,
  },
  ppScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  ppScoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  ppBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ppLeft: { flex: 1, gap: 4 },
  ppName: { fontSize: 17, fontWeight: "600", color: T1 },
  ppDetail: { fontSize: 14, color: T2 },
  ppEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  ppEmptyTxt: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: T3,
  },

  /* Support / Feature Cards */
  supCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    gap: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  supIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GREEN_SUBTLE,
    alignItems: "center",
    justifyContent: "center",
  },
  supInfo: { flex: 1 },
  supTitle: { fontSize: 16, fontWeight: "600", color: T1 },
  supSub: { fontSize: 13, marginTop: 2, color: T2 },

  /* Streak Card */
  streakCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BDR,
    backgroundColor: SURF,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  streakTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  streakCountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakFire: {
    fontSize: 22,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: "700",
    color: GREEN,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: T2,
    marginLeft: 2,
  },
  streakBest: {
    fontSize: 12,
    color: T3,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#1A1A1A",
    opacity: 0.4,
  },
  badgeEarned: {
    opacity: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_SUBTLE,
  },
  badgeIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  badgeDays: {
    fontSize: 14,
    fontWeight: "700",
    color: T3,
  },
  badgeDaysEarned: {
    color: GREEN,
  },
  badgeLabel2: {
    fontSize: 9,
    fontWeight: "500",
    color: T3,
    marginTop: 2,
    textAlign: "center",
  },
  badgeLabelEarned: {
    color: T2,
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
  fabGlow: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GREEN_GLOW,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
});
