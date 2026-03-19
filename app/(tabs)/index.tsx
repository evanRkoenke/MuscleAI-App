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
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = SCREEN_WIDTH * 0.55;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
          <Text style={[styles.headerTitle, { color: colors.primary }]}>MUSCLE AI</Text>
          <TouchableOpacity
            onPress={() => (router as any).push("/settings")}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="gearshape.fill" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.border}
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Progress ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.primary}
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
            <Text style={[styles.calorieNumber, { color: colors.foreground }]}>
              {caloriesRemaining.toLocaleString()}
            </Text>
            <Text style={[styles.calorieLabel, { color: colors.muted }]}>Calories Remaining</Text>
          </View>
        </View>

        {/* Macro Row */}
        <View style={styles.macroRow}>
          <MacroCard
            label="PROTEIN"
            value={todayMacros.protein}
            goal={profile.proteinGoal}
            unit="g"
            color={colors.primary}
            bgColor={colors.surface}
            textColor={colors.foreground}
            mutedColor={colors.muted}
          />
          <MacroCard
            label="CARBS"
            value={todayMacros.carbs}
            goal={profile.carbsGoal}
            unit="g"
            color="#8B5CF6"
            bgColor={colors.surface}
            textColor={colors.foreground}
            mutedColor={colors.muted}
          />
          <MacroCard
            label="FAT"
            value={todayMacros.fat}
            goal={profile.fatGoal}
            unit="g"
            color="#F59E0B"
            bgColor={colors.surface}
            textColor={colors.foreground}
            mutedColor={colors.muted}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="camera.fill"
            label="Scan"
            onPress={handleScan}
            color={colors.primary}
            bgColor={colors.surface}
            textColor={colors.foreground}
            borderColor={colors.border}
          />
          <QuickActionButton
            icon="fork.knife"
            label="Meals"
            onPress={() => router.push("/(tabs)/meals")}
            color={colors.primary}
            bgColor={colors.surface}
            textColor={colors.foreground}
            borderColor={colors.border}
          />
          <QuickActionButton
            icon="chart.line.uptrend.xyaxis"
            label="Forecast"
            onPress={() => router.push("/(tabs)/forecast")}
            color={colors.primary}
            bgColor={colors.surface}
            textColor={colors.foreground}
            borderColor={colors.border}
          />
        </View>

        {/* Protein Priority Card */}
        <View style={[styles.priorityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.priorityTitle, { color: colors.foreground }]}>PROTEIN PRIORITY</Text>
          {lastMeal ? (
            <View style={styles.priorityContent}>
              <View style={styles.priorityInfo}>
                <Text style={[styles.priorityMealName, { color: colors.foreground }]}>
                  {lastMeal.name}
                </Text>
                <Text style={[styles.priorityMealMacros, { color: colors.muted }]}>
                  {lastMeal.calories} cal · {lastMeal.protein}g protein
                </Text>
              </View>
              <View style={[styles.anabolicBadge, { backgroundColor: getScoreColor(lastMeal.anabolicScore) + "20" }]}>
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
              <IconSymbol name="camera.fill" size={32} color={colors.muted} />
              <Text style={[styles.priorityEmptyText, { color: colors.muted }]}>
                Scan your first meal to see your Anabolic Score
              </Text>
            </View>
          )}
        </View>

        {/* AI Support Quick Access */}
        <TouchableOpacity
          style={[styles.supportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => (router as any).push("/support")}
          activeOpacity={0.7}
        >
          <IconSymbol name="bubble.left.fill" size={24} color={colors.primary} />
          <View style={styles.supportInfo}>
            <Text style={[styles.supportTitle, { color: colors.foreground }]}>Muscle Support</Text>
            <Text style={[styles.supportSubtitle, { color: colors.muted }]}>
              AI-powered help, 24/7
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Scan Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleScan}
        activeOpacity={0.8}
      >
        <IconSymbol name="camera.fill" size={28} color="#FFFFFF" />
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
  bgColor,
  textColor,
  mutedColor,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  bgColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[styles.macroCard, { backgroundColor: bgColor }]}>
      <Text style={[styles.macroValue, { color: textColor }]}>
        {value}
        <Text style={[styles.macroUnit, { color: mutedColor }]}>{unit}</Text>
      </Text>
      <View style={[styles.macroBar, { backgroundColor: color + "20" }]}>
        <View
          style={[
            styles.macroBarFill,
            { backgroundColor: color, width: `${Math.min(100, (value / goal) * 100)}%` },
          ]}
        />
      </View>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
  color,
  bgColor,
  textColor,
  borderColor,
}: {
  icon: "camera.fill" | "fork.knife" | "chart.line.uptrend.xyaxis";
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: bgColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol name={icon} size={20} color={color} />
      <Text style={[styles.quickActionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
  },
  settingsButton: {
    padding: 8,
  },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  calorieNumber: {
    fontSize: 42,
    fontWeight: "900",
  },
  calorieLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  macroRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  macroValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: "500",
  },
  macroBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
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
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 14,
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
  },
  priorityMealMacros: {
    fontSize: 14,
  },
  anabolicBadge: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  anabolicScore: {
    fontSize: 24,
    fontWeight: "900",
  },
  anabolicLabel: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  priorityEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  priorityEmptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 16,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  supportSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00B4FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
