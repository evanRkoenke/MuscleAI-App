/**
 * Muscle AI — Daily Scan Counter
 *
 * Tracks the number of AI meal scans performed today.
 * Free-plan users are limited to FREE_DAILY_SCAN_LIMIT scans per day.
 * The counter resets automatically at midnight in the user's local time.
 *
 * Persistence: stored in AsyncStorage under SCAN_COUNTER_KEY.
 * Format: JSON { date: "YYYY-MM-DD", count: number }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const SCAN_COUNTER_KEY = "@muscle_ai_scan_counter";

/** Maximum scans per day for free-plan users */
export const FREE_DAILY_SCAN_LIMIT = 5;

interface ScanCounterData {
  /** Local date string "YYYY-MM-DD" */
  date: string;
  /** Number of scans completed on that date */
  count: number;
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
 * Load the current scan counter from AsyncStorage.
 * If the stored date doesn't match today, the counter resets to 0.
 */
export async function getScanCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SCAN_COUNTER_KEY);
    if (!raw) return 0;

    const data: ScanCounterData = JSON.parse(raw);
    const today = getLocalDateString();

    // Midnight reset: if stored date is not today, counter is 0
    if (data.date !== today) {
      return 0;
    }

    return data.count;
  } catch {
    return 0;
  }
}

/**
 * Increment the scan counter for today and persist it.
 * Returns the new count after incrementing.
 */
export async function incrementScanCount(): Promise<number> {
  const today = getLocalDateString();
  let currentCount = 0;

  try {
    const raw = await AsyncStorage.getItem(SCAN_COUNTER_KEY);
    if (raw) {
      const data: ScanCounterData = JSON.parse(raw);
      // Only carry forward the count if it's the same day
      if (data.date === today) {
        currentCount = data.count;
      }
    }
  } catch {
    // Start fresh on error
  }

  const newCount = currentCount + 1;
  const newData: ScanCounterData = { date: today, count: newCount };

  try {
    await AsyncStorage.setItem(SCAN_COUNTER_KEY, JSON.stringify(newData));
  } catch {
    // Best-effort persistence
  }

  return newCount;
}

/**
 * Check if the user has remaining scans today (for free-plan users).
 * Returns { canScan, remaining, used, limit }.
 */
export async function checkScanLimit(): Promise<{
  canScan: boolean;
  remaining: number;
  used: number;
  limit: number;
}> {
  const used = await getScanCount();
  const remaining = Math.max(0, FREE_DAILY_SCAN_LIMIT - used);
  return {
    canScan: used < FREE_DAILY_SCAN_LIMIT,
    remaining,
    used,
    limit: FREE_DAILY_SCAN_LIMIT,
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
