import { describe, it, expect } from "vitest";

// ─── AI Coach Insight Logic Tests ───
describe("AI Coach Insight", () => {
  // Replicate the insight generation logic for testing
  function generateInsight(props: {
    anabolicScore: number;
    totalProtein: number;
    totalCalories: number;
    totalCarbs: number;
    totalFat: number;
    totalSugar: number;
    foods: Array<{ name: string; grams: number; calories: number; protein: number; carbs: number; fat: number; sugar: number; confidence: number }>;
  }): string {
    const { anabolicScore, totalProtein, totalCalories, totalCarbs, totalFat, totalSugar, foods } = props;
    const proteinRatio = totalCalories > 0 ? (totalProtein * 4) / totalCalories : 0;
    const proteinPercentage = Math.round(proteinRatio * 100);
    const parts: string[] = [];

    if (anabolicScore >= 85) parts.push("Outstanding meal for muscle growth.");
    else if (anabolicScore >= 70) parts.push("Solid anabolic meal with good protein density.");
    else if (anabolicScore >= 50) parts.push("Decent meal, but there's room to optimize for hypertrophy.");
    else parts.push("This meal is low on the anabolic scale.");

    if (totalProtein >= 40) {
      parts.push(`${totalProtein}g protein (${proteinPercentage}% of calories) provides strong leucine stimulus for muscle protein synthesis.`);
    } else if (totalProtein >= 25) {
      parts.push(`${totalProtein}g protein (${proteinPercentage}% of calories) meets the minimum threshold for MPS activation.`);
    } else {
      parts.push(`Only ${totalProtein}g protein (${proteinPercentage}% of calories) — below the 25g threshold for optimal muscle protein synthesis. Consider adding a protein source.`);
    }

    const highQualitySources = foods.filter(f => {
      const n = f.name.toLowerCase();
      return n.includes("chicken") || n.includes("beef") || n.includes("fish") || n.includes("salmon") ||
        n.includes("egg") || n.includes("turkey") || n.includes("whey") || n.includes("steak") ||
        n.includes("tuna") || n.includes("shrimp") || n.includes("greek yogurt");
    });

    if (highQualitySources.length > 0) {
      const names = highQualitySources.map(f => f.name).join(", ");
      parts.push(`${names} ${highQualitySources.length > 1 ? "are" : "is a"} high-quality complete protein source${highQualitySources.length > 1 ? "s" : ""} rich in leucine.`);
    }

    if (totalSugar > 20) {
      parts.push(`Watch the sugar (${totalSugar}g) — excess sugar can spike insulin and promote fat storage over muscle gain.`);
    }

    if (totalFat > 30 && proteinRatio < 0.3) {
      parts.push("High fat content relative to protein may slow digestion. For post-workout, lean protein sources are preferred.");
    }

    if (anabolicScore < 70) {
      if (totalProtein < 30) {
        parts.push("Tip: Add grilled chicken, eggs, or a protein shake to push this meal into the anabolic zone.");
      } else if (totalSugar > 15) {
        parts.push("Tip: Swap sugary sides for vegetables or complex carbs to improve the score.");
      } else {
        parts.push("Tip: Increase portion size of protein sources or add a side of Greek yogurt.");
      }
    }

    return parts.join(" ");
  }

  it("generates elite insight for high-score meal", () => {
    const insight = generateInsight({
      anabolicScore: 90,
      totalProtein: 50,
      totalCalories: 600,
      totalCarbs: 30,
      totalFat: 15,
      totalSugar: 5,
      foods: [
        { name: "Grilled Chicken Breast", grams: 200, calories: 330, protein: 40, carbs: 0, fat: 7, sugar: 0, confidence: 0.95 },
        { name: "Brown Rice", grams: 150, calories: 170, protein: 4, carbs: 30, fat: 2, sugar: 0, confidence: 0.9 },
      ],
    });
    expect(insight).toContain("Outstanding meal for muscle growth");
    expect(insight).toContain("strong leucine stimulus");
    expect(insight).toContain("Grilled Chicken Breast");
    expect(insight).not.toContain("Tip:");
  });

  it("generates low-score insight with actionable tip", () => {
    const insight = generateInsight({
      anabolicScore: 35,
      totalProtein: 12,
      totalCalories: 500,
      totalCarbs: 60,
      totalFat: 20,
      totalSugar: 25,
      foods: [
        { name: "French Fries", grams: 200, calories: 350, protein: 4, carbs: 45, fat: 17, sugar: 0, confidence: 0.9 },
        { name: "Soda", grams: 350, calories: 150, protein: 0, carbs: 40, fat: 0, sugar: 40, confidence: 0.95 },
      ],
    });
    expect(insight).toContain("low on the anabolic scale");
    expect(insight).toContain("below the 25g threshold");
    expect(insight).toContain("Watch the sugar");
    expect(insight).toContain("Tip:");
  });

  it("identifies high-quality protein sources", () => {
    const insight = generateInsight({
      anabolicScore: 80,
      totalProtein: 45,
      totalCalories: 550,
      totalCarbs: 20,
      totalFat: 18,
      totalSugar: 3,
      foods: [
        { name: "Salmon Fillet", grams: 200, calories: 400, protein: 40, carbs: 0, fat: 18, sugar: 0, confidence: 0.95 },
        { name: "Steamed Broccoli", grams: 100, calories: 55, protein: 4, carbs: 10, fat: 0, sugar: 2, confidence: 0.9 },
      ],
    });
    expect(insight).toContain("Salmon Fillet");
    expect(insight).toContain("high-quality complete protein source");
  });

  it("warns about high sugar content", () => {
    const insight = generateInsight({
      anabolicScore: 55,
      totalProtein: 30,
      totalCalories: 700,
      totalCarbs: 80,
      totalFat: 20,
      totalSugar: 35,
      foods: [{ name: "Pancakes with Syrup", grams: 300, calories: 700, protein: 15, carbs: 80, fat: 20, sugar: 35, confidence: 0.85 }],
    });
    expect(insight).toContain("Watch the sugar (35g)");
  });

  it("handles zero calories gracefully", () => {
    const insight = generateInsight({
      anabolicScore: 0,
      totalProtein: 0,
      totalCalories: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalSugar: 0,
      foods: [],
    });
    expect(insight).toContain("low on the anabolic scale");
    expect(insight).toContain("Only 0g protein");
  });
});

