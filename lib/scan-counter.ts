/**
 * Muscle AI — Scan Counter
 *
 * In the new two-plan model, all active subscribers (monthly, annual, trial)
 * get unlimited AI scans. Users with no plan ("none") are locked out entirely
 * and redirected to the paywall — they cannot scan at all.
 *
 * This module is kept for backward compatibility and tracking purposes.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SubscriptionTier } from "./subscription-features";
import { hasFullAccess } from "./subscription-features";

const SCAN_COUNTER_KEY = "@muscle_ai_scan_counter";

interface ScanCounterData {
  date: string;
  count: number;
  monthKey: string;
  monthCount: number;
}

export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

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
    if (!data.monthKey) {
      data.monthKey = getLocalMonthKey();
      data.monthCount = 0;
    }
    return data;
  } catch {
    return defaults;
  }
}

export async function getScanCount(): Promise<number> {
  const data = await loadCounterData();
  const today = getLocalDateString();
  if (data.date !== today) return 0;
  return data.count;
}

export async function getMonthlyScanCount(): Promise<number> {
  const data = await loadCounterData();
  const currentMonth = getLocalMonthKey();
  if (data.monthKey !== currentMonth) return 0;
  return data.monthCount;
}

export async function incrementScanCount(): Promise<number> {
  const today = getLocalDateString();
  const currentMonth = getLocalMonthKey();
  const data = await loadCounterData();
  const dailyCount = data.date === today ? data.count : 0;
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
    // Best-effort
  }
  return newData.count;
}

/**
 * Tier-aware scan limit check.
 * All active subscribers (trial, monthly, annual) get unlimited scans.
 * Users with "none" cannot scan — they must subscribe first.
 */
export async function checkScanLimitForTier(tier: SubscriptionTier): Promise<{
  canScan: boolean;
  remaining: number;
  used: number;
  limit: number;
  limitType: "unlimited" | "locked";
  badgeText: string;
}> {
  if (hasFullAccess(tier)) {
    return {
      canScan: true,
      remaining: Infinity,
      used: 0,
      limit: Infinity,
      limitType: "unlimited",
      badgeText: "Unlimited scans",
    };
  }

  // No active plan — locked out
  return {
    canScan: false,
    remaining: 0,
    used: 0,
    limit: 0,
    limitType: "locked",
    badgeText: "Subscribe to scan",
  };
}

/** Legacy compatibility wrapper */
export async function checkScanLimit(): Promise<{
  canScan: boolean;
  remaining: number;
  used: number;
  limit: number;
}> {
  const result = await checkScanLimitForTier("none");
  return {
    canScan: result.canScan,
    remaining: result.remaining,
    used: result.used,
    limit: result.limit,
  };
}

export async function resetScanCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SCAN_COUNTER_KEY);
  } catch {
    // Best-effort
  }
}

// Legacy exports for backward compatibility
export const FREE_DAILY_SCAN_LIMIT = 0;
export const ESSENTIAL_MONTHLY_SCAN_LIMIT = 0;
