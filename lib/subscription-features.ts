/**
 * Muscle AI — Subscription Feature Access
 *
 * Centralized module that defines which features each subscription tier unlocks.
 * All feature gating across the app should use these helpers instead of
 * hardcoding tier checks. This ensures consistent behavior and makes it
 * trivial to adjust access rules in one place.
 */

export type SubscriptionTier = "free" | "essential" | "pro" | "elite";

/**
 * Feature keys used throughout the app.
 */
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
 * Feature matrix: maps each tier to the set of features it unlocks.
 * Higher tiers inherit all features from lower tiers.
 */
const TIER_FEATURES: Record<SubscriptionTier, Set<Feature>> = {
  free: new Set([
    "meal_logging",
    "ai_scan",
  ]),
  essential: new Set([
    "meal_logging",
    "ai_scan",
    "basic_analytics",
    "edit_email",
    "manage_payment",
  ]),
  pro: new Set([
    "meal_logging",
    "ai_scan",
    "basic_analytics",
    "advanced_analytics",
    "unlimited_scans",
    "priority_support",
    "edit_email",
    "manage_payment",
  ]),
  elite: new Set([
    "meal_logging",
    "ai_scan",
    "basic_analytics",
    "advanced_analytics",
    "unlimited_scans",
    "priority_support",
    "forecast_12_month",
    "priority_sync",
    "gains_cards_pro",
    "edit_email",
    "manage_payment",
  ]),
};

/**
 * Check if a given subscription tier has access to a specific feature.
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_FEATURES[tier]?.has(feature) ?? false;
}

/**
 * Check if a subscription tier is a paid tier (not free).
 */
export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== "free";
}

/**
 * Get the display label for a subscription tier.
 */
export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "elite":
      return "Elite Annual";
    case "pro":
      return "Pro";
    case "essential":
      return "Essential";
    default:
      return "Free";
  }
}

/**
 * Get the tier color for UI display.
 */
export function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case "elite":
      return "#FFD700";
    case "pro":
      return "#C0C0C0";
    case "essential":
      return "#CD7F32";
    default:
      return "#666666";
  }
}

/**
 * Get the minimum tier required for a given feature.
 * Useful for showing "Upgrade to X" messages.
 */
export function getMinimumTierForFeature(feature: Feature): SubscriptionTier {
  const tiers: SubscriptionTier[] = ["free", "essential", "pro", "elite"];
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].has(feature)) {
      return tier;
    }
  }
  return "elite"; // Default to highest tier
}

/**
 * Tier hierarchy for comparison (higher number = higher tier).
 */
const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  essential: 1,
  pro: 2,
  elite: 3,
};

/**
 * Check if tier A is at least as high as tier B.
 */
export function isTierAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

/**
 * Welcome messages for each paid tier after successful purchase.
 */
export const WELCOME_MESSAGES: Record<Exclude<SubscriptionTier, "free">, { title: string; body: string }> = {
  elite: {
    title: "Welcome to the 1%!",
    body: "Your 12-Month Forecast and Priority Sync are now active — let's build that physique.",
  },
  pro: {
    title: "Welcome to Pro!",
    body: "Unlimited AI scans and advanced analytics are now yours. Time to level up your nutrition.",
  },
  essential: {
    title: "Welcome to Essential!",
    body: "You're all set with AI-powered meal scanning and analytics. Let's start tracking.",
  },
};
