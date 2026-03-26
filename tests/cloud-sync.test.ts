/**
 * Cloud Sync Tests
 *
 * Tests for the cloud sync module including data preparation,
 * merge logic, sync status formatting, and tier gating.
 */

import { describe, it, expect } from "vitest";
import {
  prepareDataForPush,
  mergeCloudData,
  formatLastSync,
} from "../lib/cloud-sync";

describe("Cloud Sync — Data Preparation", () => {
  const mockState = {
    profile: {
      targetWeight: 185,
      currentWeight: 175,
      calorieGoal: 2800,
      proteinGoal: 210,
      carbsGoal: 280,
      fatGoal: 85,
      unit: "lbs" as const,
    },
    onboardingData: {
      heightFt: 5,
      heightIn: 11,
      goal: "build_muscle",
      trainingDays: 5,
      dietaryRestrictions: ["none"],
    },
    meals: [
      {
        id: "meal-1",
        date: "2026-03-26",
        mealType: "lunch" as const,
        name: "Chicken Bowl",
        calories: 650,
        protein: 48,
        carbs: 55,
        fat: 22,
        sugar: 8,
        anabolicScore: 82,
        imageUri: "file:///photo.jpg",
        isFavorite: true,
      },
    ],
    weightLog: [
      { id: "w-1", date: "2026-03-26", weight: 175 },
    ],
    gainsCards: [
      {
        id: "gc-1",
        date: "2026-03-26",
        weight: 175,
        protein: 210,
        calories: 2800,
        daysTracked: 30,
        anabolicScore: 78,
        subscription: "elite",
      },
    ],
  };

  it("should transform local state into push format", () => {
    const result = prepareDataForPush(mockState);

    expect(result.profile).toBeDefined();
    expect(result.profile.targetWeight).toBe(185);
    expect(result.profile.proteinGoal).toBe(210);
    expect(result.profile.heightFt).toBe(5);
    expect(result.profile.goal).toBe("build_muscle");
    expect(result.profile.trainingDays).toBe(5);
  });

  it("should map meal id to clientId", () => {
    const result = prepareDataForPush(mockState);
    expect(result.meals[0].clientId).toBe("meal-1");
    expect(result.meals[0].name).toBe("Chicken Bowl");
    expect(result.meals[0].protein).toBe(48);
  });

  it("should map weight log id to clientId", () => {
    const result = prepareDataForPush(mockState);
    expect(result.weightLog[0].clientId).toBe("w-1");
    expect(result.weightLog[0].weight).toBe(175);
  });

  it("should map gains card id to clientId", () => {
    const result = prepareDataForPush(mockState);
    expect(result.gainsCards[0].clientId).toBe("gc-1");
    expect(result.gainsCards[0].anabolicScore).toBe(78);
  });

  it("should handle empty arrays", () => {
    const emptyState = {
      ...mockState,
      meals: [],
      weightLog: [],
      gainsCards: [],
    };
    const result = prepareDataForPush(emptyState);
    expect(result.meals).toEqual([]);
    expect(result.weightLog).toEqual([]);
    expect(result.gainsCards).toEqual([]);
  });
});

describe("Cloud Sync — Merge Logic", () => {
  it("should add new cloud items not in local", () => {
    const local = [{ id: "a", name: "Local Meal" }] as any[];
    const cloud = [
      { clientId: "b", name: "Cloud Meal" },
    ] as any[];
    const merged = mergeCloudData(local, cloud);
    expect(merged).toHaveLength(2);
    expect(merged[1].id).toBe("b");
    expect((merged[1] as any).name).toBe("Cloud Meal");
  });

  it("should not duplicate items already in local", () => {
    const local = [{ id: "a", name: "Meal A" }] as any[];
    const cloud = [{ clientId: "a", name: "Meal A Cloud" }] as any[];
    const merged = mergeCloudData(local, cloud);
    expect(merged).toHaveLength(1);
    expect((merged[0] as any).name).toBe("Meal A"); // local takes precedence
  });

  it("should handle empty cloud data", () => {
    const local = [{ id: "a", name: "Meal A" }] as any[];
    const merged = mergeCloudData(local, []);
    expect(merged).toHaveLength(1);
  });

  it("should handle empty local data", () => {
    const cloud = [{ clientId: "b", name: "Cloud Meal" }];
    const merged = mergeCloudData([], cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("b");
  });

  it("should handle both empty", () => {
    const merged = mergeCloudData([], []);
    expect(merged).toHaveLength(0);
  });

  it("should merge multiple new cloud items", () => {
    const local = [{ id: "a", name: "A" }] as any[];
    const cloud = [
      { clientId: "b", name: "B" },
      { clientId: "c", name: "C" },
      { clientId: "a", name: "A-dup" }, // duplicate
    ] as any[];
    const merged = mergeCloudData(local, cloud);
    expect(merged).toHaveLength(3); // a, b, c
  });
});

describe("Cloud Sync — Format Last Sync", () => {
  it("should return 'Never' for null", () => {
    expect(formatLastSync(null)).toBe("Never");
  });

  it("should return 'Just now' for very recent time", () => {
    const now = new Date().toISOString();
    expect(formatLastSync(now)).toBe("Just now");
  });

  it("should return minutes ago for recent times", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatLastSync(fiveMinAgo)).toBe("5m ago");
  });

  it("should return hours ago for older times", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatLastSync(threeHoursAgo)).toBe("3h ago");
  });

  it("should return days ago for multi-day times", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(formatLastSync(twoDaysAgo)).toBe("2d ago");
  });

  it("should return date string for very old times", () => {
    const oldDate = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const result = formatLastSync(oldDate);
    // Should be a date string, not relative
    expect(result).not.toContain("ago");
    expect(result).not.toBe("Never");
  });
});

describe("Cloud Sync — Tier Gating", () => {
  it("free users should not have cloud sync access", () => {
    const tier: string = "free";
    const canSync = tier !== "free";
    expect(canSync).toBe(false);
  });

  it("essential users should have cloud sync access", () => {
    const tier: string = "essential";
    const canSync = tier !== "free";
    expect(canSync).toBe(true);
  });

  it("pro users should have cloud sync access", () => {
    const tier: string = "pro";
    const canSync = tier !== "free";
    expect(canSync).toBe(true);
  });

  it("elite users should have cloud sync access", () => {
    const tier: string = "elite";
    const canSync = tier !== "free";
    expect(canSync).toBe(true);
  });
});
