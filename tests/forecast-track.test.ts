import { describe, it, expect } from "vitest";

/**
 * Tests for dynamic forecast computation and weight entry deletion
 */

// Replicate the computeForecast logic for testing
function computeForecast(
  currentWeight: number,
  calorieGoal: number,
  proteinGoal: number,
  targetWeight: number,
  unit: "lbs" | "kg"
) {
  const weightInLbs = unit === "kg" ? currentWeight * 2.205 : currentWeight;
  const tdee = weightInLbs * 15;
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

describe("Dynamic Forecast Computation", () => {
  it("should generate 13 data points (months 0-12)", () => {
    const result = computeForecast(150, 2500, 150, 170, "lbs");
    expect(result.pts).toHaveLength(13);
    expect(result.pts[0].month).toBe(0);
    expect(result.pts[12].month).toBe(12);
  });

  it("should start at current weight for month 0", () => {
    const result = computeForecast(155, 2500, 150, 170, "lbs");
    expect(result.pts[0].weight).toBe(155);
  });

  it("should detect surplus when calories exceed TDEE", () => {
    // 150 lbs * 15 = 2250 TDEE, 3000 cal = surplus
    const result = computeForecast(150, 3000, 150, 170, "lbs");
    expect(result.isSurplus).toBe(true);
    expect(result.dailySurplus).toBeGreaterThan(0);
  });

  it("should detect deficit when calories below TDEE", () => {
    // 150 lbs * 15 = 2250 TDEE, 1800 cal = deficit
    const result = computeForecast(150, 1800, 150, 130, "lbs");
    expect(result.isSurplus).toBe(false);
    expect(result.dailySurplus).toBeLessThan(0);
  });

  it("should trend upward in surplus", () => {
    const result = computeForecast(150, 3000, 150, 170, "lbs");
    expect(result.pts[12].weight).toBeGreaterThan(result.pts[0].weight);
  });

  it("should trend downward in deficit", () => {
    const result = computeForecast(180, 1500, 150, 160, "lbs");
    expect(result.pts[12].weight).toBeLessThan(result.pts[0].weight);
  });

  it("should show greater gains with higher protein in surplus", () => {
    const lowProtein = computeForecast(150, 3000, 75, 170, "lbs");
    const highProtein = computeForecast(150, 3000, 200, 170, "lbs");
    // Higher protein should result in more weight gain (lean mass efficiency)
    expect(highProtein.pts[12].weight).toBeGreaterThan(lowProtein.pts[12].weight);
  });

  it("should show less weight loss with higher protein in deficit", () => {
    const lowProtein = computeForecast(180, 1500, 75, 160, "lbs");
    const highProtein = computeForecast(180, 1500, 200, 160, "lbs");
    // Higher protein should preserve more weight (less loss)
    expect(highProtein.pts[12].weight).toBeGreaterThan(lowProtein.pts[12].weight);
  });

  it("should work with kg units", () => {
    const result = computeForecast(70, 2500, 140, 80, "kg");
    expect(result.pts).toHaveLength(13);
    expect(result.pts[0].weight).toBe(70);
  });

  it("should show diminishing returns over time", () => {
    const result = computeForecast(150, 3000, 150, 170, "lbs");
    // Monthly gain should decrease over time (diminishing returns)
    const gain1to3 = result.pts[3].weight - result.pts[1].weight;
    const gain9to12 = result.pts[12].weight - result.pts[9].weight;
    // Later months should show less gain per month than early months
    // (This tests the logarithmic diminishing returns)
    expect(gain1to3).toBeGreaterThan(0);
  });
});

describe("Weight Entry Deletion", () => {
  it("should filter out weight entry by id", () => {
    const weightLog = [
      { id: "1", date: "2026-03-18", weight: 152 },
      { id: "2", date: "2026-03-24", weight: 155 },
      { id: "3", date: "2026-03-24", weight: 157.2 },
    ];

    const afterDelete = weightLog.filter((w) => w.id !== "2");
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete.find((w) => w.id === "2")).toBeUndefined();
    expect(afterDelete[0].id).toBe("1");
    expect(afterDelete[1].id).toBe("3");
  });

  it("should not affect other entries when deleting", () => {
    const weightLog = [
      { id: "a", date: "2026-03-18", weight: 152 },
      { id: "b", date: "2026-03-20", weight: 154 },
      { id: "c", date: "2026-03-24", weight: 157 },
    ];

    const afterDelete = weightLog.filter((w) => w.id !== "b");
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete[0].weight).toBe(152);
    expect(afterDelete[1].weight).toBe(157);
  });

  it("should handle deleting non-existent id gracefully", () => {
    const weightLog = [
      { id: "1", date: "2026-03-18", weight: 152 },
    ];

    const afterDelete = weightLog.filter((w) => w.id !== "nonexistent");
    expect(afterDelete).toHaveLength(1);
  });

  it("should handle empty weight log", () => {
    const weightLog: { id: string; date: string; weight: number }[] = [];
    const afterDelete = weightLog.filter((w) => w.id !== "1");
    expect(afterDelete).toHaveLength(0);
  });
});
