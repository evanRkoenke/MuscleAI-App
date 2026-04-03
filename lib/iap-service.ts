/**
 * Muscle AI — In-App Purchase Service
 *
 * Two-plan model with Stripe checkout (immediate charge, no trial):
 *   - Monthly Essential: $9.99/mo
 *   - Elite Annual: $59.99/yr (Best Value - Save 50%)
 *
 * Both plans give identical full access to all features.
 * Stripe Payment Links are used for checkout on all platforms.
 */

import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { SubscriptionTier } from "./subscription-features";

// ─── Product IDs (for App Store Connect / Google Play Console) ───
export const IAP_PRODUCTS = {
  MONTHLY_ESSENTIAL: "com.muscleai.monthly.essential",
  ELITE_ANNUAL: "com.muscleai.elite.annual",
} as const;

export const ALL_PRODUCT_IDS = [
  IAP_PRODUCTS.MONTHLY_ESSENTIAL,
  IAP_PRODUCTS.ELITE_ANNUAL,
];

// ─── Stripe Payment Links ───
export const STRIPE_LINKS: Record<string, string> = {
  [IAP_PRODUCTS.MONTHLY_ESSENTIAL]:
    "https://buy.stripe.com/dRmdR2fEBddR1oT5IybEA07",
  [IAP_PRODUCTS.ELITE_ANNUAL]:
    "https://buy.stripe.com/14A9AMdwta1F9Vpdb0bEA08",
};

// ─── Tier mapping ───
export { type SubscriptionTier } from "./subscription-features";

export function productIdToTier(productId: string): SubscriptionTier {
  switch (productId) {
    case IAP_PRODUCTS.MONTHLY_ESSENTIAL:
      return "monthly";
    case IAP_PRODUCTS.ELITE_ANNUAL:
      return "annual";
    default:
      return "none";
  }
}

export function tierToProductId(tier: SubscriptionTier): string | null {
  switch (tier) {
    case "monthly":
      return IAP_PRODUCTS.MONTHLY_ESSENTIAL;
    case "annual":
      return IAP_PRODUCTS.ELITE_ANNUAL;
    default:
      return null;
  }
}

// ─── Plan metadata (used by paywall UI) ───
export interface PlanInfo {
  id: string;
  productId: string;
  name: string;
  price: string;
  period: string;
  savings?: string;
  features: string[];
  highlighted: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: "annual",
    productId: IAP_PRODUCTS.ELITE_ANNUAL,
    name: "ELITE ANNUAL",
    price: "$59.99",
    period: "/year",
    savings: "BEST VALUE — SAVE 50%",
    features: [
      "Unlimited AI Meal Scans",
      "Advanced Analytics & Insights",
      "12-Month Muscle Forecast",
      "Cloud Sync Across Devices",
      "Gains Cards Pro Templates",
      "Priority Support",
    ],
    highlighted: true,
  },
  {
    id: "monthly",
    productId: IAP_PRODUCTS.MONTHLY_ESSENTIAL,
    name: "MONTHLY ESSENTIAL",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited AI Meal Scans",
      "Advanced Analytics & Insights",
      "12-Month Muscle Forecast",
      "Cloud Sync Across Devices",
      "Gains Cards Pro Templates",
      "Priority Support",
    ],
    highlighted: false,
  },
];

// ─── Purchase via Stripe (opens in browser) ───
export async function purchaseViaStripe(productId: string): Promise<void> {
  const url = STRIPE_LINKS[productId];
  if (url) {
    await WebBrowser.openBrowserAsync(url);
  }
}

// ─── Check if native IAP is available ───
export function isNativeIAPAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}
