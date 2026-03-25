/**
 * Muscle AI — useSubscription Hook
 *
 * Provides convenient subscription state and feature-access checks
 * derived from the global AppContext. All feature gating in the UI
 * should use this hook instead of raw subscription string comparisons.
 */

import { useMemo } from "react";
import { useApp } from "@/lib/app-context";
import {
  hasFeatureAccess,
  isPaidTier,
  getTierLabel,
  getTierColor,
  type Feature,
  type SubscriptionTier,
} from "@/lib/subscription-features";

export function useSubscription() {
  const { subscription } = useApp();

  return useMemo(() => ({
    /** Current subscription tier */
    tier: subscription,

    /** Whether the user is on any paid plan */
    isPaid: isPaidTier(subscription),

    /** Display label for the current tier */
    label: getTierLabel(subscription),

    /** Brand color for the current tier */
    color: getTierColor(subscription),

    /** Check if a specific feature is accessible */
    can: (feature: Feature) => hasFeatureAccess(subscription, feature),

    /** Shorthand checks for commonly gated features */
    canAccessForecast: hasFeatureAccess(subscription, "forecast_12_month"),
    canAccessPrioritySync: hasFeatureAccess(subscription, "priority_sync"),
    canAccessAdvancedAnalytics: hasFeatureAccess(subscription, "advanced_analytics"),
    canAccessUnlimitedScans: hasFeatureAccess(subscription, "unlimited_scans"),
    canAccessGainsCardsPro: hasFeatureAccess(subscription, "gains_cards_pro"),
    canEditEmail: hasFeatureAccess(subscription, "edit_email"),
    canManagePayment: hasFeatureAccess(subscription, "manage_payment"),
  }), [subscription]);
}
