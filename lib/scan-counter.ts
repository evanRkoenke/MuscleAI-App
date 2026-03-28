/**
 * Muscle AI — Tier-Based Scan Counter
 *
 * Tracks AI meal scans with tier-specific limits:
 *   - Free:      5 scans per day   (resets at midnight local time)
 *   - Essential: 50 scans per month (resets on the 1st of each month)
 *   - Pro:       Unlimited
 *   - Elite:     Unlimited
 *
 * Persistence: stored in AsyncStorage under SCAN_COUNTER_KEY.
 * Format: JSON { date: string, count: number, monthKey: string, monthCount: number }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SubscriptionTier } from "./subscription-features";

const SCAN_COUNTER_KEY = "@muscle_ai_scan_counter";

/** Maximum scans per day for free-plan users */
export const FREE_DAILY_SCAN_LIMIT = 5;

/** Maximum scans per month for essential-plan users */
export const ESSENTIAL_MONTHLY_SCAN_LIMIT = 50;

interface ScanCounterData {
  /** Local date string "YYYY-MM-DD" for daily tracking */
  date: string;
  /** Number of scans completed on that date (daily counter) */
  count: number;
  /** Month key "YYYY-MM" for monthly tracking */
  monthKey: string;
  /** Number of scans completed in that month (monthly counter) */
  monthCount: number;
}

/**
 * Get today's date as a "YYYY-MM-DD" string in the user's local timezone.
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the current month key as "YYYY-MM" in the user's local timezone.
 */
export function getLocalMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Load the raw counter data from AsyncStorage.
 */
async function loadCounterData(): Promise<ScanCounterData> {
  const defaults: ScanCounterData = {
    date: getLocalDateString(),
    count: 0,
    monthKey: getLocalMonthKey(),
    monthCount: 0,
  };

  try {
    const raw = await AsyncStorage.getItem(SCAN_COUNTER_KEY);
    if (!raw) return defaults;
    const data: ScanCounterData = JSON.parse(raw);
    // Ensure monthKey/monthCount exist (migration from old format)
    if (!data.monthKey) {
      data.monthKey = getLocalMonthKey();
      data.monthCount = 0;
    }
    return data;
  } catch {
    return defaults;
  }
}

/**
 * Load the current daily scan count.
 * If the stored date doesn't match today, the daily counter resets to 0.
 */
export async function getScanCount(): Promise<number> {
  const data = await loadCounterData();
  const today = getLocalDateString();
  if (data.date !== today) return 0;
  return data.count;
}

/**
 * Load the current monthly scan count.
 * If the stored month doesn't match this month, the monthly counter resets to 0.
 */
export async function getMonthlyScanCount(): Promise<number> {
  const data = await loadCounterData();
  const currentMonth = getLocalMonthKey();
  if (data.monthKey !== currentMonth) return 0;
  return data.monthCount;
}

/**
 * Increment both the daily and monthly scan counters and persist them.
 * Returns the new daily count after incrementing.
 */
export async function incrementScanCount(): Promise<number> {
  const today = getLocalDateString();
  const currentMonth = getLocalMonthKey();
  const data = await loadCounterData();

  // Daily counter: reset if different day
  const dailyCount = data.date === today ? data.count : 0;
  // Monthly counter: reset if different month
  const monthlyCount = data.monthKey === currentMonth ? data.monthCount : 0;

  const newData: ScanCounterData = {
    date: today,
    count: dailyCount + 1,
    monthKey: currentMonth,
    monthCount: monthlyCount + 1,
  };

  try {
    await AsyncStorage.setItem(SCAN_COUNTER_KEY, JSON.stringify(newData));
  } catch {
    // Best-effort persistence
  }

  return newData.count;
}

/**
 * Tier-aware scan limit check.
 *
 * - Free:      5/day, resets at midnight
 * - Essential: 50/month, resets on the 1st
 * - Pro/Elite: Unlimited (always canScan = true)
 */
export async function checkScanLimitForTier(tier: SubscriptionTier): Promise<{
  canScan: boolean;
  remaining: number;
  used: number;
  limit: number;
  /** "daily" | "monthly" | "unlimited" */
  limitType: "daily" | "monthly" | "unlimited";
  /** Human-readable label for the badge */
  badgeText: string;
}> {
  // Pro and Elite: unlimited
  if (tier === "pro" || tier === "elite") {
    return {
      canScan: true,
      remaining: Infinity,
      used: 0,
      limit: Infinity,
      limitType: "unlimited",
      badgeText: "Unlimited scans",
    };
  }

  // Essential: 50 scans per month
  if (tier === "essential") {
    const used = await getMonthlyScanCount();
    const remaining = Math.max(0, ESSENTIAL_MONTHLY_SCAN_LIMIT - used);
    return {
      canScan: used < ESSENTIAL_MONTHLY_SCAN_LIMIT,
      remaining,
      used,
      limit: ESSENTIAL_MONTHLY_SCAN_LIMIT,
      limitType: "monthly",
      badgeText: `${remaining} of ${ESSENTIAL_MONTHLY_SCAN_LIMIT} scans remaining this month`,
    };
  }

  // Free: 5 scans per day
  const used = await getScanCount();
  const remaining = Math.max(0, FREE_DAILY_SCAN_LIMIT - used);
  return {
    canScan: used < FREE_DAILY_SCAN_LIMIT,
    remaining,
    used,
    limit: FREE_DAILY_SCAN_LIMIT,
    limitType: "daily",
    badgeText: `${remaining} of ${FREE_DAILY_SCAN_LIMIT} free scans remaining today`,
  };
}

/**
 * Legacy function for backward compatibility.
 * Uses Free-tier daily limit check.
 */
export async function checkScanLimit(): Promise<{
  canScan: boolean;
  remaining: number;
  used: number;
  limit: number;
}> {
  const result = await checkScanLimitForTier("free");
  return {
    canScan: result.canScan,
    remaining: result.remaining,
    used: result.used,
    limit: result.limit,
  };
}

/**
 * Reset the scan counter (for testing or manual reset).
 */
export async function resetScanCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SCAN_COUNTER_KEY);
  } catch {
    // Best-effort
  }
}
