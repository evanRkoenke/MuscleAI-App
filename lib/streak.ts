/**
 * Muscle AI — Streak Tracking Module
 *
 * Calculates the user's current logging streak (consecutive days with at least
 * one logged meal) and determines which milestone badges they've earned.
 *
 * Milestones:
 *  - 7-day   "Week Warrior"
 *  - 30-day  "Monthly Machine"
 *  - 100-day "Century Club"
 */

export interface StreakBadge {
  /** Milestone day count */
  days: number;
  /** Badge display name */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Whether the user has earned this badge */
  earned: boolean;
}

export interface StreakInfo {
  /** Current consecutive-day streak ending today (or yesterday) */
  currentStreak: number;
  /** Longest streak ever */
  longestStreak: number;
  /** Milestone badges with earned status */
  badges: StreakBadge[];
}

const MILESTONES: { days: number; label: string; icon: string }[] = [
  { days: 7, label: "Week Warrior", icon: "🔥" },
  { days: 30, label: "Monthly Machine", icon: "💪" },
  { days: 100, label: "Century Club", icon: "🏆" },
];

/**
 * Given an array of date strings (YYYY-MM-DD) on which the user logged meals,
 * compute the current streak and longest streak.
 *
 * The current streak counts backward from today (or yesterday if today has no
 * meals yet). A day counts if it has at least one meal.
 */
export function calculateStreak(mealDates: string[]): StreakInfo {
  if (mealDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      badges: MILESTONES.map((m) => ({ ...m, earned: false })),
    };
  }

  // Deduplicate and sort ascending
  const uniqueDates = [...new Set(mealDates)].sort();

  // Convert to day numbers for easy consecutive check (UTC to avoid DST issues)
  const toDayNum = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, day) / 86400000);
  };

  const dayNums = uniqueDates.map(toDayNum);
  const now = new Date();
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const todayNum = toDayNum(todayStr);

  // Calculate longest streak
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i] === dayNums[i - 1] + 1) {
      runLength++;
      if (runLength > longestStreak) longestStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  // Calculate current streak (must include today or yesterday)
  const lastDay = dayNums[dayNums.length - 1];
  let currentStreak = 0;

  if (lastDay === todayNum || lastDay === todayNum - 1) {
    // Walk backward from the end of the sorted array
    currentStreak = 1;
    for (let i = dayNums.length - 2; i >= 0; i--) {
      if (dayNums[i] === dayNums[i + 1] - 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Determine earned badges based on longest streak
  const badges: StreakBadge[] = MILESTONES.map((m) => ({
    ...m,
    earned: longestStreak >= m.days,
  }));

  return { currentStreak, longestStreak, badges };
}

/**
 * Extract unique meal dates from an array of meal entries.
 */
export function getMealDates(meals: { date: string }[]): string[] {
  return meals.map((m) => m.date);
}