// ─── Fast Food Pro Data Tests ───
describe("Fast Food Pro", () => {
  interface MenuItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    tip: string;
  }

  function proteinScore(item: MenuItem): number {
    return item.calories > 0 ? Math.round((item.protein * 4 / item.calories) * 100) : 0;
  }

  const CULVERS_ITEMS: MenuItem[] = [
    { name: "ButterBurger (Single)", calories: 390, protein: 25, carbs: 38, fat: 17, tip: "" },
    { name: "ButterBurger (Double)", calories: 540, protein: 38, carbs: 38, fat: 28, tip: "" },
    { name: "Grilled Chicken Sandwich", calories: 420, protein: 36, carbs: 40, fat: 14, tip: "" },
  ];

  const CHICKFILA_ITEMS: MenuItem[] = [
    { name: "Grilled Nuggets (12ct)", calories: 200, protein: 38, carbs: 2, fat: 4, tip: "" },
    { name: "Grilled Chicken Sandwich", calories: 390, protein: 28, carbs: 44, fat: 12, tip: "" },
  ];

  it("calculates protein score correctly", () => {
    // Grilled Nuggets: 38g * 4 / 200 = 76%
    expect(proteinScore(CHICKFILA_ITEMS[0])).toBe(76);
    // ButterBurger Single: 25g * 4 / 390 = 25.6% → 26%
    expect(proteinScore(CULVERS_ITEMS[0])).toBe(26);
  });

  it("sorts items by protein density", () => {
    const sorted = [...CULVERS_ITEMS].sort((a, b) => proteinScore(b) - proteinScore(a));
    expect(sorted[0].name).toBe("Grilled Chicken Sandwich"); // 34%
    expect(sorted[1].name).toBe("ButterBurger (Double)"); // 28%
    expect(sorted[2].name).toBe("ButterBurger (Single)"); // 26%
  });

  it("handles zero calorie items", () => {
    expect(proteinScore({ name: "Water", calories: 0, protein: 0, carbs: 0, fat: 0, tip: "" })).toBe(0);
  });

  it("Chick-fil-A grilled nuggets have highest protein density", () => {
    const allItems = [...CULVERS_ITEMS, ...CHICKFILA_ITEMS];
    const sorted = [...allItems].sort((a, b) => proteinScore(b) - proteinScore(a));
    expect(sorted[0].name).toBe("Grilled Nuggets (12ct)");
    expect(proteinScore(sorted[0])).toBe(76);
  });
});

// ─── Widget Data Tests ───
describe("Widget Data", () => {
  it("default widget data has correct structure", () => {
    const defaultData = {
      proteinCurrent: 0,
      proteinGoal: 200,
      caloriesCurrent: 0,
      caloriesGoal: 2500,
      lastMealName: "",
      lastMealProtein: 0,
      streak: 0,
      updatedAt: new Date().toISOString(),
    };

    expect(defaultData.proteinCurrent).toBe(0);
    expect(defaultData.proteinGoal).toBe(200);
    expect(defaultData.caloriesGoal).toBe(2500);
    expect(defaultData.updatedAt).toBeTruthy();
  });

  it("calculates protein progress correctly", () => {
    const current = 120;
    const goal = 200;
    const progress = Math.min(1, goal > 0 ? current / goal : 0);
    expect(progress).toBe(0.6);
    expect(Math.max(0, goal - current)).toBe(80);
  });

  it("caps progress at 100%", () => {
    const current = 250;
    const goal = 200;
    const progress = Math.min(1, goal > 0 ? current / goal : 0);
    expect(progress).toBe(1);
  });
});

// ─── Score Grade Tests ───
describe("Score Grading", () => {
  function getScoreGrade(score: number): { grade: string; color: string } {
    if (score >= 85) return { grade: "ELITE", color: "#FFFFFF" };
    if (score >= 70) return { grade: "STRONG", color: "#C0C0C0" };
    if (score >= 50) return { grade: "MODERATE", color: "#B0B0B0" };
    return { grade: "LOW", color: "#FF4444" };
  }

  it("returns ELITE for scores >= 85", () => {
    expect(getScoreGrade(85).grade).toBe("ELITE");
    expect(getScoreGrade(100).grade).toBe("ELITE");
  });

  it("returns STRONG for scores 70-84", () => {
    expect(getScoreGrade(70).grade).toBe("STRONG");
    expect(getScoreGrade(84).grade).toBe("STRONG");
  });

  it("returns MODERATE for scores 50-69", () => {
    expect(getScoreGrade(50).grade).toBe("MODERATE");
    expect(getScoreGrade(69).grade).toBe("MODERATE");
  });

  it("returns LOW for scores < 50", () => {
    expect(getScoreGrade(49).grade).toBe("LOW");
    expect(getScoreGrade(0).grade).toBe("LOW");
  });
});
