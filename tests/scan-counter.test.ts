import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the scan counter logic.
 *
 * New two-plan model:
 *   - none:    No subscription — blocked from scanning
 *   - trial:   7-day free trial — unlimited scans
 *   - monthly: Monthly Essential ($9.99/mo) — unlimited scans
 *   - annual:  Elite Annual ($59.99/yr) — unlimited scans
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
  incrementScanCount,
  checkScanLimitForTier,
  resetScanCount,
  getLocalDateString,
} from "../lib/scan-counter";

describe("Scan Counter — Two-Plan Model", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  // ─── Date Helpers ───
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

  // ─── getScanCount (daily) ───
  describe("getScanCount (daily)", () => {
    it("should return 0 when no data stored", async () => {
      expect(await getScanCount()).toBe(0);
    });

    it("should return stored count for today", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 3,
      });
      expect(await getScanCount()).toBe(3);
    });

    it("should return 0 when stored date is yesterday (midnight reset)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: yStr, count: 5,
      });
      expect(await getScanCount()).toBe(0);
    });
  });

  // ─── incrementScanCount ───
  describe("incrementScanCount", () => {
    it("should increment from 0 to 1 on first scan", async () => {
      expect(await incrementScanCount()).toBe(1);
    });

    it("should increment sequentially", async () => {
      for (let i = 1; i <= 5; i++) {
        expect(await incrementScanCount()).toBe(i);
      }
    });
  });

  // ─── checkScanLimitForTier — none (no subscription) ───
  describe("checkScanLimitForTier — none (no subscription)", () => {
    it("should block scanning", async () => {
      const result = await checkScanLimitForTier("none");
      expect(result.canScan).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(0);
    });
  });

  // ─── checkScanLimitForTier — monthly ───
  describe("checkScanLimitForTier — monthly (unlimited)", () => {
    it("should always allow scanning", async () => {
      const result = await checkScanLimitForTier("monthly");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limitType).toBe("unlimited");
      expect(result.badgeText).toContain("Unlimited");
    });
  });

  // ─── checkScanLimitForTier — annual ───
  describe("checkScanLimitForTier — annual (unlimited)", () => {
    it("should always allow scanning", async () => {
      const result = await checkScanLimitForTier("annual");
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limitType).toBe("unlimited");
      expect(result.badgeText).toContain("Unlimited");
    });
  });

  // ─── resetScanCount ───
  describe("resetScanCount", () => {
    it("should clear the stored counter", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({
        date: today, count: 3,
      });
      await resetScanCount();
      expect(mockStorage["@muscle_ai_scan_counter"]).toBeUndefined();
    });

    it("should result in 0 counts after reset", async () => {
      await incrementScanCount();
      await resetScanCount();
      expect(await getScanCount()).toBe(0);
    });
  });
});
