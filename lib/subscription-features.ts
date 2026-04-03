/**
 * Muscle AI — Subscription Feature Access
 *
 * Two-plan model (no trial, immediate charge):
 *   - "monthly"  → Monthly Essential ($9.99/mo) — full access
 *   - "annual"   → Elite Annual ($59.99/yr) — full access (same features)
 *   - "none"     → No plan selected (locked out)
 *
 * Both paid plans grant identical full access to all features.
 * There is no free tier or trial — users must pay to access the app.
 */

export type SubscriptionTier = "none" | "monthly" | "annual";

/**
 * Check if a subscription tier has full access (any paid plan).
 */
export function hasFullAccess(tier: SubscriptionTier): boolean {
  return tier === "monthly" || tier === "annual";
}

/**
 * Check if a subscription tier is a paid plan.
 */
export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === "monthly" || tier === "annual";
}

/**
 * Get the display label for a subscription tier.
 */
export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "annual":
      return "Elite Annual";
    case "monthly":
      return "Monthly Essential";
    default:
      return "No Plan";
  }
}

/**
 * Get the tier color for UI display.
 */
export function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case "annual":
      return "#FFFFFF";
    case "monthly":
      return "#C0C0C0";
    default:
      return "#444444";
  }
}

/**
 * Welcome messages after successful subscription.
 */
export const WELCOME_MESSAGES: Record<"monthly" | "annual", { title: string; body: string }> = {
  annual: {
    title: "Welcome to Muscle AI!",
    body: "Your Elite Annual plan is active. Full access to all AI scanning, analytics, forecasts, and cloud sync. Let's build that physique!",
  },
  monthly: {
    title: "Welcome to Muscle AI!",
    body: "Your Monthly Essential plan is active. Full access to all AI scanning, analytics, forecasts, and cloud sync. Let's get started!",
  },
};

// ─── Legacy compatibility helpers ───

export type Feature =
  | "ai_scan"
  | "meal_logging"
  | "basic_analytics"
  | "advanced_analytics"
  | "forecast_12_month"
  | "priority_sync"
  | "gains_cards_pro"
  | "unlimited_scans"
  | "priority_support"
  | "edit_email"
  | "manage_payment";

/**
 * All features are available to any paid subscriber.
 */
export function hasFeatureAccess(tier: SubscriptionTier, _feature: Feature): boolean {
  return hasFullAccess(tier);
}

/**
 * Tier hierarchy for comparison.
 */
export function isTierAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  const rank: Record<SubscriptionTier, number> = { none: 0, monthly: 1, annual: 2 };
  return rank[current] >= rank[required];
}

/**
 * Get the minimum tier for any feature — always "monthly" since all features require a paid plan.
 */
export function getMinimumTierForFeature(_feature: Feature): SubscriptionTier {
  return "monthly";
}
