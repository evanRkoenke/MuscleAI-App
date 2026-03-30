import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateStreak, getMealDates } from "../lib/streak";

// Helper to make today's date string (UTC to avoid DST issues)
function todayStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Helper to make a date string N days ago (UTC to avoid DST issues)
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

describe("Streak Tracking", () => {
  describe("calculateStreak", () => {
    it("returns 0 streak and no earned badges for empty meals", () => {
      const result = calculateStreak([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.badges.every((b) => !b.earned)).toBe(true);
    });

    it("returns 1-day streak when only today has meals", () => {
      const result = calculateStreak([todayStr()]);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("counts consecutive days ending today", () => {
      const dates = [daysAgo(2), daysAgo(1), todayStr()];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("counts streak ending yesterday (user hasn't logged today yet)", () => {
      const dates = [daysAgo(3), daysAgo(2), daysAgo(1)];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("breaks streak if gap of 2+ days from today", () => {
      // Meals 5, 4, 3 days ago — gap of 2 days to today
      const dates = [daysAgo(5), daysAgo(4), daysAgo(3)];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(3);
    });

    it("deduplicates multiple meals on the same day", () => {
      const today = todayStr();
      const dates = [today, today, today, daysAgo(1), daysAgo(1)];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it("finds longest streak even if current streak is shorter", () => {
      // Old streak of 5 days, then gap, then current streak of 2
      const dates = [
        daysAgo(10), daysAgo(9), daysAgo(8), daysAgo(7), daysAgo(6),
        // gap at daysAgo(5), daysAgo(4), daysAgo(3)
        daysAgo(1), todayStr(),
      ];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });

    it("earns 7-day badge at 7 consecutive days", () => {
      const dates = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(7);
      expect(result.badges[0].earned).toBe(true); // 7-day
      expect(result.badges[0].label).toBe("Week Warrior");
      expect(result.badges[1].earned).toBe(false); // 30-day
      expect(result.badges[2].earned).toBe(false); // 100-day
    });

    it("earns 30-day badge at 30 consecutive days", () => {
      const dates = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(30);
      expect(result.badges[0].earned).toBe(true); // 7-day
      expect(result.badges[1].earned).toBe(true); // 30-day
      expect(result.badges[1].label).toBe("Monthly Machine");
      expect(result.badges[2].earned).toBe(false); // 100-day
    });

    it("earns 100-day badge at 100 consecutive days", () => {
      const dates = Array.from({ length: 100 }, (_, i) => daysAgo(99 - i));
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(100);
      expect(result.badges[0].earned).toBe(true);
      expect(result.badges[1].earned).toBe(true);
      expect(result.badges[2].earned).toBe(true);
      expect(result.badges[2].label).toBe("Century Club");
    });

    it("badges are based on longest streak, not current", () => {
      // Old streak of 8 days (earns 7-day badge), current streak of 2
      const dates = [
        ...Array.from({ length: 8 }, (_, i) => daysAgo(20 - i)),
        daysAgo(1), todayStr(),
      ];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(8);
      expect(result.badges[0].earned).toBe(true); // 7-day earned from old streak
    });
  });

  describe("getMealDates", () => {
    it("extracts date strings from meal entries", () => {
      const meals = [
        { date: "2025-01-01" },
        { date: "2025-01-02" },
        { date: "2025-01-01" },
      ];
      const dates = getMealDates(meals);
      expect(dates).toEqual(["2025-01-01", "2025-01-02", "2025-01-01"]);
    });

    it("returns empty array for no meals", () => {
      expect(getMealDates([])).toEqual([]);
    });
  });
});
