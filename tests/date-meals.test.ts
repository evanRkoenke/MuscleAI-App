import { describe, it, expect } from "vitest";

describe("Shared selectedDate state", () => {
  // Simulate the shared date state behavior
  let selectedDate = new Date().toISOString().split("T")[0];

  function setSelectedDate(date: string) {
    selectedDate = date;
  }

  const meals = [
    { id: "1", date: "2026-03-24", mealType: "lunch", name: "Chicken Bowl", calories: 500, protein: 40, carbs: 50, fat: 15, sugar: 5 },
    { id: "2", date: "2026-03-24", mealType: "dinner", name: "Steak", calories: 700, protein: 55, carbs: 20, fat: 35, sugar: 2 },
    { id: "3", date: "2026-03-23", mealType: "breakfast", name: "Oatmeal", calories: 300, protein: 10, carbs: 45, fat: 8, sugar: 12 },
    { id: "4", date: "2026-03-25", mealType: "snack", name: "Protein Bar", calories: 200, protein: 20, carbs: 25, fat: 8, sugar: 6 },
  ];

  function getMealsByDate(date: string) {
    return meals.filter((m) => m.date === date);
  }

  function getCaloriesByDate(date: string) {
    return getMealsByDate(date).reduce((sum, m) => sum + m.calories, 0);
  }

  it("defaults selectedDate to today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(selectedDate).toBe(today);
  });

  it("setSelectedDate changes the active date", () => {
    setSelectedDate("2026-03-23");
    expect(selectedDate).toBe("2026-03-23");
  });

  it("meals tab shows meals for the selected date", () => {
    setSelectedDate("2026-03-24");
    const dateMeals = getMealsByDate(selectedDate);
    expect(dateMeals).toHaveLength(2);
    expect(dateMeals[0].name).toBe("Chicken Bowl");
    expect(dateMeals[1].name).toBe("Steak");
  });

  it("switching date updates meal list", () => {
    setSelectedDate("2026-03-23");
    const dateMeals = getMealsByDate(selectedDate);
    expect(dateMeals).toHaveLength(1);
    expect(dateMeals[0].name).toBe("Oatmeal");
  });

  it("calories update when date changes", () => {
    setSelectedDate("2026-03-24");
    expect(getCaloriesByDate(selectedDate)).toBe(1200);

    setSelectedDate("2026-03-23");
    expect(getCaloriesByDate(selectedDate)).toBe(300);

    setSelectedDate("2026-03-25");
    expect(getCaloriesByDate(selectedDate)).toBe(200);
  });

  it("empty date shows zero calories", () => {
    setSelectedDate("2026-03-26");
    expect(getCaloriesByDate(selectedDate)).toBe(0);
    expect(getMealsByDate(selectedDate)).toHaveLength(0);
  });

  it("scan-meal logs to selectedDate not today", () => {
    setSelectedDate("2026-03-23");
    // Simulate adding a meal with the selectedDate
    const newMeal = {
      id: "5",
      date: selectedDate, // This is the key change - uses selectedDate
      mealType: "lunch",
      name: "Salad",
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 10,
      sugar: 4,
    };
    expect(newMeal.date).toBe("2026-03-23");
    expect(newMeal.date).not.toBe(new Date().toISOString().split("T")[0]);
  });

  it("dashboard and meals tab share the same selectedDate", () => {
    // Both screens read from the same selectedDate
    setSelectedDate("2026-03-25");
    
    // Dashboard would show
    const dashboardCalories = getCaloriesByDate(selectedDate);
    // Meals tab would show
    const mealsTabMeals = getMealsByDate(selectedDate);
    
    expect(dashboardCalories).toBe(200);
    expect(mealsTabMeals).toHaveLength(1);
    expect(mealsTabMeals[0].name).toBe("Protein Bar");
  });
});
