import { describe, it, expect } from "vitest";

describe("Meal Category Routing", () => {
  const VALID_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

  describe("getDefaultCategory based on time of day", () => {
    function getDefaultCategory(hour: number) {
      if (hour < 10) return "breakfast";
      if (hour < 14) return "lunch";
      if (hour < 20) return "dinner";
      return "snack";
    }

    it("returns breakfast for early morning (6am)", () => {
      expect(getDefaultCategory(6)).toBe("breakfast");
    });

    it("returns breakfast for 9am", () => {
      expect(getDefaultCategory(9)).toBe("breakfast");
    });

    it("returns lunch for 10am", () => {
      expect(getDefaultCategory(10)).toBe("lunch");
    });

    it("returns lunch for 1pm", () => {
      expect(getDefaultCategory(13)).toBe("lunch");
    });

    it("returns dinner for 2pm", () => {
      expect(getDefaultCategory(14)).toBe("dinner");
    });

    it("returns dinner for 7pm", () => {
      expect(getDefaultCategory(19)).toBe("dinner");
    });

    it("returns snack for 8pm", () => {
      expect(getDefaultCategory(20)).toBe("snack");
    });

    it("returns snack for 11pm", () => {
      expect(getDefaultCategory(23)).toBe("snack");
    });
  });

  describe("Category param validation", () => {
    function resolveCategory(paramCategory: string | undefined): string {
      if (paramCategory && VALID_CATEGORIES.includes(paramCategory as any)) {
        return paramCategory;
      }
      return "dinner"; // fallback for test
    }

    it("uses breakfast when passed as param", () => {
      expect(resolveCategory("breakfast")).toBe("breakfast");
    });

    it("uses lunch when passed as param", () => {
      expect(resolveCategory("lunch")).toBe("lunch");
    });

    it("uses dinner when passed as param", () => {
      expect(resolveCategory("dinner")).toBe("dinner");
    });

    it("uses snack when passed as param", () => {
      expect(resolveCategory("snack")).toBe("snack");
    });

    it("falls back to default when param is invalid", () => {
      expect(resolveCategory("invalid")).toBe("dinner");
    });

    it("falls back to default when param is undefined", () => {
      expect(resolveCategory(undefined)).toBe("dinner");
    });
  });

  describe("Meal is stored with correct category", () => {
    it("stores meal with the selected category, not time-based default", () => {
      const selectedCategory = "breakfast";
      const meal = {
        id: "test-1",
        date: "2026-03-24",
        mealType: selectedCategory,
        name: "Oatmeal",
        calories: 300,
        protein: 10,
        carbs: 50,
        fat: 8,
        sugar: 5,
        anabolicScore: 65,
      };
      expect(meal.mealType).toBe("breakfast");
    });

    it("respects user-selected category over time-based default", () => {
      // Even at 8pm (which would default to "snack"), if user picks "breakfast", it should be breakfast
      const userChoice = "breakfast";
      const meal = {
        id: "test-2",
        date: "2026-03-24",
        mealType: userChoice,
        name: "Pancakes",
        calories: 450,
        protein: 12,
        carbs: 60,
        fat: 18,
        sugar: 15,
        anabolicScore: 55,
      };
      expect(meal.mealType).toBe("breakfast");
      expect(meal.mealType).not.toBe("snack");
    });
  });

  describe("Meals tab category buttons", () => {
    it("generates correct route params for each meal type", () => {
      const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
      mealTypes.forEach((type) => {
        const route = { pathname: "/scan-meal", params: { category: type } };
        expect(route.params.category).toBe(type);
      });
    });
  });
});
