/**
 * Muscle AI — useSubscription Hook
 *
 * Two-plan model (no trial, immediate charge):
 *   - monthly ($9.99/mo) — full access
 *   - annual ($59.99/yr) — full access
 *   - none = no plan = locked out
 */

import { useMemo } from "react";
import { useApp } from "@/lib/app-context";
import {
  hasFullAccess,
  isPaidTier,
  getTierLabel,
  getTierColor,
  hasFeatureAccess,
  type Feature,
  type SubscriptionTier,
} from "@/lib/subscription-features";

export function useSubscription() {
  const { subscription } = useApp();

  return useMemo(() => ({
    /** Current subscription tier */
    tier: subscription,

    /** Whether the user has full access (monthly or annual) */
    hasAccess: hasFullAccess(subscription),

    /** Whether the user is on a paid plan */
    isPaid: isPaidTier(subscription),

    /** Display label for the current tier */
    label: getTierLabel(subscription),

    /** Brand color for the current tier */
    color: getTierColor(subscription),

    /** Check if a specific feature is accessible */
    can: (feature: Feature) => hasFeatureAccess(subscription, feature),

    /** All features are unlocked for any active subscription */
    canAccessForecast: hasFullAccess(subscription),
    canAccessPrioritySync: hasFullAccess(subscription),
    canAccessAdvancedAnalytics: hasFullAccess(subscription),
    canAccessUnlimitedScans: hasFullAccess(subscription),
    canAccessGainsCardsPro: hasFullAccess(subscription),
    canEditEmail: hasFullAccess(subscription),
    canManagePayment: hasFullAccess(subscription),
  }), [subscription]);
}
