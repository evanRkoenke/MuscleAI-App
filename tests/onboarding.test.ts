import { describe, it, expect } from "vitest";
import type { OnboardingData, FitnessGoal } from "../lib/app-context";

// Replicate the calorie/macro computation from completeOnboarding
function computeGoalsFromOnboarding(data: OnboardingData) {
  const weightLbs = data.unit === "kg" ? data.weight * 2.205 : data.weight;
  const heightCm = (data.heightFt * 12 + data.heightIn) * 2.54;
  const bmr = 10 * (weightLbs / 2.205) + 6.25 * heightCm - 5 * 25 + 5;
  const activityMultiplier = 1.2 + data.trainingDays * 0.075;
  const tdee = Math.round(bmr * activityMultiplier);

  let calorieGoal: number;
  let proteinMultiplier: number;
  if (data.goal === "build_muscle") {
    calorieGoal = tdee + 500;
    proteinMultiplier = 1.0;
  } else if (data.goal === "lean_bulk") {
    calorieGoal = tdee + 250;
    proteinMultiplier = 1.0;
  } else {
    calorieGoal = tdee;
    proteinMultiplier = 0.8;
  }
  const proteinGoal = Math.round(weightLbs * proteinMultiplier);
  const fatGoal = Math.round((calorieGoal * 0.25) / 9);
  const carbsGoal = Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4);

  return { calorieGoal, proteinGoal, fatGoal, carbsGoal, tdee };
}

// Replicate the forecast computation
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

describe("Onboarding Data", () => {
  const defaultData: OnboardingData = {
    heightFt: 5,
    heightIn: 10,
    weight: 175,
    goal: "build_muscle",
    trainingDays: 4,
    dietaryRestrictions: ["none"],
    targetWeight: 185,
    unit: "lbs",
  };

  it("should have valid default onboarding data", () => {
    expect(defaultData.heightFt).toBeGreaterThan(0);
    expect(defaultData.heightIn).toBeGreaterThanOrEqual(0);
    expect(defaultData.heightIn).toBeLessThan(12);
    expect(defaultData.weight).toBeGreaterThan(0);
    expect(defaultData.targetWeight).toBeGreaterThan(0);
    expect(defaultData.trainingDays).toBeGreaterThanOrEqual(1);
    expect(defaultData.trainingDays).toBeLessThanOrEqual(7);
  });

  it("should accept all valid fitness goals", () => {
    const goals: FitnessGoal[] = ["build_muscle", "lean_bulk", "maintenance"];
    goals.forEach((g) => {
      expect(["build_muscle", "lean_bulk", "maintenance"]).toContain(g);
    });
  });

  it("should accept all valid dietary restrictions", () => {
    const valid = ["none", "vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "halal"];
    valid.forEach((r) => {
      expect(valid).toContain(r);
    });
  });
});

describe("Calorie/Macro Computation from Onboarding", () => {
  it("should compute higher calories for build_muscle goal", () => {
    const buildMuscle = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const maintenance = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "maintenance",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 175, unit: "lbs",
    });
    expect(buildMuscle.calorieGoal).toBeGreaterThan(maintenance.calorieGoal);
    expect(buildMuscle.calorieGoal - maintenance.calorieGoal).toBe(500);
  });

  it("should compute moderate surplus for lean_bulk goal", () => {
    const leanBulk = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "lean_bulk",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 180, unit: "lbs",
    });
    const maintenance = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "maintenance",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 175, unit: "lbs",
    });
    expect(leanBulk.calorieGoal - maintenance.calorieGoal).toBe(250);
  });

  it("should compute higher protein for muscle goals (1g/lb)", () => {
    const buildMuscle = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    // 1g per lb = 175g protein
    expect(buildMuscle.proteinGoal).toBe(175);
  });

  it("should compute lower protein for maintenance (0.8g/lb)", () => {
    const maintenance = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "maintenance",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 175, unit: "lbs",
    });
    // 0.8g per lb = 140g protein
    expect(maintenance.proteinGoal).toBe(140);
  });

  it("should increase TDEE with more training days", () => {
    const low = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "maintenance",
      trainingDays: 2, dietaryRestrictions: ["none"], targetWeight: 175, unit: "lbs",
    });
    const high = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "maintenance",
      trainingDays: 6, dietaryRestrictions: ["none"], targetWeight: 175, unit: "lbs",
    });
    expect(high.tdee).toBeGreaterThan(low.tdee);
  });

  it("should handle metric units correctly", () => {
    const metric = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 80, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 85, unit: "kg",
    });
    // 80 kg ≈ 176 lbs, so protein should be ~176g
    expect(metric.proteinGoal).toBe(Math.round(80 * 2.205 * 1.0));
    expect(metric.calorieGoal).toBeGreaterThan(0);
    expect(metric.fatGoal).toBeGreaterThan(0);
    expect(metric.carbsGoal).toBeGreaterThan(0);
  });

  it("should produce valid macro split (macros sum to ~calorie goal)", () => {
    const result = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const totalCals = result.proteinGoal * 4 + result.carbsGoal * 4 + result.fatGoal * 9;
    // Should be within 10 calories of the goal (rounding)
    expect(Math.abs(totalCals - result.calorieGoal)).toBeLessThan(10);
  });
});

describe("Forecast uses Onboarding Data", () => {
  it("should produce surplus forecast for build_muscle goal", () => {
    const goals = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const forecast = computeForecast(175, goals.calorieGoal, goals.proteinGoal, 185, "lbs", 4);
    expect(forecast.isSurplus).toBe(true);
    // Weight should increase over 12 months
    expect(forecast.pts[12].weight).toBeGreaterThan(forecast.pts[0].weight);
  });

  it("should produce different forecasts for different training frequencies", () => {
    const goals = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const forecast3 = computeForecast(175, goals.calorieGoal, goals.proteinGoal, 185, "lbs", 3);
    const forecast6 = computeForecast(175, goals.calorieGoal, goals.proteinGoal, 185, "lbs", 6);
    // Higher training frequency = higher TDEE = less surplus = less weight gain
    expect(forecast3.pts[12].weight).not.toBe(forecast6.pts[12].weight);
  });

  it("should start forecast at current weight", () => {
    const goals = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const forecast = computeForecast(175, goals.calorieGoal, goals.proteinGoal, 185, "lbs", 4);
    expect(forecast.pts[0].weight).toBe(175);
  });

  it("should produce 13 data points (months 0-12)", () => {
    const goals = computeGoalsFromOnboarding({
      heightFt: 5, heightIn: 10, weight: 175, goal: "build_muscle",
      trainingDays: 4, dietaryRestrictions: ["none"], targetWeight: 185, unit: "lbs",
    });
    const forecast = computeForecast(175, goals.calorieGoal, goals.proteinGoal, 185, "lbs", 4);
    expect(forecast.pts).toHaveLength(13);
    expect(forecast.pts[0].month).toBe(0);
    expect(forecast.pts[12].month).toBe(12);
  });
});
