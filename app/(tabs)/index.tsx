import { useCallback } from "react";
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
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = SCREEN_WIDTH * 0.52;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Brand colors
const ELECTRIC_BLUE = "#007AFF";
const CYAN_GLOW = "#00D4FF";
const PROTEIN_CYAN = "#00E5FF";
const CARBS_AMBER = "#FFB300";
const FAT_RED = "#FF6B6B";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile, getTodayCalories, getTodayMacros, getTodayMeals } = useApp();

  const todayCalories = getTodayCalories();
  const todayMacros = getTodayMacros();
  const caloriesRemaining = Math.max(0, profile.calorieGoal - todayCalories);
  const progress = Math.min(1, todayCalories / profile.calorieGoal);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MUSCLE AI</Text>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring with Glow */}
        <View style={styles.ringContainer}>
          {/* Outer glow layer */}
          <View style={styles.ringGlow} />
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#003A80" stopOpacity="1" />
                <Stop offset="0.5" stopColor={ELECTRIC_BLUE} stopOpacity="1" />
                <Stop offset="1" stopColor={CYAN_GLOW} stopOpacity="1" />
              </SvgGradient>
            </Defs>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#1A2533"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Progress ring with gradient */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#ringGrad)"
              strokeWidth={RING_STROKE}
              fill="transparent"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.calorieNumber}>
              {caloriesRemaining.toLocaleString()}
            </Text>
            <Text style={styles.calorieLabel}>Calories Remaining</Text>
          </View>
        </View>

        {/* Macro Row */}
        <View style={styles.macroRow}>
          <MacroCard
            label="PROTEIN"
            value={todayMacros.protein}
            goal={profile.proteinGoal}
            unit="g"
            color={PROTEIN_CYAN}
          />
          <MacroCard
            label="CARBS"
            value={todayMacros.carbs}
            goal={profile.carbsGoal}
            unit="g"
            color={CARBS_AMBER}
          />
          <MacroCard
            label="FAT"
            value={todayMacros.fat}
            goal={profile.fatGoal}
            unit="g"
            color={FAT_RED}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleScan}
            activeOpacity={0.7}
          >
            <IconSymbol name="camera.fill" size={18} color={ELECTRIC_BLUE} />
            <Text style={styles.quickActionLabel}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(tabs)/meals")}
            activeOpacity={0.7}
          >
            <IconSymbol name="fork.knife" size={18} color={ELECTRIC_BLUE} />
            <Text style={styles.quickActionLabel}>Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(tabs)/forecast")}
            activeOpacity={0.7}
          >
            <IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={ELECTRIC_BLUE} />
            <Text style={styles.quickActionLabel}>Forecast</Text>
          </TouchableOpacity>
        </View>

        {/* Protein Priority Card */}
        <View style={styles.priorityCard}>
          <Text style={styles.priorityTitle}>PROTEIN PRIORITY</Text>
          {lastMeal ? (
            <View style={styles.priorityContent}>
              <View style={styles.priorityInfo}>
                <Text style={styles.priorityMealName}>
                  {lastMeal.name}
                </Text>
                <Text style={styles.priorityMealMacros}>
                  {lastMeal.calories} cal · {lastMeal.protein}g protein
                </Text>
              </View>
              <View style={[styles.anabolicBadge, { backgroundColor: getScoreColor(lastMeal.anabolicScore) + "18" }]}>
                <Text style={[styles.anabolicScore, { color: getScoreColor(lastMeal.anabolicScore) }]}>
                  {lastMeal.anabolicScore}
                </Text>
                <Text style={[styles.anabolicLabel, { color: getScoreColor(lastMeal.anabolicScore) }]}>
                  ANABOLIC
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.priorityEmpty}>
              <IconSymbol name="camera.fill" size={32} color="#3A4A5C" />
              <Text style={styles.priorityEmptyText}>
                Scan your first meal to see your Anabolic Score
              </Text>
            </View>
          )}
        </View>

        {/* AI Support Quick Access */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => (router as any).push("/support")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["rgba(0,122,255,0.12)", "rgba(0,212,255,0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <IconSymbol name="bubble.left.fill" size={24} color={ELECTRIC_BLUE} />
          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>Muscle Support</Text>
            <Text style={styles.supportSubtitle}>AI-powered help, 24/7</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#3A4A5C" />
        </TouchableOpacity>

        {/* Bottom spacer for floating button */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Scan Button with Glow */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleScan}
        activeOpacity={0.8}
      >
        <View style={styles.floatingGlow} />
        <LinearGradient
          colors={[ELECTRIC_BLUE, CYAN_GLOW]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingGradient}
        >
          <IconSymbol name="camera.fill" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function MacroCard({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValue}>
        {value}
        <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <View style={styles.macroBar}>
        <View
          style={[
            styles.macroBarFill,
            { backgroundColor: color, width: `${pct}%` },
          ]}
        />
      </View>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00E676";
  if (score >= 60) return "#FFB300";
  return "#FF3D3D";
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
    color: ELECTRIC_BLUE,
    fontStyle: "italic",
  },
  settingsButton: {
    padding: 8,
  },
  // Ring
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  ringGlow: {
    position: "absolute",
    width: RING_SIZE + 30,
    height: RING_SIZE + 30,
    borderRadius: (RING_SIZE + 30) / 2,
    backgroundColor: "transparent",
    shadowColor: ELECTRIC_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 0,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  calorieNumber: {
    fontSize: 44,
    fontWeight: "900",
    color: "#ECEDEE",
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A8A99",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  // Macros
  macroRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#111820",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1A2533",
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ECEDEE",
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7A8A99",
  },
  macroBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1A2533",
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ECEDEE",
  },
  // Protein Priority
  priorityCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    marginBottom: 14,
  },
  priorityTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 14,
    color: "#ECEDEE",
  },
  priorityContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityInfo: {
    flex: 1,
    gap: 4,
  },
  priorityMealName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ECEDEE",
  },
  priorityMealMacros: {
    fontSize: 14,
    color: "#7A8A99",
  },
  anabolicBadge: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  anabolicScore: {
    fontSize: 26,
    fontWeight: "900",
  },
  anabolicLabel: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 1,
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
    color: "#5A6A7A",
  },
  // Support
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2533",
    backgroundColor: "#111820",
    gap: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ECEDEE",
  },
  supportSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: "#7A8A99",
  },
  // Floating button
  floatingButton: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ELECTRIC_BLUE,
    opacity: 0.25,
  },
  floatingGradient: {
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
