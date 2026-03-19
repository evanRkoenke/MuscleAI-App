import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
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
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Ring dimensions (matches reference: large, thick, prominent) ───
const RING_SIZE = Math.min(SCREEN_WIDTH * 0.58, 240);
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Brand palette (exact from reference) ───
const ELECTRIC_BLUE = "#007AFF";
const DEEP_BLUE = "#003A80";
const CYAN_GLOW = "#00D4FF";
const PROTEIN_CYAN = "#00E5FF";
const CARBS_AMBER = "#FFB300";
const FAT_RED = "#FF3D3D";
const DARK_BG = "#0A0E14";
const SURFACE = "#111820";
const BORDER = "#1A2533";
const TEXT_PRIMARY = "#ECEDEE";
const TEXT_SECONDARY = "#7A8A99";
const TEXT_TERTIARY = "#3A4A5C";

function getScoreColor(score: number): string {
  if (score >= 80) return "#00E676";
  if (score >= 60) return "#FFB300";
  return "#FF3D3D";
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, getTodayCalories, getTodayMacros, getTodayMeals } = useApp();

  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();
  const caloriesRemaining = Math.max(0, profile.calorieGoal - todayCalories);
  const progress = Math.min(1, todayCalories / profile.calorieGoal);
  // Ring starts from top (12 o'clock), sweeps clockwise ~270 degrees max
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const todayMeals = getTodayMeals();
  const lastMeal = todayMeals.length > 0 ? todayMeals[todayMeals.length - 1] : null;

  const handleScan = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    (router as any).push("/scan-meal");
  }, [router]);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER: avatar + "MUSCLE AI" + gear ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => (router as any).push("/profile")}
              style={styles.avatarBtn}
              activeOpacity={0.7}
            >
              {profile.profilePhotoUri ? (
                <Image
                  source={{ uri: profile.profilePhotoUri }}
                  style={styles.headerAvatar}
                />
              ) : (
                <LinearGradient
                  colors={[ELECTRIC_BLUE, CYAN_GLOW]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerAvatarGrad}
                >
                  <Text style={styles.headerAvatarInitial}>
                    {profile.name ? profile.name[0].toUpperCase() : "M"}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MUSCLE AI</Text>
          </View>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={styles.settingsBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={22} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* ─── CERAMIC CALORIE RING ─── */}
        <View style={styles.ringOuter}>
          {/* Outer glow aura */}
          <View style={styles.ringGlowAura} />
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="ceramicGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={DEEP_BLUE} stopOpacity="1" />
                <Stop offset="0.45" stopColor={ELECTRIC_BLUE} stopOpacity="1" />
                <Stop offset="1" stopColor={CYAN_GLOW} stopOpacity="1" />
              </SvgGradient>
            </Defs>
            {/* Track ring (dark background) */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={BORDER}
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Progress arc with gradient */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#ceramicGrad)"
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          {/* Center text */}
          <View style={styles.ringCenterText}>
            <Text style={styles.calorieNumber}>
              {caloriesRemaining.toLocaleString()}
            </Text>
            <Text style={styles.calorieLabel}>Calories Remaining</Text>
          </View>
        </View>

        {/* ─── MACRO ROW: 3 cards ─── */}
        <View style={styles.macroRow}>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {todayMacros.protein}
              <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={[styles.macroLabel, { color: PROTEIN_CYAN }]}>PROTEIN</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {todayMacros.carbs}
              <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={[styles.macroLabel, { color: CARBS_AMBER }]}>CARBS</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {todayMacros.fat}
              <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={[styles.macroLabel, { color: FAT_RED }]}>FAT</Text>
          </View>
        </View>

        {/* ─── QUICK ACTIONS: Scan / Meals / Forecast ─── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={handleScan}
            activeOpacity={0.7}
          >
            <IconSymbol name="camera.fill" size={16} color={ELECTRIC_BLUE} />
            <Text style={styles.quickLabel}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/meals")}
            activeOpacity={0.7}
          >
            <IconSymbol name="fork.knife" size={16} color={ELECTRIC_BLUE} />
            <Text style={styles.quickLabel}>Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/forecast")}
            activeOpacity={0.7}
          >
            <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={ELECTRIC_BLUE} />
            <Text style={styles.quickLabel}>Forecast</Text>
          </TouchableOpacity>
        </View>

        {/* ─── PROTEIN PRIORITY CARD ─── */}
        <View style={styles.priorityCard}>
          <Text style={styles.priorityHeader}>PROTEIN PRIORITY</Text>
          {lastMeal ? (
            <View style={styles.priorityBody}>
              {/* Left: meal info */}
              <View style={styles.priorityLeft}>
                <Text style={styles.priorityMealName} numberOfLines={1}>
                  {lastMeal.name}
                </Text>
                <Text style={styles.priorityMealDetail}>
                  {lastMeal.calories} cal · {lastMeal.protein}g protein
                </Text>
              </View>
              {/* Right: anabolic score badge */}
              <View
                style={[
                  styles.anabolicBadge,
                  { backgroundColor: getScoreColor(lastMeal.anabolicScore) + "15" },
                ]}
              >
                <Text
                  style={[
                    styles.anabolicNumber,
                    { color: getScoreColor(lastMeal.anabolicScore) },
                  ]}
                >
                  {lastMeal.anabolicScore}
                </Text>
                <Text
                  style={[
                    styles.anabolicText,
                    { color: getScoreColor(lastMeal.anabolicScore) },
                  ]}
                >
                  ANABOLIC{"\n"}SCORE
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.priorityEmpty}>
              <IconSymbol name="camera.fill" size={32} color={TEXT_TERTIARY} />
              <Text style={styles.priorityEmptyText}>
                Scan your first meal to see your Anabolic Score
              </Text>
            </View>
          )}
        </View>

        {/* ─── MUSCLE SUPPORT CARD ─── */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => (router as any).push("/support")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["rgba(0,122,255,0.10)", "rgba(0,212,255,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <IconSymbol name="bubble.left.fill" size={24} color={ELECTRIC_BLUE} />
          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>Muscle Support</Text>
            <Text style={styles.supportSub}>AI-powered help, 24/7</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={TEXT_TERTIARY} />
        </TouchableOpacity>

        {/* Bottom spacer for FAB */}
        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ─── FLOATING CAMERA BUTTON ─── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleScan}
        activeOpacity={0.8}
      >
        <View style={styles.fabGlow} />
        <LinearGradient
          colors={[ELECTRIC_BLUE, CYAN_GLOW]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <IconSymbol name="camera.fill" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: ELECTRIC_BLUE,
  },
  headerAvatarGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarInitial: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
    color: ELECTRIC_BLUE,
    fontStyle: "italic",
  },
  settingsBtn: {
    padding: 8,
  },

  /* ── Ceramic Calorie Ring ── */
  ringOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    alignSelf: "center",
  },
  ringGlowAura: {
    position: "absolute",
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    backgroundColor: "transparent",
    // iOS shadow creates the glow aura
    shadowColor: ELECTRIC_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
    elevation: 0,
  },
  ringCenterText: {
    position: "absolute",
    alignItems: "center",
  },
  calorieNumber: {
    fontSize: 46,
    fontWeight: "900",
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    marginTop: 2,
  },

  /* ── Macro Row ── */
  macroRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  macroCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  macroValue: {
    fontSize: 26,
    fontWeight: "900",
    color: TEXT_PRIMARY,
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_SECONDARY,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  /* ── Quick Actions ── */
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },

  /* ── Protein Priority ── */
  priorityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 12,
  },
  priorityHeader: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },
  priorityBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityLeft: {
    flex: 1,
    gap: 4,
  },
  priorityMealName: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  priorityMealDetail: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  anabolicBadge: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  anabolicNumber: {
    fontSize: 28,
    fontWeight: "900",
  },
  anabolicText: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 9,
    marginTop: 2,
  },
  priorityEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  priorityEmptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: TEXT_TERTIARY,
  },

  /* ── Muscle Support ── */
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  supportSub: {
    fontSize: 13,
    marginTop: 2,
    color: TEXT_SECONDARY,
  },

  /* ── Floating Camera Button ── */
  fab: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  fabGlow: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ELECTRIC_BLUE,
    opacity: 0.2,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ELECTRIC_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
});
