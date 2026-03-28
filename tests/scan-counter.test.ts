import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the tier-based scan counter logic.
 *
 * Scan limits per tier:
 *   - Free:      5 per day   (resets at midnight)
 *   - Essential: 50 per month (resets on the 1st)
 *   - Pro/Elite: Unlimited
 */

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete mockStorage[key];
    }),
  },
}));

import {
  getScanCount,
  getMonthlyScanCount,
  incrementScanCount,
  checkScanLimit,
  checkScanLimitForTier,
  resetScanCount,
  getLocalDateString,
  getLocalMonthKey,
  FREE_DAILY_SCAN_LIMIT,
  ESSENTIAL_MONTHLY_SCAN_LIMIT,
} from "../lib/scan-counter";

describe("Scan Counter — Tier-Based Limit Logic", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  // ─── Constants ───
  describe("Constants", () => {
    it("FREE_DAILY_SCAN_LIMIT should be 5", () => {
      expect(FREE_DAILY_SCAN_LIMIT).toBe(5);
    });

    it("ESSENTIAL_MONTHLY_SCAN_LIMIT should be 50", () => {
      expect(ESSENTIAL_MONTHLY_SCAN_LIMIT).toBe(50);
    });
  });

  // ─── Date/Month Helpers ───
  describe("getLocalDateString", () => {
    it("should return a YYYY-MM-DD formatted string", () => {
      const dateStr = getLocalDateString();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return today's date", () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      expect(getLocalDateString()).toBe(expected);
    });
  });

  describe("getLocalMonthKey", () => {
    it("should return a YYYY-MM formatted string", () => {
      const monthKey = getLocalMonthKey();
      expect(monthKey).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should return this month's key", () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      expect(getLocalMonthKey()).toBe(expected);
    });
  });

  // ─── getScanCount (daily) ───
  describe("getScanCount (daily)", () => {
    it("should return 0 when no data stored", async () => {
      expect(await getScanCount()).toBe(0);
    });

    it("should return stored count for today", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 3, monthKey: getLocalMonthKey(), monthCount: 3,
      });
      expect(await getScanCount()).toBe(3);
    });

    it("should return 0 when stored date is yesterday (midnight reset)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: yStr, count: 5, monthKey: getLocalMonthKey(), monthCount: 10,
      });
      expect(await getScanCount()).toBe(0);
    });
  });

  // ─── getMonthlyScanCount ───
  describe("getMonthlyScanCount", () => {
    it("should return 0 when no data stored", async () => {
      expect(await getMonthlyScanCount()).toBe(0);
    });

    it("should return stored monthly count for this month", async () => {
      const today = getLocalDateString();
      const month = getLocalMonthKey();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 2, monthKey: month, monthCount: 15,
      });
      expect(await getMonthlyScanCount()).toBe(15);
    });

    it("should return 0 when stored month is different (monthly reset)", async () => {
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: "2020-01-15", count: 3, monthKey: "2020-01", monthCount: 45,
      });
      expect(await getMonthlyScanCount()).toBe(0);
    });
  });

  // ─── incrementScanCount ───
  describe("incrementScanCount", () => {
    it("should increment from 0 to 1 on first scan", async () => {
      expect(await incrementScanCount()).toBe(1);
    });

    it("should increment both daily and monthly counters", async () => {
      await incrementScanCount();
      const stored = JSON.parse(mockStorage["@muscle_ai_scan_counter"]);
      expect(stored.count).toBe(1);
      expect(stored.monthCount).toBe(1);
    });

    it("should increment sequentially", async () => {
      for (let i = 1; i <= 5; i++) {
        expect(await incrementScanCount()).toBe(i);
      }
      const stored = JSON.parse(mockStorage["@muscle_ai_scan_counter"]);
      expect(stored.count).toBe(5);
      expect(stored.monthCount).toBe(5);
    });

    it("should reset daily but keep monthly when crossing midnight", async () => {
      const month = getLocalMonthKey();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      // Same month, different day
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: yStr, count: 5, monthKey: month, monthCount: 20,
      });
      const newCount = await incrementScanCount();
      expect(newCount).toBe(1); // Daily reset
      const stored = JSON.parse(mockStorage["@muscle_ai_scan_counter"]);
      expect(stored.monthCount).toBe(21); // Monthly continues
    });
  });

  // ─── checkScanLimitForTier — Free ───
  describe("checkScanLimitForTier — Free (5/day)", () => {
    it("should allow scanning when no scans used", async () => {
      const result = await checkScanLimitForTier("free");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.used).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.limitType).toBe("daily");
      expect(result.badgeText).toContain("5");
      expect(result.badgeText).toContain("today");
    });

    it("should show correct remaining after 3 scans", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 3, monthKey: getLocalMonthKey(), monthCount: 3,
      });
      const result = await checkScanLimitForTier("free");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.used).toBe(3);
    });

    it("should block scanning at 5 scans", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 5, monthKey: getLocalMonthKey(), monthCount: 5,
      });
      const result = await checkScanLimitForTier("free");
      expect(result.canScan).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after midnight", async () => {
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: "2020-01-01", count: 5, monthKey: "2020-01", monthCount: 50,
      });
      const result = await checkScanLimitForTier("free");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  // ─── checkScanLimitForTier — Essential ───
  describe("checkScanLimitForTier — Essential (50/month)", () => {
    it("should allow scanning when no scans used", async () => {
      const result = await checkScanLimitForTier("essential");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.used).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.limitType).toBe("monthly");
      expect(result.badgeText).toContain("50");
      expect(result.badgeText).toContain("month");
    });

    it("should show correct remaining after 30 scans this month", async () => {
      const today = getLocalDateString();
      const month = getLocalMonthKey();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 2, monthKey: month, monthCount: 30,
      });
      const result = await checkScanLimitForTier("essential");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(20);
      expect(result.used).toBe(30);
    });

    it("should block scanning at 50 monthly scans", async () => {
      const today = getLocalDateString();
      const month = getLocalMonthKey();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 2, monthKey: month, monthCount: 50,
      });
      const result = await checkScanLimitForTier("essential");
      expect(result.canScan).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset on new month", async () => {
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: "2020-01-31", count: 5, monthKey: "2020-01", monthCount: 50,
      });
      const result = await checkScanLimitForTier("essential");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.used).toBe(0);
    });

    it("should NOT be blocked by daily limit (can do more than 5/day)", async () => {
      const today = getLocalDateString();
      const month = getLocalMonthKey();
      // 10 scans today, 10 this month — Essential checks monthly, not daily
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 10, monthKey: month, monthCount: 10,
      });
      const result = await checkScanLimitForTier("essential");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(40);
    });
  });

  // ─── checkScanLimitForTier — Pro ───
  describe("checkScanLimitForTier — Pro (unlimited)", () => {
    it("should always allow scanning", async () => {
      const result = await checkScanLimitForTier("pro");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limitType).toBe("unlimited");
      expect(result.badgeText).toContain("Unlimited");
    });
  });

  // ─── checkScanLimitForTier — Elite ───
  describe("checkScanLimitForTier — Elite (unlimited)", () => {
    it("should always allow scanning", async () => {
      const result = await checkScanLimitForTier("elite");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limitType).toBe("unlimited");
      expect(result.badgeText).toContain("Unlimited");
    });
  });

  // ─── Legacy checkScanLimit ───
  describe("checkScanLimit (legacy, free-tier)", () => {
    it("should work as free-tier daily check", async () => {
      const result = await checkScanLimit();
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(5);
    });
  });

  // ─── resetScanCount ───
  describe("resetScanCount", () => {
    it("should clear the stored counter", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 3, monthKey: getLocalMonthKey(), monthCount: 10,
      });
      await resetScanCount();
      expect(mockStorage["@muscle_ai_scan_counter"]).toBeUndefined();
    });

    it("should result in 0 counts after reset", async () => {
      await incrementScanCount();
      await resetScanCount();
      expect(await getScanCount()).toBe(0);
      expect(await getMonthlyScanCount()).toBe(0);
    });
  });

  // ─── Integration: Full Cycle ───
  describe("Full Day Cycle — Free Tier", () => {
    it("should track 5 scans then block the 6th", async () => {
      for (let i = 1; i <= 5; i++) {
        const limit = await checkScanLimitForTier("free");
        expect(limit.canScan).toBe(true);
        await incrementScanCount();
      }
      const limit = await checkScanLimitForTier("free");
      expect(limit.canScan).toBe(false);
      expect(limit.remaining).toBe(0);
    });
  });

  describe("Full Month Cycle — Essential Tier", () => {
    it("should allow up to 50 scans then block", async () => {
      const today = getLocalDateString();
      const month = getLocalMonthKey();
      // Simulate 49 scans already done
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 5, monthKey: month, monthCount: 49,
      });
      const limit49 = await checkScanLimitForTier("essential");
      expect(limit49.canScan).toBe(true);
      expect(limit49.remaining).toBe(1);

      // Do the 50th scan
      await incrementScanCount();
      const limit50 = await checkScanLimitForTier("essential");
      expect(limit50.canScan).toBe(false);
      expect(limit50.remaining).toBe(0);
    });
  });
});
