import { describe, it, expect } from "vitest";

// Test the week date generation logic (same as in week-strip.tsx)
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekDates(refDate: Date) {
  const today = refDate;
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days: { date: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
  const todayStr = today.toISOString().split("T")[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

describe("WeekStrip date logic", () => {
  it("generates exactly 7 days", () => {
    const days = getWeekDates(new Date("2026-03-24T12:00:00"));
    expect(days).toHaveLength(7);
  });

  it("starts on Monday and ends on Sunday", () => {
    const days = getWeekDates(new Date("2026-03-24T12:00:00"));
    expect(days[0].dayName).toBe("MON");
    expect(days[6].dayName).toBe("SUN");
  });

  it("marks today correctly", () => {
    const ref = new Date("2026-03-24T12:00:00");
    const days = getWeekDates(ref);
    const todayEntry = days.find((d) => d.isToday);
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.date).toBe("2026-03-24");
    expect(todayEntry!.dayName).toBe("TUE");
    expect(todayEntry!.dayNum).toBe(24);
  });

  it("only one day is marked as today", () => {
    const days = getWeekDates(new Date("2026-03-24T12:00:00"));
    const todayCount = days.filter((d) => d.isToday).length;
    expect(todayCount).toBe(1);
  });

  it("handles Sunday as reference date (week should start on previous Monday)", () => {
    const days = getWeekDates(new Date("2026-03-29T12:00:00"));
    expect(days[0].dayName).toBe("MON");
    expect(days[0].date).toBe("2026-03-23");
    expect(days[6].dayName).toBe("SUN");
    expect(days[6].date).toBe("2026-03-29");
  });

  it("handles Monday as reference date", () => {
    const days = getWeekDates(new Date("2026-03-23T12:00:00"));
    expect(days[0].dayName).toBe("MON");
    expect(days[0].date).toBe("2026-03-23");
  });

  it("all dates are sequential", () => {
    const days = getWeekDates(new Date("2026-03-24T12:00:00"));
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1].date + "T12:00:00");
      const curr = new Date(days[i].date + "T12:00:00");
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBe(1);
    }
  });
});

describe("Date-based data querying", () => {
  // Simulate the getMealsByDate / getCaloriesByDate / getMacrosByDate logic
  const meals = [
    { id: "1", date: "2026-03-24", calories: 500, protein: 30, carbs: 50, fat: 20, sugar: 5 },
    { id: "2", date: "2026-03-24", calories: 700, protein: 45, carbs: 60, fat: 25, sugar: 8 },
    { id: "3", date: "2026-03-23", calories: 400, protein: 20, carbs: 40, fat: 15, sugar: 3 },
    { id: "4", date: "2026-03-25", calories: 600, protein: 35, carbs: 55, fat: 22, sugar: 6 },
  ];

  function getMealsByDate(date: string) {
    return meals.filter((m) => m.date === date);
  }

  function getCaloriesByDate(date: string) {
    return getMealsByDate(date).reduce((sum, m) => sum + m.calories, 0);
  }

  function getMacrosByDate(date: string) {
    const dateMeals = getMealsByDate(date);
    return {
      protein: dateMeals.reduce((sum, m) => sum + m.protein, 0),
      carbs: dateMeals.reduce((sum, m) => sum + m.carbs, 0),
      fat: dateMeals.reduce((sum, m) => sum + m.fat, 0),
      sugar: dateMeals.reduce((sum, m) => sum + (m.sugar ?? 0), 0),
    };
  }

  it("returns correct meals for a specific date", () => {
    const result = getMealsByDate("2026-03-24");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
  });

  it("returns empty array for date with no meals", () => {
    const result = getMealsByDate("2026-03-26");
    expect(result).toHaveLength(0);
  });

  it("calculates correct calories for a date", () => {
    expect(getCaloriesByDate("2026-03-24")).toBe(1200);
    expect(getCaloriesByDate("2026-03-23")).toBe(400);
    expect(getCaloriesByDate("2026-03-26")).toBe(0);
  });

  it("calculates correct macros for a date", () => {
    const macros = getMacrosByDate("2026-03-24");
    expect(macros.protein).toBe(75);
    expect(macros.carbs).toBe(110);
    expect(macros.fat).toBe(45);
    expect(macros.sugar).toBe(13);
  });

  it("returns zero macros for date with no meals", () => {
    const macros = getMacrosByDate("2026-03-26");
    expect(macros.protein).toBe(0);
    expect(macros.carbs).toBe(0);
    expect(macros.fat).toBe(0);
    expect(macros.sugar).toBe(0);
  });

  it("calories remaining calculation works correctly", () => {
    const calorieGoal = 2500;
    const cal = getCaloriesByDate("2026-03-24");
    const remaining = Math.max(0, calorieGoal - cal);
    expect(remaining).toBe(1300);
  });

  it("calories remaining does not go negative", () => {
    const calorieGoal = 500; // Less than actual calories
    const cal = getCaloriesByDate("2026-03-24");
    const remaining = Math.max(0, calorieGoal - cal);
    expect(remaining).toBe(0);
  });
});
