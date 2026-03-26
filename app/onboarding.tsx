import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import type { FitnessGoal, DietaryRestriction, OnboardingData } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");
const TOTAL_STEPS = 5;

const GOALS: { key: FitnessGoal; label: string; icon: string; desc: string }[] = [
  { key: "build_muscle", label: "Build Muscle", icon: "💪", desc: "Gain size and strength with a caloric surplus" },
  { key: "lean_bulk", label: "Lean Bulk", icon: "🔥", desc: "Add muscle with minimal fat gain" },
  { key: "maintenance", label: "Maintenance", icon: "⚖️", desc: "Maintain current weight and body composition" },
];

const RESTRICTIONS: { key: DietaryRestriction; label: string }[] = [
  { key: "none", label: "No Restrictions" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten-Free" },
  { key: "dairy_free", label: "Dairy-Free" },
  { key: "keto", label: "Keto" },
  { key: "halal", label: "Halal" },
];

const TRAINING_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1: Height & Weight
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [weight, setWeight] = useState("175");
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");

  // Step 2: Goal
  const [goal, setGoal] = useState<FitnessGoal>("build_muscle");

  // Step 3: Training
  const [trainingDays, setTrainingDays] = useState(4);

  // Step 4: Dietary restrictions
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(["none"]);

  // Step 5: Target weight
  const [targetWeight, setTargetWeight] = useState("180");

  const haptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const animateTransition = useCallback((nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    haptic();
    if (step < TOTAL_STEPS) {
      animateTransition(step + 1);
    } else {
      handleComplete();
    }
  }, [step, haptic, animateTransition]);

  const handleBack = useCallback(() => {
    haptic();
    if (step > 1) {
      animateTransition(step - 1);
    }
  }, [step, haptic, animateTransition]);

  const handleSkip = useCallback(() => {
    haptic();
    if (step < TOTAL_STEPS) {
      animateTransition(step + 1);
    } else {
      handleComplete();
    }
  }, [step, haptic, animateTransition]);

  const handleComplete = useCallback(async () => {
    const data: OnboardingData = {
      heightFt: parseInt(heightFt) || 5,
      heightIn: parseInt(heightIn) || 10,
      weight: parseFloat(weight) || 175,
      goal,
      trainingDays,
      dietaryRestrictions: restrictions,
      targetWeight: parseFloat(targetWeight) || 180,
      unit,
    };
    await completeOnboarding(data);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.replace("/auth");
  }, [heightFt, heightIn, weight, goal, trainingDays, restrictions, targetWeight, unit, completeOnboarding, router]);

  const toggleRestriction = useCallback((key: DietaryRestriction) => {
    haptic();
    setRestrictions((prev) => {
      if (key === "none") return ["none"];
      const without = prev.filter((r) => r !== "none");
      if (without.includes(key)) {
        const result = without.filter((r) => r !== key);
        return result.length === 0 ? ["none"] : result;
      }
      return [...without, key];
    });
  }, [haptic]);

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <IconSymbol name="scalemass.fill" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.stepTitle}>What's your current{"\n"}height and weight?</Text>
      <Text style={styles.stepSubtitle}>This helps us calculate your daily calorie needs</Text>

      {/* Unit toggle */}
      <View style={styles.unitToggle}>
        <TouchableOpacity
          style={[styles.unitButton, unit === "lbs" && styles.unitButtonActive]}
          onPress={() => { haptic(); setUnit("lbs"); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.unitText, unit === "lbs" && styles.unitTextActive]}>Imperial</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitButton, unit === "kg" && styles.unitButtonActive]}
          onPress={() => { haptic(); setUnit("kg"); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.unitText, unit === "kg" && styles.unitTextActive]}>Metric</Text>
        </TouchableOpacity>
      </View>

      {/* Height */}
      <Text style={styles.fieldLabel}>Height</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.numberInput}
            value={heightFt}
            onChangeText={setHeightFt}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#444444"
            maxLength={1}
          />
          <Text style={styles.inputUnit}>ft</Text>
        </View>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.numberInput}
            value={heightIn}
            onChangeText={setHeightIn}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor="#444444"
            maxLength={2}
          />
          <Text style={styles.inputUnit}>in</Text>
        </View>
      </View>

      {/* Weight */}
      <Text style={styles.fieldLabel}>Weight</Text>
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <TextInput
            style={[styles.numberInput, { flex: 1 }]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="175"
            placeholderTextColor="#444444"
            maxLength={4}
          />
          <Text style={styles.inputUnit}>{unit}</Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <IconSymbol name="flame.fill" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.stepTitle}>What's your{"\n"}primary goal?</Text>
      <Text style={styles.stepSubtitle}>We'll customize your calorie and macro targets</Text>

      <View style={styles.optionsList}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.goalCard, goal === g.key && styles.goalCardActive]}
            onPress={() => { haptic(); setGoal(g.key); }}
            activeOpacity={0.7}
          >
            <Text style={styles.goalIcon}>{g.icon}</Text>
            <View style={styles.goalTextWrap}>
              <Text style={[styles.goalLabel, goal === g.key && styles.goalLabelActive]}>{g.label}</Text>
              <Text style={styles.goalDesc}>{g.desc}</Text>
            </View>
            {goal === g.key && (
              <IconSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <IconSymbol name="bolt.fill" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.stepTitle}>How many times{"\n"}do you train per week?</Text>
      <Text style={styles.stepSubtitle}>This adjusts your activity multiplier for accurate goals</Text>

      <View style={styles.trainingGrid}>
        {TRAINING_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.trainingChip, trainingDays === d && styles.trainingChipActive]}
            onPress={() => { haptic(); setTrainingDays(d); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.trainingNumber, trainingDays === d && styles.trainingNumberActive]}>{d}</Text>
            <Text style={[styles.trainingLabel, trainingDays === d && styles.trainingLabelActive]}>
              {d === 1 ? "day" : "days"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <IconSymbol name="heart.fill" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.stepTitle}>Any dietary{"\n"}restrictions?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply to personalize meal suggestions</Text>

      <View style={styles.restrictionGrid}>
        {RESTRICTIONS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[
              styles.restrictionChip,
              restrictions.includes(r.key) && styles.restrictionChipActive,
            ]}
            onPress={() => toggleRestriction(r.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.restrictionLabel,
              restrictions.includes(r.key) && styles.restrictionLabelActive,
            ]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.stepTitle}>What's your target{"\n"}body weight?</Text>
      <Text style={styles.stepSubtitle}>We'll build your 12-month Anabolic Forecast around this</Text>

      <View style={styles.targetInputWrap}>
        <TextInput
          style={styles.targetInput}
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
          placeholder="180"
          placeholderTextColor="#444444"
          maxLength={4}
        />
        <Text style={styles.targetUnit}>{unit}</Text>
      </View>

      <View style={styles.targetHint}>
        <Text style={styles.targetHintText}>
          {parseFloat(targetWeight) > parseFloat(weight)
            ? `+${(parseFloat(targetWeight) - parseFloat(weight)).toFixed(0)} ${unit} to gain`
            : parseFloat(targetWeight) < parseFloat(weight)
            ? `${(parseFloat(targetWeight) - parseFloat(weight)).toFixed(0)} ${unit} to lose`
            : "Maintaining current weight"}
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Top bar: back + progress + skip */}
        <View style={styles.topBar}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.topButton} activeOpacity={0.7}>
              <IconSymbol name="arrow.left" size={22} color="#888888" />
            </TouchableOpacity>
          ) : (
            <View style={styles.topButton} />
          )}

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < step ? "#FFFFFF" : "#222222",
                    width: i === step - 1 ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.topButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step counter */}
        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>

        {/* Animated step content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderCurrentStep()}
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#444444", "#2A2A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>
                {step === TOTAL_STEPS ? "Complete Setup" : "Continue"}
              </Text>
              {step < TOTAL_STEPS && (
                <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topButton: { width: 50, alignItems: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressDot: { height: 6, borderRadius: 3 },
  skipText: { fontSize: 15, fontWeight: "500", color: "#666666" },

  // Step counter
  stepCounter: {
    fontSize: 12,
    fontWeight: "500",
    color: "#444444",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  // Scroll
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },

  // Step content
  stepContent: { alignItems: "center", paddingTop: 16, gap: 16 },
  stepIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F0F0F0",
    textAlign: "center",
    lineHeight: 36,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Unit toggle
  unitToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222222",
    overflow: "hidden",
    marginTop: 8,
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    backgroundColor: "#111111",
  },
  unitButtonActive: {
    backgroundColor: "#333333",
  },
  unitText: { fontSize: 14, fontWeight: "500", color: "#666666" },
  unitTextActive: { color: "#FFFFFF" },

  // Field labels
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 1,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginTop: 8,
  },

  // Input row
  inputRow: { flexDirection: "row", gap: 12, width: "100%" },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    gap: 8,
  },
  numberInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    color: "#F0F0F0",
    height: "100%",
  },
  inputUnit: { fontSize: 14, fontWeight: "500", color: "#666666" },

  // Goal cards
  optionsList: { width: "100%", gap: 10, marginTop: 8 },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    gap: 14,
  },
  goalCardActive: {
    borderColor: "#555555",
    backgroundColor: "#1A1A1A",
  },
  goalIcon: { fontSize: 28 },
  goalTextWrap: { flex: 1 },
  goalLabel: { fontSize: 17, fontWeight: "600", color: "#F0F0F0" },
  goalLabelActive: { color: "#FFFFFF" },
  goalDesc: { fontSize: 13, color: "#888888", marginTop: 2, lineHeight: 18 },

  // Training grid
  trainingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  trainingChip: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  trainingChipActive: {
    borderColor: "#555555",
    backgroundColor: "#1A1A1A",
  },
  trainingNumber: { fontSize: 24, fontWeight: "700", color: "#F0F0F0" },
  trainingNumberActive: { color: "#FFFFFF" },
  trainingLabel: { fontSize: 11, fontWeight: "500", color: "#666666" },
  trainingLabelActive: { color: "#FFFFFF" },

  // Restriction grid
  restrictionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  restrictionChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
  },
  restrictionChipActive: {
    borderColor: "#555555",
    backgroundColor: "#1A1A1A",
  },
  restrictionLabel: { fontSize: 14, fontWeight: "500", color: "#888888" },
  restrictionLabelActive: { color: "#FFFFFF" },

  // Target weight
  targetInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
    width: "100%",
    maxWidth: 240,
  },
  targetInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    color: "#F0F0F0",
    textAlign: "center",
    height: "100%",
  },
  targetUnit: { fontSize: 18, fontWeight: "500", color: "#666666" },
  targetHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  targetHintText: { fontSize: 14, fontWeight: "500", color: "#888888" },

  // Bottom bar
  bottomBar: { paddingHorizontal: 24, paddingBottom: 24 },
  nextButton: { borderRadius: 28, overflow: "hidden" },
  nextGradient: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600", letterSpacing: 0.5 },
});
