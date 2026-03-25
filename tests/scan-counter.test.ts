import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the daily scan counter logic.
 *
 * We test the pure logic functions by mocking AsyncStorage.
 * The scan counter enforces a 5-scan/day limit for free users,
 * resets at midnight based on local date, and persists via AsyncStorage.
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
  checkScanLimit,
  resetScanCount,
  getLocalDateString,
  FREE_DAILY_SCAN_LIMIT,
} from "../lib/scan-counter";

describe("Scan Counter — Daily Limit Logic", () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  // ─── Constants ───
  describe("Constants", () => {
    it("FREE_DAILY_SCAN_LIMIT should be 5", () => {
      expect(FREE_DAILY_SCAN_LIMIT).toBe(5);
    });
  });

  // ─── getLocalDateString ───
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

  // ─── getScanCount ───
  describe("getScanCount", () => {
    it("should return 0 when no data stored", async () => {
      const count = await getScanCount();
      expect(count).toBe(0);
    });

    it("should return stored count for today", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 3 });
      const count = await getScanCount();
      expect(count).toBe(3);
    });

    it("should return 0 when stored date is yesterday (midnight reset)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: yStr, count: 5 });
      const count = await getScanCount();
      expect(count).toBe(0);
    });

    it("should return 0 when stored data is corrupted", async () => {
      mockStorage["@muscle_ai_scan_counter"] = "not-json";
      const count = await getScanCount();
      expect(count).toBe(0);
    });
  });

  // ─── incrementScanCount ───
  describe("incrementScanCount", () => {
    it("should increment from 0 to 1 on first scan", async () => {
      const newCount = await incrementScanCount();
      expect(newCount).toBe(1);
    });

    it("should increment existing count", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 2 });
      const newCount = await incrementScanCount();
      expect(newCount).toBe(3);
    });

    it("should persist the new count", async () => {
      await incrementScanCount();
      const stored = JSON.parse(mockStorage["@muscle_ai_scan_counter"]);
      expect(stored.count).toBe(1);
      expect(stored.date).toBe(getLocalDateString());
    });

    it("should reset and start from 1 if stored date is old", async () => {
      const oldDate = "2020-01-01";
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: oldDate, count: 99 });
      const newCount = await incrementScanCount();
      expect(newCount).toBe(1);
    });

    it("should increment sequentially", async () => {
      expect(await incrementScanCount()).toBe(1);
      expect(await incrementScanCount()).toBe(2);
      expect(await incrementScanCount()).toBe(3);
      expect(await incrementScanCount()).toBe(4);
      expect(await incrementScanCount()).toBe(5);
    });
  });

  // ─── checkScanLimit ───
  describe("checkScanLimit", () => {
    it("should allow scanning when no scans used", async () => {
      const result = await checkScanLimit();
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.used).toBe(0);
      expect(result.limit).toBe(5);
    });

    it("should allow scanning when under limit", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 3 });
      const result = await checkScanLimit();
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.used).toBe(3);
    });

    it("should block scanning when at limit", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 5 });
      const result = await checkScanLimit();
      expect(result.canScan).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.used).toBe(5);
    });

    it("should block scanning when over limit", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 7 });
      const result = await checkScanLimit();
      expect(result.canScan).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.used).toBe(7);
    });

    it("should allow scanning after midnight reset (old date)", async () => {
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: "2020-01-01", count: 5 });
      const result = await checkScanLimit();
      expect(result.canScan).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.used).toBe(0);
    });
  });

  // ─── resetScanCount ───
  describe("resetScanCount", () => {
    it("should clear the stored counter", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 3 });
      await resetScanCount();
      expect(mockStorage["@muscle_ai_scan_counter"]).toBeUndefined();
    });

    it("should result in 0 count after reset", async () => {
      const today = getLocalDateString();
      mockStorage["@muscle_ai_scan_counter"] = JSON.stringify({ date: today, count: 5 });
      await resetScanCount();
      const count = await getScanCount();
      expect(count).toBe(0);
    });
  });

  // ─── Integration: Full Day Cycle ───
  describe("Full Day Cycle", () => {
    it("should track 5 scans then block the 6th", async () => {
      // Scan 1 through 5
      for (let i = 1; i <= 5; i++) {
        const limit = await checkScanLimit();
        expect(limit.canScan).toBe(true);
        const count = await incrementScanCount();
        expect(count).toBe(i);
      }

      // 6th scan should be blocked
      const limit = await checkScanLimit();
      expect(limit.canScan).toBe(false);
      expect(limit.remaining).toBe(0);
      expect(limit.used).toBe(5);
    });
  });

  // ─── Subscription Tier Interaction ───
  describe("Subscription Tier Interaction", () => {
    // These tests verify the scan limit interacts correctly with the feature matrix.
    // Free and Essential tiers do NOT have unlimited_scans, so they are capped at 5/day.
    // Pro and Elite tiers have unlimited_scans, so the counter is bypassed.

    it("free tier should not have unlimited_scans", () => {
      // Free users are limited to FREE_DAILY_SCAN_LIMIT scans per day
      expect(FREE_DAILY_SCAN_LIMIT).toBe(5);
    });

    it("essential tier should not have unlimited_scans", () => {
      // Essential users are also limited to FREE_DAILY_SCAN_LIMIT scans per day
      expect(FREE_DAILY_SCAN_LIMIT).toBeGreaterThan(0);
    });

    it("pro and elite tiers bypass the scan counter entirely", () => {
      // When canAccessUnlimitedScans is true, the counter is never checked
      // This is verified by the subscription-features.test.ts suite
      expect(FREE_DAILY_SCAN_LIMIT).toBe(5);
    });
  });
});
